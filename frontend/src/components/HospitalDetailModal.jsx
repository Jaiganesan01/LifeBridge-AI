import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Phone, 
  Activity, 
  Bed, 
  Wind, 
  Droplet, 
  Stethoscope, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { getHospital } from '../services/api';

export default function HospitalDetailModal({ hospitalId, onClose, onSelectHospital }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartMetric, setChartMetric] = useState('icu_available');

  useEffect(() => {
    if (!hospitalId) return;
    setLoading(true);
    getHospital(hospitalId)
      .then((data) => {
        setDetail(data);
      })
      .catch((err) => {
        console.error('Failed to load hospital details', err);
      })
      .finally(() => setLoading(false));
  }, [hospitalId]);

  if (!hospitalId) return null;

  // Helper to render SVG Resource History Line Chart
  const renderHistoryChart = (history = []) => {
    if (!history || history.length < 2) {
      return (
        <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
          Gathering live simulation history points...
        </div>
      );
    }

    const width = 560;
    const height = 150;
    const padding = 28;

    const values = history.map((item) => item[chartMetric] || 0);
    const minVal = Math.min(...values, 0);
    const maxVal = Math.max(...values, 10);
    const range = maxVal - minVal || 1;

    const points = values.map((val, idx) => {
      const x = padding + (idx / (values.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - minVal) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    const lastVal = values[values.length - 1];

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 bg-slate-900 rounded-xl p-2 select-none">
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#334155" strokeDasharray="3,3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#334155" strokeDasharray="3,3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" />

          {/* Polyline */}
          <polyline
            fill="none"
            stroke={chartMetric === 'emergency_load' ? '#f43f5e' : '#38bdf8'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Data point dots */}
          {values.map((val, idx) => {
            const x = padding + (idx / (values.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((val - minVal) / range) * (height - 2 * padding);
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r={idx === values.length - 1 ? 5 : 2.5}
                fill={idx === values.length - 1 ? '#ffffff' : (chartMetric === 'emergency_load' ? '#f43f5e' : '#38bdf8')}
                className="transition-all"
              />
            );
          })}

          {/* Labels */}
          <text x={padding} y={padding - 6} fill="#94a3b8" fontSize="10">Max: {maxVal}</text>
          <text x={padding} y={height - 6} fill="#94a3b8" fontSize="10">Min: {minVal}</text>
          <text x={width - padding - 40} y={height - 6} fill="#38bdf8" fontSize="10" fontWeight="bold">
            Live: {lastVal}{chartMetric === 'emergency_load' ? '%' : ''}
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-healthcare-50 text-healthcare-700 border border-healthcare-200 uppercase">
                {detail?.trauma_level || 'Hospital Profile'}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE CONNECTED
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              {detail?.name || 'Loading Hospital...'}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{detail?.address}</span>
              <span className="text-slate-300">•</span>
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{detail?.phone}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Fetching clinical resource metrics...
          </div>
        ) : detail ? (
          <div className="p-6 space-y-6">
            {/* Live Utilization Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* ICU */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-semibold flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-blue-600" /> ICU Capacity
                  </span>
                  <span className="text-[10px] font-bold text-blue-600">
                    {Math.round((1 - detail.icu_available / Math.max(1, detail.icu_total)) * 100)}% Used
                  </span>
                </div>
                <div className="text-xl font-extrabold text-slate-900">
                  {detail.icu_available}{' '}
                  <span className="text-xs font-normal text-slate-500">/ {detail.icu_total}</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                  <div 
                    className="bg-blue-600 h-full rounded-full" 
                    style={{ width: `${Math.round((detail.icu_available / Math.max(1, detail.icu_total)) * 100)}%` }} 
                  />
                </div>
              </div>

              {/* Ventilator */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-semibold flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-cyan-600" /> Ventilators
                  </span>
                  <span className="text-[10px] font-bold text-cyan-600">
                    {detail.ventilator_available > 0 ? 'Ready' : 'Depleted'}
                  </span>
                </div>
                <div className="text-xl font-extrabold text-slate-900">
                  {detail.ventilator_available}{' '}
                  <span className="text-xs font-normal text-slate-500">/ {detail.ventilator_total}</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                  <div 
                    className="bg-cyan-500 h-full rounded-full" 
                    style={{ width: `${Math.round((detail.ventilator_available / Math.max(1, detail.ventilator_total)) * 100)}%` }} 
                  />
                </div>
              </div>

              {/* Emergency Beds */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-semibold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-600" /> Emergency Beds
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {detail.beds_available} open
                  </span>
                </div>
                <div className="text-xl font-extrabold text-slate-900">
                  {detail.beds_available}{' '}
                  <span className="text-xs font-normal text-slate-500">/ {detail.beds_total}</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                  <div 
                    className="bg-emerald-500 h-full rounded-full" 
                    style={{ width: `${Math.round((detail.beds_available / Math.max(1, detail.beds_total)) * 100)}%` }} 
                  />
                </div>
              </div>

              {/* Department Load */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-semibold flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-rose-500" /> Dept Load
                  </span>
                  <span className="text-[10px] font-bold text-rose-600">
                    {detail.emergency_status}
                  </span>
                </div>
                <div className="text-xl font-extrabold text-slate-900">
                  {detail.emergency_load}%
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                  <div 
                    className={`h-full rounded-full ${detail.emergency_load > 80 ? 'bg-rose-500' : 'bg-amber-500'}`} 
                    style={{ width: `${detail.emergency_load}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Historical Resource Fluctuations Chart */}
            <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/50">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-healthcare-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Resource History Over Time (Simulated 12-Hour Trend)
                  </h4>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                  <button
                    onClick={() => setChartMetric('icu_available')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      chartMetric === 'icu_available' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    ICU Beds
                  </button>
                  <button
                    onClick={() => setChartMetric('ventilator_available')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      chartMetric === 'ventilator_available' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Ventilators
                  </button>
                  <button
                    onClick={() => setChartMetric('emergency_load')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      chartMetric === 'emergency_load' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Load %
                  </button>
                </div>
              </div>

              {renderHistoryChart(detail.recent_history)}
            </div>

            {/* Specialists on Duty */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-healthcare-600" />
                Specialist Physicians & Surgeons On Duty
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {detail.specialists?.map((spec, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white shadow-2xs text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{spec.name}</p>
                      <p className="text-slate-500 text-[11px]">{spec.specialty}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      spec.is_available && spec.on_duty 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {spec.is_available && spec.on_duty ? 'On Duty' : 'On Call'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Blood Bank Inventory */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-rose-500" />
                Blood Bank Reserves (Units Available)
              </h4>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {detail.blood_stocks?.map((b, idx) => (
                  <div 
                    key={idx} 
                    className="text-center p-2 rounded-xl border border-slate-100 bg-white shadow-2xs"
                  >
                    <span className="font-extrabold text-sm text-slate-900 block">{b.blood_group}</span>
                    <span className="font-bold text-xs text-rose-600">{b.units_available}u</span>
                    <span className={`block text-[9px] font-bold uppercase mt-1 ${
                      b.status === 'Critical' ? 'text-rose-600' :
                      b.status === 'Low' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between mt-auto">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Last Synced: {detail?.last_updated ? new Date(detail.last_updated).toLocaleTimeString() : 'Just now'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Close
            </button>
            {onSelectHospital && detail && (
              <button
                onClick={() => {
                  onSelectHospital(detail);
                  onClose();
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition transform active:scale-95"
              >
                Select & Request Care
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
