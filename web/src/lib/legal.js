/**
 * The privacy notice and the terms of use, in English and French.
 *
 * They live here rather than in i18n.jsx because they are long, they change on
 * their own schedule, and they are only loaded by the two pages that show them.
 * Each document is a list of blocks: h for a heading, p for a paragraph, li for
 * a point in a list.
 */

// The university address is the one read every day, so it comes first. The
// second one is here because a student address stops working after graduation,
// and a privacy notice has to stay reachable for longer than a degree lasts.
export const CONTACT = 'f.adossi@alustudent.com';
export const CONTACT_ALT = 'adossifredwilliam09@gmail.com';
export const UPDATED = '2026-09-07';

const h = (x) => ({ kind: 'h', x });
const p = (x) => ({ kind: 'p', x });
const li = (x) => ({ kind: 'li', x });

const privacyEn = [
  p('Beral Care holds health information, which is about the most private thing a person has. This page says plainly what is kept, who can see it, and how to have it removed. It is written to be read, not to protect anyone from a complaint.'),

  h('Who is responsible'),
  p('Beral Care is built and run by one person, Adossi Fred William, a student at the African Leadership University in Kigali, Rwanda. There is no company behind it and no team. That means one person decides what happens to your information, and one person answers for it.'),
  p(`If you have a question, a worry, or a request about your information, write to ${CONTACT}. It is read by the same person who runs the service. ${CONTACT_ALT} reaches the same person, and it is the one to use if the university address ever stops working.`),

  h('What is kept'),
  li('Your name, email address, phone number, and the photo you upload, if you upload one.'),
  li('Your health ID, which is generated when you register and identifies you to a doctor without giving away your name.'),
  li('For doctors: what you treat, where you work, your licence number, and the licence document you upload.'),
  li('Your visits, the notes a doctor writes about them, prescriptions, and anything you upload as part of a report or a rating.'),
  li('Your messages, your notifications, and a record of which doctor opened your file and when.'),
  li('Basic technical information a web server records, such as the time of a request and the address it came from.'),

  h('Who can see your health records'),
  p('No doctor can see anything about you until you say yes, and saying yes happens in two separate steps.'),
  p('The first step is connecting. When a doctor scans your code, or you accept a request, that doctor can see your profile: your name, your health ID, your age, your phone number, and where you are. That is all. Connecting does not open your health records.'),
  p('The second step is your records. A doctor has to ask again, separately, to read what happened before. Until you allow that, a doctor can only read the notes they wrote themselves. Notes written by other doctors stay closed to them. When you allow it, they see your past visits, and you can withdraw that at any time from the My doctors page.'),
  p('Every time a doctor opens your file it is written down, and you can read that list yourself on the Record access page. Nothing is opened quietly.'),

  h('What the administrator can see'),
  p('The administrator can see accounts, reports, ratings, and the documents attached to them. The administrator cannot read your health records, your diagnoses, or your prescriptions. That was a deliberate choice, and it is enforced in the code rather than by policy alone.'),

  h('Ratings are public'),
  p('When you rate a doctor, the star rating and your written reason are shown on that doctor\'s profile to anyone looking for care. Your name is not shown next to it. A file you attach to a rating is not public: only you and the administrator can open it. Please write your reason knowing that other patients will read it.'),

  h('The health assistants'),
  p('HealthGuide and MedAssist answer general health questions. What you type to them is sent to Google, which provides the model that writes the answer. Do not type anything into them you would not want to leave Beral Care. They are not doctors, they do not diagnose, and they are not part of your health record.'),

  h('Where your information is kept'),
  p('Account and health information is stored in a managed database hosted outside Rwanda, and files you upload are stored with a file hosting provider. Documents that should stay private, such as a licence, a report attachment, or a rating attachment, are stored so that they cannot be opened by a link alone. They are only served after the server has checked who is asking.'),
  p('Traffic to and from the site is encrypted. Passwords are stored hashed, which means the service never holds the password you typed.'),

  h('Closing your account'),
  p('You can close your account yourself, from your profile. You are asked to say why, in your own words. As soon as you ask, the account is locked: you are signed out, you cannot log in again, and no doctor can reach your file.'),
  p('The account and everything in it is then deleted within one working week. Your reason is read first, but it does not have to be a reason anyone agrees with. Whether it is understood or not, the account is removed.'),
  p('If you change your mind before the week is up, write to either address above and the account can be opened again.'),
  p('One thing is worth knowing. A note a doctor wrote about a visit belongs to that visit, and deleting your account deletes it. There is no copy kept for the doctor afterwards.'),

  h('What you can ask for'),
  li('To see what is held about you. Most of it is already on your own pages.'),
  li('To correct anything wrong, which you can do yourself from your profile.'),
  li('To have your account and your information deleted.'),
  li('To stop sharing your records with a doctor, which you can do yourself at any time.'),
  p('For anything not covered by a button in the app, write to the address above.'),

  h('The standard being followed'),
  p('Beral Care is built to follow Rwanda Law No. 058/2021 on the protection of personal data and privacy, which is the law where the project was written. That means consent before sharing, the least information needed, deletion on request, and telling you what is held. This is a student project and it is not registered with a data protection authority, so treat this as the standard being aimed at honestly rather than a certification.'),

  h('What this is not'),
  p('Beral Care is a final year student project, built and maintained by one person. It has not been through an independent security review. It is not a hospital system, and it should not be the only place your health information exists. Keep your own copies of anything that matters. Do not use it for an emergency.'),

  h('Changes'),
  p('If this page changes in a way that matters, the date below changes with it and you will see a message in the app. Old versions are in the public code history.'),
];

