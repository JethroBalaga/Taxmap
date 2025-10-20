// src/utils/AgriculturalDataLocalStorage.ts
import localforage from 'localforage';

export interface AgriculturalData {
  frontage: string;
  weather_road: string;
  market: string;
  value_info_id: string;
}

const AGRICULTURAL_DATA_KEY = 'agriculturalData';

// Configure localForage instance
const agriculturalStorage = localforage.createInstance({
  name: 'AgriculturalDataDB',
  storeName: 'agricultural_store'
});

export const AgriculturalDataLocalStorage = {
  // Get ALL agricultural data from localForage
  getAllAgriculturalData: async (): Promise<AgriculturalData[]> => {
    try {
      const storedData = await agriculturalStorage.getItem<AgriculturalData[]>(AGRICULTURAL_DATA_KEY);
      return storedData || [];
    } catch (error) {
      console.error('Error retrieving agricultural data from localForage:', error);
      return [];
    }
  },

  // Get agricultural data for a specific value_info_id
  getAgriculturalDataByValueInfoId: async (value_info_id: string): Promise<AgriculturalData | null> => {
    try {
      const allAgriculturalData = await AgriculturalDataLocalStorage.getAllAgriculturalData();
      return allAgriculturalData.find(data => data.value_info_id === value_info_id) || null;
    } catch (error) {
      console.error('Error retrieving agricultural data by value_info_id:', error);
      return null;
    }
  },

  // Save NEW agricultural data to localForage
  saveAgriculturalData: async (agriculturalData: AgriculturalData): Promise<void> => {
    try {
      const allAgriculturalData = await AgriculturalDataLocalStorage.getAllAgriculturalData();

      // Check if data already exists for this value_info_id
      const existingIndex = allAgriculturalData.findIndex(
        data => data.value_info_id === agriculturalData.value_info_id
      );

      let updatedAgriculturalData;
      if (existingIndex >= 0) {
        // Update existing entry
        updatedAgriculturalData = [...allAgriculturalData];
        updatedAgriculturalData[existingIndex] = agriculturalData;
      } else {
        // Add new entry
        updatedAgriculturalData = [...allAgriculturalData, agriculturalData];
      }

      await agriculturalStorage.setItem(AGRICULTURAL_DATA_KEY, updatedAgriculturalData);
    } catch (error) {
      console.error('Error saving agricultural data to localForage:', error);
      throw error;
    }
  },

  // Update agricultural data for a specific value_info_id
  updateAgriculturalData: async (value_info_id: string, updates: Partial<AgriculturalData>): Promise<AgriculturalData | null> => {
    try {
      const allAgriculturalData = await AgriculturalDataLocalStorage.getAllAgriculturalData();
      const dataIndex = allAgriculturalData.findIndex(
        data => data.value_info_id === value_info_id
      );

      if (dataIndex === -1) {
        return null;
      }

      const updatedData = {
        ...allAgriculturalData[dataIndex],
        ...updates
      };

      allAgriculturalData[dataIndex] = updatedData;
      await agriculturalStorage.setItem(AGRICULTURAL_DATA_KEY, allAgriculturalData);
      return updatedData;
    } catch (error) {
      console.error('Error updating agricultural data:', error);
      return null;
    }
  },

  // Delete agricultural data for a specific value_info_id
  deleteAgriculturalData: async (value_info_id: string): Promise<boolean> => {
    try {
      const allAgriculturalData = await AgriculturalDataLocalStorage.getAllAgriculturalData();
      const updatedAgriculturalData = allAgriculturalData.filter(
        data => data.value_info_id !== value_info_id
      );
      await agriculturalStorage.setItem(AGRICULTURAL_DATA_KEY, updatedAgriculturalData);
      return true;
    } catch (error) {
      console.error('Error deleting agricultural data:', error);
      return false;
    }
  },

  // Clear ALL agricultural data from localForage
  clearAllAgriculturalData: async (): Promise<void> => {
    try {
      await agriculturalStorage.removeItem(AGRICULTURAL_DATA_KEY);
    } catch (error) {
      console.error('Error clearing agricultural data from localForage:', error);
    }
  },

  // Check if agricultural data exists for a specific value_info_id
  hasAgriculturalData: async (value_info_id: string): Promise<boolean> => {
    const allAgriculturalData = await AgriculturalDataLocalStorage.getAllAgriculturalData();
    return allAgriculturalData.some(data => data.value_info_id === value_info_id);
  },

  // Get agricultural data count
  getAgriculturalDataCount: async (): Promise<number> => {
    const allAgriculturalData = await AgriculturalDataLocalStorage.getAllAgriculturalData();
    return allAgriculturalData.length;
  }
};