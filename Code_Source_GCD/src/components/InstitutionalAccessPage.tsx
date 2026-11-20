import React from 'react';
import { ApplicationDossier, AuthenticatedUser, DossierStatus, UserRole } from '../types';
import { isInstitutionalUser } from '../services/storage';
import { DirectorPortal } from './DirectorPortal';
import {
  ShieldCheck,
  Building2,
  Lock,
  UserCheck,
  LogOut,
  Mail
} from 'lucide-react';

interface InstitutionalAccessPageProps {
  currentUser: AuthenticatedUser | null;
  dossiers: ApplicationDossier[];
  onUpdateAudit: (
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
  onOpenAuth: (
    role?: UserRole,
    mode?: 'login' | 'register' | 'institutional'
  ) => void;
  onFastLogin: (role: 'directeur' | 'administrateur') => void;
  onLogout: () => void;
}

export const InstitutionalAccessPage: React.FC<InstitutionalAccessPageProps> = ({
  currentUser,
  dossiers,
  onUpdateAudit,
  onOpenAuth,
  onFastLogin,
  onLogout
}) => {
  const isAuthorized = isInstitutionalUser(currentUser);

  if (isAuthorized && currentUser) {
    return (
      <div className="space-y-6">
        {/* Institutional User Bar */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold">
              {currentUser.role === 'administrateur' ? (
                <Building2 className="w-5 h-5 text-amber-400" />
              ) : currentUser.role === 'directeur_cedoc' ? (
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              ) : (
                <UserCheck className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-white">
                  {currentUser.firstName} {currentUser.lastName}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase">
                  {currentUser.role === 'administrateur'
                    ? 'Admin Pôle'
                    : currentUser.role === 'directeur_cedoc'
                    ? 'Directeur CEDoc'
                    : currentUser.role === 'directeur'
                    ? 'Dir. Thèse'
                    : currentUser.role === 'co_encadrant'
                    ? 'Co-encadrant'
                    : currentUser.role === 'directeur_structure'
                    ? 'Dir. Structure'
                    : 'Enseignant'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  E-mail Vérifié
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {currentUser.institution} · {currentUser.email} {currentUser.cin && `· CIN: ${currentUser.cin}`}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>

        {/* Dashboard */}
        <DirectorPortal dossiers={dossiers} currentUser={currentUser} onUpdateAudit={onUpdateAudit} />
      </div>
    );
  }

  // Not logged in or logged in as student: show dedicated institutional access gate
  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xs space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white mx-auto flex items-center justify-center shadow-sm">
          <ShieldCheck className="w-7 h-7 text-emerald-400" />
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
            Espace Sécurisé · Accès Restreint
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Accès Institutionnel Encadrants & Administrateurs
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Cet espace est réservé aux Directeurs de Thèse, Chefs d'Équipe de recherche et Membres de la Commission Doctorale pour la vérification administrative des diplômes déclarés et la gestion des entretiens.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onOpenAuth('directeur', 'institutional')}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4 text-white" />
            <span>Connexion Institutionnelle</span>
          </button>

          <button
            onClick={() => onOpenAuth('directeur', 'institutional')}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Google SSO (E-mail académique)</span>
          </button>
        </div>

        {/* 1-Click Fast Demo Logins */}
        <div className="pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-2">
          <div className="font-medium text-slate-700">Démonstration Immédiate en 1 clic :</div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={() => onFastLogin('directeur')}
              className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold rounded-lg border border-blue-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Encadrant : Pr. Youssef El Amrani</span>
            </button>

            <button
              onClick={() => onFastLogin('administrateur')}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-700" />
              <span>Admin : Dr. Karim Berrada (CEDoc)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
