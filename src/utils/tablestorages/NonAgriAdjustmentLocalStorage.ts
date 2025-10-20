// src/utils/tablestorages/NonAgriAdjustmentLocalStorage.ts
import localforage from 'localforage';

export interface NonAgriAdjustment {
  valueInfoId: string;
  adjustmentId: string;
  additionalFactor?: number; // New optional field
}

const NON_AGRI_ADJUSTMENT_KEY = 'nonAgriAdjustments';

// Configure localforage instance for non-agri adjustments
const nonAgriAdjustmentStore = localforage.createInstance({
  name: 'NonAgriAdjustmentStorage',
  description: 'Storage for non-agricultural adjustment entries'
});

export const NonAgriAdjustmentLocalStorage = {
  // Get ALL non-agri adjustments from localforage
  getAllNonAgriAdjustments: async (): Promise<NonAgriAdjustment[]> => {
    try {
      const storedData = await nonAgriAdjustmentStore.getItem<NonAgriAdjustment[]>(NON_AGRI_ADJUSTMENT_KEY);
      return storedData || [];
    } catch (error) {
      console.error('Error retrieving non-agri adjustments from localforage:', error);
      return [];
    }
  },

  // Get adjustments by valueInfoId
  getAdjustmentsByValueInfoId: async (valueInfoId: string): Promise<NonAgriAdjustment[]> => {
    try {
      const allAdjustments = await NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
      return allAdjustments.filter(adj => adj.valueInfoId === valueInfoId);
    } catch (error) {
      console.error('Error retrieving adjustments by valueInfoId:', error);
      return [];
    }
  },

  // Get adjustments by adjustmentId
  getAdjustmentsByAdjustmentId: async (adjustmentId: string): Promise<NonAgriAdjustment[]> => {
    try {
      const allAdjustments = await NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
      return allAdjustments.filter(adj => adj.adjustmentId === adjustmentId);
    } catch (error) {
      console.error('Error retrieving adjustments by adjustmentId:', error);
      return [];
    }
  },

  // Save NEW non-agri adjustment to localforage
  saveNonAgriAdjustment: async (adjustment: NonAgriAdjustment): Promise<NonAgriAdjustment> => {
    try {
      const allAdjustments = await NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
      
      // Check if adjustment already exists (same valueInfoId and adjustmentId combination)
      const existingIndex = allAdjustments.findIndex(
        adj => adj.valueInfoId === adjustment.valueInfoId && adj.adjustmentId === adjustment.adjustmentId
      );
      
      let updatedAdjustments;
      if (existingIndex >= 0) {
        // Update existing entry
        updatedAdjustments = [...allAdjustments];
        updatedAdjustments[existingIndex] = adjustment;
      } else {
        // Add new entry
        updatedAdjustments = [...allAdjustments, adjustment];
      }
      
      await nonAgriAdjustmentStore.setItem(NON_AGRI_ADJUSTMENT_KEY, updatedAdjustments);
      return adjustment;
    } catch (error) {
      console.error('Error saving non-agri adjustment to localforage:', error);
      throw error;
    }
  },

  // Update additional factor for existing adjustment
  updateAdditionalFactor: async (valueInfoId: string, adjustmentId: string, additionalFactor: number): Promise<boolean> => {
    try {
      const allAdjustments = await NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
      const existingIndex = allAdjustments.findIndex(
        adj => adj.valueInfoId === valueInfoId && adj.adjustmentId === adjustmentId
      );
      
      if (existingIndex >= 0) {
        const updatedAdjustments = [...allAdjustments];
        updatedAdjustments[existingIndex] = {
          ...updatedAdjustments[existingIndex],
          additionalFactor
        };
        await nonAgriAdjustmentStore.setItem(NON_AGRI_ADJUSTMENT_KEY, updatedAdjustments);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating additional factor:', error);
      return false;
    }
  },

  // Get additional factor for specific adjustment
  getAdditionalFactor: async (valueInfoId: string, adjustmentId: string): Promise<number | undefined> => {
    try {
      const allAdjustments = await NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
      const adjustment = allAdjustments.find(
        adj => adj.valueInfoId === valueInfoId && adj.adjustmentId === adjustmentId
      );
      return adjustment?.additionalFactor;
    } catch (error) {
      console.error('Error retrieving additional factor:', error);
      return undefined;
    }
  },

  // Delete specific non-agri adjustment
  deleteNonAgriAdjustment: async (valueInfoId: string, adjustmentId: string): Promise<boolean> => {
    try {
      const allAdjustments = await NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
      const updatedAdjustments = allAdjustments.filter(
        adj => !(adj.valueInfoId === valueInfoId && adj.adjustmentId === adjustmentId)
      );
      await nonAgriAdjustmentStore.setItem(NON_AGRI_ADJUSTMENT_KEY, updatedAdjustments);
      return true;
    } catch (error) {
      console.error('Error deleting non-agri adjustment:', error);
      return false;
    }
  },

  // Delete all adjustments for a specific valueInfoId
  deleteAllAdjustmentsByValueInfoId: async (valueInfoId: string): Promise<boolean> => {
    try {
      const allAdjustments = await NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
      const updatedAdjustments = allAdjustments.filter(
        adj => adj.valueInfoId !== valueInfoId
      );
      await nonAgriAdjustmentStore.setItem(NON_AGRI_ADJUSTMENT_KEY, updatedAdjustments);
      return true;
    } catch (error) {
      console.error('Error deleting adjustments by valueInfoId:', error);
      return false;
    }
  },

  // Delete all adjustments for a specific adjustmentId
  deleteAllAdjustmentsByAdjustmentId: async (adjustmentId: string): Promise<boolean> => {
    try {
      const allAdjustments = await NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
      const updatedAdjustments = allAdjustments.filter(
        adj => adj.adjustmentId !== adjustmentId
      );
      await nonAgriAdjustmentStore.setItem(NON_AGRI_ADJUSTMENT_KEY, updatedAdjustments);
      return true;
    } catch (error) {
      console.error('Error deleting adjustments by adjustmentId:', error);
      return false;
    }
  },

  // Clear ALL non-agri adjustments from localforage
  clearAllNonAgriAdjustments: async (): Promise<void> => {
    try {
      await nonAgriAdjustmentStore.removeItem(NON_AGRI_ADJUSTMENT_KEY);
    } catch (error) {
      console.error('Error clearing non-agri adjustments from localforage:', error);
    }
  },

  // Check if adjustment exists for specific valueInfoId and adjustmentId
  hasAdjustment: async (valueInfoId: string, adjustmentId: string): Promise<boolean> => {
    const allAdjustments = await NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
    return allAdjustments.some(adj => 
      adj.valueInfoId === valueInfoId && adj.adjustmentId === adjustmentId
    );
  },

  // Check if adjustment has additional factor
  hasAdditionalFactor: async (valueInfoId: string, adjustmentId: string): Promise<boolean> => {
    const allAdjustments = await NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
    const adjustment = allAdjustments.find(
      adj => adj.valueInfoId === valueInfoId && adj.adjustmentId === adjustmentId
    );
    return adjustment?.additionalFactor !== undefined;
  },

  // Check if any adjustments exist for a valueInfoId
  hasAdjustmentsForValueInfoId: async (valueInfoId: string): Promise<boolean> => {
    const allAdjustments = await NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
    return allAdjustments.some(adj => adj.valueInfoId === valueInfoId);
  },

  // Check if any adjustments exist for an adjustmentId
  hasAdjustmentsForAdjustmentId: async (adjustmentId: string): Promise<boolean> => {
    const allAdjustments = await NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
    return allAdjustments.some(adj => adj.adjustmentId === adjustmentId);
  },

  // Get adjustment count
  getAdjustmentCount: async (): Promise<number> => {
    const allAdjustments = await NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
    return allAdjustments.length;
  },

  // Get adjustments with additional factors
  getAdjustmentsWithAdditionalFactors: async (): Promise<NonAgriAdjustment[]> => {
    const allAdjustments = await NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
    return allAdjustments.filter(adj => adj.additionalFactor !== undefined);
  },

  // Get unique valueInfoIds
  getUniqueValueInfoIds: async (): Promise<string[]> => {
    const allAdjustments = await NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
    const uniqueIds = [...new Set(allAdjustments.map(adj => adj.valueInfoId))];
    return uniqueIds;
  },

  // Get unique adjustmentIds
  getUniqueAdjustmentIds: async (): Promise<string[]> => {
    const allAdjustments = await NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
    const uniqueIds = [...new Set(allAdjustments.map(adj => adj.adjustmentId))];
    return uniqueIds;
  }
};