import { Router } from 'express';
import { query, queryOne } from '../config/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// GET all events with filtering and registration stats
router.get('/', async (req, res) => {
  try {
    const { category, status, search } = req.query;

    let sql = `
      SELECT 
        e.*,
        c.name as category_name,
        c.icon as category_icon,
        org.name as organizer_name,
        coord.name as coordinator_name,
        (SELECT COUNT(*) FROM volunteer_registrations vr WHERE vr.event_id = e.id AND vr.status = 'approved') as approved_volunteers_count,
        (SELECT COUNT(*) FROM volunteer_registrations vr WHERE vr.event_id = e.id) as total_registrations_count
      FROM events e
      LEFT JOIN event_categories c ON e.category_id = c.id
      LEFT JOIN users org ON e.organizer_id = org.id
      LEFT JOIN users coord ON e.coordinator_id = coord.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      sql += ' AND (e.category_id = ? OR c.name = ?)';
      params.push(category, category);
    }

    if (status) {
      sql += ' AND e.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (e.title LIKE ? OR e.description LIKE ? OR e.venue LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY e.start_date ASC, e.start_time ASC';

    const events = await query(sql, params);
    return res.json({ success: true, count: events.length, data: events });
  } catch (err) {
    console.error('Error fetching events:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await query(`
      SELECT c.*, (SELECT COUNT(*) FROM events e WHERE e.category_id = c.id) as event_count
      FROM event_categories c
      ORDER BY c.name ASC
    `);
    return res.json({ success: true, data: categories });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST new category (Admin only)
router.post('/categories', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name required' });
    const result = await query(
      'INSERT INTO event_categories (name, description, icon) VALUES (?, ?, ?)',
      [name, description || '', icon || 'Tag']
    );
    return res.status(201).json({ success: true, categoryId: result.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET single event details with duties and status
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const event = await queryOne(`
      SELECT 
        e.*,
        c.name as category_name,
        org.name as organizer_name,
        org.email as organizer_email,
        coord.name as coordinator_name,
        coord.email as coordinator_email,
        (SELECT COUNT(*) FROM volunteer_registrations vr WHERE vr.event_id = e.id AND vr.status = 'approved') as approved_volunteers_count,
        (SELECT COUNT(*) FROM volunteer_registrations vr WHERE vr.event_id = e.id) as total_registrations_count
      FROM events e
      LEFT JOIN event_categories c ON e.category_id = c.id
      LEFT JOIN users org ON e.organizer_id = org.id
      LEFT JOIN users coord ON e.coordinator_id = coord.id
      WHERE e.id = ?
    `, [id]);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const duties = await query(`
      SELECT 
        ed.*,
        (SELECT COUNT(*) FROM volunteer_allocations va WHERE va.duty_id = ed.id) as assigned_count
      FROM event_duties ed
      WHERE ed.event_id = ?
    `, [id]);

    return res.json({ success: true, data: { ...event, duties } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST create event (Organizer, Admin)
router.post('/', authenticateToken, authorizeRoles('admin', 'organizer'), async (req, res) => {
  try {
    const {
      title,
      description,
      category_id,
      coordinator_id,
      venue,
      start_date,
      end_date,
      start_time,
      end_time,
      capacity = 50,
      required_volunteers = 20,
      image_url,
      duties = []
    } = req.body;

    if (!title || !description || !venue || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Missing required event fields.' });
    }

    // Default status: Admins auto-approve, Organizers submit for review or approved based on setting
    const status = req.user.role === 'admin' ? 'approved' : 'pending_approval';

    const result = await query(`
      INSERT INTO events (
        title, description, category_id, organizer_id, coordinator_id,
        venue, start_date, end_date, start_time, end_time,
        capacity, required_volunteers, image_url, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      description,
      category_id || 1,
      req.user.id,
      coordinator_id || null,
      venue,
      start_date,
      end_date,
      start_time || '09:00:00',
      end_time || '17:00:00',
      capacity,
      required_volunteers,
      image_url || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
      status
    ]);

    const eventId = result.insertId;

    // Create duties if provided
    if (Array.isArray(duties) && duties.length > 0) {
      for (const d of duties) {
        if (d.name) {
          await query(`
            INSERT INTO event_duties (event_id, name, description, required_count)
            VALUES (?, ?, ?, ?)
          `, [eventId, d.name, d.description || '', d.required_count || 5]);
        }
      }
    } else {
      // Create sensible default duties
      const defaultDuties = [
        { name: 'Registration & Welcome', count: 5 },
        { name: 'Crowd & Queue Management', count: 5 },
        { name: 'Logistics & Supply Support', count: 6 },
        { name: 'Refreshment Coordinator', count: 4 }
      ];
      for (const d of defaultDuties) {
        await query(`
          INSERT INTO event_duties (event_id, name, description, required_count)
          VALUES (?, ?, ?, ?)
        `, [eventId, d.name, `Support team for ${d.name.toLowerCase()}`, d.count]);
      }
    }

    // Activity log
    await query(`
      INSERT INTO activity_logs (user_id, action, details)
      VALUES (?, 'EVENT_CREATED', ?)
    `, [req.user.id, `Created event '${title}' (ID: ${eventId})`]);

    return res.status(201).json({
      success: true,
      message: status === 'approved' ? 'Event created and published!' : 'Event submitted for Admin approval.',
      eventId
    });
  } catch (err) {
    console.error('Create event error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update event (Organizer or Admin)
router.put('/:id', authenticateToken, authorizeRoles('admin', 'organizer'), async (req, res) => {
  try {
    const { id } = req.params;
    const event = await queryOne('SELECT * FROM events WHERE id = ?', [id]);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    // Check organizer ownership if not admin
    if (req.user.role === 'organizer' && event.organizer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to edit this event.' });
    }

    const {
      title,
      description,
      category_id,
      coordinator_id,
      venue,
      start_date,
      end_date,
      start_time,
      end_time,
      capacity,
      required_volunteers,
      image_url,
      status
    } = req.body;

    await query(`
      UPDATE events
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          category_id = COALESCE(?, category_id),
          coordinator_id = COALESCE(?, coordinator_id),
          venue = COALESCE(?, venue),
          start_date = COALESCE(?, start_date),
          end_date = COALESCE(?, end_date),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          capacity = COALESCE(?, capacity),
          required_volunteers = COALESCE(?, required_volunteers),
          image_url = COALESCE(?, image_url),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      title, description, category_id, coordinator_id,
      venue, start_date, end_date, start_time, end_time,
      capacity, required_volunteers, image_url, status,
      id
    ]);

    return res.json({ success: true, message: 'Event updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE event (Admin or Organizer owner)
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'organizer'), async (req, res) => {
  try {
    const { id } = req.params;
    const event = await queryOne('SELECT * FROM events WHERE id = ?', [id]);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    if (req.user.role === 'organizer' && event.organizer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event.' });
    }

    await query('DELETE FROM events WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Admin Approval/Rejection Endpoint
router.patch('/:id/status', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // approved, rejected, cancelled, completed

    if (!['approved', 'rejected', 'upcoming', 'ongoing', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const event = await queryOne('SELECT * FROM events WHERE id = ?', [id]);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    await query('UPDATE events SET status = ? WHERE id = ?', [status, id]);

    // Send notification to the organizer
    await query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `, [
      event.organizer_id,
      `Event ${status.toUpperCase()}: ${event.title}`,
      `Your community event "${event.title}" has been updated to status: ${status}.`,
      status === 'approved' ? 'success' : 'warning'
    ]);

    return res.json({ success: true, message: `Event marked as ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
