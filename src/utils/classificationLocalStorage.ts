// utils/classificationLocalStorage.ts

// Interface for classification data
export interface ClassificationData {
  class_id: string;
  classification: string;
  // Add any new columns here when you add them to the database
  // example: new_column?: string;
}

// Keys for classification localStorage items
export const CLASSIFICATION_KEYS = {
  DATA: 'classification_data',
  TIMESTAMP: 'classification_timestamp',
  VERSION: 'classification_version' // Add version key
};

// CURRENT VERSION - INCREMENT THIS WHEN YOU ADD NEW COLUMNS
const CURRENT_VERSION = '1.1'; // Change this when your schema changes

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
    localStorage.setItem(CLASSIFICATION_KEYS.VERSION, CURRENT_VERSION); // Store version
    console.log('Classification data stored successfully (version:', CURRENT_VERSION, ')');
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

// Check if classification data is fresh (less than 24 hours old) AND matches current version
export const isClassificationDataFresh = (): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    const timestampStr = localStorage.getItem(CLASSIFICATION_KEYS.TIMESTAMP);
    const storedVersion = localStorage.getItem(CLASSIFICATION_KEYS.VERSION);
    
    if (!timestampStr || !storedVersion) return false;
    
    const timestamp = parseInt(timestampStr);
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Check if data is outdated OR version mismatch
    const isRecent = (Date.now() - timestamp) < twentyFourHours;
    const isCurrentVersion = storedVersion === CURRENT_VERSION;
    
    if (isRecent && !isCurrentVersion) {
      console.log('Data is recent but outdated version. Clearing cache.');
      clearClassificationData();
      return false;
    }
    
    return isRecent && isCurrentVersion;
  } catch (error) {
    console.error('Error checking classification data freshness:', error);
    return false;
  }
};

// Clear classification data from localStorage
export const clearClassificationData = (): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    localStorage.removeItem(CLASSIFICATION_KEYS.DATA);
    localStorage.removeItem(CLASSIFICATION_KEYS.TIMESTAMP);
    localStorage.removeItem(CLASSIFICATION_KEYS.VERSION);
    console.log('Classification data cleared successfully');
  } catch (error) {
    console.error('Error clearing classification data from localStorage:', error);
  }
};

// Get the current version
export const getCurrentClassificationVersion = (): string => {
  return CURRENT_VERSION;
};

// Get the stored version
export const getStoredClassificationVersion = (): string | null => {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    return localStorage.getItem(CLASSIFICATION_KEYS.VERSION);
  } catch (error) {
    console.error('Error retrieving classification version:', error);
    return null;
  }
};

// ... rest of your functions remain the same ...

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