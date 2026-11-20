import React, { useState, useEffect } from 'react';
import {
  CartItem,
  StudentProfile,
  ApplicationDossier,
  AuthenticatedUser,
  JustificatifDocument,
  DocumentCategory,
  DocumentTechnicalCheck
} from '../types';
import { isAcademicEmail, submitDossier } from '../services/storage';
import { formatFileSize } from '../services/pdfGenerator';
import { savePdfBinary } from '../services/fileStorage';
import {
  DOCUMENT_REQUIREMENTS,
  getMaxPdfSizeMb,
  validateUploadedPdfFile
} from '../services/documentService';
import {
  X,
  Lock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Upload,
  FileText,
  Trash2
} from 'lucide-react';

interface AuthValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  currentUser: AuthenticatedUser | null;
  onSubmissionSuccess: (dossier: ApplicationDossier) => void;
}

interface PendingUploadSlot {
  file?: File;
  technicalCheck?: DocumentTechnicalCheck;
  error?: string;
}

export const AuthValidationModal: React.FC<AuthValidationModalProps> = ({
  isOpen,
  onClose,
  cart,
  currentUser,
  onSubmissionSuccess
}) => {
  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [cin, setCin] = useState(currentUser?.cin || '');
  const [cne, setCne] = useState(currentUser?.cne || '');
  const [academicEmail, setAcademicEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('+212 6 63 45 78 90');
  const [currentInstitution, setCurrentInstitution] = useState(
    currentUser?.institution || 'EST Fès - Université Sidi Mohamed Ben Abdellah'
  );
  const [degreeDeclared, setDegreeDeclared] = useState(
    currentUser?.titleOrDegree || 'Master Recherche en Intelligence Artificielle & Big Data'
  );
  const [graduationYear, setGraduationYear] = useState('2026');
  const [gpa, setGpa] = useState('16.40 / 20 (Mention Très Bien)');
  const [researchProposal, setResearchProposal] = useState('');

  const [uploadSlots, setUploadSlots] = useState<Partial<Record<DocumentCategory, PendingUploadSlot>>>({});
  const [legalConsent, setLegalConsent] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxPdfMb = getMaxPdfSizeMb();

  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName);
      setLastName(currentUser.lastName);
      if (currentUser.cin || currentUser.passportNumber) {
        setCin(currentUser.cin || currentUser.passportNumber || '');
      }
      if (currentUser.cne) setCne(currentUser.cne);
      if (currentUser.email) setAcademicEmail(currentUser.email);
      if (currentUser.institution) setCurrentInstitution(currentUser.institution);
      if (currentUser.titleOrDegree) setDegreeDeclared(currentUser.titleOrDegree);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleQuickFill = () => {
    setFirstName('Ayoub');
    setLastName('Regragui');
    setCin('CD712894');
    setCne('N139820412');
    setAcademicEmail('ayoub.regragui@usmba.ac.ma');
    setPhone('+212 6 63 45 78 90');
    setCurrentInstitution('École Supérieure de Technologie de Fès (EST Fès)');
    setDegreeDeclared('Diplôme d’Ingénieur d’État en Génie Logiciel & Systèmes Intelligents');
    setGraduationYear('2026');
    setGpa('16.80 / 20 (Mention Très Bien - Major de promotion)');
    setResearchProposal(
      'Étude et conception d’architectures hybrides d’apprentissage profond et systèmes multi-agents pour l’analyse prédictive à grande échelle.'
    );
    setLegalConsent(true);
    setErrorMsg(null);
  };

  const emailIsValid = isAcademicEmail(academicEmail);

  const handleFileSelected = async (category: DocumentCategory, file: File | undefined) => {
    if (!file) return;
    const validation = await validateUploadedPdfFile(file);
    if (!validation.valid) {
      setUploadSlots((prev) => ({
        ...prev,
        [category]: {
          file: undefined,
          technicalCheck: validation.technicalCheck,
          error: validation.errorMessage
        }
      }));
      setErrorMsg(validation.errorMessage || 'Fichier PDF invalide.');
      return;
    }

    setErrorMsg(null);
    setUploadSlots((prev) => ({
      ...prev,
      [category]: {
        file,
        technicalCheck: validation.technicalCheck,
        error: undefined
      }
    }));
  };

  const handleClearFile = (category: DocumentCategory) => {
    setUploadSlots((prev) => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentUser) {
      setErrorMsg('Authentification étudiante requise avant toute soumission officielle.');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('Veuillez renseigner votre nom et prénom.');
      return;
    }
    if (!cne.trim()) {
      setErrorMsg('Le CNE / Code Massar est requis pour identifier votre dossier universitaire.');
      return;
    }
    if (!academicEmail.trim()) {
      setErrorMsg('Veuillez renseigner votre e-mail académique.');
      return;
    }
    if (!emailIsValid) {
      setErrorMsg(
        'E-mail non académique : La soumission officielle requiert une adresse académique institutionnelle valide (ex: @usmba.ac.ma, @um5.ac.ma, @uca.ac.ma, *.ac.ma, *.edu).'
      );
      return;
    }
    if (!legalConsent) {
      setErrorMsg(
        'Vous devez obligatoirement certifier l’authenticité des diplômes déclarés et consentir au traitement de vos données.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const nowIso = new Date().toISOString();
      const docs: JustificatifDocument[] = [];

      for (let i = 0; i < DOCUMENT_REQUIREMENTS.length; i++) {
        const spec = DOCUMENT_REQUIREMENTS[i];
        const slot = uploadSlots[spec.category];
        if (!slot?.file) continue;

        const docId = `doc-${spec.category}-${Date.now()}-${i + 1}`;
        const storageKey = `pdf-${docId}-v1`;
        await savePdfBinary(storageKey, slot.file);
        const sizeStr = formatFileSize(slot.file.size);

        docs.push({
          id: docId,
          category: spec.category,
          label: spec.label,
          description: spec.description,
          required: spec.required,
          fileName: slot.file.name,
          fileType: 'application/pdf',
          fileSize: sizeStr,
          uploadDate: nowIso,
          storageKey,
          status: 'en_attente_verification',
          version: 1,
          technicalCheck: slot.technicalCheck
        });
      }

      const student: StudentProfile = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        cin: cin.trim().toUpperCase(),
        cne: cne.trim(),
        academicEmail: academicEmail.trim().toLowerCase(),
        phone: phone.trim(),
        currentInstitution: currentInstitution.trim(),
        degreeDeclared: degreeDeclared.trim(),
        graduationYear: graduationYear.trim(),
        gpa: gpa.trim(),
        researchProposal: researchProposal.trim() || undefined,
        documents: {
          diplomaName: uploadSlots.diplome?.file?.name || '',
          transcriptName: uploadSlots.releve_notes?.file?.name || '',
          cvName: uploadSlots.cv?.file?.name || '',
          researchProjectName: uploadSlots.projet_recherche?.file?.name || undefined
        },
        legalConsent
      };

      const result = submitDossier(student, cart, docs);
      setIsSubmitting(false);

      if (result.success && result.dossier) {
        onSubmissionSuccess(result.dossier);
      } else {
        setErrorMsg(result.message);
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setErrorMsg('Erreur technique lors de la lecture des fichiers PDF.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full my-6 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Phase de Validation Officielle</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Authentification Institutionnelle & Dépôt du Dossier
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Conformément au système GCD, vos {cart.length} choix provisoires vont être certifiés et transmis aux directeurs de thèse.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity Verified Badge if connected */}
        {currentUser?.email && (
          <div className="px-5 py-2.5 bg-teal-50 border-b border-teal-200 flex items-center justify-between text-xs text-teal-950">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
              <span>
                E-mail académique vérifié : <strong>{currentUser.email}</strong>
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#0D9488] text-white font-mono text-[10px] font-bold">
              Compte Actif
            </span>
          </div>
        )}

        {/* Selected topics recap */}
        <div className="px-5 py-3 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="font-medium text-indigo-900">
            Sujets à valider ({cart.length} / 3) :
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {cart.map((item) => (
              <span
                key={item.topic.id}
                className="px-2 py-0.5 font-mono text-[11px] bg-white text-indigo-700 border border-indigo-200 rounded font-semibold"
              >
                P{item.priority}: {item.topic.code}
              </span>
            ))}
          </div>
        </div>

        {/* Quick fill button */}
        {!currentUser && (
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">Démonstration & Test rapide :</span>
            <button
              type="button"
              onClick={handleQuickFill}
              className="flex items-center gap-1.5 px-3 py-1 font-medium text-indigo-700 bg-white border border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Remplir profil test (@usmba.ac.ma)</span>
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto max-h-[75vh] space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Identity Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prénom *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ex: Mohamed"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom de famille *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ex: Bennani"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                N° CIN ou Passeport
              </label>
              <input
                type="text"
                value={cin}
                onChange={(e) => setCin(e.target.value)}
                placeholder="Ex: CD712894"
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CNE / Code Massar *
              </label>
              <input
                type="text"
                required
                value={cne}
                onChange={(e) => setCne(e.target.value)}
                placeholder="Ex: N132049182"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+212 6 XX XX XX XX"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* Academic Email */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                E-mail Académique Institutionnel *
              </label>
              <span className="text-[11px] text-indigo-700 font-medium">
                Requis pour débloquer la validation
              </span>
            </div>
            <input
              type="email"
              required
              value={academicEmail}
              onChange={(e) => setAcademicEmail(e.target.value)}
              placeholder="etudiant@usmba.ac.ma ou prenom.nom@univ.ac.ma"
              className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                academicEmail
                  ? emailIsValid
                    ? 'border-emerald-400 focus:ring-emerald-500'
                    : 'border-red-400 focus:ring-red-500'
                  : 'border-slate-300 focus:ring-indigo-500'
              }`}
            />
            {academicEmail && (
              <div className="mt-1 text-[11px]">
                {emailIsValid ? (
                  <span className="text-emerald-700 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Adresse académique vérifiée et éligible au dépôt officiel.
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Adresse non académique. Domaines acceptés : universités marocaines et étrangères (@usmba.ac.ma, @um5.ac.ma, @uca.ac.ma, *.ac.ma, *.edu).
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Academic background & diplomas */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="text-xs font-semibold text-slate-900">
              Déclaration Administrative des Diplômes
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Établissement d'origine
                </label>
                <input
                  type="text"
                  value={currentInstitution}
                  onChange={(e) => setCurrentInstitution(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Diplôme déclaré (Master ou Ingénieur)
                </label>
                <input
                  type="text"
                  value={degreeDeclared}
                  onChange={(e) => setDegreeDeclared(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Année d'obtention
                </label>
                <input
                  type="text"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Moyenne générale & Mention
                </label>
                <input
                  type="text"
                  value={gpa}
                  onChange={(e) => setGpa(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Résumé du projet de recherche & motivation (optionnel)
              </label>
              <textarea
                rows={2}
                value={researchProposal}
                onChange={(e) => setResearchProposal(e.target.value)}
                placeholder="Présentez brièvement votre thématique de recherche, vos compétences méthodologiques et vos motivations pour le(s) sujet(s) sélectionné(s)..."
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Real PDF Upload Catalog */}
            <div className="pt-3 border-t border-slate-200 text-xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-900">
                  Dépôt des pièces justificatives PDF (optionnel pour la démonstration)
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Format .pdf · Max {maxPdfMb} Mo · Contrôle technique automatique
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DOCUMENT_REQUIREMENTS.map((spec) => {
                  const slot = uploadSlots[spec.category];
                  const hasFile = Boolean(slot?.file);

                  return (
                    <div
                      key={spec.category}
                      className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                        slot?.error
                          ? 'bg-red-50/50 border-red-300'
                          : hasFile
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate">{spec.label}</span>
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                              spec.required
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {spec.required ? 'Optionnel (Démo)' : 'Facultatif'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                          {spec.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <label className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-indigo-700 border border-slate-300 rounded-lg text-[11px] cursor-pointer transition-colors min-w-0">
                          <Upload className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate font-medium">
                            {slot?.file
                              ? `${slot.file.name} (${formatFileSize(slot.file.size)})`
                              : 'Sélectionner un fichier PDF...'}
                          </span>
                          <input
                            type="file"
                            accept="application/pdf,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              handleFileSelected(spec.category, file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        {hasFile && (
                          <button
                            type="button"
                            onClick={() => handleClearFile(spec.category)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Retirer le fichier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {slot?.error ? (
                        <div className="text-[10px] text-red-700 font-medium">
                          {slot.error}
                        </div>
                      ) : hasFile && slot?.technicalCheck ? (
                        <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">Contrôle technique OK · Non déposé -&gt; Prêt</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic">
                          Statut actuel : Non déposé
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legal and GDPR compliance checkbox */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                required
                checked={legalConsent}
                onChange={(e) => setLegalConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="leading-snug">
                <strong>Engagement sur l'honneur & Protection des données :</strong> Je certifie l'authenticité de l'ensemble des diplômes déclarés et consens au traitement de mes informations par les directeurs de thèse et commissions doctorales de l'USMBA conformément à la loi 09-08.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !emailIsValid || !legalConsent}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Certification en cours...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirmer & Valider mes choix officiels</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
