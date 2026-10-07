const RAG_API_BASE_URL = process.env.REACT_APP_RAG_API_URL || 'http://localhost:8000';

export interface TrajectoryPoint {
  year: number;
  habitat_suitability: number;
  sst_anomaly_celsius: number;
  omz_shoaling_meters: number;
  extinction_risk_score: number;
}

export interface TrophicCascadeItem {
  level: string;
  status: string;
  biomass_change_pct: number;
  mechanism: string;
}

export interface CruiseWaypoint {
  station_id: string;
  coordinates: string;
  target_depth_m: number;
  operation: string;
  priority: 'Critical' | 'High' | 'Strategic';
}

export interface GridCell {
  cell_id: string;
  region_name: string;
  basin: string;
  latitude: number;
  longitude: number;
  depth_meters: number;
  historical_suitability: number;
  predicted_suitability: number;
  change: number;
  change_category: 'GAIN' | 'LOSS' | 'STABLE_SUITABLE' | 'STABLE_UNSUITABLE' | 'UNCERTAIN_OUT_OF_DOMAIN';
  projected_temperature_c: number;
  projected_salinity_psu: number;
  projected_oxygen_mll: number;
  uncertainty: string;
  confidence_score: number;
  is_out_of_domain: boolean;
  domain_warning?: string | null;
}

export interface FutureHotspot {
  hotspot_id: string;
  name: string;
  basin: string;
  coordinates: string;
  latitude: number;
  longitude: number;
  area_km2: number;
  predicted_suitability: number;
  historical_suitability: number;
  change: number;
  dominant_drivers: string[];
  uncertainty: string;
  is_out_of_domain: boolean;
  evidence_records_count: number;
  model_version: string;
}

export interface HabitatCategoryData {
  count: number;
  area_km2: number;
  percentage: number;
  description: string;
}

export interface HabitatChangeResponse {
  species_name: string;
  target_year: number;
  scenario: string;
  suitability_threshold: number;
  categories: {
    GAIN: HabitatCategoryData;
    LOSS: HabitatCategoryData;
    STABLE_SUITABLE: HabitatCategoryData;
    STABLE_UNSUITABLE: HabitatCategoryData;
    UNCERTAIN_OUT_OF_DOMAIN: HabitatCategoryData;
  };
  net_habitat_change_km2: number;
  summary_statement: string;
}

export interface HabitatShiftResponse {
  species_name: string;
  target_year: number;
  scenario: string;
  baseline_centroid: { latitude: number; longitude: number };
  future_centroid: { latitude: number; longitude: number };
  centroid_shift_distance_km: number;
  latitudinal_shift_degrees: number;
  longitudinal_shift_degrees: number;
  predicted_bathymetric_depth_shift_m: number;
  shift_vector_direction: string;
  shift_bearing_compass?: string;
  scientific_interpretation: string;
}

export interface FutureDataRegistrySource {
  source: string;
  dataset_name: string;
  variables: string[];
  geographic_coverage: string;
  temporal_coverage: string;
  spatial_resolution: string;
  temporal_resolution: string;
  scenarios: string[];
  units: string;
  api_download_method: string;
  license: string;
  update_frequency: string;
  data_quality: string;
  compatibility_with_historical_data: string;
  supported_years: number[];
}

export interface FutureAvailabilityResponse {
  species: string;
  target_year: number;
  scenario: string;
  can_predict: boolean;
  is_year_available: boolean;
  is_scenario_available: boolean;
  is_species_available: boolean;
  ground_truth_records_count: number;
  supported_years: number[];
  supported_scenarios: string[];
  message: string;
}

export interface AIExplanationResponse {
  question: string;
  species_name: string;
  target_year: number;
  scenario: string;
  ai_explanation: string;
  grounded_evidence: {
    model_version: string;
    validation_auc: number;
    validation_tss: number;
    cmlre_records_used: number;
    dominant_driver: string;
    centroid_shift_km: number;
    net_change_km2: number;
    out_of_domain_cells: number;
  };
}

export interface MultiSpeciesHotspotCell {
  cell_id: string;
  region_name: string;
  basin: string;
  latitude: number;
  longitude: number;
  mean_multispecies_suitability: number;
  high_suitability_species_count: number;
  species_breakdown: Record<string, number>;
  is_out_of_domain: boolean;
}

export interface MultiSpeciesHotspotResponse {
  target_year: number;
  scenario: string;
  species_evaluated: string[];
  label: string;
  top_biodiversity_hotspots: MultiSpeciesHotspotCell[];
  total_cells_evaluated: number;
}

export interface DepthProfileBin {
  label: string;
  stratum_label?: string;
  depth_min_m: number;
  depth_max_m: number;
  occurrence_count: number;
  record_count?: number;
  percentage: number;
  is_current_core: boolean;
  is_core?: boolean;
  is_future_suitable: boolean;
}

