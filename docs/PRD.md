# PRD: Legal Metrology (Packaged Commodities) Compliance Checker

**Team:** 5 members — Akash & Ravi (MERN backend/integration), Sandeep & Gyanish (AI/ML), Yash (frontend + misc + presentation)

---

## 1. Problem, restated in one line

Given an image of a packaged product's label, automatically tell an enforcement officer: *what mandatory declarations are present, what's missing, what's wrong (format/font/placement), and produce a report.*

That's the whole product. Everything else (dashboard, history, PDF export) is scaffolding around this one core capability. Build the core first.

---

## 2. Scope decision (do this before writing any code)

You have 5 people and (presumably) a hackathon-length timeline. You cannot build "detect placement + font size + all declarations + multilingual + e-commerce scraping + full dashboard" at production quality. Pick an MVP and be explicit about what's a stretch goal — judges/evaluators reward a working narrow slice over a broken wide one.

**MVP (must work end-to-end, demo-able):**
1. Upload a label image (web app).
2. OCR extracts all text from the image.
3. Rule engine checks for presence of the ~6 core mandatory declarations.
4. System flags missing ones and shows extracted text mapped to each declaration.
5. Generates a downloadable PDF compliance report.
6. Basic dashboard: list of past scans with pass/fail status.

**Stretch goals (only after MVP works):**
- Font size / letter height compliance check (this is the hardest part technically — see §7.4).
- Placement-on-panel checks (declarations must be grouped together per Rule 6).
- Multilingual label support (Hindi + regional languages — real Indian labels often have both).
- E-commerce listing scraping instead of manual image upload.
- Role-based access (Officer vs Admin vs Super-admin).

Tell your team explicitly: **MVP first, in this order.** Don't let AI/ML start on font-size detection before OCR+rule-engine works for basic presence checks — presence checking alone is already a legitimate, demo-worthy product.

---

## 3. Team split (mapped to your actual people)

| Person(s) | Owns | Deliverables |
|---|---|---|
| Akash & Ravi | Backend (Node/Express), DB (MongoDB), auth, REST APIs, image upload/storage, PDF generation, integration glue between frontend/AI service | Express server, Mongoose models, JWT auth, file upload endpoint, PDF report generator, calls to the AI microservice |
| Sandeep & Gyanish | AI/ML pipeline: OCR, text structuring/NER, rule engine, (stretch) font-size estimation | Python FastAPI microservice exposing `/analyze` that takes an image and returns structured JSON of extracted + validated declarations |
| Yash | React frontend, dashboard UI, upload flow UX, and the PPT/demo narrative | Upload page, results page, dashboard, history/search page, final presentation deck |

**Critical integration point:** Akash/Ravi's Node backend does **not** run OCR itself. It calls Sandeep/Gyanish's Python AI service over HTTP (internal REST call), gets back structured JSON, stores it in MongoDB, and serves it to Yash's frontend. Agree on this JSON contract on Day 1 (see §6) — it's the single most important thing that prevents last-minute integration disasters.

---

## 4. System Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌────────────────────┐
│   React     │ ---> │  Node/Express API │ ---> │  Python AI Service  │
│  Frontend   │ <--- │   (Akash/Ravi)    │ <--- │  (Sandeep/Gyanish)  │
│   (Yash)    │      │                    │      │  FastAPI + OCR/ML   │
└─────────────┘      └────────┬───────────┘      └─────────────────────┘
                               │
                               ▼
                     ┌──────────────────┐
                     │    MongoDB        │
                     │ (products, scans, │
                     │ reports, users)   │
                     └──────────────────┘
