import {
  ApplicationDossier,
  CartItem,
  StudentProfile,
  ThesisTopic,
  AuthenticatedUser,
  UserRole,
  UserPrivilege,
  JustificatifDocument,
  DirectorScientificOpinion,
  DossierHistoryLog,
  CedocDecisionCode,
  CedocFinalDecision
} from '../types';
import { INITIAL_DOSSIERS } from '../data/initialDossiers';
import {
  getDocumentStatusMeta,
  getRequirementSpec,
  hasStoredPdfFile,
  mergeDossierWithDocumentCatalog,
  normalizeDocumentStatus
} from './documentService';
import { clearStoredUploadedPdfs } from './fileStorage';
import { resetPlatformEntities } from './platformService';

const STORAGE_KEYS = {
  CART: 'gcd_thesis_cart_v1',
  DOSSIERS: 'gcd_submitted_dossiers_v1',
  CURRENT_STUDENT: 'gcd_active_student_session_v1',
  AUTH_USER: 'gcd_auth_user_session_v2',
  REGISTERED_USERS: 'gcd_registered_users_v2',
  REMEMBER_ME: 'gcd_remember_me_v1'
};

export const MAX_CART_ITEMS = 3;

// Academic domain validation: accepts Moroccan academic domains (.ac.ma), international (.edu, .ac.uk, .univ-), and prohibits public webmail
export function isAcademicEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.trim().split('@')[1]?.toLowerCase();
  if (!domain) return false;

  const prohibitedDomains = [
    'gmail.com',
    'yahoo.com',
    'yahoo.fr',
    'hotmail.com',
    'outlook.com',
    'live.com',
    'icloud.com',
    'aol.com',
    'proton.me',
    'protonmail.com',
    'mail.ru',
    'zoho.com',
    'wanadoo.fr',
    'orange.fr',
    'free.fr'
  ];

  if (prohibitedDomains.includes(domain)) {
    return false;
  }

  if (
    domain.endsWith('.ac.ma') ||
    domain.endsWith('.edu') ||
    domain.endsWith('.ac.uk') ||
    domain.includes('univ-') ||
    domain.includes('university') ||
    domain.includes('fac') ||
    domain.includes('sup') ||
    domain.includes('.ac.') ||
    domain.includes('.edu.') ||
    domain.endsWith('.ma')
  ) {
    return true;
  }

  return false;
}

export function isStrictUsmbaEmail(email: string): boolean {
  return isAcademicEmail(email);
}

// ----------------- User Authentication Storage -----------------

// Helper mapping roles to privileges
export function getPrivilegesForRoles(roles: UserRole[]): UserPrivilege[] {
  const privs = new Set<UserPrivilege>();

  roles.forEach((r) => {
    switch (r) {
      case 'candidat':
        privs.add('create_candidature');
        privs.add('track_candidature');
        break;
      case 'enseignant':
      case 'co_encadrant':
        privs.add('consult_participating_dossiers');
        break;
      case 'directeur':
      case 'directeur_structure':
        privs.add('examine_assigned_dossiers');
        privs.add('consult_participating_dossiers');
        break;
      case 'directeur_cedoc':
        privs.add('supervise_cedoc');
        privs.add('examine_assigned_dossiers');
        break;
      case 'administrateur':
        privs.add('manage_users');
        privs.add('manage_platform_settings');
        privs.add('supervise_cedoc');
        privs.add('examine_assigned_dossiers');
        break;
    }
  });

  return Array.from(privs);
}

export function hasPrivilege(user: AuthenticatedUser | null, privilege: UserPrivilege): boolean {
  if (!user) return false;
  if (user.privileges?.includes(privilege)) return true;
  const userRoles = user.roles?.length ? user.roles : [user.role];
  return getPrivilegesForRoles(userRoles).includes(privilege);
}

export function hasAnyRole(user: AuthenticatedUser | null, targetRoles: UserRole[]): boolean {
  if (!user) return false;
  const userRoles = user.roles?.length ? user.roles : [user.role];
  return targetRoles.some((r) => userRoles.includes(r) || user.role === r);
}

export function isInstitutionalUser(user: AuthenticatedUser | null): boolean {
  return hasAnyRole(user, [
    'enseignant',
    'directeur',
    'co_encadrant',
    'directeur_structure',
    'directeur_cedoc',
    'administrateur'
  ]);
}

