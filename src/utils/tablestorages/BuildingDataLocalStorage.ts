// src/utils/BuildingDataLocalStorage.ts
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

export const BuildingDataLocalStorage = {
  // Get ALL building data from localStorage
  getAllBuildingData: (): BuildingData[] => {
    try {
      const storedData = localStorage.getItem(BUILDING_DATA_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
      return [];
    } catch (error) {
      console.error('Error retrieving building data from localStorage:', error);
      return [];
    }
  },

  // Get a specific building data by valueInfoId
  getBuildingData: (valueInfoId: string): BuildingData | null => {
    try {
      const allBuildingData = BuildingDataLocalStorage.getAllBuildingData();
      return allBuildingData.find(building => building.valueInfoId === valueInfoId) || null;
    } catch (error) {
      console.error('Error retrieving building data from localStorage:', error);
      return null;
    }
  },

  // Save NEW building data to localStorage
  saveBuildingData: (buildingData: BuildingData): void => {
    try {
      const allBuildingData = BuildingDataLocalStorage.getAllBuildingData();
      
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
      
      localStorage.setItem(BUILDING_DATA_KEY, JSON.stringify(updatedBuildingData));
    } catch (error) {
      console.error('Error saving building data to localStorage:', error);
      throw error;
    }
  },

  // Update specific fields in building data for a specific valueInfoId
  updateBuildingData: (valueInfoId: string, updates: Partial<BuildingData>): BuildingData | null => {
    try {
      const allBuildingData = BuildingDataLocalStorage.getAllBuildingData();
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
      localStorage.setItem(BUILDING_DATA_KEY, JSON.stringify(allBuildingData));
      return updatedBuilding;
    } catch (error) {
      console.error('Error updating building data:', error);
      return null;
    }
  },

  // Delete building data for a specific valueInfoId
  deleteBuildingData: (valueInfoId: string): boolean => {
    try {
      const allBuildingData = BuildingDataLocalStorage.getAllBuildingData();
      const updatedBuildingData = allBuildingData.filter(
        building => building.valueInfoId !== valueInfoId
      );
      localStorage.setItem(BUILDING_DATA_KEY, JSON.stringify(updatedBuildingData));
      return true;
    } catch (error) {
      console.error('Error deleting building data:', error);
      return false;
    }
  },

  // Clear ALL building data from localStorage
  clearAllBuildingData: (): void => {
    try {
      localStorage.removeItem(BUILDING_DATA_KEY);
    } catch (error) {
      console.error('Error clearing building data from localStorage:', error);
    }
  },

  // Check if building data exists for a specific valueInfoId
  hasBuildingDataForInfoId: (valueInfoId: string): boolean => {
    const allBuildingData = BuildingDataLocalStorage.getAllBuildingData();
    return allBuildingData.some(building => building.valueInfoId === valueInfoId);
  },

  // Get building data count
  getBuildingDataCount: (): number => {
    const allBuildingData = BuildingDataLocalStorage.getAllBuildingData();
    return allBuildingData.length;
  }
};