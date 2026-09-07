import React, { useState } from 'react';
import { X, Sparkles, PlusCircle } from 'lucide-react';

interface SequentialGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (generatedValues: string[], mode: 'replace' | 'append') => void;
}

/**
 * Parses a barcode pattern (e.g. "ATM1-CDS1-11111-V1-IN11112") into:
 * prefix: "ATM1-CDS1-"
 * startNumber: 11111
 * padDigits: 5
 * suffix: "-V1-IN11112"
 */
function parseBarcodePattern(input: string): {
  prefix: string;
  startNumber: number;
  padDigits: number;
  suffix: string;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    return { prefix: 'ATM1-CDS1-', startNumber: 11111, padDigits: 5, suffix: '-V1-IN11112' };
  }

  // Explicit placeholder {SEQ}
  if (trimmed.includes('{SEQ}')) {
    const [p, s] = trimmed.split('{SEQ}');
    return { prefix: p, startNumber: 11111, padDigits: 5, suffix: s || '' };
  }

  // Look for hyphen-delimited segments where a segment is purely numeric (at least 3 digits)
  const segments = trimmed.split('-');
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (/^\d{3,}$/.test(seg)) {
      const prefix = segments.slice(0, i).join('-') + (i > 0 ? '-' : '');
      const suffix = (i < segments.length - 1 ? '-' : '') + segments.slice(i + 1).join('-');
      const startNum = parseInt(seg, 10);
      return {
        prefix,
        startNumber: isNaN(startNum) ? 11111 : startNum,
        padDigits: seg.length,
        suffix,
      };
    }
  }

  // Fallback: look for any continuous numeric block of 3 or more digits
  const numMatch = trimmed.match(/\d{3,}/);
  if (numMatch && numMatch.index !== undefined) {
    const startIdx = numMatch.index;
    const endIdx = startIdx + numMatch[0].length;
    return {
      prefix: trimmed.slice(0, startIdx),
      startNumber: parseInt(numMatch[0], 10),
      padDigits: numMatch[0].length,
      suffix: trimmed.slice(endIdx),
    };
  }

  // Default fallback if no number found
  return {
    prefix: trimmed.endsWith('-') ? trimmed : `${trimmed}-`,
    startNumber: 11111,
    padDigits: 5,
    suffix: '',
  };
}

