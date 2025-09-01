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

// CURRENT VERSION - INCREMENT THIS WHEN YOU ADD NEW COLUMNS
const CURRENT_VERSION = 2; // Use numbers for easier migration comparisons

// Migration functions
const migrations: { [version: number]: (data: any[]) => BuildingCodeData[] } = {
  // Migration from version 1 to 2
  2: (data: any[]) => {
    console.log('Migrating building code data to version 2');
    return data.map(item => {
      // Remove any deprecated columns or add new ones with defaults
      const { deprecated_column, ...cleanItem } = item;
      return {
        ...cleanItem,
        // new_column: item.new_column || 'default_value' // Example for new columns
      };
    });
  }
};

// Store building code data with localForage
export const storeBuildingCodeData = async (data: BuildingCodeData[]): Promise<void> => {
  try {
    await buildingCodeStore.setItem('data', data);
    await buildingCodeStore.setItem('timestamp', Date.now());
    await buildingCodeStore.setItem('version', CURRENT_VERSION);
    console.log('Building code data stored successfully (version:', CURRENT_VERSION, ')');
  } catch (error) {
    console.error('Error storing building code data:', error);
  }
};

// Retrieve building code data from localForage with migration support
export const getBuildingCodeData = async (): Promise<BuildingCodeData[] | null> => {
  try {
    const [data, storedVersion, timestamp] = await Promise.all([
      buildingCodeStore.getItem<BuildingCodeData[]>('data'),
      buildingCodeStore.getItem<number>('version'),
      buildingCodeStore.getItem<number>('timestamp')
    ]);

    if (!data) return null;

    // Apply migrations if needed
    if (storedVersion && storedVersion < CURRENT_VERSION) {
      console.log(`Migrating building code data from v${storedVersion} to v${CURRENT_VERSION}`);
      let migratedData = data;
      
      for (let version = storedVersion + 1; version <= CURRENT_VERSION; version++) {
        if (migrations[version]) {
          migratedData = migrations[version](migratedData);
        }
      }
      
      // Store the migrated data
      await storeBuildingCodeData(migratedData);
      return migratedData;
    }

    return data;
  } catch (error) {
    console.error('Error retrieving building code data:', error);
    return null;
  }
};

// Check if building code data is fresh (less than 24 hours old) AND matches current version
export const isBuildingCodeDataFresh = async (): Promise<boolean> => {
  try {
    const [timestamp, storedVersion] = await Promise.all([
      buildingCodeStore.getItem<number>('timestamp'),
      buildingCodeStore.getItem<number>('version')
    ]);

    if (!timestamp || !storedVersion) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Check if data is outdated OR version mismatch
    const isRecent = (Date.now() - timestamp) < twentyFourHours;
    const isCurrentVersion = storedVersion === CURRENT_VERSION;
    
    if (isRecent && !isCurrentVersion) {
      console.log('Building code data is recent but outdated version. Migration will handle this.');
      return false;
    }
    
    return isRecent && isCurrentVersion;
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
    return await buildingCodeStore.getItem<number>('version');
  } catch (error) {
    console.error('Error retrieving building code version:', error);
    return null;
  }
};

// Get building code data only if it's fresh
export const getFreshBuildingCodeData = async (): Promise<BuildingCodeData[] | null> => {
  const data = await getBuildingCodeData();
  const isFresh = await isBuildingCodeDataFresh();
  
  return isFresh ? data : null;
};

// Get the timestamp of when building code data was last stored
export const getBuildingCodeTimestamp = async (): Promise<number | null> => {
  try {
    return await buildingCodeStore.getItem<number>('timestamp');
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