import React, { useEffect, useRef } from 'react';
import { FiLogOut } from 'react-icons/fi';
import WorldMap from './ui/world-map';

const LandingPage: React.FC<{ onEnter: () => void; onVesselLogin: () => void; onLogout?: () => void; skipAnimations?: boolean }> = ({ onEnter, onVesselLogin, onLogout, skipAnimations = false }) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const vesselLoginRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (skipAnimations) {
      // Skip animations - make everything visible immediately
      const title = titleRef.current;
      const subtitle = subtitleRef.current;
      const cta = ctaRef.current;
      const vesselLogin = vesselLoginRef.current;

      if (title) {
        title.style.transform = 'translateY(0)';
        title.style.opacity = '1';
      }
      if (subtitle) {
        subtitle.style.transform = 'translateY(0)';
        subtitle.style.opacity = '1';
      }
      if (cta) {
        cta.style.transform = 'scale(1)';
        cta.style.opacity = '1';
      }
      if (vesselLogin) {
        vesselLogin.style.transform = 'scale(1)';
        vesselLogin.style.opacity = '1';
      }
      return;
    }

    const title = titleRef.current;
    const subtitle = subtitleRef.current;
    const cta = ctaRef.current;
    const vesselLogin = vesselLoginRef.current;

    if (!title || !subtitle || !cta || !vesselLogin) return;

    title.animate([
      { transform: 'translateY(20px)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ], { duration: 700, easing: 'ease-out', fill: 'forwards' });

    subtitle.animate([
      { transform: 'translateY(20px)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ], { duration: 600, delay: 300, easing: 'ease-out', fill: 'forwards' });

    cta.animate([
      { transform: 'scale(0.9)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 500, delay: 550, easing: 'ease-out', fill: 'forwards' });

    vesselLogin.animate([
      { transform: 'scale(0.9)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 500, delay: 700, easing: 'ease-out', fill: 'forwards' });
  }, [skipAnimations]);

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#0F2A3A] overflow-hidden relative flex flex-col justify-between selection:bg-[#0F766E]/20">
      {/* Dynamic Background World Map */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="h-full w-full">
          <WorldMap />
        </div>
      </div>

      {/* Ambient soft gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#0F766E]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#0369A1]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header / Logout Bar */}
      <div className="relative z-30 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#D9E2E7] bg-white shadow-sm">
            <img 
              src="/WhatsApp Image 2025-09-29 at 03.04.02.jpeg" 
              alt="Kadal AI Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-sm font-bold tracking-tight text-[#0F2A3A]">
            Kadal <span className="text-[#0F766E]">AI</span>
          </span>
        </div>

        {onLogout && (
          <button 
            onClick={onLogout}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all duration-150 text-xs font-semibold text-[#B91C1C] shadow-sm"
          >
            <FiLogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        )}
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center my-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E] text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse" />
          <span>CMLRE • Oceanographic Research Platform</span>
        </div>

        <h1 
          ref={titleRef} 
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-[#0F2A3A] mb-4" 
          style={{ transform: 'translateY(20px)', opacity: 0 }}
        >
          Kadal <span className="text-[#0F766E]">AI</span>
        </h1>

        <p 
          ref={subtitleRef} 
          className="mt-4 text-base md:text-xl text-[#5B7280] max-w-2xl mx-auto font-medium leading-relaxed" 
          style={{ transform: 'translateY(20px)', opacity: 0 }}
        >
          Spatio-temporal Analytics Gateway for Aquatic Resources
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            ref={ctaRef}
            onClick={onEnter}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#0F766E] text-white font-bold text-sm rounded-xl shadow-sm hover:bg-[#0B5F58] hover:shadow-md transition-all duration-150 transform hover:-translate-y-0.5 active:scale-95"
            style={{ transform: 'scale(0.9)', opacity: 0 }}
          >
            Enter Dashboard
          </button>
          <button
            ref={vesselLoginRef}
            onClick={onVesselLogin}
            className="w-full sm:w-auto px-8 py-3.5 bg-white text-[#0F766E] hover:text-[#0B5F58] border border-[#D9E2E7] hover:border-[#0F766E] font-bold text-sm rounded-xl shadow-paper hover:bg-[#F7F9FA] transition-all duration-150 transform hover:-translate-y-0.5 active:scale-95"
            style={{ transform: 'scale(0.9)', opacity: 0 }}
          >
            Vessel Login
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-[#5B7280] font-mono">
        Centre for Marine Living Resources and Ecology • Ministry of Earth Sciences
      </div>
    </div>
  );
};

export default LandingPage;


