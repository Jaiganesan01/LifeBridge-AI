import asyncio
import random
import datetime
import json
import logging
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from websocket_manager import ws_manager

logger = logging.getLogger("simulation_engine")


class BackgroundSimulationEngine:
    def __init__(self, interval_seconds: int = 14):
        self.interval_seconds = interval_seconds
        self.is_running = False
        self._task: asyncio.Task = None

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        self._task = asyncio.create_task(self._simulation_loop())
        logger.info("Background hospital resource simulation started.")

    async def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Background hospital resource simulation stopped.")

    async def _simulation_loop(self):
        while self.is_running:
            try:
                await asyncio.sleep(self.interval_seconds)
                await self.simulate_step()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in simulation step: {e}")

    async def simulate_step(self):
        """
        Picks 1-3 random hospitals and slightly adjusts their live metrics,
        logging history and broadcasting WebSocket updates.
        """
        db: Session = SessionLocal()
        try:
            hospitals = db.query(models.Hospital).all()
            if not hospitals:
                return

            # Pick 2-4 hospitals to fluctuate realistically
            selected_hospitals = random.sample(hospitals, k=min(len(hospitals), random.randint(2, 4)))
            updated_payloads = []
            now = datetime.datetime.utcnow()

            for h in selected_hospitals:
                # Fluctuate ICU available (-1 to +1)
                icu_delta = random.choice([-1, 0, 1])
                new_icu = max(1, min(h.icu_total - 2, h.icu_available + icu_delta))

                # Fluctuate Beds available (-3 to +3)
                beds_delta = random.choice([-3, -2, -1, 0, 1, 2, 3])
                new_beds = max(5, min(h.beds_total - 5, h.beds_available + beds_delta))

                # Fluctuate Ventilator available (-1 to +1)
                vent_delta = random.choice([-1, 0, 0, 1])
                new_vents = max(0, min(h.ventilator_total, h.ventilator_available + vent_delta))

                # Fluctuate Emergency Load (-5 to +5%)
                load_delta = random.choice([-5, -3, -2, 0, 2, 4, 6])
                new_load = max(30, min(95, h.emergency_load + load_delta))

                # Update emergency status based on load
                if new_load > 85:
                    h.emergency_status = "Busy"
                elif new_load > 92:
                    h.emergency_status = "Critical"
                else:
                    h.emergency_status = "Available"

                h.icu_available = new_icu
                h.beds_available = new_beds
                h.ventilator_available = new_vents
                h.emergency_load = new_load
                h.last_updated = now

                # Occasionally slightly adjust blood stock
                if random.random() < 0.35 and h.blood_stock_json:
                    try:
                        blood_dict = json.loads(h.blood_stock_json)
                        target_grp = random.choice(["O+", "O-", "A+", "B+"])
                        if target_grp in blood_dict:
                            old_units = blood_dict[target_grp]["units"]
                            new_units = max(0, old_units + random.choice([-1, 1]))
                            blood_dict[target_grp]["units"] = new_units
                            blood_dict[target_grp]["status"] = "Critical" if new_units <= 2 else ("Low" if new_units <= 4 else "Adequate")
                            h.blood_stock_json = json.dumps(blood_dict)
                    except Exception:
                        pass

                # Record resource history
                history_entry = models.ResourceHistory(
                    hospital_id=h.id,
                    timestamp=now,
                    icu_available=new_icu,
                    beds_available=new_beds,
                    ventilator_available=new_vents,
                    emergency_load=new_load
                )
                db.add(history_entry)

                updated_payloads.append({
                    "id": h.id,
                    "name": h.name,
                    "icu_available": h.icu_available,
                    "icu_total": h.icu_total,
                    "beds_available": h.beds_available,
                    "beds_total": h.beds_total,
                    "ventilator_available": h.ventilator_available,
                    "ventilator_total": h.ventilator_total,
                    "emergency_status": h.emergency_status,
                    "emergency_load": h.emergency_load,
                    "last_updated": h.last_updated.isoformat(),
                    "simulated": True
                })

            db.commit()

            # Broadcast changes to all connected web clients
            if updated_payloads:
                await ws_manager.broadcast("RESOURCE_UPDATED", {
                    "updated_hospitals": updated_payloads,
                    "timestamp": now.isoformat()
                })

        except Exception as e:
            db.rollback()
            logger.error(f"Error in background simulation step: {e}")
        finally:
            db.close()


simulation_engine = BackgroundSimulationEngine(interval_seconds=12)
