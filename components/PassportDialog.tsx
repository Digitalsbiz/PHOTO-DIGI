import React, { useState } from 'react';
import { IdCardIcon, XIcon, CheckIcon } from './Icons';

interface PassportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number, paperSize: string, dimensions: string, format: string) => void;
}

const QUANTITY_OPTIONS = [4, 6, 8, 9, 12, 16];
const PAPER_SIZES = [
  { id: '4x6', label: '4" x 6" (10x15cm)' },
  { id: '5x7', label: '5" x 7" (13x18cm)' },
  { id: 'A4', label: 'A4' },
  { id: 'Letter', label: 'Letter (8.5" x 11")' },
];

const DIMENSION_OPTIONS = [
  { value: '35mm x 45mm', label: '35mm x 45mm (Standard/EU)' },
  { value: '2 x 2 inches', label: '2" x 2" (US/India)' },
  { value: '50mm x 70mm', label: '50mm x 70mm (Canada)' },
  { value: '33mm x 48mm', label: '33mm x 48mm (China)' },
];

const FORMAT_OPTIONS = [
  { value: 'plain white background', label: 'White Background' },
  { value: 'light blue background', label: 'Blue Background' },
  { value: 'light grey background', label: 'Grey Background' },
  { value: 'red background', label: 'Red Background' },
];

const PassportDialog: React.FC<PassportDialogProps> = ({ isOpen, onClose, onConfirm }) => {
  const [quantity, setQuantity] = useState(8);
  const [paperSize, setPaperSize] = useState('4x6');
  const [dimensions, setDimensions] = useState(DIMENSION_OPTIONS[0].value);
  const [format, setFormat] = useState(FORMAT_OPTIONS[0].value);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <IdCardIcon />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Passport Photo Sheet</h3>
              <p className="text-sm text-gray-400">Configure your print layout</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Specs Section */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 space-y-4">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                Photo Specifications
              </label>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dimensions" className="block text-xs text-gray-500 mb-1">Dimensions</label>
                    <div className="relative">
                      <select
                        id="dimensions"
                        value={dimensions}
                        onChange={(e) => setDimensions(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-md px-3 py-2 appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {DIMENSION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="format" className="block text-xs text-gray-500 mb-1">Format</label>
                    <div className="relative">
                      <select
                        id="format"
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-md px-3 py-2 appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                         {FORMAT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout Options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-2">
                  Photos Count
                </label>
                <div className="relative">
                  <select
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
                  >
                    {QUANTITY_OPTIONS.map((num) => (
                      <option key={num} value={num}>
                        {num} copies
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="paperSize" className="block text-sm font-medium text-gray-300 mb-2">
                  Paper Size
                </label>
                <div className="relative">
                  <select
                    id="paperSize"
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
                  >
                    {PAPER_SIZES.map((size) => (
                      <option key={size.id} value={size.id}>
                        {size.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="bg-gray-950 px-6 py-4 flex justify-end gap-3 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(quantity, paperSize, dimensions, format)}
            className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
          >
            <CheckIcon />
            <span>Generate Sheet</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PassportDialog;