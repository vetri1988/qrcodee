import { IBarcodeLabel, IPrintBatch, IPrinterConfig, IAuditLog } from '../models/schema';

// In-Memory Durable Store with MongoDB / Mongoose compatibility
class DatabaseService {
  private labels: Map<string, IBarcodeLabel> = new Map();
  private batches: Map<string, IPrintBatch> = new Map();
  private configs: Map<string, IPrinterConfig> = new Map();
  private auditLogs: IAuditLog[] = [];
  private batchCounter = 125;

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    // Default Printer Config for Zebra ZT230-200dpi ZPL calibrated for 30x10mm labels
    const defaultConfig: IPrinterConfig = {
      id: 'cfg_zt230_default',
      printerName: 'ZDesigner ZT230-200dpi ZPL',
      printerModel: 'ZT230',
      printerLanguage: 'ZPL',
      dpi: 200,
      labelWidthMm: 30.0,
      labelHeightMm: 10.0,
      labelWidthInches: 1.181,
      labelHeightInches: 0.394,
      labelWidthDots: 240,
      labelHeightDots: 80,
      horizontalOffsetDots: 0,
      verticalOffsetDots: 0,
      barcodeHeightDots: 48, // 6mm @ 200 DPI
      moduleWidthDots: 1,
      humanReadableFontSizeDots: 24, // 3mm @ 200 DPI
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
      updatedAt: new Date().toISOString(),
    };
    this.configs.set(defaultConfig.id, defaultConfig);

    // Seed sample batch matching 30x10mm ATM sensor labels (25x6mm barcode, 3mm text centered)
    const sampleBatchNumber = 'BATCH-000125';
    const sampleLabels = [
      {
        barcodeValue: 'ATM1-CDS1-11111-V1-IN11112',
        barcodeType: 'CODE128',
        sensorType: 'Cash Dispenser Sensor (CDS)',
        atmType: 'ATM Series 1',
        printedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        printCount: 1,
        status: 'SUCCESS' as const,
      },
      {
        barcodeValue: 'ATM1-CDS1-11112-V1-IN11112',
        barcodeType: 'CODE128',
        sensorType: 'Cash Dispenser Sensor (CDS)',
        atmType: 'ATM Series 1',
        printedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        printCount: 1,
        status: 'SUCCESS' as const,
      },
      {
        barcodeValue: 'ATM1-HDS1-11111-V1-IN1111',
        barcodeType: 'CODE128',
        sensorType: 'Head Detection Sensor (HDS)',
        atmType: 'ATM Series 1',
        printedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        printCount: 1,
        status: 'SUCCESS' as const,
      },
      {
        barcodeValue: 'ATM1-HDS1-11112-V1-IN1111',
        barcodeType: 'CODE128',
        sensorType: 'Head Detection Sensor (HDS)',
        atmType: 'ATM Series 1',
        printedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        printCount: 1,
        status: 'SUCCESS' as const,
      },
      {
        barcodeValue: 'ATM1-PIR1-11111-V1-IN1111',
        barcodeType: 'CODE128',
        sensorType: 'PIR Motion Sensor',
        atmType: 'ATM Series 1',
        printedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        printCount: 1,
        status: 'SUCCESS' as const,
      },
    ];

    const sampleBatch: IPrintBatch = {
      id: 'batch_seed_001',
      batchNumber: sampleBatchNumber,
      labels: sampleLabels,
      totalLabels: sampleLabels.length,
      successfulLabels: sampleLabels.length,
      failedLabels: 0,
      printerName: 'ZDesigner ZT230-200dpi ZPL',
      printerDpi: 200,
      labelDimensions: {
        widthMm: 30.0,
        heightMm: 10.0,
        widthDots: 240,
        heightDots: 80,
      },
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      printedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      status: 'COMPLETED',
      notes: 'Initial production batch for ATM Sensor Supply',
    };
    this.batches.set(sampleBatch.id, sampleBatch);

    sampleLabels.forEach((lbl, idx) => {
      const labelId = `lbl_seed_${idx + 1}`;
      this.labels.set(labelId, {
        id: labelId,
        barcodeValue: lbl.barcodeValue,
        barcodeType: lbl.barcodeType,
        sensorType: lbl.sensorType,
        atmType: lbl.atmType,
        createdAt: sampleBatch.createdAt,
        updatedAt: sampleBatch.createdAt,
        printedAt: lbl.printedAt,
        printCount: 1,
        batchId: sampleBatch.id,
        status: 'PRINTED',
      });
    });

