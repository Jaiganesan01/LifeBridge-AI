import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  Building2, 
  AlertCircle, 
  ShieldCheck, 
  Siren, 
  Bed, 
  Wind, 
  Droplet, 
  ArrowLeft,
  XCircle,
  Truck,
  Activity
} from 'lucide-react';
import HospitalMap from '../components/HospitalMap';
import { getEmergency, cancelEmergency, updateEmergencyStatus } from '../services/api';
import { soundEffects } from '../utils/audio';

const TRACKING_STAGES = [
  { id: 'ANALYZED', label: 'Emergency Created' },
  { id: 'AI_DONE', label: 'AI Analysis Complete' },
  { id: 'HOSPITAL_SELECTED', label: 'Hospital Selected' },
  { id: 'NOTIFIED', label: 'Hospital Notified' },
  { id: 'ACCEPTED', label: 'Hospital Accepted' },
  { id: 'PREPARING', label: 'Resources Preparing' },
  { id: 'EN_ROUTE', label: 'Patient En Route' },
  { id: 'ARRIVED', label: 'Arrived at Hospital' }
];

export default function PatientTrackerPage({ 
  emergencyId, 
  hospitalData, 
  onBackToNewEmergency,
  webSocketEvent 
}) {
  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [etaRemainingMin, setEtaRemainingMin] = useState(null);

  // Fetch emergency details
  useEffect(() => {
    if (!emergencyId) return;
    setLoading(true);
    getEmergency(emergencyId)
      .then((data) => {
        setEmergency(data);
        setEtaRemainingMin(data.estimated_travel_min || 8);
      })
      .catch((err) => {
        console.error('Failed to load emergency', err);
      })
      .finally(() => setLoading(false));
  }, [emergencyId]);

  // Listen to WebSocket events for real-time updates without refreshing!
  useEffect(() => {
    if (!webSocketEvent) return;

    if (webSocketEvent.event === 'EMERGENCY_ACCEPTED' && webSocketEvent.data?.emergency_id === emergencyId) {
      soundEffects.playAcceptChime();
      setEmergency((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: webSocketEvent.data.status || 'PREPARING',
          reserved_icu: webSocketEvent.data.reserved_resources?.icu ?? prev.reserved_icu,
          reserved_ventilator: webSocketEvent.data.reserved_resources?.ventilator ?? prev.reserved_ventilator,
          reserved_beds: webSocketEvent.data.reserved_resources?.beds ?? prev.reserved_beds,
          reserved_blood: webSocketEvent.data.reserved_resources?.blood ?? prev.reserved_blood,
        };
      });
    }

    if (webSocketEvent.event === 'EMERGENCY_CANCELLED' && webSocketEvent.data?.emergency_id === emergencyId) {
      setEmergency((prev) => prev ? { ...prev, status: 'CANCELLED' } : prev);
    }
  }, [webSocketEvent, emergencyId]);

  // ETA countdown ticker
  useEffect(() => {
    if (etaRemainingMin === null || etaRemainingMin <= 1) return;
    const timer = setInterval(() => {
      setEtaRemainingMin((prev) => (prev > 1 ? prev - 1 : 1));
    }, 60000);
    return () => clearInterval(timer);
  }, [etaRemainingMin]);

  // Map status string to stage index
  const getStageIndex = (status) => {
    switch (status) {
      case 'ANALYZED': return 1;
      case 'NOTIFIED': return 3;
      case 'ACCEPTED': return 4;
      case 'PREPARING': return 5;
      case 'EN_ROUTE': return 6;
      case 'ARRIVED': return 7;
      case 'CANCELLED': return -1;
      default: return 2;
    }
  };

  const currentStageIdx = emergency ? getStageIndex(emergency.status) : 0;

  // Handle Cancel
  const handleCancel = async () => {
    if (!emergencyId) return;
    setIsCancelling(true);
    try {
      await cancelEmergency(emergencyId, cancelReason || 'Patient stabilized / family request');
      setEmergency((prev) => ({ ...prev, status: 'CANCELLED' }));
      setShowCancelModal(false);
    } catch (err) {
      console.error('Cancel failed', err);
    } finally {
      setIsCancelling(false);
    }
  };

  // Progression simulation actions
  const advanceToStage = async (nextStatus) => {
    if (!emergencyId) return;
    try {
      const updated = await updateEmergencyStatus(emergencyId, nextStatus);
      setEmergency(updated);
    } catch (err) {
      console.error('Failed to advance stage', err);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 text-sm">
        <div className="w-8 h-8 border-3 border-healthcare-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading Live Emergency Dispatch System...
      </div>
    );
  }

  if (!emergency) {
    return (
      <div className="p-12 text-center text-slate-600">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <p className="font-bold">Emergency case not found.</p>
        <button
          onClick={onBackToNewEmergency}
          className="mt-4 px-4 py-2 bg-healthcare-600 text-white rounded-xl text-xs font-bold"
        >
          Create New Emergency
        </button>
      </div>
    );
  }

  const isAcceptedOrPreparing = ['ACCEPTED', 'PREPARING', 'EN_ROUTE', 'ARRIVED'].includes(emergency.status);
  const isCancelled = emergency.status === 'CANCELLED';

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToNewEmergency}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Case ID: {emergency.id}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                emergency.priority === 'CRITICAL'
                  ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                  : 'bg-orange-50 text-orange-700 border-orange-300'
              }`}>
                {emergency.priority} PRIORITY
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Patient: <strong className="text-slate-800">{emergency.patient_name}</strong> ({emergency.patient_age}y, {emergency.patient_gender}) • {emergency.emergency_type}
            </p>
          </div>
        </div>

        {/* Real-Time Status Pill */}
        <div className="flex items-center gap-3">
          {!isCancelled ? (
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border font-bold text-xs shadow-xs ${
              isAcceptedOrPreparing
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>
                {emergency.status === 'PREPARING' && '🟢 Hospital Accepted & Preparing Resources'}
                {emergency.status === 'ACCEPTED' && '🟢 Hospital Accepted Request'}
                {emergency.status === 'EN_ROUTE' && '🚑 Ambulance En Route To Hospital'}
                {emergency.status === 'ARRIVED' && '🏥 Patient Safely Arrived at Hospital'}
                {emergency.status === 'NOTIFIED' && '⏳ Dispatch Sent — Awaiting Hospital Response'}
              </span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200">
              🔴 Emergency Cancelled
            </div>
          )}

          {!isCancelled && emergency.status !== 'ARRIVED' && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition"
            >
              Cancel Case
            </button>
          )}
        </div>
      </div>

      {/* 8-Stage Visual Progress Stepper (Section 28) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">
          Emergency Response Lifecycle Progression
        </h3>

        <div className="flex items-center justify-between min-w-[720px] relative">
          {/* Connector Line */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
          <div 
            className="absolute top-4 left-6 h-0.5 bg-emerald-500 transition-all duration-500 -z-0" 
            style={{ width: `${Math.max(0, (currentStageIdx / (TRACKING_STAGES.length - 1)) * 100)}%` }}
          />

          {TRACKING_STAGES.map((stg, idx) => {
            const isCompleted = currentStageIdx > idx;
            const isCurrent = currentStageIdx === idx;

            return (
              <div key={idx} className="flex flex-col items-center text-center relative z-10 w-24">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  isCompleted
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isCurrent
                      ? 'bg-healthcare-600 text-white ring-4 ring-healthcare-100 animate-pulse'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={`text-[11px] font-bold mt-2 leading-tight ${
                  isCurrent ? 'text-healthcare-700' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                }`}>
                  {stg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Hospital Summary & Live ETA Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hospital Card & Reserved Resources (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Confirmed Facility Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-healthcare-50 text-healthcare-700 border border-healthcare-200 rounded uppercase">
                  Assigned Emergency Facility
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {hospitalData?.name || emergency.hospital?.name || 'Assigned Hospital'}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {hospitalData?.address || emergency.hospital?.address || 'Medical Corridor, City Center'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Distance</span>
                <span className="text-lg font-black text-slate-900">
                  {emergency.distance_km || 3.2} km
                </span>
              </div>
            </div>

            {/* Reserved Resources Grid */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Hospital Resources Reserved for Case {emergency.id}:
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100">
                  <span className="text-[10px] text-blue-700 uppercase font-semibold flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5" /> ICU Bed
                  </span>
                  <p className="font-extrabold text-slate-900 text-sm mt-1">
                    {emergency.reserved_icu > 0 ? 'Confirmed #1' : 'Standard Bay'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-cyan-50/70 border border-cyan-100">
                  <span className="text-[10px] text-cyan-700 uppercase font-semibold flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5" /> Ventilator
                  </span>
                  <p className="font-extrabold text-slate-900 text-sm mt-1">
                    {emergency.reserved_ventilator > 0 ? 'Reserved #1' : 'O2 Mask Standby'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 uppercase font-semibold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> Emergency Bed
                  </span>
                  <p className="font-extrabold text-slate-900 text-sm mt-1">
                    {emergency.reserved_beds > 0 ? 'Trauma Bay #1' : 'Queue Assigned'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100">
                  <span className="text-[10px] text-rose-700 uppercase font-semibold flex items-center gap-1">
                    <Droplet className="w-3.5 h-3.5" /> Blood Units
                  </span>
                  <p className="font-extrabold text-slate-900 text-sm mt-1">
                    {emergency.required_blood || 'O+ Crossmatched'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Demo Progression Controls */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Presenter Quick Action:</span>
              <div className="flex items-center gap-2">
                {emergency.status === 'PREPARING' && (
                  <button
                    onClick={() => advanceToStage('EN_ROUTE')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-healthcare-50 text-healthcare-700 hover:bg-healthcare-100 rounded-xl font-bold border border-healthcare-200 transition"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Simulate Ambulance En Route
                  </button>
                )}
                {emergency.status === 'EN_ROUTE' && (
                  <button
                    onClick={() => advanceToStage('ARRIVED')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold transition shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Simulate Hospital Arrival
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Route Map */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              Live Transit Route Navigation
            </h4>
            <HospitalMap
              patientLocation={{ lat: emergency.latitude, lng: emergency.longitude }}
              hospitals={hospitalData ? [hospitalData] : []}
              selectedHospital={hospitalData}
              height="340px"
            />
          </div>
        </div>

        {/* ETA & Live Arrival Countdown Card (1 Col) */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-healthcare-950 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Live Transit Telemetry
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
                GPS SYNCED
              </span>
            </div>

            <div className="text-center py-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
              <span className="text-xs text-slate-400 block font-medium">Estimated Arrival Time</span>
              <div className="text-5xl font-black text-white mt-1 tracking-tight">
                ~{etaRemainingMin} <span className="text-xl font-medium text-slate-400">min</span>
              </div>
              <p className="text-[11px] text-emerald-400 font-semibold mt-2 flex items-center justify-center gap-1">
                <Activity className="w-3.5 h-3.5" /> Green corridor routing active
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Paramedic Team:</span>
                <span className="font-semibold text-white">Unit 104 (Advanced Life Support)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Destination Desk:</span>
                <span className="font-semibold text-white">Trauma Resuscitation Bay 1</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Receiving Physician:</span>
                <span className="font-semibold text-emerald-300">Dr. Rajesh Sharma (Trauma Lead)</span>
              </div>
            </div>

            <a
              href="tel:108"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Phone className="w-4 h-4" />
              <span>Contact Emergency Hotline</span>
            </a>
          </div>

          {/* Clinical Notes Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 uppercase text-[11px]">
              Triage Intake Log
            </h4>
            <p className="text-slate-600 italic">
              "{emergency.description}"
            </p>
            <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-200">
              Reported: {new Date(emergency.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <XCircle className="w-7 h-7" />
              <h3 className="font-extrabold text-base text-slate-900">
                Cancel Emergency Case?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cancelling this emergency will immediately release all reserved ICU, Ventilator, 
              and Trauma bay resources at {hospitalData?.name || 'the hospital'}.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Reason for cancellation:
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Patient stabilized on-scene"
                className="w-full px-3 py-2 border rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Keep Active
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
