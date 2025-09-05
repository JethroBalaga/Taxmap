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
  // Add any new columns here when you add them to the database
  // example: new_column?: string;
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

const migrateToCurrentVersion = (data: any[], fromVersion: number): AssessmentLevelData[] => {
  return data.map(item => {
    const migratedItem: Partial<AssessmentLevelData> = {};
    
    if (typeof item.assessment_level_id === 'string') {
      migratedItem.assessment_level_id = item.assessment_level_id;
    }
    
    if (typeof item.kind_id === 'number') {
      migratedItem.kind_id = item.kind_id;
    }

    if (typeof item.effective_year === 'number') {
      migratedItem.effective_year = item.effective_year;
    }

    if (typeof item.class_id === 'string') {
      migratedItem.class_id = item.class_id;
    }

    if (typeof item.range1 === 'number') {
      migratedItem.range1 = item.range1;
    }

    if (typeof item.range2 === 'number') {
      migratedItem.range2 = item.range2;
    }

    if (typeof item.rate_percent === 'string') {
      migratedItem.rate_percent = item.rate_percent;
    }

    // Remove any unknown properties
    const validProperties = new Set([
      'assessment_level_id', 'kind_id', 'effective_year', 'class_id', 
      'range1', 'range2', 'rate_percent'
    ]);
    
    Object.keys(migratedItem).forEach(key => {
      if (!validProperties.has(key)) {
        delete migratedItem[key as keyof AssessmentLevelData];
      }
    });
    
    return migratedItem as AssessmentLevelData;
  });
};

const validateData = (data: any[]): data is AssessmentLevelData[] => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.assessment_level_id === 'string' &&
      typeof item.kind_id === 'number' &&
      typeof item.effective_year === 'number' &&
      typeof item.class_id === 'string' &&
      typeof item.range1 === 'number' &&
      typeof item.range2 === 'number' &&
      typeof item.rate_percent === 'string'
    );
  });
};

// Store assessment level data with localForage - only keeps the most recent year's data
export const storeAssessmentLevelData = async (data: AssessmentLevelData[], year: number): Promise<void> => {
  try {
    if (!validateData(data)) {
      console.error('Invalid data format attempted to be stored');
      return;
    }
    
    // Always clear any existing data from different years first
    const storedMetadata = await assessmentLevelStore.getItem<StoredDataMetadata>('metadata');
    if (storedMetadata?.year !== undefined && storedMetadata.year !== year) {
      console.log(`Replacing ${storedMetadata.year} data with ${year} data`);
      await clearAssessmentLevelData();
    }
    
    await assessmentLevelStore.setItem('data', data);
    await assessmentLevelStore.setItem('metadata', {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      schemaHash: CURRENT_SCHEMA_HASH,
      year: year
    } as StoredDataMetadata);
    
    console.log('Assessment level data stored successfully for year:', year);
  } catch (error) {
    console.error('Error storing assessment level data:', error);
  }
};

// Retrieve assessment level data from localForage with migration support
export const getAssessmentLevelData = async (): Promise<AssessmentLevelData[] | null> => {
  try {
    const [data, metadata] = await Promise.all([
      assessmentLevelStore.getItem<any[]>('data'),
      assessmentLevelStore.getItem<StoredDataMetadata>('metadata')
    ]);

    if (!data || !metadata) return null;

    if (metadata.version === CURRENT_VERSION && validateData(data)) {
      return data;
    }

    let migratedData = migrateToCurrentVersion(data, metadata.version);
    
    if (!validateData(migratedData)) {
      console.error('Migrated data failed validation');
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