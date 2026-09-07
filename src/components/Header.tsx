import React from 'react';
import { Printer, History, Settings, Play, Layers, HelpCircle, ShieldCheck } from 'lucide-react';
import { PrinterConfig } from '../types';

interface HeaderProps {
  activeTab: 'entry' | 'history' | 'settings';
  setActiveTab: (tab: 'entry' | 'history' | 'settings') => void;
  config: PrinterConfig;
  onQuickTestPrint: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  config,
  onQuickTestPrint,
  onOpenHelp,
}) => {
  return (
    <header className="bg-[#030712]/80 backdrop-blur-xl text-white border-b border-white/10 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] font-bold tracking-wider">
              <Printer className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-sm sm:text-base font-bold tracking-wider text-white uppercase">
                  ATM Sensor Barcode Label Manager
                </h1>

                {/* Permanent Full Version Badge */}
                <div
                  className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border bg-emerald-500/15 text-emerald-300 border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  title="Full Unrestricted Commercial License"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>FULL VERSION</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 bg-black/50 p-1 rounded-xl border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('entry')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'entry'
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Batch Entry</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'history'
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Print History</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'settings'
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Calibration</span>
            </button>
          </div>

          {/* Action Tools */}
          <div className="hidden lg:flex items-center space-x-2">
            <button
              onClick={onQuickTestPrint}
              title="Print calibration test label to Zebra ZT230"
              className="flex items-center space-x-1.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-xs"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>Test Print</span>
            </button>

            <button
              onClick={onOpenHelp}
              title="View Architecture & Setup Guide"
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
