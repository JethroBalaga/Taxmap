import { Filesystem, Directory } from '@capacitor/filesystem';

// Generate a unique filename for the photo
export const generateFileName = (): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const random = Math.random().toString(36).substr(2, 6);
  return `photo_${timestamp}_${random}.jpg`;
};

// Calculate file size from data URL
export const getFileSize = (dataURL: string): number => {
  const base64 = dataURL.split(',')[1];
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return (base64.length * 3) / 4 - padding;
};

// Function to save the image - native mobile only
export const saveImageToStorage = async (dataUrl: string, fileName: string): Promise<string> => {
  try {
    const base64Data = dataUrl.split(',')[1];
    
    if (!base64Data) {
      throw new Error('Invalid data URL format');
    }

    // Mobile - use Filesystem API
    const result = await Filesystem.writeFile({
      path: `phototags/${fileName}`,
      data: base64Data,
      directory: Directory.Data,
      recursive: true
    });

    console.log('Image saved to mobile storage:', result.uri);
    return result.uri;
    
  } catch (error: any) {
    console.error('Error saving image:', error);
    throw new Error(`Failed to save image: ${error.message}`);
  }
};

// Format coordinates for display
export const formatCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

// Return original coordinates without adjustment
export const adjustCoordinates = (lat: number, lng: number): {latitude: number; longitude: number} => {
  console.log(`Using original coordinates: ${lat}, ${lng}`);
  
  return {
    latitude: lat,
    longitude: lng
  };
};

// Format data for display in the modal
export const formatDataForDisplay = (data: any): string => {
  if (!data) return 'No data';
  return JSON.stringify(data, null, 2);
};