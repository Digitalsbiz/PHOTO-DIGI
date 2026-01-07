
import React, { useState, useRef, useEffect } from 'react';
import { ImageFile, AppState, QuickAction, SavedSession } from '../types';
import { generateEditedImage } from '../services/geminiService';
import { QUICK_ACTIONS } from '../constants';
import { MagicWandIcon, LoadingSpinner, TrashIcon, DownloadIcon, ChevronRight, SparklesIcon, IdCardIcon, CropIcon, SlidersIcon, CircleHalfIcon, DropletIcon, ArrowRightLeftIcon, UserIcon, MaximizeIcon, PaletteIcon, PaintBucketIcon, ChevronDownIcon, TypeIcon, ImageIcon, SaveIcon, CheckIcon, HistoryIcon, XIcon, LayersIcon, MousePointerIcon } from './Icons';
import ImageCropper from './ImageCropper';
import ImageAdjuster from './ImageAdjuster';
import BackgroundTool from './BackgroundTool';
import TextTool from './TextTool';
import PassportDialog from './PassportDialog';
import MergeDialog from './MergeDialog';
import SelectionTool from './SelectionTool';
import { jsPDF } from "jspdf";
import { generateLocalPassportSheet, calculateMaxCapacity } from '../utils/passportGenerator';
import { saveSession, clearSession } from '../services/storageService';

interface EditorProps {
  initialImage: ImageFile;
  initialGeneratedImage?: string | null;
  initialPrompt?: string;
  initialIntensity?: number;
  initialPaperSize?: string;
  onReset: () => void;
}

