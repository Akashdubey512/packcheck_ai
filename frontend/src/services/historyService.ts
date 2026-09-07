import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isDemoMode } from '@/app/config/env';
import { HistoryResponse, HistoryItem } from '@/types/history';

export interface HistoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const MOCK_HISTORY_DATABASE: HistoryItem[] = [
  {
    id: 'hist_001',
    scanId: 'scn_sample_cereal_violations',
    productName: 'Apex Fortified Multi-Grain Flakes 500g',
    gtin: '8901030829104',
    status: 'violation',
    timestamp: '2026-09-07T10:14:00Z',
    violationCount: 2,
    complianceScore: 68.5,
    scannedBy: 'Insp. R. Sharma (LMO-8912)',
    category: 'Packaged Food / Cereals',
    batchNumber: 'LOT-2026-X89',
  },
  {
    id: 'hist_002',
    scanId: 'scn_sample_dairy_compliant',
    productName: 'Apex Standardized Pasteurized Milk 1L',
    gtin: '8901030999011',
    status: 'compliant',
    timestamp: '2026-09-07T09:30:00Z',
    violationCount: 0,
    complianceScore: 98.5,
    scannedBy: 'Insp. R. Sharma (LMO-8912)',
    category: 'Dairy Products',
    batchNumber: 'MLK-882-A',
  },
  {
    id: 'hist_003',
    scanId: 'scn_sample_tea_review',
    productName: 'Botanical Herbal Green Tea 100g',
    gtin: '8901030999035',
    status: 'review',
    timestamp: '2026-09-06T16:45:00Z',
    violationCount: 0,
    complianceScore: 84.0,
    scannedBy: 'Insp. A. Patel (LMO-4410)',
    category: 'Beverages',
    batchNumber: 'TEA-412-F',
  },
  {
    id: 'hist_004',
    scanId: 'scn_sample_oil_01',
    productName: 'Cold-Pressed Groundnut Cooking Oil 1L',
    gtin: '8901030554101',
    status: 'compliant',
    timestamp: '2026-09-06T14:20:00Z',
    violationCount: 0,
    complianceScore: 99.0,
    scannedBy: 'Insp. R. Sharma (LMO-8912)',
    category: 'Edible Oils',
    batchNumber: 'OIL-2026-091',
  },
  {
    id: 'hist_005',
    scanId: 'scn_sample_biscuit_01',
    productName: 'Digestive Oat & Honey Cookies 250g',
    gtin: '8901030778192',
    status: 'violation',
    timestamp: '2026-09-05T11:00:00Z',
    violationCount: 1,
    complianceScore: 74.0,
    scannedBy: 'Insp. M. Joshi (LMO-1092)',
    category: 'Packaged Snacks',
    batchNumber: 'CK-9918-B',
  },
  {
    id: 'hist_006',
    scanId: 'scn_sample_infant_01',
    productName: 'Stage 1 Infant Follow-up Formula 400g',
    gtin: '8901030112948',
    status: 'compliant',
    timestamp: '2026-09-04T15:30:00Z',
    violationCount: 0,
    complianceScore: 100.0,
    scannedBy: 'Insp. R. Sharma (LMO-8912)',
    category: 'Infant Nutrition',
    batchNumber: 'INF-400-88',
  },
  {
    id: 'hist_007',
    scanId: 'scn_sample_spice_01',
    productName: 'Pure Turmeric Root Powder 500g',
    gtin: '8901030441209',
    status: 'compliant',
    timestamp: '2026-09-03T09:10:00Z',
    violationCount: 0,
    complianceScore: 97.0,
    scannedBy: 'Insp. A. Patel (LMO-4410)',
    category: 'Packaged Food / Cereals',
    batchNumber: 'TUR-2026-01',
  },
];

export const HistoryService = {
  async getHistory(params: HistoryQueryParams = {}): Promise<HistoryResponse> {
    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const page = params.page || 1;
      const limit = params.limit || 10;
      let filtered = [...MOCK_HISTORY_DATABASE];

      // Filter by Search Query
      if (params.search && params.search.trim()) {
        const query = params.search.toLowerCase().trim();
        filtered = filtered.filter(
          (item) =>
            item.productName.toLowerCase().includes(query) ||
            item.gtin.toLowerCase().includes(query) ||
            item.scanId.toLowerCase().includes(query) ||
            (item.batchNumber && item.batchNumber.toLowerCase().includes(query))
        );
      }

      // Filter by Status
      if (params.status && params.status.trim()) {
        filtered = filtered.filter((item) => item.status === params.status);
      }

      // Filter by Category
      if (params.category && params.category.trim()) {
        filtered = filtered.filter((item) => item.category === params.category);
      }

      // Filter by Start Date (e.g. YYYY-MM-DD)
      if (params.startDate && params.startDate.trim()) {
        const startTime = new Date(params.startDate).getTime();
        if (!isNaN(startTime)) {
          filtered = filtered.filter((item) => new Date(item.timestamp).getTime() >= startTime);
        }
      }

      // Filter by End Date (e.g. YYYY-MM-DD end of day)
      if (params.endDate && params.endDate.trim()) {
        const endObj = new Date(params.endDate);
        if (!isNaN(endObj.getTime())) {
          endObj.setHours(23, 59, 59, 999);
          filtered = filtered.filter((item) => new Date(item.timestamp).getTime() <= endObj.getTime());
        }
      }

      // Sorting
      const sortBy = params.sortBy || 'timestamp';
      const sortOrder = params.sortOrder || 'desc';

      filtered.sort((a, b) => {
        let comp = 0;
        if (sortBy === 'complianceScore') {
          comp = a.complianceScore - b.complianceScore;
        } else if (sortBy === 'violationCount') {
          comp = a.violationCount - b.violationCount;
        } else if (sortBy === 'productName') {
          comp = a.productName.localeCompare(b.productName);
        } else {
          // default timestamp
          comp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        }
        return sortOrder === 'desc' ? -comp : comp;
      });

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const startIndex = (page - 1) * limit;
      const items = filtered.slice(startIndex, startIndex + limit);

      return {
        items,
        total,
        page,
        limit,
        totalPages,
      };
    }

    return apiClient.get<HistoryResponse>(API_ENDPOINTS.HISTORY.LIST, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  },
};
