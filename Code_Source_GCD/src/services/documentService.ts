import {
  ApplicationDossier,
  DocumentCategory,
  DocumentTechnicalCheck,
  DocumentVerificationStatus,
  JustificatifDocument
} from '../types';

const MAX_PDF_SIZE_STORAGE_KEY = 'gcd_max_pdf_size_mb_v1';
export const DEFAULT_MAX_PDF_SIZE_MB = 10;
export const ALLOWED_MAX_PDF_SIZES_MB = [2, 5, 10, 15, 20];

export interface DocumentRequirementSpec {
  category: DocumentCategory;
  label: string;
  description: string;
  required: boolean;
}

export const DOCUMENT_REQUIREMENTS: DocumentRequirementSpec[] = [
  {
    category: 'diplome',
    label: 'Attestation de diplôme ou de réussite',
    description:
      'Copie du diplôme de Master, d’Ingénieur d’État ou attestation officielle de réussite délivrée par l’établissement.',
    required: true
  },
  {
    category: 'releve_notes',
    label: 'Relevés de notes officiels',
    description:
      'Relevés de notes complets et certifiés du cursus (semestres S1 à S4 / cycle ingénieur) mentionnant les moyennes.',
    required: true
  },
  {
    category: 'cv',
    label: 'Curriculum Vitae académique',
    description:
      'Parcours universitaire détaillé, expériences de recherche, stages, publications scientifiques et compétences techniques.',
    required: true
  },
  {
    category: 'lettre_motivation',
    label: 'Lettre de motivation',
    description:
      'Lettre exposant vos motivations scientifiques, l’adéquation avec les sujets choisis et votre projet doctoral.',
    required: true
  },
  {
    category: 'projet_recherche',
    label: 'Projet de recherche / Avant-projet de thèse',
    description:
      'Note scientifique structurée présentant la problématique, l’état de l’art, la méthodologie et la bibliographie.',
    required: true
  },
  {
    category: 'autre',
    label: 'Autres pièces justificatives complémentaires',
    description:
      'Pièces facultatives ou demandées en complément (lettre de recommandation, certificat de langue, attestation).',
    required: false
  }
];

export function getMaxPdfSizeMb(): number {
  try {
    const raw = localStorage.getItem(MAX_PDF_SIZE_STORAGE_KEY);
    if (!raw) return DEFAULT_MAX_PDF_SIZE_MB;
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 50) {
      return parsed;
    }
    return DEFAULT_MAX_PDF_SIZE_MB;
  } catch {
    return DEFAULT_MAX_PDF_SIZE_MB;
  }
}

export function setMaxPdfSizeMb(sizeMb: number): void {
  try {
    const clamped = Math.max(1, Math.min(50, Math.round(sizeMb)));
    localStorage.setItem(MAX_PDF_SIZE_STORAGE_KEY, String(clamped));
    window.dispatchEvent(new CustomEvent('gcd_settings_updated', { detail: { maxPdfSizeMb: clamped } }));
  } catch (e) {
    console.error('Failed to persist max PDF size', e);
  }
}

export type CanonicalDocumentStatus =
  | 'non_depose'
  | 'en_attente_verification'
  | 'conforme'
  | 'non_conforme'
  | 'complement_demande'
  | 'remplacement_demande';

export function normalizeDocumentStatus(
  status?: DocumentVerificationStatus
): CanonicalDocumentStatus {
  switch (status) {
    case 'conforme':
      return 'conforme';
    case 'non_conforme':
      return 'non_conforme';
    case 'complement_demande':
      return 'complement_demande';
    case 'remplacement_demande':
      return 'remplacement_demande';
    case 'en_attente_verification':
    case 'non_examine':
      return 'en_attente_verification';
    case 'non_depose':
    case 'manquant':
    default:
      return 'non_depose';
  }
}

export interface DocumentStatusMeta {
  status: CanonicalDocumentStatus;
  label: string;
  badgeClass: string;
  rowBgClass: string;
  requiresCandidateAction: boolean;
}

export function getDocumentStatusMeta(status?: DocumentVerificationStatus): DocumentStatusMeta {
  const normalized = normalizeDocumentStatus(status);
  switch (normalized) {
    case 'conforme':
      return {
        status: 'conforme',
        label: 'Conforme',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        rowBgClass: 'bg-emerald-50/30 border-emerald-200',
        requiresCandidateAction: false
      };
    case 'non_conforme':
      return {
        status: 'non_conforme',
        label: 'Non conforme',
        badgeClass: 'bg-red-100 text-red-800 border-red-200',
        rowBgClass: 'bg-red-50/40 border-red-200',
        requiresCandidateAction: true
      };
    case 'complement_demande':
      return {
        status: 'complement_demande',
        label: 'Complément demandé',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        rowBgClass: 'bg-amber-50/40 border-amber-200',
        requiresCandidateAction: true
      };
    case 'remplacement_demande':
      return {
        status: 'remplacement_demande',
        label: 'Remplacement demandé',
        badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
        rowBgClass: 'bg-orange-50/40 border-orange-200',
        requiresCandidateAction: true
      };
    case 'en_attente_verification':
      return {
        status: 'en_attente_verification',
        label: 'En attente de vérification',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        rowBgClass: 'bg-white border-slate-200',
        requiresCandidateAction: false
      };
    case 'non_depose':
    default:
      return {
        status: 'non_depose',
        label: 'Non déposé',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        rowBgClass: 'bg-slate-50/70 border-slate-200 border-dashed',
        requiresCandidateAction: true
      };
  }
}

