import React from 'react';
import { 
  Building2, 
  MapPin, 
  Clock, 
  Bed, 
  Wind, 
  Droplet, 
  Stethoscope, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight, 
  Navigation, 
  Info,
  Sparkles,
  PhoneCall
} from 'lucide-react';

export default function HospitalCard({ 
  hospital, 
  onSelect, 
  onViewDetails, 
  onNavigate,
  isTopRecommendation = false 
}) {
  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-healthcare-700 bg-healthcare-50 border-healthcare-200';
    if (score >= 55) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const getLoadColor = (load) => {
    if (load > 85) return 'bg-rose-500 text-white';
    if (load > 70) return 'bg-amber-500 text-white';
    return 'bg-emerald-500 text-white';
  };

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-lg relative overflow-hidden flex flex-col justify-between ${
      isTopRecommendation 
        ? 'border-healthcare-400 ring-2 ring-healthcare-500/20 shadow-md' 
        : 'border-slate-200 hover:border-slate-300 shadow-sm'
    }`}>
      {/* Top Match Tag */}
      {isTopRecommendation && (
        <div className="bg-gradient-to-r from-healthcare-600 to-tealbrand-600 text-white text-[11px] font-bold px-3 py-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 fill-white/30" />
            HIGH CAPABILITY MATCH
          </span>
          <span className="text-[10px] text-white/90 uppercase tracking-wider font-semibold">
            Recommended Facility
          </span>
        </div>
      )}

      <div className="p-5">
        {/* Hospital Header & Score */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-healthcare-600 transition">
              {hospital.name}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate max-w-[280px]">{hospital.address}</span>
            </p>
            <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {hospital.trauma_level || 'General Emergency Center'}
            </span>
          </div>

          {/* Suitability Score Radial / Pill */}
          <div className={`px-2.5 py-1.5 rounded-xl border text-right shrink-0 flex flex-col items-end ${getScoreColor(hospital.suitability_score)}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              Suitability
            </span>
            <span className="text-lg font-extrabold leading-none">
              {hospital.suitability_score}%
            </span>
          </div>
        </div>

        {/* Travel & Distance Metric Bar */}
        <div className="flex items-center gap-4 my-3.5 py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Navigation className="w-4 h-4 text-healthcare-600" />
            <span>{hospital.distance_km} km</span>
            <span className="text-slate-400 font-normal">distance</span>
          </div>
          <div className="h-3 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5 font-bold text-healthcare-700">
            <Clock className="w-4 h-4 text-healthcare-600" />
            <span>~{hospital.estimated_travel_min} min</span>
            <span className="text-slate-400 font-normal">transit ETA</span>
          </div>
          <div className="h-3 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="text-[11px]">Load:</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getLoadColor(hospital.emergency_load)}`}>
              {hospital.emergency_load}%
            </span>
          </div>
        </div>

        {/* Live Resource Availability Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {/* ICU */}
          <div className={`p-2 rounded-xl border ${
            hospital.icu_available > 0 
              ? 'bg-blue-50/60 border-blue-100 text-blue-950' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                <Bed className="w-3 h-3 text-blue-600" /> ICU
              </span>
              <span className="text-[10px] font-bold">
                {hospital.icu_available > 0 ? `${hospital.icu_available} avail` : '0 FULL'}
              </span>
            </div>
            <p className="font-extrabold text-sm mt-0.5">
              {hospital.icu_available} <span className="text-[10px] font-normal text-slate-500">/ {hospital.icu_total}</span>
            </p>
          </div>

          {/* Ventilator */}
          <div className={`p-2 rounded-xl border ${
            hospital.ventilator_available > 0 
              ? 'bg-cyan-50/60 border-cyan-100 text-cyan-950' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                <Wind className="w-3 h-3 text-cyan-600" /> Vents
              </span>
              <span className="text-[10px] font-bold">
                {hospital.ventilator_available > 0 ? `${hospital.ventilator_available} ready` : '0 avail'}
              </span>
            </div>
            <p className="font-extrabold text-sm mt-0.5">
              {hospital.ventilator_available} <span className="text-[10px] font-normal text-slate-500">/ {hospital.ventilator_total}</span>
            </p>
          </div>

          {/* Beds */}
          <div className="p-2 rounded-xl border bg-slate-50 border-slate-100 text-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-600" /> Beds
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                {hospital.beds_available} open
              </span>
            </div>
            <p className="font-extrabold text-sm mt-0.5">
              {hospital.beds_available} <span className="text-[10px] font-normal text-slate-400">/ {hospital.beds_total}</span>
            </p>
          </div>

          {/* Blood / Specialist Status */}
          <div className="p-2 rounded-xl border bg-slate-50 border-slate-100 text-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                <Droplet className="w-3 h-3 text-rose-500" /> Blood
              </span>
              <span className={`text-[10px] font-bold ${hospital.required_blood_available ? 'text-emerald-600' : 'text-amber-600'}`}>
                {hospital.required_blood_available ? 'In Stock' : 'Limited'}
              </span>
            </div>
            <p className="font-extrabold text-sm mt-0.5 truncate text-slate-700">
              {hospital.specialist_available ? 'Doctor Ready' : 'On Call'}
            </p>
          </div>
        </div>

        {/* AI Explainability: Why this hospital matches & Limitations */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2 text-xs">
          {/* Match reasons */}
          {hospital.match_reasons && hospital.match_reasons.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                Why this hospital matches:
              </span>
              <ul className="text-slate-600 text-[11px] space-y-0.5 pl-4 list-disc marker:text-emerald-500">
                {hospital.match_reasons.slice(0, 3).map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Potential limitations */}
          {hospital.limitations && hospital.limitations.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                Potential considerations:
              </span>
              <ul className="text-slate-500 text-[11px] space-y-0.5 pl-4 list-disc marker:text-amber-500">
                {hospital.limitations.slice(0, 2).map((lim, i) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetails(hospital)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition"
          >
            View Details
          </button>
          <button
            onClick={() => onNavigate(hospital)}
            className="px-2.5 py-1.5 text-xs font-semibold text-healthcare-700 hover:bg-healthcare-50 rounded-lg transition flex items-center gap-1"
          >
            <Navigation className="w-3 h-3" />
            Route
          </button>
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => onSelect(hospital)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-sm hover:shadow transition transform active:scale-95"
        >
          <span>Request Support</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
