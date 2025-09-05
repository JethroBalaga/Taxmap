// utils/structureTypeLocalStorage.ts
import localForage from 'localforage';

// Interface for structure type data
export interface StructureTypeData {
  structure_code: string;
  kind_id: number;
  description: string;
  eff_date: string;
  // Add any new columns here when you add them to the database
  // example: new_column?: string;
}

// Configure localForage instance for structure type data
const structureTypeStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'structure_type_data'
});

// Use timestamp for versioning
const CURRENT_VERSION = Date.now();

interface StoredDataMetadata {
  version: number;
  timestamp: number;
  schemaHash: string;
}

const generateSchemaHash = (): string => {
  const schema = {
    structure_code: 'string',
    kind_id: 'number',
    description: 'string',
    eff_date: 'string'
  };
  return JSON.stringify(schema);
};

const CURRENT_SCHEMA_HASH = generateSchemaHash();

const migrateToCurrentVersion = (data: any[], fromVersion: number): StructureTypeData[] => {
  return data.map(item => {
    const migratedItem: Partial<StructureTypeData> = {};
    
    if (typeof item.structure_code === 'string') {
      migratedItem.structure_code = item.structure_code;
    }
    
    if (typeof item.kind_id === 'number') {
      migratedItem.kind_id = item.kind_id;
    }

    if (typeof item.description === 'string') {
      migratedItem.description = item.description;
    }

    if (typeof item.eff_date === 'string') {
      migratedItem.eff_date = item.eff_date;
    }

    // Remove any unknown properties
    const validProperties = new Set(['structure_code', 'kind_id', 'description', 'eff_date']);
    Object.keys(migratedItem).forEach(key => {
      if (!validProperties.has(key)) {
        delete migratedItem[key as keyof StructureTypeData];
      }
    });
    
    return migratedItem as StructureTypeData;
  });
};

const validateData = (data: any[]): data is StructureTypeData[] => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.structure_code === 'string' &&
      typeof item.kind_id === 'number' &&
      typeof item.description === 'string' &&
      typeof item.eff_date === 'string'
    );
  });
};

// Store structure type data with localForage
export const storeStructureTypeData = async (data: StructureTypeData[]): Promise<void> => {
  try {
    if (!validateData(data)) {
      console.error('Invalid data format attempted to be stored');
      return;
    }
    
    await structureTypeStore.setItem('data', data);
    await structureTypeStore.setItem('metadata', {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      schemaHash: CURRENT_SCHEMA_HASH
    } as StoredDataMetadata);
    
    console.log('Structure type data stored successfully');
  } catch (error) {
    console.error('Error storing structure type data:', error);
  }
};

