/**
 * client-services/index.js
 * Centralized exports for all API services
 * 
 * Usage:
 * import { api, authAPI, patientConsultationAPI, doctorConsultationAPI } from '@client-services';
 */

export { default as api } from './api';
export { default as authAPI } from './authService';
export { patientConsultationAPI, doctorConsultationAPI } from './consultationService';
export { default as doctorAPI } from './doctorService';
export { default as patientAPI } from './patientService';
