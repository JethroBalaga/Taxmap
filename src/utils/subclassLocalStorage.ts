// utils/subclassLocalStorage.ts
import localForage from 'localforage';

// Interface for subclass data
export interface SubclassData {
  subclass_id: string;
  barangay_id: string | null;
  subclass: string;
  class_id: string;
  // Add any new columns here when you add them to the database
  // example: new_column?: string;
}

// Configure localForage instance for subclass data
const subclassStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'subclass_data'
});

// CURRENT VERSION - INCREMENT THIS WHEN YOU ADD NEW COLUMNS
const CURRENT_VERSION = 2; // Use numbers for easier migration comparisons

// Migration functions
const migrations: { [version: number]: (data: any[]) => SubclassData[] } = {
  // Migration from version 1 to 2
  2: (data: any[]) => {
    console.log('Migrating subclass data to version 2');
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

// Store subclass data with localForage
export const storeSubclassData = async (data: SubclassData[]): Promise<void> => {
  try {
    await subclassStore.setItem('data', data);
    await subclassStore.setItem('timestamp', Date.now());
    await subclassStore.setItem('version', CURRENT_VERSION);
    console.log('Subclass data stored successfully (version:', CURRENT_VERSION, ')');
  } catch (error) {
    console.error('Error storing subclass data:', error);
  }
};

// Retrieve subclass data from localForage with migration support
export const getSubclassData = async (): Promise<SubclassData[] | null> => {
  try {
    const [data, storedVersion, timestamp] = await Promise.all([
      subclassStore.getItem<SubclassData[]>('data'),
      subclassStore.getItem<number>('version'),
      subclassStore.getItem<number>('timestamp')
    ]);

    if (!data) return null;

    // Apply migrations if needed
    if (storedVersion && storedVersion < CURRENT_VERSION) {
      console.log(`Migrating subclass data from v${storedVersion} to v${CURRENT_VERSION}`);
      let migratedData = data;
      
      for (let version = storedVersion + 1; version <= CURRENT_VERSION; version++) {
        if (migrations[version]) {
          migratedData = migrations[version](migratedData);
        }
      }
      
      // Store the migrated data
      await storeSubclassData(migratedData);
      return migratedData;
    }

    return data;
  } catch (error) {
    console.error('Error retrieving subclass data:', error);
    return null;
  }
};

// Check if subclass data is fresh (less than 24 hours old) AND matches current version
export const isSubclassDataFresh = async (): Promise<boolean> => {
  try {
    const [timestamp, storedVersion] = await Promise.all([
      subclassStore.getItem<number>('timestamp'),
      subclassStore.getItem<number>('version')
    ]);

    if (!timestamp || !storedVersion) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Check if data is outdated OR version mismatch
    const isRecent = (Date.now() - timestamp) < twentyFourHours;
    const isCurrentVersion = storedVersion === CURRENT_VERSION;
    
    if (isRecent && !isCurrentVersion) {
      console.log('Subclass data is recent but outdated version. Migration will handle this.');
      return false;
    }
    
    return isRecent && isCurrentVersion;
  } catch (error) {
    console.error('Error checking subclass data freshness:', error);
    return false;
  }
};

// Clear subclass data from localForage
export const clearSubclassData = async (): Promise<void> => {
  try {
    await subclassStore.clear();
    console.log('Subclass data cleared successfully');
  } catch (error) {
    console.error('Error clearing subclass data:', error);
  }
};

// Get the current version
export const getCurrentSubclassVersion = (): number => {
  return CURRENT_VERSION;
};

// Get the stored version
export const getStoredSubclassVersion = async (): Promise<number | null> => {
  try {
    return await subclassStore.getItem<number>('version');
  } catch (error) {
    console.error('Error retrieving subclass version:', error);
    return null;
  }
};

// Get subclass data only if it's fresh
export const getFreshSubclassData = async (): Promise<SubclassData[] | null> => {
  const data = await getSubclassData();
  const isFresh = await isSubclassDataFresh();
  
  return isFresh ? data : null;
};

// Get the timestamp of when subclass data was last stored
export const getSubclassTimestamp = async (): Promise<number | null> => {
  try {
    return await subclassStore.getItem<number>('timestamp');
  } catch (error) {
    console.error('Error retrieving subclass timestamp:', error);
    return null;
  }
};

// Check if subclass data exists (regardless of freshness)
export const hasSubclassData = async (): Promise<boolean> => {
  try {
    const data = await subclassStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for subclass data:', error);
    return false;
  }
};

// Filter subclass data by class_id
export const getSubclassesByClassId = async (classId: string): Promise<SubclassData[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  return data.filter(item => item.class_id === classId);
};

// Filter subclass data by barangay_id
export const getSubclassesByBarangayId = async (barangayId: string): Promise<SubclassData[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  return data.filter(item => item.barangay_id === barangayId);
};

// Find a specific subclass by subclass_id
export const getSubclassById = async (subclassId: string): Promise<SubclassData | null> => {
  const data = await getSubclassData();
  if (!data) return null;
  
  return data.find(item => item.subclass_id === subclassId) || null;
};

// Get all unique class IDs from subclass data
export const getUniqueClassIds = async (): Promise<string[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  const classIds = new Set<string>();
  data.forEach(item => classIds.add(item.class_id));
  
  return Array.from(classIds);
};

// Get all unique barangay IDs from subclass data
export const getUniqueBarangayIds = async (): Promise<string[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  const barangayIds = new Set<string>();
  data.forEach(item => {
    if (item.barangay_id) {
      barangayIds.add(item.barangay_id);
    }
  });
  
  return Array.from(barangayIds);
};

// Get subclasses with no barangay assigned (null barangay_id)
export const getSubclassesWithNoBarangay = async (): Promise<SubclassData[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  return data.filter(item => item.barangay_id === null);
};

// Search subclasses by name (case insensitive)
export const searchSubclassesByName = async (name: string): Promise<SubclassData[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  const lowerName = name.toLowerCase();
  return data.filter(item => 
    item.subclass.toLowerCase().includes(lowerName)
  );
};

// Get subclasses by multiple class IDs
export const getSubclassesByClassIds = async (classIds: string[]): Promise<SubclassData[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  const classIdSet = new Set(classIds);
  return data.filter(item => classIdSet.has(item.class_id));
};

// Get subclasses by multiple barangay IDs
export const getSubclassesByBarangayIds = async (barangayIds: string[]): Promise<SubclassData[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  const barangayIdSet = new Set(barangayIds);
  return data.filter(item => item.barangay_id && barangayIdSet.has(item.barangay_id));
};

// Get subclass count by class_id
export const getSubclassCountByClass = async (): Promise<Record<string, number>> => {
  const data = await getSubclassData();
  if (!data) return {};
  
  const countMap: Record<string, number> = {};
  data.forEach(item => {
    countMap[item.class_id] = (countMap[item.class_id] || 0) + 1;
  });
  
  return countMap;
};

// Get subclass count by barangay_id
export const getSubclassCountByBarangay = async (): Promise<Record<string, number>> => {
  const data = await getSubclassData();
  if (!data) return {};
  
  const countMap: Record<string, number> = {};
  data.forEach(item => {
    if (item.barangay_id) {
      countMap[item.barangay_id] = (countMap[item.barangay_id] || 0) + 1;
    }
  });
  
  return countMap;
};

// Get data size (useful for debugging)
export const getSubclassDataSize = async (): Promise<number> => {
  try {
    const data = await subclassStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting subclass data size:', error);
    return 0;
  }
};

// Get subclass count
export const getSubclassCount = async (): Promise<number> => {
  const data = await getSubclassData();
  return data ? data.length : 0;
};