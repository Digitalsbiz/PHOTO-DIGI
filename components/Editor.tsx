import React, { useState, useRef, useEffect } from 'react';
import { ImageFile, AppState, QuickAction, SavedSession, SavedPassport } from '../types';
import { generateEditedImage } from '../services/geminiService';
import { QUICK_ACTIONS } from '../constants';
import { MagicWandIcon, LoadingSpinner, TrashIcon, DownloadIcon, ChevronRight, SparklesIcon, IdCardIcon, CropIcon, SlidersIcon, CircleHalfIcon, DropletIcon, ArrowRightLeftIcon, UserIcon, MaximizeIcon, PaletteIcon, PaintBucketIcon, ChevronDownIcon, TypeIcon, ImageIcon, SaveIcon, CheckIcon, HistoryIcon, XIcon, LayersIcon, MousePointerIcon, BookmarkIcon } from './Icons';
import ImageCropper from './ImageCropper';
import ImageAdjuster from './ImageAdjuster';
import BackgroundTool from './BackgroundTool';
import TextTool from './TextTool';
import PassportDialog from './PassportDialog';
import MergeDialog from './MergeDialog';
import SelectionTool from './SelectionTool';
import { jsPDF } from "jspdf";
import { generateLocalPassportSheet, calculateMaxCapacity } from '../utils/passportGenerator';
import { saveSession, clearSession, savePassportToGallery, getPassportGallery, deletePassportFromGallery } from '../services/storageService';

interface EditorProps {
  initialImage: ImageFile;
  initialGeneratedImage?: string | null;
  initialPrompt?: string;
  initialIntensity?: number;
  initialPaperSize?: string;
  onReset: () => void;
  isOnline?: boolean;
}

