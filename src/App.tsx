
// ==========================================
// IMPORT SECTION
// React, Lucide Icons, Types, Constants, Services, and UI Components
// ==========================================
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, Package, BrainCircuit, Settings, Plus, Search,
  AlertTriangle, CheckCircle, ArrowUpRight, TrendingUp, MapPin,
  Truck, Factory, Camera, ChevronRight, ShieldCheck, Globe,
  Menu, X, Smartphone, User, Bell, Lock, LogOut, Info, Box, MoreVertical,
  ChevronDown, Check, Minus, PlusCircle, Sparkles, Loader2, Moon, Sun, Monitor,
  BarChart3, Map as MapIcon, Layers, Scan, RefreshCw, Briefcase, Mail, Phone,
  Building2, Calendar, FileText, MapPinned, CreditCard, KeyRound, ArrowLeft,
  Store, Navigation, Trash2, Zap, Eye, EyeOff, Fingerprint, Shield, Star,
  ArrowRight, ChevronLeft, UserPlus, Users, SlidersHorizontal, UserCheck, Clock, Link2, ExternalLink
} from 'lucide-react';
import { UserRole, ShopType, LanguageCode, SKU, AppState, UserProfile, StockLog, MovementType, ThemeMode, Expense, BusinessConnection, Payment, PaymentMethod, PaymentType, PaymentStatus } from './types';
import { TRANSLATIONS, CATEGORIES, UNITS, INDIAN_LANGUAGES, EXPENSE_CATEGORIES } from './constants';
import { getInventoryInsights, predictSKUMetadata, identifyProductFromImage, SKUPrediction } from './services/geminiService';
import { useGeolocation } from './hooks/useGeolocation';
import { signInWithGoogle, sendPhoneOtp, verifyPhoneOtp, upsertUserProfile, onAuthStateChange, getSession, signOut } from './services/authService';
import LoginPage from './components/auth/LoginPage';
import SkuVelocityPage from './components/inventory/SkuVelocityPage';
import CampaignsPage from './components/campaigns/CampaignsPage';
import BusinessProfilePage from './components/profile/BusinessProfilePage';
import NetworkPage from './components/network/NetworkPage';
import PremiumPaymentPage from './components/premium/PremiumPaymentPage';
import {
  followBusiness as connectionsServiceFollow,
  acceptConnection as connectionsServiceAccept,
  rejectConnection as connectionsServiceReject,
  unfollowBusiness as connectionsServiceUnfollow,
  fetchConnections as connectionsServiceFetchConnections,
  searchBusinesses as connectionsServiceSearch,
  fetchProfilesByIds as connectionsServiceFetchProfiles,
  subscribeToConnections as connectionsServiceSubscribe,
  fetchRecommendedBusinesses as connectionsServiceRecommend,
} from './services/connectionsService';
import {
  fetchExpenses as expensesServiceFetch,
  addExpense as expensesServiceAdd,
  deleteExpense as expensesServiceDelete,
  subscribeToExpenses as expensesServiceSubscribe,
} from './services/expensesService';
import {
  subscribeToConnectionNotifications,
  subscribeToExpenseNotifications,
  checkStockNotifications,
  type AppNotification,
} from './services/notificationService';

// --- Error Boundary — catches runtime crashes in child components ---

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Vyaparika] Uncaught error:', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
          <div className="text-center max-w-md space-y-4">
            <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center" style={{ background: 'rgba(244,63,94,0.1)' }}>
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-xl font-black text-slate-800 text-slate-900 dark:text-white">Something went wrong</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); }}
              className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// SHARED GLOBAL UI COMPONENTS
// Common building blocks like Button, Card, Badge, ExpiryAlertBadge
// ==========================================

