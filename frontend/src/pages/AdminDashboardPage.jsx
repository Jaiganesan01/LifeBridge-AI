import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  RefreshCw, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw,
  Building2,
  Bed,
  Wind,
  Activity,
  Droplet
} from 'lucide-react';
import { getHospitals, updateHospitalResources, resetDemoDatabase } from '../services/api';
import { soundEffects } from '../utils/audio';

export default function AdminDashboardPage({ webSocketEvent, secondsAgo = 0 }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingValues, setEditingValues] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  const fetchHospitals = () => {
    setLoading(true);
    getHospitals()
      .then((data) => {
        setHospitals(data);
        // Initialize editing state
        const edits = {};
        data.forEach((h) => {
          edits[h.id] = {
            icu_available: h.icu_available,
            beds_available: h.beds_available,
            ventilator_available: h.ventilator_available,
            emergency_load: h.emergency_load,
            emergency_status: h.emergency_status,
          };
        });
        setEditingValues(edits);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  // Sync WebSocket updates
  useEffect(() => {
    if (!webSocketEvent) return;

    if (webSocketEvent.event === 'RESOURCE_UPDATED' && webSocketEvent.data?.updated_hospitals) {
      const updatedList = webSocketEvent.data.updated_hospitals;
      setHospitals((prev) =>
        prev.map((h) => {
          const match = updatedList.find((u) => u.id === h.id);
          return match ? { ...h, ...match } : h;
        })
      );
    }
  }, [webSocketEvent]);

  const handleInputChange = (hospitalId, field, val) => {
    setEditingValues((prev) => ({
      ...prev,
      [hospitalId]: {
        ...prev[hospitalId],
        [field]: Number(val),
      },
    }));
  };

  const handleStatusChange = (hospitalId, status) => {
    setEditingValues((prev) => ({
      ...prev,
      [hospitalId]: {
        ...prev[hospitalId],
        emergency_status: status,
      },
    }));
  };

  // Submit manual resource update (Section 19)
  const handleSaveHospital = async (hospitalId) => {
    const edit = editingValues[hospitalId];
    if (!edit) return;

    setSavingId(hospitalId);
    try {
      await updateHospitalResources(hospitalId, edit);
      soundEffects.playAcceptChime();
      setSuccessBanner(`Updated resources for ${hospitalId} — broadcasted to all connected dashboards.`);
      setTimeout(() => setSuccessBanner(null), 4000);
      fetchHospitals();
    } catch (err) {
      console.error('Update failed', err);
      alert('Update failed: ' + err.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleResetDemoData = async () => {
    if (!confirm('Re-seed all 10 hospitals and restore default simulated states?')) return;
    try {
      await resetDemoDatabase();
      fetchHospitals();
      alert('Demo data restored successfully!');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white uppercase tracking-wider">
              REGIONAL HEALTH COMMAND
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              LIVE DATASTREAM
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            System Administration & Live Capacity Override
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manually modify hospital resources in real time. Changes immediately broadcast to all ambulances, hospitals, and patients.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHospitals}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleResetDemoData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>Reset Demo DB</span>
          </button>
        </div>
      </div>

      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Hospital Resources Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider">
            All Regional Hospital Nodes ({hospitals.length})
          </span>
          <span className="text-slate-400">
            Last background sync: {secondsAgo}s ago
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Hospital Facility</th>
                <th className="py-3.5 px-3">ICU Available</th>
                <th className="py-3.5 px-3">Beds Available</th>
                <th className="py-3.5 px-3">Ventilators</th>
                <th className="py-3.5 px-3">Dept Load %</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Last Updated</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hospitals.map((h) => {
                const edit = editingValues[h.id] || {};
                const isSaving = savingId === h.id;

                return (
                  <tr key={h.id} className="hover:bg-slate-50/60 transition">
                    {/* Facility */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 text-xs block">{h.name}</span>
                      <span className="text-[10px] text-slate-500">{h.trauma_level}</span>
                    </td>

                    {/* ICU Available Input */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max={h.icu_total}
                          value={edit.icu_available ?? h.icu_available}
                          onChange={(e) => handleInputChange(h.id, 'icu_available', e.target.value)}
                          className="w-14 px-2 py-1 border rounded-lg text-xs font-bold text-blue-700 focus:ring-1 focus:ring-healthcare-500"
                        />
                        <span className="text-[10px] text-slate-400">/{h.icu_total}</span>
                      </div>
                    </td>

                    {/* Beds Available Input */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max={h.beds_total}
                          value={edit.beds_available ?? h.beds_available}
                          onChange={(e) => handleInputChange(h.id, 'beds_available', e.target.value)}
                          className="w-16 px-2 py-1 border rounded-lg text-xs font-bold text-slate-800 focus:ring-1 focus:ring-healthcare-500"
                        />
                        <span className="text-[10px] text-slate-400">/{h.beds_total}</span>
                      </div>
                    </td>

                    {/* Ventilator Input */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max={h.ventilator_total}
                          value={edit.ventilator_available ?? h.ventilator_available}
                          onChange={(e) => handleInputChange(h.id, 'ventilator_available', e.target.value)}
                          className="w-14 px-2 py-1 border rounded-lg text-xs font-bold text-cyan-700 focus:ring-1 focus:ring-healthcare-500"
                        />
                        <span className="text-[10px] text-slate-400">/{h.ventilator_total}</span>
                      </div>
                    </td>

                    {/* Emergency Load Input */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={edit.emergency_load ?? h.emergency_load}
                          onChange={(e) => handleInputChange(h.id, 'emergency_load', e.target.value)}
                          className="w-14 px-2 py-1 border rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-healthcare-500"
                        />
                        <span className="text-[10px] text-slate-400">%</span>
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-3">
                      <select
                        value={edit.emergency_status || h.emergency_status}
                        onChange={(e) => handleStatusChange(h.id, e.target.value)}
                        className="px-2 py-1 rounded-lg border text-xs font-semibold bg-white"
                      >
                        <option value="Available">Available</option>
                        <option value="Busy">Busy</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </td>

                    {/* Last Updated */}
                    <td className="py-3.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {h.last_updated ? new Date(h.last_updated).toLocaleTimeString() : 'Just now'}
                    </td>

                    {/* Update Action Button (Section 19) */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleSaveHospital(h.id)}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-healthcare-600 hover:bg-healthcare-700 active:bg-healthcare-800 text-white font-bold rounded-xl text-xs shadow-xs transition transform active:scale-95 disabled:opacity-50"
                      >
                        <Save className="w-3 h-3" />
                        <span>{isSaving ? 'Updating...' : 'Update'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
