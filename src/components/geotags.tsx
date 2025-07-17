// geotags.tsx

export interface GeoTag {
  TagKey: string;
  HouseNumber: string;
  Residence: string;
  Longitude: number;
  Latitude: number;
}

// Empty array to be filled dynamically
export const geoTags: GeoTag[] = [];
