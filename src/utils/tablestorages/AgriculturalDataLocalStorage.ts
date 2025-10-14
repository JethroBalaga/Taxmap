// src/utils/AgriculturalDataLocalStorage.ts
export interface AgriculturalData {
  frontage: string;
  weather_road: string;
  market: string;
  value_info_id: string;
}

const AGRICULTURAL_DATA_KEY = 'agriculturalData';

export const AgriculturalDataLocalStorage = {
  // Get ALL agricultural data from localStorage
  getAllAgriculturalData: (): AgriculturalData[] => {
    try {
      const storedData = localStorage.getItem(AGRICULTURAL_DATA_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
      return [];
    } catch (error) {
      console.error('Error retrieving agricultural data from localStorage:', error);
      return [];
    }
  },

  // Get agricultural data for a specific value_info_id
  getAgriculturalDataByValueInfoId: (value_info_id: string): AgriculturalData | null => {
    try {
      const allAgriculturalData = AgriculturalDataLocalStorage.getAllAgriculturalData();
      return allAgriculturalData.find(data => data.value_info_id === value_info_id) || null;
    } catch (error) {
      console.error('Error retrieving agricultural data by value_info_id:', error);
      return null;
    }
  },

  // Save NEW agricultural data to localStorage
  saveAgriculturalData: (agriculturalData: AgriculturalData): void => {
    try {
      const allAgriculturalData = AgriculturalDataLocalStorage.getAllAgriculturalData();

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

      localStorage.setItem(AGRICULTURAL_DATA_KEY, JSON.stringify(updatedAgriculturalData));
    } catch (error) {
      console.error('Error saving agricultural data to localStorage:', error);
      throw error;
    }
  },

  // Update agricultural data for a specific value_info_id
  updateAgriculturalData: (value_info_id: string, updates: Partial<AgriculturalData>): AgriculturalData | null => {
    try {
      const allAgriculturalData = AgriculturalDataLocalStorage.getAllAgriculturalData();
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
      localStorage.setItem(AGRICULTURAL_DATA_KEY, JSON.stringify(allAgriculturalData));
      return updatedData;
    } catch (error) {
      console.error('Error updating agricultural data:', error);
      return null;
    }
  },

  // Delete agricultural data for a specific value_info_id
  deleteAgriculturalData: (value_info_id: string): boolean => {
    try {
      const allAgriculturalData = AgriculturalDataLocalStorage.getAllAgriculturalData();
      const updatedAgriculturalData = allAgriculturalData.filter(
        data => data.value_info_id !== value_info_id
      );
      localStorage.setItem(AGRICULTURAL_DATA_KEY, JSON.stringify(updatedAgriculturalData));
      return true;
    } catch (error) {
      console.error('Error deleting agricultural data:', error);
      return false;
    }
  },

  // Clear ALL agricultural data from localStorage
  clearAllAgriculturalData: (): void => {
    try {
      localStorage.removeItem(AGRICULTURAL_DATA_KEY);
    } catch (error) {
      console.error('Error clearing agricultural data from localStorage:', error);
    }
  },

  // Check if agricultural data exists for a specific value_info_id
  hasAgriculturalData: (value_info_id: string): boolean => {
    const allAgriculturalData = AgriculturalDataLocalStorage.getAllAgriculturalData();
    return allAgriculturalData.some(data => data.value_info_id === value_info_id);
  },

  // Get agricultural data count
  getAgriculturalDataCount: (): number => {
    const allAgriculturalData = AgriculturalDataLocalStorage.getAllAgriculturalData();
    return allAgriculturalData.length;
  }
};