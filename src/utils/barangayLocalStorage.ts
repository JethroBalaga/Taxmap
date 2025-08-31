// utils/barangayLocalStorage.ts
import localForage from 'localforage';

// Interface for barangay data
export interface BarangayData {
  barangay_id: string;
  district_id: string;
  barangay: string;
  // Add any new columns here when you add them to the database
  // example: new_column?: string;
}

// Configure localForage instance for barangay data
const barangayStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'barangay_data'
});

// CURRENT VERSION - INCREMENT THIS WHEN YOU ADD NEW COLUMNS
const CURRENT_VERSION = 2; // Use numbers for easier migration comparisons

// Migration functions
const migrations: { [version: number]: (data: any[]) => BarangayData[] } = {
  // Migration from version 1 to 2
  2: (data: any[]) => {
    console.log('Migrating barangay data to version 2');
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

// Store barangay data with localForage
export const storeBarangayData = async (data: BarangayData[]): Promise<void> => {
  try {
    await barangayStore.setItem('data', data);
    await barangayStore.setItem('timestamp', Date.now());
    await barangayStore.setItem('version', CURRENT_VERSION);
    console.log('Barangay data stored successfully (version:', CURRENT_VERSION, ')');
  } catch (error) {
    console.error('Error storing barangay data:', error);
  }
};

// Retrieve barangay data from localForage with migration support
export const getBarangayData = async (): Promise<BarangayData[] | null> => {
  try {
    const [data, storedVersion, timestamp] = await Promise.all([
      barangayStore.getItem<BarangayData[]>('data'),
      barangayStore.getItem<number>('version'),
      barangayStore.getItem<number>('timestamp')
    ]);

    if (!data) return null;

    // Apply migrations if needed
    if (storedVersion && storedVersion < CURRENT_VERSION) {
      console.log(`Migrating barangay data from v${storedVersion} to v${CURRENT_VERSION}`);
      let migratedData = data;
      
      for (let version = storedVersion + 1; version <= CURRENT_VERSION; version++) {
        if (migrations[version]) {
          migratedData = migrations[version](migratedData);
        }
      }
      
      // Store the migrated data
      await storeBarangayData(migratedData);
      return migratedData;
    }

    return data;
  } catch (error) {
    console.error('Error retrieving barangay data:', error);
    return null;
  }
};

// Check if barangay data is fresh (less than 24 hours old) AND matches current version
export const isBarangayDataFresh = async (): Promise<boolean> => {
  try {
    const [timestamp, storedVersion] = await Promise.all([
      barangayStore.getItem<number>('timestamp'),
      barangayStore.getItem<number>('version')
    ]);

    if (!timestamp || !storedVersion) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Check if data is outdated OR version mismatch
    const isRecent = (Date.now() - timestamp) < twentyFourHours;
    const isCurrentVersion = storedVersion === CURRENT_VERSION;
    
    if (isRecent && !isCurrentVersion) {
      console.log('Barangay data is recent but outdated version. Migration will handle this.');
      return false;
    }
    
    return isRecent && isCurrentVersion;
  } catch (error) {
    console.error('Error checking barangay data freshness:', error);
    return false;
  }
};

// Clear barangay data from localForage
export const clearBarangayData = async (): Promise<void> => {
  try {
    await barangayStore.clear();
    console.log('Barangay data cleared successfully');
  } catch (error) {
    console.error('Error clearing barangay data:', error);
  }
};

// Get the current version
export const getCurrentBarangayVersion = (): number => {
  return CURRENT_VERSION;
};

// Get the stored version
export const getStoredBarangayVersion = async (): Promise<number | null> => {
  try {
    return await barangayStore.getItem<number>('version');
  } catch (error) {
    console.error('Error retrieving barangay version:', error);
    return null;
  }
};

// Get barangay data only if it's fresh
export const getFreshBarangayData = async (): Promise<BarangayData[] | null> => {
  const data = await getBarangayData();
  const isFresh = await isBarangayDataFresh();
  
  return isFresh ? data : null;
};

// Check if barangay data exists (regardless of freshness)
export const hasBarangayData = async (): Promise<boolean> => {
  try {
    const data = await barangayStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for barangay data:', error);
    return false;
  }
};

// Find a specific barangay by ID
export const getBarangayById = async (barangayId: string): Promise<BarangayData | null> => {
  const data = await getBarangayData();
  if (!data) return null;
  
  return data.find(item => item.barangay_id === barangayId) || null;
};

// Find barangays by district ID
export const getBarangaysByDistrictId = async (districtId: string): Promise<BarangayData[]> => {
  const data = await getBarangayData();
  if (!data) return [];
  
  return data.filter(item => item.district_id === districtId);
};

// Find barangays by name (case insensitive)
export const getBarangaysByName = async (name: string): Promise<BarangayData[]> => {
  const data = await getBarangayData();
  if (!data) return [];
  
  const lowerName = name.toLowerCase();
  return data.filter(item => 
    item.barangay.toLowerCase().includes(lowerName)
  );
};

// Get all barangay names
export const getAllBarangayNames = async (): Promise<string[]> => {
  const data = await getBarangayData();
  if (!data) return [];
  
  return data.map(item => item.barangay);
};

// Get all unique district IDs from barangay data
export const getUniqueDistrictIds = async (): Promise<string[]> => {
  const data = await getBarangayData();
  if (!data) return [];
  
  const districtIds = new Set<string>();
  data.forEach(item => districtIds.add(item.district_id));
  
  return Array.from(districtIds);
};

// Sort barangays by name
export const getBarangaysSortedByName = async (ascending: boolean = true): Promise<BarangayData[]> => {
  const data = await getBarangayData();
  if (!data) return [];
  
  return data.sort((a, b) => {
    const comparison = a.barangay.localeCompare(b.barangay);
    return ascending ? comparison : -comparison;
  });
};

// Get barangay count by district
export const getBarangayCountByDistrict = async (): Promise<Record<string, number>> => {
  const data = await getBarangayData();
  if (!data) return {};
  
  const countMap: Record<string, number> = {};
  data.forEach(item => {
    countMap[item.district_id] = (countMap[item.district_id] || 0) + 1;
  });
  
  return countMap;
};

// Get the timestamp of when barangay data was last stored
export const getBarangayTimestamp = async (): Promise<number | null> => {
  try {
    return await barangayStore.getItem<number>('timestamp');
  } catch (error) {
    console.error('Error retrieving barangay timestamp:', error);
    return null;
  }
};

// Get data size (useful for debugging)
export const getBarangayDataSize = async (): Promise<number> => {
  try {
    const data = await barangayStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting barangay data size:', error);
    return 0;
  }
};

// Get barangays by multiple district IDs
export const getBarangaysByDistrictIds = async (districtIds: string[]): Promise<BarangayData[]> => {
  const data = await getBarangayData();
  if (!data) return [];
  
  const districtIdSet = new Set(districtIds);
  return data.filter(item => districtIdSet.has(item.district_id));
};

// Search barangays by multiple criteria
export const searchBarangays = async (options: {
  districtId?: string;
  name?: string;
  limit?: number;
}): Promise<BarangayData[]> => {
  const data = await getBarangayData();
  if (!data) return [];
  
  let results = data;
  
  if (options.districtId) {
    results = results.filter(item => item.district_id === options.districtId);
  }
  
  if (options.name) {
    const lowerName = options.name.toLowerCase();
    results = results.filter(item => 
      item.barangay.toLowerCase().includes(lowerName)
    );
  }
  
  if (options.limit) {
    results = results.slice(0, options.limit);
  }
  
  return results;
};

// Get barangay count
export const getBarangayCount = async (): Promise<number> => {
  const data = await getBarangayData();
  return data ? data.length : 0;
};