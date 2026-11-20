import React, { useState, useRef, useEffect } from 'react';
import {
  ConfirmedIdentityData,
  IdentityDocumentType,
  IdentityOcrExtractionResult,
  OcrExtractedField
} from '../types';
import {
  extractIdentityFromDocument,
  OcrProgressUpdate
} from '../services/ocrService';
import {
  Upload,
  FileText,
  CreditCard,
  Globe,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  RefreshCw,
  ArrowRight,
  Lock,
  Eye
} from 'lucide-react';

interface OcrIdentityStepProps {
  initialData?: ConfirmedIdentityData | null;
  onConfirmAndContinue: (data: ConfirmedIdentityData) => void;
  onSkipManual: () => void;
}

type UploadMethodOption = 'cin_image' | 'pdf_doc' | 'passport_foreign';
type UiStep = 1 | 2 | 3;

function renderFieldConfidenceBadge(field: OcrExtractedField | undefined, currentValue: string) {
  if (!field || field.source === 'none') {
    if (currentValue.trim()) {
      return (
        <span className="text-[11px] font-medium text-blue-700">
          Saisi manuellement
        </span>
      );
    }
    return (
      <span className="text-[11px] text-slate-400">
        Non détecté — à compléter
      </span>
    );
  }

  if (field.uncertain) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
        <AlertTriangle className="w-3 h-3 shrink-0" />
        <span>Incertain ({field.confidence} %) · À vérifier</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
      <CheckCircle2 className="w-3 h-3 shrink-0" />
      <span>
        {field.source === 'mrz' ? 'MRZ' : 'OCR'} {field.confidence} %
      </span>
    </span>
  );
}

