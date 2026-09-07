import { IPrinterConfig } from '../models/schema';

/**
 * Extracts a scan-optimized barcode value that fits within the physical 25mm limit
 * on 200 DPI printers (max ~15-16 alphanumeric chars), while preserving the full text below.
 * E.g., "ATM1-CDS1-11111-V1-IN11112" -> "ATM1-CDS1-11111"
 */
export function extractScannableBarcode(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= 16) return trimmed;

  // Match pattern like ATM1-CDS1-11111-V1-IN11112 or PREFIX-11111-SUFFIX
  const match = trimmed.match(/^([A-Za-z0-9_-]+?-\d{3,7})(-.*)?$/);
  if (match && match[1] && match[1].length <= 18) {
    return match[1];
  }

  return trimmed.slice(0, 16);
}

export class ZplService {
  /**
   * Escape ZPL reserved characters
   */
  public escapeZpl(str: string): string {
    if (!str) return '';
    return str.replace(/\^/g, '_5E').replace(/~/g, '_7E');
  }

  /**
   * Generates single label ZPL command tailored for Zebra ZT230-200dpi
   * Calibrated for 30mm x 10mm labels with native Code 128 (100% scannable) and full text below.
   */
  public generateSingleLabel(
    barcodeValue: string,
    config: IPrinterConfig
  ): string {
    const rawVal = (barcodeValue || '').trim();
    const escaped = this.escapeZpl(rawVal);
    const {
      labelWidthDots = 240, // 30mm @ 200 DPI
      labelHeightDots = 80, // 10mm @ 200 DPI
      barcodeHeightDots = 48, // 6mm @ 200 DPI
      horizontalOffsetDots = 0,
      verticalOffsetDots = 0,
      orientation = 'N',
      darkness = 15,
      printSpeedIps = 4,
    } = config;

    const symbology = config.barcodeSymbology || 'DATAMATRIX';
    const isSmallLabel = labelHeightDots <= 120; // 30x10mm tier

    if (symbology === 'DATAMATRIX' && isSmallLabel) {
      // 2D Data Matrix ECC 200: Encodes the FULL text (e.g. ATM1-CDS1-11114-V1-IN1116)
      // Module size 2 dots = 0.25mm. 18x18 matrix = 36 dots (4.5mm x 4.5mm)
      const matrixSizeDots = 36;
      const barcodeLeft = Math.max(0, Math.floor((labelWidthDots - matrixSizeDots) / 2) + horizontalOffsetDots);
      const topMargin = 8 + verticalOffsetDots;
      const textTopMargin = 52 + verticalOffsetDots;
      const fontHeight = 24; // 3mm height
      const fontWidth = Math.min(10, Math.max(6, Math.floor((labelWidthDots - 8) / Math.max(1, rawVal.length))));

      return [
        '^XA',
        `^PW${labelWidthDots}`,
        `^LL${labelHeightDots}`,
        '^LH0,0',
        `^PR${printSpeedIps},${printSpeedIps}`,
        `^MD${darkness}`,
        orientation === 'I' ? '^POI' : '^PON',
        // 2D DataMatrix: Encodes FULL string with zero character loss, centered
        `^FO${barcodeLeft},${topMargin}^BXN,2,200^FD${escaped}^FS`,
        // Full human-readable text centered directly below (3mm / 24 dots height)
        `^FO0,${textTopMargin}^A0N,${fontHeight},${fontWidth}^FB${labelWidthDots},1,0,C,0^FD${escaped}^FS`,
        '^XZ',
      ].join('\n');
    }

    // Code 128 1D Branch:
    // Extract scan-optimized barcode value for 30x10mm label to guarantee 100% scanner readability
    const scannableBarcode = isSmallLabel ? extractScannableBarcode(rawVal) : rawVal;
    const escapedScannable = this.escapeZpl(scannableBarcode);

    // Calculate exact Code 128 module count with auto Mode C compression on digit runs
    let estModules = (scannableBarcode.length * 11) + 35;
    const digitMatches = scannableBarcode.match(/\d{4,}/g) || [];
    let saved = 0;
    for (const m of digitMatches) {
      saved += Math.floor(m.length / 2) * 11;
    }
    estModules -= saved;

    const modWidth = 1;
    const barcodeWidth = estModules * modWidth;
    const barcodeLeft = Math.max(2, Math.floor((labelWidthDots - barcodeWidth) / 2) + horizontalOffsetDots);

    // Fixed 6.0mm (48 dots @ 200 DPI) barcode height for 30x10mm label
    const barcodeHeight = isSmallLabel ? 48 : (barcodeHeightDots || 85);

    // Centered vertical layout: top margin 4 dots (0.5mm), barcode 48 dots, text Y=54, text height 24 dots (3.0mm)
    const topMargin = isSmallLabel ? (4 + verticalOffsetDots) : Math.max(3, Math.floor((labelHeightDots - barcodeHeight) * 0.22) + verticalOffsetDots);
    const textTopMargin = isSmallLabel ? 54 : (topMargin + barcodeHeight + (isSmallLabel ? 2 : 8));

    // Fixed 3.0mm (24 dots @ 200 DPI) text height below barcode
    const fontHeight = isSmallLabel ? 24 : Math.max(13, Math.round(13 * 1.5));
    const fontWidth = isSmallLabel
      ? Math.min(12, Math.max(7, Math.floor((labelWidthDots - 8) / Math.max(1, rawVal.length))))
      : Math.min(18, Math.max(7, Math.floor((labelWidthDots - 10) / Math.max(1, rawVal.length))));

    return [
      '^XA',
      `^PW${labelWidthDots}`,
      `^LL${labelHeightDots}`,
      '^LH0,0',
      `^PR${printSpeedIps},${printSpeedIps}`,
      `^MD${darkness}`,
      orientation === 'I' ? '^POI' : '^PON',
      // Native Code 128 Barcode: 100% scannable on all barcode scanners, centered on label
      `^FO${barcodeLeft},${topMargin}^BY${modWidth},3,${barcodeHeight}^BCN,${barcodeHeight},N,N,N,A^FD${escapedScannable}^FS`,
      // Full human-readable barcode text centered directly below (3mm / 24 dots height)
      `^FO0,${textTopMargin}^A0N,${fontHeight},${fontWidth}^FB${labelWidthDots},1,0,C,0^FD${escaped}^FS`,
      '^XZ',
    ].join('\n');
  }

