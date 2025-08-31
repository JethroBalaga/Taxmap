// utils/subclassRateLocalStorage.ts

// Interface for subclass rate data
export interface SubclassRateData {
  subclasrate_id: string;
  subclass_id: string;
  eff_year: number;
  rate: number;
}

// Keys for subclass rate localStorage items
export const SUBCLASS_RATE_KEYS = {
  DATA: 'subclass_rate_data',
  TIMESTAMP: 'subclass_rate_timestamp',
  YEAR: 'subclass_rate_year' // Store the year the data was fetched for
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

// Store subclass rate data in localStorage
export const storeSubclassRateData = (data: SubclassRateData[], year: number): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    localStorage.setItem(SUBCLASS_RATE_KEYS.DATA, JSON.stringify(data));
    localStorage.setItem(SUBCLASS_RATE_KEYS.TIMESTAMP, Date.now().toString());
    localStorage.setItem(SUBCLASS_RATE_KEYS.YEAR, year.toString());
    console.log('Subclass rate data stored successfully for year:', year);
  } catch (error) {
    console.error('Error storing subclass rate data in localStorage:', error);
  }
};

// Retrieve subclass rate data from localStorage
export const getSubclassRateData = (): SubclassRateData[] | null => {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const dataStr = localStorage.getItem(SUBCLASS_RATE_KEYS.DATA);
    if (!dataStr) return null;
    
    return JSON.parse(dataStr);
  } catch (error) {
    console.error('Error retrieving subclass rate data from localStorage:', error);
    return null;
  }
};

// Clear subclass rate data from localStorage
export const clearSubclassRateData = (): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    localStorage.removeItem(SUBCLASS_RATE_KEYS.DATA);
    localStorage.removeItem(SUBCLASS_RATE_KEYS.TIMESTAMP);
    localStorage.removeItem(SUBCLASS_RATE_KEYS.YEAR);
    console.log('Subclass rate data cleared successfully');
  } catch (error) {
    console.error('Error clearing subclass rate data from localStorage:', error);
  }
};

// Check if subclass rate data is fresh (less than 24 hours old) and for current year
export const isSubclassRateDataFresh = (): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    const timestampStr = localStorage.getItem(SUBCLASS_RATE_KEYS.TIMESTAMP);
    const yearStr = localStorage.getItem(SUBCLASS_RATE_KEYS.YEAR);
    
    if (!timestampStr || !yearStr) return false;
    
    const timestamp = parseInt(timestampStr);
    const storedYear = parseInt(yearStr);
    const currentYear = new Date().getFullYear();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    // Data is fresh if it's less than 24 hours old AND for the current year
    return (Date.now() - timestamp) < twentyFourHours && storedYear === currentYear;
  } catch (error) {
    console.error('Error checking subclass rate data freshness:', error);
    return false;
  }
};

// Get subclass rate data only if it's fresh
export const getFreshSubclassRateData = (): SubclassRateData[] | null => {
  const data = getSubclassRateData();
  const isFresh = isSubclassRateDataFresh();
  
  return isFresh ? data : null;
};

// Get the year for which rate data was stored
export const getStoredRateYear = (): number | null => {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const yearStr = localStorage.getItem(SUBCLASS_RATE_KEYS.YEAR);
    return yearStr ? parseInt(yearStr) : null;
  } catch (error) {
    console.error('Error retrieving stored rate year:', error);
    return null;
  }
};

// Check if subclass rate data exists (regardless of freshness)
export const hasSubclassRateData = (): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    const dataStr = localStorage.getItem(SUBCLASS_RATE_KEYS.DATA);
    return dataStr !== null;
  } catch (error) {
    console.error('Error checking for subclass rate data:', error);
    return false;
  }
};

// Filter subclass rate data by subclass_id
export const getRatesBySubclassId = (subclassId: string): SubclassRateData[] => {
  const data = getSubclassRateData();
  if (!data) return [];
  
  return data.filter(item => item.subclass_id === subclassId);
};

// Get the current rate for a specific subclass
export const getCurrentRateForSubclass = (subclassId: string): number | null => {
  const data = getSubclassRateData();
  if (!data) return null;
  
  const currentYear = new Date().getFullYear();
  const rateData = data.find(item => 
    item.subclass_id === subclassId && item.eff_year === currentYear
  );
  
  return rateData ? rateData.rate : null;
};