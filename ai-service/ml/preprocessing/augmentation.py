"""
Training-Only Image Augmentation Module
Applies realistic packaging image transformations (rotation, brightness/contrast jitter, noise, JPEG compression)
strictly during model training. Never applied to validation or test evaluation sets.
"""

import random
import numpy as np
import cv2
from PIL import Image, ImageEnhance
from typing import Union

def get_training_augmentation(
    image: Union[np.ndarray, Image.Image],
    max_rotation_deg: float = 10.0,
    brightness_range: tuple = (0.8, 1.2),
    contrast_range: tuple = (0.8, 1.2),
    noise_prob: float = 0.3,
    jpeg_quality_range: tuple = (60, 95),
    is_training: bool = True
) -> Union[np.ndarray, Image.Image]:
    """
    Apply training-only augmentations. Returns original image unchanged if is_training is False.
    """
    if not is_training:
        return image

    is_pil = isinstance(image, Image.Image)
    if is_pil:
        pil_img = image.copy()
    else:
        pil_img = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

    # 1. Random Small Rotation (-10° to +10°)
    if max_rotation_deg > 0:
        angle = random.uniform(-max_rotation_deg, max_rotation_deg)
        pil_img = pil_img.rotate(angle, resample=Image.BICUBIC, expand=False)

    # 2. Brightness Jitter
    if brightness_range:
        factor = random.uniform(*brightness_range)
        pil_img = ImageEnhance.Brightness(pil_img).enhance(factor)

    # 3. Contrast Jitter
    if contrast_range:
        factor = random.uniform(*contrast_range)
        pil_img = ImageEnhance.Contrast(pil_img).enhance(factor)

    # 4. Mild Noise (Gaussian)
    if random.random() < noise_prob:
        img_arr = np.array(pil_img, dtype=np.float32)
        noise = np.random.normal(0, 5.0, img_arr.shape)
        img_arr = np.clip(img_arr + noise, 0, 255).astype(np.uint8)
        pil_img = Image.fromarray(img_arr)

    # 5. JPEG Compression Artifact Simulation
    if jpeg_quality_range:
        import io
        quality = random.randint(*jpeg_quality_range)
        buffer = io.BytesIO()
        pil_img.save(buffer, format="JPEG", quality=quality)
        buffer.seek(0)
        pil_img = Image.open(buffer)

    if is_pil:
        return pil_img
    else:
        return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
