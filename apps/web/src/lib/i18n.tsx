'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';

export type Lang = 'ar' | 'fr' | 'en';
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
];

const en = {
  'app.name': 'UniGuide Gabès',
  'app.tagline': 'Useful places for students in Gabès',

  'nav.map': 'Map',
  'nav.submit': 'Add a place',
  'nav.account': 'My account',
  'nav.admin': 'Admin',
  'nav.login': 'Log in',
  'nav.signup': 'Sign up',
  'nav.logout': 'Sign out',
  'nav.menu': 'Menu',
  'badge.admin': 'Admin',

  'common.back': '← Back to map',
  'common.loading': 'Loading…',
  'common.optional': 'optional',
  'common.cancel': 'Cancel',
  'common.retry': 'Retry',

  'cat.faculty': 'Faculty / Campus',
  'cat.housing': 'Student housing',
  'cat.library': 'Library / Study space',
  'cat.cafe': 'Café / Restaurant',
  'cat.transport': 'Transport stop',
  'cat.pharmacy': 'Pharmacy',
  'cat.other': 'Other',

  'map.search': 'Search places…',
  'map.all': 'All',
  'map.count': '{n} places',
  'map.count1': '1 place',
  'map.empty': 'No places match your search.',
  'map.emptyDb': 'No places have been published yet. Be the first to add one!',
  'map.loadError': 'Could not load places. Is the API running?',
  'map.locate': 'Near me',
  'map.locating': 'Locating…',
  'map.locationDenied': 'Location access was denied or is unavailable.',
  'map.directions': 'Directions',
  'map.openOsm': 'Open in OpenStreetMap',
  'map.close': 'Close',
  'map.reviewed': 'Reviewed by an admin',
  'map.reviewedOn': 'Reviewed on {date}',
  'map.source': 'Source',
  'map.away': '{d} away',
  'map.list': 'List',
  'map.mapView': 'Map',
  'map.you': 'You are here',
  'map.addCta': 'Know a useful place? Add it',
  'map.loading': 'Loading map…',

  'auth.loginTitle': 'Student log in',
  'auth.loginSub': 'Log in to add places and follow your submissions.',
  'auth.signupTitle': 'Create a student account',
  'auth.signupSub': 'It takes a minute and lets you add places to the map.',
  'auth.name': 'Display name',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.passwordHint': 'At least 8 characters, with letters and numbers.',
  'auth.weakPassword': 'Use at least 8 characters with letters and numbers.',
  'auth.loginBtn': 'Log in',
  'auth.loggingIn': 'Logging in…',
  'auth.signupBtn': 'Create account',
  'auth.creating': 'Creating…',
  'auth.noAccount': 'No account yet?',
  'auth.haveAccount': 'Already have an account?',
  'auth.checkEmail': 'Account created! Check your inbox and confirm your email, then log in.',
  'auth.isAdmin': 'Are you an administrator?',
  'auth.adminLink': 'Admin log in',
  'auth.studentLink': 'Student log in',
  'auth.adminTitle': 'Administrator log in',
  'auth.adminSub': 'Restricted area. Only accounts with the admin role can continue.',
  'auth.notAdmin': 'This account does not have administrator access.',
  'auth.apiDown': 'Could not verify your role. Is the API running?',
  'auth.adminOnlyTitle': 'Administrators only',
  'auth.adminOnlyBody': 'You need an administrator account to view this page.',

  'auth.forgot': 'Forgot your password?',
  'auth.alreadyRegistered': 'This email already has an account. Log in instead, or reset your password if you forgot it.',
  'auth.forgotTitle': 'Reset your password',
  'auth.forgotSub': 'Enter your email and we will send you a reset link.',
  'auth.sendLink': 'Send reset link',
  'auth.sending': 'Sending…',
  'auth.linkSent': 'If an account exists for this email, a reset link is on its way. Check your inbox and spam folder.',
  'auth.backToLogin': 'Back to log in',
  'auth.resetTitle': 'Choose a new password',
  'auth.newPassword': 'New password',
  'auth.savePassword': 'Save password',
  'auth.saving': 'Saving…',
  'auth.passwordUpdated': 'Password updated. You are now logged in.',
  'auth.resetInvalid': 'This reset link is invalid or has expired. Please request a new one.',
  'auth.checking': 'Checking your link…',

  'pwa.install': 'Install app',
  'pwa.iosTitle': 'Install on iPhone',
  'pwa.iosBody': 'Tap the Share button, then “Add to Home Screen”.',
  'map.saved': 'Saved',
  'map.save': 'Save place',
  'map.unsave': 'Remove from saved',
  'map.share': 'Share',
  'map.linkCopied': 'Link copied',
  'map.noSaved': 'No saved places yet. Tap the heart on a place to keep it here.',
  'map.waking': 'The server is waking up. This can take up to a minute the first time…',
  'lang.title': 'Language',
  'toast.saved': 'Saved to your list',
  'toast.unsaved': 'Removed from your list',
  'toast.signedOut': 'You are signed out',
  'toast.approved': 'Place approved',
  'toast.rejected': 'Place rejected',
  'map.clear': 'Clear search',
  'map.clearFilters': 'Clear filters',
  'map.fitAll': 'Show all places',
  'map.located': 'Showing places near you',
  'map.sortedNear': 'closest first',
  'map.suggestFirst': 'Suggest the first place',
  'auth.showPassword': 'Show password',
  'auth.hidePassword': 'Hide password',
  'auth.rule.length': 'At least 8 characters',
  'auth.rule.letter': 'Contains a letter',
  'auth.rule.number': 'Contains a number',
  'auth.invalidCredentials': 'Wrong email or password.',
  'auth.emailNotConfirmed': 'Please confirm your email first: check your inbox.',
  'submit.step1': 'Pin the location',
  'submit.step2': 'Describe the place',
  'submit.clearPin': 'Clear pin',
  'submit.tapHint': 'Tap or click the map to drop the pin',
  'notfound.title': 'Page not found',
  'notfound.body': 'This page does not exist or has moved.',
  'error.title': 'Something went wrong',
  'error.body': 'Please try again. If it keeps happening, come back a little later.',
  'submit.title': 'Add a place',
  'submit.intro': 'Click the map to drop a pin at the exact spot, then fill in the details. Every submission is reviewed before it appears.',
  'submit.introAdmin': 'You are an admin: places you add are published immediately.',
  'submit.location': 'Location',
  'submit.clickMap': 'Click on the map to place the pin',
  'submit.useMyLocation': 'Use my location',
  'submit.name': 'Name',
  'submit.namePh': 'e.g. Faculty of Sciences of Gabès',
  'submit.category': 'Category',
  'submit.description': 'Description',
  'submit.sourceUrl': 'Source link',
  'submit.sourcePh': 'https://www.openstreetmap.org/…',
  'submit.send': 'Submit for review',
  'submit.publish': 'Publish now',
  'submit.sending': 'Sending…',
  'submit.needLocation': 'Please click on the map to set the location.',
  'submit.success': 'Thank you! Your place is waiting for review.',
  'submit.successAdmin': 'Published. It is now visible on the map.',
  'submit.another': 'Add another place',
  'submit.viewMine': 'View my submissions',
  'submit.signinTitle': 'Log in to add a place',
  'submit.signinBody': 'You need an account so we can tell you when your submission is reviewed.',
  'submit.failed': 'Could not send: {msg}',

  'account.title': 'My account',
  'account.mySubs': 'My submissions',
  'account.none': 'You have not submitted any place yet.',
  'account.reason': 'Reason',
  'account.submitted': 'Submitted {date}',

  'status.pending': 'Pending',
  'status.approved': 'Approved',
  'status.rejected': 'Rejected',

  'admin.title': 'Moderation',
  'admin.sub': 'Review places submitted by students.',
  'admin.search': 'Search by name…',
  'admin.empty': 'Nothing here.',
  'admin.approve': 'Approve',
  'admin.reject': 'Reject',
  'admin.rejectTitle': 'Reject this place?',
  'admin.rejectReason': 'Reason (sent to the student)',
  'admin.rejectDefault': 'We could not verify this place.',
  'admin.confirmReject': 'Confirm rejection',
  'admin.viewMap': 'View on map',
  'admin.add': 'Add a place',
  'admin.refresh': 'Refresh',
  'admin.all': 'All',
  'admin.by': 'by {email}',
  'admin.loadError': 'Could not load submissions: {msg}',
};

