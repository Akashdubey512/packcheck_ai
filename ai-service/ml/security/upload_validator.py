"""
File Upload Security & Validation Module
Enforces strict file upload safeguards:
1. File size limits (Max 20MB)
2. Image resolution limits (Max 8000x8000 pixels / 50 Megapixels)
3. Decompression bomb protection (PIL Image.MAX_IMAGE_PIXELS)
4. Path traversal sanitation (basename restriction)
5. MIME type & header structure verification
"""

import os
from pathlib import Path
from typing import Dict, Any, Tuple
from PIL import Image, ImageFile

# Enforce PIL decompression bomb limit (50 Megapixels)
Image.MAX_IMAGE_PIXELS = 50_000_000
ImageFile.LOAD_TRUNCATED_IMAGES = False

MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/bmp", "image/webp", "image/tiff"}

class SecurityValidationError(Exception):
    """Exception raised when an uploaded file violates security policy."""
    pass

def sanitize_filename(filename: str) -> str:
    """Strip dangerous path traversal characters (../, \\..)."""
    basename = Path(filename).name
    clean_name = "".join(c for c in basename if c.isalnum() or c in (".", "_", "-"))
    if not clean_name or clean_name.startswith("."):
        clean_name = f"safe_upload_{clean_name}"
    return clean_name

def validate_upload_file(file_path: Path) -> Tuple[bool, Dict[str, Any]]:
    """Validate uploaded file security before pipeline ingestion."""
    if not file_path.exists():
        raise SecurityValidationError(f"Uploaded file path does not exist: {file_path}")

    # 1. Size Check
    file_size = file_path.stat().st_size
    if file_size > MAX_FILE_SIZE_BYTES:
        raise SecurityValidationError(
            f"File size exceeds maximum allowed limit ({round(file_size/(1024*1024), 2)}MB > 20MB)"
        )

    # 2. Extension Check
    ext = file_path.suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise SecurityValidationError(
            f"File extension '{ext}' is not permitted. Allowed extensions: {ALLOWED_EXTENSIONS}"
        )

    # 2b. Magic-Byte Header Verification
    MAGIC_BYTES = {
        ".jpg": [b"\xff\xd8\xff"],
        ".jpeg": [b"\xff\xd8\xff"],
        ".png": [b"\x89PNG"],
        ".bmp": [b"BM"],
        ".webp": [b"RIFF"]
    }
    expected_signatures = MAGIC_BYTES.get(ext, [])
    if expected_signatures:
        with open(file_path, "rb") as f:
            header = f.read(8)
            if not any(header.startswith(sig) for sig in expected_signatures):
                raise SecurityValidationError(f"File magic-byte header signature mismatch for extension '{ext}'")

    # 3. PIL Header & Decompression Bomb Verification
    try:
        with Image.open(file_path) as img:
            img.verify()
        with Image.open(file_path) as img:
            w, h = img.size
            pixels = w * h
            if pixels > Image.MAX_IMAGE_PIXELS:
                raise SecurityValidationError(
                    f"Decompression bomb detected! Image resolution ({w}x{h} = {pixels} px) exceeds max safety cap of 50MP."
                )
            return True, {
                "valid": True,
                "width": w,
                "height": h,
                "format": img.format,
                "size_bytes": file_size,
                "clean_filename": sanitize_filename(file_path.name)
            }
    except Exception as e:
        if isinstance(e, SecurityValidationError):
            raise e
        raise SecurityValidationError(f"Invalid image structure or corrupt payload: {str(e)}")
