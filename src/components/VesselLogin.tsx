import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiArrowRight, FiActivity, FiDatabase, FiCheckCircle, FiAlertCircle, FiPlay, FiSquare, FiFileText, FiCalendar } from 'react-icons/fi';
import { 
  TelemetryDataPoint, 
  processTelemetryData, 
  checkAPIHealth,
  generateArtificialTelemetryData 
} from '../services/vesselTelemetryService';
import {
  fetchVesselTelemetryFiles,
  fetchVesselTelemetryFilesByDate,
  getDatesWithUploads,
  VesselTelemetryFile
} from '../services/vesselTelemetrySupabaseService';
import QualityReport from './QualityReport';

interface VesselLoginProps {
  onBack: () => void;
}

interface QualityReport {
  summary?: {
    quality_status?: string;
    total_data_points?: number;
    flag_summary?: Record<string, number>;
  };
  detailed_metrics?: {
    overall_quality_score?: number;
    good_percentage?: number;
    suspect_percentage?: number;
    fail_percentage?: number;
  };
  test_results?: Record<string, any>;
  recommendations?: string[];
}

const VesselLogin: React.FC<VesselLoginProps> = ({ onBack }) => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [telemetryData, setTelemetryData] = useState<TelemetryDataPoint[]>([]);
  const [dataSize, setDataSize] = useState(0); // Size in bytes
  const [threshold, setThreshold] = useState(100 * 1024); // Default 100KB threshold
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [processingStatus, setProcessingStatus] = useState<{
    type: 'info' | 'success' | 'error';
    message: string;
  } | null>(null);
  const [processedFiles, setProcessedFiles] = useState<VesselTelemetryFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedReport, setSelectedReport] = useState<QualityReport | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const collectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dataBufferRef = useRef<TelemetryDataPoint[]>([]);

  // Load processed files from Supabase on mount
  useEffect(() => {
    const loadFiles = async () => {
      setIsLoadingFiles(true);
      try {
        console.log('🔄 Loading vessel telemetry files from Supabase...');
        const files = await fetchVesselTelemetryFiles();
        console.log(`✅ Loaded ${files.length} files:`, files);
        setProcessedFiles(files);
        
        if (files.length === 0) {
          setProcessingStatus({
            type: 'info',
            message: 'No vessel telemetry files found in Supabase storage. Start collecting data to see files here.'
          });
        }
      } catch (error) {
        console.error('❌ Error loading files from Supabase:', error);
        setProcessingStatus({
          type: 'error',
          message: `Failed to load files from Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      } finally {
        setIsLoadingFiles(false);
      }
    };

    loadFiles();
  }, []);

  // Refresh files when a new file is processed
  const refreshFiles = async () => {
    try {
      const files = await fetchVesselTelemetryFiles();
      setProcessedFiles(files);
    } catch (error) {
      console.error('Error refreshing files from Supabase:', error);
    }
  };

  // Check API health on mount
  useEffect(() => {
    checkAPIHealth().then(result => {
      setApiAvailable(result.available);
      if (!result.available) {
        setProcessingStatus({
          type: 'error',
          message: 'DataProcessingEngine API is not available. Please check the connection.'
        });
      }
    });
  }, []);

  // Start/Stop data collection
  const toggleCollection = () => {
    if (isCollecting) {
      // Stop collection
      if (collectionIntervalRef.current) {
        clearInterval(collectionIntervalRef.current);
        collectionIntervalRef.current = null;
      }
      setIsCollecting(false);
    } else {
      // Start collection
      setIsCollecting(true);
      dataBufferRef.current = [];
      
      // Generate data every second (artificial data for now)
      collectionIntervalRef.current = setInterval(() => {
        const newData = generateArtificialTelemetryData(1);
        dataBufferRef.current.push(...newData);
        
        // Update state
        setTelemetryData(prev => [...prev, ...newData]);
        
        // Calculate size (approximate)
        const csvSize = JSON.stringify(dataBufferRef.current).length;
        setDataSize(csvSize);
        
        // Check if threshold is reached
        if (csvSize >= threshold) {
          handlePackageAndSend();
        }
      }, 1000);
    }
  };

  // Package data and send to processing engine
  const handlePackageAndSend = async () => {
    if (dataBufferRef.current.length === 0) return;
    
    const dataToSend = [...dataBufferRef.current];
    dataBufferRef.current = []; // Clear buffer
    
    const filename = `vessel-telemetry-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    
    setProcessingStatus({
      type: 'info',
      message: `Packaging ${dataToSend.length} data points and sending to processing engine...`
    });
    
    try {
      const result = await processTelemetryData(dataToSend, filename);
      
      if (result.success && result.qualityReport) {
        setProcessingStatus({
          type: 'success',
          message: `Data processed successfully! Quality Score: ${result.qualityReport.detailed_metrics?.overall_quality_score?.toFixed(1) || 'N/A'}%`
        });
        
        // Add to processed files list
        const qualityReportWithFileName = result.qualityReport ? {
          ...result.qualityReport,
          file_name: result.processedFile || filename
        } : null;
        
        // Refresh files from Supabase instead of adding locally
        // The file is already in Supabase from the processing engine
        await refreshFiles();
        
        // Reset data size
        setDataSize(0);
        setTelemetryData([]);
        
        // Clear status after 3 seconds
        setTimeout(() => {
          setProcessingStatus(null);
        }, 3000);
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (error: any) {
      setProcessingStatus({
        type: 'error',
        message: `Failed to process data: ${error.message}`
      });
      
      // Restore data to buffer if processing failed
      dataBufferRef.current = [...dataToSend, ...dataBufferRef.current];
    }
  };

  // Manual send button
  const handleManualSend = () => {
    if (telemetryData.length === 0) {
      setProcessingStatus({
        type: 'error',
        message: 'No data collected yet. Start data collection first.'
      });
      return;
    }
    handlePackageAndSend();
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Helper to get local date string (YYYY-MM-DD) without timezone issues
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to extract date from filename
  const extractDateFromFilename = (filename: string): Date | null => {
    try {
      const match = filename.match(/vessel-telemetry-(\d{4}-\d{2}-\d{2})T/);
      if (match) {
        const dateStr = match[1];
        return new Date(dateStr + 'T00:00:00');
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Get dates with uploads from Supabase files
  const [datesWithUploads, setDatesWithUploads] = useState<Set<string>>(new Set());

  // Update dates with uploads when files change
  useEffect(() => {
    const updateDates = async () => {
      const dates = await getDatesWithUploads();
      setDatesWithUploads(dates);
    };
    updateDates();
  }, [processedFiles]);

  // Filter files by selected date (using local dates)
  const filteredFiles = selectedDate
    ? processedFiles.filter(file => {
        // Extract date from filename or use timestamp
        const fileDateStr = getLocalDateString(
          extractDateFromFilename(file.filename) || new Date(file.timestamp)
        );
        const selectedDateStr = getLocalDateString(selectedDate);
        return fileDateStr === selectedDateStr;
      })
    : processedFiles;

  // Calendar helper functions
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const formatDateForComparison = (date: Date): string => {
    return getLocalDateString(date);
  };

  const handleDateClick = (date: Date | null) => {
    if (date) {
      const dateStr = formatDateForComparison(date);
      if (selectedDate && formatDateForComparison(selectedDate) === dateStr) {
        setSelectedDate(null); // Deselect if clicking the same date
      } else {
        setSelectedDate(date);
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (collectionIntervalRef.current) {
        clearInterval(collectionIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#0F2A3A] selection:bg-[#0F766E]/20">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-[#D9E2E7] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2.5 bg-[#EEF3F5] hover:bg-[#E2E8F0] border border-[#D9E2E7] rounded-xl transition-all text-[#0F766E]"
                title="Back to Dashboard"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#0F2A3A] flex items-center gap-2">
                  <span>Vessel Telemetry Control</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E] font-mono font-medium">LIVE STREAM</span>
                </h1>
                <p className="text-xs text-[#5B7280]">Autonomous edge data transmission & QA monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {apiAvailable === true && (
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#15803D] text-xs font-semibold">
                  <FiCheckCircle className="w-4 h-4" />
                  <span>API Connected</span>
                </span>
              )}
              {apiAvailable === false && (
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-[#B91C1C] text-xs font-semibold">
                  <FiAlertCircle className="w-4 h-4" />
                  <span>API Disconnected</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto px-6 py-8">
        {/* Calendar Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-80 flex-shrink-0 bg-white rounded-2xl p-5 border border-[#D9E2E7] h-fit lg:sticky top-24 shadow-paper"
        >
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#D9E2E7]">
            <div className="p-2 rounded-lg bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E]">
              <FiCalendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#0F2A3A]">Telemetry Calendar</h2>
              <p className="text-xs text-[#5B7280]">Filter datasets by capture date</p>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4 bg-[#F7F9FA] p-2 rounded-xl border border-[#D9E2E7]">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1.5 hover:bg-[#EEF3F5] text-[#5B7280] hover:text-[#0F2A3A] rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-semibold text-[#0F2A3A] tracking-wide">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1.5 hover:bg-[#EEF3F5] text-[#5B7280] hover:text-[#0F2A3A] rounded-lg transition-colors"
            >
              <FiArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-[11px] text-[#5B7280] font-semibold py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth(currentMonth).map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateStr = formatDateForComparison(date);
              const hasUploads = datesWithUploads.has(dateStr);
              const isSelected = selectedDate && formatDateForComparison(selectedDate) === dateStr;
              const isToday = formatDateForComparison(new Date()) === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDateClick(date)}
                  className={`aspect-square rounded-lg text-xs font-mono transition-all flex items-center justify-center ${
                    isSelected
                      ? 'bg-[#0F766E] text-white font-bold shadow-md'
                      : hasUploads
                      ? 'bg-[#0F766E]/10 text-[#0F766E] hover:bg-[#0F766E]/20 border border-[#0F766E]/30 font-semibold'
                      : isToday
                      ? 'bg-[#EEF3F5] border border-[#0F766E] text-[#0F2A3A] font-semibold'
                      : 'bg-[#F7F9FA] text-[#5B7280] hover:bg-[#EEF3F5] hover:text-[#0F2A3A]'
                  }`}
                  title={hasUploads ? `${date.getDate()} - Has uploads` : date.getDate().toString()}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Selected Date Info */}
          {selectedDate && (
            <div className="mt-4 pt-4 border-t border-[#D9E2E7] flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#5B7280]">Selected Date</p>
                <p className="text-xs font-semibold text-[#0F766E] font-mono">
                  {selectedDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-xs px-2.5 py-1 bg-[#EEF3F5] hover:bg-[#E2E8F0] rounded-lg text-[#5B7280] hover:text-[#0F2A3A] transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          {/* Upload Stats */}
          <div className="mt-4 pt-4 border-t border-[#D9E2E7]">
            <p className="text-xs text-[#5B7280] mb-2 font-medium">Upload Summary</p>
            <div className="space-y-1.5 bg-[#F7F9FA] p-3 rounded-xl border border-[#D9E2E7]">
              <div className="flex justify-between text-xs">
                <span className="text-[#5B7280]">Total Files:</span>
                <span className="font-semibold text-[#0F766E] font-mono num-tabular">{processedFiles.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#5B7280]">Days with Data:</span>
                <span className="font-semibold text-[#0F766E] font-mono num-tabular">{datesWithUploads.size}</span>
              </div>
              {selectedDate && (
                <div className="flex justify-between text-xs">
                  <span className="text-[#5B7280]">Selected Date:</span>
                  <span className="font-semibold text-[#0F766E] font-mono num-tabular">{filteredFiles.length} files</span>
                </div>
              )}
            </div>
          </div>
        </motion.aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 space-y-6">
        {/* Status Messages */}
        {processingStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border shadow-sm ${
              processingStatus.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-[#15803D]' 
                : processingStatus.type === 'error'
                ? 'bg-red-50 border-red-200 text-[#B91C1C]' 
                : 'bg-teal-50 border-teal-200 text-[#0F766E]'
            }`}
          >
            <div className="flex items-center gap-3">
              {processingStatus.type === 'success' && <FiCheckCircle className="w-5 h-5 flex-shrink-0 text-[#15803D]" />}
              {processingStatus.type === 'error' && <FiAlertCircle className="w-5 h-5 flex-shrink-0 text-[#B91C1C]" />}
              {processingStatus.type === 'info' && <FiActivity className="w-5 h-5 flex-shrink-0 text-[#0F766E]" />}
              <p className="text-sm font-medium">{processingStatus.message}</p>
            </div>
          </motion.div>
        )}

        {/* Control Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data Collection Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-[#D9E2E7] shadow-paper"
          >
            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#D9E2E7]">
              <div className="p-2.5 rounded-xl bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E]">
                <FiActivity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0F2A3A]">Live Data Ingestion</h2>
                <p className="text-xs text-[#5B7280]">Sensory telemetry collection buffer</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5B7280]">Stream Status:</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isCollecting ? 'bg-emerald-50 text-[#15803D] border border-emerald-200 animate-pulse' : 'bg-[#EEF3F5] text-[#5B7280]'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isCollecting ? 'bg-[#15803D]' : 'bg-[#5B7280]'}`} />
                  {isCollecting ? 'COLLECTING' : 'IDLE'}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5B7280]">Buffered Points:</span>
                <span className="font-semibold text-[#0F2A3A] font-mono num-tabular">{telemetryData.length}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5B7280]">Current Payload Size:</span>
                <span className="font-semibold text-[#0F766E] font-mono num-tabular">{formatFileSize(dataSize)}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5B7280]">Flush Threshold:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={threshold / 1024}
                    onChange={(e) => setThreshold(Number(e.target.value) * 1024)}
                    disabled={isCollecting}
                    className="w-20 px-2.5 py-1 bg-[#F7F9FA] border border-[#D9E2E7] rounded-lg text-[#0F2A3A] text-sm font-mono text-center focus:border-[#0F766E] focus:outline-none"
                    min="1"
                  />
                  <span className="text-xs text-[#5B7280] font-mono">KB</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-[#D9E2E7]">
                <div className="w-full bg-[#EEF3F5] rounded-full h-2 mb-4 overflow-hidden border border-[#D9E2E7]">
                  <div
                    className="bg-gradient-to-r from-[#0F766E] to-[#0369A1] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((dataSize / threshold) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={toggleCollection}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
                      isCollecting
                        ? 'bg-[#B91C1C] hover:bg-red-700 text-white'
                        : 'bg-[#0F766E] hover:bg-[#0B5F58] text-white shadow-sm'
                    }`}
                  >
                    {isCollecting ? (
                      <>
                        <FiSquare className="w-4 h-4" />
                        <span>Stop Collection</span>
                      </>
                    ) : (
                      <>
                        <FiPlay className="w-4 h-4" />
                        <span>Start Collection</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleManualSend}
                    disabled={telemetryData.length === 0 || isCollecting}
                    className="px-5 py-2.5 bg-[#EEF3F5] hover:bg-[#E2E8F0] border border-[#D9E2E7] text-[#0F766E] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold text-sm transition-all"
                  >
                    Send Now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Processing Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-[#D9E2E7] shadow-paper flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#D9E2E7]">
                <div className="p-2.5 rounded-xl bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E]">
                  <FiDatabase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0F2A3A]">Pipeline Diagnostic</h2>
                  <p className="text-xs text-[#5B7280]">Telemetry engine health status</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#5B7280]">Total Transmissions:</span>
                  <span className="font-semibold text-[#0F2A3A] font-mono num-tabular">{processedFiles.length}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#5B7280]">Engine Connection:</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    apiAvailable === true ? 'bg-emerald-50 text-[#15803D] border border-emerald-200' : 
                    apiAvailable === false ? 'bg-red-50 text-[#B91C1C] border border-red-200' : 
                    'bg-amber-50 text-[#D97706] border border-amber-200'
                  }`}>
                    {apiAvailable === true ? 'CONNECTED' : 
                     apiAvailable === false ? 'OFFLINE' : 
                     'CHECKING...'}
                  </span>
                </div>
              </div>
            </div>
            
            {processedFiles.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#D9E2E7] bg-[#F7F9FA] p-3 rounded-xl border border-[#D9E2E7]">
                <p className="text-[11px] text-[#5B7280] mb-1">Latest Transmitted Batch</p>
                <p className="text-xs font-mono text-[#0F766E] truncate font-semibold">
                  {processedFiles[processedFiles.length - 1].filename}
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Processed Files List */}
        {isLoadingFiles ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 border border-[#D9E2E7] shadow-paper text-center"
          >
            <FiActivity className="w-8 h-8 text-[#0F766E] mx-auto mb-4 animate-spin" />
            <p className="text-[#5B7280] text-sm">Retrieving telemetry files from storage...</p>
          </motion.div>
        ) : processedFiles.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-[#D9E2E7] shadow-paper"
          >
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#D9E2E7]">
              <h2 className="text-lg font-bold text-[#0F2A3A] flex items-center gap-2">
                <FiDatabase className="w-5 h-5 text-[#0F766E]" />
                <span>Processed Datasets ({filteredFiles.length})</span>
              </h2>
              <button
                onClick={refreshFiles}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#EEF3F5] hover:bg-[#E2E8F0] border border-[#D9E2E7] rounded-xl text-xs font-semibold text-[#0F766E] transition-all"
                title="Refresh files"
              >
                <FiActivity className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredFiles.length === 0 ? (
                <div className="text-center py-12 text-[#5B7280]">
                  {selectedDate ? (
                    <p>No telemetry files recorded on {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  ) : (
                    <p>No files processed yet</p>
                  )}
                </div>
              ) : (
                filteredFiles.slice().reverse().map((file, index) => (
                <div
                  key={index}
                  className="bg-[#F7F9FA] hover:bg-[#EEF3F5] rounded-xl p-4 border border-[#D9E2E7] transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#0F2A3A] font-mono text-sm truncate">{file.filename}</p>
                      <p className="text-xs text-[#5B7280] mt-0.5 font-mono">
                        {new Date(file.timestamp).toLocaleString()} • <span className="text-[#0F766E] font-semibold">{file.dataPoints} points</span>
                      </p>
                    </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {file.qualityReport && (
                      <div className="text-right">
                        <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                          file.qualityReport.summary?.quality_status === 'GOOD' 
                            ? 'bg-emerald-50 text-[#15803D] border border-emerald-200'
                            : file.qualityReport.summary?.quality_status === 'SUSPECT'
                            ? 'bg-amber-50 text-[#D97706] border border-amber-200'
                            : 'bg-red-50 text-[#B91C1C] border border-red-200'
                        }`}>
                          {file.qualityReport.detailed_metrics?.overall_quality_score?.toFixed(1) || 'N/A'}%
                        </div>
                        <p className="text-[10px] text-[#5B7280] mt-0.5 uppercase tracking-wider">
                          {file.qualityReport.summary?.quality_status || 'UNKNOWN'}
                        </p>
                      </div>
                    )}
                    {file.qualityReport && (
                      <button
                        onClick={() => setSelectedReport(file.qualityReport)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-xs font-semibold text-[#0F766E] transition-all shadow-sm"
                      >
                        <FiFileText className="w-3.5 h-3.5" />
                        <span>View QA</span>
                      </button>
                    )}
                  </div>
                  </div>
                  
                  {file.qualityReport && file.qualityReport.recommendations && file.qualityReport.recommendations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-[#D9E2E7] bg-white p-2.5 rounded-lg border">
                      <p className="text-[11px] text-[#5B7280] font-semibold mb-1">Quality Observations:</p>
                      <ul className="text-xs text-[#0F2A3A] list-disc list-inside space-y-0.5">
                        {file.qualityReport.recommendations.slice(0, 2).map((rec: string, i: number) => (
                          <li key={i} className="line-clamp-1">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-12 border border-[#D9E2E7] shadow-paper text-center"
          >
            <FiDatabase className="w-10 h-10 text-[#5B7280] mx-auto mb-3" />
            <p className="text-[#0F2A3A] font-medium">No vessel telemetry files recorded</p>
            <p className="text-xs text-[#5B7280] mt-1">Start data collection above to stream live sensor readings</p>
          </motion.div>
        )}
        </div>

        {/* Quality Report Modal */}
        <AnimatePresence>
          {selectedReport && (
            <QualityReport
              qualityReport={selectedReport}
              onClose={() => setSelectedReport(null)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default VesselLogin;

