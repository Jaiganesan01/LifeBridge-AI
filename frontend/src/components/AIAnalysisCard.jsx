import React from 'react';
import { 
  Bot, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Stethoscope, 
  Droplet, 
  Wind, 
  Bed, 
  Activity, 
  FileText 
} from 'lucide-react';

export default function AIAnalysisCard({ analysis }) {
  if (!analysis) return null;

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-300',
          badge: 'bg-rose-600 text-white',
          dot: 'bg-rose-500',
          pulse: 'animate-ping',
          label: '🔴 CRITICAL',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-50 text-orange-700 border-orange-300',
          badge: 'bg-orange-500 text-white',
          dot: 'bg-orange-400',
          pulse: 'animate-ping',
          label: '🟠 HIGH',
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-300',
          badge: 'bg-amber-500 text-white',
          dot: 'bg-amber-400',
          pulse: '',
          label: '🟡 MODERATE',
        };
      default:
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
          badge: 'bg-emerald-600 text-white',
          dot: 'bg-emerald-400',
          pulse: '',
          label: '🟢 LOW',
        };
    }
  };

  const badgeStyle = getPriorityBadge(analysis.priority);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md hover:shadow-lg transition-all p-5 sm:p-6 overflow-hidden relative">
      {/* Background soft gradient flair */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-bl from-healthcare-50 to-transparent pointer-events-none rounded-tr-2xl" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-healthcare-500 text-white flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              AI Emergency Clinical Assessment
              <span className="text-[10px] font-bold px-2 py-0.5 bg-healthcare-100 text-healthcare-800 rounded-full border border-healthcare-200">
                Confidence {Math.round(analysis.confidence_score * 100)}%
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Automated multi-modal requirement & triage extraction
            </p>
          </div>
        </div>

        {/* Priority Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-xs shadow-sm ${badgeStyle.bg}`}>
          <span className="relative flex h-2.5 w-2.5">
            {badgeStyle.pulse && (
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${badgeStyle.pulse} ${badgeStyle.dot}`}></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${badgeStyle.dot}`}></span>
          </span>
          <span className="tracking-wide">PRIORITY: {analysis.priority}</span>
        </div>
      </div>

      {/* Main Grid: Category & Severity Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
        {/* Category */}
        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
            Emergency Type
          </span>
          <p className="font-extrabold text-slate-900 text-base">
            {analysis.emergency_type}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {analysis.detected_keywords?.map((kw, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                #{kw}
              </span>
            ))}
          </div>
        </div>

        {/* Severity Score */}
        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Severity Index
            </span>
            <span className="font-extrabold text-slate-900 text-sm">
              {analysis.severity_score} / 100
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mt-1.5">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                analysis.severity_score >= 85 ? 'bg-rose-500' :
                analysis.severity_score >= 60 ? 'bg-orange-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${analysis.severity_score}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-2 block">
            {analysis.priority === 'CRITICAL' ? 'Immediate resuscitation & stabilization protocol' : 'Urgent clinical pathway indicated'}
          </span>
        </div>

        {/* Required Specialist */}
        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
            Target Specialist
          </span>
          <p className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4 text-healthcare-600" />
            {analysis.required_specialist}
          </p>
          <span className="text-[10px] text-slate-500 mt-2 block">
            Blood Needed: <strong className="text-slate-800">{analysis.blood_required ? (analysis.blood_group || 'O- Standby') : 'None'}</strong>
          </span>
        </div>
      </div>

      {/* Required Medical Resources Checklist */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Required Medical Resources Identified:
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {analysis.required_resources?.map((res, idx) => (
            <div 
              key={idx}
              className="flex items-center gap-1.5 bg-healthcare-50/80 border border-healthcare-100 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-healthcare-900 shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-healthcare-600 shrink-0" />
              <span className="truncate">{res}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Clinical Rationale Box */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
        <div className="space-y-1">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Bed className="w-3.5 h-3.5 text-healthcare-600" />
            ICU Requirement: {analysis.icu_required ? 'YES (High Priority)' : 'Standard Bay'}
          </span>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            {analysis.icu_reason}
          </p>
        </div>

        <div className="space-y-1">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Wind className="w-3.5 h-3.5 text-cyan-600" />
            Ventilator Requirement: {analysis.ventilator_required ? 'YES (Standby)' : 'Ambient / O2 Mask'}
          </span>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            {analysis.ventilator_reason}
          </p>
        </div>
      </div>

      {/* Mandatory Regulatory / Safety Disclaimer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 italic">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>{analysis.decision_support_notice}</span>
      </div>
    </div>
  );
}
