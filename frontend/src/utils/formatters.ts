/**
 * Institutional Data Formatters
 */

export function formatGTIN(gtin: string): string {
  if (!gtin) return '—';
  // Standard formatting with space grouping e.g. 8901 0308 2910 4
  return gtin.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatConfidenceScore(score: number): string {
  return `${(score * 100).toFixed(0)}%`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
