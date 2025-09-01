// utils/structureTypeLocalStorage.ts
import localForage from 'localforage';

// Interface for structure type data
export interface StructureTypeData {
  structure_code: string;
  kind_id: number;
  description: string;
  eff_date: string;
  // Add any new columns here when you add them to the database
  // example: new_column?: string;
}

// Configure localForage instance for structure type data
const structureTypeStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'structure_type_data'
});

// CURRENT VERSION - INCREMENT THIS WHEN YOU ADD NEW COLUMNS
const CURRENT_VERSION = 2; // Use numbers for easier migration comparisons

// Migration functions
const migrations: { [version: number]: (data: any[]) => StructureTypeData[] } = {
  // Migration from version 1 to 2
  2: (data: any[]) => {
    console.log('Migrating structure type data to version 2');
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

// Store structure type data with localForage
export const storeStructureTypeData = async (data: StructureTypeData[]): Promise<void> => {
  try {
    await structureTypeStore.setItem('data', data);
    await structureTypeStore.setItem('timestamp', Date.now());
    await structureTypeStore.setItem('version', CURRENT_VERSION);
    console.log('Structure type data stored successfully (version:', CURRENT_VERSION, ')');
  } catch (error) {
    console.error('Error storing structure type data:', error);
  }
};

// Retrieve structure type data from localForage with migration support
export const getStructureTypeData = async (): Promise<StructureTypeData[] | null> => {
  try {
    const [data, storedVersion, timestamp] = await Promise.all([
      structureTypeStore.getItem<StructureTypeData[]>('data'),
      structureTypeStore.getItem<number>('version'),
      structureTypeStore.getItem<number>('timestamp')
    ]);

    if (!data) return null;

    // Apply migrations if needed
    if (storedVersion && storedVersion < CURRENT_VERSION) {
      console.log(`Migrating structure type data from v${storedVersion} to v${CURRENT_VERSION}`);
      let migratedData = data;
      
      for (let version = storedVersion + 1; version <= CURRENT_VERSION; version++) {
        if (migrations[version]) {
          migratedData = migrations[version](migratedData);
        }
      }
      
      // Store the migrated data
      await storeStructureTypeData(migratedData);
      return migratedData;
    }

    return data;
  } catch (error) {
    console.error('Error retrieving structure type data:', error);
    return null;
  }
};

// Check if structure type data is fresh (less than 24 hours old) AND matches current version
export const isStructureTypeDataFresh = async (): Promise<boolean> => {
  try {
    const [timestamp, storedVersion] = await Promise.all([
      structureTypeStore.getItem<number>('timestamp'),
      structureTypeStore.getItem<number>('version')
    ]);

    if (!timestamp || !storedVersion) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Check if data is outdated OR version mismatch
    const isRecent = (Date.now() - timestamp) < twentyFourHours;
    const isCurrentVersion = storedVersion === CURRENT_VERSION;
    
    if (isRecent && !isCurrentVersion) {
      console.log('Structure type data is recent but outdated version. Migration will handle this.');
      return false;
    }
    
    return isRecent && isCurrentVersion;
  } catch (error) {
    console.error('Error checking structure type data freshness:', error);
    return false;
  }
};

// Clear structure type data from localForage
export const clearStructureTypeData = async (): Promise<void> => {
  try {
    await structureTypeStore.clear();
    console.log('Structure type data cleared successfully');
  } catch (error) {
    console.error('Error clearing structure type data:', error);
  }
};

// Get the current version
export const getCurrentStructureTypeVersion = (): number => {
  return CURRENT_VERSION;
};

// Get the stored version
export const getStoredStructureTypeVersion = async (): Promise<number | null> => {
  try {
    return await structureTypeStore.getItem<number>('version');
  } catch (error) {
    console.error('Error retrieving structure type version:', error);
    return null;
  }
};

// Get structure type data only if it's fresh
export const getFreshStructureTypeData = async (): Promise<StructureTypeData[] | null> => {
  const data = await getStructureTypeData();
  const isFresh = await isStructureTypeDataFresh();
  
  return isFresh ? data : null;
};

// Get the timestamp of when structure type data was last stored
export const getStructureTypeTimestamp = async (): Promise<number | null> => {
  try {
    return await structureTypeStore.getItem<number>('timestamp');
  } catch (error) {
    console.error('Error retrieving structure type timestamp:', error);
    return null;
  }
};

// Check if structure type data exists (regardless of freshness)
export const hasStructureTypeData = async (): Promise<boolean> => {
  try {
    const data = await structureTypeStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for structure type data:', error);
    return false;
  }
};

// Get data size (useful for debugging)
export const getStructureTypeDataSize = async (): Promise<number> => {
  try {
    const data = await structureTypeStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting structure type data size:', error);
    return 0;
  }
};

// Filter structure type data by kind_id
export const getStructureTypesByKindId = async (kindId: number): Promise<StructureTypeData[]> => {
  const data = await getStructureTypeData();
  if (!data) return [];
  
  return data.filter(item => item.kind_id === kindId);
};

// Get structure type by structure_code
export const getStructureTypeByCode = async (structureCode: string): Promise<StructureTypeData | null> => {
  const data = await getStructureTypeData();
  if (!data) return null;
  
  return data.find(item => item.structure_code === structureCode) || null;
};

// Search structure types with multiple criteria
export const searchStructureTypes = async (options: {
  kindId?: number;
  description?: string;
  limit?: number;
}): Promise<StructureTypeData[]> => {
  const data = await getStructureTypeData();
  if (!data) return [];
  
  let results = data;
  
  if (options.kindId !== undefined) {
    results = results.filter(item => item.kind_id === options.kindId);
  }
  
  if (options.description) {
    const searchTerm = options.description.toLowerCase();
    results = results.filter(item => 
      item.description.toLowerCase().includes(searchTerm)
    );
  }
  
  if (options.limit) {
    results = results.slice(0, options.limit);
  }
  
  return results;
};

// Get all unique kind IDs from structure type data
export const getUniqueStructureTypeKindIds = async (): Promise<number[]> => {
  const data = await getStructureTypeData();
  if (!data) return [];
  
  const kindIds = new Set<number>();
  data.forEach(item => kindIds.add(item.kind_id));
  
  return Array.from(kindIds).sort((a, b) => a - b);
};

// Get structure type count
export const getStructureTypeCount = async (): Promise<number> => {
  const data = await getStructureTypeData();
  return data ? data.length : 0;
};