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
  // Save all value info entries
  saveValueInfo: (valueInfo: ValueInfo[]): void => {
    try {
      localStorage.setItem(VALUE_INFO_KEY, JSON.stringify(valueInfo));
    } catch (error) {
      console.error('Error saving value info to localStorage:', error);
    }
  },

  // Get all value info entries
  getValueInfo: (): ValueInfo[] => {
    try {
      const storedData = localStorage.getItem(VALUE_INFO_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
      return [];
    } catch (error) {
      console.error('Error retrieving value info from localStorage:', error);
      return [];
    }
  },

  // Add a new value info entry
  addValueInfo: (
    valueInfoData: Omit<ValueInfo, 'id'> & { id?: string }
  ): ValueInfo => {
    try {
      const valueInfo = ValueInfoLocalStorage.getValueInfo();
      const newValueInfo: ValueInfo = {
        ...valueInfoData,
        id: valueInfoData.id || generateRandomId()
      };
      
      const updatedValueInfo = [...valueInfo, newValueInfo];
      ValueInfoLocalStorage.saveValueInfo(updatedValueInfo);
      
      return newValueInfo;
    } catch (error) {
      console.error('Error adding value info:', error);
      throw error;
    }
  },

  // Get value info by ID
  getValueInfoById: (id: string): ValueInfo | null => {
    const valueInfo = ValueInfoLocalStorage.getValueInfo();
    return valueInfo.find(info => info.id === id) || null;
  },

  // Get value info by formDataId
  getValueInfoByFormDataId: (formDataId: string): ValueInfo | null => {
    const valueInfo = ValueInfoLocalStorage.getValueInfo();
    return valueInfo.find(info => info.formDataId === formDataId) || null;
  },

  // Get value info by photoTagId
  getValueInfoByPhotoTagId: (photoTagId: string): ValueInfo | null => {
    const valueInfo = ValueInfoLocalStorage.getValueInfo();
    return valueInfo.find(info => info.photoTagId === photoTagId) || null;
  },

  // Get all value info entries for a specific form data
  getAllValueInfoByFormDataId: (formDataId: string): ValueInfo[] => {
    const valueInfo = ValueInfoLocalStorage.getValueInfo();
    return valueInfo.filter(info => info.formDataId === formDataId);
  },

  // Get all value info entries for a specific photo tag
  getAllValueInfoByPhotoTagId: (photoTagId: string): ValueInfo[] => {
    const valueInfo = ValueInfoLocalStorage.getValueInfo();
    return valueInfo.filter(info => info.photoTagId === photoTagId);
  },

  // Get value info by status
  getValueInfoByStatus: (status: string): ValueInfo[] => {
    const valueInfo = ValueInfoLocalStorage.getValueInfo();
    return valueInfo.filter(info => info.status === status);
  },

  // Delete value info by ID
  deleteValueInfo: (id: string): void => {
    try {
      const valueInfo = ValueInfoLocalStorage.getValueInfo();
      const filteredInfo = valueInfo.filter(info => info.id !== id);
      ValueInfoLocalStorage.saveValueInfo(filteredInfo);
    } catch (error) {
      console.error('Error deleting value info:', error);
    }
  },

  // Delete all value info for a specific form data
  deleteValueInfoByFormDataId: (formDataId: string): void => {
    try {
      const valueInfo = ValueInfoLocalStorage.getValueInfo();
      const filteredInfo = valueInfo.filter(info => info.formDataId !== formDataId);
      ValueInfoLocalStorage.saveValueInfo(filteredInfo);
    } catch (error) {
      console.error('Error deleting value info by formDataId:', error);
    }
  },

  // Delete all value info for a specific photo tag
  deleteValueInfoByPhotoTagId: (photoTagId: string): void => {
    try {
      const valueInfo = ValueInfoLocalStorage.getValueInfo();
      const filteredInfo = valueInfo.filter(info => info.photoTagId !== photoTagId);
      ValueInfoLocalStorage.saveValueInfo(filteredInfo);
    } catch (error) {
      console.error('Error deleting value info by photoTagId:', error);
    }
  },

  // Delete all value info with a specific status
  deleteValueInfoByStatus: (status: string): void => {
    try {
      const valueInfo = ValueInfoLocalStorage.getValueInfo();
      const filteredInfo = valueInfo.filter(info => info.status !== status);
      ValueInfoLocalStorage.saveValueInfo(filteredInfo);
    } catch (error) {
      console.error('Error deleting value info by status:', error);
    }
  },

  // Clear all value info
  clearValueInfo: (): void => {
    try {
      localStorage.removeItem(VALUE_INFO_KEY);
    } catch (error) {
      console.error('Error clearing value info from localStorage:', error);
    }
  },

  // Update specific fields in value info
  updateValueInfo: (id: string, updates: Partial<ValueInfo>): ValueInfo | null => {
    try {
      const valueInfo = ValueInfoLocalStorage.getValueInfo();
      const infoIndex = valueInfo.findIndex(info => info.id === id);
      
      if (infoIndex === -1) {
        return null;
      }
      
      // Ensure we don't override the ID
      const updatedInfo = { 
        ...valueInfo[infoIndex], 
        ...updates,
        id: valueInfo[infoIndex].id // Preserve original ID
      };
      
      const updatedValueInfo = [...valueInfo];
      updatedValueInfo[infoIndex] = updatedInfo;
      
      ValueInfoLocalStorage.saveValueInfo(updatedValueInfo);
      return updatedInfo;
    } catch (error) {
      console.error('Error updating value info:', error);
      return null;
    }
  },

  // Generate a new random ID (consistent with other storage utilities)
  generateId: (): string => {
    return generateRandomId();
  }
};