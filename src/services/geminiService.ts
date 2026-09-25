/**
 * Service for interacting with Google Gemini API
 * Note: Gemini SDK has been removed from the frontend for security.
 * These methods will be wired to the FastAPI backend in Phase 2/3.
 */

export class GeminiService {
  private static instance: GeminiService;

  private constructor() {}

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  async checkQueryRelevance(query: string): Promise<{ isRelevant: boolean; reason?: string }> {
    console.warn('Gemini has been moved to the backend. Skipping relevance check on frontend.');
    return { isRelevant: true };
  }

  async getSpeciesSummary(
    scientificName: string,
    rank?: string,
    lineage?: Array<{ rank: string; name: string }>
  ): Promise<string> {
    console.warn('Gemini has been moved to the backend. Cannot fetch summary.');
    return 'Summary generation is currently disabled while the AI is migrating to the new secure backend.';
  }
}

export default GeminiService.getInstance();
