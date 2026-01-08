import React, { useState } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg, { PixelCrop } from '../utils/cropImage';
import { CheckIcon, XIcon, LoadingSpinner } from './Icons';

interface ImageCropperProps {
  imageSrc: string;
  onCancel: () => void;
  onCropComplete: (croppedBase64: string) => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCancel, onCropComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropAreaChange = (_croppedArea: any, croppedAreaPixels: PixelCrop) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      // Extract base64 data part (remove "data:image/jpeg;base64,")
      const base64Data = croppedImage.split(',')[1];
      onCropComplete(base64Data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 flex flex-col">
      <div className="relative flex-1 bg-black/50">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={undefined} // Free crop
          onCropChange={onCropChange}
          onCropComplete={onCropAreaChange}
          onZoomChange={onZoomChange}
          style={{
            containerStyle: { background: '#0d1117' },
            cropAreaStyle: { border: '2px solid #6366f1' } // Indigo-500
          }}
        />
      </div>
      
      <div className="bg-gray-900 p-4 flex items-center justify-between gap-4 z-10 border-t border-gray-800">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-xs font-medium text-gray-400">Zoom</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
        
        <div className="flex gap-2">
           <button
             onClick={onCancel}
             disabled={isProcessing}
             className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
             title="Cancel"
           >
             <XIcon />
           </button>
           <button
             onClick={handleSave}
             disabled={isProcessing}
             className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center gap-2"
             title="Apply Crop"
           >
             {isProcessing ? <LoadingSpinner /> : <CheckIcon />}
           </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;