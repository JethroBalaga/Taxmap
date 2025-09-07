// src/utils/PhotoTagLocalStorage.ts
export interface PhotoTagData {
  id: string;
  photoPath: string;
  longitude: number;
  latitude: number;
  timestamp: Date;
  formDataId?: string; // Reference to form data
  buildingDataId?: string; // Reference to building data
  accuracy?: number; // GPS accuracy in meters
  altitude?: number; // Altitude in meters
}

const PHOTO_TAGS_KEY = 'photoTags';

export const PhotoTagLocalStorage = {
  // Save all photo tags
  savePhotoTags: (photoTags: PhotoTagData[]): void => {
    try {
      localStorage.setItem(PHOTO_TAGS_KEY, JSON.stringify(photoTags));
    } catch (error) {
      console.error('Error saving photo tags to localStorage:', error);
    }
  },

  // Get all photo tags
  getPhotoTags: (): PhotoTagData[] => {
    try {
      const storedData = localStorage.getItem(PHOTO_TAGS_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Convert timestamp strings back to Date objects
        return parsedData.map((tag: any) => ({
          ...tag,
          timestamp: new Date(tag.timestamp)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error retrieving photo tags from localStorage:', error);
      return [];
    }
  },

  // Add a new photo tag
  addPhotoTag: (photoTag: Omit<PhotoTagData, 'id'>): PhotoTagData => {
    try {
      const photoTags = PhotoTagLocalStorage.getPhotoTags();
      const newPhotoTag: PhotoTagData = {
        ...photoTag,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      };
      
      const updatedPhotoTags = [...photoTags, newPhotoTag];
      PhotoTagLocalStorage.savePhotoTags(updatedPhotoTags);
      
      return newPhotoTag;
    } catch (error) {
      console.error('Error adding photo tag:', error);
      throw error;
    }
  },

  // Get photo tag by ID
  getPhotoTagById: (id: string): PhotoTagData | null => {
    const photoTags = PhotoTagLocalStorage.getPhotoTags();
    return photoTags.find(tag => tag.id === id) || null;
  },

  // Delete photo tag by ID
  deletePhotoTag: (id: string): void => {
    try {
      const photoTags = PhotoTagLocalStorage.getPhotoTags();
      const filteredTags = photoTags.filter(tag => tag.id !== id);
      PhotoTagLocalStorage.savePhotoTags(filteredTags);
    } catch (error) {
      console.error('Error deleting photo tag:', error);
    }
  },

  // Clear all photo tags
  clearPhotoTags: (): void => {
    try {
      localStorage.removeItem(PHOTO_TAGS_KEY);
    } catch (error) {
      console.error('Error clearing photo tags from localStorage:', error);
    }
  },

  // Get photo tags by coordinates (within a certain radius)
  getPhotoTagsByLocation: (latitude: number, longitude: number, radiusMeters: number = 100): PhotoTagData[] => {
    const photoTags = PhotoTagLocalStorage.getPhotoTags();
    
    return photoTags.filter(tag => {
      const distance = PhotoTagLocalStorage.calculateDistance(
        latitude, longitude, tag.latitude, tag.longitude
      );
      return distance <= radiusMeters;
    });
  },

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
};