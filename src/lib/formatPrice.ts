/**
 * Formats a price by rounding to the nearest dollar
 * @param price - The price to format
 * @returns Formatted price string without decimal places
 */
export const formatPrice = (price: number): string => {
  return Math.round(price).toLocaleString();
};

/**
 * Formats a price with currency symbol
 * @param price - The price to format
 * @returns Formatted price string with $ symbol
 */
export const formatCurrency = (price: number): string => {
  return `$${formatPrice(price)}`;
};