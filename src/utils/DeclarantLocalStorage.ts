// utils/DeclarantLocalStorage.ts
import localForage from 'localforage';

// Interface for declarant data
export interface DeclarantData {
  declarant_id: number;
  firstname: string;
  lastname: string;
  // Add any new columns here when you add them to the database
  // example: new_column?: string;
}

// Configure localForage instance for declarant data
const declarantStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'declarant_data'
});

// CURRENT VERSION - INCREMENT THIS WHEN YOU ADD NEW COLUMNS
const CURRENT_VERSION = 1; // Use numbers for easier migration comparisons

// Migration functions
const migrations: { [version: number]: (data: any[]) => DeclarantData[] } = {
  // Migration from version 1 to 2
  2: (data: any[]) => {
    console.log('Migrating declarant data to version 2');
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

// Store declarant data with localForage
export const storeDeclarantData = async (data: DeclarantData[]): Promise<void> => {
  try {
    await declarantStore.setItem('data', data);
    await declarantStore.setItem('timestamp', Date.now());
    await declarantStore.setItem('version', CURRENT_VERSION);
    console.log('Declarant data stored successfully (version:', CURRENT_VERSION, ')');
  } catch (error) {
    console.error('Error storing declarant data:', error);
  }
};

// Retrieve declarant data from localForage with migration support
export const getDeclarantData = async (): Promise<DeclarantData[] | null> => {
  try {
    const [data, storedVersion, timestamp] = await Promise.all([
      declarantStore.getItem<DeclarantData[]>('data'),
      declarantStore.getItem<number>('version'),
      declarantStore.getItem<number>('timestamp')
    ]);

    if (!data) return null;

    // Apply migrations if needed
    if (storedVersion && storedVersion < CURRENT_VERSION) {
      console.log(`Migrating declarant data from v${storedVersion} to v${CURRENT_VERSION}`);
      let migratedData = data;
      
      for (let version = storedVersion + 1; version <= CURRENT_VERSION; version++) {
        if (migrations[version]) {
          migratedData = migrations[version](migratedData);
        }
      }
      
      // Store the migrated data
      await storeDeclarantData(migratedData);
      return migratedData;
    }

    return data;
  } catch (error) {
    console.error('Error retrieving declarant data:', error);
    return null;
  }
};

// Check if declarant data is fresh (less than 24 hours old) AND matches current version
export const isDeclarantDataFresh = async (): Promise<boolean> => {
  try {
    const [timestamp, storedVersion] = await Promise.all([
      declarantStore.getItem<number>('timestamp'),
      declarantStore.getItem<number>('version')
    ]);

    if (!timestamp || !storedVersion) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Check if data is outdated OR version mismatch
    const isRecent = (Date.now() - timestamp) < twentyFourHours;
    const isCurrentVersion = storedVersion === CURRENT_VERSION;
    
    if (isRecent && !isCurrentVersion) {
      console.log('Data is recent but outdated version. Migration will handle this.');
      return false;
    }
    
    return isRecent && isCurrentVersion;
  } catch (error) {
    console.error('Error checking declarant data freshness:', error);
    return false;
  }
};

// Clear declarant data from localForage
export const clearDeclarantData = async (): Promise<void> => {
  try {
    await declarantStore.clear();
    console.log('Declarant data cleared successfully');
  } catch (error) {
    console.error('Error clearing declarant data:', error);
  }
};

// Get the current version
export const getCurrentDeclarantVersion = (): number => {
  return CURRENT_VERSION;
};

// Get the stored version
export const getStoredDeclarantVersion = async (): Promise<number | null> => {
  try {
    return await declarantStore.getItem<number>('version');
  } catch (error) {
    console.error('Error retrieving declarant version:', error);
    return null;
  }
};

// Get declarant data only if it's fresh
export const getFreshDeclarantData = async (): Promise<DeclarantData[] | null> => {
  const data = await getDeclarantData();
  const isFresh = await isDeclarantDataFresh();
  
  return isFresh ? data : null;
};

// Get the timestamp of when declarant data was last stored
export const getDeclarantTimestamp = async (): Promise<number | null> => {
  try {
    return await declarantStore.getItem<number>('timestamp');
  } catch (error) {
    console.error('Error retrieving declarant timestamp:', error);
    return null;
  }
};

// Check if declarant data exists (regardless of freshness)
export const hasDeclarantData = async (): Promise<boolean> => {
  try {
    const data = await declarantStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for declarant data:', error);
    return false;
  }
};

// Get data size (useful for debugging)
export const getDeclarantDataSize = async (): Promise<number> => {
  try {
    const data = await declarantStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting data size:', error);
    return 0;
  }
};