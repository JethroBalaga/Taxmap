// utils/buildingCodeLocalStorage.ts
import localForage from 'localforage';

// Interface for building code data
export interface BuildingCodeData {
  building_code: string;
  structure_code: string;
  description: string;
  rate: number;
  // Add any new columns here when you add them to the database
  // example: new_column?: string;
}

// Configure localForage instance for building code data
const buildingCodeStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'building_code_data'
});

// Use timestamp for versioning
const CURRENT_VERSION = Date.now();

interface StoredDataMetadata {
  version: number;
  timestamp: number;
  schemaHash: string;
}

const generateSchemaHash = (): string => {
  const schema = {
    building_code: 'string',
    structure_code: 'string',
    description: 'string',
    rate: 'number'
  };
  return JSON.stringify(schema);
};

const CURRENT_SCHEMA_HASH = generateSchemaHash();

const migrateToCurrentVersion = (data: any[], fromVersion: number): BuildingCodeData[] => {
  return data.map(item => {
    const migratedItem: Partial<BuildingCodeData> = {};
    
    if (typeof item.building_code === 'string') {
      migratedItem.building_code = item.building_code;
    }
    
    if (typeof item.structure_code === 'string') {
      migratedItem.structure_code = item.structure_code;
    }

    if (typeof item.description === 'string') {
      migratedItem.description = item.description;
    }

    if (typeof item.rate === 'number') {
      migratedItem.rate = item.rate;
    }

    // Remove any unknown properties
    const validProperties = new Set(['building_code', 'structure_code', 'description', 'rate']);
    Object.keys(migratedItem).forEach(key => {
      if (!validProperties.has(key)) {
        delete migratedItem[key as keyof BuildingCodeData];
      }
    });
    
    return migratedItem as BuildingCodeData;
  });
};

const validateData = (data: any[]): data is BuildingCodeData[] => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.building_code === 'string' &&
      typeof item.structure_code === 'string' &&
      typeof item.description === 'string' &&
      typeof item.rate === 'number'
    );
  });
};

// Store building code data with localForage
export const storeBuildingCodeData = async (data: BuildingCodeData[]): Promise<void> => {
  try {
    if (!validateData(data)) {
      console.error('Invalid data format attempted to be stored');
      return;
    }
    
    await buildingCodeStore.setItem('data', data);
    await buildingCodeStore.setItem('metadata', {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      schemaHash: CURRENT_SCHEMA_HASH
    } as StoredDataMetadata);
    
    console.log('Building code data stored successfully');
  } catch (error) {
    console.error('Error storing building code data:', error);
  }
};

// Retrieve building code data from localForage with migration support
export const getBuildingCodeData = async (): Promise<BuildingCodeData[] | null> => {
  try {
    const [data, metadata] = await Promise.all([
      buildingCodeStore.getItem<any[]>('data'),
      buildingCodeStore.getItem<StoredDataMetadata>('metadata')
    ]);

    if (!data || !metadata) return null;

    if (metadata.version === CURRENT_VERSION && validateData(data)) {
      return data;
    }

    let migratedData = migrateToCurrentVersion(data, metadata.version);
    
    if (!validateData(migratedData)) {
      console.error('Migrated data failed validation');
      return null;
    }
    
    await storeBuildingCodeData(migratedData);
    return migratedData;
    
  } catch (error) {
    console.error('Error retrieving building code data:', error);
    return null;
  }
};

// Check if building code data is fresh (less than 24 hours old) AND matches current version
export const isBuildingCodeDataFresh = async (): Promise<boolean> => {
  try {
    const metadata = await buildingCodeStore.getItem<StoredDataMetadata>('metadata');

    if (!metadata) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Check if data is outdated OR version mismatch
    const isRecent = (Date.now() - metadata.timestamp) < twentyFourHours;
    const isCurrentVersion = metadata.version === CURRENT_VERSION;
    const isCurrentSchema = metadata.schemaHash === CURRENT_SCHEMA_HASH;
    
    return isRecent && isCurrentVersion && isCurrentSchema;
  } catch (error) {
    console.error('Error checking building code data freshness:', error);
    return false;
  }
};

// Clear building code data from localForage
export const clearBuildingCodeData = async (): Promise<void> => {
  try {
    await buildingCodeStore.clear();
    console.log('Building code data cleared successfully');
  } catch (error) {
    console.error('Error clearing building code data:', error);
  }
};

// Get the current version
export const getCurrentBuildingCodeVersion = (): number => {
  return CURRENT_VERSION;
};

// Get the stored version
export const getStoredBuildingCodeVersion = async (): Promise<number | null> => {
  try {
    const metadata = await buildingCodeStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.version || null;
  } catch (error) {
    console.error('Error retrieving building code version:', error);
    return null;
  }
};

// Get building code data only if it's fresh
export const getFreshBuildingCodeData = async (): Promise<BuildingCodeData[] | null> => {
  const isFresh = await isBuildingCodeDataFresh();
  return isFresh ? await getBuildingCodeData() : null;
};

// Get the timestamp of when building code data was last stored
export const getBuildingCodeTimestamp = async (): Promise<number | null> => {
  try {
    const metadata = await buildingCodeStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.timestamp || null;
  } catch (error) {
    console.error('Error retrieving building code timestamp:', error);
    return null;
  }
};

// Check if building code data exists (regardless of freshness)
export const hasBuildingCodeData = async (): Promise<boolean> => {
  try {
    const data = await buildingCodeStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for building code data:', error);
    return false;
  }
};

