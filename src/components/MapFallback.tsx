import React from 'react';
import { DataPoint } from '../App';

interface MapFallbackProps {
  dataPoints: DataPoint[];
  onDataPointClick: (dataPoint: DataPoint) => void;
}

const MapFallback: React.FC<MapFallbackProps> = ({ dataPoints, onDataPointClick }) => {
  // Get color based on water body
  const getWaterBodyColor = (waterBody: string) => {
    switch (waterBody) {
      case 'Arabian Sea':
        return '#0F766E';
      case 'Bay of Bengal':
        return '#0369A1';
      case 'Andaman Sea':
        return '#D97706';
      default:
        return '#E4572E';
    }
  };

  // Calculate bounds for the map
  const bounds = dataPoints.reduce(
    (acc, point) => ({
      minLat: Math.min(acc.minLat, point.decimalLatitude),
      maxLat: Math.max(acc.maxLat, point.decimalLatitude),
      minLng: Math.min(acc.minLng, point.decimalLongitude),
      maxLng: Math.max(acc.maxLng, point.decimalLongitude),
    }),
    {
      minLat: Infinity,
      maxLat: -Infinity,
      minLng: Infinity,
      maxLng: -Infinity,
    }
  );

  return (
    <div className="flex items-center justify-center h-full bg-[#F7F9FA] relative">
      <div className="text-center p-8 bg-white border border-[#D9E2E7] rounded-2xl shadow-paper max-w-lg">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#0F766E]/10 rounded-2xl border border-[#0F766E]/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#0F766E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold font-serif text-[#0F2A3A] mb-2">2D Map View</h3>
          <p className="text-[#5B7280] text-sm mb-4">
            WebGL 3D rendering is not available. Showing 2D map instead.
          </p>
        </div>

        {/* 2D Map Visualization */}
        <div className="relative w-80 h-80 mx-auto bg-[#EEF3F5] rounded-xl border border-[#D9E2E7] overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-[#5B7280] text-xs font-semibold uppercase tracking-wider">Map Coordinates Grid</div>
          </div>
          
          {/* Data Points */}
          {dataPoints.map((point, index) => {
            const x = ((point.decimalLongitude - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
            const y = ((bounds.maxLat - point.decimalLatitude) / (bounds.maxLat - bounds.minLat)) * 100;
            
            return (
              <div
                key={index}
                className="absolute w-3.5 h-3.5 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-150 transition-transform duration-150 border-2 border-white shadow-sm"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  backgroundColor: getWaterBodyColor(point.waterBody),
                }}
                onClick={() => onDataPointClick(point)}
                title={`${point.scientificName} - ${point.locality}`}
              />
            );
          })}
        </div>

        <div className="mt-6 text-sm text-[#5B7280]">
          <p>Click on data points to view details</p>
          <p className="mt-2 text-xs">
            Total data points: <span className="text-[#0F766E] font-bold font-mono text-sm">{dataPoints.length}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapFallback;