export function getRequirementSpec(category: DocumentCategory): DocumentRequirementSpec {
  return (
    DOCUMENT_REQUIREMENTS.find((r) => r.category === category) ||
    DOCUMENT_REQUIREMENTS[DOCUMENT_REQUIREMENTS.length - 1]
  );
}

export function hasStoredPdfFile(doc?: Partial<JustificatifDocument>): boolean {
  return Boolean(doc?.fileName && (doc?.storageKey || doc?.fileUrl || doc?.fileData));
}

/**
 * Merges a dossier's stored documents with the full catalog of expected documents.
 * Un-uploaded categories appear with genuine 'non_depose' status and no fake files.
 */
export function mergeDossierWithDocumentCatalog(
  docs?: JustificatifDocument[]
): JustificatifDocument[] {
  const existingDocs = docs || [];
  const merged: JustificatifDocument[] = [];
  const consumedIds = new Set<string>();

  for (const spec of DOCUMENT_REQUIREMENTS) {
    const matches = existingDocs.filter((d) => d.category === spec.category);
    if (matches.length > 0) {
      for (const doc of matches) {
        consumedIds.add(doc.id);
        const hasRealFile = hasStoredPdfFile(doc);
        const normalized = hasRealFile
          ? normalizeDocumentStatus(doc.status)
          : doc.status === 'complement_demande' || doc.status === 'remplacement_demande' || doc.status === 'non_conforme'
          ? normalizeDocumentStatus(doc.status)
          : 'non_depose';

        merged.push({
          ...doc,
          label: doc.label || spec.label,
          description: doc.description || spec.description,
          required: doc.required !== undefined ? doc.required : spec.required,
          status: normalized,
          version: doc.version ?? (hasRealFile ? 1 : 0)
        });
      }
    } else {
      merged.push({
        id: `slot-${spec.category}`,
        category: spec.category,
        label: spec.label,
        description: spec.description,
        required: spec.required,
        fileName: '',
        fileType: 'application/pdf',
        fileSize: '',
        uploadDate: '',
        status: 'non_depose',
        version: 0
      });
    }
  }

  // Keep any unrecognized extra documents safely at the end
  for (const doc of existingDocs) {
    if (!consumedIds.has(doc.id)) {
      merged.push({
        ...doc,
        status: normalizeDocumentStatus(doc.status),
        version: doc.version ?? (hasStoredPdfFile(doc) ? 1 : 0)
      });
    }
  }

  return merged;
}

export interface RequiredPresenceSummary {
  totalRequired: number;
  depositedRequired: number;
  validatedRequired: number;
  actionRequiredCount: number;
  missingLabels: string[];
  isAllRequiredPresent: boolean;
}

export function getRequiredDocumentsPresence(
  docs?: JustificatifDocument[]
): RequiredPresenceSummary {
  const catalog = mergeDossierWithDocumentCatalog(docs);
  const requiredDocs = catalog.filter((d) => d.required);
  const deposited = requiredDocs.filter(
    (d) => normalizeDocumentStatus(d.status) !== 'non_depose' && hasStoredPdfFile(d)
  );
  const validated = requiredDocs.filter((d) => normalizeDocumentStatus(d.status) === 'conforme');
  const actionRequired = catalog.filter((d) => {
    const meta = getDocumentStatusMeta(d.status);
    return d.required ? meta.requiresCandidateAction : meta.status === 'non_conforme' || meta.status === 'complement_demande' || meta.status === 'remplacement_demande';
  });
  const missingLabels = requiredDocs
    .filter((d) => normalizeDocumentStatus(d.status) === 'non_depose' || !hasStoredPdfFile(d))
    .map((d) => d.label);

  return {
    totalRequired: requiredDocs.length,
    depositedRequired: deposited.length,
    validatedRequired: validated.length,
    actionRequiredCount: actionRequired.length,
    missingLabels,
    isAllRequiredPresent: missingLabels.length === 0
  };
}

/**
 * Computes a short SHA-256 hex digest of an ArrayBuffer for technical integrity tracing.
 */
async function computeShortSha256(buffer: ArrayBuffer): Promise<string | undefined> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray
        .slice(0, 6)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
    }
  } catch {
    // Fallback below if subtle crypto is unavailable
  }
  return undefined;
}

/**
 * Technical verification of an uploaded PDF file.
 * Strictly checks technical validity (presence, PDF MIME/extension, max size, %PDF- header & %%EOF trailer).
 * Does NOT validate administrative or scientific content (which belongs to the Directeur / CEDoc).
 */
