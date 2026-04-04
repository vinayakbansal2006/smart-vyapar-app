import React, { useState } from 'react';
import {
  ArrowLeft, Star, CheckCircle, Shield, Lock, CreditCard,
  Building2, Smartphone, Wallet, Loader2, Sparkles, Crown,
  Zap, BarChart3, Package, Users, HeadphonesIcon
} from 'lucide-react';

interface PremiumPaymentPageProps {
  onBack: () => void;
  onSuccess: (plan: 'monthly' | 'yearly') => void;
  currentPlan?: 'monthly' | 'yearly';
  isPremium?: boolean;
}

type PaymentMethod = 'card' | 'netbanking' | 'upi' | 'wallet';
type FlowState = 'select' | 'processing' | 'success' | 'failure';

const PLANS = {
  monthly: { label: 'Monthly', price: 499, period: '/month', save: '' },
  yearly: { label: 'Yearly', price: 3999, period: '/year', save: 'Save 33%' },
};

const FEATURES = [
  { icon: HeadphonesIcon, label: 'Priority Customer Support', desc: '24/7 dedicated assistance' },
  { icon: BarChart3, label: 'Advanced Analytics Pro', desc: 'Deep business insights & reports' },
  { icon: Package, label: 'Bulk Inventory Export', desc: 'Export to CSV, Excel & PDF' },
  { icon: Sparkles, label: 'Ad Campaign Manager', desc: 'Promote products to retailers' },
  { icon: Shield, label: 'Verified Business Badge', desc: 'Build trust with partners' },
  { icon: Users, label: 'Unlimited Connections', desc: 'No cap on network growth' },
];

