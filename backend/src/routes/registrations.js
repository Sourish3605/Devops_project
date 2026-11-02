import { Router } from 'express';
import { query, queryOne } from '../config/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// GET all registrations (Admin / Organizer / Coordinator)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { event_id, status } = req.query;

    let sql = `
      SELECT 
        vr.*,
        u.name as volunteer_name,
        u.email as volunteer_email,
        u.avatar_url as volunteer_avatar,
        e.title as event_title,
        e.start_date,
        e.end_date,
        e.venue,
        ed.name as preferred_duty_name,
        va.duty_id as assigned_duty_id,
        assigned_duty.name as assigned_duty_name
      FROM volunteer_registrations vr
      JOIN users u ON vr.volunteer_id = u.id
      JOIN events e ON vr.event_id = e.id
      LEFT JOIN event_duties ed ON vr.preferred_duty_id = ed.id
      LEFT JOIN volunteer_allocations va ON (va.event_id = vr.event_id AND va.volunteer_id = vr.volunteer_id)
      LEFT JOIN event_duties assigned_duty ON va.duty_id = assigned_duty.id
      WHERE 1=1
    `;
    const params = [];

    // Volunteers can only view their own registrations
    if (req.user.role === 'volunteer') {
      sql += ' AND vr.volunteer_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'organizer') {
      // Organizers only see registrations for their events
      sql += ' AND e.organizer_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'coordinator') {
      // Coordinators see their assigned events
      sql += ' AND (e.coordinator_id = ? OR e.coordinator_id IS NULL)';
      params.push(req.user.id);
    }

    if (event_id) {
      sql += ' AND vr.event_id = ?';
      params.push(event_id);
    }

    if (status) {
      sql += ' AND vr.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY vr.registered_at DESC';

    const registrations = await query(sql, params);
    return res.json({ success: true, count: registrations.length, data: registrations });
  } catch (err) {
    console.error('Error fetching registrations:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Volunteer Register for an Event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { event_id, preferred_duty_id, availability_note, contact_phone } = req.body;
    const volunteer_id = req.user.id;

    if (!event_id) {
      return res.status(400).json({ success: false, message: 'Event ID is required.' });
    }

    // 1. Check if event exists and is in open status
    const event = await queryOne('SELECT * FROM events WHERE id = ?', [event_id]);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event does not exist.' });
    }

    if (!['approved', 'upcoming', 'ongoing'].includes(event.status)) {
      return res.status(400).json({ success: false, message: `Cannot register. Event status is currently '${event.status}'.` });
    }

    // 2. Prevent duplicate registrations
    const existing = await queryOne(
      'SELECT id, status FROM volunteer_registrations WHERE event_id = ? AND volunteer_id = ?',
      [event_id, volunteer_id]
    );
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `You have already registered for this event. Current status: ${existing.status}.`
      });
    }

    // 3. Check Capacity
    const approvedCountRow = await queryOne(
      "SELECT COUNT(*) as count FROM volunteer_registrations WHERE event_id = ? AND status = 'approved'",
      [event_id]
    );
    const approvedCount = approvedCountRow ? approvedCountRow.count : 0;

    let initialStatus = 'pending';
    if (approvedCount >= event.capacity) {
      initialStatus = 'waitlisted';
    }

    // Insert registration
    const result = await query(`
      INSERT INTO volunteer_registrations (event_id, volunteer_id, preferred_duty_id, availability_note, contact_phone, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      event_id,
      volunteer_id,
      preferred_duty_id || null,
      availability_note || '',
      contact_phone || req.user.phone || '',
      initialStatus
    ]);

    // Send notification to volunteer
    await query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `, [
      volunteer_id,
      `Registration Received: ${event.title}`,
      `Your registration application for "${event.title}" has been submitted with status: ${initialStatus}.`,
      'info'
    ]);

    // Send notification to organizer
    await query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `, [
      event.organizer_id,
      `New Volunteer Application`,
      `${req.user.name} applied to volunteer for "${event.title}".`,
      'info'
    ]);

    return res.status(201).json({
      success: true,
      message: initialStatus === 'waitlisted'
        ? 'Event is at capacity! You have been placed on the waitlist.'
        : 'Volunteer registration submitted successfully! Pending review.',
      registrationId: result.insertId,
      status: initialStatus
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Update registration status (Approve / Reject / Waitlist / Cancel)
router.patch('/:id/status', authenticateToken, authorizeRoles('admin', 'organizer', 'coordinator'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // approved, rejected, waitlisted, cancelled

    if (!['approved', 'rejected', 'waitlisted', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const reg = await queryOne(`
      SELECT vr.*, e.title as event_title, e.capacity, u.name as volunteer_name
      FROM volunteer_registrations vr
      JOIN events e ON vr.event_id = e.id
      JOIN users u ON vr.volunteer_id = u.id
      WHERE vr.id = ?
    `, [id]);

    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found.' });

    // If approving, check capacity
    if (status === 'approved') {
      const currentApproved = await queryOne(
        "SELECT COUNT(*) as count FROM volunteer_registrations WHERE event_id = ? AND status = 'approved'",
        [reg.event_id]
      );
      if (currentApproved.count >= reg.capacity) {
        return res.status(400).json({
          success: false,
          message: `Cannot approve. Event capacity of ${reg.capacity} has been reached.`
        });
      }
    }

    await query('UPDATE volunteer_registrations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

    // Send notification to volunteer
    await query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `, [
      reg.volunteer_id,
      `Registration ${status.toUpperCase()}: ${reg.event_title}`,
      `Your volunteer application for "${reg.event_title}" has been ${status}.`,
      status === 'approved' ? 'success' : 'warning'
    ]);

    return res.json({ success: true, message: `Volunteer registration status changed to ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Cancel registration (Volunteer can self-cancel)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const reg = await queryOne('SELECT * FROM volunteer_registrations WHERE id = ?', [id]);
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found.' });

    if (req.user.role === 'volunteer' && reg.volunteer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this registration.' });
    }

    await query("UPDATE volunteer_registrations SET status = 'cancelled' WHERE id = ?", [id]);
    return res.json({ success: true, message: 'Registration cancelled successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
