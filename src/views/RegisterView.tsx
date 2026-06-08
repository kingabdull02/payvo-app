import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { dbAPI } from '../db/dbClient';

interface RegisterViewProps {
  onNavigate: (view: 'login' | 'register' | 'forgot' | 'dashboard' | 'add-bill' | 'settings') => void;
  onLoginSuccess: (userId: string) => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onNavigate, onLoginSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Namn får inte vara tomt.');
      return;
    }
    if (!email.trim()) {
      setError('E-postadress får inte vara tom.');
      return;
    }
    if (password.length < 8) {
      setError('Lösenordet måste vara minst 8 tecken.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte.');
      return;
    }

    setLoading(true);

    try {
      const { user, error: regError } = await dbAPI.auth.register(email, password, name);
      if (regError) {
        setError(regError);
      } else if (user) {
        onLoginSuccess(user.id);
        onNavigate('dashboard');
      }
    } catch (err) {
      setError('Konto-registreringen misslyckades. Vänligen försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-gradient-to-b from-[#E0F7FA] via-white to-white px-6 pt-10 pb-6 min-h-full">
      {/* Branding Header */}
      <div className="flex flex-col items-center text-center mt-4">
        <h1 className="text-2xl font-extrabold text-deepNavy tracking-tight">Payvo</h1>
        <p className="text-[13px] text-deepNavy/70 mt-1 max-w-[280px] font-semibold leading-relaxed">
          Börja spara tid
        </p>
      </div>

      {/* Main Registration Box */}
      <div className="bg-white/80 backdrop-blur-md border border-white/60 shadow-xl shadow-deepNavy/5 rounded-[32px] p-6 mt-6 flex-1 flex flex-col justify-center max-w-[360px] mx-auto w-full">
        {error && (
          <div className="mb-4 p-3 bg-overdueRed/10 border border-overdueRed/20 rounded-xl text-xs text-overdueRed font-medium animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-deepNavy uppercase tracking-wider">Namn</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ditt fullständiga namn"
              className="w-full px-4 py-3 bg-iceWhite border border-deepNavy/5 rounded-xl text-sm text-deepNavy placeholder-deepNavy/30 focus:outline-none focus:ring-2 focus:ring-electricTeal/20 focus:border-electricTeal transition-all duration-200"
              required
            />
          </div>

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-deepNavy uppercase tracking-wider">E-postadress</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="namn@exempel.se"
              className="w-full px-4 py-3 bg-iceWhite border border-deepNavy/5 rounded-xl text-sm text-deepNavy placeholder-deepNavy/30 focus:outline-none focus:ring-2 focus:ring-electricTeal/20 focus:border-electricTeal transition-all duration-200"
              required
            />
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-deepNavy uppercase tracking-wider">Lösenord</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minst 8 tecken"
                className="w-full pl-4 pr-10 py-3 bg-iceWhite border border-deepNavy/5 rounded-xl text-sm text-deepNavy placeholder-deepNavy/30 focus:outline-none focus:ring-2 focus:ring-electricTeal/20 focus:border-electricTeal transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-deepNavy/30 hover:text-deepNavy/60"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm Password input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-deepNavy uppercase tracking-wider">Bekräfta lösenord</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Upprepa ditt lösenord"
              className="w-full px-4 py-3 bg-iceWhite border border-deepNavy/5 rounded-xl text-sm text-deepNavy placeholder-deepNavy/30 focus:outline-none focus:ring-2 focus:ring-electricTeal/20 focus:border-electricTeal transition-all duration-200"
              required
            />
          </div>

          {/* Register Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-electricTeal hover:bg-electricTeal/90 text-white font-bold text-sm py-3.5 px-4 rounded-full shadow-lg shadow-electricTeal/20 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all duration-150 disabled:opacity-75 disabled:pointer-events-none"
            >
              {loading ? 'Skapar konto...' : 'Skapa konto'} <ArrowRight size={16} />
            </button>
          </div>

          {/* Divider ELLER */}
          <div className="flex items-center justify-center my-4">
            <div className="flex-1 border-t border-deepNavy/5"></div>
            <span className="px-3 text-[10px] font-bold tracking-widest text-deepNavy/30">ELLER</span>
            <div className="flex-1 border-t border-deepNavy/5"></div>
          </div>

          {/* Navigation link */}
          <p className="text-center text-xs text-deepNavy/60 font-medium">
            Har du redan ett konto?{' '}
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="text-electricTeal font-bold hover:underline"
            >
              Logga in
            </button>
          </p>
        </form>
      </div>

      {/* Terms and Policies agreement */}
      <div className="mt-8 text-center max-w-[280px] mx-auto">
        <p className="text-[9px] text-deepNavy/40 leading-relaxed font-semibold">
          Genom att skapa ett konto godkänner du våra{' '}
          <a href="#" className="underline hover:text-deepNavy/60">villkor</a> och vår{' '}
          <a href="#" className="underline hover:text-deepNavy/60">integritetspolicy</a>.
        </p>
      </div>
    </div>
  );
};
