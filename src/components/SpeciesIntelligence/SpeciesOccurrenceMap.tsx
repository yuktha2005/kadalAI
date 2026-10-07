import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiX, FiLayers, FiCalendar, FiCompass, FiDatabase, FiInfo, FiActivity } from 'react-icons/fi';
import { SpeciesOccurrence, SpatialBounds } from '../../services/speciesIntelligenceService';

interface SpeciesOccurrenceMapProps {
  occurrences: SpeciesOccurrence[];
  spatialBounds: SpatialBounds | null;
  speciesName: string;
}

export const SpeciesOccurrenceMap: React.FC<SpeciesOccurrenceMapProps> = ({
  occurrences,
  spatialBounds,
  speciesName
}) => {
  const [selectedOccurrence, setSelectedOccurrence] = useState<SpeciesOccurrence | null>(null);
  const [filterWaterBody, setFilterWaterBody] = useState<string>('ALL');

  // Map coordinates projection for Northern Indian Ocean & surrounding waters
  // Bounding box: Lat 0° to 25°N, Lon 60° to 100°E
  const minLat = 2.0;
  const maxLat = 24.0;
  const minLon = 65.0;
  const maxLon = 98.0;

  const projectCoord = (lat: number, lon: number) => {
    // Map to percentage within viewBox [0, 1000] x [0, 600]
    const x = ((lon - minLon) / (maxLon - minLon)) * 1000;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 600;
    return {
      x: Math.max(20, Math.min(980, x)),
      y: Math.max(20, Math.min(580, y))
    };
  };

  const filteredOccurrences = filterWaterBody === 'ALL'
    ? occurrences
    : occurrences.filter(o => o.water_body.toLowerCase().includes(filterWaterBody.toLowerCase()));

  const uniqueWaterBodies = Array.from(new Set(occurrences.map(o => o.water_body))).filter(Boolean);

  return (
    <div className="bg-white rounded-2xl border border-[#D9E2E7] shadow-sm overflow-hidden flex flex-col">
      {/* Map Header & Controls */}
      <div className="p-4 bg-[#F7F9FA] border-b border-[#D9E2E7] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#0F766E]/10 rounded-xl text-[#0F766E]">
            <FiMapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2A3A]">
              2D Scientific Occurrence Map
            </h4>
            <p className="text-[11px] text-[#5B7280]">
              Plotting {filteredOccurrences.length} verified research cruise sampling stations
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#5B7280]">Filter Basin:</span>
          <select
            value={filterWaterBody}
            onChange={(e) => setFilterWaterBody(e.target.value)}
            className="px-2.5 py-1 bg-white border border-[#D9E2E7] rounded-lg text-xs font-medium text-[#0F2A3A] outline-none focus:border-[#0F766E]"
          >
            <option value="ALL">All Water Basins ({occurrences.length})</option>
            {uniqueWaterBodies.map(wb => (
              <option key={wb} value={wb}>{wb}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SVG Scientific Marine Map Canvas */}
      <div className="relative w-full h-[400px] bg-[#0A2230] overflow-hidden select-none">
        {/* Graticule & Coastline Representation */}
        <svg
          viewBox="0 0 1000 600"
          className="w-full h-full object-cover"
        >
          {/* Oceanic Background Gradient */}
          <defs>
            <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B2738" />
              <stop offset="50%" stopColor="#081E2C" />
              <stop offset="100%" stopColor="#05141E" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <rect width="1000" height="600" fill="url(#oceanGrad)" />

          {/* Latitude / Longitude Graticule Grid */}
          {[10, 15, 20].map((lat) => {
            const y = ((maxLat - lat) / (maxLat - minLat)) * 600;
            return (
              <g key={`lat-${lat}`}>
                <line x1="0" y1={y} x2="1000" y2={y} stroke="#173E54" strokeWidth="0.8" strokeDasharray="4 4" />
                <text x="12" y={y - 4} fill="#4C738A" fontSize="10" fontFamily="monospace">{lat}°N</text>
              </g>
            );
          })}

          {[70, 80, 90].map((lon) => {
            const x = ((lon - minLon) / (maxLon - minLon)) * 1000;
            return (
              <g key={`lon-${lon}`}>
                <line x1={x} y1="0" x2={x} y2="600" stroke="#173E54" strokeWidth="0.8" strokeDasharray="4 4" />
                <text x={x + 4} y="588" fill="#4C738A" fontSize="10" fontFamily="monospace">{lon}°E</text>
              </g>
            );
          })}

          {/* India Coastline Outline (Schematic Geo Polygon) */}
          <path
            d="M 120 0 L 250 80 L 320 180 L 370 280 L 410 380 L 460 480 L 470 510 L 490 480 L 530 400 L 620 290 L 710 210 L 780 160 L 850 180 L 910 240 L 980 320 L 1000 340 L 1000 0 Z"
            fill="#122E3E"
            stroke="#21526E"
            strokeWidth="1.5"
            opacity="0.85"
          />

          {/* Sri Lanka Landmass */}
          <ellipse cx="505" cy="515" rx="24" ry="38" fill="#122E3E" stroke="#21526E" strokeWidth="1.5" />

          {/* Andaman & Nicobar Archipelago */}
          <g fill="#122E3E" stroke="#21526E" strokeWidth="1.2">
            <ellipse cx="850" cy="330" rx="8" ry="25" />
            <ellipse cx="860" cy="380" rx="6" ry="18" />
            <ellipse cx="875" cy="450" rx="9" ry="28" />
          </g>

          {/* Regional Labels */}
          <text x="180" y="320" fill="#2E6B8E" fontSize="15" fontWeight="bold" fontFamily="sans-serif" letterSpacing="4">
            ARABIAN SEA
          </text>
          <text x="630" y="330" fill="#2E6B8E" fontSize="15" fontWeight="bold" fontFamily="sans-serif" letterSpacing="4">
            BAY OF BENGAL
          </text>
          <text x="830" y="270" fill="#2E6B8E" fontSize="11" fontWeight="bold" fontFamily="sans-serif" letterSpacing="2">
            ANDAMAN SEA
          </text>
          <text x="440" y="200" fill="#4B7791" fontSize="14" fontWeight="bold" fontFamily="sans-serif" letterSpacing="5">
            INDIAN PENINSULA
          </text>

          {/* Observation Density Circles */}
          {filteredOccurrences.map((occ, idx) => {
            const pt = projectCoord(occ.latitude, occ.longitude);
            return (
              <circle
                key={`density-${idx}`}
                cx={pt.x}
                cy={pt.y}
                r="16"
                fill="#14B8A6"
                opacity="0.12"
              />
            );
          })}

          {/* Actual Occurrence Points */}
          {filteredOccurrences.map((occ, idx) => {
            const pt = projectCoord(occ.latitude, occ.longitude);
            const isSelected = selectedOccurrence?.observation_id === occ.observation_id;
            const depthColor = occ.depth_meters && occ.depth_meters > 500
              ? '#818CF8' // Deep
              : occ.depth_meters && occ.depth_meters > 200
                ? '#2DD4BF' // Mesopelagic
                : '#FBBF24'; // Shelf

            return (
              <g
                key={`occ-${occ.observation_id}-${idx}`}
                className="cursor-pointer transition-transform hover:scale-125"
                onClick={() => setSelectedOccurrence(occ)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? "9" : "5.5"}
                  fill={depthColor}
                  stroke="#FFFFFF"
                  strokeWidth={isSelected ? "2.5" : "1.2"}
                  filter={isSelected ? "url(#glow)" : undefined}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Map Legend */}
        <div className="absolute bottom-3 left-3 bg-[#0B2738]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-[#173E54] text-white text-[10px] space-y-1 z-10 shadow-lg">
          <div className="font-bold text-gray-300 uppercase tracking-wider mb-1">Depth Stratification</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]"></span>
            <span className="text-gray-200">0m – 200m (Epipelagic Shelf)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2DD4BF]"></span>
            <span className="text-gray-200">200m – 500m (Upper Slope)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#818CF8]"></span>
            <span className="text-gray-200">&gt;500m (Bathyal Deep)</span>
          </div>
        </div>

        {/* Spatial Bounds Badge */}
        {spatialBounds && (
          <div className="absolute top-3 right-3 bg-[#0B2738]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#173E54] text-[11px] font-mono text-emerald-300 z-10">
            Bounding: {spatialBounds.min_latitude}°N–{spatialBounds.max_latitude}°N | {spatialBounds.min_longitude}°E–{spatialBounds.max_longitude}°E
          </div>
        )}
      </div>

      {/* Observation Metadata Modal / Drawer */}
      <AnimatePresence>
        {selectedOccurrence && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 bg-[#EEF3F5] border-t border-[#D9E2E7] grid grid-cols-1 md:grid-cols-4 gap-3 text-xs"
          >
            <div className="col-span-full flex items-center justify-between pb-1 border-b border-[#D9E2E7]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#0F766E] text-white font-mono font-bold text-[10px]">
                  {selectedOccurrence.observation_id}
                </span>
                <span className="font-bold text-[#0F2A3A] italic font-serif text-sm">
                  {selectedOccurrence.species}
                </span>
                <span className="text-[#5B7280]">({selectedOccurrence.locality})</span>
              </div>
              <button
                onClick={() => setSelectedOccurrence(null)}
                className="p-1 hover:bg-[#D9E2E7] rounded-md text-[#5B7280] hover:text-[#0F2A3A]"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#5B7280] block">Geo Coordinates</span>
              <span className="font-mono font-bold text-[#0F2A3A]">
                {selectedOccurrence.latitude.toFixed(4)}°N, {selectedOccurrence.longitude.toFixed(4)}°E
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#5B7280] block">Recorded Depth</span>
              <span className="font-mono font-bold text-[#0F766E]">
                {selectedOccurrence.depth_meters ? `${selectedOccurrence.depth_meters} meters` : 'Surface / Epipelagic'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#5B7280] block">Collection Date</span>
              <span className="font-medium text-[#0F2A3A]">
                {selectedOccurrence.event_date}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#5B7280] block">Sampling Protocol</span>
              <span className="font-medium text-[#0F2A3A] truncate block" title={selectedOccurrence.sampling_protocol}>
                {selectedOccurrence.sampling_protocol}
              </span>
            </div>

            <div className="md:col-span-2">
              <span className="text-[10px] uppercase font-bold text-[#5B7280] block">Taxonomist / Identifier</span>
              <span className="font-medium text-[#0F2A3A]">
                {selectedOccurrence.identified_by}
              </span>
            </div>

            <div className="md:col-span-2">
              <span className="text-[10px] uppercase font-bold text-[#5B7280] block">Dataset Source</span>
              <span className="font-mono text-[#0F766E] text-[11px]">
                {selectedOccurrence.dataset_source} ({selectedOccurrence.basis_of_record})
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
