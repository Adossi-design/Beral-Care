import api from './api';

// Every endpoint the app calls, grouped by area. Screens use these instead of
// axios directly, so a backend change is a one-line edit here.

export const auth = {
  login: (email, password) => api.post('/api/auth/login', { email, password }).then((r) => r.data),
  register: (payload) => api.post('/api/auth/register', payload).then((r) => r.data),
};

export const profile = {
  me: () => api.get('/api/profile').then((r) => r.data),
  update: (payload) => api.put('/api/profile', payload).then((r) => r.data),
  uploadImage: (file) => {
    const form = new FormData();
    form.append('image', file);
    return api
      .post('/api/profile/upload-image', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
  removeImage: () => api.delete('/api/profile/image').then((r) => r.data),
  doctor: (doctorId) => api.get(`/api/profile/doctor/${doctorId}`).then((r) => r.data),
  patient: (patientId) => api.get(`/api/profile/patient/${patientId}`).then((r) => r.data),
};

export const patient = {
  dashboard:     () => api.get('/api/patient/dashboard').then((r) => r.data),
  appointments:  () => api.get('/api/patient/appointments').then((r) => r.data),
  consultations: () => api.get('/api/patient/consultations').then((r) => r.data),
  notifications: () => api.get('/api/patient/notifications').then((r) => r.data),
  markRead:  (id) => api.patch(`/api/patient/notifications/${id}`).then((r) => r.data),
  doctors:       () => api.get('/api/patient/doctors').then((r) => r.data),
  accessRequests:() => api.get('/api/patient/consultation-requests').then((r) => r.data),
  requestAccess: (doctorId, reason) =>
    api.post('/api/patient/consultation-requests', { doctor_id: doctorId, reason }).then((r) => r.data),
  decideAccess:  (id, decision) =>
    api.patch(`/api/patient/consultation-requests/${id}`, { decision }).then((r) => r.data),
  book: (payload) => api.post('/api/patient/appointments', payload).then((r) => r.data),
};

export const clinic = {
  requests:      () => api.get('/api/doctor/requests').then((r) => r.data),
  decideRequest: (id, status) => api.patch(`/api/doctor/requests/${id}`, { status }).then((r) => r.data),
  patients:      () => api.get('/api/doctor/patients').then((r) => r.data),
  recentPatients:() => api.get('/api/doctor/recent-patients').then((r) => r.data),
  appointments:  () => api.get('/api/doctor/appointments').then((r) => r.data),
  lookupPatient: (patientId) => api.get(`/api/doctor/patient/${patientId}`).then((r) => r.data),
  consultationsFor: (patientRowId) =>
    api.get(`/api/doctor/patients/${patientRowId}/consultations`).then((r) => r.data),
  createConsultation: (payload) => api.post('/api/doctor/consultations', payload).then((r) => r.data),
  createAppointment:  (payload) => api.post('/api/doctor/create-appointment', payload).then((r) => r.data),
  assignId: () => api.post('/api/doctor/assign-id').then((r) => r.data),
};

export const admin = {
  stats: () => api.get('/api/admin/stats').then((r) => r.data),
  users: (role) => api.get('/api/admin/users', { params: role ? { role } : {} }).then((r) => r.data),
  user:  (id) => api.get(`/api/admin/users/${id}`).then((r) => r.data),
  remove:(id) => api.delete(`/api/admin/users/${id}`).then((r) => r.data),
  setSuspended: (id, suspended) =>
    api.patch(`/api/admin/users/${id}/suspend`, { suspended }).then((r) => r.data),
};

export const directory = {
  doctors: (params) => api.get('/api/doctors', { params }).then((r) => r.data),
};

export const assistant = {
  // messages is [{ role: 'user' | 'assistant', content }]
  ask: (audience, messages, patientId) =>
    api.post(`/api/ai/${audience}`, { messages, patient_id: patientId }).then((r) => r.data),
};
