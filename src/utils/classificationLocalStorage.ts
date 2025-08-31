// utils/classificationLocalStorage.ts
import localForage from 'localforage';

// Interface for classification data
export interface ClassificationData {
  class_id: string;
  classification: string;
  // Add any new columns here when you add them to the database
  // example: new_column?: string;
}

// Configure localForage instance for classification data
const classificationStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'classification_data'
});

// CURRENT VERSION - INCREMENT THIS WHEN YOU ADD NEW COLUMNS
const CURRENT_VERSION = 2; // Use numbers for easier migration comparisons

// Migration functions
const migrations: { [version: number]: (data: any[]) => ClassificationData[] } = {
  // Migration from version 1 to 2
  2: (data: any[]) => {
    console.log('Migrating classification data to version 2');
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

// Store classification data with localForage
export const storeClassificationData = async (data: ClassificationData[]): Promise<void> => {
  try {
    await classificationStore.setItem('data', data);
    await classificationStore.setItem('timestamp', Date.now());
    await classificationStore.setItem('version', CURRENT_VERSION);
    console.log('Classification data stored successfully (version:', CURRENT_VERSION, ')');
  } catch (error) {
    console.error('Error storing classification data:', error);
  }
};

// Retrieve classification data from localForage with migration support
export const getClassificationData = async (): Promise<ClassificationData[] | null> => {
  try {
    const [data, storedVersion, timestamp] = await Promise.all([
      classificationStore.getItem<ClassificationData[]>('data'),
      classificationStore.getItem<number>('version'),
      classificationStore.getItem<number>('timestamp')
    ]);

    if (!data) return null;

    // Apply migrations if needed
    if (storedVersion && storedVersion < CURRENT_VERSION) {
      console.log(`Migrating classification data from v${storedVersion} to v${CURRENT_VERSION}`);
      let migratedData = data;
      
      for (let version = storedVersion + 1; version <= CURRENT_VERSION; version++) {
        if (migrations[version]) {
          migratedData = migrations[version](migratedData);
        }
      }
      
      // Store the migrated data
      await storeClassificationData(migratedData);
      return migratedData;
    }

    return data;
  } catch (error) {
    console.error('Error retrieving classification data:', error);
    return null;
  }
};

// Check if classification data is fresh (less than 24 hours old) AND matches current version
export const isClassificationDataFresh = async (): Promise<boolean> => {
  try {
    const [timestamp, storedVersion] = await Promise.all([
      classificationStore.getItem<number>('timestamp'),
      classificationStore.getItem<number>('version')
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
    console.error('Error checking classification data freshness:', error);
    return false;
  }
};

// Clear classification data from localForage
export const clearClassificationData = async (): Promise<void> => {
  try {
    await classificationStore.clear();
    console.log('Classification data cleared successfully');
  } catch (error) {
    console.error('Error clearing classification data:', error);
  }
};

// Get the current version
export const getCurrentClassificationVersion = (): number => {
  return CURRENT_VERSION;
};

// Get the stored version
export const getStoredClassificationVersion = async (): Promise<number | null> => {
  try {
    return await classificationStore.getItem<number>('version');
  } catch (error) {
    console.error('Error retrieving classification version:', error);
    return null;
  }
};

// Get classification data only if it's fresh
export const getFreshClassificationData = async (): Promise<ClassificationData[] | null> => {
  const data = await getClassificationData();
  const isFresh = await isClassificationDataFresh();
  
  return isFresh ? data : null;
};

// Get the timestamp of when classification data was last stored
export const getClassificationTimestamp = async (): Promise<number | null> => {
  try {
    return await classificationStore.getItem<number>('timestamp');
  } catch (error) {
    console.error('Error retrieving classification timestamp:', error);
    return null;
  }
};

// Check if classification data exists (regardless of freshness)
export const hasClassificationData = async (): Promise<boolean> => {
  try {
    const data = await classificationStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for classification data:', error);
    return false;
  }
};

// Get data size (useful for debugging)
export const getClassificationDataSize = async (): Promise<number> => {
  try {
    const data = await classificationStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting data size:', error);
    return 0;
  }
};