const RAG_API_BASE_URL = process.env.REACT_APP_RAG_API_URL || 'http://localhost:8000';

export interface TrajectoryPoint {
  year: number;
  habitat_suitability: number;
  sst_anomaly_celsius: number;
  omz_shoaling_meters: number;
  extinction_risk_score: number;
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
  scientific_narrative: string;
  trajectory: TrajectoryPoint[];
  mitigation_actions: string[];
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
    return await response.json();
  }
}

export default FutureForecastService.getInstance();
