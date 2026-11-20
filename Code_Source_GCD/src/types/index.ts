export type DomainCategory =
  | 'Tous les domaines'
  | 'Intelligence Artificielle & Données'
  | 'Cybersécurité & Réseaux IoT'
  | 'Énergies Propres & Environnement'
  | 'Biotechnologie & Santé'
  | 'Génie Mécanique & Matériaux'
  | 'Génie Logiciel & Cloud';

export interface ThesisTopic {
  id: string;
  code: string;
  title: string;
  domain: string;
  director: string;
  directorTitle: string;
  coDirector?: string;
  laboratory: string;
  institution: string;
  abstract: string;
  prerequisites: string[];
  keywords: string[];
  deadline: string;
  funding: string;
  availableSpots: number;
}

export interface CartItem {
  topic: ThesisTopic;
  priority: 1 | 2 | 3;
  addedAt: string;
}

export interface StudentProfile {
  firstName: string;
  lastName: string;
  cin?: string;
  cne: string; // Massar or CNE
  academicEmail: string;
  phone: string;
  currentInstitution: string;
  degreeDeclared: string;
  graduationYear: string;
  gpa: string;
  researchProposal?: string;
  documents: {
    diplomaName: string;
    transcriptName: string;
    cvName: string;
    researchProjectName?: string;
  };
  legalConsent: boolean;
}

export type DossierStatus =
  | 'en_attente'
  | 'documents_en_cours'
  | 'documents_non_conformes'
  | 'avis_favorable'
  | 'avis_favorable_reserve'
  | 'avis_defavorable'
  | 'transmis_cedoc'
  | 'diplome_conforme' // backward compatibility
  | 'non_conforme'
  | 'convoque_entretien'
  | 'retenu';

export type DocumentCategory =
  | 'diplome'
  | 'releve_notes'
  | 'cv'
  | 'lettre_motivation'
  | 'projet_recherche'
  | 'autre';

export type DocumentVerificationStatus =
  | 'non_depose'
  | 'en_attente_verification'
  | 'conforme'
  | 'non_conforme'
  | 'complement_demande'
  | 'remplacement_demande'
  | 'non_examine'
  | 'manquant';

export interface DocumentTechnicalCheck {
  isPdfFormatValid: boolean;
  isSizeValid: boolean;
  isFilePresent: boolean;
  isIntegrityValid: boolean;
  maxAllowedSizeMb: number;
  fileSizeBytes: number;
  sha256Short?: string;
  checkedAt: string;
  summary: string;
}

export interface JustificatifDocument {
  id: string;
  category: DocumentCategory;
  label: string;
  description?: string;
  required?: boolean;
  fileName: string;
  fileType: string; // 'application/pdf'
  fileSize: string; // e.g. '1.4 MB'
  uploadDate: string;
  fileData?: string; // legacy/small base64 Data URL 'data:application/pdf;base64,...'
  storageKey?: string; // IndexedDB key for real binary PDF persistence
  fileUrl?: string; // Static/HTTP URL for demo PDFs (e.g. '/demo-pdfs/...')
  status: DocumentVerificationStatus;
  remark?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  version?: number;
  technicalCheck?: DocumentTechnicalCheck;
}

export type ScientificOpinionDecision = 'favorable' | 'favorable_reserve' | 'defavorable';

export interface DirectorScientificOpinion {
  decision: ScientificOpinionDecision;
  appreciation?: string;
  recommendations?: string;
  comment: string;
  reservesOrJustification?: string;
  decisionDate?: string;
  submittedAt: string;
  directorName: string;
  directorTitle: string;
  directorEmail: string;
}

export interface DossierHistoryLog {
  id: string;
  timestamp: string;
  authorName: string;
  authorRole: UserRole;
  action: string;
  details: string;
  statusAfter: DossierStatus;
}

export type CedocDecisionCode =
  | 'ADMIS'
  | 'REJETE'
  | 'EN_EXAMEN_CEDOC'
  | 'ENTRETIEN_A_PLANIFIER';

