import {
  ApplicationDossier,
  JustificatifDocument,
  DossierHistoryLog,
  DocumentTechnicalCheck
} from '../types';
import { getStoredDossiers, saveDossiers } from './storage';
import {
  getRequirementSpec,
  hasStoredPdfFile,
  normalizeDocumentStatus
} from './documentService';

export interface CandidateNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'action_required' | 'success' | 'warning';
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  dossierId?: string;
  targetDocId?: string;
}

export function getNotificationsForDossier(dossier: ApplicationDossier): CandidateNotification[] {
  const notifs: CandidateNotification[] = [];

  notifs.push({
    id: `notif-1-${dossier.id}`,
    title: 'Dossier de candidature soumis',
    message: `Votre dossier N° ${dossier.referenceNumber} a été enregistré avec succès et transmis pour examen.`,
    type: 'success',
    timestamp: dossier.submittedAt,
    isRead: true,
    dossierId: dossier.id
  });

  if (dossier.documentsList) {
    const replacements = dossier.documentsList.filter(
      (d) => normalizeDocumentStatus(d.status) === 'remplacement_demande'
    );
    replacements.forEach((doc) => {
      notifs.push({
        id: `notif-replace-${doc.id}`,
        title: `Remplacement demandé : ${doc.label}`,
        message: doc.remark
          ? `Le directeur demande le remplacement de cette pièce : « ${doc.remark} ».`
          : `Le directeur de thèse demande le dépôt d'une nouvelle version PDF pour « ${doc.label} ».`,
        type: 'action_required',
        timestamp: doc.reviewedAt || new Date().toISOString(),
        isRead: false,
        dossierId: dossier.id,
        targetDocId: doc.id
      });
    });

    const complements = dossier.documentsList.filter(
      (d) => normalizeDocumentStatus(d.status) === 'complement_demande'
    );
    complements.forEach((doc) => {
      notifs.push({
        id: `notif-comp-${doc.id}`,
        title: `Complément demandé : ${doc.label}`,
        message: doc.remark
          ? `Un complément documentaire est exigé : « ${doc.remark} ».`
          : `Le directeur de thèse demande un complément pour la pièce « ${doc.label} ».`,
        type: 'action_required',
        timestamp: doc.reviewedAt || new Date().toISOString(),
        isRead: false,
        dossierId: dossier.id,
        targetDocId: doc.id
      });
    });

    const nonConform = dossier.documentsList.filter(
      (d) => normalizeDocumentStatus(d.status) === 'non_conforme'
    );
    nonConform.forEach((doc) => {
      notifs.push({
        id: `notif-nc-${doc.id}`,
        title: `Document non conforme : ${doc.label}`,
        message: doc.remark
          ? `Pièce signalée non conforme : « ${doc.remark} ». Veuillez déposer un fichier conforme.`
          : `La pièce « ${doc.label} » a été signalée non conforme et nécessite votre correction.`,
        type: 'action_required',
        timestamp: doc.reviewedAt || new Date().toISOString(),
        isRead: false,
        dossierId: dossier.id,
        targetDocId: doc.id
      });
    });
  }

  // Notice only for director-requested document actions (missing optional demo PDFs stay non-blocking)

  if (dossier.scientificOpinion) {
    notifs.push({
      id: `notif-op-${dossier.id}`,
      title: 'Avis scientifique émis',
      message: `Votre directeur de thèse a émis un avis (${dossier.scientificOpinion.decision}). Le dossier a été transmis au CEDoc.`,
      type: 'info',
      timestamp: dossier.scientificOpinion.submittedAt,
      isRead: false,
      dossierId: dossier.id
    });
  }

  if (dossier.status === 'convoque_entretien' || dossier.verificationAudit?.interviewDate) {
    const intDate = dossier.cedocDecision?.interviewDate || dossier.verificationAudit?.interviewDate;
    const intRoom = dossier.cedocDecision?.interviewRoom || dossier.verificationAudit?.interviewRoom;
    const intMode = dossier.cedocDecision?.interviewMode || dossier.verificationAudit?.interviewMode;
    notifs.push({
      id: `notif-int-${dossier.id}`,
      title: 'Convocation CEDoc à l’entretien oral',
      message: `${
        intDate
          ? `Vous êtes convoqué(e) le ${new Date(intDate).toLocaleString('fr-FR')} (${
              intMode === 'visioconference' ? 'Visioconférence' : 'Présentiel'
            }${intRoom ? ` · ${intRoom}` : ''}).`
          : 'Entretien oral à planifier par la commission CEDoc.'
      }${dossier.cedocDecision?.observation ? ` Observation : ${dossier.cedocDecision.observation}` : ''}`,
      type: 'action_required',
      timestamp: dossier.cedocDecision?.decidedAt || dossier.verificationAudit?.verifiedAt || new Date().toISOString(),
      isRead: false,
      dossierId: dossier.id
    });
  }

  if (dossier.status === 'retenu') {
    notifs.push({
      id: `notif-retenu-${dossier.id}`,
      title: 'Félicitations : Candidature admise par le CEDoc (ADMIS)',
      message: `${
        dossier.cedocDecision?.observation ||
        'Votre admission en doctorat a été validée définitivement par le CEDoc. Vous pouvez préparer votre inscription définitive.'
      }`,
      type: 'success',
      timestamp: dossier.cedocDecision?.decidedAt || dossier.verificationAudit?.verifiedAt || new Date().toISOString(),
      isRead: false,
      dossierId: dossier.id
    });
  } else if (dossier.status === 'non_conforme') {
    notifs.push({
      id: `notif-rej-${dossier.id}`,
      title: 'Décision finale CEDoc : Candidature non retenue (REJETE)',
      message:
        dossier.cedocDecision?.observation ||
        dossier.verificationAudit?.auditNote ||
        'Votre candidature n’a pas été retenue à l’issue de la commission doctorale.',
      type: 'warning',
      timestamp: dossier.cedocDecision?.decidedAt || dossier.verificationAudit?.verifiedAt || new Date().toISOString(),
      isRead: false,
      dossierId: dossier.id
    });
  } else if (dossier.status === 'transmis_cedoc' && dossier.cedocDecision) {
    notifs.push({
      id: `notif-cedoc-exam-${dossier.id}`,
      title: 'Dossier en cours d’examen par la commission CEDoc',
      message: dossier.cedocDecision.observation,
      type: 'info',
      timestamp: dossier.cedocDecision.decidedAt,
      isRead: false,
      dossierId: dossier.id
    });
  }

  return notifs;
}

