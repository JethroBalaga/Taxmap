// src/utils/PhotoTagLocalStorage.ts
import { Geolocation } from '@capacitor/geolocation';
import localforage from 'localforage';

export interface PhotoTagData {
  id: string;
  photoName: string;
  longitude: number;
  latitude: number;
  timestamp: Date;
}

const PHOTO_TAGS_KEY = 'photoTags';

// Configure localForage
const photoTagsStore = localforage.createInstance({
  name: 'PhotoTagApp',
  storeName: 'photo_tags',
  description: 'Storage for photo tags and metadata'
});

// Helper function to generate random string ID
const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Distance calculation (same as before)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const PhotoTagLocalStorage = {
  // Get ALL photo tags from localForage
  async getAllPhotoTags(): Promise<PhotoTagData[]> {
    try {
      const storedData = await photoTagsStore.getItem<PhotoTagData[]>(PHOTO_TAGS_KEY);
      if (storedData) {
        // Convert timestamp strings back to Date objects
        return storedData.map(tag => ({
          ...tag,
          timestamp: new Date(tag.timestamp)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error retrieving photo tags from localForage:', error);
      return [];
    }
  },

  // Save ALL photo tags to localForage
  async saveAllPhotoTags(photoTags: PhotoTagData[]): Promise<void> {
    try {
      await photoTagsStore.setItem(PHOTO_TAGS_KEY, photoTags);
    } catch (error) {
      console.error('Error saving photo tags to localForage:', error);
      throw error;
    }
  },

  // Get a specific photo tag by ID
  async getPhotoTag(id: string): Promise<PhotoTagData | null> {
    try {
      const allPhotoTags = await PhotoTagLocalStorage.getAllPhotoTags();
      return allPhotoTags.find(tag => tag.id === id) || null;
    } catch (error) {
      console.error('Error retrieving photo tag:', error);
      return null;
    }
  },

  // Add a new photo tag
  async addPhotoTag(photoTagData: Omit<PhotoTagData, 'id'>): Promise<PhotoTagData> {
    try {
      const allPhotoTags = await PhotoTagLocalStorage.getAllPhotoTags();
      const newPhotoTag: PhotoTagData = {
        ...photoTagData,
        id: generateRandomId()
      };
      
      const updatedPhotoTags = [...allPhotoTags, newPhotoTag];
      await PhotoTagLocalStorage.saveAllPhotoTags(updatedPhotoTags);
      
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
        const position = await Geolocation.getCurrentPosition();
        if (position?.coords) {
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        }
      } catch (locationError) {
        console.warn('Could not get location, using default coordinates:', locationError);
      }

      return await PhotoTagLocalStorage.addPhotoTag({
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
  async updatePhotoTag(id: string, updates: Partial<PhotoTagData>): Promise<PhotoTagData | null> {
    try {
      const allPhotoTags = await PhotoTagLocalStorage.getAllPhotoTags();
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
      
      await PhotoTagLocalStorage.saveAllPhotoTags(updatedPhotoTags);
      return updatedTag;
    } catch (error) {
      console.error('Error updating photo tag:', error);
      return null;
    }
  },

  // Delete photo tag by ID
  async deletePhotoTag(id: string): Promise<boolean> {
    try {
      const allPhotoTags = await PhotoTagLocalStorage.getAllPhotoTags();
      const filteredTags = allPhotoTags.filter(tag => tag.id !== id);
      await PhotoTagLocalStorage.saveAllPhotoTags(filteredTags);
      return true;
    } catch (error) {
      console.error('Error deleting photo tag:', error);
      return false;
    }
  },

  // Clear ALL photo tags
  async clearAllPhotoTags(): Promise<void> {
    try {
      await photoTagsStore.removeItem(PHOTO_TAGS_KEY);
    } catch (error) {
      console.error('Error clearing photo tags:', error);
      throw error;
    }
  },

  // Get photo tags by coordinates
  async getPhotoTagsByLocation(latitude: number, longitude: number, radiusMeters: number = 100): Promise<PhotoTagData[]> {
    const allPhotoTags = await PhotoTagLocalStorage.getAllPhotoTags();
    
    return allPhotoTags.filter(tag => {
      const distance = calculateDistance(
        latitude, longitude, tag.latitude, tag.longitude
      );
      return distance <= radiusMeters;
    });
  },

  // Get photo tags count
  async getPhotoTagsCount(): Promise<number> {
    const allPhotoTags = await PhotoTagLocalStorage.getAllPhotoTags();
    return allPhotoTags.length;
  },

  // Generate a new random ID
  generateId: (): string => {
    return generateRandomId();
  }
};