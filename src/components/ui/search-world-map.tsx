import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

// Map content component to avoid duplication
const MapContent = ({ dataPoints, color, mapRef, setHoveredPoint, setTooltipPosition, geoUrl }: any) => (
  <>
    <Geographies geography={geoUrl}>
      {({ geographies }: { geographies: any[] }) =>
        geographies.map((geo: any) => (
          <Geography
            key={geo.rsmKey}
            geography={geo}
            fill="#D9E2E7"
            stroke="#CBD5E1"
            strokeWidth={0.5}
            style={{
              default: {
                fill: "#D9E2E7",
                stroke: "#CBD5E1",
                strokeWidth: 0.5,
                outline: "none",
              },
              hover: {
                fill: "#CBD5E1",
                stroke: "#94A3B8",
                strokeWidth: 0.5,
                outline: "none",
              },
              pressed: {
                fill: "#CBD5E1",
                stroke: "#94A3B8",
                strokeWidth: 0.5,
                outline: "none",
              },
            }}
          />
        ))
      }
    </Geographies>
    
    {/* Data Points */}
    {dataPoints.map((point: any, index: number) => (
      <Marker key={`marker-${point.lat}-${point.lng}`} coordinates={[point.lng, point.lat]}>
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.2, duration: 0.6 }}
          onMouseEnter={(e: any) => {
            setHoveredPoint(point);
            const rect = e.currentTarget.getBoundingClientRect();
            const containerRect = mapRef.current?.getBoundingClientRect();
            if (containerRect) {
              setTooltipPosition({
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top - 10
              });
            }
          }}
          onMouseLeave={() => setHoveredPoint(null)}
          onMouseMove={(e: any) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const containerRect = mapRef.current?.getBoundingClientRect();
            if (containerRect) {
              setTooltipPosition({
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top - 10
              });
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          {/* Outer pulsing ring */}
          <motion.circle
            r={8}
            fill="none"
            stroke={color}
            strokeWidth={1}
            opacity={0.4}
            initial={{ r: 8, opacity: 0.4 }}
            animate={{ 
              r: [8, 16, 8],
              opacity: [0.4, 0.1, 0.4]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: index * 0.4
            }}
          />
          {/* Middle pulsing ring */}
          <motion.circle
            r={5}
            fill={color}
            opacity={0.2}
            initial={{ r: 5, opacity: 0.2 }}
            animate={{ 
              r: [5, 10, 5],
              opacity: [0.2, 0.05, 0.2]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: index * 0.3
            }}
          />
          {/* Main point */}
          <circle
            r={3}
            fill={color}
            stroke="white"
            strokeWidth={0.5}
          />
          {/* Inner highlight */}
          <circle
            r={1}
            fill="white"
            opacity={0.9}
          />
        </motion.g>
      </Marker>
    ))}
  </>
);

interface SearchWorldMapProps {
  dataPoints: Array<{
    lat: number;
    lng: number;
    label: string;
    locality: string;
    scientificName?: string;
    waterBody?: string;
    eventDate?: string;
    samplingProtocol?: string;
    minimumDepthInMeters?: number;
    maximumDepthInMeters?: number;
    identifiedBy?: string;
  }>;
  color?: string;
}

