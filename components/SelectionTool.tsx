
import React, { useState, useRef, useEffect } from 'react';
import { BrushIcon, EraserIcon, CheckIcon, XIcon, TrashIcon } from './Icons';

interface SelectionToolProps {
  imageSrc: string;
  onCancel: () => void;
  onComplete: (maskBase64: string) => void;
}

const SelectionTool: React.FC<SelectionToolProps> = ({ imageSrc, onCancel, onComplete }) => {
  const [brushSize, setBrushSize] = useState(30);
  const [mode, setMode] = useState<'brush' | 'eraser'>('brush');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize canvas with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    // Scale coordinates based on canvas internal resolution
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setHasDrawn(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.beginPath(); // Reset path
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (mode === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)'; // Semi-transparent indigo for visual feedback
    } else {
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas to generate a clean black/white mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const mCtx = maskCanvas.getContext('2d');
    if (!mCtx) return;

    // Fill background black
    mCtx.fillStyle = 'black';
    mCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Draw the selection in white
    mCtx.globalCompositeOperation = 'source-over';
    // We draw the original canvas content, but we want it to be white.
    // So we use it as a mask.
    mCtx.drawImage(canvas, 0, 0);
    
    // Convert all non-transparent pixels to white
    const imageData = mCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // If alpha is > 0 (meaning something was drawn), make it white
      if (data[i + 3] > 0) {
        data[i] = 255;     // R
        data[i + 1] = 255; // G
        data[i + 2] = 255; // B
        data[i + 3] = 255; // A
      } else {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
      }
    }
    mCtx.putImageData(imageData, 0, 0);

    const base64 = maskCanvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    onComplete(base64);
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 flex flex-col">
      <div className="bg-indigo-600/10 px-4 py-2 border-b border-indigo-500/20 flex items-center justify-between">
         <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
            <BrushIcon /> Targeted Selection
         </span>
         <span className="text-[10px] text-gray-500">Paint the area you want the AI to change</span>
      </div>

      <div 
        ref={containerRef}
        className="relative flex-1 bg-black/20 flex items-center justify-center overflow-hidden touch-none"
      >
        <img 
          src={imageSrc} 
          alt="Original for Selection" 
          className="max-h-[500px] max-w-full h-auto w-auto object-contain p-4 pointer-events-none select-none"
          onLoad={(e) => {
              const img = e.currentTarget;
              if (canvasRef.current) {
                  canvasRef.current.width = img.naturalWidth;
                  canvasRef.current.height = img.naturalHeight;
              }
          }}
        />
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute max-h-[500px] max-w-full h-auto w-auto object-contain cursor-crosshair z-10"
          style={{ padding: '16px' }}
        />
      </div>
      
      <div className="bg-gray-900 p-4 space-y-4 z-20 border-t border-gray-800">
        <div className="flex items-center gap-4">
            <div className="flex bg-gray-950 rounded-lg p-1 border border-gray-800">
                <button 
                    onClick={() => setMode('brush')}
                    className={`p-2 rounded-md transition-all ${mode === 'brush' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:text-gray-300'}`}
                    title="Brush Tool"
                >
                    <BrushIcon />
                </button>
                <button 
                    onClick={() => setMode('eraser')}
                    className={`p-2 rounded-md transition-all ${mode === 'eraser' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:text-gray-300'}`}
                    title="Eraser Tool"
                >
                    <EraserIcon />
                </button>
            </div>

            <div className="flex-1 flex items-center gap-3">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">Size</span>
                <input 
                    type="range" 
                    min="5" 
                    max="100" 
                    value={brushSize} 
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="flex-1 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
            </div>

            <button 
                onClick={handleClear}
                className="p-2 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                title="Clear Selection"
            >
                <TrashIcon />
            </button>
        </div>

        <div className="flex justify-end gap-3 pt-2">
            <button
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
            >
                Cancel
            </button>
            <button
                onClick={handleApply}
                disabled={!hasDrawn}
                className="px-6 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:translate-y-0.5"
            >
                <CheckIcon />
                <span>Lock Selection</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default SelectionTool;