```

- **Frontend (React + Tailwind):** upload page, results view, dashboard, history/search.
- **Backend (Node/Express):** auth, file handling, orchestration, PDF generation, MongoDB CRUD.
- **AI microservice (Python/FastAPI):** OCR + declaration extraction + rule validation. Runs as a **separate service**, not inside Node — Python has the ML libraries; Node doesn't need to.
- **Storage:** MongoDB for structured data. For images, use local disk/Cloudinary/S3-compatible bucket for a hackathon (don't over-engineer storage — a `/uploads` folder + static serving is fine for a demo).

Why split AI into a separate microservice instead of trying to do OCR in Node: your ML people work in Python (Tesseract/PaddleOCR/spaCy are Python-first), and this cleanly separates the two teams' work so they can build in parallel without blocking each other. You just need the JSON contract agreed early.

---

## 5. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + TailwindCSS | Fast to build, matches your team's MERN skill |
| Backend | Node.js + Express | Matches team skill |
| Database | MongoDB (Mongoose) | Matches MERN, flexible schema for varying declaration types |
| AI service | Python + FastAPI | Best ML ecosystem, async, easy REST wrapper |
| OCR | **PaddleOCR** (primary) or Tesseract (fallback) | PaddleOCR handles curved/rotated/multi-orientation label text much better than Tesseract; Tesseract is easier to set up but weaker on real-world packaging photos |
| Text structuring | Regex + rule-based first, spaCy NER only if time permits | Don't reach for a heavy NER model on day 1 — most declarations (MRP, net quantity, date) are pattern-matchable with regex. Save ML effort for what actually needs it. |
| PDF generation | `pdfkit` (Node) or Puppeteer (HTML→PDF) | Puppeteer is easier if Yash builds an HTML report template first — just render it and export |
| Auth | JWT | Standard, simple |
| Deployment (for demo) | Render/Railway (backend+AI), Vercel/Netlify (frontend), MongoDB Atlas (DB) | Free tiers, fast to set up |

**One thing to fix now:** don't try to run a YOLO-based object detector for "label region detection" unless Sandeep/Gyanish already have experience with it and time to spare. For a hackathon MVP, assume the uploaded image *is* the label (crop is done by the user), and skip automatic label localization. Add it only as a stretch goal.

---

## 6. The JSON contract (agree on this Day 1)

This is what the Node backend sends to the AI service and gets back. Lock this down before either side writes real code.

**Request** — Node → Python (`POST /analyze`):
```json
{
  "image_base64": "...",
  "product_id": "optional-mongo-id"
}
```

**Response** — Python → Node:
```json
{
  "extracted_text": "raw OCR dump for debugging",
  "declarations": {
    "manufacturer_name_address": { "found": true, "value": "ABC Foods Pvt Ltd, Nagpur", "confidence": 0.91 },
    "net_quantity": { "found": true, "value": "500 g", "confidence": 0.88 },
    "mrp": { "found": true, "value": "₹120 (incl. of all taxes)", "confidence": 0.95 },
    "mfg_date": { "found": false, "value": null, "confidence": 0.0 },
    "consumer_care": { "found": true, "value": "care@abcfoods.com, 1800-XXX-XXXX", "confidence": 0.80 },
    "country_of_origin": { "found": false, "value": null, "confidence": 0.0 }
  },
  "overall_status": "NON_COMPLIANT",
  "violations": [
    "Month and Year of manufacture/packing not found",
    "Country of origin not declared (required if imported)"
  ]
}
```

Node just stores this JSON as-is against the scan record and hands it to the frontend. Don't let the backend try to re-interpret or re-validate the declarations — that logic lives entirely in the AI service. Keeps responsibility clean.

---

## 7. AI/ML Pipeline (Sandeep & Gyanish's core work)

Build this in stages — each stage should work standalone before moving to the next.

### 7.1 Stage 1: OCR extraction
- Input: label image.
- Preprocess: grayscale, denoise, deskew (OpenCV — `cv2.threshold`, `cv2.getRotationMatrix2D` if the image is tilted).
- Run PaddleOCR (or Tesseract if setup time is tight) → get list of `(text, bounding_box, confidence)`.
- **Test this in isolation first** with 10-15 real product label photos before building anything on top of it. If OCR accuracy is bad, everything downstream fails — don't discover this on day 3.

### 7.2 Stage 2: Declaration extraction (regex-first approach)
Map raw OCR text to the mandatory declaration fields using patterns, not a full NLP model:

| Declaration | Detection approach |
|---|---|
| MRP | Regex for `₹`, `Rs\.?`, `MRP`, followed by a number |
| Net quantity | Regex for number + unit (`g`, `kg`, `ml`, `l`, `gm`) near words like "Net Wt", "Net Qty", "Net Weight" |
| Mfg/pack date | Regex for date patterns (`MM/YYYY`, `Month YYYY`, or keywords "Mfg Date", "Pkd on") |
| Manufacturer name/address | Look for text block near keywords "Mfd by", "Marketed by", "Packed by" — this is the hardest one, may need a fallback of "largest text block that isn't matched to anything else" |
| Consumer care | Regex for email pattern, phone number pattern, or "Customer Care"/"Consumer Care" keyword nearby |
| Country of origin | Keyword match: "Made in", "Country of Origin" |

This is 80% of the value for maybe 20% of the ML effort compared to training a custom NER model. Only invest in a trained NER/LLM-based extractor if regex genuinely falls short on your test images and you have time left.

### 7.3 Stage 3: Rule engine
A plain Python function (not "AI" — just logic) that takes the declarations dict and outputs compliant/non-compliant + reasons. This is literally an if/else tree against the rules in §9. Keep this as a **separate, clearly named module** (`rule_engine.py`) so it's easy to update when you refine which rules to check — this file will change the most as you calibrate against real labels.

### 7.4 Stage 4 (stretch): Font size / letter height check
This is genuinely hard and worth flagging honestly: to measure real-world letter height in mm from a photo, you need a size reference in the frame (you don't know the photo's scale otherwise). Two realistic approaches:

- **Option A (recommended for a hackathon):** Ask the user to also input the Principal Display Panel dimensions (length × width in cm) manually during upload. Use that to calculate a pixels-per-cm ratio from the image dimensions, then convert detected text bounding-box heights to mm.
- **Option B (harder, more impressive if it works):** Require a reference object of known size in the photo (e.g., ask the user to place a coin or a printed ArUco marker next to the label) and calibrate scale from that.

Don't attempt this without one of these two calibration mechanisms — "estimating real-world size from a photo with no reference" is not solvable in general, and I'd rather tell you that now than have your team spend two days on it. Option A is simpler and good enough for a demo.

---

## 8. Backend — Data Model (MongoDB / Mongoose)

```js
// User
{
  name: String,
  email: String,
  passwordHash: String,
  role: { type: String, enum: ["officer", "admin"] },
  createdAt: Date
}

