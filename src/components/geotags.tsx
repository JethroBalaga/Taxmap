import { Geolocation } from '@capacitor/geolocation';

export interface GeoTag {
  TagKey: number;
  HouseNumber: number;
  Address: string;
  Residence: string;
  Longitude: number;
  Latitude: number;
  Timestamp?: Date;
}

// Initialize with saved tags or empty array
const savedTags = localStorage.getItem('geoTags');
let lastTagKey = savedTags ? JSON.parse(savedTags).length : 0;
export let geoTags: GeoTag[] = savedTags ? JSON.parse(savedTags) : [];

// Parse string dates back to Date objects
if (savedTags) {
  geoTags = geoTags.map(tag => ({
    ...tag,
    Timestamp: tag.Timestamp ? new Date(tag.Timestamp) : undefined
  }));
}

export const addGeoTag = async (houseNumber: number, address: string, residence: string) => {
  try {
    const position = await Geolocation.getCurrentPosition();
    
    const newTag: GeoTag = {
      TagKey: ++lastTagKey,
      HouseNumber: houseNumber,
      Address: address,
      Residence: residence,
      Longitude: position.coords.longitude,
      Latitude: position.coords.latitude,
      Timestamp: new Date()
    };
    
    geoTags = [...geoTags, newTag];
    localStorage.setItem('geoTags', JSON.stringify(geoTags));
    return newTag;
  } catch (error) {
    console.error('Error getting location or saving tag:', error);
    throw error;
  }
};