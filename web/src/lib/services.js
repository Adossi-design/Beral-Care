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
  sendLicence: (file) => {
    const form = new FormData();
    form.append('licence', file);
    return api
      .post('/api/profile/licence', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
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
  recordAccess: () => api.get('/api/patient/record-access').then((r) => r.data),
  requestAccess: (doctorId, reason) =>
    api.post('/api/patient/consultation-requests', { doctor_id: doctorId, reason }).then((r) => r.data),
  decideAccess:  (id, decision) =>
    api.patch(`/api/patient/consultation-requests/${id}`, { decision }).then((r) => r.data),
  // decision is 'approved', 'denied', or 'stopped' to close the records again
  decideRecords: (id, decision) =>
    api.patch(`/api/patient/records-requests/${id}`, { decision }).then((r) => r.data),
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
  scan: (patientId) => api.get(`/api/doctor/scan/${encodeURIComponent(patientId)}`).then((r) => r.data),
  // Connecting comes first, seeing the health records is asked for after
  askConnect: (patientId, reason) =>
    api.post('/api/doctor/access-requests', { patient_id: patientId, reason }).then((r) => r.data),
  askRecords: (patientId, reason) =>
    api.post('/api/doctor/records-requests', { patient_id: patientId, reason }).then((r) => r.data),
};

export const people = {
  card: (id) => api.get(`/api/people/${id}`).then((r) => r.data),
};

export const reviews = {
  // Ratings and the reasons behind them are open to everyone, signed in or not
  forDoctor: (doctorId) => api.get(`/api/doctors/${doctorId}/reviews`).then((r) => r.data),
  save: ({ doctorId, rating, comment, evidence }) => {
    const form = new FormData();
    form.append('doctor_id', doctorId);
    form.append('rating', rating);
    form.append('comment', comment);
    if (evidence) form.append('evidence', evidence);
    return api
      .post('/api/reviews', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
  remove: (id) => api.delete(`/api/reviews/${id}`).then((r) => r.data),
  reply: (id, text) => api.post(`/api/reviews/${id}/reply`, { reply: text }).then((r) => r.data),
  // The attached file is behind the token, so it is fetched as a blob
  evidence: (id) => api.get(`/api/reviews/${id}/evidence`, { responseType: 'blob' }).then((r) => r.data),
};

export const admin = {
  stats: () => api.get('/api/admin/stats').then((r) => r.data),
  users: (role) => api.get('/api/admin/users', { params: role ? { role } : {} }).then((r) => r.data),
  user:  (id) => api.get(`/api/admin/users/${id}`).then((r) => r.data),
  remove:(id) => api.delete(`/api/admin/users/${id}`).then((r) => r.data),
  setSuspended: (id, suspended) =>
    api.patch(`/api/admin/users/${id}/suspend`, { suspended }).then((r) => r.data),
  reviews: (params) => api.get('/api/admin/reviews', { params }).then((r) => r.data),
  doctors: (status) => api.get('/api/admin/doctors', { params: status ? { status } : {} }).then((r) => r.data),
  decideDoctor: (id, status, note) =>
    api.patch('/api/admin/doctors/' + id + '/verification', { status, note }).then((r) => r.data),
  licenceUrl: (id) => '/api/admin/doctors/' + id + '/licence',
};

export const directory = {
  doctors: (params) => api.get('/api/doctors', { params }).then((r) => r.data),
};

export const reports = {
  submit: ({ reportedId, reason, explanation, evidence }) => {
    const form = new FormData();
    form.append('reported_id', reportedId);
    form.append('reason', reason);
    form.append('explanation', explanation);
    if (evidence) form.append('evidence', evidence);
    return api
      .post('/api/reports', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
  mine: () => api.get('/api/reports/mine').then((r) => r.data),
  // Evidence is behind the token, so it is fetched as a blob rather than
  // pointed at with a plain image URL.
  evidence: (id) => api.get(`/api/reports/${id}/evidence`, { responseType: 'blob' }).then((r) => r.data),
};

export const moderation = {
  list: (params) => api.get('/api/admin/reports', { params }).then((r) => r.data),
  detail: (id) => api.get(`/api/admin/reports/${id}`).then((r) => r.data),
  setStatus: (id, status) => api.patch(`/api/admin/reports/${id}/status`, { status }).then((r) => r.data),
  act: (id, payload) => api.post(`/api/admin/reports/${id}/action`, payload).then((r) => r.data),
  unblock: (id) => api.post(`/api/admin/reports/${id}/unblock`).then((r) => r.data),
};

export const notifications = {
  list: () => api.get('/api/notifications').then((r) => r.data),
  markRead: (id) => api.patch(`/api/notifications/${id}`).then((r) => r.data),
};

export const assistant = {
  // messages is [{ role: 'user' | 'assistant', content }]
  ask: (audience, messages, patientId) =>
    api.post(`/api/ai/${audience}`, { messages, patient_id: patientId }).then((r) => r.data),
};
