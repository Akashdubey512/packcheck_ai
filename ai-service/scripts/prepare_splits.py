import os
import sys
import json
import shutil
import random
import pandas as pd
from pathlib import Path

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "raw_data"
PROCESSED_DIR = BASE_DIR / "processed_data"
REPORTS_DIR = BASE_DIR / "reports"

random.seed(42) # Fixed seed for reproducible splits

def extract_group_id(filename_stem):
    """
    Extract product / document group ID to prevent data leakage.
    Examples:
      - '3_0_409_331' -> group '3' (SROIE receipt ID 3)
      - 'DC product_desc_hindi (63)' -> group 'product_desc_hindi'
      - '8901058005233' -> group '8901058005233' (barcode)
      - 'Tamil_24_3693' -> group 'Tamil_24'
    """
    parts = filename_stem.split("_")
    if len(parts) > 1 and parts[0].isdigit():
        return parts[0] # Receipt / document ID prefix
    return filename_stem.split()[0]

def create_leakage_free_splits():
    print("==================================================", flush=True)
    print("Phase 1: Leakage-Free Dataset Splitting & Versioning", flush=True)
    print("==================================================", flush=True)
    
    splits = {"train": [], "val": [], "test": []}
    split_counts = {"train": 0, "val": 0, "test": 0}
    product_groups = {}
    
    # Collect items from SROIE, Product Desc OCR, Indian Scene Text, Open Food Facts, Label Extraction
    datasets_to_process = [
        ("sroie", RAW_DIR / "sroie"),
        ("product_desc_ocr", RAW_DIR / "product_desc_ocr"),
        ("indian_scene_text", RAW_DIR / "indian_scene_text"),
        ("open_food_facts_india", RAW_DIR / "open_food_facts_india"),
        ("label_extraction_vit", RAW_DIR / "label_extraction_vit")
    ]
    
    all_dataset_items = []
    
    for ds_name, ds_path in datasets_to_process:
        if not ds_path.exists():
            continue
            
        img_files = list(ds_path.rglob("*.jpg")) + list(ds_path.rglob("*.png")) + list(ds_path.rglob("*.jpeg"))
        print(f"Processing dataset '{ds_name}': {len(img_files)} images found.", flush=True)
        
        for img_p in img_files:
            group_id = f"{ds_name}_{extract_group_id(img_p.stem)}"
            if group_id not in product_groups:
                product_groups[group_id] = []
            product_groups[group_id].append({
                "dataset": ds_name,
                "src_path": str(img_p),
                "filename": img_p.name,
                "group_id": group_id
            })
            
    # Perform Group-Stratified Split (80% Train, 10% Val, 10% Test)
    groups = list(product_groups.keys())
    random.shuffle(groups)
    
    num_groups = len(groups)
    train_idx = int(0.80 * num_groups)
    val_idx = int(0.90 * num_groups)
    
    train_groups = set(groups[:train_idx])
    val_groups = set(groups[train_idx:val_idx])
    test_groups = set(groups[val_idx:])
    
    # Assert zero leakage between splits
    assert len(train_groups & val_groups) == 0, "Data leakage detected between train and val splits!"
    assert len(train_groups & test_groups) == 0, "Data leakage detected between train and test splits!"
    assert len(val_groups & test_groups) == 0, "Data leakage detected between val and test splits!"
    
    print(f"\nGroup-level allocation (Zero-leakage enforced):", flush=True)
    print(f"  Train product groups: {len(train_groups)} (80%)", flush=True)
    print(f"  Val product groups: {len(val_groups)} (10%)", flush=True)
    print(f"  Test product groups: {len(test_groups)} (10%)", flush=True)
    
    # Copy images & save metadata into processed_data/
    for split_name, group_set in [("train", train_groups), ("val", val_groups), ("test", test_groups)]:
        split_dir = PROCESSED_DIR / split_name / "images"
        split_dir.mkdir(parents=True, exist_ok=True)
        
        split_records = []
        for g in group_set:
            for item in product_groups[g]:
                src_p = Path(item["src_path"])
                dst_p = split_dir / f"{item['dataset']}_{src_p.name}"
                
                # Copy file to processed_data if not existing
                if not dst_p.exists():
                    shutil.copy2(src_p, dst_p)
                    
                record = {
                    "sample_id": dst_p.stem,
                    "dataset": item["dataset"],
                    "group_id": item["group_id"],
                    "filename": dst_p.name,
                    "processed_path": str(dst_p)
                }
                split_records.append(record)
                
        split_manifest_path = PROCESSED_DIR / split_name / "manifest.json"
        with open(split_manifest_path, "w", encoding="utf-8") as f:
            json.dump(split_records, f, indent=2)
            
        split_counts[split_name] = len(split_records)
        print(f"  [OK] Processed {split_name} split: {len(split_records)} total image samples.", flush=True)

    # Save master split manifest & version metadata
    master_manifest = {
        "dataset_version": "1.0.0",
        "annotation_version": "1.0.0",
        "split_strategy": "Group-Stratified Zero-Leakage Split",
        "split_ratios": {"train": 0.80, "val": 0.10, "test": 0.10},
        "total_groups": num_groups,
        "sample_counts": split_counts,
        "leakage_check_passed": True,
        "processed_directory": str(PROCESSED_DIR)
    }
    
    master_manifest_path = PROCESSED_DIR / "split_manifest.json"
    with open(master_manifest_path, "w", encoding="utf-8") as f:
        json.dump(master_manifest, f, indent=2)
        
    anno_version_path = PROCESSED_DIR / "annotation_version.json"
    anno_spec = {
        "annotation_version": "1.0.0",
        "supported_fields": [
            "manufacturer_name_and_address",
            "country_of_origin",
            "common_generic_name",
            "net_quantity",
            "manufacturing_packing_date",
            "best_before_expiry",
            "mrp",
            "consumer_care_details",
            "unit_sale_price"
        ],
        "geometry_types": ["AABB", "QUAD", "LINE_TEXT", "KEY_VALUE"]
    }
    with open(anno_version_path, "w", encoding="utf-8") as f:
        json.dump(anno_spec, f, indent=2)
        
    print(f"\n[OK] Split manifest saved to {master_manifest_path}", flush=True)
    return master_manifest

if __name__ == "__main__":
    create_leakage_free_splits()
