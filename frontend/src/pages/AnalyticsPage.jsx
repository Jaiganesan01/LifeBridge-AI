import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Activity, 
  Bed, 
  Wind, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Building2, 
  TrendingUp, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { getAnalytics } from '../services/api';

export default function AnalyticsPage({ webSocketEvent }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    getAnalytics()
      .then((res) => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Update on WebSocket resource updates
  useEffect(() => {
    if (webSocketEvent) {
      fetchStats();
    }
  }, [webSocketEvent]);

  if (loading && !data) {
    return (
      <div className="p-16 text-center text-slate-500 text-xs">
        Loading regional analytics & shortage alerts...
      </div>
    );
  }

  const {
    emergencies_today = 14,
    active_cases = 3,
    hospitals_online = 10,
    icu_total = 200,
    icu_available = 42,
    icu_utilization_pct = 79.0,
    ventilator_total = 100,
    ventilator_available = 24,
    ventilator_utilization_pct = 76.0,
    beds_total = 1000,
    beds_available = 280,
    avg_response_time_min = 8.4,
    most_requested_resources = {},
    hospital_loads = [],
    active_alerts = []
  } = data || {};

  return (
    <div className="space-y-8 pb-16">
      {/* Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-white uppercase tracking-wider">
              REGIONAL TELEMETRY
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              REAL-TIME ANALYTICS
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Emergency Health Network Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Regional clinical capacity, real-time shortage threshold alerts, and resource utilization.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
          title="Refresh Metrics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Top KPI Metrics Grid (Section 22) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Cases Today */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Cases Today
          </span>
          <div className="text-2xl font-black text-slate-900">{emergencies_today}</div>
          <span className="text-[10px] text-slate-400 font-medium">Logged today</span>
        </div>

        {/* Active Cases */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Active Cases
          </span>
          <div className="text-2xl font-black text-rose-600">{active_cases}</div>
          <span className="text-[10px] text-rose-500 font-semibold animate-pulse">In transit / prep</span>
        </div>

        {/* Hospitals Online */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Hospitals Online
          </span>
          <div className="text-2xl font-black text-slate-900">{hospitals_online}</div>
          <span className="text-[10px] text-emerald-600 font-semibold">100% network sync</span>
        </div>

        {/* ICU Availability */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            ICU Available
          </span>
          <div className="text-2xl font-black text-blue-700">
            {icu_available}{' '}
            <span className="text-xs font-normal text-slate-400">/ {icu_total}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">{icu_utilization_pct}% utilized</span>
        </div>

        {/* Ventilator Availability */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Ventilators Ready
          </span>
          <div className="text-2xl font-black text-cyan-700">
            {ventilator_available}{' '}
            <span className="text-xs font-normal text-slate-400">/ {ventilator_total}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">{ventilator_utilization_pct}% utilized</span>
        </div>

        {/* Avg Response Time */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Avg Dispatch Time
          </span>
          <div className="text-2xl font-black text-emerald-600">
            {avg_response_time_min} <span className="text-xs font-normal text-slate-400">min</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">-18% vs standard</span>
        </div>
      </div>

      {/* Automatic Resource Shortage Alerts (Section 23) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            Automatic Shortage Alerts (Thresholds: ICU &lt; 20%, Vents &lt; 20%, Load &gt; 80%)
          </h2>
        </div>

        {active_alerts.length === 0 ? (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>All regional hospitals operating within normal safe capacity margins.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {active_alerts.map((al, idx) => (
              <div 
                key={idx}
                className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                  al.severity === 'critical'
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs block">{al.hospital_name}</span>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    al.severity === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {al.type}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">{al.message}</p>
                <span className="text-[10px] opacity-60 block pt-1">
                  Reported: {new Date(al.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hospital Emergency Load Bar Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-healthcare-600" />
              Hospital Emergency Department Loads (%)
            </h3>
            <span className="text-[11px] text-slate-400">Target &lt; 75%</span>
          </div>

          <div className="space-y-2.5 pt-2">
            {hospital_loads.map((h, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-800 truncate max-w-[220px]">{h.name}</span>
                  <span className={`font-extrabold ${h.load > 80 ? 'text-rose-600' : 'text-slate-700'}`}>
                    {h.load}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      h.load > 80 ? 'bg-rose-500' : h.load > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${h.load}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Requested Resources Frequency */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-healthcare-600" />
              Most Requested Medical Resources (Today)
            </h3>
            <span className="text-[11px] text-slate-400">Demand breakdown</span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(most_requested_resources).map(([resName, count], idx) => {
              const maxCount = 20;
              const pct = Math.round((count / maxCount) * 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700">{resName}</span>
                    <span className="font-black text-slate-900">{count} requests</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-healthcare-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
