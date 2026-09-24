import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Play, 
  RotateCcw, 
  Sparkles, 
  Bot, 
  Building2, 
  TrendingUp, 
  Clock, 
  Bed, 
  Wind, 
  AlertTriangle 
} from 'lucide-react';
import { simulateWhatIf } from '../services/api';

export default function SimulatorPage() {
  const [description, setDescription] = useState(
    'Road accident with severe bleeding and difficulty breathing.'
  );
  const [icuOverride, setIcuOverride] = useState(2);
  const [ventilatorOverride, setVentilatorOverride] = useState(1);
  const [loadOverride, setLoadOverride] = useState(82);
  const [trafficFactor, setTrafficFactor] = useState(1.4); // 40% traffic delay

  // Weights
  const [weightResourceMatch, setWeightResourceMatch] = useState(35);
  const [weightCapability, setWeightCapability] = useState(20);
  const [weightTravelTime, setWeightTravelTime] = useState(20);
  const [weightIcu, setWeightIcu] = useState(10);
  const [weightSpecialist, setWeightSpecialist] = useState(10);
  const [weightLoad, setWeightLoad] = useState(5);

  const [loading, setLoading] = useState(false);
  const [simulatedResults, setSimulatedResults] = useState([]);
  const [baselineResults, setBaselineResults] = useState([]);

  // Run simulation
  const runSimulation = async () => {
    setLoading(true);
    try {
      // 1. Fetch baseline without overrides
      const baseline = await simulateWhatIf({
        emergency_description: description,
        patient_lat: 28.6139,
        patient_lng: 77.2090,
      });
      setBaselineResults(baseline);

      // 2. Fetch simulated with overrides
      const totalWeight = weightResourceMatch + weightCapability + weightTravelTime + weightIcu + weightSpecialist + weightLoad || 100;
      const customWeights = {
        resource_match: weightResourceMatch / totalWeight,
        emergency_capability: weightCapability / totalWeight,
        travel_time: weightTravelTime / totalWeight,
        icu_availability: weightIcu / totalWeight,
        specialist_match: weightSpecialist / totalWeight,
        current_load: weightLoad / totalWeight,
      };

      const simulated = await simulateWhatIf({
        emergency_description: description,
        patient_lat: 28.6139,
        patient_lng: 77.2090,
        icu_override: icuOverride,
        ventilator_override: ventilatorOverride,
        emergency_load_override: loadOverride,
        travel_time_factor: trafficFactor,
        weights: customWeights,
      });
      setSimulatedResults(simulated);
    } catch (e) {
      console.error('Simulation failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, []);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
              DECISION SUPPORT LAB
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              WHAT-IF ENGINE
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Emergency Scenario & Policy Simulator
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dynamically adjust regional stress parameters (bed scarcity, traffic choke, capacity surges) to test AI routing resilience.
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition transform active:scale-95 disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{loading ? 'Simulating...' : 'Run Simulation'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5 text-xs">
            <h3 className="font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              1. Simulated Stress Overrides
            </h3>

            {/* Emergency Description */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Emergency Case Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* ICU Availability Slider */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="flex items-center gap-1 text-slate-700">
                  <Bed className="w-3.5 h-3.5 text-blue-600" /> Regional ICU Available
                </span>
                <span className="font-bold text-blue-700">{icuOverride} beds</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={icuOverride}
                onChange={(e) => setIcuOverride(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>0 (Critical Shortage)</span>
                <span>10 (Surplus)</span>
              </div>
            </div>

            {/* Ventilator Availability Slider */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="flex items-center gap-1 text-slate-700">
                  <Wind className="w-3.5 h-3.5 text-cyan-600" /> Regional Ventilator Ready
                </span>
                <span className="font-bold text-cyan-700">{ventilatorOverride} units</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                value={ventilatorOverride}
                onChange={(e) => setVentilatorOverride(Number(e.target.value))}
                className="w-full accent-cyan-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>0 (Depleted)</span>
                <span>8 (Ample)</span>
              </div>
            </div>

            {/* Emergency Load Slider */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="flex items-center gap-1 text-slate-700">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-500" /> Simulated Department Load
                </span>
                <span className={`font-bold ${loadOverride > 80 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {loadOverride}%
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="98"
                value={loadOverride}
                onChange={(e) => setLoadOverride(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>30% (Quiet)</span>
                <span>98% (Disaster Saturation)</span>
              </div>
            </div>

            {/* Traffic Delay Factor */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="flex items-center gap-1 text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> Urban Traffic Congestion
                </span>
                <span className="font-bold text-amber-700">+{Math.round((trafficFactor - 1) * 100)}% Transit Delay</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.1"
                value={trafficFactor}
                onChange={(e) => setTrafficFactor(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>1.0x (Clear Roads)</span>
                <span>2.5x (Gridlock)</span>
              </div>
            </div>
          </div>

          {/* AI Criteria Weight Tuning */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
            <h3 className="font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Bot className="w-4 h-4 text-healthcare-600" />
              2. Recommendation Criteria Weights (%)
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                  <span>Resource Match:</span>
                  <span>{weightResourceMatch}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={weightResourceMatch}
                  onChange={(e) => setWeightResourceMatch(Number(e.target.value))}
                  className="w-full accent-healthcare-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                  <span>Travel Time / Distance:</span>
                  <span>{weightTravelTime}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={weightTravelTime}
                  onChange={(e) => setWeightTravelTime(Number(e.target.value))}
                  className="w-full accent-healthcare-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                  <span>Emergency Capability:</span>
                  <span>{weightCapability}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={weightCapability}
                  onChange={(e) => setWeightCapability(Number(e.target.value))}
                  className="w-full accent-healthcare-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Comparison Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Simulated AI Decision Output vs. Baseline
              </h3>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
                Live Re-ranking
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Observe how shifting regional parameters impacts hospital rankings and suitability scores in real time:
            </p>

            <div className="space-y-3">
              {simulatedResults.map((simHosp, idx) => {
                const baseHosp = baselineResults.find((b) => b.hospital_id === simHosp.hospital_id);
                const scoreDiff = baseHosp ? Math.round((simHosp.suitability_score - baseHosp.suitability_score) * 10) / 10 : 0;

                return (
                  <div 
                    key={simHosp.hospital_id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-white transition text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            idx === 0 ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-700'
                          }`}>
                            #{idx + 1}
                          </span>
                          <span className="font-extrabold text-slate-900 text-sm">{simHosp.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Distance: {simHosp.distance_km} km • ETA: ~{simHosp.estimated_travel_min} min (simulated)
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-base text-indigo-700">
                          {simHosp.suitability_score}%
                        </div>
                        {scoreDiff !== 0 && (
                          <span className={`text-[10px] font-bold ${scoreDiff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff}% shift
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Breakdown bar */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-[10px] text-slate-600">
                      <span>Resource Fit: <strong>{simHosp.score_breakdown?.resource_match}</strong></span>
                      <span>Capability: <strong>{simHosp.score_breakdown?.emergency_capability}</strong></span>
                      <span>Transit: <strong>{simHosp.score_breakdown?.travel_time}</strong></span>
                      <span>ICU Ready: <strong>{simHosp.score_breakdown?.icu_availability}</strong></span>
                    </div>

                    {/* Highlighted explanation */}
                    <div className="text-[11px] text-slate-600 italic">
                      {simHosp.match_reasons?.[0] || 'Standard matching criteria met.'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
