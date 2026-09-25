import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, 
  FiTrendingDown, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiThermometer, 
  FiLayers, 
  FiCompass, 
  FiShield, 
  FiActivity,
  FiCalendar,
  FiSliders,
  FiFileText
} from 'react-icons/fi';
import futureForecastService, { FutureForecastResponse } from '../services/futureForecastService';

interface FutureClimateForecasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSpecies?: string;
  initialWaterBody?: string;
}

const COMMON_SPECIES = [
  'Puerulus sewelli',
  'Petrolisthes militaris',
  'Paralomis ceres',
  'Aquilonastra burtoni',
  'Guyanacaris keralam',
  'Macrophiothrix demessa',
  'Calappa guerini',
  'Harpiliopsis depressa'
];

const WATER_BODIES = ['Arabian Sea', 'Bay of Bengal', 'Indian Ocean', 'Andaman Sea'];

export const FutureClimateForecasterModal: React.FC<FutureClimateForecasterModalProps> = ({
  isOpen,
  onClose,
  initialSpecies = 'Puerulus sewelli',
  initialWaterBody = 'Arabian Sea'
}) => {
  const [speciesName, setSpeciesName] = useState(initialSpecies);
  const [waterBody, setWaterBody] = useState(initialWaterBody);
  const [targetYear, setTargetYear] = useState<number>(2030);
  const [scenario, setScenario] = useState<'SSP1-2.6' | 'SSP2-4.5' | 'SSP5-8.5'>('SSP2-4.5');
  const [forecast, setForecast] = useState<FutureForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      loadForecast();
    }
  }, [isOpen, speciesName, waterBody, targetYear, scenario]);

  const loadForecast = async () => {
    setIsLoading(true);
    try {
      const data = await futureForecastService.getFuturePrediction(
        speciesName,
        waterBody,
        targetYear,
        scenario
      );
      setForecast(data);
    } catch (err) {
      console.error('Failed to load forecast:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0F2A3A]/40 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-5xl bg-white border border-[#D9E2E7] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-[#0F766E] to-[#0A4D48] text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
                <FiCompass className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight font-serif">Post-2027 Marine Species & Climate Forecaster</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-[10px] font-mono uppercase tracking-wider">
                    CMIP6 Model
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-0.5">
                  Predictive Bio-Climatic Habitat Suitability & Extinction Vulnerability Engine
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 bg-[#F7F9FA]">
            {/* Control Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-2xl border border-[#D9E2E7] shadow-sm">
              {/* Species Input */}
              <div>
                <label className="block text-xs font-semibold text-[#0F2A3A] mb-1.5 flex items-center gap-1.5">
                  <FiActivity className="w-3.5 h-3.5 text-[#0F766E]" />
                  Target Species
                </label>
                <select
                  value={speciesName}
                  onChange={(e) => setSpeciesName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-xs text-[#0F2A3A] font-medium outline-none focus:border-[#0F766E]"
                >
                  {COMMON_SPECIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Water Body */}
              <div>
                <label className="block text-xs font-semibold text-[#0F2A3A] mb-1.5 flex items-center gap-1.5">
                  <FiLayers className="w-3.5 h-3.5 text-[#0F766E]" />
                  Water Basin
                </label>
                <select
                  value={waterBody}
                  onChange={(e) => setWaterBody(e.target.value)}
                  className="w-full px-3 py-2 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-xs text-[#0F2A3A] font-medium outline-none focus:border-[#0F766E]"
                >
                  {WATER_BODIES.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              {/* Target Year Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#0F2A3A] flex items-center gap-1.5">
                    <FiCalendar className="w-3.5 h-3.5 text-[#0F766E]" />
                    Forecast Horizon
                  </label>
                  <span className="text-xs font-bold text-[#0F766E] font-mono px-2 py-0.5 bg-[#0F766E]/10 rounded-md">
                    Year {targetYear}
                  </span>
                </div>
                <input
                  type="range"
                  min="2025"
                  max="2050"
                  step="1"
                  value={targetYear}
                  onChange={(e) => setTargetYear(parseInt(e.target.value))}
                  className="w-full h-2 bg-[#D9E2E7] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
                />
                <div className="flex justify-between text-[10px] text-[#5B7280] mt-1 font-mono">
                  <span>2025</span>
                  <span className="text-[#0F766E] font-bold">2027+</span>
                  <span>2050</span>
                </div>
              </div>

              {/* Climate Scenario */}
              <div>
                <label className="block text-xs font-semibold text-[#0F2A3A] mb-1.5 flex items-center gap-1.5">
                  <FiSliders className="w-3.5 h-3.5 text-[#0F766E]" />
                  IPCC Scenario
                </label>
                <div className="grid grid-cols-3 gap-1 bg-[#EEF3F5] p-1 rounded-xl border border-[#D9E2E7]">
                  {(['SSP1-2.6', 'SSP2-4.5', 'SSP5-8.5'] as const).map((scen) => (
                    <button
                      key={scen}
                      onClick={() => setScenario(scen)}
                      className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                        scenario === scen
                          ? 'bg-[#0F766E] text-white shadow-xs'
                          : 'text-[#5B7280] hover:text-[#0F2A3A]'
                      }`}
                    >
                      {scen.replace('SSP', '')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Grid */}
            {forecast && (
              <div className="space-y-6">
                {/* Main Forecast Gauge & Status Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Suitability Score Card */}
                  <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#5B7280]">
                      Future Habitat Suitability ({targetYear})
                    </span>
                    <div className="relative my-3 flex items-center justify-center">
                      <svg className="w-28 h-28 transform -rotate-90">
                        <circle
                          cx="56"
                          cy="56"
                          r="46"
                          stroke="#EEF3F5"
                          strokeWidth="10"
                          fill="transparent"
                        />
                        <circle
                          cx="56"
                          cy="56"
                          r="46"
                          stroke={forecast.status_color}
                          strokeWidth="10"
                          strokeDasharray={289}
                          strokeDashoffset={289 - (289 * forecast.habitat_suitability_percent) / 100}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-700 ease-out"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-bold font-mono text-[#0F2A3A]">
                          {forecast.habitat_suitability_percent}%
                        </span>
                        <span className="text-[10px] text-[#5B7280]">Retention</span>
                      </div>
                    </div>
                    <div 
                      className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-xs"
                      style={{ backgroundColor: forecast.status_color }}
                    >
                      {forecast.status} • {forecast.status_label}
                    </div>
                  </div>

                  {/* Climate Stressors */}
                  <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-sm space-y-3.5 flex flex-col justify-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#5B7280] block">
                      Projected Physical Stressors
                    </span>
                    <div className="flex items-center justify-between p-2.5 bg-[#EEF3F5] rounded-xl border border-[#D9E2E7]">
                      <div className="flex items-center gap-2">
                        <FiThermometer className="w-4 h-4 text-[#B91C1C]" />
                        <span className="text-xs font-medium text-[#0F2A3A]">Sea Surface Warming (SST)</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#B91C1C]">
                        +{forecast.projected_sst_rise_celsius}°C
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-[#EEF3F5] rounded-xl border border-[#D9E2E7]">
                      <div className="flex items-center gap-2">
                        <FiLayers className="w-4 h-4 text-[#0F766E]" />
                        <span className="text-xs font-medium text-[#0F2A3A]">OMZ Expansion (Hypoxia Shoal)</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#0F766E]">
                        +{forecast.projected_omz_shoaling_meters}m
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-[#EEF3F5] rounded-xl border border-[#D9E2E7]">
                      <div className="flex items-center gap-2">
                        <FiTrendingDown className="w-4 h-4 text-[#D97706]" />
                        <span className="text-xs font-medium text-[#0F2A3A]">Ocean Acidification</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#D97706]">
                        -{forecast.projected_ph_drop} pH
                      </span>
                    </div>
                  </div>

                  {/* Predicted Species Movement */}
                  <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-sm space-y-3.5 flex flex-col justify-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#5B7280] block">
                      Modeled Biological Migration
                    </span>
                    <div className="p-3 bg-[#0F766E]/5 rounded-xl border border-[#0F766E]/20">
                      <div className="text-[11px] text-[#5B7280] mb-0.5">Vertical Escape Barrier</div>
                      <div className="text-sm font-bold text-[#0F766E] flex items-center gap-1.5">
                        <FiTrendingDown className="w-4 h-4" />
                        <span>Descend +{forecast.predicted_depth_shift_meters}m deeper</span>
                      </div>
                      <p className="text-[10px] text-[#5B7280] mt-1">
                        Required downward bathymetric shift to escape upper thermal envelope.
                      </p>
                    </div>

                    <div className="p-3 bg-[#EEF3F5] rounded-xl border border-[#D9E2E7]">
                      <div className="text-[11px] text-[#5B7280] mb-0.5">Poleward Northward Shift</div>
                      <div className="text-sm font-bold text-[#0F2A3A] flex items-center gap-1.5">
                        <FiCompass className="w-4 h-4 text-[#0F766E]" />
                        <span>+{forecast.predicted_latitudinal_shift_degrees}° Latitudinal Shift</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trajectory Decay Graph & Narrative */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Trajectory Bars */}
                  <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F2A3A] mb-3 flex items-center gap-2">
                      <FiActivity className="w-4 h-4 text-[#0F766E]" />
                      Multi-Decadal Trajectory (2024 - 2050)
                    </h3>
                    <div className="space-y-3">
                      {forecast.trajectory.map((point) => (
                        <div key={point.year} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium text-[#0F2A3A]">
                            <span className="font-mono">{point.year} {point.year === targetYear ? '⭐' : ''}</span>
                            <span className="font-mono text-[#5B7280]">
                              {point.habitat_suitability}% Suitability (+{point.sst_anomaly_celsius}°C SST)
                            </span>
                          </div>
                          <div className="w-full h-3 bg-[#EEF3F5] rounded-full overflow-hidden border border-[#D9E2E7]">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${point.habitat_suitability}%`,
                                backgroundColor: point.habitat_suitability > 75 ? '#15803D' : point.habitat_suitability > 45 ? '#D97706' : '#DC2626'
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scientific Synthesis & Mitigation Directive */}
                  <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F2A3A] flex items-center gap-2">
                      <FiShield className="w-4 h-4 text-[#0F766E]" />
                      CMLRE Decision Directives & Policy Protocol
                    </h3>
                    <p className="text-xs text-[#0F2A3A] leading-relaxed bg-[#EEF3F5] p-3 rounded-xl border border-[#D9E2E7]">
                      {forecast.scientific_narrative}
                    </p>
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-[#5B7280] uppercase tracking-wider block">
                        Actionable Conservation Measures:
                      </span>
                      {forecast.mitigation_actions.map((act, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-[#0F2A3A]">
                          <FiCheckCircle className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t border-[#D9E2E7] flex items-center justify-between">
            <div className="text-xs text-[#5B7280] font-mono">
              Ground truth: CMLRE / FORV Sagar Sampada Research Cruise Dataset
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#0F766E] hover:bg-[#0B5F58] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              Done & Return to Workspace
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
