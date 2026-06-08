import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Wallet } from 'lucide-react';
import { dbAPI } from '../db/dbClient';

interface LoginViewProps {
  onNavigate: (view: 'login' | 'register' | 'forgot' | 'dashboard' | 'add-bill' | 'settings') => void;
  onLoginSuccess: (userId: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('E-post och lösenord får inte vara tomma.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { user, error: loginError } = await dbAPI.auth.login(email, password);
      if (loginError) {
        setError(loginError);
      } else if (user) {
        onLoginSuccess(user.id);
        onNavigate('dashboard');
      }
    } catch (err) {
      setError('Ett fel uppstod vid inloggningen. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-gradient-to-b from-[#E0F7FA] via-white to-white px-6 pt-10 pb-6 min-h-full">
      {/* Branding Section */}
      <div className="flex flex-col items-center text-center mt-4">
        {/* Wallet Logo */}
        <div className="w-16 h-16 bg-deepNavy rounded-2xl flex items-center justify-center shadow-lg shadow-deepNavy/10 mb-4 transform hover:scale-105 transition-transform duration-200">
          <Wallet size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-deepNavy tracking-tight">Payvo</h1>
        <p className="text-[13px] text-deepNavy/70 mt-2 max-w-[280px] leading-relaxed">
          Hanteringen av dina räkningar har aldrig varit enklare eller snyggare.
        </p>
      </div>

      {/* Main Form Box */}
      <div className="bg-white/80 backdrop-blur-md border border-white/60 shadow-xl shadow-deepNavy/5 rounded-[32px] p-6 mt-8 flex-1 flex flex-col justify-center max-w-[360px] mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-[19px] font-bold text-deepNavy">Välkommen tillbaka</h2>
          <p className="text-xs text-deepNavy/50 mt-1">Logga in på ditt konto</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-overdueRed/10 border border-overdueRed/20 rounded-xl text-xs text-overdueRed font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-deepNavy uppercase tracking-wider">E-postadress</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-deepNavy/30 text-sm font-semibold">
                @
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="namn@exempel.se"
                className="w-full pl-9 pr-4 py-3 bg-iceWhite border border-deepNavy/5 rounded-xl text-sm text-deepNavy placeholder-deepNavy/30 focus:outline-none focus:ring-2 focus:ring-electricTeal/20 focus:border-electricTeal transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-deepNavy uppercase tracking-wider">Lösenord</label>
              <button
                type="button"
                onClick={() => onNavigate('forgot')}
                className="text-[11px] font-bold text-electricTeal hover:underline"
              >
                Glömt lösenord?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-deepNavy/30">
                <Lock size={15} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-3 bg-iceWhite border border-deepNavy/5 rounded-xl text-sm text-deepNavy placeholder-deepNavy/30 focus:outline-none focus:ring-2 focus:ring-electricTeal/20 focus:border-electricTeal transition-all duration-200"
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

          {/* Remember me Checkbox */}
          <div className="flex items-center space-x-2.5 pt-1">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-electricTeal focus:ring-electricTeal cursor-pointer"
            />
            <label htmlFor="remember" className="text-xs text-deepNavy/60 cursor-pointer font-medium select-none">
              Kom ihåg mig i 30 dagar
            </label>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-electricTeal hover:bg-electricTeal/90 text-white font-bold text-sm py-3.5 px-4 rounded-full shadow-lg shadow-electricTeal/20 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all duration-150 disabled:opacity-75 disabled:pointer-events-none"
            >
              {loading ? 'Loggar in...' : 'Logga in'} <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('register')}
              className="w-full bg-iceWhite hover:bg-deepNavy/5 text-deepNavy font-bold text-sm py-3.5 px-4 rounded-full border border-deepNavy/5 transition-all duration-150 active:scale-[0.98]"
            >
              Skapa konto
            </button>
          </div>
        </form>
      </div>

      {/* Security Footer */}
      <div className="flex flex-col items-center justify-center text-center mt-8 space-y-1">
        <ShieldCheck size={18} className="text-deepNavy/30" />
        <span className="text-[10px] text-deepNavy/40 font-medium tracking-wide uppercase">
          Säker kryptering genom BankID-standard
        </span>
      </div>
    </div>
  );
};