type Key = keyof typeof en;
type Dict = Record<Key, string>;

const fr: Dict = {
  'app.name': 'UniGuide Gabès',
  'app.tagline': 'Les lieux utiles pour les étudiants de Gabès',

  'nav.map': 'Carte',
  'nav.submit': 'Ajouter un lieu',
  'nav.account': 'Mon compte',
  'nav.admin': 'Admin',
  'nav.login': 'Connexion',
  'nav.signup': 'Inscription',
  'nav.logout': 'Déconnexion',
  'nav.menu': 'Menu',
  'badge.admin': 'Admin',

  'common.back': '← Retour à la carte',
  'common.loading': 'Chargement…',
  'common.optional': 'facultatif',
  'common.cancel': 'Annuler',
  'common.retry': 'Réessayer',

  'cat.faculty': 'Faculté / Campus',
  'cat.housing': 'Logement étudiant',
  'cat.library': 'Bibliothèque / Espace d’étude',
  'cat.cafe': 'Café / Restaurant',
  'cat.transport': 'Arrêt de transport',
  'cat.pharmacy': 'Pharmacie',
  'cat.other': 'Autre',

  'map.search': 'Rechercher un lieu…',
  'map.all': 'Tous',
  'map.count': '{n} lieux',
  'map.count1': '1 lieu',
  'map.empty': 'Aucun lieu ne correspond à votre recherche.',
  'map.emptyDb': 'Aucun lieu n’a encore été publié. Soyez le premier à en ajouter un !',
  'map.loadError': 'Impossible de charger les lieux. L’API est-elle démarrée ?',
  'map.locate': 'Près de moi',
  'map.locating': 'Localisation…',
  'map.locationDenied': 'L’accès à la position a été refusé ou est indisponible.',
  'map.directions': 'Itinéraire',
  'map.openOsm': 'Ouvrir dans OpenStreetMap',
  'map.close': 'Fermer',
  'map.reviewed': 'Vérifié par un administrateur',
  'map.reviewedOn': 'Vérifié le {date}',
  'map.source': 'Source',
  'map.away': 'à {d}',
  'map.list': 'Liste',
  'map.mapView': 'Carte',
  'map.you': 'Vous êtes ici',
  'map.addCta': 'Vous connaissez un lieu utile ? Ajoutez-le',
  'map.loading': 'Chargement de la carte…',

  'auth.loginTitle': 'Connexion étudiant',
  'auth.loginSub': 'Connectez-vous pour ajouter des lieux et suivre vos propositions.',
  'auth.signupTitle': 'Créer un compte étudiant',
  'auth.signupSub': 'Cela prend une minute et permet d’ajouter des lieux à la carte.',
  'auth.name': 'Nom affiché',
  'auth.email': 'E-mail',
  'auth.password': 'Mot de passe',
  'auth.passwordHint': 'Au moins 8 caractères, avec des lettres et des chiffres.',
  'auth.weakPassword': 'Utilisez au moins 8 caractères avec des lettres et des chiffres.',
  'auth.loginBtn': 'Se connecter',
  'auth.loggingIn': 'Connexion…',
  'auth.signupBtn': 'Créer le compte',
  'auth.creating': 'Création…',
  'auth.noAccount': 'Pas encore de compte ?',
  'auth.haveAccount': 'Vous avez déjà un compte ?',
  'auth.checkEmail': 'Compte créé ! Vérifiez votre boîte mail et confirmez votre adresse, puis connectez-vous.',
  'auth.isAdmin': 'Vous êtes administrateur ?',
  'auth.adminLink': 'Connexion admin',
  'auth.studentLink': 'Connexion étudiant',
  'auth.adminTitle': 'Connexion administrateur',
  'auth.adminSub': 'Zone réservée. Seuls les comptes ayant le rôle admin peuvent continuer.',
  'auth.notAdmin': 'Ce compte n’a pas d’accès administrateur.',
  'auth.apiDown': 'Impossible de vérifier votre rôle. L’API est-elle démarrée ?',
  'auth.adminOnlyTitle': 'Réservé aux administrateurs',
  'auth.adminOnlyBody': 'Vous avez besoin d’un compte administrateur pour voir cette page.',

  'auth.forgot': 'Mot de passe oublié ?',
  'auth.alreadyRegistered': 'Cet e-mail a déjà un compte. Connectez-vous, ou réinitialisez votre mot de passe si vous l’avez oublié.',
  'auth.forgotTitle': 'Réinitialiser le mot de passe',
  'auth.forgotSub': 'Entrez votre e-mail et nous vous enverrons un lien de réinitialisation.',
  'auth.sendLink': 'Envoyer le lien',
  'auth.sending': 'Envoi…',
  'auth.linkSent': 'Si un compte existe pour cet e-mail, un lien est en route. Vérifiez votre boîte de réception et vos spams.',
  'auth.backToLogin': 'Retour à la connexion',
  'auth.resetTitle': 'Choisissez un nouveau mot de passe',
  'auth.newPassword': 'Nouveau mot de passe',
  'auth.savePassword': 'Enregistrer',
  'auth.saving': 'Enregistrement…',
  'auth.passwordUpdated': 'Mot de passe mis à jour. Vous êtes connecté.',
  'auth.resetInvalid': 'Ce lien est invalide ou a expiré. Veuillez en demander un nouveau.',
  'auth.checking': 'Vérification du lien…',

  'pwa.install': 'Installer l’appli',
  'pwa.iosTitle': 'Installer sur iPhone',
  'pwa.iosBody': 'Touchez le bouton Partager, puis « Sur l’écran d’accueil ».',
  'map.saved': 'Favoris',
  'map.save': 'Enregistrer ce lieu',
  'map.unsave': 'Retirer des favoris',
  'map.share': 'Partager',
  'map.linkCopied': 'Lien copié',
  'map.noSaved': 'Aucun favori pour l’instant. Touchez le cœur sur un lieu pour le garder ici.',
  'map.waking': 'Le serveur se réveille. Cela peut prendre jusqu’à une minute la première fois…',
  'lang.title': 'Langue',
  'toast.saved': 'Ajouté à vos favoris',
  'toast.unsaved': 'Retiré de vos favoris',
  'toast.signedOut': 'Vous êtes déconnecté',
  'toast.approved': 'Lieu approuvé',
  'toast.rejected': 'Lieu refusé',
  'map.clear': 'Effacer la recherche',
  'map.clearFilters': 'Réinitialiser les filtres',
  'map.fitAll': 'Voir tous les lieux',
  'map.located': 'Lieux proches de vous',
  'map.sortedNear': 'les plus proches d’abord',
  'map.suggestFirst': 'Proposer le premier lieu',
  'auth.showPassword': 'Afficher le mot de passe',
  'auth.hidePassword': 'Masquer le mot de passe',
  'auth.rule.length': 'Au moins 8 caractères',
  'auth.rule.letter': 'Contient une lettre',
  'auth.rule.number': 'Contient un chiffre',
  'auth.invalidCredentials': 'E-mail ou mot de passe incorrect.',
  'auth.emailNotConfirmed': 'Veuillez d’abord confirmer votre e-mail : vérifiez votre boîte de réception.',
  'submit.step1': 'Placez l’épingle',
  'submit.step2': 'Décrivez le lieu',
  'submit.clearPin': 'Effacer l’épingle',
  'submit.tapHint': 'Touchez ou cliquez sur la carte pour placer l’épingle',
  'notfound.title': 'Page introuvable',
  'notfound.body': 'Cette page n’existe pas ou a été déplacée.',
  'error.title': 'Une erreur est survenue',
  'error.body': 'Veuillez réessayer. Si cela continue, revenez un peu plus tard.',
  'submit.title': 'Ajouter un lieu',
  'submit.intro': 'Cliquez sur la carte pour placer l’épingle à l’endroit exact, puis remplissez les détails. Chaque proposition est vérifiée avant publication.',
  'submit.introAdmin': 'Vous êtes admin : les lieux que vous ajoutez sont publiés immédiatement.',
  'submit.location': 'Emplacement',
  'submit.clickMap': 'Cliquez sur la carte pour placer l’épingle',
  'submit.useMyLocation': 'Utiliser ma position',
  'submit.name': 'Nom',
  'submit.namePh': 'ex. Faculté des Sciences de Gabès',
  'submit.category': 'Catégorie',
  'submit.description': 'Description',
  'submit.sourceUrl': 'Lien source',
  'submit.sourcePh': 'https://www.openstreetmap.org/…',
  'submit.send': 'Envoyer pour vérification',
  'submit.publish': 'Publier maintenant',
  'submit.sending': 'Envoi…',
  'submit.needLocation': 'Veuillez cliquer sur la carte pour définir l’emplacement.',
  'submit.success': 'Merci ! Votre lieu est en attente de vérification.',
  'submit.successAdmin': 'Publié. Il est maintenant visible sur la carte.',
  'submit.another': 'Ajouter un autre lieu',
  'submit.viewMine': 'Voir mes propositions',
  'submit.signinTitle': 'Connectez-vous pour ajouter un lieu',
  'submit.signinBody': 'Un compte est nécessaire pour vous prévenir quand votre proposition est examinée.',
  'submit.failed': 'Échec de l’envoi : {msg}',

  'account.title': 'Mon compte',
  'account.mySubs': 'Mes propositions',
  'account.none': 'Vous n’avez encore proposé aucun lieu.',
  'account.reason': 'Motif',
  'account.submitted': 'Envoyé le {date}',

  'status.pending': 'En attente',
  'status.approved': 'Approuvé',
  'status.rejected': 'Refusé',

  'admin.title': 'Modération',
  'admin.sub': 'Examinez les lieux proposés par les étudiants.',
  'admin.search': 'Rechercher par nom…',
  'admin.empty': 'Rien à afficher.',
  'admin.approve': 'Approuver',
  'admin.reject': 'Refuser',
  'admin.rejectTitle': 'Refuser ce lieu ?',
  'admin.rejectReason': 'Motif (envoyé à l’étudiant)',
  'admin.rejectDefault': 'Nous n’avons pas pu vérifier ce lieu.',
  'admin.confirmReject': 'Confirmer le refus',
  'admin.viewMap': 'Voir sur la carte',
  'admin.add': 'Ajouter un lieu',
  'admin.refresh': 'Actualiser',
  'admin.all': 'Tous',
  'admin.by': 'par {email}',
  'admin.loadError': 'Impossible de charger les propositions : {msg}',
};

