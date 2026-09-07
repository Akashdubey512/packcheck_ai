import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Scan,
  Eye,
  EyeOff,
  Move,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EvidenceOverlay } from './EvidenceOverlay';
import { OCRRegion, ExtractedField, BoundingBox } from '@/types/scan';

interface EvidenceViewerProps {
  imageUrl: string;
  fileName?: string;
  regions: OCRRegion[];
  extractedFields: ExtractedField[];
  selectedRegionId: string | null;
  onSelectRegion: (regionId: string) => void;
  focusedBoundingBox?: BoundingBox | null;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  imageUrl,
  fileName,
  regions,
  extractedFields,
  selectedRegionId,
  onSelectRegion,
  focusedBoundingBox,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showOverlays, setShowOverlays] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Detect prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, []);

  // Reset to initial fit
  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  }, []);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.3, 4.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.3, 0.6));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0015;
    setScale((prev) => Math.min(Math.max(0.6, prev + zoomDelta), 4.0));
  };

  // Pointer events for unified Mouse + Touch pan handling
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture not supported or failed
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Pointer capture release ignored
    }
  };

  // Auto-focus on specified bounding box
  useEffect(() => {
    if (!focusedBoundingBox || !containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Target box centers in percentage (0-100)
    const boxCenterX = (focusedBoundingBox.x + focusedBoundingBox.width / 2) / 100;
    const boxCenterY = (focusedBoundingBox.y + focusedBoundingBox.height / 2) / 100;

    // Zoom level to inspect evidence closely
    const targetScale = 2.2;

    // Calculate translation required to center the bounding box
    const targetX = (0.5 - boxCenterX) * containerWidth * (targetScale * 0.8);
    const targetY = (0.5 - boxCenterY) * containerHeight * (targetScale * 0.8);

    setScale(targetScale);
    setPosition({ x: targetX, y: targetY });
    setRotation(0);
  }, [focusedBoundingBox]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded border border-border bg-slate-950 overflow-hidden flex flex-col select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-[540px]'
      }`}
      onWheel={handleWheel}
      role="region"
      aria-label="Interactive packaging evidence label viewer"
    >
      {/* Floating Controls Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 p-1 rounded bg-slate-900/90 border border-slate-700/80 backdrop-blur pointer-events-auto shadow-md">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-slate-200 hover:bg-slate-800"
            onClick={handleZoomIn}
            title="Zoom in (+)"
            aria-label="Zoom in on label"
          >
            <ZoomIn size={14} aria-hidden="true" />
          </Button>
          <span className="text-2xs font-mono text-slate-300 px-1 min-w-[3rem] text-center" aria-live="polite">
            {Math.round(scale * 100)}%
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-slate-200 hover:bg-slate-800"
            onClick={handleZoomOut}
            title="Zoom out (-)"
            aria-label="Zoom out on label"
          >
            <ZoomOut size={14} aria-hidden="true" />
          </Button>

          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-slate-200 hover:bg-slate-800"
            onClick={handleReset}
            title="Reset to Fit"
            aria-label="Reset zoom and center to fit"
          >
            <Scan size={14} aria-hidden="true" />
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-slate-200 hover:bg-slate-800"
            onClick={handleRotate}
            title="Rotate 90° Clockwise"
            aria-label="Rotate image 90 degrees clockwise"
          >
            <RotateCw size={14} aria-hidden="true" />
          </Button>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded bg-slate-900/90 border border-slate-700/80 backdrop-blur pointer-events-auto shadow-md">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={`h-7 px-2 text-2xs gap-1 ${
              showOverlays ? 'text-sky-400 bg-sky-950/60' : 'text-slate-400 hover:bg-slate-800'
            }`}
            onClick={() => setShowOverlays(!showOverlays)}
            title="Toggle OCR Bounding Boxes"
            aria-label={showOverlays ? 'Hide OCR bounding boxes' : 'Show OCR bounding boxes'}
          >
            {showOverlays ? <Eye size={13} aria-hidden="true" /> : <EyeOff size={13} aria-hidden="true" />}
            <span className="hidden sm:inline">Boxes</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-slate-200 hover:bg-slate-800"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'View in fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} aria-hidden="true" /> : <Maximize2 size={14} aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {/* Main Viewport with Unified Pointer / Touch Pan Support */}
      <div
        className="flex-1 w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: isDragging || reducedMotion ? 'none' : 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="relative max-w-full max-h-full flex items-center justify-center pointer-events-auto"
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt={fileName || 'Audited Packaging Label Artifact'}
            className="max-h-[460px] w-auto object-contain rounded border border-slate-800 shadow-2xl pointer-events-none"
            draggable={false}
          />

          {/* Evidence Bounding Box Overlays */}
          <EvidenceOverlay
            regions={regions}
            extractedFields={extractedFields}
            selectedRegionId={selectedRegionId}
            onSelectRegion={onSelectRegion}
            showOverlays={showOverlays}
          />
        </div>
      </div>

      {/* Bottom Status bar */}
      <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 text-2xs font-mono text-slate-400 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <Move size={11} className="text-slate-500" aria-hidden="true" />
          <span>Click/touch &amp; drag to pan • Wheel to zoom • Click boxes to inspect</span>
        </div>
        <div className="text-slate-500">
          {regions.length} Statutory Regions Detected
        </div>
      </div>
    </div>
  );
};
