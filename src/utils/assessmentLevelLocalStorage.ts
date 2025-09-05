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

// CURRENT VERSION - INCREMENT THIS WHEN YOU ADD NEW COLUMNS
const CURRENT_VERSION = 3; // Use numbers for easier migration comparisons

// Migration functions
const migrations: { [version: number]: (data: any[]) => AssessmentLevelData[] } = {
  // Migration from version 1 to 2
  2: (data: any[]) => {
    console.log('Migrating assessment level data to version 2');
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

// Store assessment level data with localForage - only keeps the most recent year's data
export const storeAssessmentLevelData = async (data: AssessmentLevelData[], year: number): Promise<void> => {
  try {
    // Always clear any existing data from different years first
    const storedYear = await getStoredAssessmentLevelYear();
    if (storedYear !== null && storedYear !== year) {
      console.log(`Replacing ${storedYear} data with ${year} data`);
      await clearAssessmentLevelData(); // Clear completely since it's a different year
    }
    
    await assessmentLevelStore.setItem('data', data);
    await assessmentLevelStore.setItem('timestamp', Date.now());
    await assessmentLevelStore.setItem('version', CURRENT_VERSION);
    await assessmentLevelStore.setItem('year', year);
    console.log('Assessment level data stored successfully for year:', year, '(version:', CURRENT_VERSION, ')');
  } catch (error) {
    console.error('Error storing assessment level data:', error);
  }
};

// Retrieve assessment level data from localForage with migration support
export const getAssessmentLevelData = async (): Promise<AssessmentLevelData[] | null> => {
  try {
    const [data, storedVersion, timestamp, storedYear] = await Promise.all([
      assessmentLevelStore.getItem<AssessmentLevelData[]>('data'),
      assessmentLevelStore.getItem<number>('version'),
      assessmentLevelStore.getItem<number>('timestamp'),
      assessmentLevelStore.getItem<number>('year')
    ]);

    if (!data) return null;

    // Apply migrations if needed
    if (storedVersion && storedVersion < CURRENT_VERSION) {
      console.log(`Migrating assessment level data from v${storedVersion} to v${CURRENT_VERSION}`);
      let migratedData = data;
      
      for (let version = storedVersion + 1; version <= CURRENT_VERSION; version++) {
        if (migrations[version]) {
          migratedData = migrations[version](migratedData);
        }
      }
      
      // Store the migrated data
      await storeAssessmentLevelData(migratedData, storedYear || new Date().getFullYear());
      return migratedData;
    }

    return data;
  } catch (error) {
    console.error('Error retrieving assessment level data:', error);
    return null;
  }
};

// Check if assessment level data is fresh (less than 24 hours old) AND matches current version AND current year
export const isAssessmentLevelDataFresh = async (): Promise<boolean> => {
  try {
    const [timestamp, storedVersion, storedYear] = await Promise.all([
      assessmentLevelStore.getItem<number>('timestamp'),
      assessmentLevelStore.getItem<number>('version'),
      assessmentLevelStore.getItem<number>('year')
    ]);

    if (!timestamp || !storedVersion || !storedYear) return false;
    
    const currentYear = new Date().getFullYear();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Check if data is outdated OR version mismatch OR wrong year
    const isRecent = (Date.now() - timestamp) < twentyFourHours;
    const isCurrentVersion = storedVersion === CURRENT_VERSION;
    const isCurrentYear = storedYear === currentYear;
    
    if (isRecent && (!isCurrentVersion || !isCurrentYear)) {
      console.log('Assessment level data is recent but outdated version or year. Migration/cleanup will handle this.');
      return false;
    }
    
    return isRecent && isCurrentVersion && isCurrentYear;
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
    return await assessmentLevelStore.getItem<number>('version');
  } catch (error) {
    console.error('Error retrieving assessment level version:', error);
    return null;
  }
};

// Get the year for which assessment level data was stored
export const getStoredAssessmentLevelYear = async (): Promise<number | null> => {
  try {
    return await assessmentLevelStore.getItem<number>('year');
  } catch (error) {
    console.error('Error retrieving stored assessment level year:', error);
    return null;
  }
};

// Get assessment level data only if it's fresh
export const getFreshAssessmentLevelData = async (): Promise<AssessmentLevelData[] | null> => {
  // First check if we have old year data and clean it up
  await cleanupOldAssessmentLevelYearData();
  
  const data = await getAssessmentLevelData();
  const isFresh = await isAssessmentLevelDataFresh();
  
  return isFresh ? data : null;
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
    return await assessmentLevelStore.getItem<number>('timestamp');
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