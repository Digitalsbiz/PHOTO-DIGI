
import React, { useState } from 'react';
import { CheckIcon, XIcon, SparklesIcon, MagicWandIcon, ImageIcon, DropletIcon, CircleHalfIcon, SunIcon } from './Icons';

interface BackgroundToolProps {
  imageSrc: string;
  onCancel: () => void;
  onApply: (prompt: string) => void;
}

const CATEGORIES = [
  { id: 'pro', label: 'Professional', icon: '💼' },
  { id: 'cinematic', label: 'Cinematic', icon: '🎬' },
  { id: 'nature', label: 'Nature', icon: '🌲' },
  { id: 'abstract', label: 'Abstract', icon: '🌈' },
];

const SCENES: Record<string, { label: string; prompt: string; icon: string }[]> = {
  pro: [
    { label: 'Modern Office', prompt: 'a high-end, blurred modern office interior with floor-to-ceiling windows and mahogany furniture.', icon: '🏢' },
    { label: 'Minimalist Studio', prompt: 'a clean, minimalist photography studio with a soft grey seamless backdrop and professional softbox lighting.', icon: '📸' },
    { label: 'Brick Loft', prompt: 'a luxury industrial loft with exposed white brick walls and warm ambient lighting.', icon: '🧱' },
    { label: 'Corporate Hall', prompt: 'a sleek corporate headquarters hallway with polished marble floors and architectural lighting.', icon: '🏢' },
  ],
  cinematic: [
    { label: 'Cyberpunk City', prompt: 'a futuristic cyberpunk street at night with glowing neon signs, puddles, and purple/blue lighting.', icon: '🏙️' },
    { label: 'Vintage Cafe', prompt: 'a cozy 1950s French cafe with warm amber lighting and blurred espresso machines in the back.', icon: '☕' },
    { label: 'Moon Surface', prompt: 'the desolate surface of the moon with the Earth visible in the black starry sky.', icon: '🌑' },
    { label: 'Rainy Street', prompt: 'a moody, wet city street at dusk with reflections of traffic lights on the pavement.', icon: '🌧️' },
  ],
  nature: [
    { label: 'Lush Forest', prompt: 'a vibrant temperate rainforest with sunbeams filtering through dense green canopy.', icon: '🌳' },
    { label: 'Tropical Beach', prompt: 'a pristine white sand beach with turquoise water and leaning palm trees under a clear sky.', icon: '🏖️' },
    { label: 'Misty Mountains', prompt: 'majestic mountain peaks emerging from a thick layer of morning mist at sunrise.', icon: '🏔️' },
    { label: 'Desert Dunes', prompt: 'vast orange sand dunes of the Sahara under a scorching midday sun.', icon: '🏜️' },
  ],
  abstract: [
    { label: 'Nebula', prompt: 'a colorful deep space nebula with swirling cosmic dust and distant stars.', icon: '🌌' },
    { label: 'Gradient Mesh', prompt: 'a smooth, fluid gradient mesh of vibrant silk-like colors flowing together.', icon: '🎨' },
    { label: 'Geometric', prompt: 'a clean 3D composition of floating geometric shapes and architectural shadows.', icon: '📐' },
    { label: 'Bokeh Lights', prompt: 'soft, out-of-focus golden light circles against a dark velvet background.', icon: '✨' },
  ]
};

const LIGHTING_MODS = [
  { id: 'none', label: 'Original', icon: <CircleHalfIcon /> },
  { id: 'golden', label: 'Golden Hour', prompt: 'bathed in warm, golden sunset light with long shadows.', icon: '🌇' },
  { id: 'studio', label: 'Studio Box', prompt: 'with professional studio softbox lighting, perfectly balanced and flattering.', icon: '💡' },
  { id: 'dramatic', label: 'Moody', prompt: 'with dramatic high-contrast lighting and deep cinematic shadows.', icon: '🔦' },
];

