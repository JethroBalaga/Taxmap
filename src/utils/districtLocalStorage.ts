// utils/districtLocalStorage.ts
import localForage from 'localforage';

export interface DistrictData {
  district_id: number;
  district_name: string;
  founded: string; // Stored as string since it's a date
}

const districtStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'district_data'
});

const CURRENT_VERSION = Date.now();

interface StoredDataMetadata {
  version: number;
  timestamp: number;
  schemaHash: string;
}

const generateSchemaHash = (): string => {
  const schema = {
    district_id: 'number',
    district_name: 'string',
    founded: 'string'
  };
  return JSON.stringify(schema);
};

const CURRENT_SCHEMA_HASH = generateSchemaHash();

const migrateToCurrentVersion = (data: any[], fromVersion: number): DistrictData[] => {
  return data.map(item => {
    const migratedItem: Partial<DistrictData> = {};
    
    if (typeof item.district_id === 'number') {
      migratedItem.district_id = item.district_id;
    }
    
    if (typeof item.district_name === 'string') {
      migratedItem.district_name = item.district_name;
    }

    if (typeof item.founded === 'string') {
      migratedItem.founded = item.founded;
    }

    const validProperties = new Set(['district_id', 'district_name', 'founded']);
    Object.keys(migratedItem).forEach(key => {
      if (!validProperties.has(key)) {
        delete migratedItem[key as keyof DistrictData];
      }
    });
    
    return migratedItem as DistrictData;
  });
};

const validateData = (data: any[]): data is DistrictData[] => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.district_id === 'number' &&
      typeof item.district_name === 'string' &&
      typeof item.founded === 'string'
    );
  });
};

export const storeDistrictData = async (data: DistrictData[]): Promise<void> => {
  try {
    if (!validateData(data)) {
      console.error('Invalid data format attempted to be stored');
      return;
    }
    
    await districtStore.setItem('data', data);
    await districtStore.setItem('metadata', {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      schemaHash: CURRENT_SCHEMA_HASH
    } as StoredDataMetadata);
    
  } catch (error) {
    console.error('Error storing district data:', error);
  }
};

