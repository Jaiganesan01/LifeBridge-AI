import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Lock, 
  User, 
  Key, 
  Bed, 
  Wind, 
  Droplet, 
  Activity, 
  Stethoscope, 
  Siren, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw,
  Plus,
  Minus,
  LogOut
} from 'lucide-react';
import { 
  getHospitals, 
  getHospital, 
  listEmergencies, 
  acceptEmergency, 
  cancelEmergency, 
  updateHospitalResources 
} from '../services/api';
import { soundEffects } from '../utils/audio';

export default function HospitalDashboardPage({ webSocketEvent, secondsAgo = 0 }) {
  // Login State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [selectedHospitalId, setSelectedHospitalId] = useState('HOSP-01');
  const [hospitalsList, setHospitalsList] = useState([]);

  // Dashboard Data State
  const [hospitalDetail, setHospitalDetail] = useState(null);
  const [incomingEmergencies, setIncomingEmergencies] = useState([]);
  const [activeAdmissions, setActiveAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [msgBanner, setMsgBanner] = useState(null);

  // Load hospitals on mount for dropdown
  useEffect(() => {
    getHospitals().then((data) => {
      setHospitalsList(data);
      if (data.length > 0 && !selectedHospitalId) {
        setSelectedHospitalId(data[0].id);
      }
    }).catch(console.error);
  }, []);

  // Fetch Hospital Data and Emergencies
  const refreshHospitalData = () => {
    if (!selectedHospitalId) return;
    setLoading(true);

    Promise.all([
      getHospital(selectedHospitalId),
      listEmergencies(selectedHospitalId)
    ])
      .then(([hosp, emergencies]) => {
        setHospitalDetail(hosp);
        // Categorize into incoming (NOTIFIED) vs accepted (PREPARING, ACCEPTED, EN_ROUTE)
        setIncomingEmergencies(emergencies.filter((e) => e.status === 'NOTIFIED'));
        setActiveAdmissions(emergencies.filter((e) => ['ACCEPTED', 'PREPARING', 'EN_ROUTE', 'ARRIVED'].includes(e.status)));
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshHospitalData();
    }
  }, [isAuthenticated, selectedHospitalId]);

  // Handle Real-Time WebSocket Events
  useEffect(() => {
    if (!webSocketEvent || !isAuthenticated) return;

    const { event, data } = webSocketEvent;

    // New Emergency Request Dispatched to This Hospital!
    if (event === 'EMERGENCY_CREATED' && (data.hospital_id === selectedHospitalId || !data.hospital_id)) {
      soundEffects.playEmergencyAlert();
      setMsgBanner(`🚨 NEW INCOMING EMERGENCY: Case ${data.emergency_id} (${data.priority})`);
      refreshHospitalData();
    }

    // Emergency Accepted or Status Change
    if (event === 'EMERGENCY_ACCEPTED' || event === 'EMERGENCY_CANCELLED') {
      refreshHospitalData();
    }

    // Live Resource Update from Background Simulator or Admin
    if (event === 'RESOURCE_UPDATED' && data.updated_hospitals) {
      const match = data.updated_hospitals.find((h) => h.id === selectedHospitalId);
      if (match) {
        setHospitalDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            icu_available: match.icu_available,
            beds_available: match.beds_available,
            ventilator_available: match.ventilator_available,
            emergency_load: match.emergency_load,
            emergency_status: match.emergency_status,
            last_updated: match.last_updated,
          };
        });
      }
    }
  }, [webSocketEvent, isAuthenticated, selectedHospitalId]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
      soundEffects.playAcceptChime();
    } else {
      alert('Invalid demo credentials. Use admin / admin123.');
    }
  };

  // Hospital Accepts & Prepares Resources (Section 17 & 18)
  const handleAcceptEmergency = async (emg) => {
    setActionLoadingId(emg.id);
    try {
      soundEffects.playAcceptChime();
      await acceptEmergency(emg.id);
      setMsgBanner(`✅ Case ${emg.id} Accepted! 1 ICU Bed, 1 Ventilator, and 1 Bed reserved.`);
      refreshHospitalData();
    } catch (err) {
      console.error('Accept error', err);
      alert('Failed to accept: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineEmergency = async (emg) => {
    if (!confirm('Are you sure the emergency department cannot accommodate this critical case?')) return;
    setActionLoadingId(emg.id);
    try {
      await cancelEmergency(emg.id, 'Facility at maximum critical capacity');
      refreshHospitalData();
    } catch (err) {
      console.error('Decline error', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick resource adjustments for demonstration
  const handleQuickAdjust = async (field, delta) => {
    if (!hospitalDetail) return;
    const currentVal = hospitalDetail[field];
    const maxVal = field === 'icu_available' ? hospitalDetail.icu_total : (field === 'ventilator_available' ? hospitalDetail.ventilator_total : hospitalDetail.beds_total);
    const newVal = Math.max(0, Math.min(maxVal, currentVal + delta));

    try {
      await updateHospitalResources(selectedHospitalId, {
        [field]: newVal,
      });
      setHospitalDetail((prev) => ({ ...prev, [field]: newVal }));
    } catch (err) {
      console.error('Failed to update resource', err);
    }
  };

  // 1. Hospital Login Screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-tealbrand-500 text-white flex items-center justify-center mx-auto shadow-md shadow-tealbrand-500/25">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Hospital Operations Portal
          </h2>
          <p className="text-xs text-slate-500">
            Secure login for emergency department charge nurses and dispatch coordinators.
          </p>
        </div>

        {/* Preset Demo Credentials Display (Section 14) */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5">
          <span className="font-extrabold uppercase text-[10px] text-healthcare-700 tracking-wider block">
            DEMO ACCESS CREDENTIALS
          </span>
          <div className="flex justify-between text-slate-600">
            <span>Hospital:</span>
            <strong className="text-slate-800">Apollo Care Hospital (or any)</strong>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Username:</span>
            <code className="bg-white px-2 py-0.5 rounded border font-bold text-slate-800">admin</code>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Password:</span>
            <code className="bg-white px-2 py-0.5 rounded border font-bold text-slate-800">admin123</code>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Select Facility Node</label>
            <select
              value={selectedHospitalId}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-tealbrand-500 bg-white font-medium text-slate-800"
            >
              {hospitalsList.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" /> Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-tealbrand-500 font-medium"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-slate-400" /> Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-tealbrand-500 font-medium"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-tealbrand-600 hover:bg-tealbrand-700 text-white font-bold rounded-2xl shadow-md shadow-tealbrand-600/25 transition text-xs"
          >
            Access Hospital Dashboard
          </button>
        </form>
      </div>
    );
  }

  // 2. Authenticated Hospital Dashboard
  return (
    <div className="space-y-8 pb-16">
      {/* Top Facility Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-tealbrand-50 text-tealbrand-700 border border-tealbrand-200 uppercase">
              {hospitalDetail?.trauma_level || 'Emergency Command Center'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              REAL-TIME SYNCED
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            {hospitalDetail?.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Logged in as Dispatch Administrator • {hospitalDetail?.address}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Facility Selector */}
          <select
            value={selectedHospitalId}
            onChange={(e) => setSelectedHospitalId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 shadow-2xs"
          >
            {hospitalsList.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>

          <button
            onClick={refreshHospitalData}
            title="Refresh"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {msgBanner && (
        <div className="p-4 rounded-2xl bg-tealbrand-50 border border-tealbrand-200 text-tealbrand-900 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span>{msgBanner}</span>
          <button onClick={() => setMsgBanner(null)} className="text-slate-400 hover:text-slate-700 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Resource Overview Counters (Section 15) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
            Live Clinical Resource Overview
          </h2>
          <span className="text-[11px] text-slate-400">
            Updated {secondsAgo}s ago via simulation engine
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* ICU Available */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-semibold flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-blue-600" /> ICU Beds
              </span>
              <span className="text-[10px] font-bold text-blue-600">
                {hospitalDetail?.icu_available} / {hospitalDetail?.icu_total}
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {hospitalDetail?.icu_available}
            </div>
            {/* Quick adjust buttons */}
            <div className="flex items-center gap-1 pt-1 border-t border-slate-100">
              <button
                onClick={() => handleQuickAdjust('icu_available', -1)}
                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleQuickAdjust('icu_available', 1)}
                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                <Plus className="w-3 h-3" />
              </button>
              <span className="text-[10px] text-slate-400 ml-auto">Adjust</span>
            </div>
          </div>

          {/* Ventilator Available */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-semibold flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-cyan-600" /> Ventilators
              </span>
              <span className="text-[10px] font-bold text-cyan-600">
                {hospitalDetail?.ventilator_available} / {hospitalDetail?.ventilator_total}
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {hospitalDetail?.ventilator_available}
            </div>
            <div className="flex items-center gap-1 pt-1 border-t border-slate-100">
              <button
                onClick={() => handleQuickAdjust('ventilator_available', -1)}
                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleQuickAdjust('ventilator_available', 1)}
                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                <Plus className="w-3 h-3" />
              </button>
              <span className="text-[10px] text-slate-400 ml-auto">Adjust</span>
            </div>
          </div>

          {/* Emergency Beds */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-semibold flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-600" /> Open Beds
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {hospitalDetail?.beds_available} / {hospitalDetail?.beds_total}
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {hospitalDetail?.beds_available}
            </div>
            <div className="flex items-center gap-1 pt-1 border-t border-slate-100">
              <button
                onClick={() => handleQuickAdjust('beds_available', -2)}
                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleQuickAdjust('beds_available', 2)}
                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                <Plus className="w-3 h-3" />
              </button>
              <span className="text-[10px] text-slate-400 ml-auto">Adjust</span>
            </div>
          </div>

          {/* Emergency Load */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-semibold flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-rose-500" /> Dept Load
              </span>
              <span className={`text-[10px] font-bold px-1.5 rounded ${
                hospitalDetail?.emergency_load > 80 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {hospitalDetail?.emergency_status}
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {hospitalDetail?.emergency_load}%
            </div>
            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2">
              <div 
                className={`h-full ${hospitalDetail?.emergency_load > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                style={{ width: `${hospitalDetail?.emergency_load}%` }} 
              />
            </div>
          </div>

          {/* Blood Stock (O+ Units) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-semibold flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-rose-600" /> O+ / O- Units
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              14 <span className="text-xs font-normal text-slate-500">units</span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 block">
              Adequate Bank Reserve
            </span>
          </div>

          {/* Specialists Available */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-semibold flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-healthcare-600" /> Specialists
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {hospitalDetail?.specialists?.filter((s) => s.is_available && s.on_duty).length || 3}{' '}
              <span className="text-xs font-normal text-slate-500">on duty</span>
            </div>
            <span className="text-[10px] font-semibold text-healthcare-600 block">
              Trauma Surgeon Active
            </span>
          </div>
        </div>
      </section>

      {/* INCOMING EMERGENCY REQUESTS (Section 15 & 16) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {incomingEmergencies.length > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                incomingEmergencies.length > 0 ? 'bg-rose-500' : 'bg-slate-300'
              }`}></span>
            </span>
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">
              Incoming Emergency Requests ({incomingEmergencies.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Real-time WebSocket alerts
          </span>
        </div>

        {incomingEmergencies.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
            <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-600">No pending emergency dispatches in queue.</p>
            <p className="mt-1">When an ambulance or patient selects this hospital, it will flash here immediately.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {incomingEmergencies.map((emg) => {
              const reqList = emg.required_resources ? JSON.parse(emg.required_resources) : [];
              return (
                <div
                  key={emg.id}
                  className="bg-white rounded-3xl border-2 border-rose-400 shadow-lg p-6 space-y-4 animate-pulse-ring"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-md animate-pulse">
                        <Siren className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xl text-slate-900">
                            🚨 INCOMING EMERGENCY: Case {emg.id}
                          </span>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-600 text-white uppercase animate-bounce">
                            {emg.priority}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Patient: <strong className="text-slate-800">{emg.patient_name}</strong> ({emg.patient_age}y, {emg.patient_gender}) • {emg.emergency_type}
                        </p>
                      </div>
                    </div>

                    <div className="text-right bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Transit ETA</span>
                      <span className="font-black text-base text-rose-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> ~{emg.estimated_travel_min || 9} min
                      </span>
                    </div>
                  </div>

                  {/* Clinical Description */}
                  <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-xs text-rose-950 italic">
                    "{emg.description}"
                  </div>

                  {/* Requirements Pills */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Immediate Clinical Requirements Identified:
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {reqList.map((res, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 font-bold">
                          ✓ {res}
                        </span>
                      ))}
                      {emg.required_blood && (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 font-bold">
                          🩸 Blood: {emg.required_blood}
                        </span>
                      )}
                      {emg.required_specialist && (
                        <span className="px-2.5 py-1 rounded-lg bg-tealbrand-50 text-tealbrand-900 border border-tealbrand-200 font-bold">
                          🩺 {emg.required_specialist}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons: Accept & Prepare / Cannot Accommodate (Section 15 & 17) */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleDeclineEmergency(emg)}
                      disabled={actionLoadingId === emg.id}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition"
                    >
                      Cannot Accommodate
                    </button>

                    <button
                      onClick={() => handleAcceptEmergency(emg)}
                      disabled={actionLoadingId === emg.id}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition transform active:scale-95 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{actionLoadingId === emg.id ? 'Reserving Resources...' : 'Accept & Prepare Resources'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Active Admissions & En-Route Cases */}
      <section className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
          Accepted & Preparing Emergency Cases ({activeAdmissions.length})
        </h2>

        {activeAdmissions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-400 text-xs">
            No active admissions currently in triage.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAdmissions.map((adm) => (
              <div key={adm.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-sm">Case {adm.id}</span>
                  <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {adm.status}
                  </span>
                </div>
                <p className="text-slate-600">{adm.patient_name}, {adm.patient_age}y • {adm.emergency_type}</p>
                <div className="flex gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>ICU Reserved: <strong>{adm.reserved_icu}</strong></span>
                  <span>Vent Reserved: <strong>{adm.reserved_ventilator}</strong></span>
                  <span>ETA: <strong>~{adm.estimated_travel_min || 8} min</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
