// Service to fetch vessel telemetry files from Supabase storage
import { supabase } from './supabaseClient';

export interface VesselTelemetryFile {
  filename: string;
  timestamp: string;
  qualityReport: any | null;
  dataPoints: number;
  filePath: string;
}

/**
 * Extract date from vessel telemetry filename
 * Format: vessel-telemetry-2025-12-04T11-03-46-124Z.parquet
 */
const extractDateFromFilename = (filename: string): Date | null => {
  try {
    // Extract date part from filename (format: vessel-telemetry-YYYY-MM-DDTHH-MM-SS-...)
    const match = filename.match(/vessel-telemetry-(\d{4}-\d{2}-\d{2})T/);
    if (match) {
      const dateStr = match[1]; // YYYY-MM-DD
      return new Date(dateStr + 'T00:00:00');
    }
    return null;
  } catch (error) {
    console.error('Error extracting date from filename:', error);
    return null;
  }
};

/**
 * Get local date string (YYYY-MM-DD) without timezone issues
 */
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Fetch all vessel telemetry files from Supabase storage bucket
 */
export const fetchVesselTelemetryFiles = async (): Promise<VesselTelemetryFile[]> => {
  try {
    console.log('🔍 Fetching vessel telemetry files from Supabase...');
    console.log('📍 Supabase URL:', process.env.REACT_APP_SUPABASE_URL ? 'Configured' : 'Missing');
    console.log('🔑 Supabase Key:', process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY ? 'Configured' : 'Missing');
    
    // Check if Supabase is configured
    if (!supabase) {
      console.error('❌ Supabase client is not configured');
      return [];
    }

    // List all files in processed-data bucket
    console.log('📦 Listing files from processed-data bucket...');
    
    // Try listing without path first (root level)
    let files: any[] | null = null;
    let listError: any = null;
    
    // Try different approaches to list files
    const { data: filesData, error: error1 } = await supabase.storage
      .from('processed-data')
      .list('', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (error1) {
      console.warn('⚠️ Error with path="":', error1);
      // Try without path parameter
      const { data: filesData2, error: error2 } = await supabase.storage
        .from('processed-data')
        .list();
      
      if (error2) {
        console.error('❌ Error listing files from Supabase:', error2);
        console.error('Error details:', JSON.stringify(error2, null, 2));
        listError = error2;
      } else {
        files = filesData2;
      }
    } else {
      files = filesData;
    }

    if (listError) {
      console.error('❌ Could not list files. This might be an RLS policy issue.');
      console.error('💡 Make sure you have a policy that allows SELECT on storage.objects for the processed-data bucket');
      console.error('💡 Run the SQL script: processed_data_storage_policies.sql in your Supabase SQL Editor');
      return [];
    }
    
    if (!files) {
      console.error('❌ Files list is null. Check RLS policies.');
      return [];
    }

    console.log(`📁 Found ${files?.length || 0} total files in processed-data bucket`);
    if (files && files.length > 0) {
      console.log('Sample files:', files.slice(0, 5).map(f => f.name));
    }

    if (!files || files.length === 0) {
      console.log('⚠️ No files found in processed-data bucket');
      return [];
    }

    // Filter for vessel telemetry files (parquet files with vessel-telemetry prefix)
    const vesselFiles = files.filter(file => 
      file.name.startsWith('vessel-telemetry-') && 
      file.name.endsWith('.parquet')
    );

    console.log(`🚢 Found ${vesselFiles.length} vessel telemetry files:`, vesselFiles.map(f => f.name));

    // Fetch metadata from metadata_Kadal AI table for quality reports
    const filenames = vesselFiles.map(f => f.name);
    
    console.log(`📊 Fetching metadata for ${filenames.length} files...`);
    
    let metadataMap: Record<string, any> = {};
    if (filenames.length > 0) {
      const { data: metadata, error: metadataError } = await supabase
        .from('metadata_Kadal AI')
        .select('processed_file_location, metadata_payload, created_at')
        .in('processed_file_location', filenames);

      if (metadataError) {
        console.error('❌ Error fetching metadata:', metadataError);
      } else if (metadata) {
        console.log(`✅ Found metadata for ${metadata.length} files`);
        metadata.forEach(item => {
          metadataMap[item.processed_file_location] = item;
        });
      }
    }

    // Map files to VesselTelemetryFile format
    const telemetryFiles: VesselTelemetryFile[] = vesselFiles.map(file => {
      const metadata = metadataMap[file.name];
      const fileDate = extractDateFromFilename(file.name) || new Date(file.created_at || Date.now());
      
      // Extract quality report from metadata if available
      let qualityReport = null;
      if (metadata?.metadata_payload?.quality_report_json) {
        qualityReport = metadata.metadata_payload.quality_report_json;
        qualityReport.file_name = file.name;
      } else if (metadata?.metadata_payload?.qc_summary) {
        // Fallback: construct basic quality report from qc_summary
        qualityReport = {
          file_name: file.name,
          summary: {
            quality_status: metadata.metadata_payload.qc_summary.quality_status || 'UNKNOWN',
            total_data_points: metadata.metadata_payload.total_rows || 0
          },
          detailed_metrics: {
            overall_quality_score: metadata.metadata_payload.qc_summary.overall_quality_score || 0
          }
        };
      }

      // Estimate data points from metadata or use default
      const dataPoints = metadata?.metadata_payload?.total_rows || 0;

      return {
        filename: file.name,
        timestamp: metadata?.created_at || file.created_at || new Date().toISOString(),
        qualityReport,
        dataPoints,
        filePath: file.name
      };
    });

    // Sort by timestamp (newest first)
    telemetryFiles.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    console.log(`✅ Returning ${telemetryFiles.length} vessel telemetry files`);
    return telemetryFiles;
  } catch (error) {
    console.error('Error fetching vessel telemetry files from Supabase:', error);
    return [];
  }
};

/**
 * Fetch vessel telemetry files for a specific date
 */
export const fetchVesselTelemetryFilesByDate = async (date: Date): Promise<VesselTelemetryFile[]> => {
  const allFiles = await fetchVesselTelemetryFiles();
  const targetDateStr = getLocalDateString(date);

  return allFiles.filter(file => {
    const fileDate = extractDateFromFilename(file.filename) || new Date(file.timestamp);
    const fileDateStr = getLocalDateString(fileDate);
    return fileDateStr === targetDateStr;
  });
};

/**
 * Get all dates that have vessel telemetry uploads
 */
export const getDatesWithUploads = async (): Promise<Set<string>> => {
  const files = await fetchVesselTelemetryFiles();
  const dates = new Set<string>();

  files.forEach(file => {
    const fileDate = extractDateFromFilename(file.filename) || new Date(file.timestamp);
    const dateStr = getLocalDateString(fileDate);
    dates.add(dateStr);
  });

  return dates;
};

