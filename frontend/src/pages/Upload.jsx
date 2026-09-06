import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FileImage,
  Trash2,
  RefreshCw,
  Ruler,
  CheckCircle2,
  AlertCircle,
  ScanLine,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader.jsx";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import Alert from "../components/ui/Alert.jsx";
import { Card, CardHeader, CardTitle, CardBody } from "../components/ui/Card.jsx";
import { uploadScan } from "../api/scans.js";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function Upload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dimensions, setDimensions] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Optional panel dimension calibration (cm)
  const [panelWidthCm, setPanelWidthCm] = useState("");
  const [panelHeightCm, setPanelHeightCm] = useState("");

  // Submission & Error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Safely manage object URL lifecycle and compute image resolution
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setDimensions(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const img = new window.Image();
    img.onload = () => {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      setDimensions(null);
    };
    img.src = objectUrl;

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const validateAndSetFile = (candidateFile) => {
    setError(null);
    if (!candidateFile) return;

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(candidateFile.type)) {
      setError("Unsupported file format. Please upload a JPG, PNG, or WebP image.");
      return;
    }

    // Check file size (max 10MB)
    if (candidateFile.size > MAX_FILE_SIZE_BYTES) {
      setError("File exceeds the 10 MB limit. Please upload a smaller image.");
      return;
    }

    setFile(candidateFile);
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTriggerSelect = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDownDropzone = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTriggerSelect();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || loading) return;

    setLoading(true);
    setError(null);

    // Optional numeric dimension parsing
    const parsedWidth = panelWidthCm.trim() !== "" ? parseFloat(panelWidthCm) : undefined;
    const parsedHeight = panelHeightCm.trim() !== "" ? parseFloat(panelHeightCm) : undefined;

    try {
      const result = await uploadScan(file, parsedWidth, parsedHeight);

      if (result && result.scanId) {
        navigate(`/scan/${result.scanId}`, {
          state: { scan: result },
        });
      } else {
        throw new Error("Invalid response received from scan service.");
      }
    } catch (err) {
      console.error("Scan submission error:", err);
      if (err.response) {
        const status = err.response.status;
        if (status === 422) {
          setError(
            err.response.data?.error ||
              "The image could not be read. Upload a clearer label image with the relevant declarations visible."
          );
        } else if (status === 502) {
          setError("The analysis service is temporarily unavailable. Please try again.");
        } else if (status === 501) {
          setError("The scan analysis endpoint is not yet implemented on the server.");
        } else {
          setError(
            err.response.data?.error ||
              "Unable to complete the scan. Check your connection and try again."
          );
        }
      } else {
        setError("Unable to complete the scan. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="New Compliance Scan"
        subtitle="Submit packaged commodity label evidence for declaration verification."
        category="LEGAL METROLOGY INSPECTION"
        className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6 mb-6"
      />

      {/* Inline Submission / Validation Error */}
      {error && (
        <Alert
          type="error"
          title="Evidence Validation Notice"
          className="shadow-xs"
        >
          {error}
        </Alert>
      )}

      {/* Main Workspace Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT / PRIMARY: Evidence Submission Area */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <Card className="border border-slate-200 shadow-card">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ScanLine className="w-4 h-4 text-slate-700" />
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-800">
                    Commodity Label Evidence
                  </CardTitle>
                </div>
                {file && (
                  <span className="text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Image Loaded
                  </span>
                )}
              </CardHeader>

              <CardBody className="p-6">
                {/* Hidden Native File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileInputChange}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                />

                {!file ? (
                  /* DROPZONE EMPTY STATE */
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={handleTriggerSelect}
                    onKeyDown={handleKeyDownDropzone}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    aria-label="Upload label image. Drag and drop an image or click to select."
                    className={`border-2 border-dashed rounded-md p-8 sm:p-10 text-center transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 ${
                      isDragging
                        ? "border-slate-900 bg-slate-100 ring-2 ring-slate-900/10"
                        : "border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-subtle">
                        <UploadCloud className="w-6 h-6" />
                      </div>

                      <div className="space-y-1 max-w-sm">
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                          Upload label image
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Drag and drop an image here, or choose a file from your device.
                        </p>
                      </div>

                      <div className="pt-2">
                        <span className="text-[11px] font-mono text-slate-400 bg-white px-2.5 py-1 rounded border border-slate-200">
                          JPG, PNG or WebP · Maximum 10 MB
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* IMAGE PREVIEW STATE */
                  <div className="space-y-4">
                    {/* Evidence Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-100/70 border border-slate-200 rounded-md">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-xs">
                          <FileImage className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500">
                            {formatFileSize(file.size)}
                            {dimensions ? ` · ${dimensions.width} × ${dimensions.height} px` : ""}
                          </p>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleTriggerSelect}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 disabled:opacity-50"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                          <span>Replace</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>

                    {/* Image Viewport */}
                    <div className="relative w-full rounded-md border border-slate-200 bg-slate-950/5 overflow-hidden flex items-center justify-center min-h-[260px] max-h-[480px]">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Uploaded label evidence preview"
                          className="max-h-[480px] w-auto max-w-full object-contain mx-auto"
                        />
                      ) : (
                        <div className="p-8 text-center text-slate-400 text-xs font-mono">
                          Rendering evidence preview…
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Submit Action Container */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-md shadow-card">
              <div className="text-xs text-slate-500">
                {file ? (
                  <span>Ready for statutory compliance verification.</span>
                ) : (
                  <span>Select a label image to enable analysis.</span>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!file || loading}
                loading={loading}
                className="w-full sm:w-auto px-6 py-2.5 font-semibold text-xs tracking-wider uppercase"
              >
                {loading ? "Analyzing label…" : "Begin Analysis"}
              </Button>
            </div>
          </div>

          {/* RIGHT / SECONDARY: Settings & Evidence Guidance */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* Panel Calibration (Optional) */}
            <Card className="border border-slate-200 shadow-card">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-slate-700" />
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Panel dimensions
                  </CardTitle>
                </div>
              </CardHeader>
              <CardBody className="p-5 space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Optional. Used for physical display-panel based checks.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Panel width (cm)"
                    id="panel-width"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 8.5"
                    value={panelWidthCm}
                    onChange={(e) => setPanelWidthCm(e.target.value)}
                    disabled={loading}
                  />

                  <Input
                    label="Panel height (cm)"
                    id="panel-height"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 12.0"
                    value={panelHeightCm}
                    onChange={(e) => setPanelHeightCm(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </CardBody>
            </Card>

            {/* Capture / Evidence Guidance */}
            <Card className="border border-slate-200 shadow-card">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Evidence quality
                  </CardTitle>
                </div>
              </CardHeader>
              <CardBody className="p-5">
                <ul className="space-y-3 text-xs text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span>Keep the label surface flat and fully visible.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span>Avoid glare, reflections, and severe shadows.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span>Capture mandatory declarations at readable resolution.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span>Include the complete relevant panel in frame.</span>
                  </li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
