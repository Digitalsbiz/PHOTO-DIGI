import React, { useState, useRef } from 'react';
import { IdCardIcon, XIcon, CheckIcon, PlusIcon, LoadingSpinner, SparklesIcon, ImageIcon } from './Icons';
import { processImage } from '../services/geminiService';

interface PassportDialogProps {
  isOpen: boolean;
  currentImageSrc: string;
  onClose: () => void;
  onConfirm: (
      quantity: number, 
      paperSize: string, 
      dimensions: string, 
      format: string,
      additionalImages: { base64: string; mimeType: string }[],
      enableEnhancement: boolean
  ) => void;
}

const QUANTITY_OPTIONS = [4, 6, 8, 9, 12, 16];

const PAPER_SIZES = [
  { id: '4x6', label: '4" x 6"', detail: '10 x 15 cm' },
  { id: '5x7', label: '5" x 7"', detail: '13 x 18 cm' },
  { id: 'A4', label: 'A4', detail: '210 x 297 mm' },
  { id: 'Letter', label: 'Letter', detail: '8.5" x 11"' },
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

interface AdditionalImage {
    id: string;
    previewUrl: string;
    base64: string;
    mimeType: string;
}

const PassportDialog: React.FC<PassportDialogProps> = ({ isOpen, currentImageSrc, onClose, onConfirm }) => {
  const [quantity, setQuantity] = useState(8);
  const [paperSize, setPaperSize] = useState('4x6');
  const [dimensions, setDimensions] = useState(DIMENSION_OPTIONS[0].value);
  const [format, setFormat] = useState(FORMAT_OPTIONS[0].value);
  const [isEnhanceEnabled, setIsEnhanceEnabled] = useState(false);
  
  const [additionalImages, setAdditionalImages] = useState<AdditionalImage[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImage = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if (!file.type.startsWith('image/')) return;

          setIsProcessingFile(true);
          try {
              const { base64, mimeType } = await processImage(file);
              const newImage: AdditionalImage = {
                  id: Date.now().toString(),
                  previewUrl: URL.createObjectURL(file),
                  base64,
                  mimeType
              };
              setAdditionalImages(prev => [...prev, newImage]);
          } catch (error) {
              console.error("Failed to process added image", error);
              alert("Could not load image. Please try another one.");
          } finally {
              setIsProcessingFile(false);
              // Reset input so same file can be selected again if needed
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      }
  };

  const removeImage = (id: string) => {
      setAdditionalImages(prev => prev.filter(img => img.id !== id));
  };

  const handleConfirm = () => {
      const imagesPayload = additionalImages.map(img => ({ base64: img.base64, mimeType: img.mimeType }));
      onConfirm(quantity, paperSize, dimensions, format, imagesPayload, isEnhanceEnabled);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <IdCardIcon />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Passport Photo Sheet</h3>
              <p className="text-sm text-gray-400">Configure your print layout</p>
            </div>
          </div>

          <div className="space-y-6">
            
            {/* Processing Mode Selection */}
            <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Processing Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setIsEnhanceEnabled(false)}
                        className={`relative p-3 rounded-xl border text-left flex flex-col gap-2 transition-all ${
                            !isEnhanceEnabled
                            ? 'bg-gray-800 border-indigo-500 shadow-[0_0_0_1px_rgba(99,102,241,1)]'
                            : 'bg-gray-900/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'
                        }`}
                    >
                        <div className={`p-2 w-fit rounded-lg ${!isEnhanceEnabled ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                            <ImageIcon />
                        </div>
                        <div>
                            <span className={`block text-sm font-medium ${!isEnhanceEnabled ? 'text-white' : 'text-gray-300'}`}>
                                Original Quality
                            </span>
                            <span className="text-[10px] text-gray-400 leading-tight block mt-1">
                                Uses original photo. No AI touch-ups or upscaling.
                            </span>
                        </div>
                        {!isEnhanceEnabled && (
                            <div className="absolute top-3 right-3 text-indigo-500">
                                <CheckIcon />
                            </div>
                        )}
                    </button>

                    <button
                        onClick={() => setIsEnhanceEnabled(true)}
                        className={`relative p-3 rounded-xl border text-left flex flex-col gap-2 transition-all ${
                            isEnhanceEnabled
                            ? 'bg-indigo-900/20 border-indigo-500 shadow-[0_0_0_1px_rgba(99,102,241,1)]'
                            : 'bg-gray-900/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'
                        }`}
                    >
                        <div className={`p-2 w-fit rounded-lg ${isEnhanceEnabled ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                            <SparklesIcon />
                        </div>
                        <div>
                            <span className={`block text-sm font-medium ${isEnhanceEnabled ? 'text-white' : 'text-gray-300'}`}>
                                AI Studio
                            </span>
                            <span className="text-[10px] text-gray-400 leading-tight block mt-1">
                                Enhance resolution, lighting & details.
                            </span>
                        </div>
                         {isEnhanceEnabled && (
                            <div className="absolute top-3 right-3 text-indigo-500">
                                <CheckIcon />
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* Subjects Section */}
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 space-y-3">
                 <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Included Subjects
                    </label>
                    <span className="text-xs text-gray-500">{1 + additionalImages.length}/4</span>
                 </div>
                 
                 <div className="flex gap-3 overflow-x-auto pb-2">
                    {/* Main Subject (Current Image) */}
                    <div className="relative flex-shrink-0 w-16 h-20 bg-gray-900 rounded-md border border-indigo-500/50 overflow-hidden group">
                        <img src={currentImageSrc} alt="Main" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-indigo-500/80 text-[10px] text-white text-center py-0.5">
                            Main
                        </div>
                    </div>

                    {/* Additional Subjects */}
                    {additionalImages.map((img) => (
                         <div key={img.id} className="relative flex-shrink-0 w-16 h-20 bg-gray-900 rounded-md border border-gray-600 overflow-hidden group">
                            <img src={img.previewUrl} alt="Subject" className="w-full h-full object-cover" />
                            <button 
                                onClick={() => removeImage(img.id)}
                                className="absolute top-0.5 right-0.5 bg-black/50 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <XIcon />
                            </button>
                        </div>
                    ))}

                    {/* Add Button */}
                    {additionalImages.length < 3 && (
                        <button 
                            onClick={handleAddImage}
                            disabled={isProcessingFile}
                            className="flex-shrink-0 w-16 h-20 bg-gray-800/50 hover:bg-gray-800 border border-dashed border-gray-600 hover:border-indigo-500 rounded-md flex flex-col items-center justify-center gap-1 transition-colors group"
                        >
                            {isProcessingFile ? (
                                <LoadingSpinner />
                            ) : (
                                <>
                                    <div className="text-gray-500 group-hover:text-indigo-400"><PlusIcon /></div>
                                    <span className="text-[10px] text-gray-500 group-hover:text-indigo-400">Add</span>
                                </>
                            )}
                        </button>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                 </div>
                 <p className="text-[11px] text-gray-500 leading-tight">
                    Add up to 3 more photos to combine them on a single sheet.
                 </p>
            </div>

            {/* Layout Options */}
            <div className="space-y-4">
                {/* Paper Size Grid */}
                <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                        Paper Size
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {PAPER_SIZES.map((size) => (
                            <button
                                key={size.id}
                                onClick={() => setPaperSize(size.id)}
                                className={`flex flex-col p-3 rounded-lg border transition-all text-left group ${
                                    paperSize === size.id
                                    ? 'bg-indigo-500/20 border-indigo-500 shadow-sm shadow-indigo-500/20'
                                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                                }`}
                            >
                                <span className={`text-sm font-medium ${paperSize === size.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                    {size.label}
                                </span>
                                <span className={`text-xs ${paperSize === size.id ? 'text-indigo-300' : 'text-gray-500'}`}>
                                    {size.detail}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Quantity */}
                  <div>
                    <label htmlFor="quantity" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                      Photos Count
                    </label>
                    <div className="relative">
                      <select
                        id="quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

                  {/* Format */}
                  <div>
                    <label htmlFor="format" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                        Background
                    </label>
                    <div className="relative">
                      <select
                        id="format"
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                         className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                         {FORMAT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Dimensions */}
                <div>
                   <label htmlFor="dimensions" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                        Photo Dimensions
                    </label>
                    <div className="relative">
                      <select
                        id="dimensions"
                        value={dimensions}
                        onChange={(e) => setDimensions(e.target.value)}
                         className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {DIMENSION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
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

        <div className="bg-gray-950 px-6 py-4 flex justify-end gap-3 border-t border-gray-800 mt-auto">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
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