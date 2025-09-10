// src/utils/ValueInfoLocalStorage.ts

export interface ValueInfo {
  id: string; // Random primary key
  formDataId: string; // Reference to FormData id
  photoTagId: string; // Reference to PhotoTagData id
  status: string; // Status string
}

const VALUE_INFO_KEY = 'valueInfo';

// Helper function to generate random string ID (consistent with other storage utilities)
const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export const ValueInfoLocalStorage = {
  // Get ALL value info entries from localStorage
  getAllValueInfo: (): ValueInfo[] => {
    try {
      const storedData = localStorage.getItem(VALUE_INFO_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Handle both array format and legacy single object format
        if (Array.isArray(parsedData)) {
          return parsedData;
        } else if (parsedData && typeof parsedData === 'object' && parsedData.id) {
          // Convert legacy single object to array
          const convertedData = [parsedData];
          // Update storage to new format
          localStorage.setItem(VALUE_INFO_KEY, JSON.stringify(convertedData));
          return convertedData;
        }
      }
      return [];
    } catch (error) {
      console.error('Error retrieving value info from localStorage:', error);
      return [];
    }
  },

  // Save ALL value info entries to localStorage
  saveAllValueInfo: (valueInfo: ValueInfo[]): void => {
    try {
      localStorage.setItem(VALUE_INFO_KEY, JSON.stringify(valueInfo));
    } catch (error) {
      console.error('Error saving value info to localStorage:', error);
    }
  },

  // Get a specific value info by ID
  getValueInfo: (id: string): ValueInfo | null => {
    try {
      const allValueInfo = ValueInfoLocalStorage.getAllValueInfo();
      return allValueInfo.find(info => info.id === id) || null;
    } catch (error) {
      console.error('Error retrieving value info from localStorage:', error);
      return null;
    }
  },

  // Add a new value info entry
  addValueInfo: (valueInfoData: Omit<ValueInfo, 'id'>): ValueInfo => {
    try {
      const allValueInfo = ValueInfoLocalStorage.getAllValueInfo();
      const newValueInfo: ValueInfo = {
        ...valueInfoData,
        id: generateRandomId()
      };
      
      const updatedValueInfo = [...allValueInfo, newValueInfo];
      ValueInfoLocalStorage.saveAllValueInfo(updatedValueInfo);
      
      return newValueInfo;
    } catch (error) {
      console.error('Error adding value info:', error);
      throw error;
    }
  },

  // Get value info by formDataId
  getValueInfoByFormDataId: (formDataId: string): ValueInfo | null => {
    const allValueInfo = ValueInfoLocalStorage.getAllValueInfo();
    return allValueInfo.find(info => info.formDataId === formDataId) || null;
  },

  // Get value info by photoTagId
  getValueInfoByPhotoTagId: (photoTagId: string): ValueInfo | null => {
    const allValueInfo = ValueInfoLocalStorage.getAllValueInfo();
    return allValueInfo.find(info => info.photoTagId === photoTagId) || null;
  },

  // Get all value info entries for a specific form data
  getAllValueInfoByFormDataId: (formDataId: string): ValueInfo[] => {
    const allValueInfo = ValueInfoLocalStorage.getAllValueInfo();
    return allValueInfo.filter(info => info.formDataId === formDataId);
  },

  // Get all value info entries for a specific photo tag
  getAllValueInfoByPhotoTagId: (photoTagId: string): ValueInfo[] => {
    const allValueInfo = ValueInfoLocalStorage.getAllValueInfo();
    return allValueInfo.filter(info => info.photoTagId === photoTagId);
  },

  // Get value info by status
  getValueInfoByStatus: (status: string): ValueInfo[] => {
    const allValueInfo = ValueInfoLocalStorage.getAllValueInfo();
    return allValueInfo.filter(info => info.status === status);
  },

  // Delete value info by ID
  deleteValueInfo: (id: string): boolean => {
    try {
      const allValueInfo = ValueInfoLocalStorage.getAllValueInfo();
      const filteredInfo = allValueInfo.filter(info => info.id !== id);
      ValueInfoLocalStorage.saveAllValueInfo(filteredInfo);
      return true;
    } catch (error) {
      console.error('Error deleting value info:', error);
      return false;
    }
  },

  // Delete all value info for a specific form data
  deleteValueInfoByFormDataId: (formDataId: string): boolean => {
    try {
      const allValueInfo = ValueInfoLocalStorage.getAllValueInfo();
      const filteredInfo = allValueInfo.filter(info => info.formDataId !== formDataId);
      ValueInfoLocalStorage.saveAllValueInfo(filteredInfo);
      return true;
    } catch (error) {
      console.error('Error deleting value info by formDataId:', error);
      return false;
    }
  },

  // Delete all value info for a specific photo tag
  deleteValueInfoByPhotoTagId: (photoTagId: string): boolean => {
    try {
      const allValueInfo = ValueInfoLocalStorage.getAllValueInfo();
      const filteredInfo = allValueInfo.filter(info => info.photoTagId !== photoTagId);
      ValueInfoLocalStorage.saveAllValueInfo(filteredInfo);
      return true;
    } catch (error) {
      console.error('Error deleting value info by photoTagId:', error);
      return false;
    }
  },

  // Delete all value info with a specific status
  deleteValueInfoByStatus: (status: string): boolean => {
    try {
      const allValueInfo = ValueInfoLocalStorage.getAllValueInfo();
      const filteredInfo = allValueInfo.filter(info => info.status !== status);
      ValueInfoLocalStorage.saveAllValueInfo(filteredInfo);
      return true;
    } catch (error) {
      console.error('Error deleting value info by status:', error);
      return false;
    }
  },

  // Clear ALL value info from localStorage
  clearAllValueInfo: (): void => {
    try {
      localStorage.removeItem(VALUE_INFO_KEY);
    } catch (error) {
      console.error('Error clearing value info from localStorage:', error);
    }
  },

  // Update specific fields in value info
  updateValueInfo: (id: string, updates: Partial<ValueInfo>): ValueInfo | null => {
    try {
      const allValueInfo = ValueInfoLocalStorage.getAllValueInfo();
      const infoIndex = allValueInfo.findIndex(info => info.id === id);
      
      if (infoIndex === -1) {
        return null;
      }
      
      const updatedInfo = { 
        ...allValueInfo[infoIndex], 
        ...updates
      };
      
      const updatedValueInfo = [...allValueInfo];
      updatedValueInfo[infoIndex] = updatedInfo;
      
      ValueInfoLocalStorage.saveAllValueInfo(updatedValueInfo);
      return updatedInfo;
    } catch (error) {
      console.error('Error updating value info:', error);
      return null;
    }
  },

  // Get value info count
  getValueInfoCount: (): number => {
    const allValueInfo = ValueInfoLocalStorage.getAllValueInfo();
    return allValueInfo.length;
  },

  // Generate a new random ID (consistent with other storage utilities)
  generateId: (): string => {
    return generateRandomId();
  }
};