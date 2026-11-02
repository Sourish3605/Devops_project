-- CommunityConnect MySQL Schema
-- Academic Year 2026-2027, SR University
-- DevOps & Full Stack Development

CREATE DATABASE IF NOT EXISTS community_connect;
USE community_connect;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url VARCHAR(255),
  status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- Event Categories
CREATE TABLE IF NOT EXISTS event_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category_id INT NOT NULL,
  organizer_id INT NOT NULL,
  coordinator_id INT,
  venue VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INT NOT NULL DEFAULT 50,
  required_volunteers INT NOT NULL DEFAULT 20,
  image_url VARCHAR(255),
  status ENUM('draft', 'pending_approval', 'approved', 'rejected', 'upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'pending_approval',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES event_categories(id),
  FOREIGN KEY (organizer_id) REFERENCES users(id),
  FOREIGN KEY (coordinator_id) REFERENCES users(id)
);

-- Volunteer Profiles (skills, bio, emergency contact)
CREATE TABLE IF NOT EXISTS volunteer_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  bio TEXT,
  skills TEXT, -- comma-separated or JSON
  interests TEXT,
  emergency_contact VARCHAR(100),
  total_hours DECIMAL(6,2) DEFAULT 0,
  badges_count INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Event Duties / Roles required for an event
CREATE TABLE IF NOT EXISTS event_duties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  required_count INT NOT NULL DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Volunteer Registrations for events
CREATE TABLE IF NOT EXISTS volunteer_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  volunteer_id INT NOT NULL,
  preferred_duty_id INT,
  availability_note VARCHAR(255),
  contact_phone VARCHAR(20),
  status ENUM('pending', 'approved', 'rejected', 'waitlisted', 'cancelled') DEFAULT 'pending',
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_event_volunteer (event_id, volunteer_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (volunteer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (preferred_duty_id) REFERENCES event_duties(id) ON DELETE SET NULL
);

-- Volunteer Duty Allocations (confirmed duty assignment)
CREATE TABLE IF NOT EXISTS volunteer_allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  volunteer_id INT NOT NULL,
  duty_id INT NOT NULL,
  assigned_by INT NOT NULL, -- coordinator or organizer user_id
  status ENUM('assigned', 'confirmed', 'declined') DEFAULT 'assigned',
  notes VARCHAR(255),
  allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_event_duty_volunteer (event_id, volunteer_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (volunteer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (duty_id) REFERENCES event_duties(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id)
);

-- Attendance Records
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  volunteer_id INT NOT NULL,
  status ENUM('present', 'absent', 'late') NOT NULL,
  check_in_time VARCHAR(20),
  check_out_time VARCHAR(20),
  hours_served DECIMAL(4,2) DEFAULT 0,
  marked_by INT NOT NULL,
  notes VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_event_volunteer_attendance (event_id, volunteer_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (volunteer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES users(id)
);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  certificate_number VARCHAR(50) NOT NULL UNIQUE,
  event_id INT NOT NULL,
  volunteer_id INT NOT NULL,
  issue_date DATE NOT NULL,
  hours_credited DECIMAL(4,2) NOT NULL,
  signature_title VARCHAR(100) DEFAULT 'Director of Community Affairs, SR University',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_certificate_event_volunteer (event_id, volunteer_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (volunteer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Event Reports
CREATE TABLE IF NOT EXISTS event_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL UNIQUE,
  summary TEXT,
  outcomes TEXT,
  volunteers_attended INT DEFAULT 0,
  total_hours_contributed DECIMAL(8,2) DEFAULT 0,
  submitted_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (submitted_by) REFERENCES users(id)
);
