import { describe, it, expect } from 'vitest';
import { HistoryService } from '../src/services/historyService';

describe('HistoryService', () => {
  it('fetches default paginated inspection history', async () => {
    const res = await HistoryService.getHistory({ page: 1, limit: 5 });

    expect(res.items.length).toBeLessThanOrEqual(5);
    expect(res.page).toBe(1);
    expect(res.limit).toBe(5);
    expect(res.total).toBeGreaterThan(0);
    expect(res.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('filters history by search query for product name or GTIN', async () => {
    const res = await HistoryService.getHistory({ search: 'Apex Standardized' });

    expect(res.items.length).toBeGreaterThanOrEqual(1);
    expect(res.items[0]!.productName).toContain('Apex Standardized');
  });

  it('filters history by compliance status', async () => {
    const res = await HistoryService.getHistory({ status: 'violation' });

    expect(res.items.length).toBeGreaterThanOrEqual(1);
    expect(res.items.every((item) => item.status === 'violation')).toBe(true);
  });

  it('filters history by commodity category', async () => {
    const res = await HistoryService.getHistory({ category: 'Dairy Products' });

    expect(res.items.length).toBeGreaterThanOrEqual(1);
    expect(res.items.every((item) => item.category === 'Dairy Products')).toBe(true);
  });

  it('sorts history by compliance score in ascending and descending order', async () => {
    const ascRes = await HistoryService.getHistory({ sortBy: 'complianceScore', sortOrder: 'asc' });
    const descRes = await HistoryService.getHistory({ sortBy: 'complianceScore', sortOrder: 'desc' });

    expect(ascRes.items[0]!.complianceScore).toBeLessThanOrEqual(
      ascRes.items[ascRes.items.length - 1]!.complianceScore
    );
    expect(descRes.items[0]!.complianceScore).toBeGreaterThanOrEqual(
      descRes.items[descRes.items.length - 1]!.complianceScore
    );
  });
});
