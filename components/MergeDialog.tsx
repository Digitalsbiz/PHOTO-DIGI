
import React, { useState, useRef } from 'react';
// Added MagicWandIcon to the import list from Icons
import { LayersIcon, XIcon, PlusIcon, LoadingSpinner, SparklesIcon, LayoutIcon, MagicWandIcon } from './Icons';
import { processImage } from '../services/geminiService';

interface MergeDialogProps {
  isOpen: boolean;
  currentImageSrc: string;
  onClose: () => void;
  onConfirm: (
      prompt: string,
      additionalImages: { base64: string; mimeType: string }[]
  ) => void;
}

interface AdditionalImage {
    id: string;
    previewUrl: string;
    base64: string;
    mimeType: string;
}

const MERGE_STYLES = [
  { id: 'seamless', label: 'Seamless Artistic', detail: 'Subtle 2px borders, cohesive blend' },
  { id: 'grid', label: 'Creative Grid', detail: 'Symmetric layout with clean spacing' },
  { id: 'panorama', label: 'Panorama Blend', detail: 'Horizontal flow between images' },
];

const MergeDialog: React.FC<MergeDialogProps> = ({ isOpen, currentImageSrc, onClose, onConfirm }) => {
  const [selectedStyle, setSelectedStyle] = useState('seamless');
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
    const totalCount = additionalImages.length + 1;
    let basePrompt = "";
    
    if (selectedStyle === 'seamless') {
        basePrompt = `Merge these ${totalCount} images into a single cohesive artistic composition. The transition between the pictures should be seamlessly integrated, ensuring the entire piece looks like a single work of art. The boundaries between the original pictures should be subtly visible with a very small, clean border of exactly 2px. Ensure there are no harsh edges or noticeable separations, creating a high-quality, professional blend.`;
    } else if (selectedStyle === 'grid') {
        basePrompt = `Arrange these ${totalCount} images into a creative grid layout. Use a consistent 2px border between all images. Ensure the composition is balanced and maintains the original details of each subject while presenting them as a cohesive unit.`;
    } else {
        basePrompt = `Blend these ${totalCount} images into a panoramic-style composition. Create a fluid transition from left to right, using thin 2px separators that guide the eye through the scene as a single piece.`;
    }

    const imagesPayload = additionalImages.map(img => ({ base64: img.base64, mimeType: img.mimeType }));
    onConfirm(basePrompt, imagesPayload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <LayersIcon />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Image Merger</h3>
              <p className="text-sm text-gray-400">Combine multiple photos into one</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 space-y-4">
                 <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Select Photos</label>
                    <span className="text-[10px] font-bold text-indigo-400">{1 + additionalImages.length} / 6 selected</span>
                 </div>
                 <div className="grid grid-cols-4 gap-2">
                    <div className="relative aspect-square bg-gray-900 rounded-lg border border-indigo-500/50 overflow-hidden group">
                        <img src={currentImageSrc} alt="Base" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-indigo-600/10" />
                    </div>
                    {additionalImages.map((img) => (
                         <div key={img.id} className="relative aspect-square bg-gray-900 rounded-lg border border-gray-600 overflow-hidden group">
                            <img src={img.previewUrl} alt="Additional" className="w-full h-full object-cover" />
                            <button onClick={() => removeImage(img.id)} className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <XIcon />
                            </button>
                        </div>
                    ))}
                    {additionalImages.length < 5 && (
                        <button 
                            onClick={handleAddImage} 
                            disabled={isProcessingFile}
                            className="aspect-square bg-gray-800/50 hover:bg-gray-800 border-2 border-dashed border-gray-700 hover:border-indigo-500 flex flex-col items-center justify-center gap-1 transition-all group"
                        >
                            {isProcessingFile ? <LoadingSpinner /> : <><PlusIcon /><span className="text-[10px] font-bold text-gray-500 group-hover:text-indigo-400">ADD</span></>}
                        </button>
                    )}
                 </div>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Merging Style</label>
                <div className="grid grid-cols-1 gap-2">
                    {MERGE_STYLES.map((style) => (
                        <button 
                            key={style.id}
                            onClick={() => setSelectedStyle(style.id)}
                            className={`flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${
                                selectedStyle === style.id 
                                ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/10' 
                                : 'bg-gray-800/40 border-gray-700 hover:bg-gray-800 hover:border-gray-600'
                            }`}
                        >
                            <div className={`p-2 rounded-lg ${selectedStyle === style.id ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
                                {style.id === 'grid' ? <LayoutIcon /> : <SparklesIcon />}
                            </div>
                            <div>
                                <div className={`text-sm font-bold ${selectedStyle === style.id ? 'text-white' : 'text-gray-300'}`}>{style.label}</div>
                                <div className="text-[10px] text-gray-500 mt-1">{style.detail}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-950 px-6 py-4 flex justify-end gap-3 border-t border-gray-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
          <button 
            onClick={handleConfirm}
            disabled={additionalImages.length === 0}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold text-white uppercase tracking-widest transition-all shadow-lg active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                additionalImages.length > 0 ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20' : 'bg-gray-800'
            }`}
          >
            <MagicWandIcon />
            <span>Generate Merge</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MergeDialog;
