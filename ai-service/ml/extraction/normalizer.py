"""
Value Normalization Engine
Normalizes raw extracted string representations into machine-readable types while retaining exact evidence.
"""

import re
from typing import Dict, Any, Optional, Tuple, List
from ml.extraction.types import NormalizedValue, NormalizationStatus

# Month name lookup table
MONTH_MAP = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "september": 9, "sept": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12
}

# Mass unit definitions and canonical scaling to grams (g)
MASS_UNITS = {
    "mg": 0.001,
    "g": 1.0,
    "gm": 1.0,
    "gms": 1.0,
    "gram": 1.0,
    "grams": 1.0,
    "kg": 1000.0,
    "kilo": 1000.0,
    "kilogram": 1000.0,
    "kilograms": 1000.0
}

# Volume unit definitions and canonical scaling to milliliters (ml)
VOLUME_UNITS = {
    "ml": 1.0,
    "mls": 1.0,
    "milliliter": 1.0,
    "millilitre": 1.0,
    "milliliters": 1.0,
    "millilitres": 1.0,
    "l": 1000.0,
    "ltr": 1000.0,
    "litre": 1000.0,
    "liter": 1000.0,
    "litres": 1000.0,
    "liters": 1000.0
}

# Count unit definitions
COUNT_UNITS = {
    "n": 1.0,
    "u": 1.0,
    "unit": 1.0,
    "units": 1.0,
    "pc": 1.0,
    "pcs": 1.0,
    "piece": 1.0,
    "pieces": 1.0,
    "pack": 1.0,
    "sachet": 1.0,
    "capsule": 1.0,
    "capsules": 1.0,
    "tablet": 1.0,
    "tablets": 1.0,
    "n.": 1.0
}


def sanitize_ocr_digits(text: str) -> str:
    """
    Safely fix OCR digit confusions (O->0, l/I->1, S->5, B->8) 
    only when surrounding context indicates a numeric string.
    """
    if not text:
        return text

    cleaned = text
    # Fix O or o between digits or adjacent to digits
    cleaned = re.sub(r'(?<=\d)[Oo](?=\d)', '0', cleaned)
    cleaned = re.sub(r'(?<=\d)[Oo](?=\b)', '0', cleaned)
    cleaned = re.sub(r'(?<=\b)[Oo](?=\d)', '0', cleaned)
    # Fix l or I between digits or adjacent to digits/decimals
    cleaned = re.sub(r'(?<=\d)[lI](?=\d)', '1', cleaned)
    cleaned = re.sub(r'(?<=\d)[lI](?=\b)', '1', cleaned)
    cleaned = re.sub(r'(?<=\b)[lI](?=\d|\.\d)', '1', cleaned)
    return cleaned


