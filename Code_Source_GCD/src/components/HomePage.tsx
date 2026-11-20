import React, { useState, useMemo, useEffect } from 'react';
import {
  ActivePage,
  ApplicationDossier,
  AuthenticatedUser
} from '../types';
import { hasAnyRole, hasPrivilege } from '../services/storage';
import {
  DoctoralCampaign,
  getPlatformCampaigns,
  getPlatformTopics
} from '../services/platformService';
import { CandidateHomeView } from './home/CandidateHomeView';
import { DirectorHomeView } from './home/DirectorHomeView';
import { CedocHomeView } from './home/CedocHomeView';
import { AdminHomeView } from './home/AdminHomeView';
import {
  Calendar,
  ShoppingBag,
  ShieldCheck,
  Building2,
  ArrowRight,
  BookOpen,
  Layers,
  LogIn,
  UserPlus,
  MailCheck
} from 'lucide-react';

type DashboardSpace =
  | 'candidat'
  | 'directeur'
  | 'directeur_cedoc'
  | 'administrateur';

interface HomePageProps {
  onNavigate: (page: ActivePage) => void;
  onOpenAuth: (
    role?: 'candidat' | 'directeur' | 'administrateur',
    mode?: 'login' | 'register' | 'institutional'
  ) => void;
  currentUser: AuthenticatedUser | null;
  cartCount: number;
  dossiers: ApplicationDossier[];
  onOpenCart: () => void;
  onStartValidation: () => void;
}

function getAuthorizedSpaces(user: AuthenticatedUser): DashboardSpace[] {
  const spaces: DashboardSpace[] = [];

  if (
    hasPrivilege(user, 'manage_users') ||
    hasPrivilege(user, 'manage_platform_settings') ||
    hasAnyRole(user, ['administrateur'])
  ) {
    spaces.push('administrateur');
  }

  if (
    hasPrivilege(user, 'supervise_cedoc') ||
    hasAnyRole(user, ['directeur_cedoc'])
  ) {
    spaces.push('directeur_cedoc');
  }

  if (
    hasAnyRole(user, [
      'directeur',
      'directeur_structure',
      'co_encadrant',
      'enseignant'
    ])
  ) {
    spaces.push('directeur');
  }

  if (hasAnyRole(user, ['candidat'])) {
    spaces.push('candidat');
  }

  return spaces;
}

function resolveDefaultSpace(
  user: AuthenticatedUser,
  authorized: DashboardSpace[]
): DashboardSpace {
  if (user.role === 'administrateur' && authorized.includes('administrateur')) {
    return 'administrateur';
  }
  if (user.role === 'directeur_cedoc' && authorized.includes('directeur_cedoc')) {
    return 'directeur_cedoc';
  }
  if (
    (user.role === 'directeur' ||
      user.role === 'directeur_structure' ||
      user.role === 'co_encadrant' ||
      user.role === 'enseignant') &&
    authorized.includes('directeur')
  ) {
    return 'directeur';
  }
  if (user.role === 'candidat' && authorized.includes('candidat')) {
    return 'candidat';
  }
  return authorized[0] || 'candidat';
}