export const DEMO_USERS: Record<string, AuthenticatedUser> = {
  candidat: {
    id: 'user-candidat-1',
    role: 'candidat',
    roles: ['candidat'],
    privileges: getPrivilegesForRoles(['candidat']),
    authMethod: 'email_academique',
    firstName: 'Ayoub',
    lastName: 'Regragui',
    cin: 'CD712894',
    cne: 'N139820412',
    email: 'ayoub.regragui@usmba.ac.ma',
    institution: 'EST Fès - USMBA',
    titleOrDegree: 'Ingénieur d’État en Génie Logiciel',
    isEmailVerified: true,
    isActive: true
  },
  directeur: {
    id: 'user-directeur-1',
    role: 'directeur',
    roles: ['directeur', 'enseignant', 'co_encadrant'],
    privileges: getPrivilegesForRoles(['directeur', 'enseignant', 'co_encadrant']),
    authMethod: 'email_academique',
    firstName: 'Youssef',
    lastName: 'El Amrani',
    cin: 'C189204',
    email: 'youssef.elamrani@usmba.ac.ma',
    institution: 'EST Fès / Laboratoire LISS',
    titleOrDegree: 'Professeur de l’Enseignement Supérieur (Dir. Thèse)',
    isEmailVerified: true,
    isActive: true
  },
  directeur_cedoc: {
    id: 'user-dir-cedoc-1',
    role: 'directeur_cedoc',
    roles: ['directeur_cedoc', 'directeur_structure'],
    privileges: getPrivilegesForRoles(['directeur_cedoc', 'directeur_structure']),
    authMethod: 'email_academique',
    firstName: 'Mohamed',
    lastName: 'Tazi',
    cin: 'B109283',
    email: 'mohamed.tazi@usmba.ac.ma',
    institution: 'Direction du CEDoc Sciences & Technologies',
    titleOrDegree: 'Directeur du CEDoc USMBA',
    isEmailVerified: true,
    isActive: true
  },
  administrateur: {
    id: 'user-admin-1',
    role: 'administrateur',
    roles: ['administrateur', 'directeur_cedoc'],
    privileges: getPrivilegesForRoles(['administrateur', 'directeur_cedoc']),
    authMethod: 'email_academique',
    firstName: 'Karim',
    lastName: 'Berrada',
    cin: 'A450912',
    email: 'pole.doctoral@usmba.ac.ma',
    institution: 'Présidence USMBA - Pôle Études Doctorales',
    titleOrDegree: 'Vice-Doyen / Directeur de la Scolarité & Commission CEDoc',
    isEmailVerified: true,
    isActive: true
  }
};

export function getRegisteredUsers(): AuthenticatedUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
    if (!raw) {
      const initial = Object.values(DEMO_USERS);
      localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read registered users', e);
    return Object.values(DEMO_USERS);
  }
}

export function saveRegisteredUser(user: AuthenticatedUser): void {
  try {
    const current = getRegisteredUsers();
    const existingIndex = current.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
    let updated: AuthenticatedUser[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = user;
    } else {
      updated = [...current, user];
    }
    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save registered user', e);
  }
}

export function getStoredUser(): AuthenticatedUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read user from localStorage', e);
    return null;
  }
}

export function saveStoredUser(user: AuthenticatedUser | null, rememberMe: boolean = true): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, rememberMe ? 'true' : 'false');
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
    }
    window.dispatchEvent(new CustomEvent('gcd_user_updated', { detail: user }));
  } catch (e) {
    console.error('Failed to save user to localStorage', e);
  }
}

export function isRememberMeSet(): boolean {
  return localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
}

// ----------------- Registration & Authentication Service Helpers -----------------

export function registerStudentAccount(
  firstName: string,
  lastName: string,
  email: string,
  extraIdentity?: {
    cin?: string;
    passportNumber?: string;
    birthDate?: string;
    birthPlace?: string;
    nationality?: string;
    identityDocumentType?: 'cin_maroc' | 'passeport';
    identityDocumentExpiry?: string;
    ocrAssistedRegistration?: boolean;
  }
): { success: boolean; user?: AuthenticatedUser; message: string } {
  const cleanEmail = email.trim().toLowerCase();

  if (!isAcademicEmail(cleanEmail)) {
    return {
      success: false,
      message: 'L’inscription requiert une adresse e-mail académique institutionnelle valide (ex: @usmba.ac.ma, @um5.ac.ma, @uca.ac.ma, .edu, .ac.uk). Les adresses grand public (Gmail, Yahoo, Outlook) ne sont pas autorisées.'
    };
  }

  const existingUsers = getRegisteredUsers();
  const alreadyExists = existingUsers.some(u => u.email.toLowerCase() === cleanEmail);
  if (alreadyExists) {
    return {
      success: false,
      message: 'Un compte existe déjà avec cette adresse e-mail universitaire. Veuillez vous connecter.'
    };
  }

  const domain = cleanEmail.split('@')[1] || '';
  const roles: UserRole[] = ['candidat'];
  const newUser: AuthenticatedUser = {
    id: `user-student-${Date.now()}`,
    role: 'candidat',
    roles,
    privileges: getPrivilegesForRoles(roles),
    authMethod: 'email_academique',
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    ...(extraIdentity?.cin ? { cin: extraIdentity.cin.trim().toUpperCase() } : {}),
    ...(extraIdentity?.passportNumber
      ? { passportNumber: extraIdentity.passportNumber.trim().toUpperCase() }
      : {}),
    ...(extraIdentity?.birthDate ? { birthDate: extraIdentity.birthDate.trim() } : {}),
    ...(extraIdentity?.birthPlace ? { birthPlace: extraIdentity.birthPlace.trim() } : {}),
    ...(extraIdentity?.nationality ? { nationality: extraIdentity.nationality.trim() } : {}),
    ...(extraIdentity?.identityDocumentType
      ? { identityDocumentType: extraIdentity.identityDocumentType }
      : {}),
    ...(extraIdentity?.identityDocumentExpiry
      ? { identityDocumentExpiry: extraIdentity.identityDocumentExpiry.trim() }
      : {}),
    ...(extraIdentity?.ocrAssistedRegistration !== undefined
      ? { ocrAssistedRegistration: extraIdentity.ocrAssistedRegistration }
      : {}),
    email: cleanEmail,
    institution: domain ? `Établissement (${domain})` : 'Établissement Universitaire Partenaire',
    titleOrDegree: 'Étudiant / Master / Ingénieur',
    isEmailVerified: true,
    isActive: true
  };

  saveRegisteredUser(newUser);
  saveStoredUser(newUser, true);

  return {
    success: true,
    user: newUser,
    message: 'Compte étudiant créé et e-mail académique vérifié avec succès ! Bienvenue sur la plateforme GCD.'
  };
}

