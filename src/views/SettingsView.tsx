import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  LogOut,
  Edit2,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { dbAPI } from '../db/dbClient';
import type { Profile } from '../db/dbClient';
import { Avatar } from '../components/Avatar';
import { BottomNav } from '../components/BottomNav';
import confetti from 'canvas-confetti';
import type { ViewState } from '../types';

interface SettingsViewProps {
  userId: string;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ userId, onNavigate, onLogout }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form edit states
  const [showEditName, setShowEditName] = useState(false);
  const [editName, setEditName] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState(false);

  // Stripe Mock Modal
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [isStripeProcessing, setIsStripeProcessing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const p = await dbAPI.profile.get(userId);
      setProfile(p);
      if (p) {
        setEditName(p.name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Email Notifications
  const handleToggleNotifications = async () => {
    if (!profile) return;
    if (!profile.is_premium) {
      setShowStripeModal(true); // Lock behind premium
      return;
    }

    try {
      const nextVal = !profile.email_notifications;
      const updated = await dbAPI.profile.update(userId, { email_notifications: nextVal });
      if (updated) setProfile(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // Change Reminder Days
  const handleChangeReminderDays = async (days: number) => {
    if (!profile) return;
    if (!profile.is_premium) {
      setShowStripeModal(true);
      return;
    }

    try {
      const updated = await dbAPI.profile.update(userId, { reminder_days: days });
      if (updated) setProfile(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // Save Name Profile
  const handleSaveName = async () => {
    if (!editName.trim()) return;
    try {
      const updated = await dbAPI.profile.update(userId, { name: editName });
      if (updated) {
        setProfile(updated);
        setShowEditName(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(false);

    if (newPassword.length < 8) {
      setPwdError('Lösenordet måste vara minst 8 tecken.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Lösenorden matchar inte.');
      return;
    }

    // In local simulation, just succeed
    setPwdSuccess(true);
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setShowEditPassword(false);
      setPwdSuccess(false);
    }, 2000);
  };

  // Stripe Mock Payment Submit
  const handleStripePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStripeProcessing(true);

    // Simulate API delay
    setTimeout(async () => {
      try {
        const updated = await dbAPI.profile.update(userId, { is_premium: true });
        if (updated) {
          setProfile(updated);
          setShowStripeModal(false);
          // Play celebratory sound or confetti
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.5 }
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsStripeProcessing(false);
      }
    }, 1500);
  };

  const handleLogoutClick = async () => {
    await dbAPI.auth.logout();
    onLogout();
    onNavigate('login');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-iceWhite">
        <p className="text-xs text-deepNavy/50 font-bold">Laddar inställningar...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between pb-safe relative h-full">
      {/* Settings Scrollable Panel */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-extrabold text-deepNavy flex items-center gap-2">
            Inställningar
          </h1>
          <Avatar
            name={profile?.name}
            avatarUrl={profile?.avatar_url}
            size="sm"
            className="border border-deepNavy/5 shadow-sm"
          />
        </div>

        {/* Profile Card Info */}
        <div className="bg-white/70 border border-deepNavy/5 shadow-sm rounded-3xl p-5 flex flex-col items-center text-center relative">
          <div className="relative">
            <Avatar
              name={profile?.name}
              avatarUrl={profile?.avatar_url}
              size="lg"
              className="border-4 border-white shadow-md"
            />
            <button
              onClick={() => setShowEditName(!showEditName)}
              className="absolute bottom-0 right-0 w-7 h-7 bg-[#00C2D1] text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm active:scale-90 transition-transform"
            >
              <Edit2 size={12} />
            </button>
          </div>

          <div className="mt-3">
            {showEditName ? (
              <div className="flex gap-1.5 justify-center items-center mt-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="px-3 py-1 bg-iceWhite border border-deepNavy/10 rounded-lg text-xs font-bold text-deepNavy focus:outline-none focus:border-electricTeal max-w-[120px]"
                />
                <button
                  onClick={handleSaveName}
                  className="bg-electricTeal text-white text-[10px] font-bold px-2 py-1 rounded-md"
                >
                  Spara
                </button>
              </div>
            ) : (
              <h2 className="text-base font-extrabold text-deepNavy">{profile?.name}</h2>
            )}
            <p className="text-[11px] text-deepNavy/40 font-semibold mt-0.5">
              {profile?.is_premium ? '★ Premium-medlem' : 'Gratis-medlem'}
            </p>
          </div>
        </div>

        {/* SUBSCRIPTION CARD */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-deepNavy/40 uppercase tracking-widest pl-1">PRENUMERATION</span>
          {profile?.is_premium ? (
            <div className="bg-white border border-deepNavy/5 shadow-sm rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-extrabold text-deepNavy">Payvo Premium</h4>
                  <p className="text-[10px] text-deepNavy/50 mt-0.5">19 kr/månad • Förnyas 12 dec</p>
                </div>
                <span className="text-[9px] bg-electricTeal/15 text-electricTeal px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Aktiv
                </span>
              </div>
              <button
                onClick={() => alert('Mock: Hantering sker via Stripe Kundportal i produktion.')}
                className="w-full flex justify-between items-center pt-2.5 border-t border-deepNavy/5 text-xs text-deepNavy/70 font-semibold hover:text-deepNavy"
              >
                <span>Hantera prenumeration</span>
                <ExternalLink size={14} className="text-deepNavy/40" />
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-deepNavy to-[#1F2E3D] text-white rounded-2xl p-5 shadow-md space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={16} className="text-electricTeal animate-pulse" />
                  <h4 className="text-sm font-bold tracking-tight">Skaffa Payvo Premium</h4>
                </div>
                <p className="text-[10px] text-white/70 leading-relaxed">
                  Lås upp obegränsade fakturor, e-postpåminnelser och full månadshistorik för bara 19 kr/mån.
                </p>
              </div>
              <button
                onClick={() => setShowStripeModal(true)}
                className="w-full bg-electricTeal hover:bg-electricTeal/90 text-white font-bold text-xs py-2.5 rounded-full shadow-md transition-all active:scale-95 flex items-center justify-center gap-1"
              >
                Uppgradera nu
              </button>
            </div>
          )}
        </div>

        {/* ACCOUNT SETTINGS CARD */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-deepNavy/40 uppercase tracking-widest pl-1">KONTO</span>
          <div className="bg-white border border-deepNavy/5 shadow-sm rounded-2xl overflow-hidden divide-y divide-deepNavy/5">
            {/* Profil edit name */}
            <button
              onClick={() => setShowEditName(!showEditName)}
              className="w-full flex items-center justify-between p-4 text-xs font-semibold text-deepNavy hover:bg-iceWhite/30 text-left transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <span className="w-7 h-7 bg-deepNavy/5 rounded-lg flex items-center justify-center text-deepNavy/65">
                  <User size={15} />
                </span>
                Profil
              </span>
              <ChevronRight size={15} className="text-deepNavy/30" />
            </button>

            {/* Change Password option */}
            <button
              onClick={() => setShowEditPassword(!showEditPassword)}
              className="w-full flex items-center justify-between p-4 text-xs font-semibold text-deepNavy hover:bg-iceWhite/30 text-left transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <span className="w-7 h-7 bg-deepNavy/5 rounded-lg flex items-center justify-center text-deepNavy/65">
                  <Lock size={15} />
                </span>
                Byt lösenord
              </span>
              <ChevronRight size={15} className="text-deepNavy/30" />
            </button>
          </div>
        </div>

        {/* NOTIFICATIONS SETTINGS CARD */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-deepNavy/40 uppercase tracking-widest pl-1">AVISERINGAR</span>
          <div className="bg-white border border-deepNavy/5 shadow-sm rounded-2xl p-4 space-y-4">
            {/* Toggle switch */}
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-deepNavy flex items-center gap-1.5">
                  E-postpåminnelser
                  {!profile?.is_premium && <Lock size={11} className="text-deepNavy/30" />}
                </span>
                <span className="block text-[10px] text-deepNavy/40 leading-relaxed font-semibold">
                  Få notiser om kommande fakturor
                </span>
              </div>

              {/* Checked toggle button */}
              <button
                type="button"
                onClick={handleToggleNotifications}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${profile?.email_notifications && profile?.is_premium
                  ? 'bg-electricTeal'
                  : 'bg-deepNavy/10'
                  }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${profile?.email_notifications && profile?.is_premium ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            {/* Days selection drop down */}
            <div className="pt-3 border-t border-deepNavy/5 flex justify-between items-center">
              <span className="text-xs font-bold text-deepNavy flex items-center gap-1.5">
                Påminn mig X dagar innan
                {!profile?.is_premium && <Lock size={11} className="text-deepNavy/30" />}
              </span>

              <select
                disabled={!profile?.is_premium}
                value={profile?.reminder_days || 3}
                onChange={(e) => handleChangeReminderDays(parseInt(e.target.value, 10))}
                className={`px-3 py-1.5 bg-iceWhite border border-deepNavy/5 rounded-xl text-xs font-bold text-deepNavy focus:outline-none focus:ring-1 focus:ring-electricTeal/50 ${!profile?.is_premium ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
              >
                <option value={1}>1 dag innan</option>
                <option value={3}>3 dagar innan</option>
                <option value={7}>7 dagar innan</option>
              </select>
            </div>
          </div>
        </div>

        {/* LOGOUT BUTTON */}
        <div className="pt-2">
          <button
            onClick={handleLogoutClick}
            className="w-full bg-black text-white font-bold text-sm py-3 px-4 rounded-full shadow-lg shadow-black/10 flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-black/90"
          >
            <LogOut size={16} /> Logga ut
          </button>
        </div>
      </div>

      <BottomNav
        activeView="settings"
        onNavigate={onNavigate}
        onAddBill={() => onNavigate('add-bill')}
      />

      {/* INLINE EDIT PASSWORD DRAWER MODAL */}
      {showEditPassword && (
        <div className="absolute inset-0 bg-deepNavy/60 backdrop-blur-xs flex items-end justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-t-[32px] rounded-b-[24px] w-full max-w-[360px] p-6 space-y-4 shadow-2xl animate-slide-up border border-deepNavy/5">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-deepNavy">Byt lösenord</h3>
              <button
                onClick={() => setShowEditPassword(false)}
                className="w-8 h-8 rounded-full bg-iceWhite flex items-center justify-center text-deepNavy/50"
              >
                ✕
              </button>
            </div>

            {pwdError && (
              <div className="p-3 bg-overdueRed/10 border border-overdueRed/25 rounded-xl text-xs text-overdueRed font-medium">
                {pwdError}
              </div>
            )}

            {pwdSuccess && (
              <div className="p-3 bg-electricTeal/10 border border-electricTeal/25 rounded-xl text-xs text-electricTeal font-medium">
                Lösenordet uppdaterades framgångsrikt!
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-deepNavy/50 uppercase tracking-wider">Nytt lösenord</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minst 8 tecken"
                  className="w-full px-4 py-3 bg-iceWhite border border-deepNavy/5 rounded-xl text-sm focus:outline-none focus:border-electricTeal"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-deepNavy/50 uppercase tracking-wider">Bekräfta lösenord</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Upprepa nytt lösenord"
                  className="w-full px-4 py-3 bg-iceWhite border border-deepNavy/5 rounded-xl text-sm focus:outline-none focus:border-electricTeal"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-deepNavy text-white font-bold text-xs py-3 rounded-full shadow-md"
              >
                Uppdatera lösenord
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STRIPE MOCK POPUP GATEWAY */}
      {showStripeModal && (
        <div className="absolute inset-0 bg-deepNavy/70 backdrop-blur-xs flex items-center justify-center z-50 p-5">
          <div className="bg-[#F8F9FA] rounded-[30px] w-full max-w-[320px] overflow-hidden shadow-2xl border border-black/5 animate-scale-up">
            {/* Stripe Header */}
            <div className="bg-[#635BFF] text-white px-5 py-4 flex justify-between items-center">
              <span className="text-sm font-extrabold flex items-center gap-1">
                <CreditCard size={15} /> stripe
              </span>
              <button
                onClick={() => setShowStripeModal(false)}
                className="text-white/80 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Stripe body */}
            <form onSubmit={handleStripePayment} className="p-5 space-y-4">
              <div className="text-center space-y-1 mb-2">
                <h3 className="text-xs text-deepNavy/40 font-bold uppercase tracking-widest">Abonnemang</h3>
                <h2 className="text-lg font-black text-deepNavy">Payvo Premium</h2>
                <div className="text-base font-extrabold text-[#635BFF]">19,00 kr / månad</div>
              </div>

              {/* Card info inputs */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-deepNavy/50 uppercase tracking-wider">Kortnummer</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-deepNavy/10 rounded-lg text-xs font-semibold text-deepNavy focus:outline-none focus:border-[#635BFF]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-deepNavy/50 uppercase tracking-wider">Utgångsdatum</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/ÅÅ"
                      className="w-full px-3 py-2 bg-white border border-deepNavy/10 rounded-lg text-xs font-semibold text-deepNavy focus:outline-none focus:border-[#635BFF] text-center"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-deepNavy/50 uppercase tracking-wider">CVC</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="123"
                      className="w-full px-3 py-2 bg-white border border-deepNavy/10 rounded-lg text-xs font-semibold text-deepNavy focus:outline-none focus:border-[#635BFF] text-center"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Security notice */}
              <div className="flex items-center justify-center gap-1 text-[9px] text-deepNavy/40 font-semibold text-center">
                <ShieldCheck size={12} className="text-emerald-500" /> Säkrad krypterad överföring
              </div>

              {/* Pay button */}
              <button
                type="submit"
                disabled={isStripeProcessing}
                className="w-full bg-[#635BFF] hover:bg-[#564EDB] text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none"
              >
                {isStripeProcessing ? 'Behandlar betalning...' : 'Betala 19,00 kr'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
