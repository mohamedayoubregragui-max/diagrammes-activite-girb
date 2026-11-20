import React, { useMemo, useState, useEffect } from 'react';
import {
  ActivePage,
  ApplicationDossier,
  AuthenticatedUser
} from '../../types';
import {
  getPlatformCampaigns,
  getPublishedResults,
  publishCedocResults,
  PublishedResultEntry
} from '../../services/platformService';
import { canPassToCedocFinalDecision } from '../../services/storage';
import { DossierDetailModal } from '../DossierDetailModal';
import {
  ShieldCheck,
  FileCheck2,
  Calendar,
  BarChart3,
  Megaphone,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Users,
  Send
} from 'lucide-react';

interface CedocHomeViewProps {
  currentUser: AuthenticatedUser;
  dossiers: ApplicationDossier[];
  onNavigate: (page: ActivePage) => void;
}

export const CedocHomeView: React.FC<CedocHomeViewProps> = ({
  currentUser,
  dossiers,
  onNavigate
}) => {
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<
    'documents' | 'opinion' | 'cedoc' | 'history'
  >('cedoc');
  const [activePanel, setActivePanel] = useState<
    'overview' | 'calendar' | 'statistics' | 'results'
  >('overview');
  const [cedocRubricFilter, setCedocRubricFilter] = useState<
    'all' | 'ready' | 'in_review_interview' | 'admis' | 'rejete' | 'waiting_director'
  >('all');
  const [publishedResults, setPublishedResults] = useState<PublishedResultEntry[]>(() =>
    getPublishedResults()
  );
  const [publishFeedback, setPublishFeedback] = useState<string | null>(null);

  useEffect(() => {
    const syncPlatform = () => setPublishedResults(getPublishedResults());
    window.addEventListener('gcd_platform_updated', syncPlatform);
    return () => window.removeEventListener('gcd_platform_updated', syncPlatform);
  }, []);

  const selectedDossier = useMemo(
    () => dossiers.find((d) => d.id === selectedDossierId) || null,
    [dossiers, selectedDossierId]
  );

  // Exact 5 CEDoc Supervision KPIs requested
  const stats = useMemo(() => {
    const total = dossiers.length;
    const receivedFromDirectors = dossiers.filter(
      (d) => canPassToCedocFinalDecision(d).allowed
    ).length;
    const pendingDossiers = dossiers.filter(
      (d) =>
        !canPassToCedocFinalDecision(d).allowed ||
        (d.status !== 'retenu' && d.status !== 'non_conforme')
    ).length;
    const waitingDirector = dossiers.filter(
      (d) => !canPassToCedocFinalDecision(d).allowed
    ).length;
    const awaitingFinalDecision = dossiers.filter(
      (d) =>
        canPassToCedocFinalDecision(d).allowed &&
        d.status !== 'retenu' &&
        d.status !== 'non_conforme'
    ).length;
    const favorableOpinions = dossiers.filter(
      (d) =>
        d.scientificOpinion?.decision === 'favorable' ||
        d.scientificOpinion?.decision === 'favorable_reserve'
    ).length;
    const unfavorableOpinions = dossiers.filter(
      (d) => d.scientificOpinion?.decision === 'defavorable'
    ).length;
    const finalDecisions = dossiers.filter(
      (d) =>
        d.status === 'retenu' ||
        d.status === 'convoque_entretien' ||
        (d.status === 'non_conforme' && canPassToCedocFinalDecision(d).allowed)
    ).length;
    const admittedCount = dossiers.filter((d) => d.status === 'retenu').length;
    const rejectedCount = dossiers.filter(
      (d) => d.status === 'non_conforme' && canPassToCedocFinalDecision(d).allowed
    ).length;

    return {
      total,
      receivedFromDirectors,
      pendingDossiers,
      waitingDirector,
      awaitingFinalDecision,
      favorableOpinions,
      unfavorableOpinions,
      finalDecisions,
      admittedCount,
      rejectedCount
    };
  }, [dossiers]);

  const campaigns = useMemo(() => getPlatformCampaigns(), []);

  // Breakdown by laboratory from real dossiers
  const labBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    dossiers.forEach((d) => {
      const lab = d.selectedTopics[0]?.laboratory || 'Autre laboratoire';
      counts.set(lab, (counts.get(lab) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [dossiers]);

  const scheduledInterviews = useMemo(
    () =>
      dossiers.filter(
        (d) => Boolean(d.verificationAudit?.interviewDate) || d.status === 'convoque_entretien'
      ),
    [dossiers]
  );

  const openDossierAt = (
    dossierId: string,
    tab: 'documents' | 'opinion' | 'cedoc' | 'history'
  ) => {
    setModalInitialTab(tab);
    setSelectedDossierId(dossierId);
  };

  const handlePublishResults = () => {
    const entries = publishCedocResults(dossiers, currentUser);
    setPublishedResults(entries);
    setActivePanel('results');
    setPublishFeedback(
      entries.length > 0
        ? `${entries.length} résultat(s) officiel(s) publié(s) et notifié(s) aux candidats.`
        : 'Aucun dossier avec décision finale (Admis / Convoqué / Rejeté) à publier pour le moment.'
    );
    setTimeout(() => setPublishFeedback(null), 5000);
  };

  const filteredOverviewDossiers = useMemo(() => {
    return dossiers.filter((d) => {
      const ready = canPassToCedocFinalDecision(d).allowed;
      if (cedocRubricFilter === 'ready') {
        return ready && d.status !== 'retenu' && d.status !== 'non_conforme';
      }
      if (cedocRubricFilter === 'in_review_interview') {
        return ready && (d.status === 'transmis_cedoc' || d.status === 'convoque_entretien');
      }
      if (cedocRubricFilter === 'admis') {
        return d.status === 'retenu';
      }
      if (cedocRubricFilter === 'rejete') {
        return d.status === 'non_conforme' && ready;
      }
      if (cedocRubricFilter === 'waiting_director') {
        return !ready;
      }
      return true;
    });
  }, [dossiers, cedocRubricFilter]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header Supervision Card */}
      <section className="academic-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50/80 border border-indigo-200/70 rounded-xl text-[#4338CA] text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Espace Directeur CEDoc · Supervision & Décisions Finales</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#101B35] tracking-tight">
              Bienvenue, {currentUser.firstName} {currentUser.lastName}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-sans">
              {currentUser.institution || 'CEDoc Sciences & Technologies'} · Consultez les avis scientifiques transmis par les directeurs de thèse et prononcez la décision finale.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('acces_institutionnel')}
              className="flex items-center gap-2 px-4 py-2.5 academic-btn-primary text-xs font-bold rounded-xl cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Tableau de supervision ({stats.total})</span>
            </button>

            <button
              type="button"
              onClick={handlePublishResults}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Megaphone className="w-4 h-4" />
              <span>Publier les résultats</span>
            </button>
          </div>
        </div>

        {publishFeedback && (
          <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0" />
            <span>{publishFeedback}</span>
          </div>
        )}

        {/* Exact 5 CEDoc Supervision KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="academic-card-tinted p-4">
            <div className="text-[11px] font-semibold text-slate-500 font-sans">
              Candidatures reçues des directeurs
            </div>
            <div className="text-2xl font-extrabold font-mono text-[#101B35] mt-1">
              {stats.receivedFromDirectors}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-2xs">
            <div className="text-[11px] font-semibold text-amber-800 font-sans">
              Dossiers en attente
            </div>
            <div className="text-2xl font-extrabold font-mono text-amber-600 mt-1">
              {stats.pendingDossiers}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 shadow-2xs">
            <div className="text-[11px] font-semibold text-[#0D9488] font-sans">
              Avis favorables
            </div>
            <div className="text-2xl font-extrabold font-mono text-[#0D9488] mt-1">
              {stats.favorableOpinions}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 shadow-2xs">
            <div className="text-[11px] font-semibold text-rose-800 font-sans">
              Avis défavorables
            </div>
            <div className="text-2xl font-extrabold font-mono text-rose-600 mt-1">
              {stats.unfavorableOpinions}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#4338CA] to-[#101B35] text-white border border-indigo-700/50 shadow-xs">
            <div className="text-[11px] font-semibold text-indigo-100 font-sans">
              Décisions finales
            </div>
            <div className="text-2xl font-extrabold font-mono text-white mt-1">
              {stats.finalDecisions}
            </div>
          </div>
        </div>
      </section>

      {/* Main CEDoc Action Tabs / Cards */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            Supervision & Arbitrage CEDoc
          </h2>
          <div className="flex items-center gap-1.5 flex-wrap text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActivePanel('overview')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                activePanel === 'overview'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Dossiers & Décisions
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('calendar')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                activePanel === 'calendar'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Calendrier & Entretiens
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('statistics')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                activePanel === 'statistics'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Statistiques par laboratoire
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('results')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                activePanel === 'results'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Résultats publiés ({publishedResults.length})
            </button>
          </div>
        </div>

        {/* Panel 1: Supervision & Director Decisions */}
        {activePanel === 'overview' && (
          <div className="space-y-4">
            {/* CEDoc Rubric Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs font-semibold">
              {[
                { id: 'all', label: `Tous (${dossiers.length})` },
                { id: 'ready', label: `À statuer CEDoc (${stats.awaitingFinalDecision})` },
                {
                  id: 'in_review_interview',
                  label: `Entretien / En examen (${dossiers.filter((d) => canPassToCedocFinalDecision(d).allowed && (d.status === 'transmis_cedoc' || d.status === 'convoque_entretien')).length})`
                },
                { id: 'admis', label: `Admis (${stats.admittedCount})` },
                { id: 'rejete', label: `Rejetés (${stats.rejectedCount})` },
                { id: 'waiting_director', label: `Attente Directeur (${stats.waitingDirector})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCedocRubricFilter(tab.id as typeof cedocRubricFilter)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    cedocRubricFilter === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {filteredOverviewDossiers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Aucune candidature dans cette rubrique.
              </div>
            ) : (
              filteredOverviewDossiers.map((dossier) => {
                const sortedTopics = [...dossier.selectedTopics].sort(
                  (a, b) => a.priority - b.priority
                );
                const topic = sortedTopics[0];
                const extraTopics = Math.max(0, sortedTopics.length - 1);
                const opinion = dossier.scientificOpinion;
                const cedocGate = canPassToCedocFinalDecision(dossier);

                return (
                  <div
                    key={dossier.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] font-bold text-indigo-700">
                          {dossier.referenceNumber}
                        </span>
                        <span className="font-bold text-sm text-slate-900">
                          {dossier.student.lastName.toUpperCase()} {dossier.student.firstName}
                        </span>
                        {opinion ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              opinion.decision === 'favorable'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : opinion.decision === 'favorable_reserve'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-red-50 text-red-800 border-red-200'
                            }`}
                          >
                            Avis Dir. :{' '}
                            {opinion.decision === 'favorable'
                              ? 'Favorable'
                              : opinion.decision === 'favorable_reserve'
                              ? 'Sous réserve'
                              : 'Défavorable'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            En attente d’avis directeur
                          </span>
                        )}
                        {dossier.cedocDecision && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              dossier.cedocDecision.decisionCode === 'ADMIS'
                                ? 'bg-emerald-600 text-white border-emerald-700'
                                : dossier.cedocDecision.decisionCode === 'REJETE'
                                ? 'bg-red-600 text-white border-red-700'
                                : dossier.cedocDecision.decisionCode === 'ENTRETIEN_A_PLANIFIER'
                                ? 'bg-purple-100 text-purple-900 border-purple-200'
                                : 'bg-indigo-100 text-indigo-900 border-indigo-200'
                            }`}
                          >
                            CEDoc : {dossier.cedocDecision.decisionLabel}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-700 flex items-center gap-2 flex-wrap">
                        <span className="truncate">
                          {topic
                            ? `${topic.topicCode} · ${topic.topicTitle} (${topic.director})`
                            : 'Sujet non spécifié'}
                        </span>
                        {extraTopics > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[10px]">
                            +{extraTopics} autre(s) choix
                          </span>
                        )}
                      </div>

                      {dossier.cedocDecision?.observation ? (
                        <div className="text-[11px] text-indigo-900 italic line-clamp-1">
                          Décision CEDoc : « {dossier.cedocDecision.observation} »
                        </div>
                      ) : opinion?.comment ? (
                        <div className="text-[11px] text-slate-600 italic line-clamp-1">
                          Observation Directeur : « {opinion.comment} »
                        </div>
                      ) : null}
                    </div>

                    {/* Single clean action button per row */}
                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          openDossierAt(dossier.id, cedocGate.allowed ? 'cedoc' : 'opinion')
                        }
                        className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors ${
                          cedocGate.allowed
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>
                          {cedocGate.allowed
                            ? 'Examiner & Décision CEDoc'
                            : 'Examiner la candidature'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Panel 2: Calendar & Interviews */}
        {activePanel === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Campagnes & Échéances CEDoc</span>
              </div>
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{c.title}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                      {c.status}
                    </span>
                  </div>
                  <div className="text-slate-600 font-mono text-[11px]">
                    Du {c.startDate} au {c.endDate} · {c.academicYear}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Entretiens programmés ({scheduledInterviews.length})</span>
              </div>
              {scheduledInterviews.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  Aucun entretien programmé pour le moment.
                </div>
              ) : (
                scheduledInterviews.map((d) => (
                  <div
                    key={d.id}
                    className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        {d.student.lastName.toUpperCase()} {d.student.firstName} ({d.referenceNumber})
                      </div>
                      <div className="text-[11px] text-purple-900">
                        {d.verificationAudit?.interviewDate
                          ? new Date(d.verificationAudit.interviewDate).toLocaleString('fr-FR')
                          : 'À fixer'}{' '}
                        · {d.verificationAudit?.interviewRoom || 'CEDoc'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openDossierAt(d.id, 'cedoc')}
                      className="px-2.5 py-1 bg-white border border-purple-200 rounded-lg text-[11px] font-semibold text-purple-800 cursor-pointer"
                    >
                      Gérer
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Panel 3: Real Statistics Breakdown */}
        {activePanel === 'statistics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Répartition réelle par Laboratoire de Recherche</span>
              </div>
              {labBreakdown.length === 0 ? (
                <div className="text-xs text-slate-400">Aucune donnée disponible.</div>
              ) : (
                <div className="space-y-2">
                  {labBreakdown.map(([lab, count]) => (
                    <div key={lab} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700 truncate pr-2">{lab}</span>
                        <span className="font-mono font-bold text-slate-900">{count}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{
                            width: `${stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 text-xs">
              <div className="text-xs font-bold text-slate-900">
                Synthèse du Traitement Commission CEDoc
              </div>
              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> En attente d’avis directeur
                  </span>
                  <span className="font-mono font-bold">{stats.waitingDirector}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-indigo-600" /> Prêts pour décision CEDoc
                  </span>
                  <span className="font-mono font-bold">{stats.awaitingFinalDecision}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Admis
                  </span>
                  <span className="font-mono font-bold text-emerald-700">{stats.admittedCount}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-red-600" /> Rejetés
                  </span>
                  <span className="font-mono font-bold text-red-700">{stats.rejectedCount}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel 4: Published Official Results */}
        {activePanel === 'results' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-600">
                Liste des décisions officielles publiées sur le portail candidat.
              </div>
              <button
                type="button"
                onClick={handlePublishResults}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Mettre à jour & Publier maintenant
              </button>
            </div>

            {publishedResults.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                Aucun résultat officiel publié pour l’instant. Cliquez sur « Publier les résultats » après validation finale d’au moins un dossier.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                {publishedResults.map((res) => (
                  <div
                    key={res.dossierId}
                    className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        {res.candidateName} ·{' '}
                        <span className="font-mono text-indigo-700">{res.referenceNumber}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {res.topicCode} — {res.topicTitle}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          res.status === 'retenu'
                            ? 'bg-emerald-100 text-emerald-800'
                            : res.status === 'convoque_entretien'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {res.decisionLabel}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(res.publishedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Inline Dossier Examination & CEDoc Final Decision Modal */}
      <DossierDetailModal
        dossier={selectedDossier}
        currentUser={currentUser}
        initialTab={modalInitialTab}
        onCedocDecisionCompleted={(updated, newStatus) => {
          const labels: Record<typeof newStatus, string> = {
            retenu: 'ADMIS (Retenu définitivement)',
            non_conforme: 'REJETÉ (Non retenu)',
            transmis_cedoc: 'EN_EXAMEN_CEDOC (En cours d’examen)',
            convoque_entretien: 'ENTRETIEN_A_PLANIFIER (Convoqué à l’entretien)'
          };
          setPublishFeedback(
            `Décision CEDoc enregistrée pour ${updated.referenceNumber} (${updated.student.firstName} ${updated.student.lastName.toUpperCase()}) : ${labels[newStatus]}.`
          );
          setTimeout(() => setPublishFeedback(null), 5000);
        }}
        onClose={() => setSelectedDossierId(null)}
      />
    </div>
  );
};
