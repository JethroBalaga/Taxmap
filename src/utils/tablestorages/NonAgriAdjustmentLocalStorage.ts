// src/utils/tablestorages/NonAgriAdjustmentLocalStorage.ts
export interface NonAgriAdjustment {
  valueInfoId: string;
  adjustmentId: string;
  additionalFactor?: number; // New optional field
}

const NON_AGRI_ADJUSTMENT_KEY = 'nonAgriAdjustments';

export const NonAgriAdjustmentLocalStorage = {
  // Get ALL non-agri adjustments from localStorage
  getAllNonAgriAdjustments: (): NonAgriAdjustment[] => {
    try {
      const storedData = localStorage.getItem(NON_AGRI_ADJUSTMENT_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
      return [];
    } catch (error) {
      console.error('Error retrieving non-agri adjustments from localStorage:', error);
      return [];
    }
  },

  // Get adjustments by valueInfoId
  getAdjustmentsByValueInfoId: (valueInfoId: string): NonAgriAdjustment[] => {
    try {
      const allAdjustments = NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
      return allAdjustments.filter(adj => adj.valueInfoId === valueInfoId);
    } catch (error) {
      console.error('Error retrieving adjustments by valueInfoId:', error);
      return [];
    }
  },

  // Get adjustments by adjustmentId
  getAdjustmentsByAdjustmentId: (adjustmentId: string): NonAgriAdjustment[] => {
    try {
      const allAdjustments = NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
      return allAdjustments.filter(adj => adj.adjustmentId === adjustmentId);
    } catch (error) {
      console.error('Error retrieving adjustments by adjustmentId:', error);
      return [];
    }
  },

  // Save NEW non-agri adjustment to localStorage
  saveNonAgriAdjustment: (adjustment: NonAgriAdjustment): NonAgriAdjustment => {
    try {
      const allAdjustments = NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
      
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
      
      localStorage.setItem(NON_AGRI_ADJUSTMENT_KEY, JSON.stringify(updatedAdjustments));
      return adjustment;
    } catch (error) {
      console.error('Error saving non-agri adjustment to localStorage:', error);
      throw error;
    }
  },

  // Update additional factor for existing adjustment
  updateAdditionalFactor: (valueInfoId: string, adjustmentId: string, additionalFactor: number): boolean => {
    try {
      const allAdjustments = NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
      const existingIndex = allAdjustments.findIndex(
        adj => adj.valueInfoId === valueInfoId && adj.adjustmentId === adjustmentId
      );
      
      if (existingIndex >= 0) {
        const updatedAdjustments = [...allAdjustments];
        updatedAdjustments[existingIndex] = {
          ...updatedAdjustments[existingIndex],
          additionalFactor
        };
        localStorage.setItem(NON_AGRI_ADJUSTMENT_KEY, JSON.stringify(updatedAdjustments));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating additional factor:', error);
      return false;
    }
  },

  // Get additional factor for specific adjustment
  getAdditionalFactor: (valueInfoId: string, adjustmentId: string): number | undefined => {
    try {
      const allAdjustments = NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
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
  deleteNonAgriAdjustment: (valueInfoId: string, adjustmentId: string): boolean => {
    try {
      const allAdjustments = NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
      const updatedAdjustments = allAdjustments.filter(
        adj => !(adj.valueInfoId === valueInfoId && adj.adjustmentId === adjustmentId)
      );
      localStorage.setItem(NON_AGRI_ADJUSTMENT_KEY, JSON.stringify(updatedAdjustments));
      return true;
    } catch (error) {
      console.error('Error deleting non-agri adjustment:', error);
      return false;
    }
  },

  // Delete all adjustments for a specific valueInfoId
  deleteAllAdjustmentsByValueInfoId: (valueInfoId: string): boolean => {
    try {
      const allAdjustments = NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
      const updatedAdjustments = allAdjustments.filter(
        adj => adj.valueInfoId !== valueInfoId
      );
      localStorage.setItem(NON_AGRI_ADJUSTMENT_KEY, JSON.stringify(updatedAdjustments));
      return true;
    } catch (error) {
      console.error('Error deleting adjustments by valueInfoId:', error);
      return false;
    }
  },

  // Delete all adjustments for a specific adjustmentId
  deleteAllAdjustmentsByAdjustmentId: (adjustmentId: string): boolean => {
    try {
      const allAdjustments = NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
      const updatedAdjustments = allAdjustments.filter(
        adj => adj.adjustmentId !== adjustmentId
      );
      localStorage.setItem(NON_AGRI_ADJUSTMENT_KEY, JSON.stringify(updatedAdjustments));
      return true;
    } catch (error) {
      console.error('Error deleting adjustments by adjustmentId:', error);
      return false;
    }
  },

  // Clear ALL non-agri adjustments from localStorage
  clearAllNonAgriAdjustments: (): void => {
    try {
      localStorage.removeItem(NON_AGRI_ADJUSTMENT_KEY);
    } catch (error) {
      console.error('Error clearing non-agri adjustments from localStorage:', error);
    }
  },

  // Check if adjustment exists for specific valueInfoId and adjustmentId
  hasAdjustment: (valueInfoId: string, adjustmentId: string): boolean => {
    const allAdjustments = NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
    return allAdjustments.some(adj => 
      adj.valueInfoId === valueInfoId && adj.adjustmentId === adjustmentId
    );
  },

  // Check if adjustment has additional factor
  hasAdditionalFactor: (valueInfoId: string, adjustmentId: string): boolean => {
    const allAdjustments = NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
    const adjustment = allAdjustments.find(
      adj => adj.valueInfoId === valueInfoId && adj.adjustmentId === adjustmentId
    );
    return adjustment?.additionalFactor !== undefined;
  },

  // Check if any adjustments exist for a valueInfoId
  hasAdjustmentsForValueInfoId: (valueInfoId: string): boolean => {
    const allAdjustments = NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
    return allAdjustments.some(adj => adj.valueInfoId === valueInfoId);
  },

  // Check if any adjustments exist for an adjustmentId
  hasAdjustmentsForAdjustmentId: (adjustmentId: string): boolean => {
    const allAdjustments = NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
    return allAdjustments.some(adj => adj.adjustmentId === adjustmentId);
  },

  // Get adjustment count
  getAdjustmentCount: (): number => {
    const allAdjustments = NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
    return allAdjustments.length;
  },

  // Get adjustments with additional factors
  getAdjustmentsWithAdditionalFactors: (): NonAgriAdjustment[] => {
    const allAdjustments = NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
    return allAdjustments.filter(adj => adj.additionalFactor !== undefined);
  },

  // Get unique valueInfoIds
  getUniqueValueInfoIds: (): string[] => {
    const allAdjustments = NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
    const uniqueIds = [...new Set(allAdjustments.map(adj => adj.valueInfoId))];
    return uniqueIds;
  },

  // Get unique adjustmentIds
  getUniqueAdjustmentIds: (): string[] => {
    const allAdjustments = NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments();
    const uniqueIds = [...new Set(allAdjustments.map(adj => adj.adjustmentId))];
    return uniqueIds;
  }
};