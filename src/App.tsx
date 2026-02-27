
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, Package, BrainCircuit, Settings, Plus, Search, 
  AlertTriangle, CheckCircle, ArrowUpRight, TrendingUp, MapPin, 
  Truck, Factory, Camera, ChevronRight, ShieldCheck, Globe,
  Menu, X, Smartphone, User, Bell, Lock, LogOut, Info, Box, MoreVertical, 
  ChevronDown, Check, Minus, PlusCircle, Sparkles, Loader2, Moon, Sun, Monitor,
  BarChart3, Map as MapIcon, Layers, Scan, RefreshCw, Briefcase, Mail, Phone,
  Building2, Calendar, FileText, MapPinned, CreditCard, KeyRound, ArrowLeft,
  Store, Navigation
} from 'lucide-react';
import { UserRole, ShopType, LanguageCode, SKU, AppState, UserProfile, StockLog, MovementType, ThemeMode, Expense, BusinessConnection } from './types';
import { TRANSLATIONS, CATEGORIES, UNITS, INDIAN_LANGUAGES, EXPENSE_CATEGORIES } from './constants';
import { getInventoryInsights, predictSKUMetadata, identifyProductFromImage, SKUPrediction } from './services/geminiService';

// --- Global UI Components ---

const Button: React.FC<{ 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'ai'; 
  children: React.ReactNode; 
  className?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
}> = ({ onClick, variant = 'primary', children, className = '', fullWidth = false, disabled = false, type = 'button' }) => {
  const base = "px-5 py-3 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none select-none cursor-pointer";
  const variants = {
    primary: "bg-gradient-to-b from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none btn-glow",
    secondary: "bg-white dark:bg-slate-800/80 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 hover:bg-indigo-50/60 dark:hover:bg-indigo-900/20 hover:-translate-y-0.5 active:translate-y-0 shadow-sm",
    danger: "bg-gradient-to-b from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 hover:from-rose-100 hover:to-rose-200 dark:hover:from-rose-900/40 active:scale-95",
    ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 active:scale-95 hover:-translate-y-0.5",
    success: "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 active:translate-y-0 btn-glow",
    ai: "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 active:translate-y-0 btn-glow"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}>
      {children}
    </button>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`bg-white dark:bg-slate-800/70 rounded-3xl p-5 border border-slate-100 dark:border-slate-700/60 card-pro ${className} ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''}`}>
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

// --- Login Record Helpers ---
interface LoginRecord {
  businessName: string;
  roleName: string;
  roleId: UserRole;
  loginMethod: string;
  timestamp: string;
}

const getLastLogins = (): LoginRecord[] => {
  try { return JSON.parse(localStorage.getItem('vyaparika_last_logins') || '[]'); }
  catch { return []; }
};

const saveLoginRecord = (record: LoginRecord) => {
  const existing = getLastLogins();
  const updated = [record, ...existing.filter(r => !(r.businessName === record.businessName && r.roleId === record.roleId))].slice(0, 3);
  localStorage.setItem('vyaparika_last_logins', JSON.stringify(updated));
};

// --- Account Registry ---
const STATE_KEY = 'vyaparika_state_v2';
const ACCOUNTS_KEY = 'vyaparika_accounts';

interface AccountRecord {
  email: string;
  password: string;
  role?: UserRole;
  createdAt: string;
}

const getAccounts = (): AccountRecord[] => {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]'); }
  catch { return []; }
};

const saveAccount = (account: AccountRecord) => {
  const existing = getAccounts().filter(a => a.email !== account.email);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...existing, account]));
};

const deleteAccountFromRegistry = (email: string) => {
  const updated = getAccounts().filter(a => a.email !== email);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updated));
};

const findAccount = (email: string, password: string): AccountRecord | null =>
  getAccounts().find(a => a.email === email && a.password === password) ?? null;

// --- Authentication Components ---

