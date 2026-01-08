import { QuickAction } from './types';

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-image';

export const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Restore Photo', prompt: 'Professionally restore this old, damaged, or low-quality photograph. Remove noise, grain, scratches, and digital artifacts. Enhance sharpness, clarity, and facial details while preserving the original character and realism.', icon: 'history' },
  { label: 'Enhance Details', prompt: 'Enhance the details and clarity of this image, making it look high definition.', icon: 'sparkles' },
  { label: 'Studio Portrait', prompt: 'Create a hyper-realistic, high-resolution portrait based on this photo. Keep the same person, identity, hairstyle, clothing and natural skin tone from the original, with a neutral studio background.', icon: 'user' },
  { label: 'Passport Photo', prompt: 'Crop and resize the subject to standard passport photo dimensions (portrait aspect ratio), ensuring a plain white background and the subject is centered facing forward.', icon: 'id-card' },
  { label: 'Colorize', prompt: 'Add color to this black and white image, maintaining the original detail and realism.', icon: 'palette' },
  { label: 'Vintage Look', prompt: 'Apply a vintage 1980s film filter to this image with grain and warm tones.', icon: 'film' },
  { label: 'Grayscale', prompt: 'Convert this image to grayscale, removing all color information while maintaining contrast.', icon: 'grayscale' },
  { label: 'Sepia Tone', prompt: 'Apply a classic sepia tone filter to this image for an antique, old-fashioned look.', icon: 'sepia' },
  { label: 'Invert Colors', prompt: 'Invert all the colors in this image to create a negative effect.', icon: 'invert' },
  { label: 'Cyberpunk', prompt: 'Transform this image into a cyberpunk style with neon lights, dark shadows, and futuristic elements.', icon: 'zap' },
  { label: 'Sketch', prompt: 'Convert this image into a detailed pencil sketch drawing.', icon: 'pencil' },
  { label: 'Remove Background', prompt: 'Remove the background of this image, leaving only the main subject on a solid color or transparent background.', icon: 'scissors' },
  { label: 'Fix Lighting', prompt: 'Correct the lighting in this image, balancing shadows and highlights for a professional look.', icon: 'sun' },
  { label: 'AI Upscale', prompt: 'Upscale this image using AI to increase resolution and detail while maintaining realism.', icon: 'maximize' },
];