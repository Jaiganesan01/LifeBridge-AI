import React from 'react';
import { 
  HeartPulse, 
  Activity, 
  Siren, 
  Building2, 
  Sliders, 
  BarChart3, 
  ShieldAlert, 
  PlayCircle,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff
} from 'lucide-react';
import { soundEffects } from '../utils/audio';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  isConnected, 
  secondsAgo, 
  onStartDemo,
  soundMuted,
  setSoundMuted 
}) {
  const toggleSound = () => {
    soundEffects.enabled = soundMuted;
    setSoundMuted(!soundMuted);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            DEMO PROTOTYPE
          </span>
          <span className="hidden sm:inline text-slate-300">
            Demo system using simulated hospital resource data — decision support only.
          </span>
          <span className="sm:hidden text-slate-300 text-[11px]">
            Simulated hospital data demo.
          </span>
        </div>

        {/* Live Simulation Pulse Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700 text-[11px]">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className="font-semibold text-emerald-400 tracking-wide">
              {isConnected ? 'LIVE DATA' : 'CONNECTING...'}
            </span>
            <span className="text-slate-400 text-[10px]">|</span>
            <span className="text-slate-300 text-[10px]">
              Updated {secondsAgo}s ago
            </span>
          </div>

          <button
            onClick={toggleSound}
            title={soundMuted ? "Enable Sound Alerts" : "Mute Sound Alerts"}
            className="text-slate-400 hover:text-white p-1 rounded transition"
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-healthcare-600 via-healthcare-500 to-tealbrand-500 flex items-center justify-center text-white shadow-md shadow-healthcare-500/20 group-hover:scale-105 transition-transform">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 bg-gradient-to-r from-healthcare-700 via-healthcare-600 to-tealbrand-600 bg-clip-text text-transparent">
                LifeBridge AI
              </span>
              <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-healthcare-50 text-healthcare-700 border border-healthcare-200 rounded">
                v1.0
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
              Bridging Lives To Care
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/70">
          <button
            onClick={() => setActiveTab('emergency')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'emergency'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Siren className="w-3.5 h-3.5" />
            Find Care
          </button>

          <button
            onClick={() => setActiveTab('ambulance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'ambulance'
                ? 'bg-healthcare-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Ambulance Mode
          </button>

          <button
            onClick={() => setActiveTab('hospital')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'hospital'
                ? 'bg-tealbrand-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Hospital Portal
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'simulator'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Simulator
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'admin'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Admin
          </button>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2">
          {/* Start Demo Button */}
          <button
            onClick={onStartDemo}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <PlayCircle className="w-4 h-4 fill-white/20" />
            <span>🎬 Start Demo</span>
          </button>

          {/* Quick Find Care emergency button if not in emergency mode */}
          {activeTab !== 'emergency' && (
            <button
              onClick={() => setActiveTab('emergency')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
            >
              <Siren className="w-4 h-4 text-rose-600" />
              <span>🚨 Emergency</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-100 px-2 py-1.5 bg-slate-50 text-[11px] font-medium overflow-x-auto">
        <button 
          onClick={() => setActiveTab('emergency')} 
          className={`px-2 py-1 rounded ${activeTab === 'emergency' ? 'bg-rose-600 text-white font-bold' : 'text-slate-600'}`}
        >
          Emergency
        </button>
        <button 
          onClick={() => setActiveTab('ambulance')} 
          className={`px-2 py-1 rounded ${activeTab === 'ambulance' ? 'bg-healthcare-600 text-white font-bold' : 'text-slate-600'}`}
        >
          Ambulance
        </button>
        <button 
          onClick={() => setActiveTab('hospital')} 
          className={`px-2 py-1 rounded ${activeTab === 'hospital' ? 'bg-tealbrand-600 text-white font-bold' : 'text-slate-600'}`}
        >
          Hospital
        </button>
        <button 
          onClick={() => setActiveTab('simulator')} 
          className={`px-2 py-1 rounded ${activeTab === 'simulator' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600'}`}
        >
          Simulator
        </button>
        <button 
          onClick={() => setActiveTab('analytics')} 
          className={`px-2 py-1 rounded ${activeTab === 'analytics' ? 'bg-slate-800 text-white font-bold' : 'text-slate-600'}`}
        >
          Analytics
        </button>
        <button 
          onClick={() => setActiveTab('admin')} 
          className={`px-2 py-1 rounded ${activeTab === 'admin' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'}`}
        >
          Admin
        </button>
      </div>
    </header>
  );
}
