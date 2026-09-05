import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

/**
 * Localisation.
 *
 * English and French, since French is an official language across much of West
 * and Central Africa. Missing French keys fall back to English rather than
 * rendering a raw key, so a partial translation degrades gracefully.
 */

const en = {
  // Navigation
  overview: 'Overview', appointments: 'Appointments', records: 'Records',
  careTeam: 'Care Team', profile: 'Profile', patients: 'Patients',
  requests: 'Requests', users: 'Users', settings: 'Settings',
  notifications: 'Notifications', consultations: 'Consultations',

  // Actions
  signIn: 'Sign in', signOut: 'Sign out', signUp: 'Create account',
  save: 'Save changes', cancel: 'Cancel', edit: 'Edit', delete: 'Delete',
  approve: 'Approve', decline: 'Decline', confirm: 'Confirm', close: 'Close',
  search: 'Search', filter: 'Filter', retry: 'Try again', back: 'Back',
  viewAll: 'View all', book: 'Book appointment', copy: 'Copy', copied: 'Copied',

  // Auth
  welcomeBack: 'Welcome back', signInSub: 'Sign in to your Beral Care account.',
  createAccountTitle: 'Create your account', createAccountSub: 'Join Beral Care in under a minute.',
  email: 'Email address', password: 'Password', fullName: 'Full name',
  phone: 'Phone number', specialization: 'Specialisation', hospital: 'Hospital or clinic',
  noAccount: 'New to Beral Care?', haveAccount: 'Already have an account?',
  iAmPatient: 'I am a patient', iAmDoctor: 'I am a clinician',
  patientRoleDesc: 'Book care and hold your records',
  doctorRoleDesc: 'Treat patients and write consultations',

  // Dashboard
  goodMorning: 'Good morning', goodAfternoon: 'Good afternoon', goodEvening: 'Good evening',
  healthId: 'Health ID', clinicianId: 'Clinician ID',
  upcoming: 'Upcoming', recentActivity: 'Recent activity',
  quickActions: 'Quick actions', pendingRequests: 'Pending requests',
  diagnoses: 'Diagnoses', prescriptions: 'Prescriptions', completed: 'Completed',
  totalPatients: 'Patients', thisWeek: 'This week',

  // Empty states
  nothingHere: 'Nothing here yet',
  noAppointments: 'No appointments scheduled',
  noRecords: 'No medical records yet',
  noNotifications: 'You are all caught up',

  // Status
  pending: 'Pending', accepted: 'Accepted', rejected: 'Declined',
  cancelled: 'Cancelled', active: 'Active', suspended: 'Suspended',

  language: 'Language',
};

const fr = {
  overview: 'Aperçu', appointments: 'Rendez-vous', records: 'Dossiers',
  careTeam: 'Équipe médicale', profile: 'Profil', patients: 'Patients',
  requests: 'Demandes', users: 'Utilisateurs', settings: 'Paramètres',
  notifications: 'Notifications', consultations: 'Consultations',

  signIn: 'Se connecter', signOut: 'Se déconnecter', signUp: 'Créer un compte',
  save: 'Enregistrer', cancel: 'Annuler', edit: 'Modifier', delete: 'Supprimer',
  approve: 'Approuver', decline: 'Refuser', confirm: 'Confirmer', close: 'Fermer',
  search: 'Rechercher', filter: 'Filtrer', retry: 'Réessayer', back: 'Retour',
  viewAll: 'Voir tout', book: 'Prendre rendez-vous', copy: 'Copier', copied: 'Copié',

  welcomeBack: 'Bon retour', signInSub: 'Connectez-vous à votre compte Beral Care.',
  createAccountTitle: 'Créez votre compte', createAccountSub: 'Rejoignez Beral Care en moins d’une minute.',
  email: 'Adresse e-mail', password: 'Mot de passe', fullName: 'Nom complet',
  phone: 'Numéro de téléphone', specialization: 'Spécialisation', hospital: 'Hôpital ou clinique',
  noAccount: 'Nouveau sur Beral Care ?', haveAccount: 'Vous avez déjà un compte ?',
  iAmPatient: 'Je suis un patient', iAmDoctor: 'Je suis un clinicien',
  patientRoleDesc: 'Consultez et gardez vos dossiers',
  doctorRoleDesc: 'Soignez et rédigez des consultations',

  goodMorning: 'Bonjour', goodAfternoon: 'Bon après-midi', goodEvening: 'Bonsoir',
  healthId: 'Identifiant santé', clinicianId: 'Identifiant clinicien',
  upcoming: 'À venir', recentActivity: 'Activité récente',
  quickActions: 'Actions rapides', pendingRequests: 'Demandes en attente',
  diagnoses: 'Diagnostics', prescriptions: 'Ordonnances', completed: 'Terminées',
  totalPatients: 'Patients', thisWeek: 'Cette semaine',

  nothingHere: 'Rien pour le moment',
  noAppointments: 'Aucun rendez-vous prévu',
  noRecords: 'Aucun dossier médical',
  noNotifications: 'Vous êtes à jour',

  pending: 'En attente', accepted: 'Acceptée', rejected: 'Refusée',
  cancelled: 'Annulée', active: 'Actif', suspended: 'Suspendu',

  language: 'Langue',
};

const dictionaries = { en, fr };
const STORAGE_KEY = 'bc.lang';

const I18nContext = createContext({ lang: 'en', t: (k) => k, setLang: () => {} });

export const useI18n = () => useContext(I18nContext);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || 'en'; } catch { return 'en'; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key, fallback) => dictionaries[lang]?.[key] ?? en[key] ?? fallback ?? key,
    [lang],
  );

  const value = useMemo(
    () => ({ lang, t, setLang, toggle: () => setLang((l) => (l === 'en' ? 'fr' : 'en')) }),
    [lang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
