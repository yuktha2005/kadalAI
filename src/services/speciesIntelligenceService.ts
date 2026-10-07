const API_BASE_URL = process.env.REACT_APP_RAG_API_URL || 'http://localhost:8000';

export interface SpeciesSearchResult {
  scientific_name: string;
  common_name: string | null;
  occurrence_count: number;
  water_bodies: string[];
  match_score: number;
}

export interface SpeciesDirectoryItem {
  scientific_name: string;
  common_name: string | null;
  family: string | null;
  genus: string;
  occurrence_count: number;
  total_individuals: number;
  water_bodies: string[];
  has_habitat_data: boolean;
  has_population_data: boolean;
  has_future_prediction: boolean;
  status_badges: {
    habitat_data: string;
    population_data: string;
    future_prediction: string;
  };
}

export interface SpeciesOccurrence {
  observation_id: string;
  catalog_number: string;
  species: string;
  individual_count?: number;
  latitude: number;
  longitude: number;
  depth_meters: number | null;
  minimum_depth: number | null;
  maximum_depth: number | null;
  event_date: string;
  year: number | null;
  month: number | null;
  water_body: string;
  country: string;
  locality: string;
  sampling_protocol: string;
  identified_by: string;
  dataset_source: string;
  basis_of_record: string;
}

export interface DepthZoneDistribution {
  zone: string;
  count: number;
  percentage: number;
}

export interface DepthHistogramBin {
  range: string;
  count: number;
}

export interface DepthProfile {
  min_depth_m: number;
  max_depth_m: number;
  median_depth_m: number;
  mean_depth_m: number;
  q25_depth_m: number;
  q75_depth_m: number;
  depth_zone_distribution: DepthZoneDistribution[];
  histogram_bins: DepthHistogramBin[];
}

export interface WaterBodyDistribution {
  water_body: string;
  records_count: number;
  percentage: number;
  unique_locations: number;
}

export interface YearlyTrendPoint {
  year: number;
  observation_count: number;
  unique_stations: number;
  label: string;
}

export interface SeasonalPatternPoint {
  month_num: number;
  month_name: string;
  count: number;
  season: string;
}

export interface EnvironmentalVariableStats {
  variable: string;
  min: number;
  max: number;
  median: number;
  q25?: number;
  q75?: number;
  unit: string;
  zone_context?: string;
  source?: string;
}

export interface EnvironmentalAssociations {
  source: string;
  method: string;
  disclaimer: string;
  temperature: EnvironmentalVariableStats;
  salinity: EnvironmentalVariableStats;
  dissolved_oxygen: EnvironmentalVariableStats;
  current_speed?: EnvironmentalVariableStats;
}

export interface SpatialBounds {
  min_latitude: number;
  max_latitude: number;
  min_longitude: number;
  max_longitude: number;
  center: {
    latitude: number;
    longitude: number;
  };
}

export interface SpeciesAnalytics {
  total_observations: number;
  total_individuals_count?: number;
  unique_locations_count: number;
  observation_years: number[];
  spatial_bounds: SpatialBounds | null;
  water_bodies_distribution: WaterBodyDistribution[];
  depth_profile: DepthProfile | null;
  yearly_trend: YearlyTrendPoint[];
  seasonal_pattern: SeasonalPatternPoint[];
  environmental_associations: EnvironmentalAssociations | null;
}

export interface FeatureImportance {
  feature: string;
  importance_score: number;
}

export interface PredictedGridCell {
  latitude: number;
  longitude: number;
  current_suitability: number;
  future_suitability: number;
  status: 'stable_refugia' | 'expansion' | 'contraction' | 'unsuitable';
}

export interface AreaTrajectoryPoint {
  year: number;
  suitable_area_sq_km: number;
  unsuitable_area_sq_km: number;
  suitability_score: number;
  sst_anomaly_celsius: number;
  omz_shoaling_meters: number;
  centroid_lat: number;
  centroid_lon: number;
}

