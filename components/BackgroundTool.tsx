
import React, { useState } from 'react';
import { CheckIcon, XIcon, SparklesIcon, MagicWandIcon, ImageIcon } from './Icons';

interface BackgroundToolProps {
  imageSrc: string;
  onCancel: () => void;
  onApply: (prompt: string) => void;
}

const SOLID_COLORS = [
  { name: 'White', value: '#ffffff', class: 'bg-white border-gray-300' },
  { name: 'Studio Gray', value: '#e2e8f0', class: 'bg-slate-200 border-slate-300' },
  { name: 'Deep Blue', value: '#1e3a8a', class: 'bg-blue-900 border-blue-800' },
  { name: 'Pitch Black', value: '#000000', class: 'bg-black border-gray-800' },
  { name: 'Corporate Teal', value: '#134e4a', class: 'bg-teal-900 border-teal-800' },
  { name: 'Warm Beige', value: '#f5f5dc', class: 'bg-[#f5f5dc] border-[#e5e5cc]' },
];

const CREATIVE_SCENES = [
  { id: 'office', label: 'Modern Office', prompt: 'a high-end, blurred modern office interior with soft window lighting and mahogany furniture.', icon: '🏢' },
  { id: 'garden', label: 'Lush Garden', prompt: 'a beautiful, soft-focus botanical garden with vibrant greenery and dappled sunlight.', icon: '🌿' },
  { id: 'cyberpunk', label: 'Neon City', prompt: 'a futuristic cyberpunk street at night with glowing neon signs, puddles, and purple/blue lighting.', icon: '🏙️' },
  { id: 'minimal', label: 'Minimalist Wall', prompt: 'a clean, minimalist concrete wall with a subtle aesthetic shadow of a palm leaf.', icon: '🎨' },
  { id: 'nature', label: 'Mist Mountain', prompt: 'a majestic mountain range covered in morning mist and pine trees, dramatic landscape.', icon: '🏔️' },
  { id: 'interior', label: 'Luxury Loft', prompt: 'a luxury industrial loft with exposed brick, large windows, and warm ambient lighting.', icon: '🏠' },
];

const BackgroundTool: React.FC<BackgroundToolProps> = ({ imageSrc, onCancel, onApply }) => {
  const [activeTab, setActiveTab] = useState<'solid' | 'creative'>('creative');
  const [customDescription, setCustomDescription] = useState('');

  const handleApply = (description: string, isSolid: boolean = false) => {
    // Relighting instructions help Gemini blend the subject into the new background
    const lightingInstruction = isSolid 
      ? "Ensure the lighting on the subject remains natural and consistent with the new background."
      : "Relight the subject subtly to match the colors and mood of the new background for a seamless, realistic integration.";
    
    const finalPrompt = `Change the background of this image to ${description}. Keep the main subject exactly as is, maintaining their identity and fine details. ${lightingInstruction} The result should be professional and high-resolution.`;
    
    onApply(finalPrompt);
  };

  const handleCustomApply = () => {
    if (!customDescription.trim()) return;
    handleApply(customDescription);
  };

  return (
    <div className="relative w-full h-full min-h-[450px] bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 flex flex-col">
      {/* Preview Area */}
      <div className="relative flex-1 bg-black/40 flex items-center justify-center overflow-hidden">
        <img 
          src={imageSrc} 
          alt="Subject Preview" 
          className="max-h-[350px] max-w-full h-auto w-auto object-contain p-8 drop-shadow-2xl"
        />
        <div className="absolute top-4 left-4 bg-indigo-600/20 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-indigo-500/20 backdrop-blur-md flex items-center gap-2">
            <SparklesIcon /> AI Backdrop Studio
        </div>
      </div>
      
      {/* Controls */}
      <div className="bg-gray-900/90 backdrop-blur-xl p-6 space-y-6 z-10 border-t border-gray-800">
        
        <div className="flex gap-4 border-b border-gray-800">
            <button 
                onClick={() => setActiveTab('creative')}
                className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'creative' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Creative Scenes
            </button>
            <button 
                onClick={() => setActiveTab('solid')}
                className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'solid' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Studio Colors
            </button>
        </div>

        <div className="min-h-[100px]">
            {activeTab === 'solid' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Passport & Professional Backdrops</p>
                    <div className="flex flex-wrap gap-3">
                        {SOLID_COLORS.map((color) => (
                            <button
                                key={color.name}
                                onClick={() => handleApply(`a solid ${color.name} background`, true)}
                                className="group flex flex-col items-center gap-2"
                            >
                                <div className={`w-10 h-10 rounded-xl border-2 ${color.class} hover:scale-110 transition-all shadow-lg active:scale-95`} />
                                <span className="text-[9px] font-bold text-gray-500 group-hover:text-gray-300 uppercase">{color.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">AI Scene Generation</p>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {CREATIVE_SCENES.map((scene) => (
                            <button
                                key={scene.id}
                                onClick={() => handleApply(scene.prompt)}
                                className="flex flex-col items-center gap-2 p-2 rounded-xl bg-gray-950 border border-gray-800 hover:border-indigo-500/50 hover:bg-gray-800/50 transition-all group active:scale-95"
                            >
                                <span className="text-xl">{scene.icon}</span>
                                <span className="text-[9px] font-bold text-gray-400 group-hover:text-white uppercase tracking-tighter whitespace-nowrap">{scene.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="space-y-3 pt-2 border-t border-gray-800">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Custom Scene Description</label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input 
                        type="text" 
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        placeholder="e.g., 'A rainy Tokyo street with blurred lights' or 'Moon surface'..."
                        className="w-full bg-gray-950 border border-gray-700 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600 transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomApply()}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500/50">
                        <MagicWandIcon />
                    </div>
                </div>
                <button 
                    onClick={handleCustomApply}
                    disabled={!customDescription.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 font-bold text-xs uppercase tracking-widest"
                >
                    Generate
                </button>
            </div>
        </div>

        <div className="flex justify-between items-center pt-2">
            <p className="text-[10px] text-gray-600 font-medium max-w-[250px]">
                Tip: Describing the "lighting" or "mood" helps the AI create a more realistic blend.
            </p>
            <button
                onClick={onCancel}
                className="px-6 py-2 rounded-xl text-gray-500 hover:text-white hover:bg-gray-800 transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-transparent hover:border-gray-700"
            >
                <XIcon /> Cancel
            </button>
        </div>
      </div>
    </div>
  );
};

export default BackgroundTool;
