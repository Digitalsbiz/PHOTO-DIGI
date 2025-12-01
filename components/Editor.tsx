import React, { useState } from 'react';
import { ImageFile, AppState, QuickAction } from '../types';
import { generateEditedImage } from '../services/geminiService';
import { QUICK_ACTIONS } from '../constants';
import { MagicWandIcon, LoadingSpinner, TrashIcon, DownloadIcon, ChevronRight, SparklesIcon, IdCardIcon, CropIcon, SlidersIcon, CircleHalfIcon, DropletIcon, ArrowRightLeftIcon, UserIcon, MaximizeIcon, PaletteIcon, PaintBucketIcon } from './Icons';
import ImageCropper from './ImageCropper';
import ImageAdjuster from './ImageAdjuster';
import BackgroundTool from './BackgroundTool';
import PassportDialog from './PassportDialog';

interface EditorProps {
  initialImage: ImageFile;
  onReset: () => void;
}

const Editor: React.FC<EditorProps> = ({ initialImage, onReset }) => {
  // We maintain a local source image state so we can update it after cropping/adjusting
  const [sourceImage, setSourceImage] = useState<ImageFile>(initialImage);
  const [isCropping, setIsCropping] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isBackgroundMode, setIsBackgroundMode] = useState(false);
  const [isPassportDialogOpen, setIsPassportDialogOpen] = useState(false);
  
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.READY_TO_EDIT);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async (selectedPrompt?: string) => {
    const promptToUse = selectedPrompt || prompt;
    if (!promptToUse.trim()) return;

    setAppState(AppState.GENERATING);
    setErrorMessage(null);

    try {
      const resultBase64 = await generateEditedImage(
        sourceImage.base64,
        sourceImage.mimeType,
        promptToUse
      );

      setGeneratedImage(resultBase64);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Something went wrong while generating.');
      setAppState(AppState.ERROR);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    // Intercept Passport Photo action to show dialog
    if (action.label === 'Passport Photo') {
      setIsPassportDialogOpen(true);
      return;
    }

    setPrompt(action.prompt);
    handleGenerate(action.prompt);
  };

  const handlePassportConfirm = (quantity: number, paperSize: string, dimensions: string, format: string) => {
    setIsPassportDialogOpen(false);
    const passportPrompt = `Create a printable image sheet formatted for ${paperSize} paper, containing exactly ${quantity} distinct copies of the subject, arranged in a neat grid. Each copy must be formatted as a standard ${dimensions} passport photo (portrait orientation) with a ${format}. Ensure consistent spacing between photos for easy cutting. The subject should be centered and facing forward in each copy.`;
    setPrompt(passportPrompt);
    handleGenerate(passportPrompt);
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `nanoedit-result-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCropComplete = (croppedBase64: string) => {
    const mimeType = 'image/jpeg';
    const previewUrl = `data:${mimeType};base64,${croppedBase64}`;

    setSourceImage({
      ...sourceImage,
      base64: croppedBase64,
      mimeType: mimeType,
      previewUrl: previewUrl
    });
    setIsCropping(false);
    setGeneratedImage(null);
    setAppState(AppState.READY_TO_EDIT);
  };

  const handleAdjustComplete = (adjustedBase64: string) => {
    const mimeType = 'image/jpeg';
    const previewUrl = `data:${mimeType};base64,${adjustedBase64}`;
    
    setSourceImage({
      ...sourceImage,
      base64: adjustedBase64,
      mimeType: mimeType,
      previewUrl: previewUrl
    });
    setIsAdjusting(false);
    setGeneratedImage(null);
    setAppState(AppState.READY_TO_EDIT);
  };

  const handleBackgroundApply = (bgPrompt: string) => {
    setIsBackgroundMode(false);
    setPrompt(bgPrompt);
    handleGenerate(bgPrompt);
  };

  const isAnyToolActive = isCropping || isAdjusting || isBackgroundMode;

  const getLoadingMessage = () => {
    const p = prompt.toLowerCase();
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
        onClose={() => setIsPassportDialogOpen(false)} 
        onConfirm={handlePassportConfirm} 
      />

      {/* Top Bar: Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-gray-900/50 p-4 rounded-xl border border-gray-800">
        <button 
          onClick={onReset}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <TrashIcon />
          <span>Start Over</span>
        </button>
        
        <div className="flex-1 w-full md:max-w-2xl flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your edit (e.g., 'Make it look like a Van Gogh painting')"
            className="flex-1 bg-gray-950 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-500"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            disabled={appState === AppState.GENERATING || isAnyToolActive}
          />
          <button
            onClick={() => handleGenerate()}
            disabled={appState === AppState.GENERATING || !prompt.trim() || isAnyToolActive}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 min-w-[140px] justify-center"
          >
            {appState === AppState.GENERATING ? <LoadingSpinner /> : <MagicWandIcon />}
            <span>{appState === AppState.GENERATING ? 'Working...' : 'Generate'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto min-h-[500px]">
        
        {/* Left: Original / Editor Mode */}
        <div className="flex flex-col gap-3 h-full">
            <div className="flex justify-between items-center h-[32px]">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Original</h3>
                <div className="flex gap-2">
                    {!isAnyToolActive && (
                        <>
                            <button 
                                onClick={() => setIsBackgroundMode(true)}
                                className="text-xs flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-md transition-colors border border-gray-700"
                            >
                                <PaintBucketIcon />
                                Background
                            </button>
                            <button 
                                onClick={() => setIsAdjusting(true)}
                                className="text-xs flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-md transition-colors border border-gray-700"
                            >
                                <SlidersIcon />
                                Adjust
                            </button>
                            <button 
                                onClick={() => setIsCropping(true)}
                                className="text-xs flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-md transition-colors border border-gray-700"
                            >
                                <CropIcon />
                                Crop
                            </button>
                        </>
                    )}
                </div>
            </div>
            
            <div className="flex-1 flex flex-col">
                {isCropping ? (
                    <ImageCropper 
                        imageSrc={sourceImage.previewUrl} 
                        onCancel={() => setIsCropping(false)} 
                        onCropComplete={handleCropComplete} 
                    />
                ) : isAdjusting ? (
                    <ImageAdjuster 
                        imageSrc={sourceImage.previewUrl} 
                        onCancel={() => setIsAdjusting(false)} 
                        onComplete={handleAdjustComplete} 
                    />
                ) : isBackgroundMode ? (
                    <BackgroundTool
                        imageSrc={sourceImage.previewUrl}
                        onCancel={() => setIsBackgroundMode(false)}
                        onApply={handleBackgroundApply}
                    />
                ) : (
                    <div className="relative group bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 flex-1 flex items-center justify-center min-h-[400px]">
                        <img 
                          src={sourceImage.previewUrl} 
                          alt="Original" 
                          className="max-h-[600px] w-auto h-auto object-contain p-2"
                        />
                    </div>
                )}
            </div>
        </div>

        {/* Right: Result */}
        <div className="flex flex-col gap-3 h-full">
             <div className="flex justify-between items-center h-[32px]">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Result</h3>
                {generatedImage && (
                    <button 
                        onClick={downloadImage} 
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <DownloadIcon /> 
                        <span>Download</span>
                    </button>
                )}
             </div>
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 flex-1 flex items-center justify-center min-h-[400px]">
              {appState === AppState.GENERATING && (
                <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4">
                  <LoadingSpinner />
                  <p className="text-indigo-400 animate-pulse">{getLoadingMessage()}</p>
                </div>
              )}
              
              {errorMessage ? (
                <div className="text-center p-8 max-w-sm">
                  <div className="text-red-400 mb-2 text-4xl">!</div>
                  <p className="text-red-300">{errorMessage}</p>
                  <button 
                    onClick={() => handleGenerate()} 
                    className="mt-4 text-sm text-gray-400 underline hover:text-white"
                  >
                    Try again
                  </button>
                </div>
              ) : generatedImage ? (
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="max-h-[600px] w-auto h-auto object-contain p-2 animate-in fade-in duration-700"
                />
              ) : (
                <div className="text-gray-600 text-center p-8">
                  <div className="mx-auto w-12 h-12 mb-4 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center">
                    <ChevronRight />
                  </div>
                  <p>Your creation will appear here</p>
                </div>
              )}
            </div>
        </div>
      </div>

      {/* Footer: Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-400">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action)}
              disabled={appState === AppState.GENERATING || isAnyToolActive}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-indigo-500/50 transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-gray-400 group-hover:text-indigo-400 transition-colors">
                 {action.icon === 'sparkles' && <SparklesIcon />}
                 {action.icon === 'id-card' && <IdCardIcon />}
                 {action.icon === 'film' && <div className="text-xl">🎞️</div>}
                 {action.icon === 'zap' && <div className="text-xl">⚡</div>}
                 {action.icon === 'pencil' && <div className="text-xl">✏️</div>}
                 {action.icon === 'scissors' && <div className="text-xl">✂️</div>}
                 {action.icon === 'sun' && <div className="text-xl">☀️</div>}
                 {action.icon === 'grayscale' && <CircleHalfIcon />}
                 {action.icon === 'sepia' && <DropletIcon />}
                 {action.icon === 'invert' && <ArrowRightLeftIcon />}
                 {action.icon === 'user' && <UserIcon />}
                 {action.icon === 'maximize' && <MaximizeIcon />}
                 {action.icon === 'palette' && <PaletteIcon />}
              </div>
              <span className="text-xs font-medium text-gray-300">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Editor;