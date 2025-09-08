// src/utils/PhotoTagLocalStorage.ts
import { Geolocation } from '@capacitor/geolocation';

export interface PhotoTagData {
  id: string;
  photoPath: string;
  longitude: number;
  latitude: number;
  timestamp: Date;
  accuracy?: number;
  altitude?: number;
  formDataId?: string;
  buildingDataId?: string;
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

  // Add a new photo tag with consistent ID generation
  addPhotoTag: (photoTagData: Omit<PhotoTagData, 'id'> & { id?: string }): PhotoTagData => {
    try {
      const photoTags = PhotoTagLocalStorage.getPhotoTags();
      const newPhotoTag: PhotoTagData = {
        ...photoTagData,
        id: photoTagData.id || generateRandomId() // Use provided ID or generate random one
      };
      
      const updatedPhotoTags = [...photoTags, newPhotoTag];
      PhotoTagLocalStorage.savePhotoTags(updatedPhotoTags);
      
      return newPhotoTag;
    } catch (error) {
      console.error('Error adding photo tag:', error);
      throw error;
    }
  },

  // Add photo tag with current location - FIXED VERSION
  async addPhotoTagWithCurrentLocation(
    photoPath: string, 
    formDataId?: string, 
    buildingDataId?: string
  ): Promise<PhotoTagData> {
    try {
      let latitude = 0;
      let longitude = 0;
      let accuracy: number | undefined;
      let altitude: number | undefined;

      try {
        // Use the working pattern from GeoTag service
        const position = await Geolocation.getCurrentPosition();
        
        if (position?.coords) {
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          accuracy = position.coords.accuracy;
          altitude = position.coords.altitude || undefined;
        }
      } catch (locationError) {
        console.warn('Could not get location, using default coordinates:', locationError);
      }

      return PhotoTagLocalStorage.addPhotoTag({
        photoPath,
        longitude,
        latitude,
        accuracy,
        altitude,
        timestamp: new Date(),
        formDataId,
        buildingDataId
      });
    } catch (error) {
      console.error('Error adding photo tag with location:', error);
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
      const distance = calculateDistance(
        latitude, longitude, tag.latitude, tag.longitude
      );
      return distance <= radiusMeters;
    });
  },

  // Update specific fields in photo tag data (preserves existing ID)
  updatePhotoTag: (id: string, updates: Partial<PhotoTagData>): PhotoTagData | null => {
    try {
      const photoTags = PhotoTagLocalStorage.getPhotoTags();
      const tagIndex = photoTags.findIndex(tag => tag.id === id);
      
      if (tagIndex === -1) {
        return null;
      }
      
      // Ensure we don't override the ID
      const updatedTag = { 
        ...photoTags[tagIndex], 
        ...updates,
        id: photoTags[tagIndex].id // Preserve original ID
      };
      
      const updatedPhotoTags = [...photoTags];
      updatedPhotoTags[tagIndex] = updatedTag;
      
      PhotoTagLocalStorage.savePhotoTags(updatedPhotoTags);
      return updatedTag;
    } catch (error) {
      console.error('Error updating photo tag:', error);
      return null;
    }
  },

  // Generate a new random ID (consistent with FormDataLocalStorage)
  generateId: (): string => {
    return generateRandomId();
  }
};