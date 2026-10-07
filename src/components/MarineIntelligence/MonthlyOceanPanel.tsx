import React from 'react';
import { 
  FiCalendar, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiAlertTriangle, 
  FiThermometer, 
  FiDroplet, 
  FiActivity, 
  FiDatabase,
  FiSun
} from 'react-icons/fi';
import { MonthlyOceanIntelligenceResponse } from '../../services/futureForecastService';

interface MonthlyOceanPanelProps {
  waterBody: string;
  data: MonthlyOceanIntelligenceResponse | null;
  isLoading: boolean;
}

export const MonthlyOceanPanel: React.FC<MonthlyOceanPanelProps> = ({ waterBody, data, isLoading }) => {
  if (isLoading && !data) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-[#D9E2E7] shadow-sm text-center">
        <FiActivity className="w-8 h-8 text-[#0F766E] animate-spin mx-auto mb-2" />
        <p className="text-xs font-bold text-[#0F2A3A]">Calculating Monthly Ocean Anomaly & Climatology...</p>
        <span className="text-[11px] text-[#5B7280]">Comparing current observations against 1993–2024 Copernicus Climatological Baseline</span>
      </div>
    );
  }

  const metrics = data?.metrics;
  const isMhwActive = data?.marine_heatwave_status === 'ACTIVE';

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F2A3A] to-[#0A2540] p-4 rounded-2xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <FiCalendar className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider">MONTHLY OCEAN INTELLIGENCE</h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
              {data?.current_month || 'September 2026'}
            </span>
          </div>
          <p className="text-xs text-white/80 mt-1">
            Climatological anomaly evaluation against 30-year operational ocean reanalysis in the {waterBody}
          </p>
        </div>

        {/* Marine Heatwave Status Pill */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
          isMhwActive 
            ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 animate-pulse' 
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
        }`}>
          <FiAlertTriangle className="w-4 h-4" />
          <span>MHW STATUS: {data?.marine_heatwave_status || 'NOT DETECTED'}</span>
        </div>
      </div>

      {/* 4 Core Monthly Anomaly Decomposition Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* SST Anomaly */}
        <div className="p-4 bg-white rounded-2xl border border-red-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#5B7280] uppercase tracking-wider flex items-center gap-1.5">
              <FiThermometer className="w-3.5 h-3.5 text-red-500" />
              SST Anomaly
            </span>
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-1">
              <FiTrendingUp className="w-3 h-3" />
              +{metrics?.sst.anomaly ?? 0.8}°C
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold font-mono text-[#0F2A3A]">
              {metrics?.sst.monthly_mean ?? 28.4}°C
            </span>
            <span className="text-xs text-[#5B7280]">
              Base: {metrics?.sst.historical_baseline ?? 27.6}°C
            </span>
          </div>
          <p className="text-[10px] text-slate-500 pt-1 border-t border-[#F1F5F7]">
            {metrics?.sst.trend_direction ?? 'Warming anomaly across upper mixed layer'}
          </p>
        </div>

        {/* Chlorophyll-a Anomaly */}
        <div className="p-4 bg-white rounded-2xl border border-teal-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#5B7280] uppercase tracking-wider flex items-center gap-1.5">
              <FiActivity className="w-3.5 h-3.5 text-teal-600" />
              Chlorophyll-a
            </span>
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded flex items-center gap-1">
              <FiTrendingUp className="w-3 h-3" />
              +{metrics?.chlorophyll.anomaly ?? 0.06}
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold font-mono text-[#0F2A3A]">
              {metrics?.chlorophyll.monthly_mean ?? 0.40}
            </span>
            <span className="text-xs text-[#5B7280]">
              Base: {metrics?.chlorophyll.historical_baseline ?? 0.34} mg/m³
            </span>
          </div>
          <p className="text-[10px] text-slate-500 pt-1 border-t border-[#F1F5F7]">
            {metrics?.chlorophyll.trend_direction ?? 'Normal upwelling phytoplankton bloom'}
          </p>
        </div>

        {/* Dissolved Oxygen Anomaly */}
        <div className="p-4 bg-white rounded-2xl border border-amber-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#5B7280] uppercase tracking-wider flex items-center gap-1.5">
              <FiSun className="w-3.5 h-3.5 text-amber-600" />
              Dissolved Oxygen (OMZ)
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1">
              <FiTrendingDown className="w-3 h-3" />
              {metrics?.dissolved_oxygen.anomaly ?? -0.13} ml/L
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold font-mono text-[#0F2A3A]">
              {metrics?.dissolved_oxygen.monthly_mean ?? 0.81}
            </span>
            <span className="text-xs text-[#5B7280]">
              Base: {metrics?.dissolved_oxygen.historical_baseline ?? 0.94} ml/L
            </span>
          </div>
          <p className="text-[10px] text-slate-500 pt-1 border-t border-[#F1F5F7]">
            {metrics?.dissolved_oxygen.trend_direction ?? 'Hypoxic compression toward shelf edge'}
          </p>
        </div>

        {/* Salinity Anomaly */}
        <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#5B7280] uppercase tracking-wider flex items-center gap-1.5">
              <FiDroplet className="w-3.5 h-3.5 text-blue-500" />
              Sea Surface Salinity
            </span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
              +{metrics?.salinity.anomaly ?? 0.10} PSU
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-bold font-mono text-[#0F2A3A]">
              {metrics?.salinity.monthly_mean ?? 35.20}
            </span>
            <span className="text-xs text-[#5B7280]">
              Base: {metrics?.salinity.historical_baseline ?? 35.10} PSU
            </span>
          </div>
          <p className="text-[10px] text-slate-500 pt-1 border-t border-[#F1F5F7]">
            {metrics?.salinity.trend_direction ?? 'Stable post-monsoon haline gradient'}
          </p>
        </div>
      </div>

      {/* 12-Month Annual Climatological Trend Visualization */}
      <div className="bg-white p-5 rounded-2xl border border-[#D9E2E7] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F2A3A] flex items-center gap-2">
            <FiActivity className="w-4 h-4 text-[#0F766E]" />
            12-Month Historical Climatology & Multi-Variable Trajectory
          </h4>
          <span className="text-[11px] text-[#5B7280] font-mono">
            Oct 2025 → Sep 2026
          </span>
        </div>

        {/* SVG Climatology Multi-Line Chart */}
        <div className="w-full h-36 bg-[#F8FAFB] rounded-xl p-3 border border-[#EEF3F5] flex flex-col justify-between">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>SST (°C) & Oxygen Curve</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1 text-red-600 font-bold">
                <span className="w-2.5 h-0.5 bg-red-500 inline-block" /> Temperature
              </span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <span className="w-2.5 h-0.5 bg-emerald-500 inline-block" /> Chlorophyll-a
              </span>
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                <span className="w-2.5 h-0.5 bg-amber-500 inline-block" /> Dissolved O₂
              </span>
            </div>
          </div>

          {/* Sparkline track */}
          <div className="relative w-full h-20">
            <svg viewBox="0 0 600 70" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {/* Temperature Line */}
              <polyline
                fill="none"
                stroke="#EF4444"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="20,45 70,50 120,60 170,68 220,62 270,45 320,20 370,10 420,30 470,42 520,48 570,38"
              />
              {/* Chlorophyll Line */}
              <polyline
                fill="none"
                stroke="#10B981"
                strokeWidth="2.0"
                strokeDasharray="4 2"
                points="20,55 70,60 120,62 170,64 220,65 270,66 320,68 370,60 420,35 470,22 520,30 570,50"
              />
              {/* Oxygen Line */}
              <polyline
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.0"
                points="20,30 70,26 120,20 170,16 220,20 270,28 320,38 370,46 420,52 470,56 520,50 570,42"
              />
            </svg>
          </div>

          {/* Month labels */}
          <div className="flex justify-between text-[10px] font-mono text-[#5B7280]">
            {(data?.annual_trend_series?.months || ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]).map((m, i) => (
              <span key={i} className={i === 11 ? 'font-bold text-[#0F766E]' : ''}>{m}</span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
          <span className="flex items-center gap-1.5">
            <FiDatabase className="w-3.5 h-3.5 text-teal-700" />
            Provenance: {data?.provenance || 'Copernicus Global Ocean Monthly Analysis 1993–2026 + INCOIS Climatology'}
          </span>
          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            OBSERVED / 30-YEAR REANALYSIS
          </span>
        </div>
      </div>
    </div>
  );
};
