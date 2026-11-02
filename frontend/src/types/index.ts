export type UserRole = 'admin' | 'organizer' | 'volunteer' | 'coordinator';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role_id: number;
  role: UserRole;
  status: 'active' | 'inactive' | 'pending';
  profile?: VolunteerProfile;
}

export interface VolunteerProfile {
  id?: number;
  user_id: number;
  bio?: string;
  skills?: string;
  interests?: string;
  emergency_contact?: string;
  total_hours: number;
  badges_count: number;
}

export interface EventCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  event_count?: number;
}

export interface EventDuty {
  id: number;
  event_id: number;
  name: string;
  description?: string;
  required_count: number;
  assigned_count?: number;
}

export type EventStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'upcoming'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export interface EventItem {
  id: number;
  title: string;
  description: string;
  category_id: number;
  category_name?: string;
  category_icon?: string;
  organizer_id: number;
  organizer_name?: string;
  coordinator_id?: number;
  coordinator_name?: string;
  venue: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  required_volunteers: number;
  image_url?: string;
  status: EventStatus;
  approved_volunteers_count?: number;
  total_registrations_count?: number;
  duties?: EventDuty[];
}

export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'waitlisted' | 'cancelled';

export interface VolunteerRegistration {
  id: number;
  event_id: number;
  volunteer_id: number;
  preferred_duty_id?: number;
  availability_note?: string;
  contact_phone?: string;
  status: RegistrationStatus;
  registered_at: string;
  volunteer_name?: string;
  volunteer_email?: string;
  volunteer_avatar?: string;
  event_title?: string;
  start_date?: string;
  end_date?: string;
  venue?: string;
  preferred_duty_name?: string;
  assigned_duty_id?: number;
  assigned_duty_name?: string;
}

export interface VolunteerAllocation {
  id: number;
  event_id: number;
  volunteer_id: number;
  duty_id: number;
  assigned_by: number;
  assigned_by_name?: string;
  status: string;
  notes?: string;
  allocated_at: string;
  volunteer_name?: string;
  volunteer_email?: string;
  volunteer_phone?: string;
  volunteer_skills?: string;
  duty_name?: string;
  event_title?: string;
  start_date?: string;
}

export interface AttendanceRecord {
  volunteer_id: number;
  volunteer_name: string;
  volunteer_email: string;
  volunteer_phone?: string;
  avatar_url?: string;
  assigned_duty_name?: string;
  attendance_id?: number;
  attendance_status?: 'present' | 'absent' | 'late' | null;
  check_in_time?: string;
  check_out_time?: string;
  hours_served?: number;
  notes?: string;
  marked_by_name?: string;
}

export interface CertificateItem {
  id: number;
  certificate_number: string;
  event_id: number;
  volunteer_id: number;
  issue_date: string;
  hours_credited: number;
  signature_title: string;
  volunteer_name?: string;
  volunteer_email?: string;
  event_title?: string;
  event_description?: string;
  venue?: string;
  organizer_name?: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: number | boolean;
  created_at: string;
}
