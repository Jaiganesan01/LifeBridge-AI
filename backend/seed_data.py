import json
import datetime
import random
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models

def seed_database(force: bool = False):
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        hospital_count = db.query(models.Hospital).count()
        if hospital_count >= 10 and not force:
            print(f"Database already contains {hospital_count} hospitals. Skipping seeding.")
            return

        print("Seeding database with realistic simulated hospital data...")
        # Clear existing data if force
        if force:
            db.query(models.Notification).delete()
            db.query(models.ResourceHistory).delete()
            db.query(models.EmergencyRequest).delete()
            db.query(models.BloodStock).delete()
            db.query(models.Specialist).delete()
            db.query(models.Hospital).delete()
            db.commit()

        # Center location: Delhi Central Hub (28.6139, 77.2090)
        hospitals_data = [
            {
                "id": "HOSP-01",
                "name": "Apollo Care Hospital",
                "address": "42 Ring Road, South Extension, New Delhi",
                "latitude": 28.6250,
                "longitude": 77.2150,
                "phone": "+91 11 4050 1000",
                "trauma_level": "Level 1 Comprehensive Trauma Center",
                "icu_total": 20,
                "icu_available": 4,
                "beds_total": 100,
                "beds_available": 28,
                "ventilator_total": 10,
                "ventilator_available": 2,
                "emergency_status": "Available",
                "emergency_load": 68,
                "specialists": [
                    {"name": "Dr. Rajesh Sharma", "specialty": "Trauma Surgeon", "is_available": True, "on_duty": True},
                    {"name": "Dr. Priya Nair", "specialty": "Cardiologist", "is_available": True, "on_duty": True},
                    {"name": "Dr. Vikram Seth", "specialty": "Neurologist", "is_available": True, "on_duty": True},
                    {"name": "Dr. Sunita Rao", "specialty": "Pulmonologist", "is_available": True, "on_duty": False},
                ],
                "blood": {
                    "O+": {"units": 14, "status": "Adequate"},
                    "O-": {"units": 5, "status": "Adequate"},
                    "A+": {"units": 18, "status": "Adequate"},
                    "A-": {"units": 4, "status": "Low"},
                    "B+": {"units": 16, "status": "Adequate"},
                    "B-": {"units": 3, "status": "Low"},
                    "AB+": {"units": 8, "status": "Adequate"},
                    "AB-": {"units": 2, "status": "Critical"},
                }
            },
            {
                "id": "HOSP-02",
                "name": "Metro Life Super Specialty Hospital",
                "address": "18 Barakhamba Road, Connaught Place, New Delhi",
                "latitude": 28.6320,
                "longitude": 77.2220,
                "phone": "+91 11 4120 2200",
                "trauma_level": "Level 1 Comprehensive Trauma Center",
                "icu_total": 24,
                "icu_available": 6,
                "beds_total": 120,
                "beds_available": 35,
                "ventilator_total": 12,
                "ventilator_available": 4,
                "emergency_status": "Available",
                "emergency_load": 58,
                "specialists": [
                    {"name": "Dr. Amit Roy", "specialty": "Trauma Surgeon", "is_available": True, "on_duty": True},
                    {"name": "Dr. Kavita Verma", "specialty": "Pulmonologist", "is_available": True, "on_duty": True},
                    {"name": "Dr. Sanjay Gupta", "specialty": "Cardiologist", "is_available": True, "on_duty": True},
                    {"name": "Dr. Meera Iyer", "specialty": "General Physician", "is_available": True, "on_duty": True},
                ],
                "blood": {
                    "O+": {"units": 20, "status": "Adequate"},
                    "O-": {"units": 6, "status": "Adequate"},
                    "A+": {"units": 15, "status": "Adequate"},
                    "A-": {"units": 6, "status": "Adequate"},
                    "B+": {"units": 19, "status": "Adequate"},
                    "B-": {"units": 4, "status": "Low"},
                    "AB+": {"units": 10, "status": "Adequate"},
                    "AB-": {"units": 3, "status": "Low"},
                }
            },
            {
                "id": "HOSP-03",
                "name": "City Emergency & Trauma Center",
                "address": "9 Hospital Marg, Daryaganj, New Delhi",
                "latitude": 28.6080,
                "longitude": 77.2010,
                "phone": "+91 11 2327 9000",
                "trauma_level": "Level 2 Emergency Trauma Unit",
                "icu_total": 16,
                "icu_available": 3,
                "beds_total": 80,
                "beds_available": 18,
                "ventilator_total": 8,
                "ventilator_available": 1,
                "emergency_status": "Available",
                "emergency_load": 72,
                "specialists": [
                    {"name": "Dr. Alok Verma", "specialty": "Trauma Surgeon", "is_available": True, "on_duty": True},
                    {"name": "Dr. Deepa Sen", "specialty": "General Physician", "is_available": True, "on_duty": True},
                    {"name": "Dr. Rohan Kapur", "specialty": "Orthopedic Surgeon", "is_available": True, "on_duty": True},
                ],
                "blood": {
                    "O+": {"units": 10, "status": "Adequate"},
                    "O-": {"units": 2, "status": "Critical"},
                    "A+": {"units": 12, "status": "Adequate"},
                    "A-": {"units": 3, "status": "Low"},
                    "B+": {"units": 14, "status": "Adequate"},
                    "B-": {"units": 2, "status": "Critical"},
                    "AB+": {"units": 5, "status": "Adequate"},
                    "AB-": {"units": 1, "status": "Critical"},
                }
            },
            {
                "id": "HOSP-04",
                "name": "Fortis Premier Healthcare",
                "address": "B-22 Institutional Area, Vasant Kunj, New Delhi",
                "latitude": 28.5950,
                "longitude": 77.2250,
                "phone": "+91 11 4277 6222",
                "trauma_level": "Level 1 Comprehensive Trauma Center",
                "icu_total": 28,
                "icu_available": 7,
                "beds_total": 150,
                "beds_available": 42,
                "ventilator_total": 14,
                "ventilator_available": 5,
                "emergency_status": "Available",
                "emergency_load": 52,
                "specialists": [
                    {"name": "Dr. Anand Joshi", "specialty": "Cardiologist", "is_available": True, "on_duty": True},
                    {"name": "Dr. Neha Malhotra", "specialty": "Neurologist", "is_available": True, "on_duty": True},
                    {"name": "Dr. Tarun Chawla", "specialty": "Trauma Surgeon", "is_available": True, "on_duty": True},
                    {"name": "Dr. Shalini Saxena", "specialty": "Pulmonologist", "is_available": True, "on_duty": True},
                ],
                "blood": {
                    "O+": {"units": 25, "status": "Adequate"},
                    "O-": {"units": 8, "status": "Adequate"},
                    "A+": {"units": 22, "status": "Adequate"},
                    "A-": {"units": 7, "status": "Adequate"},
                    "B+": {"units": 24, "status": "Adequate"},
                    "B-": {"units": 6, "status": "Adequate"},
                    "AB+": {"units": 12, "status": "Adequate"},
                    "AB-": {"units": 4, "status": "Low"},
                }
            },
            {
                "id": "HOSP-05",
                "name": "St. Jude Regional Medical Center",
                "address": "14 Cathedral Road, Civil Lines, New Delhi",
                "latitude": 28.6400,
                "longitude": 77.1950,
                "phone": "+91 11 2395 1122",
                "trauma_level": "Level 2 Emergency Trauma Unit",
                "icu_total": 14,
                "icu_available": 2,
                "beds_total": 75,
                "beds_available": 12,
                "ventilator_total": 6,
                "ventilator_available": 1,
                "emergency_status": "Busy",
                "emergency_load": 79,
                "specialists": [
                    {"name": "Dr. Samuel Thomas", "specialty": "General Physician", "is_available": True, "on_duty": True},
                    {"name": "Dr. Anita George", "specialty": "Cardiologist", "is_available": True, "on_duty": True},
                    {"name": "Dr. Philip Dsouza", "specialty": "Trauma Surgeon", "is_available": False, "on_duty": False},
                ],
                "blood": {
                    "O+": {"units": 8, "status": "Adequate"},
                    "O-": {"units": 1, "status": "Critical"},
                    "A+": {"units": 9, "status": "Adequate"},
                    "A-": {"units": 2, "status": "Critical"},
                    "B+": {"units": 11, "status": "Adequate"},
                    "B-": {"units": 2, "status": "Critical"},
                    "AB+": {"units": 4, "status": "Low"},
                    "AB-": {"units": 1, "status": "Critical"},
                }
            },
            {
                "id": "HOSP-06",
                "name": "Max Hope General Hospital",
                "address": "1 Press Enclave Marg, Saket, New Delhi",
                "latitude": 28.6500,
                "longitude": 77.2300,
                "phone": "+91 11 2651 5050",
                "trauma_level": "Level 1 Comprehensive Trauma Center",
                "icu_total": 22,
                "icu_available": 5,
                "beds_total": 110,
                "beds_available": 30,
                "ventilator_total": 10,
                "ventilator_available": 3,
                "emergency_status": "Available",
                "emergency_load": 64,
                "specialists": [
                    {"name": "Dr. Vivek Mehra", "specialty": "Trauma Surgeon", "is_available": True, "on_duty": True},
                    {"name": "Dr. Pooja Bajaj", "specialty": "Pulmonologist", "is_available": True, "on_duty": True},
                    {"name": "Dr. Suresh Bedi", "specialty": "Neurologist", "is_available": True, "on_duty": True},
                ],
                "blood": {
                    "O+": {"units": 16, "status": "Adequate"},
                    "O-": {"units": 4, "status": "Low"},
                    "A+": {"units": 14, "status": "Adequate"},
                    "A-": {"units": 5, "status": "Adequate"},
                    "B+": {"units": 17, "status": "Adequate"},
                    "B-": {"units": 3, "status": "Low"},
                    "AB+": {"units": 7, "status": "Adequate"},
                    "AB-": {"units": 2, "status": "Critical"},
                }
            },
            {
                "id": "HOSP-07",
                "name": "LifeLine Urgent Care & Hospital",
                "address": "55 Ring Road, Lajpat Nagar, New Delhi",
                "latitude": 28.5800,
                "longitude": 77.1850,
                "phone": "+91 11 2984 3300",
                "trauma_level": "Level 3 Community Hospital",
                "icu_total": 8,
                "icu_available": 1,
                "beds_total": 50,
                "beds_available": 8,
                "ventilator_total": 4,
                "ventilator_available": 0,
                "emergency_status": "Busy",
                "emergency_load": 86,
                "specialists": [
                    {"name": "Dr. Harish Kumar", "specialty": "General Physician", "is_available": True, "on_duty": True},
                    {"name": "Dr. Preeti Jain", "specialty": "Pediatrician", "is_available": True, "on_duty": True},
                ],
                "blood": {
                    "O+": {"units": 5, "status": "Low"},
                    "O-": {"units": 0, "status": "Critical"},
                    "A+": {"units": 6, "status": "Low"},
                    "A-": {"units": 1, "status": "Critical"},
                    "B+": {"units": 7, "status": "Low"},
                    "B-": {"units": 1, "status": "Critical"},
                    "AB+": {"units": 3, "status": "Low"},
                    "AB-": {"units": 0, "status": "Critical"},
                }
            },
            {
                "id": "HOSP-08",
                "name": "Global Heart & Trauma Institute",
                "address": "77 Ring Road, Naraina, New Delhi",
                "latitude": 28.6650,
                "longitude": 77.2100,
                "phone": "+91 11 4550 7800",
                "trauma_level": "Level 1 Comprehensive Trauma Center",
                "icu_total": 26,
                "icu_available": 6,
                "beds_total": 130,
                "beds_available": 38,
                "ventilator_total": 12,
                "ventilator_available": 4,
                "emergency_status": "Available",
                "emergency_load": 60,
                "specialists": [
                    {"name": "Dr. Arvind Singhal", "specialty": "Cardiologist", "is_available": True, "on_duty": True},
                    {"name": "Dr. Ritu Aggarwal", "specialty": "Trauma Surgeon", "is_available": True, "on_duty": True},
                    {"name": "Dr. Manoj Kaushik", "specialty": "Vascular Surgeon", "is_available": True, "on_duty": True},
                ],
                "blood": {
                    "O+": {"units": 19, "status": "Adequate"},
                    "O-": {"units": 5, "status": "Adequate"},
                    "A+": {"units": 17, "status": "Adequate"},
                    "A-": {"units": 4, "status": "Low"},
                    "B+": {"units": 18, "status": "Adequate"},
                    "B-": {"units": 5, "status": "Adequate"},
                    "AB+": {"units": 9, "status": "Adequate"},
                    "AB-": {"units": 3, "status": "Low"},
                }
            },
            {
                "id": "HOSP-09",
                "name": "Apex Memorial Hospital",
                "address": "25 Mathura Road, Okhla, New Delhi",
                "latitude": 28.5700,
                "longitude": 77.2400,
                "phone": "+91 11 2692 5858",
                "trauma_level": "Level 2 Emergency Trauma Unit",
                "icu_total": 18,
                "icu_available": 4,
                "beds_total": 90,
                "beds_available": 22,
                "ventilator_total": 8,
                "ventilator_available": 2,
                "emergency_status": "Available",
                "emergency_load": 70,
                "specialists": [
                    {"name": "Dr. Sudhir Pandey", "specialty": "Trauma Surgeon", "is_available": True, "on_duty": True},
                    {"name": "Dr. Geeta Pillai", "specialty": "General Physician", "is_available": True, "on_duty": True},
                    {"name": "Dr. Nikhil Bose", "specialty": "Orthopedic Surgeon", "is_available": True, "on_duty": True},
                ],
                "blood": {
                    "O+": {"units": 11, "status": "Adequate"},
                    "O-": {"units": 3, "status": "Low"},
                    "A+": {"units": 13, "status": "Adequate"},
                    "A-": {"units": 3, "status": "Low"},
                    "B+": {"units": 12, "status": "Adequate"},
                    "B-": {"units": 2, "status": "Critical"},
                    "AB+": {"units": 6, "status": "Adequate"},
                    "AB-": {"units": 1, "status": "Critical"},
                }
            },
            {
                "id": "HOSP-10",
                "name": "Sunrise Critical Care Hospital",
                "address": "8 Vikas Marg, Laxmi Nagar, New Delhi",
                "latitude": 28.6200,
                "longitude": 77.2600,
                "phone": "+91 11 2244 8800",
                "trauma_level": "Level 1 Comprehensive Trauma Center",
                "icu_total": 20,
                "icu_available": 5,
                "beds_total": 105,
                "beds_available": 29,
                "ventilator_total": 10,
                "ventilator_available": 3,
                "emergency_status": "Available",
                "emergency_load": 63,
                "specialists": [
                    {"name": "Dr. K. L. Narayanan", "specialty": "Trauma Surgeon", "is_available": True, "on_duty": True},
                    {"name": "Dr. Reena Saxena", "specialty": "Pulmonologist", "is_available": True, "on_duty": True},
                    {"name": "Dr. Devendra Malik", "specialty": "Cardiologist", "is_available": True, "on_duty": True},
                ],
                "blood": {
                    "O+": {"units": 17, "status": "Adequate"},
                    "O-": {"units": 4, "status": "Low"},
                    "A+": {"units": 16, "status": "Adequate"},
                    "A-": {"units": 4, "status": "Low"},
                    "B+": {"units": 15, "status": "Adequate"},
                    "B-": {"units": 3, "status": "Low"},
                    "AB+": {"units": 8, "status": "Adequate"},
                    "AB-": {"units": 2, "status": "Critical"},
                }
            }
        ]

        now = datetime.datetime.utcnow()

        for hdata in hospitals_data:
            hospital = models.Hospital(
                id=hdata["id"],
                name=hdata["name"],
                address=hdata["address"],
                latitude=hdata["latitude"],
                longitude=hdata["longitude"],
                phone=hdata["phone"],
                trauma_level=hdata["trauma_level"],
                icu_total=hdata["icu_total"],
                icu_available=hdata["icu_available"],
                beds_total=hdata["beds_total"],
                beds_available=hdata["beds_available"],
                ventilator_total=hdata["ventilator_total"],
                ventilator_available=hdata["ventilator_available"],
                emergency_status=hdata["emergency_status"],
                emergency_load=hdata["emergency_load"],
                blood_stock_json=json.dumps(hdata["blood"]),
                specialists_json=json.dumps(hdata["specialists"]),
                last_updated=now - datetime.timedelta(seconds=random.randint(5, 30))
            )
            db.add(hospital)

            # Specialists relationship
            for s in hdata["specialists"]:
                spec = models.Specialist(
                    hospital_id=hdata["id"],
                    name=s["name"],
                    specialty=s["specialty"],
                    is_available=s["is_available"],
                    on_duty=s["on_duty"]
                )
                db.add(spec)

            # Blood stock relationship
            for bgroup, binfo in hdata["blood"].items():
                bstock = models.BloodStock(
                    hospital_id=hdata["id"],
                    blood_group=bgroup,
                    units_available=binfo["units"],
                    status=binfo["status"]
                )
                db.add(bstock)

            # Resource history (at least 20 records each over past 12 hours)
            for i in range(25, 0, -1):
                hist_time = now - datetime.timedelta(minutes=i * 25)
                # Realistic variations
                var_icu = max(1, min(hdata["icu_total"], hdata["icu_available"] + random.randint(-2, 2)))
                var_beds = max(5, min(hdata["beds_total"], hdata["beds_available"] + random.randint(-5, 5)))
                var_vents = max(0, min(hdata["ventilator_total"], hdata["ventilator_available"] + random.randint(-1, 2)))
                var_load = max(35, min(95, hdata["emergency_load"] + random.randint(-8, 8)))

                hist = models.ResourceHistory(
                    hospital_id=hdata["id"],
                    timestamp=hist_time,
                    icu_available=var_icu,
                    beds_available=var_beds,
                    ventilator_available=var_vents,
                    emergency_load=var_load
                )
                db.add(hist)

        # Seed sample initial notifications
        sample_notif = models.Notification(
            hospital_id="HOSP-01",
            title="System Initialization",
            message="LifeBridge AI emergency decision network online. 10 regional trauma and critical care nodes connected.",
            type="ALERT",
            is_read=False,
            created_at=now
        )
        db.add(sample_notif)

        db.commit()
        print("Successfully seeded 10 hospitals, 250+ history records, and associated clinical resources!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database(force=True)
