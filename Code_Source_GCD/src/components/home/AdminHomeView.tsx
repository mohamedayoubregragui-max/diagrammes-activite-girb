import React, { useMemo, useState, useEffect } from 'react';
import {
  ActivePage,
  ApplicationDossier,
  AuthenticatedUser,
  ThesisTopic
} from '../../types';
import {
  getRegisteredUsers,
  hasAnyRole,
  hasPrivilege,
  resetDemoData
} from '../../services/storage';
import {
  ALLOWED_MAX_PDF_SIZES_MB,
  getMaxPdfSizeMb,
  setMaxPdfSizeMb
} from '../../services/documentService';
import {
  areSubmissionsOpen,
  DoctoralCampaign,
  DoctoralFormation,
  getAllPlatformActivities,
  getDoctoralFormations,
  getPlatformCampaigns,
  getPlatformTopics,
  getResearchStructures,
  ResearchStructure,
  saveDoctoralFormations,
  savePlatformCampaigns,
  savePlatformTopics,
  saveResearchStructures,
  setSubmissionsOpen
} from '../../services/platformService';
import { UserManagementModal } from '../UserManagementModal';
import {
  Building2,
  Users,
  UserCog,
  Calendar,
  BookOpen,
  GraduationCap,
  SlidersHorizontal,
  Activity,
  RotateCcw,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Microscope
} from 'lucide-react';

interface AdminHomeViewProps {
  currentUser: AuthenticatedUser;
  dossiers: ApplicationDossier[];
  onNavigate: (page: ActivePage) => void;
}

type AdminSection =
  | 'overview'
  | 'campaigns'
  | 'formations'
  | 'topics'
  | 'structures'
  | 'settings'
  | 'logs';

