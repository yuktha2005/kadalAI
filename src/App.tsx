import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import GlobeView from './components/GlobeView';
import LoaderOverlay from './components/LoaderOverlay';
import SearchResultsView, { SearchResultSummary } from './components/SearchResultsView';
import APIDocumentation from './components/APIDocumentation';
import DataSourcePage from './components/DataSourcePage';
import VesselLogin from './components/VesselLogin';
import Login from './components/Login';
import './App.css';

export interface Project {
  id: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  progress: number;
  waterBody: string;
}

export interface DataPoint {
  scientificName: string;
  locality: string;
  eventDate: string;
  decimalLatitude: number;
  decimalLongitude: number;
  waterBody: string;
  samplingProtocol: string;
  minimumDepthInMeters: number;
  maximumDepthInMeters: number;
  identifiedBy: string;
}

function App() {
  // Check authentication status
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('Kadal AI:authenticated') === 'true';
  });

  // Utility function to check if user can access Data Sources
  const canAccessDataSources = (): boolean => {
    const userRole = localStorage.getItem('Kadal AI:role') || '';
    const allowedRoles = ['principal_scientist', 'senior_scientist', 'scientist', 'junior_scientist'];
    return allowedRoles.includes(userRole);
  };

  // Initialize view based on current URL
  const getInitialView = () => {
    const path = window.location.pathname;
    if (path === '/api-docs' || path === '/api-documentation') return 'api-docs';
    if (path === '/dashboard') return 'dashboard';
    if (path === '/data-sources') {
      // Check if user has access to data sources
      const userRole = localStorage.getItem('Kadal AI:role') || '';
      const allowedRoles = ['principal_scientist', 'senior_scientist', 'scientist', 'junior_scientist'];
      if (!allowedRoles.includes(userRole)) {
        // Redirect to dashboard if user doesn't have access
        return 'dashboard';
      }
      return 'data-sources';
    }
    if (path.startsWith('/project/')) return 'globe';
    if (path === '/globe') return 'globe';
    if (path === '/search') return 'search';
    return 'landing';
  };

  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'search' | 'globe' | 'api-docs' | 'data-sources' | 'vessel-login'>(getInitialView());
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showLoader, setShowLoader] = React.useState(false);
  const [searchResult, setSearchResult] = React.useState<SearchResultSummary | null>(null);
  const [instantTransition, setInstantTransition] = React.useState(false);

  // Handle successful login
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentView('landing');
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('Kadal AI:authenticated');
    localStorage.removeItem('Kadal AI:username');
    localStorage.removeItem('Kadal AI:role');
    setIsAuthenticated(false);
    setCurrentView('landing');
  };

  // Handle navigation to landing page (fast, minimal delays)
  const handleNavigateToLanding = () => {
    // Set instant transition flag to skip animations
    setInstantTransition(true);
    // Update URL immediately
    window.history.pushState({}, '', '/');
    // Update view immediately - no animation delay
    setCurrentView('landing');
    // Reset flag after transition completes
    setTimeout(() => setInstantTransition(false), 50);
  };

  // Function to load project from database
  const loadProjectFromDatabase = async (projectId: string) => {
    try {
      // Import supabase client
      const { supabase } = await import('./services/supabaseClient');
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error loading project:', error);
        return;
      }

      if (data) {
        const project: Project = {
          id: String(data.id),
          title: data.title,
          description: data.description || '',
          date: data.date || new Date().toISOString().slice(0, 10),
          tags: ['Project'],
          progress: Number(data.progress || 0),
          waterBody: data.water_body || ''
        };
        setSelectedProject(project);
        // Save to localStorage for future use
        localStorage.setItem('Kadal AI:selectedProject', JSON.stringify(project));
      }
    } catch (error) {
      console.error('Error loading project from database:', error);
    }
  };

  // Handle browser back/forward navigation
  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname;
      console.log('URL changed to:', path);
      
      if (path === '/api-docs' || path === '/api-documentation') {
        setCurrentView('api-docs');
      } else if (path === '/dashboard') {
        setCurrentView('dashboard');
      } else if (path === '/data-sources') {
        // Check if user has access to data sources
        const userRole = localStorage.getItem('Kadal AI:role') || '';
        const allowedRoles = ['principal_scientist', 'senior_scientist', 'scientist', 'junior_scientist'];
        if (allowedRoles.includes(userRole)) {
          setCurrentView('data-sources');
        } else {
          // Redirect to dashboard if user doesn't have access
          setCurrentView('dashboard');
          window.history.pushState({}, '', '/dashboard');
        }
      } else if (path.startsWith('/project/')) {
        // Extract project ID from URL
        const projectId = path.replace('/project/', '');
        console.log('Loading project from URL:', projectId);
        setCurrentView('globe');
        // Load project data from localStorage first, then from database if needed
        try {
          const savedProject = localStorage.getItem('Kadal AI:selectedProject');
          if (savedProject) {
            const project = JSON.parse(savedProject);
            if (project.id === projectId) {
              setSelectedProject(project);
            } else {
              // Project ID doesn't match, need to load from database
              loadProjectFromDatabase(projectId);
            }
          } else {
            // No saved project, load from database
            loadProjectFromDatabase(projectId);
          }
        } catch (e) {
          console.error('Error loading project:', e);
          loadProjectFromDatabase(projectId);
        }
      } else if (path === '/globe') {
        setCurrentView('globe');
      } else if (path === '/search') {
        setCurrentView('search');
      } else {
        setCurrentView('landing');
      }
    };

    // Listen for browser back/forward navigation
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Update URL when view changes
  useEffect(() => {
    const currentPath = window.location.pathname;
    let targetPath = '/';
    
    switch (currentView) {
      case 'api-docs':
        targetPath = '/api-docs';
        break;
      case 'dashboard':
        targetPath = '/dashboard';
        break;
      case 'data-sources':
        targetPath = '/data-sources';
        break;
      case 'globe':
        if (selectedProject) {
          targetPath = `/project/${selectedProject.id}`;
        } else {
          targetPath = '/globe';
        }
        break;
      case 'search':
        targetPath = '/search';
        break;
      default:
        targetPath = '/';
    }
    
    // Update URL if it's different from current path
    if (currentPath !== targetPath) {
      console.log('Updating URL from', currentPath, 'to', targetPath);
      window.history.pushState({}, '', targetPath);
    }
  }, [currentView, selectedProject]);

  // Handle initial project loading from URL
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/project/')) {
      const projectId = path.replace('/project/', '');
      console.log('Initial load: Loading project from URL:', projectId);
      
      // Try to load from localStorage first
      try {
        const savedProject = localStorage.getItem('Kadal AI:selectedProject');
        if (savedProject) {
          const project = JSON.parse(savedProject);
          if (project.id === projectId) {
            setSelectedProject(project);
            return;
          }
        }
      } catch (e) {
        console.error('Error loading project from localStorage:', e);
      }
      
      // If not found in localStorage, load from database
      loadProjectFromDatabase(projectId);
    }
  }, []);

  const handleProjectSelect = (project: Project) => {
    console.log('App: Project selected, navigating to globe view');
    setShowLoader(true);
    setTimeout(() => {
      setSelectedProject(project);
      setCurrentView('globe');
      setShowLoader(false);
    }, 800);
  };

  React.useEffect(() => {
    const handler = () => {
      console.log('App: Back to Projects event received');
      setShowLoader(true);
      setTimeout(() => {
        setCurrentView('dashboard');
        setSelectedProject(null);
        setShowLoader(false);
      }, 600);
    };
    window.addEventListener('backToProjects', handler as EventListener);
    return () => window.removeEventListener('backToProjects', handler as EventListener);
  }, []);


  // Restore additional state from localStorage (but don't override URL-based view)
  React.useEffect(() => {
    try {
      const savedResult = localStorage.getItem('Kadal AI:searchResult');
      const savedProject = localStorage.getItem('Kadal AI:selectedProject');
      if (savedResult) {
        const parsed = JSON.parse(savedResult);
        console.error('📱 App.tsx - Loading searchResult from localStorage:', {
          hasRagOccurrences: parsed.ragOccurrences?.length || 0,
          hasDashboardSummary: !!parsed.dashboardSummary,
          scientificName: parsed.scientificName
        });
        setSearchResult(parsed);
      }
      if (savedProject) {
        setSelectedProject(JSON.parse(savedProject));
      }
    } catch {}
  }, []);

  // Persist view state on change
  React.useEffect(() => {
    try {
      localStorage.setItem('Kadal AI:view', currentView);
      if (searchResult) {
        localStorage.setItem('Kadal AI:searchResult', JSON.stringify(searchResult));
      } else {
        localStorage.removeItem('Kadal AI:searchResult');
      }
      if (selectedProject) {
        localStorage.setItem('Kadal AI:selectedProject', JSON.stringify(selectedProject));
      } else {
        localStorage.removeItem('Kadal AI:selectedProject');
      }
    } catch {}
  }, [currentView, searchResult, selectedProject]);



  console.log('App: Current view:', currentView, 'Selected project:', selectedProject?.title);

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] text-[#0F2A3A]">
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#0F2A3A]">
      <LoaderOverlay visible={showLoader} />
      <AnimatePresence mode="sync">
        {currentView === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: instantTransition ? 0.1 : 0.3 }}
          >
            <LandingPage 
              onEnter={() => setCurrentView('dashboard')} 
              onVesselLogin={() => setCurrentView('vessel-login')}
              onLogout={handleLogout}
              skipAnimations={instantTransition}
            />
          </motion.div>
        ) : currentView === 'dashboard' ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: instantTransition ? 0.1 : 0.3 }}
          >
            <Dashboard 
              onProjectSelect={handleProjectSelect} 
              onNavigateToAPI={() => setCurrentView('api-docs')} 
              onNavigateToDataSources={() => {
                if (canAccessDataSources()) {
                  setCurrentView('data-sources');
                }
              }}
              onNavigateToLanding={handleNavigateToLanding}
            />
          </motion.div>
        ) : currentView === 'search' ? (
          // Analysis Dashboard - Shows RAG query results with charts and visualizations
          <motion.div
            key="search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {searchResult ? (
              <div className="pt-24 px-6 max-w-7xl mx-auto">
                <SearchResultsView
                  result={searchResult}
                  selectedProject={selectedProject}
                  onViewOnGlobe={() => {
                    setCurrentView('globe');
                    window.history.pushState({}, '', '/globe');
                  }}
                  onBack={() => {
                    // Show loader during transition back to globe
                    setShowLoader(true);
                    const t = (window as any).__kadalAiTransition;
                    if (t?.overlay) {
                      t.overlay.remove();
                      (window as any).__kadalAiTransition = undefined;
                    }
                    setCurrentView('globe');
                    window.history.pushState({}, '', '/globe');
                    // Hide loader after brief delay
                    setTimeout(() => setShowLoader(false), 800);
                  }}
                />
              </div>
            ) : (
              <div className="pt-24 px-6 max-w-7xl mx-auto text-center text-white">
                <p className="text-xl mb-4">No analysis results available</p>
                <button
                  onClick={() => {
                    setCurrentView('globe');
                    window.history.pushState({}, '', '/globe');
                  }}
                  className="px-4 py-2 bg-marine-cyan/30 border border-marine-cyan/50 rounded-xl text-white hover:bg-marine-cyan/40 transition-colors"
                >
                  Go to Globe View
                </button>
              </div>
            )}
          </motion.div>
        ) : currentView === 'api-docs' ? (
          <motion.div
            key="api-docs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <APIDocumentation 
              onBack={() => setCurrentView('dashboard')} 
              onLogout={handleLogout}
              onNavigateToDataSources={() => {
                if (canAccessDataSources()) {
                  setCurrentView('data-sources');
                }
              }}
            />
          </motion.div>
        ) : currentView === 'data-sources' ? (
          canAccessDataSources() ? (
            <motion.div
              key="data-sources"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <DataSourcePage 
                onBack={() => setCurrentView('dashboard')} 
                onLogout={handleLogout}
              />
            </motion.div>
          ) : (
            <motion.div
              key="data-sources-redirect"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Dashboard 
                onProjectSelect={handleProjectSelect} 
                onNavigateToAPI={() => setCurrentView('api-docs')} 
                onNavigateToDataSources={() => setCurrentView('data-sources')}
                onNavigateToLanding={handleNavigateToLanding}
              />
            </motion.div>
          )
        ) : currentView === 'vessel-login' ? (
          <motion.div
            key="vessel-login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <VesselLogin onBack={() => setCurrentView('landing')} />
          </motion.div>
        ) : (
          <motion.div
            key="globe"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlobeView 
              selectedProject={selectedProject}
              onShowSearchResults={(result) => {
                // Debug: Log what we're receiving - USE console.error to ensure visibility
                console.error('📱 App.tsx - onShowSearchResults called with:', {
                  hasRagOccurrences: result.ragOccurrences?.length || 0,
                  hasDashboardSummary: !!result.dashboardSummary,
                  scientificName: result.scientificName,
                  ragSourcesCount: result.ragSourcesCount
                });
                console.error('📱 App.tsx - Full result object:', result);
                
                // Show loader during transition into SearchResultsView (Analysis Dashboard)
                setShowLoader(true);
                setSearchResult(result);
                setCurrentView('search');
                // Update URL to /search (analysis dashboard route)
                window.history.pushState({}, '', '/search');
                // Hide after brief delay to cover render/texture loads
                setTimeout(() => setShowLoader(false), 900);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main App component with Router
function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWithRouter;