export interface SpeciesDepthIntelligence {
  species_name: string;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  reason?: string;
  target_year: number;
  scenario: string;
  observed_records_count: number;
  observed_min_m: number | null;
  observed_max_m: number | null;
  observed_mean_m: number | null;
  observed_median_m: number | null;
  core_min_m: number | null;
  core_max_m: number | null;
  future_suitable_depth_min_m: number | null;
  future_suitable_depth_max_m: number | null;
  predicted_depth_shift_m: number;
  depth_shift_m?: number;
  depth_shift_direction: string;
  depth_confidence: 'High' | 'Medium' | 'Low';
  observed_depth_range?: string;
  core_depth_range?: string;
  future_suitable_depth_range?: string;
  depth_profile_bins: DepthProfileBin[];
  vertical_profile_bins?: DepthProfileBin[];
  scientific_interpretation: string;
}

export interface HotspotCellItem {
  cell_id: string;
  region_name: string;
  basin: string;
  latitude: number;
  longitude: number;
  depth_meters: number;
  current_suitability: number;
  future_suitability: number;
  difference: number;
  is_out_of_domain: boolean;
  uncertainty: string;
}

export interface HotspotCategoryItem {
  code: 'EMERGING' | 'PERSISTENT' | 'DECLINING' | 'RANGE_SHIFT' | 'LOW_UNSUITABLE';
  label: string;
  badge_color: string;
  description: string;
  count: number;
  area_km2: number;
  percentage: number;
  cells: HotspotCellItem[];
}

export interface SpeciesHotspotsClassificationResponse {
  species_name: string;
  target_year: number;
  scenario: string;
  thresholds: {
    low_threshold: number;
    high_threshold: number;
    documentation: string;
  };
  summary: {
    total_cells_evaluated: number;
    emerging_hotspots_count: number;
    emerging_area_km2: number;
    persistent_hotspots_count: number;
    persistent_area_km2: number;
    declining_habitat_count: number;
    declining_area_km2: number;
    range_shift_count: number;
    range_shift_area_km2: number;
    low_unsuitable_count: number;
    low_unsuitable_area_km2: number;
  };
  summary_counts?: {
    emerging_hotspots?: number;
    persistent_hotspots?: number;
    declining_habitat?: number;
    range_shift?: number;
    low_unsuitable?: number;
  };
  category_areas_km2?: {
    emerging_hotspots?: number;
    persistent_hotspots?: number;
    declining_habitat?: number;
    range_shift?: number;
    low_unsuitable?: number;
  };
  categories: {
    EMERGING_HOTSPOTS: HotspotCategoryItem;
    PERSISTENT_HOTSPOTS: HotspotCategoryItem;
    DECLINING_HABITAT: HotspotCategoryItem;
    RANGE_SHIFT: HotspotCategoryItem;
    LOW_UNSUITABLE: HotspotCategoryItem;
  };
}

export interface SpeciesPersistenceResponse {
  species_name: string;
  target_year: number;
  scenario: string;
  projected_habitat_suitability_score: number;
  projected_occurrence_probability: number;
  presence_probability_percent?: number;
  status_label?: string;
  confidence: 'High' | 'Medium' | 'Low';
  persistence_status: string;
  persistence_description: string;
  terminology_standards: {
    habitat_suitability_label: string;
    occurrence_probability_label: string;
    persistence_label: string;
    scientific_caveat: string;
  };
  contributing_factors: {
    model_mean_suitability: number;
    environmental_compatibility_score: number;
    depth_compatibility_score: number;
    historical_records_backing: number;
    out_of_domain_uncertainty_pct: number;
  };
  factor_breakdown?: Record<string, number>;
}

export interface EnvironmentalDriverItem {
  variable: string;
  variable_name?: string;
  importance: number;
  importance_score?: number;
  importance_pct: number;
  unit: string;
  source: string;
  trend: string;
  mechanism: string;
}

export interface SpeciesEnvironmentalDriversResponse {
  species_name: string;
  model_version: string;
  drivers: EnvironmentalDriverItem[];
  dominant_driver: string;
  validation_auc: number;
}

export interface EDNASamplingStation {
  station_id: string;
  locality: string;
  latitude: number;
  longitude: number;
  sampling_depth_m: number;
  event_date: string;
  water_body: string;
  copies_per_liter: number;
}

export interface SpeciesEDNAIntelligenceResponse {
  species_name: string;
  status: string;
  detection_status?: string;
  is_detected: boolean;
  evidence_strength: string;
  marker_type: string;
  marker_gene?: string;
  sampling_depth_m?: number;
  sampling_locations: EDNASamplingStation[];
  sampling_stations?: any[];
  total_stations_sampled: number;
  summary: string;
  scientific_precaution: string;
}

