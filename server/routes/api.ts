import { Router, Request, Response } from 'express';
import os from 'os';
import crypto from 'crypto';
import { dbService } from '../services/dbService';
import { zplService } from '../services/zplService';
import { printerService } from '../services/printerService';
import { listInstalledPrinters } from '../services/windowsPrinter';
import { IPrinterConfig } from '../models/schema';

export const apiRouter = Router();

// 1. Health Check
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'ATM Sensor Barcode Label Manager Backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    targetPrinter: 'ZDesigner ZT230-200dpi ZPL',
  });
});

// 2. Settings Endpoints
apiRouter.get('/settings', (req: Request, res: Response) => {
  try {
    const config = dbService.getDefaultConfig();
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  try {
    const updated = dbService.updateConfig(req.body);
    res.json({ success: true, data: updated, message: 'Settings saved successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Printer Status & Discovery
apiRouter.get('/printers', async (req: Request, res: Response) => {
  try {
    const installed = await listInstalledPrinters();
    const config = dbService.getDefaultConfig();
    const printers = installed.map((p, idx) => ({
      id: `printer_${idx}`,
      name: p.name,
      driver: p.driverName,
      port: p.portName,
      status: p.status === 0 ? 'CONNECTED' : 'OFFLINE',
      isZebra: p.isZebra,
      isDefault:
        p.name.toLowerCase() === (config.printerName || '').toLowerCase() || p.isDefaultZt230,
    }));
    res.json({ success: true, printers });
  } catch (error: any) {
    res.json({ success: true, printers: [] });
  }
});

apiRouter.get('/printers/status', async (req: Request, res: Response) => {
  const config = dbService.getDefaultConfig();
  const status = await printerService.getLivePrinterStatus(config);
  res.json({ success: true, status });
});

// 4. ZPL Generation
apiRouter.post('/zpl/generate', (req: Request, res: Response) => {
  try {
    const { barcodes, config: customConfig } = req.body;
    const config: IPrinterConfig = customConfig || dbService.getDefaultConfig();

    if (!barcodes || !Array.isArray(barcodes) || barcodes.length === 0) {
      return res.status(400).json({ success: false, error: 'Array of barcode strings is required.' });
    }

    const zplCode = zplService.generateBatch(barcodes, config);
    res.json({
      success: true,
      zplCode,
      labelCount: barcodes.length,
      dpi: config.dpi,
      dimensions: {
        widthDots: config.labelWidthDots,
        heightDots: config.labelHeightDots,
        widthMm: config.labelWidthMm,
        heightMm: config.labelHeightMm,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Test Print
apiRouter.post('/print/test', async (req: Request, res: Response) => {
  try {
    const { config: customConfig } = req.body || {};
    const config: IPrinterConfig = customConfig || dbService.getDefaultConfig();
    const testZpl = zplService.generateTestLabel(config);
    const result = await printerService.sendZplToPrinter(testZpl, config);

    dbService.logAudit({
      action: 'TEST_PRINT',
      barcodeValue: 'TEST-ATM-LABEL-001',
      printerName: config.printerName,
      status: result.success ? 'SUCCESS' : 'FAILURE',
      details: `Test calibration print sent to ${config.printerName}.`,
    });

    res.json({
      success: result.success,
      message: result.message || 'Test label printed successfully.',
      zpl: testZpl,
      printer: config.printerName,
      bytes: result.bytesSent,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5b. Raw ZPL Direct Print
apiRouter.post('/print/raw', async (req: Request, res: Response) => {
  try {
    const { zpl, printerName, config: customConfig } = req.body;
    if (!zpl || typeof zpl !== 'string') {
      return res.status(400).json({ success: false, error: 'Raw ZPL string is required.' });
    }

    const config: IPrinterConfig = customConfig || { ...dbService.getDefaultConfig() };
    if (printerName) {
      config.printerName = printerName;
    }

    const result = await printerService.sendZplToPrinter(zpl, config);
    res.json({
      success: result.success,
      message: result.message,
      bytesSent: result.bytesSent,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Print Batch
apiRouter.post('/print/batch', async (req: Request, res: Response) => {
  try {
    const { barcodes, notes, config: customConfig } = req.body;
    const config: IPrinterConfig = customConfig || dbService.getDefaultConfig();

    if (!barcodes || !Array.isArray(barcodes) || barcodes.length === 0) {
      return res.status(400).json({ success: false, error: 'No barcode items provided for batch printing.' });
    }

    const barcodeValues: string[] = [];
    for (const b of barcodes) {
      const val = typeof b === 'string' ? b : b?.barcodeValue;
      if (!val) continue;
      const count = (typeof b === 'object' && typeof b.printCount === 'number' && b.printCount > 0) ? b.printCount : 1;
      for (let c = 0; c < count; c++) {
        barcodeValues.push(val);
      }
    }
    const zplCode = zplService.generateBatch(barcodeValues, config);

    // Send to printer
    const printResult = await printerService.sendZplToPrinter(zplCode, config);

    // Save batch to MongoDB / Store
    const batchNumber = dbService.getNextBatchNumber();
    const batchRecord = dbService.createBatch({
      batchNumber,
      labels: barcodes.map((b) => {
        const val = typeof b === 'string' ? b : b.barcodeValue;
        const sensor = typeof b === 'object' && b.sensorType ? b.sensorType : undefined;
        const atm = typeof b === 'object' && b.atmType ? b.atmType : undefined;
        return {
          barcodeValue: val,
          barcodeType: 'CODE128',
          sensorType: sensor,
          atmType: atm,
          printedAt: new Date().toISOString(),
          printCount: 1,
          status: 'SUCCESS',
        };
      }),
      totalLabels: barcodeValues.length,
      successfulLabels: barcodeValues.length,
      failedLabels: 0,
      printerName: config.printerName,
      printerDpi: config.dpi,
      labelDimensions: {
        widthMm: config.labelWidthMm,
        heightMm: config.labelHeightMm,
        widthDots: config.labelWidthDots,
        heightDots: config.labelHeightDots,
      },
      zplCode,
      printedAt: new Date().toISOString(),
      status: 'COMPLETED',
      notes: notes || 'Production Batch',
    });

    res.json({
      success: true,
      batch: batchRecord,
      message: `Batch ${batchNumber} printed successfully (${barcodeValues.length} labels).`,
      zplCode,
      printerResult: printResult,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Reprint
apiRouter.post('/print/reprint', async (req: Request, res: Response) => {
  try {
    const { batchId, barcodeValues } = req.body;
    const config = dbService.getDefaultConfig();

    if (!batchId) {
      return res.status(400).json({ success: false, error: 'batchId is required for reprint.' });
    }

    const batch = dbService.getBatchById(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, error: `Batch ${batchId} not found.` });
    }

    const itemsToPrint = barcodeValues || batch.labels.map((l) => l.barcodeValue);
    const zplCode = zplService.generateBatch(itemsToPrint, config);
    const printResult = await printerService.sendZplToPrinter(zplCode, config);

    const updatedBatch = dbService.recordReprint(batch.id, itemsToPrint);

    res.json({
      success: true,
      batch: updatedBatch,
      message: `Reprinted ${itemsToPrint.length} labels from batch ${batch.batchNumber}.`,
      zplCode,
      printerResult: printResult,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Batches Query
apiRouter.get('/batches', (req: Request, res: Response) => {
  try {
    const batches = dbService.getAllBatches();
    res.json({ success: true, data: batches, count: batches.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/batches/:id', (req: Request, res: Response) => {
  try {
    const batch = dbService.getBatchById(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }
    res.json({ success: true, data: batch });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Barcodes Query
apiRouter.get('/barcodes', (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const barcodes = dbService.getAllBarcodes(query);
    res.json({ success: true, data: barcodes, count: barcodes.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. Audit Logs
apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  try {
    const logs = dbService.getAuditLogs();
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 11. System Hardware Fingerprint & Machine Identity (Locked to MAC ID)
apiRouter.get('/system/hardware-identity', (req: Request, res: Response) => {
  try {
    const networkInterfaces = os.networkInterfaces();
    const macAddresses: string[] = [];

    for (const name of Object.keys(networkInterfaces)) {
      const netArray = networkInterfaces[name];
      if (netArray) {
        for (const net of netArray) {
          if (net.mac && net.mac !== '00:00:00:00:00:00' && !net.internal) {
            macAddresses.push(net.mac.toUpperCase());
          }
        }
      }
    }

    // Select primary MAC address or fallback
    const primaryMac = macAddresses[0] || '02:00:00:00:00:01';
    const hostname = os.hostname() || 'ZT230-Host';
    const platform = os.platform();
    const arch = os.arch();

    // Create unique, non-reversible Installation Code derived from system MAC ID
    const seed = `ZT230_MAC_${primaryMac}_HOST_${hostname}_${platform}_${arch}`;
    const hash = crypto.createHash('sha256').update(seed).digest('hex').toUpperCase();
    
    // Standard format: ZT-XXXX-XXXX-XXXX
    const p1 = hash.substring(0, 4);
    const p2 = hash.substring(4, 8);
    const p3 = hash.substring(8, 12);
    const installationCode = `ZT-${p1}-${p2}-${p3}`;

    res.json({
      success: true,
      data: {
        installationCode,
        macAddressSnippet: primaryMac.replace(/^([0-9A-F]{2}:[0-9A-F]{2}:).*(:[0-9A-F]{2})$/i, '$1**:**:$2'),
        hostname,
        platform,
        architecture: arch,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
