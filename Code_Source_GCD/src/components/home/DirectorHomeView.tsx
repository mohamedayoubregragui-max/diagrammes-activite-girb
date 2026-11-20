import React, { useMemo, useState } from 'react';
import {
  ActivePage,
  ApplicationDossier,
  AuthenticatedUser
} from '../../types';
import {
  hasPrivilege,
  isDossierProcessedByDirector
} from '../../services/storage';
import {
  getDossierDocumentaryStatus
} from '../../services/documentService';
import { DossierDetailModal } from '../DossierDetailModal';
import {
  UserCheck,
  FileCheck2,
  CheckCircle2,
  Calendar,
  History,
  Archive,
  AlertTriangle,
  XCircle
} from 'lucide-react';

interface DirectorHomeViewProps {
  currentUser: AuthenticatedUser;
  dossiers: ApplicationDossier[];
  onNavigate: (page: ActivePage) => void;
}

export const DirectorHomeView: React.FC<DirectorHomeViewProps> = ({
  currentUser,
  dossiers,
  onNavigate
}) => {
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<
    'documents' | 'opinion' | 'cedoc' | 'history'
  >('opinion');
  const [archivedToast, setArchivedToast] = useState<string | null>(null);

  const canExamine = hasPrivilege(currentUser, 'examine_assigned_dossiers');

  // Strict scoping: director only receives officially submitted dossiers assigned to them
  const assignedDossiers = useMemo(() => {
    const lastNameLower = currentUser.lastName.toLowerCase();
    return [...dossiers]
      .filter((d) =>
        d.selectedTopics.some((t) => t.director.toLowerCase().includes(lastNameLower))
      )
      .sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
  }, [dossiers, currentUser]);

  const pendingAssigned = useMemo(
    () => assignedDossiers.filter((d) => !isDossierProcessedByDirector(d)),
    [assignedDossiers]
  );

  const treatedAssigned = useMemo(
    () =>
      assignedDossiers
        .filter((d) => isDossierProcessedByDirector(d))
        .sort((a, b) => {
          const da = new Date(
            a.directorProcessedAt || a.scientificOpinion?.submittedAt || a.submittedAt
          ).getTime();
          const db = new Date(
            b.directorProcessedAt || b.scientificOpinion?.submittedAt || b.submittedAt
          ).getTime();
          return db - da;
        }),
    [assignedDossiers]
  );

  const selectedDossier = useMemo(
    () => assignedDossiers.find((d) => d.id === selectedDossierId) || null,
    [assignedDossiers, selectedDossierId]
  );

  // Exact 5 Director KPIs requested
  const stats = useMemo(() => {
    const received = assignedDossiers.length;
    const pending = pendingAssigned.length;
    const examined = treatedAssigned.length;
    const favorable = treatedAssigned.filter(
      (d) =>
        d.scientificOpinion?.decision === 'favorable' ||
        d.scientificOpinion?.decision === 'favorable_reserve' ||
        d.status === 'avis_favorable' ||
        d.status === 'avis_favorable_reserve'
    ).length;
    const unfavorable = treatedAssigned.filter(
      (d) =>
        d.scientificOpinion?.decision === 'defavorable' ||
        d.status === 'avis_defavorable'
    ).length;

    return { received, pending, examined, favorable, unfavorable };
  }, [assignedDossiers, pendingAssigned, treatedAssigned]);

  // Recent decision history across director's dossiers
  const recentDecisions = useMemo(() => {
    return assignedDossiers
      .flatMap((d) =>
        (d.historyLogs || []).map((log) => ({
          ...log,
          dossierId: d.id,
          referenceNumber: d.referenceNumber,
          studentName: `${d.student.lastName.toUpperCase()} ${d.student.firstName}`
        }))
      )
      .sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 6);
  }, [assignedDossiers]);

  const openDossierAtTab = (
    dossierId: string,
    tab: 'documents' | 'opinion' | 'cedoc' | 'history' = 'opinion'
  ) => {
    setModalInitialTab(tab);
    setSelectedDossierId(dossierId);
  };

  return (
    <div className="space-y-6 pb-8">
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

      {/* Header & Exact 5 Director KPIs */}
      <section className="academic-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50/80 border border-blue-200/70 rounded-xl text-[#2563EB] text-xs font-semibold">
              <UserCheck className="w-4 h-4" />
              <span>Espace Directeur de Thèse · Candidatures affectées</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#101B35] tracking-tight">
              Bienvenue, {currentUser.firstName} {currentUser.lastName}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-sans">
              {currentUser.institution || 'USMBA Fès'} · {currentUser.titleOrDegree || 'Directeur de Thèse'} · Seules les candidatures déposées sur vos sujets vous sont présentées.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('acces_institutionnel')}
              className="flex items-center gap-2 px-4 py-2.5 academic-btn-primary text-xs font-bold rounded-xl cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Tableau complet des candidatures ({stats.received})</span>
            </button>
          </div>
        </div>

        {/* Exact 5 Director KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="academic-card-tinted p-4">
            <div className="text-[11px] font-semibold text-slate-500 font-sans">
              Nouvelles candidatures reçues
            </div>
            <div className="text-2xl font-extrabold font-mono text-[#101B35] mt-1">
              {stats.received}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-2xs">
            <div className="text-[11px] font-semibold text-amber-800 font-sans">
              Candidatures en attente
            </div>
            <div className="text-2xl font-extrabold font-mono text-amber-600 mt-1">
              {stats.pending}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 shadow-2xs">
            <div className="text-[11px] font-semibold text-[#2563EB] font-sans">
              Candidatures examinées
            </div>
            <div className="text-2xl font-extrabold font-mono text-[#2563EB] mt-1">
              {stats.examined}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 shadow-2xs">
            <div className="text-[11px] font-semibold text-[#0D9488] font-sans">
              Avis favorables
            </div>
            <div className="text-2xl font-extrabold font-mono text-[#0D9488] mt-1">
              {stats.favorable}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 shadow-2xs">
            <div className="text-[11px] font-semibold text-rose-800 font-sans">
              Avis défavorables
            </div>
            <div className="text-2xl font-extrabold font-mono text-rose-600 mt-1">
              {stats.unfavorable}
            </div>
          </div>
        </div>
      </section>

      {/* Pending Applications Assigned to Director (Single clear CTA per row) */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Candidatures en attente d’examen ({pendingAssigned.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Consultez la candidature, évaluez les sujets choisis et transmettez votre avis scientifique directement au Directeur CEDoc.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('acces_institutionnel')}
            className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer shrink-0"
          >
            Voir le tableau détaillé →
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {pendingAssigned.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              Toutes vos candidatures affectées ont été examinées et transmises au CEDoc.
            </div>
          ) : (
            pendingAssigned.map((dossier) => {
              const sortedTopics = [...dossier.selectedTopics].sort(
                (a, b) => a.priority - b.priority
              );
              const topic = sortedTopics[0];
              const extraTopicsCount = Math.max(0, sortedTopics.length - 1);
              const docStatus = getDossierDocumentaryStatus(dossier, false);

              return (
                <div
                  key={dossier.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-indigo-700">
                        {dossier.referenceNumber}
                      </span>
                      <span className="font-bold text-sm text-slate-900">
                        {dossier.student.lastName.toUpperCase()} {dossier.student.firstName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${docStatus.badgeClass}`}
                      >
                        {docStatus.label}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-semibold text-slate-800">
                        {dossier.student.degreeDeclared}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="truncate">
                        {topic
                          ? `${topic.topicCode} — ${topic.topicTitle}`
                          : 'Sujet doctoral'}
                      </span>
                      {extraTopicsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[10px]">
                          +{extraTopicsCount} autre(s) choix
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-3 flex-wrap">
                      <span>
                        Soumis le {new Date(dossier.submittedAt).toLocaleDateString('fr-FR')}
                      </span>
                      <span>·</span>
                      <span>
                        Pièces PDF : {docStatus.depositedCount} / {docStatus.requiredCount}
                      </span>
                    </div>
                  </div>

                  {canExamine && (
                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => openDossierAtTab(dossier.id, 'opinion')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-colors"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Examiner la candidature</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Dossiers déjà examinés & transmis au CEDoc */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Archive className="w-4 h-4 text-emerald-600" />
              <span>Candidatures examinées & transmises au CEDoc ({treatedAssigned.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dossiers comportant votre avis scientifique et suivis par le Directeur du CEDoc.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('acces_institutionnel')}
            className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer shrink-0"
          >
            Filtrer l’archive complète →
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {treatedAssigned.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Aucune candidature examinée pour le moment.
            </div>
          ) : (
            treatedAssigned.map((dossier) => {
              const topic = dossier.selectedTopics[0];
              const opinionDec = dossier.scientificOpinion?.decision;
              const processedAt =
                dossier.directorProcessedAt ||
                dossier.scientificOpinion?.decisionDate ||
                dossier.scientificOpinion?.submittedAt ||
                dossier.submittedAt;

              return (
                <div
                  key={dossier.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-indigo-700">
                        {dossier.referenceNumber}
                      </span>
                      <span className="font-bold text-sm text-slate-900">
                        {dossier.student.lastName.toUpperCase()} {dossier.student.firstName}
                      </span>
                      {opinionDec === 'favorable' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Avis Favorable</span>
                        </span>
                      )}
                      {opinionDec === 'favorable_reserve' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Favorable sous réserve</span>
                        </span>
                      )}
                      {opinionDec === 'defavorable' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">
                          <XCircle className="w-3 h-3" />
                          <span>Avis Défavorable</span>
                        </span>
                      )}
                      {dossier.status === 'retenu' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white">
                          CEDoc : Admis
                        </span>
                      )}
                      {dossier.status === 'non_conforme' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 text-white">
                          CEDoc : Rejeté
                        </span>
                      )}
                      {dossier.status === 'convoque_entretien' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                          CEDoc : Entretien oral
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-700 font-medium truncate">
                      {topic ? `${topic.topicCode} — ${topic.topicTitle}` : 'Sujet doctoral'}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-3 flex-wrap">
                      <span>{dossier.student.degreeDeclared}</span>
                      <span>·</span>
                      <span>Examiné le {new Date(processedAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => openDossierAtTab(dossier.id, 'opinion')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Examiner la candidature</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Interviews Follow-up & Recent Decisions History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span>Entretiens programmés</span>
            </h2>
          </div>

          <div className="space-y-2.5">
            {assignedDossiers.filter(
              (d) =>
                d.verificationAudit?.interviewDate || d.status === 'convoque_entretien'
            ).length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                Aucun entretien planifié pour le moment.
              </div>
            ) : (
              assignedDossiers
                .filter(
                  (d) =>
                    d.verificationAudit?.interviewDate || d.status === 'convoque_entretien'
                )
                .map((d) => (
                  <div
                    key={d.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900">
                        {d.student.lastName.toUpperCase()} {d.student.firstName} ·{' '}
                        <span className="font-mono text-indigo-700">{d.referenceNumber}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {d.verificationAudit?.interviewDate
                          ? `${new Date(
                              d.verificationAudit.interviewDate
                            ).toLocaleString('fr-FR')} (${
                              d.verificationAudit.interviewRoom || 'CEDoc'
                            })`
                          : 'Entretien à planifier par le CEDoc'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openDossierAtTab(d.id, 'history')}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-700 cursor-pointer shrink-0"
                    >
                      Détails
                    </button>
                  </div>
                ))
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              <span>Historique Récent ({recentDecisions.length})</span>
            </h2>
          </div>

          <div className="space-y-2.5">
            {recentDecisions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                Aucune décision enregistrée sur vos dossiers.
              </div>
            ) : (
              recentDecisions.map((log) => (
                <div
                  key={`${log.dossierId}-${log.id}`}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{log.action}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      {log.studentName} ({log.referenceNumber}) · {log.authorName}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">
                    {new Date(log.timestamp).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Inline Dossier Examination Modal */}
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
            `Avis enregistré (${decLabel}) pour ${completedDossier.referenceNumber} et transmis au Directeur CEDoc.`
          );
        }}
        onClose={() => setSelectedDossierId(null)}
      />
    </div>
  );
};
