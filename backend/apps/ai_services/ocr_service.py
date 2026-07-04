"""
OCR Service using Tesseract + Gemini for prescription extraction.
"""
from PIL import Image
import re
from django.conf import settings
from .gemini_client import GeminiClient

class OCRService:
    """Extract text from prescription images and parse medicines."""

    def __init__(self):
        self.gemini = GeminiClient()

    def extract_text(self, image_path):
        """Extract text using Tesseract OCR."""
        try:
            import pytesseract
        except Exception:
            return {'text': 'OCR unavailable on this server.', 'confidence': 0.0, 'word_count': 0, 'medicines': []}
        try:
            image = Image.open(image_path)
            text = pytesseract.image_to_string(image)

            # Calculate confidence (rough estimate based on word count)
            words = text.split()
            confidence = min(95.0, len(words) * 2.0) if words else 0.0

            return {
                'text': text,
                'confidence': round(confidence, 2),
                'word_count': len(words)
            }
        except Exception as e:
            return {
                'text': f"OCR Error: {str(e)}",
                'confidence': 0.0,
                'word_count': 0
            }

    def extract_text_from_image(self, image_file):
        """Extract text from an uploaded image file (InMemoryUploadedFile)."""
        try:
            import pytesseract
        except Exception:
            return {'text': 'OCR unavailable on this server.', 'confidence': 0.0, 'word_count': 0, 'medicines': []}
        try:
            image = Image.open(image_file)
            text = pytesseract.image_to_string(image)

            # Parse medicines using regex patterns
            medicines = self._parse_medicines(text)

            words = text.split()
            confidence = min(95.0, len(words) * 2.0) if words else 0.0

            return {
                'text': text,
                'confidence': round(confidence, 2),
                'medicines': medicines,
                'word_count': len(words)
            }
        except Exception as e:
            return {
                'text': f"OCR Error: {str(e)}",
                'confidence': 0.0,
                'medicines': [],
                'word_count': 0
            }

    def extract_with_gemini(self, image_path):
        """Use Gemini for advanced prescription parsing (path-based, kept for compatibility)."""
        prompt = """Analyze this prescription image and extract the following information in a structured format:
        - Patient name
        - Doctor name
        - Date
        - Medicines (name, dosage, frequency, duration)
        - Diagnosis
        - Special instructions

        Return as JSON."""

        return self.gemini.analyze_image(image_path, prompt)

    def extract_with_gemini_bytes(self, image_bytes, mime_type='image/jpeg'):
        """
        Extract prescription data using Gemini's vision model, directly from
        in-memory bytes. This is the primary extraction path in production:
        Tesseract's binary isn't available on serverless hosts (e.g. Vercel),
        so `pytesseract`-based extraction only works where the system
        `tesseract` executable is installed (e.g. local dev with it on PATH).
        Gemini vision works anywhere the API key is configured.
        """
        prompt = """Analyze this prescription image carefully and extract the following information.
        If a field isn't present or legible, use an empty string / empty list rather than guessing."""

        response_schema = {
            "type": "object",
            "properties": {
                "patient_name": {"type": "string"},
                "doctor_name": {"type": "string"},
                "date": {"type": "string"},
                "diagnosis": {"type": "string"},
                "special_instructions": {"type": "string"},
                "medicines": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "dosage": {"type": "string"},
                            "frequency": {"type": "string"},
                            "duration": {"type": "string"},
                        }
                    }
                }
            }
        }

        result = self.gemini.analyze_image(image_bytes, prompt, mime_type=mime_type, response_schema=response_schema)
        if not result.get('success'):
            return {'text': result.get('text', 'OCR failed.'), 'confidence': 0.0, 'medicines': [], 'word_count': 0}

        import json
        try:
            parsed = json.loads(result['text'])
        except (ValueError, TypeError):
            return {'text': result['text'], 'confidence': 40.0, 'medicines': [], 'word_count': len(result['text'].split())}

        medicines = parsed.get('medicines', [])
        text_parts = [f"Patient: {parsed.get('patient_name','')}", f"Doctor: {parsed.get('doctor_name','')}",
                      f"Date: {parsed.get('date','')}", f"Diagnosis: {parsed.get('diagnosis','')}"]
        text = "\n".join([p for p in text_parts if p.split(': ', 1)[-1]])
        return {
            'text': text,
            'confidence': 85.0 if medicines else 50.0,
            'medicines': medicines,
            'word_count': len(text.split()),
            'patient_name': parsed.get('patient_name', ''),
            'doctor_name': parsed.get('doctor_name', ''),
            'date': parsed.get('date', ''),
            'diagnosis': parsed.get('diagnosis', ''),
            'special_instructions': parsed.get('special_instructions', ''),
        }

    def _parse_medicines(self, text):
        """Parse medicine names and dosages from OCR text."""
        medicines = []

        # Common patterns for medicine extraction
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Look for patterns like: Medicine Name - 1 tablet - 2x daily - 7 days
            parts = re.split(r'[-–—\s]+', line)
            if len(parts) >= 2 and len(parts[0]) > 2:
                medicine = {
                    'name': parts[0].strip(),
                    'dosage': parts[1].strip() if len(parts) > 1 else '',
                    'frequency': parts[2].strip() if len(parts) > 2 else '',
                    'duration': parts[3].strip() if len(parts) > 3 else ''
                }
                medicines.append(medicine)

        return medicines
