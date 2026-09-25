import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLayers, FiSliders, FiSun, FiMoon, FiShield, FiCompass, FiCheck } from 'react-icons/fi';
import { DataPoint } from '../../App';

export type OceanDepthZoneId = 'all' | 'epipelagic' | 'mesopelagic' | 'bathypelagic' | 'abyssopelagic';

export interface OceanDepthZone {
  id: OceanDepthZoneId;
  name: string;
  subname: string;
  rangeLabel: string;
  minDepth: number;
  maxDepth: number;
  description: string;
  gradient: string;
  borderAccent: string;
  icon: React.ReactNode;
}

export const OCEAN_DEPTH_ZONES: OceanDepthZone[] = [
  {
    id: 'epipelagic',
    name: 'Epipelagic Zone',
    subname: 'Sunlight Layer',
    rangeLabel: '0 – 200 m',
    minDepth: 0,
    maxDepth: 200,
    description: 'Photosynthetic euphotic zone hosting the vast majority of marine biodiversity and commercial fisheries.',
    gradient: 'from-teal-50 via-teal-100/40 to-emerald-50',
    borderAccent: 'border-[#0F766E]',
    icon: <FiSun className="w-4 h-4 text-[#0F766E]" />
  },
  {
    id: 'mesopelagic',
    name: 'Mesopelagic Zone',
    subname: 'Twilight Layer',
    rangeLabel: '200 – 1,000 m',
    minDepth: 200,
    maxDepth: 1000,
    description: 'Thermocline layer characterized by bioluminescence and diurnal vertical migration of oceanic species.',
    gradient: 'from-sky-50 via-blue-100/40 to-cyan-50',
    borderAccent: 'border-[#0369A1]',
    icon: <FiCompass className="w-4 h-4 text-[#0369A1]" />
  },
  {
    id: 'bathypelagic',
    name: 'Bathypelagic Zone',
    subname: 'Midnight Layer',
    rangeLabel: '1,000 – 4,000 m',
    minDepth: 1000,
    maxDepth: 4000,
    description: 'Complete perpetual darkness, extreme hydrostatic pressures, and unique deep-sea benthic organisms.',
    gradient: 'from-indigo-50 via-purple-100/40 to-violet-50',
    borderAccent: 'border-[#7C3AED]',
    icon: <FiMoon className="w-4 h-4 text-[#7C3AED]" />
  },
  {
    id: 'abyssopelagic',
    name: 'Abyssopelagic Zone',
    subname: 'Abyssal Plains',
    rangeLabel: '> 4,000 m',
    minDepth: 4000,
    maxDepth: 12000,
    description: 'Near-freezing abyssal plains and deep oceanic trenches with specialized barophilic extremophiles.',
    gradient: 'from-slate-100 via-slate-200/50 to-gray-100',
    borderAccent: 'border-[#475569]',
    icon: <FiShield className="w-4 h-4 text-[#475569]" />
  }
];

interface OceanDepthFilterProps {
  dataPoints: DataPoint[];
  selectedZone: OceanDepthZoneId;
  onSelectZone: (zone: OceanDepthZoneId, minDepth?: number, maxDepth?: number) => void;
  customMinDepth?: number;
  customMaxDepth?: number;
  onCustomDepthChange?: (min: number, max: number) => void;
  isCompact?: boolean;
}