export function authenticateUserAccount(
  email: string,
  isInstitutionalAccess: boolean = false
): { success: boolean; user?: AuthenticatedUser; message: string } {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    return { success: false, message: 'Veuillez saisir votre adresse e-mail.' };
  }

  const registered = getRegisteredUsers();
  let user = registered.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    if (cleanEmail === DEMO_USERS.candidat.email.toLowerCase()) {
      user = DEMO_USERS.candidat;
    } else if (cleanEmail === DEMO_USERS.directeur.email.toLowerCase()) {
      user = DEMO_USERS.directeur;
    } else if (cleanEmail === DEMO_USERS.directeur_cedoc.email.toLowerCase()) {
      user = DEMO_USERS.directeur_cedoc;
    } else if (cleanEmail === DEMO_USERS.administrateur.email.toLowerCase()) {
      user = DEMO_USERS.administrateur;
    } else {
      if (isStrictUsmbaEmail(cleanEmail)) {
        if (isInstitutionalAccess) {
          return {
            success: false,
            message: 'Accès institutionnel refusé. Votre compte n’est pas enregistré comme Encadrant, Directeur ou Administrateur.'
          };
        }
        const domain = cleanEmail.split('@')[1] || '';
        const parts = cleanEmail.split('@')[0].split('.');
        const firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Étudiant';
        const lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Universitaire';

        const roles: UserRole[] = ['candidat'];
        user = {
          id: `user-auto-${Date.now()}`,
          role: 'candidat',
          roles,
          privileges: getPrivilegesForRoles(roles),
          authMethod: 'email_academique',
          firstName,
          lastName,
          email: cleanEmail,
          institution: domain ? `Établissement (${domain})` : 'Établissement Universitaire',
          titleOrDegree: 'Étudiant Candidat',
          isEmailVerified: true,
          isActive: true
        };
        saveRegisteredUser(user);
      } else {
        return {
          success: false,
          message: 'Adresse e-mail non reconnue. Veuillez utiliser une adresse académique institutionnelle valide (ex: @usmba.ac.ma, @um5.ac.ma, @uca.ac.ma, .edu, .ac.uk).'
        };
      }
    }
  }

  // Check if account is active
  if (user.isActive === false) {
    return {
      success: false,
      message: 'Ce compte utilisateur a été désactivé par l’administrateur.'
    };
  }

  // Verify role restriction for institutional access
  if (isInstitutionalAccess) {
    const hasInstitutionalRole = user.roles.some(
      r => r === 'directeur' || r === 'directeur_cedoc' || r === 'administrateur' || r === 'directeur_structure'
    );
    if (!hasInstitutionalRole && user.role !== 'directeur' && user.role !== 'administrateur' && user.role !== 'directeur_cedoc') {
      return {
        success: false,
        message: 'Accès réservé au personnel institutionnel. Les comptes étudiants ne peuvent pas se connecter depuis cet espace.'
      };
    }
  }

  return {
    success: true,
    user,
    message: 'Connexion réussie à la plateforme GCD.'
  };
}

// ----------------- Cart Storage -----------------

export function getStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CART);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read cart from localStorage', e);
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('gcd_cart_updated', { detail: items }));
  } catch (e) {
    console.error('Failed to save cart to localStorage', e);
  }
}

export function addToCart(topic: ThesisTopic): { success: boolean; message: string; cart: CartItem[] } {
  const currentCart = getStoredCart();

  const exists = currentCart.some((item) => item.topic.id === topic.id);
  if (exists) {
    return {
      success: false,
      message: 'Ce sujet est déjà dans votre panier.',
      cart: currentCart
    };
  }

  if (currentCart.length >= MAX_CART_ITEMS) {
    return {
      success: false,
      message: `Limite atteinte : la réglementation doctorale autorise un maximum strict de ${MAX_CART_ITEMS} choix de sujets.`,
      cart: currentCart
    };
  }

  const newPriority = (currentCart.length + 1) as 1 | 2 | 3;
  const newItem: CartItem = {
    topic,
    priority: newPriority,
    addedAt: new Date().toISOString()
  };

  const updatedCart = [...currentCart, newItem];
  saveCart(updatedCart);

  return {
    success: true,
    message: `Sujet ajouté au panier (Choix n°${newPriority}).`,
    cart: updatedCart
  };
}

