import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMapPin,
  FiX,
  FiCompass,
  FiLayers,
  FiActivity,
  FiTrendingUp,
  FiInfo,
  FiMaximize2
} from 'react-icons/fi';
import {
  FutureHabitatPrediction,
  PredictedGridCell,
  SpeciesOccurrence
} from '../../services/speciesIntelligenceService';

interface FutureHabitatMapProps {
  prediction: FutureHabitatPrediction;
  occurrences: SpeciesOccurrence[];
  speciesName: string;
}

export const FutureHabitatMap: React.FC<FutureHabitatMapProps> = ({
  prediction,
  occurrences,
  speciesName
}) => {
  const [selectedCell, setSelectedCell] = useState<PredictedGridCell | null>(null);
  const [showBaselinePoints, setShowBaselinePoints] = useState<boolean>(true);
  const [showRefugia, setShowRefugia] = useState<boolean>(true);
  const [showExpansion, setShowExpansion] = useState<boolean>(true);
  const [showContraction, setShowContraction] = useState<boolean>(true);

  // Map coordinates projection for Northern Indian Ocean & surrounding waters
  // Lat: 2° to 24°N, Lon: 65° to 98°E
  const minLat = 2.0;
  const maxLat = 24.0;
  const minLon = 65.0;
  const maxLon = 98.0;

  const projectCoord = (lat: number, lon: number) => {
    const x = ((lon - minLon) / (maxLon - minLon)) * 1000;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 600;
    return {
      x: Math.max(15, Math.min(985, x)),
      y: Math.max(15, Math.min(585, y))
    };
  };

  const gridCells = prediction.predicted_grid_cells || [];
  const filteredCells = gridCells.filter((cell) => {
    if (cell.status === 'stable_refugia' && !showRefugia) return false;
    if (cell.status === 'expansion' && !showExpansion) return false;
    if (cell.status === 'contraction' && !showContraction) return false;
    return cell.status !== 'unsuitable';
  });

  const baseCentroid = prediction.spatial_shift?.baseline_centroid
    ? projectCoord(
        prediction.spatial_shift.baseline_centroid.latitude,
        prediction.spatial_shift.baseline_centroid.longitude
      )
    : null;

  const futureCentroid = prediction.spatial_shift?.predicted_centroid
    ? projectCoord(
        prediction.spatial_shift.predicted_centroid.latitude,
        prediction.spatial_shift.predicted_centroid.longitude
      )
    : null;

  return (
    <div className="bg-white rounded-3xl border border-[#D9E2E7] shadow-sm overflow-hidden flex flex-col">
      {/* Map Header & Controls */}
      <div className="p-4 bg-[#F7F9FA] border-b border-[#D9E2E7] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#0F766E]/10 rounded-xl text-[#0F766E]">
            <FiCompass className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2A3A]">
              2D Future Habitat Suitability Projection Map ({prediction.target_year})
            </h4>
            <p className="text-[11px] text-[#5B7280]">
              Scenario: <strong>{prediction.scenario_label || prediction.scenario}</strong> • Northern Indian Ocean Bathymetric Grid
            </p>
          </div>
        </div>

        {/* Layer Visibility Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setShowBaselinePoints(!showBaselinePoints)}
            className={`px-2.5 py-1 rounded-lg font-medium border text-[11px] transition-all flex items-center gap-1.5 ${
              showBaselinePoints
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white text-gray-400 border-gray-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Observed Stations ({occurrences.length})
          </button>

          <button
            onClick={() => setShowRefugia(!showRefugia)}
            className={`px-2.5 py-1 rounded-lg font-medium border text-[11px] transition-all flex items-center gap-1.5 ${
              showRefugia
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                : 'bg-white text-gray-400 border-gray-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Stable Refugia
          </button>

          <button
            onClick={() => setShowExpansion(!showExpansion)}
            className={`px-2.5 py-1 rounded-lg font-medium border text-[11px] transition-all flex items-center gap-1.5 ${
              showExpansion
                ? 'bg-cyan-100 text-cyan-900 border-cyan-300'
                : 'bg-white text-gray-400 border-gray-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            Expansion
          </button>

          <button
            onClick={() => setShowContraction(!showContraction)}
            className={`px-2.5 py-1 rounded-lg font-medium border text-[11px] transition-all flex items-center gap-1.5 ${
              showContraction
                ? 'bg-rose-100 text-rose-900 border-rose-300'
                : 'bg-white text-gray-400 border-gray-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Contraction
          </button>
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div className="relative w-full h-[460px] bg-[#0A2230] overflow-hidden select-none">
        <svg viewBox="0 0 1000 600" className="w-full h-full object-cover">
          <defs>
            <linearGradient id="futureOceanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B2738" />
              <stop offset="50%" stopColor="#081E2C" />
              <stop offset="100%" stopColor="#05141E" />
            </linearGradient>
            <filter id="futureGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <rect width="1000" height="600" fill="url(#futureOceanGrad)" />

          {/* Graticule Grid */}
          {[10, 15, 20].map((lat) => {
            const { y } = projectCoord(lat, minLon);
            return (
              <g key={`lat-${lat}`}>
                <line
                  x1="0"
                  y1={y}
                  x2="1000"
                  y2={y}
                  stroke="#1E3E52"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text x="15" y={y - 4} fill="#5B7280" fontSize="10" fontFamily="monospace">
                  {lat}°N
                </text>
              </g>
            );
          })}

          {[70, 80, 90].map((lon) => {
            const { x } = projectCoord(minLat, lon);
            return (
              <g key={`lon-${lon}`}>
                <line
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="600"
                  stroke="#1E3E52"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text x={x + 4} y="590" fill="#5B7280" fontSize="10" fontFamily="monospace">
                  {lon}°E
                </text>
              </g>
            );
          })}

          {/* Simplified Indian Subcontinent Coastline */}
          <path
            d="M 120 40 
               L 180 80 
               L 250 140 
               L 270 200 
               L 310 320 
               L 360 410 
               L 400 500 
               L 415 540 
               L 435 520 
               L 470 420 
               L 530 310 
               L 600 240 
               L 680 180 
               L 750 150 
               L 820 180 
               L 850 300 
               L 880 450
               L 920 560
               L 1000 600
               L 1000 0
               L 0 0
               Z"
            fill="#122B3B"
            stroke="#1F4B66"
            strokeWidth="1.5"
            opacity="0.85"
          />

          {/* Sri Lanka Landmass */}
          <ellipse cx="460" cy="535" rx="20" ry="32" fill="#122B3B" stroke="#1F4B66" strokeWidth="1.2" />

          {/* Andaman and Nicobar Islands Ridge */}
          <path
            d="M 820 330 Q 825 400 830 480 Q 835 520 840 550"
            stroke="#1F4B66"
            strokeWidth="3"
            strokeDasharray="4 6"
            fill="none"
          />

          {/* Water Basin Annotations */}
          <text x="180" y="380" fill="#3B6982" fontSize="13" fontWeight="bold" letterSpacing="2">
            ARABIAN SEA
          </text>
          <text x="620" y="340" fill="#3B6982" fontSize="13" fontWeight="bold" letterSpacing="2">
            BAY OF BENGAL
          </text>
          <text x="860" y="440" fill="#3B6982" fontSize="11" fontWeight="bold" letterSpacing="2">
            ANDAMAN SEA
          </text>
          <text x="360" y="575" fill="#3B6982" fontSize="11" fontWeight="bold" letterSpacing="1">
            LACCADIVE SEA
          </text>

          {/* 2D Predicted Habitat Grid Cells */}
          {filteredCells.map((cell, idx) => {
            const { x, y } = projectCoord(cell.latitude, cell.longitude);
            let fillColor = '#10B981'; // Green: stable refugia
            let strokeColor = '#059669';
            if (cell.status === 'expansion') {
              fillColor = '#06B6D4'; // Cyan: expansion
              strokeColor = '#0891B2';
            } else if (cell.status === 'contraction') {
              fillColor = '#F43F5E'; // Rose: contraction
              strokeColor = '#E11D48';
            }

            const isSelected =
              selectedCell?.latitude === cell.latitude &&
              selectedCell?.longitude === cell.longitude;

            return (
              <g
                key={`cell-${idx}`}
                onClick={() => setSelectedCell(cell)}
                className="cursor-pointer transition-transform hover:scale-125"
              >
                <rect
                  x={x - 14}
                  y={y - 12}
                  width="28"
                  height="24"
                  rx="6"
                  fill={fillColor}
                  fillOpacity={isSelected ? 0.9 : 0.55}
                  stroke={isSelected ? '#FFFFFF' : strokeColor}
                  strokeWidth={isSelected ? 2.5 : 1}
                  filter="url(#futureGlow)"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 4 : 2}
                  fill="#FFFFFF"
                  opacity={isSelected ? 1 : 0.7}
                />
              </g>
            );
          })}

          {/* Centroid Shift Vector Arrow */}
          {baseCentroid && futureCentroid && (
            <g>
              <line
                x1={baseCentroid.x}
                y1={baseCentroid.y}
                x2={futureCentroid.x}
                y2={futureCentroid.y}
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeDasharray="6 3"
              />
              {/* Baseline Centroid Pin */}
              <circle cx={baseCentroid.x} cy={baseCentroid.y} r="6" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
              <text x={baseCentroid.x + 8} y={baseCentroid.y - 4} fill="#FCD34D" fontSize="10" fontWeight="bold">
                Baseline Centroid (2024)
              </text>

              {/* Future Predicted Centroid Pin */}
              <circle cx={futureCentroid.x} cy={futureCentroid.y} r="8" fill="#10B981" stroke="#FFFFFF" strokeWidth="2.5" />
              <text x={futureCentroid.x + 10} y={futureCentroid.y + 4} fill="#6EE7B7" fontSize="11" fontWeight="bold">
                Shifted Centroid ({prediction.target_year})
              </text>
            </g>
          )}

          {/* Baseline Empirical Station Points */}
          {showBaselinePoints &&
            occurrences.map((occ, idx) => {
              const { x, y } = projectCoord(occ.latitude, occ.longitude);
              return (
                <circle
                  key={`occ-${idx}`}
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill="#F59E0B"
                  stroke="#1E293B"
                  strokeWidth="1"
                  opacity="0.8"
                />
              );
            })}
        </svg>

        {/* Selected Grid Cell Inspector Modal / Overlay */}
        <AnimatePresence>
          {selectedCell && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#D9E2E7] shadow-xl max-w-xs text-xs z-30 space-y-2"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-[#D9E2E7]">
                <div className="flex items-center gap-1.5 font-bold text-[#0F2A3A]">
                  <FiMapPin className="w-3.5 h-3.5 text-[#0F766E]" />
                  Grid Cell Inspection
                </div>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="p-1 hover:bg-[#EEF3F5] rounded-lg text-[#5B7280]"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#5B7280]">Coordinates:</span>
                  <span className="font-bold text-[#0F2A3A]">
                    {selectedCell.latitude}°N, {selectedCell.longitude}°E
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B7280]">Historical Suitability:</span>
                  <span className="font-bold text-[#0F2A3A]">{selectedCell.current_suitability}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B7280]">{prediction.target_year} Projected:</span>
                  <span className="font-bold text-[#0F766E]">{selectedCell.future_suitability}%</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#D9E2E7]">
                  <span className="text-[#5B7280]">Ecological Classification:</span>
                  <span
                    className={`font-bold capitalize ${
                      selectedCell.status === 'stable_refugia'
                        ? 'text-emerald-700'
                        : selectedCell.status === 'expansion'
                        ? 'text-cyan-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {selectedCell.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend Overlay */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-white text-[10px] space-y-1.5 shadow-md">
          <span className="font-bold uppercase tracking-wider text-emerald-300 block mb-1">
            Habitat Classification ({prediction.target_year})
          </span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-emerald-500" />
            <span>Stable Refugia (Suitability Maintained)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-cyan-500" />
            <span>Expansion Zone (Gained Suitability)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-rose-500" />
            <span>Contraction Zone (Hypoxia / Thermal Loss)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Verified CMLRE Sampling Stations</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default FutureHabitatMap;
