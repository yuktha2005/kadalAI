import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiClock, FiTrash2, FiSearch, FiDatabase } from 'react-icons/fi';
import queryHistoryService, { QueryHistoryItem } from '../services/queryHistoryService';
import { SearchResultSummary } from './SearchResultsView';

interface QueryHistoryProps {
  onBack: () => void;
  onRestoreQuery: (result: SearchResultSummary) => void;
  onLogout?: () => void;
}

const QueryHistory: React.FC<QueryHistoryProps> = ({ onBack, onRestoreQuery, onLogout }) => {
  const [queries, setQueries] = useState<QueryHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadQueries();
  }, []);

  const loadQueries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await queryHistoryService.getAllQueries(100);
      setQueries(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load query history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreQuery = async (id: string) => {
    try {
      const record = await queryHistoryService.getQueryById(id);
      if (!record) {
        setError('Query not found');
        return;
      }

      const searchResult = queryHistoryService.convertToSearchResultSummary(record);
      if (!searchResult) {
        setError('Unable to restore query results');
        return;
      }

      onRestoreQuery(searchResult);
    } catch (e: any) {
      setError(e.message || 'Failed to restore query');
    }
  };

  const handleDeleteQuery = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this query from history?')) {
      return;
    }

    setDeletingId(id);
    try {
      const success = await queryHistoryService.deleteQuery(id);
      if (success) {
        setQueries(prev => prev.filter(q => q.id !== id));
      } else {
        setError('Failed to delete query');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to delete query');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFilterSummary = (options: QueryHistoryItem['query_options']) => {
    if (!options) return null;
    const filters: string[] = [];
    if (options.waterBody) filters.push(`Water: ${options.waterBody}`);
    if (options.scientificName) filters.push(`Species: ${options.scientificName}`);
    if (options.minDepth !== undefined || options.maxDepth !== undefined) {
      const min = options.minDepth ?? 0;
      const max = options.maxDepth ?? '∞';
      filters.push(`Depth: ${min}-${max}m`);
    }
    if (options.dataTypes && options.dataTypes.length > 0) {
      filters.push(`Types: ${options.dataTypes.join(', ')}`);
    }
    return filters.length > 0 ? filters.join(' • ') : null;
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#0F2A3A]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#D9E2E7]">
        <div className="max-w-7xl mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div 
              className="flex items-center space-x-3 cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              onClick={onBack}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border border-[#D9E2E7] bg-white shadow-sm">
                <img 
                  src="/WhatsApp Image 2025-09-29 at 03.04.02.jpeg" 
                  alt="Kadal AI Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-[#0F2A3A]">
                Kadal <span className="text-[#0F766E]">AI</span>
              </span>
            </motion.div>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#EEF3F5] border border-[#D9E2E7] text-xs font-semibold text-[#0F766E] transition-all duration-150 shadow-sm"
              >
                <FiArrowLeft className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Back to Dashboard</span>
              </button>
            </nav>

            {/* User Info & Logout */}
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-xs font-medium text-[#5B7280] hidden sm:inline-block">Welcome, Dr. Yuktha</span>
              {onLogout && (
                <button 
                  onClick={onLogout}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-[#B91C1C]/10 hover:bg-[#B91C1C]/20 border border-[#B91C1C]/20 rounded-xl text-xs font-semibold text-[#B91C1C] transition-all duration-150"
                >
                  <span>Logout</span>
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E]">
                <FiClock className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-[#0F2A3A] tracking-tight font-serif">
                  Query History
                </h1>
                <p className="text-xs text-[#5B7280] mt-0.5">
                  View and restore previous RAG queries, spatio-temporal filters, and analytical conclusions.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              className="mb-6 p-4 bg-[#B91C1C]/10 border border-[#B91C1C]/20 rounded-2xl text-xs font-medium text-[#B91C1C]"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="py-20 text-center text-[#5B7280]">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F766E] mb-4"></div>
              <p className="text-sm font-medium">Retrieving saved query history from database...</p>
            </div>
          ) : queries.length === 0 ? (
            <motion.div
              className="bg-white rounded-3xl p-12 text-center border border-[#D9E2E7] max-w-md mx-auto shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E] flex items-center justify-center mx-auto mb-4">
                <FiDatabase className="w-8 h-8" />
              </div>
              <p className="text-[#0F2A3A] font-bold text-base mb-1">No query history found</p>
              <p className="text-[#5B7280] text-xs">
                Your natural-language RAG queries and synthesis outputs will be automatically recorded here.
              </p>
            </motion.div>
          ) : (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {queries.map((query, index) => {
                const filterSummary = getFilterSummary(query.query_options);
                return (
                  <motion.div
                    key={query.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                    className="bg-white rounded-2xl p-6 border border-[#D9E2E7] hover:border-[#0F766E]/40 transition-all duration-200 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Query Text */}
                        <div className="flex items-start space-x-3 mb-2.5">
                          <div className="p-1.5 rounded-lg bg-[#0F766E]/10 text-[#0F766E] mt-0.5 flex-shrink-0">
                            <FiSearch className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[#0F2A3A] font-bold text-base break-words tracking-tight">
                              {query.query}
                            </p>
                            {filterSummary && (
                              <p className="text-xs text-[#0F766E] mt-1 font-mono">
                                {filterSummary}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Answer Preview */}
                        <div className="ml-9 mb-3">
                          <p className="text-xs text-[#5B7280] line-clamp-2 leading-relaxed font-normal">
                            {query.answer_preview}
                          </p>
                        </div>

                        {/* Metadata */}
                        <div className="ml-9 flex flex-wrap items-center gap-3 text-xs text-[#5B7280] font-medium">
                          <span className="flex items-center space-x-1 num-tabular">
                            <FiClock className="w-3 h-3 text-[#0F766E]" />
                            <span>{formatDate(query.created_at)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <FiDatabase className="w-3 h-3 text-[#15803D]" />
                            <span>{query.sources_count} sources</span>
                          </span>
                          {query.has_dashboard_summary && (
                            <span className="px-2 py-0.5 bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E] text-[10px] font-semibold rounded-full">
                              Dashboard Summary
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleRestoreQuery(query.id)}
                          className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold text-xs rounded-xl shadow-sm transition-all duration-150 flex items-center space-x-1.5"
                        >
                          <FiSearch className="w-3.5 h-3.5" />
                          <span>View Results</span>
                        </button>
                        <button
                          onClick={() => handleDeleteQuery(query.id)}
                          disabled={deletingId === query.id}
                          className="p-2 text-[#B91C1C] hover:text-[#B91C1C] hover:bg-[#B91C1C]/10 border border-transparent hover:border-[#B91C1C]/20 rounded-xl transition-all duration-150 disabled:opacity-50"
                          title="Delete query"
                          aria-label="Delete query"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default QueryHistory;

