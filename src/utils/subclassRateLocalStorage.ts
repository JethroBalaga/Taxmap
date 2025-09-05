// utils/subclassRateLocalStorage.ts
import localForage from 'localforage';

export interface SubclassRateData {
  subclassrate_id: string;
  subclass_id: string;
  eff_year: number;
  rate: number;
}

const subclassRateStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'subclass_rate_data'
});

const CURRENT_VERSION = Date.now();

interface StoredDataMetadata {
  version: number;
  timestamp: number;
  schemaHash: string;
  year: number;
}

const generateSchemaHash = (): string => {
  const schema = {
    subclassrate_id: 'string',
    subclass_id: 'string',
    eff_year: 'number',
    rate: 'number'
  };
  return JSON.stringify(schema);
};

const CURRENT_SCHEMA_HASH = generateSchemaHash();

const migrateToCurrentVersion = (data: any[], fromVersion: number): SubclassRateData[] => {
  return data.map(item => {
    const migratedItem: Partial<SubclassRateData> = {};
    
    if (typeof item.subclassrate_id === 'string') {
      migratedItem.subclassrate_id = item.subclassrate_id;
    }
    
    if (typeof item.subclass_id === 'string') {
      migratedItem.subclass_id = item.subclass_id;
    }

    if (typeof item.eff_year === 'number') {
      migratedItem.eff_year = item.eff_year;
    }

    if (typeof item.rate === 'number') {
      migratedItem.rate = item.rate;
    }

    const validProperties = new Set(['subclassrate_id', 'subclass_id', 'eff_year', 'rate']);
    Object.keys(migratedItem).forEach(key => {
      if (!validProperties.has(key)) {
        delete migratedItem[key as keyof SubclassRateData];
      }
    });
    
    return migratedItem as SubclassRateData;
  });
};

const validateData = (data: any[]): data is SubclassRateData[] => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.subclassrate_id === 'string' &&
      typeof item.subclass_id === 'string' &&
      typeof item.eff_year === 'number' &&
      typeof item.rate === 'number'
    );
  });
};

export const storeSubclassRateData = async (data: SubclassRateData[], year: number): Promise<void> => {
  try {
    if (!validateData(data)) {
      console.error('Invalid data format attempted to be stored');
      return;
    }
    
    // Always clear any existing data from different years first
    const storedYear = await getStoredRateYear();
    if (storedYear !== null && storedYear !== year) {
      console.log(`Replacing ${storedYear} data with ${year} data`);
      await clearSubclassRateData();
    }
    
    await subclassRateStore.setItem('data', data);
    await subclassRateStore.setItem('metadata', {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      schemaHash: CURRENT_SCHEMA_HASH,
      year: year
    } as StoredDataMetadata);
    
  } catch (error) {
    console.error('Error storing subclass rate data:', error);
  }
};

