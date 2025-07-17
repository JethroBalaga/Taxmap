// geotags.tsx

export interface GeoTag {
  TagKey: number;
  HouseNumber: string;
  Residence: string;
  Longitude: number;
  Latitude: number;
}

// Empty array to be filled dynamically
export const geoTags: GeoTag[] = [];
