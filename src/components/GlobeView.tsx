import React, { useEffect, useMemo, useState, Suspense } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiFilter, FiPlus, FiActivity, FiTrendingUp, FiSearch, FiX, FiClock, FiDatabase, FiFileText, FiEdit2, FiTrash2, FiSave, FiPenTool, FiPause, FiPlay, FiSquare, FiCheck, FiRotateCcw, FiInfo, FiCpu, FiLayers, FiImage } from 'react-icons/fi';
import { Project, DataPoint } from '../App';
import ReactGlobeComponent from './ReactGlobeComponent';
import { Card, CardTitle, CardDescription, CardSkeletonContainer } from './ui/aceternityCards';
import { DataService } from '../services/dataService';
import { SearchResultSummary } from './SearchResultsView';
import ragService, { DataType } from '../services/ragService';
import otolithService from '../services/otolithService';
import ednaService, { EDNAMatchResponse } from '../services/ednaService';
import queryHistoryService from '../services/queryHistoryService';
import studyNotesService from '../services/studyNotesService';
import taxonomyService, { LineageItem } from '../services/taxonomyService';
import geminiService from '../services/geminiService';
import speciesIdentificationService, { SpeciesIdentificationResponse } from '../services/speciesIdentificationService';
import OceanDepthFilter, { OceanDepthZoneId, OCEAN_DEPTH_ZONES } from './ui/OceanDepthFilter';
import AutonomousCopilotModal from './AutonomousCopilotModal';

interface GlobeViewProps {
  selectedProject: Project | null;
  onShowSearchResults?: (result: SearchResultSummary) => void;
}

