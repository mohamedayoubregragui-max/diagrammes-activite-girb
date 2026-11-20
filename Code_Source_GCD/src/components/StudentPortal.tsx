import React, { useState, useMemo, useEffect } from 'react';
import { ThesisTopic, CartItem, DomainCategory, ApplicationDossier, AuthenticatedUser } from '../types';
import { getPlatformTopics } from '../services/platformService';
import { TopicCard } from './TopicCard';
import { TopicDetailModal } from './TopicDetailModal';
import {
  Search,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  GraduationCap
} from 'lucide-react';
import { MAX_CART_ITEMS } from '../services/storage';

interface StudentPortalProps {
  cart: CartItem[];
  onAddToCart: (topic: ThesisTopic) => void;
  onRemoveFromCart: (topicId: string) => void;
  openCart: () => void;
  submittedDossier: ApplicationDossier | null;
  onViewDirectorView: () => void;
  onViewCandidateDashboard?: () => void;
  currentUser?: AuthenticatedUser | null;
  onOpenAuth?: (role?: 'candidat' | 'directeur' | 'administrateur', mode?: 'login' | 'register') => void;
}

const DOMAINS: DomainCategory[] = [
  'Tous les domaines',
  'Intelligence Artificielle & Données',
  'Cybersécurité & Réseaux IoT',
  'Énergies Propres & Environnement',
  'Biotechnologie & Santé',
  'Génie Mécanique & Matériaux',
  'Génie Logiciel & Cloud'
];

export const StudentPortal: React.FC<StudentPortalProps> = ({
  cart,
  onAddToCart,
  onRemoveFromCart,
  openCart,
  submittedDossier,
  onViewDirectorView,
  onViewCandidateDashboard,
  currentUser,
  onOpenAuth
}) => {
  const [topics, setTopics] = useState<ThesisTopic[]>(() => getPlatformTopics());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<DomainCategory>('Tous les domaines');
  const [selectedTopicForModal, setSelectedTopicForModal] = useState<ThesisTopic | null>(null);

  useEffect(() => {
    const sync = () => setTopics(getPlatformTopics());
    window.addEventListener('gcd_platform_updated', sync);
    return () => window.removeEventListener('gcd_platform_updated', sync);
  }, []);

  const isMaxReached = cart.length >= MAX_CART_ITEMS;

  // Filter topics
  const filteredTopics = useMemo(() => {
    return topics.filter((topic) => {
      const matchDomain =
        selectedDomain === 'Tous les domaines' || topic.domain === selectedDomain;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        topic.title.toLowerCase().includes(q) ||
        topic.director.toLowerCase().includes(q) ||
        topic.code.toLowerCase().includes(q) ||
        topic.laboratory.toLowerCase().includes(q) ||
        topic.keywords.some((k) => k.toLowerCase().includes(q));

      return matchDomain && matchSearch;
    });
  }, [topics, searchQuery, selectedDomain]);

  return (
    <div className="space-y-6">
      {/* Success Notification if user just submitted a dossier */}
      {submittedDossier && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-emerald-900">
                Candidature validée avec succès ! (Réf: {submittedDossier.referenceNumber})
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Votre dossier certifié avec l'adresse <strong>{submittedDossier.student.academicEmail}</strong> a été transmis à la commission doctorale.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {onViewCandidateDashboard && (
              <button
                onClick={onViewCandidateDashboard}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 cursor-pointer shadow-2xs"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Mon Tableau de Bord Candidat</span>
              </button>
            )}
            <button
              onClick={onViewDirectorView}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold rounded-xl transition-colors shrink-0 cursor-pointer shadow-2xs"
            >
              <span>Espace Directeur (Audit)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Hero & Process Explanation Banner (Reflecting the GCD Table) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 mb-2">
            <span>Campagnes Doctorales 2026/2027</span>
            <span>·</span>
            <span>Accès Public & Libre</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Catalogue des Sujets de Recherche Doctorale
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Consultez les thématiques proposées par les laboratoires de recherche. Constituez librement votre panier provisoire de <strong>1 à 3 sujets</strong>. L'authentification par <strong>e-mail académique certifié</strong> n'interviendra qu'au moment de la validation officielle.
          </p>

          {/* Stepper visual: Panier -> Validation -> Suivi */}
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <span className="font-bold text-slate-900 block">Exploration & Panier</span>
                <span className="text-slate-500 text-[11px]">Sélection libre de 1 à 3 sujets sans inscription</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-mono text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <span className="font-bold text-slate-900 block">Validation & Compte</span>
                <span className="text-slate-500 text-[11px]">Connexion ou inscription via e-mail académique</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-mono text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <span className="font-bold text-slate-900 block">Examen & Décision CEDoc</span>
                <span className="text-slate-500 text-[11px]">Avis du directeur de thèse puis décision finale</span>
              </div>
            </div>
          </div>
        </div>

        {/* User state banner */}
        {currentUser && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
              <span className="text-slate-700">
                Connecté en tant que <strong>{currentUser.firstName} {currentUser.lastName}</strong> ({currentUser.email})
              </span>
              <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-[10px] font-bold">
                E-mail Académique Vérifié
              </span>
            </div>
            <span className="text-indigo-600 font-medium">Validation directe activée</span>
          </div>
        )}
      </div>

      {/* Search & Multi-criteria filter toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par mot-clé, titre, encadrant (ex: El Amrani, Blockchain, IA)..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Quick Cart Status button */}
          <button
            onClick={openCart}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              cart.length > 0
                ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Mon Panier ({cart.length}/3)</span>
          </button>
        </div>

        {/* Domain tags / segmented filter without visible gray scrollbar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {DOMAINS.map((domain) => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer shrink-0 ${
                selectedDomain === domain
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {domain}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div>
          <span>{filteredTopics.length} sujet(s) disponible(s)</span>
          {searchQuery && (
            <span className="ml-1">pour "{searchQuery}"</span>
          )}
        </div>
        {cart.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-medium">
              {cart.length} / {MAX_CART_ITEMS} choix dans le panier
            </span>
            <button
              onClick={openCart}
              className="text-indigo-600 hover:underline font-semibold cursor-pointer"
            >
              Consulter & Valider
            </button>
          </div>
        )}
      </div>

      {/* Topics Grid */}
      {filteredTopics.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-slate-800">
            Aucun sujet ne correspond à vos critères
          </div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Essayez de modifier votre recherche ou sélectionnez "Tous les domaines".
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDomain('Tous les domaines');
            }}
            className="px-4 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTopics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              cart={cart}
              onAddToCart={onAddToCart}
              onRemoveFromCart={onRemoveFromCart}
              onViewDetails={setSelectedTopicForModal}
              isMaxReached={isMaxReached}
            />
          ))}
        </div>
      )}

      {/* Topic Detail Modal */}
      <TopicDetailModal
        topic={selectedTopicForModal}
        onClose={() => setSelectedTopicForModal(null)}
        cart={cart}
        onAddToCart={onAddToCart}
        onRemoveFromCart={onRemoveFromCart}
        isMaxReached={isMaxReached}
      />
    </div>
  );
};
