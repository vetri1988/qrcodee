import React from 'react';
import { Printer, CheckCircle2, Sliders, Cpu, ShieldAlert, Wifi } from 'lucide-react';
import { PrinterConfig } from '../types';

interface PrinterStatusBarProps {
  config: PrinterConfig;
  onOpenSettings: () => void;
}

export const PrinterStatusBar: React.FC<PrinterStatusBarProps> = ({
  config,
  onOpenSettings,
}) => {
  return (
    <div className="bg-black/60 border-b border-white/10 text-slate-300 text-xs py-2.5 px-4 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2">
        {/* Left: Printer status */}
        <div className="flex items-center space-x-3 sm:space-x-4 flex-wrap gap-y-1.5 font-mono text-[11px]">
          <div className="flex items-center space-x-2 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Printer:</span>
            <span className="text-white font-bold">{config.printerName}</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
            <span>ZT230 LINK ONLINE</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Res: <strong className="text-white">{config.dpi} DPI</strong>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-1.5 text-slate-400">
            <span>
              Media:{' '}
              <strong className="text-white">
                {config.labelWidthMm}×{config.labelHeightMm}mm
              </strong>
            </span>
            <span className="text-slate-500">
              ({config.labelWidthDots}×{config.labelHeightDots}d)
            </span>
          </div>
        </div>

        {/* Right: Policy & Quick Settings button */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-mono hidden sm:flex">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            <span>Policy:</span>
            <span className="font-bold text-purple-300">{config.duplicatePolicy}</span>
          </div>

          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-xs"
          >
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span>Calibrate</span>
          </button>
        </div>
      </div>
    </div>
  );
};