export interface FutureHabitatPrediction {
  available: boolean;
  species_name?: string;
  target_year?: number;
  supported_years?: number[];
  scenario?: string;
  scenario_label?: string;
  model_type?: string;
  validation_metrics?: {
    cross_validation_accuracy: number;
    roc_auc: number;
    f1_score: number;
    training_points_count: number;
    empirical_records_validated: number;
  };
  habitat_area_metrics?: {
    baseline_suitable_area_sq_km: number;
    predicted_suitable_area_sq_km: number;
    predicted_unsuitable_area_sq_km: number;
    suitability_score_percent: number;
    net_area_change_percent: number;
    stable_refugia_sq_km: number;
    expansion_area_sq_km: number;
    contraction_area_sq_km: number;
  };
  spatial_shift?: {
    baseline_centroid: { latitude: number; longitude: number };
    predicted_centroid: { latitude: number; longitude: number };
    latitudinal_shift_degrees: number;
    longitudinal_shift_degrees: number;
    displacement_distance_km: number;
    shift_direction: string;
  };
  area_trajectory_2024_2050?: AreaTrajectoryPoint[];
  feature_importances?: FeatureImportance[];
  predicted_grid_cells?: PredictedGridCell[];
  scientific_disclaimer?: string;
  reason?: string;
  scientific_status?: string;
  minimum_records_required?: number;
  actual_records_found?: number;
}

export interface PopulationTrajectoryPoint {
  year: number;
  relative_abundance_index: number;
  lower_95_ci: number;
  upper_95_ci: number;
  carrying_capacity_retention_pct: number;
  modeled_cpue_per_haul: number;
  thermal_metabolic_tax_pct: number;
  hypoxia_compression_tax_pct: number;
}

export interface FuturePopulationPrediction {
  available: boolean;
  species_name?: string;
  target_year?: number;
  supported_years?: number[];
  scenario?: string;
  scenario_label?: string;
  model_type?: string;
  validation_metrics?: {
    validation_method: string;
    r_squared: number;
    rmse: number;
    baseline_sampling_events: number;
    total_specimens_observed: number;
    empirical_mean_cpue: number;
  };
  population_summary?: {
    baseline_abundance_index: number;
    target_year_abundance_index: number;
    lower_95_ci: number;
    upper_95_ci: number;
    carrying_capacity_retention_pct: number;
    modeled_cpue_indicator: number;
    demographic_trend_label: string;
    trend_color: string;
  };
  stressor_breakdown?: {
    thermal_metabolic_tax_pct: number;
    hypoxia_compression_tax_pct: number;
    trophic_food_retention_pct: number;
  };
  population_trajectory_2024_2050?: PopulationTrajectoryPoint[];
  scientific_caveats?: string;
  reason?: string;
  scientific_status?: string;
  minimum_records_required?: number;
  actual_records_found?: number;
}

export interface ModelEvaluationMetrics {
  validation_method: string;
  accuracy: number;
  roc_auc: number;
  f1_score: number;
  training_records_count: number;
  validation_records_count: number;
}

export interface FutureOutlook {
  available: boolean;
  reason?: string;
  prediction_period?: string;
  model_type?: string;
  prediction_target?: string;
  projected_suitability_percent?: number;
  predicted_bathymetric_shift_meters?: number;
  predicted_latitudinal_shift_degrees?: number;
  model_confidence?: string;
  uncertainty_interval?: string;
  feature_importances?: FeatureImportance[];
  model_evaluation?: ModelEvaluationMetrics;
  data_coverage?: string;
  model_limitations?: string;
  minimum_records_required?: number;
  actual_records_found?: number;
  scientific_status?: string;
  future_habitat?: FutureHabitatPrediction;
  future_population?: FuturePopulationPrediction;
}

export interface SourceEvidenceItem {
  section: string;
  source: string;
}

