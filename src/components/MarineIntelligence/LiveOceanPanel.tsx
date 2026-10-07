import React from 'react';
import { 
  FiThermometer, 
  FiDroplet, 
  FiWind, 
  FiActivity, 
  FiRadio, 
  FiClock, 
  FiMapPin, 
  FiDatabase,
  FiAlertTriangle,
  FiSun,
  FiZap
} from 'react-icons/fi';
import { LiveOceanConditionsResponse } from '../../services/futureForecastService';

interface LiveOceanPanelProps {
  waterBody: string;
  data: LiveOceanConditionsResponse | null;
  isLoading: boolean;
}

export const LiveOceanPanel: React.FC<LiveOceanPanelProps> = ({ waterBody, data, isLoading }) => {
  if (isLoading && !data) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-[#D9E2E7] shadow-sm text-center">
        <FiActivity className="w-8 h-8 text-[#0F766E] animate-spin mx-auto mb-2" />
        <p className="text-xs font-bold text-[#0F2A3A]">Retrieving Live Operational Marine Telemetry...</p>
        <span className="text-[11px] text-[#5B7280]">Connecting to Open-Meteo Marine, Copernicus In-Situ & CMLRE Sensor Grid</span>
      </div>
    );
  }

  const metrics = data?.metrics || [];

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0A2540] to-[#0F766E] p-4 rounded-2xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-bold uppercase tracking-wider">LIVE OCEAN CONDITIONS</h3>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-mono font-bold">
              Latest Available
            </span>
          </div>
          <p className="text-xs text-white/80 mt-1 flex items-center gap-2">
            <FiMapPin className="w-3.5 h-3.5" />
            {data?.region_name || waterBody} ({data?.coordinates.lat.toFixed(2)}°N, {data?.coordinates.lon.toFixed(2)}°E)
            <span className="text-white/60">•</span>
            <FiClock className="w-3.5 h-3.5" />
            Updated: {data?.timestamp || 'Latest available'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto text-[11px] font-mono bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
          <FiRadio className="w-3.5 h-3.5 text-emerald-300" />
          <span>Latency: ~15 mins (Operational Satellite & In-Situ Assimilation)</span>
        </div>
      </div>

      {/* 12 Live Ocean Variables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {metrics.map((m) => {
          let IconComponent = FiActivity;
          let iconColor = 'text-[#0F766E]';
          let borderAccent = 'border-teal-200';

          if (m.key.includes('temp')) {
            IconComponent = FiThermometer;
            iconColor = 'text-red-500';
            borderAccent = 'border-red-100';
          } else if (m.key.includes('sal') || m.key.includes('sss')) {
            IconComponent = FiDroplet;
            iconColor = 'text-blue-500';
            borderAccent = 'border-blue-100';
          } else if (m.key.includes('wave') || m.key.includes('current')) {
            IconComponent = FiZap;
            iconColor = 'text-cyan-600';
            borderAccent = 'border-cyan-100';
          } else if (m.key.includes('wind')) {
            IconComponent = FiWind;
            iconColor = 'text-indigo-500';
            borderAccent = 'border-indigo-100';
          } else if (m.key.includes('mhw')) {
            IconComponent = FiAlertTriangle;
            iconColor = m.value.toString().includes('ACTIVE') ? 'text-amber-600' : 'text-emerald-600';
            borderAccent = m.value.toString().includes('ACTIVE') ? 'border-amber-300' : 'border-emerald-100';
          } else if (m.key.includes('oxygen')) {
            IconComponent = FiSun;
            iconColor = 'text-emerald-600';
            borderAccent = 'border-emerald-100';
          }

          return (
            <div 
              key={m.key} 
              className={`p-3.5 bg-white rounded-2xl border ${borderAccent} hover:border-[#0F766E] transition-all shadow-xs flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B7280]">
                    {m.label}
                  </span>
                  <IconComponent className={`w-4 h-4 ${iconColor}`} />
                </div>
                
                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-2xl font-bold font-mono text-[#0F2A3A]">
                    {m.value}
                  </span>
                  <span className="text-xs font-semibold text-[#5B7280]">
                    {m.unit}
                  </span>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-[#F1F5F7] space-y-1 text-[10px]">
                <div className="flex justify-between items-center text-[#5B7280]">
                  <span>Status:</span>
                  <span className="font-semibold text-[#0F2A3A] px-1.5 py-0.2 bg-[#EEF3F5] rounded">
                    {m.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#5B7280]">
                  <span>Source:</span>
                  <span className="font-mono text-[#0F766E] truncate max-w-[140px]" title={m.data_source}>
                    {m.data_source}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Data Age:</span>
                  <span>{m.data_age}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scientific Authenticity Guarantee Banner */}
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-[11px] text-emerald-950 font-medium">
        <span className="flex items-center gap-1.5">
          <FiDatabase className="w-3.5 h-3.5 text-emerald-700" />
          <strong>Scientific Provenance:</strong> Live conditions are ingested from Copernicus Marine & Open-Meteo operational feeds cross-referenced with CMLRE cruise CTD calibrations.
        </span>
        <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-300">
          OBSERVED / OPERATIONAL
        </span>
      </div>
    </div>
  );
};
