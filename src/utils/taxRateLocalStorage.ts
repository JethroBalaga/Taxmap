// utils/taxRateLocalStorage.ts
import localForage from 'localforage';

// Interface for tax rate data
export interface TaxRateData {
  tax_rate_id: string;
  effective_year: string;
  rate_percent: string;
  district_id: string;
}

// Configure localForage instance for tax rate data
const taxRateStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'tax_rate_data'
});

// Use timestamp for versioning
const CURRENT_VERSION = Date.now();

interface StoredDataMetadata {
  version: number;
  timestamp: number;
  schemaHash: string;
  year?: string;
}

const generateSchemaHash = (): string => {
  const schema = {
    tax_rate_id: 'string',
    effective_year: 'string',
    rate_percent: 'string',
    district_id: 'string'
  };
  return JSON.stringify(schema);
};

const CURRENT_SCHEMA_HASH = generateSchemaHash();

// Enhanced validation with detailed error reporting
const validateData = (data: any[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!Array.isArray(data)) {
    errors.push('Data is not an array');
    return { isValid: false, errors };
  }
  
  if (data.length === 0) {
    errors.push('Data array is empty');
    return { isValid: false, errors };
  }
  
  data.forEach((item, index) => {
    if (typeof item !== 'object' || item === null) {
      errors.push(`Item at index ${index} is not an object`);
      return;
    }
    
    if (typeof item.tax_rate_id !== 'string') {
      errors.push(`Item at index ${index} has invalid tax_rate_id: ${typeof item.tax_rate_id} (${item.tax_rate_id})`);
    }
    
    if (typeof item.effective_year !== 'string') {
      errors.push(`Item at index ${index} has invalid effective_year: ${typeof item.effective_year} (${item.effective_year})`);
    }

    if (typeof item.rate_percent !== 'string') {
      errors.push(`Item at index ${index} has invalid rate_percent: ${typeof item.rate_percent} (${item.rate_percent})`);
    }

    if (typeof item.district_id !== 'string') {
      errors.push(`Item at index ${index} has invalid district_id: ${typeof item.district_id} (${item.district_id})`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const migrateToCurrentVersion = (data: any[], fromVersion: number): TaxRateData[] => {
  return data.map(item => {
    const migratedItem: Partial<TaxRateData> = {};
    
    // Handle different data formats that might come from different versions
    if (typeof item.tax_rate_id === 'string' || typeof item.tax_rate_id === 'number') {
      migratedItem.tax_rate_id = String(item.tax_rate_id);
    } else {
      migratedItem.tax_rate_id = '';
    }
    
    if (typeof item.effective_year === 'string' || typeof item.effective_year === 'number') {
      migratedItem.effective_year = String(item.effective_year);
    } else {
      migratedItem.effective_year = '';
    }

    if (typeof item.rate_percent === 'string' || typeof item.rate_percent === 'number') {
      migratedItem.rate_percent = String(item.rate_percent);
    } else {
      migratedItem.rate_percent = '';
    }

    if (typeof item.district_id === 'string' || typeof item.district_id === 'number') {
      migratedItem.district_id = String(item.district_id);
    } else {
      migratedItem.district_id = '';
    }

    // Remove any unknown properties
    const validProperties = new Set(['tax_rate_id', 'effective_year', 'rate_percent', 'district_id']);
    Object.keys(item).forEach(key => {
      if (!validProperties.has(key)) {
        delete migratedItem[key as keyof TaxRateData];
      }
    });
    
    return migratedItem as TaxRateData;
  });
};

// Store tax rate data with localForage - enhanced with better error reporting
export const storeTaxRateData = async (data: any[], year: string): Promise<void> => {
  try {
    // First try to migrate the data in case it's from an older format
    const migratedData = migrateToCurrentVersion(data, 1);
    
    const validation = validateData(migratedData);
    
    if (!validation.isValid) {
      console.error('Invalid data format attempted to be stored:', validation.errors);
      console.error('Raw data received:', data);
      console.error('Migrated data:', migratedData);
      throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Always clear any existing data from different years first
    const storedMetadata = await taxRateStore.getItem<StoredDataMetadata>('metadata');
    if (storedMetadata?.year !== undefined && storedMetadata.year !== year) {
      console.log(`Replacing ${storedMetadata.year} data with ${year} data`);
      await clearTaxRateData();
    }
    
    await taxRateStore.setItem('data', migratedData);
    await taxRateStore.setItem('metadata', {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      schemaHash: CURRENT_SCHEMA_HASH,
      year: year
    } as StoredDataMetadata);
    
    console.log('Tax rate data stored successfully for year:', year);
  } catch (error) {
    console.error('Error storing tax rate data:', error);
    throw error;
  }
};

// Debug function to log what data is being received
export const debugTaxRateData = (data: any[]): void => {
  console.log('Received tax rate data for storage:', {
    type: Array.isArray(data) ? 'array' : typeof data,
    length: Array.isArray(data) ? data.length : 'N/A',
    firstItem: Array.isArray(data) && data.length > 0 ? data[0] : 'N/A',
    sampleKeys: Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : 'N/A'
  });
};

// Retrieve tax rate data from localForage with migration support
export const getTaxRateData = async (): Promise<TaxRateData[] | null> => {
  try {
    const [data, metadata] = await Promise.all([
      taxRateStore.getItem<any[]>('data'),
      taxRateStore.getItem<StoredDataMetadata>('metadata')
    ]);

    if (!data) return null;

    // If no metadata, assume it's old data and migrate it
    if (!metadata) {
      const migratedData = migrateToCurrentVersion(data, 1);
      await storeTaxRateData(migratedData, new Date().getFullYear().toString());
      return migratedData;
    }

    if (metadata.version === CURRENT_VERSION) {
      const validation = validateData(data);
      if (validation.isValid) {
        return data;
      }
    }

    let migratedData = migrateToCurrentVersion(data, metadata.version);
    
    const validation = validateData(migratedData);
    if (!validation.isValid) {
      console.error('Migrated data failed validation:', validation.errors);
      return null;
    }
    
    await storeTaxRateData(migratedData, metadata.year || new Date().getFullYear().toString());
    return migratedData;
    
  } catch (error) {
    console.error('Error retrieving tax rate data:', error);
    return null;
  }
};

// Check if tax rate data is fresh (less than 24 hours old) AND matches current version AND current year
export const isTaxRateDataFresh = async (): Promise<boolean> => {
  try {
    const metadata = await taxRateStore.getItem<StoredDataMetadata>('metadata');

    if (!metadata) return false;
    
    const currentYear = new Date().getFullYear().toString();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Check if data is outdated OR version mismatch OR wrong year
    const isRecent = (Date.now() - metadata.timestamp) < twentyFourHours;
    const isCurrentVersion = metadata.version === CURRENT_VERSION;
    const isCurrentSchema = metadata.schemaHash === CURRENT_SCHEMA_HASH;
    const isCurrentYear = metadata.year === currentYear;
    
    return isRecent && isCurrentVersion && isCurrentSchema && isCurrentYear;
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
    const metadata = await taxRateStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.version || null;
  } catch (error) {
    console.error('Error retrieving tax rate version:', error);
    return null;
  }
};

// Get the year for which tax rate data was stored
export const getStoredTaxRateYear = async (): Promise<string | null> => {
  try {
    const metadata = await taxRateStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.year || null;
  } catch (error) {
    console.error('Error retrieving stored tax rate year:', error);
    return null;
  }
};

// Get tax rate data only if it's fresh
export const getFreshTaxRateData = async (): Promise<TaxRateData[] | null> => {
  // First check if we have old year data and clean it up
  await cleanupOldTaxRateYearData();
  
  const isFresh = await isTaxRateDataFresh();
  return isFresh ? await getTaxRateData() : null;
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
    const metadata = await taxRateStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.timestamp || null;
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

// Force migration of tax rate data
export const forceTaxRateMigration = async (): Promise<TaxRateData[] | null> => {
  try {
    const data = await taxRateStore.getItem<any[]>('data');
    const metadata = await taxRateStore.getItem<StoredDataMetadata>('metadata');
    
    if (!data) return null;
    
    const fromVersion = metadata?.version || 1;
    const migratedData = migrateToCurrentVersion(data, fromVersion);
    
    await storeTaxRateData(migratedData, metadata?.year || new Date().getFullYear().toString());
    return migratedData;
    
  } catch (error) {
    console.error('Error forcing migration:', error);
    return null;
  }
};

// Get current schema hash
export const getCurrentTaxRateSchemaHash = (): string => {
  return CURRENT_SCHEMA_HASH;
};

// Get stored schema hash
export const getStoredTaxRateSchemaHash = async (): Promise<string | null> => {
  try {
    const metadata = await taxRateStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.schemaHash || null;
  } catch (error) {
    console.error('Error retrieving schema hash:', error);
    return null;
  }
};

// Get tax rate by ID
export const getTaxRateById = async (taxRateId: string): Promise<TaxRateData | null> => {
  const data = await getTaxRateData();
  if (!data) return null;
  
  return data.find(item => item.tax_rate_id === taxRateId) || null;
};

// Get tax rates by year
export const getTaxRatesByYear = async (year: string): Promise<TaxRateData[]> => {
  const data = await getTaxRateData();
  if (!data) return [];
  
  return data.filter(item => item.effective_year === year);
};

// Get average tax rate for a specific year
export const getAverageTaxRateForYear = async (year: string): Promise<number | null> => {
  const data = await getTaxRateData();
  if (!data || data.length === 0) return null;
  
  const yearData = data.filter(item => item.effective_year === year);
  if (yearData.length === 0) return null;
  
  const rates = yearData.map(item => parseFloat(item.rate_percent) || 0);
  return rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
};

// Get tax rates above a certain percentage
export const getTaxRatesAbovePercentage = async (minPercentage: number): Promise<TaxRateData[]> => {
  const data = await getTaxRateData();
  if (!data) return [];
  
  return data.filter(item => {
    const rate = parseFloat(item.rate_percent) || 0;
    return rate >= minPercentage;
  });
};

// Get tax rates below a certain percentage
export const getTaxRatesBelowPercentage = async (maxPercentage: number): Promise<TaxRateData[]> => {
  const data = await getTaxRateData();
  if (!data) return [];
  
  return data.filter(item => {
    const rate = parseFloat(item.rate_percent) || 0;
    return rate <= maxPercentage;
  });
};