export function removeFromCart(topicId: string): CartItem[] {
  const currentCart = getStoredCart();
  const filtered = currentCart.filter((item) => item.topic.id !== topicId);
  const reIndexed = filtered.map((item, idx) => ({
    ...item,
    priority: (idx + 1) as 1 | 2 | 3
  }));
  saveCart(reIndexed);
  return reIndexed;
}

export function reorderCart(newOrderedItems: CartItem[]): CartItem[] {
  const reIndexed = newOrderedItems.map((item, idx) => ({
    ...item,
    priority: (idx + 1) as 1 | 2 | 3
  }));
  saveCart(reIndexed);
  return reIndexed;
}

export function clearCart(): void {
  saveCart([]);
}

// ----------------- Dossiers Storage -----------------

export function getStoredDossiers(): ApplicationDossier[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DOSSIERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.DOSSIERS, JSON.stringify(INITIAL_DOSSIERS));
      return INITIAL_DOSSIERS;
    }
    const parsed: ApplicationDossier[] = JSON.parse(raw);

    // Seamless migration: upgrade pre-seeded demo docs that still hold legacy inline base64
    // without storageKey or fileUrl so they point to real multi-page /demo-pdfs/*.pdf files
    let migrated = false;
    const upgraded = parsed.map((dossier) => {
      const seedDossier = INITIAL_DOSSIERS.find((s) => s.id === dossier.id);
      if (!seedDossier || !dossier.documentsList) return dossier;

      const docs = dossier.documentsList.map((doc) => {
        if (!doc.storageKey && !doc.fileUrl && doc.fileData) {
          const seedDoc = seedDossier.documentsList?.find((sd) => sd.id === doc.id);
          if (seedDoc?.fileUrl) {
            migrated = true;
            return {
              ...doc,
              fileName: seedDoc.fileName,
              fileSize: seedDoc.fileSize,
              fileUrl: seedDoc.fileUrl,
              fileData: undefined,
              technicalCheck: seedDoc.technicalCheck || doc.technicalCheck
            };
          }
        }
        return doc;
      });

      let nextDossier: ApplicationDossier = { ...dossier, documentsList: docs };

      // Seamless upgrade of legacy un-completed pre-seeded dos-100 (3 legacy docs -> 6 Regragui demo PDFs)
      if (
        dossier.id === 'dos-100' &&
        !dossier.directorTreatmentCompleted &&
        !dossier.scientificOpinion &&
        !docs.some((doc) => doc.fileUrl?.includes('/demo-pdfs/ayoub-regragui/'))
      ) {
        migrated = true;
        return seedDossier;
      }

      if (
        dossier.id === 'dos-101' &&
        dossier.scientificOpinion &&
        !dossier.directorTreatmentCompleted
      ) {
        migrated = true;
        nextDossier = {
          ...nextDossier,
          isDemo: true,
          documentsStepValidated: true,
          documentsValidatedAt: seedDossier.documentsValidatedAt,
          documentsValidatedBy: seedDossier.documentsValidatedBy,
          directorTreatmentCompleted: true,
          directorProcessedAt: seedDossier.directorProcessedAt,
          scientificOpinion: {
            ...seedDossier.scientificOpinion,
            ...dossier.scientificOpinion
          }
        };
      }

      if (
        dossier.id === 'dos-103' &&
        dossier.status === 'avis_favorable_reserve' &&
        docs.some((d) => d.status === 'remplacement_demande')
      ) {
        migrated = true;
        nextDossier = {
          ...nextDossier,
          isDemo: true,
          status: 'documents_non_conformes',
          documentsStepValidated: false,
          directorTreatmentCompleted: false,
          scientificOpinion: undefined
        };
      }

      if (nextDossier.isDemo === undefined) {
        migrated = true;
        nextDossier = { ...nextDossier, isDemo: true };
      }

      return nextDossier;
    });

    if (migrated) {
      localStorage.setItem(STORAGE_KEYS.DOSSIERS, JSON.stringify(upgraded));
    }
    return upgraded;
  } catch (e) {
    console.error('Failed to read dossiers from localStorage', e);
    return INITIAL_DOSSIERS;
  }
}

export function saveDossiers(dossiers: ApplicationDossier[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DOSSIERS, JSON.stringify(dossiers));
    window.dispatchEvent(new CustomEvent('gcd_dossiers_updated', { detail: dossiers }));
  } catch (e) {
    console.error('Failed to save dossiers to localStorage', e);
  }
}