export interface TimelineYearPoint {
  year: number;
  scenario: string;
  habitat_suitability_score: number;
  habitat_suitability_percent?: number;
  hotspots_count: number;
  habitat_gain_km2: number;
  habitat_loss_km2: number;
  net_change_km2: number;
  predicted_depth_shift_m: number;
  centroid_shift_km: number;
  latitudinal_shift_degrees: number;
  projected_occurrence_probability: number;
  confidence: string;
  validation_auc: number;
}

export interface SpeciesTimelineResponse {
  species_name: string;
  scenario: string;
  timeline: TimelineYearPoint[];
  decadal_timeline?: TimelineYearPoint[];
}

export interface Section1SpeciesIntelligence {
  scientific_name: string;
  common_name: string;
  taxonomic_classification?: string;
  geographic_range?: string;
  current_habitat_suitability_percent?: number;
  future_persistence_projection?: {
    presence_probability_percent?: number;
    status_label?: string;
  };
  taxonomy?: {
    kingdom?: string;
    phylum?: string;
    class?: string;
    order?: string;
    family?: string;
    genus?: string;
    species?: string;
  };
  current_geographic_range: {
    water_bodies: string[];
    lat_bounds: number[];
    lon_bounds: number[];
    summary: string;
  };
  current_observed_depth_range: string;
  core_depth_range: string;
  occurrence_records_count: number;
  data_sources: string[];
  current_habitat_suitability: number;
  future_habitat_suitability: number;
  future_presence_projection: number;
  persistence_status: string;
  model_confidence: 'High' | 'Medium' | 'Low';
  evidence_availability: string;
  edna_status: string;
  depth_intelligence: SpeciesDepthIntelligence;
  persistence_intelligence: SpeciesPersistenceResponse;
  edna_intelligence: SpeciesEDNAIntelligenceResponse;
}

export interface LiveOceanMetric {
  key: string;
  label: string;
  value: number | string;
  unit: string;
  timestamp: string;
  data_source: string;
  spatial_location: string;
  data_age: string;
  status: string;
}

export interface LiveOceanConditionsResponse {
  water_body: string;
  region_name: string;
  coordinates: { lat: number; lon: number };
  timestamp: string;
  data_mode: string;
  metrics: LiveOceanMetric[];
}

export interface DailyTimeSeriesPoint {
  time: string;
  value: number;
  unit: string;
}

export interface DailyMarineConditionsResponse {
  water_body: string;
  coordinates: { lat: number; lon: number };
  date: string;
  display_title: string;
  charts: {
    temperature_24h: DailyTimeSeriesPoint[];
    wave_height_24h: DailyTimeSeriesPoint[];
    wind_speed_24h: DailyTimeSeriesPoint[];
    sea_level_24h: DailyTimeSeriesPoint[];
    current_velocity_24h?: DailyTimeSeriesPoint[];
  };
  summary_24h: {
    temp_min: number;
    temp_max: number;
    wave_max: number;
    wind_max: number;
    tide_range_m: number;
    mean_salinity_psu: number;
    dissolved_oxygen_mean: number;
    chlorophyll_mean: number;
  };
  data_provenance: string;
}

export interface MonthlyMetricItem {
  variable: string;
  current: number;
  monthly_mean: number;
  historical_baseline: number;
  anomaly: number;
  unit: string;
  trend_direction: string;
  status: string;
}

export interface MonthlyOceanIntelligenceResponse {
  water_body: string;
  current_month: string;
  previous_month: string;
  marine_heatwave_status: string;
  metrics: {
    sst: MonthlyMetricItem;
    chlorophyll: MonthlyMetricItem;
    salinity: MonthlyMetricItem;
    dissolved_oxygen: MonthlyMetricItem;
    wave_height: MonthlyMetricItem;
  };
  annual_trend_series: {
    months: string[];
    temperature: number[];
    salinity: number[];
    chlorophyll: number[];
    dissolved_oxygen: number[];
  };
  provenance: string;
}

export interface MarineHazardItem {
  id: string;
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE' | 'LOW' | 'NORMAL';
  status: string;
  source: string;
  official_warning?: boolean;
  scientific_standard?: string;
  latest_earthquake?: any;
  data?: any;
  [key: string]: any;
}

export interface MarineHazardAlert {
  severity: string;
  code: string;
  title: string;
  source: string;
  timestamp: string;
  location: string;
  evidence: string;
}

export interface MarineHazardSummaryResponse {
  water_body: string;
  species_name: string;
  marine_risk_index: {
    score: number;
    label: string;
    components: {
      tsunami_score: number;
      cyclone_score: number;
      marine_heatwave_score: number;
      extreme_waves_score: number;
      hypoxia_score: number;
      pollution_score: number;
    };
    methodology: string;
  };
  active_alerts: MarineHazardAlert[];
  hazards: MarineHazardItem[];
}

