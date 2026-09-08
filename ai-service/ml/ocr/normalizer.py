"""
OCR Text Normalization Module
Performs Unicode and whitespace normalization without destroying raw OCR evidence.
Preserves both raw_text and normalized_text.
"""

import re
import unicodedata
from typing import Tuple

def normalize_ocr_text(raw_text: str) -> str:
    """
    Perform conservative Unicode & whitespace normalization on recognized text.
    
    1. Apply Unicode NFC normalization (combining characters & accents).
    2. Convert non-breaking spaces and irregular whitespace to single standard space.
    3. Strip leading/trailing whitespace.
    """
    if not raw_text:
        return ""

    # 1. Unicode NFC Normalization
    text_nfc = unicodedata.normalize("NFC", raw_text)

    # 2. Replace non-breaking spaces & tabs with space
    text_clean = re.sub(r'[\r\t\f\v]+', ' ', text_nfc)
    text_clean = re.sub(r'\u00a0', ' ', text_clean)

    # 3. Collapse multiple horizontal spaces into one (preserve newlines if multi-line)
    lines = text_clean.split('\n')
    cleaned_lines = [re.sub(r'[ ]+', ' ', line).strip() for line in lines]
    
    return '\n'.join(cleaned_lines)

def process_text_pair(raw_text: str) -> Tuple[str, str]:
    """Return tuple of (raw_text, normalized_text)."""
    if raw_text is None:
        return "", ""
    return raw_text, normalize_ocr_text(raw_text)
