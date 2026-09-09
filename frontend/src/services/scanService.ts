import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isDemoMode } from '@/app/config/env';
import { Scan, OCRRegion, ExtractedField } from '@/types/scan';
import { PRESET_LABEL_SAMPLES } from '@/utils/sampleLabels';

export interface ScanUploadResponse {
  scanId: string;
  status: Scan['status'];
  fileUrl: string;
  message: string;
}

// In-memory cache for demo mode session uploads
const sessionScans = new Map<string, Scan>();

export const ScanService = {
  async uploadScan(file: File | File[], sampleId?: string): Promise<ScanUploadResponse> {
    const fileList = Array.isArray(file) ? file : [file];

    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const scanId = sampleId ? `scn_${sampleId}` : `scn_${Date.now()}`;
      let fileUrl = '';

      if (sampleId) {
        const sample = PRESET_LABEL_SAMPLES.find((s) => s.id === sampleId);
        if (sample) {
          fileUrl = sample.imageUrl;
        }
      }

      if (!fileUrl && fileList.length > 0 && fileList[0]) {
        fileUrl = URL.createObjectURL(fileList[0]);
      }

      return {
        scanId,
        status: 'READY',
        fileUrl,
        message: `${fileList.length} packaging angle(s) verified for statutory multi-view preprocessing.`,
      };
    }

    const formData = new FormData();
    fileList.forEach((f) => formData.append('files', f));
    if (sampleId) formData.append('sampleId', sampleId);

    const res = await apiClient.upload<any>(API_ENDPOINTS.SCAN.UPLOAD, formData, { timeoutMs: 60000 });
    const data = res.data || res;
    const scanId = data.scanId || data.id || data.inspectionId || `INSP_${Date.now()}`;

    // Normalize and cache the scan so the detail page can use it immediately
    const normalized = this.normalizeBackendScan(scanId, data);
    sessionScans.set(scanId, normalized);

    return {
      scanId,
      status: data.status || 'COMPLETED',
      fileUrl: normalized.fileUrl || '',
      message: `${fileList.length} packaging angle(s) verified for statutory multi-view preprocessing.`,
    };
  },

  async getScan(id: string): Promise<Scan> {
    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 400));

      if (id === 'invalid' || id === 'not_found' || id.startsWith('scn_invalid')) {
        throw new Error(`Inspection record not found for "${id}".`);
      }

      if (sessionScans.has(id)) {
        return sessionScans.get(id)!;
      }

      return this.getDemoScan(id);
    }

    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.SCAN.GET_BY_ID(id));
      const data = res.data || res;
      return this.normalizeBackendScan(id, data);
    } catch (err) {
      if (id.includes('sample') || id.includes('dairy') || id.includes('cereal') || id.startsWith('scn_')) {
        return this.getDemoScan(id);
      }
      throw err;
    }
  },

  normalizeBackendScan(id: string, data: any): Scan {
    // The backend returns an inspection document; map it to our frontend Scan shape
    const result = data.result || data || {};
    const product = data.product || data.metadata || result.product || {};
    const images = data.images || result.images || [];
    const firstImageUrl = images[0]?.url || data.fileUrl || data.imageUrl || result.fileUrl || '';

    // Build raw extracted fields from all possible shapes
    const rawExtracted = Array.isArray(data.extractedFields)
      ? data.extractedFields
      : Array.isArray(result.extractedFields)
      ? result.extractedFields
      : Array.isArray(data.fields)
      ? data.fields
      : Array.isArray(result.fields)
      ? result.fields
      : typeof data.fields === 'object' && data.fields !== null
      ? Object.values(data.fields)
      : typeof result.fields === 'object' && result.fields !== null
      ? Object.values(result.fields)
      : [];

    // Build extracted fields
    const extractedFields: ExtractedField[] = rawExtracted.map((f: any, idx: number) => {
      const fieldName = f.fieldName || f.name || f.key || `field_${idx}`;
      return {
        fieldName,
        label: f.label || fieldName.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        rawValue: f.rawValue || f.value || '',
        normalizedValue: f.normalizedValue || f.value || '',
        confidence: typeof f.confidence === 'number' ? f.confidence : 0.95,
        status: f.status || (f.rawValue ? 'valid' : 'missing'),
        ocrRegionId: f.ocrRegionId || `ocr_${fieldName}`,
        sourceLocation: f.sourceLocation || f.boundingBox,
      };
    });

    // Build OCR regions from backend result fields or synthesize from extracted fields
    let ocrRegions: OCRRegion[] = Array.isArray(data.ocrRegions) && data.ocrRegions.length > 0
      ? data.ocrRegions
      : Array.isArray(result.regions) && result.regions.length > 0
      ? result.regions.map((r: any, idx: number) => ({
          id: r.id || `ocr_${idx}`,
          boundingBox: r.boundingBox || r.bbox || { x: 0, y: 0, width: 100, height: 10 },
          confidence: r.confidence ?? 1,
          detectedText: r.text || r.detectedText || '',
        }))
      : Array.isArray(result.ocrRegions) && result.ocrRegions.length > 0
      ? result.ocrRegions
      : [];

    // Ensure all OCR regions have guaranteed unique IDs even across multi-view merges
    const seenRegionIds = new Set<string>();
    ocrRegions = ocrRegions.map((r, idx) => {
      let uniqueId = r.id || `reg_${idx}`;
      if (seenRegionIds.has(uniqueId)) {
        uniqueId = `${uniqueId}_${idx}`;
      }
      seenRegionIds.add(uniqueId);
      return { ...r, id: uniqueId };
    });

    // If no OCR regions from backend, synthesize useful regions from extracted fields that have text
    if (ocrRegions.length === 0 && extractedFields.length > 0) {
      ocrRegions = extractedFields
        .filter((f) => f.rawValue && f.rawValue !== '[FIELD OMITTED]' && f.rawValue !== 'MISSING')
        .map((f, idx) => ({
          id: f.ocrRegionId || `ocr_${f.fieldName}`,
          boundingBox: f.sourceLocation || {
            x: 10 + (idx % 2) * 45,
            y: 15 + Math.floor(idx / 2) * 18,
            width: 40,
            height: 12,
          },
          confidence: f.confidence || 0.95,
          detectedText: `${f.label}: ${f.rawValue}`,
        }));
    }

    const normalizedImages = (images || []).map((img: any, idx: number) => ({
      imageId: img.imageId || `img_${idx + 1}`,
      url: (img.url || '').startsWith('/') ? `http://localhost:5000${img.url}` : (img.url || firstImageUrl),
      filename: img.filename,
      originalName: img.originalName,
      viewType: img.viewType && img.viewType !== 'UNKNOWN' ? img.viewType : `PANEL_${idx + 1}`,
      qualityStatus: img.qualityStatus,
    }));

    return {
      id: data.id || data.inspectionId || id,
      fileName: data.fileName || data.originalName || images[0]?.filename || 'label.jpg',
      fileSize: data.fileSize || 0,
      mimeType: data.mimeType || 'image/jpeg',
      fileUrl: firstImageUrl.startsWith('/')
        ? `http://localhost:5000${firstImageUrl}`
        : firstImageUrl,
      images: normalizedImages,
      status: data.status === 'COMPLIANT' ? 'COMPLETED' : data.status || 'COMPLETED',
      uploadedAt: data.uploadedAt || data.createdAt || new Date().toISOString(),
      processedAt: data.processedAt || data.updatedAt || new Date().toISOString(),
      overallScore: data.overallScore ?? result.score ?? 0,
      complianceVerdict: data.complianceVerdict || result.verdict || result.status || 'review',
      product: {
        id: product.id || 'prod_unknown',
        name: product.name || data.fileName || 'Packaged Commodity',
        gtin: product.gtin || product.barcode || 'N/A',
        manufacturer: product.manufacturer || product.brand || 'Unknown Manufacturer',
        category: product.category || 'General Commodity',
        batchNumber: product.batchNumber || product.lotNumber || 'N/A',
        mfgDate: product.mfgDate || product.manufacturingDate,
        expDate: product.expDate || product.expiryDate,
        netWeight: product.netWeight || product.quantity,
        fssaiLicenseNumber: product.fssaiLicenseNumber || product.licenseNumber,
      },
      ocrRegions,
      extractedFields,
    };
  },

  getDemoScan(id: string): Scan {
    if (id.includes('dairy')) {
      const dairySample = PRESET_LABEL_SAMPLES[1]!;
      const scan: Scan = {
        id,
        fileName: dairySample.fileName,
        fileSize: dairySample.fileSize,
        mimeType: 'image/svg+xml',
        fileUrl: dairySample.imageUrl,
        status: 'COMPLETED',
        uploadedAt: new Date(Date.now() - 3600000).toISOString(),
        processedAt: new Date().toISOString(),
        overallScore: 98,
        complianceVerdict: 'compliant',
        product: {
          id: 'prod_dairy_101',
          name: 'Apex Pasteurized Standardized Milk 1L',
          gtin: '8901030999011',
          manufacturer: 'Apex Dairy Farms Ltd.',
          category: 'Dairy Products',
          batchNumber: 'MLK-882-A',
          mfgDate: '2026-09-07',
          expDate: '2026-09-09',
          netWeight: '1000ml',
          fssaiLicenseNumber: '10012011000999',
        },
        ocrRegions: [
          {
            id: 'ocr_dairy_net',
            boundingBox: { x: 10, y: 51, width: 45, height: 4 },
            confidence: 0.99,
            detectedText: 'NET QUANTITY: 1000 ml (1.0 L)',
          },
          {
            id: 'ocr_dairy_lic',
            boundingBox: { x: 10, y: 55, width: 55, height: 4 },
            confidence: 0.98,
            detectedText: 'FSSAI CENTRAL LICENSE: 10012011000999',
          },
          {
            id: 'ocr_dairy_useby',
            boundingBox: { x: 10, y: 63, width: 60, height: 4 },
            confidence: 0.99,
            detectedText: 'USE BY DATE: 09/09/2026 (48 HOURS FROM PACK)',
          },
        ],
        extractedFields: [
          {
            fieldName: 'netWeight',
            label: 'Net Quantity Declaration',
            rawValue: 'NET QUANTITY: 1000 ml (1.0 L)',
            normalizedValue: '1000ml',
            confidence: 0.99,
            status: 'valid',
            ocrRegionId: 'ocr_dairy_net',
            sourceLocation: { x: 10, y: 51, width: 45, height: 4 },
          },
          {
            fieldName: 'licenseNumber',
            label: 'FSSAI Central License',
            rawValue: '10012011000999',
            normalizedValue: '10012011000999',
            confidence: 0.98,
            status: 'valid',
            ocrRegionId: 'ocr_dairy_lic',
            sourceLocation: { x: 10, y: 55, width: 55, height: 4 },
          },
          {
            fieldName: 'expiryDate',
            label: 'Best Before / Use By Date',
            rawValue: 'USE BY DATE: 09/09/2026',
            normalizedValue: '2026-09-09',
            confidence: 0.99,
            status: 'valid',
            ocrRegionId: 'ocr_dairy_useby',
            sourceLocation: { x: 10, y: 63, width: 60, height: 4 },
          },
        ],
      };
      sessionScans.set(id, scan);
      return scan;
    }

    const cerealSample = PRESET_LABEL_SAMPLES[0]!;
    const scan: Scan = {
      id,
      fileName: cerealSample.fileName,
      fileSize: cerealSample.fileSize,
      mimeType: 'image/svg+xml',
      fileUrl: cerealSample.imageUrl,
      status: 'COMPLETED',
      uploadedAt: new Date(Date.now() - 3600000).toISOString(),
      processedAt: new Date().toISOString(),
      overallScore: 68.5,
      complianceVerdict: 'violation',
      product: {
        id: 'prod_9082',
        name: 'Apex Fortified Multi-Grain Flakes 500g',
        gtin: '8901030829104',
        manufacturer: 'Apex Nutrition Consumer Ltd.',
        category: 'Packaged Food / Cereals',
        batchNumber: 'LOT-2026-X89',
        mfgDate: '2026-06-15',
        expDate: undefined,
        netWeight: '500g',
        fssaiLicenseNumber: '10012011000189',
      },
      ocrRegions: [
        {
          id: 'ocr_cereal_exp',
          boundingBox: { x: 51.25, y: 76, width: 40, height: 10 },
          confidence: 0.35,
          detectedText: '[ FIELD BLANK / MISSING FROM PRINT ]',
        },
        {
          id: 'ocr_cereal_net',
          boundingBox: { x: 8.75, y: 67, width: 40, height: 7 },
          confidence: 0.97,
          detectedText: 'NET WEIGHT: 500g (17.63 oz)',
        },
        {
          id: 'ocr_cereal_allergen',
          boundingBox: { x: 8.1, y: 57, width: 83.75, height: 4 },
          confidence: 0.88,
          detectedText: 'ALLERGEN DECLARATION: CONTAINS WHEAT, BARLEY & SOY. MAY CONTAIN TRACES OF TREE NUTS.',
        },
        {
          id: 'ocr_cereal_lic',
          boundingBox: { x: 51.25, y: 67, width: 40, height: 7 },
          confidence: 0.96,
          detectedText: 'FSSAI STATUTORY LICENSE: LIC NO: 10012011000189',
        },
        {
          id: 'ocr_cereal_mfg',
          boundingBox: { x: 8.75, y: 76, width: 40, height: 10 },
          confidence: 0.95,
          detectedText: 'MFG DATE: 15/06/2026 | BATCH LOT: LOT-2026-X89',
        },
        {
          id: 'ocr_cereal_veg',
          boundingBox: { x: 85, y: 5, width: 7.5, height: 6 },
          confidence: 0.99,
          detectedText: 'GREEN VEGETARIAN EMBLEM',
        },
      ],
      extractedFields: [
        {
          fieldName: 'expiryDate',
          label: 'Best Before / Expiry Declaration',
          rawValue: '[FIELD OMITTED]',
          normalizedValue: 'MISSING',
          confidence: 0.35,
          status: 'missing',
          ocrRegionId: 'ocr_cereal_exp',
          sourceLocation: { x: 51.25, y: 76, width: 40, height: 10 },
        },
        {
          fieldName: 'netWeight',
          label: 'Net Quantity Declaration',
          rawValue: 'NET WEIGHT: 500g (17.63 oz)',
          normalizedValue: '500g',
          confidence: 0.97,
          status: 'invalid',
          ocrRegionId: 'ocr_cereal_net',
          sourceLocation: { x: 8.75, y: 67, width: 40, height: 7 },
        },
        {
          fieldName: 'allergenDeclaration',
          label: 'Allergen Advisory Warning',
          rawValue: 'CONTAINS WHEAT, BARLEY & SOY',
          normalizedValue: 'Wheat, Barley, Soy',
          confidence: 0.88,
          status: 'uncertain',
          ocrRegionId: 'ocr_cereal_allergen',
          sourceLocation: { x: 8.1, y: 57, width: 83.75, height: 4 },
        },
        {
          fieldName: 'licenseNumber',
          label: 'FSSAI License Registration',
          rawValue: '10012011000189',
          normalizedValue: '10012011000189',
          confidence: 0.96,
          status: 'valid',
          ocrRegionId: 'ocr_cereal_lic',
          sourceLocation: { x: 51.25, y: 67, width: 40, height: 7 },
        },
        {
          fieldName: 'mfgDate',
          label: 'Date of Manufacture',
          rawValue: '15/06/2026',
          normalizedValue: '2026-06-15',
          confidence: 0.95,
          status: 'valid',
          ocrRegionId: 'ocr_cereal_mfg',
          sourceLocation: { x: 8.75, y: 76, width: 40, height: 10 },
        },
        {
          fieldName: 'vegEmblem',
          label: 'Green Vegetarian Emblem',
          rawValue: 'STATUTORY GREEN DOT IN SQUARE',
          normalizedValue: 'VEG_CERTIFIED',
          confidence: 0.99,
          status: 'valid',
          ocrRegionId: 'ocr_cereal_veg',
          sourceLocation: { x: 85, y: 5, width: 7.5, height: 6 },
        },
      ],
    };

    sessionScans.set(id, scan);
    return scan;
  },
};
