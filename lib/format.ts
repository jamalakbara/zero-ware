/**
 * Format number to fixed decimal places
 */
export function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0.00";
  }
  return value.toFixed(decimals);
}

/**
 * Format percentage with 2 decimal places
 */
export function formatPercentage(value: number | null | undefined): string {
  return formatNumber(value, 2) + "%";
}

/**
 * Format currency or large numbers with locale formatting
 */
export function formatLocaleNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0";
  }
  return value.toLocaleString();
}

/**
 * Calculate percentage with proper formatting
 */
export function calculatePercentage(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return parseFloat(((numerator / denominator) * 100).toFixed(2));
}
