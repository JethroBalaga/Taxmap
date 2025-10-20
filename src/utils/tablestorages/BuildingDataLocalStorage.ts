// src/utils/BuildingDataLocalStorage.ts
import localforage from 'localforage';

export interface BuildingData {
  valueInfoId: string; 
  structureType: string;
  buildingCode: string;
  storey: number | null;
  floorOrder: number | null;
  buildingAge: string | null;
  buildingPermit: string | null;
  constructionPercent: number | null;
  depreciationRate: number | null;
  dateConstructed: string | null;
  dateOccupied: string | null;
  dateCompleted: string | null;
}

const BUILDING_DATA_KEY = 'buildingData';

// Configure localForage instance
const buildingDataStorage = localforage.createInstance({
  name: 'BuildingDataDB',
  storeName: 'building_data_store'
});

export const BuildingDataLocalStorage = {
  // Get ALL building data from localForage
  getAllBuildingData: async (): Promise<BuildingData[]> => {
    try {
      const storedData = await buildingDataStorage.getItem<BuildingData[]>(BUILDING_DATA_KEY);
      return storedData || [];
    } catch (error) {
      console.error('Error retrieving building data from localForage:', error);
      return [];
    }
  },

  // Get a specific building data by valueInfoId
  getBuildingData: async (valueInfoId: string): Promise<BuildingData | null> => {
    try {
      const allBuildingData = await BuildingDataLocalStorage.getAllBuildingData();
      return allBuildingData.find(building => building.valueInfoId === valueInfoId) || null;
    } catch (error) {
      console.error('Error retrieving building data from localForage:', error);
      return null;
    }
  },

  // Save NEW building data to localForage
  saveBuildingData: async (buildingData: BuildingData): Promise<void> => {
    try {
      const allBuildingData = await BuildingDataLocalStorage.getAllBuildingData();
      
      // Check if data already exists for this valueInfoId
      const existingIndex = allBuildingData.findIndex(
        building => building.valueInfoId === buildingData.valueInfoId
      );
      
      let updatedBuildingData;
      if (existingIndex >= 0) {
        // Update existing entry
        updatedBuildingData = [...allBuildingData];
        updatedBuildingData[existingIndex] = buildingData;
      } else {
        // Add new entry
        updatedBuildingData = [...allBuildingData, buildingData];
      }
      
      await buildingDataStorage.setItem(BUILDING_DATA_KEY, updatedBuildingData);
    } catch (error) {
      console.error('Error saving building data to localForage:', error);
      throw error;
    }
  },

  // Update specific fields in building data for a specific valueInfoId
  updateBuildingData: async (valueInfoId: string, updates: Partial<BuildingData>): Promise<BuildingData | null> => {
    try {
      const allBuildingData = await BuildingDataLocalStorage.getAllBuildingData();
      const buildingIndex = allBuildingData.findIndex(
        building => building.valueInfoId === valueInfoId
      );
      
      if (buildingIndex === -1) {
        return null;
      }
      
      const updatedBuilding = { 
        ...allBuildingData[buildingIndex], 
        ...updates
      };
      
      allBuildingData[buildingIndex] = updatedBuilding;
      await buildingDataStorage.setItem(BUILDING_DATA_KEY, allBuildingData);
      return updatedBuilding;
    } catch (error) {
      console.error('Error updating building data:', error);
      return null;
    }
  },

  // Delete building data for a specific valueInfoId
  deleteBuildingData: async (valueInfoId: string): Promise<boolean> => {
    try {
      const allBuildingData = await BuildingDataLocalStorage.getAllBuildingData();
      const updatedBuildingData = allBuildingData.filter(
        building => building.valueInfoId !== valueInfoId
      );
      await buildingDataStorage.setItem(BUILDING_DATA_KEY, updatedBuildingData);
      return true;
    } catch (error) {
      console.error('Error deleting building data:', error);
      return false;
    }
  },

  // Clear ALL building data from localForage
  clearAllBuildingData: async (): Promise<void> => {
    try {
      await buildingDataStorage.removeItem(BUILDING_DATA_KEY);
    } catch (error) {
      console.error('Error clearing building data from localForage:', error);
    }
  },

  // Check if building data exists for a specific valueInfoId
  hasBuildingDataForInfoId: async (valueInfoId: string): Promise<boolean> => {
    const allBuildingData = await BuildingDataLocalStorage.getAllBuildingData();
    return allBuildingData.some(building => building.valueInfoId === valueInfoId);
  },

  // Get building data count
  getBuildingDataCount: async (): Promise<number> => {
    const allBuildingData = await BuildingDataLocalStorage.getAllBuildingData();
    return allBuildingData.length;
  }
};