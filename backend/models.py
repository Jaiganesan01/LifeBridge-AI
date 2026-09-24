import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    phone = Column(String(50), default="+1 (555) 019-2831")
    trauma_level = Column(String(50), default="Level 1 Trauma Center")

    # Resource counts
    icu_total = Column(Integer, default=20)
    icu_available = Column(Integer, default=4)

    beds_total = Column(Integer, default=100)
    beds_available = Column(Integer, default=28)

    ventilator_total = Column(Integer, default=10)
    ventilator_available = Column(Integer, default=2)

    emergency_status = Column(String(50), default="Available")  # Available, Busy, Divert/Critical
    emergency_load = Column(Integer, default=65)  # Percentage 0-100

    # JSON representation for quick querying / response
    blood_stock_json = Column(Text, default="{}")
    specialists_json = Column(Text, default="[]")

    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    specialists = relationship("Specialist", back_populates="hospital", cascade="all, delete-orphan")
    blood_stocks = relationship("BloodStock", back_populates="hospital", cascade="all, delete-orphan")
    history = relationship("ResourceHistory", back_populates="hospital", cascade="all, delete-orphan")
    emergency_requests = relationship("EmergencyRequest", back_populates="hospital")


class Specialist(Base):
    __tablename__ = "specialists"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hospital_id = Column(String(50), ForeignKey("hospitals.id"), nullable=False)
    name = Column(String(100), nullable=False)
    specialty = Column(String(100), nullable=False)  # Trauma Surgeon, Cardiologist, Neurologist, Pulmonologist, etc.
    is_available = Column(Boolean, default=True)
    on_duty = Column(Boolean, default=True)

    hospital = relationship("Hospital", back_populates="specialists")


class BloodStock(Base):
    __tablename__ = "blood_stock"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hospital_id = Column(String(50), ForeignKey("hospitals.id"), nullable=False)
    blood_group = Column(String(10), nullable=False)  # O+, A+, B+, AB+, O-, A-, B-, AB-
    units_available = Column(Integer, default=10)
    status = Column(String(30), default="Adequate")  # Adequate, Low, Critical

    hospital = relationship("Hospital", back_populates="blood_stocks")


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(String(50), primary_key=True, index=True)  # e.g., "LB-1042"
    patient_name = Column(String(100), nullable=False)
    patient_age = Column(Integer, nullable=False)
    patient_gender = Column(String(20), default="Unknown")
    location_name = Column(String(150), default="Demo Location")
    latitude = Column(Float, default=28.6139)
    longitude = Column(Float, default=77.2090)

    emergency_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(30), default="HIGH")  # LOW, MODERATE, HIGH, CRITICAL
    severity_score = Column(Integer, default=75)

    required_resources = Column(Text, default="[]")  # JSON list: ["ICU", "Ventilator", "Blood"]
    required_blood = Column(String(10), nullable=True)
    required_specialist = Column(String(100), nullable=True)
    ai_analysis_summary = Column(Text, nullable=True)

    # Lifecycle:
    # ANALYZED -> HOSPITAL_SELECTED -> NOTIFIED -> ACCEPTED -> PREPARING -> EN_ROUTE -> ARRIVED -> CANCELLED
    status = Column(String(50), default="ANALYZED")

    selected_hospital_id = Column(String(50), ForeignKey("hospitals.id"), nullable=True)
    distance_km = Column(Float, nullable=True)
    estimated_travel_min = Column(Integer, nullable=True)

    # Reserved resources upon acceptance
    reserved_icu = Column(Integer, default=0)
    reserved_beds = Column(Integer, default=0)
    reserved_ventilator = Column(Integer, default=0)
    reserved_blood = Column(String(10), nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    hospital = relationship("Hospital", back_populates="emergency_requests")


class ResourceHistory(Base):
    __tablename__ = "resource_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hospital_id = Column(String(50), ForeignKey("hospitals.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    icu_available = Column(Integer, nullable=False)
    beds_available = Column(Integer, nullable=False)
    ventilator_available = Column(Integer, nullable=False)
    emergency_load = Column(Integer, nullable=False)

    hospital = relationship("Hospital", back_populates="history")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hospital_id = Column(String(50), nullable=True)
    emergency_id = Column(String(50), nullable=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="ALERT")  # ALERT, NEW_EMERGENCY, STATUS_CHANGE
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
