/**
 * Demonstration Packaging Label Datasets (Mock Cases for Testing)
 * These mock datasets represent backend-contract-shaped packaging examples.
 * The frontend does not define legal rules; all logic reflects backend-supplied standards.
 */

export interface PresetLabelSample {
  id: string;
  name: string;
  category: string;
  status: 'compliant' | 'violation' | 'review';
  description: string;
  imageUrl: string;
  fileSize: number;
  fileName: string;
}

// Crisp packaging label for Sample A (Apex Nutri-Flakes with statutory infractions)
const cerealLabelSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#f1f5f9"/>
    </linearGradient>
  </defs>
  <!-- Outer Packaging Canvas -->
  <rect width="800" height="1000" fill="url(#bgGrad)" stroke="#cbd5e1" stroke-width="4"/>

  <!-- Top Banner / Brand Header -->
  <rect x="30" y="30" width="740" height="160" rx="8" fill="#0f2744"/>
  <text x="400" y="90" font-family="Inter, sans-serif" font-size="34" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1">APEX NUTRITION</text>
  <text x="400" y="130" font-family="Inter, sans-serif" font-size="20" font-weight="600" fill="#38bdf8" text-anchor="middle">MULTI-GRAIN BREAKFAST FLAKES</text>
  <text x="400" y="160" font-family="Inter, sans-serif" font-size="12" font-weight="400" fill="#94a3b8" text-anchor="middle">FORTIFIED WITH STATUTORY ESSENTIAL MICRONUTRIENTS</text>

  <!-- Statutory Green Vegetarian Emblem (Top Right) -->
  <rect x="680" y="50" width="60" height="60" rx="4" fill="#ffffff" stroke="#059669" stroke-width="3"/>
  <circle cx="710" cy="80" r="16" fill="#059669"/>

  <!-- Product Illustration / Artwork Box -->
  <rect x="50" y="210" width="700" height="240" rx="6" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/>
  <rect x="70" y="230" width="660" height="200" rx="4" fill="#ffffff"/>
  <text x="400" y="310" font-family="Inter, sans-serif" font-size="24" font-weight="700" fill="#334155" text-anchor="middle">[ PRODUCT BRAND GRAPHIC &amp; SERVING DISCLOSURE ]</text>
  <text x="400" y="340" font-family="Inter, sans-serif" font-size="13" font-weight="500" fill="#64748b" text-anchor="middle">High Dietary Fiber • 0g Added Trans Fats • Iron &amp; Zinc Fortified</text>

  <!-- Ingredients & Allergen Declaration Section -->
  <rect x="50" y="470" width="700" height="160" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <text x="70" y="500" font-family="Inter, sans-serif" font-size="14" font-weight="700" fill="#0f172a">INGREDIENTS DECLARATION (IN DESCENDING ORDER):</text>
  <text x="70" y="525" font-family="Inter, sans-serif" font-size="12" font-weight="400" fill="#334155">Rolled Whole Oats (42%), Degermed Maize Grits (28%), Whole Wheat Flakes (18%),</text>
  <text x="70" y="545" font-family="Inter, sans-serif" font-size="12" font-weight="400" fill="#334155">Invert Sugar Syrup, Malt Extract, Iodized Salt, Emulsifier (INS 322), Antioxidant (INS 307b).</text>
  
  <!-- Allergen Warning Box (Low contrast notice) -->
  <rect x="65" y="570" width="670" height="40" rx="4" fill="#fef3c7" stroke="#fde68a" stroke-width="1.5"/>
  <text x="75" y="595" font-family="Inter, sans-serif" font-size="11" font-weight="600" fill="#92400e">ALLERGEN DECLARATION: CONTAINS WHEAT, BARLEY &amp; SOY. MAY CONTAIN TRACES OF TREE NUTS.</text>

  <!-- Legal Metrology & Packaging Declarations Grid -->
  <rect x="50" y="650" width="700" height="230" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>

  <!-- Net Quantity Region (Font too small violation) -->
  <rect x="70" y="670" width="320" height="70" rx="4" fill="#f8fafc" stroke="#94a3b8" stroke-dasharray="3 3"/>
  <text x="80" y="695" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="#0f172a">NET QUANTITY (LEGAL METROLOGY):</text>
  <text x="80" y="720" font-family="Inter, sans-serif" font-size="13" font-weight="700" fill="#0f172a">NET WEIGHT: 500g (17.63 oz)</text>
  <text x="80" y="734" font-family="JetBrains Mono, monospace" font-size="9" fill="#dc2626">[Infraction: Declared print height 1.8mm &lt; 4.0mm statutory min]</text>

  <!-- FSSAI License & Statutory Logo -->
  <rect x="410" y="670" width="320" height="70" rx="4" fill="#f8fafc" stroke="#94a3b8" stroke-dasharray="3 3"/>
  <text x="420" y="695" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="#0f172a">FSSAI STATUTORY LICENSE:</text>
  <text x="420" y="720" font-family="JetBrains Mono, monospace" font-size="13" font-weight="600" fill="#0f172a">LIC NO: 10012011000189</text>

  <!-- Manufacturing Date & Batch Number -->
  <rect x="70" y="760" width="320" height="100" rx="4" fill="#f8fafc" stroke="#94a3b8" stroke-dasharray="3 3"/>
  <text x="80" y="785" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="#0f172a">MANUFACTURE DATE &amp; BATCH:</text>
  <text x="80" y="810" font-family="JetBrains Mono, monospace" font-size="12" fill="#0f172a">MFG DATE: 15/06/2026</text>
  <text x="80" y="830" font-family="JetBrains Mono, monospace" font-size="12" fill="#0f172a">BATCH LOT: LOT-2026-X89</text>
  <text x="80" y="850" font-family="JetBrains Mono, monospace" font-size="12" fill="#0f172a">MRP (INCL. OF ALL TAXES): ₹185.00</text>

  <!-- Expiry / Best Before Region (Missing Date Infraction) -->
  <rect x="410" y="760" width="320" height="100" rx="4" fill="#fef2f2" stroke="#f87171" stroke-width="1.5"/>
  <text x="420" y="785" font-family="Inter, sans-serif" font-size="11" font-weight="700" fill="#991b1b">EXPIRY / BEST BEFORE DECLARATION:</text>
  <text x="420" y="815" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700" fill="#dc2626">[ FIELD BLANK / MISSING FROM PRINT ]</text>
  <text x="420" y="840" font-family="Inter, sans-serif" font-size="10" fill="#991b1b">Statutory Failure: Rule 6(1)(d) Best Before omitted</text>

  <!-- Manufacturer Address & Consumer Grievance -->
  <rect x="50" y="900" width="700" height="70" rx="4" fill="#0f172a"/>
  <text x="70" y="925" font-family="Inter, sans-serif" font-size="10" font-weight="600" fill="#f8fafc">MANUFACTURED &amp; PACKED BY: Apex Nutrition Consumer Ltd., Plot 42-A, Industrial Growth Centre, Greater Noida, UP - 201306</text>
  <text x="70" y="945" font-family="Inter, sans-serif" font-size="9" fill="#94a3b8">Customer Grievance Officer: care@apexnutrition.co.in | Toll-Free: 1800-102-8910 | National Barcode: 8901030829104</text>