export interface GBIFOccurrenceRecord {
  gbif_id: number | string;
  scientific_name: string;
  latitude: number;
  longitude: number;
  observation_date: string;
  year?: number;
  month?: number;
  depth_m?: number;
  basis_of_record: string;
  institution_code?: string;
  dataset_key: string;
  dataset_name?: string;
  collector?: string;
  coordinate_uncertainty_m?: number;
  media_url?: string;
}

export interface GBIFDatasetItem {
  dataset_key: string;
  dataset_name: string;
  publisher: string;
  institution: string;
  record_count: number;
  license: string;
  source_link: string;
}

export interface GBIFSpeciesResponse {
  scientific_name: string;
  accepted_scientific_name: string;
  canonical_name: string;
  common_name?: string;
  taxon_key: number;
  classification: {
    kingdom: string;
    phylum: string;
    class: string;
    order: string;
    family: string;
    genus: string;
    species: string;
  };
  total_gbif_occurrences: number;
  retrieved_occurrences_count: number;
  depth_supported_records: number;
  occurrences: GBIFOccurrenceRecord[];
  datasets_used: GBIFDatasetItem[];
  temporal_distribution: {
    by_year: { year: string; count: number }[];
    by_month: Record<string, number>;
    by_depth: Record<string, number>;
  };
  source: string;
}

export interface OBISOccurrenceRecord {
  obis_id: string;
  aphia_id?: number | string;
  scientific_name: string;
  latitude: number;
  longitude: number;
  observation_date: string;
  min_depth_m?: number;
  max_depth_m?: number;
  bathymetry_m?: number;
  sst_c?: number;
  sss_psu?: number;
  dataset_id?: string;
  dataset_name?: string;
  marine_flag: boolean;
  dna_edna_available: boolean;
}

export interface OBISSpeciesResponse {
  scientific_name: string;
  aphia_id: string;
  total_obis_occurrences: number;
  retrieved_records_count: number;
  marine_specific_records: OBISOccurrenceRecord[];
  source: string;
}

export interface SpeciesEvidenceFusionResponse {
  species_name: string;
  fusion_summary: {
    gbif_records: number;
    obis_records: number;
    cmlre_records: number;
    edna_records: number;
    total_input_observations: number;
    unique_combined_records: number;
    duplicate_records_removed: number;
    depth_supported_records: number;
    geographically_valid_records: number;
  };
  quality_assurance: {
    coordinate_scrubbing: string;
    taxonomic_reconciliation: string;
    depth_integrity: string;
    duplicate_detection_tolerance: string;
  };
  data_provenance: string;
}

export interface AIMarineAnalystResponse {
  species_name: string;
  water_body: string;
  time_scale: string;
  target_year: number;
  scenario: string;
  questions_and_answers: { question: string; answer: string }[];
  provenance: string;
}

export interface DataQualityResponse {
  species_name: string;
  overall_quality_score: number;
  metrics: {
    spatial_coverage_percent: number;
    completeness_percent: number;
    spatial_uncertainty_km: number;
    temporal_uncertainty_days: number;
    depth_coverage_percent: number;
    total_validated_observations: number;
    model_cross_validation_auc: number;
    forecast_uncertainty_percent: number;
  };
  provenance_breakdown: Record<string, string>;
}

