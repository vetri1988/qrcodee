import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  RotateCcw,
  Eye,
  CheckCircle2,
  Calendar,
  Printer,
  ChevronDown,
  ChevronRight,
  Filter,
  Layers,
  FileCode,
  Tag,
  Copy,
  Check,
} from 'lucide-react';
import { PrintBatchRecord, PrinterConfig } from '../types';
import { apiService } from '../services/apiService';
import { BarcodePreview } from './BarcodePreview';

interface PrintHistoryProps {
  config: PrinterConfig;
  onReprintBatch: (batchId: string, barcodeValues?: string[]) => void;
  onViewZpl: (zpl: string) => void;
}

export const PrintHistory: React.FC<PrintHistoryProps> = ({
  config,
  onReprintBatch,
  onViewZpl,
}) => {
  const [batches, setBatches] = useState<PrintBatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'REPRINTED'>('ALL');
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string[]>>({});
  const [copiedBatch, setCopiedBatch] = useState<string | null>(null);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const data = await apiService.getBatches();
      setBatches(data);
      if (data.length > 0 && !expandedBatchId) {
        setExpandedBatchId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.printerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.labels.some((l) => l.barcodeValue.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.notes && b.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'COMPLETED' && (b.status === 'COMPLETED' || b.status === 'QUEUED')) ||
      (statusFilter === 'REPRINTED' && b.status === 'REPRINTED');

    return matchesSearch && matchesStatus;
  });

  const toggleSelectLabel = (batchId: string, barcodeValue: string) => {
    setSelectedLabels((prev) => {
      const current = prev[batchId] || [];
      if (current.includes(barcodeValue)) {
        return { ...prev, [batchId]: current.filter((v) => v !== barcodeValue) };
      } else {
        return { ...prev, [batchId]: [...current, barcodeValue] };
      }
    });
  };

  const selectAllInBatch = (batchId: string, allValues: string[]) => {
    setSelectedLabels((prev) => ({
      ...prev,
      [batchId]: allValues,
    }));
  };

  const deselectAllInBatch = (batchId: string) => {
    setSelectedLabels((prev) => ({
      ...prev,
      [batchId]: [],
    }));
  };

  const handleCopyBatch = (batchNumber: string, barcodes: string[]) => {
    navigator.clipboard.writeText(barcodes.join('\n'));
    setCopiedBatch(batchNumber);
    setTimeout(() => setCopiedBatch(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400/90">
              Audit & Production Log
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Printed Batch Archive & Selective Reprint
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Immutable log of all generated ATM sensor label runs sent to Zebra ZT230. Review historical batches, inspect exact barcodes, or dispatch selective reprints.
          </p>
        </div>

        <button
          onClick={fetchBatches}
          className="self-start md:self-auto flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-xs font-semibold text-white transition-all shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by batch, barcode, or sensor..."
            className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 font-mono"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Filter:</span>
          <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10 text-xs">
            {(['ALL', 'COMPLETED', 'REPRINTED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Batches List */}
      {loading ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center backdrop-blur-md">
          <div className="inline-block w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">
            Loading batch records...
          </p>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center backdrop-blur-md">
          <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">No print batches found</p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or generate a new batch from the Batch Entry tab.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBatches.map((batch) => {
            const isExpanded = expandedBatchId === batch.id;
            const batchSelected = selectedLabels[batch.id] || [];
            const allBarcodeValues = batch.labels.map((l) => l.barcodeValue);
            const isAllSelected =
              batchSelected.length === allBarcodeValues.length && allBarcodeValues.length > 0;

            return (
              <div
                key={batch.id}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md transition-all hover:border-white/20"
              >
                {/* Batch Summary Header */}
                <div
                  onClick={() => setExpandedBatchId(isExpanded ? null : batch.id)}
                  className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/2 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-slate-400 p-1">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2.5">
                        <span className="font-mono text-sm font-bold text-white tracking-wider">
                          {batch.batchNumber}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                            batch.status === 'REPRINTED'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                          }`}
                        >
                          {batch.status}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          ({batch.totalLabels} {batch.totalLabels === 1 ? 'Label' : 'Labels'})
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 mt-1 text-xs text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(batch.createdAt).toLocaleString()}</span>
                        </span>
                        <span className="flex items-center space-x-1 hidden sm:flex">
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                          <span>{batch.printerName} ({batch.printerDpi} DPI)</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Batch Actions */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center space-x-2 self-end md:self-auto"
                  >
                    <button
                      onClick={() => handleCopyBatch(batch.batchNumber, allBarcodeValues)}
                      title="Copy all barcode values in this batch"
                      className="p-2 bg-black/40 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg text-xs transition-colors flex items-center space-x-1"
                    >
                      {copiedBatch === batch.batchNumber ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[11px]">Copy Values</span>
                    </button>

                    {batch.zplCode && (
                      <button
                        onClick={() => onViewZpl(batch.zplCode!)}
                        title="View Raw ZPL Code"
                        className="p-2 bg-black/40 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg text-xs transition-colors flex items-center space-x-1"
                      >
                        <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[11px]">ZPL Code</span>
                      </button>
                    )}

                    <button
                      onClick={() => onReprintBatch(batch.id)}
                      className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reprint Batch</span>
                    </button>
                  </div>
                </div>

                {/* Batch Expanded Item Detail */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-5 bg-black/30 space-y-4">
                    {/* Sub-header controls */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                          Label Items in Batch:
                        </span>
                        <button
                          onClick={() =>
                            isAllSelected
                              ? deselectAllInBatch(batch.id)
                              : selectAllInBatch(batch.id, allBarcodeValues)
                          }
                          className="text-cyan-400 hover:underline font-medium"
                        >
                          {isAllSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>

                      {batchSelected.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-300 text-xs">
                            {batchSelected.length} Selected
                          </span>
                          <button
                            onClick={() => onReprintBatch(batch.id, batchSelected)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reprint Selected ({batchSelected.length})</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Labels List Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                      {batch.labels.map((lbl, lIdx) => {
                        const isSelected = batchSelected.includes(lbl.barcodeValue);

                        return (
                          <div
                            key={lIdx}
                            onClick={() => toggleSelectLabel(batch.id, lbl.barcodeValue)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-cyan-950/40 border-cyan-400/60 ring-1 ring-cyan-400/40'
                                : 'bg-black/50 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-3.5 h-3.5 text-cyan-500 rounded border-white/20 bg-black/60 focus:ring-cyan-400 cursor-pointer"
                                />
                                <span className="text-[11px] font-mono font-bold text-white">
                                  #{lIdx + 1}
                                </span>
                              </div>

                              <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-mono">
                                <span>Prints: {lbl.printCount || 1}</span>
                              </div>
                            </div>

                            {/* White sticker representation */}
                            <div className="bg-white rounded-md p-2 flex items-center justify-center my-1 text-black shadow-xs">
                              <BarcodePreview
                                value={lbl.barcodeValue}
                                width={180}
                                height={70}
                                fontSize={11}
                                barWidth={1.3}
                                barHeight={32}
                                showStickerFrame={false}
                              />
                            </div>

                            {lbl.sensorType && (
                              <div className="mt-2 text-[10px] text-cyan-400/90 flex items-center space-x-1">
                                <Tag className="w-3 h-3" />
                                <span className="truncate">{lbl.sensorType}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
