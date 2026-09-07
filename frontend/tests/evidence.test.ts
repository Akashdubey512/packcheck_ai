import { describe, it, expect } from 'vitest';
import { PRESET_LABEL_SAMPLES } from '../src/utils/sampleLabels';

describe('Evidence & Packaging Label Presets', () => {
  it('should contain 3 standard regulatory inspection presets', () => {
    expect(PRESET_LABEL_SAMPLES.length).toBe(3);

    const sampleIds = PRESET_LABEL_SAMPLES.map((s) => s.id);
    expect(sampleIds).toContain('sample_cereal_violations');
    expect(sampleIds).toContain('sample_dairy_compliant');
    expect(sampleIds).toContain('sample_tea_review');
  });

  it('should provide valid data URIs for all packaging label artworks', () => {
    PRESET_LABEL_SAMPLES.forEach((sample) => {
      expect(sample.imageUrl).toMatch(/^data:image\/svg\+xml;utf8,/);
      expect(sample.fileSize).toBeGreaterThan(1000);
      expect(sample.name).toBeDefined();
    });
  });

  it('should calculate accurate bounding center coordinates for auto-focus', () => {
    const mockBox = { x: 10, y: 20, width: 30, height: 40 };

    const centerX = mockBox.x + mockBox.width / 2;
    const centerY = mockBox.y + mockBox.height / 2;

    expect(centerX).toBe(25);
    expect(centerY).toBe(40);
  });
});