export const getDistrictData = async (): Promise<DistrictData[] | null> => {
  try {
    const [data, metadata] = await Promise.all([
      districtStore.getItem<any[]>('data'),
      districtStore.getItem<StoredDataMetadata>('metadata')
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
    
    await storeDistrictData(migratedData);
    return migratedData;
    
  } catch (error) {
    console.error('Error retrieving district data:', error);
    return null;
  }
};

export const isDistrictDataFresh = async (): Promise<boolean> => {
  try {
    const metadata = await districtStore.getItem<StoredDataMetadata>('metadata');

    if (!metadata) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const isRecent = (Date.now() - metadata.timestamp) < twentyFourHours;
    const isCurrentVersion = metadata.version === CURRENT_VERSION;
    const isCurrentSchema = metadata.schemaHash === CURRENT_SCHEMA_HASH;
    
    return isRecent && isCurrentVersion && isCurrentSchema;
  } catch (error) {
    console.error('Error checking district data freshness:', error);
    return false;
  }
};

export const clearDistrictData = async (): Promise<void> => {
  try {
    await districtStore.clear();
  } catch (error) {
    console.error('Error clearing district data:', error);
  }
};

export const getCurrentDistrictVersion = (): number => {
  return CURRENT_VERSION;
};

export const getStoredDistrictVersion = async (): Promise<number | null> => {
  try {
    const metadata = await districtStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.version || null;
  } catch (error) {
    console.error('Error retrieving district version:', error);
    return null;
  }
};

export const getFreshDistrictData = async (): Promise<DistrictData[] | null> => {
  const isFresh = await isDistrictDataFresh();
  return isFresh ? await getDistrictData() : null;
};

export const hasDistrictData = async (): Promise<boolean> => {
  try {
    const data = await districtStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for district data:', error);
    return false;
  }
};

export const getDistrictById = async (districtId: number): Promise<DistrictData | null> => {
  const data = await getDistrictData();
  if (!data) return null;
  
  return data.find(item => item.district_id === districtId) || null;
};

export const getDistrictsByName = async (name: string): Promise<DistrictData[]> => {
  const data = await getDistrictData();
  if (!data) return [];
  
  const lowerName = name.toLowerCase();
  return data.filter(item => 
    item.district_name.toLowerCase().includes(lowerName)
  );
};

export const getAllDistrictNames = async (): Promise<string[]> => {
  const data = await getDistrictData();
  if (!data) return [];
  
  return data.map(item => item.district_name);
};

export const getDistrictsSortedByName = async (ascending: boolean = true): Promise<DistrictData[]> => {
  const data = await getDistrictData();
  if (!data) return [];
  
  return data.sort((a, b) => {
    const comparison = a.district_name.localeCompare(b.district_name);
    return ascending ? comparison : -comparison;
  });
};

export const getDistrictsSortedByFoundedDate = async (ascending: boolean = true): Promise<DistrictData[]> => {
  const data = await getDistrictData();
  if (!data) return [];
  
  return data.sort((a, b) => {
    const dateA = new Date(a.founded).getTime();
    const dateB = new Date(b.founded).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

export const getDistrictTimestamp = async (): Promise<number | null> => {
  try {
    const metadata = await districtStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.timestamp || null;
  } catch (error) {
    console.error('Error retrieving district timestamp:', error);
    return null;
  }
};

export const getDistrictDataSize = async (): Promise<number> => {
  try {
    const data = await districtStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting district data size:', error);
    return 0;
  }
};

export const getDistrictsFoundedAfter = async (date: string): Promise<DistrictData[]> => {
  const data = await getDistrictData();
  if (!data) return [];
  
  const targetDate = new Date(date).getTime();
  return data.filter(item => new Date(item.founded).getTime() > targetDate);
};

export const getDistrictsFoundedBefore = async (date: string): Promise<DistrictData[]> => {
  const data = await getDistrictData();
  if (!data) return [];
  
  const targetDate = new Date(date).getTime();
  return data.filter(item => new Date(item.founded).getTime() < targetDate);
};

export const getOldestDistrict = async (): Promise<DistrictData | null> => {
  const data = await getDistrictData();
  if (!data || data.length === 0) return null;
  
  return data.reduce((oldest, current) => {
    const oldestDate = new Date(oldest.founded).getTime();
    const currentDate = new Date(current.founded).getTime();
    return currentDate < oldestDate ? current : oldest;
  });
};

export const getNewestDistrict = async (): Promise<DistrictData | null> => {
  const data = await getDistrictData();
  if (!data || data.length === 0) return null;
  
  return data.reduce((newest, current) => {
    const newestDate = new Date(newest.founded).getTime();
    const currentDate = new Date(current.founded).getTime();
    return currentDate > newestDate ? current : newest;
  });
};

export const getDistrictsByIds = async (districtIds: number[]): Promise<DistrictData[]> => {
  const data = await getDistrictData();
  if (!data) return [];
  
  const districtIdSet = new Set(districtIds);
  return data.filter(item => districtIdSet.has(item.district_id));
};

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

export const getDistrictCount = async (): Promise<number> => {
  const data = await getDistrictData();
  return data ? data.length : 0;
};

export const forceMigration = async (): Promise<DistrictData[] | null> => {
  try {
    const data = await districtStore.getItem<any[]>('data');
    const metadata = await districtStore.getItem<StoredDataMetadata>('metadata');
    
    if (!data) return null;
    
    const fromVersion = metadata?.version || 1;
    const migratedData = migrateToCurrentVersion(data, fromVersion);
    
    await storeDistrictData(migratedData);
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
    const metadata = await districtStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.schemaHash || null;
  } catch (error) {
    console.error('Error retrieving schema hash:', error);
    return null;
  }
};

// Additional district-specific utility functions
export const getDistrictNameById = async (districtId: number): Promise<string | null> => {
  const district = await getDistrictById(districtId);
  return district?.district_name || null;
};

export const getDistrictsByFoundedYear = async (year: number): Promise<DistrictData[]> => {
  const data = await getDistrictData();
  if (!data) return [];
  
  return data.filter(item => {
    const foundedYear = new Date(item.founded).getFullYear();
    return foundedYear === year;
  });
};

export const getUniqueFoundedYears = async (): Promise<number[]> => {
  const data = await getDistrictData();
  if (!data) return [];
  
  const years = new Set<number>();
  data.forEach(item => {
    const year = new Date(item.founded).getFullYear();
    years.add(year);
  });
  
  return Array.from(years).sort();
};