export const OcrIdentityStep: React.FC<OcrIdentityStepProps> = ({
  initialData,
  onConfirmAndContinue,
  onSkipManual
}) => {
  const [uiStep, setUiStep] = useState<UiStep>(initialData ? 3 : 1);
  const [uploadMethod, setUploadMethod] = useState<UploadMethodOption>(
    initialData?.documentType === 'passeport' ? 'passport_foreign' : 'cin_image'
  );
  const [documentType, setDocumentType] = useState<IdentityDocumentType>(
    initialData?.documentType || 'cin_maroc'
  );

  // Privacy consent
  const [privacyConsent, setPrivacyConsent] = useState<boolean>(true);

  // Drag & Drop + File input
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Processing state
  const [progress, setProgress] = useState<OcrProgressUpdate>({
    percent: 0,
    stageLabel: 'Initialisation...'
  });
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Local temporary preview URL (never persisted, revoked on reset/confirm/unmount)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileKind, setPreviewFileKind] = useState<'image' | 'pdf'>('image');
  const [previewPageCount, setPreviewPageCount] = useState<number>(1);
  const [extractionResult, setExtractionResult] = useState<IdentityOcrExtractionResult | null>(null);

  // Editable confirmed fields
  const [lastName, setLastName] = useState(initialData?.lastName || '');
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  const [birthDate, setBirthDate] = useState(initialData?.birthDate || '');
  const [birthPlace, setBirthPlace] = useState(initialData?.birthPlace || '');
  const [documentNumber, setDocumentNumber] = useState(initialData?.documentNumber || '');
  const [nationality, setNationality] = useState(initialData?.nationality || '');
  const [expiryDate, setExpiryDate] = useState(initialData?.expiryDate || '');
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  const previewUrlRef = useRef<string | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const activeRunIdRef = useRef<number>(0);

  const clearTemporaryPreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      activeRunIdRef.current += 1;
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const handleSelectMethod = (method: UploadMethodOption) => {
    setUploadMethod(method);
    setOcrError(null);
    if (method === 'cin_image') {
      setDocumentType('cin_maroc');
    } else if (method === 'passport_foreign') {
      setDocumentType('passeport');
    }
  };

  const handleProcessFile = async (file: File | undefined) => {
    if (!file) return;

    if (!privacyConsent) {
      setOcrError(
        'Veuillez confirmer votre consentement au traitement local temporaire avant d’analyser votre document.'
      );
      return;
    }

    clearTemporaryPreview();
    setOcrError(null);
    setFormValidationError(null);
    setExtractionResult(null);
    setUiStep(2);
    setProgress({ percent: 5, stageLabel: 'Préparation sécurisée du document...' });

    const runId = ++activeRunIdRef.current;

    try {
      const output = await extractIdentityFromDocument(file, documentType, (upd) => {
        if (isMountedRef.current && activeRunIdRef.current === runId) {
          setProgress(upd);
        }
      });

      if (!isMountedRef.current || activeRunIdRef.current !== runId) {
        if (output.previewObjectUrl) {
          URL.revokeObjectURL(output.previewObjectUrl);
        }
        return;
      }

      previewUrlRef.current = output.previewObjectUrl;
      setPreviewUrl(output.previewObjectUrl);
      setPreviewFileKind(output.fileKind);
      setPreviewPageCount(output.pageCount);
      setExtractionResult(output.extraction);

      const f = output.extraction.fields;
      setLastName(f.lastName.value);
      setFirstName(f.firstName.value);
      setBirthDate(f.birthDate.value);
      setBirthPlace(f.birthPlace.value);
      setDocumentNumber(f.documentNumber.value);
      setNationality(f.nationality.value);
      setExpiryDate(f.expiryDate.value);

      setUiStep(3);
    } catch (err) {
      if (!isMountedRef.current || activeRunIdRef.current !== runId) return;
      const msg =
        err instanceof Error
          ? err.message
          : 'L’extraction OCR a échoué. Vous pouvez réessayer avec un document plus net ou saisir manuellement.';
      setOcrError(msg);
      setUiStep(1);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancelProcessing = () => {
    activeRunIdRef.current += 1;
    clearTemporaryPreview();
    setOcrError(null);
    setUiStep(1);
  };

  const handleResetToStep1 = () => {
    clearTemporaryPreview();
    setExtractionResult(null);
    setOcrError(null);
    setFormValidationError(null);
    setUiStep(1);
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);

    if (!lastName.trim() || !firstName.trim()) {
      setFormValidationError(
        'Le nom et le prénom sont obligatoires. Veuillez vérifier ou compléter ces champs avant de continuer.'
      );
      return;
    }

    if (birthDate && expiryDate && expiryDate <= birthDate) {
      setFormValidationError(
        'La date d’expiration ne peut pas être antérieure à la date de naissance. Veuillez corriger les dates.'
      );
      return;
    }

    // Securely purge temporary local preview URL before leaving this step
    clearTemporaryPreview();

    onConfirmAndContinue({
      documentType,
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      birthDate: birthDate.trim(),
      birthPlace: birthPlace.trim(),
      documentNumber: documentNumber.trim().toUpperCase(),
      nationality: nationality.trim(),
      expiryDate: expiryDate.trim(),
      ocrAssisted: Boolean(extractionResult && extractionResult.extractedFieldCount > 0)
    });
  };

  const acceptAttr =
    uploadMethod === 'cin_image'
      ? '.jpg,.jpeg,.png,image/jpeg,image/png'
      : uploadMethod === 'pdf_doc'
      ? '.pdf,application/pdf'
      : '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf';

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm sm:text-base font-bold text-[#101B35]">
            Vérification et extraction des informations par OCR
          </h3>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0D9488]">
            <Lock className="w-3.5 h-3.5" />
            <span>Traitement local sécurisé</span>
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Déposez votre CIN ou votre passeport pour préremplir automatiquement votre formulaire d’inscription. Vous gardez le contrôle total pour vérifier et corriger chaque champ.
        </p>
      </div>

      {/* 3-Step Visual Progress Bar */}
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        {[
          { num: 1 as UiStep, label: '1. Déposer le document' },
          { num: 2 as UiStep, label: '2. Extraction OCR' },
          { num: 3 as UiStep, label: '3. Vérifier & confirmer' }
        ].map((step) => {
          const isCurrent = uiStep === step.num;
          const isDone = uiStep > step.num;
          return (
            <div
              key={step.num}
              className={`px-2.5 py-2 rounded-xl border font-semibold text-center transition-colors ${
                isCurrent
                  ? 'bg-blue-50 border-blue-300 text-[#2563EB]'
                  : isDone
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              {step.label}
            </div>
          );
        })}
      </div>

      {/* Error Alert */}
      {ocrError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">Impossible d’analyser ce document</div>
              <p className="leading-relaxed">{ocrError}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pl-6 flex-wrap">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-semibold text-red-700 hover:underline cursor-pointer"
            >
              Déposer un autre document
            </button>
            <span className="text-red-300">·</span>
            <button
              type="button"
              onClick={() => {
                clearTemporaryPreview();
                onSkipManual();
              }}
              className="font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              Continuer manuellement →
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 1: DOCUMENT UPLOAD                                             */}
      {/* =================================================================== */}
      {uiStep === 1 && (
        <div className="space-y-4">
          {/* Document Source Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <button
              type="button"
              onClick={() => handleSelectMethod('cin_image')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                uploadMethod === 'cin_image'
                  ? 'bg-blue-50/70 border-[#2563EB] text-[#101B35] ring-1 ring-[#2563EB]/30'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <CreditCard
                className={`w-4 h-4 ${
                  uploadMethod === 'cin_image' ? 'text-[#2563EB]' : 'text-slate-500'
                }`}
              />
              <span className="font-bold leading-snug">
                Télécharger une image de la CIN
              </span>
              <span className="text-[11px] text-slate-500">JPG, JPEG ou PNG</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMethod('pdf_doc')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                uploadMethod === 'pdf_doc'
                  ? 'bg-blue-50/70 border-[#2563EB] text-[#101B35] ring-1 ring-[#2563EB]/30'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <FileText
                className={`w-4 h-4 ${
                  uploadMethod === 'pdf_doc' ? 'text-[#2563EB]' : 'text-slate-500'
                }`}
              />
              <span className="font-bold leading-snug">
                Télécharger un PDF d’identité
              </span>
              <span className="text-[11px] text-slate-500">CIN ou Passeport (.pdf)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectMethod('passport_foreign')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                uploadMethod === 'passport_foreign'
                  ? 'bg-blue-50/70 border-[#2563EB] text-[#101B35] ring-1 ring-[#2563EB]/30'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <Globe
                className={`w-4 h-4 ${
                  uploadMethod === 'passport_foreign' ? 'text-[#2563EB]' : 'text-slate-500'
                }`}
              />
              <span className="font-bold leading-snug">
                Passeport (candidat étranger)
              </span>
              <span className="text-[11px] text-slate-500">Image ou PDF avec zone MRZ</span>
            </button>
          </div>

          {/* Sub-selector when PDF option is chosen */}
          {uploadMethod === 'pdf_doc' && (
            <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex-wrap">
              <span className="font-semibold text-slate-700">Type de document contenu dans le PDF :</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDocumentType('cin_maroc')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    documentType === 'cin_maroc'
                      ? 'bg-[#101B35] text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  CIN marocaine
                </button>
                <button
                  type="button"
                  onClick={() => setDocumentType('passeport')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    documentType === 'passeport'
                      ? 'bg-[#101B35] text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Passeport
                </button>
              </div>
            </div>
          )}

          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              void handleProcessFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer space-y-2.5 ${
              isDragging
                ? 'border-[#2563EB] bg-blue-50/70'
                : 'border-slate-300 bg-slate-50/60 hover:border-[#2563EB]/70 hover:bg-blue-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptAttr}
              className="hidden"
              onChange={(e) => void handleProcessFile(e.target.files?.[0])}
            />
            <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-[#2563EB] flex items-center justify-center mx-auto shadow-2xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-[#101B35]">
                Déposez votre {documentType === 'passeport' ? 'passeport' : 'CIN'} ici ou cliquez pour parcourir
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Formats acceptés : <strong>JPG, JPEG, PNG, PDF</strong> (max. 15 Mo)
              </p>
            </div>
          </div>

          {/* Document Quality Checklist */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Critères recommandés pour une lecture fiable :</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600 pt-0.5">
              <span>· Image nette</span>
              <span>· Document complet</span>
              <span>· Texte lisible</span>
              <span>· Éviter les reflets et les images floues</span>
            </div>
          </div>

          {/* Privacy & Consent Notice */}
          <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/80 text-xs space-y-2">
            <div className="flex items-start gap-2 text-teal-950">
              <ShieldCheck className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>Confidentialité & protection des données :</strong> votre document est analysé{' '}
                <strong>exclusivement dans votre navigateur</strong> (aucun envoi vers des serveurs externes, aucun entraînement de modèle). L’aperçu temporaire est supprimé immédiatement après confirmation et aucun numéro d’identité n’est journalisé.
              </div>
            </div>
            <label className="flex items-start gap-2 cursor-pointer text-[11px] font-medium text-teal-950 pl-6 select-none">
              <input
                type="checkbox"
                checked={privacyConsent}
                onChange={(e) => setPrivacyConsent(e.target.checked)}
                className="mt-0.5 rounded border-teal-400 text-[#0D9488] focus:ring-[#0D9488] cursor-pointer"
              />
              <span>
                J’accepte l’extraction locale temporaire de ce document uniquement pour préremplir mon formulaire d’inscription.
              </span>
            </label>
          </div>

          {/* Manual Fallback Action */}
          <div className="pt-1 flex items-center justify-between text-xs border-t border-slate-100">
            <span className="text-slate-500 text-[11px]">
              Vous préférez ne pas utiliser l’OCR ?
            </span>
            <button
              type="button"
              onClick={() => {
                clearTemporaryPreview();
                onSkipManual();
              }}
              className="font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              Saisir manuellement sans document →
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 2: AUTOMATIC OCR PROCESSING                                    */}
      {/* =================================================================== */}
      {uiStep === 2 && (
        <div className="py-8 px-4 rounded-2xl border border-slate-200 bg-slate-50/60 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center justify-center mx-auto">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>

          <div className="space-y-1 max-w-sm mx-auto">
            <div className="text-sm font-bold text-[#101B35]">
              Extraction automatique des informations
            </div>
            <p className="text-xs text-slate-600">{progress.stageLabel}</p>
          </div>

          {/* Discreet Progress Bar */}
          <div className="max-w-xs mx-auto space-y-1.5">
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-[#2563EB] transition-all duration-200"
                style={{ width: `${Math.max(8, progress.percent)}%` }}
              />
            </div>
            <div className="text-[11px] font-mono text-slate-500 tabular-nums">
              {progress.percent} % · Traitement local sécurisé
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3 text-xs">
            <button
              type="button"
              onClick={handleCancelProcessing}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-semibold cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                handleCancelProcessing();
                onSkipManual();
              }}
              className="text-[#2563EB] font-semibold hover:underline cursor-pointer"
            >
              Continuer manuellement →
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 3: VERIFICATION, EDITING & CONFIRMATION                        */}
      {/* =================================================================== */}
      {uiStep === 3 && (
        <form onSubmit={handleConfirm} className="space-y-4">
          {/* Quality or Extraction Warnings */}
          {extractionResult &&
            (extractionResult.qualityWarnings.length > 0 ||
              extractionResult.inconsistencyWarnings.length > 0) && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Points de vigilance détectés lors de l’analyse</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px] leading-relaxed">
                  {[
                    ...extractionResult.qualityWarnings,
                    ...extractionResult.inconsistencyWarnings
                  ].map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

          {formValidationError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{formValidationError}</span>
            </div>
          )}

          {/* Secure Preview + Extracted Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
            {/* Local Secure Document Preview */}
            <div className="md:col-span-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                <span>
                  Aperçu privé ({previewFileKind === 'pdf' ? `PDF · ${previewPageCount} p.` : 'Image'})
                </span>
                {extractionResult && extractionResult.overallConfidence > 0 && (
                  <span className="font-mono text-slate-500">
                    Indice global : {extractionResult.overallConfidence} %
                  </span>
                )}
              </div>

              {previewUrl ? (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white max-h-48 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Aperçu confidentiel du document d'identité"
                    className="max-h-48 w-full object-contain"
                  />
                </div>
              ) : (
                <div className="h-32 rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-[11px] text-slate-400 px-3 text-center">
                  <FileText className="w-5 h-5 mb-1 text-slate-400" />
                  <span>Aucun fichier actif (saisie directe)</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleResetToStep1}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Nouveau document</span>
                </button>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={clearTemporaryPreview}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Purger l’aperçu</span>
                  </button>
                )}
              </div>
            </div>

            {/* Editable Identity Fields */}
            <div className="md:col-span-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100">
                <span className="font-bold text-[#101B35]">
                  Données extraites (modifiables)
                </span>
                <span className="text-[11px] text-slate-500">
                  {documentType === 'passeport' ? 'Passeport' : 'CIN marocaine'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <label className="font-semibold text-slate-700">Nom *</label>
                    {renderFieldConfidenceBadge(extractionResult?.fields.lastName, lastName)}
                  </div>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ex: BENNANI"
                    className={`w-full px-3 py-2 border rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                      extractionResult?.fields.lastName.uncertain
                        ? 'border-amber-400 bg-amber-50/30'
                        : 'border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <label className="font-semibold text-slate-700">Prénom *</label>
                    {renderFieldConfidenceBadge(extractionResult?.fields.firstName, firstName)}
                  </div>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex: Salma"
                    className={`w-full px-3 py-2 border rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                      extractionResult?.fields.firstName.uncertain
                        ? 'border-amber-400 bg-amber-50/30'
                        : 'border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <label className="font-semibold text-slate-700">
                      {documentType === 'passeport' ? 'N° Passeport' : 'N° CIN / Passeport'}
                    </label>
                    {renderFieldConfidenceBadge(
                      extractionResult?.fields.documentNumber,
                      documentNumber
                    )}
                  </div>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value.toUpperCase())}
                    placeholder={documentType === 'passeport' ? 'Ex: AB123456' : 'Ex: CD712894'}
                    className={`w-full px-3 py-2 border rounded-xl text-slate-900 font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                      extractionResult?.fields.documentNumber.uncertain
                        ? 'border-amber-400 bg-amber-50/30'
                        : 'border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <label className="font-semibold text-slate-700">Nationalité</label>
                    {renderFieldConfidenceBadge(
                      extractionResult?.fields.nationality,
                      nationality
                    )}
                  </div>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="Ex: Marocaine"
                    className={`w-full px-3 py-2 border rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                      extractionResult?.fields.nationality.uncertain
                        ? 'border-amber-400 bg-amber-50/30'
                        : 'border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <label className="font-semibold text-slate-700">Date de naissance</label>
                    {renderFieldConfidenceBadge(extractionResult?.fields.birthDate, birthDate)}
                  </div>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                      extractionResult?.fields.birthDate.uncertain
                        ? 'border-amber-400 bg-amber-50/30'
                        : 'border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <label className="font-semibold text-slate-700">Lieu de naissance</label>
                    {renderFieldConfidenceBadge(extractionResult?.fields.birthPlace, birthPlace)}
                  </div>
                  <input
                    type="text"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder="Ex: Fès"
                    className={`w-full px-3 py-2 border rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                      extractionResult?.fields.birthPlace.uncertain
                        ? 'border-amber-400 bg-amber-50/30'
                        : 'border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 gap-1">
                  <label className="font-semibold text-slate-700">
                    Date d’expiration du document (si disponible)
                  </label>
                  {renderFieldConfidenceBadge(extractionResult?.fields.expiryDate, expiryDate)}
                </div>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${
                    extractionResult?.fields.expiryDate.uncertain
                      ? 'border-amber-400 bg-amber-50/30'
                      : 'border-slate-300'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Non-automatic validation notice + Footer Actions */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
            Vérifiez attentivement vos données : l’OCR facilite la saisie mais ne valide jamais automatiquement votre inscription sans votre confirmation et la vérification de votre e-mail académique.
          </div>

          <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
            <button
              type="button"
              onClick={() => {
                clearTemporaryPreview();
                onSkipManual();
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Poursuivre sans document
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <span>Confirmer et continuer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