export function submitDossier(
  student: StudentProfile,
  cartItems: CartItem[],
  customDocuments?: JustificatifDocument[]
): { success: boolean; dossier?: ApplicationDossier; message: string } {
  if (cartItems.length === 0) {
    return { success: false, message: 'Le panier est vide. Veuillez sélectionner au moins un sujet.' };
  }
  if (cartItems.length > MAX_CART_ITEMS) {
    return { success: false, message: `Maximum de ${MAX_CART_ITEMS} sujets autorisé.` };
  }
  if (!isAcademicEmail(student.academicEmail)) {
    return {
      success: false,
      message: 'Adresse académique invalide. Veuillez utiliser une adresse institutionnelle universitaire (ex: @usmba.ac.ma, @um5.ac.ma, @uca.ac.ma, .edu, .ac.uk).'
    };
  }
  if (!student.legalConsent) {
    return {
      success: false,
      message: 'Vous devez consentir aux règles de conformité et certifier l’exactitude de vos diplômes.'
    };
  }

  const dossiers = getStoredDossiers();
  const count = dossiers.length + 1;
  const refNum = `GCD-2026-USMBA-${String(count).padStart(4, '0')}`;
  const nowIso = new Date().toISOString();

  // Only keep genuinely uploaded documents; never generate fake PDFs
  const documentsList: JustificatifDocument[] = (customDocuments || []).filter((doc) =>
    hasStoredPdfFile(doc)
  );

  const initialLog: DossierHistoryLog = {
    id: `log-submit-${Date.now()}`,
    timestamp: nowIso,
    authorName: `${student.firstName} ${student.lastName}`,
    authorRole: 'candidat',
    action: 'Dépôt officiel du dossier de candidature',
    details: `Transmis avec ${documentsList.length} pièce(s) justificative(s) PDF réelle(s) pour ${cartItems.length} sujet(s) choisi(s).`,
    statusAfter: 'en_attente'
  };

  const newDossier: ApplicationDossier = {
    id: `dos-${Date.now()}`,
    referenceNumber: refNum,
    isDemo: false,
    student,
    selectedTopics: cartItems.map((c) => ({
      topicId: c.topic.id,
      topicCode: c.topic.code,
      topicTitle: c.topic.title,
      director: c.topic.director,
      laboratory: c.topic.laboratory,
      priority: c.priority
    })),
    submittedAt: nowIso,
    status: 'en_attente',
    documentsList,
    historyLogs: [initialLog]
  };

  const updatedDossiers = [newDossier, ...dossiers];
  saveDossiers(updatedDossiers);
  clearCart();

  localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT, JSON.stringify(student));

  return {
    success: true,
    dossier: newDossier,
    message: `Dossier N° ${refNum} transmis avec succès à la commission doctorale !`
  };
}

/**
 * Step 1 Gate: Director can examine candidate documents and advance to Step 2 (Avis scientifique).
 * In demonstration mode and streamlined workflow, document examination is ergonomic and non-blocking.
 */
export function canPassToScientificOpinion(_dossier: ApplicationDossier): {
  allowed: boolean;
  reasons: string[];
} {
  return {
    allowed: true,
    reasons: []
  };
}

export function isDossierDocumentsStepValidated(dossier: ApplicationDossier): boolean {
  return Boolean(
    dossier.documentsStepValidated ||
      dossier.directorTreatmentCompleted ||
      dossier.scientificOpinion
  );
}

/**
 * Step 2 Completion Check: A dossier is considered processed/archived
 * by the Director when the scientific opinion has been recorded.
 */
export function isDossierProcessedByDirector(dossier: ApplicationDossier): boolean {
  return Boolean(dossier.directorTreatmentCompleted || dossier.scientificOpinion);
}

/**
 * Step 3 Gate (Décision Finale CEDoc):
 * CEDoc can access and decide on a dossier once the Thesis Director has recorded their scientific opinion.
 */
export function canPassToCedocFinalDecision(dossier: ApplicationDossier): {
  allowed: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (!dossier.scientificOpinion && !dossier.directorTreatmentCompleted) {
    reasons.push(
      'Avis scientifique en attente : le Directeur de thèse doit d’abord émettre son avis scientifique sur la candidature.'
    );
  }

  return {
    allowed: reasons.length === 0,
    reasons
  };
}


export function validateDossierDocumentsStage(
  dossierId: string,
  authorName: string,
  authorRole: UserRole = 'directeur'
): { success: boolean; message: string; dossiers: ApplicationDossier[]; reasons?: string[] } {
  const dossiers = getStoredDossiers();
  const target = dossiers.find((d) => d.id === dossierId);

  if (!target) {
    return { success: false, message: 'Dossier introuvable.', dossiers };
  }

  const gate = canPassToScientificOpinion(target);
  if (!gate.allowed) {
    return {
      success: false,
      message:
        'Impossible de passer à l’avis scientifique : tous les documents obligatoires doivent être déposés et validés conformes.',
      reasons: gate.reasons,
      dossiers
    };
  }

  const nowIso = new Date().toISOString();
  const updated = dossiers.map((d) => {
    if (d.id !== dossierId) return d;

    const nextStatus =
      d.status === 'en_attente' || d.status === 'documents_non_conformes'
        ? 'documents_en_cours'
        : d.status;

    const newLog: DossierHistoryLog = {
      id: `log-step1-${Date.now()}`,
      timestamp: nowIso,
      authorName,
      authorRole,
      action: 'Validation complète des documents justificatifs (Étape 1 terminée)',
      details:
        'Tous les documents obligatoires ont été vérifiés et certifiés conformes. Étape 2 (Avis scientifique) débloquée.',
      statusAfter: nextStatus
    };

    return {
      ...d,
      status: nextStatus,
      documentsStepValidated: true,
      documentsValidatedAt: nowIso,
      documentsValidatedBy: authorName,
      historyLogs: d.historyLogs ? [newLog, ...d.historyLogs] : [newLog]
    };
  });

  saveDossiers(updated);
  return {
    success: true,
    message: 'Documents obligatoires validés. Étape 2 (Avis scientifique) débloquée.',
    dossiers: updated
  };
}

