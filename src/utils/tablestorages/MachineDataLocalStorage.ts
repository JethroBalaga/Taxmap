// src/utils/tablestorages/MachineDataLocalStorage.ts
import localforage from 'localforage';

export interface MachineData {
  valueInfoId: string; 
  selectedEquipment: string;
  serialNo: string;
  machineDescription: string;
  brandModel: string;
  condition: string;
  machineDetails: string;
  purchaseType: string;
  dateAcquired: string;
  dateInstalled: string;
  dateOperated: string;
  yearsUsed: string;
  estimatedLife: string;
  numberOfUnits: string;
  originalCost: string;
  freight: string;
  insurance: string;
  installation: string;
  others: string;
  depreciation: string;
}

const MACHINE_DATA_KEY = 'machineData';

// Configure localforage instance for machine data
const machineDataStore = localforage.createInstance({
  name: 'MachineDataStorage',
  description: 'Storage for machine data entries'
});

export const MachineDataLocalStorage = {
  // Get ALL machine data from localforage
  getAllMachineData: async (): Promise<MachineData[]> => {
    try {
      const storedData = await machineDataStore.getItem<MachineData[]>(MACHINE_DATA_KEY);
      return storedData || [];
    } catch (error) {
      console.error('Error retrieving machine data from localforage:', error);
      return [];
    }
  },

  // Get a specific machine data by valueInfoId
  getMachineData: async (valueInfoId: string): Promise<MachineData | null> => {
    try {
      const allMachineData = await MachineDataLocalStorage.getAllMachineData();
      return allMachineData.find(machine => machine.valueInfoId === valueInfoId) || null;
    } catch (error) {
      console.error('Error retrieving machine data from localforage:', error);
      return null;
    }
  },

  // Save NEW machine data to localforage
  saveMachineData: async (machineData: MachineData): Promise<MachineData> => {
    try {
      const allMachineData = await MachineDataLocalStorage.getAllMachineData();
      
      // Check if data already exists for this valueInfoId
      const existingIndex = allMachineData.findIndex(
        machine => machine.valueInfoId === machineData.valueInfoId
      );
      
      let updatedMachineData;
      if (existingIndex >= 0) {
        // Update existing entry
        updatedMachineData = [...allMachineData];
        updatedMachineData[existingIndex] = machineData;
      } else {
        // Add new entry
        updatedMachineData = [...allMachineData, machineData];
      }
      
      await machineDataStore.setItem(MACHINE_DATA_KEY, updatedMachineData);
      return machineData;
    } catch (error) {
      console.error('Error saving machine data to localforage:', error);
      throw error;
    }
  },

  // Update specific fields in machine data for a specific valueInfoId
  updateMachineData: async (valueInfoId: string, updates: Partial<MachineData>): Promise<MachineData | null> => {
    try {
      const allMachineData = await MachineDataLocalStorage.getAllMachineData();
      const machineIndex = allMachineData.findIndex(
        machine => machine.valueInfoId === valueInfoId
      );
      
      if (machineIndex === -1) {
        return null;
      }
      
      const updatedMachine = { 
        ...allMachineData[machineIndex], 
        ...updates
      };
      
      allMachineData[machineIndex] = updatedMachine;
      await machineDataStore.setItem(MACHINE_DATA_KEY, allMachineData);
      return updatedMachine;
    } catch (error) {
      console.error('Error updating machine data:', error);
      return null;
    }
  },

  // Delete machine data for a specific valueInfoId
  deleteMachineData: async (valueInfoId: string): Promise<boolean> => {
    try {
      const allMachineData = await MachineDataLocalStorage.getAllMachineData();
      const updatedMachineData = allMachineData.filter(
        machine => machine.valueInfoId !== valueInfoId
      );
      await machineDataStore.setItem(MACHINE_DATA_KEY, updatedMachineData);
      return true;
    } catch (error) {
      console.error('Error deleting machine data:', error);
      return false;
    }
  },

  // Clear ALL machine data from localforage
  clearAllMachineData: async (): Promise<void> => {
    try {
      await machineDataStore.removeItem(MACHINE_DATA_KEY);
    } catch (error) {
      console.error('Error clearing machine data from localforage:', error);
    }
  },

  // Check if machine data exists for a specific valueInfoId
  hasMachineDataForInfoId: async (valueInfoId: string): Promise<boolean> => {
    const allMachineData = await MachineDataLocalStorage.getAllMachineData();
    return allMachineData.some(machine => machine.valueInfoId === valueInfoId);
  },

  // Get machine data count
  getMachineDataCount: async (): Promise<number> => {
    const allMachineData = await MachineDataLocalStorage.getAllMachineData();
    return allMachineData.length;
  }
};