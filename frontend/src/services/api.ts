const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('cc_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('cc_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('cc_token');
  localStorage.removeItem('cc_user');
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

// Authentication APIs
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  register: (payload: any) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  me: () => apiRequest('/auth/me'),
  updateProfile: (payload: any) =>
    apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
};

// Events APIs
export const eventsApi = {
  getAll: (params?: { category?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest(`/events?${query}`);
  },
  getById: (id: number | string) => apiRequest(`/events/${id}`),
  getCategories: () => apiRequest('/events/categories'),
  createCategory: (data: any) =>
    apiRequest('/events/categories', { method: 'POST', body: JSON.stringify(data) }),
  create: (data: any) =>
    apiRequest('/events', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number | string, data: any) =>
    apiRequest(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number | string) =>
    apiRequest(`/events/${id}`, { method: 'DELETE' }),
  updateStatus: (id: number | string, status: string) =>
    apiRequest(`/events/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
};

// Registrations APIs
export const registrationsApi = {
  getAll: (params?: { event_id?: number | string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest(`/registrations?${query}`);
  },
  register: (payload: { event_id: number; preferred_duty_id?: number; availability_note?: string; contact_phone?: string }) =>
    apiRequest('/registrations', { method: 'POST', body: JSON.stringify(payload) }),
  updateStatus: (id: number | string, status: string) =>
    apiRequest(`/registrations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  cancel: (id: number | string) =>
    apiRequest(`/registrations/${id}`, { method: 'DELETE' })
};

// Duties & Allocations APIs
export const dutiesApi = {
  getByEvent: (eventId: number | string) => apiRequest(`/duties/event/${eventId}`),
  create: (eventId: number | string, data: any) =>
    apiRequest(`/duties/event/${eventId}`, { method: 'POST', body: JSON.stringify(data) }),
  getAllocations: (params?: { event_id?: number | string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest(`/duties/allocations?${query}`);
  },
  assign: (payload: { event_id: number; volunteer_id: number; duty_id: number; notes?: string }) =>
    apiRequest('/duties/assign', { method: 'POST', body: JSON.stringify(payload) }),
  deleteAllocation: (id: number | string) =>
    apiRequest(`/duties/allocation/${id}`, { method: 'DELETE' })
};

// Attendance APIs
export const attendanceApi = {
  getByEvent: (eventId: number | string) => apiRequest(`/attendance/event/${eventId}`),
  mark: (payload: {
    event_id: number;
    volunteer_id: number;
    status: 'present' | 'absent' | 'late';
    check_in_time?: string;
    check_out_time?: string;
    hours_served?: number;
    notes?: string;
  }) => apiRequest('/attendance/mark', { method: 'POST', body: JSON.stringify(payload) }),
  getMyHistory: () => apiRequest('/attendance/my-history')
};

// Certificates APIs
export const certificatesApi = {
  getAll: () => apiRequest('/certificates'),
  getById: (identifier: string | number) => apiRequest(`/certificates/${identifier}`),
  generate: (event_id: number, volunteer_id: number) =>
    apiRequest('/certificates/generate', { method: 'POST', body: JSON.stringify({ event_id, volunteer_id }) }),
  batchGenerate: (eventId: number) =>
    apiRequest(`/certificates/generate-batch/${eventId}`, { method: 'POST' })
};

// Reports & Dashboard APIs
export const reportsApi = {
  getDashboardMetrics: () => apiRequest('/reports/dashboard-metrics'),
  getEventParticipation: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/reports/event-participation?${query}`);
  },
  getVolunteerAllocation: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/reports/volunteer-allocation?${query}`);
  },
  getAttendanceReport: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/reports/attendance-report?${query}`);
  },
  getEventCompletion: () => apiRequest('/reports/event-completion')
};

// Users APIs
export const usersApi = {
  getAll: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/users?${query}`);
  },
  getByRole: (role: string) => apiRequest(`/users/by-role/${role}`),
  update: (id: number | string, data: any) =>
    apiRequest(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: number | string) =>
    apiRequest(`/users/${id}`, { method: 'DELETE' })
};

// Notifications APIs
export const notificationsApi = {
  getAll: () => apiRequest('/notifications'),
  markAllRead: () => apiRequest('/notifications/read-all', { method: 'PATCH' }),
  markAsRead: (id: number) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' })
};
