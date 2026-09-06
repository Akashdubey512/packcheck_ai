/**
 * Centralized Legal Metrology (Packaged Commodities) Rules, 2011 Declaration Mapping
 * Maps exact backend contract keys to official Indian Legal Metrology titles, sub-rules, and descriptions.
 * 
 * CONTRACT KEYS (STRICT SINGLE SOURCE OF TRUTH):
 * - manufacturer_name_address
 * - net_quantity
 * - mrp
 * - mfg_date
 * - consumer_care
 * - country_of_origin
 * - generic_name
 * - unit_sale_price
 */

export const DECLARATION_KEYS = [
  "manufacturer_name_address",
  "generic_name",
  "net_quantity",
  "mfg_date",
  "mrp",
  "consumer_care",
  "country_of_origin",
  "unit_sale_price",
];

export const DECLARATION_METADATA = {
  manufacturer_name_address: {
    key: "manufacturer_name_address",
    label: "Manufacturer / Packer / Importer Name & Address",
    ruleRef: "Rule 6(1)(a)",
    description: "Name and complete address of the manufacturer, packer, or importer.",
    isRequired: true,
  },
  generic_name: {
    key: "generic_name",
    label: "Common or Generic Name of Commodity",
    ruleRef: "Rule 6(1)(b)",
    description: "The common or generic name of the commodity contained in the package.",
    isRequired: true,
  },
  net_quantity: {
    key: "net_quantity",
    label: "Net Quantity",
    ruleRef: "Rule 6(1)(c)",
    description: "Net quantity in terms of standard unit of weight, measure, or number.",
    isRequired: true,
  },
  mfg_date: {
    key: "mfg_date",
    label: "Month & Year of Manufacture / Packing / Import",
    ruleRef: "Rule 6(1)(d)",
    description: "Month and year in which the commodity is manufactured or packed or imported.",
    isRequired: true,
  },
  mrp: {
    key: "mrp",
    label: "Maximum Retail Price (MRP)",
    ruleRef: "Rule 6(1)(e)",
    description: "Retail sale price of the package inclusive of all taxes (e.g. ₹... incl. of all taxes).",
    isRequired: true,
  },
  consumer_care: {
    key: "consumer_care",
    label: "Consumer Care Details",
    ruleRef: "Rule 6(1)(n)",
    description: "Name, address, telephone number, or email address for consumer complaints.",
    isRequired: true,
  },
  country_of_origin: {
    key: "country_of_origin",
    label: "Country of Origin",
    ruleRef: "Rule 6(1)(m)",
    description: "Name of the country of origin or manufacture if imported.",
    isRequired: true,
  },
  unit_sale_price: {
    key: "unit_sale_price",
    label: "Unit Sale Price",
    ruleRef: "Rule 6(1)(11)",
    description: "Price per unit measure (e.g., per gram, per kg, per litre) where applicable.",
    isRequired: false,
  },
};

/**
 * Format raw float confidence into percentage string (e.g. 0.91 -> 91%)
 */
export function formatConfidence(confidence) {
  if (typeof confidence !== "number" || isNaN(confidence)) return "N/A";
  return `${Math.round(confidence * 100)}%`;
}
