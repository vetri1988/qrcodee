import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Printer,
  Code,
  Eye,
  Download,
  Copy,
  Check,
  Columns3,
  ArrowDown,
  ArrowRight,
} from 'lucide-react';
import { BarcodeItem, PrinterConfig } from '../types';
import { BarcodePreview } from './BarcodePreview';
import { generateBatchZpl, layoutGrid } from '../utils/zplGenerator';

interface LabelPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BarcodeItem[];
  config: PrinterConfig;
  onPrint: () => void;
}

export const LabelPreviewModal: React.FC<LabelPreviewModalProps> = ({
  isOpen,
  onClose,
  items,
  config,
  onPrint,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'grid' | 'zpl'>('single');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [copiedZpl, setCopiedZpl] = useState(false);

  if (!isOpen) return null;

  const validItems = items.filter((i) => i.barcodeValue && i.barcodeValue.trim() !== '');
  const currentItem = validItems[currentIndex] || validItems[0];
  const fullZplCode = generateBatchZpl(
    validItems.map((i) => i.barcodeValue),
    config
  );

  const handleCopyZpl = () => {
    navigator.clipboard.writeText(fullZplCode);
    setCopiedZpl(true);
    setTimeout(() => setCopiedZpl(false), 2000);
  };

  const handleDownloadZpl = () => {
    const blob = new Blob([fullZplCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ATM_LABELS_${new Date().toISOString().slice(0, 10)}.zpl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#0b0f19] text-white rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] max-w-4xl w-full border border-cyan-500/30 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Physical Thermal Label Simulation
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                {config.printerName} · {config.labelWidthMm}×{config.labelHeightMm}mm @ {config.dpi} DPI
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center space-x-2">
            <div className="bg-black/50 p-1 rounded-xl border border-white/10 flex items-center space-x-1 text-xs">
              <button
                onClick={() => setViewMode('single')}
                className={`px-3 py-1 rounded-lg font-semibold uppercase tracking-wider transition-all ${
                  viewMode === 'single'
                    ? 'bg-cyan-500 text-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Single
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-lg font-semibold uppercase tracking-wider transition-all ${
                  viewMode === 'grid'
                    ? 'bg-cyan-500 text-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Grid ({validItems.length})
              </button>
              <button
                onClick={() => setViewMode('zpl')}
                className={`px-3 py-1 rounded-lg font-semibold uppercase tracking-wider transition-all flex items-center space-x-1 ${
                  viewMode === 'zpl'
                    ? 'bg-cyan-500 text-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code className="w-3 h-3" />
                <span>ZPL</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar (Zoom & Navigation) */}
        {viewMode !== 'zpl' && (
          <div className="px-6 py-2.5 bg-black/40 border-b border-white/10 flex items-center justify-between text-xs text-slate-300">
            {/* Zoom controls */}
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-mono">Scale:</span>
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                className="p-1 hover:bg-white/10 rounded-md transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono font-bold text-cyan-400">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                className="p-1 hover:bg-white/10 rounded-md transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="text-[11px] text-cyan-400 hover:underline ml-1 font-mono"
              >
                1:1
              </button>
            </div>

            {/* Single mode navigation */}
            {viewMode === 'single' && validItems.length > 1 && (
              <div className="flex items-center space-x-2 font-mono">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((c) => Math.max(0, c - 1))}
                  className="p-1 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-white text-xs">
                  Label {currentIndex + 1} / {validItems.length}
                </span>
                <button
                  disabled={currentIndex === validItems.length - 1}
                  onClick={() => setCurrentIndex((c) => Math.min(validItems.length - 1, c + 1))}
                  className="p-1 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal Main Viewport */}
        <div className="flex-1 p-6 overflow-y-auto bg-black/60 flex flex-col items-center justify-center min-h-[340px]">
          {validItems.length === 0 ? (
            <div className="text-center text-slate-500 py-12 font-mono">
              <p>No valid barcodes to preview.</p>
              <p className="text-xs text-slate-600 mt-1">
                Please enter barcode numbers on the batch entry screen.
              </p>
            </div>
          ) : viewMode === 'single' && currentItem ? (
            /* Single label realistic sticker preview */
            <div className="flex flex-col items-center space-y-4">
              <div
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}
                className="transition-transform duration-150"
              >
                <div className="p-6 bg-amber-50/10 rounded-2xl border border-amber-400/20 shadow-inner flex flex-col items-center">
                  <span className="text-[10px] text-amber-300 font-mono uppercase mb-2 tracking-widest">
                    Die-Cut Thermal Transfer Liner
                  </span>

                  {/* Physical Label */}
                  <div className="bg-white rounded-xl p-5 shadow-2xl border border-slate-300 min-w-[320px] flex flex-col items-center justify-center text-black">
                    <BarcodePreview
                      value={currentItem.barcodeValue}
                      width={300}
                      height={120}
                      fontSize={14}
                      barWidth={2.0}
                      barHeight={52}
                      showStickerFrame={false}
                      barcodeSymbology={config.barcodeSymbology || 'DATAMATRIX'}
                    />
                  </div>
                </div>
              </div>

              {/* Details banner */}
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-400 flex items-center space-x-4 font-mono">
                <span>
                  Value: <strong className="text-white">{currentItem.barcodeValue}</strong>
                </span>
                <span>
                  Symbology: <strong className="text-cyan-400">Code 128</strong>
                </span>
                <span>
                  ZPL Length: <strong className="text-emerald-400">{config.labelHeightDots} dots</strong>
                </span>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* Multi-label grid / 3-column physical roll simulation */
            (() => {
              const cols = config.columnsAcross || 1;
              const isMultiCol = cols > 1;
              const printDir = config.printDirection || 'COLUMN_WISE';
              const grid = isMultiCol
                ? layoutGrid(validItems.map((i) => i.barcodeValue), cols, printDir)
                : [];

              if (isMultiCol) {
                return (
                  <div className="w-full space-y-4 max-h-[460px] overflow-y-auto p-2">
                    {/* Header info bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-mono">
                      <div className="flex items-center space-x-2">
                        <Columns3 className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-white">
                          Physical Roll Web Simulation ({cols} Columns Across)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="flex items-center space-x-1 text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded text-[11px]">
                          {printDir === 'COLUMN_WISE' ? (
                            <>
                              <ArrowDown className="w-3 h-3 text-cyan-400" />
                              <span>Column-Wise Order (Zero Blank Waste)</span>
                            </>
                          ) : (
                            <>
                              <ArrowRight className="w-3 h-3 text-blue-400" />
                              <span>Row-Wise Order</span>
                            </>
                          )}
                        </span>
                        <span className="text-slate-400">
                          {grid.length} Physical Feed{grid.length > 1 ? 's' : ''} ({validItems.length} labels)
                        </span>
                      </div>
                    </div>

                    {/* Web Roll Rows */}
                    <div className="space-y-3">
                      {grid.map((row, rIdx) => (
                        <div
                          key={rIdx}
                          className="bg-amber-950/20 border border-amber-400/20 rounded-xl p-3 shadow-inner space-y-2"
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono text-amber-300/80">
                            <span className="font-bold">Feed Row #{rIdx + 1}</span>
                            <span>{cols} Labels across 94mm web</span>
                          </div>

                          <div
                            className="grid gap-3"
                            style={{
                              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                            }}
                          >
                            {row.map((val, cIdx) => (
                              <div
                                key={cIdx}
                                className={`rounded-lg p-2.5 flex flex-col items-center justify-between relative transition-all ${
                                  val
                                    ? 'bg-white shadow-md border border-slate-300 text-black'
                                    : 'bg-black/30 border border-dashed border-white/20 text-slate-500 min-h-[90px] justify-center'
                                }`}
                              >
                                {val ? (
                                  <>
                                    <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1">
                                      <span className="font-bold text-slate-600">Col {cIdx + 1}</span>
                                      <span className="bg-slate-100 px-1 rounded">30×10mm</span>
                                    </div>
                                    <BarcodePreview
                                      value={val}
                                      width={190}
                                      height={70}
                                      fontSize={11}
                                      barWidth={1.3}
                                      barHeight={32}
                                      showStickerFrame={false}
                                      barcodeSymbology={config.barcodeSymbology || 'DATAMATRIX'}
                                    />
                                    <span className="text-[10px] text-slate-500 font-mono mt-1 font-semibold">
                                      {val}
                                    </span>
                                  </>
                                ) : (
                                  <div className="text-center font-mono text-[11px]">
                                    <span className="block font-semibold">Column {cIdx + 1}</span>
                                    <span className="text-[10px] text-slate-600">(Empty / Unprinted)</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[440px] overflow-y-auto p-2">
                  {validItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl p-3 shadow-lg border border-slate-300 flex flex-col items-center justify-between text-black relative group"
                    >
                      <span className="absolute top-1.5 left-2 text-[10px] font-bold text-slate-400 font-mono">
                        #{idx + 1}
                      </span>
                      <BarcodePreview
                        value={item.barcodeValue}
                        width={220}
                        height={85}
                        fontSize={12}
                        barWidth={1.5}
                        barHeight={38}
                        showStickerFrame={false}
                        barcodeSymbology={config.barcodeSymbology || 'DATAMATRIX'}
                      />
                      <span className="text-[10px] text-slate-400 mt-1 font-mono">
                        {config.labelWidthMm}×{config.labelHeightMm}mm
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()
          ) : (
            /* ZPL Raw Code View */
            <div className="w-full h-full flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 font-mono">
                  ZPL II Command Output ({validItems.length} labels):
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyZpl}
                    className="flex items-center space-x-1.5 text-xs bg-white/10 hover:bg-white/15 text-white px-3 py-1.5 rounded-lg transition-colors border border-white/10"
                  >
                    {copiedZpl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedZpl ? 'Copied!' : 'Copy ZPL'}</span>
                  </button>
                  <button
                    onClick={handleDownloadZpl}
                    className="flex items-center space-x-1.5 text-xs bg-white/10 hover:bg-white/15 text-white px-3 py-1.5 rounded-lg transition-colors border border-white/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .zpl</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                value={fullZplCode}
                rows={12}
                className="w-full h-72 bg-black/80 text-cyan-300 font-mono text-xs p-4 rounded-xl border border-cyan-500/30 focus:outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            Total Ready Labels: <strong className="text-cyan-400">{validItems.length}</strong>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-medium text-slate-300 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onPrint();
              }}
              disabled={validItems.length === 0}
              className="flex items-center space-x-2 px-6 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold uppercase tracking-wider rounded-xl text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print {validItems.length} Labels (ZPL)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
