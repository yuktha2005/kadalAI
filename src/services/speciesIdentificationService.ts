/**
 * Service for interacting with the Species Identification API
 * Handles species identification from image uploads
 */

const SPECIES_ID_API_BASE_URL = process.env.REACT_APP_SPECIES_ID_API_URL || 'https://chinmay0805-specie-identification.hf.space';

export interface TaxonomicLineageItem {
  rank: string;
  name: string;
}

export interface AverageSizeCm {
  min: number;
  max: number;
}

export interface Morphology {
  diagnosticFeatures: string[];
  averageSizeCm: AverageSizeCm;
  coloration: string;
}

export interface TypicalDepthM {
  min: number;
  max: number;
}

export interface HabitatEcology {
  environment: string;
  typicalDepthM: TypicalDepthM;
  geographicDistribution: string;
  ecologicalRole: string;
}

export interface Conservation {
  iucnStatus: string;
  majorThreats: string[];
  managementNotes: string;
}

export interface UsageAndImportance {
  fisheries: string;
  researchImportance: string;
}

export interface ImageAnalysisNotes {
  visibleFeaturesUsedForID: string[];
  imageQualityIssues: string[];
}

export interface DataProvenance {
  modelVersion: string;
  inferenceTimestamp: string;
}

export interface SpeciesIdentificationResponse {
  scientificName: string;
  commonName: string;
  confidence: number;
  rank: string;
  taxonomicLineage: TaxonomicLineageItem[];
  morphology: Morphology;
  habitatEcology: HabitatEcology;
  conservation: Conservation;
  usageAndImportance: UsageAndImportance;
  imageAnalysisNotes: ImageAnalysisNotes;
  dataProvenance: DataProvenance;
}

export interface SpeciesIdentificationError {
  detail?: string | Array<{ loc: (string | number)[]; msg: string; type: string }>;
  error?: string;
  message?: string;
}

export class SpeciesIdentificationService {
  private static instance: SpeciesIdentificationService;

  private constructor() {}

  public static getInstance(): SpeciesIdentificationService {
    if (!SpeciesIdentificationService.instance) {
      SpeciesIdentificationService.instance = new SpeciesIdentificationService();
    }
    return SpeciesIdentificationService.instance;
  }

  /**
   * Identify species from an uploaded image file
   * @param file - Image file to identify
   * @returns Species identification result
   */
  async identify(file: File): Promise<SpeciesIdentificationResponse> {
    try {
      const formData = new FormData();
      
      // API expects the field name to be 'image' based on error: body.image: Field required
      formData.append('image', file);

      // Use POST method (standard for file uploads in FastAPI)
      const response = await fetch(`${SPECIES_ID_API_BASE_URL}/identify`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        // For 422 errors, show more detailed validation error
        if (response.status === 422) {
          throw new Error(`Validation error: ${errorData}. Please check if the file format is correct.`);
        }
        throw new Error(`API request failed (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      return this.validateResponse(data);
    } catch (error) {
      console.error('Species Identification API error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to identify species');
    }
  }


  /**
   * Validate and parse the API response
   */
  private validateResponse(data: any): SpeciesIdentificationResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format from API');
    }

    // Check for error response
    if (data.detail || data.error || data.message) {
      const errorMsg = data.detail || data.error || data.message;
      throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }

    return data as SpeciesIdentificationResponse;
  }

  /**
   * Parse error response from API
   */
  private async parseErrorResponse(response: Response): Promise<string> {
    try {
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return text || response.statusText || 'Unknown error';
      }

      // Handle FastAPI validation errors (422)
      if (data.detail) {
        if (Array.isArray(data.detail)) {
          // Format validation errors nicely
          return data.detail.map((d: any) => {
            if (d.loc && d.msg) {
              const field = d.loc.join('.');
              return `${field}: ${d.msg}`;
            }
            return d.msg || JSON.stringify(d);
          }).join('; ');
        }
        return String(data.detail);
      }
      if (data.error) return String(data.error);
      if (data.message) return String(data.message);
      return JSON.stringify(data);
    } catch (e) {
      return response.statusText || 'Unknown error';
    }
  }
}

export default SpeciesIdentificationService.getInstance();
