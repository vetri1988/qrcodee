/**
 * Dimension and unit conversion utilities for Zebra label printers.
 * Handles conversions between Millimeters (mm), Inches (in), and Printer Dots (dots)
 * based on the target printer DPI (typically 200 DPI for Zebra ZT230-200dpi ZPL).
 */

export const DEFAULT_DPI = 200;

// Standard ATM Sensor sticker physical default: 30mm x 10mm (with 25mm x 6mm centered barcode and 3mm text)
export const DEFAULT_LABEL_WIDTH_MM = 30.0;
export const DEFAULT_LABEL_HEIGHT_MM = 10.0;
export const DEFAULT_BARCODE_WIDTH_MM = 25.0;
export const DEFAULT_BARCODE_HEIGHT_MM = 6.0;
export const DEFAULT_TEXT_HEIGHT_MM = 3.0;

/**
 * Converts Millimeters to Printer Dots.
 * Formula: (mm / 25.4) * DPI
 */
export function mmToDots(mm: number, dpi: number = DEFAULT_DPI): number {
  if (!mm || mm <= 0) return 0;
  return Math.round((mm / 25.4) * dpi);
}

/**
 * Converts Inches to Printer Dots.
 * Formula: inches * DPI
 */
export function inchesToDots(inches: number, dpi: number = DEFAULT_DPI): number {
  if (!inches || inches <= 0) return 0;
  return Math.round(inches * dpi);
}

/**
 * Converts Printer Dots to Millimeters.
 * Formula: (dots / DPI) * 25.4
 */
export function dotsToMm(dots: number, dpi: number = DEFAULT_DPI): number {
  if (!dots || dots <= 0) return 0;
  return Number(((dots / dpi) * 25.4).toFixed(2));
}

/**
 * Converts Printer Dots to Inches.
 * Formula: dots / DPI
 */
export function dotsToInches(dots: number, dpi: number = DEFAULT_DPI): number {
  if (!dots || dots <= 0) return 0;
  return Number((dots / dpi).toFixed(3));
}

/**
 * Converts Millimeters to Inches.
 */
export function mmToInches(mm: number): number {
  if (!mm || mm <= 0) return 0;
  return Number((mm / 25.4).toFixed(3));
}

/**
 * Converts Inches to Millimeters.
 */
export function inchesToMm(inches: number): number {
  if (!inches || inches <= 0) return 0;
  return Number((inches * 25.4).toFixed(2));
}