const AuthFlow: React.FC<{ onAuthSuccess: (method: string, data?: any) => void, t: any, lastLogins: LoginRecord[] }> = ({ onAuthSuccess, t, lastLogins }) => {
  const [step, setStep] = useState<'main' | 'mobile' | 'otp' | 'gmail_email' | 'gmail_password' | 'forgot' | 'signup'>('main');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  const roleOptions = [
    { id: UserRole.MANUFACTURER, label: 'Manufacturer', icon: Factory },
    { id: UserRole.DISTRIBUTOR, label: 'Distributor', icon: Truck },
    { id: UserRole.RETAILER, label: 'Shopkeeper', icon: Store },
  ];

  const handleGoogleAuth = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onAuthSuccess('google', { role: selectedRole });
    }, 1500);
  };

  const handleEmailAuth = () => {
    if (!email || !password) return;
    const account = findAccount(email, password);
    if (!account) {
      setAuthError('Incorrect email or password. Please try again.');
      return;
    }
    setAuthError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onAuthSuccess('email', { email, role: account.role || selectedRole });
    }, 1000);
  };

  const handleSignup = () => {
    if (!email || !password || password !== confirmPwd) return;
    if (getAccounts().some(a => a.email === email)) {
      setAuthError('An account with this email already exists. Please sign in.');
      return;
    }
    setAuthError('');
    setLoading(true);
    setTimeout(() => {
      saveAccount({ email, password, role: selectedRole || undefined, createdAt: new Date().toISOString() });
      setLoading(false);
      onAuthSuccess('email', { email, role: selectedRole });
    }, 1000);
  };

  const handleMobileContinue = () => {
    if (phone.length === 10) setStep('otp');
  };

  const handleVerifyOtp = () => {
    if (otp.length === 6) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        onAuthSuccess('mobile', { phone, role: selectedRole });
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 sm:p-6">
      {/* Decorative background orbs */}
      <div className="fixed top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4), transparent)' }} />
      <div className="fixed bottom-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.4), transparent)' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="glass rounded-[2rem] shadow-2xl overflow-hidden border border-white/50 dark:border-indigo-900/40"
          style={{ boxShadow: '0 25px 80px rgba(79,70,229,0.18), 0 0 0 1px rgba(99,102,241,0.1)' }}>

          {step === 'main' && (
            <div className="p-8 space-y-6 animate-in fade-in zoom-in-95 duration-400">
              {/* Header */}
              <div className="text-center pb-1">
                <div className="relative inline-flex mb-5">
                  <div className="w-18 h-18 w-[4.5rem] h-[4.5rem] rounded-2xl flex items-center justify-center shadow-2xl"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                    <Package className="text-white w-9 h-9" />
                  </div>
                  <div className="absolute -inset-1 rounded-3xl opacity-30 blur-sm -z-10"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter font-display" style={{ letterSpacing: '-0.03em' }}>
                  Vyaparika
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-[0.2em] mt-1">AI Inventory Intelligence</p>
              </div>

              {/* Last Logins */}
              {lastLogins.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.18em] px-1">Quick Login</p>
                  {lastLogins.map((record, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedRole(record.roleId);
                        onAuthSuccess('quick', { role: record.roleId, businessName: record.businessName });
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700/60 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all text-left group active:scale-[0.98]"
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 dark:text-white text-base truncate">{record.businessName || 'Business Account'}</p>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">{record.roleName} &bull; Last login: {new Date(record.timestamp).toLocaleDateString()}</p>
                      </div>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))' }}>
                        <ChevronRight className="w-4 h-4 text-indigo-500" />
                      </div>
                    </button>
                  ))}
                  <div className="relative flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/50" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">or sign in with another account</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/50" />
                  </div>
                </div>
              )}

              {/* Enter As */}
              <div className="space-y-3">
                <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.18em] px-1">I am a...</p>
                <div className="space-y-2.5">
                  {roleOptions.map(role => {
                    const colors: Record<string, { grad: string, glow: string, light: string }> = {
                      [UserRole.MANUFACTURER]: { grad: 'linear-gradient(135deg, #f59e0b, #d97706)', glow: 'rgba(245,158,11,0.35)', light: 'rgba(253,230,138,0.3)' },
                      [UserRole.DISTRIBUTOR]:  { grad: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16,185,129,0.35)', light: 'rgba(167,243,208,0.3)' },
                      [UserRole.RETAILER]:     { grad: 'linear-gradient(135deg, #4f46e5, #7c3aed)', glow: 'rgba(99,102,241,0.35)', light: 'rgba(199,210,254,0.3)' },
                    };
                    const c = colors[role.id];
                    const active = selectedRole === role.id;
                    return (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRole(active ? null : role.id)}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all role-card text-left active:scale-[0.98]"
                        style={active ? {
                          borderColor: 'transparent',
                          background: c.grad,
                          boxShadow: `0 8px 30px ${c.glow}`
                        } : { borderColor: '#e2e8f0' }}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          active ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'
                        }`}>
                          <role.icon className={`w-6 h-6 ${active ? 'text-white' : 'text-slate-400'}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-black text-base leading-tight ${active ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{role.label}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-wide mt-0.5 ${active ? 'text-white/70' : 'text-slate-400'}`}>
                            {role.id === UserRole.MANUFACTURER && 'Factory / Production'}
                            {role.id === UserRole.DISTRIBUTOR && 'Wholesale / Supply'}
                            {role.id === UserRole.RETAILER && 'Shop / Kirana'}
                          </p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          active ? 'border-white/60 bg-white/20' : 'border-slate-200 dark:border-slate-600'
                        }`}>
                          {active && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Login Methods */}
              <div className="space-y-3">
                <Button fullWidth className="h-14 text-sm font-black" variant="secondary" onClick={handleGoogleAuth} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (<><Globe className="w-5 h-5 text-blue-500" /><span>Continue with Google</span></>)}
                </Button>
                <Button fullWidth className="h-14 text-sm font-black btn-glow" onClick={() => setStep('gmail_email')} disabled={loading}>
                  <Mail className="w-5 h-5" />Continue with Email
                </Button>
                <Button fullWidth variant="ghost" className="h-14 text-sm font-black" onClick={() => setStep('mobile')} disabled={loading}>
                  <Smartphone className="w-5 h-5" />Login with Mobile / OTP
                </Button>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold text-center">By continuing you agree to our Terms of Service</p>
            </div>
          )}

          {step === 'gmail_email' && (
            <div className="p-8 space-y-6 animate-in slide-in-from-right-4 duration-300">
              {/* Gmail-style Step 1: Email only */}
              <button onClick={() => setStep('main')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-bold">
                <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                Back
              </button>
              <div className="text-center">
                <div className="w-16 h-16 rounded-3xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                  <Package className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">Sign in</h2>
                <p className="text-slate-500 text-sm mt-1.5">Use your Vyaparika account</p>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Email or Phone</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && email && setStep('gmail_password')}
                  placeholder="Enter your email"
                  autoFocus
                  className="input-pro w-full bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl py-4 px-5 font-semibold dark:text-white text-base"
                />
              </div>
              <div className="space-y-3">
                <Button fullWidth className="h-14 text-base font-black btn-glow" disabled={!email} onClick={() => setStep('gmail_password')}>
                  Next <ChevronRight className="w-5 h-5" />
                </Button>
                <button onClick={() => { setStep('signup'); setAuthError(''); }} className="w-full text-center text-indigo-600 font-bold text-sm hover:text-indigo-800 transition-colors py-1">
                  Create account
                </button>
              </div>
            </div>
          )}

          {step === 'gmail_password' && (
            <div className="p-8 space-y-6 animate-in slide-in-from-right-4 duration-300">
              {/* Gmail-style Step 2: Password */}
              <button onClick={() => setStep('gmail_email')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-bold">
                <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                Back
              </button>
              {/* Show email at top like Gmail */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                  <User className="w-8 h-8 text-white" />
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mb-1">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300 truncate max-w-[180px]">{email}</span>
                  <button onClick={() => setStep('gmail_email')} className="ml-1 text-indigo-500 hover:text-indigo-700 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">Welcome back</h2>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && email && password && handleEmailAuth()}
                  placeholder="Enter your password"
                  autoFocus
                  className="input-pro w-full bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl py-4 px-5 font-semibold dark:text-white text-base"
                />
              </div>
              <div className="space-y-3">
                {authError && (
                  <div className="rounded-2xl p-3 flex items-center gap-2" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)' }}>
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <p className="text-sm font-bold text-rose-600">{authError}</p>
                  </div>
                )}
                <Button fullWidth className="h-14 text-base font-black btn-glow" disabled={!password || loading} onClick={handleEmailAuth}>
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Lock className="w-5 h-5" /> Sign In</>}
                </Button>
                <button onClick={() => { setStep('forgot'); setForgotSuccess(false); }} className="w-full text-center text-indigo-600 font-bold text-sm hover:text-indigo-800 transition-colors py-1">
                  Forgot password?
                </button>
                <button onClick={() => { setStep('signup'); setAuthError(''); setPassword(''); setConfirmPwd(''); }} className="w-full text-center text-slate-500 font-semibold text-sm hover:text-indigo-600 transition-colors py-1">
                  Don't have an account? <span className="text-indigo-600 font-bold">Create one</span>
                </button>
              </div>
            </div>
          )}

          {step === 'forgot' && (
            <div className="p-8 space-y-6 animate-in slide-in-from-right-4 duration-300">
              <button onClick={() => setStep('gmail_password')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-bold">
                <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                Back
              </button>
              <div className="text-center">
                <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  <KeyRound className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">Forgot Password?</h2>
                <p className="text-slate-500 text-sm mt-1.5">We\'ll send a reset link to your email</p>
              </div>
              {forgotSuccess ? (
                <div className="rounded-2xl p-6 text-center space-y-3" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.08))', border: '2px solid rgba(16,185,129,0.3)' }}>
                  <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    <Check className="w-7 h-7 text-white" />
                  </div>
                  <p className="font-black text-emerald-700 dark:text-emerald-400 text-base">Reset Link Sent!</p>
                  <p className="text-sm text-slate-500">Check <span className="font-black text-slate-700 dark:text-slate-200">{email}</span> for your reset link</p>
                  <button onClick={() => setStep('gmail_password')} className="text-indigo-600 font-bold text-sm hover:text-indigo-800 transition-colors mt-2">
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      autoFocus
                      className="input-pro w-full bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl py-4 px-5 font-semibold dark:text-white text-base"
                    />
                  </div>
                  <Button fullWidth className="h-14 text-base font-black btn-glow" disabled={!email} onClick={() => setForgotSuccess(true)}>
                    <Mail className="w-5 h-5" /> Send Reset Link
                  </Button>
                </>
              )}
            </div>
          )}

          {step === 'mobile' && (
            <div className="p-8 space-y-6 animate-in slide-in-from-right-4 duration-300">
              <button onClick={() => setStep('main')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-bold">
                <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                Back
              </button>
              <div className="text-center">
                <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">Mobile Login</h2>
                <p className="text-slate-500 text-sm mt-1">We'll send a 6-digit code to verify</p>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Your Mobile Number</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="font-black text-slate-600 dark:text-slate-300 text-base">🇮🇳 +91</span>
                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-600" />
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="00000 00000"
                    className="input-pro w-full bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl py-5 pl-28 pr-5 font-black text-xl tracking-[0.15em] dark:text-white"
                    autoFocus
                  />
                </div>
                {phone.length > 0 && phone.length < 10 && (
                  <p className="text-xs text-rose-500 font-bold mt-2 flex items-center gap-1"><span>⚠</span> Enter 10-digit mobile number</p>
                )}
              </div>
              <Button fullWidth className="h-14 text-base font-black btn-glow" disabled={phone.length !== 10} onClick={handleMobileContinue}>
                Send OTP <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {step === 'otp' && (
            <div className="p-8 space-y-6 animate-in slide-in-from-right-4 duration-300">
              <button onClick={() => setStep('mobile')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-bold">
                <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                Back
              </button>
              <div className="text-center">
                <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">Enter OTP</h2>
                <p className="text-slate-500 text-sm mt-1">Code sent to <span className="font-black text-slate-700 dark:text-slate-200">+91 {phone}</span></p>
              </div>
              {/* Individual OTP boxes */}
              <div className="flex gap-2 justify-center">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <input
                    key={idx}
                    ref={el => { otpRefs.current[idx] = el; }}
                    type="tel"
                    maxLength={1}
                    value={otp[idx] || ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      const arr = otp.split('');
                      arr[idx] = val;
                      const next = arr.join('').slice(0, 6);
                      setOtp(next);
                      if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
                    }}
                    className="w-12 h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center text-2xl font-black text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none transition-all"
                    style={otp[idx] ? { borderColor: '#4f46e5', background: 'rgba(99,102,241,0.07)' } : {}}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
              <Button fullWidth className="h-14 text-base font-black btn-glow" disabled={otp.length !== 6 || loading} onClick={handleVerifyOtp}>
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><ShieldCheck className="w-5 h-5" /> Verify &amp; Enter</>}
              </Button>
              <button className="w-full text-center text-indigo-500 font-bold text-sm hover:text-indigo-700 transition-colors">Resend OTP (30s)</button>
            </div>
          )}

          {step === 'signup' && (
            <div className="p-8 space-y-6 animate-in slide-in-from-right-4 duration-300">
              <button onClick={() => { setStep('gmail_email'); setAuthError(''); }} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-bold">
                <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                Back
              </button>
              <div className="text-center">
                <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                  <User className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">Create Account</h2>
                <p className="text-slate-500 text-sm mt-1.5">Join Vyaparika today</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Email</label>
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setAuthError(''); }}
                    placeholder="your@email.com" autoFocus
                    className="input-pro w-full bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl py-4 px-5 font-semibold dark:text-white text-base" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Password</label>
                  <input type="password" value={password} onChange={e => { setPassword(e.target.value); setAuthError(''); }}
                    placeholder="Create a password"
                    className="input-pro w-full bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl py-4 px-5 font-semibold dark:text-white text-base" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Confirm Password</label>
                  <input type="password" value={confirmPwd} onChange={e => { setConfirmPwd(e.target.value); setAuthError(''); }}
                    onKeyDown={e => e.key === 'Enter' && email && password && confirmPwd === password && handleSignup()}
                    placeholder="Repeat your password"
                    className="input-pro w-full bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl py-4 px-5 font-semibold dark:text-white text-base" />
                  {confirmPwd && password !== confirmPwd && (
                    <p className="text-xs text-rose-500 font-bold mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Passwords do not match</p>
                  )}
                </div>
                {authError && (
                  <div className="rounded-2xl p-3 flex items-center gap-2" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)' }}>
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <p className="text-sm font-bold text-rose-600">{authError}</p>
                  </div>
                )}
              </div>
              <Button fullWidth className="h-14 text-base font-black btn-glow"
                disabled={!email || !password || password !== confirmPwd || loading}
                onClick={handleSignup}>
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><CheckCircle className="w-5 h-5" /> Create Account</>}
              </Button>
              <p className="text-center text-sm text-slate-500">Already have an account?{' '}
                <button onClick={() => { setStep('gmail_email'); setAuthError(''); }} className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors">Sign in</button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Settings Module Enhancement ---

