import React from 'react';
import { ActivePage, AuthenticatedUser, UserRole } from '../types';
import { hasAnyRole, hasPrivilege, isInstitutionalUser } from '../services/storage';
import {
  ShoppingBag,
  Building2,
  Home,
  BookOpen,
  LogOut,
  LogIn,
  UserPlus
} from 'lucide-react';

interface NavbarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  cartCount: number;
  openCart: () => void;
  currentUser: AuthenticatedUser | null;
  onOpenAuth: (role?: UserRole, mode?: 'login' | 'register' | 'institutional') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  setActivePage,
  cartCount,
  openCart,
  currentUser,
  onOpenAuth,
  onLogout
}) => {
  const isCandidate = hasAnyRole(currentUser, ['candidat']);
  const isInst = isInstitutionalUser(currentUser);
  const canSuperviseCedoc = hasPrivilege(currentUser, 'supervise_cedoc');
  const canManageAdmin = hasPrivilege(currentUser, 'manage_users');

  // Cart is only shown to Visitors or Candidat profiles
  const showCart = !currentUser || isCandidate;

  const navItems: Array<{
    id: ActivePage;
    label: string;
    mobileLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'accueil', label: 'Accueil', mobileLabel: 'Accueil', icon: Home },
    {
      id: 'campagnes',
      label: isInst && !isCandidate ? 'Catalogue des sujets' : 'Explorer les sujets',
      mobileLabel: 'Sujets',
      icon: BookOpen
    }
  ];

  if (currentUser && isInst) {
    navItems.push({
      id: 'acces_institutionnel',
      label: canManageAdmin
        ? 'Supervision & Dossiers'
        : canSuperviseCedoc
        ? 'Supervision CEDoc'
        : 'Candidatures affectées',
      mobileLabel: canSuperviseCedoc ? 'Supervision' : 'Candidatures',
      icon: Building2
    });
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Brand Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActivePage('accueil')}
              className="text-left group cursor-pointer focus:outline-none flex items-center gap-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#101B35] via-[#172B4D] to-[#2563EB] text-white flex items-center justify-center font-heading font-extrabold text-xs tracking-wider shadow-xs group-hover:scale-102 transition-transform border border-white/20">
                GCD
              </div>
              <div>
                <span className="text-base font-heading font-extrabold tracking-tight text-[#101B35] group-hover:text-[#2563EB] transition-colors whitespace-nowrap">
                  Portail Doctorat
                </span>
                <span className="hidden sm:inline text-[11px] text-slate-500 ml-1.5 font-normal">
                  CEDoc Sciences & Technologies
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Role-Scoped Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePage(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-blue-50/80 text-[#2563EB] border border-blue-200/60 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-[#101B35] hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions (Panier for Visitor/Candidat + Connexion / S'inscrire / User) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {showCart && (
              <button
                type="button"
                onClick={openCart}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  cartCount > 0
                    ? 'bg-gradient-to-r from-[#2563EB] to-[#4338CA] hover:from-[#1D4ED8] hover:to-[#3730A3] text-white shadow-xs'
                    : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                }`}
                title={`Consulter le panier (${cartCount}/3)`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Consulter le panier ({cartCount}/3)</span>
                <span className="sm:hidden font-mono font-bold">{cartCount}/3</span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActivePage('accueil')}
                  title="Accéder à mon espace personnel"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 border border-slate-200/90 text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#101B35] to-[#2563EB] text-white flex items-center justify-center font-bold text-[10px]">
                    {currentUser.firstName[0]}
                    {currentUser.lastName[0]}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="font-bold text-[#101B35] leading-tight flex items-center gap-1">
                      <span>{currentUser.firstName}</span>
                      <span
                        className="w-2 h-2 rounded-full bg-[#0D9488] inline-block ring-2 ring-emerald-100"
                        title="E-mail académique vérifié"
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-mono font-medium">
                      {currentUser.role === 'candidat'
                        ? 'Candidat'
                        : currentUser.role === 'directeur'
                        ? 'Dir. Thèse'
                        : currentUser.role === 'directeur_cedoc'
                        ? 'Dir. CEDoc'
                        : currentUser.role === 'administrateur'
                        ? 'Admin'
                        : currentUser.role === 'co_encadrant'
                        ? 'Co-encadrant'
                        : currentUser.role === 'directeur_structure'
                        ? 'Dir. Structure'
                        : 'Enseignant'}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50/70 transition-colors cursor-pointer"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenAuth('candidat', 'login')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#2563EB] hover:bg-slate-100/70 rounded-xl transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-[#2563EB]" />
                  <span>Se connecter</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAuth('candidat', 'register')}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#4338CA] hover:from-[#1D4ED8] hover:to-[#3730A3] rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>S'inscrire</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 text-xs">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
              className={`py-1 px-2 font-medium rounded ${
                activePage === item.id ? 'text-blue-600 font-bold' : 'text-slate-600'
              }`}
            >
              {item.mobileLabel}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
