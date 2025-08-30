// utils/classificationLocalStorage.ts

// Interface for classification data
export interface ClassificationData {
  class_id: string;
  classification: string;
}

// Keys for classification localStorage items
export const CLASSIFICATION_KEYS = {
  DATA: 'classification_data',
  TIMESTAMP: 'classification_timestamp'
};

// Check if localStorage is available
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

// Store classification data in localStorage
export const storeClassificationData = (data: ClassificationData[]): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    localStorage.setItem(CLASSIFICATION_KEYS.DATA, JSON.stringify(data));
    localStorage.setItem(CLASSIFICATION_KEYS.TIMESTAMP, Date.now().toString());
    console.log('Classification data stored successfully');
  } catch (error) {
    console.error('Error storing classification data in localStorage:', error);
  }
};

// Retrieve classification data from localStorage
export const getClassificationData = (): ClassificationData[] | null => {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const dataStr = localStorage.getItem(CLASSIFICATION_KEYS.DATA);
    if (!dataStr) return null;
    
    return JSON.parse(dataStr);
  } catch (error) {
    console.error('Error retrieving classification data from localStorage:', error);
    return null;
  }
};

// Clear classification data from localStorage
export const clearClassificationData = (): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    localStorage.removeItem(CLASSIFICATION_KEYS.DATA);
    localStorage.removeItem(CLASSIFICATION_KEYS.TIMESTAMP);
    console.log('Classification data cleared successfully');
  } catch (error) {
    console.error('Error clearing classification data from localStorage:', error);
  }
};

// Check if classification data is fresh (less than 24 hours old)
export const isClassificationDataFresh = (): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    const timestampStr = localStorage.getItem(CLASSIFICATION_KEYS.TIMESTAMP);
    if (!timestampStr) return false;
    
    const timestamp = parseInt(timestampStr);
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    return (Date.now() - timestamp) < twentyFourHours;
  } catch (error) {
    console.error('Error checking classification data freshness:', error);
    return false;
  }
};

// Get classification data only if it's fresh
export const getFreshClassificationData = (): ClassificationData[] | null => {
  const data = getClassificationData();
  const isFresh = isClassificationDataFresh();
  
  return isFresh ? data : null;
};

// Get the timestamp of when classification data was last stored
export const getClassificationTimestamp = (): number | null => {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const timestampStr = localStorage.getItem(CLASSIFICATION_KEYS.TIMESTAMP);
    return timestampStr ? parseInt(timestampStr) : null;
  } catch (error) {
    console.error('Error retrieving classification timestamp:', error);
    return null;
  }
};

// Check if classification data exists (regardless of freshness)
export const hasClassificationData = (): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    const dataStr = localStorage.getItem(CLASSIFICATION_KEYS.DATA);
    return dataStr !== null;
  } catch (error) {
    console.error('Error checking for classification data:', error);
    return false;
  }
};