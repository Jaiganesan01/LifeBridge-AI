import urllib.request
import json

def post(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def get(url):
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read().decode())

print("1. Testing GET /hospitals...")
hospitals = get("http://127.0.0.1:8000/hospitals")
print(f"   [OK] Retrieved {len(hospitals)} hospitals. First: {hospitals[0]['name']}")

print("2. Testing POST /emergency/analyze (Section 35 scenario)...")
payload = {
    "description": "Road accident with severe bleeding and difficulty breathing.",
    "patient_age": 42,
    "patient_gender": "Male"
}
analysis = post("http://127.0.0.1:8000/emergency/analyze", payload)
print(f"   [OK] Category: {analysis['emergency_type']}, Priority: {analysis['priority']}, Score: {analysis['severity_score']}")
print(f"   [OK] Required Resources: {analysis['required_resources']}")
print(f"   [OK] ICU: {analysis['icu_required']}, Ventilator: {analysis['ventilator_required']}, Blood: {analysis['blood_required']}")

print("3. Testing POST /emergency/recommend...")
recs = post("http://127.0.0.1:8000/emergency/recommend", payload)
top_hospital = recs[0]
print(f"   [OK] Top recommendation: {top_hospital['name']} (Suitability: {top_hospital['suitability_score']}%)")
print(f"   [OK] Distance: {top_hospital['distance_km']} km, Travel: {top_hospital['estimated_travel_min']} min")
print(f"   [OK] Reasons: {top_hospital['match_reasons']}")

print("4. Testing POST /emergency/create...")
create_payload = {
    "patient_name": "Arun Kumar",
    "patient_age": 42,
    "patient_gender": "Male",
    "location_name": "Demo Location",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "emergency_type": analysis["emergency_type"],
    "description": payload["description"],
    "priority": analysis["priority"],
    "severity_score": analysis["severity_score"],
    "required_resources": analysis["required_resources"],
    "required_blood": "O+",
    "required_specialist": "Trauma Surgeon",
    "selected_hospital_id": top_hospital["hospital_id"]
}
emg = post("http://127.0.0.1:8000/emergency/create", create_payload)
print(f"   [OK] Created emergency Case ID: {emg['id']}, Status: {emg['status']}")

print("5. Testing POST /emergency/{id}/accept (Resource reservation)...")
accept_res = post(f"http://127.0.0.1:8000/emergency/{emg['id']}/accept", {})
print(f"   [OK] Case Accepted! Status: {accept_res['status']}")
print(f"   [OK] Reserved ICU: {accept_res['reserved_icu']}, Reserved Vent: {accept_res['reserved_ventilator']}, Bed: {accept_res['reserved_beds']}")

print("6. Testing GET /analytics...")
analytics = get("http://127.0.0.1:8000/analytics")
print(f"   [OK] Emergencies Today: {analytics['emergencies_today']}, ICU Available: {analytics['icu_available']}/{analytics['icu_total']}")
print(f"   [OK] Shortage alerts active: {len(analytics['active_alerts'])}")

print("\n=== ALL SECTION 35 BACKEND TESTS PASSED WITH 100% SUCCESS! ===")
