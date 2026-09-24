import React, { useState, useEffect, useRef } from 'react';
import { 
  Siren, 
  Bot, 
  MapPin, 
  User, 
  Calendar, 
  Stethoscope, 
  Droplet, 
  Wind, 
  Bed, 
  CheckSquare, 
  Square, 
  Sparkles, 
  AlertCircle, 
  ArrowRight,
  Filter,
  Navigation,
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  Sparkle,
  Radio
} from 'lucide-react';
import AIAnalysisCard from '../components/AIAnalysisCard';
import HospitalCard from '../components/HospitalCard';
import HospitalMap from '../components/HospitalMap';
import HospitalDetailModal from '../components/HospitalDetailModal';
import { analyzeEmergency, getRecommendations, createEmergency, voiceTriage } from '../services/api';
import { soundEffects } from '../utils/audio';

const LOCATION_PRESETS = [
  { name: 'Central Hub / Connaught Place', lat: 28.6139, lng: 77.2090 },
  { name: 'Ring Road South Exit', lat: 28.5850, lng: 77.2150 },
  { name: 'Metro North Hub', lat: 28.6500, lng: 77.2100 },
  { name: 'Highway 44 Junction', lat: 28.6700, lng: 77.2400 },
];

const CLINICAL_PRESETS = [
  {
    label: '🚨 Section 35: Road Accident',
    patient: 'Arun Kumar',
    age: 42,
    gender: 'Male',
    type: 'Trauma',
    text: 'Road accident with severe bleeding and difficulty breathing.',
    blood: 'O+',
    specialist: 'Trauma Surgeon',
  },
  {
    label: '❤️ Myocardial Infarction',
    patient: 'Ramesh Gupta',
    age: 58,
    gender: 'Male',
    type: 'Cardiac emergency',
    text: 'Crushing chest pain radiating to left arm, sweating, severe shortness of breath.',
    blood: 'A+',
    specialist: 'Cardiologist',
  },
  {
    label: '🧠 Acute Stroke',
    patient: 'Meenakshi Sundaram',
    age: 67,
    gender: 'Female',
    type: 'Stroke',
    text: 'Sudden onset facial droop, right side weakness, slurred speech.',
    blood: 'B+',
    specialist: 'Neurologist',
  },
  {
    label: '🫁 Severe Asthma / Cyanosis',
    patient: 'Kavita Pillai',
    age: 34,
    gender: 'Female',
    type: 'Respiratory emergency',
    text: 'Severe acute asthma attack, unresponsive to inhaler, cyanosis around lips, gasping for breath.',
    blood: 'AB+',
    specialist: 'Pulmonologist',
  }
];

