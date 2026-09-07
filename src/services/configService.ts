import { PrinterConfig } from '../types';
import { mmToDots, mmToInches } from '../utils/dimensions';

export const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
  id: 'cfg_zt230_default',
  printerName: 'ZDesigner ZT230-200dpi ZPL',
  printerModel: 'ZT230',
  printerLanguage: 'ZPL',
  dpi: 200,
  labelWidthMm: 30.0,
  labelHeightMm: 10.0,
  labelWidthInches: mmToInches(30.0),
  labelHeightInches: mmToInches(10.0),
  labelWidthDots: mmToDots(30.0, 200), // 240 dots
  labelHeightDots: mmToDots(10.0, 200), // 80 dots
  horizontalOffsetDots: 0,
  verticalOffsetDots: 0,
  barcodeHeightDots: 40, // 5mm @ 200 DPI
  moduleWidthDots: 1,
  humanReadableFontSizeDots: 18,
  printSpeedIps: 4,
  darkness: 15,
  orientation: 'N',
  duplicatePolicy: 'PREVENT',
  printMode: 'ZPL_DIRECT',
  agentUrl: 'http://localhost:9100/api/printer/zpl',
  isDefault: true,
  columnsAcross: 3,
  columnGapMm: 2.0,
  printDirection: 'COLUMN_WISE',
  barcodeSymbology: 'DATAMATRIX',
};

const STORAGE_KEY = 'atm_sensor_printer_config_v3';

export function loadStoredPrinterConfig(): PrinterConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_PRINTER_CONFIG, ...parsed };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_PRINTER_CONFIG };
}

export function saveStoredPrinterConfig(config: PrinterConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export const configService = {
  getConfig: loadStoredPrinterConfig,
  saveConfig: saveStoredPrinterConfig,
  getDefaultConfig: () => DEFAULT_PRINTER_CONFIG,
};

