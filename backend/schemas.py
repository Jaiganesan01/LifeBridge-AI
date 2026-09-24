import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# --- Hospital Schemas ---

class SpecialistBase(BaseModel):
    name: str
    specialty: str
    is_available: bool
    on_duty: bool

class SpecialistResponse(SpecialistBase):
    id: int
    hospital_id: str

    class Config:
        from_attributes = True


class BloodStockBase(BaseModel):
    blood_group: str
    units_available: int
    status: str

class BloodStockResponse(BloodStockBase):
    id: int
    hospital_id: str

    class Config:
        from_attributes = True


class ResourceHistoryResponse(BaseModel):
    id: int
    hospital_id: str
    timestamp: datetime.datetime
    icu_available: int
    beds_available: int
    ventilator_available: int
    emergency_load: int

    class Config:
        from_attributes = True


class HospitalBase(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    phone: Optional[str] = "+1 (555) 019-2831"
    trauma_level: Optional[str] = "Level 1 Trauma Center"
    icu_total: int = 20
    icu_available: int = 4
    beds_total: int = 100
    beds_available: int = 28
    ventilator_total: int = 10
    ventilator_available: int = 2
    emergency_status: str = "Available"
    emergency_load: int = 65


class HospitalResponse(HospitalBase):
    id: str
    blood_stock_json: Optional[str] = "{}"
    specialists_json: Optional[str] = "[]"
    last_updated: datetime.datetime

    class Config:
        from_attributes = True


class HospitalDetailResponse(HospitalResponse):
    specialists: List[SpecialistResponse] = []
    blood_stocks: List[BloodStockResponse] = []
    recent_history: List[ResourceHistoryResponse] = []


class ResourceUpdateRequest(BaseModel):
    icu_available: Optional[int] = None
    beds_available: Optional[int] = None
    ventilator_available: Optional[int] = None
    emergency_load: Optional[int] = None
    emergency_status: Optional[str] = None


# --- AI & Emergency Analysis Schemas ---

class EmergencyAnalyzeRequest(BaseModel):
    description: str
    emergency_type: Optional[str] = None
    blood_group: Optional[str] = None
    specialist: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    latitude: Optional[float] = 28.6139
    longitude: Optional[float] = 77.2090


class EmergencyAnalyzeResponse(BaseModel):
    emergency_type: str
    priority: str  # LOW, MODERATE, HIGH, CRITICAL
    priority_color: str  # green, yellow, orange, red
    severity_score: int  # 0-100
    required_resources: List[str]
    required_specialist: str
    icu_required: bool
    icu_reason: str
    ventilator_required: bool
    ventilator_reason: str
    blood_required: bool
    blood_group: Optional[str] = None
    detected_keywords: List[str]
    confidence_score: float = 0.94
    decision_support_notice: str = "AI-generated emergency requirement assessment — decision support only."


# --- Hospital Recommendation Schemas ---

class ScoreBreakdown(BaseModel):
    resource_match: float
    emergency_capability: float
    travel_time: float
    icu_availability: float
    specialist_match: float
    current_load: float


class HospitalRecommendation(BaseModel):
    hospital_id: str
    name: str
    address: str
    phone: str
    trauma_level: str
    latitude: float
    longitude: float
    distance_km: float
    estimated_travel_min: int
    suitability_score: float  # 0-100
    icu_available: int
    icu_total: int
    beds_available: int
    beds_total: int
    ventilator_available: int
    ventilator_total: int
    emergency_status: str
    emergency_load: int
    blood_stock: Dict[str, Any]
    specialists: List[str]
    required_blood_available: bool
    specialist_available: bool
    emergency_dept_available: bool
    match_reasons: List[str]
    limitations: List[str]
    score_breakdown: ScoreBreakdown
    last_updated: datetime.datetime


# --- Emergency Case Lifecycle Schemas ---

class EmergencyCreateRequest(BaseModel):
    patient_name: str
    patient_age: int
    patient_gender: str
    location_name: str = "Demo Location"
    latitude: float = 28.6139
    longitude: float = 77.2090
    emergency_type: str
    description: str
    priority: str = "HIGH"
    severity_score: int = 75
    required_resources: List[str] = []
    required_blood: Optional[str] = None
    required_specialist: Optional[str] = None
    ai_analysis_summary: Optional[str] = None
    selected_hospital_id: Optional[str] = None


class EmergencyResponse(BaseModel):
    id: str
    patient_name: str
    patient_age: int
    patient_gender: str
    location_name: str
    latitude: float
    longitude: float
    emergency_type: str
    description: str
    priority: str
    severity_score: int
    required_resources: str  # JSON list string
    required_blood: Optional[str]
    required_specialist: Optional[str]
    ai_analysis_summary: Optional[str]
    status: str
    selected_hospital_id: Optional[str]
    distance_km: Optional[float]
    estimated_travel_min: Optional[int]
    reserved_icu: int
    reserved_beds: int
    reserved_ventilator: int
    reserved_blood: Optional[str]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


class SelectHospitalRequest(BaseModel):
    hospital_id: str
    distance_km: Optional[float] = None
    estimated_travel_min: Optional[int] = None


class EmergencyStatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None


# --- Simulator & Analytics Schemas ---

class WhatIfSimulationRequest(BaseModel):
    emergency_description: str
    patient_lat: float = 28.6139
    patient_lng: float = 77.2090
    icu_override: Optional[int] = None
    ventilator_override: Optional[int] = None
    emergency_load_override: Optional[int] = None
    travel_time_factor: float = 1.0  # multiplier for traffic
    blood_group: Optional[str] = "O+"
    specialist: Optional[str] = "Trauma Surgeon"
    weights: Optional[Dict[str, float]] = None


class AnalyticsAlert(BaseModel):
    id: str
    hospital_name: str
    type: str  # ICU_LOW, VENTILATOR_LOW, EMERGENCY_OVERLOAD, BLOOD_CRITICAL
    message: str
    severity: str  # warning, critical
    timestamp: datetime.datetime


class AnalyticsResponse(BaseModel):
    emergencies_today: int
    active_cases: int
    hospitals_online: int
    icu_total: int
    icu_available: int
    icu_utilization_pct: float
    ventilator_total: int
    ventilator_available: int
    ventilator_utilization_pct: float
    beds_total: int
    beds_available: int
    beds_utilization_pct: float
    avg_response_time_min: float
    most_requested_resources: Dict[str, int]
    hospital_loads: List[Dict[str, Any]]
    active_alerts: List[AnalyticsAlert]


# --- Voice NLP Triage Schemas ---

class VoiceTriageRequest(BaseModel):
    transcript: str

class VoiceTriageResponse(BaseModel):
    transcript: str
    extracted_name: Optional[str] = None
    extracted_age: Optional[int] = None
    extracted_gender: Optional[str] = None
    extracted_location: Optional[str] = None
    extracted_blood: Optional[str] = None
    analysis: EmergencyAnalyzeResponse

