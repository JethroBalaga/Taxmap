// utils/DeclarantLocalStorage.ts
import localForage from 'localforage';

export interface DeclarantData {
  declarant_id: number;
  firstname: string;
  lastname: string;
  // Add any new columns here when you add them to the database
  // example: new_column?: string;
}

const declarantStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'declarant_data'
});

const CURRENT_VERSION = Date.now();

interface StoredDataMetadata {
  version: number;
  timestamp: number;
  schemaHash: string;
}

const generateSchemaHash = (): string => {
  const schema = {
    declarant_id: 'number',
    firstname: 'string',
    lastname: 'string'
  };
  return JSON.stringify(schema);
};

const CURRENT_SCHEMA_HASH = generateSchemaHash();

const migrateToCurrentVersion = (data: any[], fromVersion: number): DeclarantData[] => {
  return data.map(item => {
    const migratedItem: Partial<DeclarantData> = {};
    
    if (typeof item.declarant_id === 'number') {
      migratedItem.declarant_id = item.declarant_id;
    }
    
    if (typeof item.firstname === 'string') {
      migratedItem.firstname = item.firstname;
    }

    if (typeof item.lastname === 'string') {
      migratedItem.lastname = item.lastname;
    }

    const validProperties = new Set(['declarant_id', 'firstname', 'lastname']);
    Object.keys(migratedItem).forEach(key => {
      if (!validProperties.has(key)) {
        delete migratedItem[key as keyof DeclarantData];
      }
    });
    
    return migratedItem as DeclarantData;
  });
};

const validateData = (data: any[]): data is DeclarantData[] => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.declarant_id === 'number' &&
      typeof item.firstname === 'string' &&
      typeof item.lastname === 'string'
    );
  });
};

export const storeDeclarantData = async (data: DeclarantData[]): Promise<void> => {
  try {
    if (!validateData(data)) {
      console.error('Invalid data format attempted to be stored');
      return;
    }
    
    await declarantStore.setItem('data', data);
    await declarantStore.setItem('metadata', {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      schemaHash: CURRENT_SCHEMA_HASH
    } as StoredDataMetadata);
    
  } catch (error) {
    console.error('Error storing declarant data:', error);
  }
};

export const getDeclarantData = async (): Promise<DeclarantData[] | null> => {
  try {
    const [data, metadata] = await Promise.all([
      declarantStore.getItem<any[]>('data'),
      declarantStore.getItem<StoredDataMetadata>('metadata')
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
    
    await storeDeclarantData(migratedData);
    return migratedData;
    
  } catch (error) {
    console.error('Error retrieving declarant data:', error);
    return null;
  }
};

export const isDeclarantDataFresh = async (): Promise<boolean> => {
  try {
    const metadata = await declarantStore.getItem<StoredDataMetadata>('metadata');

    if (!metadata) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const isRecent = (Date.now() - metadata.timestamp) < twentyFourHours;
    const isCurrentVersion = metadata.version === CURRENT_VERSION;
    const isCurrentSchema = metadata.schemaHash === CURRENT_SCHEMA_HASH;
    
    return isRecent && isCurrentVersion && isCurrentSchema;
  } catch (error) {
    console.error('Error checking declarant data freshness:', error);
    return false;
  }
};

export const clearDeclarantData = async (): Promise<void> => {
  try {
    await declarantStore.clear();
  } catch (error) {
    console.error('Error clearing declarant data:', error);
  }
};

export const getCurrentDeclarantVersion = (): number => {
  return CURRENT_VERSION;
};

export const getStoredDeclarantVersion = async (): Promise<number | null> => {
  try {
    const metadata = await declarantStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.version || null;
  } catch (error) {
    console.error('Error retrieving declarant version:', error);
    return null;
  }
};

export const getFreshDeclarantData = async (): Promise<DeclarantData[] | null> => {
  const isFresh = await isDeclarantDataFresh();
  return isFresh ? await getDeclarantData() : null;
};

export const hasDeclarantData = async (): Promise<boolean> => {
  try {
    const data = await declarantStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for declarant data:', error);
    return false;
  }
};

export const getDeclarantById = async (declarantId: number): Promise<DeclarantData | null> => {
  const data = await getDeclarantData();
  if (!data) return null;
  
  return data.find(item => item.declarant_id === declarantId) || null;
};

export const getDeclarantTimestamp = async (): Promise<number | null> => {
  try {
    const metadata = await declarantStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.timestamp || null;
  } catch (error) {
    console.error('Error retrieving declarant timestamp:', error);
    return null;
  }
};

export const getDeclarantDataSize = async (): Promise<number> => {
  try {
    const data = await declarantStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting declarant data size:', error);
    return 0;
  }
};

export const getAllDeclarantNames = async (): Promise<string[]> => {
  const data = await getDeclarantData();
  if (!data) return [];
  
  return data.map(item => `${item.firstname} ${item.lastname}`).filter(Boolean);
};

export const searchDeclarantByName = async (searchTerm: string): Promise<DeclarantData[]> => {
  const data = await getDeclarantData();
  if (!data) return [];
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return data.filter(item => 
    item.firstname.toLowerCase().includes(lowerSearchTerm) ||
    item.lastname.toLowerCase().includes(lowerSearchTerm)
  );
};

export const forceMigration = async (): Promise<DeclarantData[] | null> => {
  try {
    const data = await declarantStore.getItem<any[]>('data');
    const metadata = await declarantStore.getItem<StoredDataMetadata>('metadata');
    
    if (!data) return null;
    
    const fromVersion = metadata?.version || 1;
    const migratedData = migrateToCurrentVersion(data, fromVersion);
    
    await storeDeclarantData(migratedData);
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
    const metadata = await declarantStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.schemaHash || null;
  } catch (error) {
    console.error('Error retrieving schema hash:', error);
    return null;
  }
};

// Additional declarant-specific utility functions
export const getDeclarantFullName = async (declarantId: number): Promise<string | null> => {
  const declarant = await getDeclarantById(declarantId);
  if (!declarant) return null;
  
  return `${declarant.firstname} ${declarant.lastname}`;
};

export const getDeclarantIds = async (): Promise<number[]> => {
  const data = await getDeclarantData();
  if (!data) return [];
  
  return data.map(item => item.declarant_id);
};