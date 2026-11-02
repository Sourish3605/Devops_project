import jwt from 'jsonwebtoken';
import { queryOne } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_community_connect_2026_sr_university';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Fetch fresh user details with role
    const user = await queryOne(`
      SELECT u.id, u.name, u.email, u.phone, u.avatar_url, u.status, u.role_id, r.name as role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [decoded.id]);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found or has been removed.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is inactive. Contact the administrator.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired session token.' });
  }
}

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles
 */
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' does not have permission for this resource. Required: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
}
