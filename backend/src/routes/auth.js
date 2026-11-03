import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_community_connect_2026_sr_university';

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'volunteer', phone, bio, skills, interests } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    // Check duplicate email
    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email address is already registered.' });
    }

    // Role lookup
    const roleRow = await queryOne('SELECT id FROM roles WHERE name = ?', [role.toLowerCase()]);
    const roleId = roleRow ? roleRow.id : 3; // default volunteer

    const hashedPassword = await bcrypt.hash(password, 10);
    // All new public registrations are placed into 'pending' status awaiting Admin approval
    const result = await query(`
      INSERT INTO users (role_id, name, email, password, phone, avatar_url, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `, [
      roleId,
      name.trim(),
      email.toLowerCase().trim(),
      hashedPassword,
      phone || null,
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    ]);

    const newUserId = result.insertId;

    // Create volunteer profile if volunteer
    if (role === 'volunteer') {
      await query(`
        INSERT INTO volunteer_profiles (user_id, bio, skills, interests)
        VALUES (?, ?, ?, ?)
      `, [newUserId, bio || '', skills || '', interests || '']);
    }

    // Activity log
    await query(`
      INSERT INTO activity_logs (user_id, action, details)
      VALUES (?, 'USER_REGISTERED', ?)
    `, [newUserId, `Registered as ${role} (pending admin approval)`]);

    // Send notification to all Administrators
    const admins = await query('SELECT id FROM users WHERE role_id = 1');
    for (const admin of admins) {
      await query(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, 'New Account Approval Required', ?, 'alert')
      `, [admin.id, `${name.trim()} has registered as ${role} and is awaiting administrative approval.`]);
    }

    return res.status(201).json({
      success: true,
      pendingApproval: true,
      message: 'Registration submitted! Your account is pending administrator approval before you can sign in.',
      user: {
        id: newUserId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
        status: 'pending',
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role: expectedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const user = await queryOne(`
      SELECT u.id, u.name, u.email, u.password, u.phone, u.avatar_url, u.status, u.role_id, r.name as role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE LOWER(u.email) = ?
    `, [email.toLowerCase().trim()]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found. No active user is registered with this email address.'
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please check your credentials and try again.'
      });
    }

    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Account Pending Approval: Your account registration is awaiting review by an Administrator. Please wait for an Admin to approve your account before signing in.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account Inactive: This account is currently suspended or inactive. Please contact an Administrator.'
      });
    }

    // Role-based authorization check: prevent logging in under an incompatible role portal
    if (expectedRole && user.role.toLowerCase() !== expectedRole.toLowerCase()) {
      const roleLabels = {
        admin: 'Administrator',
        organizer: 'Event Organizer',
        coordinator: 'Field Coordinator',
        volunteer: 'Volunteer'
      };
      const actualLabel = roleLabels[user.role.toLowerCase()] || user.role;
      const expectedLabel = roleLabels[expectedRole.toLowerCase()] || expectedRole;

      return res.status(403).json({
        success: false,
        message: `Access Denied: This account is registered as ${actualLabel}, not ${expectedLabel}. Please select ${actualLabel} to sign in.`
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Activity log
    await query(`
      INSERT INTO activity_logs (user_id, action, details)
      VALUES (?, 'USER_LOGIN', 'User logged into dashboard')
    `, [user.id]);

    const { password: _, ...userSafe } = user;

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userSafe
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.', error: err.message });
  }
});

// Current User Profile (Me)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const profile = await queryOne(`
      SELECT vp.* FROM volunteer_profiles vp WHERE vp.user_id = ?
    `, [req.user.id]);

    return res.json({
      success: true,
      user: {
        ...req.user,
        profile: profile || null
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Update Profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { name, phone, avatar_url, bio, skills, interests, emergency_contact } = req.body;

    if (name) {
      await query('UPDATE users SET name = ?, phone = ?, avatar_url = ? WHERE id = ?', [
        name,
        phone || req.user.phone,
        avatar_url || req.user.avatar_url,
        req.user.id
      ]);
    }

    // Upsert volunteer profile
    const existingProfile = await queryOne('SELECT id FROM volunteer_profiles WHERE user_id = ?', [req.user.id]);
    if (existingProfile) {
      await query(`
        UPDATE volunteer_profiles
        SET bio = COALESCE(?, bio),
            skills = COALESCE(?, skills),
            interests = COALESCE(?, interests),
            emergency_contact = COALESCE(?, emergency_contact)
        WHERE user_id = ?
      `, [bio, skills, interests, emergency_contact, req.user.id]);
    } else {
      await query(`
        INSERT INTO volunteer_profiles (user_id, bio, skills, interests, emergency_contact)
        VALUES (?, ?, ?, ?, ?)
      `, [req.user.id, bio || '', skills || '', interests || '', emergency_contact || '']);
    }

    const updated = await queryOne(`
      SELECT u.id, u.name, u.email, u.phone, u.avatar_url, u.role_id, r.name as role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [req.user.id]);

    const updatedProfile = await queryOne('SELECT * FROM volunteer_profiles WHERE user_id = ?', [req.user.id]);

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: { ...updated, profile: updatedProfile }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
