import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function HospitalMap({ 
  patientLocation, 
  hospitals = [], 
  selectedHospital = null, 
  onSelectHospital,
  height = "520px"
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);

  const defaultCenter = [patientLocation?.lat || 28.6139, patientLocation?.lng || 77.2090];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current || !routeLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    routeLayerRef.current.clearLayers();

    const bounds = L.latLngBounds();

    // 1. Patient Marker
    if (patientLocation && patientLocation.lat && patientLocation.lng) {
      const patientLatLng = [patientLocation.lat, patientLocation.lng];
      bounds.extend(patientLatLng);

      const patientHtml = `
        <div class="relative flex items-center justify-center w-8 h-8">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <div class="relative w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
            📍
          </div>
        </div>
      `;

      const patientIcon = L.divIcon({
        className: 'custom-patient-marker',
        html: patientHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const patientMarker = L.marker(patientLatLng, { icon: patientIcon })
        .bindPopup(`
          <div class="p-1 text-slate-800 text-xs">
            <p class="font-bold text-rose-600 text-sm">📍 Emergency Incident Location</p>
            <p class="text-slate-600 mt-1">${patientLocation.address || 'Patient Location'}</p>
            <p class="text-slate-400 text-[10px] mt-0.5">${patientLocation.lat.toFixed(4)}, ${patientLocation.lng.toFixed(4)}</p>
          </div>
        `);
      markersLayerRef.current.addLayer(patientMarker);
    }

    // 2. Hospital Markers
    hospitals.forEach((h) => {
      if (!h.latitude || !h.longitude) return;

      const hospitalLatLng = [h.latitude, h.longitude];
      bounds.extend(hospitalLatLng);

      const isSelected = selectedHospital && selectedHospital.hospital_id === h.hospital_id;
      const isTop = h.suitability_score >= 85;

      const markerColor = isSelected 
        ? 'bg-rose-600 ring-4 ring-rose-200' 
        : isTop 
          ? 'bg-emerald-600' 
          : h.emergency_status === 'Busy' 
            ? 'bg-amber-500' 
            : 'bg-healthcare-600';

      const hospitalHtml = `
        <div class="w-8 h-8 rounded-full ${markerColor} border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold transition-transform hover:scale-125">
          🏥
        </div>
      `;

      const hospitalIcon = L.divIcon({
        className: 'custom-hospital-marker',
        html: hospitalHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const popupContent = `
        <div class="p-2 min-w-[200px] text-xs font-sans">
          <div class="font-bold text-slate-900 text-sm flex items-center justify-between">
            <span>${h.name}</span>
          </div>
          <p class="text-slate-500 text-[11px] mb-2">${h.address || ''}</p>
          
          <div class="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-lg mb-2 text-[11px]">
            <div><span class="text-slate-500">ICU:</span> <strong class="text-blue-700">${h.icu_available} avail</strong></div>
            <div><span class="text-slate-500">Vents:</span> <strong class="text-cyan-700">${h.ventilator_available} ready</strong></div>
            <div><span class="text-slate-500">Distance:</span> <strong>${h.distance_km} km</strong></div>
            <div><span class="text-slate-500">ETA:</span> <strong class="text-rose-600">~${h.estimated_travel_min} min</strong></div>
          </div>

          <div class="text-[11px] font-semibold text-healthcare-700 mb-2">
            Match Score: ${h.suitability_score}%
          </div>

          <button 
            id="popup-btn-${h.hospital_id || h.id}" 
            class="w-full py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-sm transition text-center"
          >
            Select This Hospital
          </button>
        </div>
      `;

      const marker = L.marker(hospitalLatLng, { icon: hospitalIcon })
        .bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${h.hospital_id || h.id}`);
        if (btn && onSelectHospital) {
          btn.onclick = () => {
            onSelectHospital(h);
            marker.closePopup();
          };
        }
      });

      markersLayerRef.current.addLayer(marker);
    });

    // 3. Draw Simulated Route If Hospital Is Selected
    if (selectedHospital && patientLocation) {
      const start = [patientLocation.lat, patientLocation.lng];
      const end = [selectedHospital.latitude, selectedHospital.longitude];

      // Realistic curved route waypoints via intermediate jitter points
      const midLat = (start[0] + end[0]) / 2 + (Math.random() - 0.5) * 0.005;
      const midLng = (start[1] + end[1]) / 2 + (Math.random() - 0.5) * 0.005;

      const routePoints = [start, [midLat, midLng], end];

      // Draw pulsating line
      const polyline = L.polyline(routePoints, {
        color: '#dc2626',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
        lineCap: 'round',
      });
      routeLayerRef.current.addLayer(polyline);

      // Add route midpoint badge
      const midIcon = L.divIcon({
        className: 'route-badge',
        html: `
          <div class="bg-slate-900 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-md whitespace-nowrap border border-slate-700">
            ${selectedHospital.distance_km} km • ~${selectedHospital.estimated_travel_min} min
          </div>
        `,
        iconAnchor: [45, 10],
      });
      const midMarker = L.marker([midLat, midLng], { icon: midIcon });
      routeLayerRef.current.addLayer(midMarker);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [patientLocation, hospitals, selectedHospital, onSelectHospital]);

  return (
    <div className="w-full relative rounded-2xl overflow-hidden shadow-sm border border-slate-200">
      <div ref={mapContainerRef} style={{ height }} />
      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-md border border-slate-200 text-[11px] flex items-center gap-3">
        <span className="flex items-center gap-1 font-semibold text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span> Patient
        </span>
        <span className="flex items-center gap-1 font-semibold text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span> High Fit
        </span>
        <span className="flex items-center gap-1 font-semibold text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-healthcare-600 inline-block"></span> Hospital
        </span>
        <span className="flex items-center gap-1 font-semibold text-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Busy
        </span>
      </div>
    </div>
  );
}
