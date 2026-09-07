import { PrinterConfig, PrintBatchRecord, AuditLog } from '../types';

const API_BASE =
  typeof window !== 'undefined' && window.location.protocol === 'file:'
    ? 'http://localhost:3000/api'
    : '/api';

export const apiService = {
  async getSettings(): Promise<PrinterConfig> {
    const res = await fetch(`${API_BASE}/settings`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to load settings');
    return json.data;
  },

  async updateSettings(config: Partial<PrinterConfig>): Promise<PrinterConfig> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to save settings');
    return json.data;
  },

  async getPrinters(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/printers`);
    const json = await res.json();
    return json.printers || [];
  },

  async getPrinterStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/printers/status`);
    const json = await res.json();
    return json.status;
  },

  async generateZpl(barcodes: string[], config?: PrinterConfig): Promise<{ zplCode: string; labelCount: number }> {
    const res = await fetch(`${API_BASE}/zpl/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcodes, config }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to generate ZPL');
    return json;
  },

  async printTestLabel(config?: PrinterConfig): Promise<{ message: string; zpl: string; bytes: number }> {
    const res = await fetch(`${API_BASE}/print/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Test print failed');
    return json;
  },

  async printBatch(
    barcodes: { barcodeValue: string; sensorType?: string; atmType?: string }[],
    notes?: string
  ): Promise<{ batch: PrintBatchRecord; zplCode: string; message: string; success: boolean; batchNumber?: string; totalLabels?: number }> {
    const res = await fetch(`${API_BASE}/print/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcodes, notes }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Batch printing failed');
    return {
      success: true,
      batch: json.batch,
      zplCode: json.zplCode,
      message: json.message,
      batchNumber: json.batch?.batchNumber,
      totalLabels: json.batch?.totalLabels,
    };
  },

  async createBatch(payload: {
    labels: { barcodeValue: string; printCount?: number; sensorType?: string; atmType?: string }[];
    config?: PrinterConfig;
    notes?: string;
  }): Promise<{ success: boolean; batchNumber?: string; totalLabels?: number; message?: string; batch?: PrintBatchRecord; zplCode?: string }> {
    const res = await fetch(`${API_BASE}/print/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barcodes: payload.labels,
        notes: payload.notes,
        config: payload.config,
      }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Batch printing failed');
    return {
      success: true,
      batchNumber: json.batch?.batchNumber,
      totalLabels: json.batch?.totalLabels,
      message: json.message,
      batch: json.batch,
      zplCode: json.zplCode,
    };
  },

  async printDirect(
    zplCode: string,
    config?: PrinterConfig,
    agentUrl?: string
  ): Promise<{ success: boolean; message?: string }> {
    const targetAgent = agentUrl || config?.agentUrl;
    if (targetAgent && targetAgent.startsWith('http')) {
      try {
        const agentRes = await fetch(targetAgent, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: zplCode,
        });
        if (agentRes.ok) {
          return { success: true, message: 'Printed directly to agent spooler.' };
        }
      } catch {
        // Continue to server fallback
      }
    }

    try {
      const res = await fetch(`${API_BASE}/print/raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zpl: zplCode,
          printerName: config?.printerName,
          config,
        }),
      });
      const json = await res.json();
      return { success: json.success, message: json.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Direct ZPL print failed.' };
    }
  },

  async reprintBatch(
    batchId: string,
    barcodeValues?: string[]
  ): Promise<{ success: boolean; batch: PrintBatchRecord; zplCode: string; message: string }> {
    const res = await fetch(`${API_BASE}/print/reprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId, barcodeValues }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Reprint failed');
    return {
      success: true,
      batch: json.batch,
      zplCode: json.zplCode,
      message: json.message,
    };
  },

  async getBatches(): Promise<PrintBatchRecord[]> {
    const res = await fetch(`${API_BASE}/batches`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to load print batches');
    return json.data || [];
  },

  async getBatchById(id: string): Promise<PrintBatchRecord> {
    const res = await fetch(`${API_BASE}/batches/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Batch not found');
    return json.data;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/audit-logs`);
    const json = await res.json();
    return json.data || [];
  },

  async getHardwareIdentity(): Promise<{
    installationCode: string;
    macAddressSnippet: string;
    hostname: string;
    platform: string;
    architecture: string;
  } | null> {
    try {
      const res = await fetch(`${API_BASE}/system/hardware-identity`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    }
  },
};