const BackgroundTool: React.FC<BackgroundToolProps> = ({ imageSrc, onCancel, onApply }) => {
  const [activeTab, setActiveTab] = useState<'solid' | 'creative'>('creative');
  const [selectedCategory, setSelectedCategory] = useState('pro');
  const [customDescription, setCustomDescription] = useState('');
  const [lightingMod, setLightingMod] = useState('none');
  const [useBokeh, setUseBokeh] = useState(true);

  const handleApply = (description: string, isSolid: boolean = false) => {
    const selectedLighting = LIGHTING_MODS.find(m => m.id === lightingMod);
    const lightingText = selectedLighting?.prompt ? ` ${selectedLighting.prompt}` : "";
    const bokehText = useBokeh && !isSolid ? " Add a beautiful shallow depth of field with creamy bokeh to the background." : "";
    
    const lightingInstruction = isSolid 
      ? "Ensure the lighting on the subject remains natural and consistent with the new background."
      : "Critically important: Relight the subject seamlessly to match the environmental colors and light sources of the new background. The integration should be photorealistic.";
    
    const finalPrompt = `Change the background of this image to ${description}.${lightingText}${bokehText} Keep the main subject exactly as is, maintaining their identity, hair details, and fine edges. ${lightingInstruction} The result must be professional-grade and high-resolution.`;
    
    onApply(finalPrompt);
  };

  const handleCustomApply = () => {
    if (!customDescription.trim()) return;
    handleApply(customDescription);
  };

  const SOLID_COLORS = [
    { name: 'White', class: 'bg-white border-gray-300' },
    { name: 'Studio Gray', class: 'bg-slate-200 border-slate-300' },
    { name: 'Deep Blue', class: 'bg-blue-900 border-blue-800' },
    { name: 'Black', class: 'bg-black border-gray-800' },
    { name: 'Warm Beige', class: 'bg-[#f5f5dc] border-[#e5e5cc]' },
    { name: 'Soft Mint', class: 'bg-[#e0f2f1] border-[#b2dfdb]' },
  ];

  return (
    <div className="relative w-full h-full min-h-[500px] bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 flex flex-col">
      {/* Top Preview */}
      <div className="relative h-48 bg-black/40 flex items-center justify-center overflow-hidden border-b border-gray-800">
        <img 
          src={imageSrc} 
          alt="Subject Preview" 
          className="h-full w-auto object-contain p-4 drop-shadow-2xl opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent" />
        <div className="absolute bottom-4 left-4 flex flex-col gap-1">
            <div className="bg-indigo-600/20 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-indigo-500/20 backdrop-blur-md w-fit flex items-center gap-2">
                <SparklesIcon /> AI Backdrop Studio
            </div>
            <p className="text-xs text-gray-500 font-medium ml-1">Describe a scene or choose a preset below</p>
        </div>
      </div>
      
      {/* Controls Container */}
      <div className="bg-gray-950 flex-1 flex flex-col overflow-hidden">
        
        {/* Navigation Tabs */}
        <div className="flex px-6 pt-4 gap-6 border-b border-gray-900">
            <button 
                onClick={() => setActiveTab('creative')}
                className={`pb-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'creative' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}
            >
                AI Creative Scenes
            </button>
            <button 
                onClick={() => setActiveTab('solid')}
                className={`pb-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'solid' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Studio Backdrops
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {activeTab === 'creative' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Category Selector */}
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-tighter border transition-all whitespace-nowrap ${
                                    selectedCategory === cat.id 
                                    ? 'bg-indigo-600 border-indigo-400 text-white' 
                                    : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700'
                                }`}
                            >
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Scene Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {SCENES[selectedCategory].map((scene, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleApply(scene.prompt)}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-indigo-500/50 hover:bg-gray-800/50 transition-all group active:scale-95 text-center"
                            >
                                <span className="text-2xl mb-1">{scene.icon}</span>
                                <span className="text-[10px] font-bold text-gray-400 group-hover:text-white uppercase tracking-tight">{scene.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Modifiers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-gray-900">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Relighting Mood</label>
                            <div className="flex flex-wrap gap-2">
                                {LIGHTING_MODS.map(mod => (
                                    <button
                                        key={mod.id}
                                        onClick={() => setLightingMod(mod.id)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                                            lightingMod === mod.id 
                                            ? 'bg-indigo-900/30 border-indigo-500 text-indigo-400' 
                                            : 'bg-gray-900 border-gray-800 text-gray-500'
                                        }`}
                                    >
                                        <span className="text-sm">{typeof mod.icon === 'string' ? mod.icon : ''}</span>
                                        <span className="uppercase tracking-tight">{mod.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Lens Effect</label>
                            <button 
                                onClick={() => setUseBokeh(!useBokeh)}
                                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-all ${useBokeh ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400' : 'bg-gray-900 border-gray-800 text-gray-500'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <DropletIcon />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Portrait Blur (Bokeh)</span>
                                </div>
                                <div className={`w-8 h-4 rounded-full relative transition-colors ${useBokeh ? 'bg-indigo-500' : 'bg-gray-700'}`}>
                                    <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${useBokeh ? 'right-1' : 'left-1'}`} />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">High-Key & ID Backdrops</p>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                        {SOLID_COLORS.map((color) => (
                            <button
                                key={color.name}
                                onClick={() => handleApply(`a solid ${color.name} background`, true)}
                                className="group flex flex-col items-center gap-3"
                            >
                                <div className={`w-14 h-14 rounded-2xl border-2 ${color.class} hover:scale-110 transition-all shadow-xl active:scale-95 flex items-center justify-center`}>
                                    <div className="opacity-0 group-hover:opacity-100 text-gray-400"><CheckIcon /></div>
                                </div>
                                <span className="text-[9px] font-bold text-gray-500 group-hover:text-gray-300 uppercase tracking-widest">{color.name}</span>
                            </button>
                        ))}
                    </div>
                    <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl">
                        <p className="text-[10px] text-indigo-400/80 leading-relaxed italic">
                            Studio backdrops use high-key lighting by default, perfect for portraits and professional ID photos.
                        </p>
                    </div>
                </div>
            )}
        </div>

        {/* Footer Prompt Input */}
        <div className="bg-gray-900/90 border-t border-gray-800 p-6 space-y-4">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input 
                        type="text" 
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        placeholder="Or describe anything: 'A penthouse balcony at sunset'..."
                        className="w-full bg-gray-950 border border-gray-700 text-white text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600 transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomApply()}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500/30">
                        <MagicWandIcon />
                    </div>
                </div>
                <button 
                    onClick={handleCustomApply}
                    disabled={!customDescription.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white px-8 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 font-bold text-xs uppercase tracking-widest"
                >
                    Apply
                </button>
            </div>
            
            <div className="flex justify-between items-center">
                <button
                    onClick={onCancel}
                    className="text-gray-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]"
                >
                    <XIcon /> Cancel Studio
                </button>
                <div className="flex items-center gap-2 text-[9px] text-gray-600 font-bold uppercase tracking-wider">
                    <SparklesIcon /> AI-Powered Seamless Replacement
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundTool;
