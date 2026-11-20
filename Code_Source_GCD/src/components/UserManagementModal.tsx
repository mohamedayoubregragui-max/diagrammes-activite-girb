import React, { useState, useEffect } from 'react';
import { AuthenticatedUser, UserRole } from '../types';
import {
  getRegisteredUsers,
  saveRegisteredUser,
  saveStoredUser,
  getPrivilegesForRoles,
  hasPrivilege
} from '../services/storage';
import {
  ShieldCheck,
  UserCog,
  CheckCircle2,
  Search,
  Lock,
  Unlock,
  AlertCircle,
  X
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthenticatedUser | null;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  if (!isOpen) return null;

  const [users, setUsers] = useState<AuthenticatedUser[]>(() => getRegisteredUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<AuthenticatedUser | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUsers(getRegisteredUsers());
      setErrorMsg(null);
    }
  }, [isOpen]);

  // Strict RBAC: only users with manage_users privilege (Administrateur) may edit roles or account status
  const isAdmin = hasPrivilege(currentUser, 'manage_users');

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.institution?.toLowerCase().includes(q)
    );
  });

  const availableRoles: Array<{ id: UserRole; label: string; description: string }> = [
    { id: 'candidat', label: 'Candidat', description: 'Crée et suit ses candidatures doctorales.' },
    { id: 'enseignant', label: 'Enseignant', description: 'Enseignant universitaire rattaché.' },
    { id: 'directeur', label: 'Directeur de thèse', description: 'Examine les dossiers et émet les avis scientifiques.' },
    { id: 'co_encadrant', label: 'Co-encadrant', description: 'Consulte les dossiers auxquels il participe.' },
    { id: 'directeur_structure', label: 'Directeur de structure de recherche', description: 'Supervise les laboratoires et équipes.' },
    { id: 'directeur_cedoc', label: 'Directeur du CEDoc', description: 'Supervise l’ensemble des centres et valide les flux.' },
    { id: 'administrateur', label: 'Administrateur', description: 'Gère les utilisateurs, rôles et paramètres globaux.' }
  ];

  const handleToggleRoleForEditingUser = (roleId: UserRole) => {
    if (!editingUser || !isAdmin) return;
    setErrorMsg(null);
    const currentRoles = editingUser.roles || [editingUser.role];
    let updatedRoles: UserRole[];

    if (currentRoles.includes(roleId)) {
      if (currentRoles.length === 1) {
        setErrorMsg('Un utilisateur doit conserver au moins un rôle actif.');
        return;
      }
      updatedRoles = currentRoles.filter((r) => r !== roleId);
    } else {
      updatedRoles = [...currentRoles, roleId];
    }

    const updatedPrivileges = getPrivilegesForRoles(updatedRoles);
    setEditingUser({
      ...editingUser,
      role: updatedRoles[0], // primary role
      roles: updatedRoles,
      privileges: updatedPrivileges
    });
  };

  const handleToggleActiveStatus = (userId: string) => {
    if (!isAdmin) {
      setErrorMsg('Action refusée : seul l’Administrateur (privilège manage_users) peut activer ou désactiver un compte.');
      return;
    }
    const updated = users.map((u) => {
      if (u.id === userId) {
        const nextActive = u.isActive === false ? true : false;
        const modified = { ...u, isActive: nextActive };
        saveRegisteredUser(modified);
        if (currentUser && modified.id === currentUser.id) {
          saveStoredUser(modified);
        }
        return modified;
      }
      return u;
    });
    setUsers(updated);
    window.dispatchEvent(new CustomEvent('gcd_platform_updated'));
    setSuccessMsg('Statut du compte mis à jour avec succès.');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleSaveEditedUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !isAdmin) return;

    saveRegisteredUser(editingUser);
    if (currentUser && editingUser.id === currentUser.id) {
      saveStoredUser(editingUser);
    }
    setUsers(getRegisteredUsers());
    window.dispatchEvent(new CustomEvent('gcd_platform_updated'));
    setEditingUser(null);
    setErrorMsg(null);
    setSuccessMsg('Rôles et privilèges mis à jour avec succès.');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full my-6 flex flex-col overflow-hidden animate-in fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Administration Sécurisée GCD
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Gestion des Utilisateurs, Rôles Multiples & Privilèges
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success alert */}
        {successMsg && (
          <div className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error alert */}
        {errorMsg && (
          <div className="px-6 py-2.5 bg-red-600 text-white text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Access Warning if not admin */}
        {!isAdmin && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Consultation restreinte (Lecture seule) :</strong> Vous êtes connecté en tant que {currentUser ? `${currentUser.firstName} ${currentUser.lastName} (${currentUser.role})` : 'Visiteur'}. Seul le profil <strong>Administrateur</strong> (privilège <code className="font-mono">manage_users</code>) peut modifier les rôles ou activer/désactiver un compte.
            </span>
          </div>
        )}

        {/* Search & Stats Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="text-xs text-slate-600 font-medium">
            Total utilisateurs enregistrés : <strong className="text-slate-900">{users.length}</strong>
          </div>
        </div>

        {/* Users Table */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[55vh] space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Utilisateur</th>
                  <th className="py-3 px-4">E-mail Académique</th>
                  <th className="py-3 px-4">Rôles Multiples Attribués</th>
                  <th className="py-3 px-4">Statut Compte</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((u) => {
                  const userRoles = u.roles || [u.role];
                  const isUserActive = u.isActive !== false;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {u.lastName.toUpperCase()} {u.firstName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          {u.institution || 'USMBA'} · {u.titleOrDegree || 'Membre'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-indigo-700 font-medium">
                        {u.email}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          {userRoles.map((r) => (
                            <span
                              key={r}
                              className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isUserActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Unlock className="w-3 h-3 text-emerald-600" />
                            <span>Actif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-800 border border-red-200">
                            <Lock className="w-3 h-3 text-red-600" />
                            <span>Désactivé</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          type="button"
                          disabled={!isAdmin}
                          onClick={() => {
                            if (isAdmin) setEditingUser(u);
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          Modifier Rôles
                        </button>

                        <button
                          type="button"
                          disabled={!isAdmin}
                          onClick={() => handleToggleActiveStatus(u.id)}
                          className={`px-3 py-1.5 font-semibold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            isUserActive
                              ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isUserActive ? 'Désactiver' : 'Activer'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Sécurité Backend & Contrôle des Privilèges actifs sur tous les flux de données.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Fermer l'administration
          </button>
        </div>
      </div>

      {/* EDIT USER ROLES MODAL SUB-VIEW */}
      {editingUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Gestion des Rôles & Privilèges pour : {editingUser.firstName} {editingUser.lastName}
                </h3>
                <div className="text-xs font-mono text-slate-500 mt-0.5">{editingUser.email}</div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedUser} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Attribuer un ou plusieurs rôles (Cochez pour ajouter) :
                </label>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {availableRoles.map((role) => {
                    const currentRoles = editingUser.roles || [editingUser.role];
                    const isChecked = currentRoles.includes(role.id);

                    return (
                      <label
                        key={role.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-400/20'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRoleForEditingUser(role.id)}
                          className="mt-1 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-xs capitalize">
                            {role.label}
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            {role.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Display derived privileges */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Privilèges système découlant des rôles sélectionnés ({editingUser.privileges?.length || 0}) :
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {editingUser.privileges?.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer"
                >
                  Enregistrer les rôles
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