// Product/Scan
{
  imageUrl: String,
  uploadedBy: ObjectId (ref: User),
  extractedDeclarations: Object,   // the "declarations" object from AI response
  overallStatus: { type: String, enum: ["COMPLIANT", "NON_COMPLIANT", "PENDING"] },
  violations: [String],
  reportPdfUrl: String,
  createdAt: Date
}
```

Keep it to two collections for MVP. Don't add a separate "Violation" or "Rule" collection unless you need to let admins edit rules dynamically through the UI — for a hackathon, hardcoding the rule set in the Python service is fine.

---

## 9. Legal Metrology declarations to check (core set)

⚠️ **Important — verify this against the actual bare Act text before finalizing your rule engine.** These are the standard mandatory declarations under Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011, but exact sub-clause numbers and thresholds (especially font-size-by-panel-area tables under Rule 8) should be cross-checked against the official rules text at consumeraffairs.gov.in before you present this as legally accurate — getting a specific number wrong in front of evaluators who know the rules will hurt more than not attempting font-size checks at all.

Core declarations (Rule 6):
1. Name and address of manufacturer/packer/importer
2. Common or generic name of the commodity
3. Net quantity (in standard units — weight/volume/number)
4. Month and year of manufacture/packing/import
5. Retail Sale Price (MRP), inclusive of all taxes
6. Consumer/customer care details (name, address, phone/email)
7. Country of origin (mandatory for imported goods)
8. Unit sale price (price per standard unit, e.g., price/kg) — applicable to certain categories

Build your rule engine to check for these 8 first. Treat font size (Rule 8) and PDP placement rules as stretch, per §7.4.

---

## 10. Backend API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login

POST   /api/scans              -> upload image, triggers AI analysis, saves result
GET    /api/scans               -> list all scans (paginated, filterable by status)
GET    /api/scans/:id           -> get one scan's full detail
GET    /api/scans/:id/report    -> download PDF report

GET    /api/dashboard/stats     -> counts: total scans, compliant %, non-compliant %, recent activity
```