export const AdminHomeView: React.FC<AdminHomeViewProps> = ({
  currentUser,
  dossiers,
  onNavigate
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const [users, setUsers] = useState<AuthenticatedUser[]>(() => getRegisteredUsers());
  const [campaigns, setCampaigns] = useState<DoctoralCampaign[]>(() => getPlatformCampaigns());
  const [formations, setFormations] = useState<DoctoralFormation[]>(() =>
    getDoctoralFormations()
  );
  const [structures, setStructures] = useState<ResearchStructure[]>(() =>
    getResearchStructures()
  );
  const [topics, setTopics] = useState<ThesisTopic[]>(() => getPlatformTopics());
  const [maxPdfMb, setMaxPdfMbState] = useState<number>(() => getMaxPdfSizeMb());
  const [submissionsOpen, setSubmissionsOpenState] = useState<boolean>(() =>
    areSubmissionsOpen()
  );

  // Quick add states
  const [newCampaignTitle, setNewCampaignTitle] = useState('');
  const [newCampaignEnd, setNewCampaignEnd] = useState('2026-12-20');
  const [newFormationTitle, setNewFormationTitle] = useState('');
  const [newStructureName, setNewStructureName] = useState('');
  const [newStructureCode, setNewStructureCode] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDirector, setNewTopicDirector] = useState('Pr. Youssef El Amrani');
  const [actionToast, setActionToast] = useState<string | null>(null);

  const canManageUsers = hasPrivilege(currentUser, 'manage_users');
  const canManageSettings = hasPrivilege(currentUser, 'manage_platform_settings');

  const refreshData = () => {
    setUsers(getRegisteredUsers());
    setCampaigns(getPlatformCampaigns());
    setFormations(getDoctoralFormations());
    setStructures(getResearchStructures());
    setTopics(getPlatformTopics());
    setMaxPdfMbState(getMaxPdfSizeMb());
    setSubmissionsOpenState(areSubmissionsOpen());
  };

  useEffect(() => {
    window.addEventListener('gcd_platform_updated', refreshData);
    window.addEventListener('gcd_settings_updated', refreshData);
    window.addEventListener('gcd_user_updated', refreshData);
    return () => {
      window.removeEventListener('gcd_platform_updated', refreshData);
      window.removeEventListener('gcd_settings_updated', refreshData);
      window.removeEventListener('gcd_user_updated', refreshData);
    };
  }, []);

  const notify = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 3500);
  };

  const activities = useMemo(() => getAllPlatformActivities(dossiers), [dossiers]);

  // Real counts from registered users & platform entities
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const candidatesCount = users.filter((u) => hasAnyRole(u, ['candidat'])).length;
    const directorsCount = users.filter((u) =>
      hasAnyRole(u, ['directeur', 'directeur_structure', 'co_encadrant'])
    ).length;

    return {
      totalUsers,
      candidatesCount,
      directorsCount,
      campaignsCount: campaigns.length,
      topicsCount: topics.length,
      dossiersCount: dossiers.length,
      activitiesCount: activities.length
    };
  }, [users, campaigns, topics, dossiers, activities]);

  const handleToggleCampaignStatus = (id: string) => {
    const updated = campaigns.map((c) =>
      c.id === id
        ? {
            ...c,
            status: c.status === 'ouverte' ? ('cloturee' as const) : ('ouverte' as const)
          }
        : c
    );
    setCampaigns(updated);
    savePlatformCampaigns(updated, currentUser, 'Modification statut campagne doctorale');
    notify('Statut de la campagne mis à jour.');
  };

  const handleAddCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignTitle.trim()) return;
    const created: DoctoralCampaign = {
      id: `camp-${Date.now()}`,
      code: `CAMP-USMBA-${campaigns.length + 1}`,
      title: newCampaignTitle.trim(),
      academicYear: '2026/2027',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: newCampaignEnd,
      status: 'ouverte',
      maxChoicesPerCandidate: 3,
      description: 'Nouvelle session de candidature doctorale créée par l’administrateur.'
    };
    const updated = [created, ...campaigns];
    setCampaigns(updated);
    savePlatformCampaigns(updated, currentUser, `Création campagne : ${created.title}`);
    setNewCampaignTitle('');
    notify('Campagne doctorale ajoutée.');
  };

  const handleAddFormation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormationTitle.trim()) return;
    const created: DoctoralFormation = {
      id: `fd-${Date.now()}`,
      code: `FD-USMBA-${formations.length + 1}`,
      title: newFormationTitle.trim(),
      cedoc: 'CEDoc Sciences & Technologies',
      institution: 'USMBA Fès',
      coordinator: 'Direction CEDoc',
      accredited: true
    };
    const updated = [created, ...formations];
    setFormations(updated);
    saveDoctoralFormations(updated, currentUser, `Ajout formation doctorale : ${created.title}`);
    setNewFormationTitle('');
    notify('Formation doctorale enregistrée.');
  };

  const handleAddStructure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStructureName.trim() || !newStructureCode.trim()) return;
    const created: ResearchStructure = {
      id: `str-${Date.now()}`,
      code: newStructureCode.trim().toUpperCase(),
      name: newStructureName.trim(),
      type: 'Laboratoire',
      institution: 'USMBA Fès',
      directorName: 'À désigner',
      domain: 'Sciences & Technologies'
    };
    const updated = [created, ...structures];
    setStructures(updated);
    saveResearchStructures(
      updated,
      currentUser,
      `Ajout structure de recherche : ${created.code}`
    );
    setNewStructureName('');
    setNewStructureCode('');
    notify('Structure de recherche ajoutée.');
  };

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    const created: ThesisTopic = {
      id: `top-${Date.now()}`,
      code: `DOC-2026-NEW${topics.length + 1}`,
      title: newTopicTitle.trim(),
      domain: 'Intelligence Artificielle & Données',
      director: newTopicDirector.trim() || 'Pr. Youssef El Amrani',
      directorTitle: 'Professeur de l’Enseignement Supérieur',
      laboratory: structures[0]?.name || 'Laboratoire LISS',
      institution: 'USMBA Fès',
      abstract: 'Sujet doctoral publié via l’interface d’administration GCD.',
      prerequisites: ['Master ou Diplôme d’Ingénieur dans la spécialité'],
      keywords: ['Doctorat', 'USMBA', 'Recherche'],
      deadline: '2026-12-15',
      funding: 'Financement CEDoc / CNRST',
      availableSpots: 1
    };
    const updated = [created, ...topics];
    setTopics(updated);
    savePlatformTopics(updated, currentUser, `Ajout sujet doctoral : ${created.code}`);
    setNewTopicTitle('');
    notify('Sujet doctoral publié et synchronisé avec le catalogue.');
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <section className="academic-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#101B35] text-white rounded-xl text-xs font-semibold shadow-2xs">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Espace Administrateur · Gouvernance Globale de la Plateforme GCD</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#101B35] tracking-tight">
              Bienvenue, {currentUser.firstName} {currentUser.lastName}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-sans">
              {currentUser.institution || 'Présidence USMBA — Pôle Études Doctorales'} · Pilotez les utilisateurs, rôles multiples, campagnes, formations, sujets, structures et paramètres globaux.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              disabled={!canManageUsers}
              onClick={() => setIsUserModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 academic-btn-primary disabled:bg-slate-300 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              <UserCog className="w-4 h-4" />
              <span>Utilisateurs & Rôles</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('acces_institutionnel')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#101B35] hover:bg-[#172B4D] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Superviser les dossiers ({stats.dossiersCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('logs')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-[#172B4D] border border-slate-300/80 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <Activity className="w-4 h-4 text-[#4338CA]" />
              <span>Journal des activités</span>
            </button>
          </div>
        </div>

        {actionToast && (
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0" />
            <span>{actionToast}</span>
          </div>
        )}

        {/* 7 Real Platform Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="academic-card-tinted p-3.5">
            <div className="text-[11px] font-semibold text-slate-500 font-sans">Utilisateurs</div>
            <div className="text-2xl font-extrabold font-mono text-[#101B35] mt-1">
              {stats.totalUsers}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 shadow-2xs">
            <div className="text-[11px] font-semibold text-[#2563EB] font-sans">Candidats</div>
            <div className="text-2xl font-extrabold font-mono text-[#2563EB] mt-1">
              {stats.candidatesCount}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-200/80 shadow-2xs">
            <div className="text-[11px] font-semibold text-[#0D9488] font-sans">Directeurs</div>
            <div className="text-2xl font-extrabold font-mono text-[#0D9488] mt-1">
              {stats.directorsCount}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 shadow-2xs">
            <div className="text-[11px] font-semibold text-[#4338CA] font-sans">Campagnes</div>
            <div className="text-2xl font-extrabold font-mono text-[#4338CA] mt-1">
              {stats.campaignsCount}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200/80 shadow-2xs">
            <div className="text-[11px] font-semibold text-purple-700 font-sans">Sujets</div>
            <div className="text-2xl font-extrabold font-mono text-purple-700 mt-1">
              {stats.topicsCount}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-2xs">
            <div className="text-[11px] font-semibold text-amber-800 font-sans">Candidatures</div>
            <div className="text-2xl font-extrabold font-mono text-amber-700 mt-1">
              {stats.dossiersCount}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#101B35] text-white border border-[#172B4D] shadow-xs">
            <div className="text-[11px] font-semibold text-slate-300 font-sans">Activités</div>
            <div className="text-2xl font-extrabold font-mono text-white mt-1">
              {stats.activitiesCount}
            </div>
          </div>
        </div>
      </section>

      {/* 8 Admin Action Tiles */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <button
          type="button"
          onClick={() => setIsUserModalOpen(true)}
          className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 text-left transition-all cursor-pointer shadow-xs space-y-1"
        >
          <div className="flex items-center justify-between font-bold text-slate-900">
            <span>Gestion des utilisateurs</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-[11px] text-slate-500">
            Consulter, activer ou désactiver les comptes enregistrés ({stats.totalUsers}).
          </p>
        </button>

        <button
          type="button"
          onClick={() => setIsUserModalOpen(true)}
          className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-200 text-left transition-all cursor-pointer shadow-xs space-y-1"
        >
          <div className="flex items-center justify-between font-bold text-slate-900">
            <span>Rôles & privilèges</span>
            <UserCog className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-[11px] text-slate-500">
            Attribuer les 7 rôles GCD (Enseignant, Co-encadrant, Dir. Structure, etc.).
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('campaigns')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs space-y-1 ${
            activeSection === 'campaigns'
              ? 'bg-indigo-50 border-indigo-300'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-slate-900">
            <span>Gestion des campagnes</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-[11px] text-slate-500">
            Ouvrir, clôturer ou créer des campagnes doctorales ({campaigns.length}).
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('formations')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs space-y-1 ${
            activeSection === 'formations'
              ? 'bg-indigo-50 border-indigo-300'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-slate-900">
            <span>Formations doctorales</span>
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-[11px] text-slate-500">
            Administrer les filières accréditées CEDoc ({formations.length}).
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('topics')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs space-y-1 ${
            activeSection === 'topics'
              ? 'bg-indigo-50 border-indigo-300'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-slate-900">
            <span>Gestion des sujets</span>
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-[11px] text-slate-500">
            Publier et synchroniser le catalogue de thèses ({topics.length}).
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('structures')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs space-y-1 ${
            activeSection === 'structures'
              ? 'bg-indigo-50 border-indigo-300'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-slate-900">
            <span>Structures de recherche</span>
            <Microscope className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-[11px] text-slate-500">
            Gérer les laboratoires et équipes rattachées ({structures.length}).
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('settings')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs space-y-1 ${
            activeSection === 'settings'
              ? 'bg-indigo-50 border-indigo-300'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-slate-900">
            <span>Gestion des paramètres</span>
            <SlidersHorizontal className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-[11px] text-slate-500">
            Taille max PDF ({maxPdfMb} Mo), ouverture des dépôts & réinitialisation.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('logs')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs space-y-1 ${
            activeSection === 'logs'
              ? 'bg-indigo-50 border-indigo-300'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-slate-900">
            <span>Journal des activités</span>
            <Activity className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-[11px] text-slate-500">
            Consulter la piste d’audit complète ({activities.length} événements).
          </p>
        </button>
      </section>

      {/* Dynamic Management Panel */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        {activeSection === 'overview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <span>Activités Récentes de la Plateforme ({activities.length})</span>
              </h2>
              <button
                type="button"
                onClick={() => setActiveSection('logs')}
                className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
              >
                Voir tout le journal →
              </button>
            </div>
            <div className="space-y-2">
              {activities.slice(0, 6).map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {act.action}{' '}
                      {act.referenceNumber && (
                        <span className="font-mono text-indigo-700">({act.referenceNumber})</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {act.actorName} ({act.actorRole}) · {act.details}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">
                    {new Date(act.timestamp).toLocaleString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'campaigns' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Gestion des Campagnes Doctorales
            </h2>
            <form onSubmit={handleAddCampaign} className="flex flex-col sm:flex-row gap-2 text-xs">
              <input
                type="text"
                value={newCampaignTitle}
                onChange={(e) => setNewCampaignTitle(e.target.value)}
                placeholder="Titre de la nouvelle campagne doctorale..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl bg-white"
              />
              <input
                type="date"
                value={newCampaignEnd}
                onChange={(e) => setNewCampaignEnd(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl bg-white"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Créer campagne</span>
              </button>
            </form>

            <div className="space-y-2.5">
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {c.code} — {c.title}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {c.academicYear} · Du {c.startDate} au {c.endDate}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleCampaignStatus(c.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
                      c.status === 'ouverte'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-200 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {c.status === 'ouverte' ? 'Ouverte (Cliquer pour clôturer)' : 'Clôturée (Rouvrir)'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'formations' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Gestion des Formations Doctorales
            </h2>
            <form onSubmit={handleAddFormation} className="flex flex-col sm:flex-row gap-2 text-xs">
              <input
                type="text"
                value={newFormationTitle}
                onChange={(e) => setNewFormationTitle(e.target.value)}
                placeholder="Intitulé de la formation doctorale..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl bg-white"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter formation</span>
              </button>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {formations.map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1"
                >
                  <div className="font-mono text-[11px] font-bold text-emerald-700">{f.code}</div>
                  <div className="font-bold text-slate-900">{f.title}</div>
                  <div className="text-[11px] text-slate-500">
                    {f.institution} · Resp. : {f.coordinator}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'topics' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Gestion des Sujets de Thèse ({topics.length})
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('campagnes')}
                className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
              >
                Voir le catalogue public →
              </button>
            </div>
            <form onSubmit={handleAddTopic} className="flex flex-col sm:flex-row gap-2 text-xs">
              <input
                type="text"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                placeholder="Intitulé du nouveau sujet de thèse..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl bg-white"
              />
              <input
                type="text"
                value={newTopicDirector}
                onChange={(e) => setNewTopicDirector(e.target.value)}
                placeholder="Directeur de thèse"
                className="sm:w-56 px-3 py-2 border border-slate-300 rounded-xl bg-white"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publier sujet</span>
              </button>
            </form>
            <div className="space-y-2">
              {topics.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      <span className="font-mono text-indigo-700 mr-2">{t.code}</span>
                      {t.title}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {t.director} · {t.laboratory} · {t.domain}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[11px] shrink-0">
                    {t.availableSpots} poste(s)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'structures' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Gestion des Structures de Recherche ({structures.length})
            </h2>
            <form onSubmit={handleAddStructure} className="flex flex-col sm:flex-row gap-2 text-xs">
              <input
                type="text"
                value={newStructureCode}
                onChange={(e) => setNewStructureCode(e.target.value)}
                placeholder="Sigle (ex: LIA)"
                className="sm:w-32 px-3 py-2 border border-slate-300 rounded-xl bg-white uppercase"
              />
              <input
                type="text"
                value={newStructureName}
                onChange={(e) => setNewStructureName(e.target.value)}
                placeholder="Nom complet du laboratoire ou équipe de recherche..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl bg-white"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter structure</span>
              </button>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {structures.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-800">{s.code}</span>
                    <span className="text-[10px] font-semibold text-slate-500">{s.type}</span>
                  </div>
                  <div className="font-bold text-slate-900">{s.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {s.institution} · Dir. : {s.directorName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="space-y-4 text-xs">
            <h2 className="text-base font-bold text-slate-900">
              Paramètres Globaux de la Plateforme GCD
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <label className="font-bold text-slate-900 block">
                  Taille maximale des pièces PDF
                </label>
                <select
                  disabled={!canManageSettings}
                  value={maxPdfMb}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMaxPdfSizeMb(val);
                    setMaxPdfMbState(val);
                    notify(`Taille maximale PDF définie sur ${val} Mo.`);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold"
                >
                  {ALLOWED_MAX_PDF_SIZES_MB.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz} Mo (Format .pdf strict)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-900">Dépôt de nouvelles candidatures</div>
                <button
                  type="button"
                  disabled={!canManageSettings}
                  onClick={() => {
                    const next = !submissionsOpen;
                    setSubmissionsOpen(next, currentUser);
                    setSubmissionsOpenState(next);
                    notify(next ? 'Dépôts ouverts.' : 'Dépôts suspendus.');
                  }}
                  className={`w-full px-3 py-2 rounded-xl font-bold cursor-pointer ${
                    submissionsOpen
                      ? 'bg-emerald-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {submissionsOpen ? 'Dépôts Actifs (Cliquer pour suspendre)' : 'Dépôts Suspendus (Réactiver)'}
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-900">Données de démonstration</div>
                <button
                  type="button"
                  onClick={resetDemoData}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 hover:bg-red-700 text-white font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Réinitialiser toute la plateforme</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'logs' && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">
              Journal Complet des Activités & Audit ({activities.length})
            </h2>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-indigo-100 text-indigo-800">
                        {act.category}
                      </span>
                      <span className="font-bold text-slate-900">{act.action}</span>
                      {act.referenceNumber && (
                        <span className="font-mono text-indigo-700 font-semibold">
                          {act.referenceNumber}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      {act.actorName} ({act.actorRole}) · {act.details}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">
                    {new Date(act.timestamp).toLocaleString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Users & Multi-Role Management Modal */}
      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          refreshData();
        }}
        currentUser={currentUser}
      />
    </div>
  );
};
