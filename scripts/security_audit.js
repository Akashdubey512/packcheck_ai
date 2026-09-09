import fs from "fs";
import path from "path";

/**
 * Repository Secrets & Security Hardening Audit Script.
 * Scans codebase files to verify zero hardcoded production secrets, private keys, or exposed credentials.
 */

const SUSPICIOUS_PATTERNS = [
  { name: "Private Key Header", regex: /-----BEGIN (RSA|EC|PGP|OPENSSH) PRIVATE KEY-----/i },
  { name: "AWS Access Key ID", regex: /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/ },
  { name: "Hardcoded Password String", regex: /password\s*[:=]\s*["'][^"']{6,}["']/i },
  { name: "Hardcoded MongoDB Credentials", regex: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/i },
  { name: "Slack Webhook URL", regex: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]+\/B[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+/ },
  { name: "Generic Secret Token Assignment", regex: /(secret|token|api_key)\s*[:=]\s*["'][a-zA-Z0-9]{32,}["']/i },
];

const ALLOWED_FILES = [
  ".env.example",
  "security_audit.js",
  "PHASE_2_SECURITY_HARDENING.md",
  "walkthrough.md",
  "implementation_plan.md",
  "security.test.js",
  "envValidation.js",
];

const SCAN_DIRS = ["backend/src", "ai-service/app", "ai-service/ml", "frontend/src", ".github"];

let totalFilesScanned = 0;
const findings = [];

function scanFile(filePath) {
  const fileName = path.basename(filePath);
  if (ALLOWED_FILES.includes(fileName)) return;

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    totalFilesScanned++;

    SUSPICIOUS_PATTERNS.forEach(({ name, regex }) => {
      if (regex.test(content)) {
        findings.push({
          file: filePath,
          vulnerability: name,
        });
      }
    });
  } catch {
    // Ignore binary or unreadable files
  }
}

function traverseDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== "uploads") {
        traverseDirectory(fullPath);
      }
    } else {
      scanFile(fullPath);
    }
  }
}

console.log("==================================================");
console.log("   PackCheck AI Repository Security Audit Scan    ");
console.log("==================================================");

SCAN_DIRS.forEach((dir) => traverseDirectory(path.resolve(process.cwd(), dir)));

console.log(`\nFiles Scanned: ${totalFilesScanned}`);
console.log(`Security Findings: ${findings.length}`);

if (findings.length > 0) {
  console.error("\n❌ SECURITY AUDIT FAILED — Hardcoded credentials detected:");
  findings.forEach((f) => console.error(`  - File: ${f.file} -> Pattern: ${f.vulnerability}`));
  process.exit(1);
} else {
  console.log("\n✅ SECURITY AUDIT PASSED — Zero hardcoded credentials or private keys detected.");
}
