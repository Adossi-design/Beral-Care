import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

// English and French, since French is an official language across much of West
// and Central Africa. Missing keys fall back to English rather than a raw key.

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

  // Welcome page
  'nav.what': 'What you get',
  'nav.ways': 'Ways to use it',
  'nav.why': 'Why we built this',
  'nav.home': 'Home',

  'hero.badge': 'Your records. Your choice.',
  'hero.titleA': 'Keep your health history with you,',
  'hero.titleB': 'wherever you go',
  'hero.lede': 'Beral Care helps you keep your medical history in one place, share it with doctors you choose, book care when you need it, and get simple explanations from a health assistant while you wait to speak with a doctor.',
  'hero.cta': 'Create a free account',

  'b1.title': 'Keep your health history',
  'b1.body': 'Your visits, prescriptions, and important medical information stay connected to your health ID.',
  'b2.title': 'Choose who can see your records',
  'b2.body': 'A doctor can only open your file after you approve them.',
  'b3.title': 'Get support while you wait',
  'b3.body': 'HealthGuide explains health information in simple words while you wait to speak with a doctor.',

  'features.title': 'What you can do here',
  'features.lede1': 'This started with a simple problem. When you are sick and need to know what happened during your last treatment, that information is often held by one hospital or one doctor, and if you cannot reach them, you cannot reach it either. Everything below grew out of trying to fix that.',
  'features.readStory': 'Read the full story',

  'f1.title': 'Your own health ID',
  'f1.body': 'You get one health ID that is yours for life. Your visits, diagnoses, and medicines stay with you, even when you change clinic or move to a new town.',
  'f2.title': 'You choose who can see your records',
  'f2.body': 'A doctor must ask before they can open your file. You say yes or no. Until you say yes, nobody can read it.',
  'f3.title': 'Help for doctors during a visit',
  'f3.body': 'MedAssist helps doctors check possible causes, spot drug reactions, and follow WHO Africa treatment steps, using medicines that are available nearby.',
  'f4.title': 'Health answers in simple words',
  'f4.body': 'HealthGuide explains your diagnosis and your medicine in words that are easy to follow. For anything serious, it tells you to speak with your doctor.',
  'f5.title': 'Scan instead of writing',
  'f5.body': 'Show your code and the doctor opens your file at once. No spelling your name, no long forms, no repeated files for the same person.',
  'f6.title': 'Works with or without internet',
  'f6.body': 'Use the full website on any phone or computer. If you have no internet, you can still use the main services by dialling a short code.',

  'channels.title': 'Three ways to use it, one health record',
  'channels.lede': 'It does not matter what phone you have. New or old, you reach the same health record and get the same care.',
  'c1.title': 'On a computer',
  'c1.body': 'The full website on a laptop or tablet. Nothing to download or install.',
  'c2.title': 'On a smartphone',
  'c2.body': 'The same website, made to fit a small screen. You can add it to your home screen.',
  'c3.title': 'On a basic phone',
  'c3.body': 'No internet needed. Dial a short code to sign up, log in, ask for a visit, and check your last visits.',

  'cta.title': 'Ready to start?',
  'cta.lede': 'Signing up takes about one minute and costs nothing. You get your health ID straight away, and you can use it at any clinic on Beral Care.',
  'footer.tagline': 'Health care and health records for everyone',
  'footer.built': 'Built by Adossi Fred William',
  'footer.privacy': 'Privacy',
  'footer.terms': 'Terms of use',

  // About page
  'about.title': 'Why this exists',
  'about.role': 'Software engineer and machine learning engineer',
  'about.place': 'African Leadership University, Rwanda',
  'about.lede': 'Beral Care started with something that happened to me, not with a list of technologies I wanted to try.',
  'about.p1': 'I was being treated at Kanombe Military Hospital here in Rwanda, and I needed information about my earlier treatment. The doctor who had been treating me was attending meetings, and I was told she would not be available for several weeks, until the following month.',
  'about.p2': 'Her being unavailable was not really the problem. I was sick at the time, and what troubled me was that I could not get hold of my own medical information so that I could go and look for help somewhere else. I waited, still in pain, until she came back and could tell me what I needed to know.',
  'about.p3': 'Afterwards I kept thinking about what would have happened if my condition had been more serious, or if I had urgently needed a different doctor who knew nothing about what had already happened to me.',
  'about.p4': 'There was a second version of the same problem. I have been given medical papers before and lost some of them later, and once enough time passes it becomes hard to remember what condition you had, what medicine you were given, or what the doctor told you. When I looked around, I saw relatives, siblings, cousins, and other people close to me running into the same thing. That is when it stopped being a personal inconvenience and started looking like a problem I could build something around.',

  'about.h1': 'What I wanted to build first',
  'about.p5': 'The first idea was much smaller than what exists today. I wanted people to have one place to keep their medical history, so that someone could look back several years later and still know what happened during a visit, what was diagnosed, what medicine they were given, and which doctor treated them. Your health information should not become useless because a piece of paper went missing.',
  'about.p6': 'That is still the centre of the platform. Everything else grew around it. You get a health ID that stays yours, your records stay with you rather than with one building, and you can print them, because not every clinic will use this platform and you should still be able to take something useful with you.',

  'about.h2': 'You decide who reads it',
  'about.p7': 'Putting health information online creates a problem that paper never had. Easier to reach should not mean available to everyone, so a doctor cannot simply look up your health ID and start reading. They ask, you decide, and you can see who has access and stop sharing at any time. The check happens on the server, so it is not something the website can be talked out of.',
  'about.p8': 'The same rule applies to the AI. MedAssist only receives a patient history after the server has confirmed that patient approved that doctor, so the assistant cannot become a way around your decision.',

  'about.h3': 'Reaching people without smartphones',
  'about.p9': 'If this only worked on a modern phone with good internet, it would leave out some of the people I most want it to help. That is why the main services also work over USSD, using a short code from a basic phone with no internet at all, reading and writing the same records as the website. Accessibility should be visible in how the system is built, not just mentioned somewhere and then forgotten.',

  'about.h4': 'Understanding, not just access',
  'about.p10': 'The assistants came later, once the records themselves worked. They answer a question that only appears after the first problem is solved: what happens when you can finally reach your information but still do not understand it. HealthGuide explains your diagnosis and your medicine in plain words and helps you think of questions for your next visit. MedAssist supports doctors during a consultation.',
  'about.p11': 'Neither is a doctor. HealthGuide will not diagnose you, will not tell you to change your medicine, and sends anything that sounds serious back to a qualified professional. For mental health it can listen and offer general support, but it is not a psychologist, a psychiatrist, or an emergency service, and it will say so.',

  'about.h5': 'Where this actually stands',
  'about.p12': 'This is a prototype built by one student, and I would rather be straight about that. Nobody is using it for real care. The accounts in it are demonstration accounts. No health professional has reviewed it, it has not been through any privacy or regulatory assessment, and it is not ready to hold real patient information.',
  'about.p13': 'Before something like this could responsibly serve real people, it would need a proper security review, doctors judging whether the clinical parts are useful and safe, real patients testing whether it actually makes sense to them, and research to check whether the assumptions behind it match what people experience. I have not solved healthcare. I have an early answer to a problem I ran into myself, and a much clearer view of what would need to happen next.',
  'about.p14': 'The idea came from my own experience in Rwanda, and I am interested in whether it is useful more widely across Africa, particularly where distance, cost, connectivity, or the availability of specialists make care harder to reach. Health systems differ a great deal from one country to another, so I am not claiming to know how they all work.',
  'about.back': 'Back to home',
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

  // Page d'accueil
  'nav.what': 'Ce que vous obtenez',
  'nav.ways': 'Comment l’utiliser',
  'nav.why': 'Pourquoi nous l’avons créé',
  'nav.home': 'Accueil',

  'hero.badge': 'Vos dossiers. Votre choix.',
  'hero.titleA': 'Gardez votre historique de santé avec vous,',
  'hero.titleB': 'partout où vous allez',
  'hero.lede': 'Beral Care vous aide à garder votre historique médical au même endroit, à le partager avec les médecins que vous choisissez, à prendre rendez-vous quand vous en avez besoin, et à obtenir des explications simples d’un assistant santé en attendant de parler à un médecin.',
  'hero.cta': 'Créer un compte gratuit',

  'b1.title': 'Gardez votre historique de santé',
  'b1.body': 'Vos visites, vos ordonnances et vos informations médicales importantes restent liées à votre identifiant santé.',
  'b2.title': 'Choisissez qui voit vos dossiers',
  'b2.body': 'Un médecin ne peut ouvrir votre dossier qu’après votre autorisation.',
  'b3.title': 'Du soutien pendant l’attente',
  'b3.body': 'HealthGuide explique les informations de santé avec des mots simples en attendant que vous puissiez parler à un médecin.',

  'features.title': 'Ce que vous pouvez faire ici',
  'features.lede1': 'Tout est parti d’un problème simple. Quand vous êtes malade et que vous avez besoin de savoir ce qui s’est passé lors de votre dernier traitement, cette information se trouve souvent dans un seul hôpital ou chez un seul médecin, et si vous ne pouvez pas les joindre, vous ne pouvez pas y accéder non plus. Tout ce qui suit est né de la volonté de régler cela.',
  'features.readStory': 'Lire l’histoire complète',

  'f1.title': 'Votre propre identifiant santé',
  'f1.body': 'Vous recevez un identifiant santé qui reste le vôtre à vie. Vos visites, vos diagnostics et vos médicaments restent avec vous, même si vous changez de clinique ou déménagez.',
  'f2.title': 'Vous choisissez qui voit vos dossiers',
  'f2.body': 'Un médecin doit demander avant de pouvoir ouvrir votre dossier. Vous dites oui ou non. Tant que vous n’avez pas dit oui, personne ne peut le lire.',
  'f3.title': 'De l’aide pour les médecins pendant la visite',
  'f3.body': 'MedAssist aide les médecins à examiner les causes possibles, à repérer les interactions médicamenteuses et à suivre les recommandations de l’OMS Afrique, avec les médicaments disponibles sur place.',
  'f4.title': 'Des réponses santé en mots simples',
  'f4.body': 'HealthGuide explique votre diagnostic et vos médicaments avec des mots faciles à comprendre. Pour tout ce qui est sérieux, il vous dit d’en parler à votre médecin.',
  'f5.title': 'Scanner au lieu d’écrire',
  'f5.body': 'Montrez votre code et le médecin ouvre votre dossier tout de suite. Pas besoin d’épeler votre nom, pas de longs formulaires, pas de dossiers en double pour la même personne.',
  'f6.title': 'Fonctionne avec ou sans internet',
  'f6.body': 'Utilisez le site complet sur n’importe quel téléphone ou ordinateur. Si vous n’avez pas internet, vous pouvez utiliser les services principaux en composant un code court.',

  'channels.title': 'Trois façons de l’utiliser, un seul dossier de santé',
  'channels.lede': 'Peu importe le téléphone que vous avez. Neuf ou ancien, vous accédez au même dossier de santé et recevez les mêmes soins.',
  'c1.title': 'Sur un ordinateur',
  'c1.body': 'Le site complet sur un ordinateur portable ou une tablette. Rien à télécharger ni à installer.',
  'c2.title': 'Sur un smartphone',
  'c2.body': 'Le même site, adapté à un petit écran. Vous pouvez l’ajouter à votre écran d’accueil.',
  'c3.title': 'Sur un téléphone simple',
  'c3.body': 'Pas besoin d’internet. Composez un code court pour vous inscrire, vous connecter, demander une visite et consulter vos dernières visites.',

  'cta.title': 'Prêt à commencer ?',
  'cta.lede': 'L’inscription prend environ une minute et ne coûte rien. Vous recevez votre identifiant santé immédiatement, et vous pouvez l’utiliser dans toute clinique sur Beral Care.',
  'footer.tagline': 'Des soins et des dossiers de santé pour tous',
  'footer.built': 'Créé par Adossi Fred William',
  'footer.privacy': 'Confidentialité',
  'footer.terms': 'Conditions d’utilisation',

  // Page à propos
  'about.title': 'Pourquoi ce projet existe',
  'about.role': 'Ingénieur logiciel et ingénieur en apprentissage automatique',
  'about.place': 'African Leadership University, Rwanda',
  'about.lede': 'Beral Care est né de quelque chose qui m’est arrivé, et non d’une liste de technologies que je voulais essayer.',
  'about.p1': 'J’étais soigné à l’hôpital militaire de Kanombe, ici au Rwanda, et j’avais besoin d’informations sur mon traitement précédent. La médecin qui me suivait était en réunion, et on m’a dit qu’elle ne serait pas disponible avant plusieurs semaines, jusqu’au mois suivant.',
  'about.p2': 'Son absence n’était pas vraiment le problème. J’étais malade à ce moment-là, et ce qui me troublait, c’est que je ne pouvais pas obtenir mes propres informations médicales pour aller chercher de l’aide ailleurs. J’ai attendu, toujours avec la douleur, jusqu’à son retour, pour qu’elle puisse enfin me dire ce que j’avais besoin de savoir.',
  'about.p3': 'Ensuite, je n’ai pas arrêté de penser à ce qui serait arrivé si mon état avait été plus grave, ou si j’avais eu besoin en urgence d’un autre médecin qui ne savait rien de ce qui m’était déjà arrivé.',
  'about.p4': 'Il existait une deuxième version du même problème. On m’a déjà remis des documents médicaux et j’en ai perdu certains par la suite. Quand assez de temps passe, il devient difficile de se rappeler quelle était la maladie, quel médicament on vous a donné, ou ce que le médecin vous a dit. En regardant autour de moi, j’ai vu des proches, des frères et sœurs, des cousins et d’autres personnes vivre exactement la même chose. C’est là que cela a cessé d’être un simple désagrément personnel pour devenir un problème autour duquel je pouvais construire quelque chose.',

  'about.h1': 'Ce que je voulais construire au départ',
  'about.p5': 'La première idée était bien plus modeste que ce qui existe aujourd’hui. Je voulais que les gens aient un seul endroit pour conserver leur historique médical, afin que quelqu’un puisse revenir plusieurs années en arrière et savoir encore ce qui s’était passé lors d’une visite, quel diagnostic avait été posé, quel médicament lui avait été donné et quel médecin l’avait soigné. Vos informations de santé ne devraient pas devenir inutiles parce qu’un papier a été perdu.',
  'about.p6': 'Cela reste le cœur de la plateforme. Tout le reste s’est construit autour. Vous recevez un identifiant santé qui reste le vôtre, vos dossiers vous suivent au lieu de rester dans un seul bâtiment, et vous pouvez les imprimer, parce que toutes les cliniques n’utiliseront pas cette plateforme et vous devez quand même pouvoir emporter quelque chose d’utile.',

  'about.h2': 'C’est vous qui décidez qui peut les lire',
  'about.p7': 'Mettre des informations de santé en ligne crée un problème que le papier n’avait pas. Plus accessible ne doit pas vouloir dire accessible à tout le monde. Un médecin ne peut donc pas simplement chercher votre identifiant santé et commencer à lire. Il demande, vous décidez, et vous pouvez voir qui a accès et arrêter le partage à tout moment. La vérification se fait sur le serveur, ce n’est donc pas quelque chose que le site peut contourner.',
  'about.p8': 'La même règle s’applique à l’IA. MedAssist ne reçoit l’historique d’un patient qu’après que le serveur a confirmé que ce patient a autorisé ce médecin. L’assistant ne peut donc pas devenir un moyen de contourner votre décision.',

  'about.h3': 'Rejoindre les personnes sans smartphone',
  'about.p9': 'Si cela ne fonctionnait que sur un téléphone moderne avec une bonne connexion, cela exclurait une partie des personnes que je veux le plus aider. C’est pourquoi les services principaux fonctionnent aussi par USSD, avec un code court depuis un téléphone simple et sans aucune connexion internet, en lisant et en écrivant dans les mêmes dossiers que le site. L’accessibilité doit se voir dans la façon dont le système est construit, et pas seulement être mentionnée quelque part puis oubliée.',

  'about.h4': 'Comprendre, et pas seulement accéder',
  'about.p10': 'Les assistants sont arrivés plus tard, une fois que les dossiers eux-mêmes fonctionnaient. Ils répondent à une question qui n’apparaît qu’après avoir résolu le premier problème : que se passe-t-il quand vous pouvez enfin accéder à vos informations mais que vous ne les comprenez toujours pas. HealthGuide explique votre diagnostic et vos médicaments avec des mots simples et vous aide à préparer des questions pour votre prochaine visite. MedAssist accompagne les médecins pendant la consultation.',
  'about.p11': 'Ni l’un ni l’autre n’est un médecin. HealthGuide ne vous donnera pas de diagnostic, ne vous dira pas de changer vos médicaments, et renvoie tout ce qui semble sérieux vers un professionnel qualifié. Pour la santé mentale, il peut écouter et offrir un soutien général, mais il n’est ni psychologue, ni psychiatre, ni service d’urgence, et il vous le dira.',

  'about.h5': 'Où en est réellement ce projet',
  'about.p12': 'Il s’agit d’un prototype réalisé par un seul étudiant, et je préfère être clair là-dessus. Personne ne l’utilise pour de vrais soins. Les comptes qu’il contient sont des comptes de démonstration. Aucun professionnel de santé ne l’a examiné, il n’a fait l’objet d’aucune évaluation de confidentialité ou de conformité, et il n’est pas prêt à contenir de vraies informations médicales.',
  'about.p13': 'Avant qu’un projet comme celui-ci puisse servir de vraies personnes de manière responsable, il faudrait un véritable audit de sécurité, des médecins pour juger si les parties cliniques sont utiles et sûres, de vrais patients pour tester si tout cela a du sens pour eux, et des recherches pour vérifier si les hypothèses de départ correspondent à ce que les gens vivent réellement. Je n’ai pas résolu le problème de la santé. J’ai une première réponse à un problème que j’ai moi-même rencontré, et une vision beaucoup plus claire de ce qu’il faudrait faire ensuite.',
  'about.p14': 'L’idée est née de ma propre expérience au Rwanda, et je cherche à savoir si elle peut être utile plus largement en Afrique, en particulier là où la distance, le coût, la connectivité ou la disponibilité des spécialistes rendent les soins plus difficiles d’accès. Les systèmes de santé diffèrent beaucoup d’un pays à l’autre, je ne prétends donc pas savoir comment ils fonctionnent tous.',
  'about.back': 'Retour à l’accueil',
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
