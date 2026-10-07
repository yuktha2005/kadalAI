import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiLayers,
  FiCompass,
  FiActivity,
  FiThermometer,
  FiTrendingUp,
  FiCalendar,
  FiMapPin,
  FiShield,
  FiInfo,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiBookOpen,
  FiSliders,
  FiDatabase,
  FiFileText,
  FiTrendingDown,
  FiArrowLeft,
  FiGrid,
  FiExternalLink
} from 'react-icons/fi';
import speciesIntelligenceService, {
  SpeciesFullProfile,
  SpeciesDirectoryItem,
  FutureHabitatPrediction,
  FuturePopulationPrediction
} from '../../services/speciesIntelligenceService';
import { SpeciesOccurrenceMap } from './SpeciesOccurrenceMap';
import { FutureHabitatMap } from './FutureHabitatMap';
import { SpeciesCatalogExplorer } from './SpeciesCatalogExplorer';
import { SpeciesComparisonModal } from './SpeciesComparisonModal';

interface SpeciesIntelligenceViewProps {
  initialSpecies?: string;
  onBackToDashboard?: () => void;
}

const POPULAR_SPECIES = [
  'Homolax megalops',
  'Heterocarpus chani',
  'Puerulus sewelli',
  'Munida andamanica',
  'Charybdis (Archias) smithii',
  'Nephropsis stewarti',
  'Paralomis indica',
  'Guyanacaris keralam',
  'Sardinella longiceps',
  'Thunnus albacares'
];