const termsEn = [
  p('These are the rules for using Beral Care. They are short, and they are meant to be understood without a lawyer.'),

  h('What Beral Care is'),
  p('Beral Care is a place to keep your health records, share them with doctors you choose, book visits, and ask general health questions. It is run by one person, Adossi Fred William, in Kigali, Rwanda.'),

  h('What it is not'),
  p('It is not an emergency service. If someone is in danger, go to a hospital or call your local emergency number. Do not wait for a reply here.'),
  p('It is not a replacement for seeing a doctor. HealthGuide and MedAssist are software. They give general information, they can be wrong, and they must never be treated as a diagnosis or a prescription.'),
  p('It is not a guarantee of care. A doctor on Beral Care chooses whether to accept you, the same as anywhere else.'),

  h('Your account'),
  li('Give your real name and a real phone number. Other people rely on both.'),
  li('One account per person, and do not use somebody else\'s.'),
  li('Keep your password to yourself. Anything done with your account is treated as done by you.'),
  li('You have to be old enough to consent to your own care where you live, or have a parent or guardian using the account with you.'),

  h('If you are a doctor'),
  p('You have to give your licence number and upload the licence document when you register. Nothing is shown to patients until an administrator has looked at it. Sending a document that is not yours, or claiming a qualification you do not hold, gets the account removed and may be reported.'),
  p('When a patient allows you into their file, what you find there is theirs, not yours. Use it for their care and nothing else. You can only read notes you wrote yourself unless the patient has separately allowed you to see their past records.'),

  h('Ratings and reports'),
  p('Patients can rate doctors, and the rating and the reason are public. Write about what actually happened to you. Ratings that are made up, insulting, or written to damage someone are removed, and the account that wrote them may be blocked.'),
  p('Anyone can report anyone. A report is read by the administrator before anything happens, and the outcome may be a warning, a temporary block, a permanent block, or nothing at all.'),

  h('What gets an account blocked'),
  li('Pretending to be someone else, or claiming to be a doctor without being one.'),
  li('Sharing another person\'s health information outside their care.'),
  li('Threatening, harassing, or abusing anybody through the service.'),
  li('Trying to reach records you were not given access to.'),

  h('Ending it'),
  p('You can close your account at any time from your profile, and you will be asked why. The account is locked immediately and deleted within one working week.'),
  p('An account can also be blocked or removed by the administrator, for the reasons above. Where that happens you are told why, in a message, unless telling you would put somebody else at risk.'),

  h('Availability'),
  p('This service runs on hosting that is paid for by a student. It can be slow, it can be down, and it may one day stop. There is no uptime promise. Do not let Beral Care be the only copy of anything you cannot lose.'),

  h('Responsibility'),
  p('The service is provided as it is, with no warranty. Medical decisions are made by you and your doctor, not by this software, and the responsibility for those decisions stays with you and your doctor. Nothing here removes a right you have under the law where you live.'),

  h('The law that applies'),
  p('The project was built in Rwanda and follows Rwandan law, including Law No. 058/2021 on the protection of personal data and privacy. If something here conflicts with a right the law gives you, the law wins.'),

  h('Getting in touch'),
  p(`Write to ${CONTACT}, or to ${CONTACT_ALT}. Both reach the person who built this.`),
];

