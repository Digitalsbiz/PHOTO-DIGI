
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { IdCardIcon, XIcon, CheckIcon, PlusIcon, LoadingSpinner, SparklesIcon, ImageIcon, ChevronDownIcon, UserIcon } from './Icons';
import { processImage } from '../services/geminiService';
import { calculateMaxCapacity } from '../utils/passportGenerator';

interface PassportDialogProps {
  isOpen: boolean;
  currentImageSrc: string;
  isOnline: boolean;
  onClose: () => void;
  onConfirm: (
      quantity: number | 'max', 
      paperSize: string, 
      dimensions: string, 
      format: string,
      additionalImages: { base64: string; mimeType: string }[],
      mode: 'manual' | 'enhance' | 'studio'
  ) => void;
}

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

const PassportDialog: React.FC<PassportDialogProps> = ({ isOpen, currentImageSrc, isOnline, onClose, onConfirm }) => {
  const [quantity, setQuantity] = useState<number | 'max'>(8);
  const [paperSize, setPaperSize] = useState('4x6');
  const [dimensions, setDimensions] = useState(DIMENSION_OPTIONS[0].value);
  const [format, setFormat] = useState(FORMAT_OPTIONS[0].value);
  const [processingMode, setProcessingMode] = useState<'manual' | 'enhance' | 'studio'>(isOnline ? 'enhance' : 'manual');
  
  const [additionalImages, setAdditionalImages] = useState<AdditionalImage[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if online status changes while dialog is open
  useEffect(() => {
    if (!isOnline && processingMode !== 'manual') {
      setProcessingMode('manual');
    }
  }, [isOnline]);

  const maxCapacity = useMemo(() => {
    return calculateMaxCapacity(paperSize, dimensions);
  }, [paperSize, dimensions]);

  const quantityOptions = useMemo(() => {
    const options: (number | 'max')[] = [];
    for (let i = 1; i <= 16; i++) {
        if (i <= maxCapacity) {
            options.push(i);
        }
    }
    options.push('max');
    return options;
  }, [maxCapacity]);

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
          } finally {
              setIsProcessingFile(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      }
  };

  const removeImage = (id: string) => {
      setAdditionalImages(prev => prev.filter(img => img.id !== id));
  };

  const handleConfirm = () => {
      const imagesPayload = additionalImages.map(img => ({ base64: img.base64, mimeType: img.mimeType }));
      onConfirm(quantity, paperSize, dimensions, format, imagesPayload, processingMode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
                <IdCardIcon />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Passport Photo Sheet</h3>
                <p className="text-sm text-gray-400">Layout optimization studio</p>
              </div>
            </div>
            {!isOnline && (
              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 uppercase tracking-widest">Local Mode</span>
            )}
          </div>

          <div className="space-y-6">
            <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Processing Mode</label>
                <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setProcessingMode('manual')} 
                      className={`relative p-2.5 rounded-xl border text-left flex flex-col gap-2 transition-all ${processingMode === 'manual' ? 'bg-gray-800 border-indigo-500 shadow-[0_0_0_1px_rgba(99,102,241,1)]' : 'bg-gray-900/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'}`}
                    >
                        <div className={`p-1.5 w-fit rounded-lg ${processingMode === 'manual' ? 'bg-amber-500 text-white' : 'bg-gray-800 text-gray-400'}`}><ImageIcon /></div>
                        <div>
                            <span className={`block text-[11px] font-bold uppercase tracking-tight ${processingMode === 'manual' ? 'text-white' : 'text-gray-300'}`}>Manual</span>
                            <span className="text-[9px] text-gray-500 leading-tight block mt-0.5">Offline</span>
                        </div>
                    </button>
                    <button 
                      onClick={() => isOnline && setProcessingMode('enhance')} 
                      disabled={!isOnline}
                      className={`relative p-2.5 rounded-xl border text-left flex flex-col gap-2 transition-all ${processingMode === 'enhance' ? 'bg-indigo-900/20 border-indigo-500 shadow-[0_0_0_1px_rgba(99,102,241,1)]' : 'bg-gray-900/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'} ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className={`p-1.5 w-fit rounded-lg ${processingMode === 'enhance' ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400'}`}><SparklesIcon /></div>
                        <div>
                            <span className={`block text-[11px] font-bold uppercase tracking-tight ${processingMode === 'enhance' ? 'text-white' : 'text-gray-300'}`}>Enhance</span>
                            <span className="text-[9px] text-gray-500 leading-tight block mt-0.5">Quick AI</span>
                        </div>
                    </button>
                    <button 
                      onClick={() => isOnline && setProcessingMode('studio')} 
                      disabled={!isOnline}
                      className={`relative p-2.5 rounded-xl border text-left flex flex-col gap-2 transition-all ${processingMode === 'studio' ? 'bg-purple-900/20 border-purple-500 shadow-[0_0_0_1px_rgba(168,85,247,1)]' : 'bg-gray-900/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'} ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className={`p-1.5 w-fit rounded-lg ${processingMode === 'studio' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400'}`}><UserIcon /></div>
                        <div>
                            <span className={`block text-[11px] font-bold uppercase tracking-tight ${processingMode === 'studio' ? 'text-white' : 'text-gray-300'}`}>Portrait</span>
                            <span className="text-[9px] text-gray-500 leading-tight block mt-0.5">Pro Studio</span>
                        </div>
                    </button>
                </div>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 space-y-3">
                 <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">Included Subjects</label>
                    <span className="text-xs text-gray-500">{1 + additionalImages.length}/10</span>
                 </div>
                 <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                    <div className="relative flex-shrink-0 w-16 h-20 bg-gray-900 rounded-md border border-indigo-500/50 overflow-hidden">
                        <img src={currentImageSrc} alt="Main" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-indigo-500/80 text-[10px] text-white text-center py-0.5">Main</div>
                    </div>
                    {additionalImages.map((img) => (
                         <div key={img.id} className="relative flex-shrink-0 w-16 h-20 bg-gray-900 rounded-md border border-gray-600 overflow-hidden group">
                            <img src={img.previewUrl} alt="Subject" className="w-full h-full object-cover" />
                            <button onClick={() => removeImage(img.id)} className="absolute top-0.5 right-0.5 bg-black/50 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><XIcon /></button>
                        </div>
                    ))}
                    {additionalImages.length < 9 && (
                        <button onClick={handleAddImage} disabled={isProcessingFile} className="flex-shrink-0 w-16 h-20 bg-gray-800/50 hover:bg-gray-800 border border-dashed border-gray-600 hover:border-indigo-500 rounded-md flex flex-col items-center justify-center gap-1 transition-colors group">
                            {isProcessingFile ? <LoadingSpinner /> : <><PlusIcon /><span className="text-[10px] text-gray-500 group-hover:text-indigo-400">Add</span></>}
                        </button>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                 </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Paper Size</label>
                    <div className="grid grid-cols-2 gap-3">
                        {PAPER_SIZES.map((size) => (
                            <button key={size.id} onClick={() => setPaperSize(size.id)} className={`flex flex-col p-3 rounded-lg border transition-all text-left ${paperSize === size.id ? 'bg-indigo-500/20 border-indigo-500 shadow-sm shadow-indigo-500/20' : 'bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800'}`}>
                                <span className={`text-sm font-medium ${paperSize === size.id ? 'text-white' : 'text-gray-300'}`}>{size.label}</span>
                                <span className={`text-xs ${paperSize === size.id ? 'text-indigo-300' : 'text-gray-500'}`}>{size.detail}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="quantity" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Photo Count</label>
                    <div className="relative">
                      <select id="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value === 'max' ? 'max' : Number(e.target.value))} className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer">
                        {quantityOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt === 'max' ? `Full Sheet (Max ${maxCapacity})` : `${opt} copies`}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronDownIcon />
                      </div>
                    </div>
                  </div>
                  <div className={processingMode === 'manual' ? 'opacity-40 grayscale pointer-events-none' : ''}>
                    <label htmlFor="format" className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Background</label>
                    <div className="relative">
                      <select id="format" value={format} onChange={(e) => setFormat(e.target.value)} disabled={processingMode === 'manual'} className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer">
                         {FORMAT_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronDownIcon />
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-950 px-6 py-4 flex justify-end gap-3 border-t border-gray-800 mt-auto">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Cancel</button>
          <button onClick={handleConfirm} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium text-white shadow-lg transition-all hover:-translate-y-0.5 ${processingMode !== 'manual' ? (processingMode === 'studio' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20') : 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'}`}>
            {processingMode === 'manual' ? <ImageIcon /> : (processingMode === 'studio' ? <UserIcon /> : <SparklesIcon />)}
            <span>{processingMode === 'manual' ? 'Generate Locally' : (processingMode === 'studio' ? 'Generate Studio' : 'Generate Enhanced')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PassportDialog;