const ar: Dict = {
  'app.name': 'يوني غايد قابس',
  'app.tagline': 'الأماكن المفيدة للطلبة في قابس',

  'nav.map': 'الخريطة',
  'nav.submit': 'أضف مكانًا',
  'nav.account': 'حسابي',
  'nav.admin': 'الإدارة',
  'nav.login': 'تسجيل الدخول',
  'nav.signup': 'إنشاء حساب',
  'nav.logout': 'تسجيل الخروج',
  'nav.menu': 'القائمة',
  'badge.admin': 'مشرف',

  'common.back': '← العودة إلى الخريطة',
  'common.loading': 'جارٍ التحميل…',
  'common.optional': 'اختياري',
  'common.cancel': 'إلغاء',
  'common.retry': 'إعادة المحاولة',

  'cat.faculty': 'كلية / حرم جامعي',
  'cat.housing': 'سكن طلابي',
  'cat.library': 'مكتبة / فضاء دراسة',
  'cat.cafe': 'مقهى / مطعم',
  'cat.transport': 'محطة نقل',
  'cat.pharmacy': 'صيدلية',
  'cat.other': 'أخرى',

  'map.search': 'ابحث عن مكان…',
  'map.all': 'الكل',
  'map.count': '{n} أماكن',
  'map.count1': 'مكان واحد',
  'map.empty': 'لا توجد أماكن تطابق بحثك.',
  'map.emptyDb': 'لم يتم نشر أي مكان بعد. كن أول من يضيف مكانًا!',
  'map.loadError': 'تعذّر تحميل الأماكن. هل الخادم يعمل؟',
  'map.locate': 'بالقرب مني',
  'map.locating': 'جارٍ تحديد الموقع…',
  'map.locationDenied': 'تم رفض الوصول إلى الموقع أو أنه غير متاح.',
  'map.directions': 'الاتجاهات',
  'map.openOsm': 'فتح في OpenStreetMap',
  'map.close': 'إغلاق',
  'map.reviewed': 'تمت مراجعته من قبل مشرف',
  'map.reviewedOn': 'تمت المراجعة في {date}',
  'map.source': 'المصدر',
  'map.away': 'على بعد {d}',
  'map.list': 'القائمة',
  'map.mapView': 'الخريطة',
  'map.you': 'أنت هنا',
  'map.addCta': 'تعرف مكانًا مفيدًا؟ أضفه',
  'map.loading': 'جارٍ تحميل الخريطة…',

  'auth.loginTitle': 'دخول الطالب',
  'auth.loginSub': 'سجّل الدخول لإضافة أماكن ومتابعة مقترحاتك.',
  'auth.signupTitle': 'إنشاء حساب طالب',
  'auth.signupSub': 'يستغرق الأمر دقيقة ويتيح لك إضافة أماكن إلى الخريطة.',
  'auth.name': 'الاسم المعروض',
  'auth.email': 'البريد الإلكتروني',
  'auth.password': 'كلمة المرور',
  'auth.passwordHint': '8 أحرف على الأقل، مع حروف وأرقام.',
  'auth.weakPassword': 'استخدم 8 أحرف على الأقل مع حروف وأرقام.',
  'auth.loginBtn': 'دخول',
  'auth.loggingIn': 'جارٍ الدخول…',
  'auth.signupBtn': 'إنشاء الحساب',
  'auth.creating': 'جارٍ الإنشاء…',
  'auth.noAccount': 'ليس لديك حساب؟',
  'auth.haveAccount': 'لديك حساب بالفعل؟',
  'auth.checkEmail': 'تم إنشاء الحساب! تحقق من بريدك الإلكتروني وأكّد عنوانك ثم سجّل الدخول.',
  'auth.isAdmin': 'هل أنت مشرف؟',
  'auth.adminLink': 'دخول المشرفين',
  'auth.studentLink': 'دخول الطلبة',
  'auth.adminTitle': 'دخول المشرفين',
  'auth.adminSub': 'منطقة مخصصة. لا يمكن المتابعة إلا للحسابات ذات دور المشرف.',
  'auth.notAdmin': 'هذا الحساب لا يملك صلاحيات المشرف.',
  'auth.apiDown': 'تعذّر التحقق من دورك. هل الخادم يعمل؟',
  'auth.adminOnlyTitle': 'للمشرفين فقط',
  'auth.adminOnlyBody': 'تحتاج إلى حساب مشرف لعرض هذه الصفحة.',

  'auth.forgot': 'نسيت كلمة المرور؟',
  'auth.alreadyRegistered': 'هذا البريد الإلكتروني لديه حساب بالفعل. سجّل الدخول، أو أعد تعيين كلمة المرور إن كنت قد نسيتها.',
  'auth.forgotTitle': 'إعادة تعيين كلمة المرور',
  'auth.forgotSub': 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.',
  'auth.sendLink': 'إرسال الرابط',
  'auth.sending': 'جارٍ الإرسال…',
  'auth.linkSent': 'إذا كان هناك حساب لهذا البريد فالرابط في الطريق. تحقق من صندوق الوارد والبريد غير الهام.',
  'auth.backToLogin': 'العودة إلى تسجيل الدخول',
  'auth.resetTitle': 'اختر كلمة مرور جديدة',
  'auth.newPassword': 'كلمة المرور الجديدة',
  'auth.savePassword': 'حفظ',
  'auth.saving': 'جارٍ الحفظ…',
  'auth.passwordUpdated': 'تم تحديث كلمة المرور. أنت الآن مسجّل الدخول.',
  'auth.resetInvalid': 'هذا الرابط غير صالح أو انتهت صلاحيته. يرجى طلب رابط جديد.',
  'auth.checking': 'جارٍ التحقق من الرابط…',

  'pwa.install': 'ثبّت التطبيق',
  'pwa.iosTitle': 'التثبيت على آيفون',
  'pwa.iosBody': 'اضغط على زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».',
  'map.saved': 'المحفوظة',
  'map.save': 'حفظ المكان',
  'map.unsave': 'إزالة من المحفوظات',
  'map.share': 'مشاركة',
  'map.linkCopied': 'تم نسخ الرابط',
  'map.noSaved': 'لا توجد أماكن محفوظة بعد. اضغط على القلب في أي مكان لحفظه هنا.',
  'map.waking': 'الخادم يستيقظ. قد يستغرق ذلك حتى دقيقة في المرة الأولى…',
  'lang.title': 'اللغة',
  'toast.saved': 'تمت الإضافة إلى المحفوظات',
  'toast.unsaved': 'تمت الإزالة من المحفوظات',
  'toast.signedOut': 'تم تسجيل الخروج',
  'toast.approved': 'تمت الموافقة على المكان',
  'toast.rejected': 'تم رفض المكان',
  'map.clear': 'مسح البحث',
  'map.clearFilters': 'إعادة ضبط التصفية',
  'map.fitAll': 'عرض كل الأماكن',
  'map.located': 'عرض الأماكن القريبة منك',
  'map.sortedNear': 'الأقرب أولًا',
  'map.suggestFirst': 'اقترح أول مكان',
  'auth.showPassword': 'إظهار كلمة المرور',
  'auth.hidePassword': 'إخفاء كلمة المرور',
  'auth.rule.length': '8 أحرف على الأقل',
  'auth.rule.letter': 'تحتوي على حرف',
  'auth.rule.number': 'تحتوي على رقم',
  'auth.invalidCredentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'auth.emailNotConfirmed': 'يرجى تأكيد بريدك الإلكتروني أولًا: تحقق من صندوق الوارد.',
  'submit.step1': 'حدّد الموقع',
  'submit.step2': 'صف المكان',
  'submit.clearPin': 'مسح الدبوس',
  'submit.tapHint': 'المس الخريطة أو انقر عليها لوضع الدبوس',
  'notfound.title': 'الصفحة غير موجودة',
  'notfound.body': 'هذه الصفحة غير موجودة أو تم نقلها.',
  'error.title': 'حدث خطأ ما',
  'error.body': 'يرجى المحاولة مرة أخرى. إذا استمرت المشكلة فعد لاحقًا.',
  'submit.title': 'أضف مكانًا',
  'submit.intro': 'انقر على الخريطة لوضع الدبوس في الموقع الدقيق ثم أكمل التفاصيل. تتم مراجعة كل مقترح قبل ظهوره.',
  'submit.introAdmin': 'أنت مشرف: الأماكن التي تضيفها تُنشر مباشرة.',
  'submit.location': 'الموقع',
  'submit.clickMap': 'انقر على الخريطة لوضع الدبوس',
  'submit.useMyLocation': 'استخدم موقعي',
  'submit.name': 'الاسم',
  'submit.namePh': 'مثال: كلية العلوم بقابس',
  'submit.category': 'الفئة',
  'submit.description': 'الوصف',
  'submit.sourceUrl': 'رابط المصدر',
  'submit.sourcePh': 'https://www.openstreetmap.org/…',
  'submit.send': 'إرسال للمراجعة',
  'submit.publish': 'نشر الآن',
  'submit.sending': 'جارٍ الإرسال…',
  'submit.needLocation': 'يرجى النقر على الخريطة لتحديد الموقع.',
  'submit.success': 'شكرًا! مكانك في انتظار المراجعة.',
  'submit.successAdmin': 'تم النشر. أصبح المكان ظاهرًا على الخريطة.',
  'submit.another': 'أضف مكانًا آخر',
  'submit.viewMine': 'عرض مقترحاتي',
  'submit.signinTitle': 'سجّل الدخول لإضافة مكان',
  'submit.signinBody': 'تحتاج إلى حساب حتى نُعلمك عند مراجعة مقترحك.',
  'submit.failed': 'تعذّر الإرسال: {msg}',

  'account.title': 'حسابي',
  'account.mySubs': 'مقترحاتي',
  'account.none': 'لم تقترح أي مكان بعد.',
  'account.reason': 'السبب',
  'account.submitted': 'أُرسل في {date}',

  'status.pending': 'قيد المراجعة',
  'status.approved': 'تمت الموافقة',
  'status.rejected': 'مرفوض',

  'admin.title': 'الإشراف',
  'admin.sub': 'راجع الأماكن التي اقترحها الطلبة.',
  'admin.search': 'ابحث بالاسم…',
  'admin.empty': 'لا شيء هنا.',
  'admin.approve': 'موافقة',
  'admin.reject': 'رفض',
  'admin.rejectTitle': 'رفض هذا المكان؟',
  'admin.rejectReason': 'السبب (يُرسل إلى الطالب)',
  'admin.rejectDefault': 'لم نتمكن من التحقق من هذا المكان.',
  'admin.confirmReject': 'تأكيد الرفض',
  'admin.viewMap': 'عرض على الخريطة',
  'admin.add': 'أضف مكانًا',
  'admin.refresh': 'تحديث',
  'admin.all': 'الكل',
  'admin.by': 'من {email}',
  'admin.loadError': 'تعذّر تحميل المقترحات: {msg}',
};

