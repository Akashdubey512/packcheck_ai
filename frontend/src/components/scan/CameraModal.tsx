import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, RefreshCw, AlertCircle, Check, RotateCcw, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { butterSpring, gpuAcceleratedStyle } from '@/animations/motion';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  onBrowseFiles?: () => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  onBrowseFiles,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Stop camera tracks cleanly
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (deviceId?: string) => {
    stopStream();
    setError(null);
    setIsLoading(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera access is not supported by your browser or environment.');
      setIsLoading(false);
      return;
    }

    try {
      let stream: MediaStream | null = null;

      // Progressive constraint fallback
      const constraintAttempts: MediaStreamConstraints[] = deviceId
        ? [{ video: { deviceId: { exact: deviceId } }, audio: false }]
        : [
            { video: { facingMode: 'user' }, audio: false },
            { video: { facingMode: { ideal: 'environment' } }, audio: false },
            { video: true, audio: false },
          ];

      let lastErr: any = null;
      for (const attempt of constraintAttempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(attempt);
          if (stream) break;
        } catch (e) {
          lastErr = e;
        }
      }

      if (!stream) {
        throw lastErr || new Error('Unable to initialize video stream.');
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // Enumerate devices to allow switching if multiple exist
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
        setDevices(videoInputs);
        if (!selectedDeviceId && videoInputs.length > 0) {
          const activeTrack = stream.getVideoTracks()[0];
          const settings = activeTrack?.getSettings();
          if (settings?.deviceId) {
            setSelectedDeviceId(settings.deviceId);
          } else if (videoInputs[0]?.deviceId) {
            setSelectedDeviceId(videoInputs[0].deviceId);
          }
        }
      } catch {
        // Non-fatal
      }
    } catch (err: any) {
      console.error('Camera stream initialization failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was blocked. Please click the camera icon in your browser address bar and choose "Always allow", then retry.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError(
          'No camera detected. On Lenovo LOQ and laptop computers, check the physical E-Shutter switch on the right side of the laptop chassis or press Fn + F9/F10 to enable the camera.'
        );
      } else {
        setError(err.message || 'Failed to connect to camera device.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [stopStream, selectedDeviceId]);

  // Manage camera lifecycle based on isOpen
  useEffect(() => {
    if (isOpen) {
      setCapturedDataUrl(null);
      setCapturedFile(null);
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Switch camera
  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    startCamera(deviceId);
  };

  // Capture frame
  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedDataUrl(dataUrl);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `label_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setCapturedFile(file);
        }
      },
      'image/jpeg',
      0.95
    );
  };

  // Retake
  const handleRetake = () => {
    setCapturedDataUrl(null);
    setCapturedFile(null);
    startCamera(selectedDeviceId);
  };

  // Confirm and proceed
  const handleConfirm = () => {
    if (capturedFile) {
      stopStream();
      onCapture(capturedFile);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={butterSpring}
        style={gpuAcceleratedStyle}
        className="max-w-2xl w-full relative z-10"
      >
        <Card className="w-full bg-surface border border-border shadow-modal overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Camera size={18} />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Direct Label Capture
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Align product packaging label within viewfinder for statutory inspection
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {devices.length > 1 && !capturedDataUrl && !error && (
                <select
                  value={selectedDeviceId}
                  onChange={(e) => handleDeviceChange(e.target.value)}
                  className="text-xs bg-surface-muted border border-border text-foreground rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {devices.map((device, idx) => (
                    <option key={device.deviceId || idx} value={device.deviceId}>
                      {device.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-foreground transition-colors p-1 rounded-md"
                aria-label="Close camera modal"
              >
                <X size={18} />
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 bg-slate-950 flex flex-col items-center justify-center relative min-h-[340px]">
            {error ? (
              <div className="text-center p-6 space-y-4 max-w-lg">
                <div className="w-12 h-12 rounded-full bg-violation-surface border border-violation-border flex items-center justify-center text-violation-foreground mx-auto">
                  <AlertCircle size={24} />
                </div>
                <h4 className="text-sm font-semibold text-white">Camera Hardware Not Detected</h4>
                <div className="text-xs text-slate-300 leading-relaxed bg-slate-900 border border-slate-800 rounded-lg p-3 text-left space-y-2">
                  <p className="font-semibold text-amber-400 flex items-center gap-1.5">
                    Hardware Switch / Privacy Shutter Detected (Code 45)
                  </p>
                  <p>{error}</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400">
                    <li>
                      <strong>Right side of laptop:</strong> Toggle the small physical slider (Lenovo E-shutter switch).
                    </li>
                    <li>
                      <strong>Keyboard shortcut:</strong> Press <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Fn + F9</kbd> or <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">F10</kbd> to unblock the camera.
                    </li>
                    <li>
                      <strong>Windows Settings:</strong> Open Windows Settings &rarr; Privacy &amp; Security &rarr; Camera &rarr; Turn ON &quot;Camera access&quot; and &quot;Let desktop apps access your camera&quot;.
                    </li>
                  </ul>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => startCamera(selectedDeviceId)}
                    className="inline-flex items-center justify-center font-medium rounded text-xs h-8 px-4 bg-primary text-white hover:bg-primary/90 transition-colors shadow-subtle"
                  >
                    <RefreshCw size={14} className="mr-1.5" /> Retry Camera Connection
                  </button>
                  {onBrowseFiles && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onBrowseFiles();
                      }}
                      className="inline-flex items-center justify-center font-medium rounded text-xs h-8 px-4 bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700"
                    >
                      <FileImage size={14} className="mr-1.5" /> Browse Image File Instead
                    </button>
                  )}
                </div>
              </div>
            ) : capturedDataUrl ? (
              /* Captured preview */
              <div className="relative w-full max-h-[440px] flex items-center justify-center overflow-hidden rounded-lg border border-slate-800 bg-black">
                <img
                  src={capturedDataUrl}
                  alt="Captured Packaging Label"
                  className="max-h-[440px] w-auto object-contain rounded-lg shadow-lg"
                />
                <div className="absolute top-3 left-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs px-2.5 py-1 rounded flex items-center gap-1.5 backdrop-blur-xs">
                  <Check size={13} />
                  <span>Frame Captured</span>
                </div>
              </div>
            ) : (
              /* Live camera video viewfinder */
              <div className="relative w-full max-h-[440px] flex items-center justify-center overflow-hidden rounded-lg border border-slate-800 bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-[440px] object-contain rounded-lg"
                />

                {/* Viewfinder Target Overlay */}
                <div className="absolute inset-4 sm:inset-8 border border-white/20 rounded-md pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-primary" />
                    <div className="w-4 h-4 border-t-2 border-r-2 border-primary" />
                  </div>
                  <div className="text-center">
                    <span className="text-2xs font-mono tracking-wider text-white/60 bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs">
                      POSITION PACKAGING LABEL IN RECTANGLE
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-b-2 border-l-2 border-primary" />
                    <div className="w-4 h-4 border-b-2 border-r-2 border-primary" />
                  </div>
                </div>

                {isLoading && (
                  <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center gap-2 text-white text-xs">
                    <RefreshCw size={16} className="animate-spin text-primary" />
                    <span>Connecting Video Feed...</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between p-4 border-t border-border bg-surface-muted/30">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>

            {capturedDataUrl ? (
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleRetake}>
                  <RotateCcw size={14} className="mr-1.5" /> Retake Photo
                </Button>
                <Button type="button" variant="primary" size="sm" onClick={handleConfirm}>
                  <Check size={14} className="mr-1.5" /> Analyze This Label
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isLoading || !!error}
                onClick={handleCapture}
                className="px-5 shadow-md"
              >
                <Camera size={15} className="mr-1.5" /> Snap Photo
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};
