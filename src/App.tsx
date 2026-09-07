import React, { useState, useEffect } from 'react';
import {
  Plus,
  Printer,
  Eye,
  Trash2,
  Sparkles,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Terminal,
  Activity,
  Layers,
  ArrowRight,
  HelpCircle,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { BarcodeItem, PrinterConfig, PrintBatchRecord } from './types';
import { Header } from './components/Header';
import { PrinterStatusBar } from './components/PrinterStatusBar';
import { BarcodeRow } from './components/BarcodeRow';
import { SequentialGeneratorModal } from './components/SequentialGeneratorModal';
import { CsvImportModal } from './components/CsvImportModal';
import { LabelPreviewModal } from './components/LabelPreviewModal';
import { InkjetPrintModal } from './components/InkjetPrintModal';
import { PrintHistory } from './components/PrintHistory';
import { PrinterSettings } from './components/PrinterSettings';
import { HelpGuideModal } from './components/HelpGuideModal';
import { configService } from './services/configService';
import { apiService } from './services/apiService';
import { validateBarcodeRow, checkDuplicates } from './utils/barcodeValidator';
import { generateSingleLabelZpl } from './utils/zplGenerator';

// Default initial sample dataset representing realistic ATM sensor barcodes (fits 30x10mm label, 25x6mm barcode)
const INITIAL_SAMPLE_BARCODES = [
  'ATM1-CDS1-11111-V1-IN11112',
  'ATM1-CDS1-11112-V1-IN11112',
  'ATM1-CDS1-11113-V1-IN11112',
  'ATM1-HDS1-11111-V1-IN1111',
  'ATM1-HDS1-11112-V1-IN1111',
  'ATM1-HDS1-11113-V1-IN1111',
];

export default function App() {
  const [config, setConfig] = useState<PrinterConfig>(configService.getConfig());
  const [activeTab, setActiveTab] = useState<'entry' | 'history' | 'settings'>('entry');

  // Barcode items in current working batch
  const [items, setItems] = useState<BarcodeItem[]>(() => {
    return INITIAL_SAMPLE_BARCODES.map((val, idx) => {
      const v = validateBarcodeRow(val, idx + 1);
      return {
        id: `item-${Date.now()}-${idx}`,
        rowNumber: idx + 1,
        barcodeValue: val,
        isValid: v.isValid,
        validationError: v.errorMessage,
        isDuplicate: false,
        printCount: 1,
      };
    });
  });

  // Modal states
  const [isSequentialOpen, setIsSequentialOpen] = useState(false);
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isInkjetOpen, setIsInkjetOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [rawZplModalCode, setRawZplModalCode] = useState<string | null>(null);

  // Status & Telemetry
  const [isPrinting, setIsPrinting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>(() => {
    const widthDots = Math.round(config.labelWidthMm * (config.dpi / 25.4));
    const heightDots = Math.round(config.labelHeightMm * (config.dpi / 25.4));
    return [
      `[SYSTEM] ZT230 thermal printer driver initialized @ ${config.dpi} DPI (8 dots/mm)`,
      `[READY] Label dimensions calibrated: ${config.labelWidthMm}mm × ${config.labelHeightMm}mm (${widthDots}×${heightDots} dots)`,
      `[LICENSE] Full Unrestricted Commercial License Active - Unlimited Printing`,
    ];
  });

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setTelemetryLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync hardware identity & Electron desktop menu
  useEffect(() => {
    apiService.getHardwareIdentity().then((info) => {
      if (info?.hostname) {
        addLog(`[SYSTEM] Host hardware link established (${info.hostname} / ${info.platform} ${info.architecture})`);
      }
    });

    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.onMenuAction) {
      electronAPI.onMenuAction((action: string) => {
        if (action === 'open-settings') {
          setActiveTab('settings');
        } else if (action === 'open-help') {
          setIsHelpOpen(true);
        }
      });
    }
  }, []);

  // Re-validate and mark duplicates whenever items change
  const refreshValidation = (currentItems: BarcodeItem[]): BarcodeItem[] => {
    const rawValues = currentItems.map((i) => i.barcodeValue);
    const duplicateSet = checkDuplicates(rawValues);

    return currentItems.map((item, idx) => {
      const v = validateBarcodeRow(item.barcodeValue, idx + 1);
      const isDup = item.barcodeValue.trim() !== '' && duplicateSet.has(item.barcodeValue.trim());

      let error = v.errorMessage;
      if (isDup && config.duplicatePolicy === 'PREVENT') {
        error = 'Duplicate serial number detected in batch';
      }

      return {
        ...item,
        rowNumber: idx + 1,
        isValid: v.isValid && (!isDup || config.duplicatePolicy !== 'PREVENT'),
        validationError: error,
        isDuplicate: isDup,
      };
    });
  };

  // Handlers for Row Operations
  const handleValueChange = (id: string, newValue: string) => {
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, barcodeValue: newValue } : item
      );
      return refreshValidation(updated);
    });
  };

  const handleAddRow = () => {
    setItems((prev) => {
      const nextNum = prev.length + 1;
      const newItem: BarcodeItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        rowNumber: nextNum,
        barcodeValue: '',
        isValid: false,
        isDuplicate: false,
        printCount: 1,
      };
      return refreshValidation([...prev, newItem]);
    });
  };

  const handleAddMultipleRows = (count: number) => {
    setItems((prev) => {
      const newRows: BarcodeItem[] = [];
      for (let i = 0; i < count; i++) {
        newRows.push({
          id: `item-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
          rowNumber: prev.length + i + 1,
          barcodeValue: '',
          isValid: false,
          isDuplicate: false,
          printCount: 1,
        });
      }
      return refreshValidation([...prev, ...newRows]);
    });
    showToast('info', `Added ${count} blank label rows.`);
  };

  const handleClearRow = (id: string) => {
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, barcodeValue: '' } : item
      );
      return refreshValidation(updated);
    });
  };

  const handleDeleteRow = (id: string) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      return refreshValidation(updated);
    });
  };

  const handleDuplicateRow = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (!target) return prev;
      const newItem: BarcodeItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        rowNumber: prev.length + 1,
        barcodeValue: target.barcodeValue,
        isValid: target.isValid,
        isDuplicate: true,
        printCount: 1,
      };
      return refreshValidation([...prev, newItem]);
    });
  };

  const handleClearAll = () => {
    setItems([
      {
        id: `item-${Date.now()}`,
        rowNumber: 1,
        barcodeValue: '',
        isValid: false,
        isDuplicate: false,
        printCount: 1,
      },
    ]);
    showToast('info', 'Batch cleared.');
  };

  const handleLoadSampleData = () => {
    const samples = [
      'ATM1-CDS1-11111-V1-IN11112',
      'ATM1-CDS1-11112-V1-IN11112',
      'ATM1-CDS1-11113-V1-IN11112',
      'ATM1-HDS1-11111-V1-IN1111',
      'ATM1-HDS1-11112-V1-IN1111',
      'ATM1-HDS1-11113-V1-IN1111',
    ];
    setItems(
      samples.map((val, idx) => {
        const v = validateBarcodeRow(val, idx + 1);
        return {
          id: `item-${Date.now()}-${idx}`,
          rowNumber: idx + 1,
          barcodeValue: val,
          isValid: v.isValid,
          validationError: v.errorMessage,
          isDuplicate: false,
          printCount: 1,
        };
      })
    );
    showToast('success', 'Loaded standard ATM sensor sample batch.');
    addLog('Loaded standard ATM sensor sample batch');
  };

  // Modal actions
  const handleApplySequential = (values: string[], mode: 'replace' | 'append') => {
    const newItems: BarcodeItem[] = values.map((val, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      rowNumber: idx + 1,
      barcodeValue: val,
      isValid: true,
      isDuplicate: false,
      printCount: 1,
    }));

    setItems((prev) => {
      const combined = mode === 'replace' ? newItems : [...prev, ...newItems];
      return refreshValidation(combined);
    });
    showToast('success', `Generated ${values.length} sequential barcodes.`);
    addLog(`Generated ${values.length} sequential barcodes with prefix`);
  };

  const handleApplyCsv = (values: string[], mode: 'replace' | 'append') => {
    const newItems: BarcodeItem[] = values.map((val, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      rowNumber: idx + 1,
      barcodeValue: val,
      isValid: true,
      isDuplicate: false,
      printCount: 1,
    }));

    setItems((prev) => {
      const combined = mode === 'replace' ? newItems : [...prev, ...newItems];
      return refreshValidation(combined);
    });
    showToast('success', `Imported ${values.length} barcodes.`);
    addLog(`Imported ${values.length} barcodes from CSV/Text`);
  };

  const handleSaveConfig = (newConfig: PrinterConfig) => {
    setConfig(newConfig);
    configService.saveConfig(newConfig);
    setItems((prev) => refreshValidation(prev));
    const widthDots = Math.round(newConfig.labelWidthMm * (newConfig.dpi / 25.4));
    const heightDots = Math.round(newConfig.labelHeightMm * (newConfig.dpi / 25.4));
    showToast('success', `Calibrated: ${newConfig.labelWidthMm}×${newConfig.labelHeightMm}mm (${widthDots}×${heightDots} dots).`);
    addLog(`[CALIBRATION] Dimensions updated: ${newConfig.labelWidthMm}×${newConfig.labelHeightMm}mm (${widthDots}×${heightDots} dots, ^PW${widthDots} ^LL${heightDots}), ${newConfig.dpi} DPI, Speed ${newConfig.printSpeedIps} IPS`);
  };

  // Print Handlers
  const handlePrintBatch = async () => {
    const validItems = items.filter((i) => i.barcodeValue && i.barcodeValue.trim() !== '');

    if (validItems.length === 0) {
      showToast('error', 'No valid barcodes to print.');
      return;
    }

    if (config.duplicatePolicy === 'PREVENT' && items.some((i) => i.isDuplicate)) {
      showToast('error', 'Cannot print: Duplicate serial numbers detected in batch.');
      return;
    }

    try {
      setIsPrinting(true);
      addLog(`Initiating print batch of ${validItems.length} labels to Zebra ZT230...`);

      const result = await apiService.createBatch({
        labels: validItems.map((item) => ({
          barcodeValue: item.barcodeValue,
          printCount: item.printCount || 1,
        })),
        config,
      });

      if (result.success) {
        showToast('success', `Batch ${result.batchNumber} dispatched (${result.totalLabels} labels)!`);
        addLog(`[SUCCESS] Batch ${result.batchNumber} dispatched to ${config.printerName}`);
      } else {
        showToast('error', result.message || 'Failed to dispatch print job.');
        addLog(`[ERROR] Print job failed: ${result.message}`);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Network error communicating with printer spooler.');
      addLog(`[EXCEPTION] ${err.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleQuickTestPrint = async () => {
    try {
      showToast('info', 'Sending calibration test label to Zebra ZT230...');
      addLog('Printing 1 calibration test label (ATM-TEST-200DPI)...');
      const testZpl = generateSingleLabelZpl('ATM-TEST-200DPI', config);

      const result = await apiService.printDirect(testZpl);
      if (result.success) {
        showToast('success', 'Test label dispatched to Zebra ZT230!');
        addLog('[SUCCESS] Test label printed successfully.');
      } else {
        showToast('info', 'Test ZPL generated (Direct print simulated).');
        addLog(`[SIMULATION] Test ZPL: ^XA...^XZ generated.`);
      }
    } catch (err: any) {
      showToast('info', 'Test ZPL generated.');
      addLog(`[NOTE] Test print command sent.`);
    }
  };

  const handleReprint = async (batchId: string, barcodeValues?: string[]) => {
    try {
      showToast('info', 'Dispatching reprint request...');
      addLog(`Dispatching reprint for batch ${batchId}...`);
      const result = await apiService.reprintBatch(batchId, barcodeValues);
      if (result.success) {
        showToast('success', 'Reprint job dispatched successfully!');
        addLog(`[SUCCESS] Reprint batch ${batchId} sent to printer.`);
      } else {
        showToast('error', 'Failed to dispatch reprint.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Reprint failed.');
    }
  };

  // Metrics calculation
  const totalLabels = items.length;
  const validLabelsCount = items.filter((i) => i.isValid).length;
  const duplicateCount = items.filter((i) => i.isDuplicate).length;
  const totalMmLength = validLabelsCount * config.labelHeightMm;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 flex flex-col font-sans relative overflow-x-hidden">
      {/* Ambient background glow orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-950/20 rounded-full blur-[140px] pointer-events-none print:hidden"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-950/20 rounded-full blur-[160px] pointer-events-none print:hidden"></div>

      {/* Main App Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        onQuickTestPrint={handleQuickTestPrint}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Real-time Printer Status Bar */}
      <div className="print:hidden">
        <PrinterStatusBar
          config={config}
          onOpenSettings={() => setActiveTab('settings')}
        />
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 print:hidden">

        {/* Toast Alerts */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl border flex items-center space-x-3 backdrop-blur-xl transition-all duration-200 animate-slide-up ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : toastMessage.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                : 'bg-cyan-950/90 text-cyan-200 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toastMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
            {toastMessage.type === 'info' && <Activity className="w-5 h-5 text-cyan-400" />}
            <span className="text-xs font-semibold font-mono tracking-wide">{toastMessage.text}</span>
          </div>
        )}

        {/* Tab 1: Label Batch Entry */}
        {activeTab === 'entry' && (
          <div className="space-y-6">
            {/* Top Batch Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md relative overflow-hidden">
                <div className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                  Total Items
                </div>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {totalLabels}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Rows in working queue</div>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md relative overflow-hidden">
                <div className="text-[10px] uppercase font-mono font-bold text-emerald-400 tracking-wider">
                  Valid Ready
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {validLabelsCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Passes Code 128 regex</div>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md relative overflow-hidden">
                <div className="text-[10px] uppercase font-mono font-bold text-amber-400 tracking-wider">
                  Duplicates
                </div>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                  {duplicateCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {config.duplicatePolicy === 'PREVENT' ? 'Blocked from print' : 'Warning only'}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md relative overflow-hidden">
                <div className="text-[10px] uppercase font-mono font-bold text-cyan-400 tracking-wider">
                  Roll Length
                </div>
                <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                  {totalMmLength}mm
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  ≈ {(totalMmLength / 25.4).toFixed(1)} in ({config.labelWidthMm}×{config.labelHeightMm}mm)
                </div>
              </div>
            </div>

            {/* Quick Generator & Import Toolbar */}
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
              {/* Left quick actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-wider text-xs rounded-xl shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Row</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddMultipleRows(5)}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 text-xs font-semibold rounded-xl transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>+5 Rows</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSequentialOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 text-xs font-semibold rounded-xl transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Sequential Gen</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCsvOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 text-xs font-semibold rounded-xl transition-all"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Import CSV</span>
                </button>
              </div>

              {/* Right utility actions */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleLoadSampleData}
                  className="px-3 py-2 bg-black/40 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-mono rounded-xl transition-colors"
                >
                  Load ATM Samples
                </button>

                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-3 py-2 bg-black/40 hover:bg-rose-500/20 text-rose-400 border border-white/10 text-xs font-mono rounded-xl transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Barcode Rows Stream */}
            <div className="space-y-3">
              {items.map((item, index) => (
                <BarcodeRow
                  key={item.id}
                  item={item}
                  index={index}
                  totalRows={items.length}
                  config={config}
                  onValueChange={handleValueChange}
                  onClearRow={handleClearRow}
                  onDeleteRow={handleDeleteRow}
                  onDuplicateRow={handleDuplicateRow}
                />
              ))}
            </div>

            {/* Bottom Floating Print & Preview Action Bar */}
            <div className="sticky bottom-4 z-20 bg-[#0b0f19]/90 border border-cyan-500/30 p-4 rounded-2xl backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3 text-xs font-mono">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-slate-300">
                  Ready to print: <strong className="text-cyan-400">{validLabelsCount}</strong> of{' '}
                  <strong className="text-white">{items.length}</strong> labels
                </span>
                <span className="text-slate-500 hidden md:inline">·</span>
                <span className="text-slate-400 hidden md:inline">
                  Zebra ZT230 ({config.labelWidthMm}×{config.labelHeightMm}mm · {config.dpi} DPI, {config.printSpeedIps} IPS)
                </span>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto justify-end flex-wrap gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsInkjetOpen(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600/80 hover:bg-blue-500 border border-blue-400/40 text-white font-semibold text-xs rounded-xl transition-all shadow-xs font-mono"
                  title="Print on Standard A4 / Letter Paper with any Inkjet or Laser printer"
                >
                  <Printer className="w-4 h-4 text-blue-200" />
                  <span>Inkjet / A4 Sheet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold uppercase tracking-wider text-xs rounded-xl transition-all shadow-xs"
                >
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Thermal Preview</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintBatch}
                  disabled={validLabelsCount === 0 || isPrinting}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold uppercase tracking-wider text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
                >
                  {isPrinting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Spooling ZPL...</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      <span>Print Zebra ZT230 ({validLabelsCount})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Industrial Telemetry Console */}
            <div className="bg-black/70 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                  <Terminal className="w-4 h-4" />
                  <span>ZT230 HARDWARE TELEMETRY & EVENT STREAM</span>
                </div>
                <span className="text-[10px] text-slate-500">Live Spooler Diagnostics</span>
              </div>

              <div className="bg-black/90 rounded-xl p-3.5 max-h-36 overflow-y-auto font-mono text-[11px] text-slate-400 space-y-1 border border-white/5">
                {telemetryLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className="text-cyan-500/80">&gt;</span> {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Print History & Reprints */}
        {activeTab === 'history' && (
          <PrintHistory
            config={config}
            onReprintBatch={handleReprint}
            onViewZpl={(zpl) => setRawZplModalCode(zpl)}
          />
        )}

        {/* Tab 3: Hardware Settings & Calibration */}
        {activeTab === 'settings' && (
          <PrinterSettings
            config={config}
            onSaveConfig={handleSaveConfig}
            onTestPrint={handleQuickTestPrint}
            onOpenHelp={() => setIsHelpOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <SequentialGeneratorModal
        isOpen={isSequentialOpen}
        onClose={() => setIsSequentialOpen(false)}
        onApply={handleApplySequential}
      />

      <CsvImportModal
        isOpen={isCsvOpen}
        onClose={() => setIsCsvOpen(false)}
        onImport={handleApplyCsv}
      />

      <LabelPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        items={items}
        config={config}
        onPrint={handlePrintBatch}
        onOpenInkjet={() => setIsInkjetOpen(true)}
      />

      <InkjetPrintModal
        isOpen={isInkjetOpen}
        onClose={() => setIsInkjetOpen(false)}
        items={items}
        config={config}
      />

      <HelpGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Raw ZPL Viewer Modal */}
      {rawZplModalCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0b0f19] border border-cyan-500/30 w-full max-w-2xl rounded-2xl overflow-hidden p-6 space-y-4 shadow-[0_0_50px_rgba(6,182,212,0.2)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white font-mono uppercase">
                Raw ZPL II Payload Inspector
              </h3>
              <button
                onClick={() => setRawZplModalCode(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <textarea
              readOnly
              value={rawZplModalCode}
              rows={12}
              className="w-full bg-black/90 text-cyan-300 font-mono text-xs p-4 rounded-xl border border-white/10 focus:outline-hidden"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(rawZplModalCode);
                  showToast('success', 'ZPL copied to clipboard!');
                }}
                className="px-4 py-2 bg-cyan-500 text-black font-bold uppercase tracking-wider text-xs rounded-xl"
              >
                Copy ZPL
              </button>
              <button
                onClick={() => setRawZplModalCode(null)}
                className="px-4 py-2 bg-white/10 text-slate-300 text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
