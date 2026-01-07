
import { SavedSession } from '../types';

const STORAGE_KEY = 'nanoedit_last_session';

export const saveSession = (session: SavedSession): boolean => {
  try {
    const serialized = JSON.stringify(session);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    console.warn("Failed to save session to localStorage (likely quota exceeded)", error);
    return false;
  }
};

export const loadSession = (): SavedSession | null => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;
    return JSON.parse(serialized) as SavedSession;
  } catch (error) {
    console.error("Failed to parse saved session", error);
    return null;
  }
};

export const clearSession = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