const DICTS: Record<Lang, Dict> = { en, fr, ar };

type I18n = {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  setLang: (l: Lang) => void;
  t: (key: Key, vars?: Record<string, string | number>) => string;
  formatDate: (iso: string) => string;
};

const Ctx = createContext<I18n | null>(null);
const STORAGE_KEY = 'uniguide.lang';

// Language lives outside React so SSR renders 'fr' and the client switches
// to the saved/browser language right after hydration (no mismatch warnings).
let memoryLang: Lang | null = null;
const listeners = new Set<() => void>();

function readLang(): Lang {
  if (memoryLang) return memoryLang;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'ar' || stored === 'fr' || stored === 'en') return stored;
  } catch {
    /* storage unavailable */
  }
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'fr').toLowerCase();
  if (nav.startsWith('ar')) return 'ar';
  if (nav.startsWith('en')) return 'en';
  return 'fr';
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore<Lang>(subscribe, readLang, () => 'fr');
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((l: Lang) => {
    memoryLang = l;
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    listeners.forEach((cb) => cb());
  }, []);

  const value = useMemo<I18n>(() => {
    const dict = DICTS[lang];
    const t: I18n['t'] = (key, vars) => {
      let s = dict[key] ?? en[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
      return s;
    };
    const formatDate = (iso: string) => {
      try {
        return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-TN' : lang === 'fr' ? 'fr-TN' : 'en-GB', {
          dateStyle: 'medium',
        }).format(new Date(iso));
      } catch {
        return iso;
      }
    };
    return { lang, dir, setLang, t, formatDate };
  }, [lang, dir, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n must be used inside <I18nProvider>');
  return v;
}

export type { Key as I18nKey };
