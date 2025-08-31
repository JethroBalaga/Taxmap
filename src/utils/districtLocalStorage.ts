// utils/districtLocalStorage.ts

// Interface for district data
export interface DistrictData {
  district_id: number;
  district_name: string;
  founded: string; // Stored as string since it's a date
}

// Keys for district localStorage items
export const DISTRICT_KEYS = {
  DATA: 'district_data',
  TIMESTAMP: 'district_timestamp'
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

// Store district data in localStorage
export const storeDistrictData = (data: DistrictData[]): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    localStorage.setItem(DISTRICT_KEYS.DATA, JSON.stringify(data));
    localStorage.setItem(DISTRICT_KEYS.TIMESTAMP, Date.now().toString());
    console.log('District data stored successfully');
  } catch (error) {
    console.error('Error storing district data in localStorage:', error);
  }
};

// Retrieve district data from localStorage
export const getDistrictData = (): DistrictData[] | null => {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const dataStr = localStorage.getItem(DISTRICT_KEYS.DATA);
    if (!dataStr) return null;
    
    return JSON.parse(dataStr);
  } catch (error) {
    console.error('Error retrieving district data from localStorage:', error);
    return null;
  }
};

// Clear district data from localStorage
export const clearDistrictData = (): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    localStorage.removeItem(DISTRICT_KEYS.DATA);
    localStorage.removeItem(DISTRICT_KEYS.TIMESTAMP);
    console.log('District data cleared successfully');
  } catch (error) {
    console.error('Error clearing district data from localStorage:', error);
  }
};

// Check if district data is fresh (less than 24 hours old)
export const isDistrictDataFresh = (): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    const timestampStr = localStorage.getItem(DISTRICT_KEYS.TIMESTAMP);
    if (!timestampStr) return false;
    
    const timestamp = parseInt(timestampStr);
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    return (Date.now() - timestamp) < twentyFourHours;
  } catch (error) {
    console.error('Error checking district data freshness:', error);
    return false;
  }
};

// Get district data only if it's fresh
export const getFreshDistrictData = (): DistrictData[] | null => {
  const data = getDistrictData();
  const isFresh = isDistrictDataFresh();
  
  return isFresh ? data : null;
};

// Check if district data exists (regardless of freshness)
export const hasDistrictData = (): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    const dataStr = localStorage.getItem(DISTRICT_KEYS.DATA);
    return dataStr !== null;
  } catch (error) {
    console.error('Error checking for district data:', error);
    return false;
  }
};

// Find a specific district by ID
export const getDistrictById = (districtId: number): DistrictData | null => {
  const data = getDistrictData();
  if (!data) return null;
  
  return data.find(item => item.district_id === districtId) || null;
};

// Find districts by name (case insensitive)
export const getDistrictsByName = (name: string): DistrictData[] => {
  const data = getDistrictData();
  if (!data) return [];
  
  const lowerName = name.toLowerCase();
  return data.filter(item => 
    item.district_name.toLowerCase().includes(lowerName)
  );
};

// Get all district names
export const getAllDistrictNames = (): string[] => {
  const data = getDistrictData();
  if (!data) return [];
  
  return data.map(item => item.district_name);
};

// Sort districts by name
export const getDistrictsSortedByName = (ascending: boolean = true): DistrictData[] => {
  const data = getDistrictData();
  if (!data) return [];
  
  return data.sort((a, b) => {
    const comparison = a.district_name.localeCompare(b.district_name);
    return ascending ? comparison : -comparison;
  });
};

// Sort districts by founding date
export const getDistrictsSortedByFoundedDate = (ascending: boolean = true): DistrictData[] => {
  const data = getDistrictData();
  if (!data) return [];
  
  return data.sort((a, b) => {
    const dateA = new Date(a.founded).getTime();
    const dateB = new Date(b.founded).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
};