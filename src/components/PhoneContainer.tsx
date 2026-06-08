import React, { useState } from 'react';
import { Smartphone, Monitor } from 'lucide-react';

interface PhoneContainerProps {
  children: React.ReactNode;
}

export const PhoneContainer: React.FC<PhoneContainerProps> = ({ children }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="min-h-screen bg-[#E2E8F0] flex flex-col items-center justify-center p-0 md:p-6 transition-colors duration-300 font-sans selection:bg-electricTeal selection:text-white">
      {/* Control bar for desktop view */}
      <div className="hidden md:flex items-center justify-between w-full max-w-[400px] mb-4 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/80 shadow-sm">
        <span className="text-xs font-semibold text-deepNavy/70 flex items-center gap-1.5">
          <Smartphone size={14} className="text-electricTeal" /> Payvo Preview
        </span>
        <div className="flex gap-1 bg-deepNavy/5 p-0.5 rounded-full">
          <button
            onClick={() => setIsFullscreen(false)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 flex items-center gap-1 ${
              !isFullscreen
                ? 'bg-white text-deepNavy shadow-sm'
                : 'text-deepNavy/65 hover:text-deepNavy'
            }`}
          >
            <Smartphone size={12} /> Mobil
          </button>
          <button
            onClick={() => setIsFullscreen(true)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 flex items-center gap-1 ${
              isFullscreen
                ? 'bg-white text-deepNavy shadow-sm'
                : 'text-deepNavy/65 hover:text-deepNavy'
            }`}
          >
            <Monitor size={12} /> Helskärm
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div
        className={`w-full transition-all duration-500 ease-out relative ${
          isFullscreen
            ? 'max-w-full min-h-screen md:p-0'
            : 'max-w-full min-h-screen md:min-h-0 md:max-w-[400px] md:h-[840px] md:rounded-[48px] md:border-[10px] md:border-deepNavy md:shadow-2xl md:overflow-hidden'
        }`}
      >
        {/* Phone Speaker/Camera Notch (Only shown when framed) */}
        {!isFullscreen && (
          <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6 bg-deepNavy rounded-b-2xl z-50">
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/10 rounded-full"></div>
            <div className="absolute top-1 right-6 w-2.5 h-2.5 bg-white/10 rounded-full"></div>
          </div>
        )}

        {/* Inner Phone Screen */}
        <div className="w-full h-full min-h-screen md:min-h-[820px] bg-iceWhite flex flex-col relative overflow-hidden select-none">
          {/* Simulated Status Bar (Only in Framed Mobile View) */}
          {!isFullscreen && (
            <div className="hidden md:flex justify-between items-center px-6 pt-3 pb-2 text-[11px] font-bold text-deepNavy bg-white/30 backdrop-blur-md z-40 relative">
              <div>18:55</div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] tracking-tight opacity-75">Payvo Telia</span>
                {/* Simulated Signal Bars */}
                <div className="flex gap-0.5 items-end h-2">
                  <div className="w-[2px] h-[3px] bg-deepNavy rounded-xs"></div>
                  <div className="w-[2px] h-[5px] bg-deepNavy rounded-xs"></div>
                  <div className="w-[2px] h-[7px] bg-deepNavy rounded-xs"></div>
                  <div className="w-[2px] h-[9px] bg-deepNavy rounded-xs"></div>
                </div>
                {/* 5G icon */}
                <span className="text-[8px] leading-none">5G</span>
                {/* Battery icon */}
                <div className="w-5 h-2.5 border border-deepNavy/80 rounded-sm p-0.5 flex items-center justify-start">
                  <div className="w-full h-full bg-deepNavy rounded-2xs"></div>
                </div>
              </div>
            </div>
          )}

          {/* Child components render here */}
          <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
