import React, { useState, useEffect, useMemo } from 'react';
import {
  ApplicationDossier,
  AuthenticatedUser,
  DossierStatus,
  JustificatifDocument,
  DocumentVerificationStatus,
  ScientificOpinionDecision,
  DirectorScientificOpinion
} from '../types';
import { PdfViewerModal } from './PdfViewerModal';
import { downloadDocumentPdf } from '../services/fileStorage';
import {
  saveDirectorScientificOpinion,
  updateDocumentVerification,
  saveCedocFinalDecision,
  hasPrivilege,
  canPassToScientificOpinion,
  canPassToCedocFinalDecision,
  isDossierDocumentsStepValidated,
  isDossierProcessedByDirector,
  validateDossierDocumentsStage
} from '../services/storage';
import { getPlatformTopics } from '../services/platformService';
import {
  formatDocumentDate,
  getDocumentStatusMeta,
  getRequiredDocumentsPresence,
  hasStoredPdfFile,
  mergeDossierWithDocumentCatalog,
  normalizeDocumentStatus
} from '../services/documentService';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  FileText,
  Mail,
  CheckCircle2,
  XCircle,
  Award,
  Download,
  Eye,
  Send,
  History,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  MessageSquarePlus,
  ArrowRight,
  Lock,
  BookOpen,
  Archive
} from 'lucide-react';

interface DossierDetailModalProps {
  dossier: ApplicationDossier | null;
  currentUser?: AuthenticatedUser | null;
  initialTab?: 'documents' | 'opinion' | 'cedoc' | 'history';
  onClose: () => void;
  onOpinionCompleted?: (dossier: ApplicationDossier, decision: ScientificOpinionDecision) => void;
  onCedocDecisionCompleted?: (
    dossier: ApplicationDossier,
    status: 'transmis_cedoc' | 'convoque_entretien' | 'retenu' | 'non_conforme'
  ) => void;
  onUpdateAudit?: (
    dossierId: string,
    auditData: {
      verifiedBy: string;
      isDegreeValid: boolean;
      isTranscriptValid: boolean;
      auditNote: string;
      status: DossierStatus;
      interviewDate?: string;
      interviewMode?: 'presentiel' | 'visioconference';
      interviewRoom?: string;
    }
  ) => void;
}

const APPRECIATION_OPTIONS = [
  'Très pertinent — Projet structuré et maîtrisé',
  'Pertinent — Solide adéquation au sujet doctoral',
  'Pertinent sous réserve d’approfondissement méthodologique',
  'Insuffisant ou hors périmètre scientifique du laboratoire'
];

export const DossierDetailModal: React.FC<DossierDetailModalProps> = (props) => {
  if (!props.dossier) return null;
  return <DossierDetailModalInner {...props} dossier={props.dossier} />;
};

const DossierDetailModalInner: React.FC<
  Omit<DossierDetailModalProps, 'dossier'> & { dossier: ApplicationDossier }