export function addNewDocumentToDossier(
  dossierId: string,
  category: JustificatifDocument['category'],
  label: string,
  fileName: string,
  storageKey: string,
  fileSize: string,
  replaceDocId?: string,
  technicalCheck?: DocumentTechnicalCheck,
  fileData?: string
): ApplicationDossier[] {
  const dossiers = getStoredDossiers();
  const nowIso = new Date().toISOString();
  const spec = getRequirementSpec(category);

  const updated = dossiers.map((d) => {
    if (d.id === dossierId) {
      const currentDocs = d.documentsList || [];
      let documentsList: JustificatifDocument[];
      let isReplacement = false;
      let nextVersion = 1;

      const existingById = replaceDocId
        ? currentDocs.find((doc) => doc.id === replaceDocId)
        : undefined;

      // For required single-slot categories (everything except 'autre'), replace existing slot if one already exists
      const existingSingleSlot =
        !existingById && category !== 'autre'
          ? currentDocs.find((doc) => doc.category === category)
          : undefined;

      const targetDoc = existingById || existingSingleSlot;

      if (targetDoc) {
        isReplacement = hasStoredPdfFile(targetDoc);
        nextVersion = (targetDoc.version || (isReplacement ? 1 : 0)) + 1;
        documentsList = currentDocs.map((doc) =>
          doc.id === targetDoc.id
            ? {
                ...doc,
                category,
                label: label || spec.label,
                description: doc.description || spec.description,
                required: doc.required !== undefined ? doc.required : spec.required,
                fileName,
                fileType: 'application/pdf',
                fileSize,
                uploadDate: nowIso,
                storageKey,
                fileUrl: undefined,
                fileData,
                status: 'en_attente_verification',
                remark: undefined,
                reviewedBy: undefined,
                reviewedAt: undefined,
                version: nextVersion,
                technicalCheck
              }
            : doc
        );
      } else {
        const newDoc: JustificatifDocument = {
          id: `doc-${category}-${Date.now()}`,
          category,
          label: label || spec.label,
          description: spec.description,
          required: spec.required,
          fileName,
          fileType: 'application/pdf',
          fileSize,
          uploadDate: nowIso,
          storageKey,
          fileUrl: undefined,
          fileData,
          status: 'en_attente_verification',
          version: 1,
          technicalCheck
        };
        documentsList = [...currentDocs, newDoc];
      }

      const hasRemainingActionRequired = documentsList.some((doc) => {
        const st = normalizeDocumentStatus(doc.status);
        return (
          st === 'non_conforme' ||
          st === 'complement_demande' ||
          st === 'remplacement_demande'
        );
      });

      const nextStatus =
        d.status === 'documents_non_conformes' && !hasRemainingActionRequired
          ? 'documents_en_cours'
          : d.status;

      const newLog: DossierHistoryLog = {
        id: `log-doc-${Date.now()}`,
        timestamp: nowIso,
        authorName: `${d.student.firstName} ${d.student.lastName}`,
        authorRole: 'candidat',
        action: isReplacement
          ? `Remplacement de document PDF (v${nextVersion}) : ${label || spec.label}`
          : `Dépôt de document PDF : ${label || spec.label}`,
        details: `Fichier réel ${fileName} (${fileSize}) déposé et soumis pour vérification par le directeur de thèse.`,
        statusAfter: nextStatus
      };

      const historyLogs = d.historyLogs ? [newLog, ...d.historyLogs] : [newLog];

      return {
        ...d,
        status: nextStatus,
        documentsStepValidated: false,
        directorTreatmentCompleted: false,
        documentsList,
        historyLogs
      };
    }
    return d;
  });

  saveDossiers(updated);
  return updated;
}
