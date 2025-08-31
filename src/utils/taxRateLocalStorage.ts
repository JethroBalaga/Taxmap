// utils/taxRateLocalStorage.ts
import localForage from 'localforage';

// Interface for tax rate data
export interface TaxRateData {
  tax_rate_id: string;
  effective_year: string;
  rate_percent: string;
  district_id: string;
  // Add any new columns here when you add them to the database
  // example: new_column?: string;
}

// Configure localForage instance for tax rate data
const taxRateStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'tax_rate_data'
});

// CURRENT VERSION - INCREMENT THIS WHEN YOU ADD NEW COLUMNS
const CURRENT_VERSION = 2; // Use numbers for easier migration comparisons

// Migration functions
const migrations: { [version: number]: (data: any[]) => TaxRateData[] } = {
  // Migration from version 1 to 2
  2: (data: any[]) => {
    console.log('Migrating tax rate data to version 2');
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

// Store tax rate data with localForage - only keeps the most recent year's data
export const storeTaxRateData = async (data: TaxRateData[], year: string): Promise<void> => {
  try {
    // Always clear any existing data from different years first
    const storedYear = await getStoredTaxRateYear();
    if (storedYear !== null && storedYear !== year) {
      console.log(`Replacing ${storedYear} data with ${year} data`);
      await clearTaxRateData(); // Clear completely since it's a different year
    }
    
    await taxRateStore.setItem('data', data);
    await taxRateStore.setItem('timestamp', Date.now());
    await taxRateStore.setItem('version', CURRENT_VERSION);
    await taxRateStore.setItem('year', year);
    console.log('Tax rate data stored successfully for year:', year, '(version:', CURRENT_VERSION, ')');
  } catch (error) {
    console.error('Error storing tax rate data:', error);
  }
};

// Retrieve tax rate data from localForage with migration support
export const getTaxRateData = async (): Promise<TaxRateData[] | null> => {
  try {
    const [data, storedVersion, timestamp, storedYear] = await Promise.all([
      taxRateStore.getItem<TaxRateData[]>('data'),
      taxRateStore.getItem<number>('version'),
      taxRateStore.getItem<number>('timestamp'),
      taxRateStore.getItem<string>('year')
    ]);

    if (!data) return null;

    // Apply migrations if needed
    if (storedVersion && storedVersion < CURRENT_VERSION) {
      console.log(`Migrating tax rate data from v${storedVersion} to v${CURRENT_VERSION}`);
      let migratedData = data;
      
      for (let version = storedVersion + 1; version <= CURRENT_VERSION; version++) {
        if (migrations[version]) {
          migratedData = migrations[version](migratedData);
        }
      }
      
      // Store the migrated data
      await storeTaxRateData(migratedData, storedYear || new Date().getFullYear().toString());
      return migratedData;
    }

    return data;
  } catch (error) {
    console.error('Error retrieving tax rate data:', error);
    return null;
  }
};

// Check if tax rate data is fresh (less than 24 hours old) AND matches current version AND current year
export const isTaxRateDataFresh = async (): Promise<boolean> => {
  try {
    const [timestamp, storedVersion, storedYear] = await Promise.all([
      taxRateStore.getItem<number>('timestamp'),
      taxRateStore.getItem<number>('version'),
      taxRateStore.getItem<string>('year')
    ]);

    if (!timestamp || !storedVersion || !storedYear) return false;
    
    const currentYear = new Date().getFullYear().toString();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Check if data is outdated OR version mismatch OR wrong year
    const isRecent = (Date.now() - timestamp) < twentyFourHours;
    const isCurrentVersion = storedVersion === CURRENT_VERSION;
    const isCurrentYear = storedYear === currentYear;
    
    if (isRecent && (!isCurrentVersion || !isCurrentYear)) {
      console.log('Tax rate data is recent but outdated version or year. Migration/cleanup will handle this.');
      return false;
    }
    
    return isRecent && isCurrentVersion && isCurrentYear;
  } catch (error) {
    console.error('Error checking tax rate data freshness:', error);
    return false;
  }
};

// Clear tax rate data from localForage
export const clearTaxRateData = async (): Promise<void> => {
  try {
    await taxRateStore.clear();
    console.log('Tax rate data cleared successfully');
  } catch (error) {
    console.error('Error clearing tax rate data:', error);
  }
};

// Get the current version
export const getCurrentTaxRateVersion = (): number => {
  return CURRENT_VERSION;
};

// Get the stored version
export const getStoredTaxRateVersion = async (): Promise<number | null> => {
  try {
    return await taxRateStore.getItem<number>('version');
  } catch (error) {
    console.error('Error retrieving tax rate version:', error);
    return null;
  }
};

// Get the year for which tax rate data was stored
export const getStoredTaxRateYear = async (): Promise<string | null> => {
  try {
    return await taxRateStore.getItem<string>('year');
  } catch (error) {
    console.error('Error retrieving stored tax rate year:', error);
    return null;
  }
};

// Get tax rate data only if it's fresh
export const getFreshTaxRateData = async (): Promise<TaxRateData[] | null> => {
  // First check if we have old year data and clean it up
  await cleanupOldTaxRateYearData();
  
  const data = await getTaxRateData();
  const isFresh = await isTaxRateDataFresh();
  
  return isFresh ? data : null;
};

// Check if tax rate data exists (regardless of freshness)
export const hasTaxRateData = async (): Promise<boolean> => {
  try {
    const data = await taxRateStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for tax rate data:', error);
    return false;
  }
};

// Filter tax rate data by district_id
export const getTaxRatesByDistrictId = async (districtId: string): Promise<TaxRateData[]> => {
  const data = await getTaxRateData();
  if (!data) return [];
  
  return data.filter(item => item.district_id === districtId);
};

// Get the current tax rate for a specific district
export const getCurrentTaxRateForDistrict = async (districtId: string): Promise<string | null> => {
  const data = await getTaxRateData();
  if (!data) return null;
  
  const currentYear = new Date().getFullYear().toString();
  const rateData = data.find(item => 
    item.district_id === districtId && item.effective_year === currentYear
  );
  
  return rateData ? rateData.rate_percent : null;
};

// Get tax rates for a specific district and year
export const getTaxRateForDistrictAndYear = async (districtId: string, year: string): Promise<string | null> => {
  const data = await getTaxRateData();
  if (!data) return null;
  
  const rateData = data.find(item => 
    item.district_id === districtId && item.effective_year === year
  );
  
  return rateData ? rateData.rate_percent : null;
};

// Get all available years in the stored data
export const getAvailableTaxRateYears = async (): Promise<string[]> => {
  const data = await getTaxRateData();
  if (!data) return [];
  
  const years = new Set<string>();
  data.forEach(item => years.add(item.effective_year));
  
  return Array.from(years).sort((a, b) => b.localeCompare(a)); // Return in descending order
};

// Get the most recent year available in the data
export const getMostRecentTaxRateYear = async (): Promise<string | null> => {
  const years = await getAvailableTaxRateYears();
  return years.length > 0 ? years[0] : null;
};

// Automatically clean up old year data
export const cleanupOldTaxRateYearData = async (): Promise<void> => {
  try {
    const storedYear = await getStoredTaxRateYear();
    const currentYear = new Date().getFullYear().toString();
    
    if (storedYear !== null && storedYear !== currentYear) {
      console.log(`Cleaning up old tax rate data from ${storedYear} (current year: ${currentYear})`);
      await clearTaxRateData();
    }
  } catch (error) {
    console.error('Error cleaning up old tax rate year data:', error);
  }
};

// Get the timestamp of when tax rate data was last stored
export const getTaxRateTimestamp = async (): Promise<number | null> => {
  try {
    return await taxRateStore.getItem<number>('timestamp');
  } catch (error) {
    console.error('Error retrieving tax rate timestamp:', error);
    return null;
  }
};

// Get data size (useful for debugging)
export const getTaxRateDataSize = async (): Promise<number> => {
  try {
    const data = await taxRateStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting tax rate data size:', error);
    return 0;
  }
};

// Get tax rates by multiple district IDs
export const getTaxRatesByDistrictIds = async (districtIds: string[]): Promise<TaxRateData[]> => {
  const data = await getTaxRateData();
  if (!data) return [];
  
  const districtIdSet = new Set(districtIds);
  return data.filter(item => districtIdSet.has(item.district_id));
};

// Get tax rate statistics for a specific year
export const getTaxRateStatisticsForYear = async (year: string): Promise<{
  min: number;
  max: number;
  average: number;
  count: number;
} | null> => {
  const data = await getTaxRateData();
  if (!data || data.length === 0) return null;
  
  const yearData = data.filter(item => item.effective_year === year);
  if (yearData.length === 0) return null;
  
  const rates = yearData.map(item => parseFloat(item.rate_percent) || 0);
  return {
    min: Math.min(...rates),
    max: Math.max(...rates),
    average: rates.reduce((sum, rate) => sum + rate, 0) / rates.length,
    count: rates.length
  };
};

// Get tax rate count
export const getTaxRateCount = async (): Promise<number> => {
  const data = await getTaxRateData();
  return data ? data.length : 0;
};

// Get all unique district IDs from tax rate data
export const getUniqueTaxRateDistrictIds = async (): Promise<string[]> => {
  const data = await getTaxRateData();
  if (!data) return [];
  
  const districtIds = new Set<string>();
  data.forEach(item => districtIds.add(item.district_id));
  
  return Array.from(districtIds);
};

// Search tax rates with multiple criteria
export const searchTaxRates = async (options: {
  districtId?: string;
  year?: string;
  minRate?: number;
  maxRate?: number;
  limit?: number;
}): Promise<TaxRateData[]> => {
  const data = await getTaxRateData();
  if (!data) return [];
  
  let results = data;
  
  if (options.districtId) {
    results = results.filter(item => item.district_id === options.districtId);
  }
  
  if (options.year) {
    results = results.filter(item => item.effective_year === options.year);
  }
  
  if (options.minRate !== undefined) {
    results = results.filter(item => {
      const rate = parseFloat(item.rate_percent) || 0;
      return rate >= options.minRate!;
    });
  }
  
  if (options.maxRate !== undefined) {
    results = results.filter(item => {
      const rate = parseFloat(item.rate_percent) || 0;
      return rate <= options.maxRate!;
    });
  }
  
  if (options.limit) {
    results = results.slice(0, options.limit);
  }
  
  return results;
};