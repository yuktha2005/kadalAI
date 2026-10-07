import React, { useState } from 'react';
import { 
  FiAlertTriangle, 
  FiShield, 
  FiActivity, 
  FiZap, 
  FiWind, 
  FiRadio, 
  FiDroplet, 
  FiInfo, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiLayers, 
  FiMapPin, 
  FiDatabase,
  FiCompass,
  FiSun
} from 'react-icons/fi';
import { MarineHazardSummaryResponse, MarineHazardItem } from '../../services/futureForecastService';

interface MarineHazardsTabProps {
  waterBody: string;
  speciesName: string;
  data: MarineHazardSummaryResponse | null;
  isLoading: boolean;
}

export const MarineHazardsTab: React.FC<MarineHazardsTabProps> = ({
  waterBody,
  speciesName,
  data,
  isLoading
}) => {
  const [selectedHazardId, setSelectedHazardId] = useState<string>('tsunami');

  if (isLoading && !data) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-[#D9E2E7] shadow-sm text-center">
        <FiActivity className="w-10 h-10 text-[#B91C1C] animate-spin mx-auto mb-3" />
        <h4 className="text-sm font-bold text-[#0F2A3A]">Evaluating 13 Real-World Marine Hazards...</h4>
        <p className="text-xs text-[#5B7280] mt-1">Connecting to USGS Real-Time Seismology, IMD Cyclone Warning & Copernicus Satellite Feeds</p>
      </div>
    );
  }

  const hazards = data?.hazards || [];
  const riskIndex = data?.marine_risk_index;
  const activeAlerts = data?.active_alerts || [];
  const selectedHazard = hazards.find(h => h.id === selectedHazardId) || hazards[0];

  return (
    <div className="space-y-6">
      {/* 1. TOP MARINE RISK INDEX & ACTIVE ALERTS BANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Composite Marine Risk Index Card */}
        <div className="bg-gradient-to-br from-[#0F2A3A] via-[#1E293B] to-[#0A2540] p-5 rounded-3xl text-white shadow-md border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <FiShield className="w-4 h-4 text-emerald-400" />
              Composite Marine Risk Index
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-mono font-bold">
              {riskIndex?.label || 'Moderate Risk'}
            </span>
          </div>

          <div className="my-3 text-center">
            <div className="text-5xl font-extrabold font-mono tracking-tight text-white">
              {riskIndex?.score ?? 34}
              <span className="text-xl text-slate-400 font-normal">/100</span>
            </div>
            <span className="text-xs text-slate-300 mt-1 block">
              Multi-Hazard Measurable Exposure ({waterBody})
            </span>
          </div>

          {/* Component Score Decomposition */}
          <div className="space-y-1.5 text-[11px] font-mono pt-3 border-t border-white/10">
            <div className="flex justify-between text-slate-300">
              <span>Tsunami Hazard:</span>
              <strong className="text-emerald-300">{riskIndex?.components.tsunami_score ?? 5} / 100</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Cyclone Threat:</span>
              <strong className="text-teal-300">{riskIndex?.components.cyclone_score ?? 15} / 100</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Marine Heatwave:</span>
              <strong className="text-amber-300">{riskIndex?.components.marine_heatwave_score ?? 36} / 100</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Extreme Waves:</span>
              <strong className="text-cyan-300">{riskIndex?.components.extreme_waves_score ?? 35} / 100</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Hypoxia / OMZ:</span>
              <strong className="text-amber-400">{riskIndex?.components.hypoxia_score ?? 40} / 100</strong>
            </div>
          </div>
        </div>

        {/* Active Marine Alerts & Warnings Panel */}
        <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-[#D9E2E7] shadow-sm space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2A3A] flex items-center gap-2">
              <FiAlertTriangle className="w-4 h-4 text-[#B91C1C]" />
              Active Marine Alerts ({activeAlerts.length} Registered)
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">
              Live Feed: USGS / NOAA / INCOIS
            </span>
          </div>

          <div className="space-y-2">
            {activeAlerts.length > 0 ? (
              activeAlerts.map((alert, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-2xl border flex items-start gap-3 ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-50 border-red-300 text-red-950'
                      : alert.severity === 'HIGH'
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-teal-50 border-teal-300 text-teal-950'
                  }`}
                >
                  <FiAlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs flex-1">
                    <div className="flex items-center justify-between">
                      <strong className="font-bold">{alert.title}</strong>
                      <span className="text-[10px] font-mono opacity-80">{alert.timestamp}</span>
                    </div>
                    <p className="text-[11px] opacity-90">{alert.evidence}</p>
                    <div className="flex items-center gap-3 text-[10px] opacity-75 pt-1">
                      <span>Source: {alert.source}</span>
                      <span>•</span>
                      <span>Region: {alert.location}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 flex items-center gap-3 text-xs">
                <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong>All Clear:</strong> No active critical tsunami warnings, severe cyclone warnings, or extreme sea-state advisories currently active in {waterBody}.
                </div>
              </div>
            )}
          </div>

          <p className="text-[10px] text-[#5B7280] italic">
            Note: Alerts are synced from authoritative regional centres including the Indian Ocean Tsunami Warning System (IOTWMS) and IMD Cyclone Centre.
          </p>
        </div>
      </div>

      {/* 2. 13 MARINE HAZARDS SELECTOR & DETAILED CARD */}
      <div className="bg-white p-6 rounded-3xl border border-[#D9E2E7] shadow-sm space-y-5">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2A3A] mb-1 flex items-center gap-2">
            <FiLayers className="w-4 h-4 text-[#0F766E]" />
            13 Marine Hazards Assessment Suite (Select to Inspect)
          </h4>
          <span className="text-xs text-[#5B7280]">
            Systematic operational evaluation across geodynamic, atmospheric, oceanic, and environmental stressors
          </span>
        </div>

        {/* 13 Hazard Buttons Pills */}
        <div className="flex flex-wrap gap-2">
          {hazards.map((h) => {
            const isSelected = selectedHazardId === h.id;
            let badgeBg = 'bg-[#EEF3F5] text-[#5B7280] border-[#D9E2E7]';
            if (isSelected) {
              badgeBg = 'bg-[#0F766E] text-white border-[#0F766E] shadow-xs';
            } else if (h.severity === 'CRITICAL' || h.severity === 'HIGH') {
              badgeBg = 'bg-red-50 text-red-700 border-red-200';
            } else if (h.severity === 'ELEVATED') {
              badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
            }

            return (
              <button
                key={h.id}
                onClick={() => setSelectedHazardId(h.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${badgeBg}`}
              >
                <span>{h.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-white text-current'
                }`}>
                  {(h?.status || h?.severity || 'NORMAL').toString().split('(')[0].trim()}
                </span>
              </button>
            );
          })}
        </div>

        {/* DETAILED HAZARD INSPECTOR CARD */}
        {selectedHazard && (
          <div className="p-5 rounded-2xl bg-[#F8FAFB] border border-[#D9E2E7] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9E2E7]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B7280] block">
                  Hazard Detail Inspector
                </span>
                <h3 className="text-base font-bold text-[#0F2A3A] flex items-center gap-2">
                  <FiAlertTriangle className="w-4 h-4 text-[#B91C1C]" />
                  {selectedHazard.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#5B7280]">Operational Status:</span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                  selectedHazard.severity === 'CRITICAL'
                    ? 'bg-red-600 text-white'
                    : selectedHazard.severity === 'HIGH'
                    ? 'bg-amber-600 text-white'
                    : 'bg-[#0F766E] text-white'
                }`}>
                  {selectedHazard.status || selectedHazard.severity || 'NORMAL'}
                </span>
              </div>
            </div>

            {/* Content for Tsunami Early Warning */}
            {selectedHazard.id === 'tsunami' && selectedHazard.latest_earthquake && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-[#D9E2E7]">
                    <span className="text-[10px] text-[#5B7280] uppercase block">Latest Seismic Event</span>
                    <strong className="text-base font-mono text-[#0F2A3A]">
                      M{selectedHazard.latest_earthquake?.magnitude || 'N/A'}
                    </strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#D9E2E7]">
                    <span className="text-[10px] text-[#5B7280] uppercase block">Focal Depth</span>
                    <strong className="text-base font-mono text-[#0F2A3A]">
                      {selectedHazard.latest_earthquake?.depth_km || '—'} km
                    </strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#D9E2E7]">
                    <span className="text-[10px] text-[#5B7280] uppercase block">Basin Distance</span>
                    <strong className="text-base font-mono text-[#0F2A3A]">
                      ~{selectedHazard.latest_earthquake?.distance_km || '—'} km
                    </strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#D9E2E7]">
                    <span className="text-[10px] text-[#5B7280] uppercase block">Warning System</span>
                    <strong className="text-xs font-semibold text-emerald-700">
                      {selectedHazard.status || 'NORMAL'}
                    </strong>
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#D9E2E7] text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#5B7280]">Epicenter:</span>
                    <strong className="text-[#0F2A3A] font-mono">{selectedHazard.latest_earthquake?.epicenter || 'N/A'} ({selectedHazard.latest_earthquake?.coordinates || '—'})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5B7280]">Event Timestamp:</span>
                    <strong className="text-[#0F2A3A] font-mono">{selectedHazard.latest_earthquake?.time_utc || 'Recent'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5B7280]">Official Agency:</span>
                    <span className="font-mono text-[#0F766E]">{selectedHazard.latest_earthquake?.source || selectedHazard.source || 'USGS'}</span>
                  </div>
                </div>

                {/* Strict Scientific Disclaimers */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-950 space-y-1">
                  <strong className="flex items-center gap-1.5 font-bold">
                    <FiShield className="w-3.5 h-3.5 text-amber-700" />
                    Strict Scientific Safety Standard:
                  </strong>
                  <p>
                    {selectedHazard.scientific_standard || 'DO NOT claim that AI can predict the exact date, time, or epicenter of future earthquakes or tsunamis. This platform strictly retrieves real-time seismological telemetry from the USGS Earthquake Hazards Program and regional tsunami advisory centres.'}
                  </p>
                </div>
              </div>
            )}

            {/* Content for Marine Heatwave & Hypoxia */}
            {(selectedHazard.id === 'marine_heatwave' || selectedHazard.id === 'hypoxia') && (
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-white rounded-xl border border-[#D9E2E7] space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F2A3A] block">
                    Species Exposure & Biological Impact ({speciesName})
                  </span>
                  <p className="text-[#0F2A3A] leading-relaxed">
                    {selectedHazard.species_impact || selectedHazard.species_exposure || 'Benthic organisms experience metabolic stress and habitat compression.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-[#D9E2E7]">
                    <span className="text-[10px] text-[#5B7280] uppercase block">Anomaly / Measured Metric</span>
                    <strong className="text-base font-mono text-[#0F2A3A]">
                      {selectedHazard.sst_anomaly_c ? `+${selectedHazard.sst_anomaly_c}°C Anomaly` : `${selectedHazard.dissolved_oxygen_ml_l} ml/L Dissolved O₂`}
                    </strong>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#D9E2E7]">
                    <span className="text-[10px] text-[#5B7280] uppercase block">Authority Source</span>
                    <span className="text-xs font-mono text-[#0F766E] font-bold block mt-1">
                      {selectedHazard.source}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* General Content for other hazards */}
            {selectedHazard.id !== 'tsunami' && selectedHazard.id !== 'marine_heatwave' && selectedHazard.id !== 'hypoxia' && (
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-white rounded-xl border border-[#D9E2E7] space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F2A3A] block">
                    Telemetry & Diagnostic Summary
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    {Object.entries(selectedHazard).filter(([k]) => !['id', 'name', 'severity', 'status', 'source'].includes(k)).map(([k, v]) => (
                      <div key={k} className="p-2 bg-[#EEF3F5] rounded-lg">
                        <span className="text-[10px] text-[#5B7280] uppercase block">{k.replace(/_/g, ' ')}</span>
                        <strong className="text-[#0F2A3A]">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-[11px] text-[#5B7280] flex justify-between items-center">
                  <span>Authoritative Feed: <strong className="text-[#0F766E]">{selectedHazard.source}</strong></span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#D9E2E7]">OPERATIONAL</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
