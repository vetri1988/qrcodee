import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  FileText,
  Sliders,
  Check,
  Info,
  Layers,
  Scissors,
  Eye,
  Download,
} from 'lucide-react';
import { BarcodeItem, PrinterConfig } from '../types';
import { BarcodePreview } from './BarcodePreview';

interface InkjetPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BarcodeItem[];
  config: PrinterConfig;
}

export const InkjetPrintModal: React.FC<InkjetPrintModalProps> = ({
  isOpen,
  onClose,
  items,
  config,
}) => {
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter'>('A4');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'single' | 'sheet3x8'>('sheet3x8');
  const [showCutBorders, setShowCutBorders] = useState(true);
  const [showIndexNumber, setShowIndexNumber] = useState(true);
  const [selectedSingleIndex, setSelectedSingleIndex] = useState(0);

  if (!isOpen) return null;

  const validItems = items.filter((i) => i.barcodeValue && i.barcodeValue.trim() !== '');

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Non-Print Container for UI and interactive controls */}
      <div className="bg-[#0b0f19] text-white rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] max-w-5xl w-full border border-cyan-500/30 overflow-hidden flex flex-col max-h-[92vh] print:hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2">
                <span>Print on Standard Inkjet / Laser Printer</span>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] px-2 py-0.5 rounded-full font-mono">
                  A4 / Letter / PDF
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Verify label sizing ({config.labelWidthMm}×{config.labelHeightMm}mm), layout alignment, and barcode scanner readability on plain paper
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="px-6 py-3 bg-black/50 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          {/* Paper & Layout Options */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Paper:</span>
              <div className="bg-white/10 p-0.5 rounded-lg border border-white/10 flex">
                <button
                  type="button"
                  onClick={() => setPaperSize('A4')}
                  className={`px-2.5 py-1 rounded text-xs transition-all ${
                    paperSize === 'A4' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  A4 (210×297mm)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize('Letter')}
                  className={`px-2.5 py-1 rounded text-xs transition-all ${
                    paperSize === 'Letter' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Letter (8.5×11&quot;)
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Layout:</span>
              <div className="bg-white/10 p-0.5 rounded-lg border border-white/10 flex">
                <button
                  type="button"
                  onClick={() => setLayoutMode('sheet3x8')}
                  className={`px-2.5 py-1 rounded text-xs transition-all ${
                    layoutMode === 'sheet3x8' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Sticker Sheet (3×8 Grid)
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('grid')}
                  className={`px-2.5 py-1 rounded text-xs transition-all ${
                    layoutMode === 'grid' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  2-Column Grid
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('single')}
                  className={`px-2.5 py-1 rounded text-xs transition-all ${
                    layoutMode === 'single' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Single Proof (1:1)
                </button>
              </div>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="flex items-center space-x-3 text-xs">
            <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={showCutBorders}
                onChange={(e) => setShowCutBorders(e.target.checked)}
                className="rounded accent-cyan-500"
              />
              <span className="flex items-center space-x-1">
                <Scissors className="w-3.5 h-3.5 text-amber-400" />
                <span>Cut Outlines</span>
              </span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={showIndexNumber}
                onChange={(e) => setShowIndexNumber(e.target.checked)}
                className="rounded accent-cyan-500"
              />
              <span>Label Index (#)</span>
            </label>
          </div>
        </div>

        {/* Paper Simulation Viewport */}
        <div className="flex-1 p-6 overflow-y-auto bg-black/70 flex flex-col items-center">
          {/* Inkjet Advice Banner */}
          <div className="max-w-3xl w-full mb-4 bg-blue-950/40 border border-blue-500/30 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-blue-200">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-white">
                Inkjet / Laser Printer Verification Tips:
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                In the print dialog, set <strong className="text-cyan-300">Scale to 100% (Actual Size)</strong> and quality to <strong className="text-cyan-300">Standard/High</strong> (avoid &quot;Draft&quot; or &quot;Eco&quot; mode to ensure sharp barcode edges). You can scan the printed paper with any phone camera or USB 1D laser barcode scanner.
              </p>
            </div>
          </div>

          {/* Virtual Sheet Sheet Paper Canvas */}
          <div
            className={`bg-white text-black p-8 rounded-lg shadow-2xl border border-slate-300 transition-all ${
              paperSize === 'A4' ? 'w-[750px] min-h-[980px]' : 'w-[750px] min-h-[920px]'
            }`}
          >
            {/* Sheet Top Header Info */}
            <div className="border-b border-slate-200 pb-3 mb-6 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <div>
                <span className="font-bold text-slate-800">ATM SENSOR BARCODE SHEET</span> · {validItems.length} Labels ({config.labelWidthMm}×{config.labelHeightMm}mm)
              </div>
              <div>
                Paper: {paperSize} · Scale: 100% 1:1 Physical
              </div>
            </div>

            {validItems.length === 0 ? (
              <div className="text-center py-20 text-slate-400 font-mono text-xs">
                No valid barcodes in queue. Please add barcode values first.
              </div>
            ) : layoutMode === 'single' ? (
              /* Single Label Proof Mode with Calibration Ruler */
              <div className="flex flex-col items-center justify-center py-10 space-y-6">
                <div className="text-xs font-mono text-slate-600">
                  Proofing Label {selectedSingleIndex + 1} of {validItems.length}:
                </div>

                {/* Single Printable Label */}
                <div
                  style={{ width: `${config.labelWidthMm}mm`, height: `${config.labelHeightMm}mm` }}
                  className={`relative bg-white flex flex-col items-center justify-center p-1 text-black ${
                    showCutBorders ? 'border border-dashed border-slate-400' : 'border border-slate-200'
                  }`}
                >
                  <BarcodePreview
                    value={validItems[selectedSingleIndex]?.barcodeValue || ''}
                    width={180}
                    height={75}
                    fontSize={10}
                    barWidth={1.2}
                    barHeight={32}
                    showStickerFrame={false}
                  />
                  {showIndexNumber && (
                    <span className="absolute top-1 right-1 text-[8px] font-mono font-bold text-slate-400">
                      #{selectedSingleIndex + 1}
                    </span>
                  )}
                </div>

                {/* Ruler for dimension check */}
                <div style={{ width: `${config.labelWidthMm}mm` }} className="border-t-2 border-slate-700 pt-1 text-[9px] font-mono text-slate-500 flex justify-between">
                  <span>| 0mm</span>
                  <span>{(config.labelWidthMm / 2).toFixed(1)}mm</span>
                  <span>{config.labelWidthMm}mm |</span>
                </div>

                {/* Navigation among single items */}
                {validItems.length > 1 && (
                  <div className="flex items-center space-x-3 pt-4 font-mono text-xs">
                    <button
                      type="button"
                      disabled={selectedSingleIndex === 0}
                      onClick={() => setSelectedSingleIndex((i) => Math.max(0, i - 1))}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-800"
                    >
                      ← Previous
                    </button>
                    <span className="text-slate-600 font-bold">
                      {selectedSingleIndex + 1} / {validItems.length}
                    </span>
                    <button
                      type="button"
                      disabled={selectedSingleIndex === validItems.length - 1}
                      onClick={() => setSelectedSingleIndex((i) => Math.min(validItems.length - 1, i + 1))}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-800"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            ) : layoutMode === 'sheet3x8' ? (
              /* 3 Columns x N Rows Sticker Sheet Grid (50x25mm labels) */
              <div className="grid grid-cols-3 gap-x-3 gap-y-3">
                {validItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{ minHeight: '94px' }}
                    className={`relative bg-white p-1 flex flex-col items-center justify-center rounded-sm ${
                      showCutBorders ? 'border border-dashed border-slate-400' : 'border border-slate-100'
                    }`}
                  >
                    {showIndexNumber && (
                      <span className="absolute top-1 left-1.5 text-[8px] font-mono font-bold text-slate-400">
                        #{idx + 1}
                      </span>
                    )}
                    <BarcodePreview
                      value={item.barcodeValue}
                      width={185}
                      height={75}
                      fontSize={9}
                      barWidth={1.2}
                      barHeight={32}
                      showStickerFrame={false}
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* 2 Column Larger Grid */
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                {validItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{ minHeight: '105px' }}
                    className={`relative bg-white p-2 flex flex-col items-center justify-center rounded-sm ${
                      showCutBorders ? 'border border-dashed border-slate-400' : 'border border-slate-100'
                    }`}
                  >
                    {showIndexNumber && (
                      <span className="absolute top-1 left-2 text-[9px] font-mono font-bold text-slate-400">
                        #{idx + 1}
                      </span>
                    )}
                    <BarcodePreview
                      value={item.barcodeValue}
                      width={240}
                      height={85}
                      fontSize={11}
                      barWidth={1.4}
                      barHeight={36}
                      showStickerFrame={false}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            Ready to print on inkjet: <strong className="text-cyan-400">{validItems.length}</strong> barcode labels
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-medium text-slate-300 transition-colors font-mono"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleTriggerPrint}
              disabled={validItems.length === 0}
              className="flex items-center space-x-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-white font-bold uppercase tracking-wider rounded-xl text-xs shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print via Inkjet / Save PDF (Ctrl+P)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Print Container for @media print rendering */}
      <div className="hidden print:block w-full bg-white text-black p-0 m-0">
        <div className="text-[10px] font-mono text-slate-500 mb-2 border-b border-slate-300 pb-1 flex justify-between">
          <span>ATM SENSOR BARCODE VERIFICATION SHEET ({config.labelWidthMm}×{config.labelHeightMm}mm)</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>

        {layoutMode === 'single' ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <div
              style={{ width: `${config.labelWidthMm}mm`, height: `${config.labelHeightMm}mm` }}
              className={`relative bg-white flex flex-col items-center justify-center p-1 ${
                showCutBorders ? 'border border-dashed border-black' : ''
              }`}
            >
              <BarcodePreview
                value={validItems[selectedSingleIndex]?.barcodeValue || ''}
                width={180}
                height={75}
                fontSize={10}
                barWidth={1.2}
                barHeight={32}
                showStickerFrame={false}
              />
            </div>
            <div style={{ width: `${config.labelWidthMm}mm` }} className="border-t border-black pt-1 text-[8px] font-mono flex justify-between">
              <span>0mm</span>
              <span>{(config.labelWidthMm / 2).toFixed(1)}mm</span>
              <span>{config.labelWidthMm}mm</span>
            </div>
          </div>
        ) : layoutMode === 'sheet3x8' ? (
          <div className="grid grid-cols-3 gap-2">
            {validItems.map((item, idx) => (
              <div
                key={idx}
                style={{ width: '58mm', height: '30mm', boxSizing: 'border-box' }}
                className={`p-1 flex flex-col items-center justify-center ${
                  showCutBorders ? 'border border-dashed border-slate-400' : ''
                }`}
              >
                {showIndexNumber && (
                  <span className="text-[7px] font-mono self-start text-slate-600">
                    #{idx + 1}
                  </span>
                )}
                <BarcodePreview
                  value={item.barcodeValue}
                  width={180}
                  height={70}
                  fontSize={9}
                  barWidth={1.1}
                  barHeight={28}
                  showStickerFrame={false}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {validItems.map((item, idx) => (
              <div
                key={idx}
                style={{ width: '85mm', height: '38mm', boxSizing: 'border-box' }}
                className={`p-2 flex flex-col items-center justify-center ${
                  showCutBorders ? 'border border-dashed border-slate-400' : ''
                }`}
              >
                {showIndexNumber && (
                  <span className="text-[8px] font-mono self-start text-slate-600">
                    #{idx + 1}
                  </span>
                )}
                <BarcodePreview
                  value={item.barcodeValue}
                  width={230}
                  height={80}
                  fontSize={10}
                  barWidth={1.3}
                  barHeight={32}
                  showStickerFrame={false}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