const Editor: React.FC<EditorProps> = ({ 
  initialImage, 
  initialGeneratedImage = null,
  initialPrompt = '',
  initialIntensity = 100,
  initialPaperSize = '4x6',
  onReset 
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
  const [isManualSheet, setIsManualSheet] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'autosaved'>('idle');

  // Targeted Edit state
  const [activeMask, setActiveMask] = useState<string | null>(null);

  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

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

  const handleReset = () => {
    clearSession();
    onReset();
  };

  const handleGenerate = async (selectedPrompt?: string, additionalImages?: { base64: string; mimeType: string }[]) => {
    const promptToUse = selectedPrompt || prompt;
    if (!promptToUse.trim()) return;

    setAppState(AppState.GENERATING);
    setErrorMessage(null);
    setIntensity(100);
    setIsManualSheet(false);

    try {
      let inputImages: { base64: string; mimeType: string } | { base64: string; mimeType: string }[] = {
          base64: sourceImage.base64,
          mimeType: sourceImage.mimeType
      };

      if (additionalImages && additionalImages.length > 0) {
          inputImages = [inputImages, ...additionalImages];
      }

      const maskPayload = activeMask ? { base64: activeMask, mimeType: 'image/jpeg' } : undefined;

      const resultBase64 = await generateEditedImage(
        inputImages,
        promptToUse,
        maskPayload
      );

      setGeneratedImage(resultBase64);
      setAppState(AppState.SUCCESS);
      // Clear mask after successful generation if it was a targeted edit
      setActiveMask(null);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Something went wrong while generating.');
      setAppState(AppState.ERROR);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    if (action.label === 'Passport Photo') {
      setIsPassportDialogOpen(true);
      return;
    }
    setPrompt(action.prompt);
    handleGenerate(action.prompt);
  };

  const handlePassportConfirm = async (
      quantity: number | 'max', 
      paperSize: string, 
      dimensions: string, 
      format: string, 
      additionalImages: { base64: string; mimeType: string }[],
      enableEnhancement: boolean
  ) => {
    setIsPassportDialogOpen(false);
    setLastPaperSize(paperSize);
    
    if (!enableEnhancement) {
        setAppState(AppState.GENERATING);
        setPrompt("Manual Passport Sheet (No AI)");
        setIsManualSheet(true);
        try {
            const sheet = await generateLocalPassportSheet({
                mainImage: sourceImage.previewUrl,
                additionalImages,
                quantity,
                paperSize,
                dimensions
            });
            setGeneratedImage(sheet);
            setAppState(AppState.SUCCESS);
        } catch (err: any) {
            setErrorMessage("Failed to generate manual sheet locally.");
            setAppState(AppState.ERROR);
        }
        return;
    }

    const subjectCount = 1 + additionalImages.length;
    let subjectText = "the subject";
    if (subjectCount > 1) subjectText = `the ${subjectCount} provided subjects`;
    
    const actualQty = quantity === 'max' ? calculateMaxCapacity(paperSize, dimensions) : quantity;

    const enhancementInstruction = "IMPORTANT: First, apply a professional studio portrait enhancement to all subjects. Improve lighting to be balanced and professional. Enhance resolution, skin texture, and facial details to look hyper-realistic and high-quality, similar to a professional studio photo. Ensure the person keeps their original identity but looks their best. Then, using these enhanced versions, ";

    const passportPrompt = `${enhancementInstruction}Create a printable image sheet formatted for ${paperSize} paper, containing exactly ${actualQty} passport photos arranged in an optimal grid layout to maximize space. I have provided ${subjectCount} image(s). Use these images to generate the passport photos. Distribute the copies evenly among ${subjectText}. Each copy must be formatted as a standard ${dimensions} passport photo (portrait orientation) with a ${format}. Ensure even spacing and professional alignment. The subjects should be centered and facing forward in each copy.`;
    
    setPrompt(passportPrompt);
    handleGenerate(passportPrompt, additionalImages);
  };

  const handleMergeConfirm = (mergePrompt: string, additionalImages: { base64: string; mimeType: string }[]) => {
      setIsMergeDialogOpen(false);
      setPrompt(mergePrompt);
      handleGenerate(mergePrompt, additionalImages);
  };

  const getBlendedImage = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!generatedImage) return resolve(sourceImage.previewUrl);
      if (intensity === 0) return resolve(sourceImage.previewUrl);
      if (intensity === 100) return resolve(generatedImage);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img1 = new Image();
      const img2 = new Image();

      img1.onload = () => {
        canvas.width = img1.width;
        canvas.height = img1.height;
        ctx.drawImage(img1, 0, 0);

        img2.onload = () => {
          ctx.globalAlpha = intensity / 100;
          ctx.drawImage(img2, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        };
        img2.src = generatedImage;
      };
      img1.src = sourceImage.previewUrl;
    });
  };

  const handleDownload = async (format: 'png' | 'jpeg' | 'pdf') => {
    if (!generatedImage) return;
    const timestamp = Date.now();
    const finalImage = await getBlendedImage();

    if (format === 'png') {
        const link = document.createElement('a');
        link.href = finalImage;
        link.download = `nanoedit-result-${timestamp}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else if (format === 'jpeg') {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                const jpegUrl = canvas.toDataURL('image/jpeg', 0.9);
                const link = document.createElement('a');
                link.href = jpegUrl;
                link.download = `nanoedit-result-${timestamp}.jpg`;
                link.click();
            }
        };
        img.src = finalImage;
    } else if (format === 'pdf') {
        let pdfFormat: string | number[] = 'a4';
        if (lastPaperSize === '4x6') pdfFormat = [101.6, 152.4];
        else if (lastPaperSize === '5x7') pdfFormat = [127, 177.8];
        else if (lastPaperSize === 'Letter') pdfFormat = 'letter';

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: pdfFormat });
        const img = new Image();
        img.onload = () => {
             const pageWidth = doc.internal.pageSize.getWidth();
             const pageHeight = doc.internal.pageSize.getHeight();
             const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
             const canvasWidth = img.width * ratio;
             const canvasHeight = img.height * ratio;
             const marginX = (pageWidth - canvasWidth) / 2;
             const marginY = (pageHeight - canvasHeight) / 2;
             doc.addImage(finalImage, 'PNG', marginX, marginY, canvasWidth, canvasHeight);
             doc.save(`nanoedit-passport-sheet-${lastPaperSize}-${timestamp}.pdf`);
        };
        img.src = finalImage;
    }
    setIsDownloadMenuOpen(false);
  };

  const handleCropComplete = (croppedBase64: string) => {
    const previewUrl = `data:image/jpeg;base64,${croppedBase64}`;
    setSourceImage({ ...sourceImage, base64: croppedBase64, mimeType: 'image/jpeg', previewUrl });
    setIsCropping(false);
    setGeneratedImage(null);
    setAppState(AppState.READY_TO_EDIT);
  };

  const handleAdjustComplete = (adjustedBase64: string) => {
    const previewUrl = `data:image/jpeg;base64,${adjustedBase64}`;
    setSourceImage({ ...sourceImage, base64: adjustedBase64, mimeType: 'image/jpeg', previewUrl });
    setIsAdjusting(false);
    setGeneratedImage(null);
    setAppState(AppState.READY_TO_EDIT);
  };

  const handleBackgroundApply = (bgPrompt: string) => {
    setIsBackgroundMode(false);
    setPrompt(bgPrompt);
    handleGenerate(bgPrompt);
  };

  const handleTextComplete = (textBase64: string) => {
    const previewUrl = `data:image/jpeg;base64,${textBase64}`;
    setSourceImage({ ...sourceImage, base64: textBase64, mimeType: 'image/jpeg', previewUrl });
    setIsTextMode(false);
    setGeneratedImage(null);
    setAppState(AppState.READY_TO_EDIT);
  };

  const handleSelectionComplete = (maskBase64: string) => {
    setActiveMask(maskBase64);
    setIsSelecting(false);
  };

  const isAnyToolActive = isCropping || isAdjusting || isBackgroundMode || isTextMode || isSelecting;

  const getLoadingMessage = () => {
    if (isManualSheet) return 'Arranging photos manually...';
    const p = prompt.toLowerCase();
    if (activeMask) return 'Applying targeted AI edit...';
    if (p.includes('merge')) return 'Merging images into cohesive piece...';
    if (p.includes('upscale')) return 'Upscaling image resolution & details...';
    if (p.includes('passport')) return 'Generating passport layout...';
    if (p.includes('remove background')) return 'Removing background...';
    if (p.includes('colorize')) return 'Colorizing image...';
    if (p.includes('sketch')) return 'Creating sketch...';
    if (p.includes('background')) return 'Generating new background...';
    return 'Designing your new image...';
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto animate-in fade-in duration-500">
      
      <PassportDialog 
        isOpen={isPassportDialogOpen} 
        currentImageSrc={sourceImage.previewUrl}
        onClose={() => setIsPassportDialogOpen(false)} 
        onConfirm={handlePassportConfirm} 
      />

      <MergeDialog
        isOpen={isMergeDialogOpen}
        currentImageSrc={sourceImage.previewUrl}
        onClose={() => setIsMergeDialogOpen(false)}
        onConfirm={handleMergeConfirm}
      />

      {/* Top Bar: Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-gray-900/50 p-4 rounded-xl border border-gray-800">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <TrashIcon />
            <span>Clear Session</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button 
                onClick={handleSaveProgress}
                disabled={isAnyToolActive || saveStatus === 'saving'}
                className={`flex items-center gap-2 text-xs transition-colors ${
                saveStatus === 'saved' ? 'text-green-400' : 
                saveStatus === 'error' ? 'text-red-400' : 
                saveStatus === 'autosaved' ? 'text-indigo-400' :
                'text-gray-400 hover:text-white'
                }`}
            >
                {saveStatus === 'saving' ? <LoadingSpinner /> : (saveStatus === 'saved' ? <CheckIcon /> : (saveStatus === 'autosaved' ? <CheckIcon /> : <SaveIcon />))}
                <span>{saveStatus === 'saved' ? 'Saved' : (saveStatus === 'error' ? 'Storage Full' : (saveStatus === 'autosaved' ? 'Auto-saved' : 'Save'))}</span>
            </button>
            {saveStatus === 'autosaved' && (
                <span className="text-[10px] text-indigo-500/80 font-bold uppercase animate-pulse">Session Protected</span>
            )}
          </div>

          <div className="w-px h-4 bg-gray-800" />

          <button 
            onClick={handleResetToUploaded}
            disabled={isAnyToolActive}
            className="flex items-center gap-2 text-xs text-amber-500 hover:text-amber-400 transition-colors"
            title="Revert all changes to the originally uploaded photo"
          >
            <HistoryIcon />
            <span>Revert to Uploaded</span>
          </button>
        </div>
        
        <div className="flex-1 w-full md:max-xl flex gap-2">
          <div className="relative flex-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={activeMask ? "Describe change for SELECTED area..." : "Describe your AI edit..."}
                className={`w-full bg-gray-950 border text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-500 transition-all ${activeMask ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-gray-700'}`}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                disabled={appState === AppState.GENERATING || isAnyToolActive}
              />
              {activeMask && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded">Targeted</span>
                      <button onClick={() => setActiveMask(null)} className="text-gray-500 hover:text-red-400 transition-colors"><XIcon /></button>
                  </div>
              )}
          </div>
          <button
            onClick={() => handleGenerate()}
            disabled={appState === AppState.GENERATING || !prompt.trim() || isAnyToolActive}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 min-w-[140px] justify-center"
          >
            {appState === AppState.GENERATING ? <LoadingSpinner /> : <MagicWandIcon />}
            <span>{appState === AppState.GENERATING ? 'Working...' : 'AI Generate'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto min-h-[500px]">
        {/* Left: Original */}
        <div className="flex flex-col gap-3 h-full">
            <div className="flex justify-between items-center h-[32px]">
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Source Image</h3>
                </div>
                <div className="flex gap-2">
                    {!isAnyToolActive && (
                        <>
                            <button onClick={() => setIsSelecting(true)} className={`text-[10px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors border uppercase tracking-widest ${activeMask ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-gray-800 hover:bg-gray-700 text-indigo-400 border-gray-700'}`}>
                                <MousePointerIcon /> 
                                {activeMask ? 'Edit Selection' : 'Smart Select'}
                            </button>
                            <button onClick={() => setIsBackgroundMode(true)} className="text-[10px] font-bold flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-md transition-colors border border-gray-700 uppercase tracking-widest"><SparklesIcon />AI BG</button>
                            <button onClick={() => setIsTextMode(true)} className="text-[10px] font-bold flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-md transition-colors border border-gray-700 uppercase tracking-widest"><TypeIcon />Text</button>
                            <button onClick={() => setIsAdjusting(true)} className="text-[10px] font-bold flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-md transition-colors border border-gray-700 uppercase tracking-widest"><SlidersIcon />Adjust</button>
                            <button onClick={() => setIsCropping(true)} className="text-[10px] font-bold flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-md transition-colors border border-gray-700 uppercase tracking-widest"><CropIcon />Crop</button>
                        </>
                    )}
                </div>
            </div>
            
            <div className="flex-1 flex flex-col">
                {isCropping ? <ImageCropper imageSrc={sourceImage.previewUrl} onCancel={() => setIsCropping(false)} onCropComplete={handleCropComplete} /> 
                : isAdjusting ? <ImageAdjuster imageSrc={sourceImage.previewUrl} onCancel={() => setIsAdjusting(false)} onComplete={handleAdjustComplete} />
                : isBackgroundMode ? <BackgroundTool imageSrc={sourceImage.previewUrl} onCancel={() => setIsBackgroundMode(false)} onApply={handleBackgroundApply} />
                : isTextMode ? <TextTool imageSrc={sourceImage.previewUrl} onCancel={() => setIsTextMode(false)} onApply={handleTextComplete} />
                : isSelecting ? <SelectionTool imageSrc={sourceImage.previewUrl} onCancel={() => setIsSelecting(false)} onComplete={handleSelectionComplete} />
                : (
                    <div className="relative group bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 flex-1 flex items-center justify-center min-h-[400px] shadow-inner">
                        <img src={sourceImage.previewUrl} alt="Original" className="max-h-[600px] w-auto h-auto object-contain p-2"/>
                        {activeMask && (
                             <img 
                                src={`data:image/jpeg;base64,${activeMask}`} 
                                alt="Selection Overlay" 
                                className="absolute inset-0 max-h-[600px] w-auto h-auto object-contain p-2 mix-blend-screen opacity-50 pointer-events-none transition-opacity group-hover:opacity-80"
                            />
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Right: Result */}
        <div className="flex flex-col gap-3 h-full">
             <div className="flex justify-between items-center h-[32px]">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">AI Result</h3>
                  {generatedImage && isManualSheet && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20 tracking-wide uppercase">
                      <ImageIcon /> Manual Layout
                    </span>
                  )}
                </div>
                {generatedImage && (
                    <div className="relative" ref={downloadMenuRef}>
                        <button onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40">
                            <DownloadIcon /> <span>Export</span> <ChevronDownIcon />
                        </button>
                        {isDownloadMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                <button onClick={() => handleDownload('png')} className="w-full text-left px-4 py-3 hover:bg-gray-800 text-xs font-bold uppercase tracking-widest text-gray-200 hover:text-white transition-colors flex items-center justify-between"><span>PNG</span><span className="text-[10px] text-gray-500">HQ</span></button>
                                <div className="h-px bg-gray-800 mx-2"></div>
                                <button onClick={() => handleDownload('jpeg')} className="w-full text-left px-4 py-3 hover:bg-gray-800 text-xs font-bold uppercase tracking-widest text-gray-200 hover:text-white transition-colors flex items-center justify-between"><span>JPG</span><span className="text-[10px] text-gray-500">Std</span></button>
                                <div className="h-px bg-gray-800 mx-2"></div>
                                <button onClick={() => handleDownload('pdf')} className="w-full text-left px-4 py-3 hover:bg-gray-800 text-xs font-bold uppercase tracking-widest text-gray-200 hover:text-white transition-colors flex items-center justify-between"><span>PDF</span><span className="text-[10px] text-gray-500">Print</span></button>
                            </div>
                        )}
                    </div>
                )}
             </div>
            <div className="relative bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 flex-1 flex flex-col items-center justify-center min-h-[400px] shadow-inner">
              {appState === AppState.GENERATING && (
                <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4">
                  <LoadingSpinner />
                  <p className="text-indigo-400 animate-pulse text-xs font-bold uppercase tracking-widest">{getLoadingMessage()}</p>
                </div>
              )}
              
              {errorMessage ? (
                <div className="text-center p-8 max-w-sm">
                  <div className="text-red-400 mb-2 text-4xl">!</div>
                  <p className="text-red-300 text-sm font-medium">{errorMessage}</p>
                  <button onClick={() => handleGenerate()} className="mt-4 text-xs text-gray-500 uppercase font-bold hover:text-white transition-colors">Try again</button>
                </div>
              ) : generatedImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-2 group overflow-hidden">
                    <img src={sourceImage.previewUrl} alt="Source layer" className="max-h-[500px] w-auto h-auto object-contain absolute opacity-40 grayscale blur-[1px]"/>
                    <img src={sourceImage.previewUrl} alt="Source base" className="max-h-[500px] w-auto h-auto object-contain relative z-0"/>
                    <img src={generatedImage} alt="Generated" className="max-h-[500px] w-auto h-auto object-contain absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 animate-in fade-in duration-700 shadow-2xl" style={{ opacity: intensity / 100 }}/>
                </div>
              ) : (
                <div className="text-gray-700 text-center p-8 flex flex-col items-center">
                  <div className="w-12 h-12 mb-4 border-2 border-dashed border-gray-800 rounded-lg flex items-center justify-center text-gray-800"><MagicWandIcon /></div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">Ready for AI Transformation</p>
                </div>
              )}

              {generatedImage && appState === AppState.SUCCESS && !isManualSheet && (
                <div className="absolute bottom-4 left-4 right-4 bg-gray-950/80 backdrop-blur-md p-3 rounded-xl border border-gray-800 z-20 flex items-center gap-4 shadow-2xl animate-in slide-in-from-bottom-2">
                    <div className="flex flex-col gap-0.5 min-w-[100px]"><span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">AI Intensity</span><span className="text-xs text-white font-medium">{intensity}%</span></div>
                    <input type="range" min="0" max="100" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="flex-1 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"/>
                    <div className="flex gap-2"><button onClick={() => setIntensity(0)} className="text-[10px] text-gray-500 hover:text-white uppercase font-bold">Orig</button><button onClick={() => setIntensity(100)} className="text-[10px] text-gray-500 hover:text-white uppercase font-bold">AI</button></div>
                </div>
              )}
            </div>
        </div>
      </div>

      <div className="space-y-6 bg-gray-900/30 p-6 rounded-2xl border border-gray-800/50">
        <div className="flex flex-col gap-6">
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <SparklesIcon />
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">AI Quick Presets</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {QUICK_ACTIONS.filter(a => a.label !== 'Passport Photo').slice(0, 7).map((action) => (
                    <button key={action.label} onClick={() => handleQuickAction(action)} disabled={appState === AppState.GENERATING || isAnyToolActive} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-800/50 hover:bg-indigo-900/20 border border-gray-700 hover:border-indigo-500/50 transition-all text-center group disabled:opacity-50">
                    <div className="text-gray-500 group-hover:text-indigo-400 transition-colors">
                        {action.icon === 'sparkles' && <SparklesIcon />}
                        {action.icon === 'user' && <UserIcon />}
                        {action.icon === 'palette' && <PaletteIcon />}
                        {action.icon === 'film' && <div className="text-sm">🎞️</div>}
                        {action.icon === 'zap' && <div className="text-sm">⚡</div>}
                        {action.icon === 'pencil' && <div className="text-sm">✏️</div>}
                        {action.icon === 'maximize' && <MaximizeIcon />}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-200 uppercase tracking-wider">{action.label}</span>
                    </button>
                ))}
                </div>
            </div>

            <div className="pt-6 border-t border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                    <IdCardIcon />
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Professional Layouts</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => setIsPassportDialogOpen(true)} className="flex items-center gap-4 p-4 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/50 transition-all group">
                        <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-lg group-hover:scale-110 transition-transform"><IdCardIcon /></div>
                        <div className="text-left">
                            <div className="text-xs font-bold text-white uppercase tracking-widest">Passport Suite</div>
                            <div className="text-[10px] text-gray-400 font-medium">Auto-grid & print optimization</div>
                        </div>
                    </button>
                    <button onClick={() => setIsMergeDialogOpen(true)} className="flex items-center gap-4 p-4 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 hover:border-purple-500/50 transition-all group">
                        <div className="p-3 bg-purple-500/20 text-purple-400 rounded-lg group-hover:scale-110 transition-transform"><LayersIcon /></div>
                        <div className="text-left">
                            <div className="text-xs font-bold text-white uppercase tracking-widest">Merge Photos</div>
                            <div className="text-[10px] text-gray-400 font-medium">Cohesive artistic merging</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
