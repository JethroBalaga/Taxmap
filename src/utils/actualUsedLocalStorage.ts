// utils/actualUsedLocalStorage.ts
import localForage from 'localforage';

export interface ActualUsedData {
  actual_used_id: string;
  description: string;
  class_id: string;
}

const actualUsedStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'actual_used_data'
});

const CURRENT_VERSION = Date.now();

interface StoredDataMetadata {
  version: number;
  timestamp: number;
  schemaHash: string;
}

const generateSchemaHash = (): string => {
  const schema = {
    actual_used_id: 'string',
    description: 'string',
    class_id: 'string'
  };
  return JSON.stringify(schema);
};

const CURRENT_SCHEMA_HASH = generateSchemaHash();

const migrateToCurrentVersion = (data: any[], fromVersion: number): ActualUsedData[] => {
  return data.map(item => {
    const migratedItem: Partial<ActualUsedData> = {};
    
    if (typeof item.actual_used_id === 'string') {
      migratedItem.actual_used_id = item.actual_used_id;
    }
    
    if (typeof item.description === 'string') {
      migratedItem.description = item.description;
    }

    if (typeof item.class_id === 'string') {
      migratedItem.class_id = item.class_id;
    }

    const validProperties = new Set(['actual_used_id', 'description', 'class_id']);
    Object.keys(migratedItem).forEach(key => {
      if (!validProperties.has(key)) {
        delete migratedItem[key as keyof ActualUsedData];
      }
    });
    
    return migratedItem as ActualUsedData;
  });
};

const validateData = (data: any[]): data is ActualUsedData[] => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.actual_used_id === 'string' &&
      typeof item.description === 'string' &&
      typeof item.class_id === 'string'
    );
  });
};

export const storeActualUsedData = async (data: ActualUsedData[]): Promise<void> => {
  try {
    if (!validateData(data)) {
      console.error('Invalid data format attempted to be stored');
      return;
    }
    
    await actualUsedStore.setItem('data', data);
    await actualUsedStore.setItem('metadata', {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      schemaHash: CURRENT_SCHEMA_HASH
    } as StoredDataMetadata);
    
  } catch (error) {
    console.error('Error storing actual used data:', error);
  }
};

export const getActualUsedData = async (): Promise<ActualUsedData[] | null> => {
  try {
    const [data, metadata] = await Promise.all([
      actualUsedStore.getItem<any[]>('data'),
      actualUsedStore.getItem<StoredDataMetadata>('metadata')
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
    
    await storeActualUsedData(migratedData);
    return migratedData;
    
  } catch (error) {
    console.error('Error retrieving actual used data:', error);
    return null;
  }
};

export const isActualUsedDataFresh = async (): Promise<boolean> => {
  try {
    const metadata = await actualUsedStore.getItem<StoredDataMetadata>('metadata');

    if (!metadata) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const isRecent = (Date.now() - metadata.timestamp) < twentyFourHours;
    const isCurrentVersion = metadata.version === CURRENT_VERSION;
    const isCurrentSchema = metadata.schemaHash === CURRENT_SCHEMA_HASH;
    
    return isRecent && isCurrentVersion && isCurrentSchema;
  } catch (error) {
    console.error('Error checking actual used data freshness:', error);
    return false;
  }
};

export const clearActualUsedData = async (): Promise<void> => {
  try {
    await actualUsedStore.clear();
  } catch (error) {
    console.error('Error clearing actual used data:', error);
  }
};

export const getCurrentActualUsedVersion = (): number => {
  return CURRENT_VERSION;
};

export const getStoredActualUsedVersion = async (): Promise<number | null> => {
  try {
    const metadata = await actualUsedStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.version || null;
  } catch (error) {
    console.error('Error retrieving actual used version:', error);
    return null;
  }
};

export const getFreshActualUsedData = async (): Promise<ActualUsedData[] | null> => {
  const isFresh = await isActualUsedDataFresh();
  return isFresh ? await getActualUsedData() : null;
};

export const hasActualUsedData = async (): Promise<boolean> => {
  try {
    const data = await actualUsedStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for actual used data:', error);
    return false;
  }
};

export const getActualUsedByClassId = async (classId: string): Promise<ActualUsedData[]> => {
  const data = await getActualUsedData();
  if (!data) return [];
  
  return data.filter(item => item.class_id === classId);
};

export const getActualUsedById = async (actualUsedId: string): Promise<ActualUsedData | null> => {
  const data = await getActualUsedData();
  if (!data) return null;
  
  return data.find(item => item.actual_used_id === actualUsedId) || null;
};

export const getUniqueClassIds = async (): Promise<string[]> => {
  const data = await getActualUsedData();
  if (!data) return [];
  
  const classIds = new Set<string>();
  data.forEach(item => classIds.add(item.class_id));
  
  return Array.from(classIds);
};

export const getActualUsedTimestamp = async (): Promise<number | null> => {
  try {
    const metadata = await actualUsedStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.timestamp || null;
  } catch (error) {
    console.error('Error retrieving actual used timestamp:', error);
    return null;
  }
};

export const getActualUsedDataSize = async (): Promise<number> => {
  try {
    const data = await actualUsedStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting actual used data size:', error);
    return 0;
  }
};

export const getAllActualUsedDescriptions = async (): Promise<string[]> => {
  const data = await getActualUsedData();
  if (!data) return [];
  
  return data.map(item => item.description).filter(Boolean);
};

export const searchActualUsedByDescription = async (searchTerm: string): Promise<ActualUsedData[]> => {
  const data = await getActualUsedData();
  if (!data) return [];
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return data.filter(item => 
    item.description.toLowerCase().includes(lowerSearchTerm)
  );
};

export const getActualUsedByClassIds = async (classIds: string[]): Promise<ActualUsedData[]> => {
  const data = await getActualUsedData();
  if (!data) return [];
  
  const classIdSet = new Set(classIds);
  return data.filter(item => classIdSet.has(item.class_id));
};

export const forceMigration = async (): Promise<ActualUsedData[] | null> => {
  try {
    const data = await actualUsedStore.getItem<any[]>('data');
    const metadata = await actualUsedStore.getItem<StoredDataMetadata>('metadata');
    
    if (!data) return null;
    
    const fromVersion = metadata?.version || 1;
    const migratedData = migrateToCurrentVersion(data, fromVersion);
    
    await storeActualUsedData(migratedData);
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
    const metadata = await actualUsedStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.schemaHash || null;
  } catch (error) {
    console.error('Error retrieving schema hash:', error);
    return null;
  }
};