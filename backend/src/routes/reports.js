import { Router } from 'express';
import { query, queryOne } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 1. Event Participation Report
router.get('/event-participation', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, event_id } = req.query;

    let sql = `
      SELECT 
        e.id as event_id,
        e.title as event_title,
        e.start_date,
        e.end_date,
        e.venue,
        e.status as event_status,
        e.capacity,
        e.required_volunteers,
        c.name as category_name,
        org.name as organizer_name,
        COUNT(vr.id) as total_registrations,
        SUM(CASE WHEN vr.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN vr.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN vr.status = 'waitlisted' THEN 1 ELSE 0 END) as waitlisted_count,
        SUM(CASE WHEN vr.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        (SELECT COUNT(*) FROM attendance a WHERE a.event_id = e.id AND a.status IN ('present', 'late')) as attended_count
      FROM events e
      LEFT JOIN event_categories c ON e.category_id = c.id
      LEFT JOIN users org ON e.organizer_id = org.id
      LEFT JOIN volunteer_registrations vr ON vr.event_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (event_id) {
      sql += ' AND e.id = ?';
      params.push(event_id);
    }
    if (start_date) {
      sql += ' AND e.start_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND e.start_date <= ?';
      params.push(end_date);
    }

    sql += ' GROUP BY e.id ORDER BY e.start_date DESC';

    const report = await query(sql, params);
    return res.json({ success: true, count: report.length, data: report });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Volunteer Allocation Report
router.get('/volunteer-allocation', authenticateToken, async (req, res) => {
  try {
    const { event_id, duty_id } = req.query;

    let sql = `
      SELECT 
        va.id as allocation_id,
        u.id as volunteer_id,
        u.name as volunteer_name,
        u.email as volunteer_email,
        u.phone as volunteer_phone,
        e.id as event_id,
        e.title as event_title,
        e.start_date as event_date,
        ed.name as assigned_duty,
        assigner.name as coordinator_name,
        va.status as allocation_status,
        va.notes,
        va.allocated_at
      FROM volunteer_allocations va
      JOIN users u ON va.volunteer_id = u.id
      JOIN events e ON va.event_id = e.id
      JOIN event_duties ed ON va.duty_id = ed.id
      JOIN users assigner ON va.assigned_by = assigner.id
      WHERE 1=1
    `;
    const params = [];

    if (event_id) {
      sql += ' AND va.event_id = ?';
      params.push(event_id);
    }
    if (duty_id) {
      sql += ' AND va.duty_id = ?';
      params.push(duty_id);
    }

    sql += ' ORDER BY e.start_date DESC, u.name ASC';

    const report = await query(sql, params);
    return res.json({ success: true, count: report.length, data: report });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Attendance Report
router.get('/attendance-report', authenticateToken, async (req, res) => {
  try {
    const { event_id, status } = req.query;

    let sql = `
      SELECT 
        a.id as attendance_id,
        u.id as volunteer_id,
        u.name as volunteer_name,
        u.email as volunteer_email,
        e.id as event_id,
        e.title as event_title,
        e.start_date as event_date,
        ed.name as duty_name,
        a.status as attendance_status,
        a.check_in_time,
        a.check_out_time,
        a.hours_served,
        marker.name as marked_by_name,
        a.notes
      FROM attendance a
      JOIN users u ON a.volunteer_id = u.id
      JOIN events e ON a.event_id = e.id
      LEFT JOIN volunteer_allocations va ON (va.event_id = a.event_id AND va.volunteer_id = a.volunteer_id)
      LEFT JOIN event_duties ed ON va.duty_id = ed.id
      JOIN users marker ON a.marked_by = marker.id
      WHERE 1=1
    `;
    const params = [];

    if (event_id) {
      sql += ' AND a.event_id = ?';
      params.push(event_id);
    }
    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY e.start_date DESC, u.name ASC';

    const report = await query(sql, params);
    return res.json({ success: true, count: report.length, data: report });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Event Completion Report
router.get('/event-completion', authenticateToken, async (req, res) => {
  try {
    const sql = `
      SELECT 
        e.id as event_id,
        e.title as event_title,
        e.description,
        e.venue,
        e.start_date,
        e.end_date,
        e.status as event_status,
        org.name as organizer_name,
        coord.name as coordinator_name,
        (SELECT COUNT(*) FROM volunteer_registrations vr WHERE vr.event_id = e.id) as total_registrations,
        (SELECT COUNT(*) FROM attendance a WHERE a.event_id = e.id AND a.status IN ('present', 'late')) as volunteers_present,
        (SELECT COUNT(*) FROM attendance a WHERE a.event_id = e.id AND a.status = 'absent') as volunteers_absent,
        (SELECT COALESCE(SUM(a.hours_served), 0) FROM attendance a WHERE a.event_id = e.id) as total_hours_served,
        (SELECT COUNT(*) FROM event_duties ed WHERE ed.event_id = e.id) as duties_count,
        (SELECT COUNT(*) FROM certificates c WHERE c.event_id = e.id) as certificates_issued,
        er.summary,
        er.outcomes
      FROM events e
      LEFT JOIN users org ON e.organizer_id = org.id
      LEFT JOIN users coord ON e.coordinator_id = coord.id
      LEFT JOIN event_reports er ON er.event_id = e.id
      ORDER BY e.start_date DESC
    `;

    const report = await query(sql);
    return res.json({ success: true, count: report.length, data: report });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Overall System Analytics Dashboard Metrics
router.get('/dashboard-metrics', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    // Global Stats
    const totalEvents = (await queryOne('SELECT COUNT(*) as count FROM events')).count;
    const activeEvents = (await queryOne("SELECT COUNT(*) as count FROM events WHERE status IN ('approved', 'upcoming', 'ongoing')")).count;
    const completedEvents = (await queryOne("SELECT COUNT(*) as count FROM events WHERE status = 'completed'")).count;
    const pendingEvents = (await queryOne("SELECT COUNT(*) as count FROM events WHERE status = 'pending_approval'")).count;
    const totalVolunteers = (await queryOne("SELECT COUNT(*) as count FROM users WHERE role_id = 3")).count;
    const totalRegistrations = (await queryOne('SELECT COUNT(*) as count FROM volunteer_registrations')).count;
    const totalHoursServed = (await queryOne("SELECT COALESCE(SUM(hours_served), 0) as total FROM attendance WHERE status IN ('present', 'late')")).total;
    const totalCertificates = (await queryOne('SELECT COUNT(*) as count FROM certificates')).count;

    // Monthly Participation Data for charts
    const monthlyParticipation = await query(`
      SELECT 
        strftime('%Y-%m', start_date) as month,
        COUNT(DISTINCT e.id) as events_count,
        COUNT(DISTINCT vr.volunteer_id) as volunteers_participated
      FROM events e
      LEFT JOIN volunteer_registrations vr ON vr.event_id = e.id AND vr.status = 'approved'
      GROUP BY strftime('%Y-%m', start_date)
      ORDER BY month ASC
      LIMIT 6
    `);

    // Category Distribution for charts
    const categoryDistribution = await query(`
      SELECT 
        c.name as category,
        COUNT(e.id) as value
      FROM event_categories c
      LEFT JOIN events e ON e.category_id = c.id
      GROUP BY c.id
    `);

    // Recent activities
    const recentActivities = await query(`
      SELECT al.*, u.name as user_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 8
    `);

    // Role-specific metrics
    let roleSpecific = {};
    if (userRole === 'volunteer') {
      const myRegs = await queryOne('SELECT COUNT(*) as count FROM volunteer_registrations WHERE volunteer_id = ?', [userId]);
      const myApproved = await queryOne("SELECT COUNT(*) as count FROM volunteer_registrations WHERE volunteer_id = ? AND status = 'approved'", [userId]);
      const myHours = await queryOne("SELECT COALESCE(SUM(hours_served), 0) as total FROM attendance WHERE volunteer_id = ? AND status IN ('present', 'late')", [userId]);
      const myCerts = await queryOne('SELECT COUNT(*) as count FROM certificates WHERE volunteer_id = ?', [userId]);
      const myUpcomingDuty = await queryOne(`
        SELECT ed.name as duty_name, e.title as event_title, e.start_date, e.venue
        FROM volunteer_allocations va
        JOIN event_duties ed ON va.duty_id = ed.id
        JOIN events e ON va.event_id = e.id
        WHERE va.volunteer_id = ? AND e.start_date >= date('now')
        ORDER BY e.start_date ASC
        LIMIT 1
      `, [userId]);

      roleSpecific = {
        myRegistrations: myRegs.count,
        myApproved: myApproved.count,
        myHours: myHours.total,
        myCertificates: myCerts.count,
        upcomingDuty: myUpcomingDuty
      };
    } else if (userRole === 'organizer') {
      const myEvents = await queryOne('SELECT COUNT(*) as count FROM events WHERE organizer_id = ?', [userId]);
      const myPendingRegs = await queryOne(`
        SELECT COUNT(vr.id) as count
        FROM volunteer_registrations vr
        JOIN events e ON vr.event_id = e.id
        WHERE e.organizer_id = ? AND vr.status = 'pending'
      `, [userId]);
      const myTotalVolunteers = await queryOne(`
        SELECT COUNT(vr.id) as count
        FROM volunteer_registrations vr
        JOIN events e ON vr.event_id = e.id
        WHERE e.organizer_id = ? AND vr.status = 'approved'
      `, [userId]);

      roleSpecific = {
        myEvents: myEvents.count,
        pendingApplications: myPendingRegs.count,
        totalVolunteersAllocated: myTotalVolunteers.count
      };
    } else if (userRole === 'coordinator') {
      const assignedEvents = await queryOne('SELECT COUNT(*) as count FROM events WHERE coordinator_id = ?', [userId]);
      const pendingAttendance = await queryOne(`
        SELECT COUNT(vr.id) as count
        FROM volunteer_registrations vr
        JOIN events e ON vr.event_id = e.id
        LEFT JOIN attendance a ON (a.event_id = vr.event_id AND a.volunteer_id = vr.volunteer_id)
        WHERE (e.coordinator_id = ? OR e.coordinator_id IS NULL)
          AND vr.status = 'approved'
          AND a.id IS NULL
      `, [userId]);

      roleSpecific = {
        assignedEvents: assignedEvents.count,
        pendingAttendance: pendingAttendance.count
      };
    }

    return res.json({
      success: true,
      data: {
        summary: {
          totalEvents,
          activeEvents,
          completedEvents,
          pendingEvents,
          totalVolunteers,
          totalRegistrations,
          totalHoursServed,
          totalCertificates
        },
        monthlyParticipation,
        categoryDistribution,
        recentActivities,
        roleSpecific
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
