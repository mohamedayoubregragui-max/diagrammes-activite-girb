import React from 'react';
import {
  Users,
  ShieldCheck,
  Scale,
  GraduationCap,
  Sparkles,
  ShoppingBag,
  Lock,
  FileCheck,
  UserCheck,
  Building2,
  BookOpen,
  Bell,
  Calendar,
  History,
  CheckCircle2,
  FileText,
  Workflow,
  KeyRound
} from 'lucide-react';

export const GcdMatrixView: React.FC = () => {

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="academic-card p-6 sm:p-8 space-y-3">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-50/80 border border-blue-200/70 text-[#2563EB] text-xs font-semibold">
            <Workflow className="w-3.5 h-3.5" />
            <span>Architecture Système & Spécifications GCD · TP O&M Développement Logiciel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#101B35] tracking-tight">
            Matrice des Acteurs, Rôles, Privilèges et Spécifications
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed font-sans">
            Ce document formalise l'architecture fonctionnelle complète de la plateforme GCD. Il distingue rigoureusement les acteurs opérationnels quotidiens des experts intervenant dans la conception de l'application, détaille le flux opérationnel en 8 étapes et spécifie l'ensemble des modules implémentés.
          </p>
        </div>
      </div>

      {/* 1. Distinction des Acteurs Opérationnels et Profils */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>1. Acteurs Opérationnels de la Plateforme GCD</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Profils utilisateurs intervenant dans la gestion réelle des candidatures doctorales
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            4 Rôles Principaux + 3 Rôles Associés
          </span>
        </div>

        {/* 4 Acteurs Principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Candidat */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5 hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Candidat</div>
                <div className="text-[10px] text-slate-500">Étudiant postulant en doctorat</div>
              </div>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Consulte le catalogue en libre accès, sélectionne jusqu'à 3 sujets dans son panier sans compte, s'authentifie par e-mail académique, dépose ses pièces PDF, suit sa timeline et consulte ses notifications.
            </p>
            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-1 text-[10px] text-slate-500">
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Création dossier</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Dépôt PDF</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Suivi timeline</span>
            </div>
          </div>

          {/* Directeur de Thèse */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5 hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Directeur de Thèse</div>
                <div className="text-[10px] text-slate-500">Enseignant-chercheur habilité</div>
              </div>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Accède aux candidatures affectées à ses sujets, contrôle la validité de chaque document PDF via le lecteur intégré, formule un avis scientifique motivé et transmet le dossier au CEDoc.
            </p>
            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-1 text-[10px] text-slate-500">
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Examen PDF</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Avis scientifique</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Transmission</span>
            </div>
          </div>

          {/* Directeur du CEDoc */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5 hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Directeur du CEDoc</div>
                <div className="text-[10px] text-slate-500">Centre d'Études Doctorales</div>
              </div>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Supervise l'ensemble des centres doctoraux, examine les dossiers transmis avec l'avis des directeurs de thèse, arbitre les candidatures et valide la décision finale d'admission en doctorat.
            </p>
            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-1 text-[10px] text-slate-500">
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Supervision pôle</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Décision finale</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Attribution</span>
            </div>
          </div>

          {/* Administrateur */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5 hover:border-indigo-200 transition-colors">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Administrateur</div>
                <div className="text-[10px] text-slate-500">Pôle doctoral & support technique</div>
              </div>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Gère les utilisateurs du système, attribue plusieurs rôles par profil, configure les privilèges granulaires, active/désactive des comptes et consulte l'historique complet des opérations.
            </p>
            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-1 text-[10px] text-slate-500">
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Gestion multi-rôles</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Privilèges</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200">Traçabilité</span>
            </div>
          </div>
        </div>

        {/* Profils Opérationnels Associés */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <KeyRound className="w-4 h-4 text-indigo-600" />
            <span>Profils Opérationnels Associés & Matrice RBAC du TP</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Enseignant</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Consultation du catalogue de recherche, propositions de thématiques et participation consultative aux commissions de présélection.
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Co-encadrant</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Accès en lecture et annotation conjointe aux candidatures pour lesquelles il est expressément désigné aux côtés du directeur de thèse principal.
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Directeur de Structure</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Validation de la capacité d'accueil et des ressources logistiques/financières du laboratoire ou de l'équipe de recherche de rattachement.
              </p>
            </div>
          </div>
        </div>

        {/* Experts intervenant dans la conception */}
        <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2 text-xs text-slate-700">
          <div className="font-bold text-indigo-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Experts de Conception (Contraintes transversales · sans compte utilisateur dédié)</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Contrairement aux acteurs opérationnels (Étudiant, Directeur de thèse, CEDoc, Admin), les trois experts de conception définissent les exigences globales intégrées dans toute l’application : <strong>Expert en lois / juridique</strong> (sécurité, confidentialité, cloisonnement des dossiers et consentement Loi 09-08), <strong>Expert universitaire</strong> (cohérence administrative, vérification des diplômes, e-mail académique, limite stricte à 3 sujets, séparation exploration publique / soumission officielle), et <strong>Expert UX/UI</strong> (ergonomie, panier accessible sans inscription préalable, fluidité jusqu’à la validation).
          </p>
        </div>
      </div>

      {/* 2. Processus Opérationnel Complet (8 Étapes) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Workflow className="w-5 h-5 text-indigo-600" />
              <span>2. Parcours Opérationnel Complet (8 Étapes de Candidature)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cycle de vie complet d'un dossier depuis la découverte jusqu'à l'inscription définitive
            </p>
          </div>
          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            Flux de bout en bout
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Étape 1 */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 relative overflow-hidden group hover:border-indigo-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-indigo-600 text-[11px]">Étape 01</span>
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="font-bold text-slate-900">Consultation des campagnes</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Exploration publique du catalogue des sujets de recherche par domaine scientifique, mots-clés, laboratoire et directeur.
            </p>
          </div>

          {/* Étape 2 */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 relative overflow-hidden group hover:border-indigo-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-indigo-600 text-[11px]">Étape 02</span>
              <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="font-bold text-slate-900">Panier de sujets de thèse</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Sélection libre de 1 à 3 sujets sans aucune obligation d'inscription préalable, conservés localement dans le navigateur.
            </p>
          </div>

          {/* Étape 3 */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 relative overflow-hidden group hover:border-indigo-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-indigo-600 text-[11px]">Étape 03</span>
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="font-bold text-slate-900">Authentification académique</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Connexion sécurisée via l'e-mail universitaire institutionnel (reconnu, marocain ou international) avec vérification par code requis pour valider le panier.
            </p>
          </div>

          {/* Étape 4 */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 relative overflow-hidden group hover:border-indigo-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-indigo-600 text-[11px]">Étape 04</span>
              <FileCheck className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="font-bold text-slate-900">Constitution & soumission</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Dépôt des véritables fichiers justificatifs PDF (CV, diplômes, notes, projet), vérification de taille et signature Loi 09-08.
            </p>
          </div>

          {/* Étape 5 */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 relative overflow-hidden group hover:border-indigo-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-indigo-600 text-[11px]">Étape 05</span>
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="font-bold text-slate-900">Examen par le directeur</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Consultation des pièces PDF dans le lecteur intégré, validation pièce par pièce, demande éventuelle de complément ou refus.
            </p>
          </div>

          {/* Étape 6 */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 relative overflow-hidden group hover:border-indigo-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-indigo-600 text-[11px]">Étape 06</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="font-bold text-slate-900">Transmission au CEDoc</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Émission de l'avis scientifique motivé (Favorable, Réservé, Défavorable) et transfert électronique du dossier à la direction CEDoc.
            </p>
          </div>

          {/* Étape 7 */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 relative overflow-hidden group hover:border-indigo-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-indigo-600 text-[11px]">Étape 07</span>
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="font-bold text-slate-900">Décision finale CEDoc</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Examen par la commission de sélection doctorale, arbitrage des quotas par laboratoire et validation de la décision d'admission.
            </p>
          </div>

          {/* Étape 8 */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 relative overflow-hidden group hover:border-indigo-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-indigo-600 text-[11px]">Étape 08</span>
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="font-bold text-slate-900">Inscription définitive</div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Délivrance de l'attestation de sélection, affectation au sujet retenu et finalisation administrative de l'inscription en thèse.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Spécifications Détaillées et Exigences (Tableau) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                <span>3. Tableau des Spécifications et Exigences Fonctionnelles (TP O&M)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Correspondance rigoureuse entre acteurs, contraintes, et solutions concrètes implémentées dans GCD
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3.5 px-4 w-44">Exigence / Domaine</th>
                <th className="py-3.5 px-4 w-48">Acteur(s) Concerné(s)</th>
                <th className="py-3.5 px-4 w-60">Rôle dans le Système</th>
                <th className="py-3.5 px-4 w-64">Contraintes & Problématiques</th>
                <th className="py-3.5 px-4">Solution Fonctionnelle Proposée (Implémentée dans GCD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              
              {/* Spécification 1: Gestion des utilisateurs, rôles et privilèges */}
              <tr className="hover:bg-slate-50/70 transition-colors">
                <td className="py-4 px-4 align-top font-bold text-slate-900">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-semibold mb-1">
                    <KeyRound className="w-4 h-4 shrink-0" />
                    <span>Multi-Rôles & RBAC</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-normal">Gestion des utilisateurs, rôles et privilèges</span>
                </td>
                <td className="py-4 px-4 align-top font-semibold text-slate-800">
                  <div>• Administrateur</div>
                  <div className="text-slate-500 font-normal text-[11px]">Directeurs, Candidats, Enseignants</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1">
                  <div>• Créer et administrer les comptes</div>
                  <div>• Attribuer un ou plusieurs rôles par utilisateur</div>
                  <div>• Activer / désactiver des comptes</div>
                  <div>• Configurer les privilèges système</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1 text-slate-600">
                  <div>• Un professeur peut être à la fois <em>Enseignant</em>, <em>Directeur de thèse</em> et <em>Directeur de laboratoire</em>.</div>
                  <div>• Éviter les conflits d'intérêt et sécuriser l'accès aux privilèges sans changer de compte.</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1.5">
                  <div className="font-semibold text-slate-900">Modèle Utilisateur ➔ Rôles ➔ Privilèges :</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Module d'administration dédié (<code className="text-indigo-600 font-mono">UserManagementModal</code>) permettant de cocher plusieurs rôles par utilisateur, d'activer/désactiver les comptes et d'agréger automatiquement les privilèges (consultation, soumission, examen, arbitrage, administration).
                  </p>
                </td>
              </tr>

              {/* Spécification 2: Documents et contrôle de conformité */}
              <tr className="hover:bg-slate-50/70 transition-colors">
                <td className="py-4 px-4 align-top font-bold text-slate-900">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold mb-1">
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>Gestion Documentaire</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-normal">Contrôle de conformité et pièces justificatives PDF</span>
                </td>
                <td className="py-4 px-4 align-top font-semibold text-slate-800">
                  <div>• Candidat</div>
                  <div>• Directeur de thèse</div>
                  <div>• Directeur CEDoc</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1">
                  <div>• <em>Candidat :</em> Dépôt, consultation et remplacement de pièces PDF obligatoires</div>
                  <div>• <em>Directeur :</em> Examen pièce par pièce et vérification de conformité</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1 text-slate-600">
                  <div>• Dépôt de faux diplômes, relevés illisibles ou fichiers non conformes.</div>
                  <div>• Absence d'outils de visualisation rapide sans téléchargement externe risqué.</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1.5">
                  <div className="font-semibold text-slate-900">Lecteur PDF intégré & Dépôt conforme :</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Dépôt de véritables PDF avec nom, taille, date et statut individuel (Validé, Rejeté, En attente). Bouton « Déposer un document », modal de remplacement de fichier, demande explicite de complément avec motif et lecteur PDF intégré (<code className="text-indigo-600 font-mono">PdfViewerModal</code>).
                  </p>
                </td>
              </tr>

              {/* Spécification 3: Gestion des états et transitions */}
              <tr className="hover:bg-slate-50/70 transition-colors">
                <td className="py-4 px-4 align-top font-bold text-slate-900">
                  <div className="flex items-center gap-1.5 text-blue-700 font-semibold mb-1">
                    <Workflow className="w-4 h-4 shrink-0" />
                    <span>États & Transitions</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-normal">Machine à états du dossier de candidature</span>
                </td>
                <td className="py-4 px-4 align-top font-semibold text-slate-800">
                  <div>• Candidat</div>
                  <div>• Directeur de thèse</div>
                  <div>• Directeur CEDoc</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1">
                  <div>• Transitionner le dossier selon le workflow officiel</div>
                  <div>• Verrouiller les modifications après soumission</div>
                  <div>• Restreindre les actions selon le statut en cours</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1 text-slate-600">
                  <div>• Risque de candidatures orphelines ou incohérentes.</div>
                  <div>• Nécessité de formaliser des transitions strictes et unidirectionnelles.</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1.5">
                  <div className="font-semibold text-slate-900">Cycle de vie à 7 états formels :</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px]">En attente</span> ➔ <span className="inline-block px-1.5 py-0.5 rounded bg-blue-100 font-mono text-[10px]">Soumis</span> ➔ <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 font-mono text-[10px]">En examen</span> ➔ <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-100 font-mono text-[10px]">Transmis CEDoc</span> ➔ <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 font-mono text-[10px]">Retenu</span> (ou Rejeté / Complément requis).
                  </p>
                </td>
              </tr>

              {/* Spécification 4: Journalisation et traçabilité des opérations */}
              <tr className="hover:bg-slate-50/70 transition-colors">
                <td className="py-4 px-4 align-top font-bold text-slate-900">
                  <div className="flex items-center gap-1.5 text-purple-700 font-semibold mb-1">
                    <History className="w-4 h-4 shrink-0" />
                    <span>Traçabilité & Audit</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-normal">Journalisation et audit trail des opérations</span>
                </td>
                <td className="py-4 px-4 align-top font-semibold text-slate-800">
                  <div>• Administrateur</div>
                  <div>• Système GCD</div>
                  <div>• Commission CEDoc</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1">
                  <div>• Consigner chaque action avec horodatage</div>
                  <div>• Identifier l'auteur de chaque décision ou changement</div>
                  <div>• Garantir la transparence des arbitrages</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1 text-slate-600">
                  <div>• Risque de contestation de l'évaluation ou de la date de dépôt.</div>
                  <div>• Interdiction absolue d'écraser l'historique lors d'une mise à jour.</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1.5">
                  <div className="font-semibold text-slate-900">Audit trail immuable par dossier :</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Chaque action (dépôt, soumission, consultation de PDF, avis du directeur, décision CEDoc) génère un événement horodaté consigné dans le journal d'historique (<code className="text-indigo-600 font-mono">historyLogs</code>) affiché dans le détail du dossier.
                  </p>
                </td>
              </tr>

              {/* Spécification 5: Calendrier et suivi visuel des candidatures */}
              <tr className="hover:bg-slate-50/70 transition-colors">
                <td className="py-4 px-4 align-top font-bold text-slate-900">
                  <div className="flex items-center gap-1.5 text-amber-700 font-semibold mb-1">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Timeline & Calendrier</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-normal">Chronologie interactive et échéances des campagnes</span>
                </td>
                <td className="py-4 px-4 align-top font-semibold text-slate-800">
                  <div>• Candidat</div>
                  <div>• Directeur de thèse</div>
                  <div>• Pôle doctoral</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1">
                  <div>• Visualiser l'avancement pas à pas</div>
                  <div>• Surveiller les dates limites de dépôt et d'évaluation</div>
                  <div>• Repérer immédiatement l'étape courante</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1 text-slate-600">
                  <div>• Sentiment d'opacité et anxiété du candidat en attente.</div>
                  <div>• Dépassement involontaire des dates limites administratives.</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1.5">
                  <div className="font-semibold text-slate-900">Timeline dynamique à 7 jalons & Calendrier des dates :</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Jauge chronologique mise à jour en temps réel selon le statut réel du dossier (Terminé, En cours, À venir) accompagnée de la boîte « Dates clés de la campagne » affichant les dates limites et les jours restants.
                  </p>
                </td>
              </tr>

              {/* Spécification 6: Notifications informatives et avec action */}
              <tr className="hover:bg-slate-50/70 transition-colors">
                <td className="py-4 px-4 align-top font-bold text-slate-900">
                  <div className="flex items-center gap-1.5 text-rose-700 font-semibold mb-1">
                    <Bell className="w-4 h-4 shrink-0" />
                    <span>Centre de Notifications</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-normal">Alertes informatives et notifications nécessitant action</span>
                </td>
                <td className="py-4 px-4 align-top font-semibold text-slate-800">
                  <div>• Candidat</div>
                  <div>• Directeur de thèse</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1">
                  <div>• Alerter en cas de demande de complément</div>
                  <div>• Signaler le passage à une étape supérieure</div>
                  <div>• Fournir des boutons d'action contextuelle</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1 text-slate-600">
                  <div>• Perte de temps par manque de réactivité lors d'une pièce manquante.</div>
                  <div>• Multiplication d'emails externes non lus.</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1.5">
                  <div className="font-semibold text-slate-900">Flux de notifications avec déclencheurs d'action :</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Centre de notifications dans le tableau de bord avec distinction claire entre notifications informatives et notifications d'action (« Remplacer le document », « Consulter le motif ») avec marquage de lecture et synchronisation instantanée.
                  </p>
                </td>
              </tr>

              {/* Spécification 7: Panier sans compte (Expert UX/UI) */}
              <tr className="hover:bg-slate-50/70 transition-colors">
                <td className="py-4 px-4 align-top font-bold text-slate-900">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-semibold mb-1">
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span>Panier & UX Fluide</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-normal">Exploration publique sans barrière d'entrée</span>
                </td>
                <td className="py-4 px-4 align-top font-semibold text-slate-800">
                  <div>• Candidat (Étudiant)</div>
                  <div className="text-slate-500 font-normal text-[11px]">Expert UX/UI</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1">
                  <div>• Découverte libre du catalogue scientifique</div>
                  <div>• Sélection temporaire de 1 à 3 sujets</div>
                  <div>• Retrait ou confirmation avant soumission</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1 text-slate-600">
                  <div>• Taux d'abandon élevé lorsque l'inscription est exigée dès la recherche initiale.</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1.5">
                  <div className="font-semibold text-slate-900">Panier local en mémoire ➔ Authentification au clic "Valider" :</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Accès direct au catalogue, ajout/retrait instantané avec badge de compteur, et ouverture de l'invite de connexion uniquement lors de la confirmation finale du panier.
                  </p>
                </td>
              </tr>

              {/* Spécification 8: Expert Universitaire (Procédures Administratives) */}
              <tr className="hover:bg-slate-50/70 transition-colors">
                <td className="py-4 px-4 align-top font-bold text-slate-900">
                  <div className="flex items-center gap-1.5 text-blue-700 font-semibold mb-1">
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>Règlement Universitaire</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-normal">Exigence transversale · Expert Universitaire</span>
                </td>
                <td className="py-4 px-4 align-top font-semibold text-slate-800">
                  <div>• Expert Universitaire</div>
                  <div className="text-slate-500 font-normal text-[11px]">CEDoc & Scolarité USMBA</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1">
                  <div>• Séparer l’exploration publique de la soumission officielle</div>
                  <div>• Encadrer l’éligibilité académique et les quotas</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1 text-slate-600">
                  <div>• Candidatures multiples anarchiques ou adresses e-mail personnelles non vérifiées.</div>
                  <div>• Risque d’incohérence entre diplôme déclaré et pièces officielles.</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1.5">
                  <div className="font-semibold text-slate-900">E-mail académique obligatoire, plafond de 3 choix & audit diplômes :</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Limitation stricte à 3 sujets dans le panier et à la soumission, validation stricte de l’adresse académique institutionnelle (<code className="text-indigo-600 font-mono">*.ac.ma</code>, <code className="text-indigo-600 font-mono">*.edu</code>, etc., avec rejet Gmail/Yahoo), et transmission exclusive des dossiers validés vers l’espace Directeur / CEDoc.
                  </p>
                </td>
              </tr>

              {/* Spécification 9: Conformité légale et protection des données (Expert Juridique) */}
              <tr className="hover:bg-slate-50/70 transition-colors">
                <td className="py-4 px-4 align-top font-bold text-slate-900">
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold mb-1">
                    <Scale className="w-4 h-4 shrink-0" />
                    <span>Conformité Légale</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-normal">Protection des données personnelles (Loi 09-08 & RGPD)</span>
                </td>
                <td className="py-4 px-4 align-top font-semibold text-slate-800">
                  <div>• Expert Juridique / Lois</div>
                  <div className="text-slate-500 font-normal text-[11px]">Candidat, CEDoc & CNDP</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1">
                  <div>• Cloisonner l’accès aux données personnelles</div>
                  <div>• Recueillir le consentement exprès avant soumission</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1 text-slate-600">
                  <div>• Exposition de données académiques sensibles à des visiteurs non authentifiés ou à d’autres étudiants.</div>
                </td>
                <td className="py-4 px-4 align-top space-y-1.5">
                  <div className="font-semibold text-slate-900">Cloisonnement strict des dossiers & Consentement Loi 09-08 :</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Accès à « Mon Dossier » strictement filtré par compte authentifié (aucune fuite entre candidats), consentement obligatoire Loi 09-08 dans le formulaire de dépôt, et contrôle des privilèges par rôle (RBAC).
                  </p>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