const Button: React.FC<{ 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'ai'; 
  children: React.ReactNode; 
  className?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit';
}> = ({ onClick, variant = 'primary', children, className = '', fullWidth = false, disabled = false, loading = false, type = 'button' }) => {
  const base = "min-h-12 px-5 py-3 rounded-[10px] font-bold text-sm tracking-wide transition-all duration-150 flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none select-none cursor-pointer";
  const variants = {
    primary: "app-primary-btn shadow-sm hover:opacity-95 active:opacity-90",
    secondary: "app-secondary-btn hover:bg-slate-50 dark:hover:bg-slate-800/60",
    danger: "app-danger-btn hover:bg-rose-50 dark:hover:bg-rose-900/20",
    ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60",
    success: "min-h-12 rounded-[10px] text-white border border-transparent hover:opacity-95 active:opacity-90",
    ai: "app-primary-btn shadow-sm hover:opacity-95 active:opacity-90"
  };
  const successStyle = variant === 'success' ? { background: 'var(--color-success)', color: 'var(--color-on-accent)' } : undefined;
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`} style={successStyle}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`rounded-2xl p-5 border card-pro ${className} ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''}`}
    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
    {children}
  </div>
);

const Badge: React.FC<{ status: SKU['status'] }> = ({ status }) => {
  const styles = {
    OPTIMAL: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-700/50",
    LOW: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-700/50",
    EXCESS: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:ring-indigo-700/50",
    CRITICAL: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:ring-rose-700/50"
  };
  const dots = { OPTIMAL: 'bg-emerald-500', LOW: 'bg-amber-500', EXCESS: 'bg-indigo-500', CRITICAL: 'bg-rose-500' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
      {status}
    </span>
  );
};

// --- Expiry Alert Badge ---
const ExpiryAlertBadge: React.FC<{ expiryDate: string }> = ({ expiryDate }) => {
  const [tipVisible, setTipVisible] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const days = Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);

  if (days > 30) return null;

  const isExpired  = days <= 0;
  const isCritical = days > 0 && days <= 7;
  // isWarning: 8–30 days

  const formattedDate = expiry.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const tooltipText = isExpired
    ? `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago · ${formattedDate}`
    : `Expires in ${days} day${days !== 1 ? 's' : ''} · ${formattedDate}`;

  // Colours
  const pill = isExpired || isCritical
    ? { bg: 'rgba(254,226,226,0.85)', border: '#fca5a5', text: '#b91c1c', dot: '#ef4444', shadow: 'rgba(239,68,68,0.18)' }
    : { bg: 'rgba(255,237,213,0.85)', border: '#fdba74', text: '#c2410c', dot: '#f97316', shadow: 'rgba(249,115,22,0.18)' };

  const iconPath = isExpired || isCritical
    // Solid triangle warning
    ? 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01'
    // Circle caution
    : 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 8v4 M12 16h.01';

  const label = isExpired
    ? 'Expired'
    : isCritical
    ? `Exp. in ${days}d`
    : `Exp. in ${days}d`;

  return (
    <div
      className="relative inline-flex items-center gap-1 mt-1.5"
      onMouseEnter={() => setTipVisible(true)}
      onMouseLeave={() => setTipVisible(false)}
    >
      {/* Pill badge */}
      <div
        style={{
          display:       'inline-flex',
          alignItems:    'center',
          gap:           '5px',
          padding:       '2px 8px 2px 5px',
          borderRadius:  '6px',
          background:    pill.bg,
          border:        `1px solid ${pill.border}`,
          boxShadow:     `0 1px 4px ${pill.shadow}`,
          cursor:        'default',
        }}
      >
        {/* Icon */}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke={pill.dot} strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          {iconPath.split(' M').map((seg, k) => (
            <path key={k} d={k === 0 ? seg : 'M' + seg} />
          ))}
        </svg>
        {/* Text */}
        <span
          style={{
            fontSize:    '10px',
            fontWeight:  isExpired || isCritical ? 800 : 700,
            color:       pill.text,
            lineHeight:  1,
            letterSpacing: '0.02em',
            whiteSpace:  'nowrap',
          }}
        >
          {label}
        </span>
      </div>

      {/* Tooltip */}
      {tipVisible && (
        <div
          className="expiry-tooltip"
          style={{
            position:    'absolute',
            bottom:      'calc(100% + 7px)',
            left:        0,
            zIndex:      9999,
            background:  '#1e293b',
            color:       '#f1f5f9',
            fontSize:    '11px',
            fontWeight:  600,
            lineHeight:  1.45,
            padding:     '6px 10px',
            borderRadius:'8px',
            whiteSpace:  'nowrap',
            boxShadow:   '0 4px 16px rgba(0,0,0,0.3)',
            pointerEvents:'none',
            // accent top border
            borderTop:   `2px solid ${pill.dot}`,
          }}
        >
          {tooltipText}
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            top: '100%', left: '12px',
            width: 0, height: 0,
            borderLeft:  '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop:   '5px solid #1e293b',
          }} />
        </div>
      )}
    </div>
  );
};

// --- Login Record Helpers ---
interface LoginRecord {
  businessName: string;
  roleName: string;
  roleId: UserRole;
  loginMethod: string;
  timestamp: string;
  email?: string;
}

const getLastLogins = (): LoginRecord[] => {
  try { return JSON.parse(localStorage.getItem('vyaparika_last_logins') || '[]'); }
  catch { return []; }
};

const saveLoginRecord = (record: LoginRecord) => {
  const existing = getLastLogins();
  const updated = [record, ...existing.filter(r => {
    // Match by email (most reliable) or by businessName+roleId combo
    if (record.email && r.email) return r.email !== record.email;
    return !(r.businessName === record.businessName && r.roleId === record.roleId);
  })].slice(0, 3);
  localStorage.setItem('vyaparika_last_logins', JSON.stringify(updated));
};

const removeLoginRecord = (email?: string, businessName?: string, roleId?: UserRole) => {
  const updated = getLastLogins().filter(r => {
    // Remove if email matches
    if (email && r.email && r.email === email) return false;
    // Remove if businessName + roleId match
    if (businessName && r.businessName === businessName && (!roleId || r.roleId === roleId)) return false;
    // Remove generic fallback entries that match roleId
    if (!businessName && roleId && r.roleId === roleId && r.businessName === 'Business Account') return false;
    return true;
  });
  localStorage.setItem('vyaparika_last_logins', JSON.stringify(updated));
};

// --- ONE-TIME DATA WIPE (remove this block after first load) ---
(() => {
  if (!localStorage.getItem('vyaparika_wiped_v1')) {
    localStorage.removeItem('vyaparika_accounts');
    localStorage.removeItem('vyaparika_last_logins');
    localStorage.removeItem('vyaparika_state_v2');
    localStorage.removeItem('vyaparika_state_v1.6');
    localStorage.removeItem('vyaparika_state_v1.7');
    localStorage.setItem('vyaparika_wiped_v1', '1');
    console.log('[Vyaparika] All login data cleared.');
  }
})();
// --- END ONE-TIME WIPE ---

// --- Per-email Profile Registry (for returning user detection) ---
const USER_PROFILES_KEY = 'vyaparika_user_profiles';

interface SavedUserProfile {
  email: string;
  role?: UserRole;
  language?: string;
  profile: Partial<UserProfile>;
  savedAt: string;
}

const getSavedUserProfiles = (): SavedUserProfile[] => {
  try { return JSON.parse(localStorage.getItem(USER_PROFILES_KEY) || '[]'); }
  catch { return []; }
};

const findSavedProfileByEmail = (email: string): SavedUserProfile | null =>
  getSavedUserProfiles().find(p => p?.email?.toLowerCase?.() === email.toLowerCase()) ?? null;

const saveUserProfileToRegistry = (email: string, role: UserRole | undefined, language: string | undefined, profile: Partial<UserProfile>) => {
  if (!email) return;
  const existing = getSavedUserProfiles().filter(p => p?.email?.toLowerCase?.() !== email.toLowerCase());
  existing.push({ email, role, language, profile, savedAt: new Date().toISOString() });
  localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(existing));
};

const removeProfileFromRegistry = (email: string) => {
  if (!email) return;
  const updated = getSavedUserProfiles().filter(p => p?.email?.toLowerCase?.() !== email.toLowerCase());
  localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(updated));
};

// --- Account Registry ---
const STATE_KEY = 'vyaparika_state_v2';
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
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]'); }
  catch { return []; }
};

const saveAccount = (account: AccountRecord) => {
  const key = account.appId || account.email;
  const existing = getAccounts().filter(a => (a.appId || a.email) !== key);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...existing, account]));
};

const deleteAccountFromRegistry = (identifier: string) => {
  if (!identifier) return; // Safety: don't delete anything if identifier is empty
  const before = getAccounts();
  const updated = before.filter(a => {
    // Only remove the account that matches this specific identifier
    if (a.email === identifier) return false;
    if (a.appId === identifier) return false;
    return true;
  });
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updated));
};

const findAccountByAppId = (appId: string, password: string): AccountRecord | null =>
  getAccounts().find(a => (a.appId === appId || a.email === appId) && a.password === password) ?? null;

const findAccount = (email: string, password: string): AccountRecord | null =>
  getAccounts().find(a => a.email === email && a.password === password) ?? null;

// ==========================================
// CORE APP COMPONENTS: AUTHENTICATION FLOW
// Component for handling login, mobile OTP, and signups
// ==========================================

const AuthFlow: React.FC<{ onAuthSuccess: (method: string, data?: any) => void, t: any, lastLogins: LoginRecord[] }> = ({ onAuthSuccess, t, lastLogins }) => {
  const [step, setStep] = useState<'main' | 'mobile' | 'otp' | 'gmail_email' | 'gmail_password' | 'forgot' | 'signup'>('main');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [appId, setAppId] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [particleSeeds] = useState(() => Array.from({ length: 20 }, () => ({
    x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 3 + 1, delay: Math.random() * 5, duration: Math.random() * 10 + 10
  })));
  const otpRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  // Dynamic greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else if (hour < 21) setGreeting('Good Evening');
    else setGreeting('Good Night');
  }, []);

  const roleOptions = [
    { id: UserRole.MANUFACTURER, label: 'Manufacturer', desc: 'Factory / Production', icon: Factory, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', emoji: '🏭' },
    { id: UserRole.DISTRIBUTOR, label: 'Distributor', desc: 'Wholesale / Supply', icon: Truck, color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)', emoji: '🚛' },
    { id: UserRole.RETAILER, label: 'Shopkeeper', desc: 'Shop / Kirana Store', icon: Store, color: '#6366f1', gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)', emoji: '🏪' },
  ];

  // Validation helpers
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const isValidAppId = (val: string) => val.length >= 3 && /^[a-zA-Z0-9_.-]+$/.test(val);
  const isValidMobile = (val: string) => /^\d{10}$/.test(val);

  const handleEmailAuth = () => {
    if (!appId || !password) return;
    const account = findAccountByAppId(appId, password);
    if (!account) { setAuthError('Incorrect App ID or password. Please try again.'); return; }
    setAuthError(''); setLoading(true);
    setTimeout(() => { setLoading(false); onAuthSuccess('email', { email: account.email, appId: account.appId, role: account.role || selectedRole }); }, 1000);
  };

  const handleSignup = () => {
    if (!email || !appId || !signupMobile || !password || password !== confirmPwd) return;
    if (!isValidEmail(email)) { setAuthError('Please enter a valid Gmail address.'); return; }
    if (!isValidAppId(appId)) { setAuthError('App ID must be 3+ chars (letters, numbers, . _ - only).'); return; }
    if (!isValidMobile(signupMobile)) { setAuthError('Please enter a valid 10-digit mobile number.'); return; }
    if (getAccounts().some(a => a.appId === appId)) { setAuthError('This App ID is already taken. Choose another.'); return; }
    if (getAccounts().some(a => a.email === email)) { setAuthError('This Gmail is already registered. Please sign in.'); return; }
    setAuthError(''); setLoading(true);
    setTimeout(() => {
      saveAccount({ email, appId, mobile: signupMobile, password, role: selectedRole || undefined, createdAt: new Date().toISOString() });
      setLoading(false); onAuthSuccess('email', { email, appId, role: selectedRole });
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setAuthError('');
    try {
      await signInWithGoogle();
      // Redirect happens — the onAuthStateChange listener in App picks up the session
    } catch (err: any) {
      setAuthError(err?.message || 'Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleMobileContinue = async () => {
    if (phone.length !== 10) return;
    setLoading(true);
    setAuthError('');
    try {
      await sendPhoneOtp('+91' + phone);
      setStep('otp');
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    setAuthError('');
    try {
      const { userId, phone: verifiedPhone } = await verifyPhoneOtp('+91' + phone, otp);
      // Save phone number to Supabase user_profiles table
      await upsertUserProfile({ id: userId, phone: verifiedPhone });
      setLoading(false);
      onAuthSuccess('mobile', { phone: verifiedPhone, role: selectedRole });
    } catch (err: any) {
      setAuthError(err?.message || 'Invalid OTP. Please try again.');
      setLoading(false);
    }
  };

  // Password strength indicator
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

  // Shared back button
  const BackBtn = ({ to }: { to: typeof step }) => (
    <button onClick={() => { setStep(to); setAuthError(''); }} className="group flex items-center gap-2 text-white/50 hover:text-white transition-all text-sm font-bold mb-2">
      <div className="w-9 h-9 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-all">
        <ChevronLeft className="w-4 h-4" />
      </div>
      <span className="group-hover:translate-x-0.5 transition-transform">Back</span>
    </button>
  );

  // Shared error banner
  const ErrorBanner = () => authError ? (
    <div className="rounded-2xl p-3.5 flex items-start gap-3 bg-red-500/10 border border-red-500/20 animate-in slide-in-from-top-2 duration-200">
      <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5"><AlertTriangle className="w-4 h-4 text-red-400" /></div>
      <div><p className="text-sm font-bold text-red-300">{authError}</p></div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6" style={{ background: 'linear-gradient(135deg, #0f0a2e 0%, #1a1145 30%, #0d1b3e 60%, #0a0f1e 100%)' }}>
      
      {/* Animated background particles */}
      {particleSeeds.map((p, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none" style={{
          left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
          background: i % 3 === 0 ? 'rgba(99,102,241,0.4)' : i % 3 === 1 ? 'rgba(168,85,247,0.3)' : 'rgba(59,130,246,0.3)',
          animation: `float ${p.duration}s ease-in-out infinite ${p.delay}s`,
        }} />
      ))}

      {/* Large decorative gradient orbs */}
      <div className="fixed top-[-20%] left-[-15%] w-[600px] h-[600px] rounded-full opacity-20 blur-[100px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.6), transparent)' }} />
      <div className="fixed bottom-[-20%] right-[-15%] w-[500px] h-[500px] rounded-full opacity-15 blur-[100px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.6), transparent)' }} />
      <div className="fixed top-[40%] right-[-10%] w-[300px] h-[300px] rounded-full opacity-10 blur-[80px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.6), transparent)' }} />

      {/* Floating grid pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div className="w-full max-w-[440px] relative z-10">
        
        {/* ===== MAIN SCREEN ===== */}
        {step === 'main' && (
          <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
            
            {/* Hero Section */}
            <div className="text-center space-y-4 mb-2">
              {/* Animated Logo */}
              <div className="relative inline-flex mb-3">
                <div className="w-20 h-20 rounded-[1.4rem] flex items-center justify-center shadow-2xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #6366f1)' }}>
                  <Package className="text-white w-10 h-10 relative z-10" />
                  <div className="absolute inset-0 opacity-30" style={{ background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)', animation: 'shimmer 3s infinite' }} />
                </div>
                <div className="absolute -inset-3 rounded-[1.8rem] opacity-40 blur-xl -z-10" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }} />
                {/* Sparkle dots */}
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
                <div className="absolute -bottom-0.5 -left-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
              <div>
                <h1 className="text-5xl font-black text-white tracking-tighter font-display" style={{ letterSpacing: '-0.04em' }}>
                  Vyaparika
                </h1>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="h-px w-8 bg-gradient-to-r from-transparent to-indigo-500/50" />
                  <p className="text-indigo-300/80 font-bold text-[11px] uppercase tracking-[0.25em]">AI Inventory Intelligence</p>
                  <div className="h-px w-8 bg-gradient-to-l from-transparent to-indigo-500/50" />
                </div>
              </div>
              <p className="text-white/40 text-sm font-medium">{greeting} — let's manage your business</p>
            </div>

            {/* Quick Login Cards */}
            {lastLogins.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-indigo-300/60 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Quick Login
                </p>
                {lastLogins.map((record, i) => (
                  <button key={i} onClick={() => { setSelectedRole(record.roleId); onAuthSuccess('quick', { role: record.roleId, businessName: record.businessName }); }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] hover:border-indigo-500/40 transition-all text-left group active:scale-[0.98] backdrop-blur-sm">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/20">
                      <User className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-white text-[15px] truncate">{record.businessName || 'Business Account'}</p>
                      <p className="text-xs font-semibold text-white/30 mt-0.5">{record.roleName} &bull; {new Date(record.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-indigo-600/20 group-hover:bg-indigo-600/40 flex items-center justify-center shrink-0 transition-all group-hover:translate-x-0.5">
                      <ArrowRight className="w-4 h-4 text-indigo-400" />
                    </div>
                  </button>
                ))}
                <div className="relative flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">or continue with</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              </div>
            )}

            {/* Role Selection — Compact Horizontal Cards */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-indigo-300/60 uppercase tracking-[0.2em] px-1">I am a...</p>
              <div className="grid grid-cols-3 gap-2.5">
                {roleOptions.map(role => {
                  const active = selectedRole === role.id;
                  return (
                    <button key={role.id} onClick={() => setSelectedRole(active ? null : role.id)}
                      className={`relative p-3.5 rounded-2xl text-center transition-all active:scale-[0.96] ${
                        active ? 'scale-[1.02] shadow-xl' : 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08]'
                      }`}
                      style={active ? { background: role.gradient, boxShadow: `0 10px 40px ${role.color}44` } : {}}>
                      <p className="text-2xl mb-1.5">{role.emoji}</p>
                      <p className={`text-[11px] font-black leading-tight ${active ? 'text-white' : 'text-white/60'}`}>{role.label}</p>
                      {active && <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white/30 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="space-y-3 pt-1">
              {/* Login with App ID — Primary */}
              <button onClick={() => setStep('gmail_email')} disabled={loading}
                className="w-full h-[56px] rounded-2xl font-black text-[15px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] relative overflow-hidden group text-white"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 8px 30px rgba(79,70,229,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
                <span className="relative z-10 flex items-center gap-3"><Fingerprint className="w-5 h-5" /> Login with App ID</span>
              </button>

              {/* Create Account — Secondary */}
              <button onClick={() => { setStep('signup'); setAuthError(''); }}
                className="w-full h-[56px] rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] hover:border-white/[0.2] font-black text-[15px] text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] backdrop-blur-sm">
                <Star className="w-5 h-5 text-amber-400" /> Create New Account
              </button>

              {/* Continue with Google */}
              <button onClick={handleGoogleSignIn} disabled={googleLoading}
                className="w-full h-[56px] rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 font-black text-[15px] text-gray-700 flex items-center justify-center gap-3 transition-all active:scale-[0.98] relative overflow-hidden group">
                {googleLoading ? (
                  <Loader2 className="animate-spin w-5 h-5 text-gray-500" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center gap-3 py-0.5">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              {/* Mobile OTP */}
              <button onClick={() => setStep('mobile')} disabled={loading}
                className="w-full h-[52px] rounded-2xl bg-transparent hover:bg-white/[0.05] border border-white/[0.06] font-bold text-sm text-white/40 hover:text-white/70 flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                <Smartphone className="w-4 h-4" /> Login with Mobile OTP
              </button>
            </div>

            {/* Footer */}
            <p className="text-[10px] text-white/15 font-semibold text-center pt-2">By continuing you agree to our Terms of Service & Privacy Policy</p>
          </div>
        )}

        {/* ===== APP ID STEP ===== */}
        {step === 'gmail_email' && (
          <div className="animate-in slide-in-from-right-6 duration-300 space-y-5">
            <BackBtn to="main" />
            <div className="bg-white/[0.06] backdrop-blur-xl rounded-[2rem] border border-white/[0.08] p-7 sm:p-8 space-y-6" style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                  <Fingerprint className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white font-display">Sign in</h2>
                <p className="text-white/40 text-sm mt-1">Enter your App ID to continue</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-2.5">App ID</label>
                <div className="relative">
                  <input type="text" value={appId} onChange={(e) => setAppId(e.target.value.trim())}
                    onKeyDown={(e) => e.key === 'Enter' && appId && isValidAppId(appId) && setStep('gmail_password')}
                    placeholder="my_business_id" autoFocus
                    className="w-full bg-white/[0.07] border-2 border-white/[0.08] focus:border-indigo-500/60 rounded-2xl py-4 px-5 pr-12 font-semibold text-white text-base placeholder:text-white/20 outline-none transition-all" />
                  {appId && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {isValidAppId(appId) 
                        ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                        : <AlertTriangle className="w-5 h-5 text-amber-400/60" />
                      }
                    </div>
                  )}
                </div>
                {appId && !isValidAppId(appId) && (
                  <p className="text-[11px] text-amber-400/70 font-bold mt-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" /> Min 3 chars — letters, numbers, . _ - only
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <button onClick={() => appId && isValidAppId(appId) && setStep('gmail_password')} disabled={!appId || !isValidAppId(appId)}
                  className="w-full h-[54px] rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: (appId && isValidAppId(appId)) ? '0 8px 30px rgba(79,70,229,0.4)' : 'none' }}>
                  Next <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-center text-sm text-white/30">Don't have an account?{' '}
                  <button onClick={() => { setStep('signup'); setAuthError(''); }} className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">Create one</button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===== PASSWORD STEP ===== */}
        {step === 'gmail_password' && (
          <div className="animate-in slide-in-from-right-6 duration-300 space-y-5">
            <BackBtn to="gmail_email" />
            <div className="bg-white/[0.06] backdrop-blur-xl rounded-[2rem] border border-white/[0.08] p-7 sm:p-8 space-y-6" style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
              {/* User avatar + ID chip */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border-2 border-indigo-500/20">
                  <User className="w-7 h-7 text-indigo-300" />
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] mb-3">
                  <Fingerprint className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-sm font-bold text-white/60 truncate max-w-[200px]">{appId}</span>
                </div>
                <h2 className="text-2xl font-black text-white font-display">Welcome back</h2>
              </div>
              <div className="relative">
                <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-2.5">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && appId && password && handleEmailAuth()}
                    placeholder="Enter your password" autoFocus
                    className="w-full bg-white/[0.07] border-2 border-white/[0.08] focus:border-indigo-500/60 rounded-2xl py-4 px-5 pr-14 font-semibold text-white text-base placeholder:text-white/20 outline-none transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/60 transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <ErrorBanner />
              <div className="space-y-3">
                <button onClick={handleEmailAuth} disabled={!password || loading}
                  className="w-full h-[54px] rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: password ? '0 8px 30px rgba(79,70,229,0.4)' : 'none' }}>
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Lock className="w-5 h-5" /> Sign In</>}
                </button>
                <div className="flex items-center justify-between">
                  <button onClick={() => { setStep('forgot'); setForgotSuccess(false); }} className="text-indigo-400/70 font-bold text-sm hover:text-indigo-400 transition-colors">
                    Forgot password?
                  </button>
                  <button onClick={() => { setStep('signup'); setAuthError(''); setPassword(''); setConfirmPwd(''); }} className="text-white/30 font-semibold text-sm hover:text-white/60 transition-colors">
                    Create account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== FORGOT PASSWORD ===== */}
        {step === 'forgot' && (
          <div className="animate-in slide-in-from-right-6 duration-300 space-y-5">
            <BackBtn to="gmail_password" />
            <div className="bg-white/[0.06] backdrop-blur-xl rounded-[2rem] border border-white/[0.08] p-7 sm:p-8 space-y-6" style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  <KeyRound className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white font-display">Reset Password</h2>
                <p className="text-white/40 text-sm mt-1">We'll send a reset link to your Gmail</p>
              </div>
              {forgotSuccess ? (
                <div className="rounded-2xl p-6 text-center space-y-4 bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    <Check className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-emerald-400 text-base">Reset Link Sent!</p>
                    <p className="text-sm text-white/40 mt-1">Check your registered Gmail inbox</p>
                  </div>
                  <button onClick={() => setStep('gmail_password')} className="text-indigo-400 font-bold text-sm hover:text-indigo-300 transition-colors">
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-2.5">App ID</label>
                    <input type="text" value={appId} onChange={(e) => setAppId(e.target.value.trim())}
                      placeholder="your_app_id" autoFocus
                      className="w-full bg-white/[0.07] border-2 border-white/[0.08] focus:border-amber-500/60 rounded-2xl py-4 px-5 font-semibold text-white text-base placeholder:text-white/20 outline-none transition-all" />
                  </div>
                  <button onClick={() => setForgotSuccess(true)} disabled={!appId || !isValidAppId(appId)}
                    className="w-full h-[54px] rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-30"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: email ? '0 8px 30px rgba(245,158,11,0.3)' : 'none' }}>
                    <Mail className="w-5 h-5" /> Send Reset Link
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ===== MOBILE LOGIN ===== */}
        {step === 'mobile' && (
          <div className="animate-in slide-in-from-right-6 duration-300 space-y-5">
            <BackBtn to="main" />
            <div className="bg-white/[0.06] backdrop-blur-xl rounded-[2rem] border border-white/[0.08] p-7 sm:p-8 space-y-6" style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                  <Smartphone className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white font-display">Mobile Login</h2>
                <p className="text-white/40 text-sm mt-1">We'll send a 6-digit verification code</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-2.5">Mobile Number</label>
                <div className="relative flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-4 rounded-2xl bg-white/[0.07] border-2 border-white/[0.08] shrink-0">
                    <span className="text-lg">🇮🇳</span>
                    <span className="font-black text-white/60 text-sm">+91</span>
                  </div>
                  <input type="tel" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="00000 00000" autoFocus
                    className="w-full bg-white/[0.07] border-2 border-white/[0.08] focus:border-indigo-500/60 rounded-2xl py-4 px-5 font-black text-xl tracking-[0.12em] text-white placeholder:text-white/15 outline-none transition-all" />
                </div>
                {phone.length > 0 && phone.length < 10 && (
                  <p className="text-xs text-amber-400/80 font-bold mt-2.5 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> Enter 10-digit number</p>
                )}
              </div>
              <button onClick={handleMobileContinue} disabled={phone.length !== 10}
                className="w-full h-[54px] rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: phone.length === 10 ? '0 8px 30px rgba(79,70,229,0.4)' : 'none' }}>
                Send OTP <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ===== OTP VERIFICATION ===== */}
        {step === 'otp' && (
          <div className="animate-in slide-in-from-right-6 duration-300 space-y-5">
            <BackBtn to="mobile" />
            <div className="bg-white/[0.06] backdrop-blur-xl rounded-[2rem] border border-white/[0.08] p-7 sm:p-8 space-y-6" style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white font-display">Verify OTP</h2>
                <p className="text-white/40 text-sm mt-1">Sent to <span className="font-black text-white/60">+91 {phone}</span></p>
              </div>
              {/* OTP Boxes */}
              <div className="flex gap-2.5 justify-center">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <input key={idx} ref={el => { otpRefs.current[idx] = el; }}
                    type="tel" maxLength={1} value={otp[idx] || ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      const arr = otp.split(''); arr[idx] = val;
                      const next = arr.join('').slice(0, 6); setOtp(next);
                      if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
                    }}
                    onKeyDown={e => { if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus(); }}
                    className="w-12 h-14 rounded-2xl border-2 text-center text-2xl font-black outline-none transition-all"
                    style={otp[idx]
                      ? { borderColor: 'rgba(99,102,241,0.6)', background: 'rgba(99,102,241,0.1)', color: 'white' }
                      : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: 'white' }
                    }
                    autoFocus={idx === 0} />
                ))}
              </div>
              <button onClick={handleVerifyOtp} disabled={otp.length !== 6 || loading}
                className="w-full h-[54px] rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: otp.length === 6 ? '0 8px 30px rgba(16,185,129,0.4)' : 'none' }}>
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><ShieldCheck className="w-5 h-5" /> Verify &amp; Continue</>}
              </button>
              <button className="w-full text-center text-indigo-400/60 font-bold text-sm hover:text-indigo-400 transition-colors">Resend OTP</button>
            </div>
          </div>
        )}

        {/* ===== SIGNUP ===== */}
        {step === 'signup' && (
          <div className="animate-in slide-in-from-right-6 duration-300 space-y-5">
            <BackBtn to="main" />
            <div className="bg-white/[0.06] backdrop-blur-xl rounded-[2rem] border border-white/[0.08] p-7 sm:p-8 space-y-5" style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                  <Star className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white font-display">Create Account</h2>
                <p className="text-white/40 text-sm mt-1">Set up your Vyaparika profile</p>
              </div>
              <div className="space-y-3.5">
                {/* Gmail */}
                <div>
                  <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Gmail Address</label>
                  <div className="relative">
                    <input type="email" value={email} onChange={e => { setEmail(e.target.value.toLowerCase().trim()); setAuthError(''); }}
                      placeholder="yourname@gmail.com" autoFocus
                      className="w-full bg-white/[0.07] border-2 border-white/[0.08] focus:border-indigo-500/60 rounded-2xl py-3.5 px-5 pr-12 font-semibold text-white text-base placeholder:text-white/20 outline-none transition-all" />
                    {email && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {isValidEmail(email) 
                          ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                          : <AlertTriangle className="w-4 h-4 text-amber-400/60" />
                        }
                      </div>
                    )}
                  </div>
                  {email && !isValidEmail(email) && (
                    <p className="text-[10px] text-amber-400/70 font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> Enter valid email format
                    </p>
                  )}
                </div>
                {/* App ID */}
                <div>
                  <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">App ID <span className="text-white/15 normal-case">(your unique login)</span></label>
                  <div className="relative">
                    <input type="text" value={appId} onChange={e => { setAppId(e.target.value.trim()); setAuthError(''); }}
                      placeholder="my_business_id"
                      className="w-full bg-white/[0.07] border-2 border-white/[0.08] focus:border-indigo-500/60 rounded-2xl py-3.5 px-5 pr-12 font-semibold text-white text-base placeholder:text-white/20 outline-none transition-all" />
                    {appId && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {isValidAppId(appId) 
                          ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                          : <AlertTriangle className="w-4 h-4 text-amber-400/60" />
                        }
                      </div>
                    )}
                  </div>
                  {appId && !isValidAppId(appId) && (
                    <p className="text-[10px] text-amber-400/70 font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> Min 3 chars — letters, numbers, . _ - only
                    </p>
                  )}
                </div>
                {/* Mobile Number */}
                <div>
                  <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Mobile Number</label>
                  <div className="relative flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5 px-3.5 py-3.5 rounded-2xl bg-white/[0.07] border-2 border-white/[0.08] shrink-0">
                      <span className="text-base">🇮🇳</span>
                      <span className="font-black text-white/60 text-xs">+91</span>
                    </div>
                    <input type="tel" maxLength={10} value={signupMobile} onChange={e => { setSignupMobile(e.target.value.replace(/\D/g, '')); setAuthError(''); }}
                      placeholder="9876543210"
                      className="w-full bg-white/[0.07] border-2 border-white/[0.08] focus:border-indigo-500/60 rounded-2xl py-3.5 px-5 font-semibold text-white text-base tracking-wide placeholder:text-white/20 outline-none transition-all" />
                  </div>
                  {signupMobile && !isValidMobile(signupMobile) && (
                    <p className="text-[10px] text-amber-400/70 font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> Enter 10-digit number
                    </p>
                  )}
                </div>
                {/* Password */}
                <div>
                  <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setAuthError(''); }}
                      placeholder="Min 6 characters"
                      className="w-full bg-white/[0.07] border-2 border-white/[0.08] focus:border-indigo-500/60 rounded-2xl py-3.5 px-5 pr-14 font-semibold text-white text-base placeholder:text-white/20 outline-none transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/60 transition-colors">
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                  {/* Password strength bar */}
                  {password && (() => {
                    const s = getPasswordStrength(password);
                    return (
                      <div className="mt-2.5 space-y-1.5">
                        <div className="flex gap-1.5">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ background: i <= s.level ? s.color : 'rgba(255,255,255,0.08)' }} />
                          ))}
                        </div>
                        <p className="text-[10px] font-bold" style={{ color: s.color }}>{s.label} password</p>
                      </div>
                    );
                  })()}
                </div>
                {/* Confirm Password */}
                <div>
                  <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">Confirm Password</label>
                  <div className="relative">
                    <input type={showConfirmPwd ? 'text' : 'password'} value={confirmPwd}
                      onChange={e => { setConfirmPwd(e.target.value); setAuthError(''); }}
                      onKeyDown={e => e.key === 'Enter' && email && password && confirmPwd === password && handleSignup()}
                      placeholder="Repeat password"
                      className="w-full bg-white/[0.07] border-2 border-white/[0.08] focus:border-indigo-500/60 rounded-2xl py-3.5 px-5 pr-14 font-semibold text-white text-base placeholder:text-white/20 outline-none transition-all" />
                    <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/60 transition-colors">
                      {showConfirmPwd ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                  {confirmPwd && password !== confirmPwd && (
                    <p className="text-xs text-red-400/80 font-bold mt-2 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> Passwords don't match</p>
                  )}
                  {confirmPwd && password === confirmPwd && confirmPwd.length > 0 && (
                    <p className="text-xs text-emerald-400/80 font-bold mt-2 flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Passwords match</p>
                  )}
                </div>
              </div>
              <ErrorBanner />
              <button onClick={handleSignup} disabled={!email || !isValidEmail(email) || !appId || !isValidAppId(appId) || !signupMobile || !isValidMobile(signupMobile) || !password || password !== confirmPwd || loading}
                className="w-full h-[54px] rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: (email && isValidEmail(email) && appId && isValidAppId(appId) && signupMobile && isValidMobile(signupMobile) && password && password === confirmPwd) ? '0 8px 30px rgba(79,70,229,0.4)' : 'none' }}>
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><CheckCircle className="w-5 h-5" /> Create Account</>}
              </button>
              <p className="text-center text-sm text-white/25">Already have an account?{' '}
                <button onClick={() => { setStep('gmail_email'); setAuthError(''); }} className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">Sign in</button>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CSS for floating animation + shimmer */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
          50% { transform: translateY(-10px) translateX(-5px); opacity: 0.4; }
          75% { transform: translateY(-30px) translateX(15px); opacity: 0.5; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

// --- Settings Module Enhancement ---

// --- Admin Module (replaces Settings) ---
const AdminModule: React.FC<{ state: AppState, setState: React.Dispatch<React.SetStateAction<AppState>>, t: any, onDeleteAccount?: () => void, onLogout?: () => void }> = ({ state, setState, t, onDeleteAccount, onLogout }) => {
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showPremiumPage, setShowPremiumPage] = useState(false);
  // Settings sub-state
  const [notifStock, setNotifStock] = useState(true);
  const [notifSummary, setNotifSummary] = useState(false);
  const [privacyShare, setPrivacyShare] = useState(false);
  // Account sub-state
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const profile = state.profile;
  const profileStats = {
    totalOrders: state.movementLogs.filter(log => log.type === 'OUT').length,
    productsListed: state.inventory.length,
    networkPartners: state.connections.filter(conn => conn.status === 'CONNECTED').length,
  };
  const featuredProducts = state.inventory.map((sku) => ({
    id: sku.id,
    name: sku.name,
  }));
  const recentProfileActivity = [
    ...(state.movementLogs.length > 0
      ? [{
          id: `stock-${state.movementLogs[0].id}`,
          type: 'shipment' as const,
          title: 'Latest stock movement recorded',
          date: new Date(state.movementLogs[0].timestamp).toLocaleString('en-IN'),
        }]
      : []),
    ...(state.connections.some(conn => conn.status === 'CONNECTED')
      ? [{
          id: 'connections-summary',
          type: 'deal' as const,
          title: `${state.connections.filter(conn => conn.status === 'CONNECTED').length} active network partners`,
          date: 'Network updated',
        }]
      : []),
  ];

  const updateProfile = (updates: Partial<UserProfile>) => {
    setState(s => ({ ...s, profile: { ...s.profile, ...updates } }));
  };

  const handleLogoUpload: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({ avatar_url: String(reader.result || '') });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
      return;
    }
    saveLoginRecord({
      businessName: state.profile.shopName || 'Business Account',
      roleName: (state.role as string) || 'Business',
      roleId: state.role as UserRole,
      loginMethod: 'email',
      timestamp: new Date().toISOString(),
      email: state.profile.email || undefined
    });
    // Clear Supabase session
    try { await signOut(); } catch { /* ignore */ }
    // Full state reset so next user gets clean slate
    const freshProfile: UserProfile = {
      id: 'MER-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      name: '', phone: '', email: '', shopName: '', city: '', state: '',
      businessCategory: '', establishedYear: '', gstin: '', address: '',
      bioAuthEnabled: false, notificationsEnabled: true,
    };
    setState(() => ({
      isLoggedIn: false,
      language: 'EN' as LanguageCode,
      themeMode: 'system' as ThemeMode,
      cashPrivacyMode: true,
      inventory: [],
      movementLogs: [],
      expenses: [],
      payments: [],
      budget: 0,
      connections: [],
      landingCompleted: false,
      signupCompleted: false,
      onboarded: false,
      onboardingStep: 1,
      profile: freshProfile,
      geolocationStatus: 'idle' as const,
      nearestStores: [],
    }));
  };

  if (showPremiumPage) {
    return (
      <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <PremiumPaymentPage
          onBack={() => setShowPremiumPage(false)}
          onSuccess={(plan) => {
            setState(s => ({
              ...s,
              isPremium: true,
              premiumPlan: plan,
              profile: { ...s.profile, premiumSince: new Date().toISOString() }
            }));
          }}
          isPremium={state.isPremium}
          currentPlan={state.premiumPlan}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-1 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/60 w-fit" style={{ background: 'rgba(248,250,252,0.8)' }}>
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'account', label: 'Account', icon: ShieldCheck }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeSubTab === tab.id
                  ? 'text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              style={activeSubTab === tab.id ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' } : {}}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {state.role === UserRole.MANUFACTURER && (
            state.isPremium ? (
              <span className="flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-black text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/40 dark:text-amber-400">
                <Star className="w-4 h-4" /> Premium Active
              </span>
            ) : (
              <button
                onClick={() => setShowPremiumPage(true)}
                className="flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-black text-white transition-all active:scale-[0.97] shadow-lg"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}
              >
                <Star className="w-4 h-4" /> Upgrade to Premium
              </button>
            )
          )}
          <Button variant="danger" className="h-11 px-5 text-sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </div>

      {activeSubTab === 'profile' && (
        <div className="space-y-8">
          {!isEditingProfile ? (
            <BusinessProfilePage
              profile={profile}
              role={state.role!}
              isOwnProfile={true}
              onEdit={() => setIsEditingProfile(true)}
              stats={profileStats}
              featuredProducts={featuredProducts}
              recentActivity={recentProfileActivity}
              isPremium={state.isPremium}
            />
          ) : (
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 text-slate-900 dark:text-white font-display mb-1">Edit Business Identity</h3>
                  <p className="text-slate-500 text-sm">Update your business and contact information</p>
                </div>
                <Button variant="ghost" onClick={() => setIsEditingProfile(false)}><X /> Close</Button>
              </div>

              <div className="space-y-6">
                <h4 className="flex items-center gap-2 font-black text-indigo-600 uppercase tracking-widest text-[10px]">
                  <User className="w-3 h-3" /> Personal Identity
                </h4>
                <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Business Logo</label>
                  <div className="flex flex-col sm:flex-row sm:items-center items-start gap-4">
                    <div className="w-20 h-20 rounded-2xl border border-blue-100 bg-blue-50 flex items-center justify-center overflow-hidden dark:border-slate-700 dark:bg-slate-900">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="Business logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-8 h-8 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2 sm:py-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-blue-700 dark:text-slate-300 align-middle"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Upload a clear logo or avatar for your business profile.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Owner Name</label>
                    <input type="text" value={profile.name} onChange={e => updateProfile({ name: e.target.value })} className="input-pro w-full bg-white border border-blue-100 dark:bg-slate-800/80 dark:border-slate-700/60 rounded-2xl p-5 font-bold text-slate-900 dark:text-white shadow-sm" placeholder="e.g. Rahul Sharma" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Phone Number</label>
                    <input type="tel" value={profile.phone} onChange={e => updateProfile({ phone: e.target.value })} className="input-pro w-full bg-white border border-blue-100 dark:bg-slate-800/80 dark:border-slate-700/60 rounded-2xl p-5 font-bold text-slate-900 dark:text-white shadow-sm" placeholder="+91 XXXX" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="flex items-center gap-2 font-black text-indigo-600 uppercase tracking-widest text-[10px]">
                  <Building2 className="w-3 h-3" /> Business Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Registered Shop Name</label>
                    <input type="text" value={profile.shopName} onChange={e => updateProfile({ shopName: e.target.value })} className="input-pro w-full bg-white border border-blue-100 dark:bg-slate-800/80 dark:border-slate-700/60 rounded-2xl p-5 font-bold text-slate-900 dark:text-white shadow-sm" placeholder="e.g. Sai Kirana Store" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Established Year</label>
                    <input type="text" value={profile.establishedYear} onChange={e => updateProfile({ establishedYear: e.target.value })} className="input-pro w-full bg-white border border-blue-100 dark:bg-slate-800/80 dark:border-slate-700/60 rounded-2xl p-5 font-bold text-slate-900 dark:text-white shadow-sm" placeholder="e.g. 1998" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Category</label>
                    <input type="text" value={profile.businessCategory} onChange={e => updateProfile({ businessCategory: e.target.value })} className="input-pro w-full bg-white border border-blue-100 dark:bg-slate-800/80 dark:border-slate-700/60 rounded-2xl p-5 font-bold text-slate-900 dark:text-white shadow-sm" placeholder="e.g. Retail / Grocery" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="flex items-center gap-2 font-black text-indigo-600 uppercase tracking-widest text-[10px]">
                  <MapPinned className="w-3 h-3" /> Location & Compliance
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Physical Address</label>
                    <textarea value={profile.address} onChange={e => updateProfile({ address: e.target.value })} className="input-pro w-full bg-white border border-blue-100 dark:bg-slate-800/80 dark:border-slate-700/60 rounded-2xl p-5 font-bold text-slate-900 dark:text-white h-24 resize-none shadow-sm" placeholder="Shop No, Street, Landmark..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">City</label>
                    <input type="text" value={profile.city} onChange={e => updateProfile({ city: e.target.value })} className="input-pro w-full bg-white border border-blue-100 dark:bg-slate-800/80 dark:border-slate-700/60 rounded-2xl p-5 font-bold text-slate-900 dark:text-white shadow-sm" placeholder="Mumbai" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">State</label>
                    <input type="text" value={profile.state} onChange={e => updateProfile({ state: e.target.value })} className="input-pro w-full bg-white border border-blue-100 dark:bg-slate-800/80 dark:border-slate-700/60 rounded-2xl p-5 font-bold text-slate-900 dark:text-white shadow-sm" placeholder="Maharashtra" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">GSTIN (Optional)</label>
                    <input type="text" value={profile.gstin} onChange={e => updateProfile({ gstin: e.target.value.toUpperCase() })} className="input-pro w-full bg-white border border-blue-100 dark:bg-slate-800/80 dark:border-slate-700/60 rounded-2xl p-5 font-bold text-slate-900 dark:text-white shadow-sm" placeholder="27XXXXX0000X0Z0" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-8">
                 <Button className="flex-1 h-16 text-lg btn-glow" onClick={() => setIsEditingProfile(false)}>Save Business Profile</Button>
                 <Button variant="secondary" className="h-16" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'settings' && (
        <div className="space-y-10 animate-in fade-in duration-300">
          {/* Language */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}><Globe className="w-4 h-4 text-white" /></div>
              <div><h3 className="font-black text-slate-900 text-slate-900 dark:text-white text-base">Language</h3><p className="text-xs text-slate-400 font-semibold">Choose your preferred language</p></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {INDIAN_LANGUAGES.slice(0, 9).map(lang => {
                const isActive = state.language === lang.code;
                return (
                  <button key={lang.code} onClick={() => setState(s => ({ ...s, language: lang.code as LanguageCode }))}
                    className="relative p-3 rounded-2xl border-2 text-left transition-all role-card"
                    style={isActive ? { borderColor: '#4f46e5', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.06))' } : { borderColor: '#e2e8f0' }}>
                    {isActive && <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}><Check className="w-2.5 h-2.5 text-white" /></div>}
                    <p className={`font-black text-base leading-tight ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>{lang.native}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">{lang.name} · {lang.region}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Appearance */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}><Sun className="w-4 h-4 text-white" /></div>
              <div><h3 className="font-black text-slate-900 text-slate-900 dark:text-white text-base">Appearance</h3><p className="text-xs text-slate-400 font-semibold">Choose how Vyaparika looks</p></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light', label: 'Light', icon: Sun, desc: 'Classic & bright' },
                { id: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on eyes' },
                { id: 'system', label: 'System', icon: Monitor, desc: 'Auto-adapts' }
              ].map(theme => (
                <button key={theme.id}
                  onClick={() => setState(s => ({ ...s, themeMode: theme.id as ThemeMode }))}
                  className={`relative p-5 rounded-3xl border-2 flex flex-col items-center text-center gap-3 transition-all role-card overflow-hidden ${
                    state.themeMode === theme.id ? 'border-indigo-500' : 'border-slate-200 dark:border-slate-700/60 hover:border-indigo-200'
                  }`}
                  style={state.themeMode === theme.id ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.05))' } : {}}>
                  {state.themeMode === theme.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}><Check className="w-3 h-3 text-white" /></div>
                  )}
                  <div className={`p-3 rounded-2xl ${state.themeMode === theme.id ? 'text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}
                    style={state.themeMode === theme.id ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 6px 20px rgba(99,102,241,0.4)' } : {}}>
                    <theme.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className={`font-black text-xs uppercase tracking-wide ${state.themeMode === theme.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{theme.label}</p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{theme.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}><Bell className="w-4 h-4 text-white" /></div>
              <div><h3 className="font-black text-slate-900 text-slate-900 dark:text-white text-base">Notifications</h3><p className="text-xs text-slate-400 font-semibold">Manage alerts &amp; reminders</p></div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Low Stock Alerts', desc: 'Alert when items reach critical level', value: notifStock, set: setNotifStock },
                { label: 'Daily Summary', desc: 'Morning digest of key business metrics', value: notifSummary, set: setNotifSummary },
              ].map(item => (
                <div key={item.label} className="card-pro bg-white dark:bg-slate-800/70 rounded-2xl p-4 flex items-center justify-between border border-slate-100 dark:border-slate-700/60">
                  <div>
                    <p className="font-black text-slate-800 text-slate-900 dark:text-white text-sm">{item.label}</p>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">{item.desc}</p>
                  </div>
                  <button onClick={() => item.set(!item.value)} className={`relative w-12 h-6 rounded-full transition-all duration-300 ${item.value ? '' : 'bg-slate-200 dark:bg-slate-700'}`}
                    style={item.value ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' } : {}}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${item.value ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}><Lock className="w-4 h-4 text-white" /></div>
              <div><h3 className="font-black text-slate-900 text-slate-900 dark:text-white text-base">Privacy</h3><p className="text-xs text-slate-400 font-semibold">Control your data</p></div>
            </div>
            <div className="card-pro bg-white dark:bg-slate-800/70 rounded-2xl p-4 flex items-center justify-between border border-slate-100 dark:border-slate-700/60">
              <div>
                <p className="font-black text-slate-800 text-slate-900 dark:text-white text-sm">Share Analytics Data</p>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Help improve Vyaparika with anonymous usage data</p>
              </div>
              <button onClick={() => setPrivacyShare(!privacyShare)} className={`relative w-12 h-6 rounded-full transition-all duration-300 ${privacyShare ? '' : 'bg-slate-200 dark:bg-slate-700'}`}
                style={privacyShare ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' } : {}}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${privacyShare ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'account' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Change Password */}
          <div className="card-pro bg-white dark:bg-slate-800/70 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}><KeyRound className="w-5 h-5 text-white" /></div>
                <div><p className="font-black text-slate-900 text-slate-900 dark:text-white">Change Password</p><p className="text-xs text-slate-400 font-semibold">Update your account password</p></div>
              </div>
              <button onClick={() => { setShowChangePwd(!showChangePwd); setPwdSuccess(false); setOldPwd(''); setNewPwd(''); setConfirmPwd(''); }}
                className="text-indigo-600 font-black text-sm hover:text-indigo-800 transition-colors">
                {showChangePwd ? 'Cancel' : 'Change'}
              </button>
            </div>
            {showChangePwd && (
              <div className="space-y-3 pt-2 animate-in slide-in-from-top-2 duration-200">
                {pwdSuccess ? (
                  <div className="rounded-2xl p-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.08))', border: '2px solid rgba(16,185,129,0.3)' }}>
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-black text-emerald-700 dark:text-emerald-400">Password updated successfully!</p>
                  </div>
                ) : (
                  <>
                    {[
                      { label: 'Current Password', val: oldPwd, set: setOldPwd },
                      { label: 'New Password', val: newPwd, set: setNewPwd },
                      { label: 'Confirm New Password', val: confirmPwd, set: setConfirmPwd },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{f.label}</label>
                        <input type="password" value={f.val} onChange={e => f.set(e.target.value)}
                          className="input-pro w-full bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl py-3.5 px-5 font-semibold text-slate-900 dark:text-white" />
                      </div>
                    ))}
                    {newPwd && confirmPwd && newPwd !== confirmPwd && (
                      <p className="text-xs text-rose-500 font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Passwords do not match</p>
                    )}
                    <Button fullWidth className="h-12 btn-glow" disabled={!oldPwd || !newPwd || newPwd !== confirmPwd}
                      onClick={() => { setPwdSuccess(true); setOldPwd(''); setNewPwd(''); setConfirmPwd(''); }}>
                      <Lock className="w-4 h-4" /> Update Password
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="card-pro bg-white dark:bg-slate-800/70 rounded-3xl p-6 border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.15))' }}><LogOut className="w-5 h-5 text-amber-600" /></div>
              <div><p className="font-black text-slate-900 text-slate-900 dark:text-white">Sign Out</p><p className="text-xs text-slate-400 font-semibold">Log out from your account</p></div>
            </div>
            <Button variant="danger" fullWidth className="h-12" onClick={handleLogout}>
              <LogOut className="w-4 h-4" /> Sign Out from Vyaparika
            </Button>
          </div>

          {/* Danger Zone */}
          <div className="rounded-3xl p-6 border-2 border-rose-200 dark:border-rose-900/60 space-y-4" style={{ background: 'linear-gradient(135deg, rgba(255,241,242,0.8), rgba(255,228,230,0.4))' }}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <p className="font-black text-rose-700 dark:text-rose-400 text-base uppercase tracking-wide text-sm">Danger Zone</p>
            </div>
            <p className="text-sm text-rose-600/80 font-semibold">Deleting your account is permanent and cannot be undone. All your data will be lost.</p>
            <p className="text-xs text-rose-500/60 font-semibold">To change your role (Manufacturer / Distributor / Shopkeeper), delete this account and create a new one.</p>
            {showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="font-black text-rose-700 text-sm">Are you sure? This cannot be undone.</p>
                <div className="flex gap-3">
                  <Button variant="danger" className="flex-1 h-11" onClick={() => {
                    // Remove this specific account from registry (credentials)
                    const email = state.profile.email;
                    const profileId = state.profile.id;
                    if (email) deleteAccountFromRegistry(email);
                    // Also try to delete by profile.id (which stores appId)
                    if (profileId && profileId !== email) deleteAccountFromRegistry(profileId);
                    // Remove this user's saved profile from registry (so they get onboarding again)
                    if (email) removeProfileFromRegistry(email);
                    // Remove this business from quick login records
                    removeLoginRecord(email || undefined, state.profile.shopName || undefined, state.role as UserRole);
                    // Wipe all app storage keys (state only, NOT accounts registry)
                    localStorage.removeItem(STATE_KEY);
                    localStorage.removeItem('vyaparika_state_v1.6');
                    localStorage.removeItem('vyaparika_state_v1.7');
                    // Also clear the last logins for this account
                    localStorage.removeItem('vyaparika_last_logins');
                    // Fully reset state — wipe all data
                    setState(s => ({
                      ...s,
                      isLoggedIn: false,
                      landingCompleted: false,
                      signupCompleted: false,
                      onboarded: false,
                      onboardingStep: 1,
                      inventory: [],
                      movementLogs: [],
                      expenses: [],
                      payments: [],
                      budget: 0,
                      connections: [],
                      profile: { ...s.profile, id: 'MER-' + Math.random().toString(36).substr(2, 9).toUpperCase(), name: '', phone: '', email: '', shopName: '', city: '', state: '', businessCategory: '', establishedYear: '', gstin: '', address: '' }
                    }));
                    // Refresh quick login list in parent
                    if (onDeleteAccount) onDeleteAccount();
                  }}>Yes, Delete Everything</Button>
                  <Button variant="secondary" className="flex-1 h-11" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowDeleteConfirm(true)} className="w-full h-11 rounded-2xl border-2 border-rose-300 text-rose-600 font-black text-sm hover:bg-rose-50 transition-colors flex items-center justify-center gap-2">
                <X className="w-4 h-4" /> Delete My Account
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Profile Completion Screen ---
const ProfileCompleteScreen: React.FC<{ state: AppState, setState: React.Dispatch<React.SetStateAction<AppState>> }> = ({ state, setState }) => {
  const [name, setName] = useState(state.profile.name || '');
  const [phone, setPhone] = useState(state.profile.phone || '');
  const [city, setCity] = useState(state.profile.city || '');
  const [stateVal, setStateVal] = useState(state.profile.state || '');
  const [address, setAddress] = useState(state.profile.address || '');

  // Sync local fields when geolocation auto-fills profile in state
  useEffect(() => {
    if (state.profile.city && !city) setCity(state.profile.city);
    if (state.profile.state && !stateVal) setStateVal(state.profile.state);
    if (state.profile.address && !address) setAddress(state.profile.address);
  }, [state.profile.city, state.profile.state, state.profile.address]);

  const canSave = name.trim() && phone.trim() && phone.replace(/\D/g,'').length >= 10 && city.trim();

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 sm:p-6">
      <div className="fixed top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.5), transparent)' }} />
      <div className="w-full max-w-md relative z-10">
        <div className="glass rounded-[2rem] shadow-2xl overflow-hidden border border-white/50 dark:border-indigo-900/40 p-8 space-y-7"
          style={{ boxShadow: '0 25px 80px rgba(79,70,229,0.18)' }}>
          {/* Header */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl float"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 text-slate-900 dark:text-white font-display">Complete Your Profile</h2>
            <p className="text-slate-500 text-sm mt-1.5 font-semibold">Please fill in your details to continue</p>
            <div className="mt-3 px-4 py-2 rounded-2xl inline-block" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.08))', border: '1px solid rgba(245,158,11,0.3)' }}>
              <p className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Required before entering app
              </p>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Owner Name <span className="text-rose-500">*</span>
              </label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="input-pro w-full bg-slate-50 dark:bg-slate-800/80 border-2 rounded-2xl py-4 px-5 font-semibold text-slate-900 dark:text-white text-base"
                style={{ borderColor: name.trim() ? '#4f46e5' : '#e2e8f0' }} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="font-black text-slate-600 dark:text-slate-300 text-sm">🇮🇳 +91</span>
                  <div className="w-px h-4 bg-slate-200 dark:bg-slate-600" />
                </div>
                <input type="tel" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))}
                  placeholder="00000 00000"
                  className="input-pro w-full bg-slate-50 dark:bg-slate-800/80 border-2 rounded-2xl py-4 pl-24 pr-5 font-black text-base text-slate-900 dark:text-white tracking-widest"
                  style={{ borderColor: phone.replace(/\D/g,'').length === 10 ? '#4f46e5' : '#e2e8f0' }} />
              </div>
              {phone.length > 0 && phone.replace(/\D/g,'').length < 10 && (
                <p className="text-xs text-rose-500 font-bold mt-1.5 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Enter 10-digit number</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                City <span className="text-rose-500">*</span>
              </label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)}
                placeholder="e.g. Mumbai"
                className="input-pro w-full bg-slate-50 dark:bg-slate-800/80 border-2 rounded-2xl py-4 px-5 font-semibold text-slate-900 dark:text-white text-base"
                style={{ borderColor: city.trim() ? '#4f46e5' : '#e2e8f0' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">State</label>
                <input type="text" value={stateVal} onChange={e => setStateVal(e.target.value)}
                  placeholder="Maharashtra"
                  className="input-pro w-full bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl py-4 px-4 font-semibold text-slate-900 dark:text-white text-base" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Address</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="Street / Area"
                  className="input-pro w-full bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl py-4 px-4 font-semibold text-slate-900 dark:text-white text-base" />
              </div>
            </div>
          </div>

          <Button fullWidth className="h-14 text-base font-black btn-glow" disabled={!canSave}
            onClick={() => setState(s => {
              const updatedProfile = { ...s.profile, name: name.trim(), phone, city: city.trim(), state: stateVal.trim(), address: address.trim() };
              // Save completed profile to registry for future logins
              if (updatedProfile.email) {
                saveUserProfileToRegistry(updatedProfile.email, s.role as UserRole, s.language, updatedProfile);
              }
              return { ...s, profile: updatedProfile };
            })}>
            <CheckCircle className="w-5 h-5" /> Save & Enter Dashboard
          </Button>
          <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-widest">* Required fields must be completed</p>
        </div>
      </div>
    </div>
  );
};

// --- Main App Logic ---

// ==========================================
// CORE APPLICATION: MAIN REACT COMPONENT 
// Manages global state (auth, user profiles, inventory sync, multi-language, theme)
// Contains Layout, Dashboard, Settings, etc., wrapped in Error Boundary
// ==========================================

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STATE_KEY);
    const defaultProfile: UserProfile = {
      id: 'MER-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      name: '',
      phone: '',
      email: '',
      shopName: '',
      city: '',
      state: '',
      businessCategory: '',
      establishedYear: '',
      gstin: '',
      address: '',
      bioAuthEnabled: false,
      notificationsEnabled: true
    };
    return saved ? JSON.parse(saved) : {
      isLoggedIn: false,
      language: 'EN',
      themeMode: 'system',
      cashPrivacyMode: true,
      inventory: [],
      movementLogs: [],
      expenses: [],
      payments: [],
      budget: 0,
      connections: [],
      landingCompleted: false,
      signupCompleted: false,
      onboarded: false,
      onboardingStep: 1,
      profile: defaultProfile,
      geolocationStatus: 'idle',
      nearestStores: []
    };
  });

  // --- Geolocation detection (fires once after login) ---
  useGeolocation(state, setState);

  // Track explicit logouts so Supabase listener doesn't re-login
  const loggedOutRef = useRef(false);

  const handleAppLogout = async () => {
    loggedOutRef.current = true;
    // Save completed profile to registry so returning user skips onboarding.
    // Any storage-related error should not block logout.
    try {
      if (state.profile.email && state.onboarded) {
        saveUserProfileToRegistry(state.profile.email, state.role as UserRole, state.language, state.profile);
      }
    } catch (err) {
      console.warn('[Vyaparika] Failed to save profile before logout:', err);
    }
    try {
      saveLoginRecord({
        businessName: state.profile.shopName || 'Business Account',
        roleName: (state.role as string) || 'Business',
        roleId: state.role as UserRole,
        loginMethod: 'email',
        timestamp: new Date().toISOString(),
        email: state.profile.email || undefined,
      });
    } catch (err) {
      console.warn('[Vyaparika] Failed to save login record on logout:', err);
    }
    // Fully reset state so next user gets a clean slate
    const freshProfile: UserProfile = {
      id: 'MER-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      name: '',
      phone: '',
      email: '',
      shopName: '',
      city: '',
      state: '',
      businessCategory: '',
      establishedYear: '',
      gstin: '',
      address: '',
      bioAuthEnabled: false,
      notificationsEnabled: true,
    };
    setState(() => {
      const newState: AppState = {
        isLoggedIn: false,
        language: 'EN',
        themeMode: 'system',
        cashPrivacyMode: true,
        inventory: [],
        movementLogs: [],
        expenses: [],
        payments: [],
        budget: 0,
        connections: [],
        landingCompleted: false,
        signupCompleted: false,
        onboarded: false,
        onboardingStep: 1,
        profile: freshProfile,
        geolocationStatus: 'idle',
        nearestStores: [],
      };
      // Persist clean state to localStorage right away
      try {
        localStorage.setItem(STATE_KEY, JSON.stringify(newState));
      } catch (err) {
        console.warn('[Vyaparika] Failed to persist logged-out state:', err);
      }
      return newState;
    });
    // Clean up Supabase session in the background (non-blocking)
    try { await signOut(); } catch { /* ignore */ }
  };

  // --- Supabase auth state listener (handles Google OAuth redirect) ---
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onAuthStateChange(async (event, session) => {
        // Clean URL fragment safely after auth change events
        if (window.location.hash && window.location.hash.includes('expires_at=')) {
          setTimeout(() => {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }, 100);
        }

        // Don't re-login if user explicitly logged out
        if (loggedOutRef.current) return;
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user) {
          const user = session.user;
          const meta = user.user_metadata || {};
          // Persist user profile to Supabase (non-blocking, ignore errors)
          try {
            await upsertUserProfile({
              id: user.id,
              email: user.email,
              phone: user.phone,
              name: meta.full_name || meta.name,
              avatar_url: meta.avatar_url || meta.picture,
            });
          } catch { /* Supabase may be down — continue without it */ }
          // Update local app state — check if returning user
          const savedProfile = user.email ? findSavedProfileByEmail(user.email) : null;
          setState(s => {
            if (s.isLoggedIn) return s; // Already logged in, skip
            // Returning user — restore saved profile and skip onboarding
            if (savedProfile) {
              return {
                ...s,
                isLoggedIn: true,
                role: savedProfile.role || s.role,
                language: (savedProfile.language as LanguageCode) || s.language,
                landingCompleted: true,
                signupCompleted: true,
                onboarded: true,
                onboardingStep: 4,
                profile: {
                  ...s.profile,
                  ...savedProfile.profile,
                  id: user.id,
                  email: user.email || s.profile.email,
                  phone: user.phone || (savedProfile.profile.phone as string) || s.profile.phone,
                  name: meta.full_name || meta.name || (savedProfile.profile.name as string) || s.profile.name,
                },
              };
            }
            // New user — mark as logged in and restore pending role from OAuth flow
            const pendingOAuthRole = localStorage.getItem('vyaparika_pending_role_oauth') as UserRole | null;
            if (pendingOAuthRole) {
              localStorage.removeItem('vyaparika_pending_role_oauth');
            }
            return {
              ...s,
              isLoggedIn: true,
              role: pendingOAuthRole || s.role,
              profile: {
                ...s.profile,
                id: user.id,
                email: user.email || s.profile.email,
                phone: user.phone || s.profile.phone,
                name: meta.full_name || meta.name || s.profile.name,
              },
            };
          });
        }
      });
    } catch {
      console.warn('[Vyaparika] Supabase auth listener failed — running in offline mode.');
    }
    // Also check for an existing session on mount (e.g. after OAuth redirect)
    getSession().then(session => {
      if (loggedOutRef.current) return;
      if (session?.user && !state.isLoggedIn) {
        const user = session.user;
        const meta = user.user_metadata || {};
        const savedProfile = user.email ? findSavedProfileByEmail(user.email) : null;
        setState(s => {
          // Returning user — restore saved profile and skip onboarding
          if (savedProfile) {
            return {
              ...s,
              isLoggedIn: true,
              role: savedProfile.role || s.role,
              language: (savedProfile.language as LanguageCode) || s.language,
              landingCompleted: true,
              signupCompleted: true,
              onboarded: true,
              onboardingStep: 4,
              profile: {
                ...s.profile,
                ...savedProfile.profile,
                id: user.id,
                email: user.email || s.profile.email,
                phone: user.phone || (savedProfile.profile.phone as string) || s.profile.phone,
                name: meta.full_name || meta.name || (savedProfile.profile.name as string) || s.profile.name,
              },
            };
          }
          // New user — mark as logged in and restore pending role from OAuth flow
          const pendingOAuthRole = localStorage.getItem('vyaparika_pending_role_oauth') as UserRole | null;
          if (pendingOAuthRole) {
            localStorage.removeItem('vyaparika_pending_role_oauth');
          }
          return {
            ...s,
            isLoggedIn: true,
            role: pendingOAuthRole || s.role,
            profile: {
              ...s.profile,
              id: user.id,
              email: user.email || s.profile.email,
              phone: user.phone || s.profile.phone,
              name: meta.full_name || meta.name || s.profile.name,
            },
          };
        });
      }
    }).catch(() => {
      console.warn('[Vyaparika] Supabase getSession failed — running in offline mode.');
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [isSplashActive, setIsSplashActive] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddPage, setShowAddPage] = useState(false);
  const [stockUpdateItem, setStockUpdateItem] = useState<SKU | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'status'>('name');
  const [invStatusFilter, setInvStatusFilter] = useState<string>('ALL');
  const [invCategoryFilter, setInvCategoryFilter] = useState<string>('ALL');
  const [invSelectedItem, setInvSelectedItem] = useState<SKU | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<SKU | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; tone: 'success' | 'error' | 'info' } | null>(null);
  const [showQuickTips, setShowQuickTips] = useState(() => localStorage.getItem('vyaparika_quick_tips_seen') !== '1');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Real-time notifications ──
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((notif: AppNotification) => {
    setNotifications(prev => {
      // Prevent duplicates
      if (prev.some(n => n.id === notif.id)) return prev;
      return [notif, ...prev].slice(0, 50); // keep latest 50
    });
  }, []);

  // Subscribe to real-time notifications from Supabase
  useEffect(() => {
    if (!state.isLoggedIn || !state.profile.id) return;
    const myId = state.profile.id;

    const unsubConn = subscribeToConnectionNotifications(myId, addNotification);
    const unsubExp = subscribeToExpenseNotifications(myId, addNotification);

    return () => { unsubConn(); unsubExp(); };
  }, [state.isLoggedIn, state.profile.id, addNotification]);

  // ── Fetch expenses from Supabase on login + realtime subscription ──
  // Lives at App level so data persists across tab navigation
  useEffect(() => {
    if (!state.isLoggedIn || !state.profile.id) return;
    const myId = state.profile.id;
    let cancelled = false;

    const loadExpenses = async () => {
      try {
        const rows = await expensesServiceFetch(myId);
        if (cancelled) return;
        setState(s => {
          // Merge: keep any local-only (offline) expenses not yet in Supabase
          const supabaseIds = new Set(rows.map(r => r.id));
          const localOnly = s.expenses.filter(e => !supabaseIds.has(e.id) && e.id.startsWith('exp_'));
          return { ...s, expenses: [...rows, ...localOnly] };
        });
      } catch (err) {
        console.warn('[Vyaparika] Failed to fetch expenses from Supabase:', err);
        // Keep existing local expenses on failure
      }
    };
    loadExpenses();

    const unsubExpData = expensesServiceSubscribe(myId, (rows) => {
      if (cancelled) return;
      setState(s => {
        const supabaseIds = new Set(rows.map(r => r.id));
        const localOnly = s.expenses.filter(e => !supabaseIds.has(e.id) && e.id.startsWith('exp_'));
        return { ...s, expenses: [...rows, ...localOnly] };
      });
    });

    return () => { cancelled = true; unsubExpData(); };
  }, [state.isLoggedIn, state.profile.id]);

  // Check stock-level notifications whenever inventory changes — batched into single update
  useEffect(() => {
    if (!state.isLoggedIn || state.inventory.length === 0) return;
    const stockNotifs = checkStockNotifications(state.inventory);
    if (stockNotifs.length === 0) return;
    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const newOnes = stockNotifs.filter(n => !existingIds.has(n.id));
      if (newOnes.length === 0) return prev;
      return [...newOnes, ...prev].slice(0, 50);
    });
  }, [state.inventory, state.isLoggedIn]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setShowNotifPanel(false);
  }, []);

  const showToast = useCallback((msg: string, tone: 'success' | 'error' | 'info' = 'info') => {
    setToastMsg({ text: msg, tone });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3200);
  }, []);

  const dismissQuickTips = useCallback(() => {
    setShowQuickTips(false);
    localStorage.setItem('vyaparika_quick_tips_seen', '1');
  }, []);

  const handleDeleteSKU = useCallback((skuId: string) => {
    setState(s => ({ ...s, inventory: s.inventory.filter(i => i.id !== skuId) }));
    setDeleteConfirmItem(null);
    setInvSelectedItem(prev => (prev?.id === skuId ? null : prev));
  }, []);

  const filteredInventory = useMemo(() => {
    const q = searchTerm.toLowerCase();
    let items = state.inventory.filter(i => {
      const matchSearch = i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
      const matchStatus = invStatusFilter === 'ALL' || i.status === invStatusFilter;
      const matchCat = invCategoryFilter === 'ALL' || i.category === invCategoryFilter;
      return matchSearch && matchStatus && matchCat;
    });
    return items.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'stock') return b.currentStock - a.currentStock;
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });
  }, [state.inventory, searchTerm, sortBy, invStatusFilter, invCategoryFilter]);

  useEffect(() => {
  const root = document.documentElement;

  const applyTheme = () => {
    if (state.themeMode === 'dark') {
      root.classList.add('dark');
    } else if (state.themeMode === 'light') {
      root.classList.remove('dark');
    } else {
      // system mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  };

  applyTheme();

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = () => {
    if (state.themeMode === 'system') {
      applyTheme();
    }
  };

  media.addEventListener('change', listener);

  return () => media.removeEventListener('change', listener);
}, [state.themeMode]);

  // Debounced localStorage save — avoids blocking main thread on every keystroke
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try { localStorage.setItem(STATE_KEY, JSON.stringify(stateRef.current)); } catch { /* quota exceeded — ignore */ }
    }, 500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [state]);

  const t = TRANSLATIONS[state.language] || TRANSLATIONS['EN'];

  const [lastLogins, setLastLogins] = useState<LoginRecord[]>(() => getLastLogins());

  const handleAuthSuccess = useCallback((method: string, data?: any) => {
    // User is explicitly logging in again, allow auth listeners/session restore paths.
    loggedOutRef.current = false;
    const preRole = data?.role as UserRole | undefined;
    const preBusinessName = data?.businessName as string | undefined;
    const isReturning = data?.isReturningUser === true || method === 'quick';
    const isNew = data?.isNewAccount === true;
    // Refresh lastLogins from storage after quick-login updates
    setLastLogins(getLastLogins());
    setState(s => {
      // For returning users (App ID login) — skip everything, go straight to dashboard
      if (isReturning) {
        return {
          ...s,
          isLoggedIn: true,
          role: preRole || s.role,
          landingCompleted: true,
          signupCompleted: true,
          onboarded: true,
          onboardingStep: 4,
          profile: {
            ...s.profile,
            id: data?.appId || s.profile.id,
            phone: data?.phone || s.profile.phone,
            email: data?.email || s.profile.email,
            shopName: preBusinessName || s.profile.shopName,
            // Ensure profile completeness check passes for returning users
            name: s.profile.name || data?.email?.split('@')[0] || 'User',
            city: s.profile.city || 'India',
          },
        };
      }
      // For new signups — all profile data collected in signup form, skip to dashboard
      if (isNew) {
        return {
          ...s,
          isLoggedIn: true,
          role: preRole || s.role,
          landingCompleted: true,
          signupCompleted: true,
          onboarded: true,
          onboardingStep: 4,
          profile: {
            ...s.profile,
            id: data?.appId || s.profile.id,
            phone: data?.phone || s.profile.phone,
            email: data?.email || s.profile.email,
            name: data?.ownerName || s.profile.name,
            shopName: data?.shopName || s.profile.shopName,
            city: data?.city || s.profile.city,
          },
        };
      }
      // For other methods (Google, OTP, quick login) — set role + landing if role known
      // Check if this is a returning Google/OAuth user with a saved profile
      const userEmail = data?.email as string | undefined;
      const savedProfile = userEmail ? findSavedProfileByEmail(userEmail) : null;

      if (savedProfile) {
        // Returning Google/OAuth user — restore saved profile, skip all onboarding
        return {
          ...s,
          isLoggedIn: true,
          role: preRole || savedProfile.role || s.role,
          language: (savedProfile.language as LanguageCode) || s.language,
          landingCompleted: true,
          signupCompleted: true,
          onboarded: true,
          onboardingStep: 4,
          profile: {
            ...s.profile,
            ...savedProfile.profile,
            id: data?.uid || s.profile.id,
            email: userEmail || s.profile.email,
            phone: data?.phone || (savedProfile.profile.phone as string) || s.profile.phone,
            name: data?.name || (savedProfile.profile.name as string) || s.profile.name,
          },
        };
      }

      // New Google/OAuth user — show onboarding
      const isGoogleLogin = method === 'google';
      return {
        ...s,
        isLoggedIn: true,
        role: preRole || s.role,
        landingCompleted: preRole ? true : s.landingCompleted,
        profile: {
          ...s.profile,
          id: data?.uid || s.profile.id,
          phone: data?.phone || (isGoogleLogin ? '' : s.profile.phone),
          email: data?.email || s.profile.email,
          name: data?.name || (isGoogleLogin ? '' : s.profile.name),
          shopName: preBusinessName || (isGoogleLogin ? '' : s.profile.shopName),
        },
      };
    });
  }, []);

  const handleStockUpdate = useCallback((skuId: string, type: MovementType, quantity: number, reason: string) => {
    setState(s => {
      const sku = s.inventory.find(i => i.id === skuId);
      const unitPrice = sku?.price || 0;
      const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newLogs: StockLog[] = [...s.movementLogs, {
        id: logId,
        skuId,
        type,
        quantity,
        price: unitPrice,
        reason,
        timestamp: new Date().toISOString()
      }];
      const newInventory = s.inventory.map(item => {
        if (item.id === skuId) {
          const totalIn = type === 'IN' ? item.totalIn + quantity : item.totalIn;
          const totalOut = type === 'OUT' ? item.totalOut + quantity : item.totalOut;
          const currentStock = item.openingStock + totalIn - totalOut;
          let status: SKU['status'] = 'OPTIMAL';
          if (currentStock < item.minThreshold) status = 'LOW';
          if (currentStock === 0) status = 'CRITICAL';
          return { ...item, totalIn, totalOut, currentStock, status, lastUpdated: new Date().toISOString() };
        }
        return item;
      });
      // Auto-generate payment entry from stock movement
      const amount = sku ? Math.round(quantity * unitPrice * 100) / 100 : 0;
      let autoPayments = [...(s.payments || [])];
      if (amount > 0) {
        // Purchase (IN)  → PAID  (money goes out to buy stock)
        // Sale (OUT)     → RECEIVED (money comes in from selling)
        // Damage/Expired/Return (OUT) → PAID (loss — no money changes hands but records the loss value)
        const payType: PaymentType = type === 'OUT' && reason === 'Sale' ? 'RECEIVED' : 'PAID';
        autoPayments = [{
          id: `pay_stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          party: sku?.name ?? 'Stock',
          amount,
          type: payType,
          method: 'CASH' as PaymentMethod,
          status: 'COMPLETED' as PaymentStatus,
          date: new Date().toISOString(),
          note: `${reason}: ${quantity} ${sku?.unit ?? 'units'} @ ₹${unitPrice}/${sku?.unit ?? 'unit'}`,
          source: 'stock' as const,
          sourceId: logId,
        }, ...autoPayments];
      }
      return { ...s, inventory: newInventory, movementLogs: newLogs, payments: autoPayments };
    });
    setStockUpdateItem(null);
  }, []);

  const navItems = useMemo(() => [
    { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
    { id: 'inventory', icon: Package, label: state.role === UserRole.MANUFACTURER ? 'SKU Velocity' : t.inventory },
    { id: 'expenses', icon: CreditCard, label: state.role === UserRole.MANUFACTURER ? 'Campaigns' : t.expenses },
    { id: 'network', icon: Globe, label: t.connections },
    { id: 'insights', icon: BrainCircuit, label: t.insights },
  ], [t.dashboard, t.inventory, t.expenses, t.connections, t.insights, state.role]);

  if (isSplashActive) return <SplashScreen onFinish={() => setIsSplashActive(false)} />;

  // Auth gating
  if (!state.isLoggedIn) return <LoginPage onAuthSuccess={handleAuthSuccess} t={t} lastLogins={lastLogins} />;

  // Post-auth wizard gating
  if (!state.landingCompleted) return <LandingFlow onComplete={(role) => setState(s => ({ ...s, role, landingCompleted: true, signupCompleted: true }))} t={t} state={state} setState={setState} />;
  
  if (!state.onboarded) {
    return (
      <div className="min-h-screen bg-mesh flex flex-col md:items-center md:justify-center p-4 sm:p-6 transition-colors duration-500">
        <div className="fixed top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.5), transparent)' }} />
        <div className="w-full max-w-lg glass rounded-[2rem] shadow-2xl p-8 sm:p-10 space-y-8 animate-in zoom-in-95 duration-500"
          style={{ boxShadow: '0 25px 80px rgba(79,70,229,0.15)' }}>
          <div className="flex gap-2 items-center">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                state.onboardingStep >= i
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
                  : 'bg-slate-100 dark:bg-slate-700'
              }`} />
            ))}
          </div>
          {state.onboardingStep === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 text-center py-6">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl float"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                <Sparkles className="text-white w-10 h-10" />
              </div>
              <h2 className="text-4xl font-black text-slate-900 text-slate-900 dark:text-white leading-tight mb-3 font-display" style={{ letterSpacing: '-0.03em' }}>You're In!</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">Let's configure your business in 30 seconds.</p>
              <Button fullWidth className="h-14 text-base btn-glow" onClick={() => setState(s => ({ ...s, onboardingStep: 2 }))}>Setup My Business <ChevronRight className="w-4 h-4" /></Button>
            </div>
          )}
          {state.onboardingStep === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 space-y-5">
              <div>
                <h2 className="text-2xl font-black text-slate-900 text-slate-900 dark:text-white font-display mb-1">{t.onboardingStep3}</h2>
                <p className="text-slate-500 text-sm">This will be your business identity across Vyaparika</p>
              </div>
              <div>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={state.profile.shopName}
                    onChange={(e) => setState(s => ({ ...s, profile: { ...s.profile, shopName: e.target.value }}))}
                    className={`input-pro w-full bg-slate-50 dark:bg-slate-800/80 border-2 rounded-2xl py-4 pl-12 pr-5 font-bold text-base dark:text-white transition-colors ${
                      state.profile.shopName.trim() ? 'border-emerald-400 dark:border-emerald-600' : 'border-slate-200 dark:border-slate-700/60'
                    }`}
                    placeholder="e.g. Sharma General Store"
                    autoFocus
                  />
                </div>
                {!state.profile.shopName.trim() && (
                  <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Business name is required to continue
                  </p>
                )}
                {state.profile.shopName.trim() && (
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Looks great!
                  </p>
                )}
              </div>
              <Button fullWidth className="h-14 text-base btn-glow" disabled={!state.profile.shopName.trim()} onClick={() => setState(s => ({ ...s, onboardingStep: 4 }))}>Continue <ChevronRight className="w-4 h-4" /></Button>
            </div>
          )}
          {state.onboardingStep === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <ShieldCheck className="w-10 h-10 text-emerald-600" />
                </div>
                <div className="absolute inset-0 rounded-3xl border-2 border-emerald-400/40 animate-ping" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 text-slate-900 dark:text-white mb-3 font-display">Cash Safe Promise</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">Your financial data stays local &amp; encrypted.</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">We never share your revenue data.</p>
              <Button fullWidth className="h-14 text-base btn-glow" onClick={() => setState(s => {
                const newState = { ...s, onboarded: true };
                // Save completed profile to registry for future logins
                if (s.profile.email) {
                  saveUserProfileToRegistry(s.profile.email, s.role as UserRole, s.language, s.profile);
                }
                return newState;
              })}>
                <Sparkles className="w-4 h-4" /> Enter Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Profile completion gate — mandatory after first login
  const isProfileComplete = !!(state.profile.name?.trim() && state.profile.phone?.trim() && state.profile.city?.trim());
  if (!isProfileComplete) {
    return <ProfileCompleteScreen state={state} setState={setState} />;
  }

  const isMapView = activeTab === 'storemap' && state.role === UserRole.MANUFACTURER;

  return (
    <div className="min-h-screen bg-mesh flex overflow-hidden transition-colors duration-500">
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        {/* ─────────────────────────────────────────
           REDESIGNED TOP NAVBAR — Gradient, Logo, Tagline
           ───────────────────────────────────────── */}
        {!isMapView && (
        <header className="navbar-header shrink-0 z-30">
          {/* ── Logo & Identity Section ── */}
          <div className="navbar-logo-section">
            <div className="navbar-logo-avatar">
              {state.profile.avatar_url ? (
                <img
                  src={state.profile.avatar_url}
                  alt="Business logo"
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <Package className="navbar-logo-icon" />
              )}
            </div>
            <div className="navbar-identity">
              <h1 className="navbar-business-name">
                {state.profile.shopName || 'My Business'}
              </h1>
              <div className="navbar-business-badge">
                {state.role?.toUpperCase() || 'RETAILER'} • DASHBOARD
              </div>
            </div>
          </div>

          {/* ── Center Tagline (Desktop Only) ── */}
          <div className="navbar-center">
            <div className="navbar-tagline-divider"></div>
            <span className="navbar-tagline">
              Powering Your Business Network
            </span>
            <div className="navbar-tagline-divider"></div>
          </div>

          {/* ── Action Buttons Section ── */}
          <div className="navbar-actions">
            <button
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              className={`navbar-action-btn ${showNotifPanel ? 'active' : 'inactive'}`}
              aria-label="View alerts and notifications"
              title="Alerts"
            >
              <Bell className="navbar-action-icon" />
              <span className="navbar-action-label">Alerts</span>
              {unreadCount > 0 && (
                <span className="navbar-notification-badge">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {state.role === UserRole.MANUFACTURER && (
              <button
                onClick={() => setActiveTab('storemap')}
                className={`navbar-action-btn ${activeTab === 'storemap' ? 'active' : 'inactive'}`}
                aria-label="View store map"
                title="Store Map"
              >
                <Globe className="navbar-action-icon" />
                <span className="navbar-action-label">Map</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('payments')}
              className={`navbar-action-btn ${activeTab === 'payments' ? 'active' : 'inactive'}`}
              aria-label="Go to payments"
              title="Payments"
            >
              <Smartphone className="navbar-action-icon" />
              <span className="navbar-action-label">Payments</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`navbar-action-btn ${activeTab === 'admin' ? 'active' : 'inactive'}`}
              aria-label="Go to profile"
              title="Profile"
            >
              <User className="navbar-action-icon" />
              <span className="navbar-action-label">Profile</span>
            </button>
          </div>
        </header>
        )}

        {/* ── Real-time Notification Panel ── */}
        {!isMapView && showNotifPanel && (
          <div className="absolute top-14 sm:top-20 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-[360px] max-h-[420px] sm:max-h-[480px] rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
            style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-800 text-slate-900 dark:text-white">Notifications</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{unreadCount} unread</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="px-2.5 py-1 rounded-lg text-[10px] font-black text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearNotifications} className="px-2.5 py-1 rounded-lg text-[10px] font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                    Clear
                  </button>
                )}
                <button onClick={() => setShowNotifPanel(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-black text-sm">No notifications</p>
                  <p className="text-[10px] mt-1">You're all caught up!</p>
                </div>
              ) : (
                notifications.map(notif => {
                  const icon = notif.type === 'connection' ? '🤝' : notif.type === 'expense' ? '💰' : notif.type === 'stock' ? '📦' : 'ℹ️';
                  const borderColor = notif.type === 'stock' ? 'border-l-amber-500' : notif.type === 'connection' ? 'border-l-indigo-500' : notif.type === 'expense' ? 'border-l-emerald-500' : 'border-l-slate-400';
                  return (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-slate-50 dark:border-slate-800/60 border-l-4 ${borderColor} ${!notif.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''} hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors`}
                      onClick={() => setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-black text-xs text-slate-800 text-slate-900 dark:text-white">{notif.title}</p>
                            {!notif.read && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest mt-1.5">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(notif.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        <div className={`flex-1 ${isMapView ? 'overflow-hidden p-0' : 'overflow-y-auto p-3 sm:p-6'} bg-transparent`}>
          {showQuickTips && (
            <div className="max-w-7xl mx-auto mb-4 rounded-2xl border p-4" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">Quick Help</h2>
                  <p className="text-sm mt-1">Start with Dashboard, then open Inventory to add products. Use Settings in Profile for advanced options.</p>
                </div>
                <button className="app-secondary-btn px-3" onClick={dismissQuickTips}>Got it</button>
              </div>
            </div>
          )}
          {showAddPage ? (
            <AddInventoryModule 
              onClose={() => setShowAddPage(false)} 
              onAdd={(sku) => setState(s => ({ ...s, inventory: [sku, ...s.inventory] }))}
              t={t}
              shopType={state.shopType || ShopType.GROCERY}
            />
          ) : stockUpdateItem ? (
            <StockUpdateModule
              item={stockUpdateItem}
              onClose={() => setStockUpdateItem(null)}
              onUpdate={handleStockUpdate}
              t={t}
            />
          ) : activeTab === 'admin' ? (
            <ErrorBoundary><AdminModule state={state} setState={setState} t={t} onDeleteAccount={() => setLastLogins(getLastLogins())} onLogout={handleAppLogout} /></ErrorBoundary>
          ) : activeTab === 'expenses' ? (
            state.role === UserRole.MANUFACTURER ? (
              <ErrorBoundary><CampaignsPage localInventory={state.inventory} /></ErrorBoundary>
            ) : (
              <ErrorBoundary><ExpensesModule state={state} setState={setState} t={t} /></ErrorBoundary>
            )
          ) : activeTab === 'network' ? (
            <ErrorBoundary><NetworkPage state={state} setState={setState} t={t} /></ErrorBoundary>
          ) : activeTab === 'payments' ? (
            <ErrorBoundary><PaymentsModule state={state} setState={setState} t={t} /></ErrorBoundary>
          ) : activeTab === 'storemap' && state.role === UserRole.MANUFACTURER ? (
            <div className="relative w-full h-full" style={{ height: '100vh' }}>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="absolute top-4 right-4 z-20 px-4 py-2 rounded-xl text-sm font-black text-white shadow-lg border border-white/20"
                style={{ background: 'rgba(15, 23, 42, 0.78)', backdropFilter: 'blur(8px)' }}
                aria-label="Go to home screen"
                title="Back to Home"
              >
                Back to Home
              </button>
              <iframe
                src="/globe.html"
                title="Store Network Map"
                className="w-full h-full border-0"
                style={{ minHeight: '100vh' }}
              />
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-20 sm:pb-8">
              {activeTab === 'dashboard' && (
                <>
                  {state.role === UserRole.RETAILER && <RetailerDashboard state={state} t={t} />}
                  {state.role === UserRole.DISTRIBUTOR && <DistributorDashboard state={state} t={t} />}
                  {state.role === UserRole.MANUFACTURER && <ManufacturerDashboard state={state} t={t} />}
                </>
              )}
              {activeTab === 'inventory' && (state.role === UserRole.MANUFACTURER ? (
                <ErrorBoundary>
                  <SkuVelocityPage onAddSku={() => setShowAddPage(true)} inventory={state.inventory} />
                </ErrorBoundary>
              ) : (() => {
                // Single-pass computation for all inventory stats
                let invTotalValue = 0;
                let invAlertCount = 0;
                let invExpiringCount = 0;
                const statusCounts: Record<string, number> = { OPTIMAL: 0, LOW: 0, CRITICAL: 0, EXCESS: 0 };
                const categorySet = new Set<string>();
                const now = Date.now();
                for (const i of state.inventory) {
                  invTotalValue += i.currentStock * (i.price || 0);
                  if (i.status === 'CRITICAL' || i.status === 'LOW') invAlertCount++;
                  if (i.status in statusCounts) statusCounts[i.status]++;
                  if (i.expiryDate) {
                    const d = Math.ceil((new Date(i.expiryDate).getTime() - now) / 86400000);
                    if (d > 0 && d <= 30) invExpiringCount++;
                  }
                  if (i.category) categorySet.add(i.category);
                }
                const uniqueCategories = [...categorySet].sort();
                const statusFilters = [
                  { key: 'ALL',     label: 'All Items', count: state.inventory.length,    color: '#64748b', activeBg: '#1e293b',  activeTxt: '#fff'     },
                  { key: 'OPTIMAL', label: 'Optimal',   count: statusCounts.OPTIMAL,      color: '#10b981', activeBg: '#064e3b',  activeTxt: '#6ee7b7'  },
                  { key: 'LOW',     label: 'Low Stock', count: statusCounts.LOW,           color: '#f59e0b', activeBg: '#78350f',  activeTxt: '#fcd34d'  },
                  { key: 'CRITICAL',label: 'Critical',  count: statusCounts.CRITICAL,      color: '#f43f5e', activeBg: '#4c0519',  activeTxt: '#fda4af'  },
                  { key: 'EXCESS',  label: 'Excess',    count: statusCounts.EXCESS,        color: '#6366f1', activeBg: '#1e1b4b',  activeTxt: '#a5b4fc'  },
                ];
                const kpis = [
                  { label: 'Total SKUs',      value: String(state.inventory.length),
                    sub: 'products tracked',      icon: Package,       color: '#6366f1', bg: 'rgba(99,102,241,0.08)',  bd: 'rgba(99,102,241,0.18)'  },
                  { label: 'Stock Value',     value: '\u20b9' + invTotalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
                    sub: 'total inventory',       icon: TrendingUp,    color: '#10b981', bg: 'rgba(16,185,129,0.08)',  bd: 'rgba(16,185,129,0.18)'  },
                  { label: 'Need Attention',  value: String(invAlertCount),
                    sub: 'critical or low',       icon: AlertTriangle, color: invAlertCount  > 0 ? '#f43f5e' : '#94a3b8', bg: invAlertCount  > 0 ? 'rgba(244,63,94,0.08)'  : 'rgba(148,163,184,0.06)', bd: invAlertCount  > 0 ? 'rgba(244,63,94,0.18)'  : 'rgba(148,163,184,0.15)' },
                  { label: 'Expiring Soon',   value: String(invExpiringCount),
                    sub: 'within 30 days',        icon: Calendar,      color: invExpiringCount > 0 ? '#f59e0b' : '#94a3b8', bg: invExpiringCount > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(148,163,184,0.06)', bd: invExpiringCount > 0 ? 'rgba(245,158,11,0.18)' : 'rgba(148,163,184,0.15)' },
                ];
                return (
                  <div className="space-y-4">

                    {/* ── KPI Summary Strip ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {kpis.map(kpi => (
                        <div key={kpi.label}
                          className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border transition-shadow duration-200 hover:shadow-md"
                          style={{ borderColor: kpi.bd, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <p className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest leading-tight">{kpi.label}</p>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: kpi.bg }}>
                              <kpi.icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                            </div>
                          </div>
                          <p className="text-2xl font-black leading-none mb-1" style={{ color: kpi.color }}>{kpi.value}</p>
                          <p className="text-[10px] font-semibold text-slate-400">{kpi.sub}</p>
                        </div>
                      ))}
                    </div>

                    {/* ── Toolbar: search + filters + category + add ── */}
                    <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 overflow-hidden"
                      style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                      {/* Top row */}
                      <div className="flex items-stretch border-b border-slate-100 dark:border-slate-700/50">
                        <div className="relative flex-1">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search products or categories..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full h-12 pl-11 pr-10 text-sm font-semibold bg-transparent text-slate-900 dark:text-white outline-none placeholder:text-slate-400 border-r border-slate-100 dark:border-slate-700/50"
                          />
                          {searchTerm.trim() && (
                            <button
                              type="button"
                              onClick={() => setSearchTerm('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700"
                              aria-label="Clear search"
                              title="Clear search"
                            >
                              <X className="w-4 h-4 text-slate-500" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center shrink-0">
                          <select
                            value={invCategoryFilter}
                            onChange={e => setInvCategoryFilter(e.target.value)}
                            className="h-12 px-3 text-xs font-bold bg-transparent dark:bg-transparent dark:text-slate-300 text-slate-600 outline-none cursor-pointer border-r border-slate-100 dark:border-slate-700/50"
                          >
                            <option value="ALL">All Categories</option>
                            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as any)}
                            className="h-12 px-3 text-xs font-bold bg-transparent dark:bg-transparent dark:text-slate-300 text-slate-600 outline-none cursor-pointer border-r border-slate-100 dark:border-slate-700/50"
                          >
                            <option value="name">Sort: Name</option>
                            <option value="stock">Sort: Stock</option>
                            <option value="status">Sort: Status</option>
                          </select>
                          <button
                            onClick={() => setShowAddPage(true)}
                            className="h-12 px-5 text-sm font-black flex items-center gap-2 text-white transition-opacity hover:opacity-90 active:scale-95 shrink-0"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Add Item</span>
                          </button>
                        </div>
                      </div>
                      {/* Filter chip row */}
                      <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">Status</span>
                        {statusFilters.map(f => {
                          const active = invStatusFilter === f.key;
                          return (
                            <button
                              key={f.key}
                              onClick={() => setInvStatusFilter(f.key)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 shrink-0 border"
                              style={active
                                ? { background: f.activeBg, color: f.activeTxt, borderColor: 'transparent', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }
                                : { background: 'transparent', color: '#64748b', borderColor: 'rgba(148,163,184,0.25)' }
                              }
                            >
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: f.color }} />
                              {f.label}
                              <span className="text-[9px] font-black opacity-60">{f.count}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── Data Table ── */}
                    <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 overflow-hidden"
                      style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>

                      {/* Table header — hidden on mobile */}
                      <div className="hidden sm:grid px-5 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-900/30"
                        style={{ gridTemplateColumns: 'minmax(180px,2fr) 110px 150px 156px 110px 152px' }}>
                        {['Product', 'Status', 'Stock', 'Price / Value', 'Updated', ''].map(col => (
                          <span key={col} className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest">{col}</span>
                        ))}
                      </div>

                      {/* Table rows */}
                      {filteredInventory.length > 0 ? (
                        <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
                          {filteredInventory.map(item => {
                            const stockPct = Math.min(100, (item.currentStock / Math.max(item.minThreshold * 2.5, 1)) * 100);
                            const sColor = item.status === 'CRITICAL' ? '#f43f5e'
                              : item.status === 'LOW' ? '#f59e0b'
                              : item.status === 'EXCESS' ? '#6366f1'
                              : '#10b981';
                            const val = item.currentStock * (item.price || 0);
                            const updDiff = Math.floor((Date.now() - new Date(item.lastUpdated).getTime()) / 86400000);
                            const relTime = updDiff === 0 ? 'Today' : updDiff === 1 ? 'Yesterday' : `${updDiff}d ago`;
                            return (
                              <div
                                key={item.id}
                                onClick={() => setInvSelectedItem(item)}
                                className="grid px-5 py-3.5 cursor-pointer transition-colors duration-150 hover:bg-slate-50/90 dark:hover:bg-slate-700/20 group items-center"
                                style={{ gridTemplateColumns: 'minmax(180px,2fr) 110px 150px 156px 110px 96px' }}
                              >
                                {/* Product cell */}
                                <div className="flex flex-col gap-0.5 pr-3 min-w-0">
                                  <p className="text-sm font-black text-slate-800 text-slate-900 dark:text-white truncate leading-tight">{item.name}</p>
                                  <p className="text-[10px] font-semibold text-slate-400 leading-none">{item.category}</p>
                                  {item.expiryDate && <div className="mt-1"><ExpiryAlertBadge expiryDate={item.expiryDate} /></div>}
                                </div>

                                {/* Status cell */}
                                <div className="flex items-center">
                                  <Badge status={item.status} />
                                </div>

                                {/* Stock cell */}
                                <div className="flex flex-col gap-1.5 pr-3">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-black" style={{ color: sColor }}>{item.currentStock}</span>
                                    <span className="text-[10px] font-bold text-slate-400">{item.unit}</span>
                                  </div>
                                  <div className="h-1 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700" style={{ width: '72px' }}>
                                    <div style={{ width: `${stockPct}%`, height: '100%', background: sColor, borderRadius: '99px', transition: 'width 0.4s ease' }} />
                                  </div>
                                  <p className="text-[9px] font-bold text-slate-400">Min {item.minThreshold} {item.unit}</p>
                                </div>

                                {/* Price / Value cell */}
                                <div className="flex flex-col gap-0.5">
                                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                                    \u20b9{(item.price || 0).toLocaleString('en-IN')}
                                  </p>
                                  <p className="text-[10px] font-bold text-slate-400">per {item.unit}</p>
                                  <p className="text-xs font-black text-slate-500 dark:text-slate-400 mt-0.5">
                                    \u20b9{val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                  </p>
                                </div>

                                {/* Updated cell */}
                                <div className="flex flex-col gap-0.5">
                                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{relTime}</p>
                                  <p className="text-[9px] font-semibold text-slate-400">
                                    {new Date(item.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  </p>
                                </div>

                                {/* Action cell */}
                                <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      if (val <= 0) return;
                                      // Prevent duplicate inventory payments for the same SKU
                                      const alreadyPaid = (state.payments || []).some(p => p.source === 'inventory' && p.sourceId === item.id);
                                      if (alreadyPaid) {
                                        showToast('Payment already recorded for this item');
                                        return;
                                      }
                                      const entry: Payment = {
                                        id: `pay_inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                                        party: item.name,
                                        amount: Math.round(val * 100) / 100,
                                        type: 'PAID',
                                        method: 'CASH',
                                        status: 'COMPLETED',
                                        date: new Date().toISOString(),
                                        note: `Inventory value: ${item.name} (${item.currentStock} ${item.unit} × ₹${item.price})`,
                                        source: 'inventory',
                                        sourceId: item.id,
                                      };
                                      setState(s => ({ ...s, payments: [entry, ...(s.payments || [])] }));
                                      showToast(`₹${val.toLocaleString('en-IN')} payment recorded`);
                                    }}
                                    title="Record Payment"
                                    className="h-8 px-2 rounded-xl text-xs font-black flex items-center gap-1 transition-all duration-150 hover:scale-105 active:scale-95"
                                    style={{ background: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid rgba(16,185,129,0.18)' }}
                                  >
                                    <CreditCard className="w-3 h-3" />
                                    <span className="hidden sm:inline">Pay</span>
                                  </button>
                                  <button
                                    onClick={e => { e.stopPropagation(); setStockUpdateItem(item); }}
                                    className="h-8 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all duration-150 hover:scale-105 active:scale-95"
                                    style={{ background: 'rgba(99,102,241,0.09)', color: '#4f46e5', border: '1px solid rgba(99,102,241,0.18)' }}
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    <span className="hidden sm:inline">Update</span>
                                  </button>
                                  <button
                                    onClick={e => { e.stopPropagation(); setDeleteConfirmItem(item); }}
                                    title="Delete item"
                                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95"
                                    style={{ background: 'rgba(244,63,94,0.07)', color: '#e11d48', border: '1px solid rgba(244,63,94,0.16)' }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#e0e7ff,#c7d2fe)' }}>
                            <Package className="w-7 h-7 text-indigo-400" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-black text-slate-500">No items found</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {state.inventory.length > 0 ? 'Try adjusting your filters or search' : 'Add your first product to get started'}
                            </p>
                          </div>
                          {state.inventory.length === 0 && (
                            <button
                              onClick={() => setShowAddPage(true)}
                              className="h-10 px-6 rounded-2xl font-black text-sm flex items-center gap-2 text-white"
                              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}
                            >
                              <PlusCircle className="w-4 h-4" /> Add First Item
                            </button>
                          )}
                        </div>
                      )}

                      {/* Table footer */}
                      {filteredInventory.length > 0 && (
                        <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/20">
                          <p className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest">
                            {filteredInventory.length} of {state.inventory.length} items
                          </p>
                          <p className="text-[9.5px] font-semibold text-slate-400 hidden sm:block">Click any row to view details</p>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })())}
            </div>
          )}
        </div>

        {/* Bottom Nav */}
        {!isMapView && (
        <nav className="app-navbar px-1 sm:px-2 pt-1.5 sm:pt-2 pb-1 flex justify-around items-end shrink-0 z-30">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="app-nav-button transition-all duration-150"
                aria-label={item.label}
                title={item.label}
              >
                <div className={`app-nav-pill ${isActive ? 'active' : ''}`}>
                  <item.icon className={`app-nav-icon ${isActive ? 'active w-4 h-4 sm:w-5 sm:h-5' : 'inactive w-4 h-4 sm:w-5 sm:h-5'}`} />
                </div>
                <span className={`app-nav-label ${isActive ? 'active' : 'inactive'}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
        )}
        <InventoryDetailPanel
          item={invSelectedItem}
          movementLogs={state.movementLogs}
          onClose={() => setInvSelectedItem(null)}
          onUpdate={(sku) => { setStockUpdateItem(sku); setInvSelectedItem(null); }}
          onAddPayment={(sku) => {
            const stockValue = sku.currentStock * (sku.price || 0);
            if (stockValue <= 0) return;
            // Prevent duplicate inventory payments for the same SKU
            const alreadyPaid = (state.payments || []).some(p => p.source === 'inventory' && p.sourceId === sku.id);
            if (alreadyPaid) {
              showToast('Payment already recorded for this item');
              setInvSelectedItem(null);
              return;
            }
            const entry: Payment = {
              id: `pay_inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              party: sku.name,
              amount: Math.round(stockValue * 100) / 100,
              type: 'PAID',
              method: 'CASH',
              status: 'COMPLETED',
              date: new Date().toISOString(),
              note: `Inventory value: ${sku.name} (${sku.currentStock} ${sku.unit} × ₹${sku.price})`,
              source: 'inventory',
              sourceId: sku.id,
            };
            setState(s => ({ ...s, payments: [entry, ...(s.payments || [])] }));
            setInvSelectedItem(null);
            showToast(`₹${stockValue.toLocaleString('en-IN')} payment recorded for ${sku.name}`);
          }}
        />
        <DeleteConfirmModal
          item={deleteConfirmItem}
          onCancel={() => setDeleteConfirmItem(null)}
          onConfirm={(skuId) => {
            const name = deleteConfirmItem?.name ?? 'Item';
            handleDeleteSKU(skuId);
            showToast(`"${name}" removed from inventory`);
          }}
        />
        <ToastNotification message={toastMsg} onDismiss={() => setToastMsg(null)} />
      </main>
    </div>
  );
}

