import os
import sys
import json
import hashlib
import numpy as np
import pandas as pd
from pathlib import Path
from PIL import Image, ImageFile
import imagehash

# Allow loading truncated images for audit checks
ImageFile.LOAD_TRUNCATED_IMAGES = True

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "raw_data"
REPORTS_DIR = BASE_DIR / "reports"

def compute_md5(filepath):
    hasher = hashlib.md5()
    with open(filepath, 'rb') as f:
        buf = f.read(65536)
        while len(buf) > 0:
            hasher.update(buf)
            buf = f.read(65536)
    return hasher.hexdigest()

def compute_dhash(filepath):
    try:
        with Image.open(filepath) as img:
            return str(imagehash.dhash(img))
    except Exception:
        return None

def inspect_image_file(img_path):
    try:
        with Image.open(img_path) as img:
            img.verify() # Verify file header & structure
        with Image.open(img_path) as img:
            w, h = img.size
            mode = img.mode
            channels = len(img.getbands())
            return {
                "valid": True,
                "width": w,
                "height": h,
                "channels": channels,
                "mode": mode,
                "aspect_ratio": round(w / float(h), 4) if h > 0 else 0
            }
    except Exception as e:
        return {
            "valid": False,
            "error": str(e)
        }

def audit_dataset_folder(dataset_name, dataset_path):
    print(f"\n--- Auditing Dataset: {dataset_name} ---")
    
    all_files = list(dataset_path.rglob("*"))
    file_count = len([f for f in all_files if f.is_file()])
    
    format_counts = {}
    image_files = []
    annotation_files = []
    
    image_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff"}
    anno_exts = {".json", ".txt", ".csv", ".xml", ".yaml", ".yml"}
    
    for f in all_files:
        if f.is_file():
            ext = f.suffix.lower()
            format_counts[ext] = format_counts.get(ext, 0) + 1
            if ext in image_exts:
                image_files.append(f)
            elif ext in anno_exts:
                annotation_files.append(f)
                
    # Image inspection
    valid_images = 0
    corrupted_images = 0
    widths = []
    heights = []
    channels_list = []
    aspect_ratios = []
    md5_hashes = {}
    exact_duplicates = 0
    dhashes = {}
    near_duplicates = 0
    
    print(f"  Total files: {file_count}")
    print(f"  Image files found: {len(image_files)}")
    print(f"  Annotation/Text files found: {len(annotation_files)}")
    print(f"  File extensions breakdown: {format_counts}")
    
    for img_p in image_files:
        info = inspect_image_file(img_p)
        if info["valid"]:
            valid_images += 1
            widths.append(info["width"])
            heights.append(info["height"])
            channels_list.append(info["channels"])
            aspect_ratios.append(info["aspect_ratio"])
            
            # Duplicate checks (MD5)
            file_md5 = compute_md5(img_p)
            if file_md5 in md5_hashes:
                exact_duplicates += 1
            else:
                md5_hashes[file_md5] = str(img_p)
                
            # Near duplicate check (dhash)
            dh = compute_dhash(img_p)
            if dh:
                if dh in dhashes:
                    near_duplicates += 1
                else:
                    dhashes[dh] = str(img_p)
        else:
            corrupted_images += 1
            
    img_stats = {}
    if widths:
        img_stats = {
            "width_min": int(np.min(widths)),
            "width_max": int(np.max(widths)),
            "width_mean": float(round(np.mean(widths), 2)),
            "width_std": float(round(np.std(widths), 2)),
            "height_min": int(np.min(heights)),
            "height_max": int(np.max(heights)),
            "height_mean": float(round(np.mean(heights), 2)),
            "height_std": float(round(np.std(heights), 2)),
            "channels_min": int(np.min(channels_list)),
            "channels_max": int(np.max(channels_list)),
            "aspect_ratio_min": float(np.min(aspect_ratios)),
            "aspect_ratio_max": float(np.max(aspect_ratios)),
            "aspect_ratio_mean": float(round(np.mean(aspect_ratios), 2))
        }

    audit_result = {
        "dataset_name": dataset_name,
        "dataset_path": str(dataset_path),
        "file_count": file_count,
        "format_distribution": format_counts,
        "total_images": len(image_files),
        "valid_images": valid_images,
        "corrupted_images": corrupted_images,
        "exact_duplicate_images": exact_duplicates,
        "near_duplicate_images": near_duplicates,
        "annotation_files": len(annotation_files),
        "image_statistics": img_stats
    }
    
    print(f"  [OK] Valid images: {valid_images}, Corrupted: {corrupted_images}")
    print(f"  [OK] Exact duplicates (MD5): {exact_duplicates}, Near-duplicates (dhash): {near_duplicates}")
    return audit_result

def run_full_audit():
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    dataset_reports = []
    
    datasets_to_audit = [
        ("Legal Metrology Rules", RAW_DIR / "legal_metrology"),
        ("Open Food Facts (India)", RAW_DIR / "open_food_facts_india"),
        ("SROIE Receipt Dataset", RAW_DIR / "sroie"),
        ("Product Description OCR", RAW_DIR / "product_desc_ocr"),
        ("Indian Scene Text", RAW_DIR / "indian_scene_text"),
        ("CORD-v2 Layout Dataset", RAW_DIR / "cord_v2"),
        ("Label Extraction ViT", RAW_DIR / "label_extraction_vit")
    ]
    
    summary_report = {
        "audit_version": "1.0.0",
        "timestamp": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_datasets_audited": len(datasets_to_audit),
        "datasets": {}
    }
    
    for name, path in datasets_to_audit:
        if path.exists():
            res = audit_dataset_folder(name, path)
            summary_report["datasets"][name] = res
            dataset_reports.append(res)
        else:
            print(f"  ! Path not found: {path}")

    # Save detailed data quality JSON report
    report_json_path = REPORTS_DIR / "data_quality_report.json"
    with open(report_json_path, "w", encoding="utf-8") as f:
        json.dump(summary_report, f, indent=2)
        
    print(f"\n[OK] Data quality audit saved to {report_json_path}")
    return summary_report

if __name__ == "__main__":
    run_full_audit()
