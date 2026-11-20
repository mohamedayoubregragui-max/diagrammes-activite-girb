import React, { useState, useEffect } from 'react';
import { AuthenticatedUser, ConfirmedIdentityData, UserRole } from '../types';
import {
  saveStoredUser,
  isAcademicEmail,
  registerStudentAccount,
  authenticateUserAccount,
  DEMO_USERS
} from '../services/storage';
import { OcrIdentityStep } from './OcrIdentityStep';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  Building2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ScanText
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthenticatedUser) => void;
  initialRole?: UserRole;
  initialMode?: 'login' | 'register' | 'institutional';
  contextualNotice?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <AuthModalInner {...props} />;
};

const AuthModalInner: React.FC<AuthModalProps> = ({
  onClose,
  onLoginSuccess,
  initialMode = 'login',
  contextualNotice
}) => {
  // Active view mode: 'login' | 'register' | 'institutional'
  const [mode, setMode] = useState<'login' | 'register' | 'institutional'>(initialMode);

  // Synchronize when initialMode prop changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Form states
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Student Register sub-steps: 'ocr' -> 'account' -> 'verify_email'
  const [registerStep, setRegisterStep] = useState<'ocr' | 'account' | 'verify_email'>('ocr');
  const [confirmedIdentity, setConfirmedIdentity] = useState<ConfirmedIdentityData | null>(null);

  // Student Register form states
  const [regLastName, setRegLastName] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Email verification step states
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [targetVerificationEmail, setTargetVerificationEmail] = useState('');
  const [generatedVerificationCode, setGeneratedVerificationCode] = useState('482915');

  // Common options
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot password modal
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Reset form messages when switching modes
  const handleSwitchMode = (newMode: 'login' | 'register' | 'institutional') => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (newMode === 'register') {
      setRegisterStep('ocr');
    }
  };

  // Google SSO Simulation for academic email
  const handleGoogleAuth = (targetRole: 'candidat' | 'directeur' | 'administrateur' = 'candidat') => {
    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      let selectedDemoUser: AuthenticatedUser;

      if (targetRole === 'directeur') {
        selectedDemoUser = DEMO_USERS.directeur;
      } else if (targetRole === 'administrateur') {
        selectedDemoUser = DEMO_USERS.administrateur;
      } else {
        selectedDemoUser = DEMO_USERS.candidat;
      }

      saveStoredUser(selectedDemoUser, rememberMe);
      setIsLoading(false);
      onLoginSuccess(selectedDemoUser);
      onClose();
    }, 600);
  };

  // Student Login Handler
  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!emailInput.trim()) {
      setErrorMsg('Veuillez renseigner votre adresse e-mail universitaire.');
      return;
    }
    if (!passwordInput) {
      setErrorMsg('Veuillez saisir votre mot de passe.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = authenticateUserAccount(emailInput, false);
      setIsLoading(false);

      if (result.success && result.user) {
        saveStoredUser(result.user, rememberMe);
        onLoginSuccess(result.user);
        onClose();
      } else {
        setErrorMsg(result.message);
      }
    }, 400);
  };

  // Student Registration Step 1: Validate and send verification code
  const handleInitiateStudentRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regLastName.trim()) {
      setErrorMsg('Veuillez saisir votre nom.');
      return;
    }
    if (!regFirstName.trim()) {
      setErrorMsg('Veuillez saisir votre prénom.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMsg('Veuillez saisir votre adresse e-mail académique.');
      return;
    }

    const cleanEmail = regEmail.trim().toLowerCase();
    if (!isAcademicEmail(cleanEmail)) {
      setErrorMsg(
        'L’inscription requiert une adresse e-mail académique institutionnelle valide (ex: @usmba.ac.ma, @um5.ac.ma, @uca.ac.ma, .edu, .ac.uk). Les adresses grand public (Gmail, Yahoo, Outlook) ne sont pas autorisées.'
      );
      return;
    }

    if (!regPassword) {
      setErrorMsg('Veuillez saisir un mot de passe.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('La confirmation du mot de passe ne correspond pas.');
      return;
    }

    const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedVerificationCode(mockCode);
    setTargetVerificationEmail(cleanEmail);
    setRegisterStep('verify_email');
    setSuccessMsg(`Un code de vérification à 6 chiffres a été envoyé à ${cleanEmail}. (Code de simulation : ${mockCode})`);
  };

  // Student Registration Step 2: Verify code and create account
  const handleVerifyCodeAndRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!verificationCodeInput.trim()) {
      setErrorMsg('Veuillez saisir le code de vérification reçu par e-mail.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const extraIdentity = confirmedIdentity
        ? {
            ...(confirmedIdentity.documentType === 'cin_maroc' && confirmedIdentity.documentNumber
              ? { cin: confirmedIdentity.documentNumber }
              : {}),
            ...(confirmedIdentity.documentType === 'passeport' && confirmedIdentity.documentNumber
              ? { passportNumber: confirmedIdentity.documentNumber }
              : {}),
            ...(confirmedIdentity.birthDate ? { birthDate: confirmedIdentity.birthDate } : {}),
            ...(confirmedIdentity.birthPlace ? { birthPlace: confirmedIdentity.birthPlace } : {}),
            ...(confirmedIdentity.nationality
              ? { nationality: confirmedIdentity.nationality }
              : {}),
            identityDocumentType: confirmedIdentity.documentType,
            ...(confirmedIdentity.expiryDate
              ? { identityDocumentExpiry: confirmedIdentity.expiryDate }
              : {}),
            ocrAssistedRegistration: confirmedIdentity.ocrAssisted
          }
        : undefined;

      const result = registerStudentAccount(
        regFirstName,
        regLastName,
        targetVerificationEmail,
        extraIdentity
      );
      setIsLoading(false);

      if (result.success && result.user) {
        setConfirmedIdentity(null);
        onLoginSuccess(result.user);
        onClose();
      } else {
        setErrorMsg(result.message);
      }
    }, 400);
  };

  // Institutional Access Login Handler (Encadrant & Administrateur)
  const handleInstitutionalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!emailInput.trim()) {
      setErrorMsg('Veuillez saisir votre e-mail institutionnel.');
      return;
    }
    if (!passwordInput) {
      setErrorMsg('Veuillez saisir votre mot de passe.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = authenticateUserAccount(emailInput, true);
      setIsLoading(false);

      if (result.success && result.user) {
        saveStoredUser(result.user, rememberMe);
        onLoginSuccess(result.user);
        onClose();
      } else {
        setErrorMsg(result.message);
      }
    }, 400);
  };

  // Password reset submit
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAcademicEmail(resetEmailInput)) {
      setErrorMsg('Veuillez saisir une adresse e-mail académique institutionnelle valide (ex: @usmba.ac.ma, @um5.ac.ma, @uca.ac.ma, .edu).');
      return;
    }
    setErrorMsg(null);
    setResetSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className={`bg-white rounded-3xl border border-slate-200 shadow-2xl w-full my-6 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
          mode === 'register' && registerStep === 'ocr' ? 'max-w-2xl' : 'max-w-lg'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 text-white flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Logo GCD */}
            <div className="w-11 h-11 rounded-2xl bg-blue-600 border border-blue-400/40 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
              GCD
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                Université Sidi Mohamed Ben Abdellah
              </div>
              <h2 className="text-xl font-extrabold text-white leading-tight">
                {mode === 'login' && 'Espace de Connexion'}
                {mode === 'register' && 'Créer un Compte Étudiant'}
                {mode === 'institutional' && 'Accès Institutionnel'}
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                {mode === 'institutional'
                  ? 'Espace réservé aux encadrants, directeurs et administrateurs'
                  : 'Gestion des Candidatures Doctorales (GCD)'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contextual Notice (e.g. triggered from Cart Validation) */}
        {contextualNotice && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>{contextualNotice}</div>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Global Success Banner */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>{successMsg}</div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: STUDENT MAIN LOGIN PAGE                                          */}
        {/* ========================================================================= */}
        {mode === 'login' && (
          <div className="p-6 space-y-5 overflow-y-auto">
            {/* Google Authentication Option */}
            <div>
              <button
                type="button"
                onClick={() => handleGoogleAuth('candidat')}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-3 cursor-pointer group"
              >
                {/* Multi-color Google SVG Icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuer avec Google (E-mail académique)</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-slate-400 font-medium uppercase font-mono">
                ou avec votre e-mail
              </span>
            </div>

            {/* Login Form */}
            <form onSubmit={handleStudentLogin} className="space-y-4 text-xs">
              {/* Email field with icon */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse e-mail universitaire *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="nom.prenom@usmba.ac.ma"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white text-xs"
                  />
                </div>
              </div>

              {/* Password field with icon & toggle visibility */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mot de passe *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Mémoriser ma session sur cet appareil</span>
                </label>
              </div>

              {/* Main Primary Login Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Connexion en cours...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Se connecter à la plateforme</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Bottom Register CTA */}
            <div className="pt-4 border-t border-slate-100 text-center space-y-3">
              <div className="text-xs text-slate-600">
                Vous n’avez pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('register')}
                  className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Créer un compte
                </button>
              </div>

              {/* Separate Institutional Access Link */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('institutional')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Encadrant ou Administrateur ? Accès institutionnel</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: STUDENT REGISTRATION PAGE (OCR -> ACCOUNT -> EMAIL CODE)         */}
        {/* ========================================================================= */}
        {mode === 'register' && (
          <div className="p-6 space-y-4 overflow-y-auto max-h-[82vh]">
            {registerStep === 'ocr' && (
              <OcrIdentityStep
                initialData={confirmedIdentity}
                onConfirmAndContinue={(identityData) => {
                  setConfirmedIdentity(identityData);
                  setRegLastName(identityData.lastName);
                  setRegFirstName(identityData.firstName);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setRegisterStep('account');
                }}
                onSkipManual={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setRegisterStep('account');
                }}
              />
            )}

            {registerStep === 'account' && (
              <>
                {confirmedIdentity ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <strong>Identité confirmée :</strong> {confirmedIdentity.firstName}{' '}
                        {confirmedIdentity.lastName}
                        {confirmedIdentity.documentNumber ? ' · Pièce enregistrée' : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRegisterStep('ocr')}
                      className="text-[11px] font-semibold text-emerald-800 hover:underline cursor-pointer"
                    >
                      Re-scanner (OCR)
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-2 flex-1 min-w-[200px]">
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Inscription Étudiant :</strong> Ouverte à toutes les universités marocaines et étrangères reconnues (ex: @usmba.ac.ma, @um5.ac.ma, @uca.ac.ma, .edu, .ac.uk). Les e-mails grand public (Gmail, Yahoo) sont exclus.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRegisterStep('ocr')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-blue-100 text-[#2563EB] border border-blue-200 rounded-lg font-semibold text-[11px] shrink-0 cursor-pointer"
                    >
                      <ScanText className="w-3.5 h-3.5" />
                      <span>Préremplir par OCR</span>
                    </button>
                  </div>
                )}

                <form onSubmit={handleInitiateStudentRegistration} className="space-y-3 text-xs">
                  {/* Last Name & First Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nom *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={regLastName}
                          onChange={(e) => setRegLastName(e.target.value)}
                          placeholder="Ex: Bennani"
                          className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Prénom *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={regFirstName}
                          onChange={(e) => setRegFirstName(e.target.value)}
                          placeholder="Ex: Mohamed"
                          className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Academic Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Adresse e-mail académique / universitaire *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="prenom.nom@univ-alternatif.ac.ma"
                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mot de passe *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirmation du mot de passe *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                      >
                        {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Registration Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Vérification du domaine...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Envoyer le code de vérification e-mail</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            {registerStep === 'verify_email' && (
              /* Email Verification Code Step */
              <form onSubmit={handleVerifyCodeAndRegister} className="space-y-4 text-xs py-2">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Vérification de l'adresse académique</span>
                  </div>
                  <p className="leading-relaxed">
                    Un e-mail de confirmation a été transmis à <strong>{targetVerificationEmail}</strong>. Veuillez saisir ci-dessous le code à 6 chiffres reçu pour activer votre compte.
                  </p>
                  <div className="p-2 bg-white/80 rounded-lg font-mono text-[11px] text-slate-700 border border-emerald-200 text-center">
                    Code de démonstration généré : <strong className="text-blue-700 text-sm">{generatedVerificationCode}</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Code de vérification (6 chiffres) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCodeInput}
                    onChange={(e) => setVerificationCodeInput(e.target.value)}
                    placeholder="Ex: 482915"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-center font-mono text-lg font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRegisterStep('account')}
                    className="w-1/3 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-2/3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Activation...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmer et Activer le Compte</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="pt-3 border-t border-slate-100 text-center">
              <span className="text-xs text-slate-600">
                Vous avez déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Se connecter
                </button>
              </span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: INSTITUTIONAL ACCESS PAGE (Encadrant & Administrateur)          */}
        {/* ========================================================================= */}
        {mode === 'institutional' && (
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="p-3.5 bg-slate-900 text-white rounded-xl text-xs leading-relaxed space-y-1">
              <div className="font-bold text-blue-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Accès Institutionnel Sécurisé</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Les comptes <strong>Encadrant</strong> et <strong>Administrateur</strong> ne peuvent pas être créés depuis l'inscription publique. Le rôle est automatiquement attribué par la présidence du pôle doctoral.
              </p>
            </div>

            <form onSubmit={handleInstitutionalLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse e-mail institutionnelle *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="youssef.elamrani@usmba.ac.ma ou pole.doctoral@usmba.ac.ma"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mot de passe *
                  </label>
                  <button
                    type="button"
                    onClick={() => setPasswordInput('Password@2026')}
                    className="text-xs text-blue-600 hover:underline cursor-pointer"
                  >
                    Mot de passe test
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Demo Institutional Shortcuts */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
                <div className="font-semibold text-slate-700">
                  Connexion démo rapide (1 clic) :
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInput('youssef.elamrani@usmba.ac.ma');
                      setPasswordInput('Password@2026');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 font-medium rounded-lg cursor-pointer transition-colors"
                  >
                    Encadrant : Pr. Youssef El Amrani
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailInput('pole.doctoral@usmba.ac.ma');
                      setPasswordInput('Password@2026');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-medium rounded-lg cursor-pointer transition-colors"
                  >
                    Admin : Dr. Karim Berrada
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Vérification du rôle...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Connexion Institutionnelle</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                Vous êtes étudiant ? Retour à la connexion étudiant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Forgot Password Sub-Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div
            className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Réinitialisation du mot de passe
              </h3>
              <button
                onClick={() => {
                  setIsForgotPasswordOpen(false);
                  setResetSuccess(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Lien de réinitialisation envoyé !</span>
                </div>
                <p>
                  Un e-mail contenant les instructions de réinitialisation a été envoyé à <strong>{resetEmailInput}</strong>. Veuillez vérifier votre boîte académique.
                </p>
                <button
                  onClick={() => {
                    setIsForgotPasswordOpen(false);
                    setResetSuccess(false);
                  }}
                  className="w-full mt-2 py-2 bg-emerald-700 text-white font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
                <p className="text-slate-600">
                  Saisissez votre adresse e-mail universitaire. Nous vous enverrons un lien sécurisé pour redéfinir votre mot de passe.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adresse e-mail universitaire
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmailInput}
                    onChange={(e) => setResetEmailInput(e.target.value)}
                    placeholder="nom.prenom@usmba.ac.ma"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs cursor-pointer"
                  >
                    Envoyer le lien
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
