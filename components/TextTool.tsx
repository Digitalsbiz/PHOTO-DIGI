
import React, { useState, useRef, useEffect } from 'react';
import { CheckIcon, LoadingSpinner } from './Icons';

interface TextToolProps {
  imageSrc: string;
  onCancel: () => void;
  onApply: (base64: string) => void;
}

const FONTS = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Serif', value: 'serif' },
  { name: 'Mono', value: 'monospace' },
  { name: 'Cursive', value: 'cursive' },
  { name: 'Impact', value: 'Impact, sans-serif' },
];

const COLORS = [
  '#ffffff', '#000000', '#ef4444', '#f97316', '#eab308', 
  '#22c55e', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'
];

const TextTool: React.FC<TextToolProps> = ({ imageSrc, onCancel, onApply }) => {
  const [text, setText] = useState('Add Text');
  const [font, setFont] = useState(FONTS[0].value);
  const [color, setColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(40);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Position in percentage (0-100)
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleDragStart = (_e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // Calculate percentage position
    let x = ((clientX - containerRect.left) / containerRect.width) * 100;
    let y = ((clientY - containerRect.top) / containerRect.height) * 100;

    // Clamp
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    setPosition({ x, y });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove as any);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove as any);
      window.addEventListener('touchend', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleDragMove as any);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove as any);
      window.removeEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove as any);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove as any);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging]);

  const handleSave = async () => {
    if (!imageRef.current) return;
    setIsProcessing(true);

    try {
      const img = imageRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error("Could not get canvas context");

      // Use actual image dimensions
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Draw text
      // Need to scale font size relative to image size vs screen size
      // We used a fixed fontSize in UI (e.g. 40px) relative to the viewed image size.
      // But the viewed image is scaled down. 
      // A robust way: Define font size as % of image height? 
      // Or just map the visual ratio.
      
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
         // Scale factor
         const scale = img.naturalWidth / containerRect.width;
         const finalFontSize = fontSize * scale;
         
         ctx.font = `${finalFontSize}px ${font}`;
         ctx.fillStyle = color;
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         
         // Calculate X/Y
         const xPos = (position.x / 100) * canvas.width;
         const yPos = (position.y / 100) * canvas.height;
         
         // Add shadow for better visibility
         ctx.shadowColor = 'rgba(0,0,0,0.5)';
         ctx.shadowBlur = 4 * scale;
         ctx.shadowOffsetX = 2 * scale;
         ctx.shadowOffsetY = 2 * scale;

         ctx.fillText(text, xPos, yPos);
      }

      const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
      onApply(base64);

    } catch (e) {
      console.error("Text application failed", e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 flex flex-col">
      
      {/* Preview Area */}
      <div className="relative flex-1 bg-black/20 flex items-center justify-center overflow-hidden p-4 select-none">
         <div 
            ref={containerRef}
            className="relative inline-block max-h-full max-w-full"
         >
            <img 
               ref={imageRef}
               src={imageSrc} 
               alt="Text Tool Preview" 
               className="max-h-[500px] max-w-full h-auto w-auto object-contain pointer-events-none"
            />
            
            {/* Text Overlay */}
            <div 
               ref={textRef}
               className="absolute whitespace-nowrap cursor-move hover:ring-2 hover:ring-indigo-500 rounded p-1"
               style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: 'translate(-50%, -50%)',
                  fontFamily: font,
                  color: color,
                  fontSize: `${fontSize}px`,
                  textShadow: '0px 2px 4px rgba(0,0,0,0.5)',
                  zIndex: 10
               }}
               onMouseDown={handleDragStart}
               onTouchStart={handleDragStart}
            >
               {text}
            </div>
         </div>
      </div>
      
      {/* Controls */}
      <div className="bg-gray-900 p-4 space-y-4 z-10 border-t border-gray-800">
        
        {/* Text Input */}
        <div>
           <input 
              type="text" 
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter text..."
           />
        </div>

        <div className="flex flex-wrap gap-4">
            {/* Font Select */}
            <div className="flex-1 min-w-[120px]">
               <label className="block text-xs font-medium text-gray-400 mb-1">Font</label>
               <select 
                  value={font}
                  onChange={(e) => setFont(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 text-white text-sm rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
               >
                  {FONTS.map(f => (
                     <option key={f.name} value={f.value}>{f.name}</option>
                  ))}
               </select>
            </div>

             {/* Size Slider */}
             <div className="flex-1 min-w-[120px]">
               <label className="block text-xs font-medium text-gray-400 mb-1">Size: {fontSize}px</label>
               <input 
                  type="range"
                  min="12"
                  max="120"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
               />
            </div>
        </div>

        {/* Colors */}
        <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Color</label>
            <div className="flex flex-wrap gap-2 items-center">
               <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-600">
                  <input 
                     type="color" 
                     value={color}
                     onChange={(e) => setColor(e.target.value)}
                     className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 m-0 border-0"
                  />
               </div>
               {COLORS.map(c => (
                  <button
                     key={c}
                     onClick={() => setColor(c)}
                     className={`w-6 h-6 rounded-full border border-gray-700 ${color === c ? 'ring-2 ring-offset-2 ring-indigo-500 ring-offset-gray-900' : ''}`}
                     style={{ backgroundColor: c }}
                  />
               ))}
            </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
           <button
             onClick={onCancel}
             disabled={isProcessing}
             className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors text-sm"
           >
             Cancel
           </button>
           <button
             onClick={handleSave}
             disabled={isProcessing}
             className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center gap-2 text-sm font-medium"
           >
             {isProcessing ? <LoadingSpinner /> : <CheckIcon />}
             Apply Text
           </button>
        </div>
      </div>
    </div>
  );
};

export default TextTool;
