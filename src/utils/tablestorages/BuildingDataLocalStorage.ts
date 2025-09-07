// src/utils/BuildingDataLocalStorage.ts
export interface BuildingData {
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
  }
};