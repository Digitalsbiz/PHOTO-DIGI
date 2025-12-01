import React, { useCallback, useState } from 'react';
import { UploadIcon, ImageIcon } from './Icons';
import { ImageFile } from '../types';
import { processImage } from '../services/geminiService';

interface ImageUploaderProps {
  onImageSelected: (image: ImageFile) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    setIsProcessing(true);

    try {
      // Optimize image (resize & compress) before sending to state/API
      const { base64, mimeType } = await processImage(file);
      const previewUrl = URL.createObjectURL(file);
      
      onImageSelected({
        file,
        previewUrl,
        base64,
        mimeType
      });
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Failed to process image file.");
    } finally {
      setIsProcessing(false);
    }
  }, [onImageSelected]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`relative group border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ease-in-out cursor-pointer
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]' 
          : 'border-gray-700 hover:border-indigo-400 hover:bg-gray-800/50 bg-gray-900/30'
        }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !isProcessing && document.getElementById('file-upload')?.click()}
    >
      <input
        id="file-upload"
        type="file"
        className="hidden"
        accept="image/*"
        onChange={onInputChange}
        disabled={isProcessing}
      />
      
      <div className="flex flex-col items-center justify-center gap-4">
        <div className={`p-4 rounded-full transition-colors duration-300 ${isDragging ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400 group-hover:text-indigo-400'}`}>
          {isProcessing ? (
             <svg className="animate-spin h-6 w-6 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : isDragging ? <UploadIcon /> : <ImageIcon />}
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium text-gray-200">
            {isProcessing ? 'Optimizing image...' : (isDragging ? 'Drop it like it\'s hot!' : 'Click or drag image here')}
          </p>
          <p className="text-sm text-gray-500">
            {isProcessing ? 'Preparing for AI magic' : 'Supports JPG, PNG, WEBP up to 10MB'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
