// src/utils/FormDataLocalStorage.ts
export interface FormData {
  district: number | null;
  declarantId: number | null;
  kind: string;
  classification: string;
  subclass: string;
  actualUse: string;
  area: number;
}

const FORM_DATA_KEY = 'formData';

export const FormDataLocalStorage = {
  // Save form data to localStorage
  saveFormData: (formData: FormData): void => {
    try {
      localStorage.setItem(FORM_DATA_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error('Error saving form data to localStorage:', error);
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

  // Update specific fields in form data
  updateFormData: (updates: Partial<FormData>): FormData | null => {
    try {
      const currentData = FormDataLocalStorage.getFormData();
      const updatedData = { ...currentData, ...updates } as FormData;
      FormDataLocalStorage.saveFormData(updatedData);
      return updatedData;
    } catch (error) {
      console.error('Error updating form data:', error);
      return null;
    }
  }
};