import { Router } from 'express';
import { query, queryOne } from '../config/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// GET all certificates (or filter by volunteer/event)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let sql = `
      SELECT 
        c.*,
        u.name as volunteer_name,
        u.email as volunteer_email,
        e.title as event_title,
        e.start_date,
        e.end_date,
        e.venue,
        org.name as organizer_name
      FROM certificates c
      JOIN users u ON c.volunteer_id = u.id
      JOIN events e ON c.event_id = e.id
      LEFT JOIN users org ON e.organizer_id = org.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'volunteer') {
      sql += ' AND c.volunteer_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY c.issue_date DESC';

    const certs = await query(sql, params);
    return res.json({ success: true, count: certs.length, data: certs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET certificate details by ID or Number
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const cert = await queryOne(`
      SELECT 
        c.*,
        u.name as volunteer_name,
        u.email as volunteer_email,
        e.title as event_title,
        e.description as event_description,
        e.start_date,
        e.end_date,
        e.venue,
        org.name as organizer_name
      FROM certificates c
      JOIN users u ON c.volunteer_id = u.id
      JOIN events e ON c.event_id = e.id
      LEFT JOIN users org ON e.organizer_id = org.id
      WHERE c.id = ? OR c.certificate_number = ?
    `, [identifier, identifier]);

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    return res.json({ success: true, data: cert });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Generate certificate for a volunteer in an event (Admin, Organizer, Coordinator)
router.post('/generate', authenticateToken, authorizeRoles('admin', 'organizer', 'coordinator'), async (req, res) => {
  try {
    const { event_id, volunteer_id } = req.body;

    if (!event_id || !volunteer_id) {
      return res.status(400).json({ success: false, message: 'Event ID and Volunteer ID required.' });
    }

    // 1. Verify volunteer was marked present and event is completed/qualified
    const att = await queryOne(`
      SELECT * FROM attendance WHERE event_id = ? AND volunteer_id = ?
    `, [event_id, volunteer_id]);

    if (!att || (att.status !== 'present' && att.status !== 'late')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate certificate: Volunteer does not have verified Present attendance for this event.'
      });
    }

    // 2. Check if certificate already exists
    const existing = await queryOne(`
      SELECT * FROM certificates WHERE event_id = ? AND volunteer_id = ?
    `, [event_id, volunteer_id]);

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Certificate already generated.',
        certificate: existing
      });
    }

    // Unique certificate serial
    const certNumber = `CC-${new Date().getFullYear()}-SRU-${Math.floor(100000 + Math.random() * 900000)}`;
    const today = new Date().toISOString().split('T')[0];
    const hours = att.hours_served || 5.0;

    const result = await query(`
      INSERT INTO certificates (certificate_number, event_id, volunteer_id, issue_date, hours_credited, signature_title)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      certNumber,
      event_id,
      volunteer_id,
      today,
      hours,
      'Dean of Student Welfare & Community Affairs, SR University'
    ]);

    // Notify volunteer
    const event = await queryOne('SELECT title FROM events WHERE id = ?', [event_id]);
    await query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `, [
      volunteer_id,
      'Certificate Issued!',
      `Congratulations! Your verified certificate of appreciation for "${event ? event.title : 'Community Event'}" is now available.`,
      'success'
    ]);

    const createdCert = await queryOne('SELECT * FROM certificates WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Certificate generated successfully!',
      certificate: createdCert
    });
  } catch (err) {
    console.error('Certificate generation error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Auto-generate certificates for all attended volunteers of an event
router.post('/generate-batch/:eventId', authenticateToken, authorizeRoles('admin', 'organizer', 'coordinator'), async (req, res) => {
  try {
    const { eventId } = req.params;

    const attendedVolunteers = await query(`
      SELECT a.volunteer_id, a.hours_served
      FROM attendance a
      WHERE a.event_id = ? AND a.status IN ('present', 'late')
      AND NOT EXISTS (
        SELECT 1 FROM certificates c WHERE c.event_id = a.event_id AND c.volunteer_id = a.volunteer_id
      )
    `, [eventId]);

    let generatedCount = 0;
    const today = new Date().toISOString().split('T')[0];

    for (const v of attendedVolunteers) {
      const certNumber = `CC-${new Date().getFullYear()}-SRU-${Math.floor(100000 + Math.random() * 900000)}`;
      await query(`
        INSERT INTO certificates (certificate_number, event_id, volunteer_id, issue_date, hours_credited, signature_title)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        certNumber,
        eventId,
        v.volunteer_id,
        today,
        v.hours_served || 5.0,
        'Dean of Student Welfare & Community Affairs, SR University'
      ]);
      generatedCount++;
    }

    return res.json({
      success: true,
      message: `Batch generation complete. Generated ${generatedCount} new certificates.`,
      generatedCount
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
