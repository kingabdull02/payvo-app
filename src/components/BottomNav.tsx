import React from 'react';
import { Calendar, Plus, Settings } from 'lucide-react';
import type { ViewState } from '../types';

interface BottomNavProps {
  /** Which view is currently active — determines highlight colour. */
  activeView: ViewState;
  onNavigate: (view: ViewState) => void;
  /** Called when the centre + button is tapped. */
  onAddBill: () => void;
}

/**
 * Shared bottom navigation bar used on Dashboard and Settings.
 * Highlights the active tab with Electric Teal; inactive tabs are muted.
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  activeView,
  onNavigate,
  onAddBill,
}) => {
  const activeClass = 'text-electricTeal';
  const inactiveClass = 'text-deepNavy/40 hover:text-deepNavy/70';

  return (
    <div className="absolute bottom-0 inset-x-0 bg-white/70 backdrop-blur-lg border-t border-deepNavy/5 py-3 px-6 flex justify-around items-center z-40">
      {/* Översikt */}
      <button
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center gap-1 active:scale-95 transition-transform ${
          activeView === 'dashboard' ? activeClass : inactiveClass
        }`}
      >
        <Calendar size={20} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Översikt</span>
      </button>

      {/* Add Bill (floating centre button) */}
      <button
        onClick={onAddBill}
        className="w-12 h-12 bg-deepNavy hover:bg-deepNavy/90 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform -translate-y-2 border-4 border-iceWhite"
      >
        <Plus size={24} />
      </button>

      {/* Inställningar */}
      <button
        onClick={() => onNavigate('settings')}
        className={`flex flex-col items-center gap-1 active:scale-95 transition-transform ${
          activeView === 'settings' ? activeClass : inactiveClass
        }`}
      >
        <Settings size={20} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Inställningar</span>
      </button>
    </div>
  );
};
