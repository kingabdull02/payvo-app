import React, { useState } from 'react';
import { Mail, Key, ArrowRight, ArrowLeft } from 'lucide-react';
import { dbAPI } from '../db/dbClient';
import type { ViewState } from '../types';

interface ForgotViewProps {
  onNavigate: (view: ViewState) => void;
}

export const ForgotView: React.FC<ForgotViewProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('E-postadress får inte vara tom.');
      return;
    }

    setLoading(true);

    try {
      const { success: resetSuccess, error: resetError } = await dbAPI.auth.requestPasswordReset(email);
      if (resetError) {
        setError(resetError);
      } else if (resetSuccess) {
        setSuccess(true);
      }
    } catch (err) {
      setError('Ett fel uppstod. Vänligen försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-gradient-to-b from-[#E0F7FA] via-white to-white px-6 pt-10 pb-6 min-h-full">
      {/* Branding Header */}
      <div className="flex flex-col items-center text-center mt-4">
        <h1 className="text-2xl font-extrabold text-deepNavy tracking-tight">Payvo</h1>
        
        {/* Key icon badge */}
        <div className="w-12 h-12 bg-[#E0F7FA] rounded-full flex items-center justify-center mt-4 text-electricTeal shadow-sm">
          <Key size={22} className="transform -rotate-45" />
        </div>
      </div>

      {/* Recovery Card */}
      <div className="bg-white/80 backdrop-blur-md border border-white/60 shadow-xl shadow-deepNavy/5 rounded-[32px] p-6 mt-6 flex-1 flex flex-col justify-center max-w-[360px] mx-auto w-full">
        {!success ? (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-[19px] font-bold text-deepNavy">Glömt lösenord?</h2>
              <p className="text-xs text-deepNavy/60 mt-2 leading-relaxed">
                Ingen fara! Ange din e-postadress nedan så skickar vi en länk för att återställa ditt konto.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-overdueRed/10 border border-overdueRed/20 rounded-xl text-xs text-overdueRed font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-deepNavy uppercase tracking-wider">E-postadress</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-deepNavy/35">
                    <Mail size={16} />
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

              {/* Submit Action */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-electricTeal hover:bg-electricTeal/90 text-white font-bold text-sm py-3.5 px-4 rounded-full shadow-lg shadow-electricTeal/20 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all duration-150 disabled:opacity-75 disabled:pointer-events-none"
              >
                {loading ? 'Skickar...' : 'Skicka länk'} <ArrowRight size={16} />
              </button>

              {/* Back to Login Link */}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-deepNavy/60 font-bold hover:text-deepNavy/90 transition-colors pt-2"
              >
                <ArrowLeft size={13} /> Tillbaka till inloggning
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-6 space-y-4">
            <h3 className="text-lg font-bold text-deepNavy">Länk skickad!</h3>
            <p className="text-xs text-deepNavy/60 leading-relaxed px-2">
              Vi har skickat en återställningslänk till <strong>{email}</strong>. Kontrollera din skräppost om du inte ser den inom några minuter.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="w-full bg-electricTeal hover:bg-electricTeal/90 text-white font-bold text-sm py-3.5 px-4 rounded-full shadow-md active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-1.5"
            >
              Tillbaka till logga in
            </button>
          </div>
        )}
      </div>

      {/* Safety Notice Footer */}
      <div className="mt-8 text-center">
        <span className="text-[10px] text-deepNavy/30 font-bold tracking-widest uppercase">
          SÄKER BETALNINGSHANTERING
        </span>
      </div>
    </div>
  );
};
