import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  X, 
  CheckCircle2, 
  Bot, 
  Building2, 
  Siren, 
  Activity, 
  Sparkles,
  Bed,
  Wind
} from 'lucide-react';
import { soundEffects } from '../utils/audio';

export const DEMO_STEPS = [
  {
    step: 1,
    title: 'Emergency Case Intake',
    description: 'Patient Arun Kumar (42) in critical condition: "Road accident with severe bleeding and difficulty breathing".',
    targetTab: 'emergency',
    duration: 6,
  },
  {
    step: 2,
    title: 'AI Multi-Modal Requirement Analysis',
    description: 'LifeBridge AI processes clinical symptoms: marks CRITICAL priority, identifies need for ICU, Ventilator, Blood, and Trauma Surgeon.',
    targetTab: 'emergency',
    duration: 7,
  },
  {
    step: 3,
    title: 'Hospital Capability & Travel Evaluation',
    description: 'AI calculates multi-criteria suitability scores across 10 regional hospitals based on live resources and transit times.',
    targetTab: 'emergency',
    duration: 7,
  },
  {
    step: 4,
    title: 'Optimal Hospital Recommendation',
    description: 'Ranked hospital cards displayed with full clinical matching explanations, travel ETA, and OpenStreetMap route.',
    targetTab: 'emergency',
    duration: 6,
  },
  {
    step: 5,
    title: 'Hospital Selection & Dispatch',
    description: 'High-capability facility selected. Case ID generated and sent to regional emergency dispatch queue.',
    targetTab: 'patient-tracker',
    duration: 6,
  },
  {
    step: 6,
    title: 'Real-Time Hospital Notification',
    description: 'Target hospital receives instant WebSocket dispatch alert on its dashboard with siren chime.',
    targetTab: 'hospital',
    duration: 7,
  },
  {
    step: 7,
    title: 'Hospital Accepts & Initiates Triage',
    description: 'Emergency department physician clicks "Accept & Prepare". Case status transitions to PREPARING.',
    targetTab: 'hospital',
    duration: 7,
  },
  {
    step: 8,
    title: 'Temporary Resource Reservation',
    description: '1 ICU bed, 1 Ventilator, and 1 Emergency bed are instantly locked and reserved in database.',
    targetTab: 'hospital',
    duration: 7,
  },
  {
    step: 9,
    title: 'Ambulance Transit & Patient Tracking',
    description: 'Patient and paramedic interface updates to "Preparing Resources" with live GPS ETA countdown.',
    targetTab: 'patient-tracker',
    duration: 8,
  },
  {
    step: 10,
    title: 'Real-Time Network Sync Verified',
    description: 'Admin dashboard and regional network reflect reserved capacity instantly without browser refresh.',
    targetTab: 'admin',
    duration: 8,
  }
];

export default function DemoModal({
  isOpen,
  onClose,
  onRunStepAction,
  activeTab,
  setActiveTab
}) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const currentStep = DEMO_STEPS[currentStepIdx];

  // Auto progression timer
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const stepDurationMs = (currentStep.duration || 7) * 1000;
    const intervalMs = 100;
    const increment = (intervalMs / stepDurationMs) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Advance to next step
          if (currentStepIdx < DEMO_STEPS.length - 1) {
            const nextIdx = currentStepIdx + 1;
            setCurrentStepIdx(nextIdx);
            onRunStepAction(nextIdx);
            return 0;
          } else {
            setIsPlaying(false);
            return 100;
          }
        }
        return prev + increment;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, currentStepIdx, currentStep, onRunStepAction]);

  // When step changes, trigger associated action
  const jumpToStep = (index) => {
    setCurrentStepIdx(index);
    setProgress(0);
    onRunStepAction(index);
  };

  const handleNext = () => {
    if (currentStepIdx < DEMO_STEPS.length - 1) {
      jumpToStep(currentStepIdx + 1);
    }
  };

  const handleRestart = () => {
    setCurrentStepIdx(0);
    setProgress(0);
    setIsPlaying(true);
    onRunStepAction(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-lg w-[calc(100vw-3rem)] animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-xl text-white rounded-3xl p-5 shadow-2xl border border-slate-700/80 shadow-slate-950/50">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Live Automated Hackathon Demo
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              Step {currentStep.step} / {DEMO_STEPS.length}
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Step Content */}
        <div className="my-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-healthcare-600 text-[11px] font-bold">
                STAGE {currentStep.step}
              </span>
              {currentStep.title}
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mt-1">
            {currentStep.description}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step dots navigation */}
        <div className="flex items-center justify-between gap-1 mb-4 overflow-x-auto pb-1">
          {DEMO_STEPS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => jumpToStep(idx)}
              title={s.title}
              className={`h-2 flex-1 rounded-full transition-all ${
                idx === currentStepIdx
                  ? 'bg-amber-400 ring-2 ring-amber-400/30 h-2.5'
                  : idx < currentStepIdx
                    ? 'bg-emerald-500'
                    : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white px-2 py-1 rounded transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  Resume
                </>
              )}
            </button>

            <button
              onClick={handleNext}
              disabled={currentStepIdx >= DEMO_STEPS.length - 1}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold transition disabled:opacity-40"
            >
              <span>Next</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
