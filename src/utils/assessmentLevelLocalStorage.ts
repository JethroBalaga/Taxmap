// utils/assessmentLevelLocalStorage.ts
import localForage from 'localforage';

// Interface for assessment level data
export interface AssessmentLevelData {
  assessment_level_id: string;
  kind_id: number;
  effective_year: number;
  class_id: string;
  range1: number;
  range2: number;
  rate_percent: string;
}

// Configure localForage instance for assessment level data
const assessmentLevelStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'assessment_level_data'
});

// Use timestamp for versioning
const CURRENT_VERSION = Date.now();

interface StoredDataMetadata {
  version: number;
  timestamp: number;
  schemaHash: string;
  year?: number;
}

const generateSchemaHash = (): string => {
  const schema = {
    assessment_level_id: 'string',
    kind_id: 'number',
    effective_year: 'number',
    class_id: 'string',
    range1: 'number',
    range2: 'number',
    rate_percent: 'string'
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
    
    if (typeof item.assessment_level_id !== 'string') {
      errors.push(`Item at index ${index} has invalid assessment_level_id: ${typeof item.assessment_level_id} (${item.assessment_level_id})`);
    }
    
    if (typeof item.kind_id !== 'number') {
      errors.push(`Item at index ${index} has invalid kind_id: ${typeof item.kind_id} (${item.kind_id})`);
    }

    if (typeof item.effective_year !== 'number') {
      errors.push(`Item at index ${index} has invalid effective_year: ${typeof item.effective_year} (${item.effective_year})`);
    }

    if (typeof item.class_id !== 'string') {
      errors.push(`Item at index ${index} has invalid class_id: ${typeof item.class_id} (${item.class_id})`);
    }

    if (typeof item.range1 !== 'number') {
      errors.push(`Item at index ${index} has invalid range1: ${typeof item.range1} (${item.range1})`);
    }

    if (typeof item.range2 !== 'number') {
      errors.push(`Item at index ${index} has invalid range2: ${typeof item.range2} (${item.range2})`);
    }

    if (typeof item.rate_percent !== 'string') {
      errors.push(`Item at index ${index} has invalid rate_percent: ${typeof item.rate_percent} (${item.rate_percent})`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const migrateToCurrentVersion = (data: any[], fromVersion: number): AssessmentLevelData[] => {
  return data.map(item => {
    const migratedItem: Partial<AssessmentLevelData> = {};
    
    // Handle different data formats that might come from different versions
    if (typeof item.assessment_level_id === 'string' || typeof item.assessment_level_id === 'number') {
      migratedItem.assessment_level_id = String(item.assessment_level_id);
    } else {
      migratedItem.assessment_level_id = '';
    }
    
    if (typeof item.kind_id === 'number') {
      migratedItem.kind_id = item.kind_id;
    } else if (typeof item.kind_id === 'string') {
      migratedItem.kind_id = parseInt(item.kind_id) || 0;
    } else {
      migratedItem.kind_id = 0;
    }

    if (typeof item.effective_year === 'number') {
      migratedItem.effective_year = item.effective_year;
    } else if (typeof item.effective_year === 'string') {
      migratedItem.effective_year = parseInt(item.effective_year) || new Date().getFullYear();
    } else {
      migratedItem.effective_year = new Date().getFullYear();
    }

    if (typeof item.class_id === 'string') {
      migratedItem.class_id = item.class_id;
    } else if (typeof item.class_id === 'number') {
      migratedItem.class_id = String(item.class_id);
    } else {
      migratedItem.class_id = '';
    }

    if (typeof item.range1 === 'number') {
      migratedItem.range1 = item.range1;
    } else if (typeof item.range1 === 'string') {
      migratedItem.range1 = parseFloat(item.range1) || 0;
    } else {
      migratedItem.range1 = 0;
    }

    if (typeof item.range2 === 'number') {
      migratedItem.range2 = item.range2;
    } else if (typeof item.range2 === 'string') {
      migratedItem.range2 = parseFloat(item.range2) || 0;
    } else {
      migratedItem.range2 = 0;
    }

    if (typeof item.rate_percent === 'string') {
      migratedItem.rate_percent = item.rate_percent;
    } else if (typeof item.rate_percent === 'number') {
      migratedItem.rate_percent = String(item.rate_percent);
    } else {
      migratedItem.rate_percent = '0';
    }

    // Remove any unknown properties
    const validProperties = new Set([
      'assessment_level_id', 'kind_id', 'effective_year', 'class_id', 
      'range1', 'range2', 'rate_percent'
    ]);
    
    Object.keys(item).forEach(key => {
      if (!validProperties.has(key)) {
        delete migratedItem[key as keyof AssessmentLevelData];
      }
    });
    
    return migratedItem as AssessmentLevelData;
  });
};

// Store assessment level data with localForage - enhanced with better error reporting
export const storeAssessmentLevelData = async (data: any[], year: number): Promise<void> => {
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
    const storedMetadata = await assessmentLevelStore.getItem<StoredDataMetadata>('metadata');
    if (storedMetadata?.year !== undefined && storedMetadata.year !== year) {
      console.log(`Replacing ${storedMetadata.year} data with ${year} data`);
      await clearAssessmentLevelData();
    }
    
    await assessmentLevelStore.setItem('data', migratedData);
    await assessmentLevelStore.setItem('metadata', {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      schemaHash: CURRENT_SCHEMA_HASH,
      year: year
    } as StoredDataMetadata);
    
    console.log('Assessment level data stored successfully for year:', year);
  } catch (error) {
    console.error('Error storing assessment level data:', error);
    throw error;
  }
};

// Debug function to log what data is being received
export const debugAssessmentLevelData = (data: any[]): void => {
  console.log('Received assessment level data for storage:', {
    type: Array.isArray(data) ? 'array' : typeof data,
    length: Array.isArray(data) ? data.length : 'N/A',
    firstItem: Array.isArray(data) && data.length > 0 ? data[0] : 'N/A',
    sampleKeys: Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : 'N/A'
  });
};

// Retrieve assessment level data from localForage with migration support
export const getAssessmentLevelData = async (): Promise<AssessmentLevelData[] | null> => {
  try {
    const [data, metadata] = await Promise.all([
      assessmentLevelStore.getItem<any[]>('data'),
      assessmentLevelStore.getItem<StoredDataMetadata>('metadata')
    ]);

    if (!data) return null;

    // If no metadata, assume it's old data and migrate it
    if (!metadata) {
      const migratedData = migrateToCurrentVersion(data, 1);
      await storeAssessmentLevelData(migratedData, new Date().getFullYear());
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
    
    await storeAssessmentLevelData(migratedData, metadata.year || new Date().getFullYear());
    return migratedData;
    
  } catch (error) {
    console.error('Error retrieving assessment level data:', error);
    return null;
  }
};

// Check if assessment level data is fresh (less than 24 hours old) AND matches current version AND current year
export const isAssessmentLevelDataFresh = async (): Promise<boolean> => {
  try {
    const metadata = await assessmentLevelStore.getItem<StoredDataMetadata>('metadata');

    if (!metadata) return false;
    
    const currentYear = new Date().getFullYear();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Check if data is outdated OR version mismatch OR wrong year
    const isRecent = (Date.now() - metadata.timestamp) < twentyFourHours;
    const isCurrentVersion = metadata.version === CURRENT_VERSION;
    const isCurrentSchema = metadata.schemaHash === CURRENT_SCHEMA_HASH;
    const isCurrentYear = metadata.year === currentYear;
    
    return isRecent && isCurrentVersion && isCurrentSchema && isCurrentYear;
  } catch (error) {
    console.error('Error checking assessment level data freshness:', error);
    return false;
  }
};

// Clear assessment level data from localForage
export const clearAssessmentLevelData = async (): Promise<void> => {
  try {
    await assessmentLevelStore.clear();
    console.log('Assessment level data cleared successfully');
  } catch (error) {
    console.error('Error clearing assessment level data:', error);
  }
};

// Get the current version
export const getCurrentAssessmentLevelVersion = (): number => {
  return CURRENT_VERSION;
};

// Get the stored version
export const getStoredAssessmentLevelVersion = async (): Promise<number | null> => {
  try {
    const metadata = await assessmentLevelStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.version || null;
  } catch (error) {
    console.error('Error retrieving assessment level version:', error);
    return null;
  }
};

// Get the year for which assessment level data was stored
export const getStoredAssessmentLevelYear = async (): Promise<number | null> => {
  try {
    const metadata = await assessmentLevelStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.year || null;
  } catch (error) {
    console.error('Error retrieving stored assessment level year:', error);
    return null;
  }
};

// Get assessment level data only if it's fresh
export const getFreshAssessmentLevelData = async (): Promise<AssessmentLevelData[] | null> => {
  // First check if we have old year data and clean it up
  await cleanupOldAssessmentLevelYearData();
  
  const isFresh = await isAssessmentLevelDataFresh();
  return isFresh ? await getAssessmentLevelData() : null;
};

// Check if assessment level data exists (regardless of freshness)
export const hasAssessmentLevelData = async (): Promise<boolean> => {
  try {
    const data = await assessmentLevelStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for assessment level data:', error);
    return false;
  }
};

// Filter assessment level data by kind_id
export const getAssessmentLevelsByKindId = async (kindId: number): Promise<AssessmentLevelData[]> => {
  const data = await getAssessmentLevelData();
  if (!data) return [];
  
  return data.filter(item => item.kind_id === kindId);
};

// Filter assessment level data by class_id
export const getAssessmentLevelsByClassId = async (classId: string): Promise<AssessmentLevelData[]> => {
  const data = await getAssessmentLevelData();
  if (!data) return [];
  
  return data.filter(item => item.class_id === classId);
};

// Get the current assessment level for a specific kind
export const getCurrentAssessmentLevelForKind = async (kindId: number): Promise<AssessmentLevelData[] | null> => {
  const data = await getAssessmentLevelData();
  if (!data) return null;
  
  const currentYear = new Date().getFullYear();
  return data.filter(item => item.kind_id === kindId && item.effective_year === currentYear);
};

// Get assessment levels for a specific kind and year
export const getAssessmentLevelsForKindAndYear = async (kindId: number, year: number): Promise<AssessmentLevelData[]> => {
  const data = await getAssessmentLevelData();
  if (!data) return [];
  
  return data.filter(item => item.kind_id === kindId && item.effective_year === year);
};

// Get all available years in the stored data
export const getAvailableAssessmentLevelYears = async (): Promise<number[]> => {
  const data = await getAssessmentLevelData();
  if (!data) return [];
  
  const years = new Set<number>();
  data.forEach(item => years.add(item.effective_year));
  
  return Array.from(years).sort((a, b) => b - a); // Return in descending order
};

// Get the most recent year available in the data
export const getMostRecentAssessmentLevelYear = async (): Promise<number | null> => {
  const years = await getAvailableAssessmentLevelYears();
  return years.length > 0 ? years[0] : null;
};

// Automatically clean up old year data
export const cleanupOldAssessmentLevelYearData = async (): Promise<void> => {
  try {
    const storedYear = await getStoredAssessmentLevelYear();
    const currentYear = new Date().getFullYear();
    
    if (storedYear !== null && storedYear !== currentYear) {
      console.log(`Cleaning up old assessment level data from ${storedYear} (current year: ${currentYear})`);
      await clearAssessmentLevelData();
    }
  } catch (error) {
    console.error('Error cleaning up old assessment level year data:', error);
  }
};

// Get the timestamp of when assessment level data was last stored
export const getAssessmentLevelTimestamp = async (): Promise<number | null> => {
  try {
    const metadata = await assessmentLevelStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.timestamp || null;
  } catch (error) {
    console.error('Error retrieving assessment level timestamp:', error);
    return null;
  }
};

// Get data size (useful for debugging)
export const getAssessmentLevelDataSize = async (): Promise<number> => {
  try {
    const data = await assessmentLevelStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting assessment level data size:', error);
    return 0;
  }
};

// Get assessment levels by multiple kind IDs
export const getAssessmentLevelsByKindIds = async (kindIds: number[]): Promise<AssessmentLevelData[]> => {
  const data = await getAssessmentLevelData();
  if (!data) return [];
  
  const kindIdSet = new Set(kindIds);
  return data.filter(item => kindIdSet.has(item.kind_id));
};

// Get assessment level statistics for a specific year
export const getAssessmentLevelStatisticsForYear = async (year: number): Promise<{
  min: number;
  max: number;
  average: number;
  count: number;
} | null> => {
  const data = await getAssessmentLevelData();
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

// Get assessment level count
export const getAssessmentLevelCount = async (): Promise<number> => {
  const data = await getAssessmentLevelData();
  return data ? data.length : 0;
};

// Get all unique kind IDs from assessment level data
export const getUniqueAssessmentLevelKindIds = async (): Promise<number[]> => {
  const data = await getAssessmentLevelData();
  if (!data) return [];
  
  const kindIds = new Set<number>();
  data.forEach(item => kindIds.add(item.kind_id));
  
  return Array.from(kindIds).sort((a, b) => a - b);
};

// Get all unique class IDs from assessment level data
export const getUniqueAssessmentLevelClassIds = async (): Promise<string[]> => {
  const data = await getAssessmentLevelData();
  if (!data) return [];
  
  const classIds = new Set<string>();
  data.forEach(item => classIds.add(item.class_id));
  
  return Array.from(classIds).sort();
};

// Search assessment levels with multiple criteria
export const searchAssessmentLevels = async (options: {
  kindId?: number;
  classId?: string;
  year?: number;
  minRate?: number;
  maxRate?: number;
  limit?: number;
}): Promise<AssessmentLevelData[]> => {
  const data = await getAssessmentLevelData();
  if (!data) return [];
  
  let results = data;
  
  if (options.kindId !== undefined) {
    results = results.filter(item => item.kind_id === options.kindId);
  }
  
  if (options.classId) {
    results = results.filter(item => item.class_id === options.classId);
  }
  
  if (options.year !== undefined) {
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

// Force migration of assessment level data
export const forceAssessmentLevelMigration = async (): Promise<AssessmentLevelData[] | null> => {
  try {
    const data = await assessmentLevelStore.getItem<any[]>('data');
    const metadata = await assessmentLevelStore.getItem<StoredDataMetadata>('metadata');
    
    if (!data) return null;
    
    const fromVersion = metadata?.version || 1;
    const migratedData = migrateToCurrentVersion(data, fromVersion);
    
    await storeAssessmentLevelData(migratedData, metadata?.year || new Date().getFullYear());
    return migratedData;
    
  } catch (error) {
    console.error('Error forcing migration:', error);
    return null;
  }
};

// Get current schema hash
export const getCurrentAssessmentLevelSchemaHash = (): string => {
  return CURRENT_SCHEMA_HASH;
};

// Get stored schema hash
export const getStoredAssessmentLevelSchemaHash = async (): Promise<string | null> => {
  try {
    const metadata = await assessmentLevelStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.schemaHash || null;
  } catch (error) {
    console.error('Error retrieving schema hash:', error);
    return null;
  }
};

// Get assessment level by ID
export const getAssessmentLevelById = async (assessmentLevelId: string): Promise<AssessmentLevelData | null> => {
  const data = await getAssessmentLevelData();
  if (!data) return null;
  
  return data.find(item => item.assessment_level_id === assessmentLevelId) || null;
};

// Get assessment levels by year
export const getAssessmentLevelsByYear = async (year: number): Promise<AssessmentLevelData[]> => {
  const data = await getAssessmentLevelData();
  if (!data) return [];
  
  return data.filter(item => item.effective_year === year);
};

// Get assessment levels within a specific value range
export const getAssessmentLevelsInRange = async (value: number, kindId?: number, year?: number): Promise<AssessmentLevelData[]> => {
  const data = await getAssessmentLevelData();
  if (!data) return [];
  
  let results = data;
  
  if (kindId !== undefined) {
    results = results.filter(item => item.kind_id === kindId);
  }
  
  if (year !== undefined) {
    results = results.filter(item => item.effective_year === year);
  }
  
  return results.filter(item => value >= item.range1 && value <= item.range2);
};

// Get the appropriate assessment level for a specific value
export const getAssessmentLevelForValue = async (value: number, kindId?: number, year?: number): Promise<AssessmentLevelData | null> => {
  const levels = await getAssessmentLevelsInRange(value, kindId, year);
  return levels.length > 0 ? levels[0] : null;
};