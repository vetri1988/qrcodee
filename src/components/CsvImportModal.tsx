import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { validateBarcodeValue } from '../utils/barcodeValidator';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (barcodes: string[], mode: 'replace' | 'append') => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [pastedText, setPastedText] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [parsedItems, setParsedItems] = useState<{ value: string; isValid: boolean; error?: string }[]>([]);

  if (!isOpen) return null;

  const parseInput = (text: string) => {
    setPastedText(text);
    const lines = text
      .split(/\r?\n|,/)
      .map((l) => l.trim().replace(/^["']|["']$/g, '').trim())
      .filter((l) => l.length > 0 && !/^(barcode|serial|sensor|code|value|label)$/i.test(l));

    const parsed = lines.map((val) => {
      const v = validateBarcodeValue(val);
      return {
        value: val,
        isValid: v.isValid,
        error: v.errorMessage,
      };
    });
    setParsedItems(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        parseInput(content);
      }
    };
    reader.readAsText(file);
  };

  const handleApply = () => {
    const validValues = parsedItems.filter((p) => p.isValid).map((p) => p.value);
    if (validValues.length > 0) {
      onImport(validValues, importMode);
      onClose();
    }
  };

  const validCount = parsedItems.filter((p) => p.isValid).length;
  const invalidCount = parsedItems.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#0b0f19] rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] max-w-lg w-full border border-cyan-500/30 overflow-hidden">
        {/* Header */}
        <div className="bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Upload className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Import Barcode Labels (CSV / Text)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-slate-300">
          {/* Drag & drop / file picker */}
          <div className="border-2 border-dashed border-white/20 rounded-xl p-5 text-center hover:border-cyan-400/60 transition-colors bg-black/40">
            <input
              type="file"
              accept=".csv,.txt"
              id="csvFileInput"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="csvFileInput"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <FileText className="w-8 h-8 text-cyan-400" />
              <span className="font-semibold text-white">
                Click to upload CSV or text file
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Supports newline or comma delimited ATM sensor serials
              </span>
            </label>
          </div>

          {/* Paste area */}
          <div>
            <label className="block font-semibold text-slate-200 mb-1">
              Or paste barcode list below (one per line):
            </label>
            <textarea
              rows={4}
              value={pastedText}
              onChange={(e) => parseInput(e.target.value)}
              placeholder="ATM-1-CDS-1-1-V-1-IN-1&#10;ATM-1-HDS-1-1-V-1-IN-2&#10;BR-1-DS-1-1--V-2-IN-1"
              className="w-full font-mono text-xs p-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-cyan-400 focus:outline-hidden"
            />
          </div>

          {/* Preview statistics */}
          {parsedItems.length > 0 && (
            <div className="bg-black/60 border border-white/10 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold font-mono">
                <span className="text-white">Parsed: {parsedItems.length} items</span>
                <div className="flex items-center space-x-3">
                  <span className="text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{validCount} Valid</span>
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-rose-400 flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{invalidCount} Invalid</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-28 overflow-y-auto font-mono text-[11px] space-y-1">
                {parsedItems.slice(0, 10).map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-1.5 rounded-lg border ${
                      item.isValid
                        ? 'bg-white/5 border-white/5 text-slate-200'
                        : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <span>{item.value}</span>
                    <span className="text-[10px]">
                      {item.isValid ? '✓ Valid' : item.error}
                    </span>
                  </div>
                ))}
                {parsedItems.length > 10 && (
                  <div className="text-center text-slate-500 italic text-[10px] font-mono">
                    + {parsedItems.length - 10} more items...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mode */}
          <div className="flex items-center space-x-5 pt-1">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
              <input
                type="radio"
                name="csvImportMode"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
                className="accent-cyan-400"
              />
              <span>Replace current batch</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
              <input
                type="radio"
                name="csvImportMode"
                checked={importMode === 'append'}
                onChange={() => setImportMode('append')}
                className="accent-cyan-400"
              />
              <span>Append to current batch</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white/5 px-6 py-4 border-t border-white/10 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-white/10 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={parsedItems.length === 0}
            className="flex items-center space-x-2 px-5 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold uppercase tracking-wider rounded-xl text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import {parsedItems.length} Labels</span>
          </button>
        </div>
      </div>
    </div>
  );
};