const SPACE_LABELS: Record<DashboardSpace, string> = {
  candidat: 'Espace Candidat',
  directeur: 'Espace Directeur de thèse',
  directeur_cedoc: 'Espace Directeur CEDoc',
  administrateur: 'Espace Administrateur'
};

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onOpenAuth,
  currentUser,
  cartCount,
  dossiers,
  onOpenCart,
  onStartValidation
}) => {
  const authorizedSpaces = useMemo(
    () => (currentUser ? getAuthorizedSpaces(currentUser) : []),
    [currentUser]
  );

  const [activeSpace, setActiveSpace] = useState<DashboardSpace>(() =>
    currentUser ? resolveDefaultSpace(currentUser, authorizedSpaces) : 'candidat'
  );

  const [campaigns, setCampaigns] = useState<DoctoralCampaign[]>(() => getPlatformCampaigns());
  const [topicsCount, setTopicsCount] = useState<number>(() => getPlatformTopics().length);

  useEffect(() => {
    const syncPlatform = () => {
      setCampaigns(getPlatformCampaigns());
      setTopicsCount(getPlatformTopics().length);
    };
    window.addEventListener('gcd_platform_updated', syncPlatform);
    return () => window.removeEventListener('gcd_platform_updated', syncPlatform);
  }, []);

  const openCampaigns = useMemo(
    () => campaigns.filter((c) => c.status === 'ouverte'),
    [campaigns]
  );

  // Sync instantly when switching demo profile, logging in, or updating user roles
  useEffect(() => {
    if (currentUser) {
      setActiveSpace(resolveDefaultSpace(currentUser, authorizedSpaces));
    }
  }, [currentUser, authorizedSpaces]);

  // Authenticated Role-Based Dynamic Accueil
  if (currentUser && authorizedSpaces.length > 0) {
    const effectiveSpace = authorizedSpaces.includes(activeSpace)
      ? activeSpace
      : authorizedSpaces[0];

    return (
      <div className="space-y-4">
        {/* Multi-role workspace selector: displayed ONLY when the user holds >1 distinct authorized space */}
        {authorizedSpaces.length > 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 px-4 py-2.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Profil multi-rôles ({currentUser.firstName} {currentUser.lastName}) · Espaces autorisés :
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {authorizedSpaces.map((space) => (
                <button
                  key={space}
                  type="button"
                  onClick={() => setActiveSpace(space)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    effectiveSpace === space
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {SPACE_LABELS[space]}
                </button>
              ))}
            </div>
          </div>
        )}

        {effectiveSpace === 'candidat' && (
          <CandidateHomeView
            currentUser={currentUser}
            dossiers={dossiers}
            cartCount={cartCount}
            onNavigate={onNavigate}
            onOpenCart={onOpenCart}
            onStartValidation={onStartValidation}
          />
        )}

        {effectiveSpace === 'directeur' && (
          <DirectorHomeView
            currentUser={currentUser}
            dossiers={dossiers}
            onNavigate={onNavigate}
          />
        )}

        {effectiveSpace === 'directeur_cedoc' && (
          <CedocHomeView
            currentUser={currentUser}
            dossiers={dossiers}
            onNavigate={onNavigate}
          />
        )}

        {effectiveSpace === 'administrateur' && (
          <AdminHomeView
            currentUser={currentUser}
            dossiers={dossiers}
            onNavigate={onNavigate}
          />
        )}
      </div>
    );
  }

  // Unauthenticated Public Visitor Portal View
  return (
    <div className="space-y-10 pb-12">
      {/* Clean Hero Section */}
      <section className="relative overflow-hidden academic-gradient-hero rounded-3xl p-8 sm:p-12 text-white shadow-xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-12 bottom-0 w-72 h-72 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-white text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse" />
            <span className="tracking-wide">Campagne Doctorale 2026/2027</span>
            <span className="text-white/40">·</span>
            <span className="text-slate-200">CEDoc Sciences & Technologies</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-white tracking-tight leading-tight">
            Portail de Gestion des Candidatures Doctorales
          </h1>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl font-sans">
            Consultez librement les campagnes doctorales et sujets de recherche, composez votre panier de <strong>1 à 3 choix</strong>, puis validez votre candidature avec votre <strong className="text-white font-semibold">e-mail académique institutionnel</strong>.
          </p>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigate('campagnes')}
              className="flex items-center gap-2 px-6 py-3.5 academic-btn-primary text-xs sm:text-sm font-bold rounded-xl cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explorer les campagnes et sujets</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              type="button"
              onClick={() => onOpenAuth('candidat', 'login')}
              className="flex items-center gap-2 px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/25 text-xs sm:text-sm font-semibold rounded-xl backdrop-blur-sm transition-all cursor-pointer shadow-xs"
            >
              <LogIn className="w-4 h-4 text-emerald-400" />
              <span>Se connecter</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAuth('candidat', 'register')}
              className="flex items-center gap-2 px-5 py-3.5 bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>S'inscrire</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('acces_institutionnel')}
              className="flex items-center gap-1.5 px-3 py-3 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Accès Directeurs & CEDoc</span>
            </button>
          </div>
        </div>

        {/* Cart shortcut notice if visitor has already picked topics */}
        {cartCount > 0 && (
          <div className="relative z-10 mt-8 p-4 bg-amber-500/15 border border-amber-300/30 rounded-2xl flex items-center justify-between gap-4 text-xs text-amber-100 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4 text-amber-300 shrink-0" />
              <span>
                Votre panier contient <strong className="text-white">{cartCount} sujet(s)</strong> sélectionné(s).
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenCart}
              className="font-bold text-white underline hover:text-amber-200 cursor-pointer shrink-0"
            >
              Ouvrir mon panier →
            </button>
          </div>
        )}
      </section>

      {/* Open Doctoral Campaigns Section (Synchronized with Admin Catalog) */}
      <section className="academic-card p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-[#2563EB]" />
            <div>
              <h2 className="text-lg font-heading font-bold text-[#101B35]">
                Campagnes Doctorales Ouvertes ({openCampaigns.length})
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                {topicsCount} sujet(s) de recherche disponibles — consultation libre sans compte préalable
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('campagnes')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-xs font-bold rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>Explorer le catalogue complet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {openCampaigns.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            Aucune campagne doctorale n’est actuellement ouverte.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openCampaigns.map((camp) => (
              <div
                key={camp.id}
                className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col justify-between gap-4 hover:border-blue-300 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-indigo-700">
                      {camp.code}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Ouverte · {camp.academicYear}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-[#101B35] text-sm sm:text-base">
                    {camp.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{camp.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">
                    Clôture : <strong className="text-slate-800">{camp.endDate}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('campagnes')}
                    className="font-bold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Explorer les sujets</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Simple 4-Step Candidate Workflow */}
      <section className="space-y-5">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <div className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-[#2563EB]">
            Parcours simplifié
          </div>
          <h2 className="text-2xl font-heading font-extrabold text-[#101B35] tracking-tight">
            Déposer votre candidature en 4 étapes
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="academic-card-tinted p-5 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#101B35] text-white flex items-center justify-center font-mono font-bold text-xs">
              01
            </div>
            <h3 className="text-sm font-heading font-bold text-[#101B35]">
              Explorer & choisir
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Parcourez les sujets par domaine ou mot-clé et ajoutez de <strong>1 à 3 choix</strong> dans votre panier.
            </p>
          </div>

          <div className="academic-card-tinted p-5 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-mono font-bold text-xs">
              02
            </div>
            <h3 className="text-sm font-heading font-bold text-[#101B35]">
              Valider & s'authentifier
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Classez vos priorités, cliquez sur « Valider ma sélection » et connectez-vous via votre <strong>e-mail académique</strong>.
            </p>
          </div>

          <div className="academic-card-tinted p-5 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#0D9488] text-white flex items-center justify-center font-mono font-bold text-xs">
              03
            </div>
            <h3 className="text-sm font-heading font-bold text-[#101B35]">
              Examen du Directeur
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Votre candidature est immédiatement transmise au(x) directeur(s) de thèse concerné(s) pour avis scientifique.
            </p>
          </div>

          <div className="academic-card-tinted p-5 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-[#4338CA] text-white flex items-center justify-center font-mono font-bold text-xs">
              04
            </div>
            <h3 className="text-sm font-heading font-bold text-[#101B35]">
              Décision finale CEDoc
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Suivez l'état d'avancement en direct et recevez la décision finale du CEDoc (Admis, Entretien ou Rejeté).
            </p>
          </div>
        </div>

        <div className="text-center pt-1">
          <div className="inline-flex items-center gap-2 text-xs text-slate-500">
            <MailCheck className="w-4 h-4 text-[#0D9488]" />
            <span>
              Inscriptions ouvertes aux universités marocaines et internationales reconnues (.ac.ma, .edu, .ac.uk, etc.).
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
