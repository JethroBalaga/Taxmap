// utils/landAdjustmentLocalStorage.ts
import localForage from 'localforage';

export interface LandAdjustmentData {
  adjustment_id: string;
  description: string;
  adjustment_factor: string;
  adjustment_type: string;
  created_at?: string;
}

const landAdjustmentStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'land_adjustment_data'
});

const CURRENT_VERSION = Date.now();

interface StoredDataMetadata {
  version: number;
  timestamp: number;
  schemaHash: string;
}

const generateSchemaHash = (): string => {
  const schema = {
    adjustment_id: 'string',
    description: 'string',
    adjustment_factor: 'string',
    adjustment_type: 'string',
    created_at: 'string'
  };
  return JSON.stringify(schema);
};

const CURRENT_SCHEMA_HASH = generateSchemaHash();

const migrateToCurrentVersion = (data: any[], fromVersion: number): LandAdjustmentData[] => {
  return data.map(item => {
    const migratedItem: Partial<LandAdjustmentData> = {};
    
    if (typeof item.adjustment_id === 'string') {
      migratedItem.adjustment_id = item.adjustment_id;
    }
    
    if (typeof item.description === 'string') {
      migratedItem.description = item.description;
    }

    if (typeof item.adjustment_factor === 'string') {
      migratedItem.adjustment_factor = item.adjustment_factor;
    }

    if (typeof item.adjustment_type === 'string') {
      migratedItem.adjustment_type = item.adjustment_type;
    }

    if (typeof item.created_at === 'string') {
      migratedItem.created_at = item.created_at;
    }

    const validProperties = new Set(['adjustment_id', 'description', 'adjustment_factor', 'adjustment_type', 'created_at']);
    Object.keys(migratedItem).forEach(key => {
      if (!validProperties.has(key)) {
        delete migratedItem[key as keyof LandAdjustmentData];
      }
    });
    
    return migratedItem as LandAdjustmentData;
  });
};

const validateData = (data: any[]): data is LandAdjustmentData[] => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.adjustment_id === 'string' &&
      typeof item.description === 'string' &&
      typeof item.adjustment_factor === 'string' &&
      typeof item.adjustment_type === 'string'
    );
  });
};

export const storeLandAdjustmentData = async (data: LandAdjustmentData[]): Promise<void> => {
  try {
    if (!validateData(data)) {
      console.error('Invalid data format attempted to be stored');
      return;
    }
    
    await landAdjustmentStore.setItem('data', data);
    await landAdjustmentStore.setItem('metadata', {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      schemaHash: CURRENT_SCHEMA_HASH
    } as StoredDataMetadata);
    
  } catch (error) {
    console.error('Error storing land adjustment data:', error);
  }
};

export const getLandAdjustmentData = async (): Promise<LandAdjustmentData[] | null> => {
  try {
    const [data, metadata] = await Promise.all([
      landAdjustmentStore.getItem<any[]>('data'),
      landAdjustmentStore.getItem<StoredDataMetadata>('metadata')
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
    
    await storeLandAdjustmentData(migratedData);
    return migratedData;
    
  } catch (error) {
    console.error('Error retrieving land adjustment data:', error);
    return null;
  }
};

export const isLandAdjustmentDataFresh = async (): Promise<boolean> => {
  try {
    const metadata = await landAdjustmentStore.getItem<StoredDataMetadata>('metadata');

    if (!metadata) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const isRecent = (Date.now() - metadata.timestamp) < twentyFourHours;
    const isCurrentVersion = metadata.version === CURRENT_VERSION;
    const isCurrentSchema = metadata.schemaHash === CURRENT_SCHEMA_HASH;
    
    return isRecent && isCurrentVersion && isCurrentSchema;
  } catch (error) {
    console.error('Error checking land adjustment data freshness:', error);
    return false;
  }
};

export const clearLandAdjustmentData = async (): Promise<void> => {
  try {
    await landAdjustmentStore.clear();
  } catch (error) {
    console.error('Error clearing land adjustment data:', error);
  }
};

export const getCurrentLandAdjustmentVersion = (): number => {
  return CURRENT_VERSION;
};

export const getStoredLandAdjustmentVersion = async (): Promise<number | null> => {
  try {
    const metadata = await landAdjustmentStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.version || null;
  } catch (error) {
    console.error('Error retrieving land adjustment version:', error);
    return null;
  }
};

export const getFreshLandAdjustmentData = async (): Promise<LandAdjustmentData[] | null> => {
  const isFresh = await isLandAdjustmentDataFresh();
  return isFresh ? await getLandAdjustmentData() : null;
};

export const hasLandAdjustmentData = async (): Promise<boolean> => {
  try {
    const data = await landAdjustmentStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for land adjustment data:', error);
    return false;
  }
};

export const getLandAdjustmentById = async (adjustmentId: string): Promise<LandAdjustmentData | null> => {
  const data = await getLandAdjustmentData();
  if (!data) return null;
  
  return data.find(item => item.adjustment_id === adjustmentId) || null;
};

export const getLandAdjustmentByType = async (adjustmentType: string): Promise<LandAdjustmentData[]> => {
  const data = await getLandAdjustmentData();
  if (!data) return [];
  
  return data.filter(item => item.adjustment_type === adjustmentType);
};

export const getLandAdjustmentTimestamp = async (): Promise<number | null> => {
  try {
    const metadata = await landAdjustmentStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.timestamp || null;
  } catch (error) {
    console.error('Error retrieving land adjustment timestamp:', error);
    return null;
  }
};

export const getLandAdjustmentDataSize = async (): Promise<number> => {
  try {
    const data = await landAdjustmentStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting land adjustment data size:', error);
    return 0;
  }
};

export const getAllLandAdjustmentTypes = async (): Promise<string[]> => {
  const data = await getLandAdjustmentData();
  if (!data) return [];
  
  const types = new Set<string>();
  data.forEach(item => types.add(item.adjustment_type));
  
  return Array.from(types);
};

export const searchLandAdjustmentByDescription = async (searchTerm: string): Promise<LandAdjustmentData[]> => {
  const data = await getLandAdjustmentData();
  if (!data) return [];
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return data.filter(item => 
    item.description.toLowerCase().includes(lowerSearchTerm)
  );
};

export const forceMigration = async (): Promise<LandAdjustmentData[] | null> => {
  try {
    const data = await landAdjustmentStore.getItem<any[]>('data');
    const metadata = await landAdjustmentStore.getItem<StoredDataMetadata>('metadata');
    
    if (!data) return null;
    
    const fromVersion = metadata?.version || 1;
    const migratedData = migrateToCurrentVersion(data, fromVersion);
    
    await storeLandAdjustmentData(migratedData);
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
    const metadata = await landAdjustmentStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.schemaHash || null;
  } catch (error) {
    console.error('Error retrieving schema hash:', error);
    return null;
  }
};