// utils/kindLocalStorage.ts
import localForage from 'localforage';

export interface KindData {
  kind_id: number;
  description: string;
}

const kindStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'kind_data'
});

const CURRENT_VERSION = Date.now();

interface StoredDataMetadata {
  version: number;
  timestamp: number;
  schemaHash: string;
}

const generateSchemaHash = (): string => {
  const schema = {
    kind_id: 'number',
    description: 'string'
  };
  return JSON.stringify(schema);
};

const CURRENT_SCHEMA_HASH = generateSchemaHash();

const migrateToCurrentVersion = (data: any[], fromVersion: number): KindData[] => {
  return data.map(item => {
    const migratedItem: Partial<KindData> = {};
    
    if (typeof item.kind_id === 'number') {
      migratedItem.kind_id = item.kind_id;
    }
    
    if (typeof item.description === 'string') {
      migratedItem.description = item.description;
    }

    const validProperties = new Set(['kind_id', 'description']);
    Object.keys(migratedItem).forEach(key => {
      if (!validProperties.has(key)) {
        delete migratedItem[key as keyof KindData];
      }
    });
    
    return migratedItem as KindData;
  });
};

const validateData = (data: any[]): data is KindData[] => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.kind_id === 'number' &&
      typeof item.description === 'string'
    );
  });
};

export const storeKindData = async (data: KindData[]): Promise<void> => {
  try {
    if (!validateData(data)) {
      console.error('Invalid data format attempted to be stored');
      return;
    }
    
    await kindStore.setItem('data', data);
    await kindStore.setItem('metadata', {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      schemaHash: CURRENT_SCHEMA_HASH
    } as StoredDataMetadata);
    
  } catch (error) {
    console.error('Error storing kind data:', error);
  }
};

export const getKindData = async (): Promise<KindData[] | null> => {
  try {
    const [data, metadata] = await Promise.all([
      kindStore.getItem<any[]>('data'),
      kindStore.getItem<StoredDataMetadata>('metadata')
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
    
    await storeKindData(migratedData);
    return migratedData;
    
  } catch (error) {
    console.error('Error retrieving kind data:', error);
    return null;
  }
};

export const isKindDataFresh = async (): Promise<boolean> => {
  try {
    const metadata = await kindStore.getItem<StoredDataMetadata>('metadata');

    if (!metadata) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const isRecent = (Date.now() - metadata.timestamp) < twentyFourHours;
    const isCurrentVersion = metadata.version === CURRENT_VERSION;
    const isCurrentSchema = metadata.schemaHash === CURRENT_SCHEMA_HASH;
    
    return isRecent && isCurrentVersion && isCurrentSchema;
  } catch (error) {
    console.error('Error checking kind data freshness:', error);
    return false;
  }
};

export const clearKindData = async (): Promise<void> => {
  try {
    await kindStore.clear();
  } catch (error) {
    console.error('Error clearing kind data:', error);
  }
};

export const getCurrentKindVersion = (): number => {
  return CURRENT_VERSION;
};

export const getStoredKindVersion = async (): Promise<number | null> => {
  try {
    const metadata = await kindStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.version || null;
  } catch (error) {
    console.error('Error retrieving kind version:', error);
    return null;
  }
};

export const getFreshKindData = async (): Promise<KindData[] | null> => {
  const isFresh = await isKindDataFresh();
  return isFresh ? await getKindData() : null;
};

export const getKindTimestamp = async (): Promise<number | null> => {
  try {
    const metadata = await kindStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.timestamp || null;
  } catch (error) {
    console.error('Error retrieving kind timestamp:', error);
    return null;
  }
};

export const hasKindData = async (): Promise<boolean> => {
  try {
    const data = await kindStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for kind data:', error);
    return false;
  }
};

export const getKindDataSize = async (): Promise<number> => {
  try {
    const data = await kindStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting kind data size:', error);
    return 0;
  }
};

export const forceMigration = async (): Promise<KindData[] | null> => {
  try {
    const data = await kindStore.getItem<any[]>('data');
    const metadata = await kindStore.getItem<StoredDataMetadata>('metadata');
    
    if (!data) return null;
    
    const fromVersion = metadata?.version || 1;
    const migratedData = migrateToCurrentVersion(data, fromVersion);
    
    await storeKindData(migratedData);
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
    const metadata = await kindStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.schemaHash || null;
  } catch (error) {
    console.error('Error retrieving schema hash:', error);
    return null;
  }
};

// Additional kind-specific utility functions
export const getKindById = async (kindId: number): Promise<KindData | null> => {
  const data = await getKindData();
  if (!data) return null;
  
  return data.find(item => item.kind_id === kindId) || null;
};

export const getKindDescription = async (kindId: number): Promise<string | null> => {
  const kind = await getKindById(kindId);
  return kind?.description || null;
};

export const searchKindsByDescription = async (searchTerm: string): Promise<KindData[]> => {
  const data = await getKindData();
  if (!data) return [];
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return data.filter(item => 
    item.description.toLowerCase().includes(lowerSearchTerm)
  );
};

export const getAllKindDescriptions = async (): Promise<string[]> => {
  const data = await getKindData();
  if (!data) return [];
  
  return data.map(item => item.description);
};

export const getKindIds = async (): Promise<number[]> => {
  const data = await getKindData();
  if (!data) return [];
  
  return data.map(item => item.kind_id);
};

export const getKindsByIds = async (kindIds: number[]): Promise<KindData[]> => {
  const data = await getKindData();
  if (!data) return [];
  
  const kindIdSet = new Set(kindIds);
  return data.filter(item => kindIdSet.has(item.kind_id));
};

export const getKindCount = async (): Promise<number> => {
  const data = await getKindData();
  return data ? data.length : 0;
};

export const getKindsSortedById = async (ascending: boolean = true): Promise<KindData[]> => {
  const data = await getKindData();
  if (!data) return [];
  
  return data.sort((a, b) => {
    return ascending ? a.kind_id - b.kind_id : b.kind_id - a.kind_id;
  });
};

export const getKindsSortedByDescription = async (ascending: boolean = true): Promise<KindData[]> => {
  const data = await getKindData();
  if (!data) return [];
  
  return data.sort((a, b) => {
    const comparison = a.description.localeCompare(b.description);
    return ascending ? comparison : -comparison;
  });
};