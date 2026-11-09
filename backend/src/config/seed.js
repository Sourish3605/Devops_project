import bcrypt from 'bcryptjs';
import { sqliteDb } from './db.js';

export async function initDatabase() {
  console.log('Initializing database schema...');

  // Enable foreign keys
  sqliteDb.pragma('foreign_keys = ON');

  // Schema creation
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );

    CREATE TABLE IF NOT EXISTS event_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      organizer_id INTEGER NOT NULL,
      coordinator_id INTEGER,
      venue TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 50,
      required_volunteers INTEGER NOT NULL DEFAULT 20,
      image_url TEXT,
      status TEXT DEFAULT 'approved', -- draft, pending_approval, approved, rejected, upcoming, ongoing, completed, cancelled
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES event_categories(id),
      FOREIGN KEY (organizer_id) REFERENCES users(id),
      FOREIGN KEY (coordinator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS volunteer_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      bio TEXT,
      skills TEXT,
      interests TEXT,
      emergency_contact TEXT,
      total_hours REAL DEFAULT 0,
      badges_count INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS event_duties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      required_count INTEGER NOT NULL DEFAULT 5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS volunteer_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      volunteer_id INTEGER NOT NULL,
      preferred_duty_id INTEGER,
      availability_note TEXT,
      contact_phone TEXT,
      status TEXT DEFAULT 'pending', -- pending, approved, rejected, waitlisted, cancelled
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, volunteer_id),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (volunteer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (preferred_duty_id) REFERENCES event_duties(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS volunteer_allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      volunteer_id INTEGER NOT NULL,
      duty_id INTEGER NOT NULL,
      assigned_by INTEGER NOT NULL,
      status TEXT DEFAULT 'assigned', -- assigned, confirmed, declined
      notes TEXT,
      allocated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, volunteer_id),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (volunteer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (duty_id) REFERENCES event_duties(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      volunteer_id INTEGER NOT NULL,
      status TEXT NOT NULL, -- present, absent, late
      check_in_time TEXT,
      check_out_time TEXT,
      hours_served REAL DEFAULT 0,
      marked_by INTEGER NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, volunteer_id),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (volunteer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (marked_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      certificate_number TEXT NOT NULL UNIQUE,
      event_id INTEGER NOT NULL,
      volunteer_id INTEGER NOT NULL,
      issue_date TEXT NOT NULL,
      hours_credited REAL NOT NULL,
      signature_title TEXT DEFAULT 'Dean of Student Welfare & Community Affairs, SR University',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, volunteer_id),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (volunteer_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS event_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL UNIQUE,
      summary TEXT,
      outcomes TEXT,
      volunteers_attended INTEGER DEFAULT 0,
      total_hours_contributed REAL DEFAULT 0,
      submitted_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (submitted_by) REFERENCES users(id)
    );
  `);

  console.log('Database schema created/verified successfully.');
}

export async function seedDatabase() {
  await initDatabase();
  console.log('Checking database seed state...');

  const roleCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM roles').get().count;
  if (roleCount === 0) {
    console.log('Seeding initial roles...');
    const insertRole = sqliteDb.prepare('INSERT INTO roles (id, name, description) VALUES (?, ?, ?)');
    insertRole.run(1, 'admin', 'System Administrator with complete access');
    insertRole.run(2, 'organizer', 'Event Organizer creating and managing community events');
    insertRole.run(3, 'volunteer', 'Community Volunteer registering and serving on duties');
    insertRole.run(4, 'coordinator', 'Field Coordinator managing attendance, check-ins, and assignments');
  }

  const categoryCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM event_categories').get().count;
  if (categoryCount === 0) {
    console.log('Seeding event categories...');
    const insertCat = sqliteDb.prepare('INSERT INTO event_categories (id, name, description, icon) VALUES (?, ?, ?, ?)');
    insertCat.run(1, 'Environmental & Green Campus', 'Tree plantation, lake cleaning, zero-waste drives', 'TreePine');
    insertCat.run(2, 'Healthcare & Blood Donation', 'Health screening camps, blood donation drives', 'HeartPulse');
    insertCat.run(3, 'Education & Literacy Outreach', 'Coding camps, school teaching, library donation', 'GraduationCap');
    insertCat.run(4, 'Disaster Relief & Community Aid', 'Food distribution, winter blanket drives, emergency aid', 'HandHelping');
    insertCat.run(5, 'Youth Sports & Cultural Fest', 'Marathons, inter-college events, cultural celebration', 'Trophy');
  }

  const userCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    console.log('Seeding demo users for all four roles...');
    const hash = bcrypt.hashSync('Password@123', 10);
    const insertUser = sqliteDb.prepare(`
      INSERT INTO users (id, role_id, name, email, password, phone, avatar_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 1: Admin
    insertUser.run(1, 1, 'Narendrula Sourish (Admin)', 'admin@communityconnect.edu', hash, '+91 98765 43210', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'active');
    // 2: Event Organizer
    insertUser.run(2, 2, 'Prof. Ananya Reddy (Organizer)', 'organizer@communityconnect.edu', hash, '+91 98765 43211', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', 'active');
    // 3: Field Coordinator
    insertUser.run(3, 4, 'Vikram Malhotra (Coordinator)', 'coordinator@communityconnect.edu', hash, '+91 98765 43212', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'active');
    // 4: Volunteer 1
    insertUser.run(4, 3, 'Sneha Patel (Volunteer)', 'volunteer@communityconnect.edu', hash, '+91 98765 43213', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'active');
    // 5: Volunteer 2
    insertUser.run(5, 3, 'Rahul Varma (Volunteer)', 'rahul@communityconnect.edu', hash, '+91 98765 43214', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'active');
    // 6: Volunteer 3
    insertUser.run(6, 3, 'Pooja Hegde (Volunteer)', 'pooja@communityconnect.edu', hash, '+91 98765 43215', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 'active');

    // Profiles
    const insertProfile = sqliteDb.prepare(`
      INSERT INTO volunteer_profiles (user_id, bio, skills, interests, emergency_contact, total_hours, badges_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertProfile.run(4, 'Final year CS student passionate about tech education and eco-initiatives.', 'First Aid, Public Speaking, Photography, Registration Desk', 'Environment, Coding for Kids, Blood Camps', '+91 99887 76655', 18.5, 3);
    insertProfile.run(5, 'Mechanical Engineering enthusiast who loves event logistics & crowd steering.', 'Logistics, Crowd Management, Sound Engineering', 'Sports, Cleanliness Drives', '+91 99887 76654', 12.0, 2);
    insertProfile.run(6, 'Biotech scholar dedicated to community healthcare & nutrition drives.', 'Medical Triage, Food Distribution, Social Media', 'Healthcare, Disaster Aid', '+91 99887 76653', 24.0, 4);

    // Seed Events
    const insertEvent = sqliteDb.prepare(`
      INSERT INTO events (id, title, description, category_id, organizer_id, coordinator_id, venue, start_date, end_date, start_time, end_time, capacity, required_volunteers, image_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertEvent.run(
      1,
      'Mega Green Campus Tree Plantation Drive 2026',
      'Join hands to plant 1,500 native saplings across SR University Campus and suburban biodiversity parks. Volunteers will assist in sapling distribution, planting guidance, tool management, and participant refreshments.',
      1, 2, 3,
      'SR University Botanical Grounds, Block-D',
      '2026-11-15', '2026-11-15', '08:30:00', '14:30:00',
      120, 25,
      'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
      'approved'
    );

    insertEvent.run(
      2,
      'Annual Community Blood Donation & Health Camp',
      'Partnering with the Red Cross Society and City Civil Hospital. Free screening for general health, vitals checkup, and blood donor intake.',
      2, 2, 3,
      'Student Activity Center Auditorium',
      '2026-11-20', '2026-11-20', '09:00:00', '16:00:00',
      80, 20,
      'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=800',
      'approved'
    );

    insertEvent.run(
      3,
      'Rural Literacy & Robotics STEM Workshop',
      'A two-day interactive STEM outreach mentoring 200 middle school students from neighboring government schools with hands-on robotics kits.',
      3, 2, 3,
      'Innovation & Incubation Hub, Seminar Hall 2',
      '2026-10-25', '2026-10-26', '10:00:00', '17:00:00',
      50, 15,
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800',
      'completed'
    );

    insertEvent.run(
      4,
      'SR Marathon for Clean Energy 2026',
      'A 10K/5K city-wide run promoting renewable energy. Volunteers support route guidance, hydration stations, and medal distribution.',
      5, 2, 3,
      'University Main Gate to Lake Boulevard',
      '2026-12-05', '2026-12-05', '05:30:00', '11:00:00',
      200, 35,
      'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800',
      'approved'
    );

    insertEvent.run(
      5,
      'Winter Blanket & Food Distribution Drive (Pending Review)',
      'Proposed humanitarian relief drive to provide packaged warm meals and fleece blankets to low-income transit communities in Warangal district.',
      4, 2, 3,
      'Railway Station East Terminal & Night Shelters',
      '2026-12-18', '2026-12-18', '18:00:00', '22:30:00',
      40, 12,
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
      'pending_approval'
    );

    // Event Duties
    const insertDuty = sqliteDb.prepare(`
      INSERT INTO event_duties (id, event_id, name, description, required_count)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Event 1 Duties
    insertDuty.run(1, 1, 'Registration Desk & Welcome Kit', 'Check in participants, hand out seedling tags and badges', 5);
    insertDuty.run(2, 1, 'Crowd Management & Queue Control', 'Direct groups to assigned planting zones A through F', 6);
    insertDuty.run(3, 1, 'Sapling & Equipment Distribution', 'Supervise shovel, compost, and sapling allocation', 8);
    insertDuty.run(4, 1, 'Refreshment & Hydration Booth', 'Distribute drinking water, electrolytes, and healthy snacks', 4);
    insertDuty.run(5, 1, 'Photography & Media Coverage', 'Document planting milestones for press and social media', 2);

    // Event 2 Duties
    insertDuty.run(6, 2, 'Donor Registration & Vitals Triage', 'Log donor details and measure BP/weight before donation', 6);
    insertDuty.run(7, 2, 'Refreshment & Rest Area Monitor', 'Assist donors post-donation with juice and rest oversight', 6);
    insertDuty.run(8, 2, 'Medical Assistance Support', 'Shadow nurses and maintain sanitary equipment inventory', 4);

    // Event 3 (Completed) Duties
    insertDuty.run(9, 3, 'STEM Lab Mentorship', 'Guide school students with circuit wiring and simple code', 10);
    insertDuty.run(10, 3, 'Event Logistics & Safety', 'Ensure laboratory security, student kits, and bus boarding', 5);

    // Seed Registrations
    const insertReg = sqliteDb.prepare(`
      INSERT INTO volunteer_registrations (id, event_id, volunteer_id, preferred_duty_id, availability_note, contact_phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    // Event 1 registrations
    insertReg.run(1, 1, 4, 1, 'Available full day from 8 AM to 3 PM', '+91 98765 43213', 'approved');
    insertReg.run(2, 1, 5, 2, 'Available morning shift', '+91 98765 43214', 'approved');
    insertReg.run(3, 1, 6, 4, 'Ready to coordinate refreshments', '+91 98765 43215', 'pending');

    // Event 3 (Completed) registrations
    insertReg.run(4, 3, 4, 9, 'Completed STEM mentoring full day', '+91 98765 43213', 'approved');
    insertReg.run(5, 3, 5, 10, 'Handled logistics and transport coordination', '+91 98765 43214', 'approved');

    // Seed Allocations
    const insertAlloc = sqliteDb.prepare(`
      INSERT INTO volunteer_allocations (id, event_id, volunteer_id, duty_id, assigned_by, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertAlloc.run(1, 1, 4, 1, 3, 'confirmed', 'Lead Volunteer for Front Desk');
    insertAlloc.run(2, 1, 5, 2, 3, 'confirmed', 'Zone B Queue Supervisor');
    insertAlloc.run(3, 3, 4, 9, 3, 'confirmed', 'Senior STEM Mentor for Class 8');
    insertAlloc.run(4, 3, 5, 10, 3, 'confirmed', 'Equipment & Transport Lead');

    // Seed Attendance for Completed Event 3
    const insertAtt = sqliteDb.prepare(`
      INSERT INTO attendance (id, event_id, volunteer_id, status, check_in_time, check_out_time, hours_served, marked_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAtt.run(1, 3, 4, 'present', '09:45 AM', '05:15 PM', 7.5, 3, 'Excellent mentoring feedback from school staff');
    insertAtt.run(2, 3, 5, 'present', '09:30 AM', '05:00 PM', 7.5, 3, 'Smooth event logistics executed');

    // Seed Certificates for Completed Event
    const insertCert = sqliteDb.prepare(`
      INSERT INTO certificates (id, certificate_number, event_id, volunteer_id, issue_date, hours_credited, signature_title)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertCert.run(1, 'CC-2026-SRU-00101', 3, 4, '2026-10-27', 7.5, 'Dean of Student Affairs & Community Engagement, SR University');
    insertCert.run(2, 'CC-2026-SRU-00102', 3, 5, '2026-10-27', 7.5, 'Dean of Student Affairs & Community Engagement, SR University');

    // Seed Event Report for Event 3
    const insertReport = sqliteDb.prepare(`
      INSERT INTO event_reports (id, event_id, summary, outcomes, volunteers_attended, total_hours_contributed, submitted_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertReport.run(1, 3, 'The 2-day STEM workshop successfully mentored 200 rural middle school students. Kits were assembled and tested.', '98% students built working solar bots; 15 volunteer mentors provided 75 collective hours of service.', 2, 15.0, 3);

    // Seed Notifications
    const insertNotif = sqliteDb.prepare(`
      INSERT INTO notifications (user_id, title, message, type, is_read)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertNotif.run(4, 'Duty Assigned: Registration Desk', 'You have been assigned to Registration Desk & Welcome Kit for Mega Green Campus Tree Plantation Drive 2026.', 'success', 0);
    insertNotif.run(4, 'Certificate Available!', 'Your certificate of appreciation for Rural Literacy & Robotics STEM Workshop is ready for download.', 'info', 0);
    insertNotif.run(1, 'New Event Approval Request', 'Prof. Ananya Reddy submitted Winter Blanket & Food Distribution Drive for administrative approval.', 'warning', 0);
    insertNotif.run(2, 'Registration Approved', 'Volunteer Sneha Patel registration was approved for Tree Plantation Drive.', 'info', 1);

    // Seed Activity Logs
    const insertLog = sqliteDb.prepare(`
      INSERT INTO activity_logs (user_id, action, details, ip_address)
      VALUES (?, ?, ?, ?)
    `);
    insertLog.run(1, 'SYSTEM_START', 'CommunityConnect platform initialized successfully with seed schema', '127.0.0.1');
    insertLog.run(2, 'EVENT_CREATE', 'Created event: Mega Green Campus Tree Plantation Drive 2026', '127.0.0.1');
    insertLog.run(3, 'ATTENDANCE_MARKED', 'Marked attendance for Rural Literacy & Robotics STEM Workshop', '127.0.0.1');
    insertLog.run(4, 'REGISTRATION_SUBMITTED', 'Sneha Patel registered for Mega Green Campus Tree Plantation Drive', '127.0.0.1');

    console.log('Seed data successfully populated!');
  } else {
    console.log('Database already contains records, skipping seed insertion.');
  }
}