export async function validateUploadedPdfFile(
  file: File
): Promise<{
  valid: boolean;
  errorMessage?: string;
  technicalCheck: DocumentTechnicalCheck;
}> {
  const maxAllowedSizeMb = getMaxPdfSizeMb();
  const maxBytes = maxAllowedSizeMb * 1024 * 1024;
  const nowIso = new Date().toISOString();

  const isFilePresent = Boolean(file && file.size > 0);
  const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf');
  const hasPdfMime = file.type === 'application/pdf' || file.type === '';
  const isPdfFormatValid = hasPdfExtension && hasPdfMime;
  const isSizeValid = isFilePresent && file.size <= maxBytes;

  let isIntegrityValid = false;
  let sha256Short: string | undefined;

  if (isFilePresent) {
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Check %PDF- magic header (25 50 44 46 2D)
      const hasHeader =
        bytes.length >= 5 &&
        bytes[0] === 0x25 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x44 &&
        bytes[3] === 0x46 &&
        bytes[4] === 0x2d;

      // Check %%EOF near end of file (last 2048 bytes)
      const tailStart = Math.max(0, bytes.length - 2048);
      const tailText = new TextDecoder('latin1').decode(bytes.slice(tailStart));
      const hasEof = tailText.includes('%%EOF');

      isIntegrityValid = hasHeader && hasEof;
      sha256Short = await computeShortSha256(buffer);
    } catch {
      isIntegrityValid = false;
    }
  }

  let errorMessage: string | undefined;
  if (!isFilePresent) {
    errorMessage = `Le fichier « ${file?.name || 'inconnu'} » est vide (0 octet).`;
  } else if (!isPdfFormatValid) {
    errorMessage = `Format non autorisé pour « ${file.name} ». Seuls les documents au format PDF (.pdf) sont acceptés.`;
  } else if (!isSizeValid) {
    errorMessage = `Le fichier « ${file.name} » dépasse la taille maximale autorisée de ${maxAllowedSizeMb} Mo.`;
  } else if (!isIntegrityValid) {
    errorMessage = `Le fichier « ${file.name} » semble corrompu ou n'est pas un véritable document PDF (signature %PDF- / %%EOF absente).`;
  }

  const valid = isFilePresent && isPdfFormatValid && isSizeValid && isIntegrityValid;

  const technicalCheck: DocumentTechnicalCheck = {
    isPdfFormatValid,
    isSizeValid,
    isFilePresent,
    isIntegrityValid,
    maxAllowedSizeMb,
    fileSizeBytes: file?.size || 0,
    sha256Short,
    checkedAt: nowIso,
    summary: valid
      ? `Contrôle technique conforme (PDF valide, signature %PDF- vérifiée${sha256Short ? `, empreinte #${sha256Short}` : ''})`
      : errorMessage || 'Échec du contrôle technique du fichier'
  };

  return { valid, errorMessage, technicalCheck };
}

export function formatDocumentDate(isoDate?: string): string {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export interface DossierDocumentaryStatusMeta {
  label:
    | 'Incomplet'
    | 'En attente de vérification'
    | 'Complément demandé'
    | 'Documents conformes'
    | 'Avis scientifique en attente'
    | 'Traité';
  badgeClass: string;
  depositedCount: number;
  requiredCount: number;
  validatedCount: number;
}

export function getDossierDocumentaryStatus(
  dossier: ApplicationDossier,
  isProcessed: boolean
): DossierDocumentaryStatusMeta {
  const catalog = mergeDossierWithDocumentCatalog(dossier.documentsList);
  const presence = getRequiredDocumentsPresence(dossier.documentsList);

  const depositedCount = catalog.filter(
    (d) => normalizeDocumentStatus(d.status) !== 'non_depose' && hasStoredPdfFile(d)
  ).length;
  const requiredCount = presence.totalRequired;
  const validatedCount = presence.validatedRequired;

  const hasActionRequired = catalog.some((d) => {
    const st = normalizeDocumentStatus(d.status);
    return (
      st === 'complement_demande' ||
      st === 'remplacement_demande' ||
      st === 'non_conforme'
    );
  });

  const hasPendingVerification = catalog.some(
    (d) => hasStoredPdfFile(d) && normalizeDocumentStatus(d.status) === 'en_attente_verification'
  );

  if (isProcessed) {
    return {
      label: 'Traité',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      depositedCount,
      requiredCount,
      validatedCount
    };
  }

  if (hasActionRequired) {
    return {
      label: 'Complément demandé',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      depositedCount,
      requiredCount,
      validatedCount
    };
  }

  if (!presence.isAllRequiredPresent) {
    return {
      label: 'Incomplet',
      badgeClass: 'bg-red-50 text-red-800 border-red-200',
      depositedCount,
      requiredCount,
      validatedCount
    };
  }

  if (hasPendingVerification) {
    return {
      label: 'En attente de vérification',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
      depositedCount,
      requiredCount,
      validatedCount
    };
  }

  if (dossier.documentsStepValidated) {
    return {
      label: 'Avis scientifique en attente',
      badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      depositedCount,
      requiredCount,
      validatedCount
    };
  }

  return {
    label: 'Documents conformes',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    depositedCount,
    requiredCount,
    validatedCount
  };
}
