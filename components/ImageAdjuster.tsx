
import React, { useState, useMemo } from 'react';
import { applyImageAdjustments } from '../utils/adjustImage';
import { CheckIcon, XIcon, LoadingSpinner } from './Icons';

interface ImageAdjusterProps {
  imageSrc: string;
  onCancel: () => void;
  onComplete: (adjustedBase64: string) => void;
}

const ImageAdjuster: React.FC<ImageAdjusterProps> = ({ imageSrc, onCancel, onComplete }) => {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [sharpness, setSharpness] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      const resultDataUrl = await applyImageAdjustments(imageSrc, brightness, contrast, sharpness);
      // Extract base64
      const base64Data = resultDataUrl.split(',')[1];
      onComplete(base64Data);
    } catch (e) {
      console.error("Failed to apply adjustments", e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Construct the SVG filter matrix for sharpness
  // Kernel:
  // 0  -s  0
  // -s 1+4s -s
  // 0  -s  0
  const filterMatrix = useMemo(() => {
    if (sharpness === 0) return null;
    const s = sharpness / 100.0;
    const center = 1 + 4 * s;
    const side = -s;
    // feConvolveMatrix order="3" expects 3x3 numbers space-separated
    return `0 ${side} 0 ${side} ${center} ${side} 0 ${side} 0`;
  }, [sharpness]);

  // Dynamic filter for preview
  const filterStyle: React.CSSProperties = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) ${sharpness > 0 ? 'url(#sharpness-preview)' : ''}`
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 flex flex-col">
      
      {/* Invisible SVG for the sharpness filter definition */}
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

      {/* Preview Area */}
      <div className="relative flex-1 bg-black/20 flex items-center justify-center overflow-hidden">
         <img 
            src={imageSrc} 
            alt="Adjustment Preview" 
            className="max-h-[500px] max-w-full h-auto w-auto object-contain p-4 transition-all duration-75"
            style={filterStyle}
         />
      </div>
      
      {/* Controls */}
      <div className="bg-gray-900 p-4 space-y-4 z-10 border-t border-gray-800">
        
        {/* Sliders */}
        <div className="space-y-3">
            {/* Brightness */}
            <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-400 w-16">Brightness</span>
                <input
                    type="range"
                    value={brightness}
                    min={0}
                    max={200}
                    step={1}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-xs w-8 text-right text-gray-500">{brightness}%</span>
            </div>

            {/* Contrast */}
            <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-400 w-16">Contrast</span>
                <input
                    type="range"
                    value={contrast}
                    min={0}
                    max={200}
                    step={1}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-xs w-8 text-right text-gray-500">{contrast}%</span>
            </div>

            {/* Sharpness */}
             <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-400 w-16">Sharpness</span>
                <input
                    type="range"
                    value={sharpness}
                    min={0}
                    max={200}
                    step={1}
                    onChange={(e) => setSharpness(Number(e.target.value))}
                    className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-xs w-8 text-right text-gray-500">{sharpness}</span>
            </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
           <button 
             onClick={() => { setBrightness(100); setContrast(100); setSharpness(0); }}
             className="text-xs text-gray-500 hover:text-gray-300 underline"
           >
             Reset
           </button>
           <div className="flex gap-2">
                <button
                    onClick={onCancel}
                    disabled={isProcessing}
                    className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                    title="Cancel"
                >
                    <XIcon />
                </button>
                <button
                    onClick={handleSave}
                    disabled={isProcessing}
                    className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center gap-2"
                    title="Apply Adjustments"
                >
                    {isProcessing ? <LoadingSpinner /> : <CheckIcon />}
                </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ImageAdjuster;
