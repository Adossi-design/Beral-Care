/**
 * doctorService.js
 * Wrappers around /api/doctor/* endpoints.
 * Requires doctor JWT token (handled automatically by api.js interceptor).
 */
import api from './api';

export const doctorAPI = {
  getProfile: () => api.get('/api/doctor/profile'),
  getRecentPatients: () => api.get('/api/doctor/recent-patients'),
  getPatient: (patientId) => api.get(`/api/doctor/patient/${patientId}`),
  getAppointments: () => api.get('/api/doctor/appointments'),
  createPatient: (data) => api.post('/api/doctor/create-patient', data),
};

export default doctorAPI;