export const getSubclassRateData = async (): Promise<SubclassRateData[] | null> => {
  try {
    const [data, metadata] = await Promise.all([
      subclassRateStore.getItem<any[]>('data'),
      subclassRateStore.getItem<StoredDataMetadata>('metadata')
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
    
    await storeSubclassRateData(migratedData, metadata.year);
    return migratedData;
    
  } catch (error) {
    console.error('Error retrieving subclass rate data:', error);
    return null;
  }
};

export const isSubclassRateDataFresh = async (): Promise<boolean> => {
  try {
    const metadata = await subclassRateStore.getItem<StoredDataMetadata>('metadata');

    if (!metadata) return false;
    
    const currentYear = new Date().getFullYear();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const isRecent = (Date.now() - metadata.timestamp) < twentyFourHours;
    const isCurrentVersion = metadata.version === CURRENT_VERSION;
    const isCurrentSchema = metadata.schemaHash === CURRENT_SCHEMA_HASH;
    const isCurrentYear = metadata.year === currentYear;
    
    return isRecent && isCurrentVersion && isCurrentSchema && isCurrentYear;
  } catch (error) {
    console.error('Error checking subclass rate data freshness:', error);
    return false;
  }
};

export const clearSubclassRateData = async (): Promise<void> => {
  try {
    await subclassRateStore.clear();
  } catch (error) {
    console.error('Error clearing subclass rate data:', error);
  }
};

export const getCurrentSubclassRateVersion = (): number => {
  return CURRENT_VERSION;
};

export const getStoredSubclassRateVersion = async (): Promise<number | null> => {
  try {
    const metadata = await subclassRateStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.version || null;
  } catch (error) {
    console.error('Error retrieving subclass rate version:', error);
    return null;
  }
};

export const getStoredRateYear = async (): Promise<number | null> => {
  try {
    const metadata = await subclassRateStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.year || null;
  } catch (error) {
    console.error('Error retrieving stored rate year:', error);
    return null;
  }
};

export const getFreshSubclassRateData = async (): Promise<SubclassRateData[] | null> => {
  await cleanupOldYearData();
  const isFresh = await isSubclassRateDataFresh();
  return isFresh ? await getSubclassRateData() : null;
};

export const hasSubclassRateData = async (): Promise<boolean> => {
  try {
    const data = await subclassRateStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for subclass rate data:', error);
    return false;
  }
};

export const getRatesBySubclassId = async (subclassId: string): Promise<SubclassRateData[]> => {
  const data = await getSubclassRateData();
  if (!data) return [];
  
  return data.filter(item => item.subclass_id === subclassId);
};

export const getCurrentRateForSubclass = async (subclassId: string): Promise<number | null> => {
  const data = await getSubclassRateData();
  if (!data) return null;
  
  const currentYear = new Date().getFullYear();
  const rateData = data.find(item => 
    item.subclass_id === subclassId && item.eff_year === currentYear
  );
  
  return rateData ? rateData.rate : null;
};

export const getRateForSubclassAndYear = async (subclassId: string, year: number): Promise<number | null> => {
  const data = await getSubclassRateData();
  if (!data) return null;
  
  const rateData = data.find(item => 
    item.subclass_id === subclassId && item.eff_year === year
  );
  
  return rateData ? rateData.rate : null;
};

export const getAvailableYears = async (): Promise<number[]> => {
  const data = await getSubclassRateData();
  if (!data) return [];
  
  const years = new Set<number>();
  data.forEach(item => years.add(item.eff_year));
  
  return Array.from(years).sort((a, b) => b - a);
};

export const getMostRecentYear = async (): Promise<number | null> => {
  const years = await getAvailableYears();
  return years.length > 0 ? years[0] : null;
};

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

export const getSubclassRateTimestamp = async (): Promise<number | null> => {
  try {
    const metadata = await subclassRateStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.timestamp || null;
  } catch (error) {
    console.error('Error retrieving subclass rate timestamp:', error);
    return null;
  }
};

export const getSubclassRateDataSize = async (): Promise<number> => {
  try {
    const data = await subclassRateStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting subclass rate data size:', error);
    return 0;
  }
};

export const getRatesBySubclassIds = async (subclassIds: string[]): Promise<SubclassRateData[]> => {
  const data = await getSubclassRateData();
  if (!data) return [];
  
  const subclassIdSet = new Set(subclassIds);
  return data.filter(item => subclassIdSet.has(item.subclass_id));
};

export const getAverageRateForYear = async (year: number): Promise<number | null> => {
  const data = await getSubclassRateData();
  if (!data || data.length === 0) return null;
  
  const yearData = data.filter(item => item.eff_year === year);
  if (yearData.length === 0) return null;
  
  const total = yearData.reduce((sum, item) => sum + item.rate, 0);
  return total / yearData.length;
};

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

export const getSubclassRateCount = async (): Promise<number> => {
  const data = await getSubclassRateData();
  return data ? data.length : 0;
};

export const forceMigration = async (): Promise<SubclassRateData[] | null> => {
  try {
    const data = await subclassRateStore.getItem<any[]>('data');
    const metadata = await subclassRateStore.getItem<StoredDataMetadata>('metadata');
    
    if (!data) return null;
    
    const fromVersion = metadata?.version || 1;
    const migratedData = migrateToCurrentVersion(data, fromVersion);
    
    await storeSubclassRateData(migratedData, metadata?.year || new Date().getFullYear());
    return migratedData;
    
  } catch (error) {
    console.error('Error forcing migration:', error);
    return null;
  }
};

export const getCurrentSchemaHash = (): string => {
  return CURRENT_SCHEMA_HASH;
};

export const getStoredSchemaHash = async (): Promise<string | null> => {
  try {
    const metadata = await subclassRateStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.schemaHash || null;
  } catch (error) {
    console.error('Error retrieving schema hash:', error);
    return null;
  }
};

// Additional subclass rate-specific utility functions
export const getRateById = async (subclassrateId: string): Promise<SubclassRateData | null> => {
  const data = await getSubclassRateData();
  if (!data) return null;
  
  return data.find(item => item.subclassrate_id === subclassrateId) || null;
};

export const getRatesByYear = async (year: number): Promise<SubclassRateData[]> => {
  const data = await getSubclassRateData();
  if (!data) return [];
  
  return data.filter(item => item.eff_year === year);
};

export const getSubclassIdsWithRates = async (): Promise<string[]> => {
  const data = await getSubclassRateData();
  if (!data) return [];
  
  const subclassIds = new Set<string>();
  data.forEach(item => subclassIds.add(item.subclass_id));
  
  return Array.from(subclassIds);
};

export const getRatesSortedByYear = async (ascending: boolean = true): Promise<SubclassRateData[]> => {
  const data = await getSubclassRateData();
  if (!data) return [];
  
  return data.sort((a, b) => {
    return ascending ? a.eff_year - b.eff_year : b.eff_year - a.eff_year;
  });
};

export const getRatesSortedByRate = async (ascending: boolean = true): Promise<SubclassRateData[]> => {
  const data = await getSubclassRateData();
  if (!data) return [];
  
  return data.sort((a, b) => {
    return ascending ? a.rate - b.rate : b.rate - a.rate;
  });
};

export const getHighestRateForYear = async (year: number): Promise<SubclassRateData | null> => {
  const data = await getRatesByYear(year);
  if (data.length === 0) return null;
  
  return data.reduce((highest, current) => 
    current.rate > highest.rate ? current : highest
  );
};

export const getLowestRateForYear = async (year: number): Promise<SubclassRateData | null> => {
  const data = await getRatesByYear(year);
  if (data.length === 0) return null;
  
  return data.reduce((lowest, current) => 
    current.rate < lowest.rate ? current : lowest
  );
};

export const getYearlyRateSummary = async (): Promise<Record<number, { count: number; average: number }>> => {
  const data = await getSubclassRateData();
  if (!data) return {};
  
  const summary: Record<number, { count: number; total: number }> = {};
  
  data.forEach(item => {
    if (!summary[item.eff_year]) {
      summary[item.eff_year] = { count: 0, total: 0 };
    }
    summary[item.eff_year].count++;
    summary[item.eff_year].total += item.rate;
  });
  
  const result: Record<number, { count: number; average: number }> = {};
  Object.entries(summary).forEach(([year, { count, total }]) => {
    result[parseInt(year)] = { count, average: total / count };
  });
  
  return result;
};