// --- Delete Confirm Modal ---

// Static style objects extracted to avoid re-creation on every render
const DELETE_MODAL_BACKDROP: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 60,
  background: 'rgba(15,23,42,0.55)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '16px',
  transition: 'opacity 0.22s ease',
};

const DeleteConfirmModal: React.FC<{
  item: SKU | null;
  onCancel: () => void;
  onConfirm: (skuId: string) => void;
}> = ({ item, onCancel, onConfirm }) => {
  const isOpen = !!item;

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        ...DELETE_MODAL_BACKDROP,
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      <div
        className="bg-white dark:bg-slate-900"
        style={{
          width: '100%', maxWidth: '400px',
          borderRadius: '20px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(244,63,94,0.12)',
          overflow: 'hidden',
          transform:  isOpen ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(8px)',
          transition: 'transform 0.26s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Red accent top bar */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg,#f43f5e,#e11d48)' }} />

        <div className="p-6">
          {/* Icon + heading */}
          <div className="flex items-start gap-4 mb-5">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(244,63,94,0.09)', border: '1.5px solid rgba(244,63,94,0.18)' }}
            >
              <Trash2 className="w-5 h-5" style={{ color: '#e11d48' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-black text-slate-800 text-slate-900 dark:text-white leading-tight mb-1">
                Delete Inventory Item
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>

          {/* Product details card */}
          {item && (
            <div
              className="rounded-xl p-4 mb-5"
              style={{ background: 'rgba(244,63,94,0.04)', border: '1px solid rgba(244,63,94,0.14)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Product Name</p>
                  <p className="text-sm font-black text-slate-800 text-slate-900 dark:text-white truncate leading-tight">{item.name}</p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{item.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">SKU ID</p>
                  <p className="text-[11px] font-black font-mono text-slate-600 dark:text-slate-400 tracking-wide">
                    #{item.id.replace('.', '').slice(0, 10).toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-rose-100 dark:border-rose-900/30 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stock</p>
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300 mt-0.5">{item.currentStock} {item.unit}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Price</p>
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300 mt-0.5">
                    &#8377;{(item.price || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                  <p className="text-xs font-black mt-0.5"
                    style={{ color: item.status === 'CRITICAL' ? '#e11d48' : item.status === 'LOW' ? '#d97706' : item.status === 'EXCESS' ? '#4f46e5' : '#059669' }}>
                    {item.status}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Amber warning note */}
          <div
            className="flex items-start gap-2.5 p-3 rounded-xl mb-6"
            style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}
          >
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#d97706' }} />
            <p className="text-[11px] font-semibold leading-relaxed" style={{ color: '#92400e' }}>
              All movement history for this item will also be permanently removed from records.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 h-11 rounded-2xl text-sm font-black transition-all duration-150 active:scale-[0.97]"
              style={{
                background: 'rgba(148,163,184,0.1)',
                color: '#64748b',
                border: '1.5px solid rgba(148,163,184,0.25)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => item && onConfirm(item.id)}
              className="flex-1 h-11 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all duration-150 hover:opacity-90 active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg,#f43f5e,#e11d48)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(244,63,94,0.35)',
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Toast Notification ---

const ToastNotification: React.FC<{
  message: { text: string; tone: 'success' | 'error' | 'info' } | null;
  onDismiss: () => void;
}> = ({ message, onDismiss }) => {
  const visible = !!message;
  const tone = message?.tone || 'info';
  const toneStyles = {
    success: { iconBg: 'rgba(22,163,74,0.16)', iconColor: 'var(--color-success)', border: 'rgba(22,163,74,0.35)' },
    error: { iconBg: 'rgba(220,38,38,0.16)', iconColor: 'var(--color-danger)', border: 'rgba(220,38,38,0.35)' },
    info: { iconBg: 'rgba(37,99,235,0.16)', iconColor: 'var(--color-info)', border: 'rgba(37,99,235,0.35)' },
  }[tone];
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '88px',
        left: '50%',
        zIndex: 70,
        opacity:       visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transform: visible
          ? 'translateX(-50%) translateY(0)'
          : 'translateX(-50%) translateY(12px)',
        transition: 'opacity 0.22s ease, transform 0.26s cubic-bezier(0.34,1.56,0.64,1)',
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 14px 9px 10px',
        borderRadius: '14px',
        background: 'var(--color-toast-bg)',
        border: `1px solid ${toneStyles.border}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
        minWidth: '256px', maxWidth: '88vw',
      }}
    >
      <div style={{
        width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0,
        background: toneStyles.iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {tone === 'error' ? (
          <AlertTriangle style={{ width: '14px', height: '14px', color: toneStyles.iconColor }} />
        ) : tone === 'info' ? (
          <Info style={{ width: '14px', height: '14px', color: toneStyles.iconColor }} />
        ) : (
          <CheckCircle style={{ width: '14px', height: '14px', color: toneStyles.iconColor }} />
        )}
      </div>
      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-on-accent)', flex: 1, lineHeight: 1.4 }}>
        {message?.text}
      </span>
      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', borderRadius: '6px', opacity: 0.5, transition: 'opacity 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; }}
      >
        <X style={{ width: '13px', height: '13px', color: '#94a3b8' }} />
      </button>
    </div>
  );
};

// --- Inventory Detail Panel ---

// Static style objects for InventoryDetailPanel — extracted to avoid GC churn
const DETAIL_BACKDROP_STYLE: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 45,
  background: 'rgba(15,23,42,0.40)',
  backdropFilter: 'blur(3px)',
  WebkitBackdropFilter: 'blur(3px)',
  transition: 'opacity 0.24s ease',
};
const DETAIL_PANEL_STYLE: React.CSSProperties = {
  position: 'fixed', top: 0, right: 0, bottom: 0,
  width: 'min(420px, 95vw)',
  zIndex: 50,
  transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
  display: 'flex', flexDirection: 'column',
  boxShadow: '-4px 0 40px rgba(0,0,0,0.18)',
};

const InventoryDetailPanel: React.FC<{
  item: SKU | null;
  movementLogs: StockLog[];
  onClose: () => void;
  onUpdate: (item: SKU) => void;
  onAddPayment?: (item: SKU) => void;
}> = ({ item, movementLogs, onClose, onUpdate, onAddPayment }) => {
  const isOpen = !!item;

  const recentLogs = useMemo(() =>
    item
      ? movementLogs
          .filter(l => l.skuId === item.id)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5)
      : []
  , [item, movementLogs]);

  const stockPct = item
    ? Math.min(100, (item.currentStock / Math.max(item.minThreshold * 2.5, 1)) * 100)
    : 0;

  const sColor = !item ? '#6366f1'
    : item.status === 'CRITICAL' ? '#f43f5e'
    : item.status === 'LOW'      ? '#f59e0b'
    : item.status === 'EXCESS'   ? '#6366f1'
    : '#10b981';

  const stockValue = item ? item.currentStock * (item.price || 0) : 0;
  const expiryDays: number | null = item?.expiryDate
    ? Math.ceil((new Date(item.expiryDate).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          ...DETAIL_BACKDROP_STYLE,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      />

      {/* Slide-in panel */}
      <div
        style={{
          ...DETAIL_PANEL_STYLE,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
        className="bg-white dark:bg-slate-900"
      >
        {/* Panel header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {item && (
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-indigo-600 dark:text-indigo-400"
                  style={{ background: 'rgba(99,102,241,0.1)' }}>
                  {item.category}
                </span>
              )}
              {item && <Badge status={item.status} />}
            </div>
            <h2 className="text-xl font-black text-slate-800 text-slate-900 dark:text-white leading-tight truncate">
              {item?.name || '\u2014'}
            </h2>
            {item?.expiryDate && (
              <div className="mt-1.5"><ExpiryAlertBadge expiryDate={item.expiryDate} /></div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Stock level meter */}
          <div className="rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Stock Level</p>
            <div className="flex justify-between items-end mb-3">
              <div>
                <span className="text-4xl font-black" style={{ color: sColor }}>
                  {item?.currentStock ?? 0}
                </span>
                <span className="text-sm font-bold text-slate-400 ml-2">{item?.unit}</span>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min Threshold</p>
                <p className="text-base font-black text-slate-600 dark:text-slate-300">
                  {item?.minThreshold ?? 0}
                  <span className="text-xs font-bold text-slate-400 ml-1">{item?.unit}</span>
                </p>
              </div>
            </div>
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div style={{
                width: `${stockPct}%`, height: '100%',
                background: sColor, borderRadius: '99px',
                transition: 'width 0.5s ease 0.1s',
              }} />
            </div>
            {item && (
              <p className="text-[9.5px] font-semibold text-slate-400 mt-1.5">
                {item.currentStock >= item.minThreshold
                  ? `${item.currentStock - item.minThreshold} ${item.unit} above minimum`
                  : `${item.minThreshold - item.currentStock} ${item.unit} below minimum`}
              </p>
            )}
          </div>

          {/* Metrics 2\u00d72 grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Unit Price</p>
              <p className="text-base font-black text-slate-800 text-slate-900 dark:text-white">\u20b9{(item?.price || 0).toLocaleString('en-IN')}</p>
              <p className="text-[9px] font-bold text-slate-400 mt-1">per {item?.unit || '\u2014'}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Stock Value</p>
              <p className="text-base font-black" style={{ color: '#10b981' }}>\u20b9{stockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              <p className="text-[9px] font-bold text-slate-400 mt-1">total valuation</p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Received</p>
              <p className="text-base font-black" style={{ color: '#10b981' }}>+{item?.totalIn ?? 0}</p>
              <p className="text-[9px] font-bold text-slate-400 mt-1">{item?.unit}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Dispatched</p>
              <p className="text-base font-black" style={{ color: '#f43f5e' }}>{item?.totalOut ?? 0}</p>
              <p className="text-[9px] font-bold text-slate-400 mt-1">{item?.unit}</p>
            </div>
          </div>

          {/* Expiry detail */}
          {item?.expiryDate && expiryDays !== null && (() => {
            const isExp  = expiryDays <= 0;
            const isCrit = expiryDays > 0 && expiryDays <= 7;
            const tc  = isExp || isCrit ? '#b91c1c' : '#c2410c';
            const bg  = isExp || isCrit ? 'rgba(254,226,226,0.7)' : 'rgba(255,237,213,0.7)';
            const bdr = isExp || isCrit ? '#fca5a5' : '#fdba74';
            const urgency = isCrit ? 'HIGH' : expiryDays <= 15 ? 'MEDIUM' : 'LOW';
            return (
              <div className="rounded-xl p-4 border" style={{ background: bg, borderColor: bdr }}>
                <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: tc }}>Expiry Information</p>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black" style={{ color: tc }}>
                      {isExp ? `Expired ${Math.abs(expiryDays)} day${Math.abs(expiryDays) !== 1 ? 's' : ''} ago` : `${expiryDays} day${expiryDays !== 1 ? 's' : ''} remaining`}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                      {new Date(item.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  {!isExp && (
                    <span
                      className="text-[9px] font-black px-2 py-1 rounded-lg shrink-0"
                      style={{ background: isCrit ? 'rgba(185,28,28,0.12)' : 'rgba(194,65,12,0.12)', color: tc }}
                    >
                      {urgency} URGENCY
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Activity log */}
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Recent Activity</p>
            {recentLogs.length > 0 ? (
              <div className="space-y-2">
                {recentLogs.map(log => (
                  <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700/40 bg-slate-50 dark:bg-slate-800/40">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: log.type === 'IN' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)' }}
                    >
                      {log.type === 'IN'
                        ? <ArrowUpRight className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
                        : <Minus        className="w-3.5 h-3.5" style={{ color: '#f43f5e' }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black" style={{ color: log.type === 'IN' ? '#10b981' : '#f43f5e' }}>
                          {log.type === 'IN' ? '+' : '-'}{log.quantity} {item?.unit}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 shrink-0">
                          {new Date(log.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5">{log.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-400">No movement recorded yet</p>
                <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">Stock updates will appear here</p>
              </div>
            )}
          </div>

          {item && (
            <p className="text-[9.5px] font-semibold text-slate-400 text-center pb-2">
              Last updated \u00b7 {new Date(item.lastUpdated).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        {/* Panel footer */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 space-y-2">
          <button
            onClick={() => { if (item) onUpdate(item); }}
            className="w-full h-11 rounded-2xl font-black text-sm flex items-center justify-center gap-2 text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 14px rgba(99,102,241,0.28)' }}
          >
            <RefreshCw className="w-4 h-4" /> Update Stock
          </button>
          {onAddPayment && item && (
            <button
              onClick={() => onAddPayment(item)}
              className="w-full h-10 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1.5px solid rgba(16,185,129,0.25)' }}
            >
              <CreditCard className="w-4 h-4" /> Record Payment
            </button>
          )}
        </div>
      </div>
    </>
  );
};

// --- Component Fragments ---

const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  // phase: 0 = particles scattered | 1 = assembling/assembled | 2 = scanning | 3 = exiting
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);

  // Pre-compute per-letter scatter vectors (stable across renders)
  const letterScatter = useRef(
    'Vyaparika'.split('').map(() => ({
      tx: (Math.random() - 0.5) * 520,
      ty: (Math.random() - 0.5) * 320,
      r:  (Math.random() - 0.5) * 130,
    }))
  );

  // Pre-compute ambient floating particles
  const ambientParticles = useRef(
    Array.from({ length: 55 }, (_, i) => ({
      id: i,
      x:    Math.random() * 100,
      y:    Math.random() * 100,
      size: 1.5 + Math.random() * 2.8,
      delay: Math.random() * 3,
      dur:   2.5 + Math.random() * 2.5,
    }))
  );

  useEffect(() => {
    //  500 ms → begin assembly
    // 1 500 ms → scanning phase
    // 2 300 ms → exit zoom-out
    // 2 950 ms → unmount (onFinish)
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 1500);
    const t3 = setTimeout(() => setPhase(3), 2350);
    const t4 = setTimeout(onFinish,          2960);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [onFinish]);

  const letters = 'Vyaparika'.split('');
  const cyan = '#00d4ff';

  return (
    <div
      className={`fixed inset-0 z-[500] flex flex-col items-center justify-center overflow-hidden select-none${phase === 3 ? ' splash-do-exit' : ''}`}
      style={{ background: '#060d1f' }}
    >
      {/* ── Animated navy grid ── */}
      <div className="splash-grid absolute inset-0 pointer-events-none" />

      {/* ── Vignette so grid fades at edges ── */}
      <div className="splash-vignette absolute inset-0 pointer-events-none" />

      {/* ── Corner brackets ── */}
      <div className="splash-corner splash-corner-tl" />
      <div className="splash-corner splash-corner-tr" />
      <div className="splash-corner splash-corner-bl" />
      <div className="splash-corner splash-corner-br" />

      {/* ── Ambient floating particles ── */}
      {ambientParticles.current.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full splash-pf pointer-events-none"
          style={{
            left:             `${p.x}%`,
            top:              `${p.y}%`,
            width:            `${p.size}px`,
            height:           `${p.size}px`,
            background:       cyan,
            opacity:          phase >= 1 ? undefined : 0,
            animationDelay:   `${p.delay}s`,
            animationDuration:`${p.dur}s`,
            transition:       'opacity 1.2s ease',
            boxShadow:        `0 0 ${p.size * 2}px ${cyan}`,
          }}
        />
      ))}

      {/* ── Central radial glow behind text ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '760px', height: '340px',
          background: `radial-gradient(ellipse at center, rgba(0,212,255,0.13) 0%, transparent 70%)`,
          opacity:    phase >= 1 ? 1 : 0,
          transition: 'opacity 0.9s ease',
        }}
      />

      {/* ══ Main content ══ */}
      <div className="relative z-10 flex flex-col items-center">

        {/* ── Icon with orbit rings ── */}
        <div
          className="relative mb-6"
          style={{
            opacity:    phase >= 1 ? 1 : 0,
            transform:  phase >= 1 ? 'translateY(0) scale(1)' : 'translateY(-24px) scale(0.7)',
            transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {/* Outer orbit ring */}
          <div
            className="splash-ring-outer absolute"
            style={{ inset: '-18px', borderRadius: '50%', border: `1px solid rgba(0,212,255,0.22)` }}
          >
            {/* Orbit dot */}
            <div style={{
              position: 'absolute', top: '50%', left: '-3px',
              width: '6px', height: '6px', borderRadius: '50%',
              background: cyan, boxShadow: `0 0 8px ${cyan}`,
              transform: 'translateY(-50%)',
            }} />
          </div>
          {/* Inner orbit ring */}
          <div
            className="splash-ring-inner absolute"
            style={{ inset: '-10px', borderRadius: '50%', border: `1px solid rgba(0,212,255,0.15)` }}
          >
            <div style={{
              position: 'absolute', bottom: '-3px', left: '50%',
              width: '5px', height: '5px', borderRadius: '50%',
              background: '#7c3aed', boxShadow: '0 0 8px #7c3aed',
              transform: 'translateX(-50%)',
            }} />
          </div>

          {/* Icon box */}
          <div
            style={{
              width: '64px', height: '64px',
              borderRadius: '18px',
              background: 'rgba(0,212,255,0.06)',
              border:      `1.5px solid rgba(0,212,255,0.40)`,
              boxShadow:   phase >= 2
                ? `0 0 28px rgba(0,212,255,0.30), 0 0 60px rgba(0,212,255,0.12), inset 0 0 18px rgba(0,212,255,0.06)`
                : `0 0 16px rgba(0,212,255,0.15)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'box-shadow 0.6s ease',
            }}
          >
            {/* AI-flavored cube icon */}
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
              stroke={cyan} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
        </div>

        {/* ── Particle-assembly title ── */}
        <div
          className="relative"
          style={{ height: '90px', marginBottom: '10px', overflow: 'visible' }}
        >
          <div className="flex items-center justify-center">
            {letters.map((letter, i) => (
              <span
                key={i}
                className={`font-display font-black${phase >= 2 ? ' splash-title-scanned' : ''}`}
                style={{
                  fontSize:        'clamp(52px, 9vw, 74px)',
                  color:           '#ffffff',
                  display:         'inline-block',
                  lineHeight:      1.05,
                  letterSpacing:   '-0.04em',
                  // Assemble: scattered → in-place
                  opacity:         phase >= 1 ? 1 : 0,
                  transform:       phase >= 1
                    ? 'translate(0,0) scale(1) rotate(0deg)'
                    : `translate(${letterScatter.current[i].tx}px, ${letterScatter.current[i].ty}px) scale(0.15) rotate(${letterScatter.current[i].r}deg)`,
                  transition:      `opacity 0.65s ease, transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)`,
                  transitionDelay: `${i * 0.055}s`,
                  textShadow:      phase >= 2
                    ? `0 0 22px rgba(0,212,255,0.65), 0 0 55px rgba(0,212,255,0.25)`
                    : '0 0 0 transparent',
                  filter:          phase >= 2 ? `drop-shadow(0 0 6px rgba(0,212,255,0.55))` : 'none',
                }}
              >
                {letter}
              </span>
            ))}
          </div>

          {/* ── Scanning line (fires once in phase 2) ── */}
          {phase >= 2 && (
            <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'hidden' }}>
              <div className="splash-scan-line" />
              <div className="splash-scan-glow" />
            </div>
          )}
        </div>

        {/* ── Subtitle lines ── */}
        <div
          style={{
            opacity:          phase >= 1 ? 1 : 0,
            transform:        phase >= 1 ? 'translateY(0)' : 'translateY(14px)',
            transition:       'opacity 0.6s ease, transform 0.6s ease',
            transitionDelay:  '0.55s',
            textAlign:        'center',
          }}
        >
          <p style={{
            color: cyan, fontSize: '9.5px', fontWeight: 800,
            letterSpacing: '0.38em', textTransform: 'uppercase',
            marginBottom: '5px',
            textShadow: `0 0 14px rgba(0,212,255,0.5)`,
          }}>
            AI · Inventory · Intelligence
          </p>
          <p style={{ color: 'rgba(148,163,184,0.62)', fontSize: '13px', fontWeight: 600 }}>
            Apka Vyapar, Apka Control
          </p>
        </div>

        {/* ── Progress bar ── */}
        <div
          style={{
            marginTop: '36px',
            width: '130px', height: '2px',
            borderRadius: '99px',
            background: 'rgba(0,212,255,0.12)',
            overflow: 'hidden',
            opacity: phase >= 1 ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        >
          <div
            className="splash-bar-shimmer"
            style={{
              height: '100%',
              borderRadius: '99px',
              width:  phase === 0 ? '0%'
                    : phase === 1 ? '42%'
                    : phase === 2 ? '78%'
                    :               '100%',
              boxShadow: `0 0 8px ${cyan}`,
              transition: 'width 0.75s ease',
            }}
          />
        </div>

        {/* ── Pulsing dots ── */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px',
          opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.4s ease' }}>
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: i % 2 === 0 ? cyan : '#7c3aed',
                boxShadow: `0 0 6px ${i % 2 === 0 ? cyan : '#7c3aed'}`,
                animation: 'bounce 1.1s ease-in-out infinite',
                animationDelay: `${i * 0.17}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Horizontal accent lines ── */}
      {['-52px', '52px'].map((offset, k) => (
        <div
          key={k}
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: '50%',
            height: '1px',
            background: `linear-gradient(90deg, transparent, rgba(0,212,255,0.10), rgba(0,212,255,0.10), transparent)`,
            transform: `translateY(${offset})`,
            opacity: phase >= 1 ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}
        />
      ))}
    </div>
  );
};

// --- Updated AddInventoryModule ---

// --- Barcode Scanner with auto-detect + external laser reader support ---
const ScannerOverlay: React.FC<{ shopType: ShopType; onScan: (data: SKUPrediction) => void; onClose: () => void }> = ({ shopType, onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const laserInputRef = useRef<HTMLInputElement>(null);
  const scanLockRef = useRef(false);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mode, setMode] = useState<'camera' | 'laser'>('camera');
  const [status, setStatus] = useState<'connecting' | 'scanning' | 'processing' | 'found' | 'error'>('connecting');
  const [cameraError, setCameraError] = useState('');
  const [detectedCode, setDetectedCode] = useState('');
  const [laserInput, setLaserInput] = useState('');
  const [scanLine, setScanLine] = useState(0);

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Animate scan line
  useEffect(() => {
    if (mode !== 'camera' || status === 'processing' || status === 'found' || status === 'error') return;
    const interval = setInterval(() => setScanLine(prev => (prev >= 100 ? 0 : prev + 2)), 30);
    return () => clearInterval(interval);
  }, [mode, status]);

  // Helper: get camera stream with fallback constraints for laptops
  const getCameraStream = async (): Promise<MediaStream> => {
    // Try rear camera first (mobile), then front camera (laptop), then any camera
    const constraints = [
      { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: true },
    ];
    for (const constraint of constraints) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraint);
      } catch { /* try next */ }
    }
    throw new Error('No camera available');
  };

  // Helper: wait for video to be truly ready
  const waitForVideoReady = (video: HTMLVideoElement): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (video.readyState >= 2) { resolve(); return; }
      const timeout = setTimeout(() => reject(new Error('Video load timeout')), 10000);
      const onReady = () => {
        clearTimeout(timeout);
        video.removeEventListener('loadeddata', onReady);
        video.removeEventListener('error', onError);
        resolve();
      };
      const onError = () => {
        clearTimeout(timeout);
        video.removeEventListener('loadeddata', onReady);
        video.removeEventListener('error', onError);
        reject(new Error('Video stream error'));
      };
      video.addEventListener('loadeddata', onReady);
      video.addEventListener('error', onError);
    });
  };

  // Camera mode — start stream + auto-detect barcodes
  useEffect(() => {
    if (mode !== 'camera') return;
    let cancelled = false;
    let detector: any = null;

    const startCamera = async () => {
      try {
        // Stop any existing stream first
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }

        const stream = await getCameraStream();
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) { stream.getTracks().forEach(t => t.stop()); return; }
        
        video.srcObject = stream;
        // Use play() to start the video — handles both autoPlay and manual
        try { await video.play(); } catch { /* autoPlay may handle it */ }
        
        // Wait until the video has actual frame data
        await waitForVideoReady(video);
        if (cancelled) return;

        if (!mountedRef.current) return;
        setStatus('scanning');
        setCameraError('');

        // Try native BarcodeDetector (Chrome 83+, Edge, Opera, Android WebView)
        if ('BarcodeDetector' in window) {
          try {
            detector = new (window as any).BarcodeDetector({
              formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'itf', 'qr_code', 'data_matrix']
            });
          } catch { detector = null; }
        }

        // Auto-scan loop using requestAnimationFrame
        const scanFrame = async () => {
          if (cancelled || !mountedRef.current) return;
          const vid = videoRef.current;
          
          if (!vid || vid.readyState < 2 || vid.videoWidth === 0) {
            animFrameRef.current = requestAnimationFrame(scanFrame);
            return;
          }

          // If locked (processing a previous scan), just keep polling
          if (scanLockRef.current) {
            animFrameRef.current = requestAnimationFrame(scanFrame);
            return;
          }

          // Try native barcode detection (very fast, runs per-frame)
          if (detector) {
            try {
              const barcodes = await detector.detect(vid);
              if (cancelled || !mountedRef.current) return;
              if (barcodes.length > 0) {
                const code = barcodes[0].rawValue;
                if (code) {
                  scanLockRef.current = true;
                  setDetectedCode(code);
                  setStatus('processing');
                  await processBarcode(code);
                  return; // done, onScan will close
                }
              }
            } catch { /* continue */ }
            if (cancelled) return;
            animFrameRef.current = requestAnimationFrame(scanFrame);
            return;
          }

          // No BarcodeDetector — use AI vision fallback every 3 seconds
          if (!detector) {
            scanLockRef.current = true;
            setStatus('processing');
            try {
              const canvas = document.createElement('canvas');
              canvas.width = vid.videoWidth;
              canvas.height = vid.videoHeight;
              const ctx = canvas.getContext('2d');
              if (ctx && canvas.width > 0 && canvas.height > 0) {
                ctx.drawImage(vid, 0, 0);
                const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
                if (base64) {
                  const result = await identifyProductFromImage(base64, shopType);
                  if (cancelled || !mountedRef.current) return;
                  if (result) {
                    setStatus('found');
                    setTimeout(() => { if (mountedRef.current) onScan(result); }, 400);
                    return;
                  }
                }
              }
            } catch { /* AI call failed, retry */ }
            if (cancelled || !mountedRef.current) return;
            setStatus('scanning');
            scanLockRef.current = false;
            // Wait 3 seconds before next AI attempt to avoid hammering the API
            aiTimerRef.current = setTimeout(() => {
              if (!cancelled && mountedRef.current) {
                animFrameRef.current = requestAnimationFrame(scanFrame);
              }
            }, 3000);
            return;
          }

          animFrameRef.current = requestAnimationFrame(scanFrame);
        };

        // Start scanning after a brief warmup
        aiTimerRef.current = setTimeout(() => {
          if (!cancelled && mountedRef.current) {
            animFrameRef.current = requestAnimationFrame(scanFrame);
          }
        }, 600);

      } catch (err: any) {
        console.error("Camera error:", err);
        if (!cancelled && mountedRef.current) {
          setCameraError(
            err?.name === 'NotAllowedError' ? 'Camera permission denied. Please allow camera access in your browser settings.' :
            err?.name === 'NotFoundError' ? 'No camera found on this device.' :
            err?.name === 'NotReadableError' ? 'Camera is in use by another application.' :
            'Could not start camera. Please try the Laser Scanner mode.'
          );
          setStatus('error');
        }
      }
    };
    startCamera();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animFrameRef.current);
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [mode, shopType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Laser mode — auto-focus hidden input
  useEffect(() => {
    if (mode === 'laser') {
      setTimeout(() => laserInputRef.current?.focus(), 100);
    }
  }, [mode]);

  // Process a raw barcode string → AI lookup
  const processBarcode = async (code: string) => {
    if (!mountedRef.current) return;
    setStatus('processing');
    setDetectedCode(code);
    try {
      const result = await predictSKUMetadata(code, shopType as unknown as ShopType);
      if (!mountedRef.current) return;
      if (result) {
        setStatus('found');
        setTimeout(() => { if (mountedRef.current) onScan({ ...result, name: result.name || code }); }, 400);
      } else {
        setStatus('found');
        setTimeout(() => { if (mountedRef.current) onScan({ name: code, category: '', unit: 'PCS', confidence: 'LOW' as any, reasoning: 'Scanned barcode: ' + code }); }, 400);
      }
    } catch {
      if (!mountedRef.current) return;
      setStatus('found');
      setTimeout(() => { if (mountedRef.current) onScan({ name: code, category: '', unit: 'PCS', confidence: 'LOW' as any, reasoning: 'Scanned barcode: ' + code }); }, 400);
    }
  };

  // Handle external laser scanner input (fires rapidly like keyboard, ends with Enter)
  const handleLaserKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && laserInput.trim()) {
      e.preventDefault();
      processBarcode(laserInput.trim());
      setLaserInput('');
    }
  };

  // Also listen for keyboard barcode input even in camera mode (external scanner always works)
  useEffect(() => {
    let buffer = '';
    let timer: ReturnType<typeof setTimeout>;
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && target !== laserInputRef.current) return;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      if (e.key === 'Enter' && buffer.length >= 4) {
        e.preventDefault();
        processBarcode(buffer.trim());
        buffer = '';
        return;
      }
      if (e.key.length === 1) {
        buffer += e.key;
        clearTimeout(timer);
        timer = setTimeout(() => { buffer = ''; }, 100);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      clearTimeout(timer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Manual capture (tap the big button)
  const manualCapture = async () => {
    const vid = videoRef.current;
    if (!vid || scanLockRef.current || vid.readyState < 2 || vid.videoWidth === 0) return;
    scanLockRef.current = true;
    setStatus('processing');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = vid.videoWidth;
      canvas.height = vid.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        ctx.drawImage(vid, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
        const result = await identifyProductFromImage(base64, shopType);
        if (!mountedRef.current) return;
        if (result) {
          setStatus('found');
          setTimeout(() => { if (mountedRef.current) onScan(result); }, 400);
          return;
        }
      }
    } catch { /* failed */ }
    if (mountedRef.current) {
      setStatus('scanning');
      scanLockRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {/* Mode Toggle */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex gap-1 bg-black/60 backdrop-blur-xl rounded-2xl p-1 border border-white/10">
        <button
          onClick={() => setMode('camera')}
          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            mode === 'camera' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/60 hover:text-white'
          }`}
        >
          <Scan className="w-3.5 h-3.5" /> Camera
        </button>
        <button
          onClick={() => setMode('laser')}
          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
            mode === 'laser' ? 'bg-emerald-600 text-white shadow-lg' : 'text-white/60 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> Laser Scanner
        </button>
      </div>

      {mode === 'camera' ? (
        <>
          {/* Camera View */}
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ display: status === 'error' ? 'none' : 'block' }} />
          
          {/* Error State */}
          {status === 'error' && (
            <div className="flex flex-col items-center justify-center gap-6 p-8 max-w-sm text-center">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center bg-rose-500/10">
                <AlertTriangle className="w-12 h-12 text-rose-400" />
              </div>
              <div>
                <h3 className="text-white font-black text-lg mb-2">Camera Error</h3>
                <p className="text-white/50 font-semibold text-sm leading-relaxed">{cameraError}</p>
              </div>
              <div className="flex gap-3 w-full">
                <Button variant="secondary" className="flex-1 h-12 bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => { setStatus('connecting'); setCameraError(''); setMode('camera'); }}>
                  <RefreshCw className="w-4 h-4" /> Retry
                </Button>
                <Button variant="secondary" className="flex-1 h-12 bg-emerald-600/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30" onClick={() => setMode('laser')}>
                  <Zap className="w-4 h-4" /> Use Laser
                </Button>
              </div>
              <Button variant="secondary" onClick={onClose} className="h-11 px-8 bg-white/5 border-white/10 text-white/60 hover:bg-white/10">
                <X className="w-4 h-4" /> Close
              </Button>
            </div>
          )}

          {/* Scan Overlay (only when camera is working) */}
          {status !== 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {/* Dark border around scan area */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80">
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl" />
              
              {/* Moving scan line */}
              {status === 'scanning' && (
                <div
                  className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                  style={{ top: `${scanLine}%`, transition: 'top 30ms linear' }}
                />
              )}
              
              {/* Processing indicator */}
              {status === 'processing' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/70 backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center gap-3">
                    <Loader2 className="animate-spin text-indigo-400 w-5 h-5" />
                    <span className="text-white font-bold text-sm">Reading barcode...</span>
                  </div>
                </div>
              )}

              {/* Found indicator */}
              {status === 'found' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-emerald-600/90 backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center gap-3 animate-in zoom-in-95">
                    <CheckCircle className="text-white w-5 h-5" />
                    <span className="text-white font-bold text-sm">Product found!</span>
                  </div>
                </div>
              )}
            </div>

            {/* Status label */}
            <div className="mt-6 flex flex-col items-center gap-2">
              <p className="text-white font-black text-[10px] uppercase tracking-widest bg-black/50 px-4 py-2 rounded-full">
                {status === 'connecting' && 'Starting camera...'}
                {status === 'scanning' && 'Auto-scanning — point at barcode'}
                {status === 'processing' && 'Identifying product...'}
                {status === 'found' && 'Product detected!'}
              </p>
              {detectedCode && (
                <p className="text-indigo-300 font-mono text-xs bg-black/50 px-3 py-1 rounded-full">{detectedCode}</p>
              )}
              <p className="text-white/40 text-[9px] font-semibold mt-1">External laser scanner also active — just scan anytime</p>
            </div>
          </div>
          )}

          {/* Bottom Controls */}
          {status !== 'error' && (
          <div className="absolute bottom-10 flex gap-5 items-center z-10">
            <Button variant="secondary" onClick={onClose} className="rounded-full w-14 h-14 p-0 bg-black/50 border-white/20 hover:bg-black/70"><X className="text-white" /></Button>
            <button onClick={manualCapture} disabled={status === 'processing' || status === 'found'} className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all disabled:opacity-40">
              {status === 'processing' ? (
                <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
              ) : (
                <div className="w-16 h-16 border-4 border-indigo-600/30 rounded-full bg-indigo-600/10 flex items-center justify-center">
                  <Scan className="w-6 h-6 text-indigo-600" />
                </div>
              )}
            </button>
            <div className="w-14" />
          </div>
          )}
        </>
      ) : (
        <>
          {/* Laser Scanner Mode */}
          <div className="flex flex-col items-center justify-center gap-8 p-8 max-w-md text-center">
            {/* Laser Animation */}
            <div className="relative">
              <div className="w-32 h-32 rounded-3xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))' }}>
                <Zap className="w-16 h-16 text-emerald-400" />
              </div>
              {status === 'scanning' && (
                <div className="absolute -inset-2 border-2 border-emerald-500/50 rounded-[1.75rem] animate-pulse" />
              )}
              {status === 'processing' && (
                <div className="absolute -inset-2 flex items-center justify-center">
                  <Loader2 className="animate-spin text-emerald-400 w-10 h-10" />
                </div>
              )}
              {status === 'found' && (
                <div className="absolute -inset-2 border-2 border-emerald-400 rounded-[1.75rem] flex items-center justify-center bg-emerald-500/20">
                  <CheckCircle className="text-emerald-400 w-10 h-10" />
                </div>
              )}
            </div>

            <div>
              <h3 className="text-white font-black text-xl mb-2">External Laser Scanner</h3>
              <p className="text-white/50 font-semibold text-sm leading-relaxed">
                Point your laser barcode reader at the product. The barcode will be captured instantly.
              </p>
            </div>

            {/* Hidden input that captures laser scanner keyboard emulation */}
            <input
              ref={laserInputRef}
              type="text"
              value={laserInput}
              onChange={(e) => setLaserInput(e.target.value)}
              onKeyDown={handleLaserKeyDown}
              onBlur={() => setTimeout(() => laserInputRef.current?.focus(), 50)}
              className="sr-only"
              autoFocus
              aria-label="Barcode input"
            />

            {/* Visual input display */}
            <div className="w-full">
              <div
                onClick={() => laserInputRef.current?.focus()}
                className={`w-full p-5 rounded-2xl border-2 font-mono text-lg text-center transition-all cursor-text min-h-[64px] flex items-center justify-center ${
                  laserInput
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/20 bg-white/5 text-white/30'
                }`}
              >
                {laserInput || (
                  <span className="flex items-center gap-2">
                    <span className="w-0.5 h-6 bg-white/40 animate-pulse" />
                    Waiting for barcode scan...
                  </span>
                )}
              </div>
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-3">
                Or type barcode manually and press Enter
              </p>
            </div>

            {detectedCode && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-5 py-3 w-full">
                <p className="text-emerald-400 font-mono text-sm">{detectedCode}</p>
              </div>
            )}

            <Button variant="secondary" onClick={onClose} className="mt-4 h-12 px-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
              <X className="w-4 h-4" /> Close Scanner
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const AddInventoryModule: React.FC<{ 
  onClose: () => void; 
  onAdd: (sku: SKU) => void; 
  t: any;
  shopType: ShopType;
}> = ({ onClose, onAdd, t, shopType }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState(UNITS[0]);
  const [openingStock, setOpeningStock] = useState('');
  const [price, setPrice] = useState('');
  const [minThreshold, setMinThreshold] = useState('5');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<SKUPrediction | null>(null);

  const handlePredict = async () => {
    if (name.length < 3) return;
    setLoading(true);
    const result = await predictSKUMetadata(name, shopType);
    if (result) setAiSuggestion(result);
    setLoading(false);
  };

  const onScanResult = (data: SKUPrediction) => {
    setName(data.name || '');
    setCategory(data.category);
    setUnit(data.unit);
    setAiSuggestion(data);
    setShowScanner(false);
  };

  const applyAiSuggestion = () => {
    if (aiSuggestion) {
      setCategory(aiSuggestion.category);
      setUnit(aiSuggestion.unit);
      setAiSuggestion(null);
    }
  };

  const handleSubmit = () => {
    if (!name || !category) return;
    const numStock = Number(openingStock) || 0;
    const numPrice = Number(price) || 0;
    const numThreshold = Number(minThreshold) || 0;
    const newSku: SKU = {
      id: Math.random().toString(),
      name, category, unit,
      price: Math.max(0, numPrice),
      openingStock: Math.max(0, numStock),
      totalIn: 0,
      totalOut: 0,
      currentStock: Math.max(0, numStock),
      minThreshold: Math.max(0, numThreshold),
      lastUpdated: new Date().toISOString(),
      status: numStock < numThreshold ? 'LOW' : 'OPTIMAL',
      ...(expiryDate ? { expiryDate } : {}),
    };
    onAdd(newSku);
    onClose();
  };

  if (showScanner) return <ScannerOverlay shopType={shopType} onScan={onScanResult} onClose={() => setShowScanner(false)} />;

  const categories = shopType === ShopType.GROCERY ? CATEGORIES.GROCERY : CATEGORIES.ELECTRONICS;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300" style={{ boxShadow: '0 30px 80px rgba(79,70,229,0.2)' }}>
        <div className="p-7 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.07), rgba(168,85,247,0.04))' }}>
           <div>
             <h2 className="text-xl font-black text-slate-900 text-slate-900 dark:text-white">Add New Item</h2>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Inventory Management</p>
           </div>
           <button onClick={onClose} className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-7 space-y-5 max-h-[70vh] overflow-y-auto">
           <div className="flex gap-4">
             <Button variant="secondary" className="flex-1" onClick={() => setShowScanner(true)}>
               <Scan className="w-5 h-5" /> Scan Barcode
             </Button>
           </div>
           
           <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Item Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handlePredict}
                placeholder="Item Name"
                className="input-pro w-full bg-slate-50 dark:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600/60 rounded-2xl p-4 font-bold text-slate-900 text-slate-900 dark:text-white"
              />
           </div>

           {aiSuggestion && (
             <div className="p-5 rounded-2xl border-2 border-indigo-100 bg-indigo-50 dark:bg-indigo-900/10 dark:border-indigo-900/20 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">AI Detection</span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {aiSuggestion.name && <span>Found: <b>{aiSuggestion.name}</b><br/></span>}
                  Category: <b>{aiSuggestion.category}</b>
                </p>
                <div className="flex gap-2">
                  <Button variant="ai" className="h-9 text-xs flex-1" onClick={applyAiSuggestion}>Apply Suggestion</Button>
                  <Button variant="ghost" className="h-9 text-xs" onClick={() => setAiSuggestion(null)}>Ignore</Button>
                </div>
             </div>
           )}

           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-pro w-full bg-slate-50 dark:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600/60 rounded-2xl p-4 font-bold appearance-none text-slate-900 text-slate-900 dark:text-white">
                  <option value="">Select</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Unit</label>
                <select value={unit} onChange={(e) => setUnit(e.target.value)} className="input-pro w-full bg-slate-50 dark:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600/60 rounded-2xl p-4 font-bold appearance-none text-slate-900 text-slate-900 dark:text-white">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
           </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Opening Stock</label>
                 <input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    value={openingStock} 
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '' || (Number(raw) >= 0 && !raw.includes('-'))) setOpeningStock(raw);
                    }} 
                    className="input-pro w-full bg-slate-50 dark:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600/60 rounded-2xl p-4 font-bold text-slate-900 text-slate-900 dark:text-white" 
                 />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Unit Price (₹)</label>
                 <input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    value={price} 
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '' || (Number(raw) >= 0 && !raw.includes('-'))) setPrice(raw);
                    }} 
                    className="input-pro w-full bg-slate-50 dark:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600/60 rounded-2xl p-4 font-bold text-slate-900 text-slate-900 dark:text-white" 
                 />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Min Threshold</label>
                <input
                  type="number"
                  min="0"
                  placeholder="5"
                  value={minThreshold}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '' || (Number(raw) >= 0 && !raw.includes('-'))) setMinThreshold(raw);
                  }}
                  className="input-pro w-full bg-slate-50 dark:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600/60 rounded-2xl p-4 font-bold text-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Expiry Date
                  <span className="ml-1 normal-case text-slate-300 font-semibold">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-pro w-full bg-slate-50 dark:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600/60 rounded-2xl p-4 font-bold text-slate-900 text-slate-900 dark:text-white appearance-none [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    style={{ colorScheme: 'auto' }}
                  />
                  {expiryDate && (
                    <button
                      type="button"
                      onClick={() => setExpiryDate('')}
                      className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
           </div>
        </div>
        <div className="p-7 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/20">
           <Button fullWidth className="h-14 text-base btn-glow shadow-xl" onClick={handleSubmit} disabled={!name || !category}>Add to Inventory</Button>
        </div>
      </div>
    </div>
  );
};

// --- Updated StockUpdateModule ---

const StockUpdateModule: React.FC<{
  item: SKU;
  onClose: () => void;
  onUpdate: (skuId: string, type: MovementType, quantity: number, reason: string) => void;
  t: any;
}> = ({ item, onClose, onUpdate, t }) => {
  const [type, setType] = useState<MovementType>('OUT');
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState<string>('Sale');

  const commonReasons = [
    { label: 'Purchase', type: 'IN' },
    { label: 'Sale',     type: 'OUT' },
    { label: 'Damage',   type: 'OUT' },
    { label: 'Expired',  type: 'OUT' },
    { label: 'Return',   type: 'OUT' },
  ];

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || Number(val) >= 0) {
      setQuantity(val);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
           <div>
             <h2 className="text-2xl font-black text-slate-900 text-slate-900 dark:text-white">{t.updateStock}</h2>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{item.name}</p>
           </div>
           <button onClick={onClose} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-full"><X /></button>
        </div>
        <div className="p-8 space-y-8">
           <div className="grid grid-cols-2 gap-4">
              <button onClick={() => { setType('IN'); setReason('Purchase'); }} className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all ${type === 'IN' ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'border-slate-50 dark:border-slate-700 text-slate-300 bg-slate-50 dark:bg-slate-700/50'}`}>
                <PlusCircle className="w-10 h-10" />
                <span className="font-black uppercase tracking-widest text-[11px]">{t.stockIn}</span>
              </button>
              <button onClick={() => { setType('OUT'); setReason('Sale'); }} className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all ${type === 'OUT' ? 'border-rose-600 bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'border-slate-50 dark:border-slate-700 text-slate-300 bg-slate-50 dark:bg-slate-700/50'}`}>
                <Minus className="w-10 h-10" />
                <span className="font-black uppercase tracking-widest text-[11px]">{t.stockOut}</span>
              </button>
           </div>
           <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Quantity ({item.unit})</label>
              <input 
                type="number" 
                min="0"
                value={quantity} 
                onChange={handleQuantityChange} 
                className={`w-full bg-slate-50 dark:bg-slate-700 border rounded-2xl p-6 font-black text-4xl text-center dark:text-white outline-none transition-colors ${
                  type === 'OUT' && Number(quantity) > item.currentStock
                    ? 'border-2 border-rose-500 focus:border-rose-500'
                    : 'border border-slate-200 dark:border-slate-600 focus:border-indigo-600'
                }`}
                placeholder="0" 
                autoFocus
              />
              {type === 'OUT' && Number(quantity) > item.currentStock && (
                <div className="mt-3 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400 leading-snug">
                    Cannot remove <span className="font-black">{quantity} {item.unit}</span> — only <span className="font-black">{item.currentStock} {item.unit}</span> in stock. Stock cannot go negative.
                  </p>
                </div>
              )}
           </div>
           <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Reason</label>
              <div className="grid grid-cols-2 gap-2">
                {commonReasons.filter(r => r.type === type).map(r => (
                  <button key={r.label} onClick={() => setReason(r.label)} className={`p-3 rounded-xl border-2 font-bold text-xs transition-all ${reason === r.label ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'border-slate-50 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400'}`}>{r.label}</button>
                ))}
              </div>
           </div>
        </div>
        <div className="p-8 bg-slate-50 dark:bg-slate-900/30">
           <Button fullWidth variant={type === 'IN' ? 'success' : 'danger'} className="h-16 text-lg shadow-xl" disabled={!quantity || Number(quantity) <= 0 || (type === 'OUT' && Number(quantity) > item.currentStock)} onClick={() => onUpdate(item.id, type, Number(quantity), reason)}>Update Stock</Button>
        </div>
      </div>
    </div>
  );
};

