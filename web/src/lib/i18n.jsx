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
  overview: 'Home', appointments: 'Visits', records: 'My records',
  careTeam: 'My doctors', profile: 'My profile', patients: 'Patients',
  requests: 'Requests', users: 'Users', settings: 'Settings',
  notifications: 'Messages', consultations: 'Visits',

  // Actions
  signIn: 'Log in', signOut: 'Log out', signUp: 'Create account',
  save: 'Save changes', cancel: 'Cancel', edit: 'Edit', delete: 'Delete',
  approve: 'Allow', decline: 'Say no', confirm: 'Yes, continue', close: 'Close',
  search: 'Search', filter: 'Filter', retry: 'Try again', back: 'Back',
  viewAll: 'See all', book: 'Book a visit', copy: 'Copy', copied: 'Copied',

  // Auth
  welcomeBack: 'Welcome back', signInSub: 'Log in to see your health records.',
  createAccountTitle: 'Create your account', createAccountSub: 'It only takes about a minute.',
  email: 'Email address', password: 'Password', fullName: 'Full name',
  phone: 'Phone number', specialization: 'What you treat', hospital: 'Hospital or clinic',
  noAccount: 'First time here?', haveAccount: 'Already have an account?',
  iAmPatient: 'I am a patient', iAmDoctor: 'I am a doctor',
  patientRoleDesc: 'Book visits and keep my records',
  doctorRoleDesc: 'See patients and write notes',

  // Dashboard
  goodMorning: 'Good morning', goodAfternoon: 'Good afternoon', goodEvening: 'Good evening',
  healthId: 'My health ID', clinicianId: 'My doctor ID',
  upcoming: 'Coming up', recentActivity: 'Your last visits',
  quickActions: 'Quick links', pendingRequests: 'Waiting for you',
  diagnoses: 'Diagnoses', prescriptions: 'Medicines', completed: 'Finished',
  totalPatients: 'Patients', thisWeek: 'This week',

  // Empty states
  nothingHere: 'Nothing here yet',
  noAppointments: 'No visits booked yet',
  noRecords: 'No health records yet',
  noNotifications: 'No new messages',

  // Status
  pending: 'Waiting', accepted: 'Allowed', rejected: 'Not allowed',
  cancelled: 'Cancelled', active: 'Active', suspended: 'Blocked',

  language: 'Language',
};

const fr = {
  overview: 'Accueil', appointments: 'Visites', records: 'Mes dossiers',
  careTeam: 'Mes médecins', profile: 'Mon profil', patients: 'Patients',
  requests: 'Demandes', users: 'Utilisateurs', settings: 'Paramètres',
  notifications: 'Messages', consultations: 'Visites',

  signIn: 'Se connecter', signOut: 'Se déconnecter', signUp: 'Créer un compte',
  save: 'Enregistrer', cancel: 'Annuler', edit: 'Modifier', delete: 'Supprimer',
  approve: 'Autoriser', decline: 'Refuser', confirm: 'Oui, continuer', close: 'Fermer',
  search: 'Rechercher', filter: 'Filtrer', retry: 'Réessayer', back: 'Retour',
  viewAll: 'Voir tout', book: 'Prendre une visite', copy: 'Copier', copied: 'Copié',

  welcomeBack: 'Bon retour', signInSub: 'Connectez-vous pour voir vos dossiers.',
  createAccountTitle: 'Créez votre compte', createAccountSub: 'Cela prend environ une minute.',
  email: 'Adresse e-mail', password: 'Mot de passe', fullName: 'Nom complet',
  phone: 'Numéro de téléphone', specialization: 'Ce que vous soignez', hospital: 'Hôpital ou clinique',
  noAccount: 'Première fois ici ?', haveAccount: 'Vous avez déjà un compte ?',
  iAmPatient: 'Je suis un patient', iAmDoctor: 'Je suis un médecin',
  patientRoleDesc: 'Prendre des visites et garder mes dossiers',
  doctorRoleDesc: 'Voir des patients et écrire des notes',

  goodMorning: 'Bonjour', goodAfternoon: 'Bon après-midi', goodEvening: 'Bonsoir',
  healthId: 'Mon identifiant santé', clinicianId: 'Mon identifiant médecin',
  upcoming: 'À venir', recentActivity: 'Vos dernières visites',
  quickActions: 'Liens rapides', pendingRequests: 'En attente de vous',
  diagnoses: 'Diagnostics', prescriptions: 'Médicaments', completed: 'Terminées',
  totalPatients: 'Patients', thisWeek: 'Cette semaine',

  nothingHere: 'Rien pour le moment',
  noAppointments: 'Aucune visite prévue',
  noRecords: 'Aucun dossier de santé',
  noNotifications: 'Aucun nouveau message',

  pending: 'En attente', accepted: 'Autorisé', rejected: 'Refusé',
  cancelled: 'Annulée', active: 'Actif', suspended: 'Bloqué',

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
