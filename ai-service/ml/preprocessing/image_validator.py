"""
Image Validator Module
Validates image files against readability, dimension, format, and channel constraints.
Uses explicit error codes without trusting file extensions.
"""

import os
from pathlib import Path
from typing import Dict, Any, List, Union
from PIL import Image, ImageFile

# Allow loading truncated images safely during inspection
ImageFile.LOAD_TRUNCATED_IMAGES = True

class ImageValidationError(Exception):
    """Custom exception raised when image validation encounters unrecoverable errors."""
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message

# Magic bytes signature mapping
MAGIC_BYTES = {
    b'\xff\xd8\xff': "JPEG",
    b'\x89PNG\r\n\x1a\n': "PNG",
    b'BM': "BMP",
    b'RIFF': "WEBP", # RIFF....WEBP
    b'II*\x00': "TIFF", # Little-endian TIFF
    b'MM\x00*': "TIFF"  # Big-endian TIFF
}

def detect_mime_format(filepath: Path) -> Union[str, None]:
    """Detect image format using magic header bytes."""
    try:
        with open(filepath, 'rb') as f:
            header = f.read(12)
            for magic, fmt in MAGIC_BYTES.items():
                if magic == b'RIFF':
                    if header.startswith(b'RIFF') and header[8:12] == b'WEBP':
                        return "WEBP"
                elif header.startswith(magic):
                    return fmt
    except Exception:
        pass
    return None

def validate_image(
    image_input: Union[str, Path, Image.Image],
    min_width: int = 32,
    min_height: int = 32,
    max_width: int = 8000,
    max_height: int = 8000,
    max_pixel_count: int = 50000000,
    allowed_formats: List[str] = None
) -> Dict[str, Any]:
    """
    Validate an image against structural, dimensional, and format constraints.
    
    Returns structured result dict with explicit error codes if invalid.
    """
    if allowed_formats is None:
        allowed_formats = ["JPEG", "PNG", "BMP", "WEBP", "TIFF"]

    warnings: List[str] = []
    errors: List[Dict[str, str]] = []

    # 1. Path/Input Existence Validation
    if isinstance(image_input, (str, Path)):
        img_path = Path(image_input)
        if not img_path.exists() or not img_path.is_file():
            return {
                "valid": False,
                "width": None,
                "height": None,
                "channels": None,
                "color_mode": None,
                "aspect_ratio": None,
                "warnings": warnings,
                "errors": [{"code": "IMAGE_NOT_FOUND", "message": f"Image file not found: {img_path}"}]
            }
            
        detected_fmt = detect_mime_format(img_path)
        
        # 2. File Readability & PIL Verification
        try:
            with Image.open(img_path) as img:
                img.verify()
            with Image.open(img_path) as img:
                w, h = img.size
                mode = img.mode
                bands = img.getbands()
                channels = len(bands)
                format_name = (img.format or detected_fmt or "UNKNOWN").upper()
        except Exception as e:
            return {
                "valid": False,
                "width": None,
                "height": None,
                "channels": None,
                "color_mode": None,
                "aspect_ratio": None,
                "warnings": warnings,
                "errors": [{"code": "IMAGE_UNREADABLE", "message": f"Image file corrupt or unreadable: {str(e)}"}]
            }
    elif isinstance(image_input, Image.Image):
        img = image_input
        w, h = img.size
        mode = img.mode
        bands = img.getbands()
        channels = len(bands)
        format_name = (img.format or "RAW").upper()
    else:
        return {
            "valid": False,
            "width": None,
            "height": None,
            "channels": None,
            "color_mode": None,
            "aspect_ratio": None,
            "warnings": warnings,
            "errors": [{"code": "INVALID_INPUT_TYPE", "message": "Input must be a file path or PIL Image"}]
        }

    aspect_ratio = round(w / float(h), 4) if h > 0 else 0.0
    pixel_count = w * h

    # 3. Format Validation
    if format_name not in allowed_formats and format_name != "RAW":
        warnings.append(f"Image format '{format_name}' is not in standard allowed list ({allowed_formats})")

    # 4. Dimension Constraints
    if w < min_width or h < min_height:
        errors.append({
            "code": "IMAGE_TOO_SMALL",
            "message": f"Dimensions ({w}x{h}) below minimum required ({min_width}x{min_height})"
        })

    if w > max_width or h > max_height or pixel_count > max_pixel_count:
        errors.append({
            "code": "IMAGE_TOO_LARGE",
            "message": f"Dimensions ({w}x{h}, {pixel_count} px) exceed maximum allowed ({max_width}x{max_height}, {max_pixel_count} px)"
        })

    # 5. Channel & Color Mode Analysis
    if channels not in [1, 3, 4]:
        errors.append({
            "code": "UNSUPPORTED_CHANNELS",
            "message": f"Unsupported number of channels: {channels} (mode: {mode})"
        })

    if mode == "RGBA":
        warnings.append("Image contains alpha channel (RGBA); transparency flattening recommended for OCR.")
    elif mode in ["L", "1", "P"]:
        warnings.append(f"Image is in single-channel mode ({mode}).")

    is_valid = len(errors) == 0

    return {
        "valid": is_valid,
        "width": w,
        "height": h,
        "channels": channels,
        "color_mode": mode,
        "aspect_ratio": aspect_ratio,
        "pixel_count": pixel_count,
        "format": format_name,
        "warnings": warnings,
        "errors": errors
    }
