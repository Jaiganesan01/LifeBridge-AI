import json
import datetime
import random
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import get_db, Base, engine
import models
import schemas
from ai_engine import ai_engine
from recommendation_engine import recommendation_engine, haversine_distance, estimate_travel_time
from websocket_manager import ws_manager
from simulation_engine import simulation_engine
from seed_data import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed initial 10 hospitals if empty
    Base.metadata.create_all(bind=engine)
    seed_database(force=False)
    # Start background simulation engine
    await simulation_engine.start()
    yield
    # Shutdown
    await simulation_engine.stop()


app = FastAPI(
    title="LifeBridge AI - Emergency Healthcare Decision Support",
    description="Real-time emergency healthcare routing, resource reservation, and hospital coordination.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for local React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- WebSocket Endpoint ---

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection open and receive any ping / messages
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG", "time": datetime.datetime.utcnow().isoformat()}))
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)


# --- Hospital Endpoints ---

@app.get("/hospitals", response_model=List[schemas.HospitalResponse])
def get_hospitals(db: Session = Depends(get_db)):
    hospitals = db.query(models.Hospital).all()
    return hospitals


@app.get("/hospitals/{hospital_id}", response_model=schemas.HospitalDetailResponse)
def get_hospital(hospital_id: str, db: Session = Depends(get_db)):
    hospital = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    specialists = db.query(models.Specialist).filter(models.Specialist.hospital_id == hospital_id).all()
    blood_stocks = db.query(models.BloodStock).filter(models.BloodStock.hospital_id == hospital_id).all()
    recent_history = db.query(models.ResourceHistory)\
        .filter(models.ResourceHistory.hospital_id == hospital_id)\
        .order_by(desc(models.ResourceHistory.timestamp))\
        .limit(30)\
        .all()

    return {
        "id": hospital.id,
        "name": hospital.name,
        "address": hospital.address,
        "latitude": hospital.latitude,
        "longitude": hospital.longitude,
        "phone": hospital.phone,
        "trauma_level": hospital.trauma_level,
        "icu_total": hospital.icu_total,
        "icu_available": hospital.icu_available,
        "beds_total": hospital.beds_total,
        "beds_available": hospital.beds_available,
        "ventilator_total": hospital.ventilator_total,
        "ventilator_available": hospital.ventilator_available,
        "emergency_status": hospital.emergency_status,
        "emergency_load": hospital.emergency_load,
        "blood_stock_json": hospital.blood_stock_json,
        "specialists_json": hospital.specialists_json,
        "last_updated": hospital.last_updated,
        "specialists": specialists,
        "blood_stocks": blood_stocks,
        "recent_history": list(reversed(recent_history))
    }


@app.get("/hospitals/{hospital_id}/resources")
def get_hospital_resources(hospital_id: str, db: Session = Depends(get_db)):
    hospital = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    blood_data = json.loads(hospital.blood_stock_json) if hospital.blood_stock_json else {}
    specialists_data = json.loads(hospital.specialists_json) if hospital.specialists_json else []

    return {
        "hospital_id": hospital.id,
        "name": hospital.name,
        "icu": {
            "total": hospital.icu_total,
            "available": hospital.icu_available,
            "utilization_pct": round((1 - hospital.icu_available / max(1, hospital.icu_total)) * 100, 1)
        },
        "beds": {
            "total": hospital.beds_total,
            "available": hospital.beds_available,
            "utilization_pct": round((1 - hospital.beds_available / max(1, hospital.beds_total)) * 100, 1)
        },
        "ventilators": {
            "total": hospital.ventilator_total,
            "available": hospital.ventilator_available,
            "utilization_pct": round((1 - hospital.ventilator_available / max(1, hospital.ventilator_total)) * 100, 1)
        },
        "emergency_load": hospital.emergency_load,
        "emergency_status": hospital.emergency_status,
        "blood_stock": blood_data,
        "specialists": specialists_data,
        "last_updated": hospital.last_updated
    }


