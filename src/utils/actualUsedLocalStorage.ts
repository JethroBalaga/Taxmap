// utils/actualUsedLocalStorage.ts
import localForage from 'localforage';

// Interface for actual used data
export interface ActualUsedData {
  actual_used_id: string;
  description: string;
  class_id: string;
  // Add any new columns here when you add them to the database
  // example: new_column?: string;
}

// Configure localForage instance for actual used data
const actualUsedStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'actual_used_data'
});

// CURRENT VERSION - INCREMENT THIS WHEN YOU ADD NEW COLUMNS
const CURRENT_VERSION = 2; // Use numbers for easier migration comparisons

// Migration functions
const migrations: { [version: number]: (data: any[]) => ActualUsedData[] } = {
  // Migration from version 1 to 2
  2: (data: any[]) => {
    console.log('Migrating actual used data to version 2');
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

// Store actual used data with localForage
export const storeActualUsedData = async (data: ActualUsedData[]): Promise<void> => {
  try {
    await actualUsedStore.setItem('data', data);
    await actualUsedStore.setItem('timestamp', Date.now());
    await actualUsedStore.setItem('version', CURRENT_VERSION);
    console.log('Actual used data stored successfully (version:', CURRENT_VERSION, ')');
  } catch (error) {
    console.error('Error storing actual used data:', error);
  }
};

// Retrieve actual used data from localForage with migration support
export const getActualUsedData = async (): Promise<ActualUsedData[] | null> => {
  try {
    const [data, storedVersion, timestamp] = await Promise.all([
      actualUsedStore.getItem<ActualUsedData[]>('data'),
      actualUsedStore.getItem<number>('version'),
      actualUsedStore.getItem<number>('timestamp')
    ]);

    if (!data) return null;

    // Apply migrations if needed
    if (storedVersion && storedVersion < CURRENT_VERSION) {
      console.log(`Migrating actual used data from v${storedVersion} to v${CURRENT_VERSION}`);
      let migratedData = data;
      
      for (let version = storedVersion + 1; version <= CURRENT_VERSION; version++) {
        if (migrations[version]) {
          migratedData = migrations[version](migratedData);
        }
      }
      
      // Store the migrated data
      await storeActualUsedData(migratedData);
      return migratedData;
    }

    return data;
  } catch (error) {
    console.error('Error retrieving actual used data:', error);
    return null;
  }
};

// Check if actual used data is fresh (less than 24 hours old) AND matches current version
export const isActualUsedDataFresh = async (): Promise<boolean> => {
  try {
    const [timestamp, storedVersion] = await Promise.all([
      actualUsedStore.getItem<number>('timestamp'),
      actualUsedStore.getItem<number>('version')
    ]);

    if (!timestamp || !storedVersion) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Check if data is outdated OR version mismatch
    const isRecent = (Date.now() - timestamp) < twentyFourHours;
    const isCurrentVersion = storedVersion === CURRENT_VERSION;
    
    if (isRecent && !isCurrentVersion) {
      console.log('Actual used data is recent but outdated version. Migration will handle this.');
      return false;
    }
    
    return isRecent && isCurrentVersion;
  } catch (error) {
    console.error('Error checking actual used data freshness:', error);
    return false;
  }
};

// Clear actual used data from localForage
export const clearActualUsedData = async (): Promise<void> => {
  try {
    await actualUsedStore.clear();
    console.log('Actual used data cleared successfully');
  } catch (error) {
    console.error('Error clearing actual used data:', error);
  }
};

// Get the current version
export const getCurrentActualUsedVersion = (): number => {
  return CURRENT_VERSION;
};

// Get the stored version
export const getStoredActualUsedVersion = async (): Promise<number | null> => {
  try {
    return await actualUsedStore.getItem<number>('version');
  } catch (error) {
    console.error('Error retrieving actual used version:', error);
    return null;
  }
};

// Get actual used data only if it's fresh
export const getFreshActualUsedData = async (): Promise<ActualUsedData[] | null> => {
  const data = await getActualUsedData();
  const isFresh = await isActualUsedDataFresh();
  
  return isFresh ? data : null;
};

// Check if actual used data exists (regardless of freshness)
export const hasActualUsedData = async (): Promise<boolean> => {
  try {
    const data = await actualUsedStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for actual used data:', error);
    return false;
  }
};

// Filter actual used data by class_id
export const getActualUsedByClassId = async (classId: string): Promise<ActualUsedData[]> => {
  const data = await getActualUsedData();
  if (!data) return [];
  
  return data.filter(item => item.class_id === classId);
};

// Find a specific actual used by ID
export const getActualUsedById = async (actualUsedId: string): Promise<ActualUsedData | null> => {
  const data = await getActualUsedData();
  if (!data) return null;
  
  return data.find(item => item.actual_used_id === actualUsedId) || null;
};

// Get all unique class IDs from actual used data
export const getUniqueClassIds = async (): Promise<string[]> => {
  const data = await getActualUsedData();
  if (!data) return [];
  
  const classIds = new Set<string>();
  data.forEach(item => classIds.add(item.class_id));
  
  return Array.from(classIds);
};

// Get the timestamp of when actual used data was last stored
export const getActualUsedTimestamp = async (): Promise<number | null> => {
  try {
    return await actualUsedStore.getItem<number>('timestamp');
  } catch (error) {
    console.error('Error retrieving actual used timestamp:', error);
    return null;
  }
};

// Get data size (useful for debugging)
export const getActualUsedDataSize = async (): Promise<number> => {
  try {
    const data = await actualUsedStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting actual used data size:', error);
    return 0;
  }
};

// Get all actual used descriptions
export const getAllActualUsedDescriptions = async (): Promise<string[]> => {
  const data = await getActualUsedData();
  if (!data) return [];
  
  return data.map(item => item.description).filter(Boolean);
};

// Search actual used data by description
export const searchActualUsedByDescription = async (searchTerm: string): Promise<ActualUsedData[]> => {
  const data = await getActualUsedData();
  if (!data) return [];
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return data.filter(item => 
    item.description.toLowerCase().includes(lowerSearchTerm)
  );
};

// Get actual used data by multiple class IDs
export const getActualUsedByClassIds = async (classIds: string[]): Promise<ActualUsedData[]> => {
  const data = await getActualUsedData();
  if (!data) return [];
  
  const classIdSet = new Set(classIds);
  return data.filter(item => classIdSet.has(item.class_id));
};