export interface FutureForecastResponse {
  species_name: string;
  water_body: string;
  target_year: number;
  scenario: 'SSP1-2.6' | 'SSP2-4.5' | 'SSP5-8.5';
  scenario_description: string;
  status: 'STABLE' | 'VULNERABLE' | 'CRITICAL RISK' | 'EXTIRPATION RISK';
  status_label: string;
  status_color: string;
  habitat_suitability_percent: number;
  extinction_vulnerability_index: number;
  projected_sst_rise_celsius: number;
  projected_omz_shoaling_meters: number;
  projected_ph_drop: number;
  predicted_depth_shift_meters: number;
  predicted_latitudinal_shift_degrees: number;
  carbon_loss_tons?: number;
  revenue_risk_crores?: number;
  trophic_cascade?: TrophicCascadeItem[];
  recommended_waypoints?: CruiseWaypoint[];
  scientific_narrative: string;
  trajectory: TrajectoryPoint[];
  mitigation_actions: string[];
  // Enriched Future Ocean Intelligence data
  spatial_grid_cells?: GridCell[];
  validation_metrics?: {
    roc_auc: number;
    pr_auc: number;
    f1_score: number;
    precision: number;
    recall: number;
    tss: number;
    validation_methodology: string;
  };
  feature_importance?: Record<string, number>;
  future_hotspots?: FutureHotspot[];
  habitat_shift?: HabitatShiftResponse;
  habitat_change?: HabitatChangeResponse;
  provenance?: {
    historical_occurrence_dataset: string;
    historical_records_used: number;
    environmental_cast_source: string;
    surface_aws_source: string;
    future_climate_dataset: string;
    training_domain_temperature_range: string;
    training_domain_depth_range: string;
    analysis_timestamp: string;
  };
  // Newly Added Modules
  depth_intelligence?: SpeciesDepthIntelligence;
  hotspot_classification?: SpeciesHotspotsClassificationResponse;
  persistence_intelligence?: SpeciesPersistenceResponse;
  persistence_projection?: SpeciesPersistenceResponse;
  environmental_drivers_breakdown?: SpeciesEnvironmentalDriversResponse;
  environmental_drivers?: SpeciesEnvironmentalDriversResponse;
  edna_intelligence?: SpeciesEDNAIntelligenceResponse;
  timeline_intelligence?: SpeciesTimelineResponse;
  timeline?: SpeciesTimelineResponse;
  section1_species_intelligence?: Section1SpeciesIntelligence;
  species_profile?: Section1SpeciesIntelligence;
  // Real-Time, Daily, Monthly, Hazards, GBIF, OBIS & Risk Intelligence
  live_ocean?: LiveOceanConditionsResponse;
  daily_marine?: DailyMarineConditionsResponse;
  monthly_ocean?: MonthlyOceanIntelligenceResponse;
  marine_hazards?: MarineHazardSummaryResponse;
  gbif_data?: GBIFSpeciesResponse;
  obis_data?: OBISSpeciesResponse;
  species_evidence_fusion?: SpeciesEvidenceFusionResponse;
  ai_marine_analyst?: AIMarineAnalystResponse;
  data_quality?: DataQualityResponse;
}

export class FutureForecastService {
  private static instance: FutureForecastService;

  private constructor() {}

  public static getInstance(): FutureForecastService {
    if (!FutureForecastService.instance) {
      FutureForecastService.instance = new FutureForecastService();
    }
    return FutureForecastService.instance;
  }

  // --- Real-Time & Temporal Ocean Conditions ---

  async getLiveOcean(waterBody: string = 'Arabian Sea'): Promise<LiveOceanConditionsResponse> {
    const res = await fetch(`${RAG_API_BASE_URL}/api/ocean/live?water_body=${encodeURIComponent(waterBody)}`);
    if (!res.ok) throw new Error('Failed to fetch live ocean conditions');
    return await res.json();
  }

  async getDailyMarine(waterBody: string = 'Arabian Sea'): Promise<DailyMarineConditionsResponse> {
    const res = await fetch(`${RAG_API_BASE_URL}/api/ocean/daily?water_body=${encodeURIComponent(waterBody)}`);
    if (!res.ok) throw new Error('Failed to fetch 24-hour marine conditions');
    return await res.json();
  }

  async getMonthlyOcean(waterBody: string = 'Arabian Sea'): Promise<MonthlyOceanIntelligenceResponse> {
    const res = await fetch(`${RAG_API_BASE_URL}/api/ocean/monthly?water_body=${encodeURIComponent(waterBody)}`);
    if (!res.ok) throw new Error('Failed to fetch monthly ocean intelligence');
    return await res.json();
  }

  // --- Marine Hazard Intelligence ---

  async getMarineHazards(waterBody: string = 'Arabian Sea', speciesName: string = 'Puerulus sewelli'): Promise<MarineHazardSummaryResponse> {
    const res = await fetch(`${RAG_API_BASE_URL}/api/hazards/summary?water_body=${encodeURIComponent(waterBody)}&species_name=${encodeURIComponent(speciesName)}`);
    if (!res.ok) throw new Error('Failed to fetch marine hazard intelligence');
    return await res.json();
  }

  // --- GBIF, OBIS & Species Evidence Fusion ---

  async getSpeciesGBIF(speciesName: string): Promise<GBIFSpeciesResponse> {
    const res = await fetch(`${RAG_API_BASE_URL}/api/species/${encodeURIComponent(speciesName)}/gbif`);
    if (!res.ok) throw new Error('Failed to fetch GBIF species intelligence');
    return await res.json();
  }

  async getSpeciesOBIS(speciesName: string): Promise<OBISSpeciesResponse> {
    const res = await fetch(`${RAG_API_BASE_URL}/api/species/${encodeURIComponent(speciesName)}/obis`);
    if (!res.ok) throw new Error('Failed to fetch OBIS marine occurrence data');
    return await res.json();
  }

  async getSpeciesFusion(speciesName: string): Promise<SpeciesEvidenceFusionResponse> {
    const res = await fetch(`${RAG_API_BASE_URL}/api/species/${encodeURIComponent(speciesName)}/fusion`);
    if (!res.ok) throw new Error('Failed to fetch species evidence fusion');
    return await res.json();
  }

