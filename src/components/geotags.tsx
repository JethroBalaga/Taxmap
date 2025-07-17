// geotags.tsx

export interface GeoTag {
  TagKey: number;
  HouseNumber: number;
  Address:string;
  Residence: string;
  Longitude: number;
  Latitude: number;
}

// Empty array to be filled dynamically
export const geoTags: GeoTag[] = [];
