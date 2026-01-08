
export interface ImageFile {
  file?: File; // File object is not serializable for localStorage
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export interface GenerationResult {
  imageUrl: string;
  prompt: string;
  timestamp: number;
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  READY_TO_EDIT = 'READY_TO_EDIT',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface QuickAction {
  label: string;
  prompt: string;
  icon: string;
}

export interface SavedSession {
  sourceImage: ImageFile;
  generatedImage: string | null;
  prompt: string;
  intensity: number;
  lastPaperSize: string;
  timestamp: number;
}

export interface SavedPassport {
  id: string;
  image: string;
  paperSize: string;
  timestamp: number;
}