const RetailerDashboard: React.FC<{ state: AppState, t: any }> = ({ state, t }) => {
  const stats = useMemo(() => {
    const totalStock = state.inventory.reduce((acc, curr) => acc + curr.currentStock, 0);
    const totalValue = state.inventory.reduce((acc, curr) => acc + (curr.currentStock * (curr.price || 0)), 0);
    const lowStock = state.inventory.filter(i => i.status === 'LOW' || i.status === 'CRITICAL').length;
    const totalExpenses = state.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalPaymentsIn = (state.payments || []).filter(p => p.type === 'RECEIVED' && p.status === 'COMPLETED').reduce((a, p) => a + p.amount, 0);
    const totalPaymentsOut = (state.payments || []).filter(p => p.type === 'PAID' && p.status === 'COMPLETED').reduce((a, p) => a + p.amount, 0);
    const netBalance = totalPaymentsIn - totalPaymentsOut;
    return { total: state.inventory.length, totalStock, totalValue, lowStock, totalExpenses, totalPaymentsIn, totalPaymentsOut, netBalance };
  }, [state.inventory, state.expenses, state.payments]);

  // Greeting
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    if (h < 21) return 'Good Evening';
    return 'Good Night';
  }, []);

  const recentExpenses = useMemo(() => {
    return [...state.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [state.expenses]);

  const kpiCards = [
    {
      label: t.totalItems, value: String(stats.total),
      sub: `${stats.totalStock} units in stock`,
      icon: Layers, color: '#6366f1',
      bg: 'rgba(99,102,241,0.08)', bd: 'rgba(99,102,241,0.18)'
    },
    {
      label: 'Stock Value', value: `\u20b9${stats.totalValue > 999 ? (stats.totalValue / 1000).toFixed(1) + 'k' : stats.totalValue.toLocaleString()}`,
      sub: 'inventory assets',
      icon: TrendingUp, color: '#10b981',
      bg: 'rgba(16,185,129,0.08)', bd: 'rgba(16,185,129,0.18)'
    },
    {
      label: t.totalExpenses, value: `\u20b9${stats.totalExpenses.toLocaleString()}`,
      sub: 'total expenses',
      icon: CreditCard, color: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)', bd: 'rgba(245,158,11,0.18)'
    },
    {
      label: 'Net Balance', value: `\u20b9${Math.abs(stats.netBalance).toLocaleString()}`,
      sub: stats.netBalance >= 0 ? 'net positive' : 'net negative',
      icon: stats.netBalance >= 0 ? TrendingUp : AlertTriangle,
      color: stats.netBalance >= 0 ? '#10b981' : '#f43f5e',
      bg: stats.netBalance >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
      bd: stats.netBalance >= 0 ? 'rgba(16,185,129,0.18)' : 'rgba(244,63,94,0.18)'
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4">

      {/* ── Greeting Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{greeting}</p>
          <h1 className="text-2xl font-black text-slate-800 text-slate-900 dark:text-white tracking-tight">
            {state.profile.name || state.profile.shopName || 'Dashboard'}
          </h1>
          {state.profile.shopName && state.profile.name && (
            <p className="text-sm font-semibold text-slate-400 mt-0.5">{state.profile.shopName}</p>
          )}
        </div>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
          <Package className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((card) => (
          <div key={card.label}
            className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            style={{ borderColor: card.bd, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest leading-tight">{card.label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: card.bg }}>
                <card.icon className="w-3.5 h-3.5" style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-2xl font-black leading-none mb-1" style={{ color: card.color }}>{card.value}</p>
            <p className="text-[10px] font-semibold text-slate-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Two Column: Recent Activity + AI Insight ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Recent Expenses */}
        <Card className="md:col-span-2 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-black text-slate-800 text-slate-900 dark:text-white font-display">Recent Expenses</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{state.expenses.length} total</span>
          </div>
          <div className="space-y-1">
            {recentExpenses.length === 0 && (
              <div className="py-8 text-center">
                <CreditCard className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No expenses added yet</p>
              </div>
            )}
            {recentExpenses.map(exp => (
              <div key={exp.id} className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-amber-600"
                    style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800 text-slate-900 dark:text-white">{exp.description || exp.category}</p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                      {exp.category} &bull; {new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <span className="font-black text-sm px-3 py-1 rounded-full text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400">
                  -\u20b9{exp.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Quick Insight */}
        <div className="rounded-2xl p-6 space-y-5 text-white overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl" style={{ background: 'rgba(99,102,241,0.4)' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl" style={{ background: 'rgba(168,85,247,0.3)' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black font-display">AI Quick Insight</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-white/10" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2 text-indigo-300 mb-2">
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Prediction</span>
                </div>
                <p className="text-sm font-medium text-slate-200 leading-relaxed">Based on last week's sales, you might run out of <b>Dairy</b> products by Friday.</p>
              </div>
              <Button fullWidth variant="ai" className="h-11">Optimize Inventory</Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Stock Movements ── */}
      <Card className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-black text-slate-800 text-slate-900 dark:text-white font-display">Recent Movements</h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{state.movementLogs.length} total</span>
        </div>
        <div className="space-y-1">
          {state.movementLogs.length === 0 && (
            <div className="py-8 text-center">
              <Package className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">No movements yet</p>
            </div>
          )}
          {state.movementLogs.slice(-5).reverse().map(log => {
            const item = state.inventory.find(i => i.id === log.skuId);
            return (
              <div key={log.id} className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
                    log.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'
                  }`} style={{
                    background: log.type === 'IN' ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'linear-gradient(135deg, #ffe4e6, #fecdd3)'
                  }}>
                    {log.type === 'IN' ? <ArrowUpRight className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800 text-slate-900 dark:text-white">{item?.name || 'Unknown Item'}</p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{log.reason} &bull; {new Date(log.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
                <span className={`font-black text-sm px-3 py-1 rounded-full ${
                  log.type === 'IN'
                    ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'text-rose-700 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400'
                }`}>
                  {log.type === 'IN' ? '+' : '-'}{log.quantity}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Quick Stats Footer ── */}
      {stats.lowStock > 0 && (
        <div className="p-4 rounded-2xl border border-amber-200/60 dark:border-amber-800/40"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.05), rgba(245,158,11,0.02))' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="font-black text-sm text-amber-800 dark:text-amber-300">{stats.lowStock} item{stats.lowStock > 1 ? 's' : ''} need attention</p>
              <p className="text-[10px] font-semibold text-amber-600/70">Low or critical stock levels detected</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ExpensesModule: React.FC<{ state: AppState, setState: React.Dispatch<React.SetStateAction<AppState>>, t: any }> = ({ state, setState, t }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [desc, setDesc] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [addLoading, setAddLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Filters & Sort ──
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [toast, setToast] = useState<string | null>(null);
  const catDropdownRef = useRef<HTMLDivElement>(null);

  const myId = state.profile.id;

  // Close category dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showToastMsg = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);

  // Category config with emojis and grouping
  const categoryConfig: Record<string, { emoji: string; color: string; bg: string; group: string }> = useMemo(() => ({
    'Rent': { emoji: '🏠', color: '#DC2626', bg: 'rgba(220,38,38,0.08)', group: 'Business' },
    'Electricity': { emoji: '⚡', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', group: 'Business' },
    'Salary': { emoji: '💰', color: '#10B981', bg: 'rgba(16,185,129,0.08)', group: 'Business' },
    'Transport': { emoji: '🚛', color: '#6366F1', bg: 'rgba(99,102,241,0.08)', group: 'Operations' },
    'Maintenance': { emoji: '🔧', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', group: 'Operations' },
    'Marketing': { emoji: '📢', color: '#EC4899', bg: 'rgba(236,72,153,0.08)', group: 'Growth' },
    'Other': { emoji: '📦', color: '#64748B', bg: 'rgba(100,116,139,0.08)', group: 'Other' },
  }), []);

  const getCatConfig = (cat: string) => categoryConfig[cat] || { emoji: '📦', color: '#64748B', bg: 'rgba(100,116,139,0.08)', group: 'Other' };

  // NOTE: Expense fetch + realtime subscription lives in the App component
  // so data persists across tab navigation. No need to re-fetch here.

  // ── Month-filtered expenses ──
  const monthExpenses = useMemo(() => {
    return state.expenses.filter(e => {
      const d = new Date(e.date);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return ym === selectedMonth;
    });
  }, [state.expenses, selectedMonth]);

  // ── Filtered & sorted expenses ──
  const filtered = useMemo(() => {
    let items = [...monthExpenses];
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      items = items.filter(e =>
        (e.description || '').toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    }
    if (filterCategory !== 'ALL') {
      items = items.filter(e => e.category === filterCategory);
    }
    if (filterDate) {
      items = items.filter(e => e.date.startsWith(filterDate));
    }
    items.sort((a, b) => {
      if (sortDir === 'desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    return items;
  }, [monthExpenses, searchText, filterCategory, filterDate, sortDir]);

  // ── Category breakdown for summary ──
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([cat, amt]) => ({ category: cat, amount: amt, config: getCatConfig(cat) }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthExpenses]);

  const totalMonth = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
  const filteredTotal = filtered.reduce((acc, e) => acc + e.amount, 0);
  const totalAll = state.expenses.reduce((acc, e) => acc + e.amount, 0);

  // Previous month comparison
  const prevMonthTotal = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const pm = m === 1 ? 12 : m - 1;
    const py = m === 1 ? y - 1 : y;
    const pmKey = `${py}-${String(pm).padStart(2, '0')}`;
    return state.expenses
      .filter(e => { const d = new Date(e.date); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === pmKey; })
      .reduce((acc, e) => acc + e.amount, 0);
  }, [state.expenses, selectedMonth]);

  const monthChange = prevMonthTotal > 0 ? ((totalMonth - prevMonthTotal) / prevMonthTotal * 100) : 0;

  // ── Group transactions by date ──
  const groupedByDate = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(e => {
      const dateKey = new Date(e.date).toISOString().slice(0, 10);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(e);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  // Date label helper
  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (target.getTime() === today.getTime()) return 'Today';
    if (target.getTime() === yesterday.getTime()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  // ── Helper: check if a payment already exists for a given expense ──
  const hasPaymentForExpense = (expenseId: string): boolean => {
    return (state.payments || []).some(p =>
      (p.source === 'expense' && p.sourceId === expenseId) ||
      (p.note?.includes(`[exp:${expenseId}]`))
    );
  };

  // ── Add an expense as a payment entry ──
  const addExpenseToPayment = (e: Expense) => {
    if (hasPaymentForExpense(e.id)) return; // prevent duplicates
    const paymentId = `pay_exp_manual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const entry: Payment = {
      id: paymentId,
      party: e.category,
      amount: e.amount,
      type: 'PAID',
      method: 'CASH',
      status: 'COMPLETED',
      date: e.date,
      note: `Expense: ${e.description || e.category} [exp:${e.id}]`,
      source: 'expense',
      sourceId: e.id,
    };
    setState(s => ({
      ...s,
      payments: [entry, ...(s.payments || [])],
      expenses: s.expenses.map(ex => ex.id === e.id ? { ...ex, linkedPaymentId: paymentId } : ex),
    }));
    showToastMsg(`₹${e.amount.toLocaleString('en-IN')} added to payments`);
  };

  // Month display
  const monthDisplay = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1);
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const navigateMonth = (dir: -1 | 1) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nd = new Date(y, m - 1 + dir);
    setSelectedMonth(`${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}`);
  };

  // Category groups for dropdown
  const catGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    EXPENSE_CATEGORIES.forEach(c => {
      const cfg = getCatConfig(c);
      if (!groups[cfg.group]) groups[cfg.group] = [];
      if (catSearch && !c.toLowerCase().includes(catSearch.toLowerCase())) return;
      groups[cfg.group].push(c);
    });
    return Object.entries(groups).filter(([, cats]) => cats.length > 0);
  }, [catSearch]);

  const addExpense = async () => {
    if (!amount || Number(amount) <= 0) return;
    setAddLoading(true);
    setSaveSuccess(false);
    const selectedDate = expenseDate ? new Date(expenseDate).toISOString() : new Date().toISOString();
    try {
      const newExpense = await expensesServiceAdd(myId, {
        amount: Number(amount),
        category,
        description: desc,
        date: selectedDate,
      });
      const paymentId = `pay_exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const autoPayment: Payment = {
        id: paymentId,
        party: category,
        amount: Number(amount),
        type: 'PAID',
        method: 'CASH',
        status: 'COMPLETED',
        date: selectedDate,
        note: `Expense: ${desc || category} [exp:${newExpense.id}]`,
        source: 'expense',
        sourceId: newExpense.id,
      };
      setState(s => ({
        ...s,
        expenses: [{ ...newExpense, linkedPaymentId: paymentId }, ...s.expenses],
        payments: [autoPayment, ...(s.payments || [])],
      }));
      setSaveSuccess(true);
      showToastMsg(`₹${Number(amount).toLocaleString()} expense added`);
      setTimeout(() => { setShowAdd(false); setSaveSuccess(false); }, 1000);
      setAmount(''); setDesc(''); setExpenseDate(new Date().toISOString().slice(0, 10));
    } catch {
      const fallbackId = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const paymentId = `pay_exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const fallback: Expense = {
        id: fallbackId,
        amount: Number(amount),
        category,
        description: desc,
        date: selectedDate,
        linkedPaymentId: paymentId,
      };
      const offlinePayment: Payment = {
        id: paymentId,
        party: category,
        amount: Number(amount),
        type: 'PAID',
        method: 'CASH',
        status: 'COMPLETED',
        date: selectedDate,
        note: `Expense: ${desc || category} [exp:${fallbackId}] (offline)`,
        source: 'expense',
        sourceId: fallbackId,
      };
      setState(s => ({
        ...s,
        expenses: [fallback, ...s.expenses],
        payments: [offlinePayment, ...(s.payments || [])],
      }));
      setSaveSuccess(true);
      showToastMsg(`₹${Number(amount).toLocaleString()} expense added (offline)`);
      setTimeout(() => { setShowAdd(false); setSaveSuccess(false); }, 1000);
      setAmount(''); setDesc(''); setExpenseDate(new Date().toISOString().slice(0, 10));
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try { await expensesServiceDelete(id); } catch { /* ignore */ }
    setState(s => ({
      ...s,
      expenses: s.expenses.filter(e => e.id !== id),
      // Also remove linked payment(s) for this expense
      payments: (s.payments || []).filter(p => !(p.source === 'expense' && p.sourceId === id)),
    }));
    setDeleteId(null);
    showToastMsg('Expense deleted');
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 sm:pb-8 animate-in fade-in duration-500">

      {/* ═══════════════ SUMMARY SECTION ═══════════════ */}
      <div className="mb-8">
        {/* Title row with month nav */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-900 text-slate-900 dark:text-white leading-tight">Summary</h2>
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 px-1 py-1">
            <button onClick={() => navigateMonth(-1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-all active:scale-95">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-bold text-slate-700 dark:text-slate-200 min-w-[120px] text-center">{monthDisplay}</span>
            <button onClick={() => navigateMonth(1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-all active:scale-95">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Net Total */}
        <div className="mb-5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Net Total</p>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black text-slate-900 text-slate-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
              ₹{totalMonth.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </span>
            {prevMonthTotal > 0 && (
              <span className={`text-xs font-bold flex items-center gap-0.5 ${monthChange >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                <TrendingUp className={`w-3 h-3 ${monthChange < 0 ? 'rotate-180' : ''}`} />
                {monthChange >= 0 ? '+' : ''}{monthChange.toFixed(1)}% from last month
              </span>
            )}
          </div>
        </div>

        {/* Horizontal breakdown bar */}
        {categoryBreakdown.length > 0 && (
          <div className="mb-5">
            <div className="flex rounded-full overflow-hidden h-3 bg-slate-100 dark:bg-slate-700/40">
              {categoryBreakdown.map((item, i) => (
                <div
                  key={item.category}
                  className="h-full relative group transition-all duration-300 hover:opacity-80"
                  style={{
                    width: `${Math.max((item.amount / totalMonth) * 100, 2)}%`,
                    backgroundColor: item.config.color,
                    borderRadius: i === 0 ? '9999px 0 0 9999px' : i === categoryBreakdown.length - 1 ? '0 9999px 9999px 0' : '0',
                  }}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-lg">
                    {item.config.emoji} {item.category} {((item.amount / totalMonth) * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categoryBreakdown.slice(0, 4).map(item => {
            const pct = totalMonth > 0 ? ((item.amount / totalMonth) * 100).toFixed(0) : '0';
            return (
              <div key={item.category}
                className="bg-white dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/40 transition-all hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600 cursor-pointer group"
                onClick={() => { setFilterCategory(item.category === filterCategory ? 'ALL' : item.category); }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold" style={{ color: item.config.color }}>{item.category}</span>
                  <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
                </div>
                <p className="text-lg font-black text-slate-800 text-slate-900 dark:text-white leading-none" style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
                  ₹{item.amount.toLocaleString('en-IN')}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-base">{item.config.emoji}</span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {monthExpenses.filter(e => e.category === item.category).length} txn{monthExpenses.filter(e => e.category === item.category).length !== 1 ? 's' : ''}
                  </span>
                </div>
                {/* Active filter indicator */}
                {filterCategory === item.category && (
                  <div className="mt-2 h-0.5 rounded-full" style={{ backgroundColor: item.config.color }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Show remaining categories if >4 */}
        {categoryBreakdown.length > 4 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {categoryBreakdown.slice(4).map(item => (
              <button key={item.category}
                onClick={() => setFilterCategory(item.category === filterCategory ? 'ALL' : item.category)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  filterCategory === item.category
                    ? 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/60'
                    : 'border-transparent bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                }`}
              >
                <span>{item.config.emoji}</span>
                <span className="text-slate-600 dark:text-slate-300">{item.category}</span>
                <span className="text-slate-400">₹{item.amount.toLocaleString('en-IN')}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════ TRANSACTIONS SECTION ═══════════════ */}
      <div>
        {/* Transactions header */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xl font-black text-slate-900 text-slate-900 dark:text-white">Transactions</h3>
        </div>
        <p className="text-[12px] text-slate-400 font-semibold mb-5">
          You had {monthExpenses.length} expense{monthExpenses.length !== 1 ? 's' : ''} this month
          {filterCategory !== 'ALL' && <span> &middot; filtered by <span className="text-slate-600 dark:text-slate-300 font-bold">{filterCategory}</span></span>}
        </p>

        {/* Controls row: Sort + Category + Add */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {/* Sort toggle */}
          <button
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-[0.97]"
          >
            <ArrowUpRight className={`w-3.5 h-3.5 transition-transform ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
            {sortDir === 'desc' ? 'Newest' : 'Oldest'}
          </button>

          {/* Category dropdown */}
          <div className="relative" ref={catDropdownRef}>
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12px] font-bold transition-all active:scale-[0.97] border ${
                filterCategory !== 'ALL'
                  ? 'text-slate-800 dark:text-white bg-white dark:bg-slate-800/60 border-slate-300 dark:border-slate-600'
                  : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {filterCategory !== 'ALL' && <span className="text-sm">{getCatConfig(filterCategory).emoji}</span>}
              Category
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown panel */}
            {showCategoryDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-2xl z-40 overflow-hidden"
                style={{ animation: 'fadeIn 150ms ease-out', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
                {/* Search */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-700/40">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                    <input
                      type="text"
                      value={catSearch}
                      onChange={e => setCatSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full bg-slate-50 dark:bg-slate-700/40 rounded-xl py-2.5 pl-9 pr-3 text-[12px] font-semibold text-slate-700 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-600/40 focus:outline-none focus:border-indigo-400 transition-colors"
                    />
                  </div>
                </div>

                {/* "All" option */}
                <div className="py-1">
                  <button
                    onClick={() => { setFilterCategory('ALL'); setShowCategoryDropdown(false); setCatSearch(''); }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-[12px] font-semibold transition-colors ${
                      filterCategory === 'ALL' ? 'bg-indigo-50 dark:bg-indigo-900/15 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-sm">📋</span> All Categories
                    </span>
                    {filterCategory === 'ALL' && <CheckCircle className="w-4 h-4 text-indigo-500" />}
                  </button>
                </div>

                {/* Grouped categories */}
                <div className="max-h-64 overflow-y-auto">
                  {catGroups.map(([group, cats]) => (
                    <div key={group}>
                      <p className="px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">{group}</p>
                      {cats.map(c => {
                        const cc = getCatConfig(c);
                        const isActive = filterCategory === c;
                        return (
                          <button
                            key={c}
                            onClick={() => { setFilterCategory(isActive ? 'ALL' : c); setShowCategoryDropdown(false); setCatSearch(''); }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-[12px] font-semibold transition-colors ${
                              isActive ? 'bg-indigo-50 dark:bg-indigo-900/15 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                            }`}
                          >
                            <span className="flex items-center gap-2.5">
                              <span className="text-sm">{cc.emoji}</span> {c}
                            </span>
                            {isActive && <CheckCircle className="w-4 h-4 text-indigo-500" />}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Clear filter button */}
          {(filterCategory !== 'ALL' || searchText) && (
            <button
              onClick={() => { setFilterCategory('ALL'); setSearchText(''); }}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-[12px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/15 transition-all active:scale-95"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}

          <div className="flex-1" />

          {/* Add button */}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[12px] font-bold text-white transition-all hover:shadow-lg active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', boxShadow: '0 4px 14px rgba(30,41,59,0.25)' }}
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search transactions..."
            className="w-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl py-3 pl-11 pr-10 text-[13px] font-semibold text-slate-700 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
          />
          {searchText && (
            <button onClick={() => setSearchText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors">
              <X className="w-3 h-3 text-slate-500 dark:text-slate-300" />
            </button>
          )}
        </div>

        {/* Filter summary */}
        {(searchText || filterCategory !== 'ALL') && (
          <div className="flex items-center justify-between px-1 mb-4">
            <p className="text-[11px] font-semibold text-slate-400">
              {filtered.length} of {monthExpenses.length} expenses
            </p>
            <p className="text-sm font-black text-rose-500">₹{filteredTotal.toLocaleString('en-IN')}</p>
          </div>
        )}

        {/* ═══════════════ ADD EXPENSE FORM ═══════════════ */}
        {showAdd && (
          <div className="mb-6 bg-white dark:bg-slate-800/80 rounded-2xl border-2 border-slate-200 dark:border-slate-700/50 overflow-hidden"
            style={{ animation: 'fadeIn 200ms ease-out' }}>
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/40 flex items-center justify-between">
              <h3 className="font-black text-base text-slate-800 text-slate-900 dark:text-white">New Expense</h3>
              <button onClick={() => { setShowAdd(false); setSaveSuccess(false); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Amount (₹)</label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600/40 rounded-xl py-3 px-4 text-base font-bold text-slate-800 text-slate-900 dark:text-white placeholder:text-slate-300 focus:outline-none focus:border-indigo-400 transition-colors"
                    placeholder="0" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                  <div className="relative">
                    <select value={category} onChange={e => setCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600/40 rounded-xl py-3 px-4 text-sm font-bold text-slate-800 text-slate-900 dark:text-white appearance-none focus:outline-none focus:border-indigo-400 transition-colors">
                      {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{getCatConfig(c).emoji} {c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                  <input type="text" value={desc} onChange={e => setDesc(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600/40 rounded-xl py-3 px-4 text-sm font-semibold text-slate-800 text-slate-900 dark:text-white placeholder:text-slate-300 focus:outline-none focus:border-indigo-400 transition-colors"
                    placeholder="e.g. Monthly Rent" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
                  <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-606/40 rounded-xl py-3 px-4 text-sm font-semibold text-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-400 transition-colors" />
                </div>
              </div>
              {saveSuccess && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl animate-in fade-in duration-200" style={{ background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.25)' }}>
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <p className="font-bold text-emerald-700 dark:text-emerald-400 text-[12px]">Expense saved!</p>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={addExpense}
                  disabled={addLoading || !amount || Number(amount) <= 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}
                >
                  {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><CreditCard className="w-4 h-4" /> Save Expense</>}
                </button>
                <button onClick={() => { setShowAdd(false); setSaveSuccess(false); }}
                  className="px-5 py-3 rounded-xl font-bold text-sm text-slate-500 bg-slate-100 dark:bg-slate-700/40 hover:bg-slate-200 dark:hover:bg-slate-600/40 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ TRANSACTIONS LIST (GROUPED BY DATE) ═══════════════ */}
        <div className="space-y-1">
          {groupedByDate.map(([dateKey, expenses]) => (
            <div key={dateKey}>
              {/* Date header */}
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 pt-5 pb-2">{getDateLabel(dateKey)}</p>

              {/* Transaction rows */}
              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/40 overflow-hidden divide-y divide-slate-50 dark:divide-slate-700/30">
                {expenses.map(e => {
                  const cc = getCatConfig(e.category);
                  const isDeleting = deleteId === e.id;
                  return (
                    <div key={e.id}
                      className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-700/20 group">
                      {/* Category icon */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 transition-transform duration-200 group-hover:scale-105"
                        style={{ background: cc.bg }}>
                        {cc.emoji}
                      </div>

                      {/* Description + category tag */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[13px] text-slate-800 text-slate-900 dark:text-white truncate leading-tight">
                          {e.description || e.category}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                            style={{ background: cc.bg, color: cc.color }}>
                            {cc.emoji} {e.category}
                          </span>
                        </div>
                      </div>

                      {/* Amount + actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="text-[15px] font-black text-rose-500 tabular-nums" style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
                          -₹{e.amount.toLocaleString('en-IN')}
                        </p>
                        {isDeleting ? (
                          <div className="flex items-center gap-1 animate-in fade-in duration-150">
                            <button onClick={() => handleDelete(e.id)}
                              className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteId(null)}
                              className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            {/* Add to Payment button */}
                            {hasPaymentForExpense(e.id) ? (
                              <span className="h-7 px-2 rounded-lg text-[9px] font-black flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/30">
                                <CheckCircle className="w-3 h-3" /> In Payments
                              </span>
                            ) : (
                              <button
                                onClick={() => addExpenseToPayment(e)}
                                title="Add to Payments"
                                className="h-7 px-2 rounded-lg text-[9px] font-black flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-700/30"
                              >
                                <CreditCard className="w-3 h-3" /> + Payment
                              </button>
                            )}
                            <button onClick={() => setDeleteId(e.id)}
                              className="w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 transition-all text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/15 flex items-center justify-center">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ═══════════════ EMPTY STATES ═══════════════ */}
        {monthExpenses.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.08)' }}>
              <Search className="w-7 h-7 text-indigo-300" />
            </div>
            <h3 className="font-black text-base text-slate-800 text-slate-900 dark:text-white">No matching expenses</h3>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
            <button onClick={() => { setSearchText(''); setFilterCategory('ALL'); }}
              className="mt-4 px-4 py-2 rounded-xl text-[11px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/15 border border-indigo-200 dark:border-indigo-700/30 hover:bg-indigo-100 transition-all active:scale-95">
              Clear all filters
            </button>
          </div>
        )}

        {monthExpenses.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FEF2F2, #FECACA)' }}>
              <CreditCard className="w-9 h-9 text-rose-300" />
            </div>
            <h3 className="font-black text-lg text-slate-800 text-slate-900 dark:text-white">No expenses this month</h3>
            <p className="text-sm text-slate-400 mt-1.5 max-w-xs mx-auto">
              Tap "+ Add" to record your first expense for {monthDisplay}
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}
            >
              <Plus className="w-4 h-4" /> Add Expense
            </button>
          </div>
        )}

        {/* Summary footer */}
        {monthExpenses.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">
              Total all-time: ₹{totalAll.toLocaleString('en-IN')} &middot; {state.expenses.length} expenses
            </p>
          </div>
        )}
      </div>

      {/* ═══════════════ TOAST ═══════════════ */}
      {toast && (
        <div className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold shadow-2xl flex items-center gap-2"
          style={{ animation: 'slideUp 250ms ease-out', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <CheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          {toast}
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>
    </div>
  );
};

const PaymentsModule: React.FC<{ state: AppState, setState: React.Dispatch<React.SetStateAction<AppState>>, t: any }> = ({ state, setState, t }) => {
  const payments = state.payments || [];

  // ── modal state ──
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm] = useState({
    party: '', amount: '', type: 'RECEIVED' as PaymentType,
    method: 'CASH' as PaymentMethod, status: 'COMPLETED' as PaymentStatus,
    date: new Date().toISOString().slice(0, 10), note: '',
  });
  const [formError, setFormError] = useState('');

  // ── filters ──
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | PaymentType>('ALL');
  const [methodFilter, setMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [deleteId, setDeleteId]     = useState<string | null>(null);

  // ── budget ──
  const budget = state.budget ?? 0;
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetDelta, setBudgetDelta] = useState<'+' | '-'>('+');
  const [showBudgetEdit, setShowBudgetEdit] = useState(false);
  const applyBudget = () => {
    const val = Number(budgetInput);
    if (!val || val <= 0) return;
    setState(s => ({ ...s, budget: Math.max(0, (s.budget ?? 0) + (budgetDelta === '+' ? val : -val)) }));
    setBudgetInput('');
    setShowBudgetEdit(false);
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ party: '', amount: '', type: 'RECEIVED', method: 'CASH', status: 'COMPLETED', date: new Date().toISOString().slice(0, 10), note: '' });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (p: Payment) => {
    setEditId(p.id);
    setForm({ party: p.party, amount: String(p.amount), type: p.type, method: p.method, status: p.status, date: p.date.slice(0, 10), note: p.note || '' });
    setFormError('');
    setShowModal(true);
  };

  const savePayment = () => {
    if (!form.party.trim()) { setFormError('Party name is required.'); return; }
    if (!form.amount || Number(form.amount) <= 0) { setFormError('Enter a valid amount.'); return; }
    const entry: Payment = {
      id: editId || `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      party: form.party.trim(),
      amount: Number(form.amount),
      type: form.type,
      method: form.method,
      status: form.status,
      date: new Date(form.date).toISOString(),
      note: form.note.trim() || undefined,
      source: editId ? undefined : 'manual',
    };
    setState(s => ({
      ...s,
      payments: editId
        ? (s.payments || []).map(p => p.id === editId ? { ...entry, source: p.source, sourceId: p.sourceId } : p)
        : [entry, ...(s.payments || [])],
    }));
    setShowModal(false);
  };

  const deletePayment = (id: string) => {
    setState(s => {
      const toDelete = (s.payments || []).find(p => p.id === id);
      const newPayments = (s.payments || []).filter(p => p.id !== id);
      // If this payment was linked to an expense, delete the expense too
      let newExpenses = s.expenses;
      if (toDelete?.source === 'expense' && toDelete.sourceId) {
        const expenseId = toDelete.sourceId;
        newExpenses = s.expenses.filter(e => e.id !== expenseId);
        // Also delete from Supabase in the background
        expensesServiceDelete(expenseId).catch(() => { /* ignore */ });
      }
      return { ...s, payments: newPayments, expenses: newExpenses };
    });
    setDeleteId(null);
  };

  // ── filtered list ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter(p => {
      const matchSearch = p.party.toLowerCase().includes(q) || (p.note || '').toLowerCase().includes(q);
      const matchType   = typeFilter   === 'ALL' || p.type   === typeFilter;
      const matchMethod = methodFilter === 'ALL' || p.method === methodFilter;
      return matchSearch && matchType && matchMethod;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, search, typeFilter, methodFilter]);

  // ── KPIs — single-pass aggregation ──
  const { totalIn, totalOut, pending, salesFromAuto, expenseFromAuto, stockPurchaseAuto, stockLossAuto } = useMemo(() => {
    let tIn = 0, tOut = 0, pend = 0, salesAuto = 0, expAuto = 0, purchaseAuto = 0, lossAuto = 0;
    const lossReasons = ['Damage', 'Expired', 'Return', 'Lost', 'Waste'];
    for (const p of payments) {
      if (p.type === 'RECEIVED' && p.status === 'COMPLETED') tIn += p.amount;
      if (p.type === 'PAID' && p.status === 'COMPLETED') tOut += p.amount;
      if (p.status === 'PENDING') pend++;
      // Source-based categorisation (falls back to note matching for legacy data)
      const src = p.source;
      const note = p.note || '';
      if (src === 'stock' || (!src && (p.id || '').startsWith('pay_stk_'))) {
        if (p.type === 'RECEIVED') {
          salesAuto += p.amount;
        } else if (p.type === 'PAID') {
          const isLoss = lossReasons.some(r => note.toLowerCase().includes(r.toLowerCase()));
          if (isLoss) lossAuto += p.amount;
          else purchaseAuto += p.amount;
        }
      } else if (src === 'expense' || (!src && note.includes('Expense:'))) {
        if (p.type === 'PAID') expAuto += p.amount;
      } else if (src === 'inventory' || (!src && note.includes('Inventory'))) {
        if (p.type === 'PAID') purchaseAuto += p.amount;
      }
    }
    return { totalIn: tIn, totalOut: tOut, pending: pend, salesFromAuto: salesAuto, expenseFromAuto: expAuto, stockPurchaseAuto: purchaseAuto, stockLossAuto: lossAuto };
  }, [payments]);
  const net      = totalIn - totalOut;
  const budgetUsed   = totalOut;
  const budgetPct    = budget > 0 ? Math.min(100, Math.round((budgetUsed / budget) * 100)) : 0;
  const budgetColor  = budgetPct >= 90 ? '#f43f5e' : budgetPct >= 70 ? '#f59e0b' : '#10b981';

  // ── CSV export ──
  const exportCSV = () => {
    const rows = [
      ['Date', 'Party', 'Type', 'Method', 'Status', 'Amount (₹)', 'Source', 'Note'],
      ...filtered.map(p => [
        new Date(p.date).toLocaleDateString('en-IN'),
        p.party, p.type, p.method, p.status, String(p.amount), p.source || 'manual', p.note || '',
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = `payments_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const methodBadge: Record<PaymentMethod, string> = { CASH: '#10b981', UPI: '#6366f1', CARD: '#f59e0b', BANK: '#0ea5e9' };
  const methodBg:    Record<PaymentMethod, string> = { CASH: 'rgba(16,185,129,0.1)', UPI: 'rgba(99,102,241,0.1)', CARD: 'rgba(245,158,11,0.1)', BANK: 'rgba(14,165,233,0.1)' };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-black text-slate-900 text-slate-900 dark:text-white font-display">{t.payments}</h2>
          <p className="text-slate-400 text-xs font-semibold mt-0.5">Track, manage &amp; export all transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-black text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-colors"
            style={{ background: 'rgba(99,102,241,0.05)' }}
          >
            <FileText className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-black text-white transition-opacity hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
          >
            <PlusCircle className="w-4 h-4" /> Add Payment
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Received', value: `₹${totalIn.toLocaleString('en-IN')}`,  color: '#10b981', bg: 'rgba(16,185,129,0.08)',  icon: ArrowUpRight },
          { label: 'Total Paid',     value: `₹${totalOut.toLocaleString('en-IN')}`, color: '#f43f5e', bg: 'rgba(244,63,94,0.08)',   icon: Minus },
          { label: 'Net Balance',    value: `₹${Math.abs(net).toLocaleString('en-IN')}`, color: net >= 0 ? '#6366f1' : '#f59e0b', bg: net >= 0 ? 'rgba(99,102,241,0.08)' : 'rgba(245,158,11,0.08)', icon: TrendingUp },
          { label: 'Pending',        value: String(pending), color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: AlertTriangle },
        ].map(k => (
          <div key={k.label} className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60"
            style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">{k.label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: k.bg }}>
                <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
              </div>
            </div>
            <p className="text-xl font-black" style={{ color: k.color }}>{k.value}</p>
            {k.label === 'Net Balance' && (
              <p className="text-[9px] font-bold text-slate-400 mt-0.5">{net >= 0 ? 'surplus' : 'deficit'}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Budget Card ── */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-5"
        style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Monthly Budget</p>
              {budget > 0 && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: budgetPct >= 90 ? 'rgba(244,63,94,0.1)' : budgetPct >= 70 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: budgetColor }}>
                  {budgetPct}% used
                </span>
              )}
            </div>
            {budget > 0 ? (
              <>
                <p className="text-2xl font-black" style={{ color: budgetColor }}>₹{budgetUsed.toLocaleString('en-IN')} <span className="text-base font-bold text-slate-400">/ ₹{budget.toLocaleString('en-IN')}</span></p>
                <div className="mt-3 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div style={{ width: `${budgetPct}%`, height: '100%', background: budgetColor, borderRadius: '99px', transition: 'width 0.4s ease' }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-bold">
                  <span style={{ color: '#f43f5e' }}>Expenses ₹{expenseFromAuto.toLocaleString('en-IN')}</span>
                  <span style={{ color: '#6366f1' }}>Purchases ₹{stockPurchaseAuto.toLocaleString('en-IN')}</span>
                  <span style={{ color: '#f59e0b' }}>Stock loss ₹{stockLossAuto.toLocaleString('en-IN')}</span>
                  <span style={{ color: '#10b981' }}>Sales ₹{salesFromAuto.toLocaleString('en-IN')}</span>
                </div>
              </>
            ) : (
              <p className="text-sm font-bold text-slate-400 mt-1">No budget set — add one to track against spending</p>
            )}
          </div>
          <button onClick={() => { setShowBudgetEdit(v => !v); setBudgetInput(''); }}
            className="h-9 px-4 rounded-xl text-xs font-black border border-slate-200 dark:border-slate-600 hover:border-indigo-400 transition-colors shrink-0"
            style={{ background: 'rgba(99,102,241,0.06)', color: '#4f46e5' }}>
            {showBudgetEdit ? 'Cancel' : budget > 0 ? 'Adjust Budget' : 'Set Budget'}
          </button>
        </div>
        {showBudgetEdit && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center gap-2 flex-wrap">
            <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 shrink-0">
              {(['+', '-'] as const).map(d => (
                <button key={d} onClick={() => setBudgetDelta(d)}
                  className="w-10 h-10 text-base font-black transition-colors"
                  style={budgetDelta === d
                    ? { background: d === '+' ? '#10b981' : '#f43f5e', color: 'white' }
                    : { background: 'transparent', color: '#64748b' }}>
                  {d}
                </button>
              ))}
            </div>
            <input type="number" min="0" value={budgetInput} onChange={e => setBudgetInput(e.target.value)}
              placeholder="Enter amount"
              className="flex-1 min-w-[140px] h-10 px-4 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors" />
            <button onClick={applyBudget}
              className="h-10 px-5 rounded-xl text-xs font-black text-white transition-opacity hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              Apply
            </button>
            {budget > 0 && (
              <button onClick={() => { setState(s => ({ ...s, budget: 0 })); setShowBudgetEdit(false); }}
                className="h-10 px-4 rounded-xl text-xs font-black text-rose-500 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 transition-colors">
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 overflow-hidden"
        style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        <div className="flex items-stretch border-b border-slate-100 dark:border-slate-700/50">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search party or note..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-12 pl-11 pr-4 text-sm font-semibold bg-transparent text-slate-900 dark:text-white outline-none placeholder:text-slate-400 border-r border-slate-100 dark:border-slate-700/50" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
            className="h-12 px-3 text-xs font-bold bg-transparent dark:bg-transparent dark:text-slate-300 text-slate-600 outline-none cursor-pointer border-r border-slate-100 dark:border-slate-700/50">
            <option value="ALL">All Types</option>
            <option value="RECEIVED">Received</option>
            <option value="PAID">Paid</option>
          </select>
          <select value={methodFilter} onChange={e => setMethodFilter(e.target.value as any)}
            className="h-12 px-3 text-xs font-bold bg-transparent dark:bg-transparent dark:text-slate-300 text-slate-600 outline-none cursor-pointer">
            <option value="ALL">All Methods</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
            <option value="BANK">Bank</option>
          </select>
        </div>

        {/* Table header */}
        {filtered.length > 0 && (
          <div className="hidden sm:grid px-5 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-900/30"
            style={{ gridTemplateColumns: '110px 1fr 90px 80px 90px 100px 80px' }}>
            {['Date', 'Party', 'Method', 'Type', 'Status', 'Amount', ''].map(col => (
              <span key={col} className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest">{col}</span>
            ))}
          </div>
        )}

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(99,102,241,0.08)' }}>
              <CreditCard className="w-6 h-6 text-indigo-400" />
            </div>
            <p className="text-sm font-black text-slate-500 dark:text-slate-400">No payments yet</p>
            <p className="text-xs text-slate-400 mt-1">Click "Add Payment" to record your first transaction</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
            {filtered.map(p => (
              <div key={p.id} className="hidden sm:grid px-5 py-3.5 items-center hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group"
                style={{ gridTemplateColumns: '110px 1fr 90px 80px 90px 100px 80px' }}>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                </span>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-black text-slate-800 text-slate-900 dark:text-white truncate">{p.party}</p>
                    {(p.source === 'expense' || (!p.source && (p.note || '').includes('Expense:'))) && (
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md shrink-0" style={{ background: 'rgba(244,63,94,0.1)', color: '#e11d48' }}>EXPENSE</span>
                    )}
                    {(p.source === 'inventory' || (!p.source && (p.note || '').includes('Inventory'))) && (
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md shrink-0" style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706' }}>INVENTORY</span>
                    )}
                    {(p.source === 'stock' || (!p.source && (p.id || '').startsWith('pay_stk_'))) && (
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md shrink-0" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}>STOCK</span>
                    )}
                  </div>
                  {p.note && <p className="text-[10px] font-semibold text-slate-400 truncate">{p.note.replace(/\s*\(auto\)/, '').replace(/\s*\(offline\)/, '').replace(/\s*\[exp:[^\]]*\]/, '')}</p>}
                </div>
                <span className="text-[10px] font-black px-2 py-1 rounded-lg w-fit"
                  style={{ color: methodBadge[p.method], background: methodBg[p.method] }}>{p.method}</span>
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg w-fit ${p.type === 'RECEIVED' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20'}`}>
                  {p.type === 'RECEIVED' ? '▲ IN' : '▼ OUT'}
                </span>
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg w-fit ${p.status === 'COMPLETED' ? 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700' : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'}`}>
                  {p.status}
                </span>
                <span className={`text-sm font-black ${p.type === 'RECEIVED' ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {p.type === 'RECEIVED' ? '+' : '-'}₹{p.amount.toLocaleString('en-IN')}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(p)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  </button>
                  <button onClick={() => setDeleteId(p.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  </button>
                </div>
              </div>
            ))}
            {/* Mobile rows */}
            {filtered.map(p => (
              <div key={`m_${p.id}`} className="sm:hidden flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: p.type === 'RECEIVED' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)' }}>
                  {p.type === 'RECEIVED'
                    ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    : <Minus className="w-4 h-4 text-rose-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-slate-800 text-slate-900 dark:text-white truncate">{p.party}</p>
                    <span className={`text-sm font-black shrink-0 ${p.type === 'RECEIVED' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {p.type === 'RECEIVED' ? '+' : '-'}₹{p.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold text-slate-400">{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ color: methodBadge[p.method], background: methodBg[p.method] }}>{p.method}</span>
                    {p.status === 'PENDING' && <span className="text-[9px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">PENDING</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(p)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  </button>
                  <button onClick={() => setDeleteId(p.id)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-900/20">
            <p className="text-[10px] font-bold text-slate-400">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 text-slate-900 dark:text-white">{editId ? 'Edit Payment' : 'New Payment'}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{formError}</p>
                </div>
              )}
              {/* Type toggle */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['RECEIVED', 'PAID'] as PaymentType[]).map(tp => (
                    <button key={tp} onClick={() => setForm(f => ({ ...f, type: tp }))}
                      className="py-3 rounded-2xl border-2 font-black text-sm transition-all"
                      style={form.type === tp
                        ? { borderColor: tp === 'RECEIVED' ? '#10b981' : '#f43f5e', background: tp === 'RECEIVED' ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)', color: tp === 'RECEIVED' ? '#10b981' : '#f43f5e' }
                        : { borderColor: 'transparent', background: 'rgba(148,163,184,0.08)', color: '#94a3b8' }}>
                      {tp === 'RECEIVED' ? '▲ Received' : '▼ Paid'}
                    </button>
                  ))}
                </div>
              </div>
              {/* Party */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Party Name</label>
                <input value={form.party} onChange={e => setForm(f => ({ ...f, party: e.target.value }))}
                  placeholder="Customer / Vendor name"
                  className="w-full h-11 px-4 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors" />
              </div>
              {/* Amount */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Amount (₹)</label>
                <input type="number" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  className="w-full h-11 px-4 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors" />
              </div>
              {/* Method */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Method</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['CASH', 'UPI', 'CARD', 'BANK'] as PaymentMethod[]).map(m => (
                    <button key={m} onClick={() => setForm(f => ({ ...f, method: m }))}
                      className="py-2.5 rounded-xl border-2 font-black text-[10px] uppercase transition-all"
                      style={form.method === m
                        ? { borderColor: methodBadge[m], background: methodBg[m], color: methodBadge[m] }
                        : { borderColor: 'transparent', background: 'rgba(148,163,184,0.08)', color: '#94a3b8' }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              {/* Status */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['COMPLETED', 'PENDING'] as PaymentStatus[]).map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                      className="py-2.5 rounded-xl border-2 font-black text-xs transition-all"
                      style={form.status === s
                        ? { borderColor: s === 'COMPLETED' ? '#6366f1' : '#f59e0b', background: s === 'COMPLETED' ? 'rgba(99,102,241,0.08)' : 'rgba(245,158,11,0.08)', color: s === 'COMPLETED' ? '#4f46e5' : '#d97706' }
                        : { borderColor: 'transparent', background: 'rgba(148,163,184,0.08)', color: '#94a3b8' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {/* Date */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors" />
              </div>
              {/* Note */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Note <span className="normal-case font-semibold">(optional)</span></label>
                <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Invoice #, order ref, etc."
                  className="w-full h-11 px-4 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 h-11 rounded-2xl text-sm font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                Cancel
              </button>
              <button onClick={savePayment}
                className="flex-1 h-11 rounded-2xl text-sm font-black text-white transition-opacity hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                {editId ? 'Save Changes' : 'Add Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'rgba(244,63,94,0.1)' }}>
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 text-slate-900 dark:text-white">Delete Payment?</h3>
              <p className="text-sm text-slate-400 font-semibold mt-1">
                ₹{payments.find(p => p.id === deleteId)?.amount.toLocaleString('en-IN')} &mdash; {payments.find(p => p.id === deleteId)?.party}
              </p>
              <p className="text-xs text-slate-400 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 h-11 rounded-2xl text-sm font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={() => deletePayment(deleteId)}
                className="flex-1 h-11 rounded-2xl text-sm font-black text-white bg-rose-500 hover:bg-rose-600 active:scale-95 transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



const DistributorDashboard: React.FC<{ state: AppState, t: any }> = ({ state, t }) => (
  <div className="space-y-8">
    <RetailerDashboard state={state} t={t} />
  </div>
);

const ManufacturerDashboard: React.FC<{ state: AppState, t: any }> = ({ state, t }) => (
  <div className="space-y-8">
    <RetailerDashboard state={state} t={t} />
  </div>
);

const LandingFlow: React.FC<{ onComplete: (role: UserRole) => void, t: any, state: AppState, setState: React.Dispatch<React.SetStateAction<AppState>> }> = ({ onComplete, t, state, setState }) => {
  const [step, setStep] = useState<'language' | 'role'>('language');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.MANUFACTURER);

  if (step === 'language') {
    return (
      <div className="min-h-screen bg-mesh flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.5), transparent)' }} />
        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl float"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              <Package className="text-white w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 text-slate-900 dark:text-white font-display mb-2" style={{ letterSpacing: '-0.03em' }}>Vyaparika</h1>
            <p className="text-indigo-600 font-bold text-base">Apka Vyapar, Apka Control</p>
            <p className="text-slate-400 font-semibold uppercase tracking-[0.2em] text-[10px] mt-0.5">Select Your Language</p>
          </div>
          <div className="glass rounded-[2rem] p-5 mb-6" style={{ boxShadow: '0 20px 60px rgba(79,70,229,0.12)' }}>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {INDIAN_LANGUAGES.map(l => (
                <button key={l.code} onClick={() => setState(s => ({...s, language: l.code as LanguageCode}))}
                  className={`p-4 rounded-2xl border-2 font-bold transition-all role-card active:scale-95 text-left ${
                    state.language === l.code
                      ? 'border-indigo-500 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700/60 dark:text-slate-400 hover:border-indigo-200'
                  }`}
                  style={state.language === l.code ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.08))' } : {}}>
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{l.native}</span>
                    {state.language === l.code && <Check className="w-4 h-4 text-indigo-500" />}
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wide">{l.name} &bull; {l.region}</p>
                </button>
              ))}
            </div>
          </div>
          <Button className="h-14 px-10 text-base w-full btn-glow" onClick={() => setStep('role')}>{t.continue} <ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>
    );
  }

  const roleConfigs = [
    {
      id: UserRole.RETAILER, label: 'Retailer / Shopkeeper', icon: Store,
      desc: 'Daily sales, kirana & retail shop',
      emoji: '🏪',
      gradient: 'from-indigo-500 to-violet-600',
      gradientStyle: 'linear-gradient(135deg, #6366f1, #7c3aed)',
      glow: 'rgba(99,102,241,0.3)'
    },
    {
      id: UserRole.DISTRIBUTOR, label: 'Distributor', icon: Truck,
      desc: 'Wholesale supply & warehouse',
      emoji: '🚚',
      gradient: 'from-emerald-500 to-teal-600',
      gradientStyle: 'linear-gradient(135deg, #10b981, #0d9488)',
      glow: 'rgba(16,185,129,0.3)'
    },
    {
      id: UserRole.MANUFACTURER, label: 'Manufacturer', icon: Factory,
      desc: 'Factory, production & raw materials',
      emoji: '🏭',
      gradient: 'from-amber-500 to-orange-600',
      gradientStyle: 'linear-gradient(135deg, #f59e0b, #ea580c)',
      glow: 'rgba(245,158,11,0.3)'
    }
  ];

  return (
    <div className="min-h-screen bg-mesh flex flex-col items-center justify-center p-6 animate-in slide-in-from-right-4 duration-500">
      <div className="fixed bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.5), transparent)' }} />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))' }}>
            <User className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 text-slate-900 dark:text-white font-display mb-2" style={{ letterSpacing: '-0.02em' }}>{t.signup}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Choose your role to personalize your experience.</p>
        </div>

        <div className="space-y-3 mb-6">
          {roleConfigs.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all w-full text-left role-card active:scale-[0.98] ${
                selectedRole === r.id
                  ? 'border-transparent'
                  : 'border-slate-200 dark:border-slate-700/60 hover:border-indigo-200'
              }`}
              style={selectedRole === r.id ? {
                background: r.gradientStyle,
                boxShadow: `0 8px 32px ${r.glow}`
              } : {}}
            >
              <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-2xl shrink-0 transition-all ${
                selectedRole === r.id ? 'bg-white/20 scale-110' : 'bg-slate-100 dark:bg-slate-800'
              }`}>
                {selectedRole === r.id
                  ? <div className={`w-full h-full rounded-2xl flex flex-col items-center justify-center bg-gradient-to-br ${r.gradient}`}>
                      <span className="text-xl">{r.emoji}</span>
                    </div>
                  : <span className="text-2xl">{r.emoji}</span>
                }
              </div>
              <div className="flex-1">
                <p className={`font-black text-lg leading-tight ${
                  selectedRole === r.id ? 'text-white' : 'text-slate-800 dark:text-slate-200'
                }`}>{r.label}</p>
                <p className={`text-xs font-semibold mt-1 ${
                  selectedRole === r.id ? 'text-white/70' : 'text-slate-400'
                }`}>{r.desc}</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                selectedRole === r.id ? 'border-white/60 bg-white/20' : 'border-slate-200 dark:border-slate-600'
              }`}>
                {selectedRole === r.id && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep('language')}
            className="w-12 h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center hover:border-indigo-300 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <Button className="h-14 flex-1 text-base btn-glow" onClick={() => onComplete(selectedRole)}>
            {t.getStarted} <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
