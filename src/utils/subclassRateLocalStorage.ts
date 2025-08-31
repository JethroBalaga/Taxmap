// utils/subclassRateLocalStorage.ts
import localForage from 'localforage';

// Interface for subclass rate data
export interface SubclassRateData {
  subclassrate_id: string;
  subclass_id: string;
  eff_year: number;
  rate: number;
  // Add any new columns here when you add them to the database
  // example: new_column?: string;
}

// Configure localForage instance for subclass rate data
const subclassRateStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'subclass_rate_data'
});

// CURRENT VERSION - INCREMENT THIS WHEN YOU ADD NEW COLUMNS
const CURRENT_VERSION = 2; // Use numbers for easier migration comparisons

// Migration functions
const migrations: { [version: number]: (data: any[]) => SubclassRateData[] } = {
  // Migration from version 1 to 2
  2: (data: any[]) => {
    console.log('Migrating subclass rate data to version 2');
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

// Store subclass rate data with localForage - only keeps the most recent year's data
export const storeSubclassRateData = async (data: SubclassRateData[], year: number): Promise<void> => {
  try {
    // Always clear any existing data from different years first
    const storedYear = await getStoredRateYear();
    if (storedYear !== null && storedYear !== year) {
      console.log(`Replacing ${storedYear} data with ${year} data`);
      await clearSubclassRateData(); // Clear completely since it's a different year
    }
    
    await subclassRateStore.setItem('data', data);
    await subclassRateStore.setItem('timestamp', Date.now());
    await subclassRateStore.setItem('version', CURRENT_VERSION);
    await subclassRateStore.setItem('year', year);
    console.log('Subclass rate data stored successfully for year:', year, '(version:', CURRENT_VERSION, ')');
  } catch (error) {
    console.error('Error storing subclass rate data:', error);
  }
};

// Retrieve subclass rate data from localForage with migration support
export const getSubclassRateData = async (): Promise<SubclassRateData[] | null> => {
  try {
    const [data, storedVersion, timestamp, storedYear] = await Promise.all([
      subclassRateStore.getItem<SubclassRateData[]>('data'),
      subclassRateStore.getItem<number>('version'),
      subclassRateStore.getItem<number>('timestamp'),
      subclassRateStore.getItem<number>('year')
    ]);

    if (!data) return null;

    // Apply migrations if needed
    if (storedVersion && storedVersion < CURRENT_VERSION) {
      console.log(`Migrating subclass rate data from v${storedVersion} to v${CURRENT_VERSION}`);
      let migratedData = data;
      
      for (let version = storedVersion + 1; version <= CURRENT_VERSION; version++) {
        if (migrations[version]) {
          migratedData = migrations[version](migratedData);
        }
      }
      
      // Store the migrated data
      await storeSubclassRateData(migratedData, storedYear || new Date().getFullYear());
      return migratedData;
    }

    return data;
  } catch (error) {
    console.error('Error retrieving subclass rate data:', error);
    return null;
  }
};

// Check if subclass rate data is fresh (less than 24 hours old) AND matches current version AND current year
export const isSubclassRateDataFresh = async (): Promise<boolean> => {
  try {
    const [timestamp, storedVersion, storedYear] = await Promise.all([
      subclassRateStore.getItem<number>('timestamp'),
      subclassRateStore.getItem<number>('version'),
      subclassRateStore.getItem<number>('year')
    ]);

    if (!timestamp || !storedVersion || !storedYear) return false;
    
    const currentYear = new Date().getFullYear();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Check if data is outdated OR version mismatch OR wrong year
    const isRecent = (Date.now() - timestamp) < twentyFourHours;
    const isCurrentVersion = storedVersion === CURRENT_VERSION;
    const isCurrentYear = storedYear === currentYear;
    
    if (isRecent && (!isCurrentVersion || !isCurrentYear)) {
      console.log('Subclass rate data is recent but outdated version or year. Migration/cleanup will handle this.');
      return false;
    }
    
    return isRecent && isCurrentVersion && isCurrentYear;
  } catch (error) {
    console.error('Error checking subclass rate data freshness:', error);
    return false;
  }
};

// Clear subclass rate data from localForage
export const clearSubclassRateData = async (): Promise<void> => {
  try {
    await subclassRateStore.clear();
    console.log('Subclass rate data cleared successfully');
  } catch (error) {
    console.error('Error clearing subclass rate data:', error);
  }
};

// Get the current version
export const getCurrentSubclassRateVersion = (): number => {
  return CURRENT_VERSION;
};

// Get the stored version
export const getStoredSubclassRateVersion = async (): Promise<number | null> => {
  try {
    return await subclassRateStore.getItem<number>('version');
  } catch (error) {
    console.error('Error retrieving subclass rate version:', error);
    return null;
  }
};

// Get the year for which rate data was stored
export const getStoredRateYear = async (): Promise<number | null> => {
  try {
    return await subclassRateStore.getItem<number>('year');
  } catch (error) {
    console.error('Error retrieving stored rate year:', error);
    return null;
  }
};

// Get subclass rate data only if it's fresh
export const getFreshSubclassRateData = async (): Promise<SubclassRateData[] | null> => {
  // First check if we have old year data and clean it up
  await cleanupOldYearData();
  
  const data = await getSubclassRateData();
  const isFresh = await isSubclassRateDataFresh();
  
  return isFresh ? data : null;
};

// Check if subclass rate data exists (regardless of freshness)
export const hasSubclassRateData = async (): Promise<boolean> => {
  try {
    const data = await subclassRateStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for subclass rate data:', error);
    return false;
  }
};

// Filter subclass rate data by subclass_id
export const getRatesBySubclassId = async (subclassId: string): Promise<SubclassRateData[]> => {
  const data = await getSubclassRateData();
  if (!data) return [];
  
  return data.filter(item => item.subclass_id === subclassId);
};

// Get the current rate for a specific subclass
export const getCurrentRateForSubclass = async (subclassId: string): Promise<number | null> => {
  const data = await getSubclassRateData();
  if (!data) return null;
  
  const currentYear = new Date().getFullYear();
  const rateData = data.find(item => 
    item.subclass_id === subclassId && item.eff_year === currentYear
  );
  
  return rateData ? rateData.rate : null;
};

// Get rates for a specific subclass and year
export const getRateForSubclassAndYear = async (subclassId: string, year: number): Promise<number | null> => {
  const data = await getSubclassRateData();
  if (!data) return null;
  
  const rateData = data.find(item => 
    item.subclass_id === subclassId && item.eff_year === year
  );
  
  return rateData ? rateData.rate : null;
};

// Get all available years in the stored data
export const getAvailableYears = async (): Promise<number[]> => {
  const data = await getSubclassRateData();
  if (!data) return [];
  
  const years = new Set<number>();
  data.forEach(item => years.add(item.eff_year));
  
  return Array.from(years).sort((a, b) => b - a); // Return in descending order
};

// Get the most recent year available in the data
export const getMostRecentYear = async (): Promise<number | null> => {
  const years = await getAvailableYears();
  return years.length > 0 ? years[0] : null;
};

// Automatically clean up old year data
export const cleanupOldYearData = async (): Promise<void> => {
  try {
    const storedYear = await getStoredRateYear();
    const currentYear = new Date().getFullYear();
    
    if (storedYear !== null && storedYear !== currentYear) {
      console.log(`Cleaning up old data from ${storedYear} (current year: ${currentYear})`);
      await clearSubclassRateData();
    }
  } catch (error) {
    console.error('Error cleaning up old year data:', error);
  }
};

// Get the timestamp of when subclass rate data was last stored
export const getSubclassRateTimestamp = async (): Promise<number | null> => {
  try {
    return await subclassRateStore.getItem<number>('timestamp');
  } catch (error) {
    console.error('Error retrieving subclass rate timestamp:', error);
    return null;
  }
};

// Get data size (useful for debugging)
export const getSubclassRateDataSize = async (): Promise<number> => {
  try {
    const data = await subclassRateStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting subclass rate data size:', error);
    return 0;
  }
};

// Get rates for multiple subclass IDs
export const getRatesBySubclassIds = async (subclassIds: string[]): Promise<SubclassRateData[]> => {
  const data = await getSubclassRateData();
  if (!data) return [];
  
  const subclassIdSet = new Set(subclassIds);
  return data.filter(item => subclassIdSet.has(item.subclass_id));
};

// Get the average rate for a specific year
export const getAverageRateForYear = async (year: number): Promise<number | null> => {
  const data = await getSubclassRateData();
  if (!data || data.length === 0) return null;
  
  const yearData = data.filter(item => item.eff_year === year);
  if (yearData.length === 0) return null;
  
  const total = yearData.reduce((sum, item) => sum + item.rate, 0);
  return total / yearData.length;
};

// Get rate statistics for a specific year
export const getRateStatisticsForYear = async (year: number): Promise<{
  min: number;
  max: number;
  average: number;
  count: number;
} | null> => {
  const data = await getSubclassRateData();
  if (!data || data.length === 0) return null;
  
  const yearData = data.filter(item => item.eff_year === year);
  if (yearData.length === 0) return null;
  
  const rates = yearData.map(item => item.rate);
  return {
    min: Math.min(...rates),
    max: Math.max(...rates),
    average: rates.reduce((sum, rate) => sum + rate, 0) / rates.length,
    count: rates.length
  };
};

// Get subclass rate count
export const getSubclassRateCount = async (): Promise<number> => {
  const data = await getSubclassRateData();
  return data ? data.length : 0;
};