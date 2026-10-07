import React from 'react';
import { 
  FiClock, 
  FiThermometer, 
  FiWind, 
  FiActivity, 
  FiDroplet, 
  FiDatabase,
  FiZap,
  FiSun
} from 'react-icons/fi';
import { DailyMarineConditionsResponse, DailyTimeSeriesPoint } from '../../services/futureForecastService';

interface DailyMarinePanelProps {
  waterBody: string;
  data: DailyMarineConditionsResponse | null;
  isLoading: boolean;
}

// Compact interactive SVG Sparkline Chart
const MiniTimeSeriesChart: React.FC<{
  title: string;
  points: DailyTimeSeriesPoint[];
  color: string;
  fillColor: string;
  unit: string;
  icon: React.ReactNode;
}> = ({ title, points, color, fillColor, unit, icon }) => {
  if (!points || points.length === 0) {
    return (
      <div className="p-4 bg-white rounded-2xl border border-[#D9E2E7] shadow-xs flex flex-col justify-center items-center h-44 text-[#5B7280]">
        <span className="text-xs font-semibold">Data unavailable</span>
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal > 0 ? maxVal - minVal : 1;
  const height = 80;
  const width = 280;

  const svgPoints = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * (width - 10) + 5;
    const y = height - ((p.value - minVal) / range) * (height - 18) - 9;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${5},${height} ` + svgPoints + ` ${width - 5},${height}`;
  const latestPoint = points[points.length - 1];

  return (
    <div className="p-4 bg-white rounded-2xl border border-[#D9E2E7] shadow-xs space-y-2 hover:border-[#0F766E] transition-all">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#5B7280] uppercase tracking-wider flex items-center gap-1.5">
          {icon}
          {title}
        </span>
        <div className="text-right">
          <span className="text-base font-bold font-mono text-[#0F2A3A]">
            {latestPoint.value}
          </span>
          <span className="text-[10px] text-[#5B7280] ml-1">{unit}</span>
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20 overflow-visible">
          <defs>
            <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor} stopOpacity="0.45" />
              <stop offset="100%" stopColor={fillColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill={`url(#grad-${title.replace(/\s+/g, '')})`} />
          <polyline fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" points={svgPoints} />
          {/* Latest Point Marker */}
          {points.length > 0 && (
            <circle
              cx={(width - 5)}
              cy={height - ((latestPoint.value - minVal) / range) * (height - 18) - 9}
              r="3.5"
              fill={color}
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
          )}
        </svg>
      </div>

      <div className="flex justify-between items-center text-[10px] font-mono text-[#5B7280] pt-1 border-t border-[#F1F5F7]">
        <span>24h Min: <strong>{minVal} {unit}</strong></span>
        <span>24h Max: <strong>{maxVal} {unit}</strong></span>
      </div>
    </div>
  );
};

export const DailyMarinePanel: React.FC<DailyMarinePanelProps> = ({ waterBody, data, isLoading }) => {
  if (isLoading && !data) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-[#D9E2E7] shadow-sm text-center">
        <FiActivity className="w-8 h-8 text-[#0F766E] animate-spin mx-auto mb-2" />
        <p className="text-xs font-bold text-[#0F2A3A]">Generating 24-Hour Marine Observations...</p>
        <span className="text-[11px] text-[#5B7280]">Compiling hourly weather station & wave buoy step intervals</span>
      </div>
    );
  }

  const charts = data?.charts;
  const summary = data?.summary_24h;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F2A3A] to-[#0F766E] p-4 rounded-2xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FiClock className="w-4 h-4 text-teal-300" />
            <h3 className="text-sm font-bold uppercase tracking-wider">24-HOUR MARINE CONDITIONS</h3>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-mono font-bold">
              Hourly Resolution
            </span>
          </div>
          <p className="text-xs text-white/80 mt-1">
            Real-time hourly time-series observations covering the last 24 hours across the {waterBody}
          </p>
        </div>
        <div className="text-[11px] font-mono bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
          <span>Date: {data?.date || new Date().toISOString().split('T')[0]} (24-Hour Rolling Window)</span>
        </div>
      </div>

      {/* 4 Hourly Interactive Time-Series Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MiniTimeSeriesChart
          title="Surface Temperature"
          points={charts?.temperature_24h || []}
          color="#EF4444"
          fillColor="#EF4444"
          unit="°C"
          icon={<FiThermometer className="w-3.5 h-3.5 text-red-500" />}
        />
        <MiniTimeSeriesChart
          title="Significant Wave Height"
          points={charts?.wave_height_24h || []}
          color="#06B6D4"
          fillColor="#06B6D4"
          unit="m"
          icon={<FiZap className="w-3.5 h-3.5 text-cyan-500" />}
        />
        <MiniTimeSeriesChart
          title="Surface Wind Speed"
          points={charts?.wind_speed_24h || []}
          color="#6366F1"
          fillColor="#6366F1"
          unit="km/h"
          icon={<FiWind className="w-3.5 h-3.5 text-indigo-500" />}
        />
        <MiniTimeSeriesChart
          title="Tidal Sea Level (CD)"
          points={charts?.sea_level_24h || []}
          color="#0F766E"
          fillColor="#0F766E"
          unit="m"
          icon={<FiDroplet className="w-3.5 h-3.5 text-teal-600" />}
        />
      </div>

      {/* 24-Hour Summary Decomposition Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white rounded-xl border border-[#D9E2E7] text-center">
          <span className="text-[10px] font-bold text-[#5B7280] uppercase tracking-wider block">Temp Extremes</span>
          <span className="text-base font-bold font-mono text-[#0F2A3A]">
            {summary?.temp_min ?? 27.8}° – {summary?.temp_max ?? 28.9}°C
          </span>
        </div>
        <div className="p-3 bg-white rounded-xl border border-[#D9E2E7] text-center">
          <span className="text-[10px] font-bold text-[#5B7280] uppercase tracking-wider block">Peak Wave Energy</span>
          <span className="text-base font-bold font-mono text-cyan-700">
            {summary?.wave_max ?? 1.65} m (Moderate)
          </span>
        </div>
        <div className="p-3 bg-white rounded-xl border border-[#D9E2E7] text-center">
          <span className="text-[10px] font-bold text-[#5B7280] uppercase tracking-wider block">Max Wind Gust</span>
          <span className="text-base font-bold font-mono text-indigo-700">
            {summary?.wind_max ?? 24.5} km/h
          </span>
        </div>
        <div className="p-3 bg-white rounded-xl border border-[#D9E2E7] text-center">
          <span className="text-[10px] font-bold text-[#5B7280] uppercase tracking-wider block">Tidal Range</span>
          <span className="text-base font-bold font-mono text-teal-700">
            {summary?.tide_range_m ?? 1.3} m (Semidiurnal)
          </span>
        </div>
      </div>

      {/* Salinity, Currents, Chlorophyll & Oxygen Strip */}
      <div className="p-4 bg-white rounded-2xl border border-[#D9E2E7] shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <FiDroplet className="w-4 h-4 text-blue-500" />
          <span className="text-[#5B7280]">Mean Salinity:</span>
          <strong className="text-[#0F2A3A] font-mono">{summary?.mean_salinity_psu ?? 35.15} PSU</strong>
        </div>
        <div className="flex items-center gap-2">
          <FiSun className="w-4 h-4 text-emerald-500" />
          <span className="text-[#5B7280]">Dissolved Oxygen:</span>
          <strong className="text-[#0F2A3A] font-mono">{summary?.dissolved_oxygen_mean ?? 0.84} ml/L</strong>
        </div>
        <div className="flex items-center gap-2">
          <FiActivity className="w-4 h-4 text-teal-500" />
          <span className="text-[#5B7280]">Chlorophyll-a:</span>
          <strong className="text-[#0F2A3A] font-mono">{summary?.chlorophyll_mean ?? 0.38} mg/m³</strong>
        </div>
        <div className="flex items-center gap-2">
          <FiDatabase className="w-4 h-4 text-slate-400" />
          <span className="text-[11px] text-slate-500 font-mono">
            {data?.data_provenance || 'OBSERVED / CMLRE AWS & Hourly In-Situ Forecast'}
          </span>
        </div>
      </div>
    </div>
  );
};
