// src/utils/ValueInfoLocalStorage.ts
import localforage from 'localforage';

export interface ValueInfo {
  id: string; // Random primary key
  formDataId: string; // Reference to FormData id
  photoTagId: string; // Reference to PhotoTagData id
}

const VALUE_INFO_KEY = 'valueInfo';

// Configure localForage instance for value info
const valueInfoStore = localforage.createInstance({
  name: 'PhotoTagApp',
  storeName: 'value_info',
  description: 'Storage for value info relationships'
});

// Helper function to generate random string ID (consistent with other storage utilities)
const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export const ValueInfoLocalStorage = {
  // Get ALL value info entries from localForage
  async getAllValueInfo(): Promise<ValueInfo[]> {
    try {
      const storedData = await valueInfoStore.getItem<ValueInfo[]>(VALUE_INFO_KEY);
      if (storedData) {
        return storedData;
      }
      return [];
    } catch (error) {
      console.error('Error retrieving value info from localForage:', error);
      return [];
    }
  },

  // Save ALL value info entries to localForage
  async saveAllValueInfo(valueInfo: ValueInfo[]): Promise<void> {
    try {
      await valueInfoStore.setItem(VALUE_INFO_KEY, valueInfo);
    } catch (error) {
      console.error('Error saving value info to localForage:', error);
      throw error;
    }
  },

  // Get a specific value info by ID
  async getValueInfo(id: string): Promise<ValueInfo | null> {
    try {
      const allValueInfo = await ValueInfoLocalStorage.getAllValueInfo();
      return allValueInfo.find(info => info.id === id) || null;
    } catch (error) {
      console.error('Error retrieving value info from localForage:', error);
      return null;
    }
  },

  // Add a new value info entry
  async addValueInfo(valueInfoData: Omit<ValueInfo, 'id'>): Promise<ValueInfo> {
    try {
      const allValueInfo = await ValueInfoLocalStorage.getAllValueInfo();
      const newValueInfo: ValueInfo = {
        ...valueInfoData,
        id: generateRandomId()
      };
      
      const updatedValueInfo = [...allValueInfo, newValueInfo];
      await ValueInfoLocalStorage.saveAllValueInfo(updatedValueInfo);
      
      return newValueInfo;
    } catch (error) {
      console.error('Error adding value info:', error);
      throw error;
    }
  },

  // Get value info by formDataId
  async getValueInfoByFormDataId(formDataId: string): Promise<ValueInfo | null> {
    const allValueInfo = await ValueInfoLocalStorage.getAllValueInfo();
    return allValueInfo.find(info => info.formDataId === formDataId) || null;
  },

  // Get value info by photoTagId
  async getValueInfoByPhotoTagId(photoTagId: string): Promise<ValueInfo | null> {
    const allValueInfo = await ValueInfoLocalStorage.getAllValueInfo();
    return allValueInfo.find(info => info.photoTagId === photoTagId) || null;
  },

  // Get all value info entries for a specific form data
  async getAllValueInfoByFormDataId(formDataId: string): Promise<ValueInfo[]> {
    const allValueInfo = await ValueInfoLocalStorage.getAllValueInfo();
    return allValueInfo.filter(info => info.formDataId === formDataId);
  },

  // Get all value info entries for a specific photo tag
  async getAllValueInfoByPhotoTagId(photoTagId: string): Promise<ValueInfo[]> {
    const allValueInfo = await ValueInfoLocalStorage.getAllValueInfo();
    return allValueInfo.filter(info => info.photoTagId === photoTagId);
  },

  // Delete value info by ID
  async deleteValueInfo(id: string): Promise<boolean> {
    try {
      const allValueInfo = await ValueInfoLocalStorage.getAllValueInfo();
      const filteredInfo = allValueInfo.filter(info => info.id !== id);
      await ValueInfoLocalStorage.saveAllValueInfo(filteredInfo);
      return true;
    } catch (error) {
      console.error('Error deleting value info:', error);
      return false;
    }
  },

  // Delete all value info for a specific form data
  async deleteValueInfoByFormDataId(formDataId: string): Promise<boolean> {
    try {
      const allValueInfo = await ValueInfoLocalStorage.getAllValueInfo();
      const filteredInfo = allValueInfo.filter(info => info.formDataId !== formDataId);
      await ValueInfoLocalStorage.saveAllValueInfo(filteredInfo);
      return true;
    } catch (error) {
      console.error('Error deleting value info by formDataId:', error);
      return false;
    }
  },

  // Delete all value info for a specific photo tag
  async deleteValueInfoByPhotoTagId(photoTagId: string): Promise<boolean> {
    try {
      const allValueInfo = await ValueInfoLocalStorage.getAllValueInfo();
      const filteredInfo = allValueInfo.filter(info => info.photoTagId !== photoTagId);
      await ValueInfoLocalStorage.saveAllValueInfo(filteredInfo);
      return true;
    } catch (error) {
      console.error('Error deleting value info by photoTagId:', error);
      return false;
    }
  },

  // Clear ALL value info from localForage
  async clearAllValueInfo(): Promise<void> {
    try {
      await valueInfoStore.removeItem(VALUE_INFO_KEY);
    } catch (error) {
      console.error('Error clearing value info from localForage:', error);
      throw error;
    }
  },

  // Update specific fields in value info
  async updateValueInfo(id: string, updates: Partial<ValueInfo>): Promise<ValueInfo | null> {
    try {
      const allValueInfo = await ValueInfoLocalStorage.getAllValueInfo();
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
      
      await ValueInfoLocalStorage.saveAllValueInfo(updatedValueInfo);
      return updatedInfo;
    } catch (error) {
      console.error('Error updating value info:', error);
      return null;
    }
  },

  // Get value info count
  async getValueInfoCount(): Promise<number> {
    const allValueInfo = await ValueInfoLocalStorage.getAllValueInfo();
    return allValueInfo.length;
  },

  // Generate a new random ID (consistent with other storage utilities)
  generateId: (): string => {
    return generateRandomId();
  }
};