// --- Admin Module (replaces Settings) ---
const AdminModule: React.FC<{ state: AppState, setState: React.Dispatch<React.SetStateAction<AppState>>, t: any }> = ({ state, setState, t }) => {
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
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

  const updateProfile = (updates: Partial<UserProfile>) => {
    setState(s => ({ ...s, profile: { ...s.profile, ...updates } }));
  };

  const handleLogout = () => {
    saveLoginRecord({
      businessName: state.profile.shopName || 'Business Account',
      roleName: (state.role as string) || 'Business',
      roleId: state.role as UserRole,
      loginMethod: 'email',
      timestamp: new Date().toISOString()
    });
    setState(s => ({
      ...s,
      isLoggedIn: false,
      landingCompleted: false,
      onboarded: false,
      onboardingStep: 1
    }));
  };

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
        <Button variant="danger" className="h-11 px-5 text-sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4" /> Logout
        </Button>
      </div>

      {activeSubTab === 'profile' && (
        <div className="space-y-8">
          {!isEditingProfile ? (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Business Card Visualization */}
              <div className="relative group perspective-1000">
                <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-800 text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden transition-all duration-500">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-colors" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/10 rounded-full -ml-32 -mb-32 blur-2xl" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row justify-between h-full gap-8">
                    <div className="space-y-6">
                      <div>
                        <div className="bg-white/20 w-fit px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-4 backdrop-blur-md border border-white/10">
                          {state.role}
                        </div>
                        <h2 className="text-4xl font-black tracking-tighter">{profile.shopName || 'Business Name'}</h2>
                        <p className="text-indigo-200 font-bold flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4" /> {profile.city || 'Location not set'}, {profile.state || 'India'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-sm font-medium">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10"><User className="w-5 h-5" /></div>
                          <div><p className="text-[10px] opacity-60 uppercase font-bold">Owner</p><p>{profile.name || 'Set Name'}</p></div>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-medium">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10"><Phone className="w-5 h-5" /></div>
                          <div><p className="text-[10px] opacity-60 uppercase font-bold">Contact</p><p>{profile.phone || '+91 XXXXX XXXXX'}</p></div>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-medium">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10"><Calendar className="w-5 h-5" /></div>
                          <div><p className="text-[10px] opacity-60 uppercase font-bold">Est. Year</p><p>{profile.establishedYear || 'N/A'}</p></div>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-medium">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10"><FileText className="w-5 h-5" /></div>
                          <div><p className="text-[10px] opacity-60 uppercase font-bold">GSTIN</p><p>{profile.gstin || 'Not Provided'}</p></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-end gap-6">
                      <div className="w-24 h-24 bg-white rounded-3xl p-2 shadow-inner flex items-center justify-center">
                        <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200">
                          <Package className="w-10 h-10 text-indigo-600" />
                        </div>
                      </div>
                      <Button variant="ghost" onClick={() => setIsEditingProfile(true)} className="bg-white/10 text-white hover:bg-white/20 backdrop-blur-md px-6">
                        Edit Business Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Card Group */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="card-pro bg-white dark:bg-slate-800/70 rounded-3xl flex items-center gap-4 p-6 border border-slate-100 dark:border-slate-700/60">
                    <div className="w-12 h-12 rounded-2xl text-emerald-600 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}><CheckCircle className="w-6 h-6" /></div>
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Profile Strength</p><p className="font-black text-xl text-slate-800 dark:text-white">Strong</p></div>
                 </div>
                 <div className="card-pro bg-white dark:bg-slate-800/70 rounded-3xl flex items-center gap-4 p-6 border border-slate-100 dark:border-slate-700/60">
                    <div className="w-12 h-12 rounded-2xl text-indigo-600 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)' }}><ShieldCheck className="w-6 h-6" /></div>
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Verification</p><p className="font-black text-xl text-slate-800 dark:text-white">Self-Verified</p></div>
                 </div>
                 <div className="card-pro bg-white dark:bg-slate-800/70 rounded-3xl flex items-center gap-4 p-6 border border-slate-100 dark:border-slate-700/60">
                    <div className="w-12 h-12 rounded-2xl text-amber-600 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}><Globe className="w-6 h-6" /></div>
                    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Visibility</p><p className="font-black text-xl text-slate-800 dark:text-white">Regional</p></div>
                 </div>
              </div>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display mb-1">Edit Business Identity</h3>
                  <p className="text-slate-500 text-sm">Update your business and contact information</p>
                </div>
                <Button variant="ghost" onClick={() => setIsEditingProfile(false)}><X /> Close</Button>
              </div>

              <div className="space-y-6">
                <h4 className="flex items-center gap-2 font-black text-indigo-600 uppercase tracking-widest text-[10px]">
                  <User className="w-3 h-3" /> Personal Identity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Owner Name</label>
                    <input type="text" value={profile.name} onChange={e => updateProfile({ name: e.target.value })} className="input-pro w-full bg-white dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 font-bold dark:text-white" placeholder="e.g. Rahul Sharma" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                    <input type="tel" value={profile.phone} onChange={e => updateProfile({ phone: e.target.value })} className="input-pro w-full bg-white dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 font-bold dark:text-white" placeholder="+91 XXXX" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="flex items-center gap-2 font-black text-indigo-600 uppercase tracking-widest text-[10px]">
                  <Building2 className="w-3 h-3" /> Business Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Registered Shop Name</label>
                    <input type="text" value={profile.shopName} onChange={e => updateProfile({ shopName: e.target.value })} className="input-pro w-full bg-white dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 font-bold dark:text-white" placeholder="e.g. Sai Kirana Store" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Established Year</label>
                    <input type="text" value={profile.establishedYear} onChange={e => updateProfile({ establishedYear: e.target.value })} className="input-pro w-full bg-white dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 font-bold dark:text-white" placeholder="e.g. 1998" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                    <input type="text" value={profile.businessCategory} onChange={e => updateProfile({ businessCategory: e.target.value })} className="input-pro w-full bg-white dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 font-bold dark:text-white" placeholder="e.g. Retail / Grocery" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="flex items-center gap-2 font-black text-indigo-600 uppercase tracking-widest text-[10px]">
                  <MapPinned className="w-3 h-3" /> Location & Compliance
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Physical Address</label>
                    <textarea value={profile.address} onChange={e => updateProfile({ address: e.target.value })} className="input-pro w-full bg-white dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 font-bold dark:text-white h-24 resize-none" placeholder="Shop No, Street, Landmark..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">City</label>
                    <input type="text" value={profile.city} onChange={e => updateProfile({ city: e.target.value })} className="input-pro w-full bg-white dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 font-bold dark:text-white" placeholder="Mumbai" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">State</label>
                    <input type="text" value={profile.state} onChange={e => updateProfile({ state: e.target.value })} className="input-pro w-full bg-white dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 font-bold dark:text-white" placeholder="Maharashtra" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">GSTIN (Optional)</label>
                    <input type="text" value={profile.gstin} onChange={e => updateProfile({ gstin: e.target.value.toUpperCase() })} className="input-pro w-full bg-white dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 font-bold dark:text-white" placeholder="27XXXXX0000X0Z0" />
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
              <div><h3 className="font-black text-slate-900 dark:text-white text-base">Language</h3><p className="text-xs text-slate-400 font-semibold">Choose your preferred language</p></div>
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
              <div><h3 className="font-black text-slate-900 dark:text-white text-base">Appearance</h3><p className="text-xs text-slate-400 font-semibold">Choose how Vyaparika looks</p></div>
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
              <div><h3 className="font-black text-slate-900 dark:text-white text-base">Notifications</h3><p className="text-xs text-slate-400 font-semibold">Manage alerts &amp; reminders</p></div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Low Stock Alerts', desc: 'Alert when items reach critical level', value: notifStock, set: setNotifStock },
                { label: 'Daily Summary', desc: 'Morning digest of key business metrics', value: notifSummary, set: setNotifSummary },
              ].map(item => (
                <div key={item.label} className="card-pro bg-white dark:bg-slate-800/70 rounded-2xl p-4 flex items-center justify-between border border-slate-100 dark:border-slate-700/60">
                  <div>
                    <p className="font-black text-slate-800 dark:text-white text-sm">{item.label}</p>
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
              <div><h3 className="font-black text-slate-900 dark:text-white text-base">Privacy</h3><p className="text-xs text-slate-400 font-semibold">Control your data</p></div>
            </div>
            <div className="card-pro bg-white dark:bg-slate-800/70 rounded-2xl p-4 flex items-center justify-between border border-slate-100 dark:border-slate-700/60">
              <div>
                <p className="font-black text-slate-800 dark:text-white text-sm">Share Analytics Data</p>
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
                <div><p className="font-black text-slate-900 dark:text-white">Change Password</p><p className="text-xs text-slate-400 font-semibold">Update your account password</p></div>
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
                          className="input-pro w-full bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl py-3.5 px-5 font-semibold dark:text-white" />
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
              <div><p className="font-black text-slate-900 dark:text-white">Sign Out</p><p className="text-xs text-slate-400 font-semibold">Log out from your account</p></div>
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
            {showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="font-black text-rose-700 text-sm">Are you sure? This cannot be undone.</p>
                <div className="flex gap-3">
                  <Button variant="danger" className="flex-1 h-11" onClick={() => {
                    // Remove account from registry
                    if (state.profile.email) deleteAccountFromRegistry(state.profile.email);
                    // Remove this business from last logins
                    const filteredLogins = getLastLogins().filter(r => r.businessName !== state.profile.shopName);
                    localStorage.setItem('vyaparika_last_logins', JSON.stringify(filteredLogins));
                    // Wipe all app storage keys
                    localStorage.removeItem(STATE_KEY);
                    localStorage.removeItem('vyaparika_state_v1.6');
                    localStorage.removeItem('vyaparika_state_v1.7');
                    setState(s => ({ ...s, isLoggedIn: false, landingCompleted: false, onboarded: false, onboardingStep: 1, profile: { ...s.profile, name: '', phone: '', email: '', shopName: '' } }));
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
            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">Complete Your Profile</h2>
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
                className="input-pro w-full bg-slate-50 dark:bg-slate-800/80 border-2 rounded-2xl py-4 px-5 font-semibold dark:text-white text-base"
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
                  className="input-pro w-full bg-slate-50 dark:bg-slate-800/80 border-2 rounded-2xl py-4 pl-24 pr-5 font-black text-base dark:text-white tracking-widest"
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
                className="input-pro w-full bg-slate-50 dark:bg-slate-800/80 border-2 rounded-2xl py-4 px-5 font-semibold dark:text-white text-base"
                style={{ borderColor: city.trim() ? '#4f46e5' : '#e2e8f0' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">State</label>
                <input type="text" value={stateVal} onChange={e => setStateVal(e.target.value)}
                  placeholder="Maharashtra"
                  className="input-pro w-full bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl py-4 px-4 font-semibold dark:text-white text-base" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Address</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="Street / Area"
                  className="input-pro w-full bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl py-4 px-4 font-semibold dark:text-white text-base" />
              </div>
            </div>
          </div>

          <Button fullWidth className="h-14 text-base font-black btn-glow" disabled={!canSave}
            onClick={() => setState(s => ({ ...s, profile: { ...s.profile, name: name.trim(), phone, city: city.trim(), state: stateVal.trim(), address: address.trim() } }))}>
            <CheckCircle className="w-5 h-5" /> Save & Enter Dashboard
          </Button>
          <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-widest">* Required fields must be completed</p>
        </div>
      </div>
    </div>
  );
};

// --- Main App Logic ---

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
      connections: [],
      landingCompleted: false,
      signupCompleted: false,
      onboarded: false,
      onboardingStep: 1,
      profile: defaultProfile
    };
  });

  const [isSplashActive, setIsSplashActive] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddPage, setShowAddPage] = useState(false);
  const [stockUpdateItem, setStockUpdateItem] = useState<SKU | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'status'>('name');

  const filteredInventory = useMemo(() => {
    let items = state.inventory.filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return items.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'stock') return b.currentStock - a.currentStock;
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });
  }, [state.inventory, searchTerm, sortBy]);

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

  useEffect(() => {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }, [state]);

  const t = TRANSLATIONS[state.language] || TRANSLATIONS['EN'];

  const [lastLogins, setLastLogins] = useState<LoginRecord[]>(() => getLastLogins());

  const handleAuthSuccess = (method: string, data?: any) => {
    const preRole = data?.role as UserRole | undefined;
    const preBusinessName = data?.businessName as string | undefined;
    // Refresh lastLogins from storage after quick-login updates
    setLastLogins(getLastLogins());
    setState(s => ({
      ...s,
      isLoggedIn: true,
      role: preRole || s.role,
      landingCompleted: preRole ? true : s.landingCompleted,
      profile: {
        ...s.profile,
        phone: data?.phone || s.profile.phone,
        email: data?.email || s.profile.email,
        shopName: preBusinessName || s.profile.shopName
      }
    }));
  };

  if (isSplashActive) return <SplashScreen onFinish={() => setIsSplashActive(false)} />;

  // Auth gating
  if (!state.isLoggedIn) return <AuthFlow onAuthSuccess={handleAuthSuccess} t={t} lastLogins={lastLogins} />;

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
              <h2 className="text-4xl font-black text-slate-900 dark:text-white leading-tight mb-3 font-display" style={{ letterSpacing: '-0.03em' }}>You're In!</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">Let's configure your business in 30 seconds.</p>
              <Button fullWidth className="h-14 text-base btn-glow" onClick={() => setState(s => ({ ...s, onboardingStep: 2 }))}>Setup My Business <ChevronRight className="w-4 h-4" /></Button>
            </div>
          )}
          {state.onboardingStep === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 space-y-5">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display mb-1">{t.onboardingStep3}</h2>
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
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 font-display">Cash Safe Promise</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">Your financial data stays local &amp; encrypted.</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">We never share your revenue data.</p>
              <Button fullWidth className="h-14 text-base btn-glow" onClick={() => setState(s => ({ ...s, onboarded: true }))}>
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

  const handleStockUpdate = (skuId: string, type: MovementType, quantity: number, reason: string) => {
    setState(s => {
      const newLogs: StockLog[] = [...s.movementLogs, {
        id: Math.random().toString(),
        skuId,
        type,
        quantity,
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
      return { ...s, inventory: newInventory, movementLogs: newLogs };
    });
    setStockUpdateItem(null);
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
    { id: 'inventory', icon: Package, label: t.inventory },
    { id: 'expenses', icon: CreditCard, label: t.expenses },
    { id: 'network', icon: Globe, label: t.connections },
    { id: 'payments', icon: Smartphone, label: t.payments },
    { id: 'insights', icon: BrainCircuit, label: t.insights },
    { id: 'admin', icon: ShieldCheck, label: 'Admin' }
  ];

  return (
    <div className="min-h-screen bg-mesh flex overflow-hidden transition-colors duration-500">
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 px-4 sm:px-6 py-3 flex justify-between items-center border-b-2 border-slate-100 dark:border-slate-800 shrink-0 z-30"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                <Package className="text-white w-6 h-6" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 dark:text-white leading-none font-display capitalize">{state.profile.shopName || 'My Business'}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-indigo-600 dark:text-indigo-400" style={{ background: 'rgba(99,102,241,0.1)' }}>{state.role}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{activeTab}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border-2 border-slate-100 dark:border-slate-700 hover:border-indigo-300 transition-colors relative active:scale-95">
              <Bell className="w-5 h-5 text-slate-500" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
            <button onClick={() => setActiveTab('admin')}
              className="w-11 h-11 rounded-2xl flex items-center justify-center border-2 border-slate-100 dark:border-slate-700 cursor-pointer hover:border-indigo-300 transition-all overflow-hidden shadow-sm active:scale-95"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.12))' }}>
              <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-transparent">
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
            <AdminModule state={state} setState={setState} t={t} />
          ) : activeTab === 'expenses' ? (
            <ExpensesModule state={state} setState={setState} t={t} />
          ) : activeTab === 'network' ? (
            <NetworkModule state={state} setState={setState} t={t} />
          ) : activeTab === 'payments' ? (
            <PaymentsModule state={state} t={t} />
          ) : (
            <div className="max-w-7xl mx-auto space-y-8 pb-24 sm:pb-8">
              {activeTab === 'dashboard' && (
                <>
                  {state.role === UserRole.RETAILER && <RetailerDashboard state={state} t={t} />}
                  {state.role === UserRole.DISTRIBUTOR && <DistributorDashboard state={state} t={t} />}
                  {state.role === UserRole.MANUFACTURER && <ManufacturerDashboard state={state} t={t} />}
                </>
              )}
              {activeTab === 'inventory' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                    <div className="relative flex-1 w-full">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Search className="text-indigo-500 w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search items, categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-pro w-full bg-white dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl py-4 pl-14 pr-4 font-semibold dark:text-white text-sm"
                      />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="input-pro bg-white dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700/60 rounded-2xl px-4 py-4 font-bold text-xs dark:text-white"
                      >
                        <option value="name">Name</option>
                        <option value="stock">Stock</option>
                        <option value="status">Status</option>
                      </select>
                      <Button onClick={() => setShowAddPage(true)} className="px-6 h-14 shadow-xl btn-glow whitespace-nowrap text-sm">
                        <PlusCircle className="w-4 h-4" /> {t.addStock}
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredInventory.map(item => {
                      const statusColor = item.status === 'CRITICAL' ? { border: '#f43f5e', bg: '#fff1f2', badge: 'bg-rose-100 text-rose-700', label: '🔴 Critical' }
                        : item.status === 'LOW' ? { border: '#f59e0b', bg: '#fffbeb', badge: 'bg-amber-100 text-amber-700', label: '🟡 Low Stock' }
                        : { border: '#6366f1', bg: 'transparent', badge: 'bg-emerald-100 text-emerald-700', label: '🟢 OK' };
                      return (
                        <div key={item.id} className="bg-white dark:bg-slate-800/80 rounded-3xl overflow-hidden card-pro border-0 relative"
                          style={{ borderLeft: `5px solid ${statusColor.border}`, boxShadow: `0 4px 24px rgba(0,0,0,0.07), inset 4px 0 0 ${statusColor.border}` }}>
                          <div className="p-5">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1 min-w-0 pr-2">
                                <p className="text-[10px] font-black text-indigo-500 uppercase mb-1 tracking-widest">{item.category}</p>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight">{item.name}</h3>
                              </div>
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 ${statusColor.badge}`}>{statusColor.label}</span>
                            </div>
                            <div className="rounded-2xl p-4 mb-4 border border-slate-100 dark:border-slate-700/50" style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
                               <div className="flex justify-between items-end">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">Stock</p>
                                    <p className="text-4xl font-black leading-none dark:text-white"
                                      style={{ color: item.status === 'CRITICAL' ? '#f43f5e' : item.status === 'LOW' ? '#f59e0b' : '#1e293b' }}>
                                      {item.currentStock}
                                    </p>
                                    <p className="text-xs font-bold text-slate-400 mt-0.5">{item.unit}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">Price</p>
                                    <p className="text-xl font-black text-slate-700 dark:text-slate-300">₹{item.price || 0}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">per {item.unit}</p>
                                  </div>
                               </div>
                            </div>
                            <button onClick={() => setStockUpdateItem(item)}
                              className="w-full h-12 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
                              <RefreshCw className="w-4 h-4" /> Update Stock
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {filteredInventory.length === 0 && (
                      <div className="col-span-3 text-center py-20 space-y-4">
                        <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)' }}>
                          <Package className="w-10 h-10 text-indigo-400" />
                        </div>
                        <p className="text-xl font-black text-slate-500">No items found</p>
                        <p className="text-sm text-slate-400">Tap <b>Add Stock</b> to add your first item</p>
                        <Button onClick={() => setShowAddPage(true)} className="btn-glow mx-auto px-8 h-14"><PlusCircle className="w-5 h-5" /> Add First Item</Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Nav */}
        <nav className="bg-white dark:bg-slate-900 border-t-2 border-slate-100 dark:border-slate-800 px-2 pt-2 pb-3 flex justify-around items-end shrink-0 z-30"
          style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.07)' }}>
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center gap-1.5 min-w-[3.5rem] transition-all duration-200 active:scale-95"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  isActive ? 'shadow-lg' : 'bg-transparent'
                }`} style={isActive ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 6px 18px rgba(99,102,241,0.4)' } : {}}>
                  <item.icon className={`transition-all duration-200 ${isActive ? 'w-6 h-6 text-white' : 'w-5 h-5 text-slate-400 dark:text-slate-500'}`} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-tight leading-none transition-all ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                }`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </main>
    </div>
  );
}

// --- Component Fragments ---

const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2400);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center text-white overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 40%, #7c3aed 70%, #9333ea 100%)'
      }}
    >
      {/* Animated blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #c084fc, transparent)' }} />

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-8 float">
          <div className="w-28 h-28 bg-white/15 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/20 shadow-2xl">
            <Package className="w-14 h-14 text-white" />
          </div>
          <div className="absolute -inset-2 rounded-[2.5rem] border border-white/20 animate-ping" style={{ animationDuration: '2s' }} />
        </div>
        <h1 className="text-5xl font-black tracking-tighter mb-2 font-display" style={{ letterSpacing: '-0.04em' }}>Vyaparika</h1>
        <p className="text-indigo-200 font-bold text-base">Apka Vyapar, Apka Control</p>
        <p className="text-indigo-300/70 font-semibold uppercase tracking-[0.3em] text-[10px] mt-0.5">AI Inventory Intelligence</p>
        <div className="mt-10 flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s`, animationDuration: '1s' }} />
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Updated AddInventoryModule ---

// Fix: Implemented missing "ScannerOverlay" component for barcode scanning functionality.
const ScannerOverlay: React.FC<{ shopType: ShopType; onScan: (data: SKUPrediction) => void; onClose: () => void }> = ({ shopType, onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let stream: MediaStream;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera error:", err);
        alert("Camera access denied. Please check permissions.");
        onClose();
      }
    };
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [onClose]);

  const capture = async () => {
    if (!videoRef.current || scanning) return;
    setScanning(true);
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
      const result = await identifyProductFromImage(base64, shopType);
      if (result) {
        onScan(result);
      } else {
        alert("Product not recognized. Try again or enter manually.");
        setScanning(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <div className="absolute inset-0 border-[40px] border-black/40 flex flex-col items-center justify-center">
        <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
          <div className="absolute inset-0 border-2 border-indigo-600 rounded-3xl animate-pulse" />
        </div>
        <p className="text-white font-black text-[10px] uppercase tracking-widest mt-8 bg-black/50 px-4 py-2 rounded-full">Scan Product Label or Barcode</p>
      </div>
      <div className="absolute bottom-12 flex gap-6 items-center">
        <Button variant="secondary" onClick={onClose} className="rounded-full w-14 h-14 p-0"><X /></Button>
        <button onClick={capture} disabled={scanning} className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all">
          {scanning ? <Loader2 className="animate-spin text-indigo-600 w-8 h-8" /> : <div className="w-16 h-16 border-4 border-indigo-600/20 rounded-full bg-indigo-600/10" />}
        </button>
        <div className="w-14" />
      </div>
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
  const [openingStock, setOpeningStock] = useState(0);
  const [price, setPrice] = useState(0);
  const [minThreshold, setMinThreshold] = useState(5);
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
    const newSku: SKU = {
      id: Math.random().toString(),
      name, category, unit,
      price: Math.max(0, price),
      openingStock: Math.max(0, openingStock),
      totalIn: 0, 
      totalOut: 0,
      currentStock: Math.max(0, openingStock),
      minThreshold: Math.max(0, minThreshold),
      lastUpdated: new Date().toISOString(),
      status: openingStock < minThreshold ? 'LOW' : 'OPTIMAL'
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
             <h2 className="text-xl font-black text-slate-900 dark:text-white">Add New Item</h2>
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
                className="input-pro w-full bg-slate-50 dark:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600/60 rounded-2xl p-4 font-bold dark:text-white"
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
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-pro w-full bg-slate-50 dark:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600/60 rounded-2xl p-4 font-bold appearance-none dark:text-white">
                  <option value="">Select</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Unit</label>
                <select value={unit} onChange={(e) => setUnit(e.target.value)} className="input-pro w-full bg-slate-50 dark:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600/60 rounded-2xl p-4 font-bold appearance-none dark:text-white">
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
                    value={openingStock} 
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= 0) setOpeningStock(val);
                    }} 
                    className="input-pro w-full bg-slate-50 dark:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600/60 rounded-2xl p-4 font-bold dark:text-white" 
                 />
              </div>
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Unit Price (₹)</label>
                 <input 
                    type="number" 
                    min="0"
                    value={price} 
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= 0) setPrice(val);
                    }} 
                    className="input-pro w-full bg-slate-50 dark:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600/60 rounded-2xl p-4 font-bold dark:text-white" 
                 />
              </div>
           </div>

           <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Min Threshold</label>
              <input 
                 type="number" 
                 min="0"
                 value={minThreshold} 
                 onChange={(e) => {
                   const val = Number(e.target.value);
                   if (val >= 0) setMinThreshold(val);
                 }} 
                 className="input-pro w-full bg-slate-50 dark:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600/60 rounded-2xl p-4 font-bold dark:text-white" 
              />
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
    { label: 'Sale', type: 'OUT' },
    { label: 'Purchase', type: 'IN' },
    { label: 'Return', type: 'IN' },
    { label: 'Damage', type: 'OUT' },
    { label: 'Expired', type: 'OUT' }
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
             <h2 className="text-2xl font-black text-slate-900 dark:text-white">{t.updateStock}</h2>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{item.name}</p>
           </div>
           <button onClick={onClose} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-full"><X /></button>
        </div>
        <div className="p-8 space-y-8">
           <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setType('IN')} className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all ${type === 'IN' ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'border-slate-50 dark:border-slate-700 text-slate-300 bg-slate-50 dark:bg-slate-700/50'}`}>
                <PlusCircle className="w-10 h-10" />
                <span className="font-black uppercase tracking-widest text-[11px]">{t.stockIn}</span>
              </button>
              <button onClick={() => setType('OUT')} className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all ${type === 'OUT' ? 'border-rose-600 bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'border-slate-50 dark:border-slate-700 text-slate-300 bg-slate-50 dark:bg-slate-700/50'}`}>
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
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl p-6 font-black text-4xl text-center dark:text-white focus:border-indigo-600 outline-none" 
                placeholder="0" 
                autoFocus
              />
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
           <Button fullWidth variant={type === 'IN' ? 'success' : 'danger'} className="h-16 text-lg shadow-xl" disabled={!quantity || Number(quantity) <= 0} onClick={() => onUpdate(item.id, type, Number(quantity), reason)}>Update Stock</Button>
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
    return { total: state.inventory.length, totalStock, totalValue, lowStock, totalExpenses };
  }, [state.inventory, state.expenses]);

  const kpiCards = [
    {
      label: t.totalItems, value: stats.total,
      sub: `${stats.totalStock} units total`,
      gradient: 'from-indigo-500 to-violet-600',
      glow: 'rgba(99,102,241,0.35)',
      icon: Layers, iconBg: 'bg-white/20',
      textColor: 'text-white'
    },
    {
      label: 'Stock Value', value: `₹${(stats.totalValue/1000).toFixed(1)}k`,
      sub: stats.totalValue > 0 ? 'inventory assets' : 'add items to track',
      gradient: 'from-emerald-400 to-teal-600',
      glow: 'rgba(16,185,129,0.35)',
      icon: TrendingUp, iconBg: 'bg-white/20',
      textColor: 'text-white'
    },
    {
      label: t.lowStock, value: stats.lowStock,
      sub: stats.lowStock > 0 ? 'needs reorder' : 'all stocked up!',
      gradient: stats.lowStock > 0 ? 'from-rose-400 to-rose-600' : 'from-slate-400 to-slate-500',
      glow: 'rgba(244,63,94,0.35)',
      icon: AlertTriangle, iconBg: 'bg-white/20',
      textColor: 'text-white'
    },
    {
      label: t.totalExpenses, value: `₹${stats.totalExpenses.toLocaleString()}`,
      sub: 'this month',
      gradient: 'from-amber-400 to-orange-500',
      glow: 'rgba(245,158,11,0.35)',
      icon: CreditCard, iconBg: 'bg-white/20',
      textColor: 'text-white'
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <div key={i} className="relative rounded-3xl p-5 overflow-hidden group cursor-default"
            style={{
              background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
              boxShadow: `0 8px 32px ${card.glow}`
            }}>
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 bg-white/10 blur-xl" />
            <div className="relative z-10">
              <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center mb-4`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-white/70 font-bold text-[10px] uppercase tracking-widest mb-1">{card.label}</p>
              <p className="text-white font-black text-2xl leading-none">{card.value}</p>
              <p className="text-white/60 font-semibold text-[10px] mt-1.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="md:col-span-2 p-7 space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800 dark:text-white font-display">Recent Movements</h3>
            <Button variant="ghost" className="text-[10px] uppercase tracking-widest font-black h-8 px-3">View All</Button>
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
                      log.type === 'IN'
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`} style={{
                      background: log.type === 'IN' ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'linear-gradient(135deg, #ffe4e6, #fecdd3)'
                    }}>
                      {log.type === 'IN' ? <ArrowUpRight className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-white">{item?.name || 'Unknown Item'}</p>
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

        <div className="rounded-3xl p-7 space-y-5 text-white overflow-hidden relative"
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
    </div>
  );
};

