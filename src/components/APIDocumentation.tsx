import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiDatabase, FiDollarSign, FiLogOut, FiCode, FiActivity, FiGlobe, FiServer, FiCpu, FiCopy, FiCheck, FiInfo, FiX, FiAward } from 'react-icons/fi';

interface APIDocumentationProps {
  onBack: () => void;
  onLogout?: () => void;
  onNavigateToDataSources?: () => void;
}

const APIDocumentation: React.FC<APIDocumentationProps> = ({ 
  onBack, 
  onLogout 
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const sections = [
    {
      id: 'data-processing',
      title: 'Data Processing Engine',
      description: 'Core engine for processing and ingesting marine data streams.',
      icon: FiServer,
      services: [
        {
          name: 'Data Processing Engine',
          baseUrl: 'https://dataprocessingengine-Kadal AI.onrender.com',
          description: 'Handles data ingestion pipeline and quality control checks.',
          endpoints: [
            { method: 'GET', path: '/', description: 'Health check - Returns system status' },
            { method: 'POST', path: '/process', description: 'Trigger data processing pipeline (Internal)' }
          ]
        }
      ]
    },
    {
      id: 'rag',
      title: 'RAG API',
      description: 'Retrieval-Augmented Generation service for querying marine knowledge base.',
      icon: FiDatabase,
      services: [
        {
          name: 'RAG Service',
          baseUrl: 'https://rag.nikare.in',
          description: 'Provides semantic search and question answering capabilities over the indexed data.',
          endpoints: [
            { method: 'POST', path: '/query', description: 'Submit a natural language query' },
            { method: 'GET', path: '/status', description: 'Check indexing status' }
          ]
        }
      ]
    },
    {
      id: 'ai-ml',
      title: 'AI/ML Services',
      description: 'Specialized machine learning models for marine biology tasks.',
      icon: FiCpu,
      services: [
        {
          name: 'Otolith Classifier',
          baseUrl: 'https://chinmay0805-37-otolith-classifier.hf.space',
          description: 'Classifies fish species based on otolith images.',
          endpoints: [
            { method: 'POST', path: '/predict', description: 'Upload image for classification' },
            { method: 'GET', path: '/', description: 'Service information and UI' }
          ]
        },
        {
          name: 'eDNA Analysis',
          baseUrl: 'https://Kadal AI-e-dna-2.vercel.app',
          description: 'Analyzes environmental DNA sequences for species detection.',
          endpoints: [
            { method: 'POST', path: '/api/analyze', description: 'Submit FASTA sequence for analysis' },
            { method: 'GET', path: '/api/status', description: 'Check analysis job status' }
          ]
        },
        {
          name: 'Species Identification',
          baseUrl: 'https://chinmay0805-specie-identification.hf.space',
          description: 'Identifies marine species from uploaded images.',
          endpoints: [
            { method: 'POST', path: '/predict', description: 'Identify species from image' },
            { method: 'GET', path: '/', description: 'Service information' }
          ]
        },
        {
          name: 'Taxonomy Service',
          baseUrl: 'https://taxa-2.vercel.app',
          description: 'Taxonomic hierarchy and species information service.',
          endpoints: [
            { method: 'GET', path: '/api/search', description: 'Search for species by name (query param: q)' },
            { method: 'GET', path: '/api/species/:id', description: 'Get detailed species info by ID' }
          ]
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#0F2A3A] selection:bg-[#0F766E]/20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#D9E2E7] shadow-sm">
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
              <div>
                <span className="text-xl font-extrabold tracking-tight text-[#0F2A3A] flex items-center gap-1.5">
                  Kadal <span className="text-[#0F766E]">AI</span>
                </span>
                <span className="hidden sm:block text-[10px] tracking-wider uppercase font-semibold text-[#5B7280]">
                  Developer Portal
                </span>
              </div>
            </motion.div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1 p-1 bg-[#EEF3F5] rounded-xl border border-[#D9E2E7]">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-[#5B7280] hover:text-[#0F2A3A] hover:bg-white transition-all duration-150"
              >
                <FiHome className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Home</span>
              </button>
              
              {/* Data Sources Link */}
              {['principal_scientist', 'senior_scientist', 'scientist', 'junior_scientist'].includes(localStorage.getItem('Kadal AI:role') || '') && (
                <a
                  href="https://data-ingestion-frontend-Kadal AI.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-[#5B7280] hover:text-[#0F2A3A] hover:bg-white transition-all duration-150"
                >
                  <FiDatabase className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>Data Sources</span>
                </a>
              )}

              <div className="flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white text-[#0F766E] shadow-sm border border-[#D9E2E7]">
                <FiCode className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Documentation</span>
              </div>

              <button
                onClick={() => setIsAboutOpen(true)}
                className="flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-[#5B7280] hover:text-[#0F2A3A] hover:bg-white transition-all duration-150"
              >
                <FiInfo className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>About</span>
              </button>
            </nav>

            {/* Logout */}
            <motion.button 
              onClick={onLogout}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-xs font-semibold text-[#B91C1C] transition-all duration-150 shadow-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FiLogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <motion.div 
            className="text-center mb-14"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E] text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
              <span>Developer Reference & Endpoints</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#0F2A3A] tracking-tight mb-4">
              API Documentation
            </h1>
            <p className="text-sm md:text-base text-[#5B7280] max-w-2xl mx-auto leading-relaxed">
              Complete reference for the Kadal AI platform ecosystem. Integrate with our Data Processing Engine, RAG capabilities, and specialized AI/ML services.
            </p>
          </motion.div>

          {/* Documentation Sections */}
          <div className="space-y-12">
            {sections.map((section, sectionIndex) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: sectionIndex * 0.05 }}
                className="space-y-6"
              >
                {/* Section Header */}
                <div className="flex items-center space-x-3.5 border-b border-[#D9E2E7] pb-4">
                  <div className="p-2.5 bg-[#0F766E]/10 border border-[#0F766E]/20 rounded-2xl text-[#0F766E] shadow-sm">
                    <section.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#0F2A3A] tracking-tight">{section.title}</h2>
                    <p className="text-xs text-[#5B7280] mt-0.5">{section.description}</p>
                  </div>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {section.services.map((service) => (
                    <div 
                      key={service.name}
                      className="bg-white rounded-2xl border border-[#D9E2E7] overflow-hidden hover:border-[#0F766E]/50 transition-all duration-200 shadow-paper"
                    >
                      {/* Service Header */}
                      <div className="p-6 border-b border-[#D9E2E7] bg-[#F7F9FA]">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-bold text-[#0F2A3A] tracking-tight">{service.name}</h3>
                          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#0F766E]/10 text-[#0F766E] rounded-full border border-[#0F766E]/20 font-mono">
                            REST API
                          </span>
                        </div>
                        <p className="text-xs text-[#5B7280] leading-relaxed mb-4">{service.description}</p>
                        
                        {/* Base URL */}
                        <div className="bg-white rounded-xl p-3 border border-[#D9E2E7] flex items-center justify-between group">
                          <code className="text-xs text-[#0F766E] font-mono break-all font-semibold">
                            {service.baseUrl}
                          </code>
                          <button
                            onClick={() => handleCopy(service.baseUrl)}
                            className="ml-2 p-1.5 text-[#5B7280] hover:text-[#0F2A3A] rounded-lg hover:bg-[#EEF3F5] transition-colors flex-shrink-0"
                            title="Copy URL"
                            aria-label="Copy URL"
                          >
                            {copiedUrl === service.baseUrl ? <FiCheck className="w-4 h-4 text-[#15803D]" /> : <FiCopy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Endpoints List */}
                      <div className="p-6 bg-white">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B7280] mb-4">
                          Available Endpoints
                        </h4>
                        <div className="space-y-3">
                          {service.endpoints.map((endpoint, idx) => (
                            <div key={idx} className="flex items-start space-x-3 text-xs bg-[#F7F9FA] rounded-xl p-3 border border-[#D9E2E7]">
                              <span className={`
                                px-2 py-0.5 rounded-lg text-[10px] font-extrabold font-mono min-w-[55px] text-center mt-0.5
                                ${endpoint.method === 'GET' ? 'bg-emerald-50 text-[#15803D] border border-emerald-200' : ''}
                                ${endpoint.method === 'POST' ? 'bg-teal-50 text-[#0F766E] border border-teal-200' : ''}
                                ${endpoint.method === 'PUT' ? 'bg-amber-50 text-[#D97706] border border-amber-200' : ''}
                                ${endpoint.method === 'DELETE' ? 'bg-red-50 text-[#B91C1C] border border-red-200' : ''}
                              `}>
                                {endpoint.method}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="font-mono text-[#0F766E] font-semibold mb-0.5 truncate" title={endpoint.path}>
                                  {endpoint.path}
                                </div>
                                <div className="text-[#5B7280] text-[11px] leading-relaxed">
                                  {endpoint.description}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer Note */}
          <div className="mt-20 text-center text-[#5B7280] text-xs font-mono">
            <p>
              For full API access credentials, please contact the Kadal AI / CMLRE administration.
            </p>
            <p className="mt-1">
              &copy; {new Date().getFullYear()} Kadal AI Platform. Ministry of Earth Sciences.
            </p>
          </div>
        </div>
      </main>

      {/* About Modal */}
      <AnimatePresence>
        {isAboutOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsAboutOpen(false)}
            />
            <motion.div 
              className="relative w-full max-w-2xl bg-white border border-[#D9E2E7] rounded-3xl shadow-2xl overflow-hidden z-10"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative bg-[#EEF3F5] p-6 border-b border-[#D9E2E7] flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-[#D9E2E7] bg-white shadow-sm">
                    <img 
                      src="/WhatsApp Image 2025-09-29 at 03.04.02.jpeg" 
                      alt="Kadal AI Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#0F2A3A] tracking-tight">About Kadal AI</h2>
                    <p className="text-[#0F766E] text-xs font-semibold tracking-wide">
                      Spatio-temporal Analytics Gateway for Aquatic Resources
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAboutOpen(false)}
                  className="p-2 text-[#5B7280] hover:text-[#0F2A3A] rounded-xl hover:bg-white transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Platform Description */}
                <div className="bg-[#F7F9FA] rounded-2xl p-5 border border-[#D9E2E7]">
                  <h3 className="text-sm font-bold text-[#0F2A3A] mb-2 flex items-center">
                    <FiGlobe className="w-4 h-4 mr-2 text-[#0F766E]" />
                    Platform Overview
                  </h3>
                  <p className="text-[#5B7280] text-xs leading-relaxed">
                    Kadal AI is a comprehensive, cloud-native platform designed to revolutionize marine biological research. 
                    By integrating advanced data processing engines, Retrieval-Augmented Generation (RAG) capabilities, 
                    and specialized AI/ML services, we provide researchers with powerful tools to analyze, visualize, 
                    and understand oceanographic data and marine biodiversity patterns.
                  </p>
                </div>

                {/* Data Sources & Acknowledgements */}
                <div>
                  <h3 className="text-sm font-bold text-[#0F2A3A] mb-3 flex items-center">
                    <FiAward className="w-4 h-4 mr-2 text-[#0F766E]" />
                    Data Sources & Infrastructure
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#F7F9FA] rounded-2xl p-3.5 border border-[#D9E2E7]">
                      <div className="flex items-start justify-between mb-1.5">
                        <h4 className="font-bold text-xs text-[#0F2A3A]">CMLRE</h4>
                        <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-[#0369A1] font-semibold rounded-full border border-blue-200">Partner</span>
                      </div>
                      <p className="text-[11px] text-[#5B7280] mb-2">Centre for Marine Living Resources and Ecology</p>
                      <ul className="text-[11px] text-[#0F2A3A] space-y-1 list-disc list-inside">
                        <li>ADCP (Acoustic Doppler Current Profiler) Data</li>
                        <li>AWS (Automatic Weather Station) Data</li>
                        <li>CTD (Conductivity, Temperature, Depth) Data</li>
                      </ul>
                    </div>

                    <div className="bg-[#F7F9FA] rounded-2xl p-3.5 border border-[#D9E2E7]">
                      <div className="flex items-start justify-between mb-1.5">
                        <h4 className="font-bold text-xs text-[#0F2A3A]">GBIF</h4>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-[#15803D] font-semibold rounded-full border border-emerald-200">Global</span>
                      </div>
                      <p className="text-[11px] text-[#5B7280] mb-1">Global Biodiversity Information Facility</p>
                      <p className="text-[11px] text-[#0F2A3A]">
                        Primary source for marine species occurrence records and taxonomic backbones.
                      </p>
                    </div>

                    <div className="bg-[#F7F9FA] rounded-2xl p-3.5 border border-[#D9E2E7]">
                      <div className="flex items-start justify-between mb-1.5">
                        <h4 className="font-bold text-xs text-[#0F2A3A]">NOAA</h4>
                        <span className="text-[10px] px-2 py-0.5 bg-teal-50 text-[#0F766E] font-semibold rounded-full border border-teal-200">Agency</span>
                      </div>
                      <p className="text-[11px] text-[#5B7280] mb-1">National Oceanic and Atmospheric Administration</p>
                      <p className="text-[11px] text-[#0F2A3A]">
                        Oceanographic datasets, bathymetry, and marine environmental data references.
                      </p>
                    </div>

                    <div className="bg-[#F7F9FA] rounded-2xl p-3.5 border border-[#D9E2E7]">
                      <div className="flex items-start justify-between mb-1.5">
                        <h4 className="font-bold text-xs text-[#0F2A3A]">IUCN</h4>
                        <span className="text-[10px] px-2 py-0.5 bg-red-50 text-[#B91C1C] font-semibold rounded-full border border-red-200">Conservation</span>
                      </div>
                      <p className="text-[11px] text-[#5B7280] mb-1">Species Threat Assessments</p>
                      <p className="text-[11px] text-[#0F2A3A]">
                        Red List data for species conservation status and threat assessments.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-[#D9E2E7] text-center text-xs text-[#5B7280] font-mono">
                  Developed for the marine research community • CMLRE - MoES
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default APIDocumentation;
