import React from 'react';
import { OCRRegion, ExtractedField } from '@/types/scan';

interface EvidenceOverlayProps {
  regions: OCRRegion[];
  extractedFields: ExtractedField[];
  selectedRegionId: string | null;
  onSelectRegion: (regionId: string) => void;
  showOverlays: boolean;
}

export const EvidenceOverlay: React.FC<EvidenceOverlayProps> = ({
  regions,
  extractedFields,
  selectedRegionId,
  onSelectRegion,
  showOverlays,
}) => {
  if (!showOverlays || regions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {regions.map((region, idx) => {
        const isSelected = selectedRegionId === region.id;
        const matchingField = extractedFields.find((f) => f.ocrRegionId === region.id);

        // Determine status styling
        let statusStyle = 'border-slate-400 bg-slate-500/10 text-slate-800';
        let badgeColor = 'bg-slate-700 text-white';

        if (matchingField) {
          if (matchingField.status === 'invalid' || matchingField.status === 'missing') {
            statusStyle = 'border-violation bg-violation/15 text-violation';
            badgeColor = 'bg-violation text-white';
          } else if (matchingField.status === 'uncertain') {
            statusStyle = 'border-review bg-review/15 text-review';
            badgeColor = 'bg-review text-white';
          } else {
            statusStyle = 'border-compliant bg-compliant/15 text-compliant';
            badgeColor = 'bg-compliant text-white';
          }
        }

        const { x, y, width, height } = region.boundingBox;

        return (
          <div
            key={`${region.id || 'reg'}_${idx}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectRegion(region.id);
            }}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: `${width}%`,
              height: `${height}%`,
            }}
            className={`absolute border-2 rounded-sm pointer-events-auto cursor-pointer transition-all duration-200 ${statusStyle} ${
              isSelected
                ? 'ring-4 ring-primary ring-offset-1 z-30 shadow-lg scale-[1.01]'
                : 'hover:border-primary hover:bg-primary/20 z-20'
            }`}
            title={`${matchingField?.label || 'OCR Region'}: ${region.detectedText}`}
          >
            {/* Overlay Tag / Label */}
            <div
              className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold whitespace-nowrap shadow-sm select-none ${badgeColor} ${
                isSelected ? 'scale-110 -top-6' : ''
              }`}
            >
              {matchingField?.label || region.detectedText.slice(0, 16)}
              {isSelected && ' [FOCUSED]'}
            </div>

            {/* Pulsing indicator when active */}
            {isSelected && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
