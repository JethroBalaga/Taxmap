// utils/barangayLocalStorage.ts

// Interface for barangay data
export interface BarangayData {
  barangay_id: string;
  district_id: string;
  barangay: string;
}

// Keys for barangay localStorage items
export const BARANGAY_KEYS = {
  DATA: 'barangay_data',
  TIMESTAMP: 'barangay_timestamp'
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

// Store barangay data in localStorage
export const storeBarangayData = (data: BarangayData[]): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    localStorage.setItem(BARANGAY_KEYS.DATA, JSON.stringify(data));
    localStorage.setItem(BARANGAY_KEYS.TIMESTAMP, Date.now().toString());
    console.log('Barangay data stored successfully');
  } catch (error) {
    console.error('Error storing barangay data in localStorage:', error);
  }
};

// Retrieve barangay data from localStorage
export const getBarangayData = (): BarangayData[] | null => {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const dataStr = localStorage.getItem(BARANGAY_KEYS.DATA);
    if (!dataStr) return null;
    
    return JSON.parse(dataStr);
  } catch (error) {
    console.error('Error retrieving barangay data from localStorage:', error);
    return null;
  }
};

// Clear barangay data from localStorage
export const clearBarangayData = (): void => {
  if (!isLocalStorageAvailable()) return;
  
  try {
    localStorage.removeItem(BARANGAY_KEYS.DATA);
    localStorage.removeItem(BARANGAY_KEYS.TIMESTAMP);
    console.log('Barangay data cleared successfully');
  } catch (error) {
    console.error('Error clearing barangay data from localStorage:', error);
  }
};

// Check if barangay data is fresh (less than 24 hours old)
export const isBarangayDataFresh = (): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    const timestampStr = localStorage.getItem(BARANGAY_KEYS.TIMESTAMP);
    if (!timestampStr) return false;
    
    const timestamp = parseInt(timestampStr);
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    return (Date.now() - timestamp) < twentyFourHours;
  } catch (error) {
    console.error('Error checking barangay data freshness:', error);
    return false;
  }
};

// Get barangay data only if it's fresh
export const getFreshBarangayData = (): BarangayData[] | null => {
  const data = getBarangayData();
  const isFresh = isBarangayDataFresh();
  
  return isFresh ? data : null;
};

// Check if barangay data exists (regardless of freshness)
export const hasBarangayData = (): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    const dataStr = localStorage.getItem(BARANGAY_KEYS.DATA);
    return dataStr !== null;
  } catch (error) {
    console.error('Error checking for barangay data:', error);
    return false;
  }
};

// Find a specific barangay by ID
export const getBarangayById = (barangayId: string): BarangayData | null => {
  const data = getBarangayData();
  if (!data) return null;
  
  return data.find(item => item.barangay_id === barangayId) || null;
};

// Find barangays by district ID
export const getBarangaysByDistrictId = (districtId: string): BarangayData[] => {
  const data = getBarangayData();
  if (!data) return [];
  
  return data.filter(item => item.district_id === districtId);
};

// Find barangays by name (case insensitive)
export const getBarangaysByName = (name: string): BarangayData[] => {
  const data = getBarangayData();
  if (!data) return [];
  
  const lowerName = name.toLowerCase();
  return data.filter(item => 
    item.barangay.toLowerCase().includes(lowerName)
  );
};

// Get all barangay names
export const getAllBarangayNames = (): string[] => {
  const data = getBarangayData();
  if (!data) return [];
  
  return data.map(item => item.barangay);
};

// Get all unique district IDs from barangay data
export const getUniqueDistrictIds = (): string[] => {
  const data = getBarangayData();
  if (!data) return [];
  
  const districtIds = new Set<string>();
  data.forEach(item => districtIds.add(item.district_id));
  
  return Array.from(districtIds);
};

// Sort barangays by name
export const getBarangaysSortedByName = (ascending: boolean = true): BarangayData[] => {
  const data = getBarangayData();
  if (!data) return [];
  
  return data.sort((a, b) => {
    const comparison = a.barangay.localeCompare(b.barangay);
    return ascending ? comparison : -comparison;
  });
};

// Get barangay count by district
export const getBarangayCountByDistrict = (): Record<string, number> => {
  const data = getBarangayData();
  if (!data) return {};
  
  const countMap: Record<string, number> = {};
  data.forEach(item => {
    countMap[item.district_id] = (countMap[item.district_id] || 0) + 1;
  });
  
  return countMap;
};