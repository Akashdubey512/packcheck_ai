import puppeteer from "puppeteer";

const DECLARATION_LABELS = {
  manufacturer_name_address: "Manufacturer/Packer/Importer Name & Address",
  net_quantity: "Net Quantity",
  mrp: "Maximum Retail Price (MRP)",
  mfg_date: "Month & Year of Manufacture/Packing",
  consumer_care: "Consumer Care Details",
  country_of_origin: "Country of Origin",
  generic_name: "Common/Generic Name",
  unit_sale_price: "Unit Sale Price",
};

function buildReportHtml(scan) {
  const rows = Object.entries(scan.declarations)
    .map(([key, d]) => {
      const label = DECLARATION_LABELS[key] || key;
      const status = d.found ? "✅ Present" : "❌ Missing";
      const value = d.value || "-";
      return `<tr>
        <td>${label}</td>
        <td>${status}</td>
        <td>${value}</td>
      </tr>`;
    })
    .join("");

  const violationsList = scan.violations.length
    ? `<ul>${scan.violations.map((v) => `<li>${v}</li>`).join("")}</ul>`
    : "<p>No violations found.</p>";

  return `
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .meta { color: #555; font-size: 13px; margin-bottom: 20px; }
        .status { font-size: 16px; font-weight: bold; padding: 6px 12px; border-radius: 4px; display: inline-block; }
        .compliant { background: #d1fae5; color: #065f46; }
        .non-compliant { background: #fee2e2; color: #991b1b; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px; }
        th { background: #f3f4f6; }
        h2 { font-size: 15px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <h1>Legal Metrology Compliance Report</h1>
      <div class="meta">Scan ID: ${scan._id} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()}</div>
      <span class="status ${scan.overallStatus === "COMPLIANT" ? "compliant" : "non-compliant"}">
        ${scan.overallStatus}
      </span>

      <table>
        <thead>
          <tr><th>Declaration</th><th>Status</th><th>Extracted Value</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <h2>Violations</h2>
      ${violationsList}
    </body>
  </html>`;
}

export async function generateReportPdf(scan) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // needed on most cloud/CI environments
  });

  try {
    const page = await browser.newPage();
    await page.setContent(buildReportHtml(scan), { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    return pdfBuffer;
  } finally {
    await browser.close(); // always close, even if pdf generation throws
  }
}