const SearchWorldMap: React.FC<SearchWorldMapProps> = ({ 
  dataPoints, 
  color = '#0F766E' 
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 0]);
  const mapRef = useRef<HTMLDivElement>(null);
  
  // World map topology data URL
  const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

  // Handle zoom and pan
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 8));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.5, 0.5));
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setCenter([0, 0]);
  }, []);

  // Handle pan with mouse
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startCenter = [...center] as [number, number];

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      // Convert pixel movement to geographic coordinates
      const deltaLng = (deltaX / 600) * 360 / zoom;
      const deltaLat = -(deltaY / 300) * 180 / zoom;
      
      setCenter([
        startCenter[0] + deltaLng,
        Math.max(-90, Math.min(90, startCenter[1] + deltaLat))
      ]);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [center, zoom]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(8, prev * delta)));
  }, []);

  // Calculate center based on data points if available
  const getInitialCenter = useCallback(() => {
    if (dataPoints.length > 0) {
      const avgLat = dataPoints.reduce((sum, point) => sum + point.lat, 0) / dataPoints.length;
      const avgLng = dataPoints.reduce((sum, point) => sum + point.lng, 0) / dataPoints.length;
      return [avgLng, avgLat] as [number, number];
    }
    return [0, 0] as [number, number];
  }, [dataPoints]);

  // Set initial center when data points change
  useEffect(() => {
    if (dataPoints.length > 0) {
      setCenter(getInitialCenter());
    }
  }, [dataPoints, getInitialCenter]);

  // Handle zoom changes with debouncing to prevent conflicts
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // This helps prevent the selection.interrupt error
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [zoom, center]);


  return (
    <div ref={mapRef} className="w-full h-full relative bg-[#EEF3F5] rounded-xl overflow-hidden border border-[#D9E2E7]">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur-sm border border-[#D9E2E7] rounded-lg px-3 py-2 mb-2 shadow-sm">
          <div className="text-xs text-[#5B7280] font-mono text-center">
            Zoom: {Math.round(zoom * 100)}%
          </div>
        </div>
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 bg-white/90 hover:bg-[#EEF3F5] border border-[#D9E2E7] rounded-lg flex items-center justify-center text-[#0F2A3A] text-sm font-bold transition-colors duration-200 shadow-sm"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 bg-white/90 hover:bg-[#EEF3F5] border border-[#D9E2E7] rounded-lg flex items-center justify-center text-[#0F2A3A] text-sm font-bold transition-colors duration-200 shadow-sm"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={handleReset}
          className="w-8 h-8 bg-white/90 hover:bg-[#EEF3F5] border border-[#D9E2E7] rounded-lg flex items-center justify-center text-[#0F2A3A] text-xs font-bold transition-colors duration-200 shadow-sm"
          title="Reset View"
        >
          ⌂
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm border border-[#D9E2E7] rounded-lg px-3 py-2 shadow-sm">
        <div className="text-xs text-[#5B7280]">
          <div className="font-semibold text-[#0F2A3A] mb-1">Interactive Map</div>
          <div>• Drag to pan</div>
          <div>• Scroll to zoom</div>
          <div>• Use controls to navigate</div>
        </div>
      </div>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 100 * zoom,
          center: center
        }}
        width={600}
        height={300}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        style={{ cursor: 'grab' }}
      >
        <MapContent dataPoints={dataPoints} color={color} mapRef={mapRef} setHoveredPoint={setHoveredPoint} setTooltipPosition={setTooltipPosition} geoUrl={geoUrl} />
      </ComposableMap>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-[#D9E2E7] shadow-sm">
        <div className="flex items-center gap-2 text-xs text-[#0F2A3A]">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }}></div>
          <span className="font-medium">{dataPoints.length} occurrence{dataPoints.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Region label */}
      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-[#D9E2E7] shadow-sm">
        <div className="text-xs text-[#0F2A3A] font-medium">Lakshadweep Islands</div>
        <div className="text-xs text-[#5B7280]">Arabian Sea</div>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-[#D9E2E7] shadow-sm">
        <div className="text-xs text-[#0F2A3A] font-medium">Scale</div>
        <div className="flex items-center gap-1 mt-1">
          <div className="w-8 h-0.5 bg-[#5B7280]"></div>
          <span className="text-xs text-[#5B7280]">1000km</span>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredPoint && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="absolute z-50 pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          <div className="bg-white/95 backdrop-blur-sm border border-[#D9E2E7] rounded-xl p-4 shadow-xl min-w-[280px]">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                <h4 className="text-sm font-semibold text-[#0F2A3A]">Location Details</h4>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#5B7280]">Species:</span>
                  <span className="text-[#0F2A3A] font-medium">{hoveredPoint.scientificName || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B7280]">Locality:</span>
                  <span className="text-[#0F2A3A] font-medium">{hoveredPoint.locality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B7280]">Coordinates:</span>
                  <span className="text-[#0F2A3A] font-mono">{hoveredPoint.lat.toFixed(4)}°, {hoveredPoint.lng.toFixed(4)}°</span>
                </div>
                {hoveredPoint.waterBody && (
                  <div className="flex justify-between">
                    <span className="text-[#5B7280]">Water Body:</span>
                    <span className="text-[#0F2A3A] font-medium">{hoveredPoint.waterBody}</span>
                  </div>
                )}
                {hoveredPoint.eventDate && (
                  <div className="flex justify-between">
                    <span className="text-[#5B7280]">Date:</span>
                    <span className="text-[#0F2A3A] font-mono">{new Date(hoveredPoint.eventDate).toLocaleDateString()}</span>
                  </div>
                )}
                {hoveredPoint.samplingProtocol && (
                  <div className="flex justify-between">
                    <span className="text-[#5B7280]">Method:</span>
                    <span className="text-[#0F2A3A]">{hoveredPoint.samplingProtocol}</span>
                  </div>
                )}
                {(hoveredPoint.minimumDepthInMeters || hoveredPoint.maximumDepthInMeters) && (
                  <div className="flex justify-between">
                    <span className="text-[#5B7280]">Depth:</span>
                    <span className="text-[#0F2A3A] font-mono">
                      {hoveredPoint.minimumDepthInMeters || '—'}m - {hoveredPoint.maximumDepthInMeters || '—'}m
                    </span>
                  </div>
                )}
                {hoveredPoint.identifiedBy && (
                  <div className="flex justify-between">
                    <span className="text-[#5B7280]">Identified by:</span>
                    <span className="text-[#0F2A3A]">{hoveredPoint.identifiedBy}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SearchWorldMap;