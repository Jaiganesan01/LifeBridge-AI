import re
from typing import Dict, Any, List, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline


class EmergencyAIEngine:
    def __init__(self):
        # Clinical keyword dictionary for high-precision emergency matching
        self.emergency_categories = {
            "Trauma / Road Accident": [
                "accident", "road", "crash", "collision", "fall", "fracture", "bleeding", "wound",
                "trauma", "hit and run", "head injury", "crush", "stab", "pedestrian", "vehicular"
            ],
            "Cardiac Emergency": [
                "chest pain", "heart attack", "cardiac", "angina", "palpitation", "left arm", "sweating",
                "arrhythmia", "cardiac arrest", "infarction", "jaw pain", "stent", "bypass", "ecg"
            ],
            "Stroke / Neurological": [
                "stroke", "facial droop", "slurred speech", "paralysis", "weakness", "numbness",
                "seizure", "unconscious", "confusion", "headache", "vision loss", "aneurysm", "hemiplegia"
            ],
            "Respiratory Emergency": [
                "breathing", "breathless", "asthma", "choking", "oxygen", "cyanosis", "suffocation",
                "wheezing", "copd", "stridor", "dyspnea", "respiratory", "inhaler"
            ],
            "Pediatric / Obstetric": [
                "pediatric", "child", "infant", "labor", "pregnancy", "delivery", "contractions",
                "bleeding pregnancy", "baby", "maternal"
            ],
            "Sepsis / Severe Infection": [
                "high fever", "septic", "sepsis", "unresponsive", "delirium", "shivering",
                "low bp", "hypotension", "infection"
            ]
        }

        # Train a fast local NLP classifier for categorization fallback
        self._init_classifier()

    def _init_classifier(self):
        training_corpus = [
            ("road accident severe bleeding trauma crushed leg vehicular collision", "Trauma / Road Accident"),
            ("car crash hit by truck head trauma multiple wounds blood loss", "Trauma / Road Accident"),
            ("fell from height severe fracture head injury lacerations", "Trauma / Road Accident"),
            ("sharp stab wound abdominal bleeding deep cut penetrating trauma", "Trauma / Road Accident"),
            ("sudden crushing chest pain radiating to left arm shoulder sweating profusely", "Cardiac Emergency"),
            ("acute myocardial infarction chest heaviness shortness of breath palpitations", "Cardiac Emergency"),
            ("cardiac arrest unconscious no pulse CPR in progress", "Cardiac Emergency"),
            ("severe angina chest tightness high blood pressure dizzy", "Cardiac Emergency"),
            ("sudden weakness right side slurred speech face drooping drooping eye", "Stroke / Neurological"),
            ("massive stroke lost consciousness unable to move arms slurring words", "Stroke / Neurological"),
            ("sudden onset severe seizure twitching unresponsive postictal state", "Stroke / Neurological"),
            ("cannot breathe severe asthma attack wheezing cyanosis blue lips gasping", "Respiratory Emergency"),
            ("acute respiratory distress severe pneumonia low oxygen saturation gasping for air", "Respiratory Emergency"),
            ("choking on foreign object airway obstruction unable to speak", "Respiratory Emergency"),
            ("pregnant woman in severe labor heavy bleeding sudden abdominal pain", "Pediatric / Obstetric"),
            ("high fever severe chills low blood pressure septic shock lethargic", "Sepsis / Severe Infection"),
            ("mild abdominal stomach ache fever for two days", "General Medical Emergency"),
            ("minor finger cut small scrape feeling dizzy", "General Medical Emergency")
        ]
        X = [item[0] for item in training_corpus]
        y = [item[1] for item in training_corpus]

        self.classifier = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2))),
            ('nb', MultinomialNB())
        ])
        self.classifier.fit(X, y)

    def analyze(self, description: str, manual_type: Optional[str] = None,
                manual_blood: Optional[str] = None, manual_specialist: Optional[str] = None,
                patient_age: Optional[int] = None) -> Dict[str, Any]:
        text_lower = description.lower()

        # 1. Detect Category
        detected_category = self._detect_category(text_lower, manual_type)

        # 2. Extract Key Clinical Findings
        detected_keywords = self._extract_keywords(text_lower)

        # 3. Detect Critical Indicators
        has_severe_bleeding = any(w in text_lower for w in ["bleeding", "blood loss", "hemorrhage", "heavy bleed", "stab", "gushing", "soaked"])
        has_severe_breathing = any(w in text_lower for w in ["breathing", "breathless", "choking", "gasping", "cyanosis", "respiratory", "asthma", "oxygen", "wheezing", "suffocating"])
        has_unconscious = any(w in text_lower for w in ["unconscious", "unresponsive", "fainted", "coma", "syncope", "passed out"])
        has_cardiac_arrest = any(w in text_lower for w in ["cardiac arrest", "no pulse", "cpr", "heart stopped"])
        has_stroke_signs = any(w in text_lower for w in ["facial droop", "slurred speech", "paralysis", "stroke", "slurring", "droop"])
        has_severe_trauma = any(w in text_lower for w in ["accident", "collision", "crash", "fracture", "crush", "trauma", "head injury"])

        # 4. Priority Assessment (CRITICAL, HIGH, MODERATE, LOW)
        # Section 27: 🟢 LOW, 🟡 MODERATE, 🟠 HIGH, 🔴 CRITICAL
        critical_flags = [
            (has_severe_bleeding and has_severe_breathing),
            has_cardiac_arrest,
            (has_severe_trauma and (has_severe_bleeding or has_unconscious)),
            (has_stroke_signs and has_unconscious),
            (has_severe_breathing and has_unconscious)
        ]

        high_flags = [
            has_severe_bleeding,
            has_severe_breathing,
            has_stroke_signs,
            has_severe_trauma,
            "chest pain" in text_lower,
            "heart attack" in text_lower,
            has_unconscious
        ]

        if any(critical_flags) or ("severe" in text_lower and ("breathing" in text_lower or "bleeding" in text_lower)):
            priority = "CRITICAL"
            priority_color = "red"
            severity_score = 95
        elif any(high_flags):
            priority = "HIGH"
            priority_color = "orange"
            severity_score = 80
        elif any(w in text_lower for w in ["fever", "pain", "vomiting", "dizzy", "infection", "burn"]):
            priority = "MODERATE"
            priority_color = "yellow"
            severity_score = 55
        else:
            priority = "LOW"
            priority_color = "green"
            severity_score = 30

        # Adjust score if age is high or very young
        if patient_age and (patient_age > 70 or patient_age < 5):
            severity_score = min(100, severity_score + 5)

        # 5. Resource Determination
        required_resources = ["Emergency Department"]

        # ICU Requirement
        icu_required = False
        icu_reasons = []
        if priority == "CRITICAL":
            icu_required = True
            icu_reasons.append("Critical vital compromise, hemodynamic instability or acute multi-system involvement.")
        elif has_cardiac_arrest or has_unconscious or (has_severe_breathing and priority == "HIGH"):
            icu_required = True
            icu_reasons.append("High risk of clinical deterioration requiring continuous hemodynamic monitoring.")
        
        if icu_required:
            required_resources.append("ICU")

        # Ventilator Requirement
        ventilator_required = False
        ventilator_reasons = []
        if has_severe_breathing or has_cardiac_arrest or "oxygen" in text_lower or "choking" in text_lower:
            ventilator_required = True
            ventilator_reasons.append("Severe respiratory distress or airway compromise detected requiring invasive/non-invasive ventilatory support.")
        elif priority == "CRITICAL" and has_severe_trauma:
            ventilator_required = True
            ventilator_reasons.append("Prophylactic airway protection recommended for critical poly-trauma.")

        if ventilator_required:
            required_resources.append("Ventilator")

        # Blood Requirement
        blood_required = False
        if has_severe_bleeding or "hemorrhage" in text_lower or (has_severe_trauma and priority in ["CRITICAL", "HIGH"]):
            blood_required = True
            required_resources.append("Blood")

        # Specialist Identification
        if manual_specialist:
            specialist = manual_specialist
        elif detected_category == "Trauma / Road Accident" or has_severe_trauma:
            specialist = "Trauma Surgeon"
        elif detected_category == "Cardiac Emergency" or "chest" in text_lower:
            specialist = "Cardiologist"
        elif detected_category == "Stroke / Neurological" or has_stroke_signs:
            specialist = "Neurologist"
        elif detected_category == "Respiratory Emergency" or has_severe_breathing:
            specialist = "Pulmonologist"
        elif detected_category == "Pediatric / Obstetric":
            specialist = "Pediatrician / Obstetrician"
        else:
            specialist = "General Physician"

        required_resources.append(specialist)

        if "trauma" in text_lower or detected_category == "Trauma / Road Accident":
            if "Trauma Care" not in required_resources:
                required_resources.append("Trauma Care")

        return {
            "emergency_type": detected_category,
            "priority": priority,
            "priority_color": priority_color,
            "severity_score": severity_score,
            "required_resources": required_resources,
            "required_specialist": specialist,
            "icu_required": icu_required,
            "icu_reason": " ".join(icu_reasons) if icu_reasons else "Normal monitoring sufficient unless condition deteriorates.",
            "ventilator_required": ventilator_required,
            "ventilator_reason": " ".join(ventilator_reasons) if ventilator_reasons else "Spontaneous breathing adequate, monitor SpO2.",
            "blood_required": blood_required,
            "blood_group": manual_blood if manual_blood else ("O-" if priority == "CRITICAL" else "O+"),
            "detected_keywords": detected_keywords,
            "confidence_score": 0.95 if detected_keywords else 0.82,
            "decision_support_notice": "AI-generated emergency requirement assessment — decision support only."
        }

    def _detect_category(self, text: str, manual_type: Optional[str]) -> str:
        if manual_type and manual_type not in ["Other", ""]:
            return manual_type

        # Check keyword matches
        scores = {}
        for category, keywords in self.emergency_categories.items():
            count = sum(1 for kw in keywords if kw in text)
            if count > 0:
                scores[category] = count

        if scores:
            return max(scores, key=scores.get)

        # Fallback to ML classifier prediction
        try:
            pred = self.classifier.predict([text])[0]
            return pred
        except Exception:
            return "General Emergency"

    def _extract_keywords(self, text: str) -> List[str]:
        clinical_terms = [
            "accident", "severe bleeding", "difficulty breathing", "bleeding", "breathing",
            "trauma", "chest pain", "unconscious", "head injury", "fracture", "choking",
            "facial droop", "slurred speech", "paralysis", "cardiac arrest", "cyanosis",
            "asthma attack", "seizure", "blood loss", "burn", "stab wound"
        ]
        found = []
        for term in clinical_terms:
            if term in text:
                found.append(term)
        return found if found else ["medical emergency", "distress"]


    def extract_entities_from_transcript(self, transcript: str) -> Dict[str, Any]:
        """
        Voice NLP entity extraction: parses raw spoken transcription into structured clinical fields:
        - patient_name
        - patient_age
        - patient_gender
        - location
        - blood_group
        - emergency_type
        - symptoms
        + full AI triage analysis
        """
        text = transcript.strip()
        text_lower = text.lower()

        # 1. Extract Age
        age = None
        age_patterns = [
            r'(\d{1,3})\s*(?:years?\s*old|yo|yr|year\s*old)',
            r'age\s*(?:is\s*)?(\d{1,3})',
            r'(\d{1,3})\s*-\s*year\s*-\s*old'
        ]
        for pat in age_patterns:
            m = re.search(pat, text_lower)
            if m:
                try:
                    val = int(m.group(1))
                    if 0 < val <= 120:
                        age = val
                        break
                except ValueError:
                    pass

        # 2. Extract Gender
        gender = None
        if re.search(r'\b(female|woman|lady|girl)\b', text_lower):
            gender = "Female"
        elif re.search(r'\b(male|man|gentleman|boy)\b', text_lower):
            gender = "Male"

        # 3. Extract Name
        name = None
        name_patterns = [
            r'patient\s+(?:name\s+is\s+|is\s+|called\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
            r'name\s+is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
            r'named\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
            r'patient\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)'
        ]
        for pat in name_patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                candidate = m.group(1).strip()
                # filter out clinical words
                if candidate.lower() not in ["with", "having", "is", "a", "critical", "severe", "in", "the", "an", "unconscious"]:
                    name = candidate.title()
                    break

        # 4. Extract Location
        location = None
        location_keywords = [
            "Connaught Place", "Ring Road", "South Extension", "Highway 44", 
            "Civil Lines", "Vasant Kunj", "Saket", "Lajpat Nagar", "Naraina",
            "Okhla", "Laxmi Nagar", "Central Hub", "City Center"
        ]
        for loc in location_keywords:
            if loc.lower() in text_lower:
                location = loc
                break

        # If not found in known list, look for "at <Location>" or "near <Location>"
        if not location:
            loc_match = re.search(r'\b(?:at|near|around|on)\s+([A-Z][a-zA-Z0-9\s]{3,25})(?:,|\.|$)', text)
            if loc_match:
                candidate_loc = loc_match.group(1).strip()
                if not any(w in candidate_loc.lower() for w in ["the hospital", "critical", "severe", "bleeding", "breathing"]):
                    location = candidate_loc

        # 5. Extract Blood Group
        blood_group = None
        bg_match = re.search(r'\b(o\+|o-|a\+|a-|b\+|b-|ab\+|ab-)\b', text_lower)
        if bg_match:
            blood_group = bg_match.group(1).upper()

        # 6. Extract Symptoms
        # Full analysis using the text
        analysis = self.analyze(
            description=text,
            manual_blood=blood_group,
            patient_age=age
        )

        return {
            "transcript": transcript,
            "extracted_name": name,
            "extracted_age": age,
            "extracted_gender": gender,
            "extracted_location": location,
            "extracted_blood": blood_group,
            "analysis": analysis
        }


# Global instance
ai_engine = EmergencyAIEngine()

