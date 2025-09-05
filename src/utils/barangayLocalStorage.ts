// utils/barangayLocalStorage.ts
import localForage from 'localforage';

// Interface for barangay data
export interface BarangayData {
  barangay_id: string;
  district_id: string;
  barangay: string;
}

// Configure localForage instance for barangay data
const barangayStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'barangay_data'
});

// Use timestamp for versioning
const CURRENT_VERSION = Date.now();

interface StoredDataMetadata {
  version: number;
  timestamp: number;
  schemaHash: string;
}

const generateSchemaHash = (): string => {
  const schema = {
    barangay_id: 'string',
    district_id: 'string',
    barangay: 'string'
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
    
    if (typeof item.barangay_id !== 'string') {
      errors.push(`Item at index ${index} has invalid barangay_id: ${typeof item.barangay_id} (${item.barangay_id})`);
    }
    
    if (typeof item.district_id !== 'string') {
      errors.push(`Item at index ${index} has invalid district_id: ${typeof item.district_id} (${item.district_id})`);
    }
    
    if (typeof item.barangay !== 'string') {
      errors.push(`Item at index ${index} has invalid barangay: ${typeof item.barangay} (${item.barangay})`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const migrateToCurrentVersion = (data: any[], fromVersion: number): BarangayData[] => {
  return data.map(item => {
    const migratedItem: Partial<BarangayData> = {};
    
    // Handle different data formats that might come from different versions
    if (typeof item.barangay_id === 'string' || typeof item.barangay_id === 'number') {
      migratedItem.barangay_id = String(item.barangay_id);
    } else {
      migratedItem.barangay_id = '';
    }
    
    if (typeof item.district_id === 'string' || typeof item.district_id === 'number') {
      migratedItem.district_id = String(item.district_id);
    } else {
      migratedItem.district_id = '';
    }

    if (typeof item.barangay === 'string') {
      migratedItem.barangay = item.barangay;
    } else if (typeof item.name === 'string') {
      // Handle potential alternative field names
      migratedItem.barangay = item.name;
    } else {
      migratedItem.barangay = '';
    }

    // Remove any unknown properties
    const validProperties = new Set(['barangay_id', 'district_id', 'barangay']);
    Object.keys(item).forEach(key => {
      if (!validProperties.has(key)) {
        delete migratedItem[key as keyof BarangayData];
      }
    });
    
    return migratedItem as BarangayData;
  });
};

// Store barangay data with localForage - enhanced with better error reporting
export const storeBarangayData = async (data: any[]): Promise<void> => {
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
    
    await barangayStore.setItem('data', migratedData);
    await barangayStore.setItem('metadata', {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      schemaHash: CURRENT_SCHEMA_HASH
    } as StoredDataMetadata);
    
    console.log('Barangay data stored successfully');
  } catch (error) {
    console.error('Error storing barangay data:', error);
    throw error;
  }
};

// Debug function to log what data is being received
export const debugBarangayData = (data: any[]): void => {
  console.log('Received data for storage:', {
    type: Array.isArray(data) ? 'array' : typeof data,
    length: Array.isArray(data) ? data.length : 'N/A',
    firstItem: Array.isArray(data) && data.length > 0 ? data[0] : 'N/A',
    sampleKeys: Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : 'N/A'
  });
};

// Retrieve barangay data from localForage with migration support
export const getBarangayData = async (): Promise<BarangayData[] | null> => {
  try {
    const [data, metadata] = await Promise.all([
      barangayStore.getItem<any[]>('data'),
      barangayStore.getItem<StoredDataMetadata>('metadata')
    ]);

    if (!data) return null;

    // If no metadata, assume it's old data and migrate it
    if (!metadata) {
      const migratedData = migrateToCurrentVersion(data, 1);
      await storeBarangayData(migratedData);
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
    
    await storeBarangayData(migratedData);
    return migratedData;
    
  } catch (error) {
    console.error('Error retrieving barangay data:', error);
    return null;
  }
};

// Check if barangay data is fresh (less than 24 hours old) AND matches current version
export const isBarangayDataFresh = async (): Promise<boolean> => {
  try {
    const metadata = await barangayStore.getItem<StoredDataMetadata>('metadata');

    if (!metadata) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Check if data is outdated OR version mismatch
    const isRecent = (Date.now() - metadata.timestamp) < twentyFourHours;
    const isCurrentVersion = metadata.version === CURRENT_VERSION;
    const isCurrentSchema = metadata.schemaHash === CURRENT_SCHEMA_HASH;
    
    return isRecent && isCurrentVersion && isCurrentSchema;
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
    const metadata = await barangayStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.version || null;
  } catch (error) {
    console.error('Error retrieving barangay version:', error);
    return null;
  }
};

// Get barangay data only if it's fresh
export const getFreshBarangayData = async (): Promise<BarangayData[] | null> => {
  const isFresh = await isBarangayDataFresh();
  return isFresh ? await getBarangayData() : null;
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
    const metadata = await barangayStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.timestamp || null;
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

// Force migration of barangay data
export const forceBarangayMigration = async (): Promise<BarangayData[] | null> => {
  try {
    const data = await barangayStore.getItem<any[]>('data');
    const metadata = await barangayStore.getItem<StoredDataMetadata>('metadata');
    
    if (!data) return null;
    
    const fromVersion = metadata?.version || 1;
    const migratedData = migrateToCurrentVersion(data, fromVersion);
    
    await storeBarangayData(migratedData);
    return migratedData;
    
  } catch (error) {
    console.error('Error forcing migration:', error);
    return null;
  }
};

// Get current schema hash
export const getCurrentBarangaySchemaHash = (): string => {
  return CURRENT_SCHEMA_HASH;
};

// Get stored schema hash
export const getStoredBarangaySchemaHash = async (): Promise<string | null> => {
  try {
    const metadata = await barangayStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.schemaHash || null;
  } catch (error) {
    console.error('Error retrieving schema hash:', error);
    return null;
  }
};

// Get barangays by name prefix
export const getBarangaysByNamePrefix = async (prefix: string): Promise<BarangayData[]> => {
  const data = await getBarangayData();
  if (!data) return [];
  
  const lowerPrefix = prefix.toLowerCase();
  return data.filter(item => 
    item.barangay.toLowerCase().startsWith(lowerPrefix)
  );
};

// Get random barangay
export const getRandomBarangay = async (): Promise<BarangayData | null> => {
  const data = await getBarangayData();
  if (!data || data.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * data.length);
  return data[randomIndex];
};