export function updateDocumentVerification(
  dossierId: string,
  docId: string,
  docStatus: JustificatifDocument['status'],
  remark?: string,
  authorName: string = 'Directeur de Thèse',
  authorRole: UserRole = 'directeur',
  fallbackCategory?: JustificatifDocument['category']
): ApplicationDossier[] {
  const dossiers = getStoredDossiers();
  const nowIso = new Date().toISOString();
  const canonicalStatus = normalizeDocumentStatus(docStatus);
  const statusMeta = getDocumentStatusMeta(canonicalStatus);

  const updated = dossiers.map((d) => {
    if (d.id === dossierId) {
      const existingList = d.documentsList || [];
      let targetDocLabel = '';
      let matched = false;

      let updatedDocs = existingList.map((doc) => {
        if (doc.id === docId) {
          matched = true;
          targetDocLabel = doc.label;
          return {
            ...doc,
            status: canonicalStatus,
            remark: remark !== undefined ? remark : doc.remark,
            reviewedBy: authorName,
            reviewedAt: nowIso
          };
        }
        return doc;
      });

      // Support director flagging an un-uploaded catalog slot (e.g., slot-lettre_motivation)
      if (!matched && (fallbackCategory || docId.startsWith('slot-'))) {
        const category = (fallbackCategory || docId.replace('slot-', '')) as JustificatifDocument['category'];
        const spec = getRequirementSpec(category);
        targetDocLabel = spec.label;
        const slotDoc: JustificatifDocument = {
          id: `doc-slot-${category}-${Date.now()}`,
          category,
          label: spec.label,
          description: spec.description,
          required: spec.required,
          fileName: '',
          fileType: 'application/pdf',
          fileSize: '',
          uploadDate: '',
          status: canonicalStatus,
          remark: remark?.trim() || undefined,
          reviewedBy: authorName,
          reviewedAt: nowIso,
          version: 0
        };
        updatedDocs = [...updatedDocs, slotDoc];
      }

      const hasActionRequired = updatedDocs.some((doc) => {
        const st = normalizeDocumentStatus(doc.status);
        return (
          st === 'non_conforme' ||
          st === 'complement_demande' ||
          st === 'remplacement_demande'
        );
      });

      const allConform =
        updatedDocs.length > 0 &&
        updatedDocs.every((doc) => normalizeDocumentStatus(doc.status) === 'conforme');

      let newStatus = d.status;
      if (hasActionRequired) {
        newStatus = 'documents_non_conformes';
      } else if (
        d.status === 'en_attente' ||
        d.status === 'documents_non_conformes' ||
        allConform
      ) {
        if (
          d.status === 'en_attente' ||
          d.status === 'documents_en_cours' ||
          d.status === 'documents_non_conformes'
        ) {
          newStatus = 'documents_en_cours';
        }
      }

      const newLog: DossierHistoryLog = {
        id: `log-verif-${Date.now()}`,
        timestamp: nowIso,
        authorName,
        authorRole,
        action: `Contrôle documentaire (${statusMeta.label}) : ${targetDocLabel || 'Document justificatif'}`,
        details: remark?.trim()
          ? `Décision : ${statusMeta.label}. Motif / observation : ${remark.trim()}`
          : `Statut du document mis à jour vers « ${statusMeta.label} ».`,
        statusAfter: newStatus
      };

      const historyLogs = d.historyLogs ? [newLog, ...d.historyLogs] : [newLog];

      // Invariant: requesting complement/rejection/non-conform keeps dossier in active treatment and locks Step 2
      const shouldInvalidateSteps =
        hasActionRequired || canonicalStatus !== 'conforme';

      return {
        ...d,
        status: newStatus,
        documentsList: updatedDocs,
        documentsStepValidated: shouldInvalidateSteps ? false : d.documentsStepValidated,
        directorTreatmentCompleted: shouldInvalidateSteps ? false : d.directorTreatmentCompleted,
        historyLogs
      };
    }
    return d;
  });

  saveDossiers(updated);
  return updated;
}

