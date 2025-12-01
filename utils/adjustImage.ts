
/**
 * Applies brightness, contrast, and sharpness filters to an image and returns the new base64 string.
 * @param imageSrc The source image URL/Base64
 * @param brightness Brightness percentage (0-200, default 100)
 * @param contrast Contrast percentage (0-200, default 100)
 * @param sharpness Sharpness amount (0-200, default 0)
 */
export const applyImageAdjustments = async (
    imageSrc: string,
    brightness: number,
    contrast: number,
    sharpness: number = 0
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const MAX_DIMENSION = 800;

        // Resize logic to ensure edited images stay within safe API limits
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
        
        // Apply CSS-standard filters first (brightness & contrast)
        // brightness and contrast are percentages (e.g., 100)
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Reset filter
        ctx.filter = 'none';
  
        // Apply Sharpening (Convolution) if needed
        if (sharpness > 0) {
          const w = canvas.width;
          const h = canvas.height;
          const imageData = ctx.getImageData(0, 0, w, h);
          const data = imageData.data;
          const buff = new Uint8ClampedArray(data); // Copy for reading
          
          // Normalize sharpness 0-200 to a kernel weight factor
          // A generic sharpen kernel:
          //  0  -k  0
          // -k 1+4k -k
          //  0  -k  0
          const s = sharpness / 100.0; 
  
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const idx = (y * w + x) * 4;
              
              // Identify neighbors (clamping to edges)
              const up    = ((y > 0 ? y - 1 : y) * w + x) * 4;
              const down  = ((y < h - 1 ? y + 1 : y) * w + x) * 4;
              const left  = (y * w + (x > 0 ? x - 1 : x)) * 4;
              const right = (y * w + (x < w - 1 ? x + 1 : x)) * 4;
  
              // Apply kernel to RGB channels
              for (let i = 0; i < 3; i++) {
                const val = buff[idx + i] * (1 + 4 * s) - 
                            s * (buff[up + i] + buff[down + i] + buff[left + i] + buff[right + i]);
                data[idx + i] = val; 
              }
              // Alpha channel (data[idx+3]) remains unchanged
            }
          }
          
          ctx.putImageData(imageData, 0, 0);
        }
        
        // Export as JPEG with reduced quality
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (e) => reject(e);
      img.src = imageSrc;
    });
  };