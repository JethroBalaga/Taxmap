// utils/actualUsedLocalStorage.ts

// Interface for actual used data
export interface ActualUsedData {
  actual_used_id: string;
  description: string;
  class_id: string;
  // Add any new columns here when you add them to the database
  // example: new_column?: string;
}

// Keys for actual used localStorage items
export const ACTUAL_USED_KEYS = {
  DATA: 'actual_used_data',
  TIMESTAMP: 'actual_used_timestamp',
  VERSION: 'actual_used_version' // Add version key
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

// Store actual used data in localStorage
export const storeActualUsedData = (data: ActualUsedData[]): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    localStorage.setItem(ACTUAL_USED_KEYS.DATA, JSON.stringify(data));
    localStorage.setItem(ACTUAL_USED_KEYS.TIMESTAMP, Date.now().toString());
    localStorage.setItem(ACTUAL_USED_KEYS.VERSION, CURRENT_VERSION); // Store version
    console.log('Actual used data stored successfully (version:', CURRENT_VERSION, ')');
  } catch (error) {
    console.error('Error storing actual used data in localStorage:', error);
  }
};

// Retrieve actual used data from localStorage
export const getActualUsedData = (): ActualUsedData[] | null => {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const dataStr = localStorage.getItem(ACTUAL_USED_KEYS.DATA);
    if (!dataStr) return null;
    
    return JSON.parse(dataStr);
  } catch (error) {
    console.error('Error retrieving actual used data from localStorage:', error);
    return null;
  }
};

// Check if actual used data is fresh (less than 24 hours old) AND matches current version
export const isActualUsedDataFresh = (): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    const timestampStr = localStorage.getItem(ACTUAL_USED_KEYS.TIMESTAMP);
    const storedVersion = localStorage.getItem(ACTUAL_USED_KEYS.VERSION);
    
    if (!timestampStr || !storedVersion) return false;
    
    const timestamp = parseInt(timestampStr);
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Check if data is outdated OR version mismatch
    const isRecent = (Date.now() - timestamp) < twentyFourHours;
    const isCurrentVersion = storedVersion === CURRENT_VERSION;
    
    if (isRecent && !isCurrentVersion) {
      console.log('Actual used data is recent but outdated version. Clearing cache.');
      clearActualUsedData();
      return false;
    }
    
    return isRecent && isCurrentVersion;
  } catch (error) {
    console.error('Error checking actual used data freshness:', error);
    return false;
  }
};

// Clear actual used data from localStorage
export const clearActualUsedData = (): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    localStorage.removeItem(ACTUAL_USED_KEYS.DATA);
    localStorage.removeItem(ACTUAL_USED_KEYS.TIMESTAMP);
    localStorage.removeItem(ACTUAL_USED_KEYS.VERSION);
    console.log('Actual used data cleared successfully');
  } catch (error) {
    console.error('Error clearing actual used data from localStorage:', error);
  }
};

// Get the current version
export const getCurrentActualUsedVersion = (): string => {
  return CURRENT_VERSION;
};

// Get the stored version
export const getStoredActualUsedVersion = (): string | null => {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    return localStorage.getItem(ACTUAL_USED_KEYS.VERSION);
  } catch (error) {
    console.error('Error retrieving actual used version:', error);
    return null;
  }
};

// Get actual used data only if it's fresh
export const getFreshActualUsedData = (): ActualUsedData[] | null => {
  const data = getActualUsedData();
  const isFresh = isActualUsedDataFresh();
  
  return isFresh ? data : null;
};

// Check if actual used data exists (regardless of freshness)
export const hasActualUsedData = (): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    const dataStr = localStorage.getItem(ACTUAL_USED_KEYS.DATA);
    return dataStr !== null;
  } catch (error) {
    console.error('Error checking for actual used data:', error);
    return false;
  }
};

// Filter actual used data by class_id
export const getActualUsedByClassId = (classId: string): ActualUsedData[] => {
  const data = getActualUsedData();
  if (!data) return [];
  
  return data.filter(item => item.class_id === classId);
};

// Find a specific actual used by ID
export const getActualUsedById = (actualUsedId: string): ActualUsedData | null => {
  const data = getActualUsedData();
  if (!data) return null;
  
  return data.find(item => item.actual_used_id === actualUsedId) || null;
};

// Get all unique class IDs from actual used data
export const getUniqueClassIds = (): string[] => {
  const data = getActualUsedData();
  if (!data) return [];
  
  const classIds = new Set<string>();
  data.forEach(item => classIds.add(item.class_id));
  
  return Array.from(classIds);
};