class ValueNormalizer:
    """Normalizes field candidate values into strongly typed canonical representations."""

    @staticmethod
    def normalize_mrp(raw_text: str) -> NormalizedValue:
        """
        Normalize MRP values.
        Outputs amount (float), currency ('INR').
        """
        if not raw_text:
            return NormalizedValue(raw_text=raw_text, normalization_status=NormalizationStatus.FAILED.value)

        text = sanitize_ocr_digits(raw_text)
        
        # Regex to find currency amount
        # Matches ₹ 249.00, Rs. 249, Rs249, 249.00, etc.
        price_pattern = re.compile(
            r'(?:(?:₹|rs\.?|inr|mrp|m\.r\.p\.?)\s*)*'
            r'(\d+(?:[.,]\d{1,2})?)',
            re.IGNORECASE
        )
        matches = price_pattern.findall(text)
        
        if not matches:
            # Fallback for plain digits
            digit_match = re.search(r'\d+(?:[.,]\d{1,2})?', text)
            if digit_match:
                matches = [digit_match.group(0)]

        if matches:
            # Pick first clean float match
            val_str = matches[0].replace(',', '')
            try:
                amount = float(val_str)
                return NormalizedValue(
                    raw_text=raw_text,
                    normalized_value={"amount": round(amount, 2), "currency": "INR"},
                    normalization_status=NormalizationStatus.SUCCESS.value
                )
            except ValueError:
                pass

        return NormalizedValue(
            raw_text=raw_text,
            normalized_value=None,
            normalization_status=NormalizationStatus.FAILED.value
        )

    @staticmethod
    def normalize_net_quantity(raw_text: str) -> NormalizedValue:
        """
        Normalize Net Quantity values.
        Mass: canonicalized to 'g' (gram).
        Volume: canonicalized to 'ml' (milliliter).
        Count: canonicalized to 'N'.
        CRITICAL: Never convert between mass and volume.
        """
        if not raw_text:
            return NormalizedValue(raw_text=raw_text, normalization_status=NormalizationStatus.FAILED.value)

        text = sanitize_ocr_digits(raw_text)
        
        # Match pattern: number followed by unit
        qty_pattern = re.compile(
            r'(\d+(?:\.\d+)?)\s*([a-zA-Z]+)',
            re.IGNORECASE
        )
        match = qty_pattern.search(text)
        
        if not match:
            # Check for space separated or reversed patterns
            digit_match = re.search(r'(\d+(?:\.\d+)?)', text)
            if digit_match:
                val = float(digit_match.group(1))
                return NormalizedValue(
                    raw_text=raw_text,
                    normalized_value={
                        "value": val,
                        "unit": "unknown",
                        "canonical_value": val,
                        "canonical_unit": "unknown"
                    },
                    normalization_status=NormalizationStatus.PARTIAL.value
                )
            return NormalizedValue(raw_text=raw_text, normalization_status=NormalizationStatus.FAILED.value)

        value = float(match.group(1))
        unit_str = match.group(2).lower()

        # Check Mass
        if unit_str in MASS_UNITS:
            factor = MASS_UNITS[unit_str]
            canonical_g = value * factor
            return NormalizedValue(
                raw_text=raw_text,
                normalized_value={
                    "value": value,
                    "unit": unit_str,
                    "canonical_value": round(canonical_g, 4),
                    "canonical_unit": "g"
                },
                normalization_status=NormalizationStatus.SUCCESS.value
            )

        # Check Volume
        if unit_str in VOLUME_UNITS:
            factor = VOLUME_UNITS[unit_str]
            canonical_ml = value * factor
            return NormalizedValue(
                raw_text=raw_text,
                normalized_value={
                    "value": value,
                    "unit": unit_str,
                    "canonical_value": round(canonical_ml, 4),
                    "canonical_unit": "ml"
                },
                normalization_status=NormalizationStatus.SUCCESS.value
            )

        # Check Count
        if unit_str in COUNT_UNITS:
            return NormalizedValue(
                raw_text=raw_text,
                normalized_value={
                    "value": value,
                    "unit": unit_str,
                    "canonical_value": round(value, 2),
                    "canonical_unit": "N"
                },
                normalization_status=NormalizationStatus.SUCCESS.value
            )

        # Unknown unit
        return NormalizedValue(
            raw_text=raw_text,
            normalized_value={
                "value": value,
                "unit": unit_str,
                "canonical_value": value,
                "canonical_unit": unit_str
            },
            normalization_status=NormalizationStatus.PARTIAL.value
        )

    @staticmethod
    def normalize_date(raw_text: str) -> NormalizedValue:
        """
        Normalize date strings to ISO format (YYYY-MM-DD or YYYY-MM).
        Detects ambiguous dates (e.g. 05/06/2026 where both DD and MM <= 12).
        """
        if not raw_text:
            return NormalizedValue(raw_text=raw_text, normalization_status=NormalizationStatus.FAILED.value)

        text = sanitize_ocr_digits(raw_text).strip()

        # Pattern 1: Textual Month e.g., "15 Aug 2026", "August 2026", "15/Aug/2026"
        text_month_pattern = re.compile(
            r'(?:(\d{1,2})[\/\s\.\-]*)?([a-zA-Z]{3,9})[\/\s\.\-]*(\d{2,4})',
            re.IGNORECASE
        )
        match_tm = text_month_pattern.search(text)
        if match_tm:
            day_str, month_name, year_str = match_tm.groups()
            m_lower = month_name.lower()[:3]
            if m_lower in MONTH_MAP:
                month = MONTH_MAP[m_lower]
                year = int(year_str)
                if year < 100:
                    year += 2000
                
                if day_str:
                    day = int(day_str)
                    iso_val = f"{year:04d}-{month:02d}-{day:02d}"
                else:
                    iso_val = f"{year:04d}-{month:02d}"
                
                return NormalizedValue(
                    raw_text=raw_text,
                    normalized_value={"iso": iso_val, "format": "ISO_8601"},
                    normalization_status=NormalizationStatus.SUCCESS.value
                )

        # Pattern 2a: 3-part numeric date DD/MM/YYYY or MM/DD/YYYY
        num_date_3part = re.compile(r'(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})')
        match_3p = num_date_3part.search(text)
        if match_3p:
            part1, part2, part3 = match_3p.groups()
            n1, n2, year = int(part1), int(part2), int(part3)
            if year < 100:
                year += 2000

            if n1 <= 12 and n2 <= 12 and n1 != n2:
                iso1 = f"{year:04d}-{n2:02d}-{n1:02d}" # DD/MM/YYYY
                iso2 = f"{year:04d}-{n1:02d}-{n2:02d}" # MM/DD/YYYY
                return NormalizedValue(
                    raw_text=raw_text,
                    normalized_value={"iso": iso1, "possible_alternatives": [iso2]},
                    normalization_status=NormalizationStatus.AMBIGUOUS.value,
                    extra_info={"note": "Ambiguous day/month ordering"}
                )
            elif n2 <= 12 and n1 > 12:
                iso_val = f"{year:04d}-{n2:02d}-{n1:02d}"
                return NormalizedValue(
                    raw_text=raw_text,
                    normalized_value={"iso": iso_val},
                    normalization_status=NormalizationStatus.SUCCESS.value
                )
            elif n1 <= 12 and n2 > 12:
                iso_val = f"{year:04d}-{n1:02d}-{n2:02d}"
                return NormalizedValue(
                    raw_text=raw_text,
                    normalized_value={"iso": iso_val},
                    normalization_status=NormalizationStatus.SUCCESS.value
                )

        # Pattern 2b: 2-part numeric date MM/YYYY or MM/YY
        num_date_2part = re.compile(r'(\d{1,2})[\/\.\-](\d{2,4})')
        match_2p = num_date_2part.search(text)
        if match_2p:
            month, year = int(match_2p.group(1)), int(match_2p.group(2))
            if year < 100:
                year += 2000
            if 1 <= month <= 12:
                iso_val = f"{year:04d}-{month:02d}"
                return NormalizedValue(
                    raw_text=raw_text,
                    normalized_value={"iso": iso_val},
                    normalization_status=NormalizationStatus.SUCCESS.value
                )


        # Relative period date expressions (e.g. "12 Months from packing", "Best before 6 months")
        relative_pattern = re.compile(r'(\d+)\s*(months?|years?|days?)', re.IGNORECASE)
        match_rel = relative_pattern.search(text)
        if match_rel:
            num = int(match_rel.group(1))
            unit = match_rel.group(2).lower()
            return NormalizedValue(
                raw_text=raw_text,
                normalized_value={"duration_value": num, "duration_unit": unit},
                normalization_status=NormalizationStatus.SUCCESS.value
            )

        return NormalizedValue(
            raw_text=raw_text,
            normalized_value=None,
            normalization_status=NormalizationStatus.FAILED.value
        )

    @staticmethod
    def normalize_country(raw_text: str) -> NormalizedValue:
        """Normalize Country of Origin to standard country name."""
        if not raw_text:
            return NormalizedValue(raw_text=raw_text, normalization_status=NormalizationStatus.FAILED.value)

        # Standard clean string match
        text = re.sub(r'^(country of origin|made in|produced in|manufactured in|origin)\s*[:\-]?\s*', '', raw_text, flags=re.IGNORECASE).strip()
        text = re.sub(r'[^a-zA-Z\s]', '', text).strip()

        # Known countries map
        country_map = {
            "india": "India",
            "bharat": "India",
            "china": "China",
            "prc": "China",
            "usa": "United States",
            "united states": "United States",
            "america": "United States",
            "germany": "Germany",
            "japan": "Japan",
            "uk": "United Kingdom",
            "united kingdom": "United Kingdom",
            "thailand": "Thailand",
            "vietnam": "Vietnam",
            "italy": "Italy",
            "france": "France"
        }

        matched = country_map.get(text.lower(), text.title() if text else "Unknown")
        status = NormalizationStatus.SUCCESS.value if matched != "Unknown" else NormalizationStatus.PARTIAL.value
        
        return NormalizedValue(
            raw_text=raw_text,
            normalized_value={"country": matched},
            normalization_status=status
        )

    @staticmethod
    def normalize_consumer_care(raw_text: str) -> NormalizedValue:
        """
        Extract structured consumer care components:
        phone/toll-free numbers, email, website URL.
        """
        if not raw_text:
            return NormalizedValue(raw_text=raw_text, normalization_status=NormalizationStatus.FAILED.value)

        phones = re.findall(r'(?:\+?91[\-\s]?)?(?:1800[\-\s]?\d{3}[\-\s]?\d{4}|\d{10}|\d{3,5}[\-\s]\d{6,8})', raw_text)
        emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', raw_text)
        urls = re.findall(r'(?:https?://|www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[^\s]*)?', raw_text)

        result = {
            "phone": phones[0] if phones else None,
            "toll_free": [p for p in phones if '1800' in p] or None,
            "email": emails[0] if emails else None,
            "url": urls[0] if urls else None,
            "raw_contact": raw_text.strip()
        }

        status = NormalizationStatus.SUCCESS.value if (phones or emails or urls) else NormalizationStatus.PARTIAL.value

        return NormalizedValue(
            raw_text=raw_text,
            normalized_value=result,
            normalization_status=status
        )

    @staticmethod
    def normalize_unit_sale_price(raw_text: str) -> NormalizedValue:
        """
        Normalize Unit Sale Price expressions.
        e.g., "₹ 10.00 / 100 g", "Rs 0.25 / ml", "Unit Sale Price: ₹ 2.50 per kg"
        """
        if not raw_text:
            return NormalizedValue(raw_text=raw_text, normalization_status=NormalizationStatus.FAILED.value)

        text = sanitize_ocr_digits(raw_text)

        # Match price amount and unit basis
        usp_pattern = re.compile(
            r'(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:/|per)\s*(\d+(?:\.\d+)?)?\s*([a-zA-Z]+)',
            re.IGNORECASE
        )
        match = usp_pattern.search(text)
        if match:
            amount = float(match.group(1))
            basis_qty = float(match.group(2)) if match.group(2) else 1.0
            basis_unit = match.group(3).lower()

            return NormalizedValue(
                raw_text=raw_text,
                normalized_value={
                    "amount": round(amount, 2),
                    "currency": "INR",
                    "unit_basis_quantity": basis_qty,
                    "unit_basis_unit": basis_unit
                },
                normalization_status=NormalizationStatus.SUCCESS.value
            )

        # Fallback to simple amount extraction
        mrp_norm = ValueNormalizer.normalize_mrp(raw_text)
        if mrp_norm.normalization_status == NormalizationStatus.SUCCESS.value:
            return NormalizedValue(
                raw_text=raw_text,
                normalized_value={
                    "amount": mrp_norm.normalized_value["amount"],
                    "currency": "INR",
                    "unit_basis_quantity": 1.0,
                    "unit_basis_unit": "item"
                },
                normalization_status=NormalizationStatus.PARTIAL.value
            )

        return NormalizedValue(
            raw_text=raw_text,
            normalized_value=None,
            normalization_status=NormalizationStatus.FAILED.value
        )