const privacyFr = [
  p('Beral Care conserve des informations de santé, ce qu\'une personne possède de plus intime. Cette page explique clairement ce qui est conservé, qui peut le voir et comment le faire supprimer. Elle est écrite pour être lue, pas pour protéger quelqu\'un d\'une plainte.'),

  h('Qui est responsable'),
  p('Beral Care est conçu et géré par une seule personne, Adossi Fred William, étudiant à l\'African Leadership University à Kigali, au Rwanda. Il n\'y a ni société ni équipe derrière ce projet. Une seule personne décide donc de ce qui arrive à vos informations, et une seule personne en répond.'),
  p(`Pour toute question, inquiétude ou demande concernant vos informations, écrivez à ${CONTACT}. Ce message est lu par la personne qui gère le service. ${CONTACT_ALT} joint la même personne, et c'est l'adresse à utiliser si celle de l'université cesse un jour de fonctionner.`),

  h('Ce qui est conservé'),
  li('Votre nom, votre adresse e-mail, votre numéro de téléphone et la photo que vous téléversez, le cas échéant.'),
  li('Votre identifiant santé, créé à l\'inscription, qui vous identifie auprès d\'un médecin sans révéler votre nom.'),
  li('Pour les médecins : votre domaine de soins, votre lieu d\'exercice, votre numéro de licence et le document de licence téléversé.'),
  li('Vos consultations, les notes rédigées par un médecin, les ordonnances et tout fichier joint à un signalement ou à une évaluation.'),
  li('Vos messages, vos notifications et la trace de chaque médecin ayant ouvert votre dossier, avec la date.'),
  li('Les informations techniques de base qu\'un serveur enregistre, comme l\'heure d\'une requête et l\'adresse dont elle provient.'),

  h('Qui peut voir vos dossiers de santé'),
  p('Aucun médecin ne voit quoi que ce soit à votre sujet avant votre accord, et cet accord se donne en deux étapes distinctes.'),
  p('La première étape est la connexion. Lorsqu\'un médecin scanne votre code, ou que vous acceptez une demande, ce médecin voit votre profil : votre nom, votre identifiant santé, votre âge, votre numéro de téléphone et votre localisation. Rien de plus. La connexion n\'ouvre pas vos dossiers de santé.'),
  p('La seconde étape concerne vos dossiers. Le médecin doit demander à nouveau, séparément, l\'accès à votre historique. Tant que vous ne l\'autorisez pas, il ne lit que les notes qu\'il a lui même écrites. Les notes rédigées par d\'autres médecins lui restent fermées. Si vous l\'autorisez, il voit vos consultations passées, et vous pouvez retirer cette autorisation à tout moment depuis la page Mes médecins.'),
  p('Chaque ouverture de votre dossier par un médecin est enregistrée, et vous pouvez consulter cette liste vous même sur la page des accès au dossier. Rien ne s\'ouvre en silence.'),

  h('Ce que voit l\'administrateur'),
  p('L\'administrateur voit les comptes, les signalements, les évaluations et les documents qui y sont joints. Il ne peut pas lire vos dossiers de santé, vos diagnostics ni vos ordonnances. C\'est un choix délibéré, appliqué par le code lui même et non par une simple règle écrite.'),

  h('Les évaluations sont publiques'),
  p('Lorsque vous évaluez un médecin, la note et votre justification écrite apparaissent sur le profil de ce médecin, visibles par toute personne cherchant des soins. Votre nom n\'y figure pas. Un fichier joint à une évaluation n\'est pas public : vous seul et l\'administrateur pouvez l\'ouvrir. Écrivez donc votre justification en sachant que d\'autres patients la liront.'),

  h('Les assistants santé'),
  p('HealthGuide et MedAssist répondent à des questions générales de santé. Ce que vous leur écrivez est envoyé à Google, qui fournit le modèle rédigeant la réponse. N\'y écrivez rien que vous ne voudriez pas voir quitter Beral Care. Ce ne sont pas des médecins, ils ne posent pas de diagnostic et ils ne font pas partie de votre dossier de santé.'),

  h('Où vos informations sont conservées'),
  p('Les informations de compte et de santé sont stockées dans une base de données gérée hébergée hors du Rwanda, et les fichiers que vous téléversez sont conservés chez un hébergeur de fichiers. Les documents qui doivent rester privés, comme une licence ou une pièce jointe à un signalement ou à une évaluation, sont stockés de manière à ne pas pouvoir être ouverts par un simple lien. Ils ne sont transmis qu\'après vérification de l\'identité du demandeur par le serveur.'),
  p('Les échanges avec le site sont chiffrés. Les mots de passe sont conservés sous forme hachée, ce qui signifie que le service ne détient jamais le mot de passe que vous avez saisi.'),

  h('Fermer votre compte'),
  p('Vous pouvez fermer votre compte vous même, depuis votre profil. Il vous est demandé d\'expliquer pourquoi, avec vos propres mots. Dès la demande, le compte est verrouillé : vous êtes déconnecté, vous ne pouvez plus vous connecter, et aucun médecin ne peut accéder à votre dossier.'),
  p('Le compte et tout ce qu\'il contient sont ensuite supprimés dans un délai d\'une semaine ouvrée. Votre motif est lu d\'abord, mais il n\'a pas à être un motif approuvé. Compris ou non, le compte est supprimé.'),
  p('Si vous changez d\'avis avant la fin de cette semaine, écrivez à l\'une des deux adresses ci dessus et le compte peut être rouvert.'),
  p('Une chose mérite d\'être sue. Une note rédigée par un médecin appartient à la consultation concernée, et supprimer votre compte la supprime aussi. Aucune copie n\'est conservée pour le médecin.'),

  h('Ce que vous pouvez demander'),
  li('Voir ce qui est conservé à votre sujet. L\'essentiel figure déjà sur vos propres pages.'),
  li('Corriger toute erreur, ce que vous pouvez faire depuis votre profil.'),
  li('Faire supprimer votre compte et vos informations.'),
  li('Cesser de partager vos dossiers avec un médecin, ce que vous pouvez faire à tout moment.'),
  p('Pour tout ce qui n\'est pas couvert par un bouton dans l\'application, écrivez à l\'adresse ci dessus.'),

  h('La norme suivie'),
  p('Beral Care est conçu pour respecter la loi rwandaise n° 058/2021 relative à la protection des données à caractère personnel et de la vie privée, la loi du pays où le projet a été écrit. Cela signifie le consentement avant tout partage, le minimum d\'informations nécessaires, la suppression sur demande et la transparence sur ce qui est conservé. Il s\'agit d\'un projet étudiant, non enregistré auprès d\'une autorité de protection des données : considérez donc ceci comme la norme honnêtement visée, et non comme une certification.'),

  h('Ce que ce projet n\'est pas'),
  p('Beral Care est un projet de fin d\'études, conçu et maintenu par une seule personne. Il n\'a pas fait l\'objet d\'un audit de sécurité indépendant. Ce n\'est pas un système hospitalier et il ne doit pas être le seul endroit où vos informations de santé existent. Conservez vos propres copies de ce qui compte. Ne l\'utilisez pas en cas d\'urgence.'),

  h('Modifications'),
  p('Si cette page change de façon importante, la date ci dessous change avec elle et un message apparaît dans l\'application. Les versions antérieures figurent dans l\'historique public du code.'),
];

