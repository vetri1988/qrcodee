import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, Trash2, RotateCcw, Copy, Tag } from 'lucide-react';
import { BarcodeItem, PrinterConfig } from '../types';
import { BarcodePreview } from './BarcodePreview';
import { inferSensorMetadata } from '../utils/barcodeValidator';

interface BarcodeRowProps {
  item: BarcodeItem;
  index: number;
  totalRows: number;
  config: PrinterConfig;
  onValueChange: (id: string, value: string) => void;
  onClearRow: (id: string) => void;
  onDeleteRow: (id: string) => void;
  onDuplicateRow: (id: string) => void;
}

export const BarcodeRow: React.FC<BarcodeRowProps> = ({
  item,
  index,
  totalRows,
  config,
  onValueChange,
  onClearRow,
  onDeleteRow,
  onDuplicateRow,
}) => {
  const metadata = item.barcodeValue ? inferSensorMetadata(item.barcodeValue) : null;

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 backdrop-blur-md ${
        item.isDuplicate
          ? 'bg-amber-950/20 border-amber-500/40 ring-1 ring-amber-500/30'
          : !item.isValid && item.barcodeValue.trim() !== ''
          ? 'bg-rose-950/20 border-rose-500/40 ring-1 ring-rose-500/30'
          : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left column: Row Label & Input Field */}
        <div className="w-full lg:w-3/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/20">
                {item.rowNumber}
              </span>
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Label #{item.rowNumber}
              </span>

              {metadata && item.barcodeValue && (
                <span className="hidden sm:inline-flex items-center space-x-1 text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-400/30">
                  <Tag className="w-3 h-3 text-cyan-400" />
                  <span>{metadata.sensorType}</span>
                </span>
              )}
            </div>

            {/* Validation Badge */}
            <div className="flex items-center space-x-1.5 text-xs font-mono">
              {item.isValid ? (
                <span className="flex items-center space-x-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Valid</span>
                </span>
              ) : item.isDuplicate ? (
                <span className="flex items-center space-x-1 text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                  <AlertCircle className="w-3 h-3" />
                  <span>Duplicate</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider">
                  <XCircle className="w-3 h-3" />
                  <span>Invalid</span>
                </span>
              )}
            </div>
          </div>

          {/* Barcode Input Field */}
          <div className="relative">
            <input
              type="text"
              value={item.barcodeValue}
              onChange={(e) => onValueChange(item.id, e.target.value)}
              placeholder="e.g. ATM1-CDS1-11111-V1-IN11112"
              spellCheck={false}
              autoComplete="off"
              className={`w-full font-mono text-sm px-4 py-2.5 rounded-xl border transition-all focus:outline-hidden ${
                item.isDuplicate
                  ? 'border-amber-400/60 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-black/50 text-amber-200'
                  : !item.isValid && item.barcodeValue.trim() !== ''
                  ? 'border-rose-400/60 focus:border-rose-400 focus:ring-1 focus:ring-rose-400 bg-black/50 text-rose-200'
                  : 'border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 bg-black/40 text-white placeholder-slate-500'
              }`}
            />
          </div>

          {/* Validation Error Message */}
          {item.validationError && (
            <p className="text-[11px] text-rose-400 font-mono flex items-center space-x-1 pt-0.5">
              <span>⚠️</span>
              <span>{item.validationError}</span>
            </p>
          )}

          {/* Row Actions */}
          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={() => onClearRow(item.id)}
              disabled={!item.barcodeValue}
              title="Clear text in this row"
              className="text-[11px] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center space-x-1 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-colors border border-white/5"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>

            <button
              type="button"
              onClick={() => onDuplicateRow(item.id)}
              title="Duplicate this row"
              className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-colors border border-white/5"
            >
              <Copy className="w-3 h-3" />
              <span>Duplicate</span>
            </button>

            {totalRows > 1 && (
              <button
                type="button"
                onClick={() => onDeleteRow(item.id)}
                title="Remove this row"
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center space-x-1 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-500/20 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Right column: Live Barcode & Human-Readable Sticker Preview */}
        <div className="w-full lg:w-2/5 flex flex-col items-center lg:items-end justify-center">
          <div className="text-[10px] font-mono font-semibold text-slate-400 uppercase mb-1 tracking-wider text-right w-full">
            Thermal Output Preview
          </div>
          <BarcodePreview
            value={item.barcodeValue}
            width={240}
            height={90}
            fontSize={config.humanReadableFontSizeDots ? Math.round(config.humanReadableFontSizeDots / 2.2) : 13}
            barWidth={config.moduleWidthDots ? config.moduleWidthDots * 0.8 : 1.6}
            barHeight={config.barcodeHeightDots ? Math.round(config.barcodeHeightDots / 2) : 40}
            labelDimensionsText={`${config.labelWidthMm}mm × ${config.labelHeightMm}mm`}
            barcodeSymbology={config.barcodeSymbology || 'DATAMATRIX'}
          />
        </div>
      </div>
    </div>
  );
};
