import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiArrowLeft, FiHome, FiInfo, FiDatabase, FiDollarSign, FiX, FiGlobe, FiAward, FiActivity } from 'react-icons/fi';
import ProjectCard from './ProjectCard';
import { Project } from '../App';
import { supabase } from '../services/supabaseClient';

interface DashboardProps {
  onProjectSelect: (project: Project) => void;
  onNavigateToAPI: () => void;
  onNavigateToDataSources: () => void;
  onNavigateToLanding?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onProjectSelect, onNavigateToAPI, onNavigateToDataSources, onNavigateToLanding }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWaterBody, setFormWaterBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setFormTitle('');
    setFormDescription('');
    setFormWaterBody('');
    setError(null);
  };

  const handleCreateProject = async () => {
    if (!formTitle.trim()) {
      setError('Title is required');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      // Insert into Supabase 'projects' table (id serial/uuid default)
      const { data, error: dbError } = await supabase
        .from('projects')
        .insert([
          {
            title: formTitle,
            description: formDescription,
            water_body: formWaterBody,
            progress: 0,
            date: new Date().toISOString().slice(0, 10)
          }
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      // Update local list for immediate UX
      const newProject: Project = {
        id: String((data as any).id ?? crypto.randomUUID()),
        title: (data as any).title ?? formTitle,
        description: (data as any).description ?? formDescription,
        date: (data as any).date ?? new Date().toISOString().slice(0, 10),
        tags: ['New'],
        progress: (data as any).progress ?? 0,
        waterBody: (data as any).water_body ?? formWaterBody
      };
      setProjects(prev => [newProject, ...prev]);
      closeModal();
    } catch (e: any) {
      setError(e.message || 'Failed to create project');
    } finally {
      setIsSaving(false);
    }
  };

  // Load projects from Supabase on mount
  useEffect(() => {
    const load = async () => {
      setIsLoadingProjects(true);
      setLoadError(null);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, title, description, water_body, progress, date')
          .order('date', { ascending: false });
        if (error) throw error;
        const mapped: Project[] = (data || []).map((p: any) => ({
          id: String(p.id),
          title: p.title,
          description: p.description ?? '',
          date: p.date ?? new Date().toISOString().slice(0, 10),
          tags: ['Project'],
          progress: Number(p.progress ?? 0),
          waterBody: p.water_body ?? ''
        }));
        setProjects(mapped);
      } catch (e: any) {
        setLoadError(e.message || 'Failed to load projects');
      } finally {
        setIsLoadingProjects(false);
      }
    };
    load();
  }, []);

  const totalWaterBodies = new Set(projects.map(p => p.waterBody).filter(Boolean)).size;
  const avgProgress = projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length) : 0;

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#0F2A3A]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#D9E2E7] shadow-[0_1px_2px_0_rgba(15,42,58,0.05)]">
        <div className="max-w-7xl mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div 
              className="flex items-center space-x-3 cursor-pointer"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onNavigateToLanding}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border border-[#D9E2E7] bg-white shadow-sm">
                <img 
                  src="/WhatsApp Image 2025-09-29 at 03.04.02.jpeg" 
                  alt="Kadal AI Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-[#0F2A3A] flex items-center gap-1.5 font-display">
                  Kadal AI <span className="text-[#0F766E] text-base font-sans font-bold">/ Kadal AI</span>
                </span>
                <span className="hidden sm:block text-[10px] tracking-wider uppercase font-semibold text-[#5B7280]">
                  Marine Research Platform
                </span>
              </div>
            </motion.div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1 p-1 bg-[#EEF3F5] rounded-xl border border-[#D9E2E7]">
              {(() => {
                const userRole = localStorage.getItem('Kadal AI:role') || '';
                const allowedRoles = ['principal_scientist', 'senior_scientist', 'scientist', 'junior_scientist'];
                const canAccessDataSources = allowedRoles.includes(userRole);
                
                const navItems = [
                  { name: 'Home', icon: FiHome, href: '#', onClick: undefined, isExternal: false, active: true },
                  ...(canAccessDataSources ? [{ name: 'Data Sources', icon: FiDatabase, href: 'https://data-ingestion-frontend-Kadal AI.netlify.app/', onClick: undefined, isExternal: true }] : []),
                  { name: 'API Documentation', icon: FiDollarSign, href: '#', onClick: onNavigateToAPI, isExternal: false }
                ];
                
                return navItems;
              })().map((item, index) => (
                item.isExternal ? (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-[#5B7280] hover:text-[#0F2A3A] hover:bg-white transition-all duration-150"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.04 }}
                  >
                    <item.icon className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span>{item.name}</span>
                  </motion.a>
                ) : (
                  <motion.button
                    key={item.name}
                    onClick={item.onClick}
                    className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                      item.active 
                        ? 'bg-white text-[#0F766E] border border-[#D9E2E7] shadow-sm' 
                        : 'text-[#5B7280] hover:text-[#0F2A3A] hover:bg-white'
                    }`}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.04 }}
                  >
                    <item.icon className={`w-3.5 h-3.5 ${item.active ? 'text-[#0F766E]' : 'text-[#5B7280]'}`} />
                    <span>{item.name}</span>
                  </motion.button>
                )
              ))}
              
              <button
                onClick={() => setIsAboutOpen(true)}
                className="flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-[#5B7280] hover:text-[#0F2A3A] hover:bg-white transition-all duration-150"
              >
                <FiInfo className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>About</span>
              </button>
            </nav>

            {/* User Info & Back Button */}
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-[#EEF3F5] rounded-xl border border-[#D9E2E7]">
                <span className="w-2 h-2 rounded-full bg-[#15803D]" />
                <span className="text-xs font-semibold text-[#0F2A3A]">Dr. Yuktha</span>
              </div>
              {onNavigateToLanding && (
                <button 
                  onClick={onNavigateToLanding}
                  className="flex items-center space-x-2 px-3.5 py-1.5 bg-white hover:bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl transition-all duration-150 text-xs font-semibold text-[#0F766E] shadow-sm hover:border-[#BCCBD5]"
                >
                  <FiArrowLeft className="w-3.5 h-3.5" />
                  <span>Landing</span>
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 pb-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <motion.div 
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#0F766E]" />
                <span>Oceanographic Research Gateway</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#0F2A3A] tracking-tight font-display">
                Marine Research Projects
              </h1>
              <p className="text-sm text-[#5B7280] mt-1 max-w-2xl">
                Explore multidisciplinary spatio-temporal datasets, bathymetric surveys, and automated eDNA analytics.
              </p>
            </div>
            
            <motion.button
              onClick={openModal}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#0F766E] text-white font-semibold text-sm rounded-xl hover:bg-[#0B5F58] shadow-sm hover:shadow transition-all duration-150 flex-shrink-0 min-h-[44px]"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiPlus className="w-4 h-4" />
              <span>New Project</span>
            </motion.button>
          </motion.div>

          {/* Mission Stats Quick Bar */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
          >
            <div className="bg-white rounded-2xl p-4 border border-[#D9E2E7] shadow-[0_1px_2px_rgba(15,42,58,0.06),0_8px_24px_rgba(15,42,58,0.06)] flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#5B7280]">Total Projects</p>
                <p className="text-2xl font-extrabold text-[#0F2A3A] font-mono num-tabular mt-0.5">{projects.length}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F0FDFA] border border-[#99F6E4] text-[#0F766E]">
                <FiDatabase className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#D9E2E7] shadow-[0_1px_2px_rgba(15,42,58,0.06),0_8px_24px_rgba(15,42,58,0.06)] flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#5B7280]">Water Bodies</p>
                <p className="text-2xl font-extrabold text-[#0F2A3A] font-mono num-tabular mt-0.5">{totalWaterBodies || 3}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D]">
                <FiGlobe className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#D9E2E7] shadow-[0_1px_2px_rgba(15,42,58,0.06),0_8px_24px_rgba(15,42,58,0.06)] flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#5B7280]">Avg Analysis</p>
                <p className="text-2xl font-extrabold text-[#0F2A3A] font-mono num-tabular mt-0.5">{avgProgress}%</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706]">
                <FiActivity className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#D9E2E7] shadow-[0_1px_2px_rgba(15,42,58,0.06),0_8px_24px_rgba(15,42,58,0.06)] flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#5B7280]">Telemetry Status</p>
                <p className="text-sm font-bold text-[#15803D] flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-[#15803D]" />
                  Live Sync
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-[#0369A1]">
                <FiAward className="w-4 h-4" />
              </div>
            </div>
          </motion.div>

          {/* Projects Grid / Empty / Loading */}
          {isLoadingProjects ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-[#D9E2E7] h-80 animate-pulse flex flex-col justify-between">
                  <div>
                    <div className="h-5 w-24 bg-[#EEF3F5] rounded-full mb-4" />
                    <div className="h-7 w-3/4 bg-[#EEF3F5] rounded-lg mb-3" />
                    <div className="h-4 w-1/2 bg-[#EEF3F5] rounded mb-4" />
                    <div className="h-16 w-full bg-[#EEF3F5] rounded-lg" />
                  </div>
                  <div className="h-10 w-full bg-[#EEF3F5] rounded-xl" />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="bg-white rounded-2xl p-8 border border-red-200 text-center max-w-lg mx-auto shadow-sm">
              <p className="text-sm text-[#B91C1C] font-semibold mb-2">Error Connecting to Project Repository</p>
              <p className="text-xs text-[#5B7280] mb-4">{loadError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-[#B91C1C] rounded-xl text-xs font-semibold"
              >
                Retry Connection
              </button>
            </div>
          ) : projects.length === 0 ? (
            <motion.div 
              className="bg-white rounded-3xl p-12 text-center border border-[#D9E2E7] shadow-[0_1px_2px_rgba(15,42,58,0.06),0_8px_24px_rgba(15,42,58,0.06)] max-w-xl mx-auto"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#F0FDFA] border border-[#99F6E4] text-[#0F766E] flex items-center justify-center mx-auto mb-4">
                <FiDatabase className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#0F2A3A] mb-1">No Projects Found</h3>
              <p className="text-sm text-[#5B7280] mb-6">
                Initialize your first marine investigation project to link bathymetric records and spatial data.
              </p>
              <button
                onClick={openModal}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#0F766E] text-white font-semibold text-sm rounded-xl hover:bg-[#0B5F58] transition-all shadow-sm"
              >
                <FiPlus className="w-4 h-4" />
                <span>Create First Project</span>
              </button>
            </motion.div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.04 * index }}
                >
                  <ProjectCard 
                    project={project} 
                    onSelect={() => onProjectSelect(project)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      {/* New Project Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0F2A3A]/30 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-lg bg-white border border-[#D9E2E7] rounded-3xl p-7 shadow-[0_4px_6px_-1px_rgba(15,42,58,0.07),0_12px_32px_rgba(15,42,58,0.09)] z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#D9E2E7]">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-[#F0FDFA] border border-[#99F6E4] text-[#0F766E]">
                    <FiPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#0F2A3A]">Create New Project</h2>
                    <p className="text-xs text-[#5B7280]">Initialize a new marine research workspace</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 text-[#5B7280] hover:text-[#0F2A3A] rounded-lg hover:bg-[#EEF3F5] transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-[#B91C1C]">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0F2A3A] uppercase tracking-wider mb-1.5">
                    Project Title *
                  </label>
                  <input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D9E2E7] rounded-xl text-[#0F2A3A] placeholder-[#94A3B8] text-sm focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 focus:outline-none transition-all"
                    placeholder="e.g., Andaman Deep Sea Survey"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F2A3A] uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D9E2E7] rounded-xl text-[#0F2A3A] placeholder-[#94A3B8] text-sm focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 focus:outline-none transition-all"
                    placeholder="Survey objectives, methodology, and regional scope"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F2A3A] uppercase tracking-wider mb-1.5">
                    Water Body
                  </label>
                  <input
                    value={formWaterBody}
                    onChange={(e) => setFormWaterBody(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D9E2E7] rounded-xl text-[#0F2A3A] placeholder-[#94A3B8] text-sm focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 focus:outline-none transition-all"
                    placeholder="e.g., Andaman Sea, Arabian Sea, Bay of Bengal"
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#D9E2E7] flex items-center justify-end gap-3">
                <button
                  onClick={closeModal}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl border border-[#D9E2E7] text-xs font-semibold text-[#5B7280] hover:bg-[#EEF3F5] hover:text-[#0F2A3A] transition-all disabled:opacity-50 min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#0F766E] text-white text-xs font-bold hover:bg-[#0B5F58] transition-all shadow-sm disabled:opacity-50 min-h-[38px]"
                >
                  {isSaving ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* About Modal */}
      <AnimatePresence>
        {isAboutOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0F2A3A]/30 backdrop-blur-sm"
              onClick={() => setIsAboutOpen(false)}
            />
            <motion.div 
              className="relative w-full max-w-2xl bg-white border border-[#D9E2E7] rounded-3xl shadow-[0_4px_6px_-1px_rgba(15,42,58,0.07),0_12px_32px_rgba(15,42,58,0.09)] overflow-hidden z-10"
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.2 }}
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
                    <h2 className="text-xl font-bold text-[#0F2A3A] tracking-tight font-display">About Kadal AI / Kadal AI</h2>
                    <p className="text-[#0F766E] text-xs font-semibold tracking-wide">
                      Spatio-temporal Analytics Gateway for Aquatic Resources
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAboutOpen(false)}
                  className="p-2 text-[#5B7280] hover:text-[#0F2A3A] rounded-xl hover:bg-[#D9E2E7] transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Platform Description */}
                <div className="bg-white rounded-2xl p-5 border border-[#D9E2E7] shadow-sm">
                  <h3 className="text-sm font-bold text-[#0F2A3A] mb-2 flex items-center">
                    <FiGlobe className="w-4 h-4 mr-2 text-[#0F766E]" />
                    Platform Overview
                  </h3>
                  <p className="text-[#5B7280] text-xs leading-relaxed">
                    Kadal AI is a cloud-native spatio-temporal platform engineered for marine biological and oceanographic research. 
                    Integrating multi-modal RAG architecture, real-time 3D bathymetry mapping, otolith classification ML, and eDNA sequence alignment, 
                    it accelerates oceanic discovery across national waters.
                  </p>
                </div>

                {/* Data Sources & Acknowledgements */}
                <div>
                  <h3 className="text-sm font-bold text-[#0F2A3A] mb-3 flex items-center">
                    <FiAward className="w-4 h-4 mr-2 text-[#0F766E]" />
                    Data Sources & Scientific Infrastructure
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#F8FAFC] rounded-2xl p-3.5 border border-[#D9E2E7]">
                      <div className="flex items-start justify-between mb-1.5">
                        <h4 className="font-bold text-xs text-[#0F2A3A]">CMLRE - MoES</h4>
                        <span className="text-[10px] px-2 py-0.5 bg-[#E0F2FE] text-[#0369A1] font-semibold rounded-full border border-[#BAE6FD]">Partner</span>
                      </div>
                      <p className="text-[11px] text-[#5B7280] mb-2">Centre for Marine Living Resources and Ecology</p>
                      <ul className="text-[11px] text-[#0F2A3A] space-y-1 list-disc list-inside">
                        <li>ADCP ocean current profiler records</li>
                        <li>AWS atmospheric & weather stations</li>
                        <li>CTD depth & salinity series</li>
                      </ul>
                    </div>

                    <div className="bg-[#F8FAFC] rounded-2xl p-3.5 border border-[#D9E2E7]">
                      <div className="flex items-start justify-between mb-1.5">
                        <h4 className="font-bold text-xs text-[#0F2A3A]">GBIF</h4>
                        <span className="text-[10px] px-2 py-0.5 bg-[#DCFCE7] text-[#15803D] font-semibold rounded-full border border-[#BBF7D0]">Global</span>
                      </div>
                      <p className="text-[11px] text-[#5B7280] mb-1">Global Biodiversity Information Facility</p>
                      <p className="text-[11px] text-[#0F2A3A]">
                        Primary source for marine species occurrence records and taxonomic backbones.
                      </p>
                    </div>

                    <div className="bg-[#F8FAFC] rounded-2xl p-3.5 border border-[#D9E2E7]">
                      <div className="flex items-start justify-between mb-1.5">
                        <h4 className="font-bold text-xs text-[#0F2A3A]">NOAA</h4>
                        <span className="text-[10px] px-2 py-0.5 bg-[#E0F2FE] text-[#0369A1] font-semibold rounded-full border border-[#BAE6FD]">Agency</span>
                      </div>
                      <p className="text-[11px] text-[#5B7280] mb-1">National Oceanic and Atmospheric Administration</p>
                      <p className="text-[11px] text-[#0F2A3A]">
                        Oceanographic bathymetry models and environmental baseline references.
                      </p>
                    </div>

                    <div className="bg-[#F8FAFC] rounded-2xl p-3.5 border border-[#D9E2E7]">
                      <div className="flex items-start justify-between mb-1.5">
                        <h4 className="font-bold text-xs text-[#0F2A3A]">IUCN Red List</h4>
                        <span className="text-[10px] px-2 py-0.5 bg-[#FEE2E2] text-[#B91C1C] font-semibold rounded-full border border-[#FECACA]">Conservation</span>
                      </div>
                      <p className="text-[11px] text-[#5B7280] mb-1">Species Threat Status Assessments</p>
                      <p className="text-[11px] text-[#0F2A3A]">
                        Conservation categories, threat classifications, and population trends.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-[#D9E2E7] text-center text-xs text-[#5B7280] font-mono">
                  Spatio-Temporal Analytics Gateway for Aquatic Resources • CMLRE
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
