import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Printer,
  Check,
  RotateCcw,
  Play,
  HelpCircle,
  Cpu,
  Ruler,
  Zap,
  Shield,
  Save,
  FileCode,
  Info,
  Download,
  HardDrive,
  CheckCircle2,
  Terminal,
  Columns3,
  ArrowDown,
  ArrowRight,
} from 'lucide-react';
import { PrinterConfig, DuplicatePolicy, PrintMode } from '../types';
import { apiService } from '../services/apiService';
import {
  mmToDots,
  dotsToMm,
  mmToInches,
  inchesToMm,
  DEFAULT_DPI,
} from '../utils/dimensions';

interface PrinterSettingsProps {
  config: PrinterConfig;
  onSaveConfig: (updated: PrinterConfig) => void;
  onTestPrint: () => void;
  onOpenHelp: () => void;
}

export const PrinterSettings: React.FC<PrinterSettingsProps> = ({
  config,
  onSaveConfig,
  onTestPrint,
  onOpenHelp,
}) => {
  const [form, setForm] = useState<PrinterConfig>({ ...config });
  const [savedToast, setSavedToast] = useState(false);
  const [installedPrinters, setInstalledPrinters] = useState<any[]>([]);

  useEffect(() => {
    apiService.getPrinters().then((printers) => {
      if (Array.isArray(printers) && printers.length > 0) {
        setInstalledPrinters(printers);
      }
    }).catch(() => {});
  }, []);

  // Synchronize dimensional calculations
  const handleWidthMmChange = (widthMm: number) => {
    const dots = mmToDots(widthMm, form.dpi);
    const inches = mmToInches(widthMm);
    setForm((prev) => ({
      ...prev,
      labelWidthMm: widthMm,
      labelWidthDots: dots,
      labelWidthInches: inches,
    }));
  };

  const handleHeightMmChange = (heightMm: number) => {
    const dots = mmToDots(heightMm, form.dpi);
    const inches = mmToInches(heightMm);
    setForm((prev) => ({
      ...prev,
      labelHeightMm: heightMm,
      labelHeightDots: dots,
      labelHeightInches: inches,
    }));
  };

  const handleDpiChange = (dpi: 200 | 300 | 600) => {
    const widthDots = mmToDots(form.labelWidthMm, dpi);
    const heightDots = mmToDots(form.labelHeightMm, dpi);
    setForm((prev) => ({
      ...prev,
      dpi,
      labelWidthDots: widthDots,
      labelHeightDots: heightDots,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(form);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleResetDefaults = () => {
    const defaultWidth = 30.0;
    const defaultHeight = 10.0;
    const defDpi = 200;
    setForm((prev) => ({
      ...prev,
      printerName: 'ZDesigner ZT230-200dpi ZPL',
      printerModel: 'ZT230',
      printerLanguage: 'ZPL',
      dpi: defDpi,
      labelWidthMm: defaultWidth,
      labelHeightMm: defaultHeight,
      labelWidthInches: mmToInches(defaultWidth),
      labelHeightInches: mmToInches(defaultHeight),
      labelWidthDots: mmToDots(defaultWidth, defDpi),
      labelHeightDots: mmToDots(defaultHeight, defDpi),
      horizontalOffsetDots: 0,
      verticalOffsetDots: 0,
      barcodeHeightDots: 48, // 6mm @ 200 DPI
      moduleWidthDots: 1,
      humanReadableFontSizeDots: 24, // 3mm @ 200 DPI
      printSpeedIps: 4,
      darkness: 15,
      orientation: 'N',
      columnsAcross: 3,
      columnGapMm: 2.0,
      printDirection: 'COLUMN_WISE',
      duplicatePolicy: 'PREVENT',
      printMode: 'ZPL_DIRECT',
    }));
  };

  const applyPreset30x10 = () => {
    handleWidthMmChange(30.0);
    handleHeightMmChange(10.0);
    setForm((prev) => ({
      ...prev,
      labelWidthMm: 30.0,
      labelHeightMm: 10.0,
      labelWidthDots: mmToDots(30.0, prev.dpi),
      labelHeightDots: mmToDots(10.0, prev.dpi),
      labelWidthInches: mmToInches(30.0),
      labelHeightInches: mmToInches(10.0),
      barcodeHeightDots: 48, // 6mm @ 200 DPI
      moduleWidthDots: 1,
      humanReadableFontSizeDots: 24, // 3mm @ 200 DPI
      columnsAcross: 3,
      columnGapMm: 2.0,
      printDirection: 'COLUMN_WISE',
    }));
  };

  const applyPreset50x25 = () => {
    handleWidthMmChange(50.0);
    handleHeightMmChange(25.0);
    setForm((prev) => ({
      ...prev,
      labelWidthMm: 50.0,
      labelHeightMm: 25.0,
      labelWidthDots: mmToDots(50.0, prev.dpi),
      labelHeightDots: mmToDots(25.0, prev.dpi),
      labelWidthInches: mmToInches(50.0),
      labelHeightInches: mmToInches(25.0),
      barcodeHeightDots: 80,
      moduleWidthDots: 2,
      humanReadableFontSizeDots: 28,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]"></span>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400/90">
              Hardware Alignment & Calibration
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Zebra ZT230-200dpi ZPL Calibration Suite
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure target printer DPI, exact physical label dimensions in millimeters and dots, barcode density, thermal darkness, and offset coordinates.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onTestPrint}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Print Test Label</span>
          </button>

          <button
            type="button"
            onClick={onOpenHelp}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form Grid */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Section 1: Printer Hardware Profile */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-white/10">
              <Printer className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Printer Hardware
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              {installedPrinters.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Detected Installed Windows Printers
                  </label>
                  <select
                    value={form.printerName}
                    onChange={(e) => setForm({ ...form, printerName: e.target.value })}
                    className="w-full bg-black/40 border border-cyan-500/40 rounded-lg px-3 py-2 text-cyan-300 text-xs font-mono focus:outline-hidden focus:border-cyan-400"
                  >
                    {installedPrinters.map((p) => (
                      <option key={p.id || p.name} value={p.name} className="bg-slate-900 text-slate-200">
                        {p.name} {p.port ? `(${p.port})` : ''} {p.isZebra ? '★ Zebra ZT230' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-emerald-400 font-mono mt-1">
                    ✓ Connected via Windows Spooler ({form.printerName})
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Printer Target Name
                </label>
                <input
                  type="text"
                  value={form.printerName}
                  onChange={(e) => setForm({ ...form, printerName: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Printer Model
                  </label>
                  <input
                    type="text"
                    value={form.printerModel}
                    onChange={(e) => setForm({ ...form, printerModel: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:outline-hidden focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Printer Language
                  </label>
                  <select
                    value={form.printerLanguage}
                    onChange={(e) =>
                      setForm({ ...form, printerLanguage: e.target.value as 'ZPL' })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value="ZPL">ZPL II (Recommended)</option>
                    <option value="EPL">EPL2</option>
                    <option value="CPCL">CPCL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Printer DPI Resolution
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[200, 300, 600].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleDpiChange(d as 200 | 300 | 600)}
                      className={`py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                        form.dpi === d
                          ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                          : 'bg-black/40 text-slate-400 hover:text-white border border-white/10'
                      }`}
                    >
                      {d} DPI
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Standard Zebra ZT230 printhead is 200 DPI (8 dots/mm).
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Local Agent Spooler Endpoint
                </label>
                <input
                  type="text"
                  value={form.agentUrl}
                  onChange={(e) => setForm({ ...form, agentUrl: e.target.value })}
                  placeholder="http://localhost:9100/api/printer/zpl"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:outline-hidden focus:border-cyan-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Local USB daemon bridge running on host.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Physical Label Dimensions */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-white/10">
              <Ruler className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Label Dimensions (.LBL Specs)
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              {/* Quick Dimension Presets */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Label Dimension Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={applyPreset30x10}
                    className={`px-2.5 py-2 rounded-xl text-left border transition-all ${
                      form.labelWidthMm === 30 && form.labelHeightMm === 10
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="font-bold font-mono text-[11px] text-white">30 × 10 mm</div>
                    <div className="text-[10px] text-cyan-400 font-mono mt-0.5">20×5mm Barcode (Target)</div>
                  </button>

                  <button
                    type="button"
                    onClick={applyPreset50x25}
                    className={`px-2.5 py-2 rounded-xl text-left border transition-all ${
                      form.labelWidthMm === 50 && form.labelHeightMm === 25
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="font-bold font-mono text-[11px] text-white">50 × 25 mm</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Standard Thermal Roll</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Label Width (mm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="10"
                    max="150"
                    value={form.labelWidthMm}
                    onChange={(e) => handleWidthMmChange(parseFloat(e.target.value) || 30)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:outline-hidden focus:border-cyan-500"
                  />
                  <span className="text-[11px] text-slate-500">
                    ≈ {form.labelWidthInches} inches
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Label Height (mm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="10"
                    max="150"
                    value={form.labelHeightMm}
                    onChange={(e) => handleHeightMmChange(parseFloat(e.target.value) || 10)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:outline-hidden focus:border-cyan-500"
                  />
                  <span className="text-[11px] text-slate-500">
                    ≈ {form.labelHeightInches} inches
                  </span>
                </div>
              </div>

              {/* Converted Dots Calculation */}
              <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-[11px] space-y-1 font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Width in Printer Dots:</span>
                  <span className="font-bold text-cyan-400">{form.labelWidthDots} dots</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Height in Printer Dots:</span>
                  <span className="font-bold text-cyan-400">{form.labelHeightDots} dots</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ZPL Print Width (^PW):</span>
                  <span className="font-bold text-emerald-400">^PW{form.labelWidthDots}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ZPL Label Length (^LL):</span>
                  <span className="font-bold text-emerald-400">^LL{form.labelHeightDots}</span>
                </div>
              </div>

              {/* Offsets */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Horizontal Offset (dots)
                  </label>
                  <input
                    type="number"
                    value={form.horizontalOffsetDots}
                    onChange={(e) =>
                      setForm({ ...form, horizontalOffsetDots: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:outline-hidden focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Vertical Offset (dots)
                  </label>
                  <input
                    type="number"
                    value={form.verticalOffsetDots}
                    onChange={(e) =>
                      setForm({ ...form, verticalOffsetDots: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Barcode Optics & Density */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-white/10">
              <Zap className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Barcode Optics & Thermal Settings
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Barcode Symbology
                </label>
                <select
                  value={form.barcodeSymbology || 'DATAMATRIX'}
                  onChange={(e) =>
                    setForm({ ...form, barcodeSymbology: e.target.value as 'DATAMATRIX' | 'CODE128' })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:outline-hidden focus:border-cyan-500"
                >
                  <option value="DATAMATRIX">2D Data Matrix ECC 200 (Recommended: Encodes full 26+ chars on 30x10mm)</option>
                  <option value="CODE128">1D Code 128 (Linear: Encodes 16-char sequence to fit 25mm width limit)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {form.barcodeSymbology === 'CODE128'
                    ? '1D Code 128 encodes model & sequence to stay within 25mm on 200 DPI printers.'
                    : '2D DataMatrix encodes the complete full identifier with zero loss, centered on 30×10mm.'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Module Width (dots)
                  </label>
                  <select
                    value={form.moduleWidthDots}
                    onChange={(e) =>
                      setForm({ ...form, moduleWidthDots: parseInt(e.target.value, 10) })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value={1}>1 dot (Dense / High-res)</option>
                    <option value={2}>2 dots (Standard 200 DPI)</option>
                    <option value={3}>3 dots (Wide)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Barcode Height (dots)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="180"
                    value={form.barcodeHeightDots}
                    onChange={(e) =>
                      setForm({ ...form, barcodeHeightDots: parseInt(e.target.value, 10) || 80 })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>Print Darkness / Burn Time (^MD):</span>
                  <span className="text-cyan-400 font-mono">{form.darkness} / 30</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={form.darkness}
                  onChange={(e) => setForm({ ...form, darkness: parseInt(e.target.value, 10) })}
                  className="w-full accent-cyan-400 bg-black/40"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Print Speed (IPS)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 3, 4, 6].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setForm({ ...form, printSpeedIps: spd })}
                      className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                        form.printSpeedIps === spd
                          ? 'bg-purple-500 text-white shadow-xs'
                          : 'bg-black/40 text-slate-400 hover:text-white border border-white/10'
                      }`}
                    >
                      {spd} IPS
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Batch Duplicate Policy
                </label>
                <select
                  value={form.duplicatePolicy}
                  onChange={(e) =>
                    setForm({ ...form, duplicatePolicy: e.target.value as DuplicatePolicy })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:outline-hidden focus:border-cyan-500"
                >
                  <option value="PREVENT">Prevent Duplicates (Strict Block)</option>
                  <option value="WARN">Warn Only (Allow with Flag)</option>
                  <option value="ALLOW">Allow Duplicates Silently</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Multi-Column Roll Web Layout (3-Across Roll Setup) */}
        {(() => {
          const cols = form.columnsAcross || 3;
          const gapMm = form.columnGapMm ?? 2.0;
          const gapDots = Math.round(gapMm * (form.dpi / 25.4));
          const totalWebWidthMm = (cols * form.labelWidthMm + (cols - 1) * gapMm).toFixed(1);
          const totalWebWidthDots = cols * form.labelWidthDots + (cols - 1) * gapDots;
          const isColumnWise = (form.printDirection || 'COLUMN_WISE') === 'COLUMN_WISE';

          return (
            <div className="bg-gradient-to-br from-cyan-950/30 via-slate-900/60 to-blue-950/30 border border-cyan-500/30 rounded-2xl p-6 space-y-5 backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.08)]">
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/20 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Columns3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                        Multi-Column Web Layout (3-Across Roll Configuration)
                      </h3>
                      <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-400/30 font-mono">
                        Zero Label Waste Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Configured for 3-column physical label rolls. Prints barcodes across all columns simultaneously to prevent wasting 2 blank labels per feed.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-lg">
                    ✓ {cols}-Across Web ({totalWebWidthMm}mm)
                  </span>
                </div>
              </div>

              {/* Grid Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
                {/* 1. Columns Across Web */}
                <div className="space-y-2 bg-black/40 p-4 rounded-xl border border-white/10">
                  <label className="block font-semibold text-slate-200">
                    Sticker Columns Across Web
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm({ ...form, columnsAcross: c })}
                        className={`py-2 px-1 rounded-lg font-mono font-bold text-xs transition-all ${
                          cols === c
                            ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                            : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                        }`}
                      >
                        {c} {c === 1 ? 'Col' : 'Cols'} {c === 3 ? '★' : ''}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {cols === 3
                      ? '★ Standard 3-across 30×10mm roll (Recommended)'
                      : cols === 1
                      ? 'Single label roll (1 column)'
                      : '2-across roll'}
                  </p>
                </div>

                {/* 2. Print Direction / Sequence Flow */}
                <div className="space-y-2 bg-black/40 p-4 rounded-xl border border-white/10 md:col-span-2">
                  <label className="block font-semibold text-slate-200">
                    Print Order / Feed Direction
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Column Wise */}
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, printDirection: 'COLUMN_WISE' })}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                        isColumnWise
                          ? 'bg-cyan-950/60 border-cyan-400 text-white ring-1 ring-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <ArrowDown className="w-4 h-4 text-cyan-400" />
                          <span className="font-bold text-xs font-mono text-cyan-300">
                            Column-Wise (Vertical)
                          </span>
                        </div>
                        <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono font-bold">
                          PREVENTS WASTE
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Fills Column 1 down the strip, then Column 2, then Column 3. Serial numbers and sensor sets stay continuous down each strip.
                      </p>
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-cyan-400/80 bg-black/50 px-2 py-1 rounded">
                        <span>Col 1: 1, 2, 3</span>
                        <span>·</span>
                        <span>Col 2: 4, 5, 6</span>
                        <span>·</span>
                        <span>Col 3: 7, 8, 9</span>
                      </div>
                    </button>

                    {/* Row Wise */}
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, printDirection: 'ROW_WISE' })}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                        !isColumnWise
                          ? 'bg-cyan-950/60 border-cyan-400 text-white ring-1 ring-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <ArrowRight className="w-4 h-4 text-blue-400" />
                          <span className="font-bold text-xs font-mono text-blue-300">
                            Row-Wise (Horizontal)
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Fills horizontally across each row (Col 1 → Col 2 → Col 3) before advancing the web forward.
                      </p>
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-blue-400/80 bg-black/50 px-2 py-1 rounded">
                        <span>Row 1: 1, 2, 3</span>
                        <span>·</span>
                        <span>Row 2: 4, 5, 6</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Dimensional Calculation & Alignment Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
                  <span className="text-slate-400 text-[11px]">Horizontal Gap Between Columns</span>
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="20"
                      value={gapMm}
                      onChange={(e) =>
                        setForm({ ...form, columnGapMm: Math.max(0, parseFloat(e.target.value) || 0) })
                      }
                      className="w-20 bg-black/50 border border-white/20 rounded px-2 py-1 text-cyan-300 text-xs font-mono focus:outline-hidden focus:border-cyan-400"
                    />
                    <span className="text-slate-400">mm ({gapDots} dots)</span>
                  </div>
                </div>

                <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
                  <span className="text-slate-400 text-[11px]">Single Sticker Size</span>
                  <p className="text-white font-bold">{form.labelWidthMm} × {form.labelHeightMm} mm</p>
                  <p className="text-[10px] text-cyan-400">{form.labelWidthDots} × {form.labelHeightDots} dots</p>
                </div>

                <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
                  <span className="text-slate-400 text-[11px]">Total Web Width</span>
                  <p className="text-emerald-400 font-bold">{totalWebWidthMm} mm ({totalWebWidthDots} dots)</p>
                  <p className="text-[10px] text-slate-400">{cols} labels + {cols - 1} gaps</p>
                </div>

                <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
                  <span className="text-slate-400 text-[11px]">Zebra ZT230 Printhead Clearance</span>
                  <p className="text-emerald-400 font-bold">✓ Fits Perfectly</p>
                  <p className="text-[10px] text-slate-400">
                    {totalWebWidthDots} / 832 dots ({((totalWebWidthDots / 832) * 100).toFixed(1)}% printhead)
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Windows Installer & Supporting Drivers Package Card */}
        <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-5 space-y-4 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center space-x-2">
                  <span>Windows Installation (.EXE) & Supporting Softwares</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    NSIS Auto-Setup
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Package includes automatic Windows Print Spooler configuration, firewall rules, and Zebra driver hooks.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  const batContent = `@echo off\r\n:: ATM Sensor Barcode Manager - Automated Driver & Prerequisites Setup\r\nnet session >nul 2>&1\r\nif %errorLevel% NEQ 0 (\r\n    powershell -Command "Start-Process '%~f0' -Verb RunAs"\r\n    exit /b\r\n)\r\necho [1/3] Starting Windows Print Spooler Service...\r\nsc config spooler start= auto >nul 2>&1\r\nnet start spooler >nul 2>&1\r\necho [2/3] Adding Windows Defender Firewall Rules...\r\nnetsh advfirewall firewall add rule name="ATM Sensor Barcode Manager (HTTP 3000)" dir=in action=allow protocol=TCP localport=3000 profile=any >nul 2>&1\r\nnetsh advfirewall firewall add rule name="Zebra ZT230 RAW Spooler (Port 9100)" dir=in action=allow protocol=TCP localport=9100 profile=any >nul 2>&1\r\necho [3/3] Registering Zebra ZT230 Spooler Queue...\r\npowershell -ExecutionPolicy Bypass -Command "Get-Service spooler; Write-Host 'Windows Print Spooler and Firewall rules active!' -ForegroundColor Green"\r\necho Setup complete!\r\npause\r\n`;
                  const blob = new Blob([batContent], { type: 'application/x-bat' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'install-prerequisites.bat';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-mono transition-colors"
                title="Download Standalone Driver & Firewall Batch Installer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Driver Setup (.bat)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>Print Spooler</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-white font-bold">Auto-Configured</p>
              <p className="text-[10px] text-slate-400">Windows Spooler service</p>
            </div>

            <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>Zebra ZT230 Queue</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-white font-bold">USB001 / Port 9100</p>
              <p className="text-[10px] text-slate-400">ZDesigner ZT230-200dpi</p>
            </div>

            <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>Firewall Rules</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-white font-bold">Ports 3000 & 9100</p>
              <p className="text-[10px] text-slate-400">Inbound allowed</p>
            </div>

            <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>Build Script</span>
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <p className="text-white font-bold">build-exe.bat</p>
              <p className="text-[10px] text-slate-400">1-click .EXE compiler</p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center space-x-2 px-4 py-2 bg-black/40 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to ZT230 Factory Defaults</span>
          </button>

          <div className="flex items-center space-x-3">
            {savedToast && (
              <span className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold animate-pulse">
                <Check className="w-4 h-4" />
                <span>Settings Saved & Active</span>
              </span>
            )}

            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-wider rounded-xl text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save & Apply Calibration</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
