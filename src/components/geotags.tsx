// geotags.tsx
import { Geolocation } from '@capacitor/geolocation';

export interface GeoTag {
  TagKey: number;
  HouseNumber: number;
  Address: string;
  Residence: string;
  Longitude: number;
  Latitude: number;
  Timestamp?: Date; // Optional timestamp
}

let lastTagKey = 0; // This will keep track of the last used key

export const geoTags: GeoTag[] = [];

export const addGeoTag = async (houseNumber: number, address: string, residence: string) => {
  try {
    // Get current position
    const position = await Geolocation.getCurrentPosition();
    
    // Create new tag with auto-incremented key
    const newTag: GeoTag = {
      TagKey: ++lastTagKey,
      HouseNumber: houseNumber,
      Address: address,
      Residence: residence,
      Longitude: position.coords.longitude,
      Latitude: position.coords.latitude,
      Timestamp: new Date() // Add current timestamp
    };
    
    geoTags.push(newTag);
    return newTag; // Return the newly created tag
  } catch (error) {
    console.error('Error getting location or saving tag:', error);
    throw error;
  }
};