import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiLayers, FiActivity, FiCompass, FiShield, FiTrendingDown, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';
import speciesIntelligenceService, { SpeciesComparisonResponse, SpeciesSearchResult } from '../../services/speciesIntelligenceService';

interface SpeciesComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSpeciesA?: string;
  initialSpeciesB?: string;
  availableSpecies: SpeciesSearchResult[];
}

export const SpeciesComparisonModal: React.FC<SpeciesComparisonModalProps> = ({
  isOpen,
  onClose,
  initialSpeciesA = 'Homolax megalops',
  initialSpeciesB = 'Puerulus sewelli',
  availableSpecies
}) => {
  const [speciesA, setSpeciesA] = useState<string>(initialSpeciesA);
  const [speciesB, setSpeciesB] = useState<string>(initialSpeciesB);
  const [comparison, setComparison] = useState<SpeciesComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && speciesA && speciesB && speciesA !== speciesB) {
      loadComparison();
    }
  }, [isOpen, speciesA, speciesB]);

  const loadComparison = async () => {
    setIsLoading(true);
    try {
      const data = await speciesIntelligenceService.compareSpecies(speciesA, speciesB);
      setComparison(data);
    } catch (err) {
      console.error('Failed to compare species:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#0F2A3A]/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-5xl bg-white border border-[#D9E2E7] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-[#0F766E] to-[#0A4D48] text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/10 rounded-2xl">
                <FiLayers className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight font-serif">Comparative Species Intelligence Analysis</h3>
                <p className="text-xs text-white/80 mt-0.5">
                  Side-by-side empirical bathymetric, environmental & predictive niche comparison
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

          {/* Species Selectors */}
          <div className="p-5 bg-[#F7F9FA] border-b border-[#D9E2E7] grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0F2A3A] mb-1.5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]"></span>
                Primary Specimen (Species A)
              </label>
              <select
                value={speciesA}
                onChange={(e) => setSpeciesA(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D9E2E7] rounded-xl text-xs font-bold text-[#0F2A3A] outline-none focus:border-[#0F766E]"
              >
                {availableSpecies.map(s => (
                  <option key={`a-${s.scientific_name}`} value={s.scientific_name}>
                    {s.scientific_name} ({s.occurrence_count} records)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F2A3A] mb-1.5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                Comparative Specimen (Species B)
              </label>
              <select
                value={speciesB}
                onChange={(e) => setSpeciesB(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#D9E2E7] rounded-xl text-xs font-bold text-[#0F2A3A] outline-none focus:border-indigo-600"
              >
                {availableSpecies.map(s => (
                  <option key={`b-${s.scientific_name}`} value={s.scientific_name}>
                    {s.scientific_name} ({s.occurrence_count} records)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Matrix Body */}
          <div className="p-6 overflow-y-auto space-y-6 bg-white flex-1">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <FiRefreshCw className="w-8 h-8 text-[#0F766E] animate-spin mb-3" />
                <span className="text-xs font-bold text-[#0F2A3A]">Cross-Referencing Scientific Envelopes...</span>
              </div>
            )}

            {!isLoading && comparison && (
              <div className="space-y-6">
                {/* Summary Overlap Banner */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-emerald-900 block">Niche Overlap Diagnosis:</span>
                    <span className="text-emerald-800">
                      {comparison.comparison_summary.depth_overlap ? '✅ Bathymetric Depth Ranges Overlap' : '❌ Distinct Bathymetric Zonation'} • 
                      Shared Basins: {comparison.comparison_summary.water_bodies_shared.join(', ') || 'None'}
                    </span>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 font-mono font-bold text-emerald-800 rounded-xl">
                    Records: {comparison.comparison_summary.observation_ratio}
                  </span>
                </div>

                {/* Side by Side Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Species A Card */}
                  <div className="p-5 bg-[#F7F9FA] rounded-2xl border-2 border-[#0F766E]/40 space-y-4">
                    <div className="flex items-center gap-3">
                      {comparison.species_a.image && (
                        <img
                          src={comparison.species_a.image}
                          alt={comparison.species_a.scientific_name}
                          className="w-14 h-14 rounded-xl object-cover border border-[#0F766E]/30"
                        />
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-[#0F2A3A] italic font-serif">
                          {comparison.species_a.scientific_name}
                        </h4>
                        <span className="text-[11px] text-[#5B7280]">
                          {comparison.species_a.common_name || comparison.species_a.authority}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-[#D9E2E7]">
                        <span className="text-[#5B7280]">Taxonomy:</span>
                        <span className="font-bold text-[#0F2A3A]">
                          {comparison.species_a.taxonomy?.family || 'Decapoda'} ({comparison.species_a.taxonomy?.order})
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[#D9E2E7]">
                        <span className="text-[#5B7280]">Total Observations:</span>
                        <span className="font-mono font-bold text-[#0F766E]">
                          {comparison.species_a.analytics?.total_observations} records
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[#D9E2E7]">
                        <span className="text-[#5B7280]">Depth Envelope:</span>
                        <span className="font-mono font-bold text-[#0F2A3A]">
                          {comparison.species_a.analytics?.depth_profile?.min_depth_m}m – {comparison.species_a.analytics?.depth_profile?.max_depth_m}m
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[#D9E2E7]">
                        <span className="text-[#5B7280]">Observed In-situ Temp:</span>
                        <span className="font-mono font-bold text-[#B91C1C]">
                          {comparison.species_a.analytics?.environmental_associations?.temperature?.median}°C
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[#D9E2E7]">
                        <span className="text-[#5B7280]">2027–2030 Suitability:</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {comparison.species_a.future_outlook?.available ? `${comparison.species_a.future_outlook.projected_suitability_percent}%` : 'Data Deficient'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Species B Card */}
                  <div className="p-5 bg-[#F7F9FA] rounded-2xl border-2 border-indigo-400/40 space-y-4">
                    <div className="flex items-center gap-3">
                      {comparison.species_b.image && (
                        <img
                          src={comparison.species_b.image}
                          alt={comparison.species_b.scientific_name}
                          className="w-14 h-14 rounded-xl object-cover border border-indigo-300"
                        />
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-[#0F2A3A] italic font-serif">
                          {comparison.species_b.scientific_name}
                        </h4>
                        <span className="text-[11px] text-[#5B7280]">
                          {comparison.species_b.common_name || comparison.species_b.authority}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-[#D9E2E7]">
                        <span className="text-[#5B7280]">Taxonomy:</span>
                        <span className="font-bold text-[#0F2A3A]">
                          {comparison.species_b.taxonomy?.family || 'Decapoda'} ({comparison.species_b.taxonomy?.order})
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[#D9E2E7]">
                        <span className="text-[#5B7280]">Total Observations:</span>
                        <span className="font-mono font-bold text-indigo-700">
                          {comparison.species_b.analytics?.total_observations} records
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[#D9E2E7]">
                        <span className="text-[#5B7280]">Depth Envelope:</span>
                        <span className="font-mono font-bold text-[#0F2A3A]">
                          {comparison.species_b.analytics?.depth_profile?.min_depth_m}m – {comparison.species_b.analytics?.depth_profile?.max_depth_m}m
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[#D9E2E7]">
                        <span className="text-[#5B7280]">Observed In-situ Temp:</span>
                        <span className="font-mono font-bold text-[#B91C1C]">
                          {comparison.species_b.analytics?.environmental_associations?.temperature?.median}°C
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[#D9E2E7]">
                        <span className="text-[#5B7280]">2027–2030 Suitability:</span>
                        <span className="font-mono font-bold text-indigo-700">
                          {comparison.species_b.future_outlook?.available ? `${comparison.species_b.future_outlook.projected_suitability_percent}%` : 'Data Deficient'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-white border-t border-[#D9E2E7] flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#0F766E] hover:bg-[#0B5F58] text-white text-xs font-bold rounded-xl transition-all"
            >
              Done & Return
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
