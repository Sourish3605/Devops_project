import { Router } from 'express';
import { query, queryOne } from '../config/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// GET attendance for an event
router.get('/event/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get all approved volunteers for this event along with any attendance record
    const records = await query(`
      SELECT 
        u.id as volunteer_id,
        u.name as volunteer_name,
        u.email as volunteer_email,
        u.phone as volunteer_phone,
        u.avatar_url,
        ed.name as assigned_duty_name,
        a.id as attendance_id,
        a.status as attendance_status,
        a.check_in_time,
        a.check_out_time,
        a.hours_served,
        a.notes,
        marker.name as marked_by_name
      FROM volunteer_registrations vr
      JOIN users u ON vr.volunteer_id = u.id
      LEFT JOIN volunteer_allocations va ON (va.event_id = vr.event_id AND va.volunteer_id = vr.volunteer_id)
      LEFT JOIN event_duties ed ON va.duty_id = ed.id
      LEFT JOIN attendance a ON (a.event_id = vr.event_id AND a.volunteer_id = vr.volunteer_id)
      LEFT JOIN users marker ON a.marked_by = marker.id
      WHERE vr.event_id = ? AND vr.status = 'approved'
      ORDER BY u.name ASC
    `, [eventId]);

    return res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Mark / Update Attendance (Coordinator, Organizer, Admin)
router.post('/mark', authenticateToken, authorizeRoles('admin', 'organizer', 'coordinator'), async (req, res) => {
  try {
    const { event_id, volunteer_id, status, check_in_time, check_out_time, hours_served, notes } = req.body;

    if (!event_id || !volunteer_id || !status) {
      return res.status(400).json({ success: false, message: 'Event ID, Volunteer ID, and Status are required.' });
    }

    if (!['present', 'absent', 'late'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be present, absent, or late.' });
    }

    // Default calculated hours if present and not specified
    let computedHours = parseFloat(hours_served) || (status === 'absent' ? 0 : 5.0);

    const existing = await queryOne(
      'SELECT id FROM attendance WHERE event_id = ? AND volunteer_id = ?',
      [event_id, volunteer_id]
    );

    let attId;
    if (existing) {
      await query(`
        UPDATE attendance
        SET status = ?, check_in_time = ?, check_out_time = ?, hours_served = ?, marked_by = ?, notes = ?
        WHERE id = ?
      `, [
        status,
        check_in_time || '09:00 AM',
        check_out_time || '03:00 PM',
        computedHours,
        req.user.id,
        notes || '',
        existing.id
      ]);
      attId = existing.id;
    } else {
      const result = await query(`
        INSERT INTO attendance (event_id, volunteer_id, status, check_in_time, check_out_time, hours_served, marked_by, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        event_id,
        volunteer_id,
        status,
        check_in_time || '09:00 AM',
        check_out_time || '03:00 PM',
        computedHours,
        req.user.id,
        notes || ''
      ]);
      attId = result.insertId;
    }

    // Update volunteer total hours in profile
    const hoursSumRow = await queryOne(`
      SELECT SUM(hours_served) as total_hours FROM attendance WHERE volunteer_id = ? AND status IN ('present', 'late')
    `, [volunteer_id]);

    const totalHours = hoursSumRow && hoursSumRow.total_hours ? hoursSumRow.total_hours : 0;
    await query('UPDATE volunteer_profiles SET total_hours = ? WHERE user_id = ?', [totalHours, volunteer_id]);

    // Send notification
    await query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `, [
      volunteer_id,
      `Attendance Logged: ${status.toUpperCase()}`,
      `Your attendance was marked as ${status.toUpperCase()} (${computedHours} hrs credited).`,
      status === 'present' ? 'success' : 'info'
    ]);

    return res.json({
      success: true,
      message: `Attendance marked as ${status} (${computedHours} hrs).`,
      attendanceId: attId
    });
  } catch (err) {
    console.error('Attendance error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET personal attendance history for volunteer
router.get('/my-history', authenticateToken, async (req, res) => {
  try {
    const history = await query(`
      SELECT 
        a.*,
        e.title as event_title,
        e.start_date,
        e.venue,
        c.certificate_number
      FROM attendance a
      JOIN events e ON a.event_id = e.id
      LEFT JOIN certificates c ON (c.event_id = a.event_id AND c.volunteer_id = a.volunteer_id)
      WHERE a.volunteer_id = ?
      ORDER BY e.start_date DESC
    `, [req.user.id]);

    return res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
