import { Router } from 'express';
import { query, queryOne } from '../config/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// GET all duties for an event
router.get('/event/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const duties = await query(`
      SELECT 
        ed.*,
        (SELECT COUNT(*) FROM volunteer_allocations va WHERE va.duty_id = ed.id) as assigned_count
      FROM event_duties ed
      WHERE ed.event_id = ?
      ORDER BY ed.id ASC
    `, [eventId]);

    return res.json({ success: true, data: duties });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Create new duty for an event (Organizer or Coordinator)
router.post('/event/:eventId', authenticateToken, authorizeRoles('admin', 'organizer', 'coordinator'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, description, required_count } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Duty name required.' });

    const result = await query(`
      INSERT INTO event_duties (event_id, name, description, required_count)
      VALUES (?, ?, ?, ?)
    `, [eventId, name, description || '', required_count || 5]);

    return res.status(201).json({
      success: true,
      message: 'Duty created successfully.',
      dutyId: result.insertId
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET all allocations for an event
router.get('/allocations', authenticateToken, async (req, res) => {
  try {
    const { event_id } = req.query;

    let sql = `
      SELECT 
        va.*,
        u.name as volunteer_name,
        u.email as volunteer_email,
        u.phone as volunteer_phone,
        vp.skills as volunteer_skills,
        ed.name as duty_name,
        ed.description as duty_description,
        e.title as event_title,
        e.start_date,
        assigner.name as assigned_by_name
      FROM volunteer_allocations va
      JOIN users u ON va.volunteer_id = u.id
      LEFT JOIN volunteer_profiles vp ON u.id = vp.user_id
      JOIN event_duties ed ON va.duty_id = ed.id
      JOIN events e ON va.event_id = e.id
      JOIN users assigner ON va.assigned_by = assigner.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'volunteer') {
      sql += ' AND va.volunteer_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'organizer') {
      sql += ' AND e.organizer_id = ?';
      params.push(req.user.id);
    }

    if (event_id) {
      sql += ' AND va.event_id = ?';
      params.push(event_id);
    }

    sql += ' ORDER BY va.allocated_at DESC';

    const allocations = await query(sql, params);
    return res.json({ success: true, count: allocations.length, data: allocations });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Assign / Allocate a volunteer to a duty (Organizer, Coordinator, Admin)
router.post('/assign', authenticateToken, authorizeRoles('admin', 'organizer', 'coordinator'), async (req, res) => {
  try {
    const { event_id, volunteer_id, duty_id, notes } = req.body;

    if (!event_id || !volunteer_id || !duty_id) {
      return res.status(400).json({ success: false, message: 'Event ID, Volunteer ID, and Duty ID are required.' });
    }

    // 1. Verify volunteer is approved for this event
    const reg = await queryOne(
      'SELECT id, status FROM volunteer_registrations WHERE event_id = ? AND volunteer_id = ?',
      [event_id, volunteer_id]
    );

    if (!reg) {
      return res.status(400).json({ success: false, message: 'Volunteer has not registered for this event.' });
    }

    if (reg.status !== 'approved') {
      // Auto-approve registration upon explicit duty assignment
      await query("UPDATE volunteer_registrations SET status = 'approved' WHERE id = ?", [reg.id]);
    }

    // 2. Prevent conflicting allocations across the same event
    const existing = await queryOne(
      'SELECT id FROM volunteer_allocations WHERE event_id = ? AND volunteer_id = ?',
      [event_id, volunteer_id]
    );

    let allocId;
    if (existing) {
      // Reassign to new duty
      await query(`
        UPDATE volunteer_allocations
        SET duty_id = ?, assigned_by = ?, notes = ?, allocated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [duty_id, req.user.id, notes || '', existing.id]);
      allocId = existing.id;
    } else {
      const result = await query(`
        INSERT INTO volunteer_allocations (event_id, volunteer_id, duty_id, assigned_by, notes)
        VALUES (?, ?, ?, ?, ?)
      `, [event_id, volunteer_id, duty_id, req.user.id, notes || '']);
      allocId = result.insertId;
    }

    // Fetch details for notification
    const duty = await queryOne('SELECT name FROM event_duties WHERE id = ?', [duty_id]);
    const event = await queryOne('SELECT title FROM events WHERE id = ?', [event_id]);

    await query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `, [
      volunteer_id,
      `Duty Assigned: ${duty ? duty.name : 'Role'}`,
      `You have been allocated to the duty "${duty ? duty.name : 'Volunteer Team'}" for event "${event ? event.title : 'Community Event'}".`,
      'info'
    ]);

    return res.status(200).json({
      success: true,
      message: 'Volunteer successfully allocated to duty.',
      allocationId: allocId
    });
  } catch (err) {
    console.error('Allocation error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Remove / Unassign volunteer from duty
router.delete('/allocation/:id', authenticateToken, authorizeRoles('admin', 'organizer', 'coordinator'), async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM volunteer_allocations WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Duty allocation removed successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
