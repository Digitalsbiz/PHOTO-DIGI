
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import Editor from './components/Editor';
import { ImageFile, SavedSession } from './types';
import { loadSession, clearSession } from './services/storageService';
import { HistoryIcon, TrashIcon } from './components/Icons';

const App: React.FC = () => {
  const [image, setImage] = useState<ImageFile | null>(null);
  const [restoredSession, setRestoredSession] = useState<SavedSession | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const saved = loadSession();
    if (saved) {
      setRestoredSession(saved);
    }
    setHasCheckedSession(true);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleImageSelected = (selectedImage: ImageFile) => {
    setImage(selectedImage);
    setRestoredSession(null);
  };

  const handleRestoreSession = () => {
    if (restoredSession) {
      setImage(restoredSession.sourceImage);
    }
  };

  const handleDiscardSavedSession = () => {
    clearSession();
    setRestoredSession(null);
  };

  const handleReset = () => {
    setImage(null);
    setRestoredSession(null);
  };

  if (!hasCheckedSession) return null;

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 font-sans selection:bg-indigo-500/30">
      <Header isOnline={isOnline} />
      
      {!isOnline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-2 px-4 text-center">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Working Offline: Local tools available. AI features require internet.
          </p>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!image ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            <div className="text-center space-y-4 max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Transform images with <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                  natural language
                </span>
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed">
                Upload a photo and simply describe how you want to change it. 
                Powered by Google's Gemini 2.5 Flash Image model for instant, high-quality edits.
              </p>
            </div>

            {restoredSession && (
              <div className="w-full max-w-xl bg-indigo-900/10 border border-indigo-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-gray-900 rounded-lg border border-gray-800 overflow-hidden flex-shrink-0">
                  <img 
                    src={restoredSession.generatedImage || restoredSession.sourceImage.previewUrl} 
                    alt="Restored Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <h4 className="font-semibold text-white flex items-center justify-center md:justify-start gap-2">
                    <HistoryIcon /> Restore Previous Session?
                  </h4>
                  <p className="text-sm text-gray-400">
                    You have a saved session from {new Date(restoredSession.timestamp).toLocaleTimeString()}.
                  </p>
                  <div className="flex gap-3 justify-center md:justify-start pt-2">
                    <button 
                      onClick={handleRestoreSession}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Restore Session
                    </button>
                    <button 
                      onClick={handleDiscardSavedSession}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <TrashIcon /> Discard
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="w-full max-w-xl">
              <ImageUploader onImageSelected={handleImageSelected} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center w-full max-w-4xl pt-8 border-t border-gray-800/50">
                <div className="p-4 rounded-lg bg-gray-900/30 border border-gray-800/50">
                    <div className="font-semibold text-indigo-400 mb-1">Local Processing</div>
                    <div className="text-sm text-gray-500">Crop, Adjust, and Text tools work offline</div>
                </div>
                <div className="p-4 rounded-lg bg-gray-900/30 border border-gray-800/50">
                    <div className="font-semibold text-purple-400 mb-1">AI Ready</div>
                    <div className="text-sm text-gray-500">Instantly edit via Gemini when connected</div>
                </div>
                <div className="p-4 rounded-lg bg-gray-900/30 border border-gray-800/50">
                    <div className="font-semibold text-pink-400 mb-1">Permanent</div>
                    <div className="text-sm text-gray-500">Autosaves your progress in the browser</div>
                </div>
            </div>
          </div>
        ) : (
          <Editor 
            initialImage={image} 
            initialGeneratedImage={restoredSession?.generatedImage}
            initialPrompt={restoredSession?.prompt}
            initialIntensity={restoredSession?.intensity}
            initialPaperSize={restoredSession?.lastPaperSize}
            onReset={handleReset} 
            isOnline={isOnline}
          />
        )}
      </main>
      
      <footer className="py-8 text-center text-sm text-gray-600 border-t border-gray-900 mt-auto">
        <p>Built with React, Tailwind & Gemini API • Fully Offline Capable</p>
      </footer>
    </div>
  );
};

export default App;
