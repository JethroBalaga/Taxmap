// src/utils/BuildingAdjustmentLocalStorage.ts
export interface BuildingAdjustmentData {
  bldg_adjustment_id: string;
  Maincomponent: string;
  buidlingsubcomponent: string;
  description: string;
  completion_percent: string;
  depraciation: string;
  value_info_id: string;
}

const BUILDING_ADJUSTMENT_KEY = 'buildingAdjustmentData';

export const BuildingAdjustmentLocalStorage = {
  // Get ALL building adjustment data from localStorage
  getAllBuildingAdjustmentData: (): BuildingAdjustmentData[] => {
    try {
      const storedData = localStorage.getItem(BUILDING_ADJUSTMENT_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
      return [];
    } catch (error) {
      console.error('Error retrieving building adjustment data from localStorage:', error);
      return [];
    }
  },

  // Get a specific building adjustment data by bldg_adjustment_id
  getBuildingAdjustmentData: (bldg_adjustment_id: string): BuildingAdjustmentData | null => {
    try {
      const allAdjustmentData = BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
      return allAdjustmentData.find(adjustment => adjustment.bldg_adjustment_id === bldg_adjustment_id) || null;
    } catch (error) {
      console.error('Error retrieving building adjustment data from localStorage:', error);
      return null;
    }
  },

  // Get all building adjustment data for a specific value_info_id
  getBuildingAdjustmentsByValueInfoId: (value_info_id: string): BuildingAdjustmentData[] => {
    try {
      const allAdjustmentData = BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
      return allAdjustmentData.filter(adjustment => adjustment.value_info_id === value_info_id);
    } catch (error) {
      console.error('Error retrieving building adjustments by value_info_id:', error);
      return [];
    }
  },

  // Save NEW building adjustment data to localStorage
  saveBuildingAdjustmentData: (adjustmentData: BuildingAdjustmentData): void => {
    try {
      const allAdjustmentData = BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
      
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
      
      localStorage.setItem(BUILDING_ADJUSTMENT_KEY, JSON.stringify(updatedAdjustmentData));
    } catch (error) {
      console.error('Error saving building adjustment data to localStorage:', error);
      throw error;
    }
  },

  // Update specific fields in building adjustment data for a specific bldg_adjustment_id
  updateBuildingAdjustmentData: (bldg_adjustment_id: string, updates: Partial<BuildingAdjustmentData>): BuildingAdjustmentData | null => {
    try {
      const allAdjustmentData = BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
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
      localStorage.setItem(BUILDING_ADJUSTMENT_KEY, JSON.stringify(allAdjustmentData));
      return updatedAdjustment;
    } catch (error) {
      console.error('Error updating building adjustment data:', error);
      return null;
    }
  },

  // Delete building adjustment data for a specific bldg_adjustment_id
  deleteBuildingAdjustmentData: (bldg_adjustment_id: string): boolean => {
    try {
      const allAdjustmentData = BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
      const updatedAdjustmentData = allAdjustmentData.filter(
        adjustment => adjustment.bldg_adjustment_id !== bldg_adjustment_id
      );
      localStorage.setItem(BUILDING_ADJUSTMENT_KEY, JSON.stringify(updatedAdjustmentData));
      return true;
    } catch (error) {
      console.error('Error deleting building adjustment data:', error);
      return false;
    }
  },

  // Delete all building adjustment data for a specific value_info_id
  deleteBuildingAdjustmentsByValueInfoId: (value_info_id: string): boolean => {
    try {
      const allAdjustmentData = BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
      const updatedAdjustmentData = allAdjustmentData.filter(
        adjustment => adjustment.value_info_id !== value_info_id
      );
      localStorage.setItem(BUILDING_ADJUSTMENT_KEY, JSON.stringify(updatedAdjustmentData));
      return true;
    } catch (error) {
      console.error('Error deleting building adjustments by value_info_id:', error);
      return false;
    }
  },

  // Clear ALL building adjustment data from localStorage
  clearAllBuildingAdjustmentData: (): void => {
    try {
      localStorage.removeItem(BUILDING_ADJUSTMENT_KEY);
    } catch (error) {
      console.error('Error clearing building adjustment data from localStorage:', error);
    }
  },

  // Check if building adjustment data exists for a specific bldg_adjustment_id
  hasBuildingAdjustmentData: (bldg_adjustment_id: string): boolean => {
    const allAdjustmentData = BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
    return allAdjustmentData.some(adjustment => adjustment.bldg_adjustment_id === bldg_adjustment_id);
  },

  // Check if building adjustment data exists for a specific value_info_id
  hasBuildingAdjustmentsForValueInfoId: (value_info_id: string): boolean => {
    const allAdjustmentData = BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
    return allAdjustmentData.some(adjustment => adjustment.value_info_id === value_info_id);
  },

  // Get building adjustment data count
  getBuildingAdjustmentCount: (): number => {
    const allAdjustmentData = BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
    return allAdjustmentData.length;
  },

  // Get building adjustment data count for a specific value_info_id
  getBuildingAdjustmentCountByValueInfoId: (value_info_id: string): number => {
    const adjustments = BuildingAdjustmentLocalStorage.getBuildingAdjustmentsByValueInfoId(value_info_id);
    return adjustments.length;
  }
};