import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiActivity,
  FiTrendingDown,
  FiLayers,
  FiCompass,
  FiAlertTriangle,
  FiCheckCircle
} from 'react-icons/fi';

interface OceanographicCTDProfilerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWaterBody?: string;
}

export const OceanographicCTDProfilerModal: React.FC<OceanographicCTDProfilerModalProps> = ({
  isOpen,
  onClose,
  initialWaterBody = 'Arabian Sea'
}) => {
  const [waterBody, setWaterBody] = useState<string>(initialWaterBody);
  const [stationId, setStationId] = useState<string>('STN-298002');
  const [activeParam, setActiveParam] = useState<'temp' | 'sal' | 'do' | 'density'>('do');
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (wb: string, stn: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/oceanography/ctd-profile?water_body=${encodeURIComponent(wb)}&station_id=${encodeURIComponent(stn)}`
      );
      const data = await res.json();
      setProfileData(data);
    } catch (e) {
      console.error('Failed to fetch CTD profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProfile(waterBody, stationId);
    }
  }, [isOpen, waterBody, stationId]);

  if (!isOpen) return null;

  const records = profileData?.profile || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0F2A3A]/40 backdrop-blur-md p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.25 }}
          className="bg-[#FAFBFD] border border-[#D9E2E7] rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-[#0F2A3A]"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-[#0369A1] to-[#0F766E] text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-cyan-200">
                <FiActivity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif flex items-center gap-2">
                  <span>SeaBird SBE-911plus CTD & Argo 3D Depth Profiler</span>
                  <span className="text-[10px] font-sans font-semibold uppercase tracking-wider bg-white/20 text-cyan-100 px-2 py-0.5 rounded-full">
                    FORV Sagar Sampada
                  </span>
                </h3>
                <p className="text-xs text-cyan-100/80">
                  Vertical hydrographic soundings: Temperature, Salinity, and Oxygen Minimum Zone (OMZ) Oxycline.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Basin & Parameter Filter */}
          <div className="p-4 bg-white border-b border-[#D9E2E7] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5B7280]">Target Ocean Basin:</span>
              {(['Arabian Sea', 'Bay of Bengal', 'Andaman Sea', 'Lakshadweep Archipelago'] as const).map((wb) => (
                <button
                  key={wb}
                  onClick={() => setWaterBody(wb)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    waterBody === wb
                      ? 'bg-[#0369A1] text-white shadow-xs'
                      : 'bg-[#EEF3F5] text-[#5B7280] hover:bg-[#E2E8F0] hover:text-[#0F2A3A]'
                  }`}
                >
                  {wb}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 bg-[#EEF3F5] p-1 rounded-xl border border-[#D9E2E7]">
              {(
                [
                  { id: 'do', label: 'Dissolved Oxygen' },
                  { id: 'temp', label: 'Temperature (°C)' },
                  { id: 'sal', label: 'Salinity (PSU)' },
                  { id: 'density', label: 'Density (kg/m³)' }
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveParam(p.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeParam === p.id ? 'bg-white text-[#0369A1] shadow-xs' : 'text-[#5B7280] hover:text-[#0F2A3A]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Profiler Visualization */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-16 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0369A1]" />
                <p className="text-xs font-semibold text-[#5B7280]">Calculating Vertical Hydrographic Curve...</p>
              </div>
            ) : profileData ? (
              <>
                {/* Basin Hydrographic Summary */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-[#D9E2E7] shadow-paper">
                    <div className="text-[10px] uppercase font-bold text-[#5B7280]">Mixed Layer Depth</div>
                    <div className="text-xl font-bold font-mono text-[#0369A1] mt-0.5">
                      {profileData.mixed_layer_depth_meters} m
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-[#D9E2E7] shadow-paper">
                    <div className="text-[10px] uppercase font-bold text-[#5B7280]">Thermocline Base</div>
                    <div className="text-xl font-bold font-mono text-[#0F766E] mt-0.5">
                      {profileData.thermocline_depth_meters} m
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-[#D9E2E7] shadow-paper">
                    <div className="text-[10px] uppercase font-bold text-[#5B7280]">Hypoxic OMZ Core</div>
                    <div className="text-xl font-bold font-mono text-[#D97706] mt-0.5">
                      {profileData.omz_depth_range}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-[#D9E2E7] shadow-paper">
                    <div className="text-[10px] uppercase font-bold text-[#5B7280]">Minimum Core Oxygen</div>
                    <div className="text-xl font-bold font-mono text-[#B91C1C] mt-0.5">
                      {profileData.minimum_oxygen_observed} ml/L
                    </div>
                  </div>
                </div>

                {/* Vertical Depth Table & Profile Visualization */}
                <div className="bg-white rounded-2xl border border-[#D9E2E7] p-5 shadow-paper">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#D9E2E7]">
                    <div className="flex items-center gap-2">
                      <FiTrendingDown className="w-4 h-4 text-[#0369A1]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2A3A]">
                        Vertical Depth Soundings (0m – 1000m)
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#B91C1C]">
                      <FiAlertTriangle className="w-3.5 h-3.5" />
                      <span className="font-semibold">Shaded Red rows indicate lethal Oxygen Minimum Zone (&lt;0.5 ml/L)</span>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto pr-1">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#EEF3F5] text-[#5B7280] font-mono text-[11px] sticky top-0">
                        <tr>
                          <th className="py-2.5 px-3 rounded-l-lg">Depth (m)</th>
                          <th className="py-2.5 px-3">Temperature (°C)</th>
                          <th className="py-2.5 px-3">Salinity (PSU)</th>
                          <th className="py-2.5 px-3">Dissolved O₂ (ml/L)</th>
                          <th className="py-2.5 px-3">Density (kg/m³)</th>
                          <th className="py-2.5 px-3 rounded-r-lg">Sound Speed (m/s)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF3F5] font-mono">
                        {records.map((r: any, idx: number) => (
                          <tr
                            key={idx}
                            className={`transition-colors ${
                              r.is_hypoxic_omz
                                ? 'bg-red-500/10 text-red-950 font-semibold'
                                : 'hover:bg-[#F8FAFC]'
                            }`}
                          >
                            <td className="py-2 px-3 font-bold text-[#0F2A3A]">{r.depth_meters}m</td>
                            <td className="py-2 px-3 text-[#0369A1]">{r.temperature_celsius}°C</td>
                            <td className="py-2 px-3 text-[#0F766E]">{r.salinity_psu}</td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  r.is_hypoxic_omz
                                    ? 'bg-red-500 text-white'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {r.dissolved_oxygen_mll} ml/L
                              </span>
                            </td>
                            <td className="py-2 px-3 text-[#5B7280]">{r.density_kg_m3}</td>
                            <td className="py-2 px-3 text-[#5B7280]">{r.sound_velocity_mps} m/s</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t border-[#D9E2E7] flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-[#5B7280]">
              <FiCheckCircle className="w-4 h-4 text-[#0369A1]" />
              <span>CTD calibration verified against WOCE / CLIVAR hydrographic standards.</span>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#0369A1] hover:bg-[#02517C] text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
            >
              Done & Return
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
