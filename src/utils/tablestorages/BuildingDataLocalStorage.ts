// src/utils/BuildingDataLocalStorage.ts
export interface BuildingData {
  buildingInfoId: string; // Reference to BuildingInfo id
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
  // Save building data to localStorage
  saveBuildingData: (buildingData: BuildingData): void => {
    try {
      localStorage.setItem(BUILDING_DATA_KEY, JSON.stringify(buildingData));
    } catch (error) {
      console.error('Error saving building data to localStorage:', error);
    }
  },

  // Get building data from localStorage
  getBuildingData: (): BuildingData | null => {
    try {
      const storedData = localStorage.getItem(BUILDING_DATA_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
      return null;
    } catch (error) {
      console.error('Error retrieving building data from localStorage:', error);
      return null;
    }
  },

  // Get building data by buildingInfoId
  getBuildingDataByInfoId: (buildingInfoId: string): BuildingData | null => {
    try {
      const storedData = localStorage.getItem(BUILDING_DATA_KEY);
      if (storedData) {
        const buildingData = JSON.parse(storedData);
        // Check if the stored data has the matching buildingInfoId
        if (buildingData.buildingInfoId === buildingInfoId) {
          return buildingData;
        }
      }
      return null;
    } catch (error) {
      console.error('Error retrieving building data by infoId:', error);
      return null;
    }
  },

  // Clear building data from localStorage
  clearBuildingData: (): void => {
    try {
      localStorage.removeItem(BUILDING_DATA_KEY);
    } catch (error) {
      console.error('Error clearing building data from localStorage:', error);
    }
  },

  // Update specific fields in building data
  updateBuildingData: (updates: Partial<BuildingData>): BuildingData | null => {
    try {
      const currentData = BuildingDataLocalStorage.getBuildingData();
      const updatedData = { ...currentData, ...updates } as BuildingData;
      BuildingDataLocalStorage.saveBuildingData(updatedData);
      return updatedData;
    } catch (error) {
      console.error('Error updating building data:', error);
      return null;
    }
  },

  // Check if building data exists for a specific buildingInfoId
  hasBuildingDataForInfoId: (buildingInfoId: string): boolean => {
    const buildingData = BuildingDataLocalStorage.getBuildingData();
    return buildingData ? buildingData.buildingInfoId === buildingInfoId : false;
  }
};