Keep the API surface this small for MVP. Resist adding endpoints "just in case" — every extra endpoint is extra integration + testing time.

---

## 11. Frontend Pages (Yash)

1. **Login/Register**
2. **Upload page** — drag-drop image, optional manual fields (panel dimensions if doing font-size stretch goal), submit button, loading state while AI processes
3. **Result page** — shows the uploaded image side-by-side with a checklist of declarations (✅/❌ per item), overall status badge, "Download PDF Report" button
4. **Dashboard** — table/cards of past scans with status, search/filter by date/status/product name
5. **Scan detail page** — same as result page but for a historical scan

Keep the UI simple and clean rather than trying to be "AI-flashy" — a clear checklist of pass/fail per declaration, with the actual extracted text shown next to each, is more convincing to evaluators than fancy animations.

---

## 12. PDF Report structure

Simple one-page report:
- Header: Product image thumbnail, scan date, scan ID
- Table: Declaration | Required | Found | Extracted Value | Status
- Overall verdict (COMPLIANT/NON_COMPLIANT) in bold, color-coded
- Footer: generated by [system name], timestamp

Build this as an HTML template first (Yash can design it), then have Akash/Ravi feed it through Puppeteer to generate the PDF server-side — much less fiddly than building a PDF byte-by-byte with pdfkit.

---

## 13. Suggested build order (adjust to your actual timeline)

Don't lock these to specific days without knowing your real deadline — but the **order** matters regardless of how much time you have:

1. **Set up the contract first.** Everyone agrees on the JSON shape in §6 before writing feature code. Akash/Ravi build a mock Python endpoint that returns hardcoded JSON matching the contract, so they can build the full backend+frontend flow without waiting on real OCR.
2. **Sandeep/Gyanish build OCR + regex extraction in isolation**, tested against 10-15 real label photos, independent of the rest of the app.
3. **Akash/Ravi build**: auth, upload endpoint, MongoDB models, and wire the (initially mocked) AI call into a real flow.
4. **Yash builds**: upload UI + result UI against the mocked backend, so frontend isn't blocked either.
5. **Integrate**: swap the mock AI endpoint for Sandeep/Gyanish's real one. This is where you find the bugs — leave real time for this, don't do it the night before the demo.
6. **Add**: dashboard, history, PDF export.
7. **Only if time remains**: font-size stretch goal, multilingual OCR, placement checks.
8. **Polish + record demo + build PPT** (Yash) — do this with a working system, not before.

---

## 14. Honest risks to flag to your team now

- **OCR accuracy on real product photos (glare, curved surfaces, small text) will be your single biggest failure point.** Test with real photos early, not clean sample images.
- **Manufacturer name/address extraction is the hardest field** — it has no fixed format or clear keyword in many labels. Don't over-invest here; a partial match with lower confidence is fine for a demo.
- **Font-size compliance is legally precise but technically hard without a calibration reference** — see §7.4. Be upfront in your demo/PPT that this is a "planned enhancement" if you don't get to it, rather than faking it.
- **Don't claim legal certainty you haven't verified.** Cross-check the rule thresholds against the actual bare act before stating specific numbers in your presentation.

---

## 15. What to put in the PPT (Yash)

- Problem statement (1 slide, condensed)
- Your architecture diagram (§4)
- Live demo (most convincing slide is literally a live upload → result flow)
- What's implemented vs stretch goals — be honest and specific, evaluators respect a clear scope statement over vague claims of "AI-powered full compliance"
- Tech stack slide
- Team + task ownership (shows organized execution, matches this document)
