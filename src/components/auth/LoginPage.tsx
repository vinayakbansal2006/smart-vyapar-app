import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Package, Factory, Truck, Store, Fingerprint, Star, Smartphone,
  ChevronLeft, ArrowRight, Lock, Loader2, AlertTriangle, CheckCircle,
  ShieldCheck, Eye, EyeOff, X, Check, User, KeyRound, Mail, Sparkles,
} from 'lucide-react';
import { UserRole } from '../../types';
import {
  signInWithGoogle,
  sendPhoneOtp,
  verifyPhoneOtp,
  upsertUserProfile,
} from '../../services/authService';

/* ─── Types ─────────────────────────────────────────────────────────────────── */

export interface LoginRecord {
  businessName: string;
  roleName: string;
  roleId: UserRole;
  loginMethod: string;
  timestamp: string;
  email?: string;
}

interface LoginPageProps {
  onAuthSuccess: (method: string, data?: any) => void;
  t: any;
  lastLogins: LoginRecord[];
}

/* ─── Account registry helpers (localStorage) ─────────────────────────────── */

const ACCOUNTS_KEY = 'vyaparika_accounts';

interface AccountRecord {
  email: string;
  password: string;
  appId?: string;
  mobile?: string;
  role?: UserRole;
  createdAt: string;
}

const getAccounts = (): AccountRecord[] => {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveAccount = (account: AccountRecord) => {
  const key = account.appId || account.email;
  const existing = getAccounts().filter(a => (a.appId || a.email) !== key);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...existing, account]));
};

const findAccountByAppId = (appId: string, password: string): AccountRecord | null =>
  getAccounts().find(a => (a.appId === appId || a.email === appId) && a.password === password) ?? null;

/* ─── Validation helpers ──────────────────────────────────────────────────── */

const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
const isValidAppId = (val: string) => val.length >= 3 && /^[a-zA-Z0-9_.-]+$/.test(val);
const isValidMobile = (val: string) => /^\d{10}$/.test(val);

const getPasswordStrength = (pwd: string) => {
  if (!pwd) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { level: 1, label: 'Weak', color: '#ef4444' };
  if (score <= 3) return { level: 2, label: 'Medium', color: '#f59e0b' };
  return { level: 3, label: 'Strong', color: '#10b981' };
};

/* ─── Role config ─────────────────────────────────────────────────────────── */

const ROLE_OPTIONS = [
  {
    id: UserRole.MANUFACTURER,
    label: 'Manufacturer',
    desc: 'Factory / Production',
    Icon: Factory,
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600',
    glowColor: 'rgba(245,158,11,0.45)',
  },
  {
    id: UserRole.DISTRIBUTOR,
    label: 'Distributor',
    desc: 'Wholesale / Supply',
    Icon: Truck,
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
    glowColor: 'rgba(16,185,129,0.45)',
  },
  {
    id: UserRole.RETAILER,
    label: 'Shopkeeper',
    desc: 'Shop / Kirana Store',
    Icon: Store,
    color: '#6366f1',
    gradient: 'from-indigo-500 to-violet-600',
    glowColor: 'rgba(99,102,241,0.45)',
  },
];

/* ─── OTP Modal ───────────────────────────────────────────────────────────── */

const OtpModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess: (data: { phone: string; role: UserRole | null }) => void;
  selectedRole: UserRole | null;
}> = ({ open, onClose, onSuccess, selectedRole }) => {
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('phone');
      setPhone('');
      setOtp('');
      setError('');
      setLoading(false);
      setResendCooldown(0);
    }
  }, [open]);

  const handleSendOtp = async () => {
    if (phone.length !== 10) return;
    setLoading(true);
    setError('');
    try {
      await sendPhoneOtp('+91' + phone);
      setStep('verify');
      setResendCooldown(30);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('SSL') || msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
        setError('Server is temporarily unavailable. Please try again later.');
      } else {
        setError(msg || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    try {
      await sendPhoneOtp('+91' + phone);
      setResendCooldown(30);
      setOtp('');
    } catch (err: any) {
      setError(err?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const { userId, phone: verifiedPhone } = await verifyPhoneOtp('+91' + phone, otp);
      await upsertUserProfile({ id: userId, phone: verifiedPhone });
      onSuccess({ phone: verifiedPhone, role: selectedRole });
    } catch (err: any) {
      setError(err?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div
        className="login-modal-content login-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>

        {step === 'phone' ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="login-icon-box bg-gradient-to-br from-indigo-500 to-violet-600 mx-auto mb-4">
                <Smartphone className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                Mobile Login
              </h3>
              <p className="text-sm text-white/40 mt-1">
                We'll send a 6-digit verification code
              </p>
            </div>

            <div>
              <label className="login-label">Mobile Number</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-4 rounded-2xl bg-white/[0.07] border-2 border-white/[0.08] shrink-0">
                  <span className="text-lg">🇮🇳</span>
                  <span className="font-black text-white/60 text-sm">+91</span>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={e => {
                    setPhone(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  placeholder="00000 00000"
                  autoFocus
                  className="login-input flex-1 tracking-[0.12em] text-xl font-black"
                />
              </div>
              {phone.length > 0 && phone.length < 10 && (
                <p className="login-field-error mt-2">
                  <AlertTriangle className="w-3 h-3" /> Enter 10-digit number
                </p>
              )}
            </div>

            {error && <LoginError message={error} />}

            <button
              onClick={handleSendOtp}
              disabled={phone.length !== 10 || loading}
              className="login-btn-primary w-full"
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <>
                  Send OTP <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="login-icon-box bg-gradient-to-br from-emerald-500 to-teal-600 mx-auto mb-4">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                Verify OTP
              </h3>
              <p className="text-sm text-white/40 mt-1">
                Sent to{' '}
                <span className="font-black text-white/60">+91 {phone}</span>
              </p>
            </div>

            {/* OTP boxes */}
            <div className="flex gap-2.5 justify-center">
              {Array.from({ length: 6 }).map((_, idx) => (
                <input
                  key={idx}
                  ref={el => {
                    otpRefs.current[idx] = el;
                  }}
                  type="tel"
                  maxLength={1}
                  inputMode="numeric"
                  value={otp[idx] || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    const arr = otp.split('');
                    arr[idx] = val;
                    const next = arr.join('').slice(0, 6);
                    setOtp(next);
                    setError('');
                    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
                      otpRefs.current[idx - 1]?.focus();
                  }}
                  autoFocus={idx === 0}
                  className="login-otp-box"
                  style={
                    otp[idx]
                      ? {
                          borderColor: 'rgba(99,102,241,0.6)',
                          background: 'rgba(99,102,241,0.1)',
                        }
                      : {}
                  }
                />
              ))}
            </div>

            {error && <LoginError message={error} />}

            <button
              onClick={handleVerify}
              disabled={otp.length !== 6 || loading}
              className="login-btn-verify w-full"
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" /> Verify & Continue
                </>
              )}
            </button>

            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="w-full text-center text-sm font-bold transition-colors disabled:text-white/20 text-indigo-400/60 hover:text-indigo-400"
            >
              {resendCooldown > 0
                ? `Resend OTP in ${resendCooldown}s`
                : 'Resend OTP'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Inline sub-components  ──────────────────────────────────────────────── */

const LoginError: React.FC<{ message: string }> = ({ message }) => (
  <div className="login-error-banner login-fade-in">
    <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
      <AlertTriangle className="w-4 h-4 text-red-400" />
    </div>
    <p className="text-sm font-bold text-red-300">{message}</p>
  </div>
);

const BackBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="group flex items-center gap-2 text-white/50 hover:text-white transition-all text-sm font-bold mb-2"
  >
    <div className="w-9 h-9 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-all">
      <ChevronLeft className="w-4 h-4" />
    </div>
    <span className="group-hover:translate-x-0.5 transition-transform">
      Back
    </span>
  </button>
);

/* ═══════════════════════════════════════════════════════════════════════════
   ██   LOGIN PAGE — MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

const LoginPage: React.FC<LoginPageProps> = ({
  onAuthSuccess,
  t,
  lastLogins,
}) => {
  /* ── State ───────────────────────────────────────────────────────────────── */
  type Step =
    | 'main'
    | 'appid'
    | 'password'
    | 'signup'
    | 'forgot';

  const [step, setStep] = useState<Step>('main');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [appId, setAppId] = useState('');
  const [email, setEmail] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'newpass'>('email');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPwd, setNewConfirmPwd] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewConfirmPwd, setShowNewConfirmPwd] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [mounted, setMounted] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');

  // Check if user already has an account (one account per device)
  const [existingAccount, setExistingAccount] = useState<AccountRecord | null>(() => {
    const accs = getAccounts();
    return accs.length > 0 ? accs[0] : null;
  });

  // Refresh existing account check when step changes (e.g. after navigating back)
  useEffect(() => {
    const accs = getAccounts();
    setExistingAccount(accs.length > 0 ? accs[0] : null);
  }, [step]);

  // Particle seeds (stable across re-renders)
  const [particles] = useState(() =>
    Array.from({ length: 24 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10,
    })),
  );

  /* ── Effects ─────────────────────────────────────────────────────────────── */

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else if (hour < 21) setGreeting('Good Evening');
    else setGreeting('Good Night');
    // Trigger mount animation
    requestAnimationFrame(() => setMounted(true));
  }, []);

  /* ── Handlers ────────────────────────────────────────────────────────────── */

  const clearError = useCallback(() => setAuthError(''), []);

  /** Main login from the landing screen (email/appId + password) */
  const handleMainLogin = () => {
    if (!loginEmail || !password) return;
    if (!selectedRole) {
      setAuthError('Please select your role before logging in.');
      return;
    }
    if (loading) return; // prevent multiple clicks
    setSignupSuccess(false);

    // Try to find account by email or appId
    const account = findAccountByAppId(loginEmail, password);
    if (!account) {
      setAuthError('Incorrect email/App ID or password. Please try again.');
      return;
    }
    // Validate role matches
    if (account.role && account.role !== selectedRole) {
      const roleName = account.role === 'MANUFACTURER' ? 'Manufacturer' : account.role === 'DISTRIBUTOR' ? 'Distributor' : 'Shopkeeper';
      setAuthError(`This account is registered as ${roleName}. Please select the correct role.`);
      return;
    }
    setAuthError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onAuthSuccess('email', {
        email: account.email,
        appId: account.appId,
        role: account.role || selectedRole,
        isReturningUser: true,
      });
    }, 1000);
  };

  /** Handle forgot password — Phase 1: verify email exists locally */
  const handleForgotEmailCheck = () => {
    if (!forgotEmail || !isValidEmail(forgotEmail)) return;
    setAuthError('');
    const accounts = getAccounts();
    const accountExists = accounts.some(a => a.email === forgotEmail);
    if (!accountExists) {
      setAuthError('No account found with this email. Please check or sign up.');
      return;
    }
    setForgotStep('newpass');
  };

  /** Handle forgot password — Phase 2: save new password locally */
  const handleResetPassword = () => {
    if (!newPassword || !newConfirmPwd) return;
    if (newPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== newConfirmPwd) {
      setAuthError('Passwords do not match.');
      return;
    }
    setForgotLoading(true);
    setAuthError('');
    // Find and update account
    const accounts = getAccounts();
    const account = accounts.find(a => a.email === forgotEmail);
    if (!account) {
      setAuthError('Account not found. Please try again.');
      setForgotLoading(false);
      return;
    }
    saveAccount({ ...account, password: newPassword });
    setForgotLoading(false);
    setForgotSuccess(true);
  };

  const handleAppIdLogin = () => {
    if (!appId || !password) return;
    if (!selectedRole) {
      setAuthError('Please select your role before signing in.');
      return;
    }
    if (loading) return; // prevent multiple clicks
    const account = findAccountByAppId(appId, password);
    if (!account) {
      setAuthError('Incorrect App ID / email or password. Please try again.');
      return;
    }
    // Check if the account role matches selected role
    if (account.role && account.role !== selectedRole) {
      setAuthError(`This account is registered as ${account.role === 'MANUFACTURER' ? 'Manufacturer' : account.role === 'DISTRIBUTOR' ? 'Distributor' : 'Shopkeeper'}. Please select the correct role.`);
      return;
    }
    setAuthError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onAuthSuccess('email', {
        email: account.email,
        appId: account.appId,
        role: account.role || selectedRole,
        isReturningUser: true,
      });
    }, 1000);
  };

  const handleSignup = () => {
    // Enforce one account per device
    if (getAccounts().length >= 1) {
      setAuthError('You already have an account. Delete it from Settings → Danger Zone to create a new one.');
      return;
    }
    if (
      !email ||
      !appId ||
      !signupMobile ||
      !password ||
      password !== confirmPwd ||
      !ownerName.trim() ||
      !shopName.trim() ||
      !city.trim()
    )
      return;
    if (!selectedRole) {
      setAuthError('Please select your role before creating an account.');
      return;
    }
    if (!isValidEmail(email)) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (!isValidAppId(appId)) {
      setAuthError('App ID must be 3+ chars (letters, numbers, . _ - only).');
      return;
    }
    if (!isValidMobile(signupMobile)) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (getAccounts().some(a => a.appId === appId)) {
      setAuthError('This App ID is already taken. Choose another.');
      return;
    }
    if (getAccounts().some(a => a.email === email)) {
      setAuthError('Account already exists. Please login.');
      return;
    }
    // Check for duplicate role with same email
    if (getAccounts().some(a => a.email === email && a.role === selectedRole)) {
      setAuthError('An account with this email and role already exists. Please login.');
      return;
    }
    setAuthError('');
    setLoading(true);
    setTimeout(() => {
      saveAccount({
        email,
        appId,
        mobile: signupMobile,
        password,
        role: selectedRole || undefined,
        createdAt: new Date().toISOString(),
      });
      setLoading(false);
      // Do NOT auto-login. Redirect to login with success message.
      setSignupSuccess(true);
      // Clear signup form fields
      setEmail('');
      setAppId('');
      setSignupMobile('');
      setPassword('');
      setConfirmPwd('');
      setOwnerName('');
      setShopName('');
      setCity('');
      setShowPassword(false);
      setShowConfirmPwd(false);
      // Navigate back to main login step
      setStep('main');
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    if (!selectedRole) {
      setAuthError('Please select your role before continuing with Google.');
      return;
    }
    setGoogleLoading(true);
    setAuthError('');
    try {
      // Store the selected role in localStorage (will be retrieved after OAuth redirect)
      localStorage.setItem('vyaparika_pending_role_oauth', selectedRole);
      // Initiate Supabase Google OAuth flow (redirects user to Google)
      await signInWithGoogle();
      // Note: If OAuth succeeds, the page will redirect and come back with auth session
      // The onAuthStateChange in App.tsx will handle the rest
    } catch (err: any) {
      localStorage.removeItem('vyaparika_pending_role_oauth');
      setGoogleLoading(false);
      const msg = err?.message || '';
      if (msg.includes('popup-closed-by-user') || msg.includes('cancelled')) {
        setAuthError('Sign-in cancelled. Please try again.');
      } else if (msg.includes('SSL') || msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
        setAuthError('Server is temporarily unavailable. Please use Email/Password login or try again later.');
      } else {
        setAuthError(msg || 'Google sign-in failed. Please try again.');
      }
    }
  };

  const handleOtpSuccess = (data: { phone: string; role: UserRole | null }) => {
    setOtpModalOpen(false);
    onAuthSuccess('mobile', { phone: data.phone, role: data.role });
  };

  const openOtpModal = () => {
    if (!selectedRole) {
      setAuthError('Please select your role before continuing.');
      return;
    }
    setAuthError('');
    setOtpModalOpen(true);
  };

  const goStep = (s: Step) => {
    setStep(s);
    clearError();
  };

  /* ── Render ──────────────────────────────────────────────────────────────── */

  return (
    <>
      <div className="login-page">
        {/* ─── Background layers ────────────────────────────────────────── */}

        {/* Dynamic background image with gradient overlay */}
        <div className="login-bg-image" />
        <div className="login-bg-overlay" />

        {/* Floating particles */}
        {particles.map((p, i) => (
          <div
            key={i}
            className="login-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background:
                i % 3 === 0
                  ? 'rgba(99,102,241,0.5)'
                  : i % 3 === 1
                    ? 'rgba(168,85,247,0.4)'
                    : 'rgba(59,130,246,0.4)',
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}

        {/* Gradient orbs */}
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />

        {/* ─── Card container ───────────────────────────────────────────── */}
        <div
          className={`login-card-wrapper ${mounted ? 'login-card-visible' : 'login-card-hidden'}`}
        >
          {/* ═══ MAIN SCREEN — LOGIN FIRST ═══ */}
          {step === 'main' && (
            <div className="login-step-animate space-y-5">
              {/* Logo + subtitle */}
              <div className="text-center space-y-3">
                <div className="relative inline-flex">
                  <div className="login-logo-box">
                    <Package className="text-white w-10 h-10 relative z-10" />
                    <div className="login-logo-shimmer" />
                  </div>
                  <div className="login-logo-glow" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
                  <div
                    className="absolute -bottom-0.5 -left-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                    style={{ animationDelay: '0.5s' }}
                  />
                </div>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
                    Vyaparika
                  </h1>
                  <p className="text-white/30 text-sm font-medium mt-1">
                    Login to Vyaparika
                  </p>
                </div>
              </div>

              {/* Signup success banner */}
              {signupSuccess && (
                <div className="login-success-banner login-fade-in">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-sm font-bold text-emerald-300">Account created successfully. Please login.</p>
                </div>
              )}

              {/* Role selection */}
              <div className="space-y-3">
                <p className="login-section-label">
                  <Sparkles className="w-3 h-3" /> I AM A...
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {ROLE_OPTIONS.map(role => {
                    const active = selectedRole === role.id;
                    return (
                      <button
                        key={role.id}
                        onClick={() => {
                          setSelectedRole(active ? null : role.id);
                          setSignupSuccess(false);
                          clearError();
                        }}
                        className={`login-role-card ${active ? 'login-role-active' : 'login-role-idle'}`}
                        style={
                          active
                            ? {
                                boxShadow: `0 8px 32px ${role.glowColor}, 0 0 0 2px ${role.color}`,
                              }
                            : {}
                        }
                      >
                        <div
                          className={`login-role-icon-wrap ${active ? `bg-gradient-to-br ${role.gradient}` : 'bg-white/[0.08]'}`}
                        >
                          <role.Icon
                            className={`w-5 h-5 ${active ? 'text-white' : 'text-white/50'}`}
                          />
                        </div>
                        <p
                          className={`text-[11px] font-black leading-tight mt-2 ${active ? 'text-white' : 'text-white/50'}`}
                        >
                          {role.label}
                        </p>
                        <p
                          className={`text-[9px] font-semibold mt-0.5 ${active ? 'text-white/70' : 'text-white/25'}`}
                        >
                          {role.desc}
                        </p>
                        {active && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Inline Login Form — email / App ID + password */}
              <div className="space-y-3.5">
                <div>
                  <label className="login-label">Email or App ID</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={loginEmail}
                      onChange={e => {
                        setLoginEmail(e.target.value.trim());
                        clearError();
                        setSignupSuccess(false);
                      }}
                      placeholder="you@email.com or my_app_id"
                      className="login-input pr-12"
                    />
                    {loginEmail && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {(isValidEmail(loginEmail) || isValidAppId(loginEmail)) ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-400/60" />
                        )}
                      </div>
                    )}
                  </div>
                  {loginEmail && !isValidEmail(loginEmail) && !isValidAppId(loginEmail) && (
                    <p className="login-field-error mt-2">
                      <AlertTriangle className="w-3 h-3" /> Enter a valid email or App ID
                    </p>
                  )}
                </div>
                <div>
                  <label className="login-label">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        clearError();
                        setSignupSuccess(false);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && loginEmail && password && selectedRole && !loading) {
                          handleMainLogin();
                        }
                      }}
                      placeholder="Enter your password"
                      className="login-input pr-14"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="flex justify-end mt-1.5">
                    <button
                      onClick={() => {
                        setForgotEmail(loginEmail || '');
                        setForgotSuccess(false);
                        goStep('forgot');
                      }}
                      className="text-indigo-400/70 font-bold text-xs hover:text-indigo-400 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
              </div>

              {/* Error display */}
              {authError && <LoginError message={authError} />}

              {/* Login button — disabled until role + email + password */}
              <div className="space-y-3 pt-1">
                <button
                  onClick={handleMainLogin}
                  disabled={
                    !selectedRole ||
                    !loginEmail ||
                    (!isValidEmail(loginEmail) && !isValidAppId(loginEmail)) ||
                    !password ||
                    loading
                  }
                  className="login-btn-primary w-full group"
                >
                  <span className="login-btn-primary-bg" />
                  <span className="relative z-10 flex items-center gap-3">
                    {loading ? (
                      <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                      <>
                        <Lock className="w-5 h-5" /> Login
                      </>
                    )}
                  </span>
                </button>

                {/* Continue with Google */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="login-btn-google w-full"
                >
                  {googleLoading ? (
                    <Loader2 className="animate-spin w-5 h-5 text-gray-500" />
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="login-divider">
                  <div className="login-divider-line" />
                  <span className="login-divider-text">OR</span>
                  <div className="login-divider-line" />
                </div>

                {/* Mobile OTP */}
                <button onClick={openOtpModal} className="login-btn-otp w-full">
                  <Smartphone className="w-4 h-4" /> Login with Mobile OTP
                </button>
              </div>

              {/* Sign up link — subtle */}
              <p className="text-center text-sm text-white/30 pt-1">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    if (existingAccount) {
                      setAuthError('You already have an account. Delete it from Settings → Danger Zone to create a new one.');
                      return;
                    }
                    if (!selectedRole) {
                      setAuthError('Please select your role first.');
                      return;
                    }
                    setSignupSuccess(false);
                    goStep('signup');
                  }}
                  className={`font-bold transition-colors ${existingAccount ? 'text-white/20 cursor-not-allowed' : 'text-indigo-400 hover:text-indigo-300'}`}
                >
                  Sign Up
                </button>
              </p>

              {/* Footer */}
              <p className="text-[10px] text-white/15 font-semibold text-center">
                By continuing you agree to our Terms of Service & Privacy Policy
              </p>
            </div>
          )}

          {/* ═══ APP ID STEP ═══ */}
          {step === 'appid' && (
            <div className="login-step-slide space-y-5">
              <BackBtn onClick={() => goStep('main')} />
              <div className="login-glass-card">
                <div className="text-center">
                  <div className="login-icon-box bg-gradient-to-br from-indigo-500 to-violet-600 mx-auto mb-4">
                    <Fingerprint className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Sign in
                  </h2>
                  <p className="text-white/40 text-sm mt-1">
                    Enter your App ID to continue
                  </p>
                </div>
                <div>
                  <label className="login-label">App ID</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={appId}
                      onChange={e => {
                        setAppId(e.target.value.trim());
                        clearError();
                      }}
                      onKeyDown={e =>
                        e.key === 'Enter' &&
                        appId &&
                        isValidAppId(appId) &&
                        goStep('password')
                      }
                      placeholder="my_business_id"
                      autoFocus
                      className="login-input pr-12"
                    />
                    {appId && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {isValidAppId(appId) ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-400/60" />
                        )}
                      </div>
                    )}
                  </div>
                  {appId && !isValidAppId(appId) && (
                    <p className="login-field-error mt-2">
                      <AlertTriangle className="w-3 h-3" /> Min 3 chars —
                      letters, numbers, . _ - only
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() =>
                      appId && isValidAppId(appId) && goStep('password')
                    }
                    disabled={!appId || !isValidAppId(appId)}
                    className="login-btn-primary w-full"
                  >
                    Next <ArrowRight className="w-5 h-5" />
                  </button>
                  <p className="text-center text-sm text-white/30">
                    Don't have an account?{' '}
                    <button
                      onClick={() => {
                        if (existingAccount) {
                          setAuthError('You already have an account. Delete it from Settings → Danger Zone first.');
                          return;
                        }
                        goStep('signup');
                      }}
                      className={`font-bold transition-colors ${existingAccount ? 'text-white/20 cursor-not-allowed' : 'text-indigo-400 hover:text-indigo-300'}`}
                    >
                      Create one
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═══ PASSWORD STEP ═══ */}
          {step === 'password' && (
            <div className="login-step-slide space-y-5">
              <BackBtn onClick={() => goStep('appid')} />
              <div className="login-glass-card">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border-2 border-indigo-500/20">
                    <User className="w-7 h-7 text-indigo-300" />
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] mb-3">
                    <Fingerprint className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-sm font-bold text-white/60 truncate max-w-[200px]">
                      {appId}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Welcome back
                  </h2>
                </div>
                <div>
                  <label className="login-label">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        clearError();
                      }}
                      onKeyDown={e =>
                        e.key === 'Enter' &&
                        appId &&
                        password &&
                        handleAppIdLogin()
                      }
                      placeholder="Enter your password"
                      autoFocus
                      className="login-input pr-14"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                {authError && <LoginError message={authError} />}
                <div className="space-y-3">
                  <button
                    onClick={handleAppIdLogin}
                    disabled={!password || loading}
                    className="login-btn-primary w-full"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                      <>
                        <Lock className="w-5 h-5" /> Sign In
                      </>
                    )}
                  </button>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        goStep('forgot');
                        setForgotSuccess(false);
                      }}
                      className="text-indigo-400/70 font-bold text-sm hover:text-indigo-400 transition-colors"
                    >
                      Forgot password?
                    </button>
                    <button
                      onClick={() => {
                        if (existingAccount) {
                          setAuthError('You already have an account. Delete it from Settings → Danger Zone first.');
                          return;
                        }
                        goStep('signup');
                        setPassword('');
                        setConfirmPwd('');
                      }}
                      className={`font-semibold text-sm transition-colors ${existingAccount ? 'text-white/15 cursor-not-allowed' : 'text-white/30 hover:text-white/60'}`}
                    >
                      Create account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ FORGOT PASSWORD ═══ */}
          {step === 'forgot' && (
            <div className="login-step-slide space-y-5">
              <BackBtn onClick={() => {
                setForgotStep('email');
                setForgotSuccess(false);
                setNewPassword('');
                setNewConfirmPwd('');
                goStep('main');
              }} />
              <div className="login-glass-card">
                <div className="text-center">
                  <div className="login-icon-box bg-gradient-to-br from-amber-500 to-orange-600 mx-auto mb-4">
                    <KeyRound className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Reset Password
                  </h2>
                  <p className="text-white/40 text-sm mt-1">
                    {forgotSuccess
                      ? 'Your password has been reset successfully'
                      : forgotStep === 'email'
                        ? 'Enter your registered email to verify your account'
                        : 'Set a new password for your account'}
                  </p>
                </div>

                {/* Success state */}
                {forgotSuccess ? (
                  <div className="rounded-2xl p-6 text-center space-y-4 bg-emerald-500/10 border border-emerald-500/20">
                    <div className="login-icon-box bg-gradient-to-br from-emerald-500 to-teal-600 mx-auto">
                      <Check className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-emerald-400 text-base">
                        Password Reset Successful!
                      </p>
                      <p className="text-sm text-white/40 mt-1">
                        Your password has been updated. You can now log in with your new password.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setForgotSuccess(false);
                        setForgotStep('email');
                        setForgotEmail('');
                        setNewPassword('');
                        setNewConfirmPwd('');
                        goStep('main');
                      }}
                      className="text-indigo-400 font-bold text-sm hover:text-indigo-300 transition-colors"
                    >
                      Back to Login
                    </button>
                  </div>
                ) : forgotStep === 'email' ? (
                  /* Phase 1: Enter email */
                  <>
                    <div>
                      <label className="login-label">Registered Email</label>
                      <div className="relative">
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={e => {
                            setForgotEmail(e.target.value.toLowerCase().trim());
                            clearError();
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && isValidEmail(forgotEmail)) {
                              handleForgotEmailCheck();
                            }
                          }}
                          placeholder="you@email.com"
                          autoFocus
                          className="login-input pr-12"
                        />
                        {forgotEmail && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            {isValidEmail(forgotEmail) ? (
                              <CheckCircle className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-amber-400/60" />
                            )}
                          </div>
                        )}
                      </div>
                      {forgotEmail && !isValidEmail(forgotEmail) && (
                        <p className="login-field-error mt-2">
                          <AlertTriangle className="w-3 h-3" /> Enter a valid email address
                        </p>
                      )}
                    </div>
                    {authError && <LoginError message={authError} />}
                    <button
                      onClick={handleForgotEmailCheck}
                      disabled={!forgotEmail || !isValidEmail(forgotEmail)}
                      className="login-btn-primary w-full"
                      style={{
                        background:
                          'linear-gradient(135deg, #f59e0b, #d97706)',
                      }}
                    >
                      <ArrowRight className="w-5 h-5" /> Verify Email
                    </button>
                    <p className="text-center text-sm text-white/25">
                      Remember your password?{' '}
                      <button
                        onClick={() => goStep('main')}
                        className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
                      >
                        Back to Login
                      </button>
                    </p>
                  </>
                ) : (
                  /* Phase 2: Set new password */
                  <>
                    <div className="rounded-xl p-3 bg-indigo-500/10 border border-indigo-500/20 text-center">
                      <p className="text-sm text-indigo-300">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Resetting password for <span className="font-bold text-white">{forgotEmail}</span>
                      </p>
                    </div>
                    <div>
                      <label className="login-label">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => {
                            setNewPassword(e.target.value);
                            clearError();
                          }}
                          placeholder="Enter new password"
                          autoFocus
                          className="login-input pr-12"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowNewPassword(p => !p)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {newPassword && newPassword.length < 6 && (
                        <p className="login-field-error mt-2">
                          <AlertTriangle className="w-3 h-3" /> Minimum 6 characters
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="login-label">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showNewConfirmPwd ? 'text' : 'password'}
                          value={newConfirmPwd}
                          onChange={e => {
                            setNewConfirmPwd(e.target.value);
                            clearError();
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && newPassword.length >= 6 && newConfirmPwd === newPassword && !forgotLoading) {
                              handleResetPassword();
                            }
                          }}
                          placeholder="Confirm new password"
                          className="login-input pr-12"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowNewConfirmPwd(p => !p)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                        >
                          {showNewConfirmPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {newConfirmPwd && newConfirmPwd !== newPassword && (
                        <p className="login-field-error mt-2">
                          <AlertTriangle className="w-3 h-3" /> Passwords do not match
                        </p>
                      )}
                    </div>
                    {authError && <LoginError message={authError} />}
                    <button
                      onClick={handleResetPassword}
                      disabled={!newPassword || newPassword.length < 6 || newPassword !== newConfirmPwd || forgotLoading}
                      className="login-btn-primary w-full"
                      style={{
                        background:
                          'linear-gradient(135deg, #f59e0b, #d97706)',
                      }}
                    >
                      {forgotLoading ? (
                        <Loader2 className="animate-spin w-5 h-5" />
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5" /> Reset Password
                        </>
                      )}
                    </button>
                    <p className="text-center text-sm text-white/25">
                      <button
                        onClick={() => {
                          setForgotStep('email');
                          setNewPassword('');
                          setNewConfirmPwd('');
                          clearError();
                        }}
                        className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
                      >
                        Use a different email
                      </button>
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ═══ SIGNUP ═══ */}
          {step === 'signup' && (
            <div className="login-step-slide space-y-5">
              <BackBtn onClick={() => goStep('main')} />
              <div className="login-glass-card">
                {/* Block signup if account already exists */}
                {existingAccount ? (
                  <div className="text-center space-y-4 py-4">
                    <div className="login-icon-box bg-gradient-to-br from-amber-500 to-orange-600 mx-auto mb-4">
                      <AlertTriangle className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-xl font-black text-white tracking-tight">
                      Account Already Exists
                    </h2>
                    <p className="text-white/50 text-sm leading-relaxed">
                      You already have an account as <span className="text-amber-400 font-black">{existingAccount.role === 'MANUFACTURER' ? 'Manufacturer' : existingAccount.role === 'DISTRIBUTOR' ? 'Distributor' : existingAccount.role === 'RETAILER' ? 'Shopkeeper' : 'Business'}</span>
                      {existingAccount.appId && <span className="text-white/30"> ({existingAccount.appId})</span>}.
                    </p>
                    <p className="text-white/30 text-xs leading-relaxed">
                      Each device can have only one account. To change your role, sign in and delete your current account from <span className="text-rose-400 font-bold">Settings → Danger Zone</span>, then create a new one.
                    </p>
                    <button onClick={() => goStep('main')} className="login-btn-primary w-full mt-2">
                      <ArrowRight className="w-5 h-5" /> Go to Sign In
                    </button>
                  </div>
                ) : (
                <>
                <div className="text-center">
                  <div className="login-icon-box bg-gradient-to-br from-indigo-500 to-violet-600 mx-auto mb-4">
                    <Star className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Create Account
                  </h2>
                  <p className="text-white/40 text-sm mt-1">
                    Set up your Vyaparika profile
                  </p>
                  {selectedRole && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] mt-3">
                      <span className="text-xs font-bold text-white/60">Signing up as</span>
                      <span className="text-xs font-black text-indigo-400">
                        {selectedRole === 'MANUFACTURER' ? 'Manufacturer' : selectedRole === 'DISTRIBUTOR' ? 'Distributor' : 'Shopkeeper'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3.5">
                  {/* Email */}
                  <div>
                    <label className="login-label">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={e => {
                          setEmail(e.target.value.toLowerCase().trim());
                          clearError();
                        }}
                        placeholder="yourname@gmail.com"
                        autoFocus
                        className="login-input pr-12"
                      />
                      {email && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          {isValidEmail(email) ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-400/60" />
                          )}
                        </div>
                      )}
                    </div>
                    {email && !isValidEmail(email) && (
                      <p className="login-field-error mt-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> Enter valid
                        email format
                      </p>
                    )}
                  </div>

                  {/* App ID */}
                  <div>
                    <label className="login-label">
                      App ID{' '}
                      <span className="text-white/15 normal-case">
                        (your unique login)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={appId}
                        onChange={e => {
                          setAppId(e.target.value.trim());
                          clearError();
                        }}
                        placeholder="my_business_id"
                        className="login-input pr-12"
                      />
                      {appId && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          {isValidAppId(appId) ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-400/60" />
                          )}
                        </div>
                      )}
                    </div>
                    {appId && !isValidAppId(appId) && (
                      <p className="login-field-error mt-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> Min 3 chars —
                        letters, numbers, . _ - only
                      </p>
                    )}
                  </div>

                  {/* Mobile */}
                  <div>
                    <label className="login-label">Mobile Number</label>
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1.5 px-3.5 py-3.5 rounded-2xl bg-white/[0.07] border-2 border-white/[0.08] shrink-0">
                        <span className="text-base">🇮🇳</span>
                        <span className="font-black text-white/60 text-xs">
                          +91
                        </span>
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        value={signupMobile}
                        onChange={e => {
                          setSignupMobile(e.target.value.replace(/\D/g, ''));
                          clearError();
                        }}
                        placeholder="9876543210"
                        className="login-input flex-1 tracking-wide"
                      />
                    </div>
                    {signupMobile && !isValidMobile(signupMobile) && (
                      <p className="login-field-error mt-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> Enter 10-digit
                        number
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="login-label">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => {
                          setPassword(e.target.value);
                          clearError();
                        }}
                        placeholder="Min 6 characters"
                        className="login-input pr-14"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-[18px] h-[18px]" />
                        ) : (
                          <Eye className="w-[18px] h-[18px]" />
                        )}
                      </button>
                    </div>
                    {password &&
                      (() => {
                        const s = getPasswordStrength(password);
                        return (
                          <div className="mt-2.5 space-y-1.5">
                            <div className="flex gap-1.5">
                              {[1, 2, 3].map(i => (
                                <div
                                  key={i}
                                  className="h-1 flex-1 rounded-full transition-all"
                                  style={{
                                    background:
                                      i <= s.level
                                        ? s.color
                                        : 'rgba(255,255,255,0.08)',
                                  }}
                                />
                              ))}
                            </div>
                            <p
                              className="text-[10px] font-bold"
                              style={{ color: s.color }}
                            >
                              {s.label} password
                            </p>
                          </div>
                        );
                      })()}
                  </div>

                  {/* Owner Name */}
                  <div>
                    <label className="login-label">
                      Owner Name <span className="text-red-400/60">*</span>
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={e => {
                        setOwnerName(e.target.value);
                        clearError();
                      }}
                      placeholder="e.g. Rahul Sharma"
                      className="login-input"
                    />
                  </div>

                  {/* Business / Shop Name */}
                  <div>
                    <label className="login-label">
                      Business Name <span className="text-red-400/60">*</span>
                    </label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={e => {
                        setShopName(e.target.value);
                        clearError();
                      }}
                      placeholder="e.g. Sharma General Store"
                      className="login-input"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="login-label">
                      City <span className="text-red-400/60">*</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => {
                        setCity(e.target.value);
                        clearError();
                      }}
                      placeholder="e.g. Mumbai"
                      className="login-input"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="login-label">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPwd ? 'text' : 'password'}
                        value={confirmPwd}
                        onChange={e => {
                          setConfirmPwd(e.target.value);
                          clearError();
                        }}
                        onKeyDown={e =>
                          e.key === 'Enter' &&
                          email &&
                          password &&
                          confirmPwd === password &&
                          handleSignup()
                        }
                        placeholder="Repeat password"
                        className="login-input pr-14"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showConfirmPwd ? (
                          <EyeOff className="w-[18px] h-[18px]" />
                        ) : (
                          <Eye className="w-[18px] h-[18px]" />
                        )}
                      </button>
                    </div>
                    {confirmPwd && password !== confirmPwd && (
                      <p className="text-xs text-red-400/80 font-bold mt-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" /> Passwords don't
                        match
                      </p>
                    )}
                    {confirmPwd &&
                      password === confirmPwd &&
                      confirmPwd.length > 0 && (
                        <p className="text-xs text-emerald-400/80 font-bold mt-2 flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3" /> Passwords match
                        </p>
                      )}
                  </div>
                </div>

                {authError && <LoginError message={authError} />}

                <button
                  onClick={handleSignup}
                  disabled={
                    !selectedRole ||
                    !email ||
                    !isValidEmail(email) ||
                    !appId ||
                    !isValidAppId(appId) ||
                    !signupMobile ||
                    !isValidMobile(signupMobile) ||
                    !password ||
                    password !== confirmPwd ||
                    !ownerName.trim() ||
                    !shopName.trim() ||
                    !city.trim() ||
                    loading
                  }
                  className="login-btn-primary w-full"
                >
                  {loading ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" /> Create Account
                    </>
                  )}
                </button>
                <p className="text-center text-sm text-white/25">
                  Already have an account?{' '}
                  <button
                    onClick={() => goStep('main')}
                    className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
                  >
                    Sign in
                  </button>
                </p>
                </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* OTP modal */}
      <OtpModal
        open={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        onSuccess={handleOtpSuccess}
        selectedRole={selectedRole}
      />

      {/* Scoped styles */}
      <style>{loginPageStyles}</style>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   CSS — all scoped under `.login-page` or login-* class names
   ═══════════════════════════════════════════════════════════════════════════ */

const loginPageStyles = `
/* ── Google Fonts import (Inter for professional look) ── */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

/* ── Page wrapper ── */
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow: hidden;
  font-family: 'Inter', 'Plus Jakarta Sans', system-ui, sans-serif;
}

/* ── Background image layer (forest road aesthetic) ── */
.login-bg-image {
  position: fixed;
  inset: 0;
  background:
    url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80')
    center / cover no-repeat;
  z-index: 0;
}

/* ── Dark gradient overlay for readability ── */
.login-bg-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(
      135deg,
      rgba(5, 5, 20, 0.92) 0%,
      rgba(15, 10, 45, 0.88) 30%,
      rgba(10, 20, 50, 0.9) 60%,
      rgba(5, 8, 22, 0.95) 100%
    );
  backdrop-filter: blur(2px);
}

/* ── Floating particles ── */
.login-particle {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 2;
  animation: loginFloat linear infinite;
}

@keyframes loginFloat {
  0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
  25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
  50% { transform: translateY(-10px) translateX(-5px); opacity: 0.4; }
  75% { transform: translateY(-30px) translateX(15px); opacity: 0.5; }
}

/* ── Gradient orbs ── */
.login-orb {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 2;
  filter: blur(100px);
}
.login-orb-1 {
  top: -20%;
  left: -15%;
  width: 600px;
  height: 600px;
  opacity: 0.18;
  background: radial-gradient(circle, rgba(99,102,241,0.6), transparent);
}
.login-orb-2 {
  bottom: -20%;
  right: -15%;
  width: 500px;
  height: 500px;
  opacity: 0.12;
  background: radial-gradient(circle, rgba(168,85,247,0.6), transparent);
}

/* ── Card wrapper ── */
.login-card-wrapper {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 460px;
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
.login-card-hidden {
  opacity: 0;
  transform: translateY(24px) scale(0.96);
}
.login-card-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* ── Step animations ── */
.login-step-animate {
  animation: loginFadeZoom 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes loginFadeZoom {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}

.login-step-slide {
  animation: loginSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes loginSlideIn {
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
}

.login-fade-in {
  animation: loginFadeOnly 0.2s ease-out both;
}
@keyframes loginFadeOnly {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Home button ── */
.login-home-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.5);
  font-size: 12px;
  font-weight: 700;
  transition: all 0.3s ease;
  cursor: pointer;
  backdrop-filter: blur(8px);
}
.login-home-btn:hover {
  background: rgba(255,255,255,0.14);
  color: rgba(255,255,255,0.8);
  transform: translateY(-1px);
}

/* ── Logo ── */
.login-logo-box {
  width: 80px;
  height: 80px;
  border-radius: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #4f46e5, #7c3aed, #6366f1);
  box-shadow: 0 12px 40px rgba(79,70,229,0.4);
}
.login-logo-shimmer {
  position: absolute;
  inset: 0;
  opacity: 0.3;
  background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%);
  animation: loginShimmer 3s infinite;
}
@keyframes loginShimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
.login-logo-glow {
  position: absolute;
  inset: -12px;
  border-radius: 1.8rem;
  opacity: 0.4;
  filter: blur(20px);
  z-index: -1;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
}

/* ── Section labels ── */
.login-section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 900;
  color: rgba(129,140,248,0.6);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  padding-left: 4px;
}

/* ── Role cards ── */
.login-role-card {
  position: relative;
  padding: 16px 8px 14px;
  border-radius: 20px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  outline: none;
}
.login-role-card:active {
  transform: scale(0.96);
}
.login-role-idle {
  background: rgba(255,255,255,0.05);
  border: 1.5px solid rgba(255,255,255,0.08);
}
.login-role-idle:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.15);
  transform: scale(1.05);
}
.login-role-active {
  background: rgba(255,255,255,0.12);
  border: 2px solid transparent;
  transform: scale(1.05);
}
.login-role-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  transition: all 0.3s ease;
}

/* ── Glass card (inner panels) ── */
.login-glass-card {
  background: rgba(255,255,255,0.06);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border-radius: 2rem;
  border: 1px solid rgba(255,255,255,0.08);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 0 25px 60px rgba(0,0,0,0.4);
}
@media (min-width: 640px) {
  .login-glass-card { padding: 32px; }
}

/* ── Icon box ── */
.login-icon-box {
  width: 56px;
  height: 56px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Labels ── */
.login-label {
  display: block;
  font-size: 10px;
  font-weight: 900;
  color: rgba(255,255,255,0.3);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 10px;
}

/* ── Inputs ── */
.login-input {
  width: 100%;
  background: rgba(255,255,255,0.07);
  border: 2px solid rgba(255,255,255,0.08);
  border-radius: 1rem;
  padding: 14px 20px;
  font-weight: 600;
  font-size: 1rem;
  color: white;
  outline: none;
  transition: all 0.3s ease;
  font-family: inherit;
}
.login-input::placeholder {
  color: rgba(255,255,255,0.2);
}
.login-input:focus {
  border-color: rgba(99,102,241,0.6);
  background: rgba(255,255,255,0.09);
  box-shadow: 0 0 0 4px rgba(99,102,241,0.1);
}

/* ── Field-level error ── */
.login-field-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: rgba(251,191,36,0.7);
}

/* ── Error banner ── */
.login-error-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-radius: 1rem;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.2);
}

/* ── Success banner ── */
.login-success-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-radius: 1rem;
  background: rgba(16,185,129,0.1);
  border: 1px solid rgba(16,185,129,0.25);
}

/* ── Primary button ── */
.login-btn-primary {
  position: relative;
  overflow: hidden;
  height: 56px;
  border-radius: 1rem;
  font-weight: 900;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  box-shadow: 0 8px 30px rgba(79,70,229,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
  font-family: inherit;
}
.login-btn-primary:hover:not(:disabled) {
  box-shadow: 0 12px 40px rgba(79,70,229,0.5), inset 0 1px 0 rgba(255,255,255,0.15);
  transform: translateY(-2px);
}
.login-btn-primary:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 4px 16px rgba(79,70,229,0.3);
}
.login-btn-primary:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.login-btn-primary-bg {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}
.login-btn-primary:hover .login-btn-primary-bg {
  opacity: 1;
}

/* ── Verify button (green) ── */
.login-btn-verify {
  height: 56px;
  border-radius: 1rem;
  font-weight: 900;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 8px 30px rgba(16,185,129,0.4);
  font-family: inherit;
}
.login-btn-verify:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(16,185,129,0.5);
}
.login-btn-verify:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}
.login-btn-verify:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ── Secondary button ── */
.login-btn-secondary {
  height: 56px;
  border-radius: 1rem;
  font-weight: 900;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: white;
  border: 1.5px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  font-family: inherit;
}
.login-btn-secondary:hover {
  background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.2);
  transform: translateY(-2px);
}
.login-btn-secondary:active {
  transform: translateY(0) scale(0.98);
}

/* ── Disabled state for secondary button ── */
.login-btn-disabled {
  opacity: 0.4;
  cursor: not-allowed !important;
  pointer-events: auto;
}
.login-btn-disabled:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.1);
  transform: none;
}

/* ── Existing account banner ── */
.login-existing-account-banner {
  background: rgba(16,185,129,0.08);
  border: 1px solid rgba(16,185,129,0.2);
  border-radius: 12px;
  padding: 10px 14px;
  backdrop-filter: blur(6px);
}

/* ── Google button ── */
.login-btn-google {
  height: 56px;
  border-radius: 1rem;
  font-weight: 900;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #374151;
  background: white;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}
.login-btn-google:hover:not(:disabled) {
  background: #f9fafb;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.login-btn-google:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}
.login-btn-google:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── OTP / phone button ── */
.login-btn-otp {
  height: 52px;
  border-radius: 1rem;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: rgba(255,255,255,0.4);
  background: transparent;
  border: 1px solid rgba(255,255,255,0.06);
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}
.login-btn-otp:hover {
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.7);
  border-color: rgba(255,255,255,0.12);
}
.login-btn-otp:active {
  transform: scale(0.98);
}

/* ── Divider ── */
.login-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 2px 0;
}
.login-divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
}
.login-divider-text {
  font-size: 10px;
  font-weight: 900;
  color: rgba(255,255,255,0.2);
  text-transform: uppercase;
  letter-spacing: 0.2em;
}

/* ── OTP box ── */
.login-otp-box {
  width: 48px;
  height: 56px;
  border-radius: 1rem;
  border: 2px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.05);
  text-align: center;
  font-size: 1.5rem;
  font-weight: 900;
  color: white;
  outline: none;
  transition: all 0.3s ease;
  font-family: inherit;
}
.login-otp-box:focus {
  border-color: rgba(99,102,241,0.6);
  background: rgba(99,102,241,0.1);
  box-shadow: 0 0 0 4px rgba(99,102,241,0.1);
}

/* ── OTP Modal ── */
.login-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(8px);
  animation: loginFadeOnly 0.2s ease-out both;
}
.login-modal-content {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: rgba(15,10,45,0.95);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 1.5rem;
  padding: 28px;
  box-shadow: 0 25px 80px rgba(0,0,0,0.6);
}
@media (min-width: 640px) {
  .login-modal-content { padding: 32px; }
}

/* ── Responsive tweaks ── */
@media (max-width: 480px) {
  .login-page { padding: 0.75rem; }
  .login-glass-card { padding: 20px; }
  .login-role-card { padding: 12px 6px 10px; }
  .login-role-icon-wrap { width: 38px; height: 38px; border-radius: 12px; }
  .login-btn-primary,
  .login-btn-secondary,
  .login-btn-google { height: 50px; font-size: 14px; }
}
`;

export default LoginPage;
