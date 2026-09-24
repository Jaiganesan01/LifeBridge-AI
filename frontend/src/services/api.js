const API_BASE = 'http://localhost:8000';

export async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorDetail = 'API Request Failed';
    try {
      const err = await response.json();
      errorDetail = err.detail || JSON.stringify(err);
    } catch (e) {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

// Hospitals
export const getHospitals = () => fetchJson('/hospitals');
export const getHospital = (id) => fetchJson(`/hospitals/${id}`);
export const getHospitalResources = (id) => fetchJson(`/hospitals/${id}/resources`);
export const updateHospitalResources = (id, data) =>
  fetchJson(`/hospitals/${id}/resources/update`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

// AI & Emergency
export const analyzeEmergency = (data) =>
  fetchJson('/emergency/analyze', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const voiceTriage = (transcript) =>
  fetchJson('/emergency/voice-triage', {
    method: 'POST',
    body: JSON.stringify({ transcript }),
  });


export const getRecommendations = (data, trafficFactor = 1.0) =>
  fetchJson(`/emergency/recommend?traffic_factor=${trafficFactor}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const createEmergency = (data) =>
  fetchJson('/emergency/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getEmergency = (id) => fetchJson(`/emergency/${id}`);
export const listEmergencies = (hospitalId, status) => {
  let query = '';
  const params = [];
  if (hospitalId) params.push(`hospital_id=${encodeURIComponent(hospitalId)}`);
  if (status) params.push(`status=${encodeURIComponent(status)}`);
  if (params.length) query = `?${params.join('&')}`;
  return fetchJson(`/emergency${query}`);
};

export const selectHospital = (emergencyId, hospitalId, distanceKm, estimatedTravelMin) =>
  fetchJson(`/emergency/${emergencyId}/select-hospital`, {
    method: 'POST',
    body: JSON.stringify({
      hospital_id: hospitalId,
      distance_km: distanceKm,
      estimated_travel_min: estimatedTravelMin,
    }),
  });

export const acceptEmergency = (emergencyId) =>
  fetchJson(`/emergency/${emergencyId}/accept`, {
    method: 'POST',
  });

export const cancelEmergency = (emergencyId, reason) =>
  fetchJson(`/emergency/${emergencyId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ status: 'CANCELLED', reason }),
  });

export const updateEmergencyStatus = (emergencyId, status) =>
  fetchJson(`/emergency/${emergencyId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });

// What-If Simulation
export const simulateWhatIf = (data) =>
  fetchJson('/simulation/what-if', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Analytics
export const getAnalytics = () => fetchJson('/analytics');

// Demo Reset
export const resetDemoDatabase = () =>
  fetchJson('/demo/reset', {
    method: 'POST',
  });