// Get data size (useful for debugging)
export const getBuildingCodeDataSize = async (): Promise<number> => {
  try {
    const data = await buildingCodeStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting building code data size:', error);
    return 0;
  }
};

// Filter building code data by structure_code
export const getBuildingCodesByStructureCode = async (structureCode: string): Promise<BuildingCodeData[]> => {
  const data = await getBuildingCodeData();
  if (!data) return [];
  
  return data.filter(item => item.structure_code === structureCode);
};

// Get building code by building_code
export const getBuildingCodeByCode = async (buildingCode: string): Promise<BuildingCodeData | null> => {
  const data = await getBuildingCodeData();
  if (!data) return null;
  
  return data.find(item => item.building_code === buildingCode) || null;
};

// Search building codes with multiple criteria
export const searchBuildingCodes = async (options: {
  structureCode?: string;
  description?: string;
  minRate?: number;
  maxRate?: number;
  limit?: number;
}): Promise<BuildingCodeData[]> => {
  const data = await getBuildingCodeData();
  if (!data) return [];
  
  let results = data;
  
  if (options.structureCode) {
    results = results.filter(item => item.structure_code === options.structureCode);
  }
  
  if (options.description) {
    const searchTerm = options.description.toLowerCase();
    results = results.filter(item => 
      item.description.toLowerCase().includes(searchTerm)
    );
  }
  
  if (options.minRate !== undefined) {
    results = results.filter(item => item.rate >= options.minRate!);
  }
  
  if (options.maxRate !== undefined) {
    results = results.filter(item => item.rate <= options.maxRate!);
  }
  
  if (options.limit) {
    results = results.slice(0, options.limit);
  }
  
  return results;
};

// Get all unique structure codes from building code data
export const getUniqueBuildingCodeStructureCodes = async (): Promise<string[]> => {
  const data = await getBuildingCodeData();
  if (!data) return [];
  
  const structureCodes = new Set<string>();
  data.forEach(item => structureCodes.add(item.structure_code));
  
  return Array.from(structureCodes).sort();
};

// Get building code count
export const getBuildingCodeCount = async (): Promise<number> => {
  const data = await getBuildingCodeData();
  return data ? data.length : 0;
};

// Get building codes with rates above a certain value
export const getBuildingCodesAboveRate = async (minRate: number): Promise<BuildingCodeData[]> => {
  const data = await getBuildingCodeData();
  if (!data) return [];
  
  return data.filter(item => item.rate >= minRate);
};

// Get building codes with rates below a certain value
export const getBuildingCodesBelowRate = async (maxRate: number): Promise<BuildingCodeData[]> => {
  const data = await getBuildingCodeData();
  if (!data) return [];
  
  return data.filter(item => item.rate <= maxRate);
};

// Force migration of building code data
export const forceBuildingCodeMigration = async (): Promise<BuildingCodeData[] | null> => {
  try {
    const data = await buildingCodeStore.getItem<any[]>('data');
    const metadata = await buildingCodeStore.getItem<StoredDataMetadata>('metadata');
    
    if (!data) return null;
    
    const fromVersion = metadata?.version || 1;
    const migratedData = migrateToCurrentVersion(data, fromVersion);
    
    await storeBuildingCodeData(migratedData);
    return migratedData;
    
  } catch (error) {
    console.error('Error forcing migration:', error);
    return null;
  }
};

// Get current schema hash
export const getCurrentBuildingCodeSchemaHash = (): string => {
  return CURRENT_SCHEMA_HASH;
};

// Get stored schema hash
export const getStoredBuildingCodeSchemaHash = async (): Promise<string | null> => {
  try {
    const metadata = await buildingCodeStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.schemaHash || null;
  } catch (error) {
    console.error('Error retrieving schema hash:', error);
    return null;
  }
};

// Get building codes by multiple structure codes
export const getBuildingCodesByStructureCodes = async (structureCodes: string[]): Promise<BuildingCodeData[]> => {
  const data = await getBuildingCodeData();
  if (!data) return [];
  
  const structureCodeSet = new Set(structureCodes);
  return data.filter(item => structureCodeSet.has(item.structure_code));
};

// Get building codes with description containing search term
export const searchBuildingCodesByDescription = async (searchTerm: string): Promise<BuildingCodeData[]> => {
  const data = await getBuildingCodeData();
  if (!data) return [];
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return data.filter(item => 
    item.description.toLowerCase().includes(lowerSearchTerm)
  );
};

// Get building codes sorted by rate
export const getBuildingCodesSortedByRate = async (ascending: boolean = true): Promise<BuildingCodeData[]> => {
  const data = await getBuildingCodeData();
  if (!data) return [];
  
  return data.sort((a, b) => {
    return ascending ? a.rate - b.rate : b.rate - a.rate;
  });
};

// Get average rate of all building codes
export const getAverageBuildingCodeRate = async (): Promise<number | null> => {
  const data = await getBuildingCodeData();
  if (!data || data.length === 0) return null;
  
  const total = data.reduce((sum, item) => sum + item.rate, 0);
  return total / data.length;
};

// Get building codes within rate range
export const getBuildingCodesInRateRange = async (minRate: number, maxRate: number): Promise<BuildingCodeData[]> => {
  const data = await getBuildingCodeData();
  if (!data) return [];
  
  return data.filter(item => item.rate >= minRate && item.rate <= maxRate);
};