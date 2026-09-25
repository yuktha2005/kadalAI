import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiMapPin,
  FiClock,
  FiActivity,
  FiShield,
  FiDatabase,
  FiLayers,
  FiSearch,
  FiCompass,
  FiCheckCircle,
  FiAnchor
} from 'react-icons/fi';
import { speciesBioService, SpeciesProfile, OceanLocation } from '../services/speciesBioService';

interface SpeciesBioInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSpecies?: string;
  initialWaterBody?: string;
}

const COMMON_SPECIES_LIST = [
  'Guyanacaris keralam',
  'Puerulus sewelli',
  'Sardinella longiceps',
  'Rastrelliger kanagurta',
  'Thunnus albacares',
  'Saron marmoratus',
  'Ophiomastix elegans'
];

export const SpeciesBioInspectorModal: React.FC<SpeciesBioInspectorModalProps> = ({
  isOpen,
  onClose,
  initialSpecies = 'Guyanacaris keralam',
  initialWaterBody = 'Bay of Bengal'
}) => {
  const [selectedWaterBody, setSelectedWaterBody] = useState<string>(initialWaterBody);
  const [selectedSpecies, setSelectedSpecies] = useState<string>(initialSpecies);
  const [searchInput, setSearchInput] = useState<string>('');
  const [locations, setLocations] = useState<OceanLocation[]>([]);
  const [profile, setProfile] = useState<SpeciesProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'species' | 'location'>('species');

  useEffect(() => {
    speciesBioService.fetchOceanLocations().then((locs) => {
      setLocations(locs);
      if (!locs.find((l) => l.name === selectedWaterBody) && locs.length > 0) {
        setSelectedWaterBody(locs[0].name);
      }
    });
  }, []);

  const loadProfile = async (species: string, wb: string) => {
    setLoading(true);
    try {
      const data = await speciesBioService.fetchSpeciesProfile(species, wb);
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProfile(selectedSpecies, selectedWaterBody);
    }
  }, [isOpen, selectedSpecies, selectedWaterBody]);

  if (!isOpen) return null;

  const currentLocation = locations.find((l) => l.name === selectedWaterBody) || locations[0];

  const getIUCNBadge = (code: string) => {
    switch (code) {
      case 'CR':
        return { bg: 'bg-red-500/20 text-red-700 border-red-500/40', text: 'Critically Endangered (CR)' };
      case 'EN':
        return { bg: 'bg-orange-500/20 text-orange-700 border-orange-500/40', text: 'Endangered (EN)' };
      case 'VU':
        return { bg: 'bg-amber-500/20 text-amber-700 border-amber-500/40', text: 'Vulnerable (VU)' };
      case 'NT':
        return { bg: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/40', text: 'Near Threatened (NT)' };
      case 'LC':
        return { bg: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/40', text: 'Least Concern (LC)' };
      default:
        return { bg: 'bg-cyan-500/20 text-cyan-700 border-cyan-500/40', text: 'Data Deficient (DD)' };
    }
  };

  const iucnBadge = getIUCNBadge(profile?.iucn_code || 'DD');

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
          {/* Top Bar Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-[#0F766E] to-[#0A4D48] text-white flex items-center justify-between border-b border-[#0F766E]/40">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-emerald-200">
                <FiCompass className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-serif tracking-wide flex items-center gap-2">
                  <span>Species Biological & Geographic Location Inspector</span>
                  <span className="text-[10px] font-sans font-semibold uppercase tracking-wider bg-white/20 text-emerald-100 px-2 py-0.5 rounded-full">
                    CMLRE Ground Truth
                  </span>
                </h2>
                <p className="text-xs text-emerald-100/80">
                  Inspect exact sampling coordinates, lifespan, IUCN conservation, trophic diet, and water basin metadata.
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

          {/* Quick Filter Strip */}
          <div className="p-4 bg-white border-b border-[#D9E2E7] flex flex-wrap items-center justify-between gap-3">
            {/* Water Body Picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5B7280] flex items-center gap-1">
                <FiMapPin className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Ocean Basin:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {locations.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => {
                      setSelectedWaterBody(loc.name);
                      if (loc.dominant_species && loc.dominant_species.length > 0) {
                        setSelectedSpecies(loc.dominant_species[0]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedWaterBody === loc.name
                        ? 'bg-[#0F766E] text-white shadow-xs'
                        : 'bg-[#EEF3F5] text-[#5B7280] hover:bg-[#E2E8F0] hover:text-[#0F2A3A]'
                    }`}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Species Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5B7280] flex items-center gap-1">
                <FiAnchor className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Target Species:</span>
              </span>
              <select
                value={selectedSpecies}
                onChange={(e) => setSelectedSpecies(e.target.value)}
                className="px-3 py-1.5 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-xs font-medium text-[#0F2A3A] focus:outline-none focus:border-[#0F766E]"
              >
                {COMMON_SPECIES_LIST.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Highlighted Ocean Location Banner */}
            {currentLocation && (
              <div className="bg-gradient-to-br from-[#0F766E]/5 via-[#0369A1]/5 to-transparent border border-[#0F766E]/30 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0F766E] animate-ping" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                        Selected Oceanic Location
                      </span>
                      <span className="text-xs text-[#5B7280]">({currentLocation.region})</span>
                    </div>
                    <h3 className="text-2xl font-bold font-serif text-[#0F2A3A]">{currentLocation.name}</h3>
                    <p className="text-xs text-[#5B7280] max-w-2xl leading-relaxed">{currentLocation.key_features}</p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <div className="bg-white px-3.5 py-2 rounded-xl border border-[#D9E2E7] shadow-xs">
                      <div className="text-[10px] uppercase font-bold text-[#5B7280]">Center Coordinates</div>
                      <div className="text-xs font-bold text-[#0F766E] font-mono">
                        {currentLocation.center.lat.toFixed(1)}°N, {currentLocation.center.lng.toFixed(1)}°E
                      </div>
                    </div>
                    <div className="bg-white px-3.5 py-2 rounded-xl border border-[#D9E2E7] shadow-xs">
                      <div className="text-[10px] uppercase font-bold text-[#5B7280]">Bounding Limits</div>
                      <div className="text-xs font-bold text-[#0369A1] font-mono">
                        {currentLocation.bounds.min_lat}°–{currentLocation.bounds.max_lat}°N, {currentLocation.bounds.min_lng}°–{currentLocation.bounds.max_lng}°E
                      </div>
                    </div>
                    <div className="bg-white px-3.5 py-2 rounded-xl border border-[#D9E2E7] shadow-xs">
                      <div className="text-[10px] uppercase font-bold text-[#5B7280]">Average Depth</div>
                      <div className="text-xs font-bold text-[#D97706] font-mono">
                        {currentLocation.avg_depth_meters} m
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Species Biological Dossier */}
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F766E]" />
                <p className="text-xs font-semibold text-[#5B7280]">Loading Scientific Specimen Dossier...</p>
              </div>
            ) : profile ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Left Card: Core Biological Traits */}
                <div className="bg-white border border-[#D9E2E7] rounded-2xl p-5 space-y-4 shadow-paper">
                  <div className="flex items-center justify-between pb-3 border-b border-[#D9E2E7]">
                    <div>
                      <h4 className="text-base font-bold italic font-serif text-[#0F766E]">{profile.scientific_name}</h4>
                      <div className="text-xs text-[#5B7280] font-medium">{profile.common_name}</div>
                    </div>
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${iucnBadge.bg}`}>
                      {iucnBadge.text}
                    </span>
                  </div>

                  {/* Lifespan & Longevity Card */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl p-3.5 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <FiClock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                        Natural Lifespan / Longevity
                      </div>
                      <div className="text-sm font-extrabold text-emerald-950 font-mono mt-0.5">
                        {profile.lifespan}
                      </div>
                    </div>
                  </div>

                  {/* Trophic Level & Diet */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-[#EEF3F5]">
                      <span className="text-[#5B7280] font-medium">Trophic Level:</span>
                      <span className="font-bold text-[#0F2A3A] font-mono">{profile.trophic_level}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#EEF3F5]">
                      <span className="text-[#5B7280] font-medium">Depth Stratification:</span>
                      <span className="font-bold text-[#0F766E] font-mono">{profile.depth_range_meters}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#EEF3F5]">
                      <span className="text-[#5B7280] font-medium">Thermal Range:</span>
                      <span className="font-bold text-[#D97706] font-mono">{profile.temperature_tolerance}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#EEF3F5]">
                      <span className="text-[#5B7280] font-medium">Conservation:</span>
                      <span className="font-bold text-[#0369A1]">{profile.conservation_priority}</span>
                    </div>
                  </div>

                  {/* Taxonomy Tree */}
                  <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#D9E2E7] text-[11px] font-mono space-y-1 text-[#5B7280]">
                    <div className="text-[10px] uppercase font-bold text-[#0F766E] mb-1">Taxonomic Hierarchy</div>
                    <div>Phylum: <span className="text-[#0F2A3A] font-semibold">{profile.taxonomy.phylum}</span></div>
                    <div>Class: <span className="text-[#0F2A3A] font-semibold">{profile.taxonomy.class}</span></div>
                    <div>Order: <span className="text-[#0F2A3A] font-semibold">{profile.taxonomy.order}</span></div>
                    <div>Family: <span className="text-[#0F2A3A] font-semibold">{profile.taxonomy.family}</span></div>
                  </div>
                </div>

                {/* Middle Card: Ecological Niche & Diet */}
                <div className="bg-white border border-[#D9E2E7] rounded-2xl p-5 space-y-4 shadow-paper">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F766E] flex items-center gap-1.5">
                    <FiActivity className="w-4 h-4" />
                    <span>Ecological Role & Nutrition</span>
                  </h4>

                  <div className="space-y-3 text-xs leading-relaxed text-[#5B7280]">
                    <div className="p-3 bg-[#EEF3F5] rounded-xl border border-[#D9E2E7]">
                      <div className="font-bold text-[#0F2A3A] mb-1 text-[11px] uppercase tracking-wider">
                        Natural Diet & Prey
                      </div>
                      <p>{profile.diet}</p>
                    </div>

                    <div className="p-3 bg-[#EEF3F5] rounded-xl border border-[#D9E2E7]">
                      <div className="font-bold text-[#0F2A3A] mb-1 text-[11px] uppercase tracking-wider">
                        Ecosystem Function
                      </div>
                      <p>{profile.ecological_role}</p>
                    </div>

                    <div className="p-3 bg-[#0F766E]/5 rounded-xl border border-[#0F766E]/20 text-[#0F2A3A]">
                      <div className="font-bold text-[#0F766E] mb-1 text-[11px] uppercase tracking-wider flex items-center gap-1">
                        <FiShield className="w-3.5 h-3.5" />
                        <span>Vessel Holotype & Authority</span>
                      </div>
                      <p className="font-mono text-[11px]">
                        Catalog: <span className="font-bold">{profile.voucher_id}</span>
                      </p>
                      <p className="text-[11px] text-[#5B7280] mt-0.5">
                        Identified by: <span className="text-[#0F2A3A] font-semibold">{profile.taxonomist}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Card: Verified Ground-Truth Sampling Coordinates */}
                <div className="bg-white border border-[#D9E2E7] rounded-2xl p-5 space-y-3 shadow-paper">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F766E] flex items-center gap-1.5">
                      <FiMapPin className="w-4 h-4" />
                      <span>Verified Sampling Stations</span>
                    </h4>
                    <span className="text-[10px] font-mono font-bold bg-[#EEF3F5] text-[#0F766E] px-2 py-0.5 rounded-full">
                      {profile.verified_coordinates.length} Records
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {profile.verified_coordinates.length > 0 ? (
                      profile.verified_coordinates.map((coord, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-[#F8FAFC] border border-[#D9E2E7] rounded-xl text-xs space-y-1 hover:border-[#0F766E]/40 transition-colors"
                        >
                          <div className="flex items-center justify-between font-mono font-bold text-[#0F766E]">
                            <span>
                              {coord.lat.toFixed(3)}°N, {coord.lng.toFixed(3)}°E
                            </span>
                            <span className="text-[10px] bg-[#EEF3F5] text-[#5B7280] px-1.5 py-0.5 rounded">
                              {coord.depth}m
                            </span>
                          </div>
                          <div className="text-[11px] text-[#0F2A3A] truncate font-medium">
                            {coord.locality || 'Offshore Cruise Station'}
                          </div>
                          <div className="text-[10px] text-[#5B7280] uppercase tracking-wider">
                            {coord.water_body}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-[#5B7280] bg-[#EEF3F5] rounded-xl">
                        Coordinates mapped to regional basin grid ({currentLocation.name}).
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-white border-t border-[#D9E2E7] flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-[#5B7280]">
              <FiCheckCircle className="w-4 h-4 text-[#0F766E]" />
              <span>Grounded in CMLRE / FORV Sagar Sampada & WoRMS biological registries.</span>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
            >
              Done & Return
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