> = ({
  dossier,
  currentUser = null,
  initialTab = 'opinion',
  onClose,
  onOpinionCompleted,
  onCedocDecisionCompleted
}) => {
  const canVerifyAndOpine =
    hasPrivilege(currentUser, 'examine_assigned_dossiers') ||
    hasPrivilege(currentUser, 'supervise_cedoc');
  const canDecideCedoc = hasPrivilege(currentUser, 'supervise_cedoc');

  const actorDisplayName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : 'Pr. Youssef El Amrani';
  const actorEmail = currentUser?.email || 'youssef.elamrani@usmba.ac.ma';
  const actorTitle = currentUser?.titleOrDegree || 'Directeur de Thèse (USMBA)';

  const step1Gate = useMemo(() => canPassToScientificOpinion(dossier), [dossier]);
  const isStep1Validated = useMemo(() => isDossierDocumentsStepValidated(dossier), [dossier]);
  const isDirectorDone = useMemo(() => isDossierProcessedByDirector(dossier), [dossier]);
  const isStep2Unlocked = isDirectorDone || canVerifyAndOpine || (step1Gate.allowed && isStep1Validated);

  const cedocGate = useMemo(() => canPassToCedocFinalDecision(dossier), [dossier]);
  const isStep3Unlocked = canDecideCedoc && cedocGate.allowed;
  const hasFinalCedocDecision = Boolean(
    dossier.cedocDecision ||
      dossier.status === 'retenu' ||
      (dossier.status === 'non_conforme' && isDirectorDone)
  );
  const canViewHistoryTab = isDirectorDone || canDecideCedoc;

  const fullTopicDetails = useMemo(() => {
    const primary = dossier.selectedTopics[0];
    if (!primary) return null;
    const allTopics = getPlatformTopics();
    return (
      allTopics.find(
        (t) => t.id === primary.topicId || t.code === primary.topicCode
      ) || null
    );
  }, [dossier.selectedTopics]);

  const resolveSafeTab = (
    requested: 'documents' | 'opinion' | 'cedoc' | 'history'
  ): 'documents' | 'opinion' | 'cedoc' | 'history' => {
    if (requested === 'cedoc' && !isStep3Unlocked) {
      return 'opinion';
    }
    if (requested === 'opinion' && !isStep2Unlocked) return 'documents';
    if (requested === 'history' && !canViewHistoryTab) return 'opinion';
    return requested;
  };

  // Active view tab inside modal
  const [activeTab, setActiveTab] = useState<'documents' | 'opinion' | 'cedoc' | 'history'>(
    () => resolveSafeTab(initialTab)
  );

  // Active PDF for viewer modal
  const [selectedPdfDoc, setSelectedPdfDoc] = useState<JustificatifDocument | null>(null);

  // Document verification local remarks state
  const [docRemarks, setDocRemarks] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    dossier.documentsList?.forEach((d) => {
      map[d.id] = d.remark || '';
    });
    return map;
  });

  // Scientific opinion state
  const [decision, setDecision] = useState<ScientificOpinionDecision>(
    dossier.scientificOpinion?.decision || 'favorable'
  );
  const [appreciation, setAppreciation] = useState<string>(
    dossier.scientificOpinion?.appreciation || APPRECIATION_OPTIONS[0]
  );
  const [recommendations, setRecommendations] = useState<string>(
    dossier.scientificOpinion?.recommendations || ''
  );
  const [comment, setComment] = useState(
    dossier.scientificOpinion?.comment || ''
  );
  const [reservesOrJustification, setReservesOrJustification] = useState(
    dossier.scientificOpinion?.reservesOrJustification || ''
  );
  const [decisionDate, setDecisionDate] = useState<string>(
    dossier.scientificOpinion?.decisionDate ||
      (dossier.scientificOpinion?.submittedAt
        ? dossier.scientificOpinion.submittedAt.slice(0, 10)
        : new Date().toISOString().slice(0, 10))
  );

  // CEDoc Final Decision state
  const [cedocStatus, setCedocStatus] = useState<
    'transmis_cedoc' | 'convoque_entretien' | 'retenu' | 'non_conforme'
  >(
    dossier.status === 'convoque_entretien' ||
      dossier.status === 'retenu' ||
      dossier.status === 'non_conforme'
      ? dossier.status
      : 'retenu'
  );
  const [cedocNote, setCedocNote] = useState(
    dossier.verificationAudit?.auditNote || ''
  );
  const [interviewDate, setInterviewDate] = useState(
    dossier.verificationAudit?.interviewDate || '2026-11-25T10:00'
  );
  const [interviewMode, setInterviewMode] = useState<'presentiel' | 'visioconference'>(
    dossier.verificationAudit?.interviewMode || 'presentiel'
  );
  const [interviewRoom, setInterviewRoom] = useState(
    dossier.verificationAudit?.interviewRoom || 'Salle des Commissions CEDoc - EST Fès'
  );

  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);
  const [formErrorMsg, setFormErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setFormErrorMsg(null);
    setSavedSuccessMsg(null);
    setActiveTab(resolveSafeTab(initialTab));
    const map: Record<string, string> = {};
    dossier.documentsList?.forEach((d) => {
      map[d.id] = d.remark || '';
    });
    setDocRemarks(map);
    setDecision(dossier.scientificOpinion?.decision || 'favorable');
    setAppreciation(dossier.scientificOpinion?.appreciation || APPRECIATION_OPTIONS[0]);
    setRecommendations(dossier.scientificOpinion?.recommendations || '');
    setComment(dossier.scientificOpinion?.comment || '');
    setReservesOrJustification(dossier.scientificOpinion?.reservesOrJustification || '');
    setDecisionDate(
      dossier.scientificOpinion?.decisionDate ||
        (dossier.scientificOpinion?.submittedAt
          ? dossier.scientificOpinion.submittedAt.slice(0, 10)
          : new Date().toISOString().slice(0, 10))
    );
    setCedocStatus(
      dossier.cedocDecision?.decisionStatus ||
        (dossier.status === 'convoque_entretien' ||
        dossier.status === 'retenu' ||
        dossier.status === 'non_conforme' ||
        dossier.status === 'transmis_cedoc'
          ? dossier.status
          : 'retenu')
    );
    setCedocNote(
      dossier.cedocDecision?.observation || dossier.verificationAudit?.auditNote || ''
    );
    setInterviewDate(
      dossier.cedocDecision?.interviewDate ||
        dossier.verificationAudit?.interviewDate ||
        '2026-11-25T10:00'
    );
    setInterviewMode(
      dossier.cedocDecision?.interviewMode ||
        dossier.verificationAudit?.interviewMode ||
        'presentiel'
    );
    setInterviewRoom(
      dossier.cedocDecision?.interviewRoom ||
        dossier.verificationAudit?.interviewRoom ||
        'Salle des Commissions CEDoc - EST Fès'
    );
  }, [dossier.id, initialTab, canDecideCedoc]);

  // Handle individual document verification change
  const handleDocStatusChange = (
    doc: JustificatifDocument,
    newStatus: DocumentVerificationStatus
  ) => {
    if (!canVerifyAndOpine) return;
    setFormErrorMsg(null);
    const remarkText = (docRemarks[doc.id] ?? doc.remark ?? '').trim();

    if (
      (newStatus === 'non_conforme' ||
        newStatus === 'complement_demande' ||
        newStatus === 'remplacement_demande') &&
      !remarkText
    ) {
      setFormErrorMsg(
        `Veuillez saisir un commentaire explicatif pour « ${doc.label} » avant de confirmer cette décision.`
      );
      return;
    }

    updateDocumentVerification(
      dossier.id,
      doc.id,
      newStatus,
      remarkText,
      actorDisplayName,
      currentUser?.role || 'directeur',
      doc.category
    );
    const meta = getDocumentStatusMeta(newStatus);
    showTempMessage(`Décision enregistrée (${meta.label}) pour « ${doc.label} ».`);
  };

  const handleDocRemarkChange = (docId: string, text: string) => {
    setDocRemarks((prev) => ({ ...prev, [docId]: text }));
  };

  const handleSaveDocRemark = (doc: JustificatifDocument) => {
    if (!canVerifyAndOpine) return;
    const text = docRemarks[doc.id] ?? '';
    updateDocumentVerification(
      dossier.id,
      doc.id,
      doc.status,
      text,
      actorDisplayName,
      currentUser?.role || 'directeur',
      doc.category
    );
    showTempMessage('Commentaire sur le document enregistré.');
  };

  // Step 1 -> Step 2 Gate Validation
  const handleValidateDocumentsAndProceed = () => {
    setFormErrorMsg(null);
    if (!canVerifyAndOpine) {
      setFormErrorMsg('Permission insuffisante : votre profil est en consultation seule.');
      return;
    }

    const res = validateDossierDocumentsStage(
      dossier.id,
      actorDisplayName,
      currentUser?.role || 'directeur'
    );

    if (!res.success) {
      const detailText =
        res.reasons && res.reasons.length > 0
          ? ` — Pièces bloquantes : ${res.reasons.slice(0, 3).join(' · ')}${
              res.reasons.length > 3 ? ` (+${res.reasons.length - 3} autres)` : ''
            }`
          : '';
      setFormErrorMsg(`${res.message}${detailText}`);
      return;
    }

    showTempMessage(res.message);
    setActiveTab('opinion');
  };

  // Save Director Scientific Opinion (Step 2) & Archive to Dossiers déjà traités
  const handleSaveScientificOpinion = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrorMsg(null);

    if (!canVerifyAndOpine) {
      setFormErrorMsg('Permission insuffisante : votre profil est en consultation seule sur ce dossier.');
      return;
    }

    if (!appreciation.trim()) {
      setFormErrorMsg('Veuillez sélectionner ou préciser votre appréciation scientifique.');
      return;
    }

    if (!comment.trim()) {
      setFormErrorMsg('Veuillez rédiger votre commentaire et justification scientifique.');
      return;
    }

    if (!decisionDate) {
      setFormErrorMsg('Veuillez préciser la date de décision.');
      return;
    }

    if (decision === 'favorable_reserve' && !reservesOrJustification.trim()) {
      setFormErrorMsg('Veuillez obligatoirement préciser les réserves et les modifications demandées pour un avis favorable sous réserve.');
      return;
    }

    if (decision === 'defavorable' && !reservesOrJustification.trim()) {
      setFormErrorMsg('Veuillez obligatoirement motiver et justifier votre avis défavorable.');
      return;
    }

    const opinion: DirectorScientificOpinion = {
      decision,
      appreciation: appreciation.trim(),
      recommendations: recommendations.trim() || undefined,
      comment: comment.trim(),
      reservesOrJustification: reservesOrJustification.trim() || undefined,
      decisionDate,
      submittedAt: new Date().toISOString(),
      directorName: actorDisplayName,
      directorTitle: actorTitle,
      directorEmail: actorEmail
    };

    saveDirectorScientificOpinion(dossier.id, opinion);
    if (onOpinionCompleted) {
      onOpinionCompleted(dossier, decision);
    }
    onClose();
  };

  // Save CEDoc Final Decision (exclusive to Directeur CEDoc / Admin & ONLY after Step 1 + Step 2)
  const handleSaveCedocDecision = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrorMsg(null);
    setSavedSuccessMsg(null);

    if (!currentUser || !canDecideCedoc) {
      setFormErrorMsg('Action réservée au Directeur du CEDoc (privilège supervise_cedoc requis).');
      return;
    }

    if (!cedocGate.allowed) {
      setFormErrorMsg(
        `Décision CEDoc bloquée : les étapes 1 et 2 doivent d’abord être terminées (${cedocGate.reasons[0] || ''}).`
      );
      return;
    }

    if (!cedocStatus) {
      setFormErrorMsg('Veuillez sélectionner une décision CEDoc avant de valider.');
      return;
    }

    if (!cedocNote.trim()) {
      setFormErrorMsg(
        cedocStatus === 'non_conforme'
          ? 'Veuillez obligatoirement saisir le motif du rejet / non-retenue avant de valider.'
          : 'Veuillez obligatoirement saisir l’observation officielle du CEDoc / procès-verbal avant de valider.'
      );
      return;
    }

    if (cedocStatus === 'convoque_entretien') {
      if (!interviewDate.trim()) {
        setFormErrorMsg('Veuillez renseigner la date et l’heure de l’entretien oral.');
        return;
      }
      if (!interviewRoom.trim()) {
        setFormErrorMsg('Veuillez renseigner la salle ou le lien de visioconférence de l’entretien.');
        return;
      }
    }

    const res = saveCedocFinalDecision(
      dossier.id,
      cedocStatus,
      cedocNote.trim(),
      currentUser,
      cedocStatus === 'convoque_entretien' ? interviewDate.trim() : undefined,
      cedocStatus === 'convoque_entretien' ? interviewMode : undefined,
      cedocStatus === 'convoque_entretien' ? interviewRoom.trim() : undefined
    );

    if (!res.success) {
      setFormErrorMsg(res.message);
      return;
    }

    showTempMessage(res.message);
    if (onCedocDecisionCompleted && res.updatedDossier) {
      onCedocDecisionCompleted(res.updatedDossier, cedocStatus);
    }
  };

  const showTempMessage = (msg: string) => {
    setSavedSuccessMsg(msg);
    setTimeout(() => setSavedSuccessMsg(null), 3000);
  };

  const catalogDocuments = useMemo(
    () => mergeDossierWithDocumentCatalog(dossier.documentsList),
    [dossier.documentsList]
  );

  const requiredPresence = useMemo(
    () => getRequiredDocumentsPresence(dossier.documentsList),
    [dossier.documentsList]
  );

  // Calculate documents verification summary across all 6 canonical statuses
  const docSummary = useMemo(() => {
    const total = catalogDocuments.length;
    const conform = catalogDocuments.filter((d) => normalizeDocumentStatus(d.status) === 'conforme').length;
    const nonConform = catalogDocuments.filter((d) => normalizeDocumentStatus(d.status) === 'non_conforme').length;
    const complement = catalogDocuments.filter((d) => normalizeDocumentStatus(d.status) === 'complement_demande').length;
    const replacement = catalogDocuments.filter((d) => normalizeDocumentStatus(d.status) === 'remplacement_demande').length;
    const pending = catalogDocuments.filter((d) => normalizeDocumentStatus(d.status) === 'en_attente_verification').length;
    const notDeposited = catalogDocuments.filter((d) => normalizeDocumentStatus(d.status) === 'non_depose').length;
    return { total, conform, nonConform, complement, replacement, pending, notDeposited };
  }, [catalogDocuments]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full my-4 flex flex-col overflow-hidden animate-in fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-300 mb-1 flex-wrap">
              <span>{dossier.referenceNumber}</span>
              {dossier.isDemo && (
                <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-amber-500/20 text-amber-200 border border-amber-400/40">
                  Dossier de démonstration
                </span>
              )}
              <span>·</span>
              <span>Soumis le {new Date(dossier.submittedAt).toLocaleDateString('fr-FR')}</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Candidature : {dossier.student.firstName} {dossier.student.lastName.toUpperCase()}
            </h2>
            <div className="mt-1 flex items-center gap-3 text-xs text-slate-300 flex-wrap">
              <span className="flex items-center gap-1 font-medium text-emerald-400">
                <Mail className="w-3.5 h-3.5" />
                {dossier.student.academicEmail}
              </span>
              <span>·</span>
              <span>Formation: {dossier.student.degreeDeclared}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Streamlined Workflow Progression Indicator */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-semibold ${
                isDirectorDone
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-blue-50 border-blue-300 text-blue-900'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  isDirectorDone ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                }`}
              >
                {isDirectorDone ? '✓' : '1'}
              </span>
              <span>Examen & Avis du Directeur</span>
            </div>

            {canDecideCedoc && (
              <>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-semibold ${
                    hasFinalCedocDecision
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : isStep3Unlocked
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                      : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      hasFinalCedocDecision
                        ? 'bg-emerald-600 text-white'
                        : isStep3Unlocked
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-300 text-slate-700'
                    }`}
                  >
                    {hasFinalCedocDecision ? '✓' : '2'}
                  </span>
                  <span>Décision Finale CEDoc</span>
                  {!isStep3Unlocked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                </div>
              </>
            )}
          </div>

          <div className="text-[11px] font-semibold">
            {canDecideCedoc && !isStep3Unlocked ? (
              <span className="text-amber-700">
                En attente de l’avis scientifique du directeur
              </span>
            ) : isDirectorDone ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Archive className="w-3.5 h-3.5" />
                <span>Avis transmis au Directeur CEDoc</span>
              </span>
            ) : (
              <span className="text-blue-700">Dossier prêt pour examen du Directeur</span>
            )}
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 bg-slate-100 border-b border-slate-200 flex items-center gap-2 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setFormErrorMsg(null);
              setActiveTab('opinion');
            }}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'opinion'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>1. Candidature & Avis scientifique</span>
            {dossier.scientificOpinion && isDirectorDone && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-600 text-white font-bold">
                Transmis
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setFormErrorMsg(null);
              setActiveTab('documents');
            }}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'documents'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Pièces PDF ({requiredPresence.depositedRequired}/{requiredPresence.totalRequired})</span>
            {docSummary.nonConform + docSummary.complement + docSummary.replacement > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-bold">
                {docSummary.nonConform + docSummary.complement + docSummary.replacement} à corriger
              </span>
            )}
          </button>

          {canDecideCedoc && (
            <button
              type="button"
              onClick={() => {
                if (!isStep3Unlocked) {
                  setFormErrorMsg(
                    `Décision CEDoc verrouillée : ${cedocGate.reasons.join(' · ')}`
                  );
                  return;
                }
                setFormErrorMsg(null);
                setActiveTab('cedoc');
              }}
              className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                !isStep3Unlocked
                  ? 'border-transparent text-slate-400 cursor-not-allowed'
                  : activeTab === 'cedoc'
                  ? 'border-indigo-600 text-indigo-700 bg-white cursor-pointer'
                  : 'border-transparent text-slate-600 hover:text-slate-900 cursor-pointer'
              }`}
            >
              {isStep3Unlocked ? <Award className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>3. Décision Finale CEDoc</span>
              {dossier.cedocDecision && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-600 text-white font-bold">
                  {dossier.cedocDecision.decisionCode}
                </span>
              )}
            </button>
          )}

          {canViewHistoryTab && (
            <button
              type="button"
              onClick={() => {
                setFormErrorMsg(null);
                setActiveTab('history');
              }}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>{canDecideCedoc ? '4.' : '3.'} Historique ({dossier.historyLogs?.length || 0})</span>
            </button>
          )}
        </div>

        {/* Feedback alerts */}
        {savedSuccessMsg && (
          <div className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{savedSuccessMsg}</span>
          </div>
        )}

        {formErrorMsg && (
          <div className="px-6 py-2.5 bg-red-600 text-white text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formErrorMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[65vh] space-y-6 text-xs text-slate-700">

          {/* CANDIDATE & ALL PRIORITIZED TOPICS SUMMARY BOX */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Identité & Parcours Académique
              </div>
              <div className="space-y-0.5">
                <div>
                  <span className="text-slate-500">Candidat : </span>
                  <span className="font-semibold text-slate-900">
                    {dossier.student.lastName.toUpperCase()} {dossier.student.firstName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Diplôme : </span>
                  <span className="font-medium text-slate-800">{dossier.student.degreeDeclared}</span>
                </div>
                <div>
                  <span className="text-slate-500">Établissement : </span>
                  <span className="text-slate-800">
                    {dossier.student.currentInstitution} ({dossier.student.graduationYear})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Moyenne : </span>
                  <span className="font-semibold text-slate-800">{dossier.student.gpa}</span>
                  <span className="text-slate-400"> · </span>
                  <span className="text-slate-500">CNE : </span>
                  <span className="font-mono font-semibold text-slate-800">{dossier.student.cne}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Sujets Choisis par Priorité ({dossier.selectedTopics.length})
              </div>
              <div className="space-y-1.5">
                {[...dossier.selectedTopics]
                  .sort((a, b) => a.priority - b.priority)
                  .map((t) => (
                    <div
                      key={t.topicId}
                      className="p-2 rounded-lg bg-white border border-slate-200/90 space-y-0.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-mono text-[10px] font-bold">
                          Choix n°{t.priority}
                        </span>
                        <span className="font-mono text-[10px] font-semibold text-indigo-700">
                          {t.topicCode}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900 line-clamp-1" title={t.topicTitle}>
                        {t.topicTitle}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {t.director} · {t.laboratory}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* TAB 1: DOCUMENTS JUSTIFICATIFS DU CANDIDAT */}
          {activeTab === 'documents' && (
            <div className="space-y-5">
              {/* Document Summary Bar */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span>
                    Contrôle technique : {requiredPresence.depositedRequired}/{requiredPresence.totalRequired} obligatoires déposés
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-semibold">
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {docSummary.conform} Conformes
                  </span>
                  {docSummary.pending > 0 && (
                    <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 border border-blue-200">
                      {docSummary.pending} En attente
                    </span>
                  )}
                  {docSummary.nonConform > 0 && (
                    <span className="px-2.5 py-1 rounded bg-red-100 text-red-800 border border-red-200">
                      {docSummary.nonConform} Non conformes
                    </span>
                  )}
                  {docSummary.complement > 0 && (
                    <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300">
                      {docSummary.complement} Complément demandé
                    </span>
                  )}
                  {docSummary.replacement > 0 && (
                    <span className="px-2.5 py-1 rounded bg-orange-100 text-orange-900 border border-orange-300">
                      {docSummary.replacement} Remplacement demandé
                    </span>
                  )}
                  {docSummary.notDeposited > 0 && (
                    <span className="px-2.5 py-1 rounded bg-slate-200 text-slate-700">
                      {docSummary.notDeposited} Non déposés
                    </span>
                  )}
                </div>
              </div>

              {/* Documents List */}
              <div className="space-y-3">
                <div className="font-bold text-slate-900 text-sm flex flex-wrap items-center justify-between gap-2">
                  <span>Documents justificatifs du candidat</span>
                  <span className="text-slate-500 font-normal text-xs">
                    Consultation intégrée, téléchargement et vérification administrative
                  </span>
                </div>

                <div className="space-y-3">
                  {catalogDocuments.map((doc) => {
                    const currentRemark = docRemarks[doc.id] ?? doc.remark ?? '';
                    const statusMeta = getDocumentStatusMeta(doc.status);
                    const hasRealFile = hasStoredPdfFile(doc);

                    return (
                      <div
                        key={doc.id}
                        className={`p-4 rounded-xl border transition-all ${statusMeta.rowBgClass}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          {/* Left: Document Info */}
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div
                              className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                                hasRealFile
                                  ? 'bg-red-600/10 border-red-200 text-red-600'
                                  : 'bg-slate-100 border-slate-200 text-slate-400'
                              }`}
                            >
                              <FileText className="w-5 h-5" />
                            </div>

                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {doc.label}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                    doc.required
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {doc.required ? 'Obligatoire' : 'Facultatif'}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusMeta.badgeClass}`}
                                >
                                  {statusMeta.label}
                                </span>
                                {doc.version && doc.version > 0 ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                                    v{doc.version}
                                  </span>
                                ) : null}
                              </div>

                              {doc.description && (
                                <p className="text-[11px] text-slate-500 leading-snug">
                                  {doc.description}
                                </p>
                              )}

                              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 flex-wrap">
                                {hasRealFile ? (
                                  <>
                                    <span className="text-slate-700 font-semibold truncate">
                                      {doc.fileName}
                                    </span>
                                    <span>·</span>
                                    <span>{doc.fileSize}</span>
                                    <span>·</span>
                                    <span>Dépôt: {formatDocumentDate(doc.uploadDate)}</span>
                                  </>
                                ) : (
                                  <span className="italic text-slate-400 font-sans">
                                    Aucun fichier PDF déposé par le candidat
                                  </span>
                                )}
                              </div>

                              {hasRealFile && doc.technicalCheck && (
                                <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>{doc.technicalCheck.summary}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Consulter & Télécharger */}
                          {hasRealFile && (
                            <div className="flex items-center gap-2 shrink-0 self-start">
                              <button
                                type="button"
                                onClick={() => setSelectedPdfDoc(doc)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors cursor-pointer text-xs shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Consulter</span>
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  setFormErrorMsg(null);
                                  try {
                                    await downloadDocumentPdf(doc);
                                  } catch (err) {
                                    setFormErrorMsg(
                                      err instanceof Error
                                        ? err.message
                                        : 'Impossible de télécharger ce document PDF.'
                                    );
                                  }
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer text-xs"
                                title="Télécharger le fichier PDF original"
                              >
                                <Download className="w-3.5 h-3.5 text-slate-600" />
                                <span>Télécharger</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Director Verification Controls */}
                        {canVerifyAndOpine && (
                          <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2.5">
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <span className="font-semibold text-slate-700 mr-1">
                                Décision administrative :
                              </span>

                              <button
                                type="button"
                                disabled={!hasRealFile}
                                onClick={() => handleDocStatusChange(doc, 'conforme')}
                                title={
                                  hasRealFile
                                    ? 'Valider ce document comme conforme'
                                    : 'Impossible de valider : aucun fichier PDF déposé'
                                }
                                className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                                  !hasRealFile
                                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                    : statusMeta.status === 'conforme'
                                    ? 'bg-emerald-600 text-white shadow-xs cursor-pointer'
                                    : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800 cursor-pointer'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Valider (Conforme)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDocStatusChange(doc, 'non_conforme')}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                  statusMeta.status === 'non_conforme'
                                    ? 'bg-red-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-red-100 hover:text-red-800'
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Non conforme</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDocStatusChange(doc, 'complement_demande')}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                  statusMeta.status === 'complement_demande'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-900'
                                }`}
                              >
                                <MessageSquarePlus className="w-3.5 h-3.5" />
                                <span>Demander un complément</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDocStatusChange(doc, 'remplacement_demande')}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                  statusMeta.status === 'remplacement_demande'
                                    ? 'bg-orange-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-orange-100 hover:text-orange-900'
                                }`}
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Demander un remplacement</span>
                              </button>
                            </div>

                            {/* Decision comment field */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <input
                                type="text"
                                value={currentRemark}
                                onChange={(e) => handleDocRemarkChange(doc.id, e.target.value)}
                                placeholder="Commentaire explicatif (obligatoire pour non conforme, complément ou remplacement)..."
                                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveDocRemark(doc)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs cursor-pointer shrink-0"
                              >
                                Enregistrer commentaire
                              </button>
                            </div>
                          </div>
                        )}

                        {!canVerifyAndOpine && doc.remark && (
                          <div className="mt-2.5 p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700">
                            <strong>Commentaire :</strong> {doc.remark}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AVIS SCIENTIFIQUE DU DIRECTEUR DE THÈSE */}
          {activeTab === 'opinion' && (() => {
            const researchProjectDoc = catalogDocuments.find(
              (d) => d.category === 'projet_recherche' && hasStoredPdfFile(d)
            );
            const selectedTopic = dossier.selectedTopics[0];
            const isReadOnlyArchive = isDirectorDone && Boolean(dossier.scientificOpinion);

            return (
              <div className="space-y-5">
                {/* Step 1 Conformity Certificate Banner */}
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Dossier documentaire prêt pour évaluation scientifique ({requiredPresence.validatedRequired}/{requiredPresence.totalRequired} vérifiés).
                    </span>
                  </div>
                  {dossier.documentsValidatedAt && (
                    <span className="text-[11px] font-mono text-emerald-700">
                      Vérifié le {new Date(dossier.documentsValidatedAt).toLocaleDateString('fr-FR')} par {dossier.documentsValidatedBy || actorDisplayName}
                    </span>
                  )}
                </div>

                {/* Candidate Research Proposal & Primary Topic Details */}
                {dossier.student.researchProposal && (
                  <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
                      Proposition de recherche & motivation du candidat
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed">
                      {dossier.student.researchProposal}
                    </p>
                  </div>
                )}

                {/* Full Research Topic & Scientific Project Summary */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-700">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Sujet principal (Choix n°1) & Projet scientifique</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {fullTopicDetails?.title || selectedTopic?.topicTitle || 'Sujet doctoral'}
                      </h4>
                      <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-2">
                        <span className="font-mono font-semibold text-indigo-700">
                          {fullTopicDetails?.code || selectedTopic?.topicCode}
                        </span>
                        <span>·</span>
                        <span>{fullTopicDetails?.domain || 'Domaine Doctoral'}</span>
                        <span>·</span>
                        <span>Labo : {fullTopicDetails?.laboratory || selectedTopic?.laboratory}</span>
                        {fullTopicDetails?.funding && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-700 font-semibold">
                              Financement : {fullTopicDetails.funding}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {researchProjectDoc && (
                      <button
                        type="button"
                        onClick={() => setSelectedPdfDoc(researchProjectDoc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Consulter le projet PDF du candidat</span>
                      </button>
                    )}
                  </div>

                  {fullTopicDetails?.abstract && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      <span className="font-bold text-slate-900">Descriptif scientifique : </span>
                      {fullTopicDetails.abstract}
                    </div>
                  )}

                  {fullTopicDetails && (
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      {fullTopicDetails.prerequisites.slice(0, 3).map((req) => (
                        <span
                          key={req}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          Prérequis : {req}
                        </span>
                      ))}
                      {fullTopicDetails.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Read-Only Archived Scientific Opinion Card when already completed */}
                {isReadOnlyArchive && dossier.scientificOpinion ? (
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Avis scientifique officiel du Directeur de Thèse
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                          Rendu par {dossier.scientificOpinion.directorName} ({dossier.scientificOpinion.directorTitle})
                        </h3>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                          dossier.scientificOpinion.decision === 'favorable'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : dossier.scientificOpinion.decision === 'favorable_reserve'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-red-100 text-red-900 border-red-300'
                        }`}
                      >
                        {dossier.scientificOpinion.decision === 'favorable'
                          ? 'Avis Favorable'
                          : dossier.scientificOpinion.decision === 'favorable_reserve'
                          ? 'Avis Favorable sous réserve'
                          : 'Avis Défavorable'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-white border border-slate-200">
                        <div className="text-[11px] text-slate-500 font-semibold">Appréciation scientifique</div>
                        <div className="font-semibold text-slate-900 mt-0.5">
                          {dossier.scientificOpinion.appreciation || 'Pertinence scientifique évaluée'}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-slate-200">
                        <div className="text-[11px] text-slate-500 font-semibold">Date de décision</div>
                        <div className="font-mono font-semibold text-slate-900 mt-0.5">
                          {dossier.scientificOpinion.decisionDate
                            ? new Date(dossier.scientificOpinion.decisionDate).toLocaleDateString('fr-FR')
                            : new Date(dossier.scientificOpinion.submittedAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-1">
                      <div className="text-[11px] text-slate-500 font-semibold">Commentaire du directeur</div>
                      <p className="text-xs text-slate-800 leading-relaxed">
                        {dossier.scientificOpinion.comment}
                      </p>
                    </div>

                    {dossier.scientificOpinion.recommendations && (
                      <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-1">
                        <div className="text-[11px] text-slate-500 font-semibold">
                          Observations ou recommandations
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed">
                          {dossier.scientificOpinion.recommendations}
                        </p>
                      </div>
                    )}

                    {dossier.scientificOpinion.reservesOrJustification && (
                      <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 space-y-1">
                        <div className="text-[11px] text-amber-900 font-bold">
                          {dossier.scientificOpinion.decision === 'favorable_reserve'
                            ? 'Réserves précisées'
                            : 'Motivation du refus'}
                        </div>
                        <p className="text-xs text-amber-950 leading-relaxed">
                          {dossier.scientificOpinion.reservesOrJustification}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSaveScientificOpinion} className="space-y-5">
                    <div className="p-4 rounded-xl bg-slate-900 text-white space-y-1">
                      <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                        Étape 2 · Évaluation Scientifique & Clôture du Dossier
                      </div>
                      <h3 className="text-base font-bold text-white">
                        Avis scientifique du Directeur : {actorDisplayName}
                      </h3>
                      <p className="text-xs text-slate-300">
                        Consignez votre décision scientifique motivée. La validation clôture votre instruction et archive automatiquement le dossier dans « Dossiers déjà traités » avec transmission au CEDoc.
                      </p>
                    </div>

                    {/* Decision options */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Décision scientifique * :
                      </label>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            decision === 'favorable'
                              ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-400/20'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="radio"
                              name="decision"
                              value="favorable"
                              checked={decision === 'favorable'}
                              onChange={() => setDecision('favorable')}
                              className="mt-1 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Favorable</span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                                Le projet scientifique est jugé pertinent et solide.
                              </p>
                            </div>
                          </div>
                        </label>

                        <label
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            decision === 'favorable_reserve'
                              ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/20'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="radio"
                              name="decision"
                              value="favorable_reserve"
                              checked={decision === 'favorable_reserve'}
                              onChange={() => setDecision('favorable_reserve')}
                              className="mt-1 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                <span>Favorable sous réserve</span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                                Projet prometteur nécessitant des précisions ou ajustements obligatoires.
                              </p>
                            </div>
                          </div>
                        </label>

                        <label
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            decision === 'defavorable'
                              ? 'border-red-500 bg-red-50/60 ring-2 ring-red-400/20'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="radio"
                              name="decision"
                              value="defavorable"
                              checked={decision === 'defavorable'}
                              onChange={() => setDecision('defavorable')}
                              className="mt-1 text-red-600 focus:ring-red-500 cursor-pointer"
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                <XCircle className="w-4 h-4 text-red-600" />
                                <span>Défavorable</span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                                Projet ou profil incompatible avec les exigences scientifiques.
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Appréciation + Date de décision */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-900 mb-1">
                          Appréciation (pertinence scientifique) * :
                        </label>
                        <select
                          value={appreciation}
                          onChange={(e) => setAppreciation(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          {APPRECIATION_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-1">
                          Date de décision * :
                        </label>
                        <input
                          type="date"
                          required
                          value={decisionDate}
                          onChange={(e) => setDecisionDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Conditional Reserves / Justification Field */}
                    {(decision === 'favorable_reserve' || decision === 'defavorable') && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
                        <label className="block text-xs font-bold text-amber-900">
                          {decision === 'favorable_reserve'
                            ? 'Précision obligatoire des réserves & modifications demandées * :'
                            : 'Justification scientifique obligatoire du rejet * :'}
                        </label>
                        <textarea
                          rows={2}
                          value={reservesOrJustification}
                          onChange={(e) => setReservesOrJustification(e.target.value)}
                          required
                          placeholder={
                            decision === 'favorable_reserve'
                              ? 'Détailler les révisions requises (ex: approfondissement de l’état de l’art, méthodologie...)'
                              : 'Expliquer les motifs d’incompatibilité scientifique ou d’insuffisance...'
                          }
                          className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    )}

                    {/* Observations ou recommandations */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        Observations ou recommandations (plan de travail, bibliographie, méthodologie) :
                      </label>
                      <textarea
                        rows={2}
                        value={recommendations}
                        onChange={(e) => setRecommendations(e.target.value)}
                        placeholder="Recommandations scientifiques à l’attention du candidat et de la commission doctorale..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Commentaire du directeur */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">
                        Commentaire du directeur * :
                      </label>
                      <textarea
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                        placeholder="Rédiger votre évaluation détaillée sur les compétences du candidat, la faisabilité du sujet et l’adéquation avec le laboratoire..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Action Submit Button */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-500">
                        Enregistrement horodaté · Directeur : {actorDisplayName}
                      </div>

                      {canVerifyAndOpine ? (
                        <button
                          type="submit"
                          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer text-xs"
                        >
                          <Send className="w-4 h-4" />
                          <span>Enregistrer et transmettre au Directeur CEDoc →</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                          Consultation seule (rôle sans privilège d’évaluation)
                        </span>
                      )}
                    </div>
                  </form>
                )}
              </div>
            );
          })()}

          {/* TAB 3: DÉCISION FINALE CEDOC (EXCLUSIF DIRECTEUR CEDOC / ADMIN & ÉTAPES 1+2 VALIDÉES) */}
          {activeTab === 'cedoc' && canDecideCedoc && !isStep3Unlocked && (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                <Lock className="w-5 h-5 text-amber-700 shrink-0" />
                <span>Étape 3 verrouillée — Validation préalable obligatoire</span>
              </div>
              <p className="text-amber-900 leading-relaxed">
                Le Directeur du CEDoc ne peut statuer sur une candidature qu’après la validation complète des étapes précédentes :
              </p>
              <ul className="list-disc pl-5 space-y-1 text-amber-900 font-medium">
                {cedocGate.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <div className="pt-2 flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('documents')}
                  className="px-3.5 py-2 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl font-semibold cursor-pointer"
                >
                  Consulter l’Étape 1 (Documents)
                </button>
                {isStep2Unlocked && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('opinion')}
                    className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-semibold cursor-pointer"
                  >
                    Passer à l’Étape 2 (Avis Directeur)
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'cedoc' && isStep3Unlocked && (
            <form onSubmit={handleSaveCedocDecision} noValidate className="space-y-5">
              <div className="p-4 rounded-xl bg-indigo-950 text-white space-y-1">
                <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  Étape 3 · Commission Doctorale · Direction du CEDoc
                </div>
                <h3 className="text-base font-bold text-white">
                  Décision Finale & Convocation / Inscription Définitive
                </h3>
                <p className="text-xs text-indigo-200">
                  En tant que responsable CEDoc ({actorDisplayName}), arbitrez ce dossier suite à la validation des documents et à l’avis scientifique du directeur de thèse.
                </p>
              </div>

              {/* Recap of Step 1 & Step 2 */}
              {dossier.scientificOpinion && (
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Étapes 1 & 2 validées — Avis Directeur :{' '}
                        {dossier.scientificOpinion.decision === 'favorable'
                          ? 'Favorable'
                          : dossier.scientificOpinion.decision === 'favorable_reserve'
                          ? 'Favorable sous réserve'
                          : 'Défavorable'}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-800 line-clamp-2">
                      Par {dossier.scientificOpinion.directorName} : « {dossier.scientificOpinion.comment} »
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 shrink-0">
                    {requiredPresence.validatedRequired}/{requiredPresence.totalRequired} docs conformes
                  </span>
                </div>
              )}

              {/* Existing saved CEDoc decision summary */}
              {dossier.cedocDecision && (
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-indigo-600" />
                      <span>
                        Décision CEDoc actuelle : {dossier.cedocDecision.decisionLabel}
                      </span>
                    </span>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-indigo-600 text-white">
                      {dossier.cedocDecision.decisionCode}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-900">
                    <strong>Observation :</strong> {dossier.cedocDecision.observation}
                  </p>
                  <div className="text-[11px] text-indigo-700 font-mono">
                    Enregistrée le {new Date(dossier.cedocDecision.decidedAt).toLocaleString('fr-FR')} par {dossier.cedocDecision.decidedBy}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'transmis_cedoc',
                    code: 'EN_EXAMEN_CEDOC',
                    label: 'En cours d’examen',
                    desc: 'Conserver le dossier dans les candidatures en cours d’examen CEDoc.'
                  },
                  {
                    id: 'convoque_entretien',
                    code: 'ENTRETIEN_A_PLANIFIER',
                    label: 'Convoquer à l’entretien oral',
                    desc: 'Définir une date, une heure et les modalités de l’entretien.'
                  },
                  {
                    id: 'retenu',
                    code: 'ADMIS',
                    label: 'Admis / Retenu définitivement',
                    desc: 'Candidature acceptée — Préparer le passage à l’inscription définitive.'
                  },
                  {
                    id: 'non_conforme',
                    code: 'REJETE',
                    label: 'Non retenu / Rejeté',
                    desc: 'Clôturer avec motif obligatoire et notifier le candidat.'
                  }
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      cedocStatus === opt.id
                        ? 'border-indigo-600 bg-indigo-50/70'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="cedocStatus"
                        checked={cedocStatus === opt.id}
                        onChange={() => {
                          setFormErrorMsg(null);
                          setCedocStatus(opt.id as typeof cedocStatus);
                        }}
                        className="mt-1 text-indigo-600 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs">{opt.label}</span>
                          <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {opt.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{opt.desc}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {cedocStatus === 'convoque_entretien' && (
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-purple-950 mb-1">
                      Date & heure entretien *
                    </label>
                    <input
                      type="datetime-local"
                      value={interviewDate}
                      onChange={(e) => {
                        setFormErrorMsg(null);
                        setInterviewDate(e.target.value);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border border-purple-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-purple-950 mb-1">
                      Modalité *
                    </label>
                    <select
                      value={interviewMode}
                      onChange={(e) => setInterviewMode(e.target.value as 'presentiel' | 'visioconference')}
                      className="w-full px-2.5 py-1.5 text-xs border border-purple-300 rounded-lg bg-white"
                    >
                      <option value="presentiel">Présentiel (Campus USMBA)</option>
                      <option value="visioconference">Visioconférence</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-purple-950 mb-1">
                      Salle / Lien *
                    </label>
                    <input
                      type="text"
                      value={interviewRoom}
                      onChange={(e) => {
                        setFormErrorMsg(null);
                        setInterviewRoom(e.target.value);
                      }}
                      placeholder="Ex: Salle des Commissions CEDoc / Lien Meet"
                      className="w-full px-2.5 py-1.5 text-xs border border-purple-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  {cedocStatus === 'non_conforme'
                    ? 'Motif obligatoire du rejet / non-retenue (CEDoc) *'
                    : 'Observation officielle du CEDoc / Procès-verbal *'}
                </label>
                <textarea
                  rows={3}
                  value={cedocNote}
                  onChange={(e) => {
                    setFormErrorMsg(null);
                    setCedocNote(e.target.value);
                  }}
                  placeholder={
                    cedocStatus === 'non_conforme'
                      ? 'Ex: Dossier non retenu suite à l’arbitrage de la commission doctorale (capacité d’encadrement atteinte / adéquation scientifique insuffisante)...'
                      : 'Ex: Dossier conforme et avis scientifique favorable validé en commission. Candidat admis pour inscription au titre de l’année 2026/2027...'
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {formErrorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formErrorMsg}</span>
                </div>
              )}

              {savedSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{savedSuccessMsg}</span>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500">
                  Directeur CEDoc : <strong className="text-slate-800">{actorDisplayName}</strong> · Enregistrement horodaté
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    Fermer
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer text-xs"
                  >
                    <Award className="w-4 h-4" />
                    <span>Valider la décision CEDoc</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 4: HISTORIQUE ET TRAÇABILITÉ (DANS DOSSIERS TRAITÉS OU SUPERVISION CEDOC) */}
          {activeTab === 'history' && canViewHistoryTab && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>Historique Chronologique des Décisions & Traçabilité Complète</span>
                </h4>
                <span className="text-[11px] font-mono text-slate-500">
                  Audit d’imputabilité GCD USMBA
                </span>
              </div>

              {(!dossier.historyLogs || dossier.historyLogs.length === 0) ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                  Aucun événement enregistré.
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-200 left-3 space-y-4 my-2">
                  {dossier.historyLogs.map((log) => (
                    <div key={log.id} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white ring-2 ring-slate-100" />
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="font-bold text-slate-900">{log.action}</span>
                          <span className="font-mono text-[11px] text-slate-400 shrink-0">
                            {new Date(log.timestamp).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Auteur : <span className="font-semibold text-slate-800">{log.authorName}</span> ({log.authorRole})
                        </div>
                        <p className="text-xs text-slate-700 mt-1 italic">
                          "{log.details}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer — Primary Workflow Action Replaces "Fermer le dossier" */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
            <span>Statut actuel :</span>
            <span className="font-semibold text-slate-900 uppercase font-mono">
              {dossier.status}
            </span>
            {!isDirectorDone && activeTab === 'documents' && !step1Gate.allowed && (
              <span className="text-[11px] text-amber-700 font-medium">
                · {requiredPresence.validatedRequired}/{requiredPresence.totalRequired} obligatoires conformes
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {activeTab === 'documents' && !isDirectorDone && canVerifyAndOpine && (
              <button
                type="button"
                onClick={handleValidateDocumentsAndProceed}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
              >
                <span>Valider les pièces et passer à l’avis scientifique →</span>
              </button>
            )}

            {activeTab === 'opinion' && !isDirectorDone && (
              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Consulter les pièces PDF ({requiredPresence.depositedRequired}/{requiredPresence.totalRequired})</span>
              </button>
            )}

            {isDirectorDone && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                  <Archive className="w-3.5 h-3.5" />
                  <span>
                    Dossier traité le{' '}
                    {new Date(
                      dossier.directorProcessedAt ||
                        dossier.scientificOpinion?.submittedAt ||
                        dossier.submittedAt
                    ).toLocaleDateString('fr-FR')}
                  </span>
                </span>

                {canViewHistoryTab && activeTab !== 'history' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Voir l’historique complet</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded PDF Reader Modal */}
      <PdfViewerModal
        documentItem={selectedPdfDoc}
        dossier={dossier}
        currentUser={currentUser}
        onClose={() => setSelectedPdfDoc(null)}
      />
    </div>
  );
};
