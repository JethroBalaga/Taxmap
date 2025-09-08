// src/utils/BuildingInfoLocalStorage.ts

export interface BuildingInfo {
  id: string; // Random primary key
  formDataId: string; // Reference to FormData id
  photoTagId: string; // Reference to PhotoTagData id
  status: string; // Status string
}

const BUILDING_INFO_KEY = 'buildingInfo';

// Helper function to generate random string ID (consistent with other storage utilities)
const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export const BuildingInfoLocalStorage = {
  // Save all building info entries
  saveBuildingInfo: (buildingInfo: BuildingInfo[]): void => {
    try {
      localStorage.setItem(BUILDING_INFO_KEY, JSON.stringify(buildingInfo));
    } catch (error) {
      console.error('Error saving building info to localStorage:', error);
    }
  },

  // Get all building info entries
  getBuildingInfo: (): BuildingInfo[] => {
    try {
      const storedData = localStorage.getItem(BUILDING_INFO_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
      return [];
    } catch (error) {
      console.error('Error retrieving building info from localStorage:', error);
      return [];
    }
  },

  // Add a new building info entry
  addBuildingInfo: (
    buildingInfoData: Omit<BuildingInfo, 'id'> & { id?: string }
  ): BuildingInfo => {
    try {
      const buildingInfo = BuildingInfoLocalStorage.getBuildingInfo();
      const newBuildingInfo: BuildingInfo = {
        ...buildingInfoData,
        id: buildingInfoData.id || generateRandomId()
      };
      
      const updatedBuildingInfo = [...buildingInfo, newBuildingInfo];
      BuildingInfoLocalStorage.saveBuildingInfo(updatedBuildingInfo);
      
      return newBuildingInfo;
    } catch (error) {
      console.error('Error adding building info:', error);
      throw error;
    }
  },

  // Get building info by ID
  getBuildingInfoById: (id: string): BuildingInfo | null => {
    const buildingInfo = BuildingInfoLocalStorage.getBuildingInfo();
    return buildingInfo.find(info => info.id === id) || null;
  },

  // Get building info by formDataId
  getBuildingInfoByFormDataId: (formDataId: string): BuildingInfo | null => {
    const buildingInfo = BuildingInfoLocalStorage.getBuildingInfo();
    return buildingInfo.find(info => info.formDataId === formDataId) || null;
  },

  // Get building info by photoTagId
  getBuildingInfoByPhotoTagId: (photoTagId: string): BuildingInfo | null => {
    const buildingInfo = BuildingInfoLocalStorage.getBuildingInfo();
    return buildingInfo.find(info => info.photoTagId === photoTagId) || null;
  },

  // Get all building info entries for a specific form data
  getAllBuildingInfoByFormDataId: (formDataId: string): BuildingInfo[] => {
    const buildingInfo = BuildingInfoLocalStorage.getBuildingInfo();
    return buildingInfo.filter(info => info.formDataId === formDataId);
  },

  // Get all building info entries for a specific photo tag
  getAllBuildingInfoByPhotoTagId: (photoTagId: string): BuildingInfo[] => {
    const buildingInfo = BuildingInfoLocalStorage.getBuildingInfo();
    return buildingInfo.filter(info => info.photoTagId === photoTagId);
  },

  // Get building info by status
  getBuildingInfoByStatus: (status: string): BuildingInfo[] => {
    const buildingInfo = BuildingInfoLocalStorage.getBuildingInfo();
    return buildingInfo.filter(info => info.status === status);
  },

  // Delete building info by ID
  deleteBuildingInfo: (id: string): void => {
    try {
      const buildingInfo = BuildingInfoLocalStorage.getBuildingInfo();
      const filteredInfo = buildingInfo.filter(info => info.id !== id);
      BuildingInfoLocalStorage.saveBuildingInfo(filteredInfo);
    } catch (error) {
      console.error('Error deleting building info:', error);
    }
  },

  // Delete all building info for a specific form data
  deleteBuildingInfoByFormDataId: (formDataId: string): void => {
    try {
      const buildingInfo = BuildingInfoLocalStorage.getBuildingInfo();
      const filteredInfo = buildingInfo.filter(info => info.formDataId !== formDataId);
      BuildingInfoLocalStorage.saveBuildingInfo(filteredInfo);
    } catch (error) {
      console.error('Error deleting building info by formDataId:', error);
    }
  },

  // Delete all building info for a specific photo tag
  deleteBuildingInfoByPhotoTagId: (photoTagId: string): void => {
    try {
      const buildingInfo = BuildingInfoLocalStorage.getBuildingInfo();
      const filteredInfo = buildingInfo.filter(info => info.photoTagId !== photoTagId);
      BuildingInfoLocalStorage.saveBuildingInfo(filteredInfo);
    } catch (error) {
      console.error('Error deleting building info by photoTagId:', error);
    }
  },

  // Delete all building info with a specific status
  deleteBuildingInfoByStatus: (status: string): void => {
    try {
      const buildingInfo = BuildingInfoLocalStorage.getBuildingInfo();
      const filteredInfo = buildingInfo.filter(info => info.status !== status);
      BuildingInfoLocalStorage.saveBuildingInfo(filteredInfo);
    } catch (error) {
      console.error('Error deleting building info by status:', error);
    }
  },

  // Clear all building info
  clearBuildingInfo: (): void => {
    try {
      localStorage.removeItem(BUILDING_INFO_KEY);
    } catch (error) {
      console.error('Error clearing building info from localStorage:', error);
    }
  },

  // Update specific fields in building info
  updateBuildingInfo: (id: string, updates: Partial<BuildingInfo>): BuildingInfo | null => {
    try {
      const buildingInfo = BuildingInfoLocalStorage.getBuildingInfo();
      const infoIndex = buildingInfo.findIndex(info => info.id === id);
      
      if (infoIndex === -1) {
        return null;
      }
      
      // Ensure we don't override the ID
      const updatedInfo = { 
        ...buildingInfo[infoIndex], 
        ...updates,
        id: buildingInfo[infoIndex].id // Preserve original ID
      };
      
      const updatedBuildingInfo = [...buildingInfo];
      updatedBuildingInfo[infoIndex] = updatedInfo;
      
      BuildingInfoLocalStorage.saveBuildingInfo(updatedBuildingInfo);
      return updatedInfo;
    } catch (error) {
      console.error('Error updating building info:', error);
      return null;
    }
  },

  // Generate a new random ID (consistent with other storage utilities)
  generateId: (): string => {
    return generateRandomId();
  }
};