  // --- Grounded AI Marine Analyst ---

  async getAIMarineAnalyst(
    speciesName: string = 'Puerulus sewelli',
    waterBody: string = 'Arabian Sea',
    timeScale: string = 'NOW',
    targetYear: number = 2030,
    scenario: string = 'SSP2-4.5'
  ): Promise<AIMarineAnalystResponse> {
    const params = new URLSearchParams({
      species_name: speciesName,
      water_body: waterBody,
      time_scale: timeScale,
      target_year: targetYear.toString(),
      scenario: scenario
    });
    const res = await fetch(`${RAG_API_BASE_URL}/api/analyst/explain?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch AI Marine Analyst report');
    return await res.json();
  }

  async getDataQuality(speciesName: string = 'Puerulus sewelli'): Promise<DataQualityResponse> {
    const res = await fetch(`${RAG_API_BASE_URL}/api/data-quality?species_name=${encodeURIComponent(speciesName)}`);
    if (!res.ok) throw new Error('Failed to fetch data quality metrics');
    return await res.json();
  }

  async getFutureSources(): Promise<FutureDataRegistrySource[]> {
    const res = await fetch(`${RAG_API_BASE_URL}/future-data/sources`);
    if (!res.ok) throw new Error('Failed to fetch future data sources');
    const data = await res.json();
    return data.sources || [];
  }

  async checkFutureAvailability(
    species: string,
    targetYear: number,
    scenario: string = 'SSP2-4.5'
  ): Promise<FutureAvailabilityResponse> {
    const params = new URLSearchParams({
      species,
      target_year: targetYear.toString(),
      scenario
    });
    const res = await fetch(`${RAG_API_BASE_URL}/future-data/availability?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to verify future projection availability');
    return await res.json();
  }

  async predictFutureHabitat(
    speciesName: string = 'Puerulus sewelli',
    waterBody: string = 'All',
    targetYear: number = 2030,
    scenario: string = 'SSP2-4.5'
  ): Promise<any> {
    const res = await fetch(`${RAG_API_BASE_URL}/future-habitat/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        species_name: speciesName,
        water_body: waterBody,
        target_year: targetYear,
        scenario: scenario
      })
    });
    if (!res.ok) throw new Error('Failed to run habitat prediction');
    return await res.json();
  }

  async getFutureHotspots(
    speciesName: string = 'Puerulus sewelli',
    targetYear: number = 2030,
    scenario: string = 'SSP2-4.5',
    quantileThreshold: number = 0.80
  ): Promise<{ hotspots: FutureHotspot[]; threshold_applied: number; methodology: string }> {
    const res = await fetch(`${RAG_API_BASE_URL}/future-habitat/hotspots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        species_name: speciesName,
        target_year: targetYear,
        scenario: scenario,
        quantile_threshold: quantileThreshold
      })
    });
    if (!res.ok) throw new Error('Failed to detect future hotspots');
    return await res.json();
  }

  async getHabitatChange(
    speciesName: string = 'Puerulus sewelli',
    targetYear: number = 2030,
    scenario: string = 'SSP2-4.5'
  ): Promise<HabitatChangeResponse> {
    const res = await fetch(`${RAG_API_BASE_URL}/future-habitat/change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        species_name: speciesName,
        target_year: targetYear,
        scenario: scenario
      })
    });
    if (!res.ok) throw new Error('Failed to calculate habitat change');
    return await res.json();
  }

  async getHabitatShift(
    speciesName: string = 'Puerulus sewelli',
    targetYear: number = 2030,
    scenario: string = 'SSP2-4.5'
  ): Promise<HabitatShiftResponse> {
    const res = await fetch(`${RAG_API_BASE_URL}/future-habitat/shift`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        species_name: speciesName,
        target_year: targetYear,
        scenario: scenario
      })
    });
    if (!res.ok) throw new Error('Failed to calculate habitat shift');
    return await res.json();
  }

  async explainFuturePrediction(
    question: string,
    speciesName: string = 'Puerulus sewelli',
    targetYear: number = 2030,
    scenario: string = 'SSP2-4.5'
  ): Promise<AIExplanationResponse> {
    const res = await fetch(`${RAG_API_BASE_URL}/future-habitat/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        species_name: speciesName,
        target_year: targetYear,
        scenario: scenario
      })
    });
    if (!res.ok) throw new Error('Failed to generate AI explanation');
    return await res.json();
  }

  async compareMultiSpecies(
    speciesList: string[],
    targetYear: number = 2030,
    scenario: string = 'SSP2-4.5'
  ): Promise<MultiSpeciesHotspotResponse> {
    const res = await fetch(`${RAG_API_BASE_URL}/future-habitat/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        species_list: speciesList,
        target_year: targetYear,
        scenario: scenario
      })
    });
    if (!res.ok) throw new Error('Failed to compare multi-species hotspots');
    return await res.json();
  }

  async getSpeciesDepth(
    speciesName: string = 'Puerulus sewelli',
    targetYear: number = 2030,
    scenario: string = 'SSP2-4.5'
  ): Promise<SpeciesDepthIntelligence> {
    const enc = encodeURIComponent(speciesName);
    const res = await fetch(`${RAG_API_BASE_URL}/api/species/${enc}/depth?target_year=${targetYear}&scenario=${scenario}`);
    if (!res.ok) throw new Error('Failed to fetch species depth intelligence');
    const data = await res.json();
    return data.depth_intelligence;
  }

  async getSpeciesCurrentHabitat(
    speciesName: string = 'Puerulus sewelli',
    waterBody: string = 'All'
  ): Promise<any> {
    const enc = encodeURIComponent(speciesName);
    const res = await fetch(`${RAG_API_BASE_URL}/api/species/${enc}/habitat/current?water_body=${encodeURIComponent(waterBody)}`);
    if (!res.ok) throw new Error('Failed to fetch current habitat suitability');
    return await res.json();
  }

  async getSpeciesFutureHabitat(
    speciesName: string = 'Puerulus sewelli',
    waterBody: string = 'All',
    targetYear: number = 2030,
    scenario: string = 'SSP2-4.5'
  ): Promise<any> {
    const enc = encodeURIComponent(speciesName);
    const res = await fetch(`${RAG_API_BASE_URL}/api/species/${enc}/habitat/future?water_body=${encodeURIComponent(waterBody)}&target_year=${targetYear}&scenario=${scenario}`);
    if (!res.ok) throw new Error('Failed to fetch future habitat suitability');
    return await res.json();
  }

  async getSpeciesHotspots(
    speciesName: string = 'Puerulus sewelli',
    targetYear: number = 2030,
    scenario: string = 'SSP2-4.5',
    lowThreshold: number = 0.40,
    highThreshold: number = 0.60
  ): Promise<SpeciesHotspotsClassificationResponse> {
    const enc = encodeURIComponent(speciesName);
    const res = await fetch(`${RAG_API_BASE_URL}/api/species/${enc}/hotspots?target_year=${targetYear}&scenario=${scenario}&low_threshold=${lowThreshold}&high_threshold=${highThreshold}`);
    if (!res.ok) throw new Error('Failed to fetch species hotspot classification');
    const data = await res.json();
    return data.hotspots;
  }

  async getSpeciesRangeShift(
    speciesName: string = 'Puerulus sewelli',
    targetYear: number = 2030,
    scenario: string = 'SSP2-4.5'
  ): Promise<HabitatShiftResponse> {
    const enc = encodeURIComponent(speciesName);
    const res = await fetch(`${RAG_API_BASE_URL}/api/species/${enc}/range-shift?target_year=${targetYear}&scenario=${scenario}`);
    if (!res.ok) throw new Error('Failed to fetch species range shift');
    const data = await res.json();
    return data.range_shift;
  }

  async getSpeciesPersistence(
    speciesName: string = 'Puerulus sewelli',
    targetYear: number = 2030,
    scenario: string = 'SSP2-4.5'
  ): Promise<SpeciesPersistenceResponse> {
    const enc = encodeURIComponent(speciesName);
    const res = await fetch(`${RAG_API_BASE_URL}/api/species/${enc}/persistence?target_year=${targetYear}&scenario=${scenario}`);
    if (!res.ok) throw new Error('Failed to fetch species persistence');
    const data = await res.json();
    return data.persistence;
  }

  async getSpeciesEnvironmentalDrivers(
    speciesName: string = 'Puerulus sewelli'
  ): Promise<SpeciesEnvironmentalDriversResponse> {
    const enc = encodeURIComponent(speciesName);
    const res = await fetch(`${RAG_API_BASE_URL}/api/species/${enc}/environmental-drivers`);
    if (!res.ok) throw new Error('Failed to fetch species environmental drivers');
    const data = await res.json();
    return data.environmental_drivers;
  }

  async getSpeciesEDNA(
    speciesName: string = 'Puerulus sewelli'
  ): Promise<SpeciesEDNAIntelligenceResponse> {
    const enc = encodeURIComponent(speciesName);
    const res = await fetch(`${RAG_API_BASE_URL}/api/species/${enc}/edna`);
    if (!res.ok) throw new Error('Failed to fetch species eDNA intelligence');
    const data = await res.json();
    return data.edna_intelligence;
  }

  async getSpeciesTimeline(
    speciesName: string = 'Puerulus sewelli',
    scenario: string = 'SSP2-4.5'
  ): Promise<SpeciesTimelineResponse> {
    const enc = encodeURIComponent(speciesName);
    const res = await fetch(`${RAG_API_BASE_URL}/api/species/${enc}/timeline?scenario=${scenario}`);
    if (!res.ok) throw new Error('Failed to fetch species decadal timeline');
    const data = await res.json();
    return data.timeline;
  }

  async getFullSpeciesProfile(
    speciesName: string = 'Puerulus sewelli'
  ): Promise<any> {
    const enc = encodeURIComponent(speciesName);
    const res = await fetch(`${RAG_API_BASE_URL}/api/species/${enc}`);
    if (!res.ok) throw new Error('Failed to fetch full species profile');
    const data = await res.json();
    return data.profile;
  }

  async getFuturePrediction(
    speciesName: string = 'Puerulus sewelli',
    waterBody: string = 'Arabian Sea',
    targetYear: number = 2030,
    scenario: 'SSP1-2.6' | 'SSP2-4.5' | 'SSP5-8.5' = 'SSP2-4.5'
  ): Promise<FutureForecastResponse> {
    const params = new URLSearchParams({
      species_name: speciesName,
      water_body: waterBody,
      target_year: targetYear.toString(),
      scenario: scenario
    });

    const response = await fetch(`${RAG_API_BASE_URL}/predict/future-habitat?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch future prediction: ${response.statusText}`);
    }
    const data: FutureForecastResponse = await response.json();

    // Concurrently fetch Section 1 to 33 Marine Intelligence modules
    try {
      const [
        depthRes,
        hotspotsRes,
        persistenceRes,
        driversRes,
        ednaRes,
        timelineRes,
        profileRes,
        liveOceanRes,
        dailyMarineRes,
        monthlyOceanRes,
        hazardsRes,
        gbifRes,
        obisRes,
        fusionRes,
        analystRes,
        qualityRes
      ] = await Promise.allSettled([
        this.getSpeciesDepth(speciesName, targetYear, scenario),
        this.getSpeciesHotspots(speciesName, targetYear, scenario),
        this.getSpeciesPersistence(speciesName, targetYear, scenario),
        this.getSpeciesEnvironmentalDrivers(speciesName),
        this.getSpeciesEDNA(speciesName),
        this.getSpeciesTimeline(speciesName, scenario),
        this.getFullSpeciesProfile(speciesName),
        this.getLiveOcean(waterBody),
        this.getDailyMarine(waterBody),
        this.getMonthlyOcean(waterBody),
        this.getMarineHazards(waterBody, speciesName),
        this.getSpeciesGBIF(speciesName),
        this.getSpeciesOBIS(speciesName),
        this.getSpeciesFusion(speciesName),
        this.getAIMarineAnalyst(speciesName, waterBody, 'NOW', targetYear, scenario),
        this.getDataQuality(speciesName)
      ]);

      if (depthRes.status === 'fulfilled') data.depth_intelligence = depthRes.value;
      if (hotspotsRes.status === 'fulfilled') data.hotspot_classification = hotspotsRes.value;
      if (persistenceRes.status === 'fulfilled') {
        data.persistence_intelligence = persistenceRes.value;
        data.persistence_projection = persistenceRes.value;
      }
      if (driversRes.status === 'fulfilled') {
        data.environmental_drivers_breakdown = driversRes.value;
        data.environmental_drivers = driversRes.value;
      }
      if (ednaRes.status === 'fulfilled') data.edna_intelligence = ednaRes.value;
      if (timelineRes.status === 'fulfilled') {
        data.timeline_intelligence = timelineRes.value;
        data.timeline = timelineRes.value;
      }
      if (profileRes.status === 'fulfilled' && profileRes.value?.section1_species_intelligence) {
        data.section1_species_intelligence = profileRes.value.section1_species_intelligence;
        data.species_profile = profileRes.value.section1_species_intelligence;
      }
      if (liveOceanRes.status === 'fulfilled') data.live_ocean = liveOceanRes.value;
      if (dailyMarineRes.status === 'fulfilled') data.daily_marine = dailyMarineRes.value;
      if (monthlyOceanRes.status === 'fulfilled') data.monthly_ocean = monthlyOceanRes.value;
      if (hazardsRes.status === 'fulfilled') data.marine_hazards = hazardsRes.value;
      if (gbifRes.status === 'fulfilled') data.gbif_data = gbifRes.value;
      if (obisRes.status === 'fulfilled') data.obis_data = obisRes.value;
      if (fusionRes.status === 'fulfilled') data.species_evidence_fusion = fusionRes.value;
      if (analystRes.status === 'fulfilled') data.ai_marine_analyst = analystRes.value;
      if (qualityRes.status === 'fulfilled') data.data_quality = qualityRes.value;
    } catch (e) {
      console.warn('Optional future intelligence enrichment completed with partial data:', e);
    }

    return data;
  }
}

export default FutureForecastService.getInstance();