export interface SpeciesFullProfile {
  scientific_name: string;
  common_name: string | null;
  authority: string | null;
  rank: string;
  taxonomy: {
    kingdom?: string;
    phylum?: string;
    class?: string;
    order?: string;
    family?: string;
    genus?: string;
    species?: string;
  };
  image: string | null;
  image_attribution: string | null;
  image_source: string | null;
  description: string | null;
  sources: SourceEvidenceItem[];
  analytics: SpeciesAnalytics;
  occurrences: SpeciesOccurrence[];
  future_habitat: FutureHabitatPrediction;
  future_population: FuturePopulationPrediction;
  future_outlook: FutureOutlook;
  ai_research_summary: string;
}

export interface SpeciesComparisonResponse {
  species_a: SpeciesFullProfile;
  species_b: SpeciesFullProfile;
  comparison_summary: {
    depth_overlap: boolean;
    water_bodies_shared: string[];
    observation_ratio: string;
  };
}

class SpeciesIntelligenceService {
  private static instance: SpeciesIntelligenceService;

  private constructor() {}

  public static getInstance(): SpeciesIntelligenceService {
    if (!SpeciesIntelligenceService.instance) {
      SpeciesIntelligenceService.instance = new SpeciesIntelligenceService();
    }
    return SpeciesIntelligenceService.instance;
  }

  async searchSpecies(query: string = '', limit: number = 20): Promise<SpeciesSearchResult[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/species/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.results || [];
    } catch (e) {
      console.warn('Species search API offline or error:', e);
      return [];
    }
  }

  async getAllSpeciesDirectory(): Promise<SpeciesDirectoryItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/species/all`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.results || [];
    } catch (e) {
      console.warn('Species directory API error:', e);
      return [];
    }
  }

  async getSpeciesProfile(scientificName: string): Promise<SpeciesFullProfile> {
    const res = await fetch(`${API_BASE_URL}/api/species/${encodeURIComponent(scientificName.trim())}`);
    if (!res.ok) {
      throw new Error(`Failed to load species profile: ${res.statusText}`);
    }
    const data = await res.json();
    return data.profile;
  }

  async getSpeciesFutureHabitat(
    scientificName: string,
    targetYear: number = 2030,
    scenario: string = 'SSP2-4.5'
  ): Promise<FutureHabitatPrediction> {
    const res = await fetch(
      `${API_BASE_URL}/api/species/${encodeURIComponent(scientificName.trim())}/future-habitat?target_year=${targetYear}&scenario=${encodeURIComponent(scenario)}`
    );
    if (!res.ok) {
      throw new Error(`Failed to load future habitat: ${res.statusText}`);
    }
    const data = await res.json();
    return data.future_habitat;
  }

  async getSpeciesFuturePopulation(
    scientificName: string,
    targetYear: number = 2030,
    scenario: string = 'SSP2-4.5'
  ): Promise<FuturePopulationPrediction> {
    const res = await fetch(
      `${API_BASE_URL}/api/species/${encodeURIComponent(scientificName.trim())}/future-population?target_year=${targetYear}&scenario=${encodeURIComponent(scenario)}`
    );
    if (!res.ok) {
      throw new Error(`Failed to load future population: ${res.statusText}`);
    }
    const data = await res.json();
    return data.future_population;
  }

  async compareSpecies(speciesA: string, speciesB: string): Promise<SpeciesComparisonResponse> {
    const res = await fetch(
      `${API_BASE_URL}/api/species/compare?species_a=${encodeURIComponent(speciesA)}&species_b=${encodeURIComponent(speciesB)}`
    );
    if (!res.ok) {
      throw new Error(`Failed to compare species: ${res.statusText}`);
    }
    const data = await res.json();
    return data.comparison;
  }
}

export const speciesIntelligenceService = SpeciesIntelligenceService.getInstance();
export default speciesIntelligenceService;