const GlobeView: React.FC<GlobeViewProps> = ({ selectedProject, onShowSearchResults }) => {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataLayer, setDataLayer] = useState<'Species Occurrences' | 'Sea Surface Temperature (SST)' | 'Salinity' | 'Chlorophyll Concentration' | 'eDNA Detections'>('Species Occurrences');
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  type ActiveFilter = 
    | { type: 'species'; value: string }
    | { type: 'waterBody'; value: string }
    | { type: 'locality'; value: string }
    | { type: 'depth'; min: number; max: number }
    | { type: 'date'; start: string; end: string }
    | { type: 'method'; values: string[] };
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [newSpecies, setNewSpecies] = useState('');
  const [newWaterBody, setNewWaterBody] = useState('');
  const [newLocality, setNewLocality] = useState('');
  const [depthMin, setDepthMin] = useState<number>(0);
  const [depthMax, setDepthMax] = useState<number>(1000);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [methods, setMethods] = useState<string[]>([]);
  const [analysisInput, setAnalysisInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState<string[]>([]);
  const [insight, setInsight] = useState<string | null>(null);
  const [selectedDataTypes, setSelectedDataTypes] = useState<DataType[]>([]); // Empty = auto-detect
  const [activeMode, setActiveMode] = useState<'Analyse' | 'Visualise' | 'Study'>('Analyse');
  const [globeFocused, setGlobeFocused] = useState<boolean>(false);
  const [resetCamera, setResetCamera] = useState<(() => void) | null>(null);
  const [showQueryHistory, setShowQueryHistory] = useState<boolean>(false);
  const [queryHistoryItems, setQueryHistoryItems] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);
  const [showNotesPanel, setShowNotesPanel] = useState<boolean>(false);
  const [notesPanelNotes, setNotesPanelNotes] = useState<any[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [showNoDataPopup, setShowNoDataPopup] = useState<boolean>(false);
  const [noDataPopupMessage, setNoDataPopupMessage] = useState<string>('');
  const [selectedPanelNote, setSelectedPanelNote] = useState<any | null>(null);
  const [isCreatingPanelNote, setIsCreatingPanelNote] = useState(false);
  const [panelNoteTitle, setPanelNoteTitle] = useState('');
  const [panelNoteContent, setPanelNoteContent] = useState('');
  const [savingPanelNote, setSavingPanelNote] = useState(false);
  const [isGlobeRotationPaused, setIsGlobeRotationPaused] = useState<boolean>(false);
  const [isPolygonDrawingMode, setIsPolygonDrawingMode] = useState<boolean>(false);
  const [polygonVertices, setPolygonVertices] = useState<Array<{ lat: number; lng: number }>>([]);
  const [currentPolygon, setCurrentPolygon] = useState<Array<{ lat: number; lng: number }> | null>(null);
  const [polygonOccurrences, setPolygonOccurrences] = useState<DataPoint[]>([]);
  const [showPolygonInfo, setShowPolygonInfo] = useState(false);
  const [selectedDepthZone, setSelectedDepthZone] = useState<OceanDepthZoneId>('all');
  const [showAutonomousCopilot, setShowAutonomousCopilot] = useState<boolean>(false);

  // Add polygon vertex; if new point is close to the first point, auto-close
  const addPolygonVertex = (lat: number, lng: number) => {
    setPolygonVertices(prev => {
      if (prev.length >= 3) {
        const first = prev[0];
        const dist = Math.hypot(lat - first.lat, lng - first.lng); // simple degree distance
        const closeThreshold = 0.5; // degrees ~55km
        if (dist <= closeThreshold) {
          // Close polygon by snapping to first point
          const closed = [...prev, first];
          setCurrentPolygon(closed);
          setIsPolygonDrawingMode(false);
          return closed;
        }
      }
      return [...prev, { lat, lng }];
    });
  };

  const pointInPolygon = (point: { lat: number; lng: number }, poly: Array<{ lat: number; lng: number }>) => {
    // Spherical point-in-polygon: sum of angles method on unit sphere
    if (poly.length < 3) return false;

    // Remove duplicate last vertex if present
    const cleanPoly = poly.slice();
    const first = cleanPoly[0];
    const last = cleanPoly[cleanPoly.length - 1];
    if (Math.abs(first.lat - last.lat) < 1e-9 && Math.abs(first.lng - last.lng) < 1e-9) {
      cleanPoly.pop();
    }
    if (cleanPoly.length < 3) return false;

    const toVec = (lat: number, lng: number) => {
      const rlat = (lat * Math.PI) / 180;
      const rlng = (lng * Math.PI) / 180;
      return {
        x: Math.cos(rlat) * Math.cos(rlng),
        y: Math.cos(rlat) * Math.sin(rlng),
        z: Math.sin(rlat),
      };
    };

    const p = toVec(point.lat, point.lng);
    let angleSum = 0;
    for (let i = 0; i < cleanPoly.length; i++) {
      const a = toVec(cleanPoly[i].lat, cleanPoly[i].lng);
      const b = toVec(cleanPoly[(i + 1) % cleanPoly.length].lat, cleanPoly[(i + 1) % cleanPoly.length].lng);
      // Compute angle between (a-p) and (b-p)
      const ap = { x: a.x - p.x, y: a.y - p.y, z: a.z - p.z };
      const bp = { x: b.x - p.x, y: b.y - p.y, z: b.z - p.z };
      const apLen = Math.sqrt(ap.x * ap.x + ap.y * ap.y + ap.z * ap.z);
      const bpLen = Math.sqrt(bp.x * bp.x + bp.y * bp.y + bp.z * bp.z);
      if (apLen === 0 || bpLen === 0) return true; // point coincides with vertex
      const dot = (ap.x * bp.x + ap.y * bp.y + ap.z * bp.z) / (apLen * bpLen);
      const cross = {
        x: ap.y * bp.z - ap.z * bp.y,
        y: ap.z * bp.x - ap.x * bp.z,
        z: ap.x * bp.y - ap.y * bp.x,
      };
      const crossLen = Math.sqrt(cross.x * cross.x + cross.y * cross.y + cross.z * cross.z);
      const angle = Math.atan2(crossLen, dot);
      // Determine sign based on direction (using point as origin)
      const sign = (p.x * cross.x + p.y * cross.y + p.z * cross.z) >= 0 ? 1 : -1;
      angleSum += sign * angle;
    }
    return Math.abs(angleSum) > Math.PI; // inside if angle sum around 2π
  };

  const captureOccurrencesInPolygon = () => {
    const poly = currentPolygon || polygonVertices;
    if (!poly || poly.length < 3) {
      setPolygonOccurrences([]);
      setShowPolygonInfo(true);
      return;
    }
    const occurrences = filteredData.filter(dp => pointInPolygon({ lat: dp.decimalLatitude, lng: dp.decimalLongitude }, poly));
    setPolygonOccurrences(occurrences);
    setShowPolygonInfo(true);
  };

  const loadQueryHistory = async () => {
    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      const data = await queryHistoryService.getAllQueries(50);
      setQueryHistoryItems(data);
    } catch (e: any) {
      setHistoryError(e.message || 'Failed to load query history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleRestoreQuery = async (id: string) => {
    try {
      const record = await queryHistoryService.getQueryById(id);
      if (!record) {
        setHistoryError('Query not found');
        return;
      }

      const searchResult = queryHistoryService.convertToSearchResultSummary(record);
      if (!searchResult) {
        setHistoryError('Unable to restore query results');
        return;
      }

      setShowQueryHistory(false);
      if (onShowSearchResults) {
        onShowSearchResults(searchResult);
      }
    } catch (e: any) {
      setHistoryError(e.message || 'Failed to restore query');
    }
  };

  const handleDeleteHistoryQuery = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this query from history?')) {
      return;
    }

    setDeletingHistoryId(id);
    try {
      const success = await queryHistoryService.deleteQuery(id);
      if (success) {
        setQueryHistoryItems(prev => prev.filter(q => q.id !== id));
      } else {
        setHistoryError('Failed to delete query');
      }
    } catch (e: any) {
      setHistoryError(e.message || 'Failed to delete query');
    } finally {
      setDeletingHistoryId(null);
    }
  };

  const formatHistoryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFilterSummary = (options: any) => {
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

  const loadNotesPanel = async () => {
    if (!selectedProject?.id) {
      setNotesError('No project selected');
      return;
    }
    setIsLoadingNotes(true);
    setNotesError(null);
    try {
      const data = await studyNotesService.getNotesByProject(selectedProject.id);
      setNotesPanelNotes(data);
    } catch (e: any) {
      setNotesError(e.message || 'Failed to load notes');
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handlePanelCreateNote = () => {
    setIsCreatingPanelNote(true);
    setSelectedPanelNote(null);
    setPanelNoteTitle('');
    setPanelNoteContent('');
    setNotesError(null);
  };

  const handlePanelEditNote = (note: any) => {
    setSelectedPanelNote(note);
    setIsCreatingPanelNote(false);
    setPanelNoteTitle(note.title);
    setPanelNoteContent(note.content);
    setNotesError(null);
  };

  const handlePanelSaveNote = async () => {
    if (!selectedProject?.id) {
      setNotesError('No project selected');
      return;
    }

    if (!panelNoteTitle.trim() || !panelNoteContent.trim()) {
      setNotesError('Title and content are required');
      return;
    }

    setSavingPanelNote(true);
    setNotesError(null);

    try {
      if (isCreatingPanelNote) {
        const newNote = await studyNotesService.createNote({
          project_id: selectedProject.id,
          title: panelNoteTitle.trim(),
          content: panelNoteContent.trim(),
        });
        if (newNote) {
          await loadNotesPanel();
          setIsCreatingPanelNote(false);
          setSelectedPanelNote(null);
          setPanelNoteTitle('');
          setPanelNoteContent('');
        } else {
          setNotesError('Failed to create note');
        }
      } else if (selectedPanelNote) {
        const updatedNote = await studyNotesService.updateNote(selectedPanelNote.id, {
          title: panelNoteTitle.trim(),
          content: panelNoteContent.trim(),
        });
        if (updatedNote) {
          await loadNotesPanel();
          setIsCreatingPanelNote(false);
          setSelectedPanelNote(null);
          setPanelNoteTitle('');
          setPanelNoteContent('');
        } else {
          setNotesError('Failed to update note');
        }
      }
    } catch (e: any) {
      setNotesError(e.message || 'Failed to save note');
    } finally {
      setSavingPanelNote(false);
    }
  };

  const handlePanelDeleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const success = await studyNotesService.deleteNote(noteId);
      if (success) {
        await loadNotesPanel();
        if (selectedPanelNote?.id === noteId) {
          setSelectedPanelNote(null);
          setIsCreatingPanelNote(false);
          setPanelNoteTitle('');
          setPanelNoteContent('');
        }
      } else {
        setNotesError('Failed to delete note');
      }
    } catch (e: any) {
      setNotesError(e.message || 'Failed to delete note');
    }
  };

  const formatNotesDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setGlobeFocused(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Leave globe focus when switching away from Analyse
  useEffect(() => {
    if (activeMode === 'Visualise') {
      setGlobeFocused(false);
    }
  }, [activeMode]);

  // Add event listeners for globe hover events
  useEffect(() => {
    const handleGlobeHover = (event: CustomEvent) => {
      setHoveredPoint(event.detail.dataPoint);
      setTooltipPosition(event.detail.position);
    };

    const handleGlobeLeave = () => {
      setHoveredPoint(null);
    };

    window.addEventListener('globe-point-hover', handleGlobeHover as EventListener);
    window.addEventListener('globe-point-leave', handleGlobeLeave);

    return () => {
      window.removeEventListener('globe-point-hover', handleGlobeHover as EventListener);
      window.removeEventListener('globe-point-leave', handleGlobeLeave);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const svc = DataService.getInstance();
      const pts = await svc.loadOccurrenceData();
      setDataPoints(pts);
      setIsLoading(false);
    };
    load();
  }, []);

  const uniqueSpecies = useMemo(() => Array.from(new Set(dataPoints.map(d => d.scientificName))).sort(), [dataPoints]);
  const uniqueWaterBodies = useMemo(() => Array.from(new Set(dataPoints.map(d => d.waterBody))).filter(Boolean).sort(), [dataPoints]);
  const uniqueLocalities = useMemo(() => Array.from(new Set(dataPoints.map(d => d.locality))).filter(Boolean).sort(), [dataPoints]);
  const uniqueMethods = useMemo(() => Array.from(new Set(dataPoints.map(d => d.samplingProtocol))).filter(Boolean).sort(), [dataPoints]);

  const filteredData = useMemo(() => {
    let result = dataPoints;

    // Apply Bathymetric / Ocean Depth Zone filter
    if (selectedDepthZone !== 'all') {
      const zoneConfig = OCEAN_DEPTH_ZONES.find(z => z.id === selectedDepthZone);
      if (zoneConfig) {
        result = result.filter(p => {
          const d = (p as any).depth ?? (p.minimumDepthInMeters !== undefined && p.maximumDepthInMeters !== undefined ? (p.minimumDepthInMeters + p.maximumDepthInMeters) / 2 : p.minimumDepthInMeters ?? 0);
          return d >= zoneConfig.minDepth && d < zoneConfig.maxDepth;
        });
      }
    }

    for (const f of activeFilters) {
      switch (f.type) {
        case 'species':
          result = result.filter(p => p.scientificName.toLowerCase().includes(f.value.toLowerCase()));
          break;
        case 'waterBody':
          result = result.filter(p => p.waterBody === f.value);
          break;
        case 'locality':
          result = result.filter(p => p.locality === f.value);
          break;
        case 'depth':
          result = result.filter(p => (p.minimumDepthInMeters >= f.min && p.maximumDepthInMeters <= f.max));
          break;
        case 'date':
          result = result.filter(p => {
            const d = new Date(p.eventDate).getTime();
            const s = f.start ? new Date(f.start).getTime() : -Infinity;
            const e = f.end ? new Date(f.end).getTime() : Infinity;
            return !isNaN(d) && d >= s && d <= e;
          });
          break;
        case 'method':
          result = result.filter(p => f.values.includes(p.samplingProtocol));
          break;
      }
    }
    return result;
  }, [dataPoints, activeFilters, selectedDepthZone]);

  const liveFeedData = [
    'New species discovered in Andaman Sea',
    'Temperature anomaly detected in Arabian Sea',
    'Coral bleaching alert in Bay of Bengal',
    'Plankton bloom observed in Indian Ocean',
    'Deep sea survey completed successfully'
  ];

  // Helper functions to generate chart data
  const generateOccurrencesByYear = (data: DataPoint[]) => {
    const yearCounts: { [year: number]: number } = {};
    data.forEach(point => {
      const year = new Date(point.eventDate).getFullYear();
      if (!isNaN(year)) {
        yearCounts[year] = (yearCounts[year] || 0) + 1;
      }
    });
    return Object.entries(yearCounts).map(([year, count]) => ({
      year: parseInt(year),
      count
    })).sort((a, b) => a.year - b.year);
  };

  const generateDepthHistogram = (data: DataPoint[]) => {
    const depthCounts: { [depth: number]: number } = {};
    data.forEach(point => {
      const avgDepth = Math.round((point.minimumDepthInMeters + point.maximumDepthInMeters) / 2);
      depthCounts[avgDepth] = (depthCounts[avgDepth] || 0) + 1;
    });
    return Object.entries(depthCounts).map(([depth, count]) => ({
      depth: parseInt(depth),
      count
    })).sort((a, b) => a.depth - b.depth);
  };

  const generateCategoryCounts = (data: DataPoint[], key: 'waterBody' | 'samplingProtocol') => {
    const counts: { [name: string]: number } = {};
    data.forEach(point => {
      const val = (point as any)[key];
      if (val) counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  };

  // no-op here; VisualiseView will compute from raw data

  // Validate if query is meaningful
  const isValidQuery = (query: string): { valid: boolean; reason?: string } => {
    const trimmed = query.trim();
    
    // Check if empty
    if (!trimmed) {
      return { valid: false, reason: 'Query cannot be empty' };
    }
    
    // Check minimum length (at least 3 characters)
    if (trimmed.length < 3) {
      return { valid: false, reason: 'Query must be at least 3 characters long' };
    }
    
    // Remove all whitespace and check if only special characters remain
    const withoutSpaces = trimmed.replace(/\s+/g, '');
    if (withoutSpaces.length === 0) {
      return { valid: false, reason: 'Query contains only whitespace' };
    }
    
    // Check if query contains only special characters (no letters or numbers)
    const hasLettersOrNumbers = /[a-zA-Z0-9]/.test(trimmed);
    if (!hasLettersOrNumbers) {
      return { valid: false, reason: 'Query must contain letters or numbers' };
    }
    
    // Check if query is only numbers (without meaningful context)
    const onlyNumbers = /^\d+$/.test(withoutSpaces);
    if (onlyNumbers && trimmed.length < 5) {
      return { valid: false, reason: 'Query must contain meaningful text, not just numbers' };
    }
    
    // Check for common useless patterns (repeated characters, keyboard mashing, etc.)
    const repeatedChars = /(.)\1{4,}/.test(trimmed); // Same character repeated 5+ times
    if (repeatedChars) {
      return { valid: false, reason: 'Query contains repeated characters' };
    }
    
    // Check for keyboard mashing patterns (like "asdf", "qwerty", etc.)
    const keyboardPatterns = [
      /^[asdf]+$/i,
      /^[qwerty]+$/i,
      /^[zxcv]+$/i,
      /^[hjkl]+$/i,
      /^[asdfghjkl]+$/i,
      /^[qwertyuiop]+$/i,
      /^[zxcvbnm]+$/i,
    ];
    if (keyboardPatterns.some(pattern => pattern.test(trimmed))) {
      return { valid: false, reason: 'Query appears to be random keyboard input' };
    }
    
    // Check if query has at least one word (sequence of letters) that's meaningful
    const words = trimmed.split(/\s+/).filter(w => /[a-zA-Z]{2,}/.test(w));
    if (words.length === 0) {
      return { valid: false, reason: 'Query must contain at least one meaningful word' };
    }
    
    // Check for very short single-word queries that are likely typos
    if (words.length === 1 && words[0].length < 3) {
      return { valid: false, reason: 'Query is too short to be meaningful' };
    }
    
    // Check for queries that are mostly special characters (more than 50%)
    const specialCharCount = (trimmed.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const totalChars = trimmed.replace(/\s/g, '').length;
    if (totalChars > 0 && specialCharCount / totalChars > 0.5) {
      return { valid: false, reason: 'Query contains too many special characters' };
    }
    
    // Check for common test/placeholder words that shouldn't be queries
    const testWords = ['test', 'testing', 'asdf', 'qwerty', 'sample', 'example', 'demo', 'placeholder'];
    const lowerQuery = trimmed.toLowerCase();
    if (testWords.some(word => lowerQuery === word || lowerQuery.startsWith(word + ' ') || lowerQuery.endsWith(' ' + word))) {
      return { valid: false, reason: 'Query appears to be a test or placeholder' };
    }
    
    return { valid: true };
  };

  const handleAnalyze = async () => {
    const trimmedInput = analysisInput.trim();
    if (!trimmedInput) return;
    
    // Validate query before processing
    const validation = isValidQuery(trimmedInput);
    if (!validation.valid) {
      setInsight(`Invalid query: ${validation.reason}. Please enter a meaningful question about marine data.`);
      setAnalysisSteps([
        'Query validation failed',
        validation.reason || 'Please enter a valid query',
        'Try asking about species, locations, depths, or other marine data'
      ]);
      return;
    }
    
    setIsAnalyzing(true);
    setInsight(null);
    setAnalysisSteps([
      'Analyzing query relevance...',
      'Checking if query is related to marine research...',
      'Validating query context...'
    ]);
    
    try {
      // Check query relevance using Gemini API
      const relevanceCheck = await geminiService.checkQueryRelevance(trimmedInput);
      
      if (!relevanceCheck.isRelevant) {
        setIsAnalyzing(false);
        const reason = relevanceCheck.reason || 'The query does not relate to marine data, oceanography, or marine biology.';
        setNoDataPopupMessage(`Query is not relevant to marine research: ${reason}`);
        setShowNoDataPopup(true);
        setInsight(`Query is not relevant to marine research: ${reason}`);
        setAnalysisSteps([
          'Query relevance check failed',
          relevanceCheck.reason || 'Query is not related to marine research',
          'Please ask questions about marine species, oceanographic data, or marine research'
        ]);
        return;
      }
      
      // Update steps for RAG processing
      setAnalysisSteps([
        'Connecting to RAG system...',
        'Searching relevant occurrences...',
        'Generating scientific answer...'
      ]);
      // Extract filters from activeFilters
      let waterBodyFilter = activeFilters.find(f => f.type === 'waterBody');
      const speciesFilter = activeFilters.find(f => f.type === 'species');
      let depthFilter = activeFilters.find(f => f.type === 'depth');
      
      // Extract water body from natural language query if not set via filters
      // Common water bodies: Arabian Sea, Indian Ocean, Bay of Bengal, Andaman Sea, Laccadive Sea, etc.
      if (!waterBodyFilter) {
        const waterBodyPatterns = [
          /\b(arabian\s+sea)\b/i,
          /\b(indian\s+ocean)\b/i,
          /\b(bay\s+of\s+bengal)\b/i,
          /\b(andaman\s+sea)\b/i,
          /\b(laccadive\s+sea)\b/i,
          /\b(red\s+sea)\b/i,
          /\b(persian\s+gulf)\b/i,
          /\b(mediterranean\s+sea)\b/i,
          /\b(atlantic\s+ocean)\b/i,
          /\b(pacific\s+ocean)\b/i,
        ];
        
        for (const pattern of waterBodyPatterns) {
          const match = analysisInput.match(pattern);
          if (match) {
            const waterBodyName = match[1].replace(/\s+/g, ' '); // Normalize whitespace
            waterBodyFilter = { type: 'waterBody' as const, value: waterBodyName };
            console.error('🔍 Extracted water body from query:', { waterBody: waterBodyName, query: analysisInput });
            break;
          }
        }
      }
      
      // Extract depth range from natural language query if not set via filters
      // Pattern: "300-500 meter", "300 to 500 meters", "between 300 and 500 m", etc.
      if (!depthFilter) {
        const depthPatterns = [
          /(\d+)\s*-\s*(\d+)\s*(?:meter|metre|m)\w*/i,  // "300-500 meters"
          /(\d+)\s+to\s+(\d+)\s*[-]?\s*(?:meter|metre|m)\w*/i,  // "300 to 500 meters" or "350 to 600-meter"
          /(\d+)\s+to\s+(\d+)\s*(?:meter|metre|m)\w*\s+depth\s+range/i,  // "350 to 600-meter depth range"
          /between\s+(\d+)\s+and\s+(\d+)\s*(?:meter|metre|m)\w*/i,  // "between 300 and 500 meters"
          /(\d+)\s*-\s*(\d+)\s*(?:meter|metre|m)\w*\s+depth/i,  // "300-500 meter depths"
          /depth.*?(\d+)\s*-\s*(\d+)\s*(?:meter|metre|m)/i,  // "depth 300-500 meters"
        ];
        
        for (const pattern of depthPatterns) {
          const match = analysisInput.match(pattern);
          if (match) {
            const min = parseFloat(match[1]);
            const max = parseFloat(match[2]);
            if (!isNaN(min) && !isNaN(max) && min < max) {
              depthFilter = { type: 'depth' as const, min, max };
              console.error('🔍 Extracted depth range from query:', { min, max, query: analysisInput });
              break;
            }
          }
        }
      }
      
      // Prepare RAG query options
      const ragOptions: {
        waterBody?: string;
        scientificName?: string;
        minDepth?: number;
        maxDepth?: number;
        topK?: number;
        dataTypes?: DataType[];
      } = {};
      
      if (waterBodyFilter && waterBodyFilter.type === 'waterBody') {
        ragOptions.waterBody = waterBodyFilter.value;
      }
      if (speciesFilter && speciesFilter.type === 'species') {
        ragOptions.scientificName = speciesFilter.value;
      }
      if (depthFilter && depthFilter.type === 'depth') {
        ragOptions.minDepth = depthFilter.min;
        ragOptions.maxDepth = depthFilter.max;
      }
      // Add data types if explicitly selected (empty array = auto-detect)
      if (selectedDataTypes.length > 0) {
        ragOptions.dataTypes = selectedDataTypes;
      }
      // Don't set topK - let API return ALL matching occurrences for research dashboard
      // ragOptions.topK = 10; // REMOVED: Research dashboard needs all results, not limited
      
      // Call RAG API
      setAnalysisSteps([
        'Querying marine data database...',
        'Analyzing relevant records...',
        'Generating scientific insights...'
      ]);
      
      const response = await ragService.query(analysisInput.trim(), ragOptions);
      
      // Check if dashboard summary exists - only save to history if it does
      const hasDashboardSummary = !!(response.dashboard_summary && 
        (response.dashboard_summary.executive_summary || 
         (response.dashboard_summary.key_findings && response.dashboard_summary.key_findings.length > 0)));
      
      // Save query to history only if dashboard summary exists
      if (hasDashboardSummary) {
        try {
          await queryHistoryService.saveQuery(
            analysisInput.trim(),
            ragOptions,
            response
          );
        } catch (error) {
          console.error('Failed to save query to history:', error);
          // Don't block the UI if history save fails
        }
      }
      
      // Update insight with the answer
      setInsight(response.answer);
      
      // Process RAG results and create visualizations
      if (response.relevant_occurrences && response.relevant_occurrences.length > 0) {
        // Convert RAG occurrences to DataPoint format for processing
        const ragDataPoints: DataPoint[] = response.relevant_occurrences
          .filter(occ => occ.decimalLatitude && occ.decimalLongitude)
          .map(occ => ({
            scientificName: occ.scientificName || 'Unknown',
            locality: occ.locality || 'Unknown',
            eventDate: occ.eventDate || '',
            decimalLatitude: occ.decimalLatitude || 0,
            decimalLongitude: occ.decimalLongitude || 0,
            waterBody: occ.waterBody || '',
            samplingProtocol: occ.samplingProtocol || '',
            minimumDepthInMeters: occ.minimumDepthInMeters || 0,
            maximumDepthInMeters: occ.maximumDepthInMeters || 0,
            identifiedBy: occ.identifiedBy || ''
          }));
        
        // Get the most common species from results
        const speciesCounts: { [key: string]: number } = {};
        response.relevant_occurrences.forEach(occ => {
          const name = occ.scientificName || 'Unknown';
          speciesCounts[name] = (speciesCounts[name] || 0) + 1;
        });
        const mostCommonSpecies = Object.entries(speciesCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || response.relevant_occurrences[0]?.scientificName || analysisInput.trim();
        
        // Generate charts from RAG data
        const occurrencesByYear = generateOccurrencesByYear(ragDataPoints);
        const depthHistogram = generateDepthHistogram(ragDataPoints);
        
        // Create comprehensive search result
        // Debug: Log the API response - USE console.error to ensure visibility
        console.error('🌐 GlobeView - RAG API Response:', {
          hasOccurrences: response.relevant_occurrences?.length || 0,
          hasDashboardSummary: !!response.dashboard_summary,
          sourcesCount: response.sources_count,
          dashboardSummaryKeys: response.dashboard_summary ? Object.keys(response.dashboard_summary) : null,
          dashboardSummaryPreview: response.dashboard_summary ? {
            hasExecutiveSummary: !!response.dashboard_summary.executive_summary,
            hasKeyFindings: !!response.dashboard_summary.key_findings,
            keyFindingsCount: response.dashboard_summary.key_findings?.length || 0
          } : null
        });
        console.error('🌐 GlobeView - Full dashboard_summary:', response.dashboard_summary);

        // Calculate depth range from results
        const resultDepths = response.relevant_occurrences
          .flatMap(occ => [occ.minimumDepthInMeters, occ.maximumDepthInMeters])
          .filter(d => d !== undefined && d !== null) as number[];
        
        // Use query filter depth if provided, otherwise use actual min/max from results
        const queryMinDepth = depthFilter && depthFilter.type === 'depth' ? depthFilter.min : undefined;
        const queryMaxDepth = depthFilter && depthFilter.type === 'depth' ? depthFilter.max : undefined;
        
        const searchResult: SearchResultSummary = {
          scientificName: mostCommonSpecies,
          description: response.answer, // Full RAG answer
          locality: response.relevant_occurrences[0]?.locality || 'Multiple locations',
          basisOfRecord: 'Preserved Specimen',
          // If query specified depth range, show that; otherwise show actual range from results
          minDepthInMeters: queryMinDepth !== undefined ? queryMinDepth : (resultDepths.length > 0 ? Math.min(...resultDepths) : null),
          maxDepthInMeters: queryMaxDepth !== undefined ? queryMaxDepth : (resultDepths.length > 0 ? Math.max(...resultDepths) : null),
          coordinates: ragDataPoints.length > 0 ? {
            lat: ragDataPoints[0].decimalLatitude,
            lng: ragDataPoints[0].decimalLongitude
      } : null,
          occurrencesByYear: occurrencesByYear,
          depthHistogram: depthHistogram,
          // Add RAG-specific data
          ragAnswer: response.answer,
          ragOccurrences: response.relevant_occurrences,
          ragSourcesCount: response.sources_count,
          ragQueryTime: response.took_ms,
          // Add Gemini-generated dashboard summary
          dashboardSummary: response.dashboard_summary
        };
        
        // Only show results if we have a dashboard summary (meaningful data)
        if (hasDashboardSummary && onShowSearchResults) {
          onShowSearchResults(searchResult);
        } else {
          // No dashboard summary - show popup and don't navigate to results
          setNoDataPopupMessage('The query did not return sufficient data to generate a dashboard. Please try a different query or adjust your search criteria.');
          setShowNoDataPopup(true);
        }
      } else {
        // No occurrences found - show popup
        setNoDataPopupMessage('No data found for this query. Please try a different query or adjust your search criteria.');
        setShowNoDataPopup(true);
      }
      
      setAnalysisSteps([
        `Found ${response.sources_count} relevant occurrence(s)`,
        `Query processed in ${response.took_ms}ms`,
        'Analysis complete'
      ]);
      
    } catch (error: any) {
      console.error('RAG analysis error:', error);
      setInsight(`Error: ${error.message || 'Failed to analyze query. Please ensure the RAG API is running and accessible.'}`);
      setAnalysisSteps([
        'Error connecting to RAG system',
        'Please check if the API is running',
        'Falling back to local analysis...'
      ]);
      
      // Fallback to basic analysis
      const fallbackInsight = `Based on ${filteredData.length} filtered occurrence(s), your query "${analysisInput.trim()}" relates to marine biodiversity data. For detailed answers, please ensure the RAG API is accessible at https://rag.nikare.in`;
      setInsight(fallbackInsight);
    } finally {
    setIsAnalyzing(false);
    setAnalysisInput('');
    }
    
    // Create transition overlay by cloning the current globe canvas
    try {
      const globeWrapper = document.querySelector('.kadal-ai-main-globe') as HTMLElement | null;
      const globeCanvas = globeWrapper?.querySelector('canvas') as HTMLCanvasElement | null;
      if (globeCanvas) {
        const from = globeCanvas.getBoundingClientRect();
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.left = from.left + 'px';
        overlay.style.top = from.top + 'px';
        overlay.style.width = from.width + 'px';
        overlay.style.height = from.height + 'px';
        overlay.style.borderRadius = '16px';
        overlay.style.overflow = 'hidden';
        overlay.style.zIndex = '9999';
        overlay.style.pointerEvents = 'none';
        const clone = globeCanvas.cloneNode(true) as HTMLCanvasElement;
        overlay.appendChild(clone);
        document.body.appendChild(overlay);
        (window as any).__kadalAiTransition = { overlay };
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] relative overflow-visible selection:bg-[#0F766E]/20 text-[#0F2A3A]">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all ${globeFocused ? 'filter blur-sm pointer-events-none' : ''}`}>
        <div className="px-6 py-3.5 bg-white/90 backdrop-blur-md border-b border-[#D9E2E7] shadow-xs">
          <div className="flex items-center justify-between">
            
            {/* 1. Left Section (Wrapper) */}
            <div className="flex-1 flex justify-start">
              <motion.button
                onClick={() => window.dispatchEvent(new Event('backToProjects'))}
                className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-[#EEF3F5] border border-[#D9E2E7] hover:border-[#0F766E]/40 rounded-xl transition-all duration-150 text-[#0F766E] text-sm font-semibold shadow-xs"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiArrowLeft className="w-4 h-4" />
                <span>Back to Projects</span>
              </motion.button>
            </div>

            {/* 2. Center Content */}
            <div className="text-center">
              <h1 className="text-lg font-bold font-serif tracking-tight text-[#0F2A3A] flex items-center justify-center gap-2">
                <span>{selectedProject?.title ?? 'Arabian Sea Plankton Study'}</span>
              </h1>
              <div className="mt-1.5 flex justify-center">
                <div className="inline-flex p-1 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl shadow-xs">
                  {(['Analyse', 'Visualise', 'Study'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setActiveMode(mode)}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        activeMode === mode
                          ? 'bg-[#0F766E] text-white shadow-xs'
                          : 'text-[#5B7280] hover:text-[#0F2A3A] hover:bg-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Right Section (Wrapper) */}
            <div className="flex-1 flex justify-end items-center space-x-2.5">
              <motion.button
                onClick={() => setShowAutonomousCopilot(true)}
                className="flex items-center space-x-2 px-3.5 py-2 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold border border-[#0F766E] rounded-xl shadow-xs transition-all duration-150 text-xs"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiCpu className="w-4 h-4 text-white" />
                <span>Autonomous Copilot</span>
              </motion.button>
              <motion.button
                onClick={() => {
                  setShowQueryHistory(!showQueryHistory);
                  if (!showQueryHistory) {
                    loadQueryHistory();
                  }
                }}
                className="flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-[#EEF3F5] border border-[#D9E2E7] hover:border-[#0F766E]/40 rounded-xl transition-all duration-150 text-[#0F2A3A] text-xs font-medium shadow-xs"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiClock className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Query History</span>
              </motion.button>
              <motion.a
                href="https://analytics.nikare.in"
                target="_blank" 
                className="flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-[#EEF3F5] border border-[#D9E2E7] hover:border-[#0F766E]/40 rounded-xl transition-all duration-150 text-[#0F2A3A] text-xs font-medium cursor-pointer shadow-xs"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Playground</span>
              </motion.a>
            </div>

          </div>
        </div>
      </header>

      {activeMode === 'Analyse' ? (
      <div className="relative pt-20 h-screen flex">
        {/* Floating left sidebar container */}
        <motion.div 
          className={`w-84 bg-white/95 border border-[#D9E2E7] rounded-2xl shadow-paper m-4 p-5 overflow-y-auto scrollbar-hide z-20 transition-all ${globeFocused ? 'filter blur-md pointer-events-none' : ''}`}
          initial={{ x: -320 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="space-y-6">
            {/* Project blurb */}
            <div className="text-[#5B7280] text-xs leading-relaxed bg-[#EEF3F5] p-3 rounded-xl border border-[#D9E2E7]">
              {selectedProject?.description ?? 'Select a project to view details.'}
            </div>

            {/* Active Data Layer */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-2 flex items-center gap-1.5">
                <FiLayers className="w-3.5 h-3.5" />
                <span>Active Data Layer</span>
              </h3>
              <select
                value={dataLayer}
                onChange={(e) => setDataLayer(e.target.value as typeof dataLayer)}
                className="w-full px-3.5 py-2.5 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] text-xs focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
              >
                <option>Species Occurrences</option>
                <option>Sea Surface Temperature (SST)</option>
                <option>Salinity</option>
                <option>Chlorophyll Concentration</option>
                <option>eDNA Detections</option>
              </select>
              {dataLayer !== 'Species Occurrences' && (
                <p className="mt-1.5 text-[11px] text-[#5B7280]">Placeholder layer for future sensor integration.</p>
              )}
            </div>

            {/* Ocean Depth Layer Filter Widget */}
            <div>
              <OceanDepthFilter
                dataPoints={dataPoints}
                selectedZone={selectedDepthZone}
                onSelectZone={(zone, minD, maxD) => {
                  setSelectedDepthZone(zone);
                }}
                customMinDepth={depthMin}
                customMaxDepth={depthMax}
                onCustomDepthChange={(minD, maxD) => {
                  setDepthMin(minD);
                  setDepthMax(maxD);
                  setActiveFilters(prev => {
                    const withoutDepth = prev.filter(f => f.type !== 'depth');
                    return [...withoutDepth, { type: 'depth', min: minD, max: maxD }];
                  });
                }}
              />
            </div>

            {/* Dynamic Filters */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">Filter Query Engine</h4>
                <motion.button
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#0F766E]/10 border border-[#0F766E]/30 rounded-lg text-[#0F766E] hover:bg-[#0F766E]/20 transition-all text-xs font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (newSpecies) {
                      setActiveFilters(prev => [...prev, { type: 'species', value: newSpecies }]);
                      setNewSpecies('');
                      return;
                    }
                    if (newWaterBody) {
                      setActiveFilters(prev => [...prev, { type: 'waterBody', value: newWaterBody }]);
                      setNewWaterBody('');
                      return;
                    }
                    if (newLocality) {
                      setActiveFilters(prev => [...prev, { type: 'locality', value: newLocality }]);
                      setNewLocality('');
                      return;
                    }
                    if (methods.length) {
                      setActiveFilters(prev => [...prev, { type: 'method', values: methods }]);
                      setMethods([]);
                      return;
                    }
                    if (dateStart || dateEnd) {
                      setActiveFilters(prev => [...prev, { type: 'date', start: dateStart, end: dateEnd }]);
                      setDateStart('');
                      setDateEnd('');
                      return;
                    }
                    setActiveFilters(prev => [...prev, { type: 'depth', min: depthMin, max: depthMax }]);
                  }}
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  <span>Apply Filter</span>
                </motion.button>
              </div>

              <div className="space-y-2.5 bg-[#EEF3F5] p-3 rounded-xl border border-[#D9E2E7]">
                <div>
                  <label className="block text-[11px] text-[#5B7280] mb-1 font-medium">Species Name</label>
                  <input list="species-list" value={newSpecies} onChange={(e) => setNewSpecies(e.target.value)} placeholder="e.g., Harpiliopsis depressa" className="w-full px-3 py-2 bg-white border border-[#D9E2E7] rounded-lg text-[#0F2A3A] text-xs focus:border-[#0F766E] focus:outline-none placeholder-[#5B7280]" />
                  <datalist id="species-list">
                    {uniqueSpecies.slice(0, 100).map(name => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[11px] text-[#5B7280] mb-1 font-medium">Water Body</label>
                  <select value={newWaterBody} onChange={(e) => setNewWaterBody(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#D9E2E7] rounded-lg text-[#0F2A3A] text-xs focus:border-[#0F766E] focus:outline-none">
                    <option value="">Select water body</option>
                    {uniqueWaterBodies.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-[#5B7280] mb-1 font-medium">Location (Locality)</label>
                  <select value={newLocality} onChange={(e) => setNewLocality(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#D9E2E7] rounded-lg text-[#0F2A3A] text-xs focus:border-[#0F766E] focus:outline-none">
                    <option value="">Select locality</option>
                    {uniqueLocalities.slice(0, 200).map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-[#5B7280] mb-1 font-medium">Depth Range (m)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={depthMin} onChange={(e) => setDepthMin(Number(e.target.value))} placeholder="Min" className="px-3 py-2 bg-white border border-[#D9E2E7] rounded-lg text-[#0F2A3A] text-xs font-mono focus:border-[#0F766E] focus:outline-none" />
                    <input type="number" value={depthMax} onChange={(e) => setDepthMax(Number(e.target.value))} placeholder="Max" className="px-3 py-2 bg-white border border-[#D9E2E7] rounded-lg text-[#0F2A3A] text-xs font-mono focus:border-[#0F766E] focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-[#5B7280] mb-1 font-medium">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="px-2 py-1.5 bg-white border border-[#D9E2E7] rounded-lg text-[#0F2A3A] text-xs focus:border-[#0F766E] focus:outline-none" />
                    <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="px-2 py-1.5 bg-white border border-[#D9E2E7] rounded-lg text-[#0F2A3A] text-xs focus:border-[#0F766E] focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-[#5B7280] mb-1 font-medium">Collection Method</label>
                  <select multiple value={methods} onChange={(e) => setMethods(Array.from(e.target.selectedOptions).map(o => o.value))} className="w-full px-3 py-2 bg-white border border-[#D9E2E7] rounded-lg text-[#0F2A3A] text-xs focus:border-[#0F766E] focus:outline-none min-h-[70px]">
                    {uniqueMethods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {activeFilters.map((f, idx) => (
                  <span key={`${f.type}-${idx}`} className="inline-flex items-center space-x-1.5 px-2 py-1 bg-[#0F766E]/10 border border-[#0F766E]/20 rounded-lg text-xs text-[#0F766E] font-mono">
                    <span>
                      {f.type === 'species' && `Species: ${f.value}`}
                      {f.type === 'waterBody' && `Water: ${f.value}`}
                      {f.type === 'locality' && `Locality: ${f.value}`}
                      {f.type === 'depth' && `Depth: ${f.min}-${f.max}m`}
                      {f.type === 'date' && `Date: ${f.start || '...'} -> ${f.end || '...'}`}
                      {f.type === 'method' && `Method: ${f.values.join(', ')}`}
                    </span>
                    <button onClick={() => setActiveFilters(prev => prev.filter((_, i) => i !== idx))} className="text-[#0F766E]/70 hover:text-[#0F2A3A]">
                      <FiX className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* AI-Powered Analysis */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-2.5 flex items-center">
                <FiTrendingUp className="w-3.5 h-3.5 mr-1.5" />
                AI Marine Intelligence
              </h4>
              <div className="space-y-3 bg-[#EEF3F5] p-3 rounded-xl border border-[#D9E2E7]">
                {/* Data Type Selector (Optional) */}
                <div>
                  <label className="block text-[11px] text-[#5B7280] mb-1.5 font-medium">Sensor Datatypes (Auto-detect if none)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(['OCCURRENCE', 'CTD', 'AWS', 'ADCP'] as DataType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setSelectedDataTypes(prev => 
                            prev.includes(type) 
                              ? prev.filter(t => t !== type)
                              : [...prev, type]
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                          selectedDataTypes.includes(type)
                            ? 'bg-[#0F766E] text-white font-bold shadow-xs'
                            : 'bg-white border border-[#D9E2E7] text-[#5B7280] hover:text-[#0F2A3A]'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                    {selectedDataTypes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedDataTypes([])}
                        className="px-2 py-1 rounded-lg text-[11px] bg-white border border-[#D9E2E7] text-[#5B7280] hover:text-[#0F2A3A]"
                        title="Clear selection (auto-detect)"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  value={analysisInput}
                  onChange={(e) => setAnalysisInput(e.target.value)}
                  placeholder="Ask a scientific question... (e.g., 'What species are found in Arabian Sea?', 'Show CTD profiles')"
                  className="w-full px-3 py-2 bg-white border border-[#D9E2E7] rounded-xl text-[#0F2A3A] text-xs resize-none focus:border-[#0F766E] focus:outline-none placeholder-[#5B7280]"
                  rows={3}
                />
                <motion.button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !analysisInput.trim()}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs shadow-xs"
                  whileHover={{ scale: isAnalyzing ? 1 : 1.02 }}
                  whileTap={{ scale: isAnalyzing ? 1 : 0.98 }}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      <span>Analyzing Mission...</span>
                    </>
                  ) : (
                    <>
                      <FiSearch className="w-3.5 h-3.5" />
                      <span>Execute Query</span>
                    </>
                  )}
                </motion.button>
                {/* Steps and Insight */}
                {analysisSteps.length > 0 && (
                  <div className="text-[11px] text-[#0F766E] font-mono space-y-0.5 bg-white p-2 rounded-lg border border-[#D9E2E7]">
                    {analysisSteps.map((s, i) => (<div key={i}>› {s}</div>))}
                  </div>
                )}
                {insight && (
                  <div className="p-3 bg-[#0F766E]/10 border border-[#0F766E]/20 rounded-xl text-xs text-[#0F2A3A]">
                    {insight}
                  </div>
                )}
              </div>
            </div>

            {/* Live Feed */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-2.5 flex items-center">
                <FiActivity className="w-3.5 h-3.5 mr-1.5" />
                Live Telemetry Feed
              </h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {liveFeedData.map((item, index) => (
                  <motion.div
                    key={index}
                    className="p-2 bg-[#EEF3F5] border border-[#D9E2E7] rounded-lg text-[11px] text-[#5B7280] font-mono"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    {item}
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </motion.div>

        {/* Center area spacing */}
        <div className="flex-1 relative z-0 pointer-events-none">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center bg-white/90 p-8 rounded-2xl border border-[#D9E2E7] shadow-paper">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0F766E] mx-auto mb-3"></div>
                <p className="text-sm font-semibold text-[#0F2A3A]">Streaming Oceanographic Records...</p>
                <p className="text-xs text-[#5B7280] mt-1 font-mono">Connecting to Marine Mesh</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom-centered search bar; separate layer so globe stays interactive */}
        {!isLoading && (
          <div className={`pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center z-20 transition-all gap-2.5 ${globeFocused ? 'filter blur-md' : ''}`}>
            {/* Data Type Selector */}
            <div className="pointer-events-auto flex items-center gap-2 bg-white/95 border border-[#D9E2E7] rounded-xl px-3.5 py-1.5 shadow-paper">
              <span className="text-[11px] text-[#5B7280] font-medium mr-1">Data Types:</span>
              {(['OCCURRENCE', 'CTD', 'AWS', 'ADCP'] as DataType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSelectedDataTypes(prev => 
                      prev.includes(type) 
                        ? prev.filter(t => t !== type)
                        : [...prev, type]
                    );
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                    selectedDataTypes.includes(type)
                      ? 'bg-[#0F766E] text-white font-bold shadow-xs'
                      : 'bg-[#EEF3F5] border border-[#D9E2E7] text-[#5B7280] hover:text-[#0F2A3A]'
                  }`}
                >
                  {type}
                </button>
              ))}
              {selectedDataTypes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedDataTypes([])}
                  className="px-2 py-0.5 rounded-lg text-[11px] bg-[#EEF3F5] border border-[#D9E2E7] text-[#5B7280] hover:text-[#0F2A3A]"
                  title="Clear selection (auto-detect)"
                >
                  Clear
                </button>
              )}
              {selectedDataTypes.length === 0 && (
                <span className="text-[11px] text-[#5B7280] font-mono italic">(Auto-detect)</span>
              )}
            </div>

            {/* Search Input Form */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }}
              className="pointer-events-auto w-[min(760px,94%)] bg-white/95 border border-[#D9E2E7] rounded-2xl shadow-paper-elevated p-2 pl-4 flex items-center gap-3"
            >
              <input
                type="text"
                placeholder="Ask the Ocean... (e.g., 'What species in Arabian Sea?', 'Show CTD profiles', 'Current speeds in Indian Ocean')"
                className="flex-1 bg-transparent outline-none text-[#0F2A3A] placeholder-[#5B7280] text-xs tracking-wide disabled:opacity-50"
                value={analysisInput}
                onChange={(e) => setAnalysisInput(e.target.value)}
                disabled={isAnalyzing}
              />
              <button
                type="submit"
                disabled={isAnalyzing || !analysisInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2 text-xs shadow-xs"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>Analyze</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Right-side dataset info cards */}
        {!isLoading && (
          <aside className={`pointer-events-auto absolute right-4 top-24 z-30 flex flex-col gap-3 w-[290px] max-h-[72vh] overflow-y-auto scrollbar-hide transition-all ${globeFocused ? 'filter blur-md pointer-events-none' : ''}`}>
            {/* Helper to compute simple metrics inline */}
            {(() => {
              const total = filteredData.length;
              const uniqueSpeciesCount = new Set(filteredData.map(d => d.scientificName)).size;
              const uniqueWaterBodiesCount = new Set(filteredData.map(d => d.waterBody).filter(Boolean)).size;
              const dates = filteredData.map(d => new Date(d.eventDate).getTime()).filter(n => !isNaN(n));
              const minDate = dates.length ? new Date(Math.min(...dates)).toLocaleDateString() : 'N/A';
              const maxDate = dates.length ? new Date(Math.max(...dates)).toLocaleDateString() : 'N/A';
              const depths = filteredData.map(d => [d.minimumDepthInMeters, d.maximumDepthInMeters]).flat().filter(n => typeof n === 'number' && !isNaN(n));
              const minDepth = depths.length ? Math.min(...depths) : null;
              const maxDepth = depths.length ? Math.max(...depths) : null;

              return (
                <>
                  <div className="bg-white/95 border border-[#D9E2E7] rounded-2xl p-4 shadow-paper">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#5B7280]">Total Occurrences</div>
                    <div className="text-2xl font-bold tracking-tight text-[#0F766E] font-mono num-tabular mt-0.5">{total}</div>
                    <div className="mt-2.5 h-20">
                      <SpeciesDistributionChart data={filteredData} />
                    </div>
                  </div>
                  <div className="bg-white/95 border border-[#D9E2E7] rounded-2xl p-4 shadow-paper">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#5B7280]">Unique Species</div>
                    <div className="text-2xl font-bold tracking-tight text-[#0369A1] font-mono num-tabular mt-0.5">{uniqueSpeciesCount}</div>
                    <div className="mt-2.5 h-20">
                      <TopSpeciesChart data={filteredData} />
                    </div>
                  </div>
                  <div className="bg-white/95 border border-[#D9E2E7] rounded-2xl p-4 shadow-paper">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#5B7280]">Water Bodies</div>
                    <div className="text-2xl font-bold tracking-tight text-[#D97706] font-mono num-tabular mt-0.5">{uniqueWaterBodiesCount}</div>
                    <div className="mt-2.5 h-20">
                      <WaterBodyDistributionChart data={filteredData} />
                    </div>
                  </div>
                  <div className="bg-white/95 border border-[#D9E2E7] rounded-2xl p-4 shadow-paper">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#5B7280]">Temporal Coverage</div>
                    <div className="text-xs text-[#0F2A3A] font-mono mt-0.5">{minDate} — {maxDate}</div>
                    <div className="mt-2.5 h-20">
                      <TemporalDistributionChart data={filteredData} />
                    </div>
                  </div>
                  <div className="bg-white/95 border border-[#D9E2E7] rounded-2xl p-4 shadow-paper">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#5B7280]">Depth Stratification</div>
                    <div className="text-xs text-[#0F2A3A] font-mono mt-0.5">{minDepth !== null && maxDepth !== null ? `${minDepth}m — ${maxDepth}m` : 'N/A'}</div>
                    <div className="mt-2.5 h-20">
                      <DepthDistributionChart data={filteredData} />
                    </div>
                  </div>
                </>
              );
            })()}
          </aside>
        )}

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: `${tooltipPosition.x + 10}px`,
              top: `${tooltipPosition.y - 10}px`,
              transform: 'translateX(-50%) translateY(-100%)'
            }}
          >
            <div className="bg-white/95 border border-[#D9E2E7] rounded-xl p-3.5 shadow-paper-elevated min-w-[260px] text-[#0F2A3A]">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-[#D9E2E7]">
                  <div className="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse"></div>
                  <h4 className="text-xs font-bold text-[#0F2A3A] tracking-wide uppercase">Location Telemetry</h4>
                </div>
                
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#5B7280]">Species:</span>
                    <span className="text-[#0F766E] font-bold italic">{hoveredPoint.scientificName || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5B7280]">Locality:</span>
                    <span className="text-[#0F2A3A] truncate max-w-[140px]">{hoveredPoint.locality || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5B7280]">Coordinates:</span>
                    <span className="text-[#0F2A3A]">{hoveredPoint.decimalLatitude?.toFixed(3)}°, {hoveredPoint.decimalLongitude?.toFixed(3)}°</span>
                  </div>
                  {hoveredPoint.waterBody && (
                    <div className="flex justify-between">
                      <span className="text-[#5B7280]">Water Body:</span>
                      <span className="text-[#0F2A3A]">{hoveredPoint.waterBody}</span>
                    </div>
                  )}
                  {hoveredPoint.eventDate && (
                    <div className="flex justify-between">
                      <span className="text-[#5B7280]">Date:</span>
                      <span className="text-[#0F2A3A]">{new Date(hoveredPoint.eventDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {(hoveredPoint.minimumDepthInMeters || hoveredPoint.maximumDepthInMeters) && (
                    <div className="flex justify-between">
                      <span className="text-[#5B7280]">Depth:</span>
                      <span className="text-[#0F766E] font-bold">
                        {hoveredPoint.minimumDepthInMeters || '0'}m - {hoveredPoint.maximumDepthInMeters || '0'}m
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      ) : activeMode === 'Visualise' ? (
        <VisualiseView allData={dataPoints} />
      ) : (
        <StudyView selectedProject={selectedProject} />
      )}

      {/* No Data Popup */}
      {showNoDataPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0F2A3A]/30 backdrop-blur-sm"
          onClick={() => {
            setShowNoDataPopup(false);
            setNoDataPopupMessage('');
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#D9E2E7] rounded-2xl p-6 max-w-md w-full mx-4 shadow-paper-elevated text-[#0F2A3A]"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-[#D97706]/10 border border-[#D97706]/20 flex items-center justify-center text-[#D97706]">
                  <FiDatabase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-serif text-[#0F2A3A]">No Data Found</h3>
                  <p className="text-sm text-[#5B7280]">Unable to generate dashboard</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowNoDataPopup(false);
                  setNoDataPopupMessage('');
                }}
                className="p-2 text-[#5B7280] hover:text-[#0F2A3A] hover:bg-[#EEF3F5] rounded-xl transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-[#5B7280] text-sm leading-relaxed">
                {noDataPopupMessage || 'The query did not return sufficient data to generate a dashboard. Please try a different query or adjust your search criteria.'}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowNoDataPopup(false);
                  setNoDataPopupMessage('');
                }}
                className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-semibold rounded-xl transition-colors shadow-xs"
              >
                OK
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Query History Panel */}
      {showQueryHistory && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white border-l border-[#D9E2E7] z-[100] shadow-paper-elevated overflow-y-auto"
        >
          <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-[#D9E2E7] px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#0F766E]/10 border border-[#0F766E]/20 flex items-center justify-center text-[#0F766E]">
                <FiClock className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-serif text-[#0F2A3A] tracking-wide">Query History</h2>
            </div>
            <button
              onClick={() => setShowQueryHistory(false)}
              className="p-2 text-[#5B7280] hover:text-[#0F2A3A] hover:bg-[#EEF3F5] rounded-xl transition-colors border border-transparent"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {historyError && (
              <div className="mb-4 p-4 bg-[#B91C1C]/10 border border-[#B91C1C]/20 rounded-xl text-[#B91C1C] text-sm flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#B91C1C] animate-pulse" />
                <span>{historyError}</span>
              </div>
            )}

            {isLoadingHistory ? (
              <div className="py-16 text-center text-[#5B7280]">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#0F766E] border-t-transparent mb-4"></div>
                <p className="text-sm font-medium">Retrieving mission telemetry history...</p>
              </div>
            ) : queryHistoryItems.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#EEF3F5] border border-[#D9E2E7] flex items-center justify-center mx-auto mb-4 text-[#5B7280]">
                  <FiClock className="w-8 h-8" />
                </div>
                <p className="text-[#0F2A3A] text-base font-semibold mb-1">No query history yet</p>
                <p className="text-[#5B7280] text-xs">
                  Your RAG oceanographic queries will be archived here automatically
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {queryHistoryItems.map((query, index) => {
                  const filterSummary = getFilterSummary(query.query_options);
                  return (
                    <motion.div
                      key={query.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.04 }}
                      className="bg-white border border-[#D9E2E7] rounded-2xl p-5 hover:border-[#0F766E]/40 hover:shadow-paper transition-all duration-150"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Query Text */}
                          <div className="flex items-start space-x-3 mb-2.5">
                            <FiSearch className="w-4 h-4 text-[#0F766E] mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-[#0F2A3A] font-semibold text-sm leading-relaxed break-words">
                                {query.query}
                              </p>
                              {filterSummary && (
                                <p className="text-xs text-[#0F766E] mt-1">
                                  {filterSummary}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Answer Preview */}
                          <div className="ml-7 mb-3">
                            <p className="text-xs text-[#5B7280] line-clamp-2 leading-relaxed bg-[#EEF3F5] p-2.5 rounded-xl border border-[#D9E2E7]">
                              {query.answer_preview}
                            </p>
                          </div>

                          {/* Metadata */}
                          <div className="ml-7 flex items-center space-x-4 text-[11px] text-[#5B7280] font-mono num-tabular">
                            <span className="flex items-center space-x-1.5">
                              <FiClock className="w-3 h-3 text-[#0F766E]" />
                              <span>{formatHistoryDate(query.created_at)}</span>
                            </span>
                            <span className="flex items-center space-x-1.5">
                              <FiDatabase className="w-3 h-3 text-[#0F766E]" />
                              <span>{query.sources_count} sources</span>
                            </span>
                            {query.has_dashboard_summary && (
                              <span className="px-2 py-0.5 bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/20 rounded text-[10px] font-sans font-semibold">
                                Dashboard Summary
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <button
                            onClick={() => handleRestoreQuery(query.id)}
                            className="px-3 py-1.5 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-semibold rounded-lg shadow-xs transition-all duration-150 flex items-center space-x-1.5 text-xs"
                          >
                            <FiSearch className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleDeleteHistoryQuery(query.id)}
                            disabled={deletingHistoryId === query.id}
                            className="p-1.5 text-[#5B7280] hover:text-[#B91C1C] hover:bg-[#B91C1C]/10 rounded-lg transition-colors duration-150 disabled:opacity-50"
                            title="Delete query"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Floating Notes Button */}
      {selectedProject && (
        <motion.div
          className="fixed bottom-6 right-6 z-50 group"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={() => {
              setShowNotesPanel(!showNotesPanel);
              if (!showNotesPanel) {
                loadNotesPanel();
              }
            }}
            className="relative flex items-center"
          >
            {/* Pill shape that appears on hover */}
            <div className="absolute right-full mr-3 flex items-center space-x-2 px-3.5 py-1.5 bg-[#0F766E] text-white font-semibold rounded-full shadow-paper whitespace-nowrap opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-150 pointer-events-none text-xs">
              <FiPenTool className="w-3.5 h-3.5" />
              <span>Project Notes</span>
            </div>
            {/* Circular button */}
            <motion.div
              className="w-12 h-12 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center shadow-paper hover:bg-[#0B5F58] transition-all duration-150"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiPenTool className="w-5 h-5" />
            </motion.div>
          </button>
        </motion.div>
      )}

      {/* Notes Panel */}
      {showNotesPanel && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white border-l border-[#D9E2E7] z-[100] shadow-paper-elevated overflow-y-auto"
        >
          <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-[#D9E2E7] px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#0F766E]/10 border border-[#0F766E]/20 flex items-center justify-center text-[#0F766E]">
                <FiPenTool className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-serif text-[#0F2A3A] tracking-wide">Project Notes</h2>
            </div>
            <button
              onClick={() => setShowNotesPanel(false)}
              className="p-2 text-[#5B7280] hover:text-[#0F2A3A] hover:bg-[#EEF3F5] rounded-xl transition-colors border border-transparent"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {!selectedProject ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#EEF3F5] border border-[#D9E2E7] flex items-center justify-center mx-auto mb-4 text-[#5B7280]">
                  <FiFileText className="w-8 h-8" />
                </div>
                <p className="text-[#0F2A3A] text-base font-semibold mb-1">No project selected</p>
                <p className="text-[#5B7280] text-xs">
                  Please select an active project to record and manage research logs
                </p>
              </div>
            ) : (
              <>
                {notesError && (
                  <div className="mb-4 p-4 bg-[#B91C1C]/10 border border-[#B91C1C]/20 rounded-xl text-[#B91C1C] text-sm flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#B91C1C] animate-pulse" />
                    <span>{notesError}</span>
                  </div>
                )}

                {/* Create/Edit Note Form */}
                {(isCreatingPanelNote || selectedPanelNote) ? (
                  <div className="mb-6 bg-white border border-[#D9E2E7] rounded-2xl p-5 shadow-paper">
                    <div className="mb-4">
                      <input
                        type="text"
                        value={panelNoteTitle}
                        onChange={(e) => setPanelNoteTitle(e.target.value)}
                        placeholder="Note title..."
                        className="w-full px-4 py-2.5 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] placeholder-[#5B7280] focus:border-[#0F766E] focus:outline-none mb-3 text-sm font-medium"
                      />
                      <textarea
                        value={panelNoteContent}
                        onChange={(e) => setPanelNoteContent(e.target.value)}
                        placeholder="Write your observation notes here..."
                        className="w-full h-[320px] px-4 py-3 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] placeholder-[#5B7280] focus:border-[#0F766E] focus:outline-none resize-none text-sm leading-relaxed"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setIsCreatingPanelNote(false);
                          setSelectedPanelNote(null);
                          setPanelNoteTitle('');
                          setPanelNoteContent('');
                          setNotesError(null);
                        }}
                        disabled={savingPanelNote}
                        className="px-4 py-2 border border-[#D9E2E7] text-[#5B7280] rounded-xl hover:bg-[#EEF3F5] transition-colors disabled:opacity-50 text-xs font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePanelSaveNote}
                        disabled={savingPanelNote || !panelNoteTitle.trim() || !panelNoteContent.trim()}
                        className="px-4 py-2 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-semibold rounded-xl shadow-xs transition-all duration-150 flex items-center space-x-1.5 disabled:opacity-50 text-xs"
                      >
                        <FiSave className="w-3.5 h-3.5" />
                        <span>{savingPanelNote ? 'Saving...' : 'Save Note'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <button
                      onClick={handlePanelCreateNote}
                      className="w-full px-4 py-3 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-semibold rounded-xl shadow-xs transition-all duration-150 flex items-center justify-center space-x-2 text-sm"
                    >
                      <FiPlus className="w-4 h-4" />
                      <span>Create New Note</span>
                    </button>
                  </div>
                )}

                {/* Notes List */}
                {isLoadingNotes ? (
                  <div className="py-16 text-center text-[#5B7280]">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#0F766E] border-t-transparent mb-4"></div>
                    <p className="text-sm">Loading project notes...</p>
                  </div>
                ) : notesPanelNotes.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#EEF3F5] border border-[#D9E2E7] flex items-center justify-center mx-auto mb-4 text-[#5B7280]">
                      <FiFileText className="w-8 h-8" />
                    </div>
                    <p className="text-[#0F2A3A] text-base font-semibold mb-1">No notes yet</p>
                    <p className="text-[#5B7280] text-xs">
                      Create your first research note for this project
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notesPanelNotes.map((note, index) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: index * 0.04 }}
                        className="bg-white border border-[#D9E2E7] rounded-2xl p-5 hover:border-[#0F766E]/40 hover:shadow-paper transition-all duration-150"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[#0F2A3A] font-semibold text-sm mb-1.5 break-words">
                              {note.title}
                            </h4>
                            <p className="text-xs text-[#5B7280] line-clamp-3 mb-2.5 leading-relaxed bg-[#EEF3F5] p-2.5 rounded-xl border border-[#D9E2E7]">
                              {note.content}
                            </p>
                            <p className="text-[11px] text-[#5B7280] font-mono num-tabular">
                              {formatNotesDate(note.updated_at)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1.5 flex-shrink-0">
                            <button
                              onClick={() => handlePanelEditNote(note)}
                              className="px-2.5 py-1.5 bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E] font-semibold rounded-lg hover:bg-[#0F766E] hover:text-white transition-all duration-150 flex items-center space-x-1 text-xs"
                            >
                              <FiEdit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handlePanelDeleteNote(note.id)}
                              className="p-1.5 text-[#5B7280] hover:text-[#B91C1C] hover:bg-[#B91C1C]/10 rounded-lg transition-colors duration-150"
                              title="Delete note"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Autonomous Research Copilot Modal */}
      <AutonomousCopilotModal
        isOpen={showAutonomousCopilot}
        onClose={() => setShowAutonomousCopilot(false)}
        selectedProjectId={selectedProject?.id || null}
        onShowFullAnalytics={(res) => {
          if (onShowSearchResults) {
            onShowSearchResults(res);
          }
        }}
        onFocusGlobeCoordinates={(coords) => {
          console.log('Focusing globe coordinates:', coords);
        }}
      />
    </div>
  );
};

type XYPoint = { x: number | string; y: number };

type VisualiseViewProps = {
  allData: DataPoint[];
};

type MigrationPoint = {
  year: number;
  month: number;
  latitude: number;
  longitude: number;
};

type MigrationResponse = {
  species: string;
  months_requested: number;
  sequence_length_used: number;
  points: MigrationPoint[];
};

function VisualiseView({ allData }: VisualiseViewProps) {
  const [activeView, setActiveView] = useState<'Migration Pattern' | 'VisualKadal'>('Migration Pattern');
  
  // Migration Pattern state
  const [speciesName, setSpeciesName] = useState<string>('');
  const [months, setMonths] = useState<number>(6);
  const [migrationData, setMigrationData] = useState<MigrationResponse | null>(null);
  const [isLoadingMigration, setIsLoadingMigration] = useState<boolean>(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Available species for migration pattern prediction
  const availableSpecies = ['mackerel', 'sardinella', 'scomber', 'skipjack', 'tuna'];
  
  // Handle globe hover events for migration path
  useEffect(() => {
    const handleGlobeHover = (event: CustomEvent) => {
      if (activeView === 'Migration Pattern') {
        setHoveredPoint(event.detail.dataPoint);
        setTooltipPosition(event.detail.position);
      }
    };

    const handleGlobeLeave = () => {
      if (activeView === 'Migration Pattern') {
        setHoveredPoint(null);
      }
    };

    window.addEventListener('globe-point-hover', handleGlobeHover as EventListener);
    window.addEventListener('globe-point-leave', handleGlobeLeave);

    return () => {
      window.removeEventListener('globe-point-hover', handleGlobeHover as EventListener);
      window.removeEventListener('globe-point-leave', handleGlobeLeave);
    };
  }, [activeView]);

  // Convert migration points to DataPoint format for globe display
  // Points are already sorted by month/year from the API response
  const migrationDataPoints = useMemo(() => {
    if (!migrationData?.points) return [];
    // Ensure points are sorted by year and month for proper path rendering
    const sortedPoints = [...migrationData.points].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    return sortedPoints.map((point, idx) => ({
      scientificName: migrationData.species,
      decimalLatitude: point.latitude,
      decimalLongitude: point.longitude,
      eventDate: `${point.year}-${String(point.month).padStart(2, '0')}-01`,
      waterBody: 'Migration Path',
      locality: `Month ${point.month}/${point.year}`,
      minimumDepthInMeters: 0,
      maximumDepthInMeters: 0,
      samplingProtocol: 'Migration Prediction',
      identifiedBy: 'Migration Pattern API',
    } as DataPoint));
  }, [migrationData]);

  const fetchMigrationPattern = async () => {
    if (!speciesName.trim()) {
      setMigrationError('Please enter a species name');
      return;
    }
    if (months < 1 || months > 24) {
      setMigrationError('Months must be between 1 and 24');
      return;
    }

    setIsLoadingMigration(true);
    setMigrationError(null);
    
    try {
      const response = await fetch(
        `https://chinmay0805-fish-migration-pattern.hf.space/predict-migration?species=${encodeURIComponent(speciesName)}&months=${months}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data: MigrationResponse = await response.json();
      setMigrationData(data);
    } catch (error: any) {
      setMigrationError(error.message || 'Failed to fetch migration pattern');
      setMigrationData(null);
    } finally {
      setIsLoadingMigration(false);
    }
  };

  return (
    <div className="pt-20 min-h-screen relative flex bg-[#F7F9FA]">
      {/* Background */}
      <Suspense fallback={null}>
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <ReactGlobeComponent dataPoints={[]} onDataPointClick={() => {}} onCameraDistanceChange={undefined} showStarsOnly />
        </div>
      </Suspense>
      
      {/* Sidebar */}
      <div className="relative z-10 w-80 bg-white border-r border-[#D9E2E7] p-6 overflow-y-auto shadow-xs">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#0F766E]/10 border border-[#0F766E]/20 flex items-center justify-center text-[#0F766E]">
            <FiActivity className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold font-serif text-[#0F2A3A] tracking-wide">Visualise</h2>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={() => setActiveView('Migration Pattern')}
            className={`w-full px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all border ${
              activeView === 'Migration Pattern'
                ? 'bg-[#0F766E]/10 border-[#0F766E] text-[#0F766E] shadow-xs'
                : 'bg-[#EEF3F5] border-[#D9E2E7] text-[#5B7280] hover:bg-white hover:text-[#0F2A3A]'
            }`}
          >
            Migration Pattern
          </button>
          
          <button
            onClick={() => {
              window.location.href = 'https://Kadal AI-visual-globe1.netlify.app/#current/ocean/surface/currents/orthographic';
            }}
            className="w-full px-4 py-3 rounded-xl text-left text-sm font-medium transition-all bg-[#EEF3F5] border border-[#D9E2E7] text-[#5B7280] hover:bg-white hover:text-[#0F2A3A]"
          >
            VisualKadal (External)
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 p-8 overflow-y-auto">
        {activeView === 'Migration Pattern' ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-[#D9E2E7] rounded-2xl p-6 shadow-paper">
              <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-[#D9E2E7]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0F766E] animate-pulse" />
                <h3 className="text-lg font-bold font-serif text-[#0F2A3A] tracking-wide">Migration Pattern Prediction</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-[#5B7280] uppercase tracking-wider mb-2">Species Name</label>
                  <input
                    type="text"
                    value={speciesName}
                    onChange={(e) => setSpeciesName(e.target.value)}
                    placeholder="e.g., mackerel"
                    list="species-list"
                    className="w-full px-4 py-2.5 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] text-sm focus:border-[#0F766E] focus:outline-none placeholder-[#5B7280]"
                  />
                  <datalist id="species-list">
                    {availableSpecies.map((species) => (
                      <option key={species} value={species} />
                    ))}
                  </datalist>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-[#5B7280] uppercase tracking-wider mb-2">Number of Future Months to Predict (1-24)</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={months}
                    onChange={(e) => setMonths(Math.max(1, Math.min(24, parseInt(e.target.value) || 6)))}
                    className="w-full px-4 py-2.5 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] text-sm font-mono num-tabular focus:border-[#0F766E] focus:outline-none"
                  />
                </div>
                
                <button
                  onClick={fetchMigrationPattern}
                  disabled={isLoadingMigration || !speciesName.trim()}
                  className="w-full px-6 py-3 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold rounded-xl transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
                >
                  {isLoadingMigration ? 'Analyzing Trajectories...' : 'Predict Migration Pattern'}
                </button>
              </div>

              {migrationError && (
                <div className="mb-4 p-4 bg-[#B91C1C]/10 border border-[#B91C1C]/20 rounded-xl text-[#B91C1C] text-sm flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#B91C1C] animate-pulse" />
                  <span>{migrationError}</span>
                </div>
              )}

              {migrationData && (
                <div className="mt-6 space-y-5">
                  <div className="bg-[#EEF3F5] p-5 rounded-2xl border border-[#D9E2E7]">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-white rounded-xl border border-[#D9E2E7]">
                        <span className="text-[#5B7280] text-xs block mb-1">Species</span>
                        <p className="text-[#0F2A3A] font-bold text-sm capitalize">{migrationData.species}</p>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-[#D9E2E7]">
                        <span className="text-[#5B7280] text-xs block mb-1">Months Requested</span>
                        <p className="text-[#0F766E] font-bold text-sm font-mono num-tabular">{migrationData.months_requested}</p>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-[#D9E2E7]">
                        <span className="text-[#5B7280] text-xs block mb-1">Sequence Length</span>
                        <p className="text-[#0F2A3A] font-bold text-sm font-mono num-tabular">{migrationData.sequence_length_used}</p>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-[#D9E2E7]">
                        <span className="text-[#5B7280] text-xs block mb-1">Total Points</span>
                        <p className="text-[#0F766E] font-bold text-sm font-mono num-tabular">{migrationData.points.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-paper">
                    <h4 className="text-[#0F2A3A] font-bold font-serif text-sm mb-3 tracking-wide">Migration Points Telemetry</h4>
                    <div className="max-h-80 overflow-y-auto rounded-xl border border-[#D9E2E7] bg-[#EEF3F5]">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-white border-b border-[#D9E2E7] z-10">
                          <tr>
                            <th className="text-left text-[#5B7280] font-semibold py-2.5 px-3 uppercase tracking-wider text-[10px]">Year</th>
                            <th className="text-left text-[#5B7280] font-semibold py-2.5 px-3 uppercase tracking-wider text-[10px]">Month</th>
                            <th className="text-left text-[#5B7280] font-semibold py-2.5 px-3 uppercase tracking-wider text-[10px]">Latitude</th>
                            <th className="text-left text-[#5B7280] font-semibold py-2.5 px-3 uppercase tracking-wider text-[10px]">Longitude</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D9E2E7] font-mono num-tabular">
                          {migrationData.points.map((point, idx) => (
                            <tr key={idx} className="hover:bg-white/80 transition-colors">
                              <td className="text-[#0F2A3A] py-2 px-3">{point.year}</td>
                              <td className="text-[#0F2A3A] py-2 px-3">{point.month}</td>
                              <td className="text-[#0F766E] font-bold py-2 px-3">{point.latitude.toFixed(4)}°</td>
                              <td className="text-[#0F766E] font-bold py-2 px-3">{point.longitude.toFixed(4)}°</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-paper">
                    <h4 className="text-[#0F2A3A] font-bold font-serif text-sm mb-3 tracking-wide">Migration Path Visualization</h4>
                    <div className="w-full aspect-square bg-[#EEF3F5] rounded-2xl overflow-hidden relative border border-[#D9E2E7]">
                      <Suspense fallback={
                        <div className="w-full h-full flex items-center justify-center text-[#5B7280] text-sm">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#0F766E] border-t-transparent mr-2"></div>
                          Loading globe projection...
                        </div>
                      }>
                        <ReactGlobeComponent
                          dataPoints={migrationDataPoints}
                          onDataPointClick={() => {}}
                          onCameraDistanceChange={(d) => {}}
                          onResetCamera={(resetFunction) => {}}
                          showPath={true}
                          focusOnData={true}
                          enableRotate={false}
                          enableZoom={true}
                          disableAutoRotate={true}
                        />
                      </Suspense>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-[#D9E2E7] rounded-2xl p-6 shadow-paper">
              <h3 className="text-lg font-bold font-serif text-[#0F2A3A] mb-2">VisualKadal</h3>
              <p className="text-[#5B7280] text-sm">VisualKadal ocean current viewer is available on the external server.</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Hover Tooltip for Migration Points */}
      {hoveredPoint && activeView === 'Migration Pattern' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y - 10}px`,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          <div className="bg-white border border-[#D9E2E7] rounded-xl p-4 shadow-paper-elevated min-w-[280px] text-[#0F2A3A]">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#0F766E]"></div>
                <h4 className="text-sm font-bold text-[#0F2A3A]">Migration Point Details</h4>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#5B7280]">Species:</span>
                  <span className="text-[#0F766E] font-bold italic">{hoveredPoint.scientificName || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B7280]">Year:</span>
                  <span className="text-[#0F2A3A] font-mono">{hoveredPoint.eventDate ? new Date(hoveredPoint.eventDate).getFullYear() : 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B7280]">Month:</span>
                  <span className="text-[#0F2A3A] font-mono">{hoveredPoint.eventDate ? new Date(hoveredPoint.eventDate).getMonth() + 1 : 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B7280]">Coordinates:</span>
                  <span className="text-[#0F2A3A] font-mono">{hoveredPoint.decimalLatitude?.toFixed(4)}°, {hoveredPoint.decimalLongitude?.toFixed(4)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B7280]">Date:</span>
                  <span className="text-[#0F2A3A]">{hoveredPoint.eventDate ? new Date(hoveredPoint.eventDate).toLocaleDateString() : 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B7280]">Location:</span>
                  <span className="text-[#0F2A3A]">{hoveredPoint.locality || 'Migration Path'}</span>
                </div>
                {migrationData && (
                  <div className="flex justify-between">
                    <span className="text-[#5B7280]">Sequence Length:</span>
                    <span className="text-[#0F766E] font-mono font-bold">{migrationData.sequence_length_used}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function SimpleLineChart({ data, xLabel, yLabel }: { data: XYPoint[]; xLabel: string; yLabel: string }) {
  const width = 920;
  const height = 280;
  const margin = { top: 10, right: 20, bottom: 40, left: 48 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const numericData = data.filter(d => typeof d.x === 'number') as { x: number; y: number }[];
  const minX = Math.min(...numericData.map(d => d.x));
  const maxX = Math.max(...numericData.map(d => d.x));
  const maxY = Math.max(1, ...numericData.map(d => d.y));
  const sx = (x: number) => margin.left + ((x - minX) / Math.max(1, maxX - minX)) * innerW;
  const sy = (y: number) => margin.top + innerH - (y / maxY) * innerH;
  const path = numericData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${sx(d.x)} ${sy(d.y)}`)
    .join(' ');
  const ticks = 5;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => Math.round((i * maxY) / ticks));
  const xTicks = Array.from({ length: Math.min(6, numericData.length) }, (_, i) =>
    Math.round(minX + (i * (maxX - minX)) / Math.max(1, Math.min(5, numericData.length - 1)))
  );
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <g>
        <line x1={margin.left} y1={margin.top + innerH} x2={margin.left + innerW} y2={margin.top + innerH} stroke="#D9E2E7" strokeWidth={1} />
        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + innerH} stroke="#D9E2E7" strokeWidth={1} />
        {yTicks.map(t => (
          <g key={t}>
            <line x1={margin.left} y1={sy(t)} x2={margin.left + innerW} y2={sy(t)} stroke="#E5ECEF" strokeWidth={1} />
            <text x={margin.left - 8} y={sy(t)} fill="#5B7280" fontSize="10" textAnchor="end" dominantBaseline="middle" className="font-mono">{t}</text>
          </g>
        ))}
        {xTicks.map(t => (
          <text key={t} x={sx(t)} y={margin.top + innerH + 16} fill="#5B7280" fontSize="10" textAnchor="middle" className="font-mono">{t}</text>
        ))}
        <text x={margin.left + innerW / 2} y={height - 4} fill="#0F2A3A" fontSize="11" textAnchor="middle" fontWeight="bold">{xLabel}</text>
        <text x={12} y={margin.top + innerH / 2} fill="#0F2A3A" fontSize="11" textAnchor="middle" fontWeight="bold" transform={`rotate(-90 12 ${margin.top + innerH / 2})`}>{yLabel}</text>
        <path d={path} fill="none" stroke="#0F766E" strokeWidth={2.5} />
        {numericData.map((d, i) => (
          <circle key={i} cx={sx(d.x)} cy={sy(d.y)} r={3.5} fill="#0F766E" stroke="#FFFFFF" strokeWidth={1.5} />
        ))}
      </g>
    </svg>
  );
}

function SimpleBarChart({ data, xLabel, yLabel, rotateLabels }: { data: XYPoint[]; xLabel: string; yLabel: string; rotateLabels?: boolean }) {
  const width = 920;
  const height = 280;
  const margin = { top: 10, right: 20, bottom: rotateLabels ? 70 : 40, left: 48 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const maxY = Math.max(1, ...data.map(d => d.y));
  const barW = data.length ? innerW / data.length : innerW;
  const sy = (y: number) => margin.top + innerH - (y / maxY) * innerH;
  const yTicks = Array.from({ length: 5 + 1 }, (_, i) => Math.round((i * maxY) / 5));
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <g>
        <line x1={margin.left} y1={margin.top + innerH} x2={margin.left + innerW} y2={margin.top + innerH} stroke="#D9E2E7" strokeWidth={1} />
        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + innerH} stroke="#D9E2E7" strokeWidth={1} />
        {yTicks.map(t => (
          <g key={t}>
            <line x1={margin.left} y1={sy(t)} x2={margin.left + innerW} y2={sy(t)} stroke="#E5ECEF" strokeWidth={1} />
            <text x={margin.left - 8} y={sy(t)} fill="#5B7280" fontSize="10" textAnchor="end" dominantBaseline="middle" className="font-mono">{t}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = margin.left + i * barW + 4;
          const w = Math.max(2, barW - 8);
          const y = sy(d.y);
          const h = margin.top + innerH - y;
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={h} fill="#0F766E" rx={3} />
              <title>{`${d.x}: ${d.y}`}</title>
              <text
                x={x + w / 2}
                y={margin.top + innerH + (rotateLabels ? 26 : 14)}
                fill="#5B7280"
                fontSize="10"
                textAnchor="middle"
                transform={rotateLabels ? `rotate(-40 ${x + w / 2} ${margin.top + innerH + 26})` : undefined}
              >
                {String(d.x)}
              </text>
            </g>
          );
        })}
        <text x={margin.left + innerW / 2} y={height - 4} fill="#0F2A3A" fontSize="11" textAnchor="middle" fontWeight="bold">{xLabel}</text>
        <text x={12} y={margin.top + innerH / 2} fill="#0F2A3A" fontSize="11" textAnchor="middle" fontWeight="bold" transform={`rotate(-90 12 ${margin.top + innerH / 2})`}>{yLabel}</text>
      </g>
    </svg>
  );
}

function SimpleAreaChart({ data, xLabel, yLabel }: { data: XYPoint[]; xLabel: string; yLabel: string }) {
  const width = 920; const height = 280;
  const margin = { top: 10, right: 20, bottom: 40, left: 48 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const numeric = data.filter(d => typeof d.x === 'number') as { x: number; y: number }[];
  const minX = Math.min(...numeric.map(d => d.x));
  const maxX = Math.max(...numeric.map(d => d.x));
  const maxY = Math.max(1, ...numeric.map(d => d.y));
  const sx = (x: number) => margin.left + ((x - minX) / Math.max(1, maxX - minX)) * innerW;
  const sy = (y: number) => margin.top + innerH - (y / maxY) * innerH;
  const path = numeric.map((d, i) => `${i === 0 ? 'M' : 'L'} ${sx(d.x)} ${sy(d.y)}`).join(' ');
  const area = `M ${sx(numeric[0]?.x || 0)} ${sy(0)} ` + numeric.map(d => `L ${sx(d.x)} ${sy(d.y)}`).join(' ') + ` L ${sx(numeric[numeric.length-1]?.x || 0)} ${sy(0)} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <path d={area} fill="rgba(15, 118, 110, 0.12)" stroke="none" />
      <path d={path} fill="none" stroke="#0F766E" strokeWidth={2.5} />
      <text x={margin.left + innerW / 2} y={height - 4} fill="#0F2A3A" fontSize="11" textAnchor="middle" fontWeight="bold">{xLabel}</text>
      <text x={12} y={margin.top + innerH / 2} fill="#0F2A3A" fontSize="11" textAnchor="middle" fontWeight="bold" transform={`rotate(-90 12 ${margin.top + innerH / 2})`}>{yLabel}</text>
    </svg>
  );
}

function SimpleScatter({ data, xLabel, yLabel }: { data: XYPoint[]; xLabel: string; yLabel: string }) {
  const width = 920; const height = 280;
  const margin = { top: 10, right: 20, bottom: 40, left: 48 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const numeric = data.filter(d => typeof d.x === 'number') as { x: number; y: number }[];
  const minX = Math.min(...numeric.map(d => d.x));
  const maxX = Math.max(...numeric.map(d => d.x));
  const maxY = Math.max(1, ...numeric.map(d => d.y));
  const sx = (x: number) => margin.left + ((x - minX) / Math.max(1, maxX - minX)) * innerW;
  const sy = (y: number) => margin.top + innerH - (y / maxY) * innerH;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      {numeric.map((d, i) => (<circle key={i} cx={sx(d.x)} cy={sy(d.y)} r={4} fill="#0369A1" stroke="#FFFFFF" strokeWidth={1} />))}
      <text x={margin.left + innerW / 2} y={height - 4} fill="#0F2A3A" fontSize="11" textAnchor="middle" fontWeight="bold">{xLabel}</text>
      <text x={12} y={margin.top + innerH / 2} fill="#0F2A3A" fontSize="11" textAnchor="middle" fontWeight="bold" transform={`rotate(-90 12 ${margin.top + innerH / 2})`}>{yLabel}</text>
    </svg>
  );
}

function SimplePie({ data }: { data: XYPoint[] }) {
  const width = 420; const height = 260; const r = Math.min(width, height) / 2 - 10; const cx = width/2; const cy = height/2;
  const total = Math.max(1, data.reduce((s, d) => s + d.y, 0));
  let angle = -Math.PI / 2;
  const palette = ['#0F766E', '#0369A1', '#D97706', '#7C3AED', '#E4572E', '#64748B'];
  const slices = data.map((d, i) => {
    const a = (d.y / total) * Math.PI * 2;
    const start = angle; const end = angle + a; angle = end;
    const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
    const large = a > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    const color = palette[i % palette.length];
    return { path, color, label: String(d.x), value: d.y };
  });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      {slices.map((s, i) => (<path key={i} d={s.path} fill={s.color} stroke="#FFFFFF" strokeWidth={1.5} />))}
      <g transform={`translate(${width - 120},20)`}>
        {slices.slice(0,8).map((s,i) => (
          <g key={i} transform={`translate(0, ${i*18})`}>
            <rect width="12" height="12" fill={s.color} rx={2} />
            <text x="16" y="10" fill="#0F2A3A" fontSize="11" fontWeight="500">{s.label} ({s.value})</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function SimpleHeatmap({ data, xLabel, yLabel, xIsTime }: { data: { x: number; y: number; v: number }[]; xLabel: string; yLabel: string; xIsTime?: boolean }) {
  const width = 920; const height = 260;
  const margin = { top: 10, right: 20, bottom: 40, left: 60 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const xs = Array.from(new Set(data.map(d => d.x))).sort((a,b)=>a-b);
  const ys = Array.from(new Set(data.map(d => d.y))).sort((a,b)=>a-b);
  const maxV = Math.max(1, ...data.map(d => d.v));
  const cw = innerW / Math.max(1, xs.length);
  const ch = innerH / Math.max(1, ys.length);
  const color = (v: number) => `hsl(${180 - Math.round((v/maxV)*140)} 70% 45%)`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      {data.map((d, i) => {
        const xi = xs.indexOf(d.x); const yi = ys.indexOf(d.y);
        return <rect key={i} x={margin.left + xi*cw} y={margin.top + yi*ch} width={cw-1} height={ch-1} fill={color(d.v)} rx={1} />;
      })}
      <text x={margin.left + innerW / 2} y={height - 4} fill="#0F2A3A" fontSize="11" textAnchor="middle" fontWeight="bold">{xLabel}</text>
      <text x={12} y={margin.top + innerH / 2} fill="#0F2A3A" fontSize="11" textAnchor="middle" fontWeight="bold" transform={`rotate(-90 12 ${margin.top + innerH / 2})`}>{yLabel}</text>
    </svg>
  );
}

function SimpleBoxPlot({ values, xLabel }: { values: number[]; xLabel: string }) {
  const width = 920; const height = 260; const margin = { top: 20, right: 20, bottom: 40, left: 48 };
  const innerW = width - margin.left - margin.right; const innerH = height - margin.top - margin.bottom;
  const sorted = [...values].filter(v => !isNaN(v)).sort((a,b)=>a-b);
  const q = (p: number) => sorted[Math.floor(p*(sorted.length-1))] || 0;
  const q1 = q(0.25), q2 = q(0.5), q3 = q(0.75); const min = sorted[0] || 0; const max = sorted[sorted.length-1] || 0;
  const sy = (v: number) => margin.top + innerH - ((v - min) / Math.max(1, max - min)) * innerH;
  const cx = margin.left + innerW/2;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <line x1={cx} x2={cx} y1={sy(min)} y2={sy(max)} stroke="#5B7280" strokeWidth={1.5} />
      <rect x={cx-60} width={120} y={sy(q3)} height={Math.max(2, sy(q1)-sy(q3))} fill="rgba(15, 118, 110, 0.12)" stroke="#0F766E" strokeWidth={1.5} rx={3} />
      <line x1={cx-60} x2={cx+60} y1={sy(q2)} y2={sy(q2)} stroke="#0F766E" strokeWidth={2} />
      <line x1={cx-30} x2={cx+30} y1={sy(min)} y2={sy(min)} stroke="#5B7280" strokeWidth={1.5} />
      <line x1={cx-30} x2={cx+30} y1={sy(max)} y2={sy(max)} stroke="#5B7280" strokeWidth={1.5} />
      <text x={width/2} y={height - 4} fill="#0F2A3A" fontSize="11" textAnchor="middle" fontWeight="bold">{xLabel}</text>
    </svg>
  );
}

function SimpleViolinPlot({ values, xLabel }: { values: number[]; xLabel: string }) {
  const width = 920; const height = 260; const margin = { top: 20, right: 20, bottom: 40, left: 48 };
  const innerW = width - margin.left - margin.right; const innerH = height - margin.top - margin.bottom;
  const sorted = [...values].filter(v => !isNaN(v)).sort((a,b)=>a-b);
  const min = sorted[0] || 0; const max = sorted[sorted.length-1] || 0;
  const bins = 30; const counts = Array(bins).fill(0);
  sorted.forEach(v => { const i = Math.min(bins-1, Math.floor(((v - min) / Math.max(1, max - min)) * bins)); counts[i]++; });
  const maxC = Math.max(1, ...counts);
  const path = counts.map((c, i) => {
    const y = margin.top + (i / bins) * innerH;
    const w = (c / maxC) * 120;
    return `M ${width/2 - w} ${y} L ${width/2 + w} ${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <path d={path} stroke="#0F766E" strokeWidth={1.5} strokeOpacity={0.8} />
      <text x={width/2} y={height - 4} fill="#0F2A3A" fontSize="11" textAnchor="middle" fontWeight="bold">{xLabel}</text>
    </svg>
  );
}

// Lightweight portal to render dropdown menus above all content
function MenuPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === 'undefined') return null;
  return ReactDOM.createPortal(children as any, document.body);
}

function Dropdown({ value, onChange, options, maxWidth }: { value: string; onChange: (v: string) => void; options: string[]; maxWidth?: string }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  
  useEffect(() => {
    const onDoc = (e: MouseEvent | TouchEvent) => {
      if (!wrapperRef.current) return;
      const target = e.target as Node;
      if (!wrapperRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc as any, { passive: true } as any);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc as any);
    };
  }, []);
  
  return (
    <div ref={wrapperRef} className="relative" style={{ maxWidth: maxWidth || '320px' }}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className="px-4 py-2 rounded-xl bg-white border border-[#D9E2E7] text-[#0F2A3A] text-sm flex items-center justify-between gap-6 min-w-[220px] hover:bg-[#EEF3F5] shadow-xs"
      >
        <span className="truncate">{value || 'Select graph/chart template'}</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-2 bg-white border border-[#D9E2E7] rounded-xl shadow-paper-elevated overflow-y-auto min-w-full z-50"
          style={{ 
            pointerEvents: 'auto',
            zIndex: 999999,
            position: 'absolute',
            maxHeight: '160px',
            height: '160px'
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { 
                onChange(opt); 
                setOpen(false); 
              }}
              className={`w-full text-left px-4 py-2 text-sm ${opt === value ? 'bg-[#0F766E]/10 text-[#0F766E] font-semibold' : 'text-[#0F2A3A] hover:bg-[#EEF3F5]'} cursor-pointer`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MultiSelect({ values, onChange, options }: { values: string[]; onChange: (v: string[]) => void; options: { value: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  
  useEffect(() => {
    const onDoc = (e: MouseEvent | TouchEvent) => {
      if (!wrapperRef.current) return;
      const target = e.target as Node;
      if (!wrapperRef.current.contains(target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc as any, { passive: true } as any);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc as any);
    };
  }, []);
  
  const toggle = (val: string) => {
    const set = new Set(values);
    if (set.has(val)) set.delete(val); else set.add(val);
    onChange(Array.from(set));
  };
  
  return (
    <div ref={wrapperRef} className="relative" style={{ maxWidth: '340px' }}>
      <button ref={btnRef} type="button" onClick={() => setOpen(o=>!o)} className="px-4 py-2 rounded-xl bg-white border border-[#D9E2E7] text-[#0F2A3A] text-sm flex items-center justify-between gap-6 min-w-[240px] hover:bg-[#EEF3F5] shadow-xs">
        <span className="truncate">{values.length ? `${values.length} dataset(s) selected` : 'Select a dataset'}</span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-2 bg-white border border-[#D9E2E7] rounded-xl shadow-paper-elevated overflow-y-auto min-w-full z-50"
          style={{ 
            pointerEvents: 'auto',
            zIndex: 999999,
            position: 'absolute',
            maxHeight: '160px',
            height: '160px'
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {options.map(opt => (
            <label key={opt.value} className="flex items-center gap-3 px-4 py-2 text-sm text-[#0F2A3A] hover:bg-[#EEF3F5] cursor-pointer">
              <input 
                type="checkbox" 
                checked={values.includes(opt.value)} 
                onChange={() => toggle(opt.value)} 
                className="accent-[#0F766E]"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// Chart Components for Data Visualization
function SpeciesDistributionChart({ data }: { data: DataPoint[] }) {
  const speciesCounts = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const counts: { [key: string]: number } = {};
    data.forEach(point => {
      const species = point.scientificName;
      if (species) counts[species] = (counts[species] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [data]);

  const total = speciesCounts.reduce((sum, item) => sum + item.count, 0);
  const maxCount = speciesCounts.length > 0 ? Math.max(...speciesCounts.map(item => item.count)) : 1;

  if (speciesCounts.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#5B7280] text-sm">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <svg viewBox="0 0 280 96" className="w-full h-full">
        {speciesCounts.map((item, index) => {
          const width = (item.count / maxCount) * 220;
          const x = 10;
          const y = index * 16 + 8;
          const height = 14;
          
          return (
            <g key={item.name}>
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill="#0F766E"
                rx={2}
              />
              <text
                x={x + width + 8}
                y={y + height/2 + 4}
                fill="#0F2A3A"
                fontSize="9"
                fontWeight="500"
                dominantBaseline="middle"
              >
                {item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name} ({item.count})
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function TopSpeciesChart({ data }: { data: DataPoint[] }) {
  const speciesCounts = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const counts: { [key: string]: number } = {};
    data.forEach(point => {
      const species = point.scientificName;
      if (species) counts[species] = (counts[species] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
  }, [data]);

  const total = speciesCounts.reduce((sum, item) => sum + item.count, 0);

  if (speciesCounts.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#5B7280] text-sm">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <svg viewBox="0 0 280 96" className="w-full h-full">
        {speciesCounts.map((item, index) => {
          const percentage = (item.count / total) * 100;
          const radius = 35;
          const cx = 60;
          const cy = 48;
          const startAngle = index === 0 ? 0 : speciesCounts.slice(0, index).reduce((sum, prev) => sum + (prev.count / total) * 360, 0);
          const endAngle = startAngle + (item.count / total) * 360;
          
          const x1 = cx + radius * Math.cos((startAngle * Math.PI) / 180);
          const y1 = cy + radius * Math.sin((startAngle * Math.PI) / 180);
          const x2 = cx + radius * Math.cos((endAngle * Math.PI) / 180);
          const y2 = cy + radius * Math.sin((endAngle * Math.PI) / 180);
          const largeArc = endAngle - startAngle > 180 ? 1 : 0;
          
          const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          const colors = ['#0F766E', '#0369A1', '#D97706'];
          
          return (
            <g key={item.name}>
              <path
                d={path}
                fill={colors[index]}
                stroke="#FFFFFF"
                strokeWidth={1}
              />
              <text
                x={110}
                y={15 + index * 22}
                fill="#0F2A3A"
                fontSize="10"
                fontWeight="500"
                dominantBaseline="middle"
              >
                {item.name.length > 18 ? item.name.substring(0, 18) + '...' : item.name}: {item.count}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function WaterBodyDistributionChart({ data }: { data: DataPoint[] }) {
  const waterBodyCounts = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const counts: { [key: string]: number } = {};
    data.forEach(point => {
      const waterBody = point.waterBody;
      if (waterBody) counts[waterBody] = (counts[waterBody] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 4)
      .map(([name, count]) => ({ name, count }));
  }, [data]);

  const maxCount = waterBodyCounts.length > 0 ? Math.max(...waterBodyCounts.map(item => item.count)) : 1;

  if (waterBodyCounts.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#5B7280] text-sm">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <svg viewBox="0 0 280 96" className="w-full h-full">
        {waterBodyCounts.map((item, index) => {
          const height = (item.count / maxCount) * 70;
          const x = index * 65 + 15;
          const y = 85 - height;
          const width = 50;
          
          return (
            <g key={item.name}>
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill="#0369A1"
                rx={2}
              />
              <text
                x={x + width/2}
                y={y - 8}
                fill="#0F2A3A"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
                className="font-mono"
              >
                {item.count}
              </text>
              <text
                x={x + width/2}
                y={92}
                fill="#5B7280"
                fontSize="8"
                textAnchor="middle"
                transform={`rotate(-45 ${x + width/2} 92)`}
              >
                {item.name.length > 10 ? item.name.substring(0, 10) + '...' : item.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function TemporalDistributionChart({ data }: { data: DataPoint[] }) {
  const yearCounts = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const counts: { [year: number]: number } = {};
    data.forEach(point => {
      const year = new Date(point.eventDate).getFullYear();
      if (!isNaN(year)) counts[year] = (counts[year] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => a.year - b.year)
      .slice(-6);
  }, [data]);

  const maxCount = yearCounts.length > 0 ? Math.max(...yearCounts.map(item => item.count)) : 1;

  if (yearCounts.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#5B7280] text-sm">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <svg viewBox="0 0 280 96" className="w-full h-full">
        <polyline
          points={yearCounts.map((item, index) => {
            const x = 15 + (index * 45);
            const y = 85 - (item.count / maxCount) * 70;
            return `${x},${y}`;
          }).join(' ')}
          fill="none"
          stroke="#0F766E"
          strokeWidth="2.5"
        />
        {yearCounts.map((item, index) => {
          const x = 15 + (index * 45);
          const y = 85 - (item.count / maxCount) * 70;
          
          return (
            <g key={item.year}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="#0F766E"
                stroke="#FFFFFF"
                strokeWidth={1.5}
              />
              <text
                x={x}
                y={92}
                fill="#5B7280"
                fontSize="9"
                textAnchor="middle"
                className="font-mono"
              >
                {item.year}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DepthDistributionChart({ data }: { data: DataPoint[] }) {
  const depthBins = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const bins = [0, 100, 200, 500, 1000, 2000, 5000];
    const counts = new Array(bins.length - 1).fill(0);
    
    data.forEach(point => {
      const avgDepth = (point.minimumDepthInMeters + point.maximumDepthInMeters) / 2;
      for (let i = 0; i < bins.length - 1; i++) {
        if (avgDepth >= bins[i] && avgDepth < bins[i + 1]) {
          counts[i]++;
          break;
        }
      }
    });
    
    return bins.slice(0, -1).map((bin, index) => ({
      range: `${bin}-${bins[index + 1]}m`,
      count: counts[index]
    }));
  }, [data]);

  const maxCount = depthBins.length > 0 ? Math.max(...depthBins.map(item => item.count)) : 1;

  if (depthBins.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#5B7280] text-sm">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <svg viewBox="0 0 280 96" className="w-full h-full">
        {depthBins.map((item, index) => {
          const height = (item.count / maxCount) * 60;
          const x = index * 40 + 15;
          const y = 85 - height;
          const width = 30;
          
          return (
            <g key={item.range}>
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill="#D97706"
                rx={2}
              />
              <text
                x={x + width/2}
                y={y - 8}
                fill="#0F2A3A"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
                className="font-mono"
              >
                {item.count}
              </text>
              <text
                x={x + width/2}
                y={92}
                fill="#5B7280"
                fontSize="7"
                textAnchor="middle"
                transform={`rotate(-45 ${x + width/2} 92)`}
              >
                {item.range}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SpeciesIdentificationModule({ globalSearch }: { globalSearch: string }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<SpeciesIdentificationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(file);
      setResult(null);
      setError(null);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleIdentify = async () => {
    if (!selectedFile) {
      setError('Please select an image file first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const identificationResult = await speciesIdentificationService.identify(selectedFile);
      setResult(identificationResult);
    } catch (err: any) {
      setError(err.message || 'Failed to identify species');
      console.error('Species identification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-paper">
        <label className="block mb-2 text-[#5B7280] text-xs font-semibold uppercase tracking-wider">Choose Specimen Image File</label>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px]">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileSelect}
              className="w-full px-4 py-2 bg-[#F7F9FA] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] text-xs focus:border-[#0F766E] focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0F766E] file:text-white file:cursor-pointer hover:file:bg-[#0B5F58] transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleIdentify} 
              disabled={loading || !selectedFile}
              className="px-4 py-2.5 bg-[#0F766E] text-white font-bold rounded-xl text-xs uppercase tracking-wider disabled:opacity-50 hover:bg-[#0B5F58] hover:shadow-md transition-all whitespace-nowrap"
            >
              {loading ? 'Analyzing Specimen...' : 'Identify Species'}
            </button>
            {selectedFile && (
              <button 
                onClick={handleClear}
                className="px-4 py-2.5 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] text-xs font-semibold hover:bg-[#E2E8F0] transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {previewUrl && (
        <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-paper">
          <h3 className="text-[#0F2A3A] font-bold text-sm mb-3 tracking-wide">Specimen Preview</h3>
          <div className="p-2 bg-[#F7F9FA] rounded-xl border border-[#D9E2E7] inline-block">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="max-w-full max-h-64 rounded-lg object-contain"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#B91C1C] animate-pulse" />
          <div className="text-[#B91C1C] text-xs font-medium">{error}</div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Main Identification Result */}
          <div className="bg-white p-6 rounded-2xl border border-[#D9E2E7] shadow-paper">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono text-[#0F766E] uppercase tracking-widest font-semibold block mb-1">Identified Taxon</span>
                <h2 className="text-2xl font-black text-[#0F2A3A] italic tracking-wide mb-1">{result.scientificName}</h2>
                {result.commonName && (
                  <p className="text-[#0369A1] text-base font-semibold">{result.commonName}</p>
                )}
              </div>
              <div className="text-right bg-[#EEF3F5] px-4 py-3 rounded-xl border border-[#D9E2E7]">
                <div className="text-[#5B7280] text-[10px] uppercase font-bold tracking-wider mb-0.5">Confidence</div>
                <div className="text-2xl font-black text-[#0F766E] font-mono num-tabular">{(result.confidence * 100).toFixed(1)}%</div>
                <div className="text-[#5B7280] text-xs mt-0.5">Rank: <span className="text-[#0F2A3A] uppercase font-bold">{result.rank}</span></div>
              </div>
            </div>

            {/* Taxonomic Lineage */}
            {result.taxonomicLineage && result.taxonomicLineage.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#D9E2E7]">
                <h3 className="text-[#5B7280] text-xs font-bold uppercase tracking-wider mb-2.5">Taxonomic Hierarchy</h3>
                <div className="flex flex-wrap gap-2">
                  {result.taxonomicLineage.map((item, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-[#EEF3F5] border border-[#D9E2E7] rounded-lg text-[#0F2A3A] text-xs font-mono">
                      <span className="text-[#5B7280] uppercase text-[10px]">{item.rank}:</span> <span className="font-semibold text-[#0F766E]">{item.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Morphology */}
          {result.morphology && (
            <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-paper">
              <h3 className="text-base font-bold text-[#0F2A3A] mb-3 tracking-wide">Morphology</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.morphology.diagnosticFeatures && result.morphology.diagnosticFeatures.length > 0 && (
                  <div className="p-3.5 bg-[#F7F9FA] rounded-xl border border-[#D9E2E7]">
                    <h4 className="text-[#0F766E] text-xs font-bold uppercase tracking-wider mb-2">Diagnostic Features</h4>
                    <ul className="list-disc list-inside text-[#5B7280] text-xs space-y-1">
                      {result.morphology.diagnosticFeatures.map((feature, idx) => (
                        <li key={idx} className="text-[#0F2A3A]">{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.morphology.averageSizeCm && (
                  <div className="p-3.5 bg-[#F7F9FA] rounded-xl border border-[#D9E2E7]">
                    <h4 className="text-[#0F766E] text-xs font-bold uppercase tracking-wider mb-1.5">Average Size</h4>
                    <p className="text-[#0F2A3A] text-sm font-mono num-tabular font-semibold">
                      {result.morphology.averageSizeCm.min} - {result.morphology.averageSizeCm.max} cm
                    </p>
                  </div>
                )}
                {result.morphology.coloration && (
                  <div className="p-3.5 bg-[#F7F9FA] rounded-xl border border-[#D9E2E7]">
                    <h4 className="text-[#0F766E] text-xs font-bold uppercase tracking-wider mb-1.5">Coloration</h4>
                    <p className="text-[#5B7280] text-xs leading-relaxed">{result.morphology.coloration}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Habitat & Ecology */}
          {result.habitatEcology && (
            <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-paper">
              <h3 className="text-base font-bold text-[#0F2A3A] mb-3 tracking-wide">Habitat & Ecology</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.habitatEcology.environment && (
                  <div className="p-3.5 bg-[#F7F9FA] rounded-xl border border-[#D9E2E7]">
                    <h4 className="text-[#0F766E] text-xs font-bold uppercase tracking-wider mb-1">Environment</h4>
                    <p className="text-[#5B7280] text-xs">{result.habitatEcology.environment}</p>
                  </div>
                )}
                {result.habitatEcology.typicalDepthM && (
                  <div className="p-3.5 bg-[#F7F9FA] rounded-xl border border-[#D9E2E7]">
                    <h4 className="text-[#0F766E] text-xs font-bold uppercase tracking-wider mb-1">Typical Depth</h4>
                    <p className="text-[#0F2A3A] text-sm font-mono num-tabular font-semibold">
                      {result.habitatEcology.typicalDepthM.min} - {result.habitatEcology.typicalDepthM.max} m
                    </p>
                  </div>
                )}
                {result.habitatEcology.geographicDistribution && (
                  <div className="p-3.5 bg-[#F7F9FA] rounded-xl border border-[#D9E2E7]">
                    <h4 className="text-[#0F766E] text-xs font-bold uppercase tracking-wider mb-1">Geographic Distribution</h4>
                    <p className="text-[#5B7280] text-xs">{result.habitatEcology.geographicDistribution}</p>
                  </div>
                )}
                {result.habitatEcology.ecologicalRole && (
                  <div className="p-3.5 bg-[#F7F9FA] rounded-xl border border-[#D9E2E7]">
                    <h4 className="text-[#0F766E] text-xs font-bold uppercase tracking-wider mb-1">Ecological Role</h4>
                    <p className="text-[#5B7280] text-xs">{result.habitatEcology.ecologicalRole}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conservation */}
          {result.conservation && (
            <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-paper">
              <h3 className="text-base font-bold text-[#0F2A3A] mb-3 tracking-wide">Conservation Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.conservation.iucnStatus && (
                  <div className="p-3.5 bg-[#F7F9FA] rounded-xl border border-[#D9E2E7]">
                    <h4 className="text-[#0F766E] text-xs font-bold uppercase tracking-wider mb-1">IUCN Red List Status</h4>
                    <p className="text-[#0F2A3A] font-bold text-sm">{result.conservation.iucnStatus}</p>
                  </div>
                )}
                {result.conservation.majorThreats && result.conservation.majorThreats.length > 0 && (
                  <div className="p-3.5 bg-[#F7F9FA] rounded-xl border border-[#D9E2E7]">
                    <h4 className="text-[#0F766E] text-xs font-bold uppercase tracking-wider mb-1">Major Threats</h4>
                    <ul className="list-disc list-inside text-[#5B7280] text-xs space-y-1">
                      {result.conservation.majorThreats.map((threat, idx) => (
                        <li key={idx} className="text-[#0F2A3A]">{threat}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.conservation.managementNotes && (
                  <div className="md:col-span-2 p-3.5 bg-[#F7F9FA] rounded-xl border border-[#D9E2E7]">
                    <h4 className="text-[#0F766E] text-xs font-bold uppercase tracking-wider mb-1">Management Notes</h4>
                    <p className="text-[#5B7280] text-xs leading-relaxed">{result.conservation.managementNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Usage & Importance */}
          {result.usageAndImportance && (
            <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-paper">
              <h3 className="text-base font-bold text-[#0F2A3A] mb-3 tracking-wide">Usage & Importance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.usageAndImportance.fisheries && (
                  <div className="p-3.5 bg-[#F7F9FA] rounded-xl border border-[#D9E2E7]">
                    <h4 className="text-[#0F766E] text-xs font-bold uppercase tracking-wider mb-1">Fisheries</h4>
                    <p className="text-[#5B7280] text-xs">{result.usageAndImportance.fisheries}</p>
                  </div>
                )}
                {result.usageAndImportance.researchImportance && (
                  <div className="p-3.5 bg-[#F7F9FA] rounded-xl border border-[#D9E2E7]">
                    <h4 className="text-[#0F766E] text-xs font-bold uppercase tracking-wider mb-1">Research Importance</h4>
                    <p className="text-[#5B7280] text-xs">{result.usageAndImportance.researchImportance}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Image Analysis Notes */}
          {result.imageAnalysisNotes && (
            <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-paper">
              <h3 className="text-base font-bold text-[#0F2A3A] mb-3 tracking-wide">Image Analysis Diagnostics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.imageAnalysisNotes.visibleFeaturesUsedForID && result.imageAnalysisNotes.visibleFeaturesUsedForID.length > 0 && (
                  <div className="p-3.5 bg-[#F7F9FA] rounded-xl border border-[#D9E2E7]">
                    <h4 className="text-[#0F766E] text-xs font-bold uppercase tracking-wider mb-1.5">Visible Features Used for ID</h4>
                    <ul className="list-disc list-inside text-[#5B7280] text-xs space-y-1">
                      {result.imageAnalysisNotes.visibleFeaturesUsedForID.map((feature, idx) => (
                        <li key={idx} className="text-[#0F2A3A]">{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.imageAnalysisNotes.imageQualityIssues && result.imageAnalysisNotes.imageQualityIssues.length > 0 && (
                  <div className="p-3.5 bg-[#F7F9FA] rounded-xl border border-[#D9E2E7]">
                    <h4 className="text-[#0F766E] text-xs font-bold uppercase tracking-wider mb-1.5">Image Quality Issues</h4>
                    <ul className="list-disc list-inside text-[#5B7280] text-xs space-y-1">
                      {result.imageAnalysisNotes.imageQualityIssues.map((issue, idx) => (
                        <li key={idx} className="text-[#0F2A3A]">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data Provenance */}
          {result.dataProvenance && (
            <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-paper">
              <h3 className="text-base font-bold text-[#0F2A3A] mb-3 tracking-wide">Model Provenance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {result.dataProvenance.modelVersion && (
                  <div className="p-3.5 bg-[#F7F9FA] rounded-xl border border-[#D9E2E7]">
                    <span className="text-[#5B7280] block mb-0.5">Model Version</span>
                    <span className="text-[#0F766E] font-bold">{result.dataProvenance.modelVersion}</span>
                  </div>
                )}
                {result.dataProvenance.inferenceTimestamp && (
                  <div className="p-3.5 bg-[#F7F9FA] rounded-xl border border-[#D9E2E7]">
                    <span className="text-[#5B7280] block mb-0.5">Inference Timestamp</span>
                    <span className="text-[#0F2A3A] num-tabular">{result.dataProvenance.inferenceTimestamp}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!selectedFile && !result && (
        <div className="text-center py-12 text-[#5B7280] bg-white rounded-2xl border border-[#D9E2E7] shadow-paper">
          <div className="w-16 h-16 rounded-2xl bg-[#EEF3F5] border border-[#D9E2E7] flex items-center justify-center mx-auto mb-3 text-[#0F766E]">
            <FiSearch className="w-8 h-8" />
          </div>
          <p className="text-base font-semibold text-[#0F2A3A] mb-1">Upload an image to identify the species</p>
          <p className="text-xs text-[#5B7280]">Supported formats: JPG, PNG, and other standard specimen photo formats</p>
        </div>
      )}
    </div>
  );
}

function NotesModule({ selectedProject }: { selectedProject: Project | null }) {
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedProject?.id) {
      loadNotes();
    } else {
      setIsLoading(false);
      setNotes([]);
    }
  }, [selectedProject?.id]);

  const loadNotes = async () => {
    if (!selectedProject?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await studyNotesService.getNotesByProject(selectedProject.id);
      setNotes(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedNote(null);
    setNoteTitle('');
    setNoteContent('');
    setError(null);
  };

  const handleEditNote = (note: any) => {
    setSelectedNote(note);
    setIsEditing(true);
    setIsCreating(false);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setError(null);
  };

  const handleSaveNote = async () => {
    if (!selectedProject?.id) {
      setError('No project selected');
      return;
    }

    if (!noteTitle.trim() || !noteContent.trim()) {
      setError('Title and content are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isCreating) {
        const newNote = await studyNotesService.createNote({
          project_id: selectedProject.id,
          title: noteTitle.trim(),
          content: noteContent.trim(),
        });
        if (newNote) {
          await loadNotes();
          setIsCreating(false);
          setSelectedNote(null);
          setNoteTitle('');
          setNoteContent('');
        } else {
          setError('Failed to create note');
        }
      } else if (selectedNote) {
        const updatedNote = await studyNotesService.updateNote(selectedNote.id, {
          title: noteTitle.trim(),
          content: noteContent.trim(),
        });
        if (updatedNote) {
          await loadNotes();
          setIsEditing(false);
          setSelectedNote(null);
          setNoteTitle('');
          setNoteContent('');
        } else {
          setError('Failed to update note');
        }
      }
    } catch (e: any) {
      setError(e.message || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const success = await studyNotesService.deleteNote(noteId);
      if (success) {
        await loadNotes();
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
          setIsEditing(false);
          setIsCreating(false);
          setNoteTitle('');
          setNoteContent('');
        }
      } else {
        setError('Failed to delete note');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to delete note');
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setSelectedNote(null);
    setNoteTitle('');
    setNoteContent('');
    setError(null);
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

  if (!selectedProject) {
    return (
      <div className="text-[#5B7280] text-center py-16 bg-white rounded-2xl border border-[#D9E2E7] shadow-paper">
        <div className="w-16 h-16 rounded-2xl bg-[#EEF3F5] border border-[#D9E2E7] flex items-center justify-center mx-auto mb-4 text-[#0F766E]">
          <FiFileText className="w-8 h-8" />
        </div>
        <p className="text-[#0F2A3A] font-semibold text-base mb-1">No project selected</p>
        <p className="text-[#5B7280] text-xs">Please select an active research project to view its observational logs</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      {error && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-[#B91C1C] text-xs font-medium flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#B91C1C] animate-pulse" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-1 gap-5">
        {/* Notes List Sidebar */}
        <div className="w-80 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#0F2A3A] tracking-wide">Project Logs</h3>
            <button
              onClick={handleCreateNote}
              className="px-3 py-1.5 bg-[#0F766E] text-white font-bold rounded-lg hover:bg-[#0B5F58] transition-all duration-200 flex items-center space-x-1.5 text-xs uppercase tracking-wider shadow-sm"
            >
              <FiPlus className="w-3.5 h-3.5" />
              <span>New Note</span>
            </button>
          </div>

          {isLoading ? (
            <div className="text-[#5B7280] text-xs text-center py-12">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#0F766E] border-t-transparent mb-2"></div>
              <p>Loading project notes...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-[#5B7280] text-xs text-center py-12 bg-white rounded-2xl border border-[#D9E2E7] shadow-paper p-6">
              <FiFileText className="w-10 h-10 mx-auto mb-2 text-[#0F766E]/40" />
              <p className="text-[#0F2A3A] font-medium mb-1">No notes recorded</p>
              <p className="text-[#5B7280] text-[11px]">Create your first observation note for this project</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => handleEditNote(note)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedNote?.id === note.id
                      ? 'border-[#0F766E] bg-[#0F766E]/5 shadow-sm'
                      : 'border-[#D9E2E7] bg-white hover:bg-[#F7F9FA] hover:border-[#0F766E]/40 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[#0F2A3A] font-semibold text-xs mb-1 truncate">
                        {note.title}
                      </h4>
                      <p className="text-[#5B7280] text-[11px] line-clamp-2 mb-2 leading-relaxed">
                        {note.content}
                      </p>
                      <p className="text-[#5B7280] text-[10px] font-mono num-tabular">
                        {formatDate(note.updated_at)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="p-1.5 text-[#5B7280] hover:text-[#B91C1C] hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete note"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Note Editor */}
        <div className="flex-1">
          {(isCreating || isEditing) ? (
            <div className="h-full flex flex-col bg-white rounded-2xl p-6 border border-[#D9E2E7] shadow-paper">
              <div className="mb-4">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title..."
                  className="w-full px-4 py-2.5 bg-[#F7F9FA] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] placeholder-[#5B7280] focus:border-[#0F766E] focus:outline-none mb-3 text-sm font-semibold"
                />
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write your research notes and field observations here..."
                  className="w-full h-[460px] px-4 py-3 bg-[#F7F9FA] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] placeholder-[#5B7280] focus:border-[#0F766E] focus:outline-none resize-none text-xs leading-relaxed"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-4 py-2 border border-[#D9E2E7] text-[#5B7280] rounded-xl hover:bg-[#EEF3F5] transition-colors disabled:opacity-50 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={saving || !noteTitle.trim() || !noteContent.trim()}
                  className="px-4 py-2 bg-[#0F766E] text-white font-bold rounded-xl hover:bg-[#0B5F58] transition-all duration-200 flex items-center space-x-1.5 disabled:opacity-50 text-xs uppercase tracking-wider shadow-sm"
                >
                  <FiSave className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Note'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[#5B7280] bg-white rounded-2xl p-8 border border-[#D9E2E7] shadow-paper">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#EEF3F5] border border-[#D9E2E7] flex items-center justify-center mx-auto mb-4 text-[#0F766E]">
                  <FiFileText className="w-8 h-8" />
                </div>
                <p className="mb-3 text-sm font-semibold text-[#0F2A3A]">Select a note to edit or create a new observation</p>
                <button
                  onClick={handleCreateNote}
                  className="px-4 py-2 bg-[#0F766E] text-white font-bold rounded-xl hover:bg-[#0B5F58] transition-all duration-200 flex items-center space-x-1.5 mx-auto text-xs uppercase tracking-wider shadow-sm"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  <span>Create New Note</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GlobeView;

function Lineage({ name }: { name: string }) {
  const [lineage, setLineage] = useState<string[]>([]);
  useEffect(() => {
    const go = async () => {
      try {
        const res = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}`);
        const j = await res.json();
        const key = j.usageKey || j.speciesKey || j.acceptedUsageKey;
        if (!key) { setLineage([]); return; }
        const sRes = await fetch(`https://api.gbif.org/v1/species/${key}`);
        const s = await sRes.json();
        const parts: string[] = [];
        if (s.kingdom) parts.push(s.kingdom);
        if (s.phylum) parts.push(s.phylum);
        if (s.class) parts.push(s.class);
        if (s.order) parts.push(s.order);
        if (s.family) parts.push(s.family);
        if (s.genus) parts.push(s.genus);
        if (s.species) parts.push(s.species);
        setLineage(parts);
      } catch {
        setLineage([]);
      }
    };
    go();
  }, [name]);
  if (!lineage.length) return null;
  return (
    <div className="text-[#5B7280] text-xs mb-2 font-mono">Lineage: <span className="text-[#0F766E] font-semibold">{lineage.join(' › ')}</span></div>
  );
}

function StudyView({ selectedProject }: { selectedProject: Project | null }) {
  const [tab, setTab] = useState<'Taxonomy' | 'Otolith' | 'eDNA' | 'Species identification' | 'Notes'>('Taxonomy');
  const [search, setSearch] = useState('');
  return (
    <div className="pt-20 min-h-screen relative bg-[#F7F9FA]">
      <Suspense fallback={null}>
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
          <ReactGlobeComponent dataPoints={[]} onDataPointClick={() => {}} onCameraDistanceChange={undefined} showStarsOnly />
        </div>
      </Suspense>
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center gap-2 mb-6 p-1.5 bg-white rounded-2xl border border-[#D9E2E7] shadow-paper w-fit">
          {(['Taxonomy','Otolith','eDNA','Species identification','Notes'] as const).map(name => (
            <button 
              key={name} 
              onClick={() => setTab(name)} 
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                tab===name 
                  ? 'bg-[#0F766E] text-white shadow-sm' 
                  : 'text-[#5B7280] hover:text-[#0F2A3A] hover:bg-[#EEF3F5]'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#D9E2E7] shadow-paper">
          {tab === 'Taxonomy' && <TaxonomyModule globalSearch={search} />}
          {tab === 'Otolith' && <OtolithModule globalSearch={search} />}
          {tab === 'eDNA' && <EDNAModule globalSearch={search} />}
          {tab === 'Species identification' && <SpeciesIdentificationModule globalSearch={search} />}
          {tab === 'Notes' && <NotesModule selectedProject={selectedProject} />}
        </div>
      </div>
    </div>
  );
}

function TaxonomyModule({ globalSearch }: { globalSearch: string }) {
  const mockTree = {
    Animalia: {
      Chordata: {
        Actinopterygii: {
          Carangidae: {
            Caranx: ['Caranx ignobilis','Caranx melampygus','Caranx sexfasciatus']
          },
          Scombridae: { Thunnus: ['Thunnus albacares','Thunnus obesus','Thunnus thynnus'] },
          Lutjanidae: { Lutjanus: ['Lutjanus campechanus','Lutjanus bohar'] },
          Serranidae: { Epinephelus: ['Epinephelus marginatus','Epinephelus coioides'] }
        },
        Chondrichthyes: {
          Carcharhinidae: { Carcharhinus: ['Carcharhinus limbatus','Carcharhinus leucas'] }
        }
      }
    }
  } as const;
  const mockDetails: Record<string, { common: string[]; iucn: 'LC'|'NT'|'VU'|'EN'|'CR'; habitats: string[]; lengthCm: [number, number]; diet: string[]; refs: string[]; occurrencesByRegion: { x: string; y: number }[]; images: string[] }>= {
    'Caranx ignobilis': { common: ['Giant trevally'], iucn: 'NT', habitats: ['Coastal','Reef'], lengthCm: [60,170], diet: ['Fish','Crustaceans'], refs: ['FishBase','IUCN 2015'], occurrencesByRegion: [{x:'Indian',y:38},{x:'Pacific',y:55},{x:'Atlantic',y:2}], images: [] },
    'Thunnus albacares': { common: ['Yellowfin tuna'], iucn: 'NT', habitats: ['Pelagic','Open ocean'], lengthCm: [100,239], diet: ['Fish','Squid'], refs: ['FAO','IUCN 2021'], occurrencesByRegion: [{x:'Indian',y:44},{x:'Pacific',y:62},{x:'Atlantic',y:28}], images: [] },
    'Lutjanus campechanus': { common: ['Red snapper'], iucn: 'VU', habitats: ['Reef','Shelf'], lengthCm: [50,100], diet: ['Crustaceans','Fish'], refs: ['NOAA','IUCN 2018'], occurrencesByRegion: [{x:'Atlantic',y:70},{x:'Indian',y:5},{x:'Pacific',y:14}], images: [] },
    'Epinephelus marginatus': { common: ['Dusky grouper'], iucn: 'EN', habitats: ['Reef','Caves'], lengthCm: [60,150], diet: ['Fish','Octopus'], refs: ['IUCN 2020'], occurrencesByRegion: [{x:'Atlantic',y:25},{x:'Mediterranean',y:48},{x:'Indian',y:9}], images: [] },
    'Carcharhinus limbatus': { common: ['Blacktip shark'], iucn: 'VU', habitats: ['Coastal','Estuaries'], lengthCm: [120,200], diet: ['Fish'], refs: ['IUCN 2019'], occurrencesByRegion: [{x:'Atlantic',y:33},{x:'Indian',y:21},{x:'Pacific',y:27}], images: [] }
  };
  const [query, setQuery] = useState('');
  const [path, setPath] = useState<string[]>(['Animalia']);
  const [selected, setSelected] = useState<string | null>(null);
  const [loadingReal, setLoadingReal] = useState(false);
  const [realRank, setRealRank] = useState<string>('');
  const [realSci, setRealSci] = useState<string>('');
  const [realAuth, setRealAuth] = useState<string>('');
  const [realKey, setRealKey] = useState<number | null>(null);
  const [lineageObj, setLineageObj] = useState<LineageItem[] | null>(null);
  const [speciesSummary, setSpeciesSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const level = path.reduce<any>((acc, key) => (acc && acc[key]) || acc, mockTree);
  const entries = Array.isArray(level) ? level.map((n) => ({ key: n, isLeaf: true })) : Object.keys(level || {}).map(k => ({ key: k, isLeaf: Array.isArray((level as any)[k]) }));
  const queryAll = (query || globalSearch).toLowerCase();
  const filtered = queryAll ? entries.filter(e => e.key.toLowerCase().includes(queryAll)) : entries;
  const [favorites, setFavorites] = useState<string[]>([]);

  // Fetch live data from Taxonomy API when a species is selected
  useEffect(() => {
    const fetchTaxon = async (name: string) => {
      try {
        setLoadingReal(true);
        setRealRank(''); 
        setRealSci(''); 
        setRealAuth(''); 
        setRealKey(null);
        setLineageObj(null);
        
        const taxonData = await taxonomyService.getTaxon(name);
        
        // Set key
        setRealKey(taxonData.key);
        
        // Set scientific name and authorship (authorship can be null)
        setRealSci(taxonData.scientificName || name);
        setRealAuth(taxonData.authorship ?? ''); // Use nullish coalescing to handle null properly
        setRealRank(taxonData.rank || '');
        
        // Set lineage (array of LineageItem objects)
        if (taxonData.lineage && taxonData.lineage.length > 0) {
          setLineageObj(taxonData.lineage);
        }
        
        // Fetch species summary from Gemini
        setLoadingSummary(true);
        setSpeciesSummary('');
        try {
          const summary = await geminiService.getSpeciesSummary(
            taxonData.scientificName || name,
            taxonData.rank,
            taxonData.lineage
          );
          setSpeciesSummary(summary);
        } catch (error) {
          console.error('Failed to fetch species summary:', error);
          setSpeciesSummary('Summary not available.');
        } finally {
          setLoadingSummary(false);
        }
      } catch (error) {
        console.error('Failed to fetch taxon data:', error);
      } finally {
        setLoadingReal(false);
      }
    };
    if (selected) fetchTaxon(selected);
  }, [selected]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              setSelected(query.trim());
              setQuery('');
            }
          }}
          placeholder="Enter scientific name (e.g. Thunnus albacares) and press Enter..."
          className="flex-1 min-w-[280px] px-4 py-2.5 bg-[#F7F9FA] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] text-xs focus:border-[#0F766E] focus:outline-none placeholder-[#5B7280] font-mono"
        />
        <button 
          onClick={() => {
            if (query.trim()) {
              setSelected(query.trim());
              setQuery('');
            }
          }}
          className="px-4 py-2.5 bg-[#0F766E] text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-[#0B5F58] hover:shadow-md transition-all"
        >
          Search Taxon
        </button>
        <button 
          onClick={()=>{ setQuery(''); setPath(['Animalia']); setSelected(null); }} 
          className="px-3.5 py-2.5 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] text-xs font-semibold hover:bg-[#E2E8F0] transition-colors"
        >
          Reset
        </button>
        <button 
          onClick={()=>setFavorites([])} 
          className="px-3.5 py-2.5 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] text-xs font-semibold hover:bg-[#E2E8F0] transition-colors"
        >
          Clear Favorites
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column - Taxonomic Lineage */}
        <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-paper lg:col-span-1">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#D9E2E7]">
            <div className="flex-1">
              <div className="text-[#0F2A3A] font-bold text-base italic tracking-wide">
                {(realSci || selected) || 'Taxon Classification'}
                {realAuth && realAuth.trim() && (
                  <span className="text-[#5B7280] font-normal text-xs ml-2 not-italic">{realAuth}</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1.5 font-mono text-[11px]">
                {realKey && (
                  <div className="text-[#5B7280]">GBIF Key: <span className="text-[#0F766E] font-semibold">{realKey}</span></div>
                )}
                {realRank && (
                  <div className="text-[#5B7280]">Rank: <span className="text-[#0F2A3A] uppercase font-bold">{realRank}</span></div>
                )}
              </div>
            </div>
          </div>

          {!selected && (
            <div className="text-[#5B7280] text-xs leading-relaxed py-6 text-center">
              Select or search for a marine species to explore phylogenetic lineage and classification records.
            </div>
          )}

          {selected && (
            <div>
              {lineageObj && lineageObj.length > 0 ? (
                <div className="mb-4">
                  <div className="text-[#5B7280] text-xs font-bold uppercase tracking-wider mb-3">Phylogenetic Hierarchy</div>
                  <div className="relative">
                    {lineageObj.map((item, i) => {
                      const isLast = i === lineageObj.length - 1;
                      return (
                        <div key={`${item.key || i}`} className="relative mb-2">
                          {!isLast && (
                            <div 
                              className="absolute left-3 top-8 w-0.5 h-6 bg-gradient-to-b from-[#0F766E] to-[#0F766E]/20"
                              style={{ marginLeft: '4px' }}
                            />
                          )}
                          <div className="relative flex items-start pl-7">
                            <div className="absolute left-0 top-2 w-2.5 h-2.5 rounded-full bg-[#0F766E] border-2 border-white z-10 shadow-sm" />
                            <div className="absolute left-2.5 top-3 w-4 h-0.5 bg-[#0F766E]/30" />
                            
                            <div
                              className={`group relative z-10 flex-1 flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all text-left ${
                                isLast 
                                  ? 'bg-[#0F766E]/10 border border-[#0F766E]/40 shadow-sm' 
                                  : 'bg-[#F7F9FA] border border-[#D9E2E7] hover:border-[#0F766E]/30'
                              }`}
                              title={`${item.rank}${item.key ? ` (Key: ${item.key})` : ''}`}
                            >
                              <div className="flex-1 flex flex-col min-w-0">
                                <span className="text-[#0F766E] uppercase text-[9px] tracking-wider font-bold">{item.rank}</span>
                                <span className="text-[#0F2A3A] text-xs font-semibold truncate">{item.name}</span>
                                {item.key && (
                                  <span className="text-[#5B7280] text-[10px] font-mono">GBIF Key: {item.key}</span>
                                )}
                              </div>
                              {isLast && (
                                <span className="px-2 py-0.5 rounded bg-[#0F766E] text-white text-[10px] font-bold uppercase tracking-wider">
                                  Current
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-[#5B7280] text-xs mb-3 italic">Lineage information not available</div>
              )}
              {loadingReal && (
                <div className="text-[#5B7280] text-xs mt-3 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border border-[#0F766E] border-t-transparent"></div>
                  <span>Retrieving GBIF taxonomic data...</span>
                </div>
              )}
            </div>
          )}

          {favorites.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#D9E2E7]">
              <div className="text-[#5B7280] text-xs font-bold uppercase tracking-wider mb-2">Bookmarked Species</div>
              <div className="flex flex-wrap gap-1.5">
                {favorites.map(f => (
                  <span key={f} className="px-2.5 py-1 bg-[#EEF3F5] border border-[#D9E2E7] rounded-lg text-[#0F766E] text-xs font-mono font-medium">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column - Species Summary */}
        <div className="bg-white p-6 rounded-2xl border border-[#D9E2E7] shadow-paper lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#D9E2E7]">
            <div className="w-1.5 h-5 bg-[#0F766E] rounded-full"></div>
            <h3 className="text-[#0F2A3A] text-sm font-bold tracking-wide">Ecological Profile & Intelligence Summary</h3>
            {selected && (
              <span className="ml-auto px-2.5 py-0.5 rounded-full bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E] text-[10px] font-mono font-semibold uppercase tracking-wider">
                AI Synthesis
              </span>
            )}
          </div>
          
          {loadingSummary && (
            <div className="flex items-center gap-3 py-12 justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#0F766E] border-t-transparent"></div>
              <div className="text-[#5B7280] text-xs font-medium">Synthesizing species intelligence from oceanic knowledge bases...</div>
            </div>
          )}
          
          {!loadingSummary && speciesSummary && (
            <div className="relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#0F766E] via-[#0369A1] to-transparent rounded-full"></div>
              <div className="pl-5 pr-2">
                <div className="text-[#0F2A3A] text-xs leading-relaxed whitespace-pre-line space-y-3">
                  {speciesSummary.split('\n').map((paragraph, idx) => {
                    if (!paragraph.trim()) return null;
                    return (
                      <p key={idx} className="leading-6">
                        {paragraph.trim()}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {!loadingSummary && !speciesSummary && selected && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#EEF3F5] border border-[#D9E2E7] flex items-center justify-center mb-3 text-[#0F766E]/40">
                <FiFileText className="w-6 h-6" />
              </div>
              <div className="text-[#5B7280] text-xs italic">No summary intelligence available for this taxon.</div>
            </div>
          )}
          
          {!selected && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#EEF3F5] border border-[#D9E2E7] flex items-center justify-center mb-3 text-[#0F766E]/40">
                <FiSearch className="w-6 h-6" />
              </div>
              <div className="text-[#5B7280] text-xs">Search for any marine species above to review comprehensive AI-synthesized ecological summaries.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to format prediction response nicely
const formatPredictionResponse = (response: any): string => {
  if (!response || typeof response !== 'object') {
    return JSON.stringify(response, null, 2);
  }

  const parts: string[] = [];
  
  if (response.scientificName) {
    const name = response.scientificName.replace(/_/g, ' ');
    parts.push(`Scientific Name: ${name}`);
  }
  
  if (response.confidence !== undefined && response.confidence !== null) {
    const confidence = typeof response.confidence === 'number' 
      ? response.confidence.toFixed(2)
      : response.confidence;
    parts.push(`Confidence: ${confidence}%`);
  }
  
  if (response.filename) {
    parts.push(`Filename: ${response.filename}`);
  }
  
  if (parts.length === 0) {
    return Object.entries(response)
      .map(([key, value]) => {
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
        return `${formattedKey}: ${value}`;
      })
      .join('\n');
  }
  
  return parts.join('\n');
};

function OtolithModule({ globalSearch }: { globalSearch: string }) {
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [measurements, setMeasurements] = useState<{ file: string; lengthMm: number; widthMm: number }[]>([]);
  const [aiGuess, setAiGuess] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1.0);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [annotate, setAnnotate] = useState<boolean>(false);
  const [edgeView, setEdgeView] = useState<boolean>(false);
  const [clicks, setClicks] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [allPaths, setAllPaths] = useState<{ x: number; y: number }[][]>([]);

  const onUpload = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const newImages: string[] = [];
    const newFiles: File[] = [];
    arr.forEach(f => {
      const url = URL.createObjectURL(f);
      newImages.push(url);
      newFiles.push(f);
    });
    setImages(prev => [...prev, ...newImages]);
    setImageFiles(prev => [...prev, ...newFiles]);
    if (activeIdx === -1 && arr.length) setActiveIdx(0);
  };

  const exportCsv = () => {
    const header = 'file,length_mm,width_mm\n';
    const rows = measurements.map(m => `${m.file},${m.lengthMm.toFixed(2)},${m.widthMm.toFixed(2)}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'otolith_measurements.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const clearAnnotations = () => {
    setAllPaths([]);
    setCurrentPath([]);
    setMeasurements([]);
    setIsDrawing(false);
  };

  const downloadAnnotatedImage = async () => {
    if (activeIdx < 0 || !images[activeIdx] || allPaths.length === 0) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const viewerContainer = document.querySelector('[data-viewer-container]') as HTMLElement;
      const viewerImg = viewerContainer?.querySelector('img') as HTMLImageElement;
      
      if (!viewerContainer || !viewerImg) {
        console.error('Could not find viewer elements');
        return;
      }
      
      const containerRect = viewerContainer.getBoundingClientRect();
      const imgRect = viewerImg.getBoundingClientRect();
      
      const displayedWidth = imgRect.width;
      const displayedHeight = imgRect.height;
      const actualWidth = img.width;
      const actualHeight = img.height;
      
      const scaleX = actualWidth / displayedWidth;
      const scaleY = actualHeight / displayedHeight;
      
      const offsetX = imgRect.left - containerRect.left;
      const offsetY = imgRect.top - containerRect.top;
      
      const canvas = document.createElement('canvas');
      canvas.width = actualWidth;
      canvas.height = actualHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(img, 0, 0);
      
      if (edgeView) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const gray = (r + g + b) / 3;
          data[i] = Math.min(255, gray * 1.5);
          data[i + 1] = Math.min(255, gray * 1.5);
          data[i + 2] = Math.min(255, gray * 1.5);
        }
        ctx.putImageData(imageData, 0, 0);
      }
      
      ctx.strokeStyle = '#0F766E';
      ctx.lineWidth = Math.max(2, 2 * Math.max(scaleX, scaleY));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      allPaths.forEach(path => {
        if (path.length < 2) return;
        ctx.beginPath();
        const startX = (path[0].x - offsetX) * scaleX;
        const startY = (path[0].y - offsetY) * scaleY;
        ctx.moveTo(startX, startY);
        for (let i = 1; i < path.length; i++) {
          const x = (path[i].x - offsetX) * scaleX;
          const y = (path[i].y - offsetY) * scaleY;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const fileName = imageFiles[activeIdx]?.name || `otolith_annotated_${activeIdx + 1}.png`;
        a.href = url;
        a.download = fileName.replace(/\.[^/.]+$/, '') + '_annotated.png';
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    
    img.src = images[activeIdx];
  };

  const handleRunAIGuess = async () => {
    if (activeIdx < 0 || !imageFiles[activeIdx]) {
      setAiGuess('Error: Please select an image first');
      return;
    }

    setIsLoadingAI(true);
    setAiGuess('');

    try {
      const activeFile = imageFiles[activeIdx];
      let response;
      try {
        response = await otolithService.predict(activeFile, { useFileUpload: true });
      } catch (fileError) {
        console.log('File upload failed, trying base64 format...');
        const base64String = await otolithService.imageToBase64(activeFile);
        response = await otolithService.predict(base64String);
      }

      if ('detail' in response && Array.isArray(response.detail)) {
        const errorMessages = response.detail.map((err: any) => {
          const loc = Array.isArray(err.loc) ? err.loc.join('.') : 'unknown';
          const msg = err.msg || err.type || 'Validation error';
          return `${loc}: ${msg}`;
        }).join('\n');
        setAiGuess(`API Validation Error (422):\nThe API rejected the request format.\n\nDetails:\n${errorMessages}\n\nPlease check the API documentation for the correct input format.`);
      } else {
        let formattedText = '';
        if (typeof response === 'string') {
          try {
            const parsed = JSON.parse(response);
            formattedText = formatPredictionResponse(parsed);
          } catch {
            formattedText = response;
          }
        } else if (typeof response === 'object' && response !== null) {
          formattedText = formatPredictionResponse(response);
        } else {
          formattedText = JSON.stringify(response, null, 2);
        }
        setAiGuess(formattedText);
      }
    } catch (error: any) {
      console.error('Otolith API error:', error);
      setAiGuess(`Error: ${error.message || 'Failed to get prediction from API. Please check the API endpoint format.'}`);
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-paper">
        <div className="flex flex-wrap items-center gap-3">
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={(e)=>onUpload(e.target.files)} 
            className="text-[#0F2A3A] text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0F766E] file:text-white file:cursor-pointer hover:file:bg-[#0B5F58] transition-all" 
          />
          <button 
            onClick={handleRunAIGuess} 
            disabled={isLoadingAI || activeIdx < 0 || !imageFiles[activeIdx]}
            className="px-4 py-2 bg-[#0F766E] text-white font-bold rounded-xl text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0B5F58] hover:shadow-md transition-all"
          >
            {isLoadingAI ? 'Analyzing...' : 'Run AI Guess'}
          </button>
          <div className="flex items-center gap-2 bg-[#F7F9FA] px-3 py-1.5 rounded-xl border border-[#D9E2E7]">
            <label className="text-[#5B7280] text-xs font-medium">Calibration (px/mm):</label>
            <input 
              type="number" 
              step={0.1} 
              value={scale} 
              onChange={(e)=>setScale(Number(e.target.value)||1)} 
              className="w-20 px-2 py-1 bg-white border border-[#D9E2E7] rounded-lg text-[#0F2A3A] text-xs font-mono num-tabular focus:border-[#0F766E] focus:outline-none" 
            />
          </div>
          <button 
            onClick={()=>setAnnotate(a=>!a)} 
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border uppercase tracking-wider ${
              annotate 
                ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-sm' 
                : 'bg-[#EEF3F5] border-[#D9E2E7] text-[#0F2A3A] hover:bg-[#E2E8F0]'
            }`}
          >
            {annotate ? 'Annotate: ON' : 'Annotate: OFF'}
          </button>
          <button 
            onClick={()=>setEdgeView(v=>!v)} 
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border uppercase tracking-wider ${
              edgeView 
                ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-sm' 
                : 'bg-[#EEF3F5] border-[#D9E2E7] text-[#0F2A3A] hover:bg-[#E2E8F0]'
            }`}
          >
            {edgeView ? 'Edge View: ON' : 'Normal View'}
          </button>
          {annotate && (
            <>
              <button 
                onClick={clearAnnotations} 
                className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-[#B91C1C] text-xs font-semibold hover:bg-red-100 transition-colors"
              >
                Clear Annotations
              </button>
              <button 
                onClick={downloadAnnotatedImage} 
                disabled={activeIdx < 0 || allPaths.length === 0} 
                className="px-3 py-2 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#E2E8F0] transition-colors"
              >
                Download Annotated
              </button>
            </>
          )}
          <button 
            onClick={exportCsv} 
            className="px-3 py-2 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] text-xs font-semibold hover:bg-[#E2E8F0] transition-colors ml-auto"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Thumbnails */}
        <div className="bg-white p-4 rounded-2xl border border-[#D9E2E7] shadow-paper max-h-[440px] overflow-auto grid grid-cols-3 gap-3 lg:col-span-1">
          {images.map((src, i) => (
            <div 
              key={i} 
              onClick={()=>setActiveIdx(i)} 
              className={`relative rounded-xl overflow-hidden border cursor-pointer transition-all aspect-square bg-[#F7F9FA] ${
                activeIdx===i 
                  ? 'border-[#0F766E] ring-2 ring-[#0F766E]/40 shadow-md' 
                  : 'border-[#D9E2E7] hover:border-[#0F766E]/50'
              }`}
            >
              <img src={src} alt="otolith" className="w-full h-full object-cover" />
            </div>
          ))}
          {!images.length && (
            <div className="text-[#5B7280] text-xs col-span-3 text-center py-12 flex flex-col items-center">
              <FiImage className="w-8 h-8 mb-2 opacity-40 text-[#0F766E]" />
              <span>Upload otolith specimen imagery to inspect and measure.</span>
            </div>
          )}
        </div>

        {/* Viewer */}
        <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-paper lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D9E2E7]">
            <h4 className="text-[#0F2A3A] font-bold text-sm tracking-wide">Specimen Micrograph Viewer</h4>
            {measurements.length > 0 && (
              <span className="text-[#0F766E] text-xs font-mono font-semibold">
                {measurements.length} measurement{measurements.length > 1 ? 's' : ''} recorded
              </span>
            )}
          </div>
          {activeIdx >= 0 ? (
            <div className="relative w-full h-[340px] rounded-xl overflow-hidden border border-[#D9E2E7] bg-[#F7F9FA] shadow-inner" data-viewer-container>
              <img src={images[activeIdx]} alt="Otolith specimen micrograph" className={`absolute inset-0 w-full h-full object-contain ${edgeView ? 'filter contrast-150 brightness-110 saturate-0' : ''}`} />
              {annotate && (
                <div
                  className="absolute inset-0 cursor-crosshair"
                  onMouseDown={(e) => {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    setIsDrawing(true);
                    setCurrentPath([{ x, y }]);
                  }}
                  onMouseMove={(e) => {
                    if (!isDrawing) return;
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    setCurrentPath(prev => [...prev, { x, y }]);
                  }}
                  onMouseUp={(e) => {
                    if (!isDrawing) return;
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const finalPath = [...currentPath, { x, y }];
                    
                    // Calculate total path length
                    let totalLength = 0;
                    for (let i = 1; i < finalPath.length; i++) {
                      const dx = finalPath[i].x - finalPath[i - 1].x;
                      const dy = finalPath[i].y - finalPath[i - 1].y;
                      totalLength += Math.sqrt(dx * dx + dy * dy);
                    }
                    const mm = totalLength / (scale || 1);
                    
                    if (finalPath.length > 1 && mm > 0) {
                      setMeasurements(prev => {
                        const file = `image_${activeIdx+1}`;
                        return [...prev, { file, lengthMm: mm, widthMm: 0 }];
                      });
                    }
                    
                    setAllPaths(prev => [...prev, finalPath]);
                    setIsDrawing(false);
                    setCurrentPath([]);
                  }}
                  onMouseLeave={() => {
                    if (isDrawing) {
                      setIsDrawing(false);
                      setCurrentPath([]);
                    }
                  }}
                >
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {allPaths.map((path, pathIdx) => (
                      <polyline
                        key={pathIdx}
                        points={path.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke="#0F766E"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                    {currentPath.length > 1 && (
                      <polyline
                        points={currentPath.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke="#0F766E"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </svg>
                </div>
              )}
            </div>
          ) : (
            <div className="text-[#5B7280] text-xs text-center py-20 flex flex-col items-center">
              <FiImage className="w-10 h-10 mb-2 opacity-30 text-[#0F766E]" />
              <span>Select an otolith thumbnail to inspect rings, annotate, and calibrate.</span>
            </div>
          )}

          {/* AI Prediction Result Box */}
          {aiGuess && (
            <div className="p-4 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl">
              <div className="flex items-center gap-2 text-[#0F766E] font-bold text-xs uppercase tracking-wider mb-2.5">
                <div className="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse" />
                <span>AI Morphological Prediction</span>
              </div>
              <div className="text-[#0F2A3A] text-xs whitespace-pre-wrap space-y-1.5 font-mono">
                {aiGuess.split('\n').map((line, idx) => {
                  if (line.includes(':')) {
                    const [key, ...valueParts] = line.split(':');
                    const value = valueParts.join(':').trim();
                    return (
                      <div key={idx} className="flex flex-wrap gap-2">
                        <span className="text-[#5B7280] font-semibold min-w-[140px]">{key}:</span>
                        <span className="text-[#0F2A3A] font-bold">{value}</span>
                      </div>
                    );
                  }
                  if (line.toLowerCase().includes('error')) {
                    return (
                      <div key={idx} className="text-[#B91C1C] font-medium">{line}</div>
                    );
                  }
                  return (
                    <div key={idx} className="text-[#5B7280]">{line}</div>
                  );
                })}
              </div>
            </div>
          )}
          {isLoadingAI && !aiGuess && (
            <div className="p-4 text-[#5B7280] text-xs flex items-center gap-2.5">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0F766E] border-t-transparent"></div>
              <span>Computing neural ring morphological classification...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EDNAModule({ globalSearch }: { globalSearch: string }) {
  const [fasta, setFasta] = useState<string>('');
  const [results, setResults] = useState<Array<EDNAMatchResponse & { header: string }>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const parseFasta = (text: string) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    const entries: { header: string; seq: string }[] = [];
    
    const hasHeaders = lines.some(l => l.startsWith('>'));
    
    if (!hasHeaders) {
      const sequence = lines.join('').toUpperCase().replace(/[^ACGTN]/gi, '').trim();
      if (sequence) {
        entries.push({ 
          header: 'sequence_1', 
          seq: sequence 
        });
      }
      return entries;
    }
    
    let header = '';
    let seq: string[] = [];
    for (const l of lines) {
      if (!l.trim()) continue;
      if (l.startsWith('>')) {
        if (header) {
          entries.push({ 
            header: header || `sequence_${entries.length + 1}`, 
            seq: seq.join('').toUpperCase().replace(/[^ACGTN]/gi, '') 
          });
        }
        header = l.slice(1).trim() || `sequence_${entries.length + 2}`;
        seq = [];
      } else {
        seq.push(l.trim());
      }
    }
    if (header || seq.length > 0) {
      entries.push({ 
        header: header || `sequence_${entries.length + 1}`, 
        seq: seq.join('').toUpperCase().replace(/[^ACGTN]/gi, '') 
      });
    }
    return entries;
  };

  const runMatch = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const entries = parseFasta(fasta);
      
      if (entries.length === 0) {
        setError('No valid sequences found. Please paste FASTA format or upload a file.');
        return;
      }

      const apiResults: Array<EDNAMatchResponse & { header: string }> = [];
      
      for (const entry of entries) {
        if (!entry.seq || entry.seq.length === 0) {
          setError(`Invalid sequence in ${entry.header || 'sequence'}`);
          continue;
        }

        try {
          const matchResult = await ednaService.matchSequence(entry.seq);
          apiResults.push({
            ...matchResult,
            header: entry.header || 'sequence',
          });
        } catch (apiError: any) {
          setError(`Error processing ${entry.header || 'sequence'}: ${apiError.message || 'API request failed'}`);
        }
      }

      setResults(apiResults);
    } catch (err: any) {
      setError(err.message || 'Failed to process sequences');
      console.error('eDNA matching error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSample = () => setFasta(`>read1\nATGCTACTGTTATTAATTCGAGCTGAATTAGGTCAACCTGGGTTT\n>read2\nATGCTGCTGTCATTGATTCGAGCAGAATTAGGTCAACCTGGCCTT`);

  const onUploadFile = async (fileList: FileList | null) => {
    if (!fileList || !fileList.length) return;
    const file = fileList[0];
    const text = await file.text();
    setFasta(text);
  };

  const exportCsv = () => {
    const header = 'header,raw_sequence,marker_type,sequence_length,top_match_scientificName,top_match_confidence,num_matches,num_reference_sequences\n';
    const rows = results.map(r => 
      `${r.header || ''},${r.raw_sequence || ''},${r.marker_type || ''},${r.sequence_length || 0},${r.summary?.top_match_scientificName || ''},${r.summary?.confidence || 0},${r.matches?.length || 0},${r.summary?.num_reference_sequences_compared || 0}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = 'edna_results.csv'; 
    a.click(); 
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-paper">
        <div className="flex flex-wrap items-start gap-4">
          <textarea 
            value={fasta} 
            onChange={(e)=>setFasta(e.target.value)} 
            placeholder=">read1\nATGC...\n>read2\nATGC..." 
            className="flex-1 min-w-[300px] h-40 px-4 py-3 bg-[#F7F9FA] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] text-xs font-mono focus:border-[#0F766E] focus:outline-none placeholder-[#5B7280] leading-relaxed" 
          />
          <div className="flex flex-col gap-2 min-w-[200px]">
            <input 
              type="file" 
              accept=".fa,.fasta,.txt" 
              onChange={(e)=>onUploadFile(e.target.files)} 
              className="text-[#0F2A3A] text-xs file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0F766E] file:text-white file:cursor-pointer" 
            />
            <button 
              onClick={loadSample} 
              className="px-3.5 py-2 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] text-xs font-semibold hover:bg-[#E2E8F0] transition-colors"
            >
              Load Sample FASTA
            </button>
            <button 
              onClick={runMatch} 
              disabled={loading || !fasta.trim()} 
              className="px-3.5 py-2.5 bg-[#0F766E] text-white font-bold rounded-xl text-xs uppercase tracking-wider disabled:opacity-50 hover:bg-[#0B5F58] hover:shadow-md transition-all"
            >
              {loading ? 'Matching...' : 'Match Sequences'}
            </button>
            <button 
              onClick={exportCsv} 
              disabled={!results.length} 
              className="px-3.5 py-2 bg-[#EEF3F5] border border-[#D9E2E7] rounded-xl text-[#0F2A3A] text-xs font-semibold disabled:opacity-50 hover:bg-[#E2E8F0] transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#B91C1C] animate-pulse" />
          <div className="text-[#B91C1C] text-xs font-medium">{error}</div>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-paper">
        <h4 className="text-[#0F2A3A] font-bold text-sm mb-3 tracking-wide">Sequence Alignment & BLAST Results</h4>
        {!results.length && !loading && (
          <div className="text-[#5B7280] text-xs text-center py-12">
            Paste FASTA sequences above or upload a .fasta file, then click Match Sequences.
          </div>
        )}
        {loading && !results.length && (
          <div className="text-[#5B7280] text-xs text-center py-12 flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0F766E] border-t-transparent"></div>
            <span>Aligning sequences against reference marine genetic databases...</span>
          </div>
        )}
        {results.length > 0 && (
          <div className="space-y-4">
            {results
              .filter(r => 
                !globalSearch || 
                r.summary?.top_match_scientificName?.toLowerCase().includes(globalSearch.toLowerCase()) || 
                r.header.toLowerCase().includes(globalSearch.toLowerCase()) ||
                r.marker_type?.toLowerCase().includes(globalSearch.toLowerCase())
              )
              .map((r, i) => (
                <div key={i} className="p-5 rounded-2xl border border-[#D9E2E7] bg-[#F7F9FA]">
                  {/* Summary Section */}
                  <div className="mb-3 pb-3 border-b border-[#D9E2E7]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[#0F2A3A] font-bold text-sm">{r.header || `Sequence ${i + 1}`}</div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        {r.marker_type && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#0F766E]/10 border border-[#0F766E]/20 text-[#0F766E] font-bold uppercase text-[10px]">
                            {r.marker_type}
                          </span>
                        )}
                        <span className="text-[#5B7280] num-tabular">Length: {r.sequence_length || 0} bp</span>
                      </div>
                    </div>
                    {r.summary && (
                      <div className="mt-2 bg-white p-3 rounded-xl border border-[#D9E2E7]">
                        <div className="text-[#5B7280] text-[10px] uppercase font-bold tracking-wider mb-0.5">Top Identified Match</div>
                        <div className="text-[#0F2A3A] font-bold text-sm italic">{r.summary.top_match_scientificName || 'No match found'}</div>
                        <div className="text-[#5B7280] text-xs mt-1 font-mono">
                          Specimen ID: <span className="text-[#0F766E] font-semibold">{r.summary.top_match_specimen_id || '-'}</span> • {r.summary.num_reference_sequences_compared || 0} reference sequences compared
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Matches Section */}
                  {r.matches && r.matches.length > 0 && (
                    <div>
                      <div className="text-[#0F2A3A] text-xs font-bold uppercase tracking-wider mb-2">Reference Alignments ({r.matches.length})</div>
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-[#D9E2E7] bg-white">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-[#EEF3F5] border-b border-[#D9E2E7] z-10">
                            <tr>
                              <th className="text-left text-[#0F2A3A] font-semibold py-2 px-3 uppercase tracking-wider text-[10px]">Specimen ID</th>
                              <th className="text-left text-[#0F2A3A] font-semibold py-2 px-3 uppercase tracking-wider text-[10px]">Scientific Name</th>
                              <th className="text-left text-[#0F2A3A] font-semibold py-2 px-3 uppercase tracking-wider text-[10px]">Ref. Length</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5ECEF] font-mono num-tabular">
                            {r.matches.map((match, idx) => (
                              <tr key={idx} className="hover:bg-[#0F766E]/5 transition-colors">
                                <td className="py-2 px-3 text-[#0F766E] text-[11px] font-semibold">{match.specimen_id || '-'}</td>
                                <td className="py-2 px-3 text-[#0F2A3A] italic">{match.scientificName || '-'}</td>
                                <td className="py-2 px-3 text-[#5B7280]">{match.reference_length || '-'} bp</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}