export function saveCedocFinalDecision(
  dossierId: string,
  decisionStatus: 'transmis_cedoc' | 'convoque_entretien' | 'retenu' | 'non_conforme',
  decisionNote: string,
  author: AuthenticatedUser,
  interviewDate?: string,
  interviewMode?: 'presentiel' | 'visioconference',
  interviewRoom?: string
): {
  success: boolean;
  message: string;
  dossiers: ApplicationDossier[];
  updatedDossier?: ApplicationDossier;
  reasons?: string[];
} {
  const dossiers = getStoredDossiers();

  if (!author || !hasPrivilege(author, 'supervise_cedoc')) {
    return {
      success: false,
      message: 'Action réservée au Directeur du CEDoc (privilège supervise_cedoc requis).',
      dossiers
    };
  }

  const target = dossiers.find((d) => d.id === dossierId);
  if (!target) {
    return {
      success: false,
      message: 'Dossier de candidature introuvable.',
      dossiers
    };
  }

  const cedocGate = canPassToCedocFinalDecision(target);
  if (!cedocGate.allowed) {
    return {
      success: false,
      message:
        'Décision CEDoc impossible : les étapes 1 (documents conformes) et 2 (avis scientifique du directeur) doivent obligatoirement être terminées.',
      reasons: cedocGate.reasons,
      dossiers
    };
  }

  const trimmedNote = (decisionNote || '').trim();
  if (!trimmedNote) {
    return {
      success: false,
      message:
        decisionStatus === 'non_conforme'
          ? 'Veuillez obligatoirement saisir le motif du rejet / non-retenue avant de valider.'
          : 'Veuillez obligatoirement saisir l’observation officielle du CEDoc avant de valider.',
      dossiers
    };
  }

  if (decisionStatus === 'convoque_entretien') {
    if (!interviewDate || !interviewDate.trim()) {
      return {
        success: false,
        message: 'Veuillez préciser la date et l’heure de l’entretien oral.',
        dossiers
      };
    }
    if (!interviewRoom || !interviewRoom.trim()) {
      return {
        success: false,
        message: 'Veuillez préciser la salle ou le lien de visioconférence pour l’entretien.',
        dossiers
      };
    }
  }

  const decisionMetaMap: Record<
    typeof decisionStatus,
    { code: CedocDecisionCode; label: string; action: string }
  > = {
    transmis_cedoc: {
      code: 'EN_EXAMEN_CEDOC',
      label: 'En cours d’examen CEDoc',
      action: 'Décision CEDoc (EN_EXAMEN_CEDOC) : Dossier conservé en cours d’examen'
    },
    convoque_entretien: {
      code: 'ENTRETIEN_A_PLANIFIER',
      label: 'Convoqué à l’entretien oral',
      action: 'Décision CEDoc (ENTRETIEN_A_PLANIFIER) : Convocation à l’entretien oral de sélection'
    },
    retenu: {
      code: 'ADMIS',
      label: 'Admis / Retenu définitivement',
      action: 'Décision finale CEDoc (ADMIS) : Candidature retenue — Inscription définitive autorisée'
    },
    non_conforme: {
      code: 'REJETE',
      label: 'Non retenu / Rejeté',
      action: 'Décision finale CEDoc (REJETE) : Candidature non retenue'
    }
  };

  const meta = decisionMetaMap[decisionStatus];
  const nowIso = new Date().toISOString();
  const authorFullName = `${author.firstName} ${author.lastName}`;
  let updatedTarget: ApplicationDossier | undefined;

  const updated = dossiers.map((d) => {
    if (d.id !== dossierId) return d;

    const interviewDetails =
      decisionStatus === 'convoque_entretien' && interviewDate
        ? ` — Entretien prévu le ${new Date(interviewDate).toLocaleString('fr-FR')} (${
            interviewMode === 'visioconference' ? 'Visioconférence' : 'Présentiel'
          } : ${interviewRoom?.trim() || 'Campus USMBA'})`
        : '';

    const newLog: DossierHistoryLog = {
      id: `log-cedoc-${Date.now()}`,
      timestamp: nowIso,
      authorName: authorFullName,
      authorRole: author.role,
      action: meta.action,
      details: `${trimmedNote}${interviewDetails}`,
      statusAfter: decisionStatus
    };

    const historyLogs = d.historyLogs ? [newLog, ...d.historyLogs] : [newLog];
    const hasConformDocs =
      d.documentsList?.every((doc) => normalizeDocumentStatus(doc.status) === 'conforme') ?? true;

    const cedocDecision: CedocFinalDecision = {
      decisionStatus,
      decisionCode: meta.code,
      decisionLabel: meta.label,
      observation: trimmedNote,
      decidedAt: nowIso,
      decidedBy: authorFullName,
      decidedByEmail: author.email,
      interviewDate:
        decisionStatus === 'convoque_entretien' ? interviewDate?.trim() : undefined,
      interviewMode:
        decisionStatus === 'convoque_entretien' ? interviewMode || 'presentiel' : undefined,
      interviewRoom:
        decisionStatus === 'convoque_entretien' ? interviewRoom?.trim() : undefined
    };

    updatedTarget = {
      ...d,
      status: decisionStatus,
      cedocDecision,
      historyLogs,
      verificationAudit: {
        verifiedBy: authorFullName,
        verifiedAt: nowIso,
        isDegreeValid: decisionStatus !== 'non_conforme' && hasConformDocs,
        isTranscriptValid: decisionStatus !== 'non_conforme' && hasConformDocs,
        auditNote: trimmedNote,
        interviewDate:
          decisionStatus === 'convoque_entretien'
            ? interviewDate?.trim()
            : d.verificationAudit?.interviewDate,
        interviewMode:
          decisionStatus === 'convoque_entretien'
            ? interviewMode || 'presentiel'
            : d.verificationAudit?.interviewMode,
        interviewRoom:
          decisionStatus === 'convoque_entretien'
            ? interviewRoom?.trim()
            : d.verificationAudit?.interviewRoom
      }
    };

    return updatedTarget;
  });

  saveDossiers(updated);
  return {
    success: true,
    message: `Décision CEDoc enregistrée (${meta.code} — ${meta.label}) pour le dossier ${target.referenceNumber}.`,
    dossiers: updated,
    updatedDossier: updatedTarget
  };
}