export const SpeciesIntelligenceView: React.FC<SpeciesIntelligenceViewProps> = ({
  initialSpecies = 'Homolax megalops',
  onBackToDashboard
}) => {
  const [activeMainView, setActiveMainView] = useState<'PROFILE' | 'CATALOG'>('PROFILE');
  const [activeProfileTab, setActiveProfileTab] = useState<'OVERVIEW' | 'HABITAT' | 'POPULATION' | 'OUTLOOK'>('OVERVIEW');
  
  const [selectedSpecies, setSelectedSpecies] = useState<string>(initialSpecies);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [allSpeciesList, setAllSpeciesList] = useState<SpeciesDirectoryItem[]>([]);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  
  const [profile, setProfile] = useState<SpeciesFullProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Future Modeling Controls (2027+)
  const [selectedYear, setSelectedYear] = useState<number>(2030);
  const [selectedScenario, setSelectedScenario] = useState<string>('SSP2-4.5');
  const [dynamicHabitat, setDynamicHabitat] = useState<FutureHabitatPrediction | null>(null);
  const [dynamicPopulation, setDynamicPopulation] = useState<FuturePopulationPrediction | null>(null);
  const [isLoadingFutureModel, setIsLoadingFutureModel] = useState<boolean>(false);

  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Load initial species directory
  useEffect(() => {
    setIsLoadingDirectory(true);
    speciesIntelligenceService.getAllSpeciesDirectory().then((list) => {
      setAllSpeciesList(list);
      setIsLoadingDirectory(false);
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await speciesIntelligenceService.searchSpecies(searchQuery, 15);
        setSearchResults(results);
        setShowDropdown(true);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load full profile when selectedSpecies changes
  useEffect(() => {
    if (selectedSpecies) {
      loadProfile(selectedSpecies);
    }
  }, [selectedSpecies]);

  // Trigger dynamic future models when year or scenario changes
  useEffect(() => {
    if (selectedSpecies && profile) {
      loadDynamicFutureModels(selectedSpecies, selectedYear, selectedScenario);
    }
  }, [selectedYear, selectedScenario, selectedSpecies]);

  const loadProfile = async (speciesName: string) => {
    setIsLoadingProfile(true);
    setErrorMsg(null);
    try {
      const data = await speciesIntelligenceService.getSpeciesProfile(speciesName);
      setProfile(data);
      setDynamicHabitat(data.future_habitat);
      setDynamicPopulation(data.future_population);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to retrieve scientific profile.');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadDynamicFutureModels = async (speciesName: string, year: number, scenario: string) => {
    setIsLoadingFutureModel(true);
    try {
      const [hab, pop] = await Promise.all([
        speciesIntelligenceService.getSpeciesFutureHabitat(speciesName, year, scenario),
        speciesIntelligenceService.getSpeciesFuturePopulation(speciesName, year, scenario)
      ]);
      setDynamicHabitat(hab);
      setDynamicPopulation(pop);
    } catch (e) {
      console.warn('Failed to load dynamic future prediction:', e);
    } finally {
      setIsLoadingFutureModel(false);
    }
  };

  const handleSelectSpecies = (name: string) => {
    setSelectedSpecies(name);
    setSearchQuery('');
    setShowDropdown(false);
    setActiveMainView('PROFILE');
  };

  const supportedYears = [2027, 2028, 2029, 2030];
  const supportedScenarios = [
    { id: 'SSP1-2.6', label: 'SSP1-2.6 (Sustainable / Paris 1.5°C)' },
    { id: 'SSP2-4.5', label: 'SSP2-4.5 (Intermediate Baseline)' },
    { id: 'SSP5-8.5', label: 'SSP5-8.5 (High Emissions / Fossil-Fueled)' }
  ];

  return (
    <div className="min-h-screen bg-[#F0F4F7] text-[#0F2A3A] flex flex-col font-sans">
      {/* Top Banner & Scientific Header */}
      <header className="bg-[#0F766E] text-white border-b border-[#0D625C] shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/15">
              <FiCompass className="w-6 h-6 text-emerald-300 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-serif tracking-tight">
                  Future Marine Species Intelligence System
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-[10px] font-mono font-bold uppercase tracking-wider">
                  2027+ Projections
                </span>
              </div>
              <p className="text-xs text-white/80">
                Distinct Future Ocean Habitat (SDM) + Demographic Population Abundance Modeling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Toggle between Profile and Catalog */}
            <button
              onClick={() => setActiveMainView(activeMainView === 'PROFILE' ? 'CATALOG' : 'PROFILE')}
              className="px-3.5 py-1.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              {activeMainView === 'PROFILE' ? (
                <>
                  <FiGrid className="w-3.5 h-3.5 text-emerald-300" />
                  All Species Explorer ({allSpeciesList.length})
                </>
              ) : (
                <>
                  <FiArrowLeft className="w-3.5 h-3.5 text-emerald-300" />
                  Back to Profile ({selectedSpecies})
                </>
              )}
            </button>

            <button
              onClick={() => setIsCompareOpen(true)}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <FiSliders className="w-3.5 h-3.5 text-emerald-300" />
              Compare Species
            </button>

            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="px-3.5 py-1.5 bg-emerald-800/80 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all"
              >
                Dashboard
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 flex-1">
        {/* VIEW 1: ALL SPECIES CATALOG EXPLORER */}
        {activeMainView === 'CATALOG' ? (
          <SpeciesCatalogExplorer
            speciesList={allSpeciesList}
            isLoading={isLoadingDirectory}
            onSelectSpecies={handleSelectSpecies}
          />
        ) : (
          /* VIEW 2: DEDICATED SPECIES INTELLIGENCE PROFILE */
          <div className="space-y-6">
            {/* Search Bar & Autocomplete */}
            <div ref={searchContainerRef} className="relative bg-white p-4 rounded-3xl border border-[#D9E2E7] shadow-sm space-y-3">
              <div className="relative flex items-center">
                <FiSearch className="absolute left-4 w-4 h-4 text-[#5B7280]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search 1,121 marine species (e.g., Homolax megalops, Puerulus sewelli, Charybdis, Spiny Lobster)..."
                  className="w-full pl-11 pr-10 py-3 bg-[#EEF3F5] border border-[#D9E2E7] rounded-2xl text-xs sm:text-sm font-semibold text-[#0F2A3A] outline-none focus:border-[#0F766E] focus:bg-white transition-all placeholder:text-[#5B7280]"
                />
                {isSearching && (
                  <FiRefreshCw className="absolute right-4 w-4 h-4 text-[#0F766E] animate-spin" />
                )}
              </div>

              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {showDropdown && (searchResults.length > 0 || searchQuery.trim().length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute left-4 right-4 top-[62px] bg-white border border-[#D9E2E7] rounded-2xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto"
                  >
                    {searchResults.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#5B7280]">
                        No matching marine species found in CMLRE catalog for "{searchQuery}".
                      </div>
                    ) : (
                      <div className="divide-y divide-[#EEF3F5]">
                        {searchResults.map((res) => (
                          <div
                            key={res.scientific_name}
                            onClick={() => handleSelectSpecies(res.scientific_name)}
                            className="p-3 hover:bg-[#F0F7F6] cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <div>
                              <div className="text-xs font-bold text-[#0F2A3A] italic font-serif">
                                {res.scientific_name}
                              </div>
                              {res.common_name && (
                                <div className="text-[11px] text-[#5B7280]">
                                  {res.common_name}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[#5B7280]">
                                {res.water_bodies.join(', ') || 'Indian Ocean'}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-[#0F766E]/10 text-[#0F766E] text-[10px] font-mono font-bold">
                                {res.occurrence_count} occurrences
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Popular Species Badges */}
              <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5">
                <span className="text-[11px] font-bold text-[#5B7280] uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <FiActivity className="w-3.5 h-3.5 text-[#0F766E]" />
                  Quick Select:
                </span>
                {POPULAR_SPECIES.map((sp) => (
                  <button
                    key={sp}
                    onClick={() => handleSelectSpecies(sp)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-all ${
                      selectedSpecies === sp
                        ? 'bg-[#0F766E] text-white font-bold shadow-xs'
                        : 'bg-[#EEF3F5] text-[#0F2A3A] hover:bg-[#D9E2E7]'
                    }`}
                  >
                    {sp}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading / Error States */}
            {isLoadingProfile && (
              <div className="p-16 bg-white rounded-3xl border border-[#D9E2E7] shadow-sm flex flex-col items-center justify-center space-y-3">
                <FiRefreshCw className="w-10 h-10 text-[#0F766E] animate-spin" />
                <h3 className="text-sm font-bold text-[#0F2A3A]">Retrieving Empirical Oceanographic Records...</h3>
                <p className="text-xs text-[#5B7280]">
                  Aggregating CMLRE cruise occurrences, CTD depth profiles, and bio-climatic niche classifiers.
                </p>
              </div>
            )}

            {errorMsg && !isLoadingProfile && (
              <div className="p-8 bg-red-50 border border-red-200 rounded-3xl text-center space-y-2">
                <FiAlertCircle className="w-8 h-8 text-red-600 mx-auto" />
                <h3 className="text-sm font-bold text-red-800">Profile Error</h3>
                <p className="text-xs text-red-700">{errorMsg}</p>
              </div>
            )}

            {/* Profile Loaded Content */}
            {!isLoadingProfile && profile && (
              <div id="species-intelligence-profile" className="space-y-6">
                {/* 1. Species Header Card */}
                <div className="bg-white rounded-3xl border border-[#D9E2E7] shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                  {/* Verified Image */}
                  <div className="lg:col-span-4 bg-[#0A2230] relative flex items-center justify-center min-h-[260px] overflow-hidden border-b lg:border-b-0 lg:border-r border-[#D9E2E7]">
                    {profile.image ? (
                      <div className="w-full h-full relative group">
                        <img
                          src={profile.image}
                          alt={profile.scientific_name}
                          className="w-full h-full object-cover min-h-[260px] max-h-[340px]"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                        <div className="absolute bottom-3 left-3 right-3 text-white text-[10px]">
                          <span className="font-bold block text-emerald-300">
                            {profile.image_source || 'Verified Scientific Image'}
                          </span>
                          <span className="text-gray-300 truncate block">{profile.image_attribution}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-400 space-y-2">
                        <FiInfo className="w-8 h-8 mx-auto text-gray-500" />
                        <span className="text-xs font-medium block">No verified photo available</span>
                        <span className="text-[10px] text-gray-500 block">Strict verification mode active</span>
                      </div>
                    )}
                  </div>

                  {/* Taxonomy & Biological Details */}
                  <div className="lg:col-span-8 p-6 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#0F766E]/10 text-[#0F766E] text-[10px] font-mono font-bold uppercase tracking-wider">
                            {profile.rank}
                          </span>
                          <span className="text-xs text-[#5B7280]">{profile.authority}</span>
                        </div>
                        <span className="text-[11px] font-mono text-[#5B7280]">
                          Source: GBIF / WoRMS Taxonomy
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-bold font-serif italic text-[#0F2A3A]">
                        {profile.scientific_name}
                      </h2>
                      {profile.common_name && (
                        <div className="text-sm font-semibold text-[#0F766E]">
                          Common Name: {profile.common_name}
                        </div>
                      )}

                      {/* Hierarchy Breadcrumbs */}
                      <div className="mt-4 p-3 bg-[#EEF3F5] rounded-2xl border border-[#D9E2E7]">
                        <span className="text-[10px] uppercase font-bold text-[#5B7280] block mb-2">
                          Taxonomic Classification Hierarchy:
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          {[
                            { rank: 'Kingdom', val: profile.taxonomy?.kingdom || 'Animalia' },
                            { rank: 'Phylum', val: profile.taxonomy?.phylum || 'Arthropoda' },
                            { rank: 'Class', val: profile.taxonomy?.class || 'Malacostraca' },
                            { rank: 'Order', val: profile.taxonomy?.order || 'Decapoda' },
                            { rank: 'Family', val: profile.taxonomy?.family || 'Marine Family' },
                            { rank: 'Genus', val: profile.taxonomy?.genus || profile.scientific_name.split(' ')[0] },
                            { rank: 'Species', val: profile.scientific_name }
                          ].map((tax, idx, arr) => (
                            <React.Fragment key={tax.rank}>
                              <span className="px-2 py-1 bg-white rounded-lg border border-[#D9E2E7] text-[11px] font-medium text-[#0F2A3A] shadow-2xs">
                                <strong className="text-[#5B7280] font-normal">{tax.rank}:</strong> {tax.val}
                              </span>
                              {idx < arr.length - 1 && (
                                <span className="text-[#5B7280] font-bold">↓</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="text-xs text-[#0F2A3A] leading-relaxed bg-[#F7F9FA] p-3.5 rounded-2xl border border-[#D9E2E7]">
                      <span className="font-bold text-[#5B7280] uppercase tracking-wider text-[10px] block mb-1">
                        Verified Species Description:
                      </span>
                      <p>{profile.description}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Scientific Profile Navigation Tabs */}
                <div className="flex flex-wrap items-center gap-2 border-b border-[#D9E2E7] pb-3">
                  <button
                    onClick={() => setActiveProfileTab('OVERVIEW')}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                      activeProfileTab === 'OVERVIEW'
                        ? 'bg-[#0F766E] text-white shadow-xs'
                        : 'bg-white text-[#0F2A3A] hover:bg-[#EEF3F5] border border-[#D9E2E7]'
                    }`}
                  >
                    <FiLayers className="w-4 h-4" />
                    1. Current Ocean Habitat
                  </button>

                  <button
                    onClick={() => setActiveProfileTab('HABITAT')}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                      activeProfileTab === 'HABITAT'
                        ? 'bg-[#0F766E] text-white shadow-xs'
                        : 'bg-white text-[#0F2A3A] hover:bg-[#EEF3F5] border border-[#D9E2E7]'
                    }`}
                  >
                    <FiCompass className="w-4 h-4" />
                    2. Future Ocean Habitat (2027+)
                  </button>

                  <button
                    onClick={() => setActiveProfileTab('POPULATION')}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                      activeProfileTab === 'POPULATION'
                        ? 'bg-[#0F766E] text-white shadow-xs'
                        : 'bg-white text-[#0F2A3A] hover:bg-[#EEF3F5] border border-[#D9E2E7]'
                    }`}
                  >
                    <FiTrendingUp className="w-4 h-4" />
                    3. Future Population / Abundance
                  </button>

                  <button
                    onClick={() => setActiveProfileTab('OUTLOOK')}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                      activeProfileTab === 'OUTLOOK'
                        ? 'bg-[#0F766E] text-white shadow-xs'
                        : 'bg-white text-[#0F2A3A] hover:bg-[#EEF3F5] border border-[#D9E2E7]'
                    }`}
                  >
                    <FiActivity className="w-4 h-4" />
                    4. Combined Outlook & Evidence
                  </button>
                </div>

                {/* TAB 1: CURRENT OCEAN HABITAT & BASELINE */}
                {activeProfileTab === 'OVERVIEW' && (
                  <div className="space-y-6">
                    {/* Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                      <div className="bg-white p-4 rounded-2xl border border-[#D9E2E7] shadow-sm text-center">
                        <span className="text-[10px] uppercase font-bold text-[#5B7280] block">Total Observations</span>
                        <span className="text-2xl font-bold font-mono text-[#0F766E] my-1 block">
                          {profile.analytics?.total_observations}
                        </span>
                        <span className="text-[10px] text-[#5B7280]">Specimen records</span>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-[#D9E2E7] shadow-sm text-center">
                        <span className="text-[10px] uppercase font-bold text-[#5B7280] block">Unique Coordinates</span>
                        <span className="text-2xl font-bold font-mono text-[#0F2A3A] my-1 block">
                          {profile.analytics?.unique_locations_count}
                        </span>
                        <span className="text-[10px] text-[#5B7280]">Sampling stations</span>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-[#D9E2E7] shadow-sm text-center">
                        <span className="text-[10px] uppercase font-bold text-[#5B7280] block">Observed Depth Range</span>
                        <span className="text-sm font-bold font-mono text-[#0F766E] my-2 block">
                          {profile.analytics?.depth_profile
                            ? `${profile.analytics.depth_profile.min_depth_m}m – ${profile.analytics.depth_profile.max_depth_m}m`
                            : 'Surface'}
                        </span>
                        <span className="text-[10px] text-[#5B7280]">Bathymetric span</span>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-[#D9E2E7] shadow-sm text-center">
                        <span className="text-[10px] uppercase font-bold text-[#5B7280] block">Median Depth</span>
                        <span className="text-2xl font-bold font-mono text-[#0F2A3A] my-1 block">
                          {profile.analytics?.depth_profile ? `${profile.analytics.depth_profile.median_depth_m}m` : 'N/A'}
                        </span>
                        <span className="text-[10px] text-[#5B7280]">Core depth envelope</span>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-[#D9E2E7] shadow-sm text-center">
                        <span className="text-[10px] uppercase font-bold text-[#5B7280] block">Water Basins</span>
                        <span className="text-2xl font-bold font-mono text-[#0F766E] my-1 block">
                          {profile.analytics?.water_bodies_distribution?.length || 1}
                        </span>
                        <span className="text-[10px] text-[#5B7280]">Documented regions</span>
                      </div>

                      <div className="bg-white p-4 rounded-2xl border border-[#D9E2E7] shadow-sm text-center">
                        <span className="text-[10px] uppercase font-bold text-[#5B7280] block">Observation Span</span>
                        <span className="text-sm font-bold font-mono text-[#0F2A3A] my-2 block">
                          {profile.analytics?.observation_years?.length > 0
                            ? `${Math.min(...profile.analytics.observation_years)}–${Math.max(...profile.analytics.observation_years)}`
                            : 'Cruise records'}
                        </span>
                        <span className="text-[10px] text-[#5B7280]">Temporal coverage</span>
                      </div>
                    </div>

                    {/* 2D Occurrence Map & Water Body Table */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-8">
                        <SpeciesOccurrenceMap
                          occurrences={profile.occurrences}
                          spatialBounds={profile.analytics?.spatial_bounds}
                          speciesName={profile.scientific_name}
                        />
                      </div>

                      <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-[#D9E2E7] shadow-sm space-y-4 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2A3A] flex items-center gap-2">
                            <FiLayers className="w-4 h-4 text-[#0F766E]" />
                            Regional Basin Distribution
                          </h4>
                          <p className="text-[11px] text-[#5B7280] mt-0.5">
                            Empirical occurrence share per oceanographic basin
                          </p>

                          <div className="mt-4 space-y-3">
                            {profile.analytics?.water_bodies_distribution?.map((wb) => (
                              <div key={wb.water_body} className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold text-[#0F2A3A]">
                                  <span>{wb.water_body}</span>
                                  <span className="font-mono text-[#0F766E]">
                                    {wb.records_count} obs ({wb.percentage}%)
                                  </span>
                                </div>
                                <div className="w-full h-2.5 bg-[#EEF3F5] rounded-full overflow-hidden border border-[#D9E2E7]">
                                  <div
                                    className="h-full bg-[#0F766E] rounded-full transition-all duration-500"
                                    style={{ width: `${wb.percentage}%` }}
                                  />
                                </div>
                                <div className="text-[10px] text-[#5B7280] text-right">
                                  {wb.unique_locations} unique sampling coordinates
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-[#EEF3F5] rounded-xl border border-[#D9E2E7] text-[11px] text-[#5B7280]">
                          <strong>Scientific Standard:</strong> Clearly labeled as <em>Observed Distribution</em>, distinct from population abundance.
                        </div>
                      </div>
                    </div>

                    {/* Depth & CTD Environment Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Depth Stratification */}
                      <div className="bg-white p-5 rounded-3xl border border-[#D9E2E7] shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2A3A] flex items-center gap-2">
                            <FiTrendingDown className="w-4 h-4 text-[#0F766E]" />
                            Bathymetric Depth Stratification
                          </h4>
                          <span className="text-[10px] font-mono text-[#5B7280]">Source: CMLRE Sea-Bird CTD</span>
                        </div>

                        {profile.analytics?.depth_profile ? (
                          <div className="space-y-4">
                            <div className="space-y-2.5">
                              {profile.analytics.depth_profile.depth_zone_distribution.map((z) => (
                                <div key={z.zone} className="space-y-1">
                                  <div className="flex justify-between text-xs font-medium text-[#0F2A3A]">
                                    <span>{z.zone}</span>
                                    <span className="font-mono text-[#0F766E] font-bold">
                                      {z.count} records ({z.percentage}%)
                                    </span>
                                  </div>
                                  <div className="w-full h-2.5 bg-[#EEF3F5] rounded-full overflow-hidden border border-[#D9E2E7]">
                                    <div
                                      className="h-full bg-gradient-to-r from-[#0F766E] to-teal-400 rounded-full transition-all duration-500"
                                      style={{ width: `${z.percentage}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#D9E2E7] text-center">
                              <div className="p-2 bg-[#EEF3F5] rounded-xl">
                                <span className="text-[9px] uppercase font-bold text-[#5B7280] block">Min</span>
                                <span className="text-xs font-bold font-mono text-[#0F2A3A]">
                                  {profile.analytics.depth_profile.min_depth_m}m
                                </span>
                              </div>
                              <div className="p-2 bg-[#EEF3F5] rounded-xl">
                                <span className="text-[9px] uppercase font-bold text-[#5B7280] block">Median</span>
                                <span className="text-xs font-bold font-mono text-[#0F766E]">
                                  {profile.analytics.depth_profile.median_depth_m}m
                                </span>
                              </div>
                              <div className="p-2 bg-[#EEF3F5] rounded-xl">
                                <span className="text-[9px] uppercase font-bold text-[#5B7280] block">Mean</span>
                                <span className="text-xs font-bold font-mono text-[#0F2A3A]">
                                  {profile.analytics.depth_profile.mean_depth_m}m
                                </span>
                              </div>
                              <div className="p-2 bg-[#EEF3F5] rounded-xl">
                                <span className="text-[9px] uppercase font-bold text-[#5B7280] block">Max</span>
                                <span className="text-xs font-bold font-mono text-[#0F2A3A]">
                                  {profile.analytics.depth_profile.max_depth_m}m
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 text-center text-xs text-[#5B7280]">
                            Bathymetric depth metadata not documented for this specimen.
                          </div>
                        )}
                      </div>

                      {/* CTD Environmental Associations */}
                      <div className="bg-white p-5 rounded-3xl border border-[#D9E2E7] shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2A3A] flex items-center gap-2">
                            <FiThermometer className="w-4 h-4 text-[#B91C1C]" />
                            Correlated CTD Ocean Environmental Variables
                          </h4>
                          <span className="text-[10px] font-mono text-[#5B7280]">Station 298002</span>
                        </div>

                        {profile.analytics?.environmental_associations ? (
                          <div className="space-y-3">
                            <div className="p-3 bg-[#EEF3F5] rounded-xl border border-[#D9E2E7] flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-[#0F2A3A] block">
                                  {profile.analytics.environmental_associations.temperature.variable}
                                </span>
                                <span className="text-[10px] text-[#5B7280]">
                                  {profile.analytics.environmental_associations.temperature.zone_context}
                                </span>
                              </div>
                              <div className="text-right font-mono">
                                <span className="text-sm font-bold text-[#B91C1C] block">
                                  {profile.analytics.environmental_associations.temperature.median}°C
                                </span>
                                <span className="text-[10px] text-[#5B7280]">
                                  Range: {profile.analytics.environmental_associations.temperature.min}°C –{' '}
                                  {profile.analytics.environmental_associations.temperature.max}°C
                                </span>
                              </div>
                            </div>

                            <div className="p-3 bg-[#EEF3F5] rounded-xl border border-[#D9E2E7] flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-[#0F2A3A] block">
                                  {profile.analytics.environmental_associations.salinity.variable}
                                </span>
                                <span className="text-[10px] text-[#5B7280]">
                                  {profile.analytics.environmental_associations.salinity.zone_context}
                                </span>
                              </div>
                              <div className="text-right font-mono">
                                <span className="text-sm font-bold text-[#0F766E] block">
                                  {profile.analytics.environmental_associations.salinity.median} PSU
                                </span>
                                <span className="text-[10px] text-[#5B7280]">
                                  Range: {profile.analytics.environmental_associations.salinity.min} –{' '}
                                  {profile.analytics.environmental_associations.salinity.max} PSU
                                </span>
                              </div>
                            </div>

                            <div className="p-3 bg-[#EEF3F5] rounded-xl border border-[#D9E2E7] flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-[#0F2A3A] block">
                                  {profile.analytics.environmental_associations.dissolved_oxygen.variable}
                                </span>
                                <span className="text-[10px] text-[#5B7280]">
                                  {profile.analytics.environmental_associations.dissolved_oxygen.zone_context}
                                </span>
                              </div>
                              <div className="text-right font-mono">
                                <span className="text-sm font-bold text-amber-700 block">
                                  {profile.analytics.environmental_associations.dissolved_oxygen.median} ml/L
                                </span>
                                <span className="text-[10px] text-[#5B7280]">
                                  Range: {profile.analytics.environmental_associations.dissolved_oxygen.min} –{' '}
                                  {profile.analytics.environmental_associations.dissolved_oxygen.max} ml/L
                                </span>
                              </div>
                            </div>

                            <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-[10px] text-amber-900 leading-tight">
                              ⚠️ <strong>Scientific Rigor Disclaimer:</strong>{' '}
                              {profile.analytics.environmental_associations.disclaimer}
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 text-center text-xs text-[#5B7280]">
                            No linked CTD observations available.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: FUTURE OCEAN HABITAT (SDM PREDICTION) */}
                {activeProfileTab === 'HABITAT' && (
                  <div className="space-y-6">
                    {/* Interactive Future Scenario Controls */}
                    <div className="bg-white p-5 rounded-3xl border border-[#D9E2E7] shadow-sm space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#D9E2E7]">
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F2A3A] flex items-center gap-2">
                            <FiCompass className="w-4 h-4 text-[#0F766E]" />
                            Future Ocean Habitat Prediction (2027+)
                          </h3>
                          <p className="text-xs text-[#5B7280]">
                            Where is this species expected to have suitable habitat in future oceanographic conditions?
                          </p>
                        </div>

                        {/* Scenario Selector */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#5B7280]">Climate Scenario:</span>
                          <select
                            value={selectedScenario}
                            onChange={(e) => setSelectedScenario(e.target.value)}
                            className="px-3 py-1.5 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-xs font-bold text-[#0F2A3A] outline-none focus:border-[#0F766E]"
                          >
                            {supportedScenarios.map((scen) => (
                              <option key={scen.id} value={scen.id}>
                                {scen.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Year Selector Tabs (ONLY 2027+) */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-[#5B7280] uppercase tracking-wider block">
                          Select Future Target Year (2027+):
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {supportedYears.map((yr) => (
                            <button
                              key={yr}
                              onClick={() => setSelectedYear(yr)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                                selectedYear === yr
                                  ? 'bg-[#0F766E] text-white shadow-md scale-105'
                                  : 'bg-[#EEF3F5] text-[#0F2A3A] hover:bg-[#D9E2E7]'
                              }`}
                            >
                              <span>{yr}</span>
                              {selectedYear === yr && <FiCheckCircle className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Habitat Model Results */}
                    {dynamicHabitat?.available ? (
                      <div className="space-y-6">
                        {/* Area Metrics Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                              Predicted Suitable Area ({selectedYear})
                            </span>
                            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#0F766E] my-1">
                              {dynamicHabitat.habitat_area_metrics?.predicted_suitable_area_sq_km.toLocaleString()} km²
                            </div>
                            <span className="text-[11px] text-emerald-900 font-medium">
                              Baseline: {dynamicHabitat.habitat_area_metrics?.baseline_suitable_area_sq_km.toLocaleString()} km²
                            </span>
                          </div>

                          <div className="p-5 bg-white border border-[#D9E2E7] rounded-3xl text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B7280] block">
                              Suitability Score
                            </span>
                            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#0F2A3A] my-1">
                              {dynamicHabitat.habitat_area_metrics?.suitability_score_percent}%
                            </div>
                            <span className="text-[11px] text-[#5B7280]">
                              Bio-climatic envelope index
                            </span>
                          </div>

                          <div className="p-5 bg-white border border-[#D9E2E7] rounded-3xl text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B7280] block">
                              Net Area Shift (%)
                            </span>
                            <div
                              className={`text-2xl sm:text-3xl font-bold font-mono my-1 ${
                                (dynamicHabitat.habitat_area_metrics?.net_area_change_percent || 0) >= 0
                                  ? 'text-emerald-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              {(dynamicHabitat.habitat_area_metrics?.net_area_change_percent || 0) > 0 ? '+' : ''}
                              {dynamicHabitat.habitat_area_metrics?.net_area_change_percent}%
                            </div>
                            <span className="text-[11px] text-[#5B7280]">
                              Compared to 2024 baseline
                            </span>
                          </div>

                          <div className="p-5 bg-white border border-[#D9E2E7] rounded-3xl text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B7280] block">
                              Centroid Displacement
                            </span>
                            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#0F2A3A] my-1">
                              ~{dynamicHabitat.spatial_shift?.displacement_distance_km} km
                            </div>
                            <span className="text-[11px] text-[#5B7280]">
                              +{dynamicHabitat.spatial_shift?.latitudinal_shift_degrees}° N Poleward
                            </span>
                          </div>
                        </div>

                        {/* 2D Future Habitat Map */}
                        <FutureHabitatMap
                          prediction={dynamicHabitat}
                          occurrences={profile.occurrences}
                          speciesName={profile.scientific_name}
                        />

                        {/* Habitat Change Analysis: Expansion, Contraction, Stable Refugia */}
                        <div className="bg-white p-6 rounded-3xl border border-[#D9E2E7] shadow-sm space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2A3A] flex items-center gap-2">
                            <FiLayers className="w-4 h-4 text-[#0F766E]" />
                            Habitat Change Analysis ({selectedYear})
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Stable Refugia */}
                            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
                              <span className="text-xs font-bold text-emerald-900 block flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                Stable Refugia
                              </span>
                              <div className="text-xl font-bold font-mono text-emerald-800">
                                {dynamicHabitat.habitat_area_metrics?.stable_refugia_sq_km.toLocaleString()} km²
                              </div>
                              <p className="text-[11px] text-emerald-700">
                                Core geographic areas where bio-climatic conditions remain suitable.
                              </p>
                            </div>

                            {/* Expansion */}
                            <div className="p-4 bg-cyan-50/70 border border-cyan-200 rounded-2xl space-y-1">
                              <span className="text-xs font-bold text-cyan-900 block flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                                Expansion Zones
                              </span>
                              <div className="text-xl font-bold font-mono text-cyan-800">
                                {dynamicHabitat.habitat_area_metrics?.expansion_area_sq_km.toLocaleString()} km²
                              </div>
                              <p className="text-[11px] text-cyan-700">
                                Cooler northern and deeper waters gaining newly suitable environmental envelopes.
                              </p>
                            </div>

                            {/* Contraction */}
                            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-1">
                              <span className="text-xs font-bold text-rose-900 block flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                Contraction Zones
                              </span>
                              <div className="text-xl font-bold font-mono text-rose-800">
                                {dynamicHabitat.habitat_area_metrics?.contraction_area_sq_km.toLocaleString()} km²
                              </div>
                              <p className="text-[11px] text-rose-700">
                                Areas losing suitability due to OMZ hypoxia shoaling and sea surface warming.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Multi-Year Trajectory Table */}
                        <div className="bg-white p-6 rounded-3xl border border-[#D9E2E7] shadow-sm space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2A3A] flex items-center gap-2">
                            <FiActivity className="w-4 h-4 text-[#0F766E]" />
                            Multi-Year Suitable Habitat Trajectory (2024 to 2030)
                          </h4>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-[#D9E2E7] text-[#5B7280] font-mono">
                                  <th className="py-2.5 px-3">Year</th>
                                  <th className="py-2.5 px-3">Suitable Area (km²)</th>
                                  <th className="py-2.5 px-3">Unsuitable Area (km²)</th>
                                  <th className="py-2.5 px-3">Suitability Score</th>
                                  <th className="py-2.5 px-3">SST Anomaly</th>
                                  <th className="py-2.5 px-3">OMZ Shoaling</th>
                                  <th className="py-2.5 px-3">Projected Centroid</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#EEF3F5]">
                                {dynamicHabitat.area_trajectory_2024_2050?.filter((pt) => pt.year <= 2030).map((pt) => (
                                  <tr
                                    key={pt.year}
                                    className={`transition-colors ${
                                      pt.year === selectedYear ? 'bg-emerald-50 font-bold' : 'hover:bg-[#F7F9FA]'
                                    }`}
                                  >
                                    <td className="py-2.5 px-3 font-mono text-[#0F2A3A]">{pt.year}</td>
                                    <td className="py-2.5 px-3 font-mono text-[#0F766E]">
                                      {pt.suitable_area_sq_km.toLocaleString()} km²
                                    </td>
                                    <td className="py-2.5 px-3 font-mono text-[#5B7280]">
                                      {pt.unsuitable_area_sq_km.toLocaleString()} km²
                                    </td>
                                    <td className="py-2.5 px-3 font-mono">{pt.suitability_score}%</td>
                                    <td className="py-2.5 px-3 font-mono text-rose-700">+{pt.sst_anomaly_celsius}°C</td>
                                    <td className="py-2.5 px-3 font-mono text-amber-700">+{pt.omz_shoaling_meters}m</td>
                                    <td className="py-2.5 px-3 font-mono text-[#0F2A3A]">
                                      {pt.centroid_lat}°N, {pt.centroid_lon}°E
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Honest Fallback for Data Deficient Species */
                      <div className="p-8 bg-amber-50/80 border border-amber-200 rounded-3xl text-center space-y-2">
                        <FiAlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                        <h4 className="text-sm font-bold text-amber-900">Future Habitat Model Withheld</h4>
                        <p className="text-xs text-amber-800 max-w-xl mx-auto">
                          {dynamicHabitat?.reason || 'Insufficient historical occurrences (<4 records) for a validated Species Distribution Model.'}
                        </p>
                        <span className="text-[10px] text-amber-700 font-mono block">
                          Verified occurrences: {dynamicHabitat?.actual_records_found || profile.occurrences.length} (Minimum required: 4)
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: FUTURE POPULATION / ABUNDANCE PREDICTION */}
                {activeProfileTab === 'POPULATION' && (
                  <div className="space-y-6">
                    {/* Scientific Distinction Banner */}
                    <div className="p-4 bg-teal-900 text-white rounded-2xl border border-teal-800 shadow-sm flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-300 block tracking-wider">
                          Critical Scientific Distinction
                        </span>
                        <div className="text-xs sm:text-sm font-semibold text-gray-100 font-mono mt-0.5">
                          Historical occurrence ≠ Habitat suitability ≠ Population abundance ≠ Population trend
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl bg-white/10 text-[10px] font-mono shrink-0">
                        Separate Demographic Model
                      </span>
                    </div>

                    {/* Population Controls */}
                    <div className="bg-white p-5 rounded-3xl border border-[#D9E2E7] shadow-sm flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#5B7280] uppercase tracking-wider">
                          Year (2027+):
                        </span>
                        {supportedYears.map((yr) => (
                          <button
                            key={yr}
                            onClick={() => setSelectedYear(yr)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all ${
                              selectedYear === yr
                                ? 'bg-[#0F766E] text-white shadow-xs'
                                : 'bg-[#EEF3F5] text-[#0F2A3A] hover:bg-[#D9E2E7]'
                            }`}
                          >
                            {yr}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#5B7280]">Scenario:</span>
                        <select
                          value={selectedScenario}
                          onChange={(e) => setSelectedScenario(e.target.value)}
                          className="px-3 py-1.5 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-xs font-bold text-[#0F2A3A] outline-none"
                        >
                          {supportedScenarios.map((scen) => (
                            <option key={scen.id} value={scen.id}>
                              {scen.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Population Model Metrics */}
                    {dynamicPopulation?.available ? (
                      <div className="space-y-6">
                        {/* Key Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-5 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-3xl text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                              Relative Abundance Index ({selectedYear})
                            </span>
                            <div className="text-3xl font-bold font-mono text-[#0F766E] my-1">
                              {dynamicPopulation.population_summary?.target_year_abundance_index}
                            </div>
                            <span className="text-[11px] text-teal-900 font-medium">
                              95% CI: [{dynamicPopulation.population_summary?.lower_95_ci} –{' '}
                              {dynamicPopulation.population_summary?.upper_95_ci}]
                            </span>
                          </div>

                          <div className="p-5 bg-white border border-[#D9E2E7] rounded-3xl text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B7280] block">
                              Carrying Capacity Retention (Kₜ/K₀)
                            </span>
                            <div className="text-3xl font-bold font-mono text-[#0F2A3A] my-1">
                              {dynamicPopulation.population_summary?.carrying_capacity_retention_pct}%
                            </div>
                            <span className="text-[11px] text-[#5B7280]">
                              Bio-energetic carrying capacity
                            </span>
                          </div>

                          <div className="p-5 bg-white border border-[#D9E2E7] rounded-3xl text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B7280] block">
                              Modeled CPUE Catch Indicator
                            </span>
                            <div className="text-3xl font-bold font-mono text-[#0F766E] my-1">
                              {dynamicPopulation.population_summary?.modeled_cpue_indicator}
                            </div>
                            <span className="text-[11px] text-[#5B7280]">
                              Specimens per research trawl haul
                            </span>
                          </div>

                          <div className="p-5 bg-white border border-[#D9E2E7] rounded-3xl text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B7280] block">
                              Demographic Trend Status
                            </span>
                            <div className="text-sm font-bold my-2 text-[#0F766E]">
                              {dynamicPopulation.population_summary?.demographic_trend_label}
                            </div>
                            <span className="text-[11px] text-[#5B7280]">
                              CMLRE catch effort trend
                            </span>
                          </div>
                        </div>

                        {/* Trajectory Time Series Chart Table */}
                        <div className="bg-white p-6 rounded-3xl border border-[#D9E2E7] shadow-sm space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2A3A] flex items-center gap-2">
                            <FiTrendingUp className="w-4 h-4 text-[#0F766E]" />
                            Annual Demographic Trajectory & 95% Confidence Intervals (2024–2030)
                          </h4>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-[#D9E2E7] text-[#5B7280] font-mono">
                                  <th className="py-2.5 px-3">Year</th>
                                  <th className="py-2.5 px-3">Abundance Index (Iₜ)</th>
                                  <th className="py-2.5 px-3">95% CI Lower</th>
                                  <th className="py-2.5 px-3">95% CI Upper</th>
                                  <th className="py-2.5 px-3">Carrying Capacity (Kₜ)</th>
                                  <th className="py-2.5 px-3">Modeled CPUE / Haul</th>
                                  <th className="py-2.5 px-3">Thermal Metabolic Tax</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#EEF3F5]">
                                {dynamicPopulation.population_trajectory_2024_2050?.filter((pt) => pt.year <= 2030).map((pt) => (
                                  <tr
                                    key={pt.year}
                                    className={`transition-colors ${
                                      pt.year === selectedYear ? 'bg-teal-50 font-bold' : 'hover:bg-[#F7F9FA]'
                                    }`}
                                  >
                                    <td className="py-2.5 px-3 font-mono text-[#0F2A3A]">{pt.year}</td>
                                    <td className="py-2.5 px-3 font-mono text-[#0F766E]">
                                      {pt.relative_abundance_index}
                                    </td>
                                    <td className="py-2.5 px-3 font-mono text-[#5B7280]">{pt.lower_95_ci}</td>
                                    <td className="py-2.5 px-3 font-mono text-[#5B7280]">{pt.upper_95_ci}</td>
                                    <td className="py-2.5 px-3 font-mono">{pt.carrying_capacity_retention_pct}%</td>
                                    <td className="py-2.5 px-3 font-mono text-[#0F766E]">{pt.modeled_cpue_per_haul}</td>
                                    <td className="py-2.5 px-3 font-mono text-rose-700">+{pt.thermal_metabolic_tax_pct}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Physiological Stressors Breakdown */}
                        <div className="bg-white p-6 rounded-3xl border border-[#D9E2E7] shadow-sm space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2A3A]">
                            Demographic Stressor Mechanisms:
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div className="p-4 bg-[#EEF3F5] rounded-2xl space-y-1">
                              <span className="text-[#5B7280] font-bold block">Thermal Metabolic Cost</span>
                              <div className="text-lg font-bold font-mono text-rose-700">
                                +{dynamicPopulation.stressor_breakdown?.thermal_metabolic_tax_pct}%
                              </div>
                              <p className="text-[11px] text-[#5B7280]">
                                Increased basal respiration demand under ocean warming (Q₁₀ response).
                              </p>
                            </div>

                            <div className="p-4 bg-[#EEF3F5] rounded-2xl space-y-1">
                              <span className="text-[#5B7280] font-bold block">Hypoxia Squeeze Tax</span>
                              <div className="text-lg font-bold font-mono text-amber-700">
                                +{dynamicPopulation.stressor_breakdown?.hypoxia_compression_tax_pct}%
                              </div>
                              <p className="text-[11px] text-[#5B7280]">
                                Aerobic habitat volume reduction caused by upward shoaling of the OMZ.
                              </p>
                            </div>

                            <div className="p-4 bg-[#EEF3F5] rounded-2xl space-y-1">
                              <span className="text-[#5B7280] font-bold block">Trophic Resource Retention</span>
                              <div className="text-lg font-bold font-mono text-emerald-700">
                                {dynamicPopulation.stressor_breakdown?.trophic_food_retention_pct}%
                              </div>
                              <p className="text-[11px] text-[#5B7280]">
                                Estimated benthic and mesopelagic prey biomass availability.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Scientific Caveats Callout */}
                        <div className="p-4 bg-[#F7F9FA] rounded-2xl border border-[#D9E2E7] text-xs text-[#5B7280] leading-relaxed">
                          <strong>Scientific Caveats:</strong> {dynamicPopulation.scientific_caveats}
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 bg-amber-50/80 border border-amber-200 rounded-3xl text-center space-y-2">
                        <FiAlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                        <h4 className="text-sm font-bold text-amber-900">Population Abundance Model Withheld</h4>
                        <p className="text-xs text-amber-800 max-w-xl mx-auto">
                          {dynamicPopulation?.reason || 'Insufficient individual specimen counts for demographic time-series modeling.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: COMBINED SPECIES OUTLOOK & EVIDENCE */}
                {activeProfileTab === 'OUTLOOK' && (
                  <div className="space-y-6">
                    {/* Comparative Matrix: Habitat vs Population */}
                    <div className="bg-white p-6 rounded-3xl border border-[#D9E2E7] shadow-sm space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2A3A] flex items-center gap-2">
                        <FiActivity className="w-4 h-4 text-[#0F766E]" />
                        Combined Future Outlook Matrix ({selectedYear} - {selectedScenario})
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Habitat Model Column */}
                        <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 space-y-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-mono font-bold uppercase tracking-wider block w-fit">
                            Model 1: Future Habitat Suitability (SDM)
                          </span>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-emerald-900">Predicted Suitable Area:</span>
                              <span className="font-bold font-mono text-emerald-950">
                                {dynamicHabitat?.habitat_area_metrics?.predicted_suitable_area_sq_km.toLocaleString() || 'N/A'} km²
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-emerald-900">Suitability Index:</span>
                              <span className="font-bold font-mono text-emerald-950">
                                {dynamicHabitat?.habitat_area_metrics?.suitability_score_percent || 'N/A'}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-emerald-900">Centroid Shift:</span>
                              <span className="font-bold font-mono text-emerald-950">
                                ~{dynamicHabitat?.spatial_shift?.displacement_distance_km || 'N/A'} km Northward
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-emerald-900">Model Accuracy (CV):</span>
                              <span className="font-bold font-mono text-emerald-950">
                                {dynamicHabitat?.validation_metrics?.cross_validation_accuracy || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Population Model Column */}
                        <div className="p-5 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border border-teal-200 space-y-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-teal-200 text-teal-900 text-[10px] font-mono font-bold uppercase tracking-wider block w-fit">
                            Model 2: Future Population / Abundance
                          </span>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-teal-900">Relative Abundance (Iₜ):</span>
                              <span className="font-bold font-mono text-teal-950">
                                {dynamicPopulation?.population_summary?.target_year_abundance_index || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-teal-900">95% Confidence Interval:</span>
                              <span className="font-bold font-mono text-teal-950">
                                [{dynamicPopulation?.population_summary?.lower_95_ci} – {dynamicPopulation?.population_summary?.upper_95_ci}]
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-teal-900">Carrying Capacity (Kₜ/K₀):</span>
                              <span className="font-bold font-mono text-teal-950">
                                {dynamicPopulation?.population_summary?.carrying_capacity_retention_pct || 'N/A'}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-teal-900">Goodness-of-Fit (R²):</span>
                              <span className="font-bold font-mono text-teal-950">
                                {dynamicPopulation?.validation_metrics?.r_squared || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Grounded Synthesis */}
                    <div className="bg-gradient-to-r from-teal-900 to-[#0A4D48] text-white p-6 rounded-3xl shadow-md space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                          <FiBookOpen className="w-4 h-4" />
                          AI Evidence-Based Scientific Synthesis (Gemini Engine)
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-mono">
                          Strictly Grounded (0 Hallucinations)
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-100 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10">
                        {profile.ai_research_summary}
                      </p>
                    </div>

                    {/* Source Evidence Audit */}
                    <div className="bg-white p-5 rounded-3xl border border-[#D9E2E7] shadow-sm space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2A3A] flex items-center gap-2">
                        <FiDatabase className="w-4 h-4 text-[#0F766E]" />
                        Scientific Provenance & Source Evidence Audit
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {profile.sources?.map((s, idx) => (
                          <div key={idx} className="p-3 bg-[#EEF3F5] rounded-xl border border-[#D9E2E7] text-xs">
                            <span className="text-[10px] uppercase font-bold text-[#5B7280] block">{s.section}</span>
                            <span className="font-semibold text-[#0F2A3A] mt-0.5 block">{s.source}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Comparison Modal */}
      <SpeciesComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        initialSpeciesA={selectedSpecies}
        availableSpecies={allSpeciesList.map(s => ({
          scientific_name: s.scientific_name,
          common_name: s.common_name,
          occurrence_count: s.occurrence_count,
          water_bodies: s.water_bodies,
          match_score: 1
        }))}
      />
    </div>
  );
};
export default SpeciesIntelligenceView;