const Editor: React.FC<EditorProps> = ({ 
  initialImage, 
  initialGeneratedImage = null,
  initialPrompt = '',
  initialIntensity = 100,
  initialPaperSize = '4x6',
  onReset,
  isOnline = true
}) => {
  const [originalImage] = useState<ImageFile>(initialImage);
  const [sourceImage, setSourceImage] = useState<ImageFile>(initialImage);
  const [isCropping, setIsCropping] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isBackgroundMode, setIsBackgroundMode] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [isPassportDialogOpen, setIsPassportDialogOpen] = useState(false);
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  
  const [prompt, setPrompt] = useState(initialPrompt);
  const [generatedImage, setGeneratedImage] = useState<string | null>(initialGeneratedImage);
  const [intensity, setIntensity] = useState(initialIntensity);
  const [appState, setAppState] = useState<AppState>(initialGeneratedImage ? AppState.SUCCESS : AppState.READY_TO_EDIT);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastPaperSize, setLastPaperSize] = useState<string>(initialPaperSize);
  const [isManualSheet, setIsManualSheet] = useState(initialPrompt.includes("Passport Sheet") || initialPrompt.includes("Restored Passport"));
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'autosaved'>('idle');
  const [galleryItems, setGalleryItems] = useState<SavedPassport[]>([]);

  // Targeted Edit state
  const [activeMask, setActiveMask] = useState<string | null>(null);

  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGalleryItems(getPassportGallery());
  }, []);

  // Auto-save logic: Runs every 60 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      const session: SavedSession = {
        sourceImage: sourceImage,
        generatedImage: generatedImage,
        prompt: prompt,
        intensity: intensity,
        lastPaperSize: lastPaperSize,
        timestamp: Date.now()
      };
      
      const success = saveSession(session);
      if (success) {
        setSaveStatus('autosaved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }, 60000);

    return () => clearInterval(autoSaveInterval);
  }, [sourceImage, generatedImage, prompt, intensity, lastPaperSize]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSaveToGallery = () => {
    if (!generatedImage) return;
    const newPassport: SavedPassport = {
        id: Date.now().toString(),
        image: generatedImage,
        paperSize: lastPaperSize,
        timestamp: Date.now()
    };
    if (savePassportToGallery(newPassport)) {
        setGalleryItems(getPassportGallery());
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleRestoreFromGallery = (item: SavedPassport) => {
    setGeneratedImage(item.image);
    setLastPaperSize(item.paperSize);
    setAppState(AppState.SUCCESS);
    setIsManualSheet(true); 
    setPrompt("Restored Passport from Suite");
  };

  const handleDeleteFromGallery = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deletePassportFromGallery(id);
    setGalleryItems(getPassportGallery());
  };

  const handleSaveProgress = () => {
    setSaveStatus('saving');
    const session: SavedSession = {
      sourceImage: sourceImage,
      generatedImage: generatedImage,
      prompt: prompt,
      intensity: intensity,
      lastPaperSize: lastPaperSize,
      timestamp: Date.now()
    };
    
    const success = saveSession(session);
    if (success) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleResetToUploaded = () => {
      setSourceImage(originalImage);
      setGeneratedImage(null);
      setAppState(AppState.READY_TO_EDIT);
      setPrompt('');
      setActiveMask(null);
  };

  // The original file was truncated in the prompt. Adding a basic render shell and the default export to fix the reported error.
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8 animate-in fade-in duration-500">
      <div className="flex flex-wrap gap-4 justify-center">
        <button onClick={onReset} className="px-6 py-2 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 hover:text-white transition-all border border-gray-700 flex items-center gap-2">
          <TrashIcon /> Reset Editor
        </button>
        <button onClick={handleResetToUploaded} className="px-6 py-2 bg-indigo-900/20 text-indigo-400 rounded-xl hover:bg-indigo-900/40 transition-all border border-indigo-500/20 flex items-center gap-2">
          <HistoryIcon /> Clear Edits
        </button>
        <button onClick={handleSaveProgress} className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2">
          <SaveIcon /> {saveStatus === 'saved' ? 'Saved!' : 'Save Progress'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-stretch w-full">
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Source Canvas</h3>
            <span className="text-[10px] font-bold text-gray-600">ORIGINAL</span>
          </div>
          <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden aspect-square flex items-center justify-center p-4 backdrop-blur-sm shadow-inner">
            <img src={sourceImage.previewUrl} alt="Source" className="max-h-full max-w-full object-contain drop-shadow-2xl" />
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">AI Enhancement</h3>
            <span className="text-[10px] font-bold text-indigo-500/50">PROCESSED</span>
          </div>
          <div className="bg-gray-900/50 rounded-2xl border border-indigo-500/10 overflow-hidden aspect-square flex items-center justify-center p-4 backdrop-blur-sm shadow-inner relative">
            {generatedImage ? (
              <img src={generatedImage} alt="Generated" className="max-h-full max-w-full object-contain drop-shadow-2xl animate-in zoom-in-95 duration-700" />
            ) : (
              <div className="text-gray-700 flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-800/50 rounded-full">
                  <MagicWandIcon />
                </div>
                <p className="text-sm font-medium">Ready for your instructions</p>
              </div>
            )}
            {appState === AppState.GENERATING && (
              <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                <LoadingSpinner />
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 animate-pulse">Gemini is editing...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full bg-gray-900/30 p-8 rounded-3xl border border-gray-800/50 mt-4">
        <div className="flex items-center gap-3 mb-6">
          <SparklesIcon />
          <h4 className="text-sm font-bold uppercase tracking-widest text-gray-300">Quick Actions</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {QUICK_ACTIONS.map(action => (
            <button 
              key={action.label} 
              onClick={() => {
                setPrompt(action.prompt);
                // Implementation for prompt generation would go here
              }} 
              className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-gray-800/40 border border-gray-700/50 hover:bg-indigo-600/10 hover:border-indigo-500/50 transition-all active:scale-95"
            >
              <div className="text-gray-500 group-hover:text-indigo-400 transition-colors">
                <MagicWandIcon />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tight text-gray-400 group-hover:text-white text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Fix: Added missing default export to satisfy App.tsx imports
export default Editor;
