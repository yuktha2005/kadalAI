import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiMaximize2, FiMinimize2, FiPenTool, FiX, FiPlus, FiSave, FiEdit2, FiTrash2, FiFileText, FiDownload, FiCheck } from 'react-icons/fi';
import SearchWorldMap from './ui/search-world-map';
import ReactGlobeComponent from './ReactGlobeComponent';
import { DataPoint, Project } from '../App';
import studyNotesService from '../services/studyNotesService';
import { MarineDataRecord, DataType } from '../services/ragService';
import { generateExecutiveReport } from '../lib/executiveReportGenerator';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  RadialLinearScale,
} from 'chart.js';
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  RadialLinearScale,
);

export interface SearchResultSummary {
  scientificName: string;
  description?: string;
  locality?: string;
  basisOfRecord?: string;
  minDepthInMeters?: number | null;
  maxDepthInMeters?: number | null;
  coordinates?: { lat: number; lng: number } | null;
  occurrencesByYear?: Array<{ year: number; count: number }>; // from eventDate
  depthHistogram?: Array<{ depth: number; count: number }>;
  // RAG-specific fields
  ragAnswer?: string;
  ragOccurrences?: MarineDataRecord[]; // Now supports all data types
  ragSourcesCount?: number;
  ragQueryTime?: number;
  dashboardSummary?: {
    executive_summary: string;
    key_findings: string[];
    species_analysis: string;
    geographic_distribution: string;
    depth_analysis: string;
    temporal_patterns: string;
    research_insights: string;
  };
}

interface SearchResultsViewProps {
  result: SearchResultSummary;
  onViewOnGlobe?: () => void;
  onBack?: () => void;
  selectedProject?: Project | null;
}

const cardClass =
  'bg-white rounded-2xl p-6 border border-[#D9E2E7] shadow-[0_1px_2px_rgba(15,42,58,0.06),0_8px_24px_rgba(15,42,58,0.06)] hover:border-[#0F766E]/40 transition-all duration-200';

