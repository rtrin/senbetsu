// import { STORAGE_KEYS } from './constants';

// async function get<T>(key: string, fallback: T): Promise<T> {
//   const result = await chrome.storage.local.get(key);
//   return (result[key] as T) ?? fallback;
// }

// async function set(key: string, value: unknown): Promise<void> {
//   await chrome.storage.local.set({ [key]: value });
// }

export const storage = {
  // Add other storage methods here as needed in the future
};
