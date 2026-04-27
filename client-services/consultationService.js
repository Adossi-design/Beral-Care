/**
 * consultationService.js
 * Thin wrappers around the role-specific consultation endpoints.
 * Import the one matching the logged-in user's role.
 */
import api from './api';

export const patientConsultationAPI = {
  getHistory: () => api.get('/api/patient/history'),
  getAppointments: () => api.get('/api/patient/appointments'),
  bookAppointment: (data) => api.post('/api/patient/appointments', data),
};

export const doctorConsultationAPI = {
  getAppointments: () => api.get('/api/doctor/appointments'),
  getPatient: (patientId) => api.get(`/api/doctor/patient/${patientId}`),
};

export default patientConsultationAPI;