const termsFr = [
  p('Voici les règles d\'utilisation de Beral Care. Elles sont courtes et destinées à être comprises sans avocat.'),

  h('Ce qu\'est Beral Care'),
  p('Beral Care est un espace pour conserver vos dossiers de santé, les partager avec les médecins de votre choix, prendre rendez vous et poser des questions générales de santé. Il est géré par une seule personne, Adossi Fred William, à Kigali, au Rwanda.'),

  h('Ce que ce n\'est pas'),
  p('Ce n\'est pas un service d\'urgence. Si une personne est en danger, rendez vous à l\'hôpital ou appelez le numéro d\'urgence local. N\'attendez pas de réponse ici.'),
  p('Ce ne remplace pas une consultation médicale. HealthGuide et MedAssist sont des logiciels. Ils donnent des informations générales, ils peuvent se tromper, et ils ne doivent jamais être pris pour un diagnostic ou une ordonnance.'),
  p('Ce n\'est pas une garantie de soins. Un médecin sur Beral Care choisit de vous accepter ou non, comme ailleurs.'),

  h('Votre compte'),
  li('Donnez votre vrai nom et un numéro de téléphone valide. D\'autres personnes s\'y fient.'),
  li('Un seul compte par personne, et n\'utilisez pas celui de quelqu\'un d\'autre.'),
  li('Gardez votre mot de passe pour vous. Tout ce qui est fait avec votre compte est considéré comme fait par vous.'),
  li('Vous devez avoir l\'âge de consentir à vos propres soins là où vous vivez, ou utiliser le compte avec un parent ou un tuteur.'),

  h('Si vous êtes médecin'),
  p('Vous devez fournir votre numéro de licence et téléverser le document correspondant à l\'inscription. Rien n\'est montré aux patients tant qu\'un administrateur ne l\'a pas examiné. Envoyer un document qui n\'est pas le vôtre, ou revendiquer une qualification que vous n\'avez pas, entraîne la suppression du compte et peut être signalé.'),
  p('Lorsqu\'un patient vous ouvre son dossier, ce que vous y trouvez lui appartient, pas à vous. Utilisez le pour ses soins et rien d\'autre. Vous ne lisez que les notes que vous avez écrites, sauf si le patient vous a autorisé séparément à consulter son historique.'),

  h('Évaluations et signalements'),
  p('Les patients peuvent évaluer les médecins, et la note comme la justification sont publiques. Écrivez ce qui vous est réellement arrivé. Les évaluations inventées, insultantes ou écrites pour nuire sont supprimées, et le compte à leur origine peut être bloqué.'),
  p('Chacun peut signaler quelqu\'un. Un signalement est lu par l\'administrateur avant toute décision, et l\'issue peut être un avertissement, un blocage temporaire, un blocage définitif, ou rien du tout.'),

  h('Ce qui entraîne un blocage'),
  li('Se faire passer pour quelqu\'un d\'autre, ou se prétendre médecin sans l\'être.'),
  li('Partager les informations de santé d\'une autre personne en dehors de ses soins.'),
  li('Menacer, harceler ou insulter quelqu\'un par l\'intermédiaire du service.'),
  li('Tenter d\'accéder à des dossiers auxquels vous n\'avez pas eu accès.'),

  h('Mettre fin à tout cela'),
  p('Vous pouvez fermer votre compte à tout moment depuis votre profil, et il vous sera demandé pourquoi. Le compte est verrouillé immédiatement et supprimé dans un délai d\'une semaine ouvrée.'),
  p('Un compte peut aussi être bloqué ou supprimé par l\'administrateur, pour les raisons ci dessus. Dans ce cas, le motif vous est communiqué par message, sauf si vous le dire mettrait quelqu\'un d\'autre en danger.'),

  h('Disponibilité'),
  p('Ce service fonctionne sur un hébergement payé par un étudiant. Il peut être lent, indisponible, et il pourrait un jour s\'arrêter. Aucune garantie de disponibilité n\'est donnée. Ne faites pas de Beral Care la seule copie de ce que vous ne pouvez pas perdre.'),

  h('Responsabilité'),
  p('Le service est fourni tel quel, sans garantie. Les décisions médicales vous appartiennent, à vous et à votre médecin, et non à ce logiciel ; la responsabilité de ces décisions reste la vôtre et celle de votre médecin. Rien ici ne vous retire un droit que la loi de votre pays vous accorde.'),

  h('La loi applicable'),
  p('Le projet a été conçu au Rwanda et suit le droit rwandais, dont la loi n° 058/2021 relative à la protection des données à caractère personnel et de la vie privée. Si un point de cette page contredit un droit que la loi vous donne, la loi prévaut.'),

  h('Nous joindre'),
  p(`Écrivez à ${CONTACT}, ou à ${CONTACT_ALT}. Les deux parviennent à la personne qui a construit ce service.`),
];

export const DOCS = {
  privacy: {
    en: { title: 'Privacy', lede: 'What Beral Care keeps about you, who can see it, and how to have it removed.', blocks: privacyEn },
    fr: { title: 'Confidentialité', lede: 'Ce que Beral Care conserve à votre sujet, qui peut le voir et comment le faire supprimer.', blocks: privacyFr },
  },
  terms: {
    en: { title: 'Terms of use', lede: 'The rules for using Beral Care, in plain words.', blocks: termsEn },
    fr: { title: 'Conditions d\'utilisation', lede: 'Les règles d\'utilisation de Beral Care, en mots simples.', blocks: termsFr },
  },
};
