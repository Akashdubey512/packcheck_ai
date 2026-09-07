import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isDemoMode } from '@/app/config/env';
import { Scan } from '@/types/scan';
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
  async uploadScan(file: File, sampleId?: string): Promise<ScanUploadResponse> {
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

      if (!fileUrl) {
        fileUrl = URL.createObjectURL(file);
      }

      return {
        scanId,
        status: 'READY',
        fileUrl,
        message: 'Label artifact uploaded and verified for statutory preprocessing.',
      };
    }

    const formData = new FormData();
    formData.append('file', file);
    if (sampleId) formData.append('sampleId', sampleId);
    return apiClient.upload<ScanUploadResponse>(API_ENDPOINTS.SCAN.UPLOAD, formData);
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

      // Check for Dairy Compliant sample
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

      // Default high-precision Cereal Sample with infractions (Sample A)
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
          expDate: undefined, // Missing!
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
            status: 'invalid', // Font size violation
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
    }

    return apiClient.get<Scan>(API_ENDPOINTS.SCAN.GET_BY_ID(id));
  },
};
