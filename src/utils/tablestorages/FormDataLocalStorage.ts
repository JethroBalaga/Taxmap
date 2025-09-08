// src/utils/FormDataLocalStorage.ts
export interface FormData {
  id: string; // Random primary key
  district: number | null;
  declarantId: number | null;
  kind: string;
  classification: string;
  subclass: string;
  actualUse: string;
  area: number;
}

const FORM_DATA_KEY = 'formData';

// Helper function to generate random string ID
const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export const FormDataLocalStorage = {
  // Save form data to localStorage with generated ID
  saveFormData: (formData: Omit<FormData, 'id'> & { id?: string }): FormData => {
    try {
      // Generate ID if not provided
      const dataWithId: FormData = {
        ...formData,
        id: formData.id || generateRandomId()
      };
      
      localStorage.setItem(FORM_DATA_KEY, JSON.stringify(dataWithId));
      return dataWithId;
    } catch (error) {
      console.error('Error saving form data to localStorage:', error);
      throw error;
    }
  },

  // Get form data from localStorage
  getFormData: (): FormData | null => {
    try {
      const storedData = localStorage.getItem(FORM_DATA_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
      return null;
    } catch (error) {
      console.error('Error retrieving form data from localStorage:', error);
      return null;
    }
  },

  // Clear form data from localStorage
  clearFormData: (): void => {
    try {
      localStorage.removeItem(FORM_DATA_KEY);
    } catch (error) {
      console.error('Error clearing form data from localStorage:', error);
    }
  },

  // Update specific fields in form data (preserves existing ID)
  updateFormData: (updates: Partial<FormData>): FormData | null => {
    try {
      const currentData = FormDataLocalStorage.getFormData();
      if (!currentData) {
        return null;
      }
      
      // Ensure we don't override the ID unless explicitly provided
      const updatedData = { 
        ...currentData, 
        ...updates,
        id: updates.id || currentData.id // Keep existing ID unless new one provided
      };
      
      FormDataLocalStorage.saveFormData(updatedData);
      return updatedData;
    } catch (error) {
      console.error('Error updating form data:', error);
      return null;
    }
  },

  // Generate a new random ID (optional utility method)
  generateId: (): string => {
    return generateRandomId();
  }
};