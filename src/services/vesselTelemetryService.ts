// Service to handle vessel telemetry data collection and processing
// Similar to Droplet's ingestionService but for live vessel data

const API_BASE_URL = process.env.REACT_APP_PROCESSING_API_URL || '';

export interface TelemetryDataPoint {
  timestamp: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  depth: number;
  temperature: number;
  salinity: number;
  pressure: number;
  windSpeed?: number;
  windDirection?: number;
  [key: string]: any; // Allow additional sensor data
}

/**
 * Convert telemetry data array to CSV format
 */
export const convertTelemetryToCSV = (data: TelemetryDataPoint[]): string => {
  if (data.length === 0) return '';
  
  // Get all unique keys from all data points
  const allKeys = new Set<string>();
  data.forEach(point => {
    Object.keys(point).forEach(key => allKeys.add(key));
  });
  
  const headers = Array.from(allKeys);
  const headerRow = headers.join(',');
  
  // Create data rows
  const dataRows = data.map(point => {
    return headers.map(header => {
      const value = point[header] ?? '';
      // Escape quotes and wrap in quotes if contains comma, newline, or quotes
      if (String(value).includes(',') || String(value).includes('"') || String(value).includes('\n')) {
        return `"${String(value).replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  // Combine header and data
  const csvContent = [headerRow, ...dataRows].join('\n');
  return csvContent;
};

/**
 * Convert CSV string to Blob for file upload
 */
export const csvToBlob = (csvContent: string, filename: string): File => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  return new File([blob], filename || 'vessel-telemetry.csv', { type: 'text/csv' });
};

/**
 * Send telemetry data to DataProcessingEngine API
 * Returns processed data with quality report
 */
export const processTelemetryData = async (
  data: TelemetryDataPoint[],
  filename: string
): Promise<{
  success: boolean;
  data?: any;
  qualityReport?: any;
  metadata?: any;
  processedFile?: string;
  error?: string;
}> => {
  try {
    // Convert to CSV
    const csvContent = convertTelemetryToCSV(data);
    const csvFile = csvToBlob(csvContent, filename);
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', csvFile);
    
    // Send to API
    const response = await fetch(`${API_BASE_URL}/process-csv`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      data: result,
      qualityReport: result.quality_report,
      metadata: result.metadata,
      processedFile: result.processed_file
    };
  } catch (error: any) {
    console.error('Telemetry processing error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process telemetry data'
    };
  }
};

/**
 * Check if DataProcessingEngine API is available
 */
export const checkAPIHealth = async (): Promise<{ available: boolean; data?: any; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      return { available: true, data };
    }
    return { available: false };
  } catch (error: any) {
    return { available: false, error: error.message };
  }
};

/**
 * Generate artificial telemetry data for testing
 */
export const generateArtificialTelemetryData = (count: number = 1): TelemetryDataPoint[] => {
  const data: TelemetryDataPoint[] = [];
  const baseLat = 12.9716; // Starting latitude (example: Bangalore area)
  const baseLon = 77.5946; // Starting longitude
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(Date.now() + i * 1000).toISOString();
    const latOffset = (Math.random() - 0.5) * 0.01; // Small random offset
    const lonOffset = (Math.random() - 0.5) * 0.01;
    
    data.push({
      timestamp,
      latitude: baseLat + latOffset,
      longitude: baseLon + lonOffset,
      speed: 5 + Math.random() * 10, // 5-15 knots
      heading: Math.random() * 360, // 0-360 degrees
      depth: 10 + Math.random() * 100, // 10-110 meters
      temperature: 20 + Math.random() * 10, // 20-30°C
      salinity: 30 + Math.random() * 5, // 30-35 PSU
      pressure: 1 + Math.random() * 10, // 1-11 bar
      windSpeed: 5 + Math.random() * 15, // 5-20 m/s
      windDirection: Math.random() * 360, // 0-360 degrees
    });
  }
  
  return data;
};