export const OceanDepthFilter: React.FC<OceanDepthFilterProps> = ({
  dataPoints,
  selectedZone,
  onSelectZone,
  customMinDepth = 0,
  customMaxDepth = 4000,
  onCustomDepthChange,
  isCompact = false
}) => {
  // Compute counts for each zone
  const zoneCounts = useMemo(() => {
    const counts = {
      all: dataPoints.length,
      epipelagic: 0,
      mesopelagic: 0,
      bathypelagic: 0,
      abyssopelagic: 0
    };

    dataPoints.forEach(p => {
      const d = (p as any).depth ?? (p.minimumDepthInMeters !== undefined && p.maximumDepthInMeters !== undefined ? (p.minimumDepthInMeters + p.maximumDepthInMeters) / 2 : p.minimumDepthInMeters ?? 0);
      if (d <= 200) counts.epipelagic++;
      else if (d <= 1000) counts.mesopelagic++;
      else if (d <= 4000) counts.bathypelagic++;
      else counts.abyssopelagic++;
    });

    return counts;
  }, [dataPoints]);

  return (
    <div className="bg-white rounded-2xl border border-[#D9E2E7] p-4 shadow-paper text-[#0F2A3A]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-[#D9E2E7] pb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E]">
            <FiLayers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-serif text-[#0F2A3A] tracking-wide flex items-center gap-1.5">
              Ocean Depth Water Column
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/20">
                Bathymetry
              </span>
            </h3>
            <p className="text-[11px] text-[#5B7280]">Vertical oceanic stratification filter</p>
          </div>
        </div>

        <button
          onClick={() => onSelectZone('all', 0, 12000)}
          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
            selectedZone === 'all'
              ? 'bg-[#0F766E] text-white font-bold shadow-sm'
              : 'bg-[#EEF3F5] text-[#5B7280] hover:text-[#0F2A3A] hover:bg-[#D9E2E7]'
          }`}
        >
          All Depths ({zoneCounts.all})
        </button>
      </div>

      {/* Vertical Stratification Column */}
      <div className="space-y-2">
        {OCEAN_DEPTH_ZONES.map((zone) => {
          const isSelected = selectedZone === zone.id;
          const count = zoneCounts[zone.id];
          const pct = zoneCounts.all > 0 ? Math.round((count / zoneCounts.all) * 100) : 0;

          return (
            <motion.div
              key={zone.id}
              whileHover={{ scale: 1.01, x: 2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelectZone(zone.id, zone.minDepth, zone.maxDepth)}
              className={`cursor-pointer relative overflow-hidden rounded-xl border transition-all duration-200 p-2.5 bg-gradient-to-r ${zone.gradient} ${
                isSelected
                  ? `${zone.borderAccent} ring-2 ring-[#0F766E]/30 shadow-sm`
                  : 'border-[#D9E2E7] hover:border-[#BCCBD5]'
              }`}
            >
              {/* Progress bar line under each layer */}
              <div className="absolute bottom-0 left-0 h-1 bg-[#0F766E]/30 transition-all duration-500" style={{ width: `${pct}%` }} />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1 rounded-lg bg-white/80 border border-[#D9E2E7] shadow-xs">
                    {zone.icon}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-[#0F2A3A]">{zone.name}</span>
                      <span className="text-[10px] text-[#5B7280] font-mono">({zone.rangeLabel})</span>
                    </div>
                    <p className="text-[10px] text-[#5B7280]">{zone.subname}</p>
                  </div>
                </div>

                <div className="text-right flex items-center space-x-2">
                  <div>
                    <div className="text-xs font-bold text-[#0F2A3A] font-mono">{count}</div>
                    <div className="text-[9px] text-[#5B7280]">{pct}% records</div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#0F766E] text-white flex items-center justify-center text-xs shadow-xs">
                      <FiCheck className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>

              {!isCompact && isSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 pt-2 border-t border-[#D9E2E7] text-[11px] text-[#5B7280] italic"
                >
                  {zone.description}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Manual Depth Range Slider Control */}
      {onCustomDepthChange && (
        <div className="mt-3 pt-3 border-t border-[#D9E2E7]">
          <div className="flex items-center justify-between text-xs text-[#0F2A3A] mb-1.5">
            <span className="flex items-center gap-1 text-[11px] font-medium text-[#5B7280]">
              <FiSliders className="w-3.5 h-3.5 text-[#0F766E]" />
              Custom Bathymetry:
            </span>
            <span className="font-mono text-[#0F766E] font-bold text-[11px]">
              {customMinDepth}m – {customMaxDepth >= 10000 ? '10000m+' : `${customMaxDepth}m`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-[#5B7280] block mb-0.5 font-medium">Min Depth (m)</label>
              <input
                type="number"
                min={0}
                max={customMaxDepth}
                step={50}
                value={customMinDepth}
                onChange={(e) => onCustomDepthChange(Math.max(0, Number(e.target.value)), customMaxDepth)}
                className="w-full bg-[#EEF3F5] border border-[#D9E2E7] rounded-lg px-2 py-1 text-xs text-[#0F2A3A] font-mono focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
              />
            </div>
            <div>
              <label className="text-[9px] text-[#5B7280] block mb-0.5 font-medium">Max Depth (m)</label>
              <input
                type="number"
                min={customMinDepth}
                max={12000}
                step={100}
                value={customMaxDepth}
                onChange={(e) => onCustomDepthChange(customMinDepth, Math.max(customMinDepth, Number(e.target.value)))}
                className="w-full bg-[#EEF3F5] border border-[#D9E2E7] rounded-lg px-2 py-1 text-xs text-[#0F2A3A] font-mono focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OceanDepthFilter;
