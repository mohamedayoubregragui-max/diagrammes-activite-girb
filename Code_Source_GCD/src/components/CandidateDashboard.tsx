import React, { useState, useMemo, useEffect } from 'react';
import {
  ApplicationDossier,
  AuthenticatedUser,
  ThesisTopic,
  JustificatifDocument,
  DocumentCategory,
  DocumentTechnicalCheck,
  UserRole
} from '../types';
import { OfficialReceiptModal } from './OfficialReceiptModal';
import { TopicDetailModal } from './TopicDetailModal';
import { PdfViewerModal } from './PdfViewerModal';
import { formatFileSize } from '../services/pdfGenerator';
import { savePdfBinary, downloadDocumentPdf } from '../services/fileStorage';
import { getNotificationsForDossier, addNewDocumentToDossier, CandidateNotification } from '../services/notifications';
import { hasAnyRole } from '../services/storage';
import {
  DOCUMENT_REQUIREMENTS,
  formatDocumentDate,
  getDocumentStatusMeta,
  getMaxPdfSizeMb,
  getRequiredDocumentsPresence,
  hasStoredPdfFile,
  mergeDossierWithDocumentCatalog,
  validateUploadedPdfFile
} from '../services/documentService';
import { INITIAL_TOPICS } from '../data/mockTopics';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  ShieldCheck,
  Award,
  ChevronRight,
  BookOpen,
  Eye,
  Download,
  AlertTriangle,
  XCircle,
  Send,
  Bell,
  Upload,
  Info,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

interface CandidateDashboardProps {
  dossiers: ApplicationDossier[];
  currentUser: AuthenticatedUser | null;
  onNavigateToCampaigns: () => void;
  onOpenAuth: (role?: UserRole, mode?: 'login' | 'register' | 'institutional') => void;
  onBackToHome?: () => void;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({
  dossiers,
  currentUser,
  onNavigateToCampaigns,
  onOpenAuth,
  onBackToHome
}) => {
  const isCandidate = hasAnyRole(currentUser, ['candidat']);

  // Strict data protection (Loi 09-08): only dossiers belonging to the authenticated candidate
  const userDossiers = useMemo(() => {
    if (!currentUser || !isCandidate) return [];
    return dossiers.filter(
      (d) =>
        d.student.academicEmail.toLowerCase() === currentUser.email.toLowerCase() ||
        (d.student.cin && currentUser.cin && d.student.cin.toUpperCase() === currentUser.cin.toUpperCase()) ||
        (d.student.cne && currentUser.cne && d.student.cne.toUpperCase() === currentUser.cne.toUpperCase())
    );
  }, [dossiers, currentUser, isCandidate]);

  const [selectedDossierId, setSelectedDossierId] = useState<string>('');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedTopicForModal, setSelectedTopicForModal] = useState<ThesisTopic | null>(null);
  const [selectedPdfForModal, setSelectedPdfForModal] = useState<JustificatifDocument | null>(null);

