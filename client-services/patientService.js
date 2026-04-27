/**
 * patientService.js
 * Wrappers around /api/patient/* endpoints.
 * Requires patient JWT token (handled automatically by api.js interceptor).
 */
import api from './api';

export const patientAPI = {
  getProfile: () => api.get('/api/patient/profile'),
  getHistory: () => api.get('/api/patient/history'),
  getAppointments: () => api.get('/api/patient/appointments'),
  bookAppointment: (data) => api.post('/api/patient/appointments', data),
  getNotifications: () => api.get('/api/patient/notifications'),
  getAccessRequests: () => api.get('/api/patient/access-requests'),
  respondToAccessRequest: (id, decision) =>
    api.patch(`/api/patient/access-requests/${id}`, { decision }),
};

export default patientAPI;
