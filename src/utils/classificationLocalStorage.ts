// utils/classificationLocalStorage.ts
import localForage from 'localforage';

export interface ClassificationData {
  class_id: string;
  classification: string;
}

const classificationStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'classification_data'
});

const CURRENT_VERSION = Date.now();

interface StoredDataMetadata {
  version: number;
  timestamp: number;
  schemaHash: string;
}

const generateSchemaHash = (): string => {
  const schema = {
    class_id: 'string',
    classification: 'string'
  };
  return JSON.stringify(schema);
};

const CURRENT_SCHEMA_HASH = generateSchemaHash();

const migrateToCurrentVersion = (data: any[], fromVersion: number): ClassificationData[] => {
  return data.map(item => {
    const migratedItem: Partial<ClassificationData> = {};
    
    if (typeof item.class_id === 'string') {
      migratedItem.class_id = item.class_id;
    }
    
    if (typeof item.classification === 'string') {
      migratedItem.classification = item.classification;
    }

    const validProperties = new Set(['class_id', 'classification']);
    Object.keys(migratedItem).forEach(key => {
      if (!validProperties.has(key)) {
        delete migratedItem[key as keyof ClassificationData];
      }
    });
    
    return migratedItem as ClassificationData;
  });
};

const validateData = (data: any[]): data is ClassificationData[] => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.class_id === 'string' &&
      typeof item.classification === 'string'
    );
  });
};

export const storeClassificationData = async (data: ClassificationData[]): Promise<void> => {
  try {
    if (!validateData(data)) {
      console.error('Invalid data format attempted to be stored');
      return;
    }
    
    await classificationStore.setItem('data', data);
    await classificationStore.setItem('metadata', {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      schemaHash: CURRENT_SCHEMA_HASH
    } as StoredDataMetadata);
    
  } catch (error) {
    console.error('Error storing classification data:', error);
  }
};

export const getClassificationData = async (): Promise<ClassificationData[] | null> => {
  try {
    const [data, metadata] = await Promise.all([
      classificationStore.getItem<any[]>('data'),
      classificationStore.getItem<StoredDataMetadata>('metadata')
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
    
    await storeClassificationData(migratedData);
    return migratedData;
    
  } catch (error) {
    console.error('Error retrieving classification data:', error);
    return null;
  }
};

export const isClassificationDataFresh = async (): Promise<boolean> => {
  try {
    const metadata = await classificationStore.getItem<StoredDataMetadata>('metadata');

    if (!metadata) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const isRecent = (Date.now() - metadata.timestamp) < twentyFourHours;
    const isCurrentVersion = metadata.version === CURRENT_VERSION;
    const isCurrentSchema = metadata.schemaHash === CURRENT_SCHEMA_HASH;
    
    return isRecent && isCurrentVersion && isCurrentSchema;
  } catch (error) {
    console.error('Error checking classification data freshness:', error);
    return false;
  }
};

export const clearClassificationData = async (): Promise<void> => {
  try {
    await classificationStore.clear();
  } catch (error) {
    console.error('Error clearing classification data:', error);
  }
};

export const getCurrentClassificationVersion = (): number => {
  return CURRENT_VERSION;
};

export const getStoredClassificationVersion = async (): Promise<number | null> => {
  try {
    const metadata = await classificationStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.version || null;
  } catch (error) {
    console.error('Error retrieving classification version:', error);
    return null;
  }
};

export const getFreshClassificationData = async (): Promise<ClassificationData[] | null> => {
  const isFresh = await isClassificationDataFresh();
  return isFresh ? await getClassificationData() : null;
};

export const getClassificationTimestamp = async (): Promise<number | null> => {
  try {
    const metadata = await classificationStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.timestamp || null;
  } catch (error) {
    console.error('Error retrieving classification timestamp:', error);
    return null;
  }
};

export const hasClassificationData = async (): Promise<boolean> => {
  try {
    const data = await classificationStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for classification data:', error);
    return false;
  }
};

export const getClassificationDataSize = async (): Promise<number> => {
  try {
    const data = await classificationStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting data size:', error);
    return 0;
  }
};

export const forceMigration = async (): Promise<ClassificationData[] | null> => {
  try {
    const data = await classificationStore.getItem<any[]>('data');
    const metadata = await classificationStore.getItem<StoredDataMetadata>('metadata');
    
    if (!data) return null;
    
    const fromVersion = metadata?.version || 1;
    const migratedData = migrateToCurrentVersion(data, fromVersion);
    
    await storeClassificationData(migratedData);
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
    const metadata = await classificationStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.schemaHash || null;
  } catch (error) {
    console.error('Error retrieving schema hash:', error);
    return null;
  }
};