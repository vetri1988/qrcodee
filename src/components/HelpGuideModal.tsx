import React from 'react';
import {
  X,
  BookOpen,
  Printer,
  FileCode,
  Terminal,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Code,
  ShieldCheck,
} from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0b0f19] border border-cyan-500/30 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Zebra ZT230 & .LBL Integration Architecture Guide
              </h2>
              <p className="text-xs text-slate-400">
                Direct ZPL II Code 128 thermal printing for ATM sensor stickers (50mm × 25mm / 200 DPI).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-xs leading-relaxed">
          {/* Architecture Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold mb-2">
                <Printer className="w-4 h-4" />
                <span>1. Hardware Spec</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Designed specifically for <strong>Zebra ZT230 200 DPI</strong> industrial thermal printers (8 dots/mm resolution).
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-2">
                <FileCode className="w-4 h-4" />
                <span>2. .LBL Physical Conversion</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Legacy .LBL files define 50mm × 25mm dimensions. Converted mathematically to <strong>400 × 200 dots</strong> for exact 1:1 hardware match.
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center space-x-2 text-purple-400 font-bold mb-2">
                <Cpu className="w-4 h-4" />
                <span>3. Code 128 Subsets</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Uses <strong>^BCN (Code 128 Auto/C)</strong> for high-density sensor serials, pairing with human-readable text below the bars.
              </p>
            </div>
          </div>

          {/* Section: ZPL Command Breakdown */}
          <div className="p-4 bg-black/50 border border-white/10 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Code className="w-4 h-4 text-cyan-400" />
              <span>Standard ATM Sensor ZPL II Format</span>
            </h3>
            <pre className="p-3 bg-black/80 border border-cyan-500/20 rounded-lg text-[11px] font-mono text-cyan-300 overflow-x-auto">
{`^XA
^PW400             ; Print width: 400 dots (50mm at 200 DPI)
^LL200             ; Label length: 200 dots (25mm at 200 DPI)
^LH0,0             ; Label home coordinates
^PR4,4             ; Print speed 4 inches/sec
^MD15              ; Darkness burn intensity 15
^FO30,30           ; Field origin X=30, Y=30 dots
^BY2,3,80          ; Barcode module width 2 dots, ratio 3, height 80 dots
^BCN,80,Y,N,N      ; Code 128, orientation Normal, Height 80, Human-readable Y
^FDATM-SN-8041^FS  ; Barcode payload
^XZ`}
            </pre>
          </div>

          {/* Section: Local Print Daemon / Agent */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Local USB / Network Print Spooler Bridge</span>
            </h3>
            <p className="text-slate-400">
              Web browsers cannot write raw binary commands directly to USB or LPT ports. To enable 1-click instantaneous printing to Zebra hardware, run the included standalone local bridge daemon:
            </p>
            <div className="p-3 bg-black/60 border border-white/10 rounded-lg font-mono text-[11px] text-emerald-300 space-y-1">
              <p># 1. Navigate to printer-agent directory on the machine connected to Zebra ZT230</p>
              <p>cd printer-agent</p>
              <p># 2. Run the agent</p>
              <p>npx tsx agent.ts</p>
              <p className="text-slate-500"># Listening on http://localhost:9100/api/printer/zpl</p>
            </div>
          </div>

          {/* Section: Windows Desktop .EXE Package */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>Windows .EXE Standalone Desktop Packaging</span>
            </h3>
            <p className="text-slate-400">
              The project is pre-configured with Electron and Electron-Builder to generate native Windows <strong className="text-white">.EXE</strong> installers and standalone portable binaries:
            </p>
            <div className="p-3 bg-black/60 border border-cyan-500/30 rounded-lg font-mono text-[11px] text-cyan-300 space-y-1.5">
              <p className="text-slate-400"># Run the one-click build script or npm command:</p>
              <p className="text-emerald-400 font-bold">npm run build:exe</p>
              <p className="text-slate-500"># Or double-click &apos;build-exe.bat&apos; on Windows</p>
              <p className="text-slate-400 pt-1">Outputs in <span className="text-white">\release</span> folder:</p>
              <p className="text-white">1. <span className="text-cyan-400">ATM Sensor Barcode Manager Setup.exe</span> (NSIS Desktop Installer)</p>
              <p className="text-white">2. <span className="text-cyan-400">ATM-Sensor-Barcode-Manager-ZT230-Portable.exe</span> (Standalone Executable)</p>
            </div>
          </div>

          {/* Section: Licensing */}
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-3 font-mono text-xs">
            <h3 className="text-sm font-bold text-emerald-300 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full Commercial License · Unlimited Workstation Use</span>
            </h3>
            <p className="text-slate-300">
              The application is pre-activated with a permanent, unrestricted commercial license. There is no trial expiration, no installation keys required, and no limits on batch print volume or serial generation.
            </p>
            <div className="p-3 bg-black/60 rounded-lg text-slate-300 space-y-1.5 border border-emerald-500/20">
              <p>• <strong>License Status:</strong> Pre-activated FULL VERSION permanently enabled.</p>
              <p>• <strong>Print Spooling:</strong> Unlimited batch runs, reprint logging, and direct ZPL thermal transfer dispatch.</p>
              <p>• <strong>Workstations:</strong> Deployable across all shop floor and ATM assembly line systems without license activation barriers.</p>
            </div>
          </div>

          {/* Section: Troubleshooting */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Industrial Barcode Scanner & Hardware Troubleshooting</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <strong className="text-white block mb-1">Barcode Unreadable by 2D Scanner?</strong>
                <span className="text-slate-400">
                  Ensure Darkness (^MD) is set between 15-20. If lines bleed into each other, lower darkness to 12. If bars appear faded, increase darkness.
                </span>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <strong className="text-white block mb-1">Label Position Drifting?</strong>
                <span className="text-slate-400">
                  Perform a media sensor calibration on the Zebra ZT230 front LCD panel: Menu &gt; Sensors &gt; Calibrate. Verify Gap/Notch sensor mode.
                </span>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <strong className="text-white block mb-1">Serial Number Padding & Checksum</strong>
                <span className="text-slate-400">
                  ATM sensors require standard alphanumeric strings. Code 128 auto-generates modulo 103 checksum in hardware.
                </span>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <strong className="text-white block mb-1">Exporting Raw ZPL</strong>
                <span className="text-slate-400">
                  You can click &quot;View ZPL&quot; on any batch to copy raw ZPL commands or save a .zpl text file for sending via Zebra Setup Utilities.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-wider text-xs rounded-xl transition-all"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