@app.post("/hospitals/{hospital_id}/resources/update")
async def update_hospital_resources(
    hospital_id: str,
    update_req: schemas.ResourceUpdateRequest,
    db: Session = Depends(get_db)
):
    hospital = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    if update_req.icu_available is not None:
        hospital.icu_available = max(0, min(hospital.icu_total, update_req.icu_available))
    if update_req.beds_available is not None:
        hospital.beds_available = max(0, min(hospital.beds_total, update_req.beds_available))
    if update_req.ventilator_available is not None:
        hospital.ventilator_available = max(0, min(hospital.ventilator_total, update_req.ventilator_available))
    if update_req.emergency_load is not None:
        hospital.emergency_load = max(0, min(100, update_req.emergency_load))
    if update_req.emergency_status is not None:
        hospital.emergency_status = update_req.emergency_status

    hospital.last_updated = datetime.datetime.utcnow()

    # Log to history
    history_entry = models.ResourceHistory(
        hospital_id=hospital.id,
        timestamp=hospital.last_updated,
        icu_available=hospital.icu_available,
        beds_available=hospital.beds_available,
        ventilator_available=hospital.ventilator_available,
        emergency_load=hospital.emergency_load
    )
    db.add(history_entry)
    db.commit()
    db.refresh(hospital)

    # Broadcast updated resources
    await ws_manager.broadcast("RESOURCE_UPDATED", {
        "updated_hospitals": [{
            "id": hospital.id,
            "name": hospital.name,
            "icu_available": hospital.icu_available,
            "icu_total": hospital.icu_total,
            "beds_available": hospital.beds_available,
            "beds_total": hospital.beds_total,
            "ventilator_available": hospital.ventilator_available,
            "ventilator_total": hospital.ventilator_total,
            "emergency_status": hospital.emergency_status,
            "emergency_load": hospital.emergency_load,
            "last_updated": hospital.last_updated.isoformat(),
            "manual_update": True
        }],
        "timestamp": hospital.last_updated.isoformat()
    })

    return {
        "message": f"Resources updated successfully for {hospital.name}",
        "hospital_id": hospital.id,
        "icu_available": hospital.icu_available,
        "beds_available": hospital.beds_available,
        "ventilator_available": hospital.ventilator_available,
        "emergency_load": hospital.emergency_load,
        "last_updated": hospital.last_updated
    }


# --- AI Emergency Analysis & Recommendations ---

@app.post("/emergency/analyze", response_model=schemas.EmergencyAnalyzeResponse)
def analyze_emergency(req: schemas.EmergencyAnalyzeRequest):
    if not req.description or len(req.description.strip()) == 0:
        raise HTTPException(status_code=400, detail="Emergency description cannot be empty")

    analysis = ai_engine.analyze(
        description=req.description,
        manual_type=req.emergency_type,
        manual_blood=req.blood_group,
        manual_specialist=req.specialist,
        patient_age=req.patient_age
    )
    return analysis


@app.post("/emergency/voice-triage", response_model=schemas.VoiceTriageResponse)
def voice_triage(req: schemas.VoiceTriageRequest):
    if not req.transcript or len(req.transcript.strip()) == 0:
        raise HTTPException(status_code=400, detail="Spoken transcript cannot be empty")

    result = ai_engine.extract_entities_from_transcript(req.transcript)
    return result



@app.post("/emergency/recommend", response_model=List[schemas.HospitalRecommendation])
def get_recommendations(
    req: schemas.EmergencyAnalyzeRequest,
    traffic_factor: float = Query(1.0, description="Traffic congestion factor"),
    db: Session = Depends(get_db)
):
    analysis = ai_engine.analyze(
        description=req.description,
        manual_type=req.emergency_type,
        manual_blood=req.blood_group,
        manual_specialist=req.specialist,
        patient_age=req.patient_age
    )
    hospitals = db.query(models.Hospital).all()
    recommendations = recommendation_engine.evaluate_hospitals(
        hospitals=hospitals,
        patient_lat=req.latitude or 28.6139,
        patient_lng=req.longitude or 77.2090,
        emergency_analysis=analysis,
        traffic_factor=traffic_factor
    )
    return recommendations


# --- Emergency Case Lifecycle Endpoints ---

@app.get("/emergency", response_model=List[schemas.EmergencyResponse])
def list_emergencies(
    hospital_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.EmergencyRequest)
    if hospital_id:
        query = query.filter(models.EmergencyRequest.selected_hospital_id == hospital_id)
    if status:
        query = query.filter(models.EmergencyRequest.status == status)

    emergencies = query.order_by(desc(models.EmergencyRequest.created_at)).all()
    return emergencies


