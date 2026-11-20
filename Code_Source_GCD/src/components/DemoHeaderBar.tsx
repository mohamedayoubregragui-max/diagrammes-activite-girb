import React, { useState } from 'react';
import { UserRole, AuthenticatedUser } from '../types';
import { hasPrivilege } from '../services/storage';
import { UserManagementModal } from './UserManagementModal';
import {
  GraduationCap,
  UserCheck,
  ShieldCheck,
  Building2,
  RotateCcw,
  Sparkles,
  UserCog,
  Globe
} from 'lucide-react';

interface DemoHeaderBarProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onVisitorMode: () => void;
  onResetData: () => void;
  currentUser: AuthenticatedUser | null;
}

export const DemoHeaderBar: React.FC<DemoHeaderBarProps> = ({
  currentRole,
  onSelectRole,
  onVisitorMode,
  onResetData,
  currentUser
}) => {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const canManageUsers = hasPrivilege(currentUser, 'manage_users');

  const roles: Array<{
    id: UserRole;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'candidat', label: 'Candidat', icon: GraduationCap },
    { id: 'directeur', label: 'Dir. Thèse', icon: UserCheck },
    { id: 'directeur_cedoc', label: 'Directeur CEDoc', icon: ShieldCheck },
    { id: 'administrateur', label: 'Admin', icon: Building2 }
  ];

  return (
    <div className="bg-[#101B35] border-b border-[#172B4D] text-white py-2 px-4 sm:px-6 lg:px-8 text-xs font-medium sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-2 xl:gap-4">
        {/* Left Side: Test Profile Label and Role Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span className="text-[11px] font-heading uppercase tracking-wider text-slate-400">
              Espace de démonstration :
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={onVisitorMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                !currentUser
                  ? 'bg-gradient-to-r from-[#0D9488] to-[#2563EB] text-white font-semibold shadow-xs ring-1 ring-white/20'
                  : 'bg-[#172B4D]/80 text-slate-300 hover:text-white hover:bg-[#172B4D] border border-white/5'
              }`}
              title="Revenir au portail public visiteur (non connecté)"
            >
              <Globe className={`w-3.5 h-3.5 ${!currentUser ? 'text-white' : 'text-slate-400'}`} />
              <span>Visiteur</span>
            </button>

            {roles.map((role) => {
              const Icon = role.icon;
              const isActive = Boolean(currentUser && currentRole === role.id);

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => onSelectRole(role.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#2563EB] to-[#4338CA] text-white font-semibold shadow-xs ring-1 ring-white/20'
                      : 'bg-[#172B4D]/80 text-slate-300 hover:text-white hover:bg-[#172B4D] border border-white/5'
                  }`}
                  title={`Basculer immédiatement sur l'espace ${role.label}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{role.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Admin-only User Management Modal Button & Reset */}
        <div className="flex items-center gap-2.5 shrink-0">
          {canManageUsers && (
            <button
              type="button"
              onClick={() => setIsUserModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#172B4D] hover:bg-[#2563EB] text-slate-200 hover:text-white font-medium border border-white/10 hover:border-transparent rounded-lg text-[11px] transition-all cursor-pointer shadow-2xs"
              title="Gérer les utilisateurs, les rôles multiples et les privilèges"
            >
              <UserCog className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>Gestion Utilisateurs & Rôles</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResetData}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#172B4D]/60 hover:bg-rose-950/70 text-slate-400 hover:text-rose-200 border border-white/10 hover:border-rose-800/60 rounded-lg text-[11px] transition-all cursor-pointer"
            title="Réinitialiser les données de démonstration"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>

      {/* User Management & Role Administration Modal (Admin only) */}
      {canManageUsers && (
        <UserManagementModal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
