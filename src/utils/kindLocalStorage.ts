// utils/kindLocalStorage.ts
import localForage from 'localforage';

// Interface for kind data
export interface KindData {
  kind_id: number;
  description: string;
}

// Configure localForage instance for kind data
const kindStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'kind_data'
});

// CURRENT VERSION
const CURRENT_VERSION = 1;

// Migration functions
const migrations: { [version: number]: (data: any[]) => KindData[] } = {
  // Migration from version 1 to 2 (example)
  2: (data: any[]) => {
    console.log('Migrating kind data to version 2');
    return data.map(item => {
      // Remove any deprecated columns or add new ones with defaults
      const { deprecated_column, ...cleanItem } = item;
      return {
        ...cleanItem,
        // new_column: item.new_column || 'default_value'
      };
    });
  }
};

// Store kind data with localForage
export const storeKindData = async (data: KindData[]): Promise<void> => {
  try {
    await kindStore.setItem('data', data);
    await kindStore.setItem('timestamp', Date.now());
    await kindStore.setItem('version', CURRENT_VERSION);
    console.log('Kind data stored successfully (version:', CURRENT_VERSION, ')');
  } catch (error) {
    console.error('Error storing kind data:', error);
  }
};

// Retrieve kind data from localForage with migration support
export const getKindData = async (): Promise<KindData[] | null> => {
  try {
    const [data, storedVersion, timestamp] = await Promise.all([
      kindStore.getItem<KindData[]>('data'),
      kindStore.getItem<number>('version'),
      kindStore.getItem<number>('timestamp')
    ]);

    if (!data) return null;

    // Apply migrations if needed
    if (storedVersion && storedVersion < CURRENT_VERSION) {
      console.log(`Migrating kind data from v${storedVersion} to v${CURRENT_VERSION}`);
      let migratedData = data;
      
      for (let version = storedVersion + 1; version <= CURRENT_VERSION; version++) {
        if (migrations[version]) {
          migratedData = migrations[version](migratedData);
        }
      }
      
      // Store the migrated data
      await storeKindData(migratedData);
      return migratedData;
    }

    return data;
  } catch (error) {
    console.error('Error retrieving kind data:', error);
    return null;
  }
};

// Check if kind data is fresh (less than 24 hours old) AND matches current version
export const isKindDataFresh = async (): Promise<boolean> => {
  try {
    const [timestamp, storedVersion] = await Promise.all([
      kindStore.getItem<number>('timestamp'),
      kindStore.getItem<number>('version')
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
    console.error('Error checking kind data freshness:', error);
    return false;
  }
};

// Clear kind data from localForage
export const clearKindData = async (): Promise<void> => {
  try {
    await kindStore.clear();
    console.log('Kind data cleared successfully');
  } catch (error) {
    console.error('Error clearing kind data:', error);
  }
};

// Get the current version
export const getCurrentKindVersion = (): number => {
  return CURRENT_VERSION;
};

// Get the stored version
export const getStoredKindVersion = async (): Promise<number | null> => {
  try {
    return await kindStore.getItem<number>('version');
  } catch (error) {
    console.error('Error retrieving kind version:', error);
    return null;
  }
};

// Get kind data only if it's fresh
export const getFreshKindData = async (): Promise<KindData[] | null> => {
  const data = await getKindData();
  const isFresh = await isKindDataFresh();
  
  return isFresh ? data : null;
};

// Get the timestamp of when kind data was last stored
export const getKindTimestamp = async (): Promise<number | null> => {
  try {
    return await kindStore.getItem<number>('timestamp');
  } catch (error) {
    console.error('Error retrieving kind timestamp:', error);
    return null;
  }
};

// Check if kind data exists (regardless of freshness)
export const hasKindData = async (): Promise<boolean> => {
  try {
    const data = await kindStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for kind data:', error);
    return false;
  }
};

// Get data size (useful for debugging)
export const getKindDataSize = async (): Promise<number> => {
  try {
    const data = await kindStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting data size:', error);
    return 0;
  }
};