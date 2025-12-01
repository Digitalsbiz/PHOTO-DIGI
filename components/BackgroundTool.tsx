import React, { useState } from 'react';
import { CheckIcon, XIcon, PaintBucketIcon } from './Icons';

interface BackgroundToolProps {
  imageSrc: string;
  onCancel: () => void;
  onApply: (prompt: string) => void;
}

const COLORS = [
  { name: 'White', value: '#ffffff', class: 'bg-white border-gray-300' },
  { name: 'Black', value: '#000000', class: 'bg-black border-gray-700' },
  { name: 'Gray', value: '#808080', class: 'bg-gray-500 border-gray-600' },
  { name: 'Red', value: '#ef4444', class: 'bg-red-500 border-red-600' },
  { name: 'Orange', value: '#f97316', class: 'bg-orange-500 border-orange-600' },
  { name: 'Yellow', value: '#eab308', class: 'bg-yellow-500 border-yellow-600' },
  { name: 'Green', value: '#22c55e', class: 'bg-green-500 border-green-600' },
  { name: 'Teal', value: '#14b8a6', class: 'bg-teal-500 border-teal-600' },
  { name: 'Blue', value: '#3b82f6', class: 'bg-blue-500 border-blue-600' },
  { name: 'Indigo', value: '#6366f1', class: 'bg-indigo-500 border-indigo-600' },
  { name: 'Purple', value: '#a855f7', class: 'bg-purple-500 border-purple-600' },
  { name: 'Pink', value: '#ec4899', class: 'bg-pink-500 border-pink-600' },
];

const BackgroundTool: React.FC<BackgroundToolProps> = ({ imageSrc, onCancel, onApply }) => {
  const [customColor, setCustomColor] = useState('');

  const handleColorClick = (colorName: string) => {
    const prompt = `Change the background of this image to a solid ${colorName} color. Keep the foreground subject exactly as is, maintaining all original details and lighting.`;
    onApply(prompt);
  };

  const handleCustomApply = () => {
    if (!customColor.trim()) return;
    const prompt = `Change the background of this image to ${customColor}. Keep the foreground subject exactly as is, maintaining all original details and lighting.`;
    onApply(prompt);
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 flex flex-col">
      {/* Preview Area */}
      <div className="relative flex-1 bg-black/20 flex items-center justify-center overflow-hidden">
        <img 
          src={imageSrc} 
          alt="Original for Background" 
          className="max-h-[500px] max-w-full h-auto w-auto object-contain p-4"
        />
        <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
            Select a color to generate new background
        </div>
      </div>
      
      {/* Controls */}
      <div className="bg-gray-900 p-4 space-y-4 z-10 border-t border-gray-800">
        
        {/* Color Grid */}
        <div>
            <label className="text-xs font-medium text-gray-400 mb-2 block">Preset Colors</label>
            <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                    <button
                        key={color.name}
                        onClick={() => handleColorClick(color.name)}
                        className={`w-8 h-8 rounded-full border-2 ${color.class} hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900`}
                        title={color.name}
                    />
                ))}
            </div>
        </div>

        {/* Custom Input */}
        <div>
            <label className="text-xs font-medium text-gray-400 mb-2 block">Custom Color / Description</label>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="e.g., Neon Green, Dark Space"
                    className="flex-1 bg-gray-950 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomApply()}
                />
                <button 
                    onClick={handleCustomApply}
                    disabled={!customColor.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-gray-500 text-white px-3 py-2 rounded-lg transition-colors"
                >
                    <CheckIcon />
                </button>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-2">
            <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2 text-sm"
            >
                <XIcon /> Cancel
            </button>
        </div>
      </div>
    </div>
  );
};

export default BackgroundTool;
