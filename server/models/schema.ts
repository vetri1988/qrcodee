export interface IBarcodeLabel {
  id: string;
  barcodeValue: string;
  barcodeType: string;
  sensorType?: string;
  atmType?: string;
  createdAt: string;
  updatedAt: string;
  printedAt?: string;
  printCount: number;
  batchId?: string;
  status: 'PENDING' | 'VALID' | 'PRINTED' | 'FAILED' | 'REPRINTED';
}

export interface IPrintBatch {
  id: string;
  batchNumber: string;
  labels: {
    barcodeValue: string;
    barcodeType: string;
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

export interface IPrinterConfig {
  id: string;
  printerName: string;
  printerModel: string;
  printerLanguage: string;
  dpi: number;
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
  orientation: 'N' | 'I';
  duplicatePolicy: 'PREVENT' | 'WARN' | 'ALLOW';
  printMode: string;
  agentUrl: string;
  isDefault: boolean;
  columnsAcross?: number;
  columnGapMm?: number;
  printDirection?: 'COLUMN_WISE' | 'ROW_WISE';
  barcodeSymbology?: 'DATAMATRIX' | 'CODE128';
  updatedAt: string;
}

export interface IAuditLog {
  id: string;
  timestamp: string;
  action: string;
  batchNumber?: string;
  barcodeValue?: string;
  printerName: string;
  status: string;
  details: string;
}
