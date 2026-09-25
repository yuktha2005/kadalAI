import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiDatabase, FiMail, FiFileText, FiDownload, FiEye, FiX, FiExternalLink, FiPlay, FiPause, FiChevronRight, FiChevronDown, FiInfo } from 'react-icons/fi';

interface DataSourcePageProps {
  onBack: () => void;
  onLogout?: () => void;
}

const DataSourcePage: React.FC<DataSourcePageProps> = ({ onBack, onLogout }) => {
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [isPipelineAnimating, setIsPipelineAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [hoveredProcess, setHoveredProcess] = useState<string | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);

  const downloadFile = (filename: string, displayName: string) => {
    const link = document.createElement('a');
    link.href = `/${filename}`;
    link.download = displayName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const processInfo = {
    'login': {
      title: 'User Authentication',
      description: 'Secure login process that validates user credentials before granting access to the upload portal.',
      details: [
        'Validates provided credentials (prasannapal21, asdfasdf)',
        'Creates secure session for authenticated user',
        'Grants access to file upload interface',
        'Implements session timeout for security'
      ],
      icon: '🔐',
      color: 'blue'
    },
    'file-selection': {
      title: 'File Selection',
      description: 'User selects data files from their local computer with support for multiple scientific formats.',
      details: [
        'Supports .txt, .csv, .nc (NetCDF), .jpg formats',
        'File type validation and size checking',
        'Preview functionality for supported formats',
        'Drag-and-drop interface support'
      ],
      icon: '📁',
      color: 'blue'
    },
    'upload': {
      title: 'Direct Upload to Storage',
      description: 'Files are uploaded directly to Supabase Storage without involving backend API services.',
      details: [
        'Direct browser-to-storage upload',
        'Uses Supabase Storage raw-uploads bucket',
        'No backend API involvement',
        'Automatic file validation on upload'
      ],
      icon: '⬆️',
      color: 'blue'
    },
    'trigger': {
      title: 'Event Trigger',
      description: 'Automatic event notification system that detects file uploads and initiates backend processing.',
      details: [
        'Database webhook listens for INSERT events',
        'Triggers on successful file upload',
        'Extracts filename from event payload',
        'Initiates automated backend workflow'
      ],
      icon: '⚡',
      color: 'red'
    },
    'dispatch': {
      title: 'Edge Function Dispatch',
      description: 'Lightweight dispatcher that routes processing requests to the Data Ingestion Service.',
      details: [
        'Supabase Edge Function acts as dispatcher',
        'Makes secure POST API calls',
        'Sends filename as JSON payload',
        'Handles service communication'
      ],
      icon: '🚀',
      color: 'yellow'
    },
    'process': {
      title: 'Data Processing',
      description: 'Core data transformation workflow that converts raw files into standardized formats.',
      details: [
        'Downloads raw file from storage',
        'Identifies file type and routes appropriately',
        'Extracts metadata and converts to DataFrame',
        'Generates geospatial footprint if coordinates present'
      ],
      icon: '⚙️',
      color: 'green'
    },
    'store': {
      title: 'Storage & Catalog',
      description: 'Final storage of processed data in Parquet format with complete metadata cataloging.',
      details: [
        'Converts DataFrame to Apache Parquet format',
        'Uploads to processed-data bucket (data lakehouse)',
        'Updates file_metadata table in database',
        'Creates permanent record with geospatial data'
      ],
      icon: '💾',
      color: 'purple'
    }
  };

  const startPipelineAnimation = () => {
    setIsPipelineAnimating(true);
    setCurrentStep('Starting...');
    // Auto-expand sections during animation
    setExpandedSections({ stage1: true, stage2: true });
    
    // Step sequence with timing
    const steps = [
      { time: 0, step: 'Stage 1: Frontend Upload' },
      { time: 500, step: 'Login Process' },
      { time: 1200, step: 'File Selection' },
      { time: 1900, step: 'Upload to Storage' },
      { time: 2600, step: 'Stage 2: Backend Processing' },
      { time: 3300, step: 'Event Trigger' },
      { time: 4000, step: 'Edge Function Dispatch' },
      { time: 4700, step: 'Data Processing' },
      { time: 5400, step: 'Storage & Catalog' },
      { time: 8000, step: 'Complete!' }
    ];

    steps.forEach(({ time, step }) => {
      setTimeout(() => setCurrentStep(step), time);
    });

    setTimeout(() => {
      setIsPipelineAnimating(false);
      setCurrentStep('');
    }, 8000);
  };

  const datasets = {
    'adcp': {
      title: 'ADCP (Acoustic Doppler Current Profiler) Data',
      description: 'High-resolution current velocity profiles collected using ADCP technology. This data provides detailed information about ocean current patterns and water column dynamics.',
      details: {
        'Format': 'LTA files with ensemble data',
        'Frequency': '76.8 kHz Broadband',
        'Pings/Ensemble': '197',
        'Time/Ping': '00:01.50',
        'Bin Size': '4.00m',
        'Coverage': 'Multiple depth bins with velocity measurements',
        'Data Range': 'Surface to 1000m depth',
        'Parameters': 'East velocity, North velocity, Magnitude, Direction'
      },
      sampleData: 'Sample ADCP data shows current velocities at different depths with timestamps and GPS coordinates.',
      usage: 'Used for ocean current modeling, marine navigation, and climate research.',
      files: [
        { filename: 'ADCP-sample data.txt', displayName: 'ADCP Sample Data.txt', description: 'Sample ADCP current velocity data' }
      ]
    },
    'aws': {
      title: 'AWS (Automatic Weather Station) Data',
      description: 'Meteorological data including GPS coordinates, wind speed, atmospheric pressure, temperature, humidity, and sea surface temperature.',
      details: {
        'Parameters': 'GPS, Wind Speed, Wind Direction, Atmospheric Pressure, Temperature, Humidity, Sea Surface Temperature',
        'Sampling': 'Continuous monitoring every minute',
        'Location': 'Marine research stations',
        'Data Quality': 'Real-time validation and quality control',
        'Storage': 'Automated data logging system',
        'Transmission': 'Satellite and cellular communication'
      },
      sampleData: 'Sample AWS data includes GPS coordinates (9°58.257N, 76°14.625E), wind speed (5.04 m/s), and atmospheric pressure (1009.9 hPa).',
      usage: 'Essential for weather forecasting, climate monitoring, and marine safety.',
      files: [
        { filename: 'AWS sample data.txt', displayName: 'AWS Sample Data.txt', description: 'Sample AWS meteorological data' }
      ]
    },
    'ctd': {
      title: 'CTD (Conductivity, Temperature, Depth) Data',
      description: 'Oceanographic profiles including conductivity, temperature, pressure, oxygen levels, and water clarity measurements.',
      details: {
        'Parameters': 'Salinity, Temperature, Pressure, Oxygen, Transmission, Attenuation',
        'Depth Range': 'Surface to 2659m',
        'Station': 'STN298002 (FORV Kadal AI Sampada)',
        'Cruise': 'CR 297',
        'Location': '20°46.152N, 65°13.566E',
        'Sensors': 'Temperature SN 2881, Conductivity SN 2504',
        'Data Points': '1000 measurements per profile'
      },
      sampleData: 'CTD profile shows temperature decreasing from 26.5°C at surface to 8.9°C at depth, with salinity around 35.0 PSU.',
      usage: 'Critical for oceanographic research, water mass analysis, and ecosystem studies.',
      files: [
        { filename: 'stn298002.asc', displayName: 'CTD Data - Station 298002.asc', description: 'CTD profile data from station 298002' },
        { filename: 'stn298002.HDR', displayName: 'CTD Header - Station 298002.HDR', description: 'CTD data header information' }
      ]
    },
    'documentation': {
      title: 'Dataset Documentation',
      description: 'Comprehensive documentation describing data collection methods, quality control procedures, and data processing protocols.',
      details: {
        'Format': 'DOCX documentation files',
        'Content': 'Collection protocols, quality standards, processing methods',
        'Usage': 'Research and analysis guidelines',
        'Standards': 'International oceanographic data standards',
        'Validation': 'Multi-level quality control procedures',
        'Metadata': 'Complete dataset metadata and provenance'
      },
      sampleData: 'Documentation includes detailed protocols for data collection, calibration procedures, and quality assurance methods.',
      usage: 'Essential for understanding data collection methods and ensuring research reproducibility.',
      files: [
        { filename: 'sample data description.docx', displayName: 'Data Description Documentation.docx', description: 'Comprehensive data collection and processing documentation' }
      ]
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#0F2A3A] selection:bg-[#0F766E]/20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#D9E2E7]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border border-[#D9E2E7] bg-white shadow-sm">
                <img 
                  src="/WhatsApp Image 2025-09-29 at 03.04.02.jpeg" 
                  alt="Kadal AI Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-[#0F2A3A] block">Kadal AI</span>
                <span className="text-[10px] text-[#0F766E] uppercase tracking-wider font-mono font-semibold">Ocean Data Hub</span>
              </div>
            </motion.div>

            {/* Back Button */}
            <motion.button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-[#EEF3F5] border border-[#D9E2E7] hover:border-[#0F766E]/40 rounded-xl transition-all duration-200 text-[#0F766E] font-medium text-sm shadow-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <FiArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 pb-16 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Page Header */}
          <motion.div 
            className="flex flex-col md:flex-row md:items-center justify-between gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E] text-xs font-mono font-medium mb-3">
                <FiDatabase className="w-3.5 h-3.5" />
                <span>DATA ARCHITECTURE & REPOSITORIES</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#0F2A3A] mb-2 font-serif">
                Data Sources & Research Collaboration
              </h1>
              <p className="text-base text-[#5B7280] max-w-2xl">
                Information about our datasets and active research collaboration with CMLRE (Centre for Marine Living Resources and Ecology)
              </p>
            </div>
            
            <motion.a
              href="https://data-ingestion-frontend-Kadal AI.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2.5 px-6 py-3 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold rounded-xl transition-all duration-200 shadow-sm flex-shrink-0"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <FiDatabase className="w-5 h-5 text-white" />
              <span>Ingest Live Data</span>
              <FiExternalLink className="w-4 h-4 text-white" />
            </motion.a>
          </motion.div>

          {/* Research Collaboration and Datasets Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Research Collaboration - Left Side (Full Height) */}
              <div className="bg-white border border-[#D9E2E7] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-5 pb-3 border-b border-[#D9E2E7]">
                    <div className="p-2 rounded-lg bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E]">
                      <FiMail className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#0F2A3A]">Institutional Collaboration</h2>
                      <p className="text-xs text-[#5B7280]">Formal oceanographic dataset access</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-[#0F2A3A] mb-1.5">Correspondence with CMLRE</h3>
                    <p className="text-[#5B7280] text-sm mb-4 leading-relaxed">
                      We reached out to <strong className="text-[#0F2A3A]">Dr. Karthic K</strong> from CMLRE to request access to marine research datasets for our Kadal AI platform.
                    </p>
                    
                    <div className="bg-[#F7F9FA] rounded-xl p-2.5 mb-4 border border-[#D9E2E7]">
                      <img 
                        src="/email-screenshot.jpeg" 
                        alt="Email correspondence with Dr. Karthic K from CLMRE"
                        className="w-full rounded-lg shadow-sm border border-[#D9E2E7]"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-[#5B7280] bg-[#EEF3F5] p-3 rounded-xl border border-[#D9E2E7] space-y-1">
                  <div><strong className="text-[#0F2A3A]">Contact:</strong> Dr. Karthic K, CMLRE</div>
                  <div><strong className="text-[#0F2A3A]">Purpose:</strong> Dataset collaboration & verification</div>
                  <div><strong className="text-[#0F2A3A]">Status:</strong> <span className="text-[#15803D] font-semibold">Active scientific partnership</span></div>
                </div>
              </div>

              {/* Right Side - Two Sections Stacked */}
              <div className="flex flex-col gap-6">
                {/* Available Datasets - Top Right */}
                <div className="bg-white border border-[#D9E2E7] rounded-2xl p-6 shadow-sm flex flex-col">
                  <div className="flex items-center space-x-3 mb-5 pb-3 border-b border-[#D9E2E7]">
                    <div className="p-2 rounded-lg bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E]">
                      <FiDatabase className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#0F2A3A]">Curated Ocean Datasets</h2>
                      <p className="text-xs text-[#5B7280]">Click any stream to view specs & sample data</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    {/* ADCP Data */}
                    <motion.div 
                      className="bg-[#F7F9FA] hover:bg-[#EEF3F5] border border-[#D9E2E7] hover:border-[#0F766E]/50 rounded-xl p-4 cursor-pointer transition-all duration-200"
                      onClick={() => setSelectedDataset('adcp')}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-sm font-semibold text-[#0F2A3A] flex items-center gap-2">
                          <FiFileText className="w-4 h-4 text-[#0F766E]" />
                          <span>ADCP Profiler Stream</span>
                        </h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadFile('ADCP-sample data.txt', 'ADCP Sample Data.txt');
                            }}
                            className="p-1.5 hover:bg-[#0F766E]/10 text-[#5B7280] hover:text-[#0F766E] rounded-lg transition-colors duration-200"
                            title="Download ADCP sample data"
                          >
                            <FiDownload className="w-4 h-4" />
                          </button>
                          <FiEye className="w-4 h-4 text-[#0F766E]" />
                        </div>
                      </div>
                      <p className="text-[#5B7280] text-xs mb-2">
                        High-resolution current velocity profiles using ADCP technology for ocean current dynamics.
                      </p>
                      <div className="text-[11px] text-[#5B7280] font-mono">
                        <strong className="text-[#0F2A3A]">Format:</strong> LTA • <strong className="text-[#0F2A3A]">Freq:</strong> 76.8 kHz • <strong className="text-[#0F2A3A]">Depth:</strong> 0-1000m
                      </div>
                    </motion.div>

                    {/* AWS Data */}
                    <motion.div 
                      className="bg-[#F7F9FA] hover:bg-[#EEF3F5] border border-[#D9E2E7] hover:border-[#0F766E]/50 rounded-xl p-4 cursor-pointer transition-all duration-200"
                      onClick={() => setSelectedDataset('aws')}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-sm font-semibold text-[#0F2A3A] flex items-center gap-2">
                          <FiFileText className="w-4 h-4 text-[#0F766E]" />
                          <span>Automatic Weather Station (AWS)</span>
                        </h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadFile('AWS sample data.txt', 'AWS Sample Data.txt');
                            }}
                            className="p-1.5 hover:bg-[#0F766E]/10 text-[#5B7280] hover:text-[#0F766E] rounded-lg transition-colors duration-200"
                            title="Download AWS sample data"
                          >
                            <FiDownload className="w-4 h-4" />
                          </button>
                          <FiEye className="w-4 h-4 text-[#0F766E]" />
                        </div>
                      </div>
                      <p className="text-[#5B7280] text-xs mb-2">
                        Meteorological data including GPS coordinates, wind velocity, atmospheric pressure, and SST.
                      </p>
                      <div className="text-[11px] text-[#5B7280] font-mono">
                        <strong className="text-[#0F2A3A]">Params:</strong> GPS, Wind, Temp • <strong className="text-[#0F2A3A]">Sampling:</strong> 1 min
                      </div>
                    </motion.div>

                    {/* CTD Data */}
                    <motion.div 
                      className="bg-[#F7F9FA] hover:bg-[#EEF3F5] border border-[#D9E2E7] hover:border-[#0F766E]/50 rounded-xl p-4 cursor-pointer transition-all duration-200"
                      onClick={() => setSelectedDataset('ctd')}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-sm font-semibold text-[#0F2A3A] flex items-center gap-2">
                          <FiFileText className="w-4 h-4 text-[#0F766E]" />
                          <span>CTD Profiles (Station 298002)</span>
                        </h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadFile('stn298002.asc', 'CTD Data - Station 298002.asc');
                            }}
                            className="p-1.5 hover:bg-[#0F766E]/10 text-[#5B7280] hover:text-[#0F766E] rounded-lg transition-colors duration-200"
                            title="Download CTD data"
                          >
                            <FiDownload className="w-4 h-4" />
                          </button>
                          <FiEye className="w-4 h-4 text-[#0F766E]" />
                        </div>
                      </div>
                      <p className="text-[#5B7280] text-xs mb-2">
                        Oceanographic profiles including salinity, temperature, oxygen concentration, and clarity.
                      </p>
                      <div className="text-[11px] text-[#5B7280] font-mono">
                        <strong className="text-[#0F2A3A]">Range:</strong> 0-2659m • <strong className="text-[#0F2A3A]">Vessel:</strong> FORV Kadal AI Sampada
                      </div>
                    </motion.div>

                    {/* Documentation */}
                    <motion.div 
                      className="bg-[#F7F9FA] hover:bg-[#EEF3F5] border border-[#D9E2E7] hover:border-[#0F766E]/50 rounded-xl p-4 cursor-pointer transition-all duration-200"
                      onClick={() => setSelectedDataset('documentation')}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-sm font-semibold text-[#0F2A3A] flex items-center gap-2">
                          <FiFileText className="w-4 h-4 text-[#0F766E]" />
                          <span>Protocol & Metadata Standards</span>
                        </h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadFile('sample data description.docx', 'Data Description Documentation.docx');
                            }}
                            className="p-1.5 hover:bg-[#0F766E]/10 text-[#5B7280] hover:text-[#0F766E] rounded-lg transition-colors duration-200"
                            title="Download documentation"
                          >
                            <FiDownload className="w-4 h-4" />
                          </button>
                          <FiEye className="w-4 h-4 text-[#0F766E]" />
                        </div>
                      </div>
                      <p className="text-[#5B7280] text-xs mb-2">
                        Comprehensive documentation for sampling protocols, calibration methods, and QA procedures.
                      </p>
                      <div className="text-[11px] text-[#5B7280] font-mono">
                        <strong className="text-[#0F2A3A]">Format:</strong> DOCX • <strong className="text-[#0F2A3A]">Standard:</strong> Oceanographic QC
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Data Integration - Bottom Right */}
                <div className="bg-white border border-[#D9E2E7] rounded-2xl p-6 shadow-sm flex flex-col">
                  <div className="flex items-center space-x-3 mb-5 pb-3 border-b border-[#D9E2E7]">
                    <div className="p-2 rounded-lg bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E]">
                      <FiDownload className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#0F2A3A]">Integration Capabilities</h2>
                      <p className="text-xs text-[#5B7280]">Standardized pipeline stages</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                    <div className="bg-[#F7F9FA] border border-[#D9E2E7] rounded-xl p-3.5 text-center">
                      <div className="w-10 h-10 bg-[#0F766E]/10 rounded-xl flex items-center justify-center mx-auto mb-2 text-[#0F766E]">
                        <FiDatabase className="w-5 h-5" />
                      </div>
                      <h3 className="text-xs font-bold text-[#0F2A3A] mb-1">Collection</h3>
                      <p className="text-[#5B7280] text-[11px] leading-relaxed">
                        Continuous telemetry streaming from research vessels & buoy sensors.
                      </p>
                    </div>
                    
                    <div className="bg-[#F7F9FA] border border-[#D9E2E7] rounded-xl p-3.5 text-center">
                      <div className="w-10 h-10 bg-[#0F766E]/10 rounded-xl flex items-center justify-center mx-auto mb-2 text-[#0F766E]">
                        <FiFileText className="w-5 h-5" />
                      </div>
                      <h3 className="text-xs font-bold text-[#0F2A3A] mb-1">Processing</h3>
                      <p className="text-[#5B7280] text-[11px] leading-relaxed">
                        Automated QA validation, outlier rejection, and Parquet compilation.
                      </p>
                    </div>
                    
                    <div className="bg-[#F7F9FA] border border-[#D9E2E7] rounded-xl p-3.5 text-center">
                      <div className="w-10 h-10 bg-[#0F766E]/10 rounded-xl flex items-center justify-center mx-auto mb-2 text-[#0F766E]">
                        <FiDownload className="w-5 h-5" />
                      </div>
                      <h3 className="text-xs font-bold text-[#0F2A3A] mb-1">Access</h3>
                      <p className="text-[#5B7280] text-[11px] leading-relaxed">
                        High-speed RAG indexing & geospatial API endpoints for researchers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Kadal AI Data Ingestion Pipeline Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="bg-white border border-[#D9E2E7] rounded-2xl p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#D9E2E7]">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E]">
                    <FiDatabase className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#0F2A3A]">Automated Data Ingestion Pipeline</h2>
                    <p className="text-xs text-[#5B7280]">Cloud-native streaming architecture from vessel to lakehouse</p>
                  </div>
                </div>
                <motion.button
                  onClick={startPipelineAnimation}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-[#0F766E]/10 hover:bg-[#0F766E]/20 border border-[#0F766E]/30 rounded-xl text-[#0F766E] font-semibold text-sm transition-all shadow-sm"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FiPlay className="w-4 h-4" />
                  <span>Animate Flow</span>
                </motion.button>
              </div>

              {/* Animation Progress Indicator */}
              {isPipelineAnimating && (
                <motion.div 
                  className="mb-6 p-4 rounded-xl bg-[#EEF3F5] border border-[#0F766E]/30 shadow-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#5B7280] font-mono font-semibold">PIPELINE EXECUTION STATE</span>
                    <motion.span 
                      className="text-xs font-bold font-mono text-[#0F766E]"
                      key={currentStep}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      {currentStep}
                    </motion.span>
                  </div>
                  <div className="bg-[#D9E2E7] rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#0F766E] via-[#0369A1] to-[#15803D]"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 8, ease: "linear" }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Interactive Pipeline Flow */}
              <div className="relative space-y-4">
                {/* Stage 1 - Frontend */}
                <motion.div 
                  className="bg-[#F7F9FA] hover:bg-[#EEF3F5] border border-[#0369A1]/30 rounded-2xl p-6 cursor-pointer transition-all"
                  onClick={() => toggleSection('stage1')}
                  whileHover={{ scale: 1.01 }}
                  animate={isPipelineAnimating ? { 
                    boxShadow: "0 0 20px rgba(3, 105, 161, 0.25)",
                    scale: 1.01 
                  } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-[#0369A1]/10 border border-[#0369A1]/30 rounded-xl flex items-center justify-center font-bold text-[#0369A1] font-mono">
                        1
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#0F2A3A]">Stage 1: Edge & Client Ingestion</h3>
                        <p className="text-[#5B7280] text-xs">Vessel telemetry authentication & multi-format data selection</p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedSections.stage1 ? 90 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-[#5B7280]"
                    >
                      <FiChevronRight className="w-5 h-5" />
                    </motion.div>
                  </div>
                  
                  {expandedSections.stage1 && (
                    <motion.div 
                      className="mt-5 pt-4 border-t border-[#D9E2E7]"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <motion.div 
                          className="bg-white rounded-xl p-4 text-center cursor-pointer relative border border-[#D9E2E7] hover:border-[#0369A1] shadow-sm transition-all"
                          animate={isPipelineAnimating ? {
                            boxShadow: "0 0 15px rgba(3, 105, 161, 0.3)",
                            scale: 1.03,
                            backgroundColor: "#EEF3F5"
                          } : {}}
                          transition={{ delay: 0.5, duration: 0.8 }}
                          onHoverStart={() => setHoveredProcess('login')}
                          onHoverEnd={() => setHoveredProcess(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProcess('login');
                          }}
                          whileHover={{ scale: 1.03 }}
                        >
                          <FiInfo className="w-6 h-6 text-[#0369A1] mx-auto mb-2" />
                          <h4 className="text-sm font-semibold text-[#0F2A3A]">Authentication</h4>
                          <p className="text-xs text-[#5B7280] mt-0.5">Secure credential check</p>
                        </motion.div>
                        
                        <motion.div 
                          className="bg-white rounded-xl p-4 text-center cursor-pointer relative border border-[#D9E2E7] hover:border-[#0369A1] shadow-sm transition-all"
                          animate={isPipelineAnimating ? {
                            boxShadow: "0 0 15px rgba(3, 105, 161, 0.3)",
                            scale: 1.03,
                            backgroundColor: "#EEF3F5"
                          } : {}}
                          transition={{ delay: 1.2, duration: 0.8 }}
                          onHoverStart={() => setHoveredProcess('file-selection')}
                          onHoverEnd={() => setHoveredProcess(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProcess('file-selection');
                          }}
                          whileHover={{ scale: 1.03 }}
                        >
                          <FiFileText className="w-6 h-6 text-[#0369A1] mx-auto mb-2" />
                          <h4 className="text-sm font-semibold text-[#0F2A3A]">File Selection</h4>
                          <p className="text-xs text-[#5B7280] mt-0.5">.txt, .csv, .nc, .jpg</p>
                        </motion.div>
                        
                        <motion.div 
                          className="bg-white rounded-xl p-4 text-center cursor-pointer relative border border-[#D9E2E7] hover:border-[#0369A1] shadow-sm transition-all"
                          animate={isPipelineAnimating ? {
                            boxShadow: "0 0 15px rgba(3, 105, 161, 0.3)",
                            scale: 1.03,
                            backgroundColor: "#EEF3F5"
                          } : {}}
                          transition={{ delay: 1.9, duration: 0.8 }}
                          onHoverStart={() => setHoveredProcess('upload')}
                          onHoverEnd={() => setHoveredProcess(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProcess('upload');
                          }}
                          whileHover={{ scale: 1.03 }}
                        >
                          <FiDownload className="w-6 h-6 text-[#0369A1] mx-auto mb-2" />
                          <h4 className="text-sm font-semibold text-[#0F2A3A]">Direct Upload</h4>
                          <p className="text-xs text-[#5B7280] mt-0.5">Direct to cloud storage</p>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="w-7 h-7 bg-[#0F766E]/10 border border-[#0F766E]/30 rounded-full flex items-center justify-center text-[#0F766E]">
                    <FiChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {/* Stage 2 - Backend */}
                <motion.div 
                  className="bg-[#F7F9FA] hover:bg-[#EEF3F5] border border-[#0F766E]/30 rounded-2xl p-6 cursor-pointer transition-all"
                  onClick={() => toggleSection('stage2')}
                  whileHover={{ scale: 1.01 }}
                  animate={isPipelineAnimating ? { 
                    boxShadow: "0 0 20px rgba(15, 118, 110, 0.25)",
                    scale: 1.01 
                  } : {}}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-[#0F766E]/10 border border-[#0F766E]/30 rounded-xl flex items-center justify-center font-bold text-[#0F766E] font-mono">
                        2
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#0F2A3A]">Stage 2: Automated Backend Pipeline</h3>
                        <p className="text-[#5B7280] text-xs">Event triggers, edge workers, QA validation & lakehouse cataloging</p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedSections.stage2 ? 90 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-[#5B7280]"
                    >
                      <FiChevronRight className="w-5 h-5" />
                    </motion.div>
                  </div>
                  
                  {expandedSections.stage2 && (
                    <motion.div 
                      className="mt-5 pt-4 border-t border-[#D9E2E7]"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <motion.div 
                          className="bg-white rounded-xl p-4 text-center cursor-pointer relative border border-[#D9E2E7] hover:border-[#B91C1C] shadow-sm transition-all"
                          animate={isPipelineAnimating ? {
                            boxShadow: "0 0 15px rgba(185, 28, 28, 0.3)",
                            scale: 1.03,
                            backgroundColor: "#FEE2E2"
                          } : {}}
                          transition={{ delay: 2.6, duration: 0.8 }}
                          onHoverStart={() => setHoveredProcess('trigger')}
                          onHoverEnd={() => setHoveredProcess(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProcess('trigger');
                          }}
                          whileHover={{ scale: 1.03 }}
                        >
                          <div className="text-2xl mb-1.5">⚡</div>
                          <h4 className="text-sm font-semibold text-[#0F2A3A]">Event Trigger</h4>
                          <p className="text-xs text-[#5B7280] mt-0.5">DB webhook</p>
                        </motion.div>
                        
                        <motion.div 
                          className="bg-white rounded-xl p-4 text-center cursor-pointer relative border border-[#D9E2E7] hover:border-[#D97706] shadow-sm transition-all"
                          animate={isPipelineAnimating ? {
                            boxShadow: "0 0 15px rgba(217, 119, 6, 0.3)",
                            scale: 1.03,
                            backgroundColor: "#FEF3C7"
                          } : {}}
                          transition={{ delay: 3.3, duration: 0.8 }}
                          onHoverStart={() => setHoveredProcess('dispatch')}
                          onHoverEnd={() => setHoveredProcess(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProcess('dispatch');
                          }}
                          whileHover={{ scale: 1.03 }}
                        >
                          <div className="text-2xl mb-1.5">🚀</div>
                          <h4 className="text-sm font-semibold text-[#0F2A3A]">Edge Dispatch</h4>
                          <p className="text-xs text-[#5B7280] mt-0.5">Serverless worker</p>
                        </motion.div>
                        
                        <motion.div 
                          className="bg-white rounded-xl p-4 text-center cursor-pointer relative border border-[#D9E2E7] hover:border-[#15803D] shadow-sm transition-all"
                          animate={isPipelineAnimating ? {
                            boxShadow: "0 0 15px rgba(21, 128, 61, 0.3)",
                            scale: 1.03,
                            backgroundColor: "#DCFCE7"
                          } : {}}
                          transition={{ delay: 4.0, duration: 0.8 }}
                          onHoverStart={() => setHoveredProcess('process')}
                          onHoverEnd={() => setHoveredProcess(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProcess('process');
                          }}
                          whileHover={{ scale: 1.03 }}
                        >
                          <div className="text-2xl mb-1.5">⚙️</div>
                          <h4 className="text-sm font-semibold text-[#0F2A3A]">QA & Process</h4>
                          <p className="text-xs text-[#5B7280] mt-0.5">QC algorithms</p>
                        </motion.div>
                        
                        <motion.div 
                          className="bg-white rounded-xl p-4 text-center cursor-pointer relative border border-[#D9E2E7] hover:border-[#7C3AED] shadow-sm transition-all"
                          animate={isPipelineAnimating ? {
                            boxShadow: "0 0 15px rgba(124, 58, 237, 0.3)",
                            scale: 1.03,
                            backgroundColor: "#EDE9FE"
                          } : {}}
                          transition={{ delay: 4.7, duration: 0.8 }}
                          onHoverStart={() => setHoveredProcess('store')}
                          onHoverEnd={() => setHoveredProcess(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProcess('store');
                          }}
                          whileHover={{ scale: 1.03 }}
                        >
                          <div className="text-2xl mb-1.5">💾</div>
                          <h4 className="text-sm font-semibold text-[#0F2A3A]">Store & Catalog</h4>
                          <p className="text-xs text-[#5B7280] mt-0.5">Parquet lakehouse</p>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* Key Features */}
              <div className="mt-8 pt-6 border-t border-[#D9E2E7] grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-xl bg-[#F7F9FA] border border-[#D9E2E7]">
                  <div className="w-9 h-9 bg-[#0F766E]/10 rounded-xl flex items-center justify-center mx-auto mb-2 text-[#0F766E]">
                    <FiPlay className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-[#0F2A3A] mb-0.5">Event-Driven</h4>
                  <p className="text-[11px] text-[#5B7280]">Continuous telemetry processing</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-[#F7F9FA] border border-[#D9E2E7]">
                  <div className="w-9 h-9 bg-[#0F766E]/10 rounded-xl flex items-center justify-center mx-auto mb-2 text-[#0F766E]">
                    <FiDatabase className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-[#0F2A3A] mb-0.5">Multi-Sensor Support</h4>
                  <p className="text-[11px] text-[#5B7280]">CTD, ADCP, AWS, & NetCDF</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-[#F7F9FA] border border-[#D9E2E7]">
                  <div className="w-9 h-9 bg-[#0F766E]/10 rounded-xl flex items-center justify-center mx-auto mb-2 text-[#0F766E]">
                    <FiFileText className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-[#0F2A3A] mb-0.5">Standardized Lakehouse</h4>
                  <p className="text-[11px] text-[#5B7280]">Columnar Apache Parquet format</p>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </main>

      {/* Dataset Detail Modal */}
      {selectedDataset && (
        <div className="fixed inset-0 z-[100] bg-[#0F2A3A]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            className="w-full max-w-4xl bg-white border border-[#D9E2E7] rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-6 md:p-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#D9E2E7]">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/20">
                    <FiDatabase className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#0F2A3A]">
                      {datasets[selectedDataset as keyof typeof datasets].title}
                    </h2>
                    <span className="text-xs text-[#0F766E] font-mono font-semibold">SPECIFICATION & DATA SAMPLE</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDataset(null)}
                  className="p-2 hover:bg-[#EEF3F5] rounded-xl transition-colors text-[#5B7280] hover:text-[#0F2A3A]"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-bold text-[#0F2A3A] uppercase tracking-wider mb-2">Description</h3>
                  <p className="text-[#5B7280] text-sm leading-relaxed">
                    {datasets[selectedDataset as keyof typeof datasets].description}
                  </p>
                </div>

                {/* Technical Details */}
                <div>
                  <h3 className="text-sm font-bold text-[#0F2A3A] uppercase tracking-wider mb-3">Technical Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(datasets[selectedDataset as keyof typeof datasets].details).map(([key, value]) => (
                      <div key={key} className="bg-[#F7F9FA] border border-[#D9E2E7] rounded-xl p-3.5">
                        <div className="text-xs font-semibold text-[#0F766E] mb-1">{key}</div>
                        <div className="text-xs text-[#0F2A3A] font-mono">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sample Data */}
                <div>
                  <h3 className="text-sm font-bold text-[#0F2A3A] uppercase tracking-wider mb-2">Sample Data Excerpt</h3>
                  <div className="bg-[#F7F9FA] border border-[#D9E2E7] rounded-xl p-4 font-mono text-xs text-[#0F2A3A]">
                    <p>{datasets[selectedDataset as keyof typeof datasets].sampleData}</p>
                  </div>
                </div>

                {/* Usage */}
                <div>
                  <h3 className="text-sm font-bold text-[#0F2A3A] uppercase tracking-wider mb-2">Scientific Applications</h3>
                  <div className="bg-[#0F766E]/10 border border-[#0F766E]/20 rounded-xl p-4 text-xs text-[#0F2A3A] leading-relaxed">
                    <p>{datasets[selectedDataset as keyof typeof datasets].usage}</p>
                  </div>
                </div>

                {/* Available Files */}
                <div>
                  <h3 className="text-sm font-bold text-[#0F2A3A] uppercase tracking-wider mb-3">Downloadable Assets</h3>
                  <div className="space-y-2.5">
                    {datasets[selectedDataset as keyof typeof datasets].files.map((file, index) => (
                      <motion.div 
                        key={index}
                        className="flex items-center justify-between bg-[#F7F9FA] border border-[#D9E2E7] rounded-xl p-3.5"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div>
                          <h4 className="text-sm font-semibold text-[#0F2A3A] font-mono">{file.displayName}</h4>
                          <p className="text-xs text-[#5B7280] mt-0.5">{file.description}</p>
                        </div>
                        <button
                          onClick={() => downloadFile(file.filename, file.displayName)}
                          className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold rounded-xl transition-all flex items-center space-x-2 text-xs shadow-sm"
                        >
                          <FiDownload className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end pt-4 border-t border-[#D9E2E7]">
                  <button
                    onClick={() => setSelectedDataset(null)}
                    className="px-5 py-2.5 bg-[#EEF3F5] hover:bg-[#D9E2E7] text-[#0F2A3A] rounded-xl transition-colors font-medium text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Process Detail Modal */}
      {selectedProcess && (
        <div className="fixed inset-0 z-[100] bg-[#0F2A3A]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            className="w-full max-w-2xl bg-white border border-[#D9E2E7] rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-6 md:p-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#D9E2E7]">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{processInfo[selectedProcess as keyof typeof processInfo].icon}</div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0F2A3A]">
                      {processInfo[selectedProcess as keyof typeof processInfo].title}
                    </h2>
                    <div className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${
                      processInfo[selectedProcess as keyof typeof processInfo].color === 'blue' ? 'bg-[#0369A1]/10 text-[#0369A1] border border-[#0369A1]/20' :
                      processInfo[selectedProcess as keyof typeof processInfo].color === 'red' ? 'bg-[#B91C1C]/10 text-[#B91C1C] border border-[#B91C1C]/20' :
                      processInfo[selectedProcess as keyof typeof processInfo].color === 'yellow' ? 'bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20' :
                      processInfo[selectedProcess as keyof typeof processInfo].color === 'green' ? 'bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20' :
                      'bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20'
                    }`}>
                      {processInfo[selectedProcess as keyof typeof processInfo].color === 'blue' ? 'Frontend Process' :
                       processInfo[selectedProcess as keyof typeof processInfo].color === 'red' ? 'Event System' :
                       processInfo[selectedProcess as keyof typeof processInfo].color === 'yellow' ? 'Edge Function' :
                       processInfo[selectedProcess as keyof typeof processInfo].color === 'green' ? 'Data Processing' :
                       'Storage System'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProcess(null)}
                  className="p-2 hover:bg-[#EEF3F5] rounded-xl transition-colors text-[#5B7280] hover:text-[#0F2A3A]"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-bold text-[#0F2A3A] uppercase tracking-wider mb-2">Description</h3>
                  <p className="text-[#5B7280] text-sm leading-relaxed">
                    {processInfo[selectedProcess as keyof typeof processInfo].description}
                  </p>
                </div>

                {/* Process Details */}
                <div>
                  <h3 className="text-sm font-bold text-[#0F2A3A] uppercase tracking-wider mb-3">Process Protocol</h3>
                  <div className="space-y-2">
                    {processInfo[selectedProcess as keyof typeof processInfo].details.map((detail, index) => (
                      <motion.div 
                        key={index}
                        className="flex items-start space-x-3 bg-[#F7F9FA] border border-[#D9E2E7] rounded-xl p-3.5"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-[#0F766E]" />
                        <p className="text-[#0F2A3A] text-xs leading-relaxed">{detail}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Technical Flow */}
                <div>
                  <h3 className="text-sm font-bold text-[#0F2A3A] uppercase tracking-wider mb-2">Technical Flow</h3>
                  <div className="p-4 rounded-xl bg-[#F7F9FA] border border-[#D9E2E7]">
                    <p className="text-[#5B7280] text-xs leading-relaxed">
                      This process is part of the automated Kadal AI data ingestion pipeline and operates seamlessly 
                      with other components to ensure reliable data processing and storage.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#D9E2E7]">
                  <button
                    onClick={() => setSelectedProcess(null)}
                    className="px-4 py-2 bg-[#EEF3F5] hover:bg-[#D9E2E7] text-[#0F2A3A] rounded-xl transition-colors text-sm font-medium"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedProcess(null);
                      startPipelineAnimation();
                    }}
                    className="px-5 py-2 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold rounded-xl transition-all flex items-center space-x-2 text-sm shadow-sm"
                  >
                    <FiPlay className="w-4 h-4" />
                    <span>See in Action</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DataSourcePage;
