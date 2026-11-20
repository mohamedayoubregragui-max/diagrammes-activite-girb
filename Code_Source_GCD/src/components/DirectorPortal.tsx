import React, { useState, useMemo } from 'react';
import { ApplicationDossier, AuthenticatedUser, DossierStatus, ScientificOpinionDecision } from '../types';
import { DossierDetailModal } from './DossierDetailModal';
import {
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  XCircle,
  Award,
  RotateCcw,
  FileCheck2,
  AlertTriangle,
  Send,
  FileText,
  UserCheck,
  SlidersHorizontal,
  Archive,
  Eye,
  History,
  Filter
} from 'lucide-react';
import { resetDemoData, hasPrivilege, isDossierProcessedByDirector } from '../services/storage';
import {
  ALLOWED_MAX_PDF_SIZES_MB,
  getDossierDocumentaryStatus,
  getMaxPdfSizeMb,
  getRequiredDocumentsPresence,
  setMaxPdfSizeMb
} from '../services/documentService';

interface DirectorPortalProps {
  dossiers: ApplicationDossier[];
  currentUser?: AuthenticatedUser | null;
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

export const DirectorPortal: React.FC<DirectorPortalProps> = ({
  dossiers,
  currentUser = null
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'documents_conformes' | DossierStatus>('all');
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<'documents' | 'opinion' | 'cedoc' | 'history'>('opinion');
  const [maxPdfMb, setMaxPdfMbState] = useState<number>(() => getMaxPdfSizeMb());
  const [archivedToast, setArchivedToast] = useState<string | null>(null);

  // Filters dedicated to "Dossiers déjà traités"
  const [treatedSearch, setTreatedSearch] = useState('');
  const [treatedFormationFilter, setTreatedFormationFilter] = useState<string>('all');
  const [treatedOpinionFilter, setTreatedOpinionFilter] = useState<'all' | ScientificOpinionDecision>('all');
  const [treatedDateFilter, setTreatedDateFilter] = useState<string>('');

  const canSuperviseAll = hasPrivilege(currentUser, 'supervise_cedoc');
  const canManagePlatform = hasPrivilege(currentUser, 'manage_platform_settings');

  // Role-scoped dossiers: CEDoc & Admin see all; Directeur de thèse sees assigned dossiers
  const scopedDossiers = useMemo(() => {
    if (!currentUser || canSuperviseAll) return dossiers;
    const lastNameLower = currentUser.lastName.toLowerCase();
    return dossiers.filter((d) =>
      d.selectedTopics.some((t) => t.director.toLowerCase().includes(lastNameLower))
    );
  }, [dossiers, currentUser, canSuperviseAll]);

  // Strict workflow separation: Pending vs Already Treated
  const pendingDossiers = useMemo(
    () => scopedDossiers.filter((d) => !isDossierProcessedByDirector(d)),
    [scopedDossiers]
  );

  const treatedDossiers = useMemo(
    () =>
      scopedDossiers
        .filter((d) => isDossierProcessedByDirector(d))
        .sort((a, b) => {
          const da = new Date(a.directorProcessedAt || a.scientificOpinion?.submittedAt || a.submittedAt).getTime();
          const db = new Date(b.directorProcessedAt || b.scientificOpinion?.submittedAt || b.submittedAt).getTime();
          return db - da;
        }),
    [scopedDossiers]
  );

  const selectedDossier = useMemo(
    () => scopedDossiers.find((d) => d.id === selectedDossierId) || null,
    [scopedDossiers, selectedDossierId]
  );

  const openDossierModal = (
    dossierId: string,
    tab: 'documents' | 'opinion' | 'cedoc' | 'history' = 'documents'
  ) => {
    setModalInitialTab(tab);
    setSelectedDossierId(dossierId);
  };

  // Statistics across pending + treated dossiers
  const stats = useMemo(() => {
    const totalPending = pendingDossiers.length;
    const pending = pendingDossiers.filter((d) => d.status === 'en_attente').length;
    const docsInReview = pendingDossiers.filter((d) => d.status === 'documents_en_cours').length;
    const docsNonConform = pendingDossiers.filter(
      (d) => d.status === 'documents_non_conformes' || d.status === 'non_conforme'
    ).length;
    const favorable = treatedDossiers.filter(
      (d) => d.scientificOpinion?.decision === 'favorable' || d.status === 'avis_favorable'
    ).length;
    const favorableReserve = treatedDossiers.filter(
      (d) => d.scientificOpinion?.decision === 'favorable_reserve' || d.status === 'avis_favorable_reserve'
    ).length;
    const defavorable = treatedDossiers.filter(
      (d) => d.scientificOpinion?.decision === 'defavorable' || d.status === 'avis_defavorable'
    ).length;
    const treatedCount = treatedDossiers.length;

    return {
      totalPending,
      pending,
      docsInReview,
      docsNonConform,
      favorable,
      favorableReserve,
      defavorable,
      treatedCount
    };
  }, [pendingDossiers, treatedDossiers]);

  // Filtered list strictly for active/pending dossiers (never shows treated dossiers)
  const filteredPendingDossiers = useMemo(() => {
    return pendingDossiers.filter((d) => {
      const docStatus = getDossierDocumentaryStatus(d, false);
      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'documents_conformes'
          ? docStatus.label === 'Documents conformes' || docStatus.label === 'Avis scientifique en attente'
          : d.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        d.referenceNumber.toLowerCase().includes(q) ||
        d.student.firstName.toLowerCase().includes(q) ||
        d.student.lastName.toLowerCase().includes(q) ||
        d.student.cne.toLowerCase().includes(q) ||
        d.student.academicEmail.toLowerCase().includes(q) ||
        d.selectedTopics.some(
          (t) => t.topicTitle.toLowerCase().includes(q) || t.topicCode.toLowerCase().includes(q)
        );

      return matchStatus && matchSearch;
    });
  }, [pendingDossiers, statusFilter, searchQuery]);

  const treatedFormations = useMemo(() => {
    const set = new Set<string>();
    treatedDossiers.forEach((d) => {
      if (d.student.degreeDeclared) set.add(d.student.degreeDeclared);
    });
    return Array.from(set);
  }, [treatedDossiers]);

  const filteredTreatedDossiers = useMemo(() => {
    return treatedDossiers.filter((d) => {
      const q = treatedSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        d.referenceNumber.toLowerCase().includes(q) ||
        d.student.firstName.toLowerCase().includes(q) ||
        d.student.lastName.toLowerCase().includes(q) ||
        d.student.cne.toLowerCase().includes(q) ||
        d.selectedTopics.some(
          (t) => t.topicTitle.toLowerCase().includes(q) || t.topicCode.toLowerCase().includes(q)
        );

      const matchFormation =
        treatedFormationFilter === 'all' || d.student.degreeDeclared === treatedFormationFilter;

      const opinionDecision = d.scientificOpinion?.decision;
      const matchOpinion =
        treatedOpinionFilter === 'all' || opinionDecision === treatedOpinionFilter;

      const matchDate =
        !treatedDateFilter ||
        d.submittedAt.slice(0, 10) === treatedDateFilter ||
        (d.directorProcessedAt || '').slice(0, 10) === treatedDateFilter ||
        (d.scientificOpinion?.decisionDate || '').slice(0, 10) === treatedDateFilter ||
        (d.scientificOpinion?.submittedAt || '').slice(0, 10) === treatedDateFilter;

      return matchSearch && matchFormation && matchOpinion && matchDate;
    });
  }, [
    treatedDossiers,
    treatedSearch,
    treatedFormationFilter,
    treatedOpinionFilter,
    treatedDateFilter
  ]);

  // Global operation traceability logs across scoped dossiers
  const globalHistoryLogs = useMemo(() => {
    return scopedDossiers
      .flatMap((d) =>
        (d.historyLogs || []).map((log) => ({
          ...log,
          dossierId: d.id,
          referenceNumber: d.referenceNumber,
          candidateName: `${d.student.lastName.toUpperCase()} ${d.student.firstName}`
        }))
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [scopedDossiers]);

  return (
    <div className="space-y-6">
      {/* Title & Institutional Scope */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>
              {canManagePlatform
                ? 'Administration Pôle Doctoral · Supervision & Gouvernance GCD'
                : canSuperviseAll
                ? 'Direction du CEDoc · Supervision & Décisions Finales'
                : `Espace Directeur de Thèse · Dossiers affectés (${currentUser?.firstName || ''} ${currentUser?.lastName || ''})`}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {canSuperviseAll
              ? 'Supervision Globale des Candidatures Doctorales'
              : 'Consultation et Examen Scientifique des Candidats'}
          </h1>
          <p className="mt-1 text-xs text-slate-600 max-w-2xl">
            {canSuperviseAll
              ? 'Supervisez l’ensemble des dossiers transmis par les directeurs de thèse, consultez les avis scientifiques et entérinez les décisions finales d’admission.'
              : 'Examinez les dossiers validés qui vous sont affectés, consultez et téléchargez les véritables pièces justificatives PDF, validez la conformité de chaque document et consignez votre avis scientifique motivé.'}
          </p>
        </div>

        {canManagePlatform && (
          <div className="flex items-center gap-2.5 flex-wrap shrink-0 self-start md:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
              <label htmlFor="max-pdf-size" className="font-semibold text-slate-700 whitespace-nowrap">
                Taille max PDF :
              </label>
              <select
                id="max-pdf-size"
                value={maxPdfMb}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMaxPdfSizeMb(val);
                  setMaxPdfMbState(val);
                }}
                className="bg-white border border-slate-300 rounded-lg px-2 py-0.5 font-mono font-bold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ALLOWED_MAX_PDF_SIZES_MB.map((sz) => (
                  <option key={sz} value={sz}>
                    {sz} Mo
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={resetDemoData}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer border border-slate-300"
              title="Réinitialiser les dossiers de démonstration"
            >
              <RotateCcw className="w-4 h-4 text-slate-600" />
              <span>Réinitialiser démo</span>
            </button>
          </div>
        )}
      </div>

      {/* Toast notification when a dossier moves to Dossiers déjà traités */}
      {archivedToast && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{archivedToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setArchivedToast(null)}
            className="text-emerald-100 hover:text-white underline cursor-pointer"
          >
            Masquer
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500">À traiter (Actifs)</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{stats.totalPending}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-800">En attente d’examen</div>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1">{stats.pending}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <div className="text-[11px] font-semibold text-blue-800">Docs en cours</div>
          <div className="text-xl font-bold font-mono text-blue-600 mt-1">{stats.docsInReview}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-red-200 bg-red-50/20 shadow-2xs">
          <div className="text-[11px] font-semibold text-red-800">Docs non conformes</div>
          <div className="text-xl font-bold font-mono text-red-600 mt-1">{stats.docsNonConform}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-800">Avis favorable</div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">{stats.favorable}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-900">Avis sous réserve</div>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1">{stats.favorableReserve}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
          <div className="text-[11px] font-semibold text-indigo-900">Déjà traités</div>
          <div className="text-xl font-bold font-mono text-indigo-700 mt-1">{stats.treatedCount}</div>
        </div>
      </div>

      {/* Toolbar: Search and Filter Tabs for Pending Dossiers */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Candidatures à traiter ({pendingDossiers.length})</span>
          </h2>
          <span className="text-[11px] text-slate-500">
            Cliquez sur « Examiner la candidature » pour évaluer le dossier et transmettre votre avis au CEDoc.
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un dossier à traiter par nom, prénom, référence, CNE, code sujet..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tous à traiter ({pendingDossiers.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('en_attente')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'en_attente' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            En attente ({stats.pending})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('documents_conformes')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'documents_conformes' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Documents conformes ({pendingDossiers.filter((d) => {
              const lbl = getDossierDocumentaryStatus(d, false).label;
              return lbl === 'Documents conformes' || lbl === 'Avis scientifique en attente';
            }).length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('documents_en_cours')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'documents_en_cours' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Docs en cours ({stats.docsInReview})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('documents_non_conformes')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'documents_non_conformes' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Complément / Incomplet ({stats.docsNonConform})
          </button>
        </div>
      </div>

      {/* Candidatures Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Référence</th>
                <th className="py-3 px-4">Nom et Prénom</th>
                <th className="py-3 px-4">Formation Doctorale</th>
                <th className="py-3 px-4">Sujet de Recherche</th>
                <th className="py-3 px-4">Documents</th>
                <th className="py-3 px-4">Statut Documentaire</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPendingDossiers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Aucune candidature en attente ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredPendingDossiers.map((dossier) => {
                  const mainTopic = dossier.selectedTopics[0];
                  const docStatus = getDossierDocumentaryStatus(dossier, false);

                  return (
                    <tr key={dossier.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Reference */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-indigo-700">
                          {dossier.referenceNumber}
                        </div>
                        {dossier.isDemo && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Démonstration
                          </span>
                        )}
                      </td>

                      {/* Candidate Name & Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {dossier.student.lastName.toUpperCase()} {dossier.student.firstName}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                          {dossier.student.cne}
                        </div>
                      </td>

                      {/* Formation Doctorale */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 truncate" title={dossier.student.degreeDeclared}>
                          {dossier.student.degreeDeclared}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {dossier.student.currentInstitution} ({dossier.student.graduationYear})
                        </div>
                      </td>

                      {/* Proposed Research Topic */}
                      <td className="py-3.5 px-4 max-w-md">
                        {mainTopic ? (
                          <div>
                            <div className="font-medium text-slate-900 line-clamp-1" title={mainTopic.topicTitle}>
                              {mainTopic.topicTitle}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                              <span>{mainTopic.topicCode}</span>
                              {dossier.selectedTopics.length > 1 && (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-sans font-semibold text-[10px]">
                                  +{dossier.selectedTopics.length - 1} choix
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">Sujet non spécifié</span>
                        )}
                      </td>

                      {/* Deposited / Required Docs Count */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">
                          {docStatus.depositedCount} / {docStatus.requiredCount} obligatoires
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold">
                          {docStatus.validatedCount} / {docStatus.requiredCount} conformes
                        </div>
                      </td>

                      {/* Documentary Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${docStatus.badgeClass}`}
                        >
                          {docStatus.label}
                        </span>
                      </td>

                      {/* Single Primary Action Button */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openDossierModal(dossier.id, 'opinion')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Examiner la candidature</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Independent Section: DOSSIERS DÉJÀ TRAITÉS */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/70 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Archive className="w-5 h-5 text-emerald-600" />
                <span>Dossiers déjà traités ({treatedDossiers.length})</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Dossiers clôturés après validation de la conformité documentaire et émission de l’avis scientifique du directeur.
              </p>
            </div>

            {(treatedSearch || treatedFormationFilter !== 'all' || treatedOpinionFilter !== 'all' || treatedDateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setTreatedSearch('');
                  setTreatedFormationFilter('all');
                  setTreatedOpinionFilter('all');
                  setTreatedDateFilter('');
                }}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer self-start sm:self-auto"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>

          {/* Dedicated Filters: Candidate, Formation, Scientific Opinion, Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={treatedSearch}
                onChange={(e) => setTreatedSearch(e.target.value)}
                placeholder="Rechercher par candidat, réf., sujet..."
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={treatedFormationFilter}
                onChange={(e) => setTreatedFormationFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">Toutes les formations</option>
                {treatedFormations.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={treatedOpinionFilter}
              onChange={(e) => setTreatedOpinionFilter(e.target.value as typeof treatedOpinionFilter)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Tous les avis scientifiques</option>
              <option value="favorable">Favorable</option>
              <option value="favorable_reserve">Favorable sous réserve</option>
              <option value="defavorable">Défavorable</option>
            </select>

            <input
              type="date"
              value={treatedDateFilter}
              onChange={(e) => setTreatedDateFilter(e.target.value)}
              title="Filtrer par date de soumission ou de traitement"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Référence du dossier</th>
                <th className="py-3 px-4">Nom et prénom du candidat</th>
                <th className="py-3 px-4">Formation doctorale</th>
                <th className="py-3 px-4">Sujet de recherche</th>
                <th className="py-3 px-4">Date de soumission</th>
                <th className="py-3 px-4">Date de traitement</th>
                <th className="py-3 px-4">État de conformité des documents</th>
                <th className="py-3 px-4">Avis scientifique</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTreatedDossiers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Aucun dossier traité ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredTreatedDossiers.map((dossier) => {
                  const mainTopic = dossier.selectedTopics[0];
                  const docPresence = getRequiredDocumentsPresence(dossier.documentsList);
                  const processedDate =
                    dossier.directorProcessedAt ||
                    dossier.scientificOpinion?.decisionDate ||
                    dossier.scientificOpinion?.submittedAt ||
                    dossier.submittedAt;
                  const opinionDec = dossier.scientificOpinion?.decision;

                  return (
                    <tr key={dossier.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {dossier.referenceNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {dossier.student.lastName.toUpperCase()} {dossier.student.firstName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {dossier.student.cne}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-[180px]">
                        <div className="font-medium text-slate-800 truncate" title={dossier.student.degreeDeclared}>
                          {dossier.student.degreeDeclared}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-[240px]">
                        {mainTopic ? (
                          <div>
                            <div className="font-medium text-slate-900 line-clamp-1" title={mainTopic.topicTitle}>
                              {mainTopic.topicTitle}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">
                              {mainTopic.topicCode}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {new Date(dossier.submittedAt).toLocaleDateString('fr-FR')}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-800 font-semibold whitespace-nowrap">
                        {new Date(processedDate).toLocaleDateString('fr-FR')}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {docPresence.validatedRequired}/{docPresence.totalRequired} obligatoires conformes
                          </span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {opinionDec === 'favorable' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Favorable</span>
                            </span>
                          )}
                          {opinionDec === 'favorable_reserve' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Favorable sous réserve</span>
                            </span>
                          )}
                          {opinionDec === 'defavorable' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-100 text-red-900 border border-red-300">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Défavorable</span>
                            </span>
                          )}
                          {dossier.status === 'retenu' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                              <Award className="w-3 h-3" />
                              <span>CEDoc : Admis (ADMIS)</span>
                            </span>
                          )}
                          {dossier.status === 'non_conforme' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                              <XCircle className="w-3 h-3" />
                              <span>CEDoc : Non retenu (REJETE)</span>
                            </span>
                          )}
                          {dossier.status === 'convoque_entretien' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              <Calendar className="w-3 h-3" />
                              <span>CEDoc : Entretien oral</span>
                            </span>
                          )}
                          {dossier.status === 'transmis_cedoc' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                              <Send className="w-3 h-3" />
                              <span>CEDoc : En examen</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openDossierModal(dossier.id, canSuperviseAll ? 'cedoc' : 'opinion')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Consulter le dossier</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Global Operation Traceability Log */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              <span>Journal des opérations & traçabilité complète ({globalHistoryLogs.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Audit horodaté des vérifications documentaires, demandes de complément/remplacement et avis scientifiques émis.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Imputabilité GCD USMBA</span>
        </div>

        {globalHistoryLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
            Aucune opération enregistrée pour le moment.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {globalHistoryLogs.slice(0, 25).map((log) => (
              <div
                key={`${log.dossierId}-${log.id}`}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-indigo-700">{log.referenceNumber}</span>
                    <span className="font-semibold text-slate-900">{log.candidateName}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-bold text-slate-800">{log.action}</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Par <span className="font-semibold text-slate-800">{log.authorName}</span> ({log.authorRole}) — {log.details}
                  </div>
                </div>
                <span className="font-mono text-[11px] text-slate-500 shrink-0">
                  {new Date(log.timestamp).toLocaleString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Dossier Examination & Audit Detail Modal */}
      <DossierDetailModal
        dossier={selectedDossier}
        currentUser={currentUser}
        initialTab={modalInitialTab}
        onOpinionCompleted={(completedDossier, opinionDecision) => {
          const decLabel =
            opinionDecision === 'favorable'
              ? 'Avis Favorable'
              : opinionDecision === 'favorable_reserve'
              ? 'Avis Favorable sous réserve'
              : 'Avis Défavorable';
          setArchivedToast(
            `Dossier ${completedDossier.referenceNumber} (${completedDossier.student.firstName} ${completedDossier.student.lastName.toUpperCase()}) clôturé (${decLabel}) et déplacé vers « Dossiers déjà traités ».`
          );
        }}
        onCedocDecisionCompleted={(completedDossier, cedocStatus) => {
          const labels: Record<typeof cedocStatus, string> = {
            retenu: 'ADMIS (Retenu définitivement)',
            non_conforme: 'REJETÉ (Non retenu)',
            transmis_cedoc: 'EN_EXAMEN_CEDOC (En cours d’examen)',
            convoque_entretien: 'ENTRETIEN_A_PLANIFIER (Convoqué à l’entretien)'
          };
          setArchivedToast(
            `Décision finale CEDoc enregistrée pour ${completedDossier.referenceNumber} : ${labels[cedocStatus]}.`
          );
        }}
        onClose={() => setSelectedDossierId(null)}
      />
    </div>
  );
};
