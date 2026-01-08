
import { SavedSession, SavedPassport } from '../types';

const STORAGE_KEY = 'nanoedit_last_session';
const GALLERY_KEY = 'nanoedit_passport_gallery';
const MAX_GALLERY_ITEMS = 5;

export const saveSession = (session: SavedSession): boolean => {
  try {
    const serialized = JSON.stringify(session);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    console.warn("Failed to save session to localStorage", error);
    return false;
  }
};

export const loadSession = (): SavedSession | null => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;
    return JSON.parse(serialized) as SavedSession;
  } catch (error) {
    return null;
  }
};

export const clearSession = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

// Passport Gallery Functions
export const savePassportToGallery = (passport: SavedPassport): boolean => {
  try {
    const gallery = getPassportGallery();
    // Prepend new item
    const updatedGallery = [passport, ...gallery].slice(0, MAX_GALLERY_ITEMS);
    localStorage.setItem(GALLERY_KEY, JSON.stringify(updatedGallery));
    return true;
  } catch (error) {
    console.warn("Gallery storage failed (likely quota exceeded)", error);
    return false;
  }
};

export const getPassportGallery = (): SavedPassport[] => {
  try {
    const serialized = localStorage.getItem(GALLERY_KEY);
    if (!serialized) return [];
    return JSON.parse(serialized);
  } catch (error) {
    return [];
  }
};

export const deletePassportFromGallery = (id: string): void => {
  const gallery = getPassportGallery();
  const updatedGallery = gallery.filter(item => item.id !== id);
  localStorage.setItem(GALLERY_KEY, JSON.stringify(updatedGallery));
};