</svg>
`.trim();

const cerealLabelDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(cerealLabelSvg)}`;

// Sample B (Fully Compliant Dairy Label)
const dairyLabelSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <rect width="800" height="1000" fill="#ffffff" stroke="#94a3b8" stroke-width="4"/>
  <rect x="30" y="30" width="740" height="140" fill="#0284c7" rx="8"/>
  <text x="400" y="85" font-family="Inter, sans-serif" font-size="32" font-weight="800" fill="#ffffff" text-anchor="middle">APEX DAIRY FARMS</text>
  <text x="400" y="125" font-family="Inter, sans-serif" font-size="18" font-weight="600" fill="#e0f2fe" text-anchor="middle">STANDARDIZED PASTEURIZED MILK 1 LITRE</text>
  <rect x="680" y="50" width="50" height="50" fill="#ffffff" stroke="#059669" stroke-width="3" rx="4"/>
  <circle cx="705" cy="75" r="14" fill="#059669"/>
  <rect x="50" y="190" width="700" height="260" fill="#f0f9ff" stroke="#bae6fd" stroke-width="2" rx="6"/>
  <text x="400" y="320" font-family="Inter, sans-serif" font-size="22" font-weight="700" fill="#0369a1" text-anchor="middle">100% FARM FRESH • HOMOGENIZED</text>
  <rect x="50" y="470" width="700" height="480" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" rx="6"/>
  <text x="80" y="510" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#0f172a">NET QUANTITY: 1000 ml (1.0 L)</text>
  <text x="80" y="550" font-family="JetBrains Mono, monospace" font-size="14" fill="#0f172a">FSSAI CENTRAL LICENSE: 10012011000999</text>
  <text x="80" y="590" font-family="JetBrains Mono, monospace" font-size="14" fill="#0f172a">MFG &amp; PACKED DATE: 07/09/2026 04:30 AM</text>
  <text x="80" y="630" font-family="JetBrains Mono, monospace" font-size="14" font-weight="700" fill="#059669">USE BY DATE: 09/09/2026 (48 HOURS FROM PACK)</text>
  <text x="80" y="670" font-family="JetBrains Mono, monospace" font-size="14" fill="#0f172a">MRP (INCLUSIVE OF ALL TAXES): ₹68.00</text>
  <text x="80" y="710" font-family="Inter, sans-serif" font-size="12" fill="#475569">STORAGE: KEEP REFRIGERATED AT OR BELOW 4°C</text>
  <text x="80" y="750" font-family="Inter, sans-serif" font-size="12" fill="#475569">GTIN BARCODE: 8901030999011</text>
