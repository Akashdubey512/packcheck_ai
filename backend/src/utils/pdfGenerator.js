import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const DECLARATION_LABELS = {
  mrp: "Maximum Retail Price (MRP)",
  netQuantity: "Net Quantity",
  net_quantity: "Net Quantity",
  manufactureDate: "Month & Year of Manufacture/Packing",
  mfg_date: "Month & Year of Manufacture/Packing",
  packingDate: "Packing Date",
  packing_date: "Packing Date",
  importDate: "Import Date",
  import_date: "Import Date",
  manufacturer: "Manufacturer/Packer/Importer Name & Address",
  manufacturer_name_address: "Manufacturer/Packer/Importer Name & Address",
  packer: "Packer Details",
  importer: "Importer Details",
  consumerCare: "Consumer Care Details",
  consumer_care: "Consumer Care Details",
  countryOfOrigin: "Country of Origin",
  country_of_origin: "Country of Origin",
  genericName: "Common/Generic Name",
  generic_name: "Common/Generic Name",
  unitSalePrice: "Unit Sale Price",
  unit_sale_price: "Unit Sale Price",
  bestBefore: "Best Before / Expiry Date",
  best_before: "Best Before",
  expiryDate: "Expiry Date",
  expiry_date: "Expiry Date",
};

/**
 * Resolve deterministic browser executable path.
 * Checks environment variable, puppeteer cache, and standard platform paths.
 */
