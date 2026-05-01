import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext(null);

const translations = {
  en: {
    // Auth
    welcomeBack: 'Welcome Back',
    signInToContinue: 'Sign in to continue',
    createAccount: 'Create Account',
    joinBeral Care: 'Join Beral Care',
    email: 'Email',
    password: 'Password',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    specialization: 'Specialization',
    hospital: 'Hospital',
    signIn: 'Sign In',
    createNewAccount: 'Create New Account',
    alreadyHaveAccount: 'Already have an account?',
    iAmA: 'I am a:',
    patient: 'Patient',
    doctor: 'Doctor',
    
    // Common
    dashboard: 'Dashboard',
    profile: 'Profile',
    appointments: 'Appointments',
    notifications: 'Notifications',
    logout: 'Logout',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    back: 'Back',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    view: 'View',
    suspend: 'Suspend',
    unsuspend: 'Unsuspend',
    
    // Doctor Dashboard
    goodDay: 'Good day',
    todaysAppointments: "Today's Appointments",
    quickActions: 'Quick Actions',
    myPatients: 'My Patients',
    createPatient: 'Create Patient',
    patientLookup: 'Patient Lookup',
    enterPatientId: 'Enter a Patient ID to view their records',
    noAppointmentsScheduled: 'No appointments scheduled',
    mustApproveAccess: 'Patient must approve access before records are visible',
    recentlyAccessedPatients: 'Recently Accessed Patients',
    search: 'Search',
    
    // Patient Dashboard
    myPatientId: 'My Patient ID',
    shareYourId: 'Share this ID with your doctor to grant them access to your records',
    copyId: 'Copy ID',
    showQR: 'Show QR',
    accessRequests: 'Access Requests',
    isRequestingAccess: 'is requesting access to your medical records',
    approve: 'Approve',
    deny: 'Deny',
    medicalHistorySummary: 'Medical History Summary',
    diagnoses: 'Diagnoses',
    prescriptions: 'Prescriptions',
    completed: 'Completed',
    noMedicalHistory: 'No medical history yet',
    bookAppointment: 'Book Appointment',
    myProfile: 'My Profile',
    upcomingAppointments: 'Upcoming Appointments',
    noUpcomingAppointments: 'No upcoming appointments',
    bookYourFirstAppointment: 'Book your first appointment',
    viewFullHistory: 'View full history →',
    
    // Profile
    editProfile: 'Edit Profile',
    viewProfile: 'View Profile',
    uploadImage: 'Upload Image',
    saveChanges: 'Save Changes',
    phone: 'Phone',
    memberSince: 'Member Since',
    readOnly: '(Read-only)',
    patientId: 'Patient ID',
    hospital: 'Hospital',
    
    // Admin
    users: 'Users',
    statistics: 'Statistics',
    systemSettings: 'System Settings',
    userManagement: 'User Management',
    systemOverview: 'System Overview',
    management: 'Management',
    totalPatients: 'Total Patients',
    totalDoctors: 'Total Doctors',
    consultations: 'Consultations',
    searchByNameOrEmail: 'Search by name or email...',
    deleteUserConfirm: 'Delete User',
    suspendUserConfirm: 'Suspend User',
    unsuspendUserConfirm: 'Unsuspend User',
    confirmDelete: 'Are you sure you want to delete this user?',
    confirmSuspend: 'Are you sure you want to suspend this user?',
    confirmUnsuspend: 'Are you sure you want to unsuspend this user?',
    userDeletedSuccessfully: 'User deleted successfully',
    userSuspendedSuccessfully: 'User suspended successfully',
    userUnsuspendedSuccessfully: 'User unsuspended successfully',
    failedToDelete: 'Failed to delete user',
    failedToSuspend: 'Failed to suspend user',
    noUsersFound: 'No users found',
    cannotDeleteOwnAccount: 'You cannot delete your own admin account',
    cannotSuspendOwnAccount: 'You cannot suspend your own admin account',
    viewFilterSuspendDelete: 'View, filter, suspend or delete users',
    configureSystemWide: 'Configure system-wide options',
    privacyNotice: 'Patient medical records are not accessible from this panel. Privacy is enforced at the system level.',
    
    // Appointments
    bookNewAppointment: 'Book New Appointment',
    selectDoctor: 'Select Doctor',
    date: 'Date',
    notes: 'Notes',
    describeYourConcern: 'Describe your concern...',
    noAppointmentsYet: 'No appointments yet',
    noDoctorsAvailable: 'No doctors available',
    
    // Validation
    required: 'Required',
    allFieldsRequired: 'All fields are required',
    doctorsMustProvide: 'Doctors must provide specialization and hospital',
    fullNameRequired: 'Full name is required',
    
    // Messages
    profileUpdatedSuccessfully: 'Profile updated successfully',
    imageUploadedSuccessfully: 'Image uploaded successfully',
    failedToLoadProfile: 'Failed to load profile',
    failedToUpdateProfile: 'Failed to update profile',
    failedToUploadImage: 'Failed to upload image',
    failedToPickImage: 'Failed to pick image',
    patientNotFound: 'Patient not found',
    
    // Buttons
    seeAll: 'See all',
    copied: 'Copied!',
    patientIdCopied: 'Patient ID copied to clipboard',
  },
  fr: {
    // Auth
    welcomeBack: 'Bon Retour',
    signInToContinue: 'Connectez-vous pour continuer',
    createAccount: 'Créer un Compte',
    joinBeral Care: 'Rejoignez Beral Care',
    email: 'Email',
    password: 'Mot de passe',
    fullName: 'Nom Complet',
    phoneNumber: 'Numéro de Téléphone',
    specialization: 'Spécialisation',
    hospital: 'Hôpital',
    signIn: 'Se Connecter',
    createNewAccount: 'Créer un Nouveau Compte',
    alreadyHaveAccount: 'Vous avez déjà un compte?',
    iAmA: 'Je suis:',
    patient: 'Patient',
    doctor: 'Médecin',
    
    // Common
    dashboard: 'Tableau de Bord',
    profile: 'Profil',
    appointments: 'Rendez-vous',
    notifications: 'Notifications',
    logout: 'Déconnexion',
    save: 'Enregistrer',
    cancel: 'Annuler',
    edit: 'Modifier',
    delete: 'Supprimer',
    back: 'Retour',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    view: 'Voir',
    suspend: 'Suspendre',
    unsuspend: 'Réactiver',
    
    // Doctor Dashboard
    goodDay: 'Bon jour',
    todaysAppointments: 'Rendez-vous d\'Aujourd\'hui',
    quickActions: 'Actions Rapides',
    myPatients: 'Mes Patients',
    createPatient: 'Créer un Patient',
    patientLookup: 'Recherche de Patient',
    enterPatientId: 'Entrez un ID Patient pour voir ses dossiers',
    noAppointmentsScheduled: 'Aucun rendez-vous prévu',
    mustApproveAccess: 'Le patient doit approuver l\'accès avant que les dossiers soient visibles',
    recentlyAccessedPatients: 'Patients Récemment Consultés',
    search: 'Rechercher',
    
    // Patient Dashboard
    myPatientId: 'Mon ID Patient',
    shareYourId: 'Partagez cet ID avec votre médecin pour lui accorder l\'accès à vos dossiers',
    copyId: 'Copier l\'ID',
    showQR: 'Afficher QR',
    accessRequests: 'Demandes d\'Accès',
    isRequestingAccess: 'demande l\'accès à vos dossiers médicaux',
    approve: 'Approuver',
    deny: 'Refuser',
    medicalHistorySummary: 'Résumé de l\'Historique Médical',
    diagnoses: 'Diagnostics',
    prescriptions: 'Ordonnances',
    completed: 'Complété',
    noMedicalHistory: 'Aucun historique médical',
    bookAppointment: 'Prendre Rendez-vous',
    myProfile: 'Mon Profil',
    upcomingAppointments: 'Rendez-vous à Venir',
    noUpcomingAppointments: 'Aucun rendez-vous à venir',
    bookYourFirstAppointment: 'Réservez votre premier rendez-vous',
    viewFullHistory: 'Voir l\'historique complet →',
    
    // Profile
    editProfile: 'Modifier le Profil',
    viewProfile: 'Voir le Profil',
    uploadImage: 'Télécharger une Image',
    saveChanges: 'Enregistrer les Modifications',
    phone: 'Téléphone',
    memberSince: 'Membre Depuis',
    readOnly: '(Lecture seule)',
    patientId: 'ID Patient',
    hospital: 'Hôpital',
    
    // Admin
    users: 'Utilisateurs',
    statistics: 'Statistiques',
    systemSettings: 'Paramètres Système',
    userManagement: 'Gestion des Utilisateurs',
    systemOverview: 'Aperçu du Système',
    management: 'Gestion',
    totalPatients: 'Total Patients',
    totalDoctors: 'Total Médecins',
    consultations: 'Consultations',
    searchByNameOrEmail: 'Rechercher par nom ou email...',
    deleteUserConfirm: 'Supprimer l\'Utilisateur',
    suspendUserConfirm: 'Suspendre l\'Utilisateur',
    unsuspendUserConfirm: 'Réactiver l\'Utilisateur',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer cet utilisateur?',
    confirmSuspend: 'Êtes-vous sûr de vouloir suspendre cet utilisateur?',
    confirmUnsuspend: 'Êtes-vous sûr de vouloir réactiver cet utilisateur?',
    userDeletedSuccessfully: 'Utilisateur supprimé avec succès',
    userSuspendedSuccessfully: 'Utilisateur suspendu avec succès',
    userUnsuspendedSuccessfully: 'Utilisateur réactivé avec succès',
    failedToDelete: 'Échec de la suppression de l\'utilisateur',
    failedToSuspend: 'Échec de la suspension de l\'utilisateur',
    noUsersFound: 'Aucun utilisateur trouvé',
    cannotDeleteOwnAccount: 'Vous ne pouvez pas supprimer votre propre compte administrateur',
    cannotSuspendOwnAccount: 'Vous ne pouvez pas suspendre votre propre compte administrateur',
    viewFilterSuspendDelete: 'Voir, filtrer, suspendre ou supprimer des utilisateurs',
    configureSystemWide: 'Configurer les options à l\'échelle du système',
    privacyNotice: 'Les dossiers médicaux des patients ne sont pas accessibles à partir de ce panneau. La confidentialité est appliquée au niveau du système.',
    
    // Appointments
    bookNewAppointment: 'Réserver un Nouveau Rendez-vous',
    selectDoctor: 'Sélectionner un Médecin',
    date: 'Date',
    notes: 'Notes',
    describeYourConcern: 'Décrivez votre préoccupation...',
    noAppointmentsYet: 'Aucun rendez-vous pour le moment',
    noDoctorsAvailable: 'Aucun médecin disponible',
    
    // Validation
    required: 'Requis',
    allFieldsRequired: 'Tous les champs sont requis',
    doctorsMustProvide: 'Les médecins doivent fournir la spécialisation et l\'hôpital',
    fullNameRequired: 'Le nom complet est requis',
    
    // Messages
    profileUpdatedSuccessfully: 'Profil mis à jour avec succès',
    imageUploadedSuccessfully: 'Image téléchargée avec succès',
    failedToLoadProfile: 'Échec du chargement du profil',
    failedToUpdateProfile: 'Échec de la mise à jour du profil',
    failedToUploadImage: 'Échec du téléchargement de l\'image',
    failedToPickImage: 'Échec de la sélection de l\'image',
    patientNotFound: 'Patient non trouvé',
    
    // Buttons
    seeAll: 'Voir tout',
    copied: 'Copié!',
    patientIdCopied: 'ID Patient copié dans le presse-papiers',
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem('language');
        if (saved) setLanguage(saved);
      } catch (e) {
        console.error('Language load error:', e);
      }
    };
    loadLanguage();
  }, []);

  const changeLanguage = async (lang) => {
    try {
      await AsyncStorage.setItem('language', lang);
      setLanguage(lang);
    } catch (e) {
      console.error('Language save error:', e);
    }
  };

  const t = (key) => translations[language][key] || key;

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
