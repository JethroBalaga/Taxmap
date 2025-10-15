// src/utils/PhotoTagLocalStorage.ts
import { Geolocation } from '@capacitor/geolocation';

export interface PhotoTagData {
  id: string;
  photoName: string;
  longitude: number;
  latitude: number;
  timestamp: Date;
}

const PHOTO_TAGS_KEY = 'photoTags';

// Helper function to generate random string ID (consistent with FormDataLocalStorage)
const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Simple distance calculation (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const PhotoTagLocalStorage = {
  // Get ALL photo tags from localStorage
  getAllPhotoTags: (): PhotoTagData[] => {
    try {
      const storedData = localStorage.getItem(PHOTO_TAGS_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Handle both array format and legacy single object format
        if (Array.isArray(parsedData)) {
          return parsedData.map((tag: any) => ({
            ...tag,
            timestamp: new Date(tag.timestamp)
          }));
        } else if (parsedData && typeof parsedData === 'object' && parsedData.id) {
          // Convert legacy single object to array
          const convertedData = [{
            ...parsedData,
            timestamp: new Date(parsedData.timestamp)
          }];
          // Update storage to new format
          localStorage.setItem(PHOTO_TAGS_KEY, JSON.stringify(convertedData));
          return convertedData;
        }
      }
      return [];
    } catch (error) {
      console.error('Error retrieving photo tags from localStorage:', error);
      return [];
    }
  },

  // Save ALL photo tags to localStorage
  saveAllPhotoTags: (photoTags: PhotoTagData[]): void => {
    try {
      localStorage.setItem(PHOTO_TAGS_KEY, JSON.stringify(photoTags));
    } catch (error) {
      console.error('Error saving photo tags to localStorage:', error);
    }
  },

  // Get a specific photo tag by ID
  getPhotoTag: (id: string): PhotoTagData | null => {
    try {
      const allPhotoTags = PhotoTagLocalStorage.getAllPhotoTags();
      return allPhotoTags.find(tag => tag.id === id) || null;
    } catch (error) {
      console.error('Error retrieving photo tag from localStorage:', error);
      return null;
    }
  },

  // Add a new photo tag with consistent ID generation
  addPhotoTag: (photoTagData: Omit<PhotoTagData, 'id'>): PhotoTagData => {
    try {
      const allPhotoTags = PhotoTagLocalStorage.getAllPhotoTags();
      const newPhotoTag: PhotoTagData = {
        ...photoTagData,
        id: generateRandomId()
      };
      
      const updatedPhotoTags = [...allPhotoTags, newPhotoTag];
      PhotoTagLocalStorage.saveAllPhotoTags(updatedPhotoTags);
      
      return newPhotoTag;
    } catch (error) {
      console.error('Error adding photo tag:', error);
      throw error;
    }
  },

  // Add photo tag with current location
  async addPhotoTagWithCurrentLocation(photoName: string): Promise<PhotoTagData> {
    try {
      let latitude = 0;
      let longitude = 0;

      try {
        // Use the working pattern from GeoTag service
        const position = await Geolocation.getCurrentPosition();
        
        if (position?.coords) {
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        }
      } catch (locationError) {
        console.warn('Could not get location, using default coordinates:', locationError);
      }

      return PhotoTagLocalStorage.addPhotoTag({
        photoName,
        longitude,
        latitude,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error adding photo tag with location:', error);
      throw error;
    }
  },

  // Update specific fields in photo tag data
  updatePhotoTag: (id: string, updates: Partial<PhotoTagData>): PhotoTagData | null => {
    try {
      const allPhotoTags = PhotoTagLocalStorage.getAllPhotoTags();
      const tagIndex = allPhotoTags.findIndex(tag => tag.id === id);
      
      if (tagIndex === -1) {
        return null;
      }
      
      const updatedTag = { 
        ...allPhotoTags[tagIndex], 
        ...updates
      };
      
      const updatedPhotoTags = [...allPhotoTags];
      updatedPhotoTags[tagIndex] = updatedTag;
      
      PhotoTagLocalStorage.saveAllPhotoTags(updatedPhotoTags);
      return updatedTag;
    } catch (error) {
      console.error('Error updating photo tag:', error);
      return null;
    }
  },

  // Delete photo tag by ID
  deletePhotoTag: (id: string): boolean => {
    try {
      const allPhotoTags = PhotoTagLocalStorage.getAllPhotoTags();
      const filteredTags = allPhotoTags.filter(tag => tag.id !== id);
      PhotoTagLocalStorage.saveAllPhotoTags(filteredTags);
      return true;
    } catch (error) {
      console.error('Error deleting photo tag:', error);
      return false;
    }
  },

  // Clear ALL photo tags from localStorage
  clearAllPhotoTags: (): void => {
    try {
      localStorage.removeItem(PHOTO_TAGS_KEY);
    } catch (error) {
      console.error('Error clearing photo tags from localStorage:', error);
    }
  },

  // Get photo tags by coordinates (within a certain radius)
  getPhotoTagsByLocation: (latitude: number, longitude: number, radiusMeters: number = 100): PhotoTagData[] => {
    const allPhotoTags = PhotoTagLocalStorage.getAllPhotoTags();
    
    return allPhotoTags.filter(tag => {
      const distance = calculateDistance(
        latitude, longitude, tag.latitude, tag.longitude
      );
      return distance <= radiusMeters;
    });
  },

  // Get photo tags count
  getPhotoTagsCount: (): number => {
    const allPhotoTags = PhotoTagLocalStorage.getAllPhotoTags();
    return allPhotoTags.length;
  },

  // Generate a new random ID (consistent with FormDataLocalStorage)
  generateId: (): string => {
    return generateRandomId();
  }
};