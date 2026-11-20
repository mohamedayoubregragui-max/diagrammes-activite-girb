/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ActivePage,
  ApplicationDossier,
  CartItem,
  ThesisTopic,
  DossierStatus,
  AuthenticatedUser,
  UserRole
} from './types';
import {
  getStoredCart,
  addToCart,
  removeFromCart,
  reorderCart,
  clearCart,
  getStoredDossiers,
  updateDossierAudit,
  getStoredUser,
  saveStoredUser,
  DEMO_USERS,
  hasAnyRole,
  isInstitutionalUser
} from './services/storage';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { StudentPortal } from './components/StudentPortal';
import { InstitutionalAccessPage } from './components/InstitutionalAccessPage';
import { CandidateDashboard } from './components/CandidateDashboard';
import { GcdMatrixView } from './components/GcdMatrixView';
import { DemoHeaderBar } from './components/DemoHeaderBar';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { AuthValidationModal } from './components/AuthValidationModal';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { resetDemoData } from './services/storage';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('accueil');
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [dossiers, setDossiers] = useState<ApplicationDossier[]>([]);

  // Demo Role state & control
  const [currentDemoRole, setCurrentDemoRole] = useState<UserRole>('candidat');

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('candidat');
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'institutional'>('login');
  const [authContextualNotice, setAuthContextualNotice] = useState<string | null>(null);
  const [pendingCartValidation, setPendingCartValidation] = useState(false);
  const [isAuthValidationModalOpen, setIsAuthValidationModalOpen] = useState(false);
  const [lastSubmittedDossier, setLastSubmittedDossier] = useState<ApplicationDossier | null>(null);

  // Toast notification system
  const [toast, setToast] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Initial load
  useEffect(() => {
    setCart(getStoredCart());
    setDossiers(getStoredDossiers());
    const stored = getStoredUser();
    if (stored) {
      setCurrentUser(stored);
      setCurrentDemoRole(stored.role);
    } else {
      setCurrentUser(null);
      setCurrentDemoRole('candidat');
    }

    const handleCartUpdate = (e: any) => {
      if (e.detail) setCart(e.detail);
    };

    const handleDossiersUpdate = (e: any) => {
      if (e.detail) setDossiers(e.detail);
    };

    const handleUserUpdate = (e: any) => {
      const user = e.detail || null;
      setCurrentUser(user);
      if (user && user.role) {
        setCurrentDemoRole(user.role);
      }
    };

    window.addEventListener('gcd_cart_updated', handleCartUpdate);
    window.addEventListener('gcd_dossiers_updated', handleDossiersUpdate);
    window.addEventListener('gcd_user_updated', handleUserUpdate);

    return () => {
      window.removeEventListener('gcd_cart_updated', handleCartUpdate);
      window.removeEventListener('gcd_dossiers_updated', handleDossiersUpdate);
      window.removeEventListener('gcd_user_updated', handleUserUpdate);
    };
  }, []);

  // Demo role selection handler (instant switch without authentication)
  const handleSelectDemoRole = (role: UserRole) => {
    setCurrentDemoRole(role);
    const demoUser = DEMO_USERS[role];
    saveStoredUser(demoUser);
    setCurrentUser(demoUser);

    // Immediately display the selected role's personalized Accueil dashboard
    setActivePage('accueil');

    const roleNames: Record<UserRole, string> = {
      candidat: 'Candidat (Étudiant)',
      enseignant: 'Enseignant',
      directeur: 'Directeur de Thèse',
      co_encadrant: 'Co-encadrant',
      directeur_structure: 'Directeur de Structure',
      directeur_cedoc: 'Directeur du CEDoc',
      administrateur: 'Administrateur'
    };

    showToast(`Basculé sur le profil de test : ${roleNames[role]}`, 'info');
  };

  // Reset demo data handler
  const handleResetDemoData = () => {
    resetDemoData();
    setCurrentDemoRole('candidat');
    setCurrentUser(null);
    setCart([]);
    setDossiers(getStoredDossiers());
    setActivePage('accueil');
    showToast('Données de démonstration réinitialisées avec succès.', 'success');
  };

  // Open Auth modal with specific role and mode
  const handleOpenAuth = (
    role: UserRole = 'candidat',
    mode: 'login' | 'register' | 'institutional' = 'login'
  ) => {
    setAuthContextualNotice(null);
    setPendingCartValidation(false);
    setAuthModalRole(role);
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Fast login helper (1-click)
  const handleFastLogin = (role: 'directeur' | 'administrateur') => {
    const demo = DEMO_USERS[role];
    saveStoredUser(demo);
    setCurrentUser(demo);
    setActivePage('accueil');
    showToast(`Connecté avec succès en tant que ${demo.firstName} ${demo.lastName}`, 'success');
  };

  // Role-based redirection after authentication
  const handleLoginSuccess = (user: AuthenticatedUser) => {
    setCurrentUser(user);

    if (pendingCartValidation && hasAnyRole(user, ['candidat'])) {
      setPendingCartValidation(false);
      setAuthContextualNotice(null);
      setIsAuthValidationModalOpen(true);
      showToast(`Compte vérifié (${user.email}). Finalisez maintenant le dépôt officiel de votre dossier.`, 'success');
      return;
    }

    setPendingCartValidation(false);
    setAuthContextualNotice(null);

    setActivePage('accueil');
    if (isInstitutionalUser(user) && !hasAnyRole(user, ['candidat'])) {
      showToast(`Connexion institutionnelle réussie (${user.firstName} ${user.lastName})`, 'success');
    } else {
      showToast(`Bienvenue ${user.firstName} ! Votre tableau de bord d’accueil est prêt.`, 'success');
    }
  };

  // Logout
  const handleLogout = () => {
    saveStoredUser(null);
    setCurrentUser(null);
    setPendingCartValidation(false);
    setAuthContextualNotice(null);
    setActivePage('accueil');
    showToast('Vous avez été déconnecté.', 'info');
  };

  // Cart operations
  const handleAddToCart = (topic: ThesisTopic) => {
    const res = addToCart(topic);
    setCart(res.cart);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'warning');
    }
  };

  const handleRemoveFromCart = (topicId: string) => {
    const updated = removeFromCart(topicId);
    setCart(updated);
    showToast('Sujet retiré du panier.', 'info');
  };

  const handleReorderCart = (newItems: CartItem[]) => {
    const updated = reorderCart(newItems);
    setCart(updated);
  };

  const handleClearCart = () => {
    clearCart();
    setCart([]);
    showToast('Panier vidé.', 'info');
  };

  // Trigger Auth before Validation Modal when validating cart
  const handleStartValidation = () => {
    if (cart.length === 0) {
      showToast('Votre panier est vide. Veuillez sélectionner au moins un sujet.', 'warning');
      return;
    }

    if (!currentUser) {
      setPendingCartValidation(true);
      setAuthContextualNotice(
        'Validation officielle : veuillez vous connecter ou créer votre compte étudiant avec votre adresse e-mail académique institutionnelle pour soumettre vos choix.'
      );
      setAuthModalRole('candidat');
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      showToast('Authentification académique requise pour valider votre panier.', 'info');
      return;
    }

    if (!hasAnyRole(currentUser, ['candidat'])) {
      showToast(
        'La soumission d’une candidature est strictement réservée au profil Candidat (Étudiant).',
        'warning'
      );
      return;
    }

    setIsAuthValidationModalOpen(true);
  };

  // Handle successful submission
  const handleSubmissionSuccess = (dossier: ApplicationDossier) => {
    setIsAuthValidationModalOpen(false);
    setIsCartOpen(false);
    setCart([]);
    setDossiers(getStoredDossiers());
    setLastSubmittedDossier(dossier);
    setActivePage('mon_dossier');
    showToast(`Dossier ${dossier.referenceNumber} soumis avec succès ! Redirection vers votre tableau de bord.`, 'success');
  };

  // Director updates audit
  const handleUpdateAudit = (
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
  ) => {
    const updated = updateDossierAudit(dossierId, auditData);
    setDossiers(updated);
    showToast('Audit et conformité des diplômes enregistrés.', 'success');
  };

  return (
    <div className="min-h-full flex flex-col bg-slate-50 text-slate-900">
      {/* Permanent Demo Role Selector Bar */}
      <DemoHeaderBar
        currentRole={currentDemoRole}
        onSelectRole={handleSelectDemoRole}
        onVisitorMode={handleLogout}
        onResetData={handleResetDemoData}
        currentUser={currentUser}
      />

      {/* Top Navigation Bar with 3 main pages + Auth controls */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        cartCount={cart.length}
        openCart={() => setIsCartOpen(true)}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Main Content Pages */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page 1: Accueil (Dynamique selon le rôle actif) */}
        {activePage === 'accueil' && (
          <HomePage
            onNavigate={setActivePage}
            onOpenAuth={handleOpenAuth}
            currentUser={currentUser}
            cartCount={cart.length}
            dossiers={dossiers}
            onOpenCart={() => setIsCartOpen(true)}
            onStartValidation={handleStartValidation}
          />
        )}

        {/* Page 2: Campagnes Doctorat (Exploration & Panier Libre) */}
        {activePage === 'campagnes' && (
          <StudentPortal
            cart={cart}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            openCart={() => setIsCartOpen(true)}
            submittedDossier={lastSubmittedDossier}
            onViewDirectorView={() => setActivePage('acces_institutionnel')}
            onViewCandidateDashboard={() => setActivePage('mon_dossier')}
            currentUser={currentUser}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {/* Page: Mon Tableau de Bord Candidat (Suivi de Candidature & Sujets) */}
        {activePage === 'mon_dossier' && (
          <CandidateDashboard
            dossiers={dossiers}
            currentUser={currentUser}
            onNavigateToCampaigns={() => setActivePage('campagnes')}
            onOpenAuth={handleOpenAuth}
            onBackToHome={() => setActivePage('accueil')}
          />
        )}

        {/* Page 3: Accès Institutionnel (Directeurs & CEDoc) */}
        {activePage === 'acces_institutionnel' && (
          <InstitutionalAccessPage
            currentUser={currentUser}
            dossiers={dossiers}
            onUpdateAudit={handleUpdateAudit}
            onOpenAuth={handleOpenAuth}
            onFastLogin={handleFastLogin}
            onLogout={handleLogout}
          />
        )}

        {/* Supplementary View: Matrice GCD & Synthèse des 5 Experts */}
        {activePage === 'matrice_gcd' && <GcdMatrixView />}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemove={handleRemoveFromCart}
        onReorder={handleReorderCart}
        onClear={handleClearCart}
        onValidate={handleStartValidation}
        onExploreTopics={() => setActivePage('campagnes')}
      />

      {/* Login / Register Modal (E-mail Académique Institutionnel, 3 rôles) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingCartValidation(false);
          setAuthContextualNotice(null);
        }}
        onLoginSuccess={handleLoginSuccess}
        initialRole={authModalRole}
        initialMode={authModalMode}
        contextualNotice={authContextualNotice}
      />

      {/* Auth & Validation Modal (Triggered by Valider mes choix) */}
      <AuthValidationModal
        isOpen={isAuthValidationModalOpen}
        onClose={() => setIsAuthValidationModalOpen(false)}
        cart={cart}
        currentUser={currentUser}
        onSubmissionSuccess={handleSubmissionSuccess}
      />

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div
            className={`px-4 py-3 rounded-xl border shadow-lg flex items-center gap-2.5 text-xs font-medium max-w-md ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toast.type === 'warning'
                ? 'bg-amber-900 text-white border-amber-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Institutional Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800">
              Portail Doctorat GCD · CEDoc Sciences & Technologies
            </span>
            <span>·</span>
            <span>Université Sidi Mohamed Ben Abdellah (USMBA) - Fès</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <button
              onClick={() => setActivePage('accueil')}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Accueil
            </button>
            <span>·</span>
            <button
              onClick={() => setActivePage('campagnes')}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Explorer les sujets
            </button>
            <span>·</span>
            <button
              onClick={() => setActivePage('acces_institutionnel')}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Accès Institutionnel
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
