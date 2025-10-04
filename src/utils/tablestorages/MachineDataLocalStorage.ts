// src/utils/tablestorages/MachineDataLocalStorage.ts
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

export const MachineDataLocalStorage = {
  // Get ALL machine data from localStorage
  getAllMachineData: (): MachineData[] => {
    try {
      const storedData = localStorage.getItem(MACHINE_DATA_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
      return [];
    } catch (error) {
      console.error('Error retrieving machine data from localStorage:', error);
      return [];
    }
  },

  // Get a specific machine data by valueInfoId
  getMachineData: (valueInfoId: string): MachineData | null => {
    try {
      const allMachineData = MachineDataLocalStorage.getAllMachineData();
      return allMachineData.find(machine => machine.valueInfoId === valueInfoId) || null;
    } catch (error) {
      console.error('Error retrieving machine data from localStorage:', error);
      return null;
    }
  },

  // Save NEW machine data to localStorage
  saveMachineData: (machineData: MachineData): MachineData => {
    try {
      const allMachineData = MachineDataLocalStorage.getAllMachineData();
      
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
      
      localStorage.setItem(MACHINE_DATA_KEY, JSON.stringify(updatedMachineData));
      return machineData;
    } catch (error) {
      console.error('Error saving machine data to localStorage:', error);
      throw error;
    }
  },

  // Update specific fields in machine data for a specific valueInfoId
  updateMachineData: (valueInfoId: string, updates: Partial<MachineData>): MachineData | null => {
    try {
      const allMachineData = MachineDataLocalStorage.getAllMachineData();
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
      localStorage.setItem(MACHINE_DATA_KEY, JSON.stringify(allMachineData));
      return updatedMachine;
    } catch (error) {
      console.error('Error updating machine data:', error);
      return null;
    }
  },

  // Delete machine data for a specific valueInfoId
  deleteMachineData: (valueInfoId: string): boolean => {
    try {
      const allMachineData = MachineDataLocalStorage.getAllMachineData();
      const updatedMachineData = allMachineData.filter(
        machine => machine.valueInfoId !== valueInfoId
      );
      localStorage.setItem(MACHINE_DATA_KEY, JSON.stringify(updatedMachineData));
      return true;
    } catch (error) {
      console.error('Error deleting machine data:', error);
      return false;
    }
  },

  // Clear ALL machine data from localStorage
  clearAllMachineData: (): void => {
    try {
      localStorage.removeItem(MACHINE_DATA_KEY);
    } catch (error) {
      console.error('Error clearing machine data from localStorage:', error);
    }
  },

  // Check if machine data exists for a specific valueInfoId
  hasMachineDataForInfoId: (valueInfoId: string): boolean => {
    const allMachineData = MachineDataLocalStorage.getAllMachineData();
    return allMachineData.some(machine => machine.valueInfoId === valueInfoId);
  },

  // Get machine data count
  getMachineDataCount: (): number => {
    const allMachineData = MachineDataLocalStorage.getAllMachineData();
    return allMachineData.length;
  }
};