// Retrieve structure type data from localForage with migration support
export const getStructureTypeData = async (): Promise<StructureTypeData[] | null> => {
  try {
    const [data, metadata] = await Promise.all([
      structureTypeStore.getItem<any[]>('data'),
      structureTypeStore.getItem<StoredDataMetadata>('metadata')
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
    
    await storeStructureTypeData(migratedData);
    return migratedData;
    
  } catch (error) {
    console.error('Error retrieving structure type data:', error);
    return null;
  }
};

// Check if structure type data is fresh (less than 24 hours old) AND matches current version
export const isStructureTypeDataFresh = async (): Promise<boolean> => {
  try {
    const metadata = await structureTypeStore.getItem<StoredDataMetadata>('metadata');

    if (!metadata) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    // Check if data is outdated OR version mismatch
    const isRecent = (Date.now() - metadata.timestamp) < twentyFourHours;
    const isCurrentVersion = metadata.version === CURRENT_VERSION;
    const isCurrentSchema = metadata.schemaHash === CURRENT_SCHEMA_HASH;
    
    return isRecent && isCurrentVersion && isCurrentSchema;
  } catch (error) {
    console.error('Error checking structure type data freshness:', error);
    return false;
  }
};

// Clear structure type data from localForage
export const clearStructureTypeData = async (): Promise<void> => {
  try {
    await structureTypeStore.clear();
    console.log('Structure type data cleared successfully');
  } catch (error) {
    console.error('Error clearing structure type data:', error);
  }
};

// Get the current version
export const getCurrentStructureTypeVersion = (): number => {
  return CURRENT_VERSION;
};

// Get the stored version
export const getStoredStructureTypeVersion = async (): Promise<number | null> => {
  try {
    const metadata = await structureTypeStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.version || null;
  } catch (error) {
    console.error('Error retrieving structure type version:', error);
    return null;
  }
};

// Get structure type data only if it's fresh
export const getFreshStructureTypeData = async (): Promise<StructureTypeData[] | null> => {
  const isFresh = await isStructureTypeDataFresh();
  return isFresh ? await getStructureTypeData() : null;
};

// Get the timestamp of when structure type data was last stored
export const getStructureTypeTimestamp = async (): Promise<number | null> => {
  try {
    const metadata = await structureTypeStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.timestamp || null;
  } catch (error) {
    console.error('Error retrieving structure type timestamp:', error);
    return null;
  }
};

// Check if structure type data exists (regardless of freshness)
export const hasStructureTypeData = async (): Promise<boolean> => {
  try {
    const data = await structureTypeStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for structure type data:', error);
    return false;
  }
};

// Get data size (useful for debugging)
export const getStructureTypeDataSize = async (): Promise<number> => {
  try {
    const data = await structureTypeStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting structure type data size:', error);
    return 0;
  }
};

// Filter structure type data by kind_id
export const getStructureTypesByKindId = async (kindId: number): Promise<StructureTypeData[]> => {
  const data = await getStructureTypeData();
  if (!data) return [];
  
  return data.filter(item => item.kind_id === kindId);
};

// Get structure type by structure_code
export const getStructureTypeByCode = async (structureCode: string): Promise<StructureTypeData | null> => {
  const data = await getStructureTypeData();
  if (!data) return null;
  
  return data.find(item => item.structure_code === structureCode) || null;
};

// Search structure types with multiple criteria
export const searchStructureTypes = async (options: {
  kindId?: number;
  description?: string;
  limit?: number;
}): Promise<StructureTypeData[]> => {
  const data = await getStructureTypeData();
  if (!data) return [];
  
  let results = data;
  
  if (options.kindId !== undefined) {
    results = results.filter(item => item.kind_id === options.kindId);
  }
  
  if (options.description) {
    const searchTerm = options.description.toLowerCase();
    results = results.filter(item => 
      item.description.toLowerCase().includes(searchTerm)
    );
  }
  
  if (options.limit) {
    results = results.slice(0, options.limit);
  }
  
  return results;
};

// Get all unique kind IDs from structure type data
export const getUniqueStructureTypeKindIds = async (): Promise<number[]> => {
  const data = await getStructureTypeData();
  if (!data) return [];
  
  const kindIds = new Set<number>();
  data.forEach(item => kindIds.add(item.kind_id));
  
  return Array.from(kindIds).sort((a, b) => a - b);
};

// Get structure type count
export const getStructureTypeCount = async (): Promise<number> => {
  const data = await getStructureTypeData();
  return data ? data.length : 0;
};

// Force migration of structure type data
export const forceStructureTypeMigration = async (): Promise<StructureTypeData[] | null> => {
  try {
    const data = await structureTypeStore.getItem<any[]>('data');
    const metadata = await structureTypeStore.getItem<StoredDataMetadata>('metadata');
    
    if (!data) return null;
    
    const fromVersion = metadata?.version || 1;
    const migratedData = migrateToCurrentVersion(data, fromVersion);
    
    await storeStructureTypeData(migratedData);
    return migratedData;
    
  } catch (error) {
    console.error('Error forcing migration:', error);
    return null;
  }
};

// Get current schema hash
export const getCurrentStructureTypeSchemaHash = (): string => {
  return CURRENT_SCHEMA_HASH;
};

// Get stored schema hash
export const getStoredStructureTypeSchemaHash = async (): Promise<string | null> => {
  try {
    const metadata = await structureTypeStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.schemaHash || null;
  } catch (error) {
    console.error('Error retrieving schema hash:', error);
    return null;
  }
};

// Get structure types by multiple kind IDs
export const getStructureTypesByKindIds = async (kindIds: number[]): Promise<StructureTypeData[]> => {
  const data = await getStructureTypeData();
  if (!data) return [];
  
  const kindIdSet = new Set(kindIds);
  return data.filter(item => kindIdSet.has(item.kind_id));
};

// Get structure types with description containing search term
export const searchStructureTypesByDescription = async (searchTerm: string): Promise<StructureTypeData[]> => {
  const data = await getStructureTypeData();
  if (!data) return [];
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return data.filter(item => 
    item.description.toLowerCase().includes(lowerSearchTerm)
  );
};

// Get structure types sorted by description
export const getStructureTypesSortedByDescription = async (ascending: boolean = true): Promise<StructureTypeData[]> => {
  const data = await getStructureTypeData();
  if (!data) return [];
  
  return data.sort((a, b) => {
    const comparison = a.description.localeCompare(b.description);
    return ascending ? comparison : -comparison;
  });
};

// Get structure types sorted by kind_id
export const getStructureTypesSortedByKindId = async (ascending: boolean = true): Promise<StructureTypeData[]> => {
  const data = await getStructureTypeData();
  if (!data) return [];
  
  return data.sort((a, b) => {
    return ascending ? a.kind_id - b.kind_id : b.kind_id - a.kind_id;
  });
};

// Get structure types by effective date range
export const getStructureTypesByDateRange = async (startDate: string, endDate: string): Promise<StructureTypeData[]> => {
  const data = await getStructureTypeData();
  if (!data) return [];
  
  return data.filter(item => {
    const effDate = item.eff_date;
    return effDate >= startDate && effDate <= endDate;
  });
};

// Get the most recent effective date
export const getMostRecentEffectiveDate = async (): Promise<string | null> => {
  const data = await getStructureTypeData();
  if (!data || data.length === 0) return null;
  
  return data.reduce((latest, item) => {
    return item.eff_date > latest ? item.eff_date : latest;
  }, data[0].eff_date);
};

// Get structure types for a specific effective date
export const getStructureTypesByEffectiveDate = async (effectiveDate: string): Promise<StructureTypeData[]> => {
  const data = await getStructureTypeData();
  if (!data) return [];
  
  return data.filter(item => item.eff_date === effectiveDate);
};