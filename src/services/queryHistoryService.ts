/**
 * Service for managing query history
 * Handles saving and retrieving RAG query results
 */

import { supabase } from './supabaseClient';
import { QueryResponse } from './ragService';
import { SearchResultSummary } from '../components/SearchResultsView';

export interface QueryHistoryRecord {
  id: string;
  query: string;
  query_options: {
    waterBody?: string;
    scientificName?: string;
    minDepth?: number;
    maxDepth?: number;
    dataTypes?: string[];
  } | null;
  response_data: QueryResponse;
  created_at: string;
  updated_at: string;
}

export interface QueryHistoryItem {
  id: string;
  query: string;
  query_options: QueryHistoryRecord['query_options'];
  created_at: string;
  // Summary fields for quick display
  answer_preview: string;
  sources_count: number;
  has_dashboard_summary: boolean;
}

export class QueryHistoryService {
  private static instance: QueryHistoryService;

  private constructor() {}

  public static getInstance(): QueryHistoryService {
    if (!QueryHistoryService.instance) {
      QueryHistoryService.instance = new QueryHistoryService();
    }
    return QueryHistoryService.instance;
  }

  /**
   * Save a query and its response to history
   */
  async saveQuery(
    query: string,
    queryOptions: {
      waterBody?: string;
      scientificName?: string;
      minDepth?: number;
      maxDepth?: number;
      dataTypes?: string[];
    } | null,
    response: QueryResponse
  ): Promise<QueryHistoryRecord | null> {
    try {
      const { data, error } = await supabase
        .from('query_history')
        .insert([
          {
            query: query.trim(),
            query_options: queryOptions || null,
            response_data: response,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error saving query to history:', error);
        throw error;
      }

      return data as QueryHistoryRecord;
    } catch (error) {
      console.error('Failed to save query history:', error);
      return null;
    }
  }

  /**
   * Get all query history records (for listing)
   */
  async getAllQueries(limit: number = 50): Promise<QueryHistoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('query_history')
        .select('id, query, query_options, created_at, response_data')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching query history:', error);
        throw error;
      }

      return (data || []).map((record: any) => {
        const response = record.response_data as QueryResponse;
        return {
          id: record.id,
          query: record.query,
          query_options: record.query_options,
          created_at: record.created_at,
          answer_preview: response.answer
            ? response.answer.substring(0, 150) + (response.answer.length > 150 ? '...' : '')
            : 'No answer available',
          sources_count: response.sources_count || 0,
          has_dashboard_summary: !!response.dashboard_summary,
        };
      });
    } catch (error) {
      console.error('Failed to fetch query history:', error);
      return [];
    }
  }

  /**
   * Get a specific query by ID with full response data
   */
  async getQueryById(id: string): Promise<QueryHistoryRecord | null> {
    try {
      const { data, error } = await supabase
        .from('query_history')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching query by ID:', error);
        throw error;
      }

      return data as QueryHistoryRecord;
    } catch (error) {
      console.error('Failed to fetch query by ID:', error);
      return null;
    }
  }

  /**
   * Convert a QueryHistoryRecord to SearchResultSummary format
   * This allows restoring the query results in the SearchResultsView
   */
  convertToSearchResultSummary(record: QueryHistoryRecord): SearchResultSummary | null {
    try {
      const response = record.response_data as QueryResponse;
      
      if (!response.relevant_occurrences || response.relevant_occurrences.length === 0) {
        return null;
      }

      // Convert RAG occurrences to DataPoint format
      const ragDataPoints = response.relevant_occurrences
        .filter(occ => (occ.decimalLatitude || occ.latitude) && (occ.decimalLongitude || occ.longitude))
        .map(occ => ({
          scientificName: occ.scientificName || 'Unknown',
          locality: occ.locality || 'Unknown',
          eventDate: occ.eventDate || '',
          decimalLatitude: occ.decimalLatitude || occ.latitude || 0,
          decimalLongitude: occ.decimalLongitude || occ.longitude || 0,
          waterBody: occ.waterBody || '',
          samplingProtocol: occ.samplingProtocol || '',
          minimumDepthInMeters: occ.minimumDepthInMeters || occ.depth || 0,
          maximumDepthInMeters: occ.maximumDepthInMeters || occ.depth || 0,
          identifiedBy: occ.identifiedBy || '',
        }));

      // Get the most common species
      const speciesCounts: { [key: string]: number } = {};
      response.relevant_occurrences.forEach(occ => {
        const name = occ.scientificName || 'Unknown';
        speciesCounts[name] = (speciesCounts[name] || 0) + 1;
      });
      const mostCommonSpecies = Object.entries(speciesCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || response.relevant_occurrences[0]?.scientificName || record.query;

      // Generate charts from RAG data
      const occurrencesByYear = this.generateOccurrencesByYear(ragDataPoints);
      const depthHistogram = this.generateDepthHistogram(ragDataPoints);

      // Calculate depth range
      const resultDepths = response.relevant_occurrences
        .flatMap(occ => [
          occ.minimumDepthInMeters,
          occ.maximumDepthInMeters,
          occ.depth,
        ])
        .filter(d => d !== undefined && d !== null) as number[];

      const searchResult: SearchResultSummary = {
        scientificName: mostCommonSpecies,
        description: response.answer,
        locality: response.relevant_occurrences[0]?.locality || 'Multiple locations',
        basisOfRecord: 'Preserved Specimen',
        minDepthInMeters: resultDepths.length > 0 ? Math.min(...resultDepths) : null,
        maxDepthInMeters: resultDepths.length > 0 ? Math.max(...resultDepths) : null,
        coordinates: ragDataPoints.length > 0 ? {
          lat: ragDataPoints[0].decimalLatitude,
          lng: ragDataPoints[0].decimalLongitude,
        } : null,
        occurrencesByYear: occurrencesByYear,
        depthHistogram: depthHistogram,
        ragAnswer: response.answer,
        ragOccurrences: response.relevant_occurrences,
        ragSourcesCount: response.sources_count,
        ragQueryTime: response.took_ms,
        dashboardSummary: response.dashboard_summary,
      };

      return searchResult;
    } catch (error) {
      console.error('Error converting query history to search result:', error);
      return null;
    }
  }

  /**
   * Delete a query from history
   */
  async deleteQuery(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('query_history')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting query:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete query:', error);
      return false;
    }
  }

  /**
   * Generate occurrences by year chart data
   */
  private generateOccurrencesByYear(dataPoints: Array<{ eventDate?: string }>): Array<{ year: number; count: number }> {
    const yearCounts: { [year: number]: number } = {};
    
    dataPoints.forEach(point => {
      if (point.eventDate) {
        const year = new Date(point.eventDate).getFullYear();
        if (!isNaN(year)) {
          yearCounts[year] = (yearCounts[year] || 0) + 1;
        }
      }
    });

    return Object.entries(yearCounts)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => a.year - b.year);
  }

  /**
   * Generate depth histogram chart data
   * Matches the implementation in GlobeView
   */
  private generateDepthHistogram(
    dataPoints: Array<{ minimumDepthInMeters?: number; maximumDepthInMeters?: number }>
  ): Array<{ depth: number; count: number }> {
    const depthCounts: { [depth: number]: number } = {};
    
    dataPoints.forEach(point => {
      const minDepth = point.minimumDepthInMeters ?? 0;
      const maxDepth = point.maximumDepthInMeters ?? 0;
      // Use average depth, matching GlobeView implementation
      if (minDepth > 0 || maxDepth > 0) {
        const avgDepth = Math.round((minDepth + maxDepth) / 2);
        if (avgDepth > 0) {
          depthCounts[avgDepth] = (depthCounts[avgDepth] || 0) + 1;
        }
      }
    });

    return Object.entries(depthCounts)
      .map(([depth, count]) => ({ depth: parseInt(depth), count }))
      .sort((a, b) => a.depth - b.depth);
  }
}

export default QueryHistoryService.getInstance();

