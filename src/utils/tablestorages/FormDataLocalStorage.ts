// src/utils/FormDataLocalStorage.ts
import localforage from 'localforage';

export interface FormData {
  id: string; // Random primary key
  district: number | null;
  declarant: string; // CHANGED: Now a string instead of declarantId number
  kind: string;
  classification: string;
  subclass: string;
  actualUse: string;
  area: number;
  status: string; // Status string, defaults to "unploaded"
  uploaded?: boolean; // ADD THIS - to track if form has been uploaded
  synced_id?: string; // ADD THIS - to store the database form_id after upload
  userId?: string; // ADD THIS - optional user ID
}

const FORM_DATA_KEY = 'formData';

// Configure localForage instance
const formDataStorage = localforage.createInstance({
  name: 'FormDataDB',
  storeName: 'form_data_store'
});

// Helper function to generate random string ID
const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export const FormDataLocalStorage = {
  // Get ALL form data from localForage
  getAllFormData: async (): Promise<FormData[]> => {
    try {
      const storedData = await formDataStorage.getItem<FormData[]>(FORM_DATA_KEY);
      return storedData || [];
    } catch (error) {
      console.error('Error retrieving form data from localForage:', error);
      return [];
    }
  },

  // Get a specific form by ID
  getFormData: async (id: string): Promise<FormData | null> => {
    try {
      const allForms = await FormDataLocalStorage.getAllFormData();
      return allForms.find(form => form.id === id) || null;
    } catch (error) {
      console.error('Error retrieving form data from localForage:', error);
      return null;
    }
  },

  // Save NEW form data to localForage with generated ID and default status
  saveFormData: async (formData: Omit<FormData, 'id' | 'status' | 'uploaded'>): Promise<FormData> => {
    try {
      const allForms = await FormDataLocalStorage.getAllFormData();
      const newForm: FormData = {
        ...formData,
        id: generateRandomId(),
        status: 'unploaded', // Automatically add status with default value
        uploaded: false // ADD THIS - default to not uploaded
      };
      
      const updatedForms = [...allForms, newForm];
      await formDataStorage.setItem(FORM_DATA_KEY, updatedForms);
      return newForm;
    } catch (error) {
      console.error('Error saving form data to localForage:', error);
      throw error;
    }
  },

  // Update existing form data
  updateFormData: async (id: string, updates: Partial<FormData>): Promise<FormData | null> => {
    try {
      const allForms = await FormDataLocalStorage.getAllFormData();
      const formIndex = allForms.findIndex(form => form.id === id);
      
      if (formIndex === -1) {
        return null;
      }
      
      const updatedForm = { 
        ...allForms[formIndex], 
        ...updates
      };
      
      allForms[formIndex] = updatedForm;
      await formDataStorage.setItem(FORM_DATA_KEY, allForms);
      return updatedForm;
    } catch (error) {
      console.error('Error updating form data:', error);
      return null;
    }
  },

  // Delete form data
  deleteFormData: async (id: string): Promise<boolean> => {
    try {
      const allForms = await FormDataLocalStorage.getAllFormData();
      const updatedForms = allForms.filter(form => form.id !== id);
      await formDataStorage.setItem(FORM_DATA_KEY, updatedForms);
      return true;
    } catch (error) {
      console.error('Error deleting form data:', error);
      return false;
    }
  },

  // Clear ALL form data from localForage
  clearAllFormData: async (): Promise<void> => {
    try {
      await formDataStorage.removeItem(FORM_DATA_KEY);
    } catch (error) {
      console.error('Error clearing form data from localForage:', error);
    }
  },

  // Get form data by status
  getFormDataByStatus: async (status: string): Promise<FormData[]> => {
    const allForms = await FormDataLocalStorage.getAllFormData();
    return allForms.filter(form => form.status === status);
  },

  // Get uploaded forms
  getUploadedForms: async (): Promise<FormData[]> => {
    const allForms = await FormDataLocalStorage.getAllFormData();
    return allForms.filter(form => form.uploaded === true);
  },

  // Get unuploaded forms
  getUnuploadedForms: async (): Promise<FormData[]> => {
    const allForms = await FormDataLocalStorage.getAllFormData();
    return allForms.filter(form => form.uploaded !== true);
  },

  // Update status of form data
  updateFormDataStatus: async (id: string, status: string): Promise<FormData | null> => {
    return await FormDataLocalStorage.updateFormData(id, { status });
  },

  // Mark form as uploaded
  markFormAsUploaded: async (id: string, synced_id: string): Promise<FormData | null> => {
    return await FormDataLocalStorage.updateFormData(id, { 
      uploaded: true, 
      synced_id, 
      status: 'New' 
    });
  },

  // Generate a new random ID
  generateId: (): string => {
    return generateRandomId();
  },

  // NEW: Search forms by declarant name
  searchFormsByDeclarant: async (declarantName: string): Promise<FormData[]> => {
    const allForms = await FormDataLocalStorage.getAllFormData();
    const searchTerm = declarantName.toLowerCase();
    return allForms.filter(form => 
      form.declarant && form.declarant.toLowerCase().includes(searchTerm)
    );
  },

  // NEW: Get all unique declarant names
  getAllDeclarants: async (): Promise<string[]> => {
    const allForms = await FormDataLocalStorage.getAllFormData();
    const declarants = allForms
      .map(form => form.declarant)
      .filter((declarant): declarant is string => !!declarant); // Filter out null/undefined
    return [...new Set(declarants)]; // Return unique values
  }
};