const ExpensesModule: React.FC<{ state: AppState, setState: React.Dispatch<React.SetStateAction<AppState>>, t: any }> = ({ state, setState, t }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [desc, setDesc] = useState('');

  const total = state.expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const addExpense = () => {
    if (!amount) return;
    const newExpense: Expense = {
      id: Math.random().toString(),
      amount: Number(amount),
      category,
      description: desc,
      date: new Date().toISOString()
    };
    setState(s => ({ ...s, expenses: [newExpense, ...s.expenses] }));
    setShowAdd(false);
    setAmount('');
    setDesc('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">{t.expenses}</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Track all your spending</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="btn-glow"><Plus /> {t.addExpense}</Button>
      </div>

      {/* Total card */}
      <div className="rounded-3xl p-8 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #be123c, #e11d48, #fb7185)' }}>
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-10 -mr-12 -mt-12" style={{ background: 'white' }} />
        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{t.totalExpenses}</p>
        <p className="text-5xl font-black mt-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>₹{total.toLocaleString()}</p>
        <p className="text-sm font-semibold opacity-70 mt-2">{state.expenses.length} transactions recorded</p>
      </div>

      {showAdd && (
        <div className="card-pro bg-white dark:bg-slate-800/80 rounded-3xl p-8 space-y-6 border-2 border-rose-100 dark:border-rose-900/20">
          <h3 className="font-black text-lg text-slate-800 dark:text-white">New Expense</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Amount (₹)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="input-pro w-full bg-slate-50 dark:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600/60 rounded-2xl p-4 font-bold dark:text-white" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="input-pro w-full bg-slate-50 dark:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600/60 rounded-2xl p-4 font-bold dark:text-white">
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
            <input type="text" value={desc} onChange={e => setDesc(e.target.value)} className="input-pro w-full bg-slate-50 dark:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600/60 rounded-2xl p-4 font-bold dark:text-white" placeholder="e.g. Monthly Rent" />
          </div>
          <div className="flex gap-4">
            <Button fullWidth className="btn-glow" onClick={addExpense}>{t.saveChanges}</Button>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {state.expenses.map(e => (
          <div key={e.id} className="card-pro bg-white dark:bg-slate-800/70 rounded-3xl flex justify-between items-center p-5 border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl text-rose-600 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ffe4e6, #fecdd3)' }}>
                <Minus className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-slate-800 dark:text-white">{e.description || e.category}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{e.category} &bull; {new Date(e.date).toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-xl font-black text-rose-500">- ₹{e.amount.toLocaleString()}</p>
          </div>
        ))}
        {state.expenses.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ffe4e6, #fecdd3)' }}>
              <Minus className="w-8 h-8 text-rose-400" />
            </div>
            <p className="font-black text-lg">No expenses yet</p>
            <p className="text-sm mt-1">Tap "Add Expense" to record your first one</p>
          </div>
        )}
      </div>
    </div>
  );
};

const NetworkModule: React.FC<{ state: AppState, setState: React.Dispatch<React.SetStateAction<AppState>>, t: any }> = ({ state, setState, t }) => {
  const [searchId, setSearchId] = useState('');

  const connectBusiness = () => {
    if (!searchId) return;
    const newConn: BusinessConnection = {
      id: Math.random().toString(),
      businessId: searchId,
      name: 'Business ' + searchId.split('-')[1],
      role: UserRole.DISTRIBUTOR,
      status: 'PENDING'
    };
    setState(s => ({ ...s, connections: [newConn, ...s.connections] }));
    setSearchId('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">{t.connections}</h2>
          <p className="text-slate-400 text-xs font-semibold mt-1">Manage your business network</p>
        </div>
        <div className="px-4 py-2 rounded-2xl text-indigo-600 border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 text-[10px] font-black tracking-widest uppercase">
          Your ID: {state.profile.id}
        </div>
      </div>

      <div className="card-pro bg-white dark:bg-slate-800/70 rounded-3xl p-7 space-y-5 border border-slate-100 dark:border-slate-700/60">
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white">{t.connect}</h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Enter a business ID to send connection request</p>
        </div>
        <div className="flex gap-4">
          <input type="text" value={searchId} onChange={e => setSearchId(e.target.value.toUpperCase())} className="input-pro flex-1 bg-slate-50 dark:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600/60 rounded-2xl p-4 font-bold dark:text-white" placeholder="Enter Business ID (e.g. MER-XXXX)" />
          <Button className="btn-glow" onClick={connectBusiness}><Plus /> Connect</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {state.connections.map(c => (
          <div key={c.id} className="card-pro bg-white dark:bg-slate-800/70 rounded-3xl p-5 flex items-center justify-between border border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl text-indigo-600 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)' }}>
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <p className="font-black text-slate-800 dark:text-white">{c.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{c.role} &bull; {c.businessId}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
              c.status === 'CONNECTED' ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20' : 'text-amber-700 bg-amber-50 dark:bg-amber-900/20'
            }`}>
              {c.status}
            </span>
          </div>
        ))}
        {state.connections.length === 0 && (
          <div className="col-span-2 text-center py-16 text-slate-400">
            <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)' }}>
              <Building2 className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="font-black text-lg">No connections yet</p>
            <p className="text-sm mt-1">Connect with suppliers and distributors above</p>
          </div>
        )}
      </div>
    </div>
  );
};

const PaymentsModule: React.FC<{ state: AppState, t: any }> = ({ state, t }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">{t.payments}</h2>
        <p className="text-slate-400 text-xs font-semibold mt-1">Manage your digital payments</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl p-8 text-white relative overflow-hidden space-y-8" style={{ background: 'linear-gradient(135deg, #312e81, #4f46e5, #7c3aed)', boxShadow: '0 20px 60px rgba(79,70,229,0.35)' }}>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 -mr-12 -mt-12" style={{ background: 'white' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10 -ml-8 -mb-8" style={{ background: 'white' }} />
          <div className="relative flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Digital Wallet</p>
              <p className="text-4xl font-black mt-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>₹ 12,450</p>
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-sm">
              <Smartphone className="w-6 h-6" />
            </div>
          </div>
          <div className="relative space-y-3">
            <Button fullWidth className="bg-white text-indigo-600 hover:bg-slate-50 font-black">Withdraw to Bank</Button>
            <Button fullWidth variant="ghost" className="text-white border border-white/20 hover:bg-white/10">View Transactions</Button>
          </div>
        </div>

        <div className="card-pro bg-white dark:bg-slate-800/70 rounded-3xl p-8 space-y-6 border border-slate-100 dark:border-slate-700/60">
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Accept Payments</h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Share your QR to receive instantly</p>
          </div>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="w-44 h-44 rounded-3xl p-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f0f4ff, #e9d5ff)', border: '3px solid rgba(99,102,241,0.15)' }}>
              <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest text-center leading-6">
                Scan to Pay<br/>{state.profile.shopName || 'Shop'}
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UPI ID: {state.profile.phone || '9876543210'}@upi</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const NearestStoresModule: React.FC<{ t: any }> = ({ t }) => {
  const stores = [
    { name: 'Rahul General Store', distance: '0.5 km', type: 'Retailer' },
    { name: 'Mumbai Electronics', distance: '1.2 km', type: 'Retailer' },
    { name: 'Ganesh Wholesalers', distance: '2.5 km', type: 'Distributor' }
  ];

  return (
    <div className="card-pro bg-white dark:bg-slate-800/70 rounded-3xl p-8 space-y-6 border border-slate-100 dark:border-slate-700/60">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl text-indigo-600 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)' }}>
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white">{t.nearestStore}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nearby businesses</p>
        </div>
      </div>
      <div className="space-y-3">
        {stores.map(s => (
          <div key={s.name} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center">
                <Store className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-white">{s.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.type}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-indigo-600">{s.distance}</p>
              <Button variant="ghost" className="p-0 h-auto text-[10px] font-black uppercase tracking-widest text-slate-400">Navigate <Navigation className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DistributorDashboard: React.FC<{ state: AppState, t: any }> = ({ state, t }) => (
  <div className="space-y-8">
    <RetailerDashboard state={state} t={t} />
    <NearestStoresModule t={t} />
  </div>
);

const ManufacturerDashboard: React.FC<{ state: AppState, t: any }> = ({ state, t }) => (
  <div className="space-y-8">
    <RetailerDashboard state={state} t={t} />
    <NearestStoresModule t={t} />
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
            <h1 className="text-4xl font-black text-slate-900 dark:text-white font-display mb-2" style={{ letterSpacing: '-0.03em' }}>Vyaparika</h1>
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
          <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display mb-2" style={{ letterSpacing: '-0.02em' }}>{t.signup}</h2>
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