const headingClass = 'text-2xl md:text-3xl font-extrabold text-[#0F2A3A] tracking-tight font-display';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-[#5B7280]';
const valueClass = 'text-sm text-[#0F2A3A] font-semibold num-tabular';

const SearchResultsView: React.FC<SearchResultsViewProps> = ({ result, onViewOnGlobe, onBack, selectedProject }) => {
  const [showNotesPanel, setShowNotesPanel] = useState<boolean>(false);
  const [notesPanelNotes, setNotesPanelNotes] = useState<any[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [selectedPanelNote, setSelectedPanelNote] = useState<any | null>(null);
  const [isCreatingPanelNote, setIsCreatingPanelNote] = useState(false);
  const [panelNoteTitle, setPanelNoteTitle] = useState('');
  const [panelNoteContent, setPanelNoteContent] = useState('');
  const [savingPanelNote, setSavingPanelNote] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleDownloadExecutiveReport = () => {
    setIsExportingPDF(true);
    try {
      generateExecutiveReport(result, {
        projectName: selectedProject?.title || 'National Marine Investigation',
        authorName: 'Kadal AI Oceanographic Research Center',
        department: 'CMLRE - MoES'
      });
    } catch (e) {
      console.error('Failed to generate PDF:', e);
    } finally {
      setTimeout(() => setIsExportingPDF(false), 800);
    }
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
  // Debug: Log the result to see what we're receiving - USE console.error to ensure visibility
  console.error('🔍 SearchResultsView RENDERED - Received result:', {
    hasRagOccurrences: result.ragOccurrences?.length || 0,
    hasDashboardSummary: !!result.dashboardSummary,
    ragSourcesCount: result.ragSourcesCount,
    scientificName: result.scientificName,
    dashboardSummaryPreview: result.dashboardSummary ? {
      hasExecutiveSummary: !!result.dashboardSummary.executive_summary,
      hasKeyFindings: !!result.dashboardSummary.key_findings,
      keyFindingsCount: result.dashboardSummary.key_findings?.length || 0
    } : null
  });
  console.error('🔍 SearchResultsView - Full dashboardSummary:', result.dashboardSummary);
  console.error('🔍 SearchResultsView - Full ragOccurrences (first 3):', result.ragOccurrences?.slice(0, 3));
  
  // Additional debug: Check if dashboardSummary has the expected structure
  if (result.dashboardSummary) {
    console.error('✅ SearchResultsView - dashboardSummary structure:', {
      hasExecutiveSummary: !!result.dashboardSummary.executive_summary,
      executiveSummaryLength: result.dashboardSummary.executive_summary?.length || 0,
      hasKeyFindings: Array.isArray(result.dashboardSummary.key_findings),
      keyFindingsLength: result.dashboardSummary.key_findings?.length || 0,
      allKeys: Object.keys(result.dashboardSummary)
    });
  } else {
    console.error('❌ SearchResultsView - dashboardSummary is NULL/UNDEFINED');
  }

  const {
    scientificName,
    description,
    locality,
    minDepthInMeters,
    maxDepthInMeters,
    coordinates,
    occurrencesByYear = [],
    depthHistogram = [],
    ragAnswer,
    ragOccurrences = [],
    ragSourcesCount,
    ragQueryTime,
    dashboardSummary,
  } = result;

  // Chart zoom state management
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const [isZoomMode, setIsZoomMode] = useState(false);

  // ===== PROCESS RAG DATA FIRST =====
  // Group records by data type
  const recordsByType: { [key in DataType]?: MarineDataRecord[] } = {
    OCCURRENCE: [],
    CTD: [],
    AWS: [],
    ADCP: [],
  };
  
  ragOccurrences.forEach(record => {
    const dataType = (record.dataType || 'OCCURRENCE') as DataType;
    if (recordsByType[dataType]) {
      recordsByType[dataType]!.push(record);
    } else {
      recordsByType.OCCURRENCE!.push(record); // Default fallback
    }
  });
  
  // Generate water body distribution from RAG data (all types)
  const waterBodyCounts: { [key: string]: number } = {};
  ragOccurrences.forEach(occ => {
    const wb = occ.waterBody || 'Unknown';
    waterBodyCounts[wb] = (waterBodyCounts[wb] || 0) + 1;
  });
  const waterBodyLabels = Object.keys(waterBodyCounts);
  const waterBodyData = Object.values(waterBodyCounts);
  
  // Generate sampling method distribution
  const samplingCounts: { [key: string]: number } = {};
  ragOccurrences.forEach(occ => {
    const method = occ.samplingProtocol || 'Unknown';
    samplingCounts[method] = (samplingCounts[method] || 0) + 1;
  });
  const samplingLabels = Object.keys(samplingCounts);
  const samplingData = Object.values(samplingCounts);
  
  // Generate seasonal distribution from RAG data (by quarter)
  const seasonalCounts: { [quarter: string]: number } = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  ragOccurrences.forEach(occ => {
    if (occ.eventDate) {
      try {
        const date = new Date(occ.eventDate);
        const month = date.getMonth() + 1; // 1-12
        if (month >= 1 && month <= 3) seasonalCounts.Q1++;
        else if (month >= 4 && month <= 6) seasonalCounts.Q2++;
        else if (month >= 7 && month <= 9) seasonalCounts.Q3++;
        else if (month >= 10 && month <= 12) seasonalCounts.Q4++;
      } catch (e) {
        // Invalid date, skip
      }
    }
  });
  
  // Generate depth distribution by bins
  const depthBins = [0, 5, 10, 20, 50, 100, 1000];
  const depthBinCounts = new Array(depthBins.length - 1).fill(0);
  ragOccurrences.forEach(occ => {
    const avgDepth = occ.minimumDepthInMeters || occ.maximumDepthInMeters;
    if (avgDepth !== undefined && avgDepth !== null) {
      for (let i = 0; i < depthBins.length - 1; i++) {
        if (avgDepth >= depthBins[i] && (i === depthBins.length - 2 || avgDepth < depthBins[i + 1])) {
          depthBinCounts[i]++;
          break;
        }
      }
    }
  });
  
  // Generate research institutions from identifiedBy
  const institutionCounts: { [key: string]: number } = {};
  
  // Helper function to check if a string is a date
  const isDate = (str: string): boolean => {
    // Check for common date patterns: YYYY-MM-DD, YYYY/MM/DD, etc.
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
      /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
      /^\d{2}-\d{2}-\d{4}$/,  // MM-DD-YYYY
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    ];
    return datePatterns.some(pattern => pattern.test(str.trim()));
  };
  
  // Helper function to extract institution name from identifiedBy field
  const extractInstitution = (identifiedBy: string): string | null => {
    if (!identifiedBy || identifiedBy.trim() === '') return null;
    
    // Remove leading/trailing whitespace
    const cleaned = identifiedBy.trim();
    
    // Skip if it's just a date
    if (isDate(cleaned)) return null;
    
    // Common patterns for identifiedBy:
    // 1. "Last, First" or "Last, First Middle" - extract last name as identifier
    // 2. "Institution Name" - use as is
    // 3. "Last, First | Institution" - extract institution
    // 4. "Institution | Last, First" - extract institution
    
    // Check if it contains a pipe (|) - often separates person from institution
    if (cleaned.includes('|')) {
      const parts = cleaned.split('|').map(p => p.trim());
      // Usually institution is first or last part
      for (const part of parts) {
        if (!isDate(part) && part.length > 3) {
          // If it looks like an institution (has spaces, capital letters, etc.)
          if (part.includes(' ') || part.match(/[A-Z][a-z]+/)) {
            return part;
          }
        }
      }
    }
    
    // Check if it's a comma-separated name (Last, First format)
    if (cleaned.includes(',')) {
      const parts = cleaned.split(',').map(p => p.trim());
      // If first part looks like a name (no spaces, starts with capital), use it
      // Otherwise, might be "Institution, Department" format
      if (parts[0] && !isDate(parts[0])) {
        // If it has spaces, it's likely an institution name
        if (parts[0].includes(' ')) {
          return parts[0];
        }
        // Otherwise, it might be a person's last name - skip or use as identifier
        // For now, skip person names and look for institution patterns
        if (parts.length > 1 && parts[1] && parts[1].includes(' ')) {
          // Might be "Institution, Department" format
          return parts[0];
        }
        // If it's just a name, use it as identifier (better than nothing)
        return parts[0];
      }
    }
    
    // If it contains common institution keywords, use it
    const institutionKeywords = ['university', 'institute', 'college', 'museum', 'laboratory', 'lab', 'center', 'centre', 'research', 'department', 'school'];
    const lowerCleaned = cleaned.toLowerCase();
    if (institutionKeywords.some(keyword => lowerCleaned.includes(keyword))) {
      return cleaned;
    }
    
    // If it's a single word and not a date, might be an identifier or institution code
    if (!cleaned.includes(' ') && !isDate(cleaned) && cleaned.length > 2) {
      return cleaned;
    }
    
    // If it has multiple words and doesn't look like a date, use it
    if (cleaned.includes(' ') && !isDate(cleaned)) {
      return cleaned;
    }
    
    // Skip if it's just a date or doesn't look like an institution
    return null;
  };
  
  ragOccurrences.forEach(occ => {
    if (occ.identifiedBy) {
      const institution = extractInstitution(occ.identifiedBy);
      if (institution) {
        institutionCounts[institution] = (institutionCounts[institution] || 0) + 1;
      }
    }
  });
  
  // Sort by count (descending) and take top 5
  const institutionLabels = Object.entries(institutionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);
  const institutionData = institutionLabels.map(l => institutionCounts[l]);
  
  // Generate conservation trends (occurrences by year from RAG data)
  const yearCounts: { [year: number]: number } = {};
  ragOccurrences.forEach(occ => {
    if (occ.eventDate) {
      try {
        const year = new Date(occ.eventDate).getFullYear();
        if (!isNaN(year)) {
          yearCounts[year] = (yearCounts[year] || 0) + 1;
        }
      } catch (e) {
        // Skip invalid dates
      }
    }
  });
  const trendYears = Object.keys(yearCounts).map(Number).sort().slice(-7); // Last 7 years
  const trendData = trendYears.map(year => yearCounts[year] || 0);

  // Generate monthly distribution for temperature profile
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const avgDepth = ragOccurrences
    .map(o => o.minimumDepthInMeters || o.maximumDepthInMeters)
    .filter(d => d !== undefined && d !== null) as number[];
  const surfaceTemp = monthNames.map((_, month) => {
    // Rough estimate: 26-30°C for Indian Ocean, with seasonal variation
    const baseTemp = 28;
    const seasonal = Math.sin((month / 12) * 2 * Math.PI - Math.PI / 2) * 2; // Seasonal variation
    return baseTemp + seasonal;
  });
  const deepTemp = avgDepth.length > 0 
    ? monthNames.map(() => Math.max(4, 8 - (Math.max(...avgDepth) / 1000))) // Deeper = colder
    : monthNames.map(() => 4.5);

  // ===== GENERATE CHART DATA FROM RAG DATA (PRIMARY SOURCE) =====
  // Generate occurrences by year from RAG data
  const ragOccurrencesByYear = Object.entries(yearCounts)
    .map(([year, count]) => ({ year: parseInt(year), count }))
    .sort((a, b) => a.year - b.year);
  
  // Use RAG data if available, otherwise fallback to props
  const finalOccurrencesByYear = ragOccurrencesByYear.length > 0 
    ? ragOccurrencesByYear 
    : occurrencesByYear;
  
  const years = finalOccurrencesByYear
    .slice()
    .sort((a, b) => a.year - b.year);

  const occurrencesBarData = {
    labels: years.map((d) => String(d.year)),
    datasets: [
      {
        label: 'Occurrences',
        data: years.map((d) => d.count),
        backgroundColor: 'rgba(15, 118, 110, 0.45)', // paper-primary
        borderColor: '#0F766E',
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  // Generate depth histogram from RAG data
  const ragDepthHistogram: Array<{ depth: number; count: number }> = [];
  ragOccurrences.forEach(occ => {
    const depth = occ.minimumDepthInMeters || occ.maximumDepthInMeters;
    if (depth !== undefined && depth !== null) {
      const roundedDepth = Math.round(depth / 10) * 10; // Round to nearest 10m
      const existing = ragDepthHistogram.find(d => d.depth === roundedDepth);
      if (existing) {
        existing.count++;
      } else {
        ragDepthHistogram.push({ depth: roundedDepth, count: 1 });
      }
    }
  });
  
  // Use RAG data if available, otherwise fallback to props
  const finalDepthHistogram = ragDepthHistogram.length > 0 
    ? ragDepthHistogram 
    : depthHistogram;
  
  // Filter depth histogram based on query filter if available
  let filteredDepthHistogram = finalDepthHistogram;
  let depthChartMin: number | undefined = undefined;
  let depthChartMax: number | undefined = undefined;
  
  // If query specified depth range, filter and set x-axis bounds
  if (minDepthInMeters !== null && minDepthInMeters !== undefined && 
      maxDepthInMeters !== null && maxDepthInMeters !== undefined) {
    const queryMin = minDepthInMeters;
    const queryMax = maxDepthInMeters;
    
    // Filter to only show depths within query range (with some padding)
    const padding = (queryMax - queryMin) * 0.1; // 10% padding
    depthChartMin = Math.max(0, queryMin - padding);
    depthChartMax = queryMax + padding;
    
    filteredDepthHistogram = finalDepthHistogram.filter(d => 
      d.depth >= depthChartMin! && d.depth <= depthChartMax!
    );
    
    // If no data in range, create empty bins for the range
    if (filteredDepthHistogram.length === 0 && finalDepthHistogram.length > 0) {
      // Create bins for the query range
      const binSize = Math.max(10, Math.round((queryMax - queryMin) / 10));
      for (let d = Math.floor(queryMin / binSize) * binSize; d <= queryMax; d += binSize) {
        filteredDepthHistogram.push({ depth: d, count: 0 });
      }
    }
  } else {
    // No query filter - use all data, but set reasonable bounds
    if (filteredDepthHistogram.length > 0) {
      const depths = filteredDepthHistogram.map(d => d.depth);
      depthChartMin = Math.max(0, Math.min(...depths) - 50); // 50m padding below
      depthChartMax = Math.max(...depths) + 50; // 50m padding above
    }
  }
  
  const depthSorted = filteredDepthHistogram
    .slice()
    .sort((a, b) => a.depth - b.depth);

  // Create data points for the chart
  // If we have a query filter, use depth as x-axis value (linear scale)
  // Otherwise, use labels (category scale)
  const hasQueryDepthFilter = minDepthInMeters !== null && minDepthInMeters !== undefined && 
                               maxDepthInMeters !== null && maxDepthInMeters !== undefined;

  const depthLineData = hasQueryDepthFilter ? {
    // Use linear scale with depth values as x-axis
    datasets: [
      {
        label: 'Sightings',
        data: depthSorted.map((d) => ({ x: d.depth, y: d.count })),
        fill: true,
        backgroundColor: 'rgba(3, 105, 161, 0.12)', // secondary ocean blue
        borderColor: '#0369A1',
        pointRadius: 3,
        tension: 0.35,
      },
    ],
  } : {
    // Use category scale with labels
    labels: depthSorted.map((d) => `${d.depth}m`),
    datasets: [
      {
        label: 'Sightings',
        data: depthSorted.map((d) => d.count),
        fill: true,
        backgroundColor: 'rgba(3, 105, 161, 0.12)', // secondary ocean blue
        borderColor: '#0369A1',
        pointRadius: 3,
        tension: 0.35,
      },
    ],
  };

  // ===== TYPE-SPECIFIC DATA PROCESSING =====
  // CTD Data Processing
  const ctdRecords = recordsByType.CTD || [];
  const ctdDepthTempData: Array<{ depth: number; temperature: number }> = [];
  const ctdDepthSalinityData: Array<{ depth: number; salinity: number }> = [];
  const ctdDepthOxygenData: Array<{ depth: number; oxygen: number }> = [];
  
  ctdRecords.forEach(record => {
    if (record.depth !== undefined && record.temperature !== undefined) {
      ctdDepthTempData.push({ depth: record.depth, temperature: record.temperature });
    }
    if (record.depth !== undefined && record.salinity !== undefined) {
      ctdDepthSalinityData.push({ depth: record.depth, salinity: record.salinity });
    }
    if (record.depth !== undefined && record.oxygen !== undefined) {
      ctdDepthOxygenData.push({ depth: record.depth, oxygen: record.oxygen });
    }
  });
  
  // Sort by depth for CTD profiles
  ctdDepthTempData.sort((a, b) => a.depth - b.depth);
  ctdDepthSalinityData.sort((a, b) => a.depth - b.depth);
  ctdDepthOxygenData.sort((a, b) => a.depth - b.depth);
  
  // AWS Data Processing
  const awsRecords = recordsByType.AWS || [];
  const awsTimeSeriesData: Array<{ time: string; sst: number; windSpeed: number; airTemp: number }> = [];
  
  awsRecords.forEach((record, idx) => {
    if (record.seaSurfaceTemperature !== undefined || record.windSpeed !== undefined || record.airTemperature !== undefined) {
      awsTimeSeriesData.push({
        time: record.eventDate || `Record ${idx + 1}`,
        sst: record.seaSurfaceTemperature || 0,
        windSpeed: record.windSpeed || 0,
        airTemp: record.airTemperature || 0,
      });
    }
  });
  
  // ADCP Data Processing
  const adcpRecords = recordsByType.ADCP || [];
  const adcpCurrentProfileData: Array<{ depthBin: number; avgSpeed: number; maxSpeed: number }> = [];
  
  // Process ADCP velocity arrays (up to 20 depth bins)
  const maxBins = 20;
  const binSpeeds: { [bin: number]: number[] } = {};
  
  adcpRecords.forEach(record => {
    if (record.magnitudeVelocities && Array.isArray(record.magnitudeVelocities)) {
      record.magnitudeVelocities.forEach((speed, binIdx) => {
        if (speed !== undefined && speed > 0 && binIdx < maxBins) {
          if (!binSpeeds[binIdx]) {
            binSpeeds[binIdx] = [];
          }
          binSpeeds[binIdx].push(speed);
        }
      });
    }
  });
  
  // Calculate average and max for each depth bin
  Object.keys(binSpeeds).forEach(binStr => {
    const bin = parseInt(binStr);
    const speeds = binSpeeds[bin];
    if (speeds.length > 0) {
      const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      const maxSpeed = Math.max(...speeds);
      adcpCurrentProfileData.push({
        depthBin: bin,
        avgSpeed,
        maxSpeed,
      });
    }
  });
  
  adcpCurrentProfileData.sort((a, b) => a.depthBin - b.depthBin);

  const commonChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#0F2A3A',
          font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#FFFFFF',
        titleColor: '#0F2A3A',
        bodyColor: '#5B7280',
        borderColor: '#D9E2E7',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        ticks: { color: '#5B7280', font: { family: 'Plus Jakarta Sans', size: 11 } },
        grid: { color: '#E5ECEF' },
      },
      y: {
        ticks: { color: '#5B7280', font: { family: 'Plus Jakarta Sans', size: 11 } },
        grid: { color: '#E5ECEF' },
      },
    },
  };

  // Water body distribution from RAG data - ONLY use RAG data, no fallbacks
  const waterBodyDistribution = {
    labels: waterBodyLabels.length > 0 ? waterBodyLabels : [],
    datasets: [{
      data: waterBodyData.length > 0 ? waterBodyData : [],
      backgroundColor: [
        '#0F766E',   // primary teal
        '#0369A1',   // secondary blue
        '#D97706',   // amber
        '#E4572E',   // coral
        '#7C3AED',   // purple
      ].slice(0, waterBodyLabels.length),
      borderColor: [
        '#0B5F58',
        '#0284C7',
        '#B45309',
        '#C2410C',
        '#6D28D9',
      ].slice(0, waterBodyLabels.length),
      borderWidth: 1.5,
    }],
  };

  const temperatureProfile = {
    labels: monthNames,
    datasets: [
      {
        label: 'Surface Temp (°C)',
        data: surfaceTemp,
        borderColor: '#0369A1',
        backgroundColor: 'rgba(3, 105, 161, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Deep Temp (°C)',
        data: deepTemp,
        borderColor: '#0F766E',
        backgroundColor: 'rgba(15, 118, 110, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ],
  };

  // Sampling methods from RAG data - ONLY use RAG data, no fallbacks
  const samplingMethods = {
    labels: samplingLabels.length > 0 ? samplingLabels : [],
    datasets: [{
      label: 'Sampling Methods',
      data: samplingData.length > 0 ? samplingData : [],
      backgroundColor: 'rgba(217, 119, 6, 0.65)',
      borderColor: '#D97706',
      borderWidth: 1.5,
      borderRadius: 4,
    }],
  };

  // Environmental factors - Only show if we have RAG data with relevant fields
  // Note: This chart uses estimated values based on data characteristics, not actual measurements
  const environmentalFactors = {
    labels: ['Temperature', 'Salinity', 'Oxygen', 'pH', 'Pressure', 'Currents', 'Turbidity', 'Nutrients'],
    datasets: [{
      label: 'Environmental Impact (Estimated)',
      data: (() => {
        // Calculate based on actual data characteristics from RAG
        const hasDepth = ragOccurrences.some(o => o.minimumDepthInMeters || o.maximumDepthInMeters);
        const hasDates = ragOccurrences.some(o => o.eventDate);
        const hasLocations = ragOccurrences.some(o => o.locality);
        const avgDepth = ragOccurrences
          .map(o => o.minimumDepthInMeters || o.maximumDepthInMeters)
          .filter(d => d !== undefined && d !== null) as number[];
        const depthFactor = avgDepth.length > 0 ? Math.min(100, Math.max(50, (Math.max(...avgDepth) / 50))) : 0;
        
        // Only return data if we have RAG occurrences
        if (ragOccurrences.length === 0) return [0, 0, 0, 0, 0, 0, 0, 0];
        
        return [
          hasDates ? 85 : 50, // Temperature correlation
          hasLocations ? 72 : 50, // Salinity
          hasDepth ? 68 : 50, // Oxygen
          0, // pH (not in RAG data - set to 0 to indicate missing)
          depthFactor, // Pressure (based on depth from RAG)
          0, // Currents (not in RAG data - set to 0 to indicate missing)
          0, // Turbidity (not in RAG data - set to 0 to indicate missing)
          hasDates ? 62 : 50 // Nutrients
        ];
      })(),
      backgroundColor: 'rgba(255, 215, 0, 0.3)',
      borderColor: 'rgba(255, 215, 0, 0.9)',
      pointBackgroundColor: 'rgba(255, 215, 0, 0.9)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(255, 215, 0, 0.9)',
    }],
  };

  // Additional chart data - all from RAG data
  const seasonalDistribution = {
    labels: ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'],
    datasets: [{
      label: 'Occurrences',
      data: [seasonalCounts.Q1, seasonalCounts.Q2, seasonalCounts.Q3, seasonalCounts.Q4],
      backgroundColor: 'rgba(15, 118, 110, 0.5)',
      borderColor: '#0F766E',
      borderWidth: 1.5,
      borderRadius: 4,
    }],
  };

  const depthDistribution = {
    labels: depthBins.slice(0, -1).map((bin, i) => {
      if (i === depthBins.length - 2) return `${bin}m+`;
      return `${bin}-${depthBins[i + 1]}m`;
    }),
    datasets: [{
      label: 'Depth Distribution',
      data: depthBinCounts,
      backgroundColor: 'rgba(3, 105, 161, 0.5)',
      borderColor: '#0369A1',
      borderWidth: 1.5,
      borderRadius: 4,
    }],
  };

  // Research institutions from RAG data - ONLY use RAG data, no fallbacks
  const researchInstitutions = {
    labels: institutionLabels.length > 0 ? institutionLabels : [],
    datasets: [{
      data: institutionData.length > 0 ? institutionData : [],
      backgroundColor: [
        '#0F766E',
        '#0369A1',
        '#D97706',
        '#E4572E',
        '#7C3AED',
      ].slice(0, institutionLabels.length),
      borderColor: [
        '#0B5F58',
        '#0284C7',
        '#B45309',
        '#C2410C',
        '#6D28D9',
      ].slice(0, institutionLabels.length),
      borderWidth: 1.5,
    }],
  };

  // Conservation trends from RAG data - ONLY use RAG data, no fallbacks
  const conservationTrends = {
    labels: trendYears.map(String),
    datasets: [
      {
        label: 'Occurrences',
        data: trendData,
        borderColor: '#0F766E',
        backgroundColor: 'rgba(15, 118, 110, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Trend',
        data: trendData.map((val, i, arr) => {
          // Calculate trend (simple moving average)
          if (i === 0) return val;
          const prev = arr[i - 1];
          return prev > 0 ? (val / prev) * 100 : 100;
        }),
        borderColor: '#0369A1',
        backgroundColor: 'rgba(3, 105, 161, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ],
  };

  // Convert RAG occurrences to DataPoints for visualization
  const ragDataPoints: DataPoint[] = ragOccurrences
    .filter(occ => occ.decimalLatitude && occ.decimalLongitude)
    .map(occ => ({
      scientificName: occ.scientificName || scientificName || 'Unknown',
      locality: occ.locality || 'Unknown',
      eventDate: occ.eventDate || '',
      decimalLatitude: occ.decimalLatitude || 0,
      decimalLongitude: occ.decimalLongitude || 0,
      waterBody: occ.waterBody || '',
      samplingProtocol: occ.samplingProtocol || '',
      minimumDepthInMeters: occ.minimumDepthInMeters || 0,
      maximumDepthInMeters: occ.maximumDepthInMeters || 0,
      identifiedBy: 'RAG Analysis'
    }));

  // Use RAG data if available, otherwise use sample data
  const globePoints: DataPoint[] = ragDataPoints.length > 0 ? ragDataPoints : [
    {
      scientificName: scientificName || 'Unknown',
      locality: locality || 'Unknown',
      eventDate: '',
      decimalLatitude: coordinates?.lat || 0,
      decimalLongitude: coordinates?.lng || 0,
      waterBody: '',
      samplingProtocol: '',
      minimumDepthInMeters: minDepthInMeters || 0,
      maximumDepthInMeters: maxDepthInMeters || 0,
      identifiedBy: 'Analysis'
    }
  ];
  

  // Chart definitions for zoomable layout
  const chartDefinitions = [
    {
      id: 'occurrences-by-year',
      title: 'Occurrences by Year',
      type: 'bar',
      data: occurrencesBarData,
      options: commonChartOptions,
      hasData: years.length > 0 || trendYears.length > 0
    },
    {
      id: 'depth-profile',
      title: 'Depth Profile',
      type: 'line',
      data: depthLineData,
      options: {
        ...commonChartOptions,
        scales: hasQueryDepthFilter ? {
          // Use linear scale when query filter is present
          x: {
            type: 'linear',
            position: 'bottom',
            min: depthChartMin,
            max: depthChartMax,
            ticks: { 
              color: '#9ca3af',
              stepSize: Math.max(10, Math.round((depthChartMax! - depthChartMin!) / 10)),
              callback: function(value: any) {
                return `${Math.round(value)}m`;
              }
            },
            grid: { color: 'rgba(75,85,99,0.2)' },
            title: {
              display: true,
              text: 'Depth (meters)',
              color: '#9ca3af',
              font: { size: 11 }
            }
          },
          y: {
            ...commonChartOptions.scales.y,
            title: {
              display: true,
              text: 'Sightings',
              color: '#9ca3af',
              font: { size: 11 }
            },
            beginAtZero: true
          }
        } : {
          // Use category scale when no query filter
          ...commonChartOptions.scales,
          x: {
            ...commonChartOptions.scales.x,
            title: {
              display: true,
              text: 'Depth (meters)',
              color: '#9ca3af',
              font: { size: 11 }
            }
          },
          y: {
            ...commonChartOptions.scales.y,
            title: {
              display: true,
              text: 'Sightings',
              color: '#9ca3af',
              font: { size: 11 }
            },
            beginAtZero: true
          }
        }
      },
      hasData: depthSorted.length > 0 || depthBinCounts.some(c => c > 0)
    },
    {
      id: 'water-body-distribution',
      title: 'Water Body Distribution',
      type: 'doughnut',
      data: waterBodyDistribution,
      options: {
        ...commonChartOptions,
        plugins: {
          ...commonChartOptions.plugins,
          legend: {
            position: 'bottom' as const,
            labels: { color: '#e5e7eb', padding: 10, font: { size: 10 } }
          }
        }
      },
      hasData: waterBodyLabels.length > 0
    },
    {
      id: 'temperature-profile',
      title: 'Temperature Profile (Estimated)',
      type: 'line',
      data: temperatureProfile,
      options: commonChartOptions,
      hasData: ragOccurrences.length > 0 && (avgDepth.length > 0 || ragOccurrences.some(o => o.minimumDepthInMeters || o.maximumDepthInMeters)) // Only show if we have depth data to estimate from
    },
    {
      id: 'sampling-methods',
      title: 'Sampling Methods',
      type: 'bar',
      data: samplingMethods,
      options: commonChartOptions,
      hasData: samplingLabels.length > 0
    },
    {
      id: 'environmental-factors',
      title: 'Environmental Factors (Estimated)',
      type: 'radar',
      data: environmentalFactors,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#e5e7eb', font: { size: 10 } }
          }
        },
        scales: {
          r: {
            angleLines: { color: 'rgba(75,85,99,0.2)' },
            grid: { color: 'rgba(75,85,99,0.2)' },
            pointLabels: { color: '#9ca3af', font: { size: 10 } },
            ticks: { color: '#9ca3af', backdropColor: 'transparent', font: { size: 8 } }
          }
        }
      },
      hasData: ragOccurrences.length > 0 && environmentalFactors.datasets[0].data.some(v => v > 0)
    },
    {
      id: 'seasonal-distribution',
      title: 'Seasonal Distribution',
      type: 'bar',
      data: seasonalDistribution,
      options: commonChartOptions,
      hasData: Object.values(seasonalCounts).some(c => c > 0)
    },
    {
      id: 'depth-distribution',
      title: 'Depth Distribution',
      type: 'bar',
      data: depthDistribution,
      options: commonChartOptions,
      hasData: depthBinCounts.some(c => c > 0)
    },
    {
      id: 'research-institutions',
      title: 'Research Institutions',
      type: 'doughnut',
      data: researchInstitutions,
      options: {
        ...commonChartOptions,
        plugins: {
          ...commonChartOptions.plugins,
          legend: {
            position: 'bottom' as const,
            labels: { color: '#e5e7eb', padding: 8, font: { size: 9 } }
          }
        }
      },
      hasData: institutionLabels.length > 0
    },
    {
      id: 'conservation-trends',
      title: 'Occurrence Trends',
      type: 'line',
      data: conservationTrends,
      options: commonChartOptions,
      hasData: trendYears.length > 0
    },
    // CTD Charts
    {
      id: 'ctd-temperature-profile',
      title: 'CTD Temperature Profile',
      type: 'line',
      data: {
        datasets: [{
          label: 'Temperature (°C)',
          data: ctdDepthTempData.map(d => ({ x: d.depth, y: d.temperature })),
          borderColor: 'rgba(255, 107, 53, 0.9)',
          backgroundColor: 'rgba(255, 107, 53, 0.2)',
          fill: true,
          tension: 0.4,
        }],
      },
      options: {
        ...commonChartOptions,
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            reverse: true, // Depth increases downward
            title: { display: true, text: 'Depth (m)', color: '#9ca3af' },
            ticks: { color: '#9ca3af' },
            grid: { color: 'rgba(75,85,99,0.2)' },
          },
          y: {
            title: { display: true, text: 'Temperature (°C)', color: '#9ca3af' },
            ticks: { color: '#9ca3af' },
            grid: { color: 'rgba(75,85,99,0.2)' },
          },
        },
      },
      hasData: ctdDepthTempData.length > 0
    },
    {
      id: 'ctd-salinity-profile',
      title: 'CTD Salinity Profile',
      type: 'line',
      data: {
        datasets: [{
          label: 'Salinity (PSU)',
          data: ctdDepthSalinityData.map(d => ({ x: d.depth, y: d.salinity })),
          borderColor: 'rgba(14, 165, 233, 0.9)',
          backgroundColor: 'rgba(14, 165, 233, 0.2)',
          fill: true,
          tension: 0.4,
        }],
      },
      options: {
        ...commonChartOptions,
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            reverse: true,
            title: { display: true, text: 'Depth (m)', color: '#9ca3af' },
            ticks: { color: '#9ca3af' },
            grid: { color: 'rgba(75,85,99,0.2)' },
          },
          y: {
            title: { display: true, text: 'Salinity (PSU)', color: '#9ca3af' },
            ticks: { color: '#9ca3af' },
            grid: { color: 'rgba(75,85,99,0.2)' },
          },
        },
      },
      hasData: ctdDepthSalinityData.length > 0
    },
    {
      id: 'ctd-oxygen-profile',
      title: 'CTD Oxygen Profile',
      type: 'line',
      data: {
        datasets: [{
          label: 'Dissolved Oxygen (ml/l)',
          data: ctdDepthOxygenData.map(d => ({ x: d.depth, y: d.oxygen })),
          borderColor: 'rgba(34, 197, 94, 0.9)',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          fill: true,
          tension: 0.4,
        }],
      },
      options: {
        ...commonChartOptions,
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            reverse: true,
            title: { display: true, text: 'Depth (m)', color: '#9ca3af' },
            ticks: { color: '#9ca3af' },
            grid: { color: 'rgba(75,85,99,0.2)' },
          },
          y: {
            title: { display: true, text: 'Oxygen (ml/l)', color: '#9ca3af' },
            ticks: { color: '#9ca3af' },
            grid: { color: 'rgba(75,85,99,0.2)' },
          },
        },
      },
      hasData: ctdDepthOxygenData.length > 0
    },
    // AWS Charts
    {
      id: 'aws-time-series',
      title: 'AWS Time Series',
      type: 'line',
      data: {
        labels: awsTimeSeriesData.map(d => d.time),
        datasets: [
          {
            label: 'Sea Surface Temperature (°C)',
            data: awsTimeSeriesData.map(d => d.sst),
            borderColor: 'rgba(255, 107, 53, 0.9)',
            backgroundColor: 'rgba(255, 107, 53, 0.2)',
            yAxisID: 'y',
            tension: 0.4,
          },
          {
            label: 'Wind Speed (m/s)',
            data: awsTimeSeriesData.map(d => d.windSpeed),
            borderColor: 'rgba(14, 165, 233, 0.9)',
            backgroundColor: 'rgba(14, 165, 233, 0.2)',
            yAxisID: 'y1',
            tension: 0.4,
          },
          {
            label: 'Air Temperature (°C)',
            data: awsTimeSeriesData.map(d => d.airTemp),
            borderColor: 'rgba(255, 215, 0, 0.9)',
            backgroundColor: 'rgba(255, 215, 0, 0.2)',
            yAxisID: 'y',
            tension: 0.4,
          },
        ],
      },
      options: {
        ...commonChartOptions,
        scales: {
          x: {
            ticks: { color: '#9ca3af' },
            grid: { color: 'rgba(75,85,99,0.2)' },
          },
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Temperature (°C)', color: '#9ca3af' },
            ticks: { color: '#9ca3af' },
            grid: { color: 'rgba(75,85,99,0.2)' },
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'Wind Speed (m/s)', color: '#9ca3af' },
            ticks: { color: '#9ca3af' },
            grid: { drawOnChartArea: false },
          },
        },
      },
      hasData: awsTimeSeriesData.length > 0
    },
    // ADCP Charts
    {
      id: 'adcp-current-profile',
      title: 'ADCP Current Speed Profile',
      type: 'bar',
      data: {
        labels: adcpCurrentProfileData.map(d => `Bin ${d.depthBin}`),
        datasets: [
          {
            label: 'Average Speed (mm/s)',
            data: adcpCurrentProfileData.map(d => d.avgSpeed),
            backgroundColor: 'rgba(14, 165, 233, 0.6)',
            borderColor: 'rgba(14, 165, 233, 0.9)',
            borderWidth: 1,
          },
          {
            label: 'Max Speed (mm/s)',
            data: adcpCurrentProfileData.map(d => d.maxSpeed),
            backgroundColor: 'rgba(255, 107, 53, 0.6)',
            borderColor: 'rgba(255, 107, 53, 0.9)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        ...commonChartOptions,
        scales: {
          x: {
            title: { display: true, text: 'Depth Bin', color: '#9ca3af' },
            ticks: { color: '#9ca3af' },
            grid: { color: 'rgba(75,85,99,0.2)' },
          },
          y: {
            title: { display: true, text: 'Current Speed (mm/s)', color: '#9ca3af' },
            ticks: { color: '#9ca3af' },
            grid: { color: 'rgba(75,85,99,0.2)' },
          },
        },
      },
      hasData: adcpCurrentProfileData.length > 0
    }
  ];

  // Chart click handlers
  const handleChartClick = (chartId: string) => {
    setSelectedChart(chartId);
    setIsZoomMode(true);
  };

  const handleExitZoom = () => {
    setIsZoomMode(false);
    setSelectedChart(null);
  };

  // Render chart component based on type
  // Use a key based on RAG data to force re-render when data changes
  const chartKey = `${ragOccurrences.length}-${ragSourcesCount || 0}-${ragQueryTime || 0}`;
  
  const renderChart = (chart: any, isZoomed: boolean = false) => {
    const height = isZoomed ? 'h-96' : 'h-48';
    
    if (!chart.hasData) {
      return (
        <div className={`w-full ${height} rounded-lg border border-gray-700/50 bg-gray-800/30 flex items-center justify-center text-gray-400 text-sm`}>
          No data
        </div>
      );
    }

    const chartProps = {
      key: `${chart.id}-${chartKey}`, // Force re-render when RAG data changes
      data: chart.data,
      options: chart.options
    };

    switch (chart.type) {
      case 'bar':
        return <Bar {...chartProps} />;
      case 'line':
        return <Line {...chartProps} />;
      case 'doughnut':
        return <Doughnut {...chartProps} />;
      case 'radar':
        return <Radar {...chartProps} />;
      default:
        return <Bar {...chartProps} />;
    }
  };

  return (
    <div className="w-full bg-[#F7F9FA] text-[#0F2A3A] min-h-screen pb-16">
      {/* Sticky Top Bar with Query Summary */}
      <div className="sticky top-0 z-40 mb-6 py-3.5 px-4 bg-white/95 backdrop-blur-md rounded-2xl border border-[#D9E2E7] flex flex-wrap items-center justify-between gap-4 shadow-[0_1px_2px_0_rgba(15,42,58,0.05)]">
        <div className="flex items-center space-x-3">
          {onBack ? (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#EEF3F5] hover:bg-[#0F766E] border border-[#D9E2E7] hover:border-transparent text-xs font-semibold text-[#0F766E] hover:text-white transition-all duration-150 shadow-sm"
            >
              <FiArrowRight className="w-3.5 h-3.5 rotate-180" />
              <span>Back to Globe</span>
            </button>
          ) : <div />}

          <div className="hidden sm:flex items-center space-x-2 border-l border-[#D9E2E7] pl-3">
            <span className="text-xs font-bold text-[#0F2A3A] tracking-tight">{scientificName}</span>
            {ragSourcesCount !== undefined && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#CCFBF1] text-[#0F766E] border border-[#99F6E4]">
                {ragSourcesCount} records
              </span>
            )}
            {selectedProject && (
              <span className="hidden md:inline-block text-xs text-[#5B7280] font-medium">
                • {selectedProject.title}
              </span>
            )}
          </div>
        </div>

        {/* 1-Click Executive PDF Button */}
        <motion.button
          onClick={handleDownloadExecutiveReport}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0B5F58] text-white font-semibold text-xs shadow-sm transition-all flex-shrink-0"
        >
          {isExportingPDF ? (
            <>
              <FiCheck className="w-4 h-4 text-white animate-bounce" />
              <span>Generating Executive PDF...</span>
            </>
          ) : (
            <>
              <FiDownload className="w-4 h-4 text-white" />
              <span>1-Click Executive PDF Report</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Zoom Mode Layout */}
      {isZoomMode && selectedChart ? (
        <div className="flex h-screen">
          {/* Sidebar with all charts */}
          <div className="w-80 bg-white border-r border-[#D9E2E7] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0F2A3A]">Charts</h3>
                <button
                  onClick={handleExitZoom}
                  className="p-2 text-[#5B7280] hover:text-[#0F2A3A] transition-colors"
                  title="Exit Zoom Mode"
                >
                  <FiMinimize2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                {chartDefinitions.map((chart) => (
                  <div
                    key={chart.id}
                    onClick={() => setSelectedChart(chart.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                      selectedChart === chart.id
                        ? 'border-[#0F766E] bg-[#F0FDFA]'
                        : 'border-[#D9E2E7] bg-white hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <h4 className="text-sm font-semibold text-[#0F2A3A] mb-2">{chart.title}</h4>
                    <div className="h-24">
                      {renderChart(chart, false)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main zoomed chart area */}
          <div className="flex-1 p-6">
            <div className="h-full bg-white border border-[#D9E2E7] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[#0F2A3A]">
                  {chartDefinitions.find(c => c.id === selectedChart)?.title}
                </h2>
                <button
                  onClick={handleExitZoom}
                  className="flex items-center gap-2 px-4 py-2 text-[#5B7280] hover:text-[#0F2A3A] rounded-xl hover:bg-[#EEF3F5] transition-colors duration-150"
                >
                  <FiMinimize2 className="w-4 h-4" />
                  <span>Exit Zoom</span>
                </button>
              </div>
              
              <div className="h-full">
                {renderChart(chartDefinitions.find(c => c.id === selectedChart)!, true)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Normal Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Analysis Summary */}
        <section className={`${cardClass} lg:col-span-1`}>
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl font-bold text-[#0F2A3A] font-display">{scientificName}</h2>
          </div>
          {/* Description - Use dashboard summary if available, otherwise RAG answer */}
          {dashboardSummary ? (
            <div className="text-[#5B7280] text-sm mb-4">
              <div className="text-[#0F766E] font-bold mb-2">Analysis Overview:</div>
              <div className="text-[#0F2A3A] leading-relaxed">{dashboardSummary.executive_summary}</div>
              {ragSourcesCount && (
                <div className="mt-2 text-xs text-[#5B7280]">
                  Based on {ragSourcesCount} relevant occurrence(s) • Processed in {ragQueryTime?.toFixed(0)}ms
                </div>
              )}
            </div>
          ) : ragAnswer ? (
            <div className="text-[#5B7280] text-sm mb-4">
              <div className="text-[#0F766E] font-bold mb-2">AI-Generated Analysis:</div>
              <div className="text-[#0F2A3A] leading-relaxed">{ragAnswer}</div>
              {ragSourcesCount && (
                <div className="mt-2 text-xs text-[#5B7280]">
                  Based on {ragSourcesCount} relevant occurrence(s) • Processed in {ragQueryTime?.toFixed(0)}ms
                </div>
              )}
            </div>
          ) : (
            <p className="text-[#5B7280] text-sm mb-4 leading-relaxed">
              {description || `Analysis results for "${scientificName}" based on ${ragSourcesCount || 0} occurrences.`}
            </p>
          )}

          {/* AI-Generated Answer - Only show if no dashboard summary (to avoid duplication) */}
          {ragAnswer && !dashboardSummary && (
            <div className="bg-[#F0FDFA] border border-[#99F6E4] rounded-xl p-4 mb-4">
              <h3 className="text-sm font-bold text-[#0F766E] mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#0F766E] rounded-full"></div>
                AI-Generated Answer
              </h3>
              <div className="space-y-2 text-xs text-[#0F2A3A] leading-relaxed">
                <p>{ragAnswer}</p>
                {ragSourcesCount && (
                  <p className="text-[#5B7280] mt-2">
                    <span className="text-[#0F766E] font-semibold">Data Sources:</span> {ragSourcesCount} relevant occurrence(s) analyzed
                    {ragQueryTime && ` • Query time: ${ragQueryTime.toFixed(0)}ms`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Detailed Summary Section - Generated by Gemini */}
          {dashboardSummary && (
            <div className="bg-[#F0FDFA] border border-[#99F6E4] rounded-xl p-4 mb-4">
              <h3 className="text-sm font-bold text-[#0F766E] mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#0F766E] rounded-full"></div>
                Detailed Analysis Summary
              </h3>
              
              {/* Executive Summary */}
              <div className="mb-4">
                <h4 className="text-xs font-bold text-[#0F766E] mb-2 uppercase tracking-wide">Executive Summary</h4>
                <p className="text-xs text-[#0F2A3A] leading-relaxed">{dashboardSummary.executive_summary}</p>
              </div>

              {/* Key Findings */}
              {dashboardSummary.key_findings && dashboardSummary.key_findings.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-[#0F766E] mb-2 uppercase tracking-wide">Key Findings</h4>
                  <ul className="space-y-1.5">
                    {dashboardSummary.key_findings.map((finding, idx) => (
                      <li key={idx} className="text-xs text-[#0F2A3A] flex items-start gap-2">
                        <span className="text-[#0F766E] mt-1 font-bold">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Detailed Analysis Sections */}
              <div className="space-y-3 text-xs">
                {dashboardSummary.species_analysis && (
                  <div>
                    <h4 className="font-bold text-[#0369A1] mb-1">Species Analysis</h4>
                    <p className="text-[#0F2A3A] leading-relaxed">{dashboardSummary.species_analysis}</p>
                  </div>
                )}
                
                {dashboardSummary.geographic_distribution && (
                  <div>
                    <h4 className="font-bold text-[#0369A1] mb-1">Geographic Distribution</h4>
                    <p className="text-[#0F2A3A] leading-relaxed">{dashboardSummary.geographic_distribution}</p>
                  </div>
                )}
                
                {dashboardSummary.depth_analysis && (
                  <div>
                    <h4 className="font-bold text-[#0369A1] mb-1">Depth Analysis</h4>
                    <p className="text-[#0F2A3A] leading-relaxed">{dashboardSummary.depth_analysis}</p>
                  </div>
                )}
                
                {dashboardSummary.temporal_patterns && (
                  <div>
                    <h4 className="font-bold text-[#0369A1] mb-1">Temporal Patterns</h4>
                    <p className="text-[#0F2A3A] leading-relaxed">{dashboardSummary.temporal_patterns}</p>
                  </div>
                )}
                
                {dashboardSummary.research_insights && (
                  <div>
                    <h4 className="font-bold text-[#0369A1] mb-1">Research Insights</h4>
                    <p className="text-[#0F2A3A] leading-relaxed">{dashboardSummary.research_insights}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Occurrence Details */}
          {ragOccurrences.length > 0 && (
            <div className="bg-[#F8FAFC] border border-[#D9E2E7] rounded-xl p-4 mb-4">
              <h3 className="text-sm font-bold text-[#0F2A3A] mb-3">Key Findings</h3>
              <div className="space-y-2 text-xs text-[#0F2A3A]">
                {(() => {
                  const uniqueSpecies = new Set(ragOccurrences.map(o => o.scientificName).filter(Boolean));
                  const uniqueWaterBodies = new Set(ragOccurrences.map(o => o.waterBody).filter(Boolean));
                  const depthRanges = ragOccurrences
                    .map(o => o.minimumDepthInMeters || o.maximumDepthInMeters)
                    .filter(d => d !== undefined && d !== null) as number[];
                  
                  return (
                    <>
                      {uniqueSpecies.size > 0 && (
                        <p>
                          <span className="text-[#0F766E] font-semibold">Species Found:</span> {uniqueSpecies.size} unique species
                        </p>
                      )}
                      {uniqueWaterBodies.size > 0 && (
                        <p>
                          <span className="text-[#0F766E] font-semibold">Water Bodies:</span> {Array.from(uniqueWaterBodies).join(', ')}
                        </p>
                      )}
                      {(() => {
                        // Prioritize query filter depth range if available
                        if (minDepthInMeters !== null && minDepthInMeters !== undefined && 
                            maxDepthInMeters !== null && maxDepthInMeters !== undefined) {
                          return (
                            <p>
                              <span className="text-[#0F766E] font-semibold">Depth Range:</span> {minDepthInMeters}m - {maxDepthInMeters}m (query filter)
                            </p>
                          );
                        }
                        // Otherwise, show actual depth range from results
                        if (depthRanges.length > 0) {
                          return (
                            <p>
                              <span className="text-[#0F766E] font-semibold">Depth Range:</span> {Math.min(...depthRanges)}m - {Math.max(...depthRanges)}m
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </>
                  );
                })()}
            </div>
          </div>
          )}

          {/* Statistics Cards - Only show if we have RAG data */}
          {ragOccurrences.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F8FAFC] border border-[#D9E2E7] rounded-xl p-3">
                <div className={labelClass}>Total Occurrences</div>
                <div className={`mt-1 ${valueClass} text-lg text-[#0F766E] font-bold`}>
                  {ragSourcesCount || ragOccurrences.length}
            </div>
            </div>
            <div className="bg-[#F8FAFC] border border-[#D9E2E7] rounded-xl p-3">
                <div className={labelClass}>Unique Species</div>
                <div className={`mt-1 ${valueClass} text-lg text-[#15803D] font-bold`}>
                  {(() => {
                    const species = new Set(ragOccurrences.map(o => o.scientificName).filter(Boolean));
                    return species.size || 0;
                  })()}
            </div>
            </div>
              {(() => {
                // Prioritize query filter depth range if available
                if (minDepthInMeters !== null && minDepthInMeters !== undefined && 
                    maxDepthInMeters !== null && maxDepthInMeters !== undefined) {
                  return (
            <div className="bg-[#F8FAFC] border border-[#D9E2E7] rounded-xl p-3">
                      <div className={labelClass}>Depth Range</div>
                      <div className={`mt-1 ${valueClass} text-xs`}>
                        {minDepthInMeters}m - {maxDepthInMeters}m
                        <span className="text-[#5B7280] text-xs ml-1">(query filter)</span>
            </div>
            </div>
                  );
                }
                // Otherwise, calculate from actual results
                const depths = ragOccurrences
                  .flatMap(o => [o.minimumDepthInMeters, o.maximumDepthInMeters])
                  .filter(d => d !== undefined && d !== null) as number[];
                if (depths.length > 0) {
                  return (
            <div className="bg-[#F8FAFC] border border-[#D9E2E7] rounded-xl p-3">
                      <div className={labelClass}>Depth Range</div>
                      <div className={`mt-1 ${valueClass} text-xs`}>
                        {Math.min(...depths)}m - {Math.max(...depths)}m
            </div>
                    </div>
                  );
                }
                return null;
              })()}
              {waterBodyLabels.length > 0 && (
            <div className="bg-[#F8FAFC] border border-[#D9E2E7] rounded-xl p-3">
                  <div className={labelClass}>Water Bodies</div>
                  <div className={`mt-1 ${valueClass} text-xs`}>
                    {waterBodyLabels.slice(0, 2).join(', ')}
                    {waterBodyLabels.length > 2 && ` +${waterBodyLabels.length - 2} more`}
            </div>
            </div>
              )}
              {samplingLabels.length > 0 && (
            <div className="bg-[#F8FAFC] border border-[#D9E2E7] rounded-xl p-3">
                  <div className={labelClass}>Sampling Methods</div>
                  <div className={`mt-1 ${valueClass} text-xs`}>
                    {samplingLabels.slice(0, 2).join(', ')}
                    {samplingLabels.length > 2 && ` +${samplingLabels.length - 2} more`}
            </div>
                </div>
              )}
              {ragQueryTime && (
            <div className="bg-[#F8FAFC] border border-[#D9E2E7] rounded-xl p-3">
                  <div className={labelClass}>Query Time</div>
                  <div className={`mt-1 ${valueClass} text-xs`}>
                    {ragQueryTime.toFixed(0)}ms
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Column - Charts and Map */}
        <section className={`${cardClass} lg:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#0F2A3A]">Geographic Distribution</h3>
          </div>
          <div className="h-64 mb-6">
            <SearchWorldMap
              dataPoints={globePoints.map(point => ({
                lat: point.decimalLatitude,
                lng: point.decimalLongitude,
                label: point.locality,
                locality: point.locality,
                scientificName: point.scientificName,
                waterBody: point.waterBody,
                eventDate: point.eventDate,
                samplingProtocol: point.samplingProtocol,
                minimumDepthInMeters: point.minimumDepthInMeters,
                maximumDepthInMeters: point.maximumDepthInMeters,
                identifiedBy: point.identifiedBy
              }))}
              color="#0F766E"
            />
          </div>

          {/* Interactive Globe Section - Below Geographic Distribution */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#0F2A3A] mb-4">Interactive Globe</h3>
            <div className="h-80 rounded-2xl overflow-hidden border border-[#D9E2E7] kadal-ai-result-globe shadow-sm">
              {globePoints.length > 0 ? (
                <ReactGlobeComponent
                  dataPoints={globePoints}
                  onDataPointClick={() => {}}
                  autoRotate={false}
                  focusOnData={true}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#5B7280]">No coordinates available</div>
              )}
            </div>
          </div>

          {/* Query-Specific Marine Data Records - Grouped by Type */}
          {ragOccurrences.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0F2A3A] flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#0F766E] rounded-full"></div>
                  Query-Specific Records ({ragOccurrences.length})
                </h3>
                {ragSourcesCount && ragSourcesCount > ragOccurrences.length && (
                  <span className="text-xs text-[#5B7280]">
                    Showing {ragOccurrences.length} of {ragSourcesCount} query results
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5B7280] mb-3">
                Marine data records matching your query criteria, grouped by data type
              </p>
              
              {/* Occurrence Records */}
              {recordsByType.OCCURRENCE && recordsByType.OCCURRENCE.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-[#15803D] mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#15803D] rounded-full"></span>
                    Species Occurrences ({recordsByType.OCCURRENCE.length})
                  </h4>
                  <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                    {recordsByType.OCCURRENCE.map((occ, idx) => (
                  <div 
                    key={idx} 
                    className="bg-[#F8FAFC] border border-[#D9E2E7] rounded-xl p-4 hover:border-[#0F766E] transition-all shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-bold text-[#0F2A3A] text-sm mb-1">
                          {occ.scientificName || 'Unknown Species'}
                        </div>
                        {occ.similarity_score !== undefined && (
                          <div className="text-xs text-[#5B7280]">
                            Relevance: <span className="text-[#0F766E] font-semibold">{(1 - occ.similarity_score).toFixed(3)}</span>
                          </div>
                        )}
                      </div>
                      {occ.decimalLatitude && occ.decimalLongitude && (
                        <div className="text-xs font-mono text-[#5B7280] ml-2">
                          {occ.decimalLatitude.toFixed(4)}°, {occ.decimalLongitude.toFixed(4)}°
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {occ.locality && (
                        <div className="flex items-start gap-2">
                          <span className="text-[#0F766E]">📍</span>
                          <div>
                            <div className="text-[#5B7280]">Locality</div>
                            <div className="text-[#0F2A3A] font-medium">{occ.locality}</div>
                          </div>
                        </div>
                      )}
                      {occ.waterBody && (
                        <div className="flex items-start gap-2">
                          <span className="text-[#0369A1]">🌊</span>
                          <div>
                            <div className="text-[#5B7280]">Water Body</div>
                            <div className="text-[#0F2A3A] font-medium">{occ.waterBody}</div>
                          </div>
                        </div>
                      )}
                      {(occ.minimumDepthInMeters !== undefined || occ.maximumDepthInMeters !== undefined) && (
                        <div className="flex items-start gap-2">
                          <span className="text-[#D97706]">📏</span>
                          <div>
                            <div className="text-[#5B7280]">Depth</div>
                            <div className="text-[#0F2A3A] font-medium">
                              {occ.minimumDepthInMeters !== undefined ? occ.minimumDepthInMeters : '?'}m
                              {occ.maximumDepthInMeters !== undefined && occ.maximumDepthInMeters !== occ.minimumDepthInMeters 
                                ? ` - ${occ.maximumDepthInMeters}m` 
                                : ''}
                            </div>
                          </div>
                        </div>
                      )}
                      {occ.samplingProtocol && (
                        <div className="flex items-start gap-2">
                          <span className="text-[#7C3AED]">🔬</span>
                          <div>
                            <div className="text-[#5B7280]">Sampling Method</div>
                            <div className="text-[#0F2A3A] font-medium">{occ.samplingProtocol}</div>
                          </div>
                        </div>
                      )}
                      {occ.eventDate && (
                        <div className="flex items-start gap-2">
                          <span className="text-[#5B7280]">📅</span>
                          <div>
                            <div className="text-[#5B7280]">Event Date</div>
                            <div className="text-[#0F2A3A] font-medium">{occ.eventDate}</div>
                          </div>
                        </div>
                      )}
                      {occ.identifiedBy && (
                        <div className="flex items-start gap-2">
                          <span className="text-[#5B7280]">👤</span>
                          <div>
                            <div className="text-[#5B7280]">Identified By</div>
                            <div className="text-[#0F2A3A] font-medium">{occ.identifiedBy}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    {occ.content && (
                      <div className="mt-3 pt-3 border-t border-[#D9E2E7]">
                        <div className="text-xs text-[#5B7280] italic line-clamp-2">{occ.content}</div>
                      </div>
                    )}
                  </div>
                ))}
                  </div>
                </div>
              )}

              {/* CTD Records */}
              {recordsByType.CTD && recordsByType.CTD.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-[#D97706] mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#D97706] rounded-full"></span>
                    CTD Measurements ({recordsByType.CTD.length})
                  </h4>
                  <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                    {recordsByType.CTD.slice(0, 10).map((record, idx) => (
                      <div 
                        key={idx} 
                        className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 hover:border-[#D97706] transition-all shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="font-bold text-[#0F2A3A] text-sm mb-1">
                              {record.station || `CTD Station ${idx + 1}`}
                            </div>
                            {record.similarity_score !== undefined && (
                              <div className="text-xs text-[#5B7280]">
                                Relevance: <span className="text-[#D97706] font-semibold">{(1 - record.similarity_score).toFixed(3)}</span>
                              </div>
                            )}
                          </div>
                          {(record.latitude || record.decimalLatitude) && (record.longitude || record.decimalLongitude) && (
                            <div className="text-xs font-mono text-[#5B7280] ml-2">
                              {(record.latitude || record.decimalLatitude)!.toFixed(4)}°, {(record.longitude || record.decimalLongitude)!.toFixed(4)}°
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          {record.depth !== undefined && (
                            <div><span className="text-[#5B7280]">Depth:</span> <span className="text-[#0F2A3A] font-semibold">{record.depth.toFixed(1)}m</span></div>
                          )}
                          {record.temperature !== undefined && (
                            <div><span className="text-[#5B7280]">Temp:</span> <span className="text-[#0F2A3A] font-semibold">{record.temperature.toFixed(2)}°C</span></div>
                          )}
                          {record.salinity !== undefined && (
                            <div><span className="text-[#5B7280]">Salinity:</span> <span className="text-[#0F2A3A] font-semibold">{record.salinity.toFixed(2)} PSU</span></div>
                          )}
                          {record.oxygen !== undefined && (
                            <div><span className="text-[#5B7280]">Oxygen:</span> <span className="text-[#0F2A3A] font-semibold">{record.oxygen.toFixed(2)} ml/l</span></div>
                          )}
                          {record.pressure !== undefined && (
                            <div><span className="text-[#5B7280]">Pressure:</span> <span className="text-[#0F2A3A] font-semibold">{record.pressure.toFixed(1)} dbar</span></div>
                          )}
                          {record.eventDate && (
                            <div><span className="text-[#5B7280]">Date:</span> <span className="text-[#0F2A3A]">{record.eventDate}</span></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AWS Records */}
              {recordsByType.AWS && recordsByType.AWS.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-[#0F766E] mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#0F766E] rounded-full"></span>
                    AWS Weather Data ({recordsByType.AWS.length})
                  </h4>
                  <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                    {recordsByType.AWS.slice(0, 10).map((record, idx) => (
                      <div 
                        key={idx} 
                        className="bg-[#F0FDFA] border border-[#99F6E4] rounded-xl p-4 hover:border-[#0F766E] transition-all shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="font-bold text-[#0F2A3A] text-sm mb-1">
                              {record.station || `AWS Station ${idx + 1}`}
                            </div>
                            {record.similarity_score !== undefined && (
                              <div className="text-xs text-[#5B7280]">
                                Relevance: <span className="text-[#0F766E] font-semibold">{(1 - record.similarity_score).toFixed(3)}</span>
                              </div>
                            )}
                          </div>
                          {(record.latitude || record.decimalLatitude) && (record.longitude || record.decimalLongitude) && (
                            <div className="text-xs font-mono text-[#5B7280] ml-2">
                              {(record.latitude || record.decimalLatitude)!.toFixed(4)}°, {(record.longitude || record.decimalLongitude)!.toFixed(4)}°
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          {record.seaSurfaceTemperature !== undefined && (
                            <div><span className="text-[#5B7280]">SST:</span> <span className="text-[#0F2A3A] font-semibold">{record.seaSurfaceTemperature.toFixed(2)}°C</span></div>
                          )}
                          {record.windSpeed !== undefined && (
                            <div><span className="text-[#5B7280]">Wind:</span> <span className="text-[#0F2A3A] font-semibold">{record.windSpeed.toFixed(1)} m/s</span></div>
                          )}
                          {record.airTemperature !== undefined && (
                            <div><span className="text-[#5B7280]">Air Temp:</span> <span className="text-[#0F2A3A] font-semibold">{record.airTemperature.toFixed(1)}°C</span></div>
                          )}
                          {record.humidity !== undefined && (
                            <div><span className="text-[#5B7280]">Humidity:</span> <span className="text-[#0F2A3A] font-semibold">{record.humidity.toFixed(1)}%</span></div>
                          )}
                          {record.atmosphericPressure !== undefined && (
                            <div><span className="text-[#5B7280]">Pressure:</span> <span className="text-[#0F2A3A] font-semibold">{record.atmosphericPressure.toFixed(1)} hPa</span></div>
                          )}
                          {record.eventDate && (
                            <div><span className="text-[#5B7280]">Date:</span> <span className="text-[#0F2A3A]">{record.eventDate}</span></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ADCP Records */}
              {recordsByType.ADCP && recordsByType.ADCP.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-[#7C3AED] mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full"></span>
                    ADCP Current Data ({recordsByType.ADCP.length})
                  </h4>
                  <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                    {recordsByType.ADCP.slice(0, 10).map((record, idx) => (
                      <div 
                        key={idx} 
                        className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-xl p-4 hover:border-[#7C3AED] transition-all shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="font-bold text-[#0F2A3A] text-sm mb-1">
                              {record.station || `ADCP Ensemble ${record.ensemble || idx + 1}`}
                            </div>
                            {record.similarity_score !== undefined && (
                              <div className="text-xs text-[#5B7280]">
                                Relevance: <span className="text-[#7C3AED] font-semibold">{(1 - record.similarity_score).toFixed(3)}</span>
                              </div>
                            )}
                          </div>
                          {(record.latitude || record.decimalLatitude) && (record.longitude || record.decimalLongitude) && (
                            <div className="text-xs font-mono text-[#5B7280] ml-2">
                              {(record.latitude || record.decimalLatitude)!.toFixed(4)}°, {(record.longitude || record.decimalLongitude)!.toFixed(4)}°
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          {record.averageCurrentSpeed !== undefined && (
                            <div><span className="text-[#5B7280]">Avg Speed:</span> <span className="text-[#0F2A3A] font-semibold">{record.averageCurrentSpeed.toFixed(2)} mm/s</span></div>
                          )}
                          {record.magnitudeVelocities && record.magnitudeVelocities.length > 0 && (
                            <div><span className="text-[#5B7280]">Max Speed:</span> <span className="text-[#0F2A3A] font-semibold">{Math.max(...record.magnitudeVelocities).toFixed(2)} mm/s</span></div>
                          )}
                          {record.ensemble !== undefined && (
                            <div><span className="text-[#5B7280]">Ensemble:</span> <span className="text-[#0F2A3A] font-semibold">{record.ensemble}</span></div>
                          )}
                          {record.heading !== undefined && (
                            <div><span className="text-[#5B7280]">Heading:</span> <span className="text-[#0F2A3A] font-semibold">{record.heading.toFixed(1)}°</span></div>
                          )}
                          {(record.bottomDepth1 || record.bottomDepth2) && (
                            <div><span className="text-[#5B7280]">Bottom:</span> <span className="text-[#0F2A3A] font-semibold">
                              {((record.bottomDepth1 || record.bottomDepth2 || 0) / 100).toFixed(1)}m
                            </span></div>
                          )}
                          {record.eventDate && (
                            <div><span className="text-[#5B7280]">Date:</span> <span className="text-[#0F2A3A]">{record.eventDate}</span></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Query-Specific Charts - Based on RAG Results */}
          {ragOccurrences.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-bold text-[#0F2A3A] mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-[#0F766E] rounded-full"></div>
                Query-Specific Analysis
              </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trendYears.length > 0 && (
            <div 
                    className={`${cardClass} cursor-pointer group`}
              onClick={() => handleChartClick('occurrences-by-year')}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#0F2A3A]">Occurrences by Year</h3>
                <FiMaximize2 className="w-4 h-4 text-[#5B7280] group-hover:text-[#0F766E] transition-colors" />
              </div>
              <div className="h-48">
                {renderChart(chartDefinitions.find(c => c.id === 'occurrences-by-year')!, false)}
              </div>
            </div>
                )}

                {depthBinCounts.some(c => c > 0) && (
            <div 
                    className={`${cardClass} cursor-pointer group`}
              onClick={() => handleChartClick('depth-profile')}
            >
              <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-[#0F2A3A]">Depth Distribution</h3>
                <FiMaximize2 className="w-4 h-4 text-[#5B7280] group-hover:text-[#0F766E] transition-colors" />
              </div>
              <div className="h-48">
                {renderChart(chartDefinitions.find(c => c.id === 'depth-profile')!, false)}
              </div>
            </div>
                )}

                {waterBodyLabels.length > 0 && (
          <div 
            className={`${cardClass} cursor-pointer group`}
            onClick={() => handleChartClick('water-body-distribution')}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#0F2A3A]">Water Body Distribution</h3>
              <FiMaximize2 className="w-4 h-4 text-[#5B7280] group-hover:text-[#0F766E] transition-colors" />
            </div>
            <div className="h-48">
              {renderChart(chartDefinitions.find(c => c.id === 'water-body-distribution')!, false)}
            </div>
          </div>
                )}

                {samplingLabels.length > 0 && (
          <div 
            className={`${cardClass} cursor-pointer group`}
            onClick={() => handleChartClick('sampling-methods')}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#0F2A3A]">Sampling Methods</h3>
              <FiMaximize2 className="w-4 h-4 text-[#5B7280] group-hover:text-[#0F766E] transition-colors" />
            </div>
            <div className="h-48">
              {renderChart(chartDefinitions.find(c => c.id === 'sampling-methods')!, false)}
            </div>
          </div>
                )}

                {Object.values(seasonalCounts).some(c => c > 0) && (
          <div 
            className={`${cardClass} cursor-pointer group`}
                    onClick={() => handleChartClick('seasonal-distribution')}
          >
            <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-[#0F2A3A]">Seasonal Distribution</h3>
              <FiMaximize2 className="w-4 h-4 text-[#5B7280] group-hover:text-[#0F766E] transition-colors" />
            </div>
            <div className="h-48">
                      {renderChart(chartDefinitions.find(c => c.id === 'seasonal-distribution')!, false)}
            </div>
          </div>
                )}

                {/* CTD Charts */}
                {ctdDepthTempData.length > 0 && (
          <div 
            className={`${cardClass} cursor-pointer group`}
                    onClick={() => handleChartClick('ctd-temperature-profile')}
          >
            <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-[#0F2A3A]">CTD Temperature Profile</h3>
                      <FiMaximize2 className="w-4 h-4 text-[#5B7280] group-hover:text-[#D97706] transition-colors" />
            </div>
            <div className="h-48">
                      {renderChart(chartDefinitions.find(c => c.id === 'ctd-temperature-profile')!, false)}
            </div>
          </div>
                )}

                {ctdDepthSalinityData.length > 0 && (
          <div 
            className={`${cardClass} cursor-pointer group`}
                    onClick={() => handleChartClick('ctd-salinity-profile')}
          >
            <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-[#0F2A3A]">CTD Salinity Profile</h3>
                      <FiMaximize2 className="w-4 h-4 text-[#5B7280] group-hover:text-[#0369A1] transition-colors" />
            </div>
            <div className="h-48">
                      {renderChart(chartDefinitions.find(c => c.id === 'ctd-salinity-profile')!, false)}
            </div>
          </div>
                )}

                {ctdDepthOxygenData.length > 0 && (
          <div 
            className={`${cardClass} cursor-pointer group`}
                    onClick={() => handleChartClick('ctd-oxygen-profile')}
          >
            <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-[#0F2A3A]">CTD Oxygen Profile</h3>
                      <FiMaximize2 className="w-4 h-4 text-[#5B7280] group-hover:text-[#15803D] transition-colors" />
            </div>
            <div className="h-48">
                      {renderChart(chartDefinitions.find(c => c.id === 'ctd-oxygen-profile')!, false)}
            </div>
          </div>
                )}

                {/* AWS Charts */}
                {awsTimeSeriesData.length > 0 && (
          <div 
            className={`${cardClass} cursor-pointer group`}
                    onClick={() => handleChartClick('aws-time-series')}
          >
            <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-[#0F2A3A]">AWS Time Series</h3>
                      <FiMaximize2 className="w-4 h-4 text-[#5B7280] group-hover:text-[#0F766E] transition-colors" />
            </div>
            <div className="h-48">
                      {renderChart(chartDefinitions.find(c => c.id === 'aws-time-series')!, false)}
            </div>
          </div>
                )}

                {adcpCurrentProfileData.length > 0 && (
          <div 
            className={`${cardClass} cursor-pointer group`}
                    onClick={() => handleChartClick('adcp-current-profile')}
          >
            <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-[#0F2A3A]">ADCP Current Profile</h3>
                      <FiMaximize2 className="w-4 h-4 text-[#5B7280] group-hover:text-[#7C3AED] transition-colors" />
            </div>
            <div className="h-48">
                      {renderChart(chartDefinitions.find(c => c.id === 'adcp-current-profile')!, false)}
            </div>
          </div>
                )}
              </div>
            </div>
          )}
        </section>
        </div>
      )}

      {/* Floating Notes Button */}
      {selectedProject && (
        <motion.div
          className="fixed bottom-6 right-6 z-50 group"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
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
            <div className="absolute right-full mr-2 flex items-center space-x-2 px-4 py-2 bg-[#0F766E] text-white font-semibold rounded-full shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-150 pointer-events-none text-xs">
              <FiPenTool className="w-4 h-4" />
              <span>Notes</span>
            </div>
            {/* Circular button */}
            <motion.div
              className="w-13 h-13 p-3.5 rounded-full bg-[#0F766E] text-white flex items-center justify-center shadow-md hover:bg-[#0B5F58] hover:shadow-lg transition-all duration-150"
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
          className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white border-l border-[#D9E2E7] z-[100] shadow-2xl overflow-y-auto"
        >
          <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-[#D9E2E7] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiPenTool className="w-5 h-5 text-[#0F766E]" />
              <h2 className="text-xl font-bold text-[#0F2A3A] font-display">Investigation Notes</h2>
            </div>
            <button
              onClick={() => setShowNotesPanel(false)}
              className="p-2 text-[#5B7280] hover:text-[#0F2A3A] hover:bg-[#EEF3F5] rounded-xl transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {!selectedProject ? (
              <div className="py-16 text-center">
                <FiFileText className="w-16 h-16 text-[#94A3B8] mx-auto mb-4" />
                <p className="text-[#0F2A3A] font-bold text-base mb-1">No project selected</p>
                <p className="text-[#5B7280] text-sm">
                  Please select a project to view and manage notes
                </p>
              </div>
            ) : (
              <>
                {notesError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-[#B91C1C] text-sm font-semibold">
                    {notesError}
                  </div>
                )}

                {/* Create/Edit Note Form */}
                {(isCreatingPanelNote || selectedPanelNote) ? (
                  <div className="mb-6">
                    <div className="mb-4">
                      <input
                        type="text"
                        value={panelNoteTitle}
                        onChange={(e) => setPanelNoteTitle(e.target.value)}
                        placeholder="Note title..."
                        className="w-full px-4 py-2.5 bg-white border border-[#D9E2E7] rounded-xl text-[#0F2A3A] placeholder-[#94A3B8] text-sm focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 focus:outline-none mb-3"
                      />
                      <textarea
                        value={panelNoteContent}
                        onChange={(e) => setPanelNoteContent(e.target.value)}
                        placeholder="Write your notes here..."
                        className="w-full h-[320px] px-4 py-3 bg-white border border-[#D9E2E7] rounded-xl text-[#0F2A3A] placeholder-[#94A3B8] text-sm focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 focus:outline-none resize-none"
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
                        className="px-4 py-2 border border-[#D9E2E7] text-[#5B7280] hover:text-[#0F2A3A] rounded-xl hover:bg-[#EEF3F5] transition-colors disabled:opacity-50 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePanelSaveNote}
                        disabled={savingPanelNote || !panelNoteTitle.trim() || !panelNoteContent.trim()}
                        className="px-5 py-2 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-semibold rounded-xl shadow-sm transition-all duration-150 flex items-center space-x-2 disabled:opacity-50 text-xs"
                      >
                        <FiSave className="w-4 h-4" />
                        <span>{savingPanelNote ? 'Saving...' : 'Save Note'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <button
                      onClick={handlePanelCreateNote}
                      className="w-full px-4 py-3 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-semibold rounded-xl shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center space-x-2 text-sm"
                    >
                      <FiPlus className="w-4 h-4" />
                      <span>Create New Note</span>
                    </button>
                  </div>
                )}

                {/* Notes List */}
                {isLoadingNotes ? (
                  <div className="py-16 text-center text-[#5B7280]">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F766E] mb-4"></div>
                    <p className="text-sm font-medium">Loading notes...</p>
                  </div>
                ) : notesPanelNotes.length === 0 ? (
                  <div className="py-16 text-center">
                    <FiFileText className="w-16 h-16 text-[#CBD5E1] mx-auto mb-4" />
                    <p className="text-[#0F2A3A] font-bold text-base mb-1">No notes yet</p>
                    <p className="text-[#5B7280] text-sm">
                      Create your first note to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notesPanelNotes.map((note, index) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.04 }}
                        className="bg-[#F8FAFC] border border-[#D9E2E7] rounded-2xl p-5 hover:border-[#0F766E] transition-all duration-150 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[#0F2A3A] font-bold text-base mb-1.5 break-words">
                              {note.title}
                            </h4>
                            <p className="text-sm text-[#5B7280] line-clamp-3 mb-3">
                              {note.content}
                            </p>
                            <p className="text-xs font-mono text-[#94A3B8]">
                              {formatNotesDate(note.updated_at)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <button
                              onClick={() => handlePanelEditNote(note)}
                              className="px-3 py-1.5 bg-[#EEF3F5] text-[#0F766E] hover:bg-[#0F766E] hover:text-white font-semibold rounded-lg transition-all duration-150 flex items-center space-x-1.5 text-xs"
                            >
                              <FiEdit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handlePanelDeleteNote(note.id)}
                              className="p-1.5 text-[#B91C1C] hover:bg-red-50 rounded-lg transition-colors duration-150"
                              title="Delete note"
                            >
                              <FiTrash2 className="w-4 h-4" />
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
    </div>
  );
};

export default SearchResultsView;



