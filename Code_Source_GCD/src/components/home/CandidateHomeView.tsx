import React, { useState, useMemo } from 'react';
import {
  ActivePage,
  ApplicationDossier,
  AuthenticatedUser,
  JustificatifDocument
} from '../../types';
import {
  getNotificationsForDossier,
  CandidateNotification
} from '../../services/notifications';
import {
  getRequiredDocumentsPresence,
  mergeDossierWithDocumentCatalog,
  getDocumentStatusMeta,
  getMaxPdfSizeMb
} from '../../services/documentService';
import {
  getPlatformCampaigns,
  getPlatformTopics,
  getPublishedResults
} from '../../services/platformService';
import { PdfViewerModal } from '../PdfViewerModal';
import {
  GraduationCap,
  BookOpen,
  ShoppingBag,
  FileText,
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Calendar,
  Eye,
  Send,
  ShieldCheck,
  Award
} from 'lucide-react';

interface CandidateHomeViewProps {
  currentUser: AuthenticatedUser;
  dossiers: ApplicationDossier[];
  cartCount: number;
  onNavigate: (page: ActivePage) => void;
  onOpenCart: () => void;
  onStartValidation: () => void;
}

export const CandidateHomeView: React.FC<CandidateHomeViewProps> = ({
  currentUser,
  dossiers,
  cartCount,
  onNavigate,
  onOpenCart,
  onStartValidation
}) => {
  const [selectedPdfDoc, setSelectedPdfDoc] = useState<JustificatifDocument | null>(null);
  const [selectedDossierId, setSelectedDossierId] = useState<string>('');

  // Strict Loi 09-08 filtering: only dossiers belonging to the authenticated candidate
  const userDossiers = useMemo(() => {
    return dossiers.filter(
      (d) =>
        d.student.academicEmail.toLowerCase() === currentUser.email.toLowerCase() ||
        (d.student.cin &&
          currentUser.cin &&
          d.student.cin.toUpperCase() === currentUser.cin.toUpperCase()) ||
        (d.student.cne &&
          currentUser.cne &&
          d.student.cne.toUpperCase() === currentUser.cne.toUpperCase())
    );
  }, [dossiers, currentUser]);

  const activeDossier = useMemo(
    () => userDossiers.find((d) => d.id === selectedDossierId) || userDossiers[0] || null,
    [userDossiers, selectedDossierId]
  );

  const openCampaigns = useMemo(
    () => getPlatformCampaigns().filter((c) => c.status === 'ouverte'),
    []
  );
  const totalTopicsCount = useMemo(() => getPlatformTopics().length, []);
  const publishedResults = useMemo(() => getPublishedResults(), []);
  const maxPdfMb = getMaxPdfSizeMb();

  const catalogDocuments = useMemo(
    () => (activeDossier ? mergeDossierWithDocumentCatalog(activeDossier.documentsList) : []),
    [activeDossier]
  );

  const docPresence = useMemo(
    () => (activeDossier ? getRequiredDocumentsPresence(activeDossier.documentsList) : null),
    [activeDossier]
  );

  const notifications: CandidateNotification[] = useMemo(() => {
    if (!activeDossier) return [];
    const base = getNotificationsForDossier(activeDossier);
    const publishedMatch = publishedResults.find((r) => r.dossierId === activeDossier.id);
    if (publishedMatch) {
      return [
        {
          id: `pub-${publishedMatch.dossierId}`,
          type: publishedMatch.status === 'non_conforme' ? 'action_required' : 'success',
          title: `Résultat officiel CEDoc publié : ${publishedMatch.decisionLabel}`,
          message: `La décision finale pour votre candidature ${publishedMatch.referenceNumber} a été publiée officiellement le ${new Date(publishedMatch.publishedAt).toLocaleDateString('fr-FR')}.`,
          timestamp: publishedMatch.publishedAt,
          isRead: false
        },
        ...base
      ];
    }
    return base;
  }, [activeDossier, publishedResults]);

  const timelineSteps = useMemo(() => {
    if (!activeDossier) return [];
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
      { id: 1, label: 'Création du dossier', done: true, current: false },
      { id: 2, label: 'Soumission', done: true, current: false },
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
        label: 'Examen CEDoc',
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
  }, [activeDossier]);

  const statusLabelMap: Record<ApplicationDossier['status'], { label: string; cls: string }> = {
    en_attente: {
      label: 'En attente d’examen',
      cls: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    documents_en_cours: {
      label: 'Vérification des documents',
      cls: 'bg-blue-50 text-blue-800 border-blue-200'
    },
    documents_non_conformes: {
      label: 'Complément / remplacement requis',
      cls: 'bg-red-50 text-red-800 border-red-200'
    },
    avis_favorable: {
      label: 'Avis Favorable du Directeur',
      cls: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    avis_favorable_reserve: {
      label: 'Avis Favorable sous réserve',
      cls: 'bg-amber-100 text-amber-900 border-amber-300'
    },
    avis_defavorable: {
      label: 'Avis Défavorable',
      cls: 'bg-red-100 text-red-900 border-red-300'
    },
    transmis_cedoc: {
      label: 'En cours d’examen CEDoc',
      cls: 'bg-indigo-50 text-indigo-800 border-indigo-200'
    },
    diplome_conforme: {
      label: 'Diplôme conforme',
      cls: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    non_conforme: {
      label: 'Non retenu / Rejeté (CEDoc)',
      cls: 'bg-red-600 text-white border-red-700'
    },
    convoque_entretien: {
      label: 'Convoqué à l’entretien oral',
      cls: 'bg-purple-50 text-purple-800 border-purple-200'
    },
    retenu: {
      label: 'Admis — Inscription autorisée',
      cls: 'bg-emerald-600 text-white border-emerald-700'
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Hero Card */}
      <section className="academic-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50/80 border border-blue-200/70 rounded-xl text-[#2563EB] text-xs font-semibold">
              <GraduationCap className="w-4 h-4" />
              <span>Espace Candidat · Campagne Doctorale 2026/2027</span>
              <span className="ml-1 px-2 py-0.5 rounded-md bg-teal-100 text-[#0D9488] text-[10px] font-bold border border-teal-200">
                E-mail Académique Vérifié
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#101B35] tracking-tight">
              Bienvenue, {currentUser.firstName} {currentUser.lastName}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-sans">
              {currentUser.institution || 'USMBA Fès'} ·{' '}
              <span className="font-mono text-[#2563EB] font-medium">{currentUser.email}</span>
              {currentUser.cne ? ` · CNE : ${currentUser.cne}` : ''}
            </p>
          </div>

          {/* Primary Candidate Actions: strictly 2 main buttons */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('campagnes')}
              className="flex items-center gap-2 px-4 py-2.5 academic-btn-primary text-xs font-bold rounded-xl cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explorer les sujets</span>
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-[#172B4D] border border-slate-300/80 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <ShoppingBag className="w-4 h-4 text-[#2563EB]" />
              <span>Consulter le panier ({cartCount}/3)</span>
            </button>
          </div>
        </div>

        {/* 4 Key Candidate KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="academic-card-tinted p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold font-sans">
              <span>Campagnes ouvertes</span>
              <Calendar className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-extrabold font-mono text-[#101B35]">
                {openCampaigns.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-sans">
                {totalTopicsCount} sujets doctoraux disponibles
              </div>
            </div>
          </div>

          <div className="academic-card-tinted p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold font-sans">
              <span>Sujets dans mon panier</span>
              <ShoppingBag className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <div className="text-2xl font-extrabold font-mono text-[#2563EB]">
                  {cartCount} / 3
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-sans">
                  {cartCount === 0 ? 'Panier provisoire vide' : 'Prêt pour soumission'}
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenCart}
                className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
              >
                Ouvrir
              </button>
            </div>
          </div>

          <div className="academic-card-tinted p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold font-sans">
              <span>Mon dossier personnel</span>
              <Send className="w-4 h-4 text-[#0D9488]" />
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <div className="text-2xl font-extrabold font-mono text-[#101B35]">
                  {userDossiers.length}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5 truncate font-sans">
                  {activeDossier
                    ? statusLabelMap[activeDossier.status].label
                    : 'Aucun dossier soumis'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('mon_dossier')}
                className="text-xs font-semibold text-[#0D9488] hover:underline cursor-pointer shrink-0"
              >
                Mon dossier →
              </button>
            </div>
          </div>

          <div className="academic-card-tinted p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold font-sans">
              <span>Pièces PDF justificatives</span>
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-extrabold font-mono text-[#101B35]">
                {docPresence
                  ? `${docPresence.depositedRequired}/${docPresence.totalRequired}`
                  : '0/5'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-sans">
                {docPresence
                  ? `${docPresence.validatedRequired} conforme(s) · PDF ≤ ${maxPdfMb} Mo`
                  : `Optionnel (Démo) · PDF ≤ ${maxPdfMb} Mo`}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Doctoral Campaigns Banner */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Campagnes Doctorales Ouvertes ({openCampaigns.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('campagnes')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Voir tous les sujets de recherche</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {openCampaigns.map((camp) => (
            <div
              key={camp.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-indigo-700">
                    {camp.code}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Ouverte · {camp.academicYear}
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-900">{camp.title}</div>
                <p className="text-xs text-slate-600">{camp.description}</p>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/70">
                <span>
                  Clôture : <strong className="text-slate-800">{camp.endDate}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('campagnes')}
                  className="font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Explorer les sujets →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Active Application Tracking, Timeline, Documents & Notifications */}
      {activeDossier ? (
        <>
          {/* Dossier Selector if multiple + Timeline */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap text-xs font-mono text-indigo-600 font-bold">
                  <span>Suivi de candidature · Réf. {activeDossier.referenceNumber}</span>
                  {activeDossier.isDemo && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Dossier de démonstration
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  Avancement & Chronologie de Votre Dossier
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {userDossiers.length > 1 && (
                  <select
                    value={activeDossier.id}
                    onChange={(e) => setSelectedDossierId(e.target.value)}
                    className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-xl bg-white"
                  >
                    {userDossiers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.referenceNumber}
                      </option>
                    ))}
                  </select>
                )}

                <span
                  className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                    statusLabelMap[activeDossier.status].cls
                  }`}
                >
                  {statusLabelMap[activeDossier.status].label}
                </span>

                <button
                  type="button"
                  onClick={() => onNavigate('mon_dossier')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Consulter mon dossier complet
                </button>
              </div>
            </div>

            {/* Final Decision Banner from CEDoc or Director Opinion */}
            {(activeDossier.cedocDecision ||
              activeDossier.status === 'retenu' ||
              activeDossier.status === 'convoque_entretien' ||
              activeDossier.status === 'non_conforme') && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-1.5 ${
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
                      Décision finale du CEDoc :{' '}
                      {activeDossier.cedocDecision?.decisionLabel ||
                        statusLabelMap[activeDossier.status].label}
                    </span>
                  </span>
                  {activeDossier.cedocDecision?.decisionCode && (
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-white border border-current/20">
                      {activeDossier.cedocDecision.decisionCode}
                    </span>
                  )}
                </div>
                {activeDossier.cedocDecision?.observation && (
                  <p className="leading-relaxed">
                    <strong>Observation :</strong> {activeDossier.cedocDecision.observation}
                  </p>
                )}
                {(activeDossier.cedocDecision?.interviewDate ||
                  activeDossier.verificationAudit?.interviewDate) && (
                  <div className="text-[11px] font-semibold">
                    Entretien prévu :{' '}
                    {new Date(
                      activeDossier.cedocDecision?.interviewDate ||
                        activeDossier.verificationAudit!.interviewDate!
                    ).toLocaleString('fr-FR')}{' '}
                    ·{' '}
                    {(activeDossier.cedocDecision?.interviewMode ||
                      activeDossier.verificationAudit?.interviewMode) === 'visioconference'
                      ? 'Visioconférence'
                      : 'Présentiel'}{' '}
                    ({activeDossier.cedocDecision?.interviewRoom ||
                      activeDossier.verificationAudit?.interviewRoom})
                  </div>
                )}
              </div>
            )}

            {/* 7-Step Visual Timeline */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {timelineSteps.map((step) => (
                <div
                  key={step.id}
                  className={`p-3 rounded-xl border text-center space-y-1.5 ${
                    step.done
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : step.current
                      ? 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex justify-center">
                    {step.done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : step.current ? (
                      <Clock className="w-5 h-5 text-blue-600" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-[10px] font-mono font-bold">
                        {step.id}
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] font-bold leading-tight">{step.label}</div>
                </div>
              ))}
            </div>

            {/* Selected Thesis Topics summary */}
            <div className="pt-2 space-y-2">
              <div className="text-xs font-semibold text-slate-600">
                Sujets de recherche sélectionnés ({activeDossier.selectedTopics.length}) :
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeDossier.selectedTopics.map((topic) => (
                  <div
                    key={topic.topicId}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] text-indigo-700 font-semibold">
                      <span>
                        Choix #{topic.priority} · {topic.topicCode}
                      </span>
                      <span>{topic.director}</span>
                    </div>
                    <div className="font-bold text-slate-900 mt-1 line-clamp-2">
                      {topic.topicTitle}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{topic.laboratory}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Documents & Notifications Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Documents deposited and validation status */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>Documents déposés & validation</span>
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('mon_dossier')}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Déposer / Remplacer →
                </button>
              </div>

              <div className="space-y-2.5">
                {catalogDocuments.map((doc) => {
                  const meta = getDocumentStatusMeta(doc.status);
                  const hasFile = Boolean(doc.fileName && (doc.storageKey || doc.fileUrl || doc.fileData));

                  return (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs text-slate-900 truncate">
                            {doc.label}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                          {hasFile ? `${doc.fileName} (${doc.fileSize})` : 'Non déposé'}
                        </div>
                      </div>

                      {hasFile && (
                        <button
                          type="button"
                          onClick={() => setSelectedPdfDoc(doc)}
                          className="p-2 rounded-lg bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 shrink-0 cursor-pointer"
                          title="Consulter ce PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Notifications */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-600" />
                  <span>Notifications récentes ({notifications.length})</span>
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('mon_dossier')}
                  className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                >
                  Détails du suivi →
                </button>
              </div>

              <div className="space-y-2.5">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                    Aucune notification pour le moment.
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                        notif.type === 'action_required'
                          ? 'bg-amber-50 border-amber-200'
                          : notif.type === 'success'
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {notif.type === 'action_required' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      ) : notif.type === 'success' ? (
                        <Award className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900">{notif.title}</span>
                          <span className="font-mono text-[10px] text-slate-500 shrink-0">
                            {new Date(notif.timestamp).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      ) : (
        <section className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Vous n’avez pas encore déposé de dossier officiel
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Explorez le catalogue des sujets doctoraux, ajoutez jusqu’à 3 sujets dans votre panier, puis ouvrez votre panier et cliquez sur « Valider ma sélection » pour soumettre votre dossier.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigate('campagnes')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              Explorer les sujets
            </button>
            {cartCount > 0 && (
              <button
                type="button"
                onClick={onStartValidation}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Valider ma sélection ({cartCount}/3)
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('mon_dossier')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Accéder à mon dossier
            </button>
          </div>
        </section>
      )}

      {/* Embedded PDF Viewer */}
      <PdfViewerModal
        documentItem={selectedPdfDoc}
        dossier={activeDossier}
        currentUser={currentUser}
        onClose={() => setSelectedPdfDoc(null)}
      />
    </div>
  );
};
