import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import EmergencyPage from './pages/EmergencyPage';
import PatientTrackerPage from './pages/PatientTrackerPage';
import HospitalDashboardPage from './pages/HospitalDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import SimulatorPage from './pages/SimulatorPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DemoModal, { DEMO_STEPS } from './components/DemoModal';
import { useWebSocket } from './hooks/useWebSocket';
import { 
  getHospitals, 
  analyzeEmergency, 
  getRecommendations, 
  createEmergency, 
  acceptEmergency 
} from './services/api';
import { soundEffects } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [hospitals, setHospitals] = useState([]);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [activeHospital, setActiveHospital] = useState(null);
  const [soundMuted, setSoundMuted] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  // WebSocket connection to backend
  const { isConnected, lastEvent, secondsAgo } = useWebSocket('ws://localhost:8000/ws');

  // Load hospitals on mount
  useEffect(() => {
    getHospitals()
      .then((data) => setHospitals(data))
      .catch((err) => console.warn('Could not fetch hospitals on mount:', err));
  }, []);

  // Update hospitals on live simulation broadcasts
  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.event === 'RESOURCE_UPDATED' && lastEvent.data?.updated_hospitals) {
      const updatedList = lastEvent.data.updated_hospitals;
      setHospitals((prev) =>
        prev.map((h) => {
          const match = updatedList.find((u) => u.id === h.id);
          return match ? { ...h, ...match } : h;
        })
      );
    }
  }, [lastEvent]);

  // Handle emergency creation from user
  const handleEmergencyCreated = (emergency, hospital) => {
    setActiveEmergency(emergency);
    setActiveHospital(hospital);
    setActiveTab('patient-tracker');
  };

  // Demo step automated actions (Section 29: 60-90s complete walkthrough)
  const handleRunDemoStep = useCallback(async (stepIdx) => {
    const step = DEMO_STEPS[stepIdx];
    if (!step) return;

    console.log(`🎬 Running Demo Step ${step.step}: ${step.title}`);

    try {
      if (step.step === 1) {
        // Step 1: Open emergency page with Arun Kumar case
        setActiveTab('emergency');
      } else if (step.step === 2 || step.step === 3 || step.step === 4) {
        // Step 2-4: Run AI analysis and fetch recommendations
        setActiveTab('emergency');
        const payload = {
          description: 'Road accident with severe bleeding and difficulty breathing.',
          emergency_type: 'Trauma',
          blood_group: 'O+',
          specialist: 'Trauma Surgeon',
          patient_age: 42,
          patient_gender: 'Male',
          latitude: 28.6139,
          longitude: 77.2090,
        };
        soundEffects.playEmergencyAlert();
        await analyzeEmergency(payload);
        const recs = await getRecommendations(payload);
        if (recs && recs.length > 0) {
          setActiveHospital(recs[0]);
        }
      } else if (step.step === 5) {
        // Step 5: Select top hospital and create emergency case
        const createPayload = {
          patient_name: 'Arun Kumar',
          patient_age: 42,
          patient_gender: 'Male',
          location_name: 'Central Hub / Connaught Place',
          latitude: 28.6139,
          longitude: 77.2090,
          emergency_type: 'Trauma / Road Accident',
          description: 'Road accident with severe bleeding and difficulty breathing.',
          priority: 'CRITICAL',
          severity_score: 95,
          required_resources: ['ICU', 'Ventilator', 'Blood', 'Trauma Surgeon'],
          required_blood: 'O+',
          required_specialist: 'Trauma Surgeon',
          selected_hospital_id: activeHospital?.hospital_id || 'HOSP-01',
        };
        const emg = await createEmergency(createPayload);
        setActiveEmergency(emg);
        setActiveTab('patient-tracker');
      } else if (step.step === 6) {
        // Step 6: View incoming emergency in Hospital dashboard
        setActiveTab('hospital');
        soundEffects.playEmergencyAlert();
      } else if (step.step === 7 || step.step === 8) {
        // Step 7-8: Accept emergency and reserve resources
        setActiveTab('hospital');
        if (activeEmergency?.id) {
          await acceptEmergency(activeEmergency.id);
          soundEffects.playAcceptChime();
        }
      } else if (step.step === 9) {
        // Step 9: Patient tracking with preparing resources and en route
        setActiveTab('patient-tracker');
      } else if (step.step === 10) {
        // Step 10: Show Admin network sync
        setActiveTab('admin');
      }
    } catch (err) {
      console.warn('Demo step execution notice:', err);
    }
  }, [activeHospital, activeEmergency]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-healthcare-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        secondsAgo={secondsAgo}
        onStartDemo={() => {
          setIsDemoOpen(true);
          handleRunDemoStep(0);
        }}
        soundMuted={soundMuted}
        setSoundMuted={setSoundMuted}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'landing' && (
          <LandingPage
            onNavigate={setActiveTab}
            onStartDemo={() => {
              setIsDemoOpen(true);
              handleRunDemoStep(0);
            }}
            hospitals={hospitals}
            secondsAgo={secondsAgo}
          />
        )}

        {activeTab === 'emergency' && (
          <EmergencyPage
            onEmergencyCreated={handleEmergencyCreated}
            isAmbulanceMode={false}
          />
        )}

        {activeTab === 'ambulance' && (
          <EmergencyPage
            onEmergencyCreated={handleEmergencyCreated}
            isAmbulanceMode={true}
          />
        )}

        {activeTab === 'patient-tracker' && (
          <PatientTrackerPage
            emergencyId={activeEmergency?.id || 'LB-1042'}
            hospitalData={activeHospital}
            onBackToNewEmergency={() => setActiveTab('emergency')}
            webSocketEvent={lastEvent}
          />
        )}

        {activeTab === 'hospital' && (
          <HospitalDashboardPage
            webSocketEvent={lastEvent}
            secondsAgo={secondsAgo}
          />
        )}

        {activeTab === 'simulator' && (
          <SimulatorPage />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage
            webSocketEvent={lastEvent}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboardPage
            webSocketEvent={lastEvent}
            secondsAgo={secondsAgo}
          />
        )}
      </main>

      {/* Demo Modal Floating Controller */}
      <DemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onRunStepAction={handleRunDemoStep}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-sm">LifeBridge AI</span>
            <span>—</span>
            <span>Bridging Lives To Care</span>
          </div>

          <div className="text-[11px] text-slate-400">
            Hackathon Prototype • Decision support only • Simulated hospital data
          </div>
        </div>
      </footer>
    </div>
  );
}
