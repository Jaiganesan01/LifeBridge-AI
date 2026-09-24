import math
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from schemas import HospitalRecommendation, ScoreBreakdown


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on the earth in km.
    """
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


def estimate_travel_time(distance_km: float, traffic_factor: float = 1.0) -> int:
    """
    Estimate ambulance travel time in minutes based on distance and traffic conditions.
    Assumes average ambulance transit speed of 35-42 km/h in urban corridors + 2 min prep buffer.
    """
    if distance_km <= 0.1:
        return 2
    avg_speed_kmh = 38.0 / max(0.5, traffic_factor)
    travel_hours = distance_km / avg_speed_kmh
    travel_minutes = math.ceil(travel_hours * 60) + 2  # 2 min dispatch buffer
    return max(3, travel_minutes)


class RecommendationEngine:
    DEFAULT_WEIGHTS = {
        "resource_match": 0.35,
        "emergency_capability": 0.20,
        "travel_time": 0.20,
        "icu_availability": 0.10,
        "specialist_match": 0.10,
        "current_load": 0.05
    }

    def evaluate_hospitals(
        self,
        hospitals: List[Any],
        patient_lat: float,
        patient_lng: float,
        emergency_analysis: Dict[str, Any],
        weights_override: Optional[Dict[str, float]] = None,
        traffic_factor: float = 1.0,
        simulation_overrides: Optional[Dict[str, Any]] = None
    ) -> List[HospitalRecommendation]:
        weights = weights_override or self.DEFAULT_WEIGHTS

        req_resources = emergency_analysis.get("required_resources", [])
        req_blood = emergency_analysis.get("blood_group") or "O+"
        req_specialist = emergency_analysis.get("required_specialist") or "Trauma Surgeon"
        is_icu_required = emergency_analysis.get("icu_required", False)
        is_vent_required = emergency_analysis.get("ventilator_required", False)
        is_blood_required = emergency_analysis.get("blood_required", False)

        recommendations: List[HospitalRecommendation] = []

        for h in hospitals:
            # Parse blood stock JSON or relationship
            blood_data = {}
            if hasattr(h, "blood_stock_json") and h.blood_stock_json:
                try:
                    blood_data = json.loads(h.blood_stock_json)
                except Exception:
                    blood_data = {}

            # Parse specialists JSON or relationship
            specialists_list = []
            if hasattr(h, "specialists_json") and h.specialists_json:
                try:
                    specialists_list = json.loads(h.specialists_json)
                except Exception:
                    specialists_list = []

            # Dynamic simulation overrides if provided
            sim_icu = h.icu_available
            sim_vent = h.ventilator_available
            sim_load = h.emergency_load

            if simulation_overrides:
                if simulation_overrides.get("icu_override") is not None:
                    sim_icu = simulation_overrides["icu_override"]
                if simulation_overrides.get("ventilator_override") is not None:
                    sim_vent = simulation_overrides["ventilator_override"]
                if simulation_overrides.get("emergency_load_override") is not None:
                    sim_load = simulation_overrides["emergency_load_override"]

            # Distance & Travel Time
            distance_km = haversine_distance(patient_lat, patient_lng, h.latitude, h.longitude)
            travel_time_min = estimate_travel_time(distance_km, traffic_factor)

            # 1. Resource Match Score (0 - 100)
            res_score = 100.0
            match_reasons = []
            limitations = []

            # ICU check
            if is_icu_required:
                if sim_icu <= 0:
                    res_score -= 40.0
                    limitations.append("No ICU beds currently available (0 beds).")
                elif sim_icu <= 2:
                    res_score -= 10.0
                    limitations.append(f"Critical ICU bed shortage (only {sim_icu} remaining).")
                else:
                    match_reasons.append(f"Confirmed ICU capacity available ({sim_icu} beds open).")

            # Ventilator check
            if is_vent_required:
                if sim_vent <= 0:
                    res_score -= 35.0
                    limitations.append("No mechanical ventilators available.")
                elif sim_vent <= 1:
                    res_score -= 8.0
                    limitations.append(f"Ventilator supply tight (only {sim_vent} ready).")
                else:
                    match_reasons.append(f"Ventilators on standby ({sim_vent} available).")

            # Blood check
            has_blood = False
            blood_units = 0
            if req_blood in blood_data:
                blood_units = blood_data[req_blood].get("units", 0) if isinstance(blood_data[req_blood], dict) else blood_data[req_blood]
                has_blood = blood_units > 2

            if is_blood_required:
                if not has_blood:
                    res_score -= 25.0
                    limitations.append(f"Low or depleted {req_blood} blood units ({blood_units} units in bank).")
                else:
                    match_reasons.append(f"Adequate stock of {req_blood} blood ({blood_units} units).")

            # Specialist check
            has_specialist = any(
                (req_specialist.lower() in s.get("specialty", "").lower() and s.get("is_available", True))
                for s in specialists_list
            ) if specialists_list else True

            if has_specialist:
                match_reasons.append(f"On-duty {req_specialist} ready for immediate emergency triage.")
            else:
                res_score -= 20.0
                limitations.append(f"{req_specialist} is currently on-call or not immediately on-duty.")

            res_score = max(5.0, min(100.0, res_score))

            # 2. Emergency Capability Score (0 - 100)
            status_lower = h.emergency_status.lower()
            if status_lower == "available":
                dept_score = 100.0
                dept_avail = True
                match_reasons.append("Emergency department fully operational and accepting code emergencies.")
            elif status_lower == "busy":
                dept_score = 70.0
                dept_avail = True
                limitations.append("Emergency department is currently busy.")
            else:
                dept_score = 25.0
                dept_avail = False
                limitations.append("Emergency department under critical divert/high load protocol.")

            # Trauma center bonus
            trauma_desc = getattr(h, "trauma_level", "Level 1 Trauma Center")
            if "Level 1" in trauma_desc:
                dept_score = min(100.0, dept_score + 5.0)
                match_reasons.append("Certified Level 1 Comprehensive Trauma Center.")

            # 3. Travel Time Score (0 - 100)
            # 5 min -> 95, 10 min -> 85, 20 min -> 65, 30 min -> 45, >40 min -> 20
            time_score = max(10.0, 100.0 - (travel_time_min * 1.8))
            if travel_time_min <= 10:
                match_reasons.append(f"Rapid proximity ({distance_km} km, ~{travel_time_min} mins transit).")
            else:
                limitations.append(f"Transit distance ({distance_km} km, ~{travel_time_min} mins travel).")

            # 4. ICU Availability Score (0 - 100)
            icu_ratio = (sim_icu / max(1, h.icu_total)) * 100.0
            icu_score = min(100.0, max(0.0, icu_ratio * 2.0))  # 50% available = 100 score

            # 5. Specialist Match Score (0 - 100)
            spec_score = 100.0 if has_specialist else 30.0

            # 6. Current Load Score (0 - 100)
            # Lower load is better: 30% load -> 70 score
            load_score = max(0.0, 100.0 - sim_load)
            if sim_load > 80:
                limitations.append(f"High emergency load ({sim_load}% capacity).")
            elif sim_load < 50:
                match_reasons.append(f"Optimal department capacity ({sim_load}% current load).")

            # Calculate Weighted Suitability Score
            breakdown = ScoreBreakdown(
                resource_match=round(res_score, 1),
                emergency_capability=round(dept_score, 1),
                travel_time=round(time_score, 1),
                icu_availability=round(icu_score, 1),
                specialist_match=round(spec_score, 1),
                current_load=round(load_score, 1)
            )

            total_score = (
                (weights["resource_match"] * res_score) +
                (weights["emergency_capability"] * dept_score) +
                (weights["travel_time"] * time_score) +
                (weights["icu_availability"] * icu_score) +
                (weights["specialist_match"] * spec_score) +
                (weights["current_load"] * load_score)
            )
            suitability_score = round(max(5.0, min(99.4, total_score)), 1)

            specialist_names = [s.get("specialty", "") for s in specialists_list]

            rec = HospitalRecommendation(
                hospital_id=h.id,
                name=h.name,
                address=h.address,
                phone=getattr(h, "phone", "+1 (555) 019-2831"),
                trauma_level=trauma_desc,
                latitude=h.latitude,
                longitude=h.longitude,
                distance_km=distance_km,
                estimated_travel_min=travel_time_min,
                suitability_score=suitability_score,
                icu_available=sim_icu,
                icu_total=h.icu_total,
                beds_available=h.beds_available,
                beds_total=h.beds_total,
                ventilator_available=sim_vent,
                ventilator_total=h.ventilator_total,
                emergency_status=h.emergency_status,
                emergency_load=sim_load,
                blood_stock=blood_data,
                specialists=specialist_names,
                required_blood_available=has_blood,
                specialist_available=has_specialist,
                emergency_dept_available=dept_avail,
                match_reasons=match_reasons[:4],
                limitations=limitations[:3],
                score_breakdown=breakdown,
                last_updated=h.last_updated or datetime.utcnow()
            )
            recommendations.append(rec)

        # Sort recommendations by suitability_score descending
        recommendations.sort(key=lambda x: x.suitability_score, reverse=True)
        return recommendations


recommendation_engine = RecommendationEngine()