export interface CedocFinalDecision {
  decisionStatus: 'transmis_cedoc' | 'convoque_entretien' | 'retenu' | 'non_conforme';
  decisionCode: CedocDecisionCode;
  decisionLabel: string;
  observation: string;
  decidedAt: string;
  decidedBy: string;
  decidedByEmail?: string;
  interviewDate?: string;
  interviewMode?: 'presentiel' | 'visioconference';
  interviewRoom?: string;
}

export interface VerificationAudit {
  verifiedBy: string;
  verifiedAt: string;
  isDegreeValid: boolean;
  isTranscriptValid: boolean;
  auditNote: string;
  interviewDate?: string;
  interviewMode?: 'presentiel' | 'visioconference';
  interviewRoom?: string;
}

export interface ApplicationDossier {
  id: string;
  referenceNumber: string;
  isDemo?: boolean;
  student: StudentProfile;
  selectedTopics: Array<{
    topicId: string;
    topicCode: string;
    topicTitle: string;
    director: string;
    laboratory: string;
    priority: 1 | 2 | 3;
  }>;
  submittedAt: string;
  status: DossierStatus;
  documentsList?: JustificatifDocument[];
  documentsStepValidated?: boolean;
  documentsValidatedAt?: string;
  documentsValidatedBy?: string;
  directorTreatmentCompleted?: boolean;
  directorProcessedAt?: string;
  scientificOpinion?: DirectorScientificOpinion;
  cedocDecision?: CedocFinalDecision;
  historyLogs?: DossierHistoryLog[];
  verificationAudit?: VerificationAudit;
}

export type UserRole =
  | 'candidat'
  | 'enseignant'
  | 'directeur'
  | 'co_encadrant'
  | 'directeur_structure'
  | 'directeur_cedoc'
  | 'administrateur';

export type UserPrivilege =
  | 'create_candidature'
  | 'track_candidature'
  | 'examine_assigned_dossiers'
  | 'consult_participating_dossiers'
  | 'supervise_cedoc'
  | 'manage_users'
  | 'manage_platform_settings';

export type AuthMethod = 'email_academique';

export type IdentityDocumentType = 'cin_maroc' | 'passeport';

export interface OcrExtractedField<T = string> {
  value: T;
  confidence: number; // 0..100
  uncertain: boolean;
  source: 'ocr' | 'mrz' | 'manual' | 'none';
}

export interface IdentityOcrExtractionResult {
  documentType: IdentityDocumentType;
  overallConfidence: number;
  qualityWarnings: string[];
  inconsistencyWarnings: string[];
  rawLineCount: number;
  extractedFieldCount: number;
  fields: {
    lastName: OcrExtractedField;
    firstName: OcrExtractedField;
    birthDate: OcrExtractedField;
    birthPlace: OcrExtractedField;
    documentNumber: OcrExtractedField;
    nationality: OcrExtractedField;
    expiryDate: OcrExtractedField;
  };
}

export interface ConfirmedIdentityData {
  documentType: IdentityDocumentType;
  lastName: string;
  firstName: string;
  birthDate: string;
  birthPlace: string;
  documentNumber: string;
  nationality: string;
  expiryDate: string;
  ocrAssisted: boolean;
}

export interface AuthenticatedUser {
  id: string;
  role: UserRole; // primary role for backward compatibility
  roles: UserRole[]; // multiple roles support
  privileges: UserPrivilege[]; // granular privileges derived from roles
  authMethod: AuthMethod;
  firstName: string;
  lastName: string;
  cin?: string;
  passportNumber?: string;
  birthDate?: string;
  birthPlace?: string;
  nationality?: string;
  identityDocumentType?: IdentityDocumentType;
  identityDocumentExpiry?: string;
  ocrAssistedRegistration?: boolean;
  cne?: string;
  email: string;
  institution?: string;
  titleOrDegree?: string;
  isEmailVerified?: boolean;
  isActive?: boolean; // account activation status
}

export type ActivePage = 'accueil' | 'campagnes' | 'mon_dossier' | 'acces_institutionnel' | 'matrice_gcd';
export type ActiveView = ActivePage; // Backward compatibility