export const SequentialGeneratorModal: React.FC<SequentialGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  // Full input pattern (e.g. ATM1-CDS1-11111-V1-IN11112)
  const [patternInput, setPatternInput] = useState('ATM1-CDS1-11111-V1-IN11112');
  const [prefix, setPrefix] = useState('ATM1-CDS1-');
  const [startNumber, setStartNumber] = useState(11111);
  const [count, setCount] = useState(6);
  const [step, setStep] = useState(1);
  const [padDigits, setPadDigits] = useState(5);
  const [suffix, setSuffix] = useState('-V1-IN11112');
  const [applyMode, setApplyMode] = useState<'replace' | 'append'>('replace');

  if (!isOpen) return null;

  // When user types or pastes a pattern into the template input
  const handlePatternChange = (newPattern: string) => {
    setPatternInput(newPattern);
    const parsed = parseBarcodePattern(newPattern);
    setPrefix(parsed.prefix);
    setStartNumber(parsed.startNumber);
    setPadDigits(parsed.padDigits);
    setSuffix(parsed.suffix);
  };

  const applyPreset = (template: string) => {
    handlePatternChange(template);
  };

  const generateAllLabels = (): string[] => {
    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      const num = startNumber + i * step;
      const numStr = padDigits > 0 ? String(num).padStart(padDigits, '0') : String(num);
      list.push(`${prefix}${numStr}${suffix}`);
    }
    return list;
  };

  const allGenerated = generateAllLabels();
  const previewList = allGenerated.slice(0, 100);

  const handleApply = () => {
    onApply(allGenerated, applyMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#0b0f19] rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] max-w-xl w-full border border-cyan-500/30 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Sequential Identifier Generator
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Auto-increments sequence serials within structured ATM sensor patterns
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

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-slate-300 overflow-y-auto">
          {/* Main Pattern Input */}
          <div className="bg-white/5 border border-cyan-500/30 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-white font-mono text-xs">
                Barcode Pattern / Initial Serial Number
              </label>
              <span className="text-[10px] text-cyan-400 font-mono">
                Auto-detects sequence segment
              </span>
            </div>
            <input
              type="text"
              value={patternInput}
              onChange={(e) => handlePatternChange(e.target.value)}
              placeholder="e.g. ATM1-CDS1-11111-V1-IN11112"
              spellCheck={false}
              autoComplete="off"
              className="w-full font-mono text-sm px-3.5 py-2.5 bg-black/60 border border-cyan-500/50 rounded-lg text-cyan-300 focus:border-cyan-400 focus:outline-hidden ring-1 ring-cyan-500/20"
            />

            {/* Structure Breakdown Badge */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
              <span className="text-slate-400">Pattern Structure:</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {prefix || '(no prefix)'}
              </span>
              <span className="text-cyan-400 font-bold">+</span>
              <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-500/50 shadow-xs">
                [{String(startNumber).padStart(padDigits, '0')}] (Increments)
              </span>
              <span className="text-cyan-400 font-bold">+</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {suffix || '(no suffix)'}
              </span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400 border-t border-white/5 mt-2">
              <span className="text-slate-500 font-mono">Quick Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset('ATM1-CDS1-11111-V1-IN11112')}
                className="text-cyan-400 hover:text-cyan-300 hover:underline font-mono bg-white/5 px-2 py-0.5 rounded"
              >
                CDS Sensor
              </button>
              <button
                type="button"
                onClick={() => applyPreset('ATM1-HDS1-11111-V1-IN1111')}
                className="text-cyan-400 hover:text-cyan-300 hover:underline font-mono bg-white/5 px-2 py-0.5 rounded"
              >
                HDS Sensor
              </button>
              <button
                type="button"
                onClick={() => applyPreset('ATM1-PIR1-11111-V1-IN11112')}
                className="text-cyan-400 hover:text-cyan-300 hover:underline font-mono bg-white/5 px-2 py-0.5 rounded"
              >
                PIR Sensor
              </button>
              <button
                type="button"
                onClick={() => applyPreset('ATM1-VIB1-11111-V1-IN11112')}
                className="text-cyan-400 hover:text-cyan-300 hover:underline font-mono bg-white/5 px-2 py-0.5 rounded"
              >
                VIB Sensor
              </button>
            </div>
          </div>

          {/* Detailed Parameter Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1 font-mono text-[11px]">
                Start Number
              </label>
              <input
                type="number"
                min={0}
                value={startNumber}
                onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 0)}
                className="w-full font-mono text-xs px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:border-cyan-400 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1 font-mono text-[11px]">
                Quantity
              </label>
              <input
                type="number"
                min={1}
                max={300}
                value={count}
                onChange={(e) =>
                  setCount(Math.max(1, Math.min(300, parseInt(e.target.value, 10) || 1)))
                }
                className="w-full font-mono text-xs px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:border-cyan-400 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1 font-mono text-[11px]">
                Padding Digits
              </label>
              <select
                value={padDigits}
                onChange={(e) => setPadDigits(parseInt(e.target.value, 10))}
                className="w-full font-mono text-xs px-2.5 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:border-cyan-400 focus:outline-hidden"
              >
                <option value={0}>None (1, 2, 3)</option>
                <option value={2}>2 Digits (01, 02)</option>
                <option value={3}>3 Digits (001, 002)</option>
                <option value={4}>4 Digits (0001, 0002)</option>
                <option value={5}>5 Digits (11111, 11112)</option>
                <option value={6}>6 Digits (011111)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1 font-mono text-[11px]">
                Step Increment
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={step}
                onChange={(e) => setStep(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full font-mono text-xs px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:border-cyan-400 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Prefix & Suffix Customization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1 font-mono text-[11px]">
                Segment Prefix
              </label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g. ATM1-CDS1-"
                className="w-full font-mono text-xs px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:border-cyan-400 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1 font-mono text-[11px]">
                Segment Suffix
              </label>
              <input
                type="text"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="e.g. -V1-IN11112"
                className="w-full font-mono text-xs px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:border-cyan-400 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Live Preview List */}
          <div>
            <div className="flex items-center justify-between mb-1.5 font-mono text-xs">
              <span className="font-semibold text-white">
                Generated Sequence Preview ({allGenerated.length} items):
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                ✓ Continuous Sequence
              </span>
            </div>
            <div className="max-h-40 overflow-y-auto bg-black/60 border border-white/10 rounded-xl p-3 font-mono text-[11px] space-y-1.5 text-slate-300">
              {previewList.slice(0, 20).map((val, idx) => {
                const currentNum = startNumber + idx * step;
                const numStr = padDigits > 0 ? String(currentNum).padStart(padDigits, '0') : String(currentNum);

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between border-b border-white/5 pb-1 last:border-0 hover:bg-white/5 px-1 rounded transition-colors"
                  >
                    <span className="text-slate-300 font-mono">
                      <span>{prefix}</span>
                      <strong className="text-cyan-400 underline font-bold">{numStr}</strong>
                      <span>{suffix}</span>
                    </span>
                    <span className="text-slate-500 text-[10px] font-mono">#{idx + 1}</span>
                  </div>
                );
              })}
              {previewList.length > 20 && (
                <div className="text-center text-slate-500 pt-1 italic font-mono text-[10px]">
                  + {previewList.length - 20} more labels in batch...
                </div>
              )}
            </div>
          </div>

          {/* Apply Mode */}
          <div className="flex items-center space-x-6 pt-1 font-mono text-xs">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
              <input
                type="radio"
                name="applyMode"
                checked={applyMode === 'replace'}
                onChange={() => setApplyMode('replace')}
                className="accent-cyan-400"
              />
              <span>Replace existing batch rows</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
              <input
                type="radio"
                name="applyMode"
                checked={applyMode === 'append'}
                onChange={() => setApplyMode('append')}
                className="accent-cyan-400"
              />
              <span>Append to existing batch</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white/5 px-6 py-4 border-t border-white/10 flex items-center justify-end space-x-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-white/10 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center space-x-2 px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Generate & Apply ({allGenerated.length} Labels)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
