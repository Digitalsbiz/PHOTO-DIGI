
/**
 * Applies brightness, contrast, sharpness, and standard color filters to an image.
 * This runs entirely on the client side (No AI).
 */

export type FilterType = 'none' | 'grayscale' | 'sepia' | 'invert' | 'vintage';

export const applyImageAdjustments = async (
    imageSrc: string,
    brightness: number,
    contrast: number,
    sharpness: number = 0,
    filterType: FilterType = 'none'
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const MAX_DIMENSION = 800;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }
        
        // Construct CSS filter string
        let filterString = `brightness(${brightness}%) contrast(${contrast}%)`;
        
        if (filterType === 'grayscale') filterString += ' grayscale(100%)';
        if (filterType === 'sepia') filterString += ' sepia(100%)';
        if (filterType === 'invert') filterString += ' invert(100%)';
        if (filterType === 'vintage') filterString += ' sepia(30%) contrast(110%) brightness(110%) saturate(130%)';

        ctx.filter = filterString;
        ctx.drawImage(img, 0, 0, width, height);
        ctx.filter = 'none';
  
        // Apply Sharpening (Convolution)
        if (sharpness > 0) {
          const w = canvas.width;
          const h = canvas.height;
          const imageData = ctx.getImageData(0, 0, w, h);
          const data = imageData.data;
          const buff = new Uint8ClampedArray(data);
          const s = sharpness / 100.0; 
  
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const idx = (y * w + x) * 4;
              const up    = ((y > 0 ? y - 1 : y) * w + x) * 4;
              const down  = ((y < h - 1 ? y + 1 : y) * w + x) * 4;
              const left  = (y * w + (x > 0 ? x - 1 : x)) * 4;
              const right = (y * w + (x < w - 1 ? x + 1 : x)) * 4;
  
              for (let i = 0; i < 3; i++) {
                const val = buff[idx + i] * (1 + 4 * s) - 
                            s * (buff[up + i] + buff[down + i] + buff[left + i] + buff[right + i]);
                data[idx + i] = val; 
              }
            }
          }
          ctx.putImageData(imageData, 0, 0);
        }
        
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = (e) => reject(e);
      img.src = imageSrc;
    });
  };
