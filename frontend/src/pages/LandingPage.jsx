import React from 'react';
import { 
  Siren, 
  Building2, 
  Activity, 
  PlayCircle, 
  HeartPulse, 
  ShieldCheck, 
  Cpu, 
  Radio, 
  Clock, 
  Bed, 
  Wind, 
  ChevronRight,
  Sparkles,
  MapPin
} from 'lucide-react';

export default function LandingPage({ 
  onNavigate, 
  onStartDemo, 
  hospitals = [],
  secondsAgo = 0 
}) {
  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-healthcare-50 via-white to-slate-50 border border-healthcare-100 p-8 sm:p-14 shadow-sm">
        {/* Glow ambient background elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-healthcare-200/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-tealbrand-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center space-y-6">
          {/* Tag badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-healthcare-200 shadow-xs text-xs font-bold text-healthcare-700">
            <Sparkles className="w-3.5 h-3.5 text-healthcare-500" />
            <span>AI-POWERED EMERGENCY HEALTHCARE INTELLIGENCE</span>
          </div>

          {/* Title & Tagline */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight">
              LifeBridge <span className="bg-gradient-to-r from-healthcare-600 via-healthcare-500 to-tealbrand-600 bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-slate-700 tracking-tight">
              Bridging Lives To Care
            </p>
          </div>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Eliminating critical ambulance transfer delays during life-threatening emergencies. 
            Instantly matching patients to nearby hospitals with verified ICU beds, mechanical ventilators, 
            matched blood stocks, and on-duty trauma surgeons.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            {/* Main Button */}
            <button
              onClick={() => onNavigate('emergency')}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-extrabold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-lg shadow-rose-600/30 hover:shadow-xl hover:shadow-rose-600/40 transition-all transform hover:-translate-y-0.5"
            >
              <Siren className="w-5 h-5 animate-pulse" />
              <span>🚨 Find Emergency Care</span>
            </button>

            {/* Secondary Button */}
            <button
              onClick={() => onNavigate('hospital')}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow transition"
            >
              <Building2 className="w-4 h-4 text-healthcare-600" />
              <span>🏥 Hospital Login</span>
            </button>

            {/* Third Option */}
            <button
              onClick={() => onNavigate('ambulance')}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold text-healthcare-700 bg-healthcare-50 hover:bg-healthcare-100 border border-healthcare-200 shadow-sm transition"
            >
              <Activity className="w-4 h-4 text-healthcare-600" />
              <span>🚑 Ambulance Mode</span>
            </button>
          </div>

          {/* Start Demo CTA Banner */}
          <div className="pt-2">
            <button
              onClick={onStartDemo}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 shadow-xs transition"
            >
              <PlayCircle className="w-4 h-4 text-amber-600" />
              <span>🎬 Start Demo Walkthrough (1-Click Hackathon Scenario)</span>
            </button>
          </div>

          {/* Required Notice */}
          <div className="pt-3 border-t border-slate-200/60 max-w-xl mx-auto">
            <p className="text-xs text-slate-500 italic">
              Notice: Demo system using simulated hospital resource data. Decision-support prototype only.
            </p>
          </div>
        </div>
      </section>

      {/* Value Pillars Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-healthcare-50 text-healthcare-600 flex items-center justify-center mb-4">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">
            Clinical AI Triage
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Translates natural language incident descriptions into precise medical needs: 
            ICU admission, ventilator requirement, blood units, and surgical subspecialties.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-tealbrand-50 text-tealbrand-600 flex items-center justify-center mb-4">
            <Radio className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">
            Real-Time Resource Sync
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Simulated live telemetry streaming bed counts, ventilator availability, and emergency department loads 
            every 12 seconds via WebSockets.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">
            Guaranteed Reservation
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            When a hospital accepts an incoming emergency, critical life-support resources are instantly reserved 
            to prevent diverted admissions.
          </p>
        </div>
      </section>

      {/* Live Hospital Network Preview */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Connected Hospital Network (10 Regional Centers)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulated live telemetry feeds • Updated {secondsAgo}s ago
            </p>
          </div>

          <button
            onClick={() => onNavigate('emergency')}
            className="flex items-center gap-1.5 text-xs font-bold text-healthcare-700 hover:text-healthcare-800 transition"
          >
            <span>Triage Emergency Now</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hospitals.slice(0, 6).map((h) => (
            <div 
              key={h.id}
              className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-200 transition text-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900">{h.name}</h4>
                  <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{h.address}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  h.emergency_load > 80 ? 'bg-rose-100 text-rose-700' :
                  h.emergency_load > 65 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {h.emergency_load}% Load
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">ICU</span>
                  <span className="font-extrabold text-blue-700">{h.icu_available}</span>
                  <span className="text-[9px] text-slate-400">/{h.icu_total}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">VENTS</span>
                  <span className="font-extrabold text-cyan-700">{h.ventilator_available}</span>
                  <span className="text-[9px] text-slate-400">/{h.ventilator_total}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">BEDS</span>
                  <span className="font-extrabold text-slate-800">{h.beds_available}</span>
                  <span className="text-[9px] text-slate-400">/{h.beds_total}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Safety & Medical Disclaimers Section */}
      <section className="bg-slate-100/70 border border-slate-200 rounded-3xl p-6 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
          Safety Notice & Clinical Decision Support Protocol
        </h4>
        <p>
          LifeBridge AI is a healthcare decision-support prototype using simulated hospital resource data. 
          It does not provide medical diagnosis or replace emergency medical professionals.
        </p>
        <p>
          Hospital availability shown in this prototype is simulated and should not be treated as real-time hospital availability.
        </p>
      </section>
    </div>
  );
}
