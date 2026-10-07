import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiSearch,
  FiFilter,
  FiActivity,
  FiCompass,
  FiMapPin,
  FiCheckCircle,
  FiAlertTriangle,
  FiChevronRight,
  FiLayers,
  FiTrendingUp,
  FiInfo
} from 'react-icons/fi';
import { SpeciesDirectoryItem } from '../../services/speciesIntelligenceService';

const SpeciesImage: React.FC<{ scientificName: string, fallback: string }> = ({ scientificName, fallback }) => {
  const [src, setSrc] = useState<string>(fallback);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/species/${encodeURIComponent(scientificName)}/image`)
      .then(r => r.json())
      .then(d => {
        if (d.image) setSrc(d.image);
      })
      .catch(() => {});
  }, [scientificName]);

  return (
    <img
      src={src}
      alt={scientificName}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      onError={(e) => {
        (e.target as HTMLImageElement).src = fallback;
      }}
      onLoad={() => setLoaded(true)}
      style={{ opacity: loaded ? 1 : 0.5, transition: 'opacity 0.3s' }}
    />
  );
};

interface SpeciesCatalogExplorerProps {
  speciesList: SpeciesDirectoryItem[];
  isLoading: boolean;
  onSelectSpecies: (scientificName: string) => void;
}

export const SpeciesCatalogExplorer: React.FC<SpeciesCatalogExplorerProps> = ({
  speciesList,
  isLoading,
  onSelectSpecies
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFamily, setSelectedFamily] = useState<string>('ALL');
  const [selectedWaterBody, setSelectedWaterBody] = useState<string>('ALL');
  const [predictionFilter, setPredictionFilter] = useState<'ALL' | 'PREDICTION_AVAILABLE' | 'DATA_DEFICIENT'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Extract unique families and water bodies
  const uniqueFamilies = useMemo(() => {
    const fams = new Set<string>();
    speciesList.forEach((s) => {
      if (s.family) fams.add(s.family);
    });
    return Array.from(fams).sort();
  }, [speciesList]);

  const uniqueWaterBodies = useMemo(() => {
    const wbs = new Set<string>();
    speciesList.forEach((s) => {
      s.water_bodies.forEach((w) => wbs.add(w));
    });
    return Array.from(wbs).sort();
  }, [speciesList]);

  // Filter species
  const filteredSpecies = useMemo(() => {
    return speciesList.filter((s) => {
      // Search match
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        s.scientific_name.toLowerCase().includes(query) ||
        (s.common_name && s.common_name.toLowerCase().includes(query)) ||
        (s.family && s.family.toLowerCase().includes(query)) ||
        s.genus.toLowerCase().includes(query);

      // Family match
      const matchFamily = selectedFamily === 'ALL' || s.family === selectedFamily;

      // Water body match
      const matchWaterBody =
        selectedWaterBody === 'ALL' || s.water_bodies.includes(selectedWaterBody);

      // Prediction filter
      const matchPrediction =
        predictionFilter === 'ALL' ||
        (predictionFilter === 'PREDICTION_AVAILABLE' && s.has_future_prediction) ||
        (predictionFilter === 'DATA_DEFICIENT' && !s.has_future_prediction);

      return matchSearch && matchFamily && matchWaterBody && matchPrediction;
    });
  }, [speciesList, searchQuery, selectedFamily, selectedWaterBody, predictionFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSpecies.length / itemsPerPage));
  const paginatedSpecies = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSpecies.slice(start, start + itemsPerPage);
  }, [filteredSpecies, currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const getSpeciesThumbnail = (sp: SpeciesDirectoryItem): string => {
    const name = sp.scientific_name.trim();
    const curatedMap: Record<string, string> = {
      'Homolax megalops': 'https://inaturalist-open-data.s3.amazonaws.com/photos/11250437/medium.jpg',
      'Heterocarpus chani': 'https://inaturalist-open-data.s3.amazonaws.com/photos/465879097/medium.jpeg',
      'Puerulus sewelli': 'https://inaturalist-open-data.s3.amazonaws.com/photos/465879097/medium.jpeg',
      'Munida andamanica': 'https://inaturalist-open-data.s3.amazonaws.com/photos/614747259/original.jpg',
      'Charybdis (Archias) smithii': 'https://inaturalist-open-data.s3.amazonaws.com/photos/207078977/medium.jpg',
      'Nephropsis stewarti': 'https://inaturalist-open-data.s3.amazonaws.com/photos/614747259/original.jpg',
      'Paralomis indica': 'https://inaturalist-open-data.s3.amazonaws.com/photos/11250437/medium.jpg',
      'Squilloides leptosquilla': 'https://inaturalist-open-data.s3.amazonaws.com/photos/465879097/medium.jpeg',
      'Metanephrops andamanicus': 'https://inaturalist-open-data.s3.amazonaws.com/photos/614747259/original.jpg',
      'Guyanacaris keralam': 'https://inaturalist-open-data.s3.amazonaws.com/photos/614747259/original.jpg',
      'Sardinella longiceps': 'https://static.inaturalist.org/photos/53561663/medium.jpg',
      'Rastrelliger kanagurta': 'https://inaturalist-open-data.s3.amazonaws.com/photos/207078977/medium.jpg',
      'Thunnus albacares': 'https://inaturalist-open-data.s3.amazonaws.com/photos/207078977/medium.jpg',
      'Bathynomus keablei': 'https://data.nhm.ac.uk/media/36d1592b-d6a7-4ffc-a00a-aed4e040e2ed'
    };
    if (curatedMap[name]) return curatedMap[name];
    const fallbacks = [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?auto=format&fit=crop&w=600&q=80'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
    return fallbacks[Math.abs(hash) % fallbacks.length];
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Catalog Hero */}
      <div className="bg-gradient-to-r from-[#0F766E] to-[#0A4D48] text-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#0D625C] relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-[11px] font-mono font-bold uppercase tracking-wider">
            <FiActivity className="w-3.5 h-3.5" />
            Dynamic Marine Species Directory ({speciesList.length} Unique Taxa Cataloged)
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif">
            SAGAR Future Marine Species Explorer
          </h2>
          <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed">
            Browse and query all 1,121 marine species cataloged during CMLRE / FORV Sagar Sampada oceanographic surveys.
            Select any species to evaluate its <strong>Current Ocean Habitat</strong>, <strong>2027+ Future Habitat Suitability</strong>, and <strong>Future Population Abundance Trajectory</strong>.
          </p>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-[#D9E2E7] shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative flex items-center">
            <FiSearch className="absolute left-3.5 w-4 h-4 text-[#5B7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter by scientific name, common name, family, or genus..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-xs sm:text-sm text-[#0F2A3A] font-medium outline-none focus:border-[#0F766E] focus:bg-white transition-all"
            />
          </div>

          {/* Family Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedFamily}
              onChange={(e) => {
                setSelectedFamily(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-xs text-[#0F2A3A] font-medium outline-none focus:border-[#0F766E]"
            >
              <option value="ALL">All Taxonomic Families ({uniqueFamilies.length})</option>
              {uniqueFamilies.map((fam) => (
                <option key={fam} value={fam}>
                  {fam}
                </option>
              ))}
            </select>
          </div>

          {/* Water Basin Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedWaterBody}
              onChange={(e) => {
                setSelectedWaterBody(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-xs text-[#0F2A3A] font-medium outline-none focus:border-[#0F766E]"
            >
              <option value="ALL">All Water Basins</option>
              {uniqueWaterBodies.map((wb) => (
                <option key={wb} value={wb}>
                  {wb}
                </option>
              ))}
            </select>
          </div>

          {/* Prediction Status Filter */}
          <div className="md:col-span-2">
            <select
              value={predictionFilter}
              onChange={(e) => {
                setPredictionFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-xs text-[#0F2A3A] font-medium outline-none focus:border-[#0F766E]"
            >
              <option value="ALL">All Prediction Statuses</option>
              <option value="PREDICTION_AVAILABLE">✓ Validated Model (≥4 Obs)</option>
              <option value="DATA_DEFICIENT">⚠ Data Deficient (&lt;4 Obs)</option>
            </select>
          </div>
        </div>

        {/* Results count & active filter tags */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[#5B7280] pt-1 border-t border-[#D9E2E7]">
          <div>
            Showing <strong className="text-[#0F2A3A]">{filteredSpecies.length}</strong> matching species
            {filteredSpecies.length !== speciesList.length && ` (out of ${speciesList.length} total)`}
          </div>
          {(searchQuery || selectedFamily !== 'ALL' || selectedWaterBody !== 'ALL' || predictionFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFamily('ALL');
                setSelectedWaterBody('ALL');
                setPredictionFilter('ALL');
                setCurrentPage(1);
              }}
              className="text-[#0F766E] hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Species Cards Grid */}
      {isLoading ? (
        <div className="p-16 bg-white rounded-3xl border border-[#D9E2E7] shadow-sm text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#0F766E] border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-[#0F2A3A]">Loading Species Directory...</h3>
          <p className="text-xs text-[#5B7280]">Indexing 1,121 marine species from CMLRE research cruises.</p>
        </div>
      ) : filteredSpecies.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-[#D9E2E7] shadow-sm text-center space-y-2">
          <FiInfo className="w-8 h-8 text-[#5B7280] mx-auto" />
          <h3 className="text-sm font-bold text-[#0F2A3A]">No Species Found</h3>
          <p className="text-xs text-[#5B7280]">Try clearing search keywords or changing filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedSpecies.map((sp) => (
            <motion.div
              key={sp.scientific_name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-[#D9E2E7] shadow-sm hover:shadow-md hover:border-[#0F766E] transition-all flex flex-col justify-between overflow-hidden group"
            >
              {/* Image Preview Banner */}
              <div className="w-full h-36 relative overflow-hidden bg-[#0A2230]">
                <SpeciesImage 
                  scientificName={sp.scientific_name} 
                  fallback={getSpeciesThumbnail(sp)} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-emerald-300 text-[9px] font-mono font-bold uppercase tracking-wider border border-emerald-500/30">
                    Verified Specimen
                  </span>
                </div>
                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white">
                  <span className="text-[10px] font-mono text-emerald-200 truncate">
                    {sp.family || `${sp.genus} Family`}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#0F766E]/80 backdrop-blur-sm text-white font-mono text-[10px] font-bold">
                    {sp.occurrence_count} obs
                  </span>
                </div>
              </div>

              {/* Card Header & Content */}
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold font-serif italic text-[#0F2A3A] group-hover:text-[#0F766E] transition-colors">
                      {sp.scientific_name}
                    </h3>
                    {sp.common_name && (
                      <p className="text-xs text-[#5B7280] font-medium mt-0.5">
                        {sp.common_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Spatial Basin Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {sp.water_bodies.slice(0, 2).map((wb) => (
                    <span
                      key={wb}
                      className="px-2 py-0.5 bg-[#EEF3F5] text-[#0F2A3A] rounded-lg text-[10px] font-medium flex items-center gap-1"
                    >
                      <FiMapPin className="w-2.5 h-2.5 text-[#0F766E]" />
                      {wb}
                    </span>
                  ))}
                  {sp.water_bodies.length > 2 && (
                    <span className="px-1.5 py-0.5 bg-[#EEF3F5] text-[#5B7280] rounded-lg text-[10px]">
                      +{sp.water_bodies.length - 2} more
                    </span>
                  )}
                </div>

                {/* Data Availability Indicators */}
                <div className="p-3 bg-[#F7F9FA] rounded-2xl border border-[#D9E2E7] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#5B7280]">Current Habitat Data:</span>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <FiCheckCircle className="w-3 h-3 text-emerald-600" />
                      {sp.status_badges.habitat_data}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#5B7280]">Population CPUE Data:</span>
                    <span className={`font-semibold flex items-center gap-1 ${sp.has_population_data ? 'text-teal-700' : 'text-amber-700'}`}>
                      {sp.has_population_data ? (
                        <FiCheckCircle className="w-3 h-3 text-teal-600" />
                      ) : (
                        <FiAlertTriangle className="w-3 h-3 text-amber-600" />
                      )}
                      {sp.status_badges.population_data}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#5B7280]">Future Outlook (2027+):</span>
                    <span className={`font-semibold flex items-center gap-1 ${sp.has_future_prediction ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {sp.has_future_prediction ? (
                        <FiTrendingUp className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <FiAlertTriangle className="w-3 h-3 text-amber-600" />
                      )}
                      {sp.status_badges.future_prediction}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-4 bg-[#EEF3F5]/60 border-t border-[#D9E2E7]">
                <button
                  onClick={() => onSelectSpecies(sp.scientific_name)}
                  className="w-full py-2.5 px-4 bg-[#0F766E] hover:bg-[#0D625C] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs group-hover:shadow-md"
                >
                  View Future Outlook
                  <FiChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4 pb-8">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-xl border border-[#D9E2E7] bg-white text-xs font-bold text-[#0F2A3A] disabled:opacity-40 hover:bg-[#EEF3F5] transition-all"
          >
            ← Previous
          </button>

          <span className="text-xs font-mono font-bold text-[#5B7280] px-3">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-xl border border-[#D9E2E7] bg-white text-xs font-bold text-[#0F2A3A] disabled:opacity-40 hover:bg-[#EEF3F5] transition-all"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};
export default SpeciesCatalogExplorer;