    this.auditLogs.push({
      id: 'log_seed_1',
      timestamp: sampleBatch.createdAt,
      action: 'PRINT_BATCH',
      batchNumber: sampleBatchNumber,
      printerName: 'ZDesigner ZT230-200dpi ZPL',
      status: 'SUCCESS',
      details: `Printed initial batch of ${sampleLabels.length} ATM sensor labels.`,
    });
  }

  // --- Configuration Operations ---
  public getDefaultConfig(): IPrinterConfig {
    const list = Array.from(this.configs.values());
    const def = list.find((c) => c.isDefault) || list[0];
    return def;
  }

  public updateConfig(config: Partial<IPrinterConfig>): IPrinterConfig {
    const current = this.getDefaultConfig();
    const updated: IPrinterConfig = {
      ...current,
      ...config,
      updatedAt: new Date().toISOString(),
    };
    this.configs.set(updated.id, updated);

    this.logAudit({
      action: 'SETTINGS_UPDATE',
      printerName: updated.printerName,
      status: 'SUCCESS',
      details: `Updated printer calibration & label dimensions (${updated.labelWidthMm}x${updated.labelHeightMm}mm, ${updated.dpi} DPI).`,
    });

    return updated;
  }

  // --- Batch Operations ---
  public getNextBatchNumber(): string {
    this.batchCounter += 1;
    return `BATCH-${String(this.batchCounter).padStart(6, '0')}`;
  }

  public createBatch(batchData: Omit<IPrintBatch, 'id' | 'createdAt'>): IPrintBatch {
    const id = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newBatch: IPrintBatch = {
      ...batchData,
      id,
      createdAt: new Date().toISOString(),
    };
    this.batches.set(id, newBatch);

    // Save individual barcode records
    batchData.labels.forEach((lbl, idx) => {
      const lblId = `lbl_${Date.now()}_${idx}`;
      this.labels.set(lblId, {
        id: lblId,
        barcodeValue: lbl.barcodeValue,
        barcodeType: lbl.barcodeType,
        sensorType: lbl.sensorType,
        atmType: lbl.atmType,
        createdAt: newBatch.createdAt,
        updatedAt: newBatch.createdAt,
        printedAt: lbl.printedAt,
        printCount: lbl.printCount,
        batchId: id,
        status: lbl.status === 'SUCCESS' ? 'PRINTED' : 'FAILED',
      });
    });

    this.logAudit({
      action: 'PRINT_BATCH',
      batchNumber: newBatch.batchNumber,
      printerName: newBatch.printerName,
      status: newBatch.status === 'COMPLETED' ? 'SUCCESS' : 'FAILURE',
      details: `Created batch ${newBatch.batchNumber} with ${newBatch.totalLabels} labels.`,
    });

    return newBatch;
  }

  public getAllBatches(): IPrintBatch[] {
    return Array.from(this.batches.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getBatchById(id: string): IPrintBatch | undefined {
    return this.batches.get(id) || Array.from(this.batches.values()).find((b) => b.batchNumber === id);
  }

  public recordReprint(batchId: string, barcodeValues?: string[]): IPrintBatch | undefined {
    const batch = this.getBatchById(batchId);
    if (!batch) return undefined;

    const now = new Date().toISOString();
    batch.labels.forEach((lbl) => {
      if (!barcodeValues || barcodeValues.includes(lbl.barcodeValue)) {
        lbl.printCount += 1;
        lbl.printedAt = now;
        lbl.status = 'REPRINTED';
      }
    });

    batch.printedAt = now;
    batch.status = 'REPRINTED';
    this.batches.set(batch.id, batch);

    this.logAudit({
      action: 'REPRINT_BATCH',
      batchNumber: batch.batchNumber,
      printerName: batch.printerName,
      status: 'SUCCESS',
      details: `Reprinted ${barcodeValues ? barcodeValues.length : batch.totalLabels} labels from ${batch.batchNumber}.`,
    });

    return batch;
  }

  // --- Barcodes Query ---
  public getAllBarcodes(query?: string): IBarcodeLabel[] {
    let list = Array.from(this.labels.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (query && query.trim() !== '') {
      const q = query.toLowerCase();
      list = list.filter(
        (b) =>
          b.barcodeValue.toLowerCase().includes(q) ||
          (b.sensorType && b.sensorType.toLowerCase().includes(q)) ||
          (b.atmType && b.atmType.toLowerCase().includes(q))
      );
    }
    return list;
  }

  // --- Audit Logs ---
  public logAudit(entry: Omit<IAuditLog, 'id' | 'timestamp'>): void {
    const log: IAuditLog = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }

  public getAuditLogs(): IAuditLog[] {
    return this.auditLogs;
  }
}

export const dbService = new DatabaseService();
