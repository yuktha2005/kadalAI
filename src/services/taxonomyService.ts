/**
 * Service for interacting with the Taxonomy API
 * Handles taxonomic data retrieval for marine species
 */

const TAXONOMY_API_BASE_URL = process.env.REACT_APP_TAXONOMY_API_URL || 'https://taxa-2.vercel.app';

export interface LineageItem {
  rank: string;
  name: string;
  key?: number | null;
}

export interface ImageItem {
  url: string;
  source?: string | null;
}

export interface CommonNameItem {
  name: string;
  lang?: string | null;
  source?: string | null;
}

export interface DistributionItem {
  country: string;
  count: number;
}

export interface TaxonomyResponse {
  key: number;
  scientificName: string;
  authorship?: string | null;
  rank: string;
  lineage: LineageItem[];
  images: ImageItem[];
  commonNames: CommonNameItem[];
  distribution: DistributionItem[];
}

export interface TaxonomyErrorResponse {
  detail?: string | Array<{ loc: (string | number)[]; msg: string; type: string }>;
  message?: string;
}

export class TaxonomyService {
  private static instance: TaxonomyService;

  private constructor() {}

  public static getInstance(): TaxonomyService {
    if (!TaxonomyService.instance) {
      TaxonomyService.instance = new TaxonomyService();
    }
    return TaxonomyService.instance;
  }

  /**
   * Get taxonomic information for a species by scientific name
   * @param scientificName - Scientific name of the species
   * @returns Taxonomic data including name, authorship, rank, lineage, images, common names, and distribution
   */
  async getTaxon(scientificName: string): Promise<TaxonomyResponse> {
    try {
      if (!scientificName || !scientificName.trim()) {
        throw new Error('Scientific name cannot be empty');
      }

      const encodedName = encodeURIComponent(scientificName.trim());
      const response = await fetch(`${TAXONOMY_API_BASE_URL}/taxon?scientific_name=${encodedName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Read response once
      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      // Check for errors
      if (!response.ok) {
        const errorMsg = data?.detail || data?.message || JSON.stringify(data) || response.statusText;
        throw new Error(`API request failed (${response.status}): ${errorMsg}`);
      }

      // Validate response structure
      if (!data.scientificName) {
        throw new Error('Invalid API response format: missing scientificName');
      }

      return data as TaxonomyResponse;
    } catch (error: any) {
      console.error('Taxonomy API request failed:', error);
      throw error;
    }
  }
}

export default TaxonomyService.getInstance();
