// utils/districtLocalStorage.ts
import localForage from 'localforage';

// Interface for district data
export interface DistrictData {
  district_id: number;
  district_name: string;
  founded: string; // Stored as string since it's a date
  // Add any new columns here when you add them to the database
  // example: new_column?: string;
}

// Configure localForage instance for district data
const districtStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'district_data'
});

// CURRENT VERSION - INCREMENT THIS WHEN YOU ADD NEW COLUMNS
const CURRENT_VERSION = 2; // Use numbers for easier migration comparisons

// Migration functions
const migrations: { [version: number]: (data: any[]) => DistrictData[] } = {
  // Migration from version 1 to 2
  2: (data: any[]) => {
    console.log('Migrating district data to version 2');
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

// Store district data with localForage
export const storeDistrictData = async (data: DistrictData[]): Promise<void> => {
  try {
    await districtStore.setItem('data', data);
    await districtStore.setItem('timestamp', Date.now());
    await districtStore.setItem('version', CURRENT_VERSION);
    console.log('District data stored successfully (version:', CURRENT_VERSION, ')');
  } catch (error) {
    console.error('Error storing district data:', error);
  }
};

// Retrieve district data from localForage with migration support
export const getDistrictData = async (): Promise<DistrictData[] | null> => {
  try {
    const [data, storedVersion, timestamp] = await Promise.all([
      districtStore.getItem<DistrictData[]>('data'),
      districtStore.getItem<number>('version'),
      districtStore.getItem<number>('timestamp')
    ]);

    if (!data) return null;

    // Apply migrations if needed
    if (storedVersion && storedVersion < CURRENT_VERSION) {
      console.log(`Migrating district data from v${storedVersion} to v${CURRENT_VERSION}`);
      let migratedData = data;
      
      for (let version = storedVersion + 1; version <= CURRENT_VERSION; version++) {
        if (migrations[version]) {
          migratedData = migrations[version](migratedData);
        }
      }
      
      // Store the migrated data
      await storeDistrictData(migratedData);
      return migratedData;
    }

    return data;
  } catch (error) {
    console.error('Error retrieving district data:', error);
    return null;
  }
};

// Check if district data is fresh (less than 24 hours old) AND matches current version
export const isDistrictDataFresh = async (): Promise<boolean> => {
  try {
    const [timestamp, storedVersion] = await Promise.all([
      districtStore.getItem<number>('timestamp'),
      districtStore.getItem<number>('version')
    ]);

    if (!timestamp || !storedVersion) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Check if data is outdated OR version mismatch
    const isRecent = (Date.now() - timestamp) < twentyFourHours;
    const isCurrentVersion = storedVersion === CURRENT_VERSION;
    
    if (isRecent && !isCurrentVersion) {
      console.log('District data is recent but outdated version. Migration will handle this.');
      return false;
    }
    
    return isRecent && isCurrentVersion;
  } catch (error) {
    console.error('Error checking district data freshness:', error);
    return false;
  }
};

// Clear district data from localForage
export const clearDistrictData = async (): Promise<void> => {
  try {
    await districtStore.clear();
    console.log('District data cleared successfully');
  } catch (error) {
    console.error('Error clearing district data:', error);
  }
};

// Get the current version
export const getCurrentDistrictVersion = (): number => {
  return CURRENT_VERSION;
};

// Get the stored version
export const getStoredDistrictVersion = async (): Promise<number | null> => {
  try {
    return await districtStore.getItem<number>('version');
  } catch (error) {
    console.error('Error retrieving district version:', error);
    return null;
  }
};

// Get district data only if it's fresh
export const getFreshDistrictData = async (): Promise<DistrictData[] | null> => {
  const data = await getDistrictData();
  const isFresh = await isDistrictDataFresh();
  
  return isFresh ? data : null;
};

// Check if district data exists (regardless of freshness)
export const hasDistrictData = async (): Promise<boolean> => {
  try {
    const data = await districtStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for district data:', error);
    return false;
  }
};

// Find a specific district by ID
export const getDistrictById = async (districtId: number): Promise<DistrictData | null> => {
  const data = await getDistrictData();
  if (!data) return null;
  
  return data.find(item => item.district_id === districtId) || null;
};

// Find districts by name (case insensitive)
export const getDistrictsByName = async (name: string): Promise<DistrictData[]> => {
  const data = await getDistrictData();
  if (!data) return [];
  
  const lowerName = name.toLowerCase();
  return data.filter(item => 
    item.district_name.toLowerCase().includes(lowerName)
  );
};

// Get all district names
export const getAllDistrictNames = async (): Promise<string[]> => {
  const data = await getDistrictData();
  if (!data) return [];
  
  return data.map(item => item.district_name);
};

// Sort districts by name
export const getDistrictsSortedByName = async (ascending: boolean = true): Promise<DistrictData[]> => {
  const data = await getDistrictData();
  if (!data) return [];
  
  return data.sort((a, b) => {
    const comparison = a.district_name.localeCompare(b.district_name);
    return ascending ? comparison : -comparison;
  });
};

// Sort districts by founding date
export const getDistrictsSortedByFoundedDate = async (ascending: boolean = true): Promise<DistrictData[]> => {
  const data = await getDistrictData();
  if (!data) return [];
  
  return data.sort((a, b) => {
    const dateA = new Date(a.founded).getTime();
    const dateB = new Date(b.founded).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

// Get the timestamp of when district data was last stored
export const getDistrictTimestamp = async (): Promise<number | null> => {
  try {
    return await districtStore.getItem<number>('timestamp');
  } catch (error) {
    console.error('Error retrieving district timestamp:', error);
    return null;
  }
};

// Get data size (useful for debugging)
export const getDistrictDataSize = async (): Promise<number> => {
  try {
    const data = await districtStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting district data size:', error);
    return 0;
  }
};

// Get districts founded after a specific date
export const getDistrictsFoundedAfter = async (date: string): Promise<DistrictData[]> => {
  const data = await getDistrictData();
  if (!data) return [];
  
  const targetDate = new Date(date).getTime();
  return data.filter(item => new Date(item.founded).getTime() > targetDate);
};

// Get districts founded before a specific date
export const getDistrictsFoundedBefore = async (date: string): Promise<DistrictData[]> => {
  const data = await getDistrictData();
  if (!data) return [];
  
  const targetDate = new Date(date).getTime();
  return data.filter(item => new Date(item.founded).getTime() < targetDate);
};

// Get the oldest district
export const getOldestDistrict = async (): Promise<DistrictData | null> => {
  const data = await getDistrictData();
  if (!data || data.length === 0) return null;
  
  return data.reduce((oldest, current) => {
    const oldestDate = new Date(oldest.founded).getTime();
    const currentDate = new Date(current.founded).getTime();
    return currentDate < oldestDate ? current : oldest;
  });
};

// Get the newest district
export const getNewestDistrict = async (): Promise<DistrictData | null> => {
  const data = await getDistrictData();
  if (!data || data.length === 0) return null;
  
  return data.reduce((newest, current) => {
    const newestDate = new Date(newest.founded).getTime();
    const currentDate = new Date(current.founded).getTime();
    return currentDate > newestDate ? current : newest;
  });
};

// Get districts by multiple IDs
export const getDistrictsByIds = async (districtIds: number[]): Promise<DistrictData[]> => {
  const data = await getDistrictData();
  if (!data) return [];
  
  const districtIdSet = new Set(districtIds);
  return data.filter(item => districtIdSet.has(item.district_id));
};

// Search districts with multiple criteria
export const searchDistricts = async (options: {
  name?: string;
  foundedAfter?: string;
  foundedBefore?: string;
  limit?: number;
}): Promise<DistrictData[]> => {
  const data = await getDistrictData();
  if (!data) return [];
  
  let results = data;
  
  if (options.name) {
    const lowerName = options.name.toLowerCase();
    results = results.filter(item => 
      item.district_name.toLowerCase().includes(lowerName)
    );
  }
  
  if (options.foundedAfter) {
    const targetDate = new Date(options.foundedAfter).getTime();
    results = results.filter(item => new Date(item.founded).getTime() > targetDate);
  }
  
  if (options.foundedBefore) {
    const targetDate = new Date(options.foundedBefore).getTime();
    results = results.filter(item => new Date(item.founded).getTime() < targetDate);
  }
  
  if (options.limit) {
    results = results.slice(0, options.limit);
  }
  
  return results;
};

// Get district count
export const getDistrictCount = async (): Promise<number> => {
  const data = await getDistrictData();
  return data ? data.length : 0;
};