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
  status: string; // Status string, defaults to "unploaded"
  uploaded?: boolean; // ADD THIS - to track if form has been uploaded
  synced_id?: string; // ADD THIS - to store the database form_id after upload
  userId?: string; // ADD THIS - optional user ID
}

const FORM_DATA_KEY = 'formData';

// Helper function to generate random string ID
const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export const FormDataLocalStorage = {
  // Get ALL form data from localStorage
  getAllFormData: (): FormData[] => {
    try {
      const storedData = localStorage.getItem(FORM_DATA_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
      return [];
    } catch (error) {
      console.error('Error retrieving form data from localStorage:', error);
      return [];
    }
  },

  // Get a specific form by ID
  getFormData: (id: string): FormData | null => {
    try {
      const allForms = FormDataLocalStorage.getAllFormData();
      return allForms.find(form => form.id === id) || null;
    } catch (error) {
      console.error('Error retrieving form data from localStorage:', error);
      return null;
    }
  },

  // Save NEW form data to localStorage with generated ID and default status
  saveFormData: (formData: Omit<FormData, 'id' | 'status' | 'uploaded'>): FormData => {
    try {
      const allForms = FormDataLocalStorage.getAllFormData();
      const newForm: FormData = {
        ...formData,
        id: generateRandomId(),
        status: 'unploaded', // Automatically add status with default value
        uploaded: false // ADD THIS - default to not uploaded
      };
      
      const updatedForms = [...allForms, newForm];
      localStorage.setItem(FORM_DATA_KEY, JSON.stringify(updatedForms));
      return newForm;
    } catch (error) {
      console.error('Error saving form data to localStorage:', error);
      throw error;
    }
  },

  // Update existing form data
  updateFormData: (id: string, updates: Partial<FormData>): FormData | null => {
    try {
      const allForms = FormDataLocalStorage.getAllFormData();
      const formIndex = allForms.findIndex(form => form.id === id);
      
      if (formIndex === -1) {
        return null;
      }
      
      const updatedForm = { 
        ...allForms[formIndex], 
        ...updates
      };
      
      allForms[formIndex] = updatedForm;
      localStorage.setItem(FORM_DATA_KEY, JSON.stringify(allForms));
      return updatedForm;
    } catch (error) {
      console.error('Error updating form data:', error);
      return null;
    }
  },

  // Delete form data
  deleteFormData: (id: string): boolean => {
    try {
      const allForms = FormDataLocalStorage.getAllFormData();
      const updatedForms = allForms.filter(form => form.id !== id);
      localStorage.setItem(FORM_DATA_KEY, JSON.stringify(updatedForms));
      return true;
    } catch (error) {
      console.error('Error deleting form data:', error);
      return false;
    }
  },

  // Clear ALL form data from localStorage
  clearAllFormData: (): void => {
    try {
      localStorage.removeItem(FORM_DATA_KEY);
    } catch (error) {
      console.error('Error clearing form data from localStorage:', error);
    }
  },

  // Get form data by status
  getFormDataByStatus: (status: string): FormData[] => {
    const allForms = FormDataLocalStorage.getAllFormData();
    return allForms.filter(form => form.status === status);
  },

  // Get uploaded forms
  getUploadedForms: (): FormData[] => {
    const allForms = FormDataLocalStorage.getAllFormData();
    return allForms.filter(form => form.uploaded === true);
  },

  // Get unuploaded forms
  getUnuploadedForms: (): FormData[] => {
    const allForms = FormDataLocalStorage.getAllFormData();
    return allForms.filter(form => form.uploaded !== true);
  },

  // Update status of form data
  updateFormDataStatus: (id: string, status: string): FormData | null => {
    return FormDataLocalStorage.updateFormData(id, { status });
  },

  // Mark form as uploaded
  markFormAsUploaded: (id: string, synced_id: string): FormData | null => {
    return FormDataLocalStorage.updateFormData(id, { 
      uploaded: true, 
      synced_id, 
      status: 'New' 
    });
  },

  // Generate a new random ID
  generateId: (): string => {
    return generateRandomId();
  }
};