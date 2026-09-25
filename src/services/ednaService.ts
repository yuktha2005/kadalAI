/**
 * Service for interacting with the eDNA Sequence Matcher API
 * Handles eDNA sequence matching and species identification
 * 
 * API Endpoint: GET /edna/match_sequence
 * Base URL: https://Kadal AI-e-dna-2.vercel.app
 */

const EDNA_API_BASE_URL = process.env.REACT_APP_EDNA_API_URL || 'https://Kadal AI-e-dna-2.vercel.app';

export interface EDNAMatch {
  specimen_id: string;
  scientificName: string;
  confidence: number;
  reference_length: number;
}

export interface EDNASummary {
  top_match_specimen_id: string;
  top_match_scientificName: string;
  confidence: number;
  num_reference_sequences_compared: number;
}

export interface EDNAMatchResponse {
  raw_sequence: string;
  marker_type: string;
  sequence_length: number;
  matches: EDNAMatch[];
  summary: EDNASummary;
}

export interface EDNAErrorResponse {
  detail?: string | Array<{ loc: (string | number)[]; msg: string; type: string }>;
  message?: string;
}

export class EDNAService {
  private static instance: EDNAService;

  private constructor() {}

  public static getInstance(): EDNAService {
    if (!EDNAService.instance) {
      EDNAService.instance = new EDNAService();
    }
    return EDNAService.instance;
  }

  /**
   * Match eDNA sequence to identify species
   * @param rawSequence - Raw DNA sequence string (without FASTA header)
   * @returns Match result with species identification, matches, and summary
   */
  async matchSequence(rawSequence: string): Promise<EDNAMatchResponse> {
    try {
      // Clean the sequence - remove whitespace and ensure uppercase
      const cleanSequence = rawSequence.trim().toUpperCase().replace(/\s+/g, '');

      if (!cleanSequence) {
        throw new Error('Sequence cannot be empty');
      }

      // Validate sequence contains only valid DNA characters
      if (!/^[ACGTN]+$/i.test(cleanSequence)) {
        throw new Error('Invalid DNA sequence. Sequence must contain only A, C, G, T, or N characters.');
      }

      // Use GET request with raw_sequence as query parameter
      const encodedSequence = encodeURIComponent(cleanSequence);
      const response = await fetch(`${EDNA_API_BASE_URL}/edna/match_sequence?raw_sequence=${encodedSequence}`, {
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

      // Validate response structure matches expected format
      if (!data.raw_sequence || !data.matches || !data.summary) {
        throw new Error('Invalid API response format: missing required fields');
      }
      
      // Validate summary structure
      if (!data.summary.top_match_specimen_id || 
          !data.summary.top_match_scientificName || 
          typeof data.summary.confidence !== 'number' ||
          typeof data.summary.num_reference_sequences_compared !== 'number') {
        throw new Error('Invalid API response format: summary missing required fields');
      }
      
      // Validate matches array structure
      if (Array.isArray(data.matches)) {
        for (const match of data.matches) {
          if (!match.specimen_id || !match.scientificName || 
              typeof match.confidence !== 'number' ||
              typeof match.reference_length !== 'number') {
            throw new Error('Invalid API response format: matches array contains invalid entries');
          }
        }
      }

      return data as EDNAMatchResponse;
    } catch (error: any) {
      console.error('eDNA API match failed:', error);
      throw error;
    }
  }
}

export default EDNAService.getInstance();