const PremiumPaymentPage: React.FC<PremiumPaymentPageProps> = ({ onBack, onSuccess, isPremium }) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [flowState, setFlowState] = useState<FlowState>('select');

  // Card form
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // UPI
  const [upiId, setUpiId] = useState('');

  // Net Banking
  const [selectedBank, setSelectedBank] = useState('');

  // Wallet
  const [selectedWallet, setSelectedWallet] = useState('');

  const plan = PLANS[selectedPlan];
  const gst = Math.round(plan.price * 0.18);
  const total = plan.price + gst;

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const isFormValid = () => {
    if (paymentMethod === 'card') return cardNumber.replace(/\s/g, '').length === 16 && cardExpiry.length >= 5 && cardCvv.length >= 3 && cardName.length > 2;
    if (paymentMethod === 'upi') return upiId.includes('@');
    if (paymentMethod === 'netbanking') return selectedBank.length > 0;
    if (paymentMethod === 'wallet') return selectedWallet.length > 0;
    return false;
  };

  const handlePay = () => {
    setFlowState('processing');
    setTimeout(() => {
      setFlowState('success');
      onSuccess(selectedPlan);
    }, 2500);
  };

  // ═══════════════════════════════════════
  // SUCCESS SCREEN
  // ═══════════════════════════════════════
  if (flowState === 'success') {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="relative w-28 h-28 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'linear-gradient(135deg, #f59e0b, #eab308)' }} />
          <div className="relative w-28 h-28 rounded-full flex items-center justify-center shadow-2xl"
               style={{ background: 'linear-gradient(135deg, #f59e0b, #eab308)', boxShadow: '0 8px 40px rgba(245,158,11,0.4)' }}>
            <Crown className="w-14 h-14 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3">You're Premium! 🎉</h1>
        <p className="text-base font-semibold text-slate-500 dark:text-slate-400 mb-2">
          Your <span className="text-amber-600 dark:text-amber-400 font-black">{PLANS[selectedPlan].label}</span> plan is now active.
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mb-10">
          Amount paid: <span className="font-black">₹{total}</span> (incl. GST)
        </p>

        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10 p-6 mb-8">
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-3">What's unlocked for you:</p>
          <div className="grid grid-cols-2 gap-3 text-left">
            {FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={onBack}
          className="w-full py-4 rounded-2xl font-black text-base text-white transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 8px 30px rgba(79,70,229,0.35)' }}>
          <Sparkles className="w-5 h-5 inline mr-2" /> Go to Dashboard
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // PROCESSING SCREEN
  // ═══════════════════════════════════════
  if (flowState === 'processing') {
    return (
      <div className="max-w-lg mx-auto text-center py-24 px-6 animate-in fade-in duration-300">
        <div className="w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center"
             style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 8px 40px rgba(79,70,229,0.35)' }}>
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Processing Payment...</h2>
        <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">Please wait while we securely process your payment.</p>
        <div className="flex items-center justify-center gap-2 mt-6 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <Lock className="w-3.5 h-3.5" /> 256-bit SSL Encrypted
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // MAIN PAYMENT DASHBOARD
  // ═══════════════════════════════════════
  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-6 transition-colors active:scale-95">
        <ArrowLeft className="w-4 h-4" /> Back to Profile
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
             style={{ background: 'linear-gradient(135deg, #f59e0b, #eab308)', boxShadow: '0 6px 24px rgba(245,158,11,0.3)' }}>
          <Crown className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Upgrade to Premium</h1>
          <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">Unlock powerful tools for your manufacturing business</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN — Plan + Payment */}
        <div className="lg:col-span-2 space-y-8">

          {/* ── PLAN SELECTION ── */}
          <div>
            <h2 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Choose Your Plan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['monthly', 'yearly'] as const).map(planKey => {
                const p = PLANS[planKey];
                const isSelected = selectedPlan === planKey;
                return (
                  <button key={planKey} onClick={() => setSelectedPlan(planKey)}
                    className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.98] ${
                      isSelected
                        ? 'border-amber-400 dark:border-amber-500 shadow-lg'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                    style={isSelected ? { background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(234,179,8,0.04))', boxShadow: '0 8px 30px rgba(245,158,11,0.12)' } : {}}>
                    {p.save && (
                      <span className="absolute -top-3 right-4 px-3 py-1 rounded-full text-[10px] font-black text-white"
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                        {p.save}
                      </span>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'border-amber-500 bg-amber-500' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className="text-base font-black text-slate-900 dark:text-white">{p.label}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">₹{p.price}</span>
                      <span className="text-sm font-bold text-slate-400">{p.period}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── FEATURES ── */}
          <div>
            <h2 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">What You Get</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURES.map(f => (
                <div key={f.label} className="flex items-start gap-3 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/40 transition-colors hover:border-amber-200 dark:hover:border-amber-800/40">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background: 'rgba(245,158,11,0.1)' }}>
                    <f.icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 dark:text-white">{f.label}</p>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── PAYMENT METHOD ── */}
          <div>
            <h2 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Payment Method</h2>
            
            {/* Method Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
              {([
                { id: 'card' as PaymentMethod, icon: CreditCard, label: 'Card' },
                { id: 'netbanking' as PaymentMethod, icon: Building2, label: 'Net Banking' },
                { id: 'upi' as PaymentMethod, icon: Smartphone, label: 'UPI' },
                { id: 'wallet' as PaymentMethod, icon: Wallet, label: 'Wallet' },
              ]).map(m => (
                <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                    paymentMethod === m.id
                      ? 'text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  style={paymentMethod === m.id ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' } : {}}>
                  <m.icon className="w-4 h-4" /> {m.label}
                </button>
              ))}
            </div>

            {/* Card Form */}
            {paymentMethod === 'card' && (
              <div className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-800/40">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cardholder Name</label>
                  <input type="text" value={cardName} onChange={e => setCardName(e.target.value)} placeholder="John Doe"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Card Number</label>
                  <input type="text" value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} placeholder="4242 4242 4242 4242"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono tracking-wider" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Expiry</label>
                    <input type="text" value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} placeholder="MM/YY"
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">CVV</label>
                    <input type="password" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="•••"
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono" />
                  </div>
                </div>
              </div>
            )}

            {/* Net Banking */}
            {paymentMethod === 'netbanking' && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-800/40">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Select Your Bank</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB'].map(bank => (
                    <button key={bank} onClick={() => setSelectedBank(bank)}
                      className={`p-4 rounded-xl border-2 text-sm font-bold transition-all ${
                        selectedBank === bank
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}>
                      🏦 {bank}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* UPI */}
            {paymentMethod === 'upi' && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-800/40">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">UPI ID</label>
                <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                <p className="text-xs text-slate-400 mt-2 font-semibold">Enter your UPI ID (e.g., name@okaxis, name@ybl)</p>
              </div>
            )}

            {/* Wallet */}
            {paymentMethod === 'wallet' && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-800/40">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Select Wallet</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['Paytm', 'PhonePe', 'Amazon Pay', 'Freecharge', 'MobiKwik', 'JioMoney'].map(w => (
                    <button key={w} onClick={() => setSelectedWallet(w)}
                      className={`p-4 rounded-xl border-2 text-sm font-bold transition-all ${
                        selectedWallet === w
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}>
                      📱 {w}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            {/* Order Summary Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-5">Order Summary</h3>
              
              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Premium {plan.label}</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">₹{plan.price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">GST (18%)</span>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">₹{gst}</span>
                </div>
                <hr className="border-slate-200 dark:border-slate-700" />
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-slate-900 dark:text-white">Total</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">₹{total}</span>
                </div>
              </div>

              <button onClick={handlePay} disabled={!isFormValid()}
                className="w-full py-4 rounded-2xl font-black text-base text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: isFormValid() ? '0 8px 30px rgba(245,158,11,0.35)' : 'none' }}>
                <Lock className="w-4 h-4 inline mr-2" /> Pay ₹{total}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-5">
              <div className="space-y-3">
                {[
                  { icon: Lock, label: '256-bit SSL Encrypted', color: 'text-emerald-500' },
                  { icon: Shield, label: 'Secure Payment Gateway', color: 'text-blue-500' },
                  { icon: CheckCircle, label: '100% Refund Policy', color: 'text-amber-500' },
                ].map(b => (
                  <div key={b.label} className="flex items-center gap-3">
                    <b.icon className={`w-4 h-4 ${b.color} shrink-0`} />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPaymentPage;
