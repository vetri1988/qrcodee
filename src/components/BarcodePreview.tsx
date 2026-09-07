import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import bwipjs from 'bwip-js';
import { extractScannableBarcode } from '../utils/zplGenerator';

interface BarcodePreviewProps {
  value: string;
  width?: number; // visual CSS width in px
  height?: number; // visual CSS height in px
  displayValue?: boolean;
  fontSize?: number;
  barWidth?: number;
  barHeight?: number;
  className?: string;
  showStickerFrame?: boolean;
  labelDimensionsText?: string;
  barcodeSymbology?: 'DATAMATRIX' | 'CODE128';
}

export const BarcodePreview: React.FC<BarcodePreviewProps> = ({
  value,
  width = 220,
  height = 110,
  displayValue = true,
  fontSize = 13,
  barWidth = 1.6,
  barHeight = 45,
  className = '',
  showStickerFrame = true,
  labelDimensionsText = '30mm × 10mm (Centered, 3mm Text)',
  barcodeSymbology = 'DATAMATRIX',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dmSvg, setDmSvg] = React.useState<string | null>(null);
  const [renderError, setRenderError] = React.useState<string | null>(null);

  useEffect(() => {
    if (!value || value.trim() === '') {
      setRenderError(null);
      setDmSvg(null);
      return;
    }

    if (barcodeSymbology === 'DATAMATRIX') {
      try {
        const svg = bwipjs.toSVG({
          bcid: 'datamatrix',
          text: value,
          scale: 2,
          includetext: false,
        });
        setDmSvg(svg);
        setRenderError(null);
      } catch (err: any) {
        setRenderError(err.message || 'DataMatrix Render Error');
      }
      return;
    }

    if (!svgRef.current) return;

    try {
      const scannableValue = extractScannableBarcode(value);
      JsBarcode(svgRef.current, scannableValue, {
        format: 'CODE128',
        text: value,
        lineColor: '#000000',
        width: barWidth,
        height: barHeight,
        displayValue: displayValue,
        font: 'monospace',
        textAlign: 'center',
        textPosition: 'bottom',
        textMargin: 6,
        fontSize: fontSize,
        background: '#ffffff',
        margin: 6,
        valid: (valid) => {
          if (!valid) {
            setRenderError('Invalid Code 128 character');
          } else {
            setRenderError(null);
          }
        },
      });
    } catch (err: any) {
      setRenderError(err.message || 'Render Error');
    }
  }, [value, barcodeSymbology, barWidth, barHeight, displayValue, fontSize]);

  const isEmpty = !value || value.trim() === '';

  const content = (
    <div className="relative flex flex-col items-center justify-center p-2 bg-white rounded-md shadow-xs border border-slate-200">
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-20 text-slate-400 text-xs text-center px-2">
          <div className="w-24 h-5 border-b border-dashed border-slate-300 mb-2 flex items-center justify-center space-x-1 opacity-50">
            <div className="w-1 h-4 bg-slate-300"></div>
            <div className="w-2 h-4 bg-slate-300"></div>
            <div className="w-1 h-4 bg-slate-300"></div>
            <div className="w-1.5 h-4 bg-slate-300"></div>
            <div className="w-1 h-4 bg-slate-300"></div>
          </div>
          <span>Awaiting barcode input...</span>
        </div>
      ) : renderError ? (
        <div className="flex flex-col items-center justify-center h-20 text-rose-500 text-xs px-2 text-center">
          <span className="font-semibold">Barcode Error</span>
          <span className="text-[11px] text-slate-500">{renderError}</span>
        </div>
      ) : barcodeSymbology === 'DATAMATRIX' ? (
        <div className="w-full flex flex-col items-center justify-center py-1">
          <div
            className="w-12 h-12 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full drop-shadow-xs"
            dangerouslySetInnerHTML={{ __html: dmSvg || '' }}
          />
          {displayValue && (
            <span className="font-mono text-[10px] text-slate-800 font-semibold mt-1 tracking-tight text-center max-w-[220px] truncate">
              {value}
            </span>
          )}
        </div>
      ) : (
        <div className="w-full flex items-center justify-center overflow-hidden">
          <svg ref={svgRef} className="max-w-full h-auto drop-shadow-xs" />
        </div>
      )}

      {showStickerFrame && (
        <div className="mt-1 text-[10px] text-slate-400 font-medium flex items-center justify-between w-full px-1 border-t border-slate-100 pt-1">
          <span>{barcodeSymbology === 'DATAMATRIX' ? '2D DataMatrix (ECC 200)' : 'ZT230 ZPL'}</span>
          <span>{labelDimensionsText}</span>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`inline-block select-none ${className}`}
      style={{ minWidth: width ? `${width}px` : undefined }}
    >
      {content}
    </div>
  );
};