  // New Document Upload / Replace modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [replacingDocId, setReplacingDocId] = useState<string | undefined>(undefined);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('diplome');
  const [uploadLabel, setUploadLabel] = useState('Attestation de diplôme ou de réussite');
  const [uploadFileObj, setUploadFileObj] = useState<File | null>(null);
  const [uploadTechCheck, setUploadTechCheck] = useState<DocumentTechnicalCheck | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [docActionError, setDocActionError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [maxPdfMb, setMaxPdfMb] = useState<number>(() => getMaxPdfSizeMb());

  useEffect(() => {
    const onSettingsUpdated = () => setMaxPdfMb(getMaxPdfSizeMb());
    window.addEventListener('gcd_settings_updated', onSettingsUpdated);
    return () => window.removeEventListener('gcd_settings_updated', onSettingsUpdated);
  }, []);

  const activeDossier = useMemo(
    () => userDossiers.find((d) => d.id === selectedDossierId) || userDossiers[0] || null,
    [userDossiers, selectedDossierId]
  );

  const catalogDocuments = useMemo(
    () => (activeDossier ? mergeDossierWithDocumentCatalog(activeDossier.documentsList) : []),
    [activeDossier]
  );

  const requiredPresence = useMemo(
    () => (activeDossier ? getRequiredDocumentsPresence(activeDossier.documentsList) : null),
    [activeDossier]
  );

  // Reactive notifications synchronized with activeDossier
  const notifications: CandidateNotification[] = useMemo(
    () => (activeDossier ? getNotificationsForDossier(activeDossier) : []),
    [activeDossier]
  );

  // Privacy Gate 1: Unauthenticated visitor
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xs text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Espace Personnel Protégé · Loi 09-08
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Authentification Requise pour Consulter Votre Dossier
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Pour garantir la confidentialité de vos données personnelles et académiques, l'accès à « Mon Dossier » est strictement réservé aux candidats authentifiés avec leur adresse académique institutionnelle.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => onOpenAuth('candidat', 'login')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Se connecter / Créer un compte étudiant
            </button>
            <button
              onClick={onNavigateToCampaigns}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
            >
              Explorer les sujets (accès libre)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Privacy Gate 2: Non-candidate institutional role
  if (!isCandidate) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Espace Réservé aux Candidats (Étudiants)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Vous êtes actuellement connecté en tant que <strong>{currentUser.firstName} {currentUser.lastName}</strong> ({currentUser.role}). Cet espace est réservé au suivi personnel des candidatures étudiantes.
          </p>
        </div>
      </div>
    );
  }

  if (!activeDossier) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          Aucun dossier de candidature trouvé
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Vous n'avez pas encore déposé de candidature officielle pour la campagne doctorale 2026/2027 sous le compte <strong>{currentUser.email}</strong>. Explorez les sujets et composez votre panier.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour à mon espace candidat</span>
            </button>
          )}
          <button
            onClick={onNavigateToCampaigns}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Explorer les sujets
          </button>
        </div>
      </div>
    );
  }

  const openUploadModal = (docToTarget?: JustificatifDocument) => {
    setUploadError(null);
    setUploadFileObj(null);
    setUploadTechCheck(undefined);
    if (docToTarget) {
      const isRealExistingDoc = !docToTarget.id.startsWith('slot-');
      setReplacingDocId(isRealExistingDoc ? docToTarget.id : undefined);
      setUploadCategory(docToTarget.category);
      setUploadLabel(docToTarget.label);
    } else {
      setReplacingDocId(undefined);
      setUploadCategory('autre');
      setUploadLabel('Autres pièces justificatives complémentaires');
    }
    setIsUploadModalOpen(true);
  };

  const handleModalFileSelection = async (file: File | undefined) => {
    if (!file) {
      setUploadFileObj(null);
      setUploadTechCheck(undefined);
      return;
    }
    const validation = await validateUploadedPdfFile(file);
    setUploadTechCheck(validation.technicalCheck);
    if (!validation.valid) {
      setUploadFileObj(null);
      setUploadError(validation.errorMessage || 'Fichier PDF non conforme aux critères techniques.');
      return;
    }
    setUploadError(null);
    setUploadFileObj(file);
  };

  // Handle document upload / replacement submit
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!uploadFileObj) {
      setUploadError('Veuillez sélectionner un véritable fichier PDF valide à téléverser.');
      return;
    }

    setIsUploading(true);
    try {
      const validation = uploadTechCheck?.isIntegrityValid
        ? { valid: true, technicalCheck: uploadTechCheck }
        : await validateUploadedPdfFile(uploadFileObj);

      if (!validation.valid) {
        setIsUploading(false);
        setUploadError('Le fichier sélectionné n’a pas validé le contrôle technique PDF.');
        return;
      }

      const storageKey = `pdf-upload-${activeDossier.id}-${uploadCategory}-${Date.now()}`;
      await savePdfBinary(storageKey, uploadFileObj);
      const sizeStr = formatFileSize(uploadFileObj.size);

      addNewDocumentToDossier(
        activeDossier.id,
        uploadCategory,
        uploadLabel,
        uploadFileObj.name,
        storageKey,
        sizeStr,
        replacingDocId,
        validation.technicalCheck
      );

      setIsUploading(false);
      setIsUploadModalOpen(false);
      setUploadFileObj(null);
      setUploadTechCheck(undefined);
      setReplacingDocId(undefined);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
      setUploadError('Erreur lors de la lecture ou du téléversement du fichier PDF.');
    }
  };

  // Timeline computation based on real status
  const getTimelineSteps = () => {
    const status = activeDossier.status;
    const hasOpinion = Boolean(activeDossier.scientificOpinion);
    const hasCedocFinal =
      status === 'retenu' ||
      (status === 'non_conforme' && (Boolean(activeDossier.cedocDecision) || hasOpinion));
    const isTransmittedCed =
      status === 'transmis_cedoc' ||
      status === 'convoque_entretien' ||
      hasCedocFinal ||
      hasOpinion;
    const isRetenu = status === 'retenu';

    return [
      { id: 1, label: 'Création dossier', done: true, current: false },
      { id: 2, label: 'Soumission officielle', done: true, current: false },
      {
        id: 3,
        label: 'Examen Directeur',
        done: status !== 'en_attente',
        current: status === 'en_attente' || status === 'documents_en_cours'
      },
      {
        id: 4,
        label: 'Décision Directeur',
        done: hasOpinion,
        current: status === 'documents_non_conformes'
      },
      {
        id: 5,
        label: 'Examen CED',
        done: hasCedocFinal || status === 'convoque_entretien',
        current: isTransmittedCed && !hasCedocFinal && status !== 'convoque_entretien'
      },
      {
        id: 6,
        label: 'Décision finale',
        done: hasCedocFinal,
        current: status === 'convoque_entretien'
      },
      {
        id: 7,
        label: 'Inscription définitive',
        done: isRetenu,
        current: isRetenu
      }
    ];
  };

  const timelineSteps = getTimelineSteps();

  // Calendar deadlines
  const calendarDeadlines = [
    { label: 'Clôture des soumissions de sujets', date: '15 Octobre 2026', passed: true },
    { label: 'Dépôt des candidatures en ligne', date: '30 Octobre 2026', passed: true },
    { label: 'Vérification & audit par la scolarité', date: '05 Novembre 2026', passed: true },
    { label: 'Examen scientifique & avis des directeurs', date: '15 Novembre 2026', passed: false, current: true },
    { label: 'Entretiens de sélection orale', date: '25 Novembre 2026', passed: false },
    { label: 'Validation finale par le CEDoc & Inscription', date: '10 Décembre 2026', passed: false }
  ];

  return (
    <div className="space-y-8 pb-12">
      {onBackToHome && (
        <div>
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à mon espace candidat</span>
          </button>
        </div>
      )}

      {/* Top Banner: Candidate Overview */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                {activeDossier.referenceNumber}
              </span>
              {activeDossier.isDemo && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Dossier de démonstration
                </span>
              )}
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">
                Déposé le {new Date(activeDossier.submittedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
              {activeDossier.student.academicEmail && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#0D9488]" />
                  <span>E-mail Académique Vérifié ({activeDossier.student.academicEmail})</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tableau de Bord Candidat : {activeDossier.student.firstName} {activeDossier.student.lastName.toUpperCase()}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Suivi en temps réel de votre candidature doctorale auprès du <strong>CEDoc Sciences et Technologies</strong> de l'USMBA. Retrouvez votre timeline interactive, vos pièces PDF, les notifications et le calendrier des échéances.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => setIsReceiptOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Récépissé Officiel de Dépôt</span>
            </button>

            {userDossiers.length > 1 && (
              <select
                value={activeDossier.id}
                onChange={(e) => setSelectedDossierId(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {userDossiers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.referenceNumber} ({d.selectedTopics.length} sujets)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Dynamic Status Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-semibold">Statut actuel :</span>

            {activeDossier.status === 'en_attente' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>En attente d’examen</span>
              </span>
            )}

            {activeDossier.status === 'documents_en_cours' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Documents en cours de vérification par le Directeur</span>
              </span>
            )}

            {activeDossier.status === 'documents_non_conformes' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-800 border border-red-200">
                <XCircle className="w-3.5 h-3.5 text-red-600" />
                <span>Documents non conformes - Action requise</span>
              </span>
            )}

            {activeDossier.status === 'non_conforme' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-red-600 text-white border border-red-700">
                <XCircle className="w-3.5 h-3.5 text-white" />
                <span>Décision CEDoc : Non retenu / Rejeté (REJETE)</span>
              </span>
            )}

            {activeDossier.status === 'avis_favorable' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Avis Favorable du Directeur de Thèse</span>
              </span>
            )}

            {activeDossier.status === 'avis_favorable_reserve' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>Avis Favorable sous réserve</span>
              </span>
            )}

            {activeDossier.status === 'avis_defavorable' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-900 border border-red-300">
                <XCircle className="w-3.5 h-3.5 text-red-700" />
                <span>Avis Défavorable émis</span>
              </span>
            )}

            {activeDossier.status === 'transmis_cedoc' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                <Send className="w-3.5 h-3.5 text-indigo-600" />
                <span>En cours d’examen CEDoc</span>
              </span>
            )}

            {activeDossier.status === 'convoque_entretien' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                <span>Convoqué à l’entretien oral</span>
              </span>
            )}

            {activeDossier.status === 'retenu' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white border border-emerald-700">
                <Award className="w-3.5 h-3.5 text-white" />
                <span>Admis · Inscription définitive (ADMIS)</span>
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Code CNE : {activeDossier.student.cne}
          </div>
        </div>

        {/* CEDoc Official Decision Card when available */}
        {(activeDossier.cedocDecision ||
          activeDossier.status === 'retenu' ||
          activeDossier.status === 'convoque_entretien' ||
          (activeDossier.status === 'non_conforme' && Boolean(activeDossier.verificationAudit))) && (
          <div
            className={`mt-4 p-4 rounded-2xl border text-xs space-y-1.5 ${
              activeDossier.status === 'retenu'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : activeDossier.status === 'non_conforme'
                ? 'bg-red-50 border-red-200 text-red-950'
                : activeDossier.status === 'convoque_entretien'
                ? 'bg-purple-50 border-purple-200 text-purple-950'
                : 'bg-indigo-50 border-indigo-200 text-indigo-950'
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold flex items-center gap-1.5">
                <Award className="w-4 h-4 shrink-0" />
                <span>
                  Décision officielle du CEDoc :{' '}
                  {activeDossier.cedocDecision?.decisionLabel ||
                    (activeDossier.status === 'retenu'
                      ? 'Admis / Retenu définitivement'
                      : activeDossier.status === 'convoque_entretien'
                      ? 'Convoqué à l’entretien oral'
                      : activeDossier.status === 'non_conforme'
                      ? 'Non retenu / Rejeté'
                      : 'En cours d’examen CEDoc')}
                </span>
              </span>
              {activeDossier.cedocDecision?.decisionCode && (
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-white/80 border border-current/20">
                  {activeDossier.cedocDecision.decisionCode}
                </span>
              )}
            </div>
            {(activeDossier.cedocDecision?.observation || activeDossier.verificationAudit?.auditNote) && (
              <p className="leading-relaxed">
                <strong>Observation / Motif :</strong>{' '}
                {activeDossier.cedocDecision?.observation || activeDossier.verificationAudit?.auditNote}
              </p>
            )}
            {(activeDossier.cedocDecision?.interviewDate || activeDossier.verificationAudit?.interviewDate) && (
              <div className="text-[11px] font-semibold">
                Entretien :{' '}
                {new Date(
                  activeDossier.cedocDecision?.interviewDate ||
                    activeDossier.verificationAudit!.interviewDate!
                ).toLocaleString('fr-FR')}{' '}
                ·{' '}
                {(activeDossier.cedocDecision?.interviewMode ||
                  activeDossier.verificationAudit?.interviewMode) === 'visioconference'
                  ? 'Visioconférence'
                  : 'Présentiel'}{' '}
                ({activeDossier.cedocDecision?.interviewRoom || activeDossier.verificationAudit?.interviewRoom})
              </div>
            )}
          </div>
        )}
      </div>

      {/* FEATURE 1: TIMELINE DE CANDIDATURE INTERACTIVE */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Chronologie Interactive de la Candidature (TP O&M)</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            Synchronisation en temps réel avec les espaces Directeurs & CEDoc
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
          {timelineSteps.map((step) => (
            <div
              key={step.id}
              className={`p-3 rounded-2xl border text-xs flex flex-col justify-between space-y-2 ${
                step.done
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : step.current
                  ? 'bg-blue-50 border-blue-300 text-blue-950 ring-2 ring-blue-400/20'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[10px]">Étape 0{step.id}</span>
                {step.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : step.current ? (
                  <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                )}
              </div>
              <div className="font-bold text-slate-900 leading-snug">{step.label}</div>
              <div className="text-[10px] font-medium">
                {step.done ? 'Validé' : step.current ? 'En cours...' : 'À venir'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURE 1B: SUJETS DE RECHERCHE CHOISIS */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>Sujets de Recherche Sélectionnés ({activeDossier.selectedTopics.length} / 3)</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            Classés par ordre de priorité
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {activeDossier.selectedTopics.map((item) => {
            const fullTopic = INITIAL_TOPICS.find((t) => t.id === item.topicId || t.code === item.topicCode);
            return (
              <div
                key={item.topicId}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-600 text-white">
                      Priorité #{item.priority}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{item.topicCode}</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 line-clamp-2">
                    {item.topicTitle}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Dir. : <span className="font-medium">{item.director}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{item.laboratory}</div>
                </div>
                {fullTopic && (
                  <button
                    type="button"
                    onClick={() => setSelectedTopicForModal(fullTopic)}
                    className="self-start text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Consulter la fiche sujet</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {activeDossier.student.researchProposal && (
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              Résumé du projet de recherche & motivation
            </div>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {activeDossier.student.researchProposal}
            </p>
          </div>
        )}
      </div>

      {/* FEATURE 3: NOTIFICATIONS CENTER */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <span>Centre de Notifications ({notifications.length})</span>
          </h2>
          <span className="text-[11px] text-slate-500">
            Informatives & Nécessitant une action
          </span>
        </div>

        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border flex items-start justify-between gap-4 ${
                notif.type === 'action_required'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                  : notif.type === 'success'
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                {notif.type === 'action_required' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : notif.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                )}

                <div>
                  <div className="font-bold text-xs sm:text-sm flex items-center gap-2">
                    <span>{notif.title}</span>
                    {!notif.isRead && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase">
                        Nouveau
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1 text-slate-600 leading-relaxed">{notif.message}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono text-[10px] text-slate-400 block">
                  {new Date(notif.timestamp).toLocaleDateString('fr-FR')}
                </span>
                {notif.type === 'action_required' && (
                  <button
                    onClick={() => {
                      const el = document.getElementById('documents-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="mt-2 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] rounded-lg transition-colors cursor-pointer"
                  >
                    Agir / Remplacer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURE 2: MES DOCUMENTS JUSTIFICATIFS */}
      <div id="documents-section" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Mes documents justificatifs</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Format PDF strict (.pdf) · Taille maximale configurée : {maxPdfMb} Mo · Contrôle technique séparé de la validation administrative
            </p>
          </div>

          <button
            type="button"
            onClick={() => openUploadModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Upload className="w-4 h-4 text-white" />
            <span>Déposer un document</span>
          </button>
        </div>

        {/* Technical Presence vs Administrative Validation Summary */}
        {requiredPresence && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Présence pièces obligatoires
                </div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {requiredPresence.depositedRequired} / {requiredPresence.totalRequired} déposés
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  requiredPresence.isAllRequiredPresent
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {requiredPresence.isAllRequiredPresent ? 'Complet' : 'À compléter'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Validation administrative
                </div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {requiredPresence.validatedRequired} / {requiredPresence.totalRequired} conformes
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Directeur de thèse
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Contrôle technique fichiers
                </div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  PDF ≤ {maxPdfMb} Mo · %PDF-
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-200 text-slate-700">
                Automatique
              </span>
            </div>
          </div>
        )}

        {docActionError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start justify-between gap-2 text-xs text-red-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{docActionError}</span>
            </div>
            <button
              type="button"
              onClick={() => setDocActionError(null)}
              className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Structured Documents List */}
        <div className="space-y-3">
          {catalogDocuments.map((doc) => {
            const statusMeta = getDocumentStatusMeta(doc.status);
            const hasRealFile = hasStoredPdfFile(doc);

            return (
              <div
                key={doc.id}
                className={`p-4 rounded-2xl border transition-all ${statusMeta.rowBgClass}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Document Metadata */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                        hasRealFile
                          ? 'bg-red-600/10 border-red-200 text-red-600'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">
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
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${statusMeta.badgeClass}`}
                        >
                          {statusMeta.label}
                        </span>
                        {doc.version && doc.version > 0 ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            v{doc.version}
                          </span>
                        ) : null}
                      </div>

                      {doc.description && (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {doc.description}
                        </p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[11px] text-slate-600">
                        <div className="truncate">
                          <span className="text-slate-400 font-medium">Fichier déposé : </span>
                          {hasRealFile ? (
                            <span className="font-mono font-semibold text-slate-800">
                              {doc.fileName} ({doc.fileSize})
                            </span>
                          ) : (
                            <span className="italic text-slate-400">Aucun fichier déposé</span>
                          )}
                        </div>

                        <div>
                          <span className="text-slate-400 font-medium">Date de dépôt : </span>
                          <span className="font-mono text-slate-700">
                            {hasRealFile ? formatDocumentDate(doc.uploadDate) : '—'}
                          </span>
                        </div>
                      </div>

                      {hasRealFile && doc.technicalCheck && (
                        <div className="text-[11px] text-emerald-700 flex items-center gap-1.5 pt-0.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{doc.technicalCheck.summary}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0 self-start lg:self-center">
                    {hasRealFile ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedPdfForModal(doc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Consulter</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            setDocActionError(null);
                            try {
                              await downloadDocumentPdf(doc);
                            } catch (err) {
                              setDocActionError(
                                err instanceof Error
                                  ? err.message
                                  : 'Impossible de télécharger ce fichier PDF.'
                              );
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                          <span>Télécharger</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openUploadModal(doc)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold text-xs rounded-lg transition-colors cursor-pointer ${
                            statusMeta.requiresCandidateAction
                              ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                          }`}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>
                            {statusMeta.status === 'remplacement_demande'
                              ? 'Déposer nouvelle version'
                              : 'Remplacer'}
                          </span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openUploadModal(doc)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Déposer le PDF</span>
                      </button>
                    )}
                  </div>
                </div>

                {doc.remark && (
                  <div
                    className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      statusMeta.requiresCandidateAction
                        ? 'bg-white border-amber-300 text-amber-950'
                        : 'bg-white/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    <AlertTriangle
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        statusMeta.requiresCandidateAction ? 'text-amber-600' : 'text-slate-400'
                      }`}
                    />
                    <div>
                      <span className="font-semibold">
                        Commentaire {doc.reviewedBy ? `(${doc.reviewedBy})` : 'du directeur'} :
                      </span>{' '}
                      {doc.remark}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FEATURE 4: CALENDRIER DES ÉCHÉANCES */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Calendrier des Échéances de Candidature (USMBA 2026/2027)</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            Planning officiel CEDoc
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {calendarDeadlines.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2 ${
                item.passed
                  ? 'bg-slate-50 border-slate-200 text-slate-500'
                  : item.current
                  ? 'bg-blue-50 border-blue-300 text-blue-950 ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold">{item.date}</span>
                {item.passed ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                    Passé
                  </span>
                ) : item.current ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white animate-pulse">
                    En cours
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                    À venir
                  </span>
                )}
              </div>
              <div className="font-bold text-xs sm:text-sm">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: DÉPOSER / REMPLACER UN DOCUMENT PDF */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {replacingDocId
                  ? 'Déposer une nouvelle version du document PDF'
                  : 'Déposer un document justificatif PDF'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setReplacingDocId(undefined);
                  setUploadError(null);
                  setUploadFileObj(null);
                  setUploadTechCheck(undefined);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catégorie du document *
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => {
                    const cat = e.target.value as DocumentCategory;
                    setUploadCategory(cat);
                    const spec = DOCUMENT_REQUIREMENTS.find((r) => r.category === cat);
                    if (spec) setUploadLabel(spec.label);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
                >
                  {DOCUMENT_REQUIREMENTS.map((spec) => (
                    <option key={spec.category} value={spec.category}>
                      {spec.label} ({spec.required ? 'Obligatoire' : 'Facultatif'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Libellé du document *
                </label>
                <input
                  type="text"
                  required
                  value={uploadLabel}
                  onChange={(e) => setUploadLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Fichier PDF réel (Format .pdf uniquement · Max {maxPdfMb} Mo) *
                </label>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  required
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    handleModalFileSelection(file);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 cursor-pointer"
                />
                {uploadFileObj && uploadTechCheck && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-[11px] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{uploadTechCheck.summary}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFileObj}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-xl shadow-sm cursor-pointer"
                >
                  {isUploading ? 'Téléversement en cours...' : 'Confirmer & Téléverser'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      <OfficialReceiptModal
        dossier={activeDossier}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />

      {/* Topic Detail Modal */}
      <TopicDetailModal
        topic={selectedTopicForModal}
        onClose={() => setSelectedTopicForModal(null)}
        cart={[]}
        onAddToCart={() => {}}
        onRemoveFromCart={() => {}}
        isMaxReached={true}
      />

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        documentItem={selectedPdfForModal}
        dossier={activeDossier}
        currentUser={currentUser}
        onClose={() => setSelectedPdfForModal(null)}
      />
    </div>
  );
};
