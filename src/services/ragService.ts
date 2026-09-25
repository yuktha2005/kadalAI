/**
 * Service for interacting with the Marine RAG API
 * Handles scientific queries and marine data searches (Occurrence, CTD, AWS, ADCP)
 */

const RAG_API_BASE_URL = process.env.REACT_APP_RAG_API_URL || 'http://localhost:8000';

export type DataType = 'OCCURRENCE' | 'CTD' | 'AWS' | 'ADCP' | 'ALL';

export interface MarineDataRecord {
  _id?: string;
  dataType?: DataType;
  // Common fields
  latitude?: number;
  longitude?: number;
  decimalLatitude?: number; // For backward compatibility
  decimalLongitude?: number; // For backward compatibility
  eventDate?: string;
  depth?: number;
  station?: string;
  cruise?: string;
  ship?: string;
  content?: string;
  similarity_score?: number;
  // Occurrence-specific fields
  scientificName?: string;
  locality?: string;
  waterBody?: string;
  samplingProtocol?: string;
  minimumDepthInMeters?: number;
  maximumDepthInMeters?: number;
  identifiedBy?: string;
  // CTD-specific fields
  pressure?: number;
  conductivity?: number;
  temperature?: number;
  salinity?: number;
  oxygen?: number;
  transmission?: number;
  attenuation?: number;
  potentialTemperature?: number;
  density?: number;
  bottomDepth?: number;
  // AWS-specific fields
  speed?: number;
  course?: number;
  heading?: number;
  windSpeed?: number;
  windDirection?: number;
  airTemperature?: number;
  humidity?: number;
  atmosphericPressure?: number; // Renamed to avoid conflict with CTD pressure
  dewPoint?: number;
  solarRadiation?: number;
  rainfall?: number;
  seaSurfaceTemperature?: number;
  // ADCP-specific fields
  ensemble?: number;
  eastwardVelocities?: number[];
  northwardVelocities?: number[];
  magnitudeVelocities?: number[];
  directionVelocities?: number[];
  bottomDepth1?: number;
  bottomDepth2?: number;
  bottomDepth3?: number;
  bottomDepth4?: number;
  averageCurrentSpeed?: number;
}

// Backward compatibility alias
export interface Occurrence extends MarineDataRecord {}

export interface DashboardSummary {
  executive_summary: string;
  key_findings: string[];
  species_analysis: string;
  geographic_distribution: string;
  depth_analysis: string;
  temporal_patterns: string;
  research_insights: string;
}

export interface QueryResponse {
  query: string;
  answer: string;
  relevant_occurrences: MarineDataRecord[];
  sources_count: number;
  took_ms: number;
  dashboard_summary?: DashboardSummary;
}

export interface SearchResponse {
  query: string;
  filters: Record<string, any>;
  candidates: number;
  took_ms: number;
  results: MarineDataRecord[];
}

export class RAGService {
  private static instance: RAGService;

  private constructor() {}

  public static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
    }
    return RAGService.instance;
  }

  /**
   * Check if the RAG API is available
   */
  async checkHealth(): Promise<{ status: string; occurrences: number }> {
    try {
      const response = await fetch(`${RAG_API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('RAG API health check failed:', error);
      throw error;
    }
  }

  /**
   * Query the RAG system with a scientific question
   * Supports all marine data types: Occurrence, CTD, AWS, ADCP
   */
  async query(
    question: string,
    options?: {
      waterBody?: string;
      scientificName?: string;
      minDepth?: number;
      maxDepth?: number;
      topK?: number;
      similarityThreshold?: number;
      dataTypes?: DataType[]; // Filter by data types
    }
  ): Promise<QueryResponse> {
    try {
      const params = new URLSearchParams({
        question: question,
      });

      if (options?.waterBody) {
        params.append('water_body', options.waterBody);
      }
      if (options?.scientificName) {
        params.append('scientific_name', options.scientificName);
      }
      if (options?.minDepth !== undefined) {
        params.append('min_depth', options.minDepth.toString());
      }
      if (options?.maxDepth !== undefined) {
        params.append('max_depth', options.maxDepth.toString());
      }
      if (options?.topK) {
        params.append('top_k', options.topK.toString());
      }
      if (options?.similarityThreshold !== undefined) {
        params.append('similarity_threshold', options.similarityThreshold.toString());
      }
      if (options?.dataTypes && options.dataTypes.length > 0) {
        // Convert array to comma-separated string
        const dataTypesStr = options.dataTypes.join(',');
        params.append('data_types', dataTypesStr);
      }

      const response = await fetch(`${RAG_API_BASE_URL}/query?${params.toString()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Query failed: ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('RAG query failed:', error);
      throw error;
    }
  }

  /**
   * Search marine data records with filters
   * Supports all data types: Occurrence, CTD, AWS, ADCP
   */
  async search(
    query?: string,
    options?: {
      waterBody?: string;
      scientificName?: string;
      minDepth?: number;
      maxDepth?: number;
      locality?: string;
      topK?: number;
      similarityThreshold?: number;
      dataTypes?: DataType[]; // Filter by data types
    }
  ): Promise<SearchResponse> {
    try {
      const params = new URLSearchParams();

      if (query) {
        params.append('query', query);
      }
      if (options?.waterBody) {
        params.append('water_body', options.waterBody);
      }
      if (options?.scientificName) {
        params.append('scientific_name', options.scientificName);
      }
      if (options?.minDepth !== undefined) {
        params.append('min_depth', options.minDepth.toString());
      }
      if (options?.maxDepth !== undefined) {
        params.append('max_depth', options.maxDepth.toString());
      }
      if (options?.locality) {
        params.append('locality', options.locality);
      }
      if (options?.topK) {
        params.append('top_k', options.topK.toString());
      }
      if (options?.similarityThreshold !== undefined) {
        params.append('similarity_threshold', options.similarityThreshold.toString());
      }
      if (options?.dataTypes && options.dataTypes.length > 0) {
        const dataTypesStr = options.dataTypes.join(',');
        params.append('data_types', dataTypesStr);
      }

      const response = await fetch(`${RAG_API_BASE_URL}/search?${params.toString()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Search failed: ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('RAG search failed:', error);
      throw error;
    }
  }
}

export default RAGService.getInstance();

