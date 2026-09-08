"""
Leakage-Free Ground Truth Split Generator
Groups annotations strictly by product_id so images of the same product never cross train/val/test boundaries.
"""

import json
import random
from pathlib import Path
from typing import Dict, List, Any

GT_DIR = Path(__file__).parent
ANNOTATIONS_DIR = GT_DIR / "annotations"
SPLITS_DIR = GT_DIR / "splits"

def generate_splits(
    annotations_path: Path = ANNOTATIONS_DIR,
    output_path: Path = SPLITS_DIR,
    train_ratio: float = 0.8,
    val_ratio: float = 0.1,
    test_ratio: float = 0.1,
    seed: int = 42
) -> Dict[str, List[str]]:
    """Generate product-grouped train, validation, and test split manifests."""
    output_path.mkdir(parents=True, exist_ok=True)
    random.seed(seed)

    anno_files = list(annotations_path.glob("*.json"))
    product_map: Dict[str, List[Path]] = {}

    for f_path in anno_files:
        try:
            with open(f_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                p_id = data.get("product_id", f_path.stem)
                if p_id not in product_map:
                    product_map[p_id] = []
                product_map[p_id].append(f_path)
        except Exception:
            continue

    product_ids = sorted(list(product_map.keys()))
    random.shuffle(product_ids)

    n_total = len(product_ids)
    n_train = int(n_total * train_ratio)
    n_val = int(n_total * val_ratio)

    train_pids = set(product_ids[:n_train])
    val_pids = set(product_ids[n_train:n_train + n_val])
    test_pids = set(product_ids[n_train + n_val:])

    splits = {"train": [], "val": [], "test": []}

    for p_id, files in product_map.items():
        rel_files = [f.name for f in files]
        if p_id in train_pids:
            splits["train"].extend(rel_files)
        elif p_id in val_pids:
            splits["val"].extend(rel_files)
        else:
            splits["test"].extend(rel_files)

    manifest_path = output_path / "split_manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump({
            "split_generator_version": "1.0.0",
            "seed": seed,
            "product_count": n_total,
            "splits": splits
        }, f, indent=2)

    print(f"[OK] Ground truth split manifest created at: {manifest_path}")
    return splits

if __name__ == "__main__":
    generate_splits()