</svg>
`.trim();

const dairyLabelDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(dairyLabelSvg)}`;

// Sample C (Herbal Infusion - Review required)
const teaLabelSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <rect width="800" height="1000" fill="#fdfbf7" stroke="#94a3b8" stroke-width="4"/>
  <rect x="30" y="30" width="740" height="140" fill="#2d3748" rx="8"/>
  <text x="400" y="85" font-family="Inter, sans-serif" font-size="32" font-weight="800" fill="#ffffff" text-anchor="middle">BOTANICAL HERBALS</text>
  <text x="400" y="125" font-family="Inter, sans-serif" font-size="18" font-weight="600" fill="#d69e2e" text-anchor="middle">PURE HERBAL GREEN TEA INFUSION 100g</text>
  <rect x="50" y="190" width="700" height="760" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="6"/>
  <text x="80" y="240" font-family="Inter, sans-serif" font-size="15" font-weight="700" fill="#1a202c">NET WEIGHT: 100g (3.52 oz)</text>
  <text x="80" y="280" font-family="JetBrains Mono, monospace" font-size="13" fill="#1a202c">FSSAI LIC NO: 10012011000333</text>
  <text x="80" y="320" font-family="JetBrains Mono, monospace" font-size="13" fill="#1a202c">BEST BEFORE: 24 MONTHS FROM MANUFACTURE</text>
  <text x="80" y="360" font-family="JetBrains Mono, monospace" font-size="13" fill="#d97706">[ATTN REVIEW: Serving size table lacks standardized cup metric]</text>
</svg>
`.trim();

const teaLabelDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(teaLabelSvg)}`;

export const PRESET_LABEL_SAMPLES: PresetLabelSample[] = [
  {
    id: 'sample_cereal_violations',
    name: 'Sample A: Fortified Cereal Flakes',
    category: 'Packaged Food / Cereals',
    status: 'violation',
    description: 'Mandatory statutory expiry date omitted + Net quantity declaration font size below statutory 4.0mm minimum.',
    imageUrl: cerealLabelDataUri,
    fileSize: 1845200,
    fileName: 'apex_multigrain_flakes_label.svg',
  },
  {
    id: 'sample_dairy_compliant',
    name: 'Sample B: Pasteurized Milk 1L',
    category: 'Dairy Products',
    status: 'compliant',
    description: '100% compliant with Legal Metrology and FSSAI packaging & licensing rules.',
    imageUrl: dairyLabelDataUri,
    fileSize: 1420100,
    fileName: 'apex_milk_carton_label.svg',
  },
  {
    id: 'sample_tea_review',
    name: 'Sample C: Herbal Tea Infusion',
    category: 'Beverages',
    status: 'review',
    description: 'Statutory declarations valid; serving size breakdown requires auditor manual sign-off.',
    imageUrl: teaLabelDataUri,
    fileSize: 1210400,
    fileName: 'botanical_green_tea_label.svg',
  },
];