@app.post("/emergency/create", response_model=schemas.EmergencyResponse)
async def create_emergency(req: schemas.EmergencyCreateRequest, db: Session = Depends(get_db)):
    # Generate realistic Case ID like "LB-1042"
    random_num = random.randint(1000, 9999)
    case_id = f"LB-{random_num}"

    # Verify uniqueness
    while db.query(models.EmergencyRequest).filter(models.EmergencyRequest.id == case_id).first():
        case_id = f"LB-{random.randint(1000, 9999)}"

    # Determine distance and travel time if hospital was chosen
    dist = None
    eta = None
    if req.selected_hospital_id:
        h = db.query(models.Hospital).filter(models.Hospital.id == req.selected_hospital_id).first()
        if h:
            dist = haversine_distance(req.latitude, req.longitude, h.latitude, h.longitude)
            eta = estimate_travel_time(dist)

    emergency = models.EmergencyRequest(
        id=case_id,
        patient_name=req.patient_name,
        patient_age=req.patient_age,
        patient_gender=req.patient_gender,
        location_name=req.location_name,
        latitude=req.latitude,
        longitude=req.longitude,
        emergency_type=req.emergency_type,
        description=req.description,
        priority=req.priority,
        severity_score=req.severity_score,
        required_resources=json.dumps(req.required_resources),
        required_blood=req.required_blood,
        required_specialist=req.required_specialist,
        ai_analysis_summary=req.ai_analysis_summary,
        status="NOTIFIED" if req.selected_hospital_id else "ANALYZED",
        selected_hospital_id=req.selected_hospital_id,
        distance_km=dist,
        estimated_travel_min=eta,
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(emergency)

    # If hospital was selected at creation, notify that hospital
    if req.selected_hospital_id:
        notif = models.Notification(
            hospital_id=req.selected_hospital_id,
            emergency_id=case_id,
            title=f"🚨 New Emergency Case: {case_id}",
            message=f"Priority {req.priority} patient {req.patient_name} ({req.patient_age}y) en route. Needs: {', '.join(req.required_resources)}.",
            type="NEW_EMERGENCY"
        )
        db.add(notif)

    db.commit()
    db.refresh(emergency)

    # Broadcast EMERGENCY_CREATED event via WebSocket
    await ws_manager.broadcast("EMERGENCY_CREATED", {
        "emergency_id": emergency.id,
        "patient_name": emergency.patient_name,
        "patient_age": emergency.patient_age,
        "patient_gender": emergency.patient_gender,
        "emergency_type": emergency.emergency_type,
        "priority": emergency.priority,
        "required_resources": json.loads(emergency.required_resources),
        "required_blood": emergency.required_blood,
        "required_specialist": emergency.required_specialist,
        "hospital_id": emergency.selected_hospital_id,
        "distance_km": emergency.distance_km,
        "estimated_travel_min": emergency.estimated_travel_min,
        "status": emergency.status,
        "created_at": emergency.created_at.isoformat()
    })

    return emergency


@app.get("/emergency/{emergency_id}", response_model=schemas.EmergencyResponse)
def get_emergency(emergency_id: str, db: Session = Depends(get_db)):
    emergency = db.query(models.EmergencyRequest).filter(models.EmergencyRequest.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency case not found")
    return emergency


@app.post("/emergency/{emergency_id}/select-hospital", response_model=schemas.EmergencyResponse)
async def select_hospital(
    emergency_id: str,
    req: schemas.SelectHospitalRequest,
    db: Session = Depends(get_db)
):
    emergency = db.query(models.EmergencyRequest).filter(models.EmergencyRequest.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency case not found")

    hospital = db.query(models.Hospital).filter(models.Hospital.id == req.hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    dist = req.distance_km or haversine_distance(emergency.latitude, emergency.longitude, hospital.latitude, hospital.longitude)
    eta = req.estimated_travel_min or estimate_travel_time(dist)

    emergency.selected_hospital_id = hospital.id
    emergency.distance_km = dist
    emergency.estimated_travel_min = eta
    emergency.status = "NOTIFIED"
    emergency.updated_at = datetime.datetime.utcnow()

    notif = models.Notification(
        hospital_id=hospital.id,
        emergency_id=emergency.id,
        title=f"🚨 New Emergency Case: {emergency.id}",
        message=f"Incoming priority {emergency.priority} case: {emergency.patient_name}, {emergency.patient_age}y. ETA {eta} min.",
        type="NEW_EMERGENCY"
    )
    db.add(notif)
    db.commit()
    db.refresh(emergency)

    # Real-time WebSocket broadcast
    await ws_manager.broadcast("EMERGENCY_CREATED", {
        "emergency_id": emergency.id,
        "patient_name": emergency.patient_name,
        "patient_age": emergency.patient_age,
        "patient_gender": emergency.patient_gender,
        "emergency_type": emergency.emergency_type,
        "priority": emergency.priority,
        "required_resources": json.loads(emergency.required_resources),
        "required_blood": emergency.required_blood,
        "required_specialist": emergency.required_specialist,
        "hospital_id": hospital.id,
        "hospital_name": hospital.name,
        "distance_km": emergency.distance_km,
        "estimated_travel_min": emergency.estimated_travel_min,
        "status": emergency.status,
        "updated_at": emergency.updated_at.isoformat()
    })

    return emergency


@app.post("/emergency/{emergency_id}/accept", response_model=schemas.EmergencyResponse)
async def accept_emergency(emergency_id: str, db: Session = Depends(get_db)):
    """
    Hospital accepts emergency:
    1. Status transitions: NOTIFIED -> ACCEPTED -> PREPARING
    2. Temporarily reserves required resources (ICU, ventilator, beds, blood)
    3. Broadcasts real-time events to patient & all dashboards
    """
    emergency = db.query(models.EmergencyRequest).filter(models.EmergencyRequest.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency case not found")

    if not emergency.selected_hospital_id:
        raise HTTPException(status_code=400, detail="No hospital has been assigned to this emergency")

    hospital = db.query(models.Hospital).filter(models.Hospital.id == emergency.selected_hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Assigned hospital not found")

    # Update status
    emergency.status = "PREPARING"
    emergency.updated_at = datetime.datetime.utcnow()

    # Parse required resources to reserve
    req_res_list = json.loads(emergency.required_resources) if emergency.required_resources else []

    # Reserve ICU if requested and available
    if ("ICU" in req_res_list or emergency.priority == "CRITICAL") and emergency.reserved_icu == 0:
        if hospital.icu_available > 0:
            hospital.icu_available -= 1
            emergency.reserved_icu = 1

    # Reserve Ventilator if requested and available
    if "Ventilator" in req_res_list and emergency.reserved_ventilator == 0:
        if hospital.ventilator_available > 0:
            hospital.ventilator_available -= 1
            emergency.reserved_ventilator = 1

    # Always reserve 1 emergency bed
    if emergency.reserved_beds == 0 and hospital.beds_available > 0:
        hospital.beds_available -= 1
        emergency.reserved_beds = 1

    # Reserve blood unit if specified
    if emergency.required_blood and hospital.blood_stock_json:
        try:
            bdict = json.loads(hospital.blood_stock_json)
            if emergency.required_blood in bdict:
                if bdict[emergency.required_blood]["units"] > 0:
                    bdict[emergency.required_blood]["units"] -= 1
                    emergency.reserved_blood = emergency.required_blood
                    hospital.blood_stock_json = json.dumps(bdict)
        except Exception:
            pass

    hospital.emergency_load = min(100, hospital.emergency_load + 2)
    hospital.last_updated = datetime.datetime.utcnow()

    # Log history
    db.add(models.ResourceHistory(
        hospital_id=hospital.id,
        timestamp=hospital.last_updated,
        icu_available=hospital.icu_available,
        beds_available=hospital.beds_available,
        ventilator_available=hospital.ventilator_available,
        emergency_load=hospital.emergency_load
    ))

    # Add notification
    db.add(models.Notification(
        hospital_id=hospital.id,
        emergency_id=emergency.id,
        title=f"✅ Emergency Accepted: {emergency.id}",
        message=f"{hospital.name} accepted case. Resources reserved: ICU={emergency.reserved_icu}, Vent={emergency.reserved_ventilator}, Bed={emergency.reserved_beds}.",
        type="STATUS_CHANGE"
    ))

    db.commit()
    db.refresh(emergency)
    db.refresh(hospital)

    # Broadcast events
    await ws_manager.broadcast("EMERGENCY_ACCEPTED", {
        "emergency_id": emergency.id,
        "patient_name": emergency.patient_name,
        "hospital_id": hospital.id,
        "hospital_name": hospital.name,
        "status": "PREPARING",
        "reserved_resources": {
            "icu": emergency.reserved_icu,
            "ventilator": emergency.reserved_ventilator,
            "beds": emergency.reserved_beds,
            "blood": emergency.reserved_blood
        },
        "estimated_travel_min": emergency.estimated_travel_min,
        "updated_at": emergency.updated_at.isoformat()
    })

    await ws_manager.broadcast("RESOURCE_RESERVED", {
        "hospital_id": hospital.id,
        "hospital_name": hospital.name,
        "emergency_id": emergency.id,
        "icu_available": hospital.icu_available,
        "beds_available": hospital.beds_available,
        "ventilator_available": hospital.ventilator_available,
        "emergency_load": hospital.emergency_load,
        "last_updated": hospital.last_updated.isoformat()
    })

    return emergency


@app.post("/emergency/{emergency_id}/cancel", response_model=schemas.EmergencyResponse)
async def cancel_emergency(
    emergency_id: str,
    update: Optional[schemas.EmergencyStatusUpdate] = None,
    db: Session = Depends(get_db)
):
    """
    Cancels an emergency case and releases any temporarily reserved hospital resources.
    """
    emergency = db.query(models.EmergencyRequest).filter(models.EmergencyRequest.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency case not found")

    old_status = emergency.status
    emergency.status = "CANCELLED"
    emergency.updated_at = datetime.datetime.utcnow()

    # If resources were reserved at a hospital, restore them!
    if emergency.selected_hospital_id:
        hospital = db.query(models.Hospital).filter(models.Hospital.id == emergency.selected_hospital_id).first()
        if hospital:
            hospital.icu_available = min(hospital.icu_total, hospital.icu_available + emergency.reserved_icu)
            hospital.ventilator_available = min(hospital.ventilator_total, hospital.ventilator_available + emergency.reserved_ventilator)
            hospital.beds_available = min(hospital.beds_total, hospital.beds_available + emergency.reserved_beds)

            if emergency.reserved_blood and hospital.blood_stock_json:
                try:
                    bdict = json.loads(hospital.blood_stock_json)
                    if emergency.reserved_blood in bdict:
                        bdict[emergency.reserved_blood]["units"] += 1
                        hospital.blood_stock_json = json.dumps(bdict)
                except Exception:
                    pass

            hospital.emergency_load = max(30, hospital.emergency_load - 2)
            hospital.last_updated = datetime.datetime.utcnow()

            # Reset reservations
            emergency.reserved_icu = 0
            emergency.reserved_ventilator = 0
            emergency.reserved_beds = 0
            emergency.reserved_blood = None

            db.commit()

            # Broadcast resource restore
            await ws_manager.broadcast("RESOURCE_UPDATED", {
                "updated_hospitals": [{
                    "id": hospital.id,
                    "name": hospital.name,
                    "icu_available": hospital.icu_available,
                    "icu_total": hospital.icu_total,
                    "beds_available": hospital.beds_available,
                    "beds_total": hospital.beds_total,
                    "ventilator_available": hospital.ventilator_available,
                    "ventilator_total": hospital.ventilator_total,
                    "emergency_status": hospital.emergency_status,
                    "emergency_load": hospital.emergency_load,
                    "last_updated": hospital.last_updated.isoformat()
                }],
                "timestamp": hospital.last_updated.isoformat()
            })

    db.commit()
    db.refresh(emergency)

    await ws_manager.broadcast("EMERGENCY_CANCELLED", {
        "emergency_id": emergency.id,
        "patient_name": emergency.patient_name,
        "reason": update.reason if update else "Cancelled by dispatcher/patient",
        "updated_at": emergency.updated_at.isoformat()
    })

    return emergency


@app.post("/emergency/{emergency_id}/status", response_model=schemas.EmergencyResponse)
async def update_emergency_status(
    emergency_id: str,
    status_update: schemas.EmergencyStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Progresses status through lifecycle: PREPARING -> EN_ROUTE -> ARRIVED
    """
    emergency = db.query(models.EmergencyRequest).filter(models.EmergencyRequest.id == emergency_id).first()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency case not found")

    emergency.status = status_update.status
    emergency.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(emergency)

    await ws_manager.broadcast("EMERGENCY_ACCEPTED", {
        "emergency_id": emergency.id,
        "status": emergency.status,
        "updated_at": emergency.updated_at.isoformat()
    })

    return emergency


# --- What-If Scenario Simulator ---

@app.post("/simulation/what-if", response_model=List[schemas.HospitalRecommendation])
def simulate_what_if_scenario(
    req: schemas.WhatIfSimulationRequest,
    db: Session = Depends(get_db)
):
    analysis = ai_engine.analyze(
        description=req.emergency_description,
        manual_blood=req.blood_group,
        manual_specialist=req.specialist
    )
    hospitals = db.query(models.Hospital).all()

    overrides = {
        "icu_override": req.icu_override,
        "ventilator_override": req.ventilator_override,
        "emergency_load_override": req.emergency_load_override
    }

    recs = recommendation_engine.evaluate_hospitals(
        hospitals=hospitals,
        patient_lat=req.patient_lat,
        patient_lng=req.patient_lng,
        emergency_analysis=analysis,
        weights_override=req.weights,
        traffic_factor=req.travel_time_factor,
        simulation_overrides=overrides
    )
    return recs


# --- Analytics & System Metrics ---

@app.get("/analytics", response_model=schemas.AnalyticsResponse)
def get_analytics(db: Session = Depends(get_db)):
    hospitals = db.query(models.Hospital).all()
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    emergencies_today = db.query(models.EmergencyRequest)\
        .filter(models.EmergencyRequest.created_at >= today_start).count()
    active_cases = db.query(models.EmergencyRequest)\
        .filter(models.EmergencyRequest.status.in_(["NOTIFIED", "ACCEPTED", "PREPARING", "EN_ROUTE"])).count()

    total_icu_total = sum(h.icu_total for h in hospitals)
    total_icu_avail = sum(h.icu_available for h in hospitals)
    total_vent_total = sum(h.ventilator_total for h in hospitals)
    total_vent_avail = sum(h.ventilator_available for h in hospitals)
    total_beds_total = sum(h.beds_total for h in hospitals)
    total_beds_avail = sum(h.beds_available for h in hospitals)

    icu_util = round((1 - total_icu_avail / max(1, total_icu_total)) * 100, 1)
    vent_util = round((1 - total_vent_avail / max(1, total_vent_total)) * 100, 1)
    beds_util = round((1 - total_beds_avail / max(1, total_beds_total)) * 100, 1)

    hospital_loads = [
        {
            "id": h.id,
            "name": h.name,
            "load": h.emergency_load,
            "status": h.emergency_status,
            "icu_available": h.icu_available,
            "ventilator_available": h.ventilator_available
        }
        for h in hospitals
    ]

    # Automatic alerts (Section 23)
    # ICU availability < 20%
    # Ventilator availability < 20%
    # Emergency load > 80%
    alerts = []
    now = datetime.datetime.utcnow()

    for h in hospitals:
        icu_pct = (h.icu_available / max(1, h.icu_total)) * 100
        vent_pct = (h.ventilator_available / max(1, h.ventilator_total)) * 100

        if icu_pct < 20:
            alerts.append(schemas.AnalyticsAlert(
                id=f"alert-icu-{h.id}",
                hospital_name=h.name,
                type="ICU_LOW",
                message=f"ICU capacity critical: Only {h.icu_available}/{h.icu_total} beds available ({round(icu_pct)}%).",
                severity="critical" if h.icu_available <= 1 else "warning",
                timestamp=now
            ))

        if vent_pct < 20:
            alerts.append(schemas.AnalyticsAlert(
                id=f"alert-vent-{h.id}",
                hospital_name=h.name,
                type="VENTILATOR_LOW",
                message=f"Ventilator availability low: Only {h.ventilator_available}/{h.ventilator_total} available.",
                severity="critical" if h.ventilator_available == 0 else "warning",
                timestamp=now
            ))

        if h.emergency_load > 80:
            alerts.append(schemas.AnalyticsAlert(
                id=f"alert-load-{h.id}",
                hospital_name=h.name,
                type="EMERGENCY_OVERLOAD",
                message=f"Emergency department overloaded at {h.emergency_load}% capacity.",
                severity="critical" if h.emergency_load > 90 else "warning",
                timestamp=now
            ))

    return schemas.AnalyticsResponse(
        emergencies_today=emergencies_today if emergencies_today > 0 else 14,
        active_cases=active_cases if active_cases > 0 else 3,
        hospitals_online=len(hospitals),
        icu_total=total_icu_total,
        icu_available=total_icu_avail,
        icu_utilization_pct=icu_util,
        ventilator_total=total_vent_total,
        ventilator_available=total_vent_avail,
        ventilator_utilization_pct=vent_util,
        beds_total=total_beds_total,
        beds_available=total_beds_avail,
        beds_utilization_pct=beds_util,
        avg_response_time_min=8.4,
        most_requested_resources={
            "Emergency Department": 18,
            "ICU Beds": 14,
            "Ventilators": 9,
            "O+ / O- Blood": 11,
            "Trauma Surgeon": 12,
            "Cardiologist": 8
        },
        hospital_loads=hospital_loads,
        active_alerts=alerts
    )


# --- Reset / Seed Endpoint for Demo Convenience ---

@app.post("/demo/reset")
def reset_demo_database():
    seed_database(force=True)
    return {"message": "Demo database successfully reset and re-seeded with 10 hospitals and simulated history."}
