import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../config/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// GET all users (Admin only)
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { role, status, search } = req.query;

    let sql = `
      SELECT u.id, u.name, u.email, u.phone, u.avatar_url, u.status, u.role_id, r.name as role, u.created_at,
             vp.total_hours, vp.skills
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN volunteer_profiles vp ON u.id = vp.user_id
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      sql += ' AND r.name = ?';
      params.push(role);
    }
    if (status) {
      sql += ' AND u.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY u.created_at DESC';

    const users = await query(sql, params);
    return res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET users by role (e.g. all coordinators or volunteers for dropdowns)
router.get('/by-role/:roleName', authenticateToken, async (req, res) => {
  try {
    const { roleName } = req.params;
    const users = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.avatar_url, r.name as role, vp.skills
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN volunteer_profiles vp ON u.id = vp.user_id
      WHERE r.name = ? AND u.status = 'active'
      ORDER BY u.name ASC
    `, [roleName]);

    return res.json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Update user status or role (Admin only)
router.patch('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, role_id } = req.body;

    await query(`
      UPDATE users
      SET status = COALESCE(?, status),
          role_id = COALESCE(?, role_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, role_id, id]);

    return res.json({ success: true, message: 'User updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own admin account.' });
    }

    await query('DELETE FROM users WHERE id = ?', [id]);
    return res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
