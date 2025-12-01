import React, { useState } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import Editor from './components/Editor';
import { ImageFile } from './types';

const App: React.FC = () => {
  const [image, setImage] = useState<ImageFile | null>(null);

  const handleImageSelected = (selectedImage: ImageFile) => {
    setImage(selectedImage);
  };

  const handleReset = () => {
    setImage(null);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 font-sans selection:bg-indigo-500/30">
      <Header />
      
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

            <div className="w-full max-w-xl">
              <ImageUploader onImageSelected={handleImageSelected} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center w-full max-w-4xl pt-8 border-t border-gray-800/50">
                <div className="p-4 rounded-lg bg-gray-900/30 border border-gray-800/50">
                    <div className="font-semibold text-indigo-400 mb-1">Fast</div>
                    <div className="text-sm text-gray-500">Optimized for speed with Flash model</div>
                </div>
                <div className="p-4 rounded-lg bg-gray-900/30 border border-gray-800/50">
                    <div className="font-semibold text-purple-400 mb-1">Creative</div>
                    <div className="text-sm text-gray-500">Understanding of complex stylistic prompts</div>
                </div>
                <div className="p-4 rounded-lg bg-gray-900/30 border border-gray-800/50">
                    <div className="font-semibold text-pink-400 mb-1">Precise</div>
                    <div className="text-sm text-gray-500">Maintains subject integrity while editing</div>
                </div>
            </div>
          </div>
        ) : (
          <Editor initialImage={image} onReset={handleReset} />
        )}
      </main>
      
      <footer className="py-8 text-center text-sm text-gray-600 border-t border-gray-900 mt-auto">
        <p>Built with React, Tailwind & Gemini API</p>
      </footer>
    </div>
  );
};

export default App;
