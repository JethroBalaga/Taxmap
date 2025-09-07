// src/utils/PhotoTagLocalStorage.ts
import { Geolocator } from '../Geolocator';

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

  // Add a new photo tag
  addPhotoTag: (photoTagData: Omit<PhotoTagData, 'id'>): PhotoTagData => {
    try {
      const photoTags = PhotoTagLocalStorage.getPhotoTags();
      const newPhotoTag: PhotoTagData = {
        ...photoTagData,
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

  // Add photo tag with current location
  async addPhotoTagWithCurrentLocation(
    photoPath: string, 
    formDataId?: string, 
    buildingDataId?: string
  ): Promise<PhotoTagData> {
    try {
      let latitude = 0;
      let longitude = 0;
      let accuracy: number | undefined;

      try {
        // Try to get current location
        await Geolocator.requestPermissions();
        const position = await Geolocator.getCurrentPosition();
        latitude = position.latitude;
        longitude = position.longitude;
        accuracy = position.accuracy;
      } catch (locationError) {
        console.warn('Could not get location, using default coordinates');
      }

      return PhotoTagLocalStorage.addPhotoTag({
        photoPath,
        longitude,
        latitude,
        accuracy,
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
      const distance = Geolocator.calculateDistance(
        latitude, longitude, tag.latitude, tag.longitude
      );
      return distance <= radiusMeters;
    });
  }
};