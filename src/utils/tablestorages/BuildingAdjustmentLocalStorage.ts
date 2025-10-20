// src/utils/BuildingAdjustmentLocalStorage.ts
import localforage from 'localforage';

export interface BuildingAdjustmentData {
  bldg_adjustment_id: string;
  Maincomponent: string;
  buidlingsubcomponent: string;
  description: string;
  completion_percent: string;
  depreciation: string;
  value_info_id: string;
  area: number; // Added area field as number
}

const BUILDING_ADJUSTMENT_KEY = 'buildingAdjustmentData';

// Configure localForage instance
const buildingAdjustmentStorage = localforage.createInstance({
  name: 'BuildingAdjustmentDB',
  storeName: 'building_adjustment_store'
});

export const BuildingAdjustmentLocalStorage = {
  // Get ALL building adjustment data from localForage
  getAllBuildingAdjustmentData: async (): Promise<BuildingAdjustmentData[]> => {
    try {
      const storedData = await buildingAdjustmentStorage.getItem<BuildingAdjustmentData[]>(BUILDING_ADJUSTMENT_KEY);
      return storedData || [];
    } catch (error) {
      console.error('Error retrieving building adjustment data from localForage:', error);
      return [];
    }
  },

  // Get a specific building adjustment data by bldg_adjustment_id
  getBuildingAdjustmentData: async (bldg_adjustment_id: string): Promise<BuildingAdjustmentData | null> => {
    try {
      const allAdjustmentData = await BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
      return allAdjustmentData.find(adjustment => adjustment.bldg_adjustment_id === bldg_adjustment_id) || null;
    } catch (error) {
      console.error('Error retrieving building adjustment data from localForage:', error);
      return null;
    }
  },

  // Get all building adjustment data for a specific value_info_id
  getBuildingAdjustmentsByValueInfoId: async (value_info_id: string): Promise<BuildingAdjustmentData[]> => {
    try {
      const allAdjustmentData = await BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
      return allAdjustmentData.filter(adjustment => adjustment.value_info_id === value_info_id);
    } catch (error) {
      console.error('Error retrieving building adjustments by value_info_id:', error);
      return [];
    }
  },

  // Save NEW building adjustment data to localForage
  saveBuildingAdjustmentData: async (adjustmentData: BuildingAdjustmentData): Promise<void> => {
    try {
      const allAdjustmentData = await BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();

      // Check if data already exists for this bldg_adjustment_id
      const existingIndex = allAdjustmentData.findIndex(
        adjustment => adjustment.bldg_adjustment_id === adjustmentData.bldg_adjustment_id
      );

      let updatedAdjustmentData;
      if (existingIndex >= 0) {
        // Update existing entry
        updatedAdjustmentData = [...allAdjustmentData];
        updatedAdjustmentData[existingIndex] = adjustmentData;
      } else {
        // Add new entry
        updatedAdjustmentData = [...allAdjustmentData, adjustmentData];
      }

      await buildingAdjustmentStorage.setItem(BUILDING_ADJUSTMENT_KEY, updatedAdjustmentData);
    } catch (error) {
      console.error('Error saving building adjustment data to localForage:', error);
      throw error;
    }
  },

  // Update specific fields in building adjustment data for a specific bldg_adjustment_id
  updateBuildingAdjustmentData: async (bldg_adjustment_id: string, updates: Partial<BuildingAdjustmentData>): Promise<BuildingAdjustmentData | null> => {
    try {
      const allAdjustmentData = await BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
      const adjustmentIndex = allAdjustmentData.findIndex(
        adjustment => adjustment.bldg_adjustment_id === bldg_adjustment_id
      );

      if (adjustmentIndex === -1) {
        return null;
      }

      const updatedAdjustment = {
        ...allAdjustmentData[adjustmentIndex],
        ...updates
      };

      allAdjustmentData[adjustmentIndex] = updatedAdjustment;
      await buildingAdjustmentStorage.setItem(BUILDING_ADJUSTMENT_KEY, allAdjustmentData);
      return updatedAdjustment;
    } catch (error) {
      console.error('Error updating building adjustment data:', error);
      return null;
    }
  },

  // Delete building adjustment data for a specific bldg_adjustment_id
  deleteBuildingAdjustmentData: async (bldg_adjustment_id: string): Promise<boolean> => {
    try {
      const allAdjustmentData = await BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
      const updatedAdjustmentData = allAdjustmentData.filter(
        adjustment => adjustment.bldg_adjustment_id !== bldg_adjustment_id
      );
      await buildingAdjustmentStorage.setItem(BUILDING_ADJUSTMENT_KEY, updatedAdjustmentData);
      return true;
    } catch (error) {
      console.error('Error deleting building adjustment data:', error);
      return false;
    }
  },

  // Delete all building adjustment data for a specific value_info_id
  deleteBuildingAdjustmentsByValueInfoId: async (value_info_id: string): Promise<boolean> => {
    try {
      const allAdjustmentData = await BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
      const updatedAdjustmentData = allAdjustmentData.filter(
        adjustment => adjustment.value_info_id !== value_info_id
      );
      await buildingAdjustmentStorage.setItem(BUILDING_ADJUSTMENT_KEY, updatedAdjustmentData);
      return true;
    } catch (error) {
      console.error('Error deleting building adjustments by value_info_id:', error);
      return false;
    }
  },

  // Clear ALL building adjustment data from localForage
  clearAllBuildingAdjustmentData: async (): Promise<void> => {
    try {
      await buildingAdjustmentStorage.removeItem(BUILDING_ADJUSTMENT_KEY);
    } catch (error) {
      console.error('Error clearing building adjustment data from localForage:', error);
    }
  },

  // Check if building adjustment data exists for a specific bldg_adjustment_id
  hasBuildingAdjustmentData: async (bldg_adjustment_id: string): Promise<boolean> => {
    const allAdjustmentData = await BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
    return allAdjustmentData.some(adjustment => adjustment.bldg_adjustment_id === bldg_adjustment_id);
  },

  // Check if building adjustment data exists for a specific value_info_id
  hasBuildingAdjustmentsForValueInfoId: async (value_info_id: string): Promise<boolean> => {
    const allAdjustmentData = await BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
    return allAdjustmentData.some(adjustment => adjustment.value_info_id === value_info_id);
  },

  // Get building adjustment data count
  getBuildingAdjustmentCount: async (): Promise<number> => {
    const allAdjustmentData = await BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
    return allAdjustmentData.length;
  },

  // Get building adjustment data count for a specific value_info_id
  getBuildingAdjustmentCountByValueInfoId: async (value_info_id: string): Promise<number> => {
    const adjustments = await BuildingAdjustmentLocalStorage.getBuildingAdjustmentsByValueInfoId(value_info_id);
    return adjustments.length;
  }
};