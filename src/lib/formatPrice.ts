/**
 * GST rate for Australia (10%)
 */
export const GST_RATE = 0.10;

/**
 * Applies GST to a price
 * @param priceExGST - The price excluding GST
 * @returns Price including GST
 */
export const applyGST = (priceExGST: number): number => {
  return priceExGST * (1 + GST_RATE);
};

/**
 * Calculates GST amount from a GST-inclusive price
 * @param priceIncGST - The price including GST
 * @returns GST amount
 */
export const calculateGSTAmount = (priceIncGST: number): number => {
  return priceIncGST - (priceIncGST / (1 + GST_RATE));
};

/**
 * Formats a price by rounding to the nearest dollar
 * @param price - The price to format (already includes GST)
 * @returns Formatted price string without decimal places
 */
export const formatPrice = (price: number): string => {
  return Math.round(price).toLocaleString();
};

/**
 * Formats a price with currency symbol
 * @param price - The price to format (already includes GST)
 * @param showGST - Whether to show "inc GST" indicator
 * @returns Formatted price string with $ symbol
 */
export const formatCurrency = (price: number, showGST: boolean = false): string => {
  const formatted = `$${formatPrice(price)}`;
  return showGST ? `${formatted} inc GST` : formatted;
};