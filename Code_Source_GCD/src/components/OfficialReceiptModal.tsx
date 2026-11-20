import React from 'react';
import { ApplicationDossier } from '../types';
import { X, Printer, Download, ShieldCheck, QrCode, CheckCircle2 } from 'lucide-react';

interface OfficialReceiptModalProps {
  dossier: ApplicationDossier | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialReceiptModal: React.FC<OfficialReceiptModalProps> = ({
  dossier,
  isOpen,
  onClose
}) => {
  if (!isOpen || !dossier) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full my-6 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:m-0 print:border-none print:shadow-none print:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar (hidden on print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Document Administratif Officiel · USMBA CEDoc</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div className="p-8 sm:p-10 space-y-8 bg-white text-slate-900 text-xs">
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-900 pb-6 text-center space-y-1">
            <div className="text-[11px] font-serif uppercase tracking-widest text-slate-600">
              Royaume du Maroc · Ministère de l'Enseignement Supérieur et de la Recherche Scientifique
            </div>
            <div className="text-base sm:text-lg font-bold font-serif text-slate-900 uppercase">
              Université Sidi Mohamed Ben Abdellah - Fès
            </div>
            <div className="text-xs font-semibold text-indigo-900">
              Centre d'Études Doctorales (CEDoc) : Sciences et Technologies
            </div>
            <div className="text-[10px] text-slate-500 font-mono pt-1">
              Plateforme GCD · Campagne Doctorale 2026/2027
            </div>
          </div>

          {/* Title Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-300 text-center space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Attestation Numérique de Dépôt
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-tight">
              Récépissé Officiel de Candidature au Doctorat
            </h2>
            <div className="flex items-center justify-center gap-3 font-mono text-[11px] text-slate-600 pt-1">
              <span>Réf : <strong>{dossier.referenceNumber}</strong></span>
              <span>·</span>
              <span>Déposé le {new Date(dossier.submittedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Candidate Identity Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-white">
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Identité de l'Étudiant Candidat
              </div>
              <div>
                <span className="text-slate-500">Nom & Prénom : </span>
                <span className="font-bold text-slate-900">
                  {dossier.student.lastName.toUpperCase()} {dossier.student.firstName}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Identifiant National / CIN : </span>
                <span className="font-mono font-semibold text-slate-800">
                  {dossier.student.cin || dossier.student.cne}
                </span>
              </div>
              <div>
                <span className="text-slate-500">CNE / Code Massar : </span>
                <span className="font-mono font-semibold text-slate-800">
                  {dossier.student.cne}
                </span>
              </div>
              <div>
                <span className="text-slate-500">E-mail Académique : </span>
                <span className="font-mono text-indigo-700 font-medium">
                  {dossier.student.academicEmail}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Cursus & Diplôme Déclaré
              </div>
              <div>
                <span className="text-slate-500">Diplôme : </span>
                <span className="font-semibold text-slate-900">
                  {dossier.student.degreeDeclared}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Établissement : </span>
                <span className="text-slate-800">
                  {dossier.student.currentInstitution} ({dossier.student.graduationYear})
                </span>
              </div>
              <div>
                <span className="text-slate-500">Mention / Moyenne : </span>
                <span className="font-medium text-slate-800">{dossier.student.gpa}</span>
              </div>
              <div>
                <span className="text-slate-500">Conformité Loi 09-08 : </span>
                <span className="text-emerald-700 font-semibold">Consentement Validé</span>
              </div>
            </div>
          </div>

          {/* Selected Topics List */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
              Sujets de Thèse Candidatés (Par ordre strict de priorité) :
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {dossier.selectedTopics.map((top) => (
                <div key={top.topicId} className="p-3 bg-white flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-900 text-white shrink-0">
                      Choix #{top.priority}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        {top.topicTitle}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Direction : <strong>{top.director}</strong> · {top.laboratory}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 shrink-0">
                    {top.topicCode}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Current Status & Certification Footer */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <QrCode className="w-12 h-12 text-slate-800 shrink-0" />
                <div className="text-[10px] text-slate-500 leading-tight">
                  <span className="font-bold text-slate-800 block">Vérification Numérique USMBA</span>
                  Ce récépissé est authentifié par signature électronique sur la chaîne de confiance universitaire.
                  <br />
                  Hash: <span className="font-mono text-slate-700">{dossier.id}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
              <div className="text-[10px] font-bold uppercase text-slate-500">
                Cachet Électronique & Signature
              </div>
              <div className="font-serif font-bold text-indigo-900 text-xs">
                Direction du Pôle des Études Doctorales
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Document Généré & Certifié Conforme</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                Fès, le {new Date().toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions (hidden on print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500">
            Conservez ce document pour les entretiens de sélection.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Fermer le récépissé
          </button>
        </div>
      </div>
    </div>
  );
};