export function saveDirectorScientificOpinion(
  dossierId: string,
  opinion: DirectorScientificOpinion
): ApplicationDossier[] {
  const dossiers = getStoredDossiers();
  const nowIso = new Date().toISOString();

  const updated = dossiers.map((d) => {
    if (d.id === dossierId) {
      const gate = canPassToScientificOpinion(d);
      if (!gate.allowed) {
        return d;
      }

      let nextStatus: ApplicationDossier['status'] = 'avis_favorable';
      if (opinion.decision === 'favorable') {
        nextStatus = 'avis_favorable';
      } else if (opinion.decision === 'favorable_reserve') {
        nextStatus = 'avis_favorable_reserve';
      } else if (opinion.decision === 'defavorable') {
        nextStatus = 'avis_defavorable';
      }

      const decisionLabel =
        opinion.decision === 'favorable'
          ? 'Avis Favorable'
          : opinion.decision === 'favorable_reserve'
          ? 'Avis Favorable sous réserve'
          : 'Avis Défavorable';

      const newLog: DossierHistoryLog = {
        id: `log-${Date.now()}`,
        timestamp: nowIso,
        authorName: opinion.directorName,
        authorRole: 'directeur',
        action: `Avis scientifique validé & dossier clôturé (${decisionLabel})`,
        details:
          (opinion.appreciation ? `Appréciation : ${opinion.appreciation}. ` : '') +
          opinion.comment +
          (opinion.recommendations ? ` Recommandations : ${opinion.recommendations}.` : '') +
          (opinion.reservesOrJustification ? ` (${opinion.reservesOrJustification})` : ''),
        statusAfter: nextStatus
      };

      const historyLogs = d.historyLogs ? [newLog, ...d.historyLogs] : [newLog];

      return {
        ...d,
        status: nextStatus,
        documentsStepValidated: true,
        documentsValidatedAt: d.documentsValidatedAt || nowIso,
        documentsValidatedBy: d.documentsValidatedBy || opinion.directorName,
        directorTreatmentCompleted: true,
        directorProcessedAt: nowIso,
        scientificOpinion: opinion,
        historyLogs
      };
    }
    return d;
  });

  saveDossiers(updated);
  return updated;
}

export function updateDossierAudit(
  dossierId: string,
  auditData: {
    verifiedBy: string;
    isDegreeValid: boolean;
    isTranscriptValid: boolean;
    auditNote: string;
    status: ApplicationDossier['status'];
    interviewDate?: string;
    interviewMode?: 'presentiel' | 'visioconference';
    interviewRoom?: string;
  }
): ApplicationDossier[] {
  const dossiers = getStoredDossiers();
  const updated = dossiers.map((d) => {
    if (d.id === dossierId) {
      const newLog: DossierHistoryLog = {
        id: `log-audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        authorName: auditData.verifiedBy,
        authorRole: 'directeur',
        action: `Mise a jour de la conformite : ${auditData.status}`,
        details: auditData.auditNote,
        statusAfter: auditData.status
      };

      const historyLogs = d.historyLogs ? [newLog, ...d.historyLogs] : [newLog];

      return {
        ...d,
        status: auditData.status,
        historyLogs,
        verificationAudit: {
          verifiedBy: auditData.verifiedBy,
          verifiedAt: new Date().toISOString(),
          isDegreeValid: auditData.isDegreeValid,
          isTranscriptValid: auditData.isTranscriptValid,
          auditNote: auditData.auditNote,
          interviewDate: auditData.interviewDate,
          interviewMode: auditData.interviewMode,
          interviewRoom: auditData.interviewRoom
        }
      };
    }
    return d;
  });

  saveDossiers(updated);
  return updated;
}

export function resetDemoData(): void {
  localStorage.setItem(STORAGE_KEYS.DOSSIERS, JSON.stringify(INITIAL_DOSSIERS));
  clearCart();
  localStorage.removeItem(STORAGE_KEYS.CURRENT_STUDENT);
  localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  localStorage.removeItem(STORAGE_KEYS.REGISTERED_USERS);
  resetPlatformEntities();
  clearStoredUploadedPdfs().finally(() => {
    window.location.reload();
  });
}