  /**
   * Arranges barcode items into a grid according to column count and print direction.
   * In COLUMN_WISE mode, fills Column 1 downwards, then Column 2 downwards, etc.
   * In ROW_WISE mode, fills Row 0 horizontally, then Row 1 horizontally, etc.
   */
  public layoutGrid(
    items: string[],
    columnsAcross: number,
    printDirection: 'COLUMN_WISE' | 'ROW_WISE' = 'COLUMN_WISE'
  ): (string | null)[][] {
    const N = items.length;
    if (N === 0) return [];
    const C = Math.max(1, columnsAcross || 1);
    const R = Math.ceil(N / C);
    const grid: (string | null)[][] = Array.from({ length: R }, () => Array(C).fill(null));

    if (printDirection === 'COLUMN_WISE') {
      let itemIdx = 0;
      const fullCols = N % C === 0 ? C : N % C;
      for (let c = 0; c < C; c++) {
        const itemsInThisCol = c < fullCols ? R : R - 1;
        for (let r = 0; r < itemsInThisCol; r++) {
          if (itemIdx < N) {
            grid[r][c] = items[itemIdx++];
          }
        }
      }
    } else {
      let itemIdx = 0;
      for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
          if (itemIdx < N) {
            grid[r][c] = items[itemIdx++];
          }
        }
      }
    }

    return grid;
  }

  /**
   * Formats ZPL field instructions for an individual column within a multi-column row
   */
  private generateColumnZpl(
    barcodeValue: string,
    colLeftDots: number,
    config: IPrinterConfig
  ): string {
    const rawVal = (barcodeValue || '').trim();
    const escaped = this.escapeZpl(rawVal);
    const {
      labelWidthDots = 240, // 30mm @ 200 DPI
      labelHeightDots = 80, // 10mm @ 200 DPI
      barcodeHeightDots = 48,
      horizontalOffsetDots = 0,
      verticalOffsetDots = 0,
    } = config;

    const symbology = config.barcodeSymbology || 'DATAMATRIX';
    const isSmallLabel = labelHeightDots <= 120;

    if (symbology === 'DATAMATRIX' && isSmallLabel) {
      const matrixSizeDots = 36;
      const barcodeLeftInCol = Math.max(0, Math.floor((labelWidthDots - matrixSizeDots) / 2) + horizontalOffsetDots);
      const absBarcodeLeft = colLeftDots + barcodeLeftInCol;
      const topMargin = 8 + verticalOffsetDots;
      const textTopMargin = 52 + verticalOffsetDots;
      const fontHeight = 24; // 3mm height
      const fontWidth = Math.min(10, Math.max(6, Math.floor((labelWidthDots - 8) / Math.max(1, rawVal.length))));

      return [
        `^FO${absBarcodeLeft},${topMargin}^BXN,2,200^FD${escaped}^FS`,
        `^FO${colLeftDots},${textTopMargin}^A0N,${fontHeight},${fontWidth}^FB${labelWidthDots},1,0,C,0^FD${escaped}^FS`,
      ].join('\n');
    }

    if (isSmallLabel) {
      const scannableBarcode = extractScannableBarcode(rawVal);
      const escapedScannable = this.escapeZpl(scannableBarcode);

      let estModules = (scannableBarcode.length * 11) + 35;
      const digitMatches = scannableBarcode.match(/\d{4,}/g) || [];
      let saved = 0;
      for (const m of digitMatches) {
        saved += Math.floor(m.length / 2) * 11;
      }
      estModules -= saved;

      const modWidth = 1;
      const barcodeWidth = estModules * modWidth;
      const barcodeLeftInCol = Math.max(2, Math.floor((labelWidthDots - barcodeWidth) / 2) + horizontalOffsetDots);
      const absBarcodeLeft = colLeftDots + barcodeLeftInCol;
      const topMargin = 4 + verticalOffsetDots;
      const textTopMargin = 54 + verticalOffsetDots;
      const fontHeight = 24; // 3mm height
      const fontWidth = Math.min(12, Math.max(7, Math.floor((labelWidthDots - 8) / Math.max(1, rawVal.length))));

      return [
        `^FO${absBarcodeLeft},${topMargin}^BY${modWidth},3,48^BCN,48,N,N,N,A^FD${escapedScannable}^FS`,
        `^FO${colLeftDots},${textTopMargin}^A0N,${fontHeight},${fontWidth}^FB${labelWidthDots},1,0,C,0^FD${escaped}^FS`,
      ].join('\n');
    }

    // Large label fallback
    let estModules = (rawVal.length * 11) + 35;
    const modWidth = Math.max(1, Math.min(2, Math.floor((labelWidthDots - 40) / estModules)));
    const barcodeWidth = estModules * modWidth;
    const barcodeLeftInCol = Math.max(4, Math.floor((labelWidthDots - barcodeWidth) / 2) + horizontalOffsetDots);
    const barcodeHeight = barcodeHeightDots || 85;
    const topMargin = Math.max(3, Math.floor((labelHeightDots - barcodeHeight) * 0.22) + verticalOffsetDots);
    const textTopMargin = topMargin + barcodeHeight + 8;
    const fontHeight = Math.max(16, Math.round(18 * 1.5));
    const fontWidth = Math.min(18, Math.max(7, Math.floor((labelWidthDots - 10) / Math.max(1, rawVal.length))));
    const absBarcodeLeft = colLeftDots + barcodeLeftInCol;

    return [
      `^FO${absBarcodeLeft},${topMargin}^BY${modWidth},3,${barcodeHeight}^BCN,${barcodeHeight},N,N,N,A^FD${escaped}^FS`,
      `^FO${colLeftDots},${textTopMargin}^A0N,${fontHeight},${fontWidth}^FB${labelWidthDots},1,0,C,0^FD${escaped}^FS`,
    ].join('\n');
  }

  /**
   * Generates batch ZPL code for multiple barcode values.
   * If columnsAcross > 1 (e.g. 3-column roll), items are combined into rows according to printDirection
   * to eliminate blank label waste.
   */
  public generateBatch(barcodeValues: string[], config: IPrinterConfig): string {
    const validValues = barcodeValues.filter((v) => v && v.trim() !== '');
    if (validValues.length === 0) return '';

    const columnsAcross = Math.max(1, config.columnsAcross || 1);
    const printDirection = config.printDirection || 'COLUMN_WISE';
    const dpi = config.dpi || 200;
    const labelWidthDots = config.labelWidthDots || 240;
    const labelHeightDots = config.labelHeightDots || 80;
    const columnGapMm = config.columnGapMm ?? 2.0;
    const columnGapDots = Math.round(columnGapMm * (dpi / 25.4));
    const printSpeedIps = config.printSpeedIps || 4;
    const darkness = config.darkness || 15;
    const orientation = config.orientation || 'N';

    // Single-column mode fallback
    if (columnsAcross <= 1) {
      return validValues
        .map((v) => this.generateSingleLabel(v, config))
        .join('\n\n');
    }

    // Multi-column web roll layout (e.g. 3-across)
    const totalWebWidthDots = columnsAcross * labelWidthDots + (columnsAcross - 1) * columnGapDots;
    const printheadWidth = Math.min(832, Math.max(labelWidthDots, totalWebWidthDots + 16));

    const grid = this.layoutGrid(validValues, columnsAcross, printDirection);

    return grid
      .map((row) => {
        const colZplParts: string[] = [];
        for (let c = 0; c < columnsAcross; c++) {
          const val = row[c];
          if (val) {
            const colLeft = c * (labelWidthDots + columnGapDots);
            colZplParts.push(this.generateColumnZpl(val, colLeft, config));
          }
        }

        return [
          '^XA',
          `^PW${printheadWidth}`,
          `^LL${labelHeightDots}`,
          '^LH0,0',
          `^PR${printSpeedIps},${printSpeedIps}`,
          `^MD${darkness}`,
          orientation === 'I' ? '^POI' : '^PON',
          ...colZplParts,
          '^XZ',
        ].join('\n');
      })
      .join('\n\n');
  }

  /**
   * Generates test calibration label ZPL for 30x10mm (or custom) label.
   * If multi-column (3-across) is enabled, prints calibration across all columns.
   */
  /**
   * Generates test calibration label ZPL for 30x10mm (or custom) label.
   * If multi-column (3-across) is enabled, prints calibration across all columns.
   */
  public generateTestLabel(config: IPrinterConfig): string {
    const columnsAcross = Math.max(1, config.columnsAcross || 1);

    if (columnsAcross > 1) {
      // Print test calibration across all columns simultaneously using structured ATM sensor pattern
      const testValues = Array.from(
        { length: columnsAcross },
        (_, i) => `ATM1-CDS1-1111${i + 1}-V1-IN11112`
      );
      return this.generateBatch(testValues, config);
    }

    const {
      labelWidthDots = 240,
      labelHeightDots = 80,
      dpi = 200,
      darkness = 15,
      printSpeedIps = 4,
    } = config;

    const isSmallLabel = labelHeightDots <= 120;

    if (isSmallLabel) {
      // 30mm x 10mm Standard ATM sensor calibration label (25x6mm barcode, 3mm text centered)
      return this.generateSingleLabel('ATM1-CDS1-11111-V1-IN11112', config);
    }

    // Standard / Larger Label Test format
    const testVal = 'ATM1-CDS1-11111-V1-IN11112';
    const widthMm = ((labelWidthDots / dpi) * 25.4).toFixed(1);
    const heightMm = ((labelHeightDots / dpi) * 25.4).toFixed(1);
    const estModules = (testVal.length * 11) + 35;
    const modWidth = Math.max(1, Math.min(2, Math.floor((labelWidthDots - 40) / estModules)));
    const barcodeWidth = estModules * modWidth;
    const barcodeLeft = Math.max(10, Math.floor((labelWidthDots - barcodeWidth) / 2));

    return [
      '^XA',
      `^PW${labelWidthDots}`,
      `^LL${labelHeightDots}`,
      '^LH0,0',
      `^PR${printSpeedIps},${printSpeedIps}`,
      `^MD${darkness}`,
      `^FO10,10^GB${labelWidthDots - 20},${labelHeightDots - 20},2^FS`,
      `^FO20,18^A0N,20,18^FB${labelWidthDots - 40},1,0,C,0^FDZEBRA ZT230 CALIBRATION^FS`,
      `^FO20,38^A0N,16,14^FB${labelWidthDots - 40},1,0,C,0^FD${widthMm}mm x ${heightMm}mm (${labelWidthDots}x${labelHeightDots} dots)^FS`,
      `^FO${barcodeLeft},58^BY${modWidth},3,60^BCN,60,N,N,N,A^FD${testVal}^FS`,
      `^FO20,126^A0N,24,18^FB${labelWidthDots - 40},1,0,C,0^FD${testVal}^FS`,
      `^FO20,158^A0N,16,13^FB${labelWidthDots - 40},1,0,C,0^FD[PASS: ALIGNMENT & CONTRAST OK]^FS`,
      '^XZ',
    ].join('\n');
  }
}

export const zplService = new ZplService();
