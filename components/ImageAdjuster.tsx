
import React, { useState, useMemo } from 'react';
import { applyImageAdjustments, FilterType } from '../utils/adjustImage';
import { CheckIcon, XIcon, LoadingSpinner, EyeIcon, CircleHalfIcon, DropletIcon, ArrowRightLeftIcon } from './Icons';

interface ImageAdjusterProps {
  imageSrc: string;
  onCancel: () => void;
  onComplete: (adjustedBase64: string) => void;
}

const PRESET_FILTERS: { type: FilterType; label: string; icon: React.ReactNode }[] = [
    { type: 'none', label: 'Normal', icon: <div className="w-4 h-4 rounded-full border border-gray-500" /> },
    { type: 'grayscale', label: 'B&W', icon: <CircleHalfIcon /> },
    { type: 'sepia', label: 'Sepia', icon: <DropletIcon /> },
    { type: 'invert', label: 'Invert', icon: <ArrowRightLeftIcon /> },
    { type: 'vintage', label: 'Vintage', icon: <div className="text-xs">🎞️</div> },
];

const ImageAdjuster: React.FC<ImageAdjusterProps> = ({ imageSrc, onCancel, onComplete }) => {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [sharpness, setSharpness] = useState(0);
  const [filterType, setFilterType] = useState<FilterType>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComparing, setIsComparing] = useState(false);

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      const resultDataUrl = await applyImageAdjustments(imageSrc, brightness, contrast, sharpness, filterType);
      const base64Data = resultDataUrl.split(',')[1];
      onComplete(base64Data);
    } catch (e) {
      console.error("Failed to apply adjustments", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const filterMatrix = useMemo(() => {
    if (sharpness === 0) return null;
    const s = sharpness / 100.0;
    const center = 1 + 4 * s;
    const side = -s;
    return `0 ${side} 0 ${side} ${center} ${side} 0 ${side} 0`;
  }, [sharpness]);

  const filterStyle: React.CSSProperties = {
    filter: isComparing 
      ? 'none' 
      : `brightness(${brightness}%) contrast(${contrast}%) ${
          filterType === 'grayscale' ? 'grayscale(100%) ' : 
          filterType === 'sepia' ? 'sepia(100%) ' : 
          filterType === 'invert' ? 'invert(100%) ' : 
          filterType === 'vintage' ? 'sepia(30%) contrast(110%) brightness(110%) saturate(130%) ' : ''
        }${sharpness > 0 ? 'url(#sharpness-preview)' : ''}`
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 flex flex-col">
      <svg width="0" height="0" className="absolute w-0 h-0">
        <defs>
          <filter id="sharpness-preview">
            {filterMatrix && (
              <feConvolveMatrix 
                order="3" 
                kernelMatrix={filterMatrix} 
                preserveAlpha="true"
              />
            )}
          </filter>
        </defs>
      </svg>

      <div className="relative flex-1 bg-black/20 flex items-center justify-center overflow-hidden group">
         <img 
            src={imageSrc} 
            alt="Adjustment Preview" 
            className="max-h-[500px] max-w-full h-auto w-auto object-contain p-4 transition-all duration-75 select-none"
            style={filterStyle}
         />
         
         {isComparing && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-indigo-600/90 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm shadow-lg z-20">
                Viewing Original
            </div>
         )}

         <button 
            onMouseDown={() => setIsComparing(true)}
            onMouseUp={() => setIsComparing(false)}
            onMouseLeave={() => setIsComparing(false)}
            onTouchStart={() => setIsComparing(true)}
            onTouchEnd={() => setIsComparing(false)}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-900/80 hover:bg-gray-800 text-gray-300 px-4 py-2 rounded-full border border-gray-700 backdrop-blur-sm transition-all shadow-xl active:scale-95 opacity-0 group-hover:opacity-100 focus:opacity-100"
         >
            <EyeIcon />
            <span className="text-xs font-semibold">Hold to compare</span>
         </button>
      </div>
      
      <div className="bg-gray-900 p-6 space-y-5 z-10 border-t border-gray-800">
        
        {/* Filter Presets */}
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Local Presets (No AI)</label>
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {PRESET_FILTERS.map((f) => (
                    <button
                        key={f.type}
                        onClick={() => setFilterType(f.type)}
                        className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all border ${
                            filterType === f.type 
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' 
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
                        }`}
                    >
                        {f.icon}
                        <span>{f.label}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <span>Brightness</span>
                    <span className="text-indigo-400 font-mono">{brightness}%</span>
                </div>
                <input type="range" value={brightness} min={0} max={200} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"/>
            </div>

            <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <span>Contrast</span>
                    <span className="text-indigo-400 font-mono">{contrast}%</span>
                </div>
                <input type="range" value={contrast} min={0} max={200} onChange={(e) => setContrast(Number(e.target.value))} className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"/>
            </div>

            <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <span>Sharpness</span>
                    <span className="text-indigo-400 font-mono">{sharpness}</span>
                </div>
                <input type="range" value={sharpness} min={0} max={200} onChange={(e) => setSharpness(Number(e.target.value))} className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"/>
            </div>
        </div>

        <div className="flex justify-between items-center pt-2">
           <button 
             onClick={() => { setBrightness(100); setContrast(100); setSharpness(0); setFilterType('none'); }}
             className="text-[10px] font-bold text-gray-500 hover:text-indigo-400 transition-colors uppercase tracking-widest"
           >
             Reset all
           </button>
           <div className="flex gap-3">
                <button onClick={onCancel} className="px-4 py-2 rounded-xl bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-white transition-all text-sm font-semibold border border-gray-700">Cancel</button>
                <button onClick={handleSave} disabled={isProcessing} className="px-6 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all flex items-center gap-2 text-sm font-bold shadow-lg shadow-indigo-500/20 active:translate-y-0.5">
                    {isProcessing ? <LoadingSpinner /> : <CheckIcon />}
                    <span>Apply Locally</span>
                </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ImageAdjuster;