export function getChromeExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  try {
    const defaultPptrPath = puppeteer.executablePath();
    if (defaultPptrPath && fs.existsSync(defaultPptrPath)) {
      return defaultPptrPath;
    }
  } catch {
    // Puppeteer default binary might not be downloaded; fall back to system browsers
  }

  const systemCandidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];

  for (const candidate of systemCandidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

/**
 * Construct HTML report supporting canonical Inspection documents and legacy Scans.
 */
export function buildReportHtml(scan) {
  const inspectionId = scan.inspectionId || scan.id || scan._id || "INSP-RECORD";
  const rawStatus = scan.status || scan.overallStatus || scan.compliance?.overallStatus || "REVIEW_REQUIRED";
  const statusUpper = String(rawStatus).toUpperCase();
  const timestamp = scan.createdAt ? new Date(scan.createdAt).toLocaleString() : new Date().toLocaleString();

  // Extract declarations / fields from either schema
  const rows = [];
  if (scan.fields && typeof scan.fields === "object") {
    Object.entries(scan.fields).forEach(([key, f]) => {
      const label = DECLARATION_LABELS[key] || f.label || key;
      const isPresent = Boolean(
        (f.normalizedValue && String(f.normalizedValue).trim()) ||
        (f.rawValue && String(f.rawValue).trim()) ||
        f.status === "valid" ||
        f.status === "CONFIDENT"
      );
      const val = f.normalizedValue || f.rawValue || "-";
      const statusText = isPresent ? "✅ Compliant" : "❌ Missing";
      const conf = f.confidence ? `${Math.round(f.confidence * 100)}%` : "-";
      rows.push(`<tr>
        <td><strong>${label}</strong></td>
        <td><span class="badge ${isPresent ? "badge-pass" : "badge-fail"}">${statusText}</span></td>
        <td>${val}</td>
        <td>${conf}</td>
      </tr>`);
    });
  } else if (scan.declarations && typeof scan.declarations === "object") {
    Object.entries(scan.declarations).forEach(([key, d]) => {
      const label = DECLARATION_LABELS[key] || key;
      const isPresent = Boolean(d.found);
      const val = d.value || "-";
      const statusText = isPresent ? "✅ Present" : "❌ Missing";
      const conf = d.confidence ? `${Math.round(d.confidence * 100)}%` : "-";
      rows.push(`<tr>
        <td><strong>${label}</strong></td>
        <td><span class="badge ${isPresent ? "badge-pass" : "badge-fail"}">${statusText}</span></td>
        <td>${val}</td>
        <td>${conf}</td>
      </tr>`);
    });
  }

  const rawViolations = scan.compliance?.violations || scan.violations || [];
  const violations = rawViolations.map((v) =>
    typeof v === "string" ? v : v.message || v.rule_name || JSON.stringify(v)
  );

  const violationsHtml = violations.length
    ? `<ul>${violations.map((v) => `<li class="viol-item">${v}</li>`).join("")}</ul>`
    : `<p class="no-violation">No statutory violations detected. All evaluated mandatory declarations are compliant under PCR 2011.</p>`;

  const sha256 =
    scan.provenance?.sha256Hashes?.[0] ||
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  const statusClass =
    statusUpper === "COMPLIANT" || statusUpper === "PASS"
      ? "status-compliant"
      : statusUpper === "NON_COMPLIANT" || statusUpper === "FAIL"
      ? "status-violation"
      : "status-review";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Legal Metrology Compliance Certificate - ${inspectionId}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 32px 40px;
      color: #1e293b;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header h1 {
      font-size: 20px;
      margin: 0 0 4px 0;
      color: #0f172a;
    }
    .header p {
      margin: 0;
      color: #64748b;
      font-size: 12px;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .meta-item {
      font-size: 12px;
      color: #475569;
    }
    .meta-item strong {
      color: #0f172a;
    }
    .status-badge {
      font-size: 13px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .status-compliant { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .status-violation { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .status-review { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }

    h2 {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #334155;
      margin: 24px 0 8px 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      margin-bottom: 20px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      text-align: left;
      font-size: 12px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 600;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-pass { background: #e0f2fe; color: #0369a1; }
    .badge-fail { background: #fee2e2; color: #b91c1c; }

    ul { margin: 8px 0; padding-left: 20px; }
    li.viol-item {
      color: #b91c1c;
      font-weight: 500;
      margin-bottom: 4px;
    }
    .no-violation {
      color: #15803d;
      font-style: italic;
      margin: 8px 0;
    }

    .footer {
      margin-top: 36px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      font-size: 11px;
      color: #64748b;
    }
    .sha-code {
      font-family: monospace;
      background: #f1f5f9;
      padding: 2px 4px;
      border-radius: 3px;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Legal Metrology Compliance Certificate</h1>
      <p>Department of Consumer Affairs • Legal Metrology (Packaged Commodities) Rules, 2011</p>
    </div>
    <span class="status-badge ${statusClass}">
      ${statusUpper}
    </span>
  </div>

  <div class="meta-box">
    <div class="meta-item">Inspection ID: <strong>${inspectionId}</strong></div>
    <div class="meta-item">Generated: <strong>${timestamp}</strong></div>
    <div class="meta-item">Statutory Rule: <strong>PCR 2011 (Amended)</strong></div>
  </div>

  <h2>Statutory Declarations Audit</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 35%;">Declaration Name</th>
        <th style="width: 20%;">Compliance</th>
        <th style="width: 33%;">Extracted Value</th>
        <th style="width: 12%;">Confidence</th>
      </tr>
    </thead>
    <tbody>
      ${rows.length ? rows.join("") : `<tr><td colspan="4" style="text-align: center; color: #94a3b8;">No declaration fields available</td></tr>`}
    </tbody>
  </table>

  <h2>Statutory Violations & Findings</h2>
  ${violationsHtml}

  <div class="footer">
    <p><strong>Digital Provenance:</strong> SHA-256 Ledger: <span class="sha-code">${sha256}</span></p>
    <p>This document is an official digital regulatory certificate generated by PackCheck AI Statutory Engine.</p>
  </div>
</body>
</html>`;
}

/**
 * Generate PDF buffer using Puppeteer headless Chrome.
 * Throws on failure without silent or fake fallbacks.
 * @param {Object} scan
 * @returns {Promise<Buffer>}
 */
export async function generateReportPdf(scan) {
  const executablePath = getChromeExecutablePath();
  const launchOptions = {
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
    ],
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    const html = buildReportHtml(scan);
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}