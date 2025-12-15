import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';

const MAX_DIMENSION = 800;
const COMPRESSION_QUALITY = 0.6;

/**
 * Processes an image file: resizes it if it exceeds dimensions and converts to JPEG base64.
 * This ensures the payload size is within reasonable limits for the API.
 */
export const processImage = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Resize logic
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

        // Draw on white background (handles PNG transparency)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, COMPRESSION_QUALITY);
        const base64 = dataUrl.split(',')[1];

        resolve({ base64, mimeType });
        
        // Cleanup
        URL.revokeObjectURL(img.src);
      };
      img.onerror = (err) => reject(new Error("Failed to load image for processing."));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
};

interface ImageData {
    base64: string;
    mimeType: string;
}

export const generateEditedImage = async (
  imageInput: ImageData | ImageData[],
  prompt: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const inputs = Array.isArray(imageInput) ? imageInput : [imageInput];
    
    const parts: any[] = inputs.map(img => ({
        inlineData: {
            data: img.base64,
            mimeType: img.mimeType,
        }
    }));

    // Append instruction to ensure the model generates an image and doesn't just chat about it.
    parts.push({ text: `${prompt}\n\nOutput the edited image.` });

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: {
        parts: parts,
      },
    });

    // Iterate through candidates and parts to find the image
    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error("No content generated from the model.");
    }

    let generatedImageUrl = '';

    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        const base64Data = part.inlineData.data;
        const responseMimeType = part.inlineData.mimeType || 'image/png';
        generatedImageUrl = `data:${responseMimeType};base64,${base64Data}`;
        break;
      }
    }

    if (!generatedImageUrl) {
        const textPart = candidate.content.parts.find(p => p.text);
        if (textPart) {
             // Sometimes the model refuses and returns text.
             // Truncate text if it's too long for an error message
             const msg = textPart.text.length > 100 ? textPart.text.substring(0, 100) + "..." : textPart.text;
            throw new Error(`Model returned text: ${msg}`);
        }
        throw new Error("Model response did not contain an image.");
    }

    return generatedImageUrl;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Improve error messaging for common issues
    if (error.message && (error.message.includes("500") || error.message.includes("xhr error"))) {
         throw new Error("Network error: The image might be too large or the connection failed. Please try a smaller image.");
    }
    throw new Error(error.message || "Failed to generate image.");
  }
};