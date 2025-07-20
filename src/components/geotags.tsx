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
let lastTagKey = savedTags ? Math.max(...JSON.parse(savedTags).map((t: GeoTag) => t.TagKey)) : 0;
export let geoTags: GeoTag[] = savedTags ? JSON.parse(savedTags) : [];

// Parse string dates back to Date objects
if (savedTags) {
  geoTags = geoTags.map(tag => ({
    ...tag,
    Timestamp: tag.Timestamp ? new Date(tag.Timestamp) : new Date()
  }));
}

export const addGeoTag = async (houseNumber: number, address: string, residence: string) => {
  if (!address || !residence || houseNumber <= 0) {
    throw new Error('Please fill all fields with valid data');
  }

  try {
    const position = await Geolocation.getCurrentPosition();
    
    if (!position?.coords) {
      throw new Error('Unable to get GPS coordinates');
    }

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

export const getRecentTags = (count = 5) => {
  return [...geoTags]
    .sort((a, b) => (b.Timestamp?.getTime() || 0) - (a.Timestamp?.getTime() || 0))
    .slice(0, count);
};