import React, { useEffect, useState } from 'react';

interface LoaderOverlayProps {
  visible: boolean;
  onFinish?: () => void;
  durationMs?: number;
}

const LoaderOverlay: React.FC<LoaderOverlayProps> = ({ visible, onFinish, durationMs = 1200 }) => {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (!visible) {
      setPercent(0);
      return;
    }
    let raf: number;
    const start = performance.now();
    const tick = (t: number) => {
      const elapsed = t - start;
      const p = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setPercent(p);
      if (elapsed < durationMs) {
        raf = requestAnimationFrame(tick);
      } else {
        onFinish && onFinish();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, durationMs, onFinish]);

  if (!visible) return null;

  const totalBars = 36;
  const filledBars = Math.round((percent / 100) * totalBars);

  return (
    <div className="fixed inset-0 z-[1000] bg-[#0F2A3A]/25 backdrop-blur-sm text-[#0F2A3A] flex items-center justify-center p-4">
      <div className="w-full max-w-xl p-8 bg-white rounded-3xl border border-[#D9E2E7] shadow-[0_4px_6px_-1px_rgba(15,42,58,0.07),0_12px_32px_rgba(15,42,58,0.09)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#0F766E] animate-ping" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#0F766E]">Telemetry Synchronizing</span>
          </div>
          <span className="text-xs font-mono text-[#5B7280]">Kadal AI-SYS-V2</span>
        </div>
        <div className="text-3xl font-bold tracking-tight text-[#0F2A3A] mb-1">Kadal AI</div>
        <div className="text-sm text-[#5B7280] mb-6 font-medium">Preparing marine spatial datasets & bathymetric models...</div>
        <div className="flex items-end justify-between mb-3">
          <div className="text-4xl font-bold font-mono text-[#0F766E] num-tabular">{percent}%</div>
          <div className="text-xs font-mono text-[#5B7280]">Oceanographic Gateway</div>
        </div>
        <div className="flex items-center gap-1.5 p-2 bg-[#EEF3F5] rounded-xl border border-[#D9E2E7] mb-2">
          {Array.from({ length: totalBars }).map((_, i) => (
            <div
              key={i}
              className={`h-7 flex-1 rounded-sm transition-all duration-150 ${
                i < filledBars 
                  ? 'bg-gradient-to-t from-[#0F766E] to-[#0369A1] shadow-sm' 
                  : 'bg-[#D9E2E7]/70'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between text-[11px] text-[#5B7280] mt-4 pt-4 border-t border-[#D9E2E7]">
          <span>Retrieval Engine: CMLRE Node</span>
          <span>Status: Active Pipeline</span>
        </div>
      </div>
    </div>
  );
};

export default LoaderOverlay;
