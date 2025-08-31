// utils/subclassLocalStorage.ts

// Interface for subclass data
export interface SubclassData {
  subclass_id: string;
  barangay_id: string | null;
  subclass: string;
  class_id: string;
}

// Keys for subclass localStorage items
export const SUBCLASS_KEYS = {
  DATA: 'subclass_data',
  TIMESTAMP: 'subclass_timestamp'
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

// Store subclass data in localStorage
export const storeSubclassData = (data: SubclassData[]): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    localStorage.setItem(SUBCLASS_KEYS.DATA, JSON.stringify(data));
    localStorage.setItem(SUBCLASS_KEYS.TIMESTAMP, Date.now().toString());
    console.log('Subclass data stored successfully');
  } catch (error) {
    console.error('Error storing subclass data in localStorage:', error);
  }
};

// Retrieve subclass data from localStorage
export const getSubclassData = (): SubclassData[] | null => {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const dataStr = localStorage.getItem(SUBCLASS_KEYS.DATA);
    if (!dataStr) return null;
    
    return JSON.parse(dataStr);
  } catch (error) {
    console.error('Error retrieving subclass data from localStorage:', error);
    return null;
  }
};

// Clear subclass data from localStorage
export const clearSubclassData = (): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    localStorage.removeItem(SUBCLASS_KEYS.DATA);
    localStorage.removeItem(SUBCLASS_KEYS.TIMESTAMP);
    console.log('Subclass data cleared successfully');
  } catch (error) {
    console.error('Error clearing subclass data from localStorage:', error);
  }
};

// Check if subclass data is fresh (less than 24 hours old)
export const isSubclassDataFresh = (): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    const timestampStr = localStorage.getItem(SUBCLASS_KEYS.TIMESTAMP);
    if (!timestampStr) return false;
    
    const timestamp = parseInt(timestampStr);
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    return (Date.now() - timestamp) < twentyFourHours;
  } catch (error) {
    console.error('Error checking subclass data freshness:', error);
    return false;
  }
};

// Get subclass data only if it's fresh
export const getFreshSubclassData = (): SubclassData[] | null => {
  const data = getSubclassData();
  const isFresh = isSubclassDataFresh();
  
  return isFresh ? data : null;
};

// Get the timestamp of when subclass data was last stored
export const getSubclassTimestamp = (): number | null => {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const timestampStr = localStorage.getItem(SUBCLASS_KEYS.TIMESTAMP);
    return timestampStr ? parseInt(timestampStr) : null;
  } catch (error) {
    console.error('Error retrieving subclass timestamp:', error);
    return null;
  }
};

// Check if subclass data exists (regardless of freshness)
export const hasSubclassData = (): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    const dataStr = localStorage.getItem(SUBCLASS_KEYS.DATA);
    return dataStr !== null;
  } catch (error) {
    console.error('Error checking for subclass data:', error);
    return false;
  }
};

// Filter subclass data by class_id
export const getSubclassesByClassId = (classId: string): SubclassData[] => {
  const data = getSubclassData();
  if (!data) return [];
  
  return data.filter(item => item.class_id === classId);
};

// Filter subclass data by barangay_id
export const getSubclassesByBarangayId = (barangayId: string): SubclassData[] => {
  const data = getSubclassData();
  if (!data) return [];
  
  return data.filter(item => item.barangay_id === barangayId);
};

// Find a specific subclass by subclass_id
export const getSubclassById = (subclassId: string): SubclassData | null => {
  const data = getSubclassData();
  if (!data) return null;
  
  return data.find(item => item.subclass_id === subclassId) || null;
};