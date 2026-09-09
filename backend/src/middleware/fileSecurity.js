import fs from "fs";
import path from "path";

/**
 * Checks if file magic bytes match allowed packaging image signatures.
 * Supports JPEG, PNG, WebP, SVG, GIF, and BMP.
 * @param {string} filePath
 * @param {string} mimeType
 * @returns {boolean}
 */
function verifyMagicBytes(filePath, mimeType) {
  try {
    const buffer = Buffer.alloc(32);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 32, 0);
    fs.closeSync(fd);

    // JPEG check (FF D8 FF)
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return true;
    }

    // PNG check (89 50 4E 47)
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return true;
    }

    // WebP check ("RIFF" ... "WEBP")
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return true;
    }

    // GIF check ("GIF87a" or "GIF89a")
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return true;
    }

    // BMP check ("BM")
    if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
      return true;
    }

    // SVG / XML text format check (starts with '<' or '<?xml' or includes '<svg')
    const strHeader = buffer.toString("utf-8").trim();
    if (
      strHeader.startsWith("<") ||
      strHeader.toLowerCase().includes("svg") ||
      strHeader.toLowerCase().includes("xml") ||
      mimeType?.includes("svg")
    ) {
      return true;
    }

    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Sanitizes original filename to eliminate path traversal and null-byte injection.
 * @param {string} filename
 * @returns {string}
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== "string") return "unnamed_upload.jpg";
  
  // Strip null bytes and control characters
  let clean = filename.replace(/\0/g, "").replace(/[\x00-\x1F\x7F]/g, "");
  
  // Extract basename to strip path prefixes (../ or ..\)
  clean = path.basename(clean);

  // Keep only alphanumeric, dots, hyphens, underscores
  clean = clean.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Prevent hidden files (starting with dot)
  if (clean.startsWith(".")) {
    clean = `upload_${clean.slice(1)}`;
  }

  return clean || "upload.jpg";
}

/**
 * Middleware to validate uploaded files after Multer receives them.
 * Verifies magic bytes, size limits, and cleans up invalid files immediately.
 */
export function validateUploadedFiles(req, res, next) {
  let fileList = [];
  if (Array.isArray(req.files)) {
    fileList = req.files;
  } else if (req.files && typeof req.files === "object") {
    Object.values(req.files).forEach((item) => {
      if (Array.isArray(item)) fileList.push(...item);
      else if (item) fileList.push(item);
    });
  } else if (req.file) {
    fileList = [req.file];
  }

  if (fileList.length === 0) {
    return next();
  }

  if (fileList.length > 10) {
    fileList.forEach((f) => {
      if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
    });
    return res.status(400).json({
      success: false,
      error: {
        code: "FILE_VALIDATION_ERROR",
        message: "Maximum 10 images allowed per inspection upload request",
      },
      requestId: req.requestId,
    });
  }

  for (const file of fileList) {
    // Enforce file size limit (20 MB)
    if (file.size > 20 * 1024 * 1024) {
      fileList.forEach((f) => {
        if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
      return res.status(400).json({
        success: false,
        error: {
          code: "FILE_TOO_LARGE",
          message: `File '${file.originalname}' exceeds maximum allowed size of 20MB`,
        },
        requestId: req.requestId,
      });
    }

    // Verify file signature magic bytes
    if (!file.path || !fs.existsSync(file.path) || !verifyMagicBytes(file.path, file.mimetype)) {
      fileList.forEach((f) => {
        if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_FILE_TYPE",
          message: `File '${file.originalname}' failed binary header verification (magic bytes mismatch or corrupt image file)`,
        },
        requestId: req.requestId,
      });
    }
  }

  next();
}
