// Helper function to validate and convert dates
export const validateDate = (dateString: string | null): string | null => {
  if (dateString == null || dateString === '') return null;
  
  const dateToValidate = typeof dateString === 'string' ? dateString : String(dateString);
  
  try {
    const date = new Date(dateToValidate);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  } catch {
    return null;
  }
};

// Helper function to validate numbers
export const validateNumber = (value: any): number | null => {
  if (value == null || value === '') return null;
  
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const num = parseFloat(trimmed);
    return isNaN(num) ? null : num;
  }
  
  try {
    const num = parseFloat(String(value));
    return isNaN(num) ? null : num;
  } catch {
    return null;
  }
};