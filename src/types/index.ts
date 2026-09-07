export type BarcodeType = 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'ITF' | 'QR';

export type DuplicatePolicy = 'PREVENT' | 'WARN' | 'ALLOW';

export type PrintMode = 'ZPL_DIRECT' | 'PRINTER_AGENT' | 'BROWSER_PRINT' | 'SYSTEM_PRINT';

export type PrinterStatus = 'CONNECTED' | 'DISCONNECTED' | 'PRINTING' | 'ERROR' | 'OFFLINE';

export interface PrinterConfig {
  id?: string;
  printerName: string;
  printerModel: string;
  printerLanguage: 'ZPL' | 'EPL' | 'CPCL';
  dpi: 200 | 300 | 600;
  labelWidthMm: number;
  labelHeightMm: number;
  labelWidthInches: number;
  labelHeightInches: number;
  labelWidthDots: number;
  labelHeightDots: number;
  horizontalOffsetDots: number;
  verticalOffsetDots: number;
  barcodeHeightDots: number;
  moduleWidthDots: number;
  humanReadableFontSizeDots: number;
  printSpeedIps: number;
  darkness: number;
  orientation: 'N' | 'I'; // Normal or Inverted
  duplicatePolicy: DuplicatePolicy;
  printMode: PrintMode;
  agentUrl: string;
  isDefault: boolean;
  columnsAcross?: number; // 1, 2, 3, 4 columns across physical roll (default: 3)
  columnGapMm?: number; // Gap between columns in mm (default: 2.0)
  printDirection?: 'COLUMN_WISE' | 'ROW_WISE'; // Print order (default: COLUMN_WISE)
  barcodeSymbology?: 'DATAMATRIX' | 'CODE128'; // Symbology type (default: DATAMATRIX for 30x10mm)
}

export interface BarcodeItem {
  id: string;
  rowNumber: number;
  barcodeValue: string;
  barcodeType?: BarcodeType;
  sensorType?: string;
  atmType?: string;
  isValid: boolean;
  validationError?: string;
  isDuplicate?: boolean;
  printCount?: number;
  status?: 'PENDING' | 'VALID' | 'INVALID' | 'PRINTED';
}

export interface PrintBatchRecord {
  _id?: string;
  id: string;
  batchNumber: string;
  labels: {
    barcodeValue: string;
    barcodeType: BarcodeType;
    sensorType?: string;
    atmType?: string;
    printedAt?: string;
    printCount: number;
    status: 'SUCCESS' | 'FAILED' | 'REPRINTED';
  }[];
  totalLabels: number;
  successfulLabels: number;
  failedLabels: number;
  printerName: string;
  printerDpi: number;
  labelDimensions: {
    widthMm: number;
    heightMm: number;
    widthDots: number;
    heightDots: number;
  };
  zplCode?: string;
  createdAt: string;
  printedAt?: string;
  status: 'QUEUED' | 'COMPLETED' | 'FAILED' | 'REPRINTED';
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'PRINT_BATCH' | 'REPRINT_BATCH' | 'REPRINT_ITEM' | 'TEST_PRINT' | 'SETTINGS_UPDATE';
  batchNumber?: string;
  barcodeValue?: string;
  printerName: string;
  status: 'SUCCESS' | 'FAILURE';
  details: string;
}

export interface ZplGenerationOptions {
  barcodeValue: string;
  labelWidthDots: number;
  labelHeightDots: number;
  dpi: number;
  barcodeHeightDots: number;
  moduleWidthDots: number;
  humanReadableFontSizeDots: number;
  horizontalOffsetDots?: number;
  verticalOffsetDots?: number;
  orientation?: 'N' | 'I';
  printDarkness?: number;
  printSpeedIps?: number;
}