export default function EmergencyPage({ 
  onEmergencyCreated, 
  initialData = null,
  isAmbulanceMode = false 
}) {
  // Form State — Clean empty defaults (no pre-filled data)
  const [patientName, setPatientName] = useState(initialData?.patient_name || '');
  const [patientAge, setPatientAge] = useState(initialData?.patient_age || '');
  const [patientGender, setPatientGender] = useState(initialData?.patient_gender || '');
  const [selectedLocation, setSelectedLocation] = useState(LOCATION_PRESETS[0]);

  const [emergencyType, setEmergencyType] = useState(initialData?.emergency_type || '');
  const [description, setDescription] = useState(initialData?.description || '');

  const [bloodGroup, setBloodGroup] = useState('');
  const [specialist, setSpecialist] = useState('');

  // Manual Resource Checkbox overrides — default all false until chosen or auto-detected by AI
  const [manualResources, setManualResources] = useState({
    ICU: false,
    'Emergency bed': false,
    Ventilator: false,
    Blood: false,
    Specialist: false,
    'Trauma care': false,
  });

  // Flow State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedHospitalForModal, setSelectedHospitalForModal] = useState(null);
  const [focusedHospital, setFocusedHospital] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Voice Input (Speech Recognition) State
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceNotice, setVoiceNotice] = useState(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceNotice('Listening... Speak patient symptoms, name, age, and condition naturally.');
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }

        if (currentTranscript.trim()) {
          setDescription((prev) => {
            // Append or update smoothly
            return currentTranscript.trim();
          });
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setVoiceNotice(`Microphone notice: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setVoiceSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Toggle Voice Input
  const toggleListening = () => {
    if (!voiceSupported) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Edge, or type in the symptoms box.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setVoiceNotice('Voice recording stopped. Click "Run Voice NLP Triage" to auto-extract entities.');
    } else {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.start();
          setIsListening(true);
        }
      } catch (e) {
        console.error('Speech recognition start failed:', e);
      }
    }
  };

  // Run AI Voice Triage NLP extraction
  const handleVoiceNLPProcess = async () => {
    if (!description.trim()) {
      setErrorMsg('Please speak or enter an emergency description first.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setVoiceNotice('Processing speech with Clinical NLP Entity Model...');

    try {
      const res = await voiceTriage(description);
      soundEffects.playAcceptChime();

      // Auto populate extracted entities if not already set
      if (res.extracted_name && !patientName) setPatientName(res.extracted_name);
      if (res.extracted_age && !patientAge) setPatientAge(res.extracted_age);
      if (res.extracted_gender && !patientGender) setPatientGender(res.extracted_gender);
      if (res.extracted_blood && !bloodGroup) setBloodGroup(res.extracted_blood);

      if (res.extracted_location) {
        const found = LOCATION_PRESETS.find(
          (l) => l.name.toLowerCase().includes(res.extracted_location.toLowerCase())
        );
        if (found) setSelectedLocation(found);
      }

      // Populate AI analysis
      setAnalysisResult(res.analysis);
      if (res.analysis.emergency_type) setEmergencyType(res.analysis.emergency_type);
      if (res.analysis.required_specialist) setSpecialist(res.analysis.required_specialist);

      // Sync resource checkboxes
      setManualResources({
        ICU: res.analysis.icu_required,
        'Emergency bed': true,
        Ventilator: res.analysis.ventilator_required,
        Blood: res.analysis.blood_required,
        Specialist: true,
        'Trauma care': res.analysis.emergency_type.includes('Trauma'),
      });

      // Get hospital recommendations
      const recs = await getRecommendations({
        description: description,
        emergency_type: res.analysis.emergency_type,
        blood_group: res.extracted_blood || bloodGroup,
        specialist: res.analysis.required_specialist || specialist,
        patient_age: Number(res.extracted_age || patientAge) || 40,
        patient_gender: res.extracted_gender || patientGender,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
      });
      setRecommendations(recs);
      if (recs.length > 0) setFocusedHospital(recs[0]);

      setVoiceNotice('NLP Extraction complete: Clinical entities mapped.');
    } catch (err) {
      console.error('Voice NLP failed:', err);
      setErrorMsg('Voice NLP processing failed: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Text to Speech (TTS) Readout of AI Triage
  const speakAITriage = () => {
    if (!('speechSynthesis' in window) || !analysisResult) return;
    window.speechSynthesis.cancel();

    const topHosp = recommendations[0];
    const speechText = `Emergency triage result: Priority ${analysisResult.priority}. ${analysisResult.emergency_type}. Required resources: ${analysisResult.required_resources.join(', ')}. Top recommended hospital is ${topHosp?.name || 'Apollo Care Hospital'}, located ${topHosp?.distance_km || 3} kilometers away, estimated travel time ${topHosp?.estimated_travel_min || 8} minutes.`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Apply quick clinical test preset
  const applyPreset = (preset) => {
    setPatientName(preset.patient);
    setPatientAge(preset.age);
    setPatientGender(preset.gender);
    setEmergencyType(preset.type);
    setDescription(preset.text);
    setBloodGroup(preset.blood);
    setSpecialist(preset.specialist);
  };

  const handleResetForm = () => {
    setPatientName('');
    setPatientAge('');
    setPatientGender('');
    setEmergencyType('');
    setDescription('');
    setBloodGroup('');
    setSpecialist('');
    setManualResources({
      ICU: false,
      'Emergency bed': false,
      Ventilator: false,
      Blood: false,
      Specialist: false,
      'Trauma care': false,
    });
    setAnalysisResult(null);
    setRecommendations([]);
    setErrorMsg(null);
    setVoiceNotice(null);
  };

  const toggleResource = (key) => {
    setManualResources((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Run AI Emergency Analysis
  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Please enter or speak a clinical emergency description');
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);

    try {
      soundEffects.playEmergencyAlert();

      const analyzePayload = {
        description,
        emergency_type: emergencyType || undefined,
        blood_group: bloodGroup || undefined,
        specialist: specialist || undefined,
        patient_age: patientAge ? Number(patientAge) : undefined,
        patient_gender: patientGender || undefined,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
      };

      // 1. Analyze Emergency Requirements with AI
      const analysis = await analyzeEmergency(analyzePayload);
      setAnalysisResult(analysis);
      if (!emergencyType) setEmergencyType(analysis.emergency_type);
      if (!specialist) setSpecialist(analysis.required_specialist);

      // Sync checkboxes with AI findings
      setManualResources({
        ICU: analysis.icu_required,
        'Emergency bed': true,
        Ventilator: analysis.ventilator_required,
        Blood: analysis.blood_required,
        Specialist: true,
        'Trauma care': analysis.emergency_type.includes('Trauma'),
      });

      // 2. Fetch Ranked Recommendations
      const recs = await getRecommendations(analyzePayload);
      setRecommendations(recs);
      if (recs.length > 0) {
        setFocusedHospital(recs[0]);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setErrorMsg(err.message || 'Failed to analyze emergency. Please ensure the backend is running.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Hospital Selection & Request Creation
  const handleSelectHospital = async (hospital) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const selectedReqList = Object.keys(manualResources).filter((k) => manualResources[k]);

      const createPayload = {
        patient_name: patientName.trim() || 'Emergency Patient',
        patient_age: Number(patientAge) || 40,
        patient_gender: patientGender || 'Unspecified',
        location_name: selectedLocation.name,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        emergency_type: analysisResult?.emergency_type || emergencyType || 'Emergency',
        description: description,
        priority: analysisResult?.priority || 'CRITICAL',
        severity_score: analysisResult?.severity_score || 90,
        required_resources: selectedReqList.length ? selectedReqList : ['Emergency Department'],
        required_blood: bloodGroup || analysisResult?.blood_group || 'O+',
        required_specialist: specialist || analysisResult?.required_specialist || 'General Physician',
        ai_analysis_summary: analysisResult ? `${analysisResult.emergency_type} (${analysisResult.priority})` : 'Emergency Dispatch',
        selected_hospital_id: hospital.hospital_id || hospital.id,
      };

      const newEmergency = await createEmergency(createPayload);
      soundEffects.playAcceptChime();

      if (onEmergencyCreated) {
        onEmergencyCreated(newEmergency, hospital);
      }
    } catch (err) {
      console.error('Failed to create emergency request:', err);
      setErrorMsg(err.message || 'Failed to dispatch emergency request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className={`p-4 sm:p-5 rounded-3xl border flex flex-wrap items-center justify-between gap-3 shadow-xs ${
        isAmbulanceMode 
          ? 'bg-slate-900 text-white border-slate-800' 
          : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md">
            <Siren className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold flex items-center gap-2">
              {isAmbulanceMode ? '🚑 Paramedic & Ambulance Rapid Triage' : '🚨 Find Emergency Care'}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                VOICE NLP ENABLED
              </span>
            </h1>
            <p className="text-xs opacity-75">
              Enter details or use speech recognition to trigger instant clinical requirement assessment and hospital matching.
            </p>
          </div>
        </div>

        {/* Quick Clinical Test Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400">Sample Presets:</span>
          {CLINICAL_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={handleResetForm}
            className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-xl transition"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Intake Form */}
      <form onSubmit={handleAnalyze} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* VOICE INPUT & SYMPTOM RECOGNITION HERO SECTION */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-healthcare-50 via-tealbrand-50 to-blue-50 border border-healthcare-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-white shadow-xs text-healthcare-600">
                <Mic className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Voice Input & Clinical NLP Model
                </h3>
                <p className="text-[11px] text-slate-500">
                  Speak natural emergency symptoms; the model extracts name, age, gender, location, and requirements.
                </p>
              </div>
            </div>

            {/* Mic Toggle Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-healthcare-600 hover:bg-healthcare-700 text-white'
                }`}
              >
                {isListening ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <MicOff className="w-4 h-4" />
                    <span>Listening... (Tap to Stop)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Start Voice Input</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleVoiceNLPProcess}
                disabled={!description.trim() || isAnalyzing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-tealbrand-800 bg-tealbrand-100 hover:bg-tealbrand-200 border border-tealbrand-300 transition disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5 text-tealbrand-700" />
                <span>AI Extract from Voice</span>
              </button>
            </div>
          </div>

          {/* Voice Waveform status feedback */}
          {voiceNotice && (
            <div className="text-[11px] text-healthcare-800 font-medium flex items-center gap-1.5 bg-white/80 p-2 rounded-xl border border-healthcare-200">
              <Radio className="w-3.5 h-3.5 text-healthcare-600 animate-pulse" />
              <span>{voiceNotice}</span>
            </div>
          )}
        </div>

        {/* 1. Patient Information */}
        <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-healthcare-600" />
          1. Patient Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* Patient Name */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Patient Name</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. Arun Kumar"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-healthcare-500 text-xs text-slate-900 font-medium"
            />
          </div>

          {/* Age */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Age (Years)</label>
            <input
              type="number"
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value)}
              placeholder="e.g. 42"
              min="0"
              max="120"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-healthcare-500 text-xs text-slate-900 font-medium"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Gender</label>
            <select
              value={patientGender}
              onChange={(e) => setPatientGender(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-healthcare-500 text-xs text-slate-900 font-medium bg-white"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other / Pediatric</option>
            </select>
          </div>

          {/* Location Preset */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-healthcare-600" /> Incident Location
            </label>
            <select
              value={selectedLocation.name}
              onChange={(e) => {
                const found = LOCATION_PRESETS.find((l) => l.name === e.target.value);
                if (found) setSelectedLocation(found);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-healthcare-500 text-xs text-slate-900 font-medium bg-white"
            >
              {LOCATION_PRESETS.map((loc, idx) => (
                <option key={idx} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Emergency Clinical Details */}
        <div className="pt-4 border-t border-slate-100">
          <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
            <Stethoscope className="w-4 h-4 text-healthcare-600" />
            2. Emergency Clinical Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Emergency Type */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Emergency Category</label>
              <select
                value={emergencyType}
                onChange={(e) => setEmergencyType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-healthcare-500 text-xs text-slate-900 font-medium bg-white"
              >
                <option value="">Auto-Detect by AI</option>
                <option value="Accident">Accident</option>
                <option value="Cardiac emergency">Cardiac emergency</option>
                <option value="Stroke">Stroke</option>
                <option value="Respiratory emergency">Respiratory emergency</option>
                <option value="Trauma">Trauma</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Blood Group */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-rose-500" /> Patient Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-healthcare-500 text-xs text-slate-900 font-medium bg-white"
              >
                <option value="">Auto-Detect or Unknown</option>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            {/* Specialist Requested */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Specialist</label>
              <select
                value={specialist}
                onChange={(e) => setSpecialist(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-healthcare-500 text-xs text-slate-900 font-medium bg-white"
              >
                <option value="">Auto-Assign by AI Triage</option>
                <option value="Trauma Surgeon">Trauma Surgeon</option>
                <option value="Cardiologist">Cardiologist</option>
                <option value="Neurologist">Neurologist</option>
                <option value="Pulmonologist">Pulmonologist</option>
                <option value="General Physician">General Physician</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Description Textarea */}
          <div className="mt-4">
            <label className="font-semibold text-slate-700 block mb-1 flex items-center justify-between">
              <span>Symptoms & Emergency Description (Natural Language or Voice Input)</span>
              <span className="text-[11px] text-slate-400">Type or speak symptoms</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Road accident patient with severe bleeding and difficulty breathing. (Or speak via the microphone above)"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-healthcare-500 text-xs text-slate-900 font-medium"
            />
          </div>
        </div>

        {/* Required Resources Checklist / Overrides */}
        <div className="pt-4 border-t border-slate-100">
          <label className="font-semibold text-slate-700 block mb-2 text-xs">
            Required Resources (Auto-Identified by AI, or manually toggle):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
            {Object.keys(manualResources).map((key) => {
              const checked = manualResources[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleResource(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition ${
                    checked
                      ? 'bg-healthcare-50 border-healthcare-300 text-healthcare-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="w-4 h-4 text-healthcare-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <span className="truncate">{key}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Analyze Button */}
        <div className="pt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleResetForm}
            className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            Clear
          </button>

          <button
            type="submit"
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold text-white bg-healthcare-600 hover:bg-healthcare-700 active:bg-healthcare-800 shadow-md shadow-healthcare-600/25 transition disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>AI Analyzing Emergency...</span>
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                <span>Analyze Emergency & Find Hospitals</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* AI Analysis Result Section */}
      {analysisResult && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              AI Clinical Assessment & Decision Support
            </h2>
            {/* Text to Speech Voice Briefing Button */}
            <button
              onClick={speakAITriage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-healthcare-50 hover:bg-healthcare-100 text-healthcare-700 text-xs font-bold border border-healthcare-200 shadow-2xs transition"
            >
              <Volume2 className="w-3.5 h-3.5 text-healthcare-600" />
              <span>🔊 Read Aloud AI Briefing</span>
            </button>
          </div>

          <AIAnalysisCard analysis={analysisResult} />

          {/* Hospital Results & Leaflet Map Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Hospital Cards List (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Nearby Hospital Recommendations ({recommendations.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Multi-criteria suitability scoring (Resource Match 35%, Cap 20%, ETA 20%, ICU 10%)
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {recommendations.map((hosp, idx) => (
                  <HospitalCard
                    key={hosp.hospital_id}
                    hospital={hosp}
                    isTopRecommendation={idx === 0}
                    onSelect={handleSelectHospital}
                    onViewDetails={(h) => setSelectedHospitalForModal(h.hospital_id)}
                    onNavigate={(h) => setFocusedHospital(h)}
                  />
                ))}
              </div>
            </div>

            {/* Interactive Leaflet Map (5 Cols) */}
            <div className="lg:col-span-5 sticky top-24 space-y-3">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-rose-600" />
                  Live Emergency Routing Map
                </span>
                <span className="text-[10px] text-slate-500">
                  OpenStreetMap • No Paid APIs
                </span>
              </div>

              <HospitalMap
                patientLocation={selectedLocation}
                hospitals={recommendations}
                selectedHospital={focusedHospital}
                onSelectHospital={handleSelectHospital}
                height="540px"
              />

              {focusedHospital && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Route Focus:</span>
                    <p className="font-bold text-slate-800">{focusedHospital.name}</p>
                  </div>
                  <button
                    onClick={() => handleSelectHospital(focusedHospital)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-xs"
                  >
                    Select This Hospital
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Hospital Detail Modal */}
      {selectedHospitalForModal && (
        <HospitalDetailModal
          hospitalId={selectedHospitalForModal}
          onClose={() => setSelectedHospitalForModal(null)}
          onSelectHospital={(h) => {
            handleSelectHospital(h);
            setSelectedHospitalForModal(null);
          }}
        />
      )}
    </div>
  );
}
