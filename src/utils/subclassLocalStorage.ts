// utils/subclassLocalStorage.ts
import localForage from 'localforage';

export interface SubclassData {
  subclass_id: string;
  barangay_id: string | null;
  subclass: string;
  class_id: string;
}

const subclassStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'subclass_data'
});

const CURRENT_VERSION = Date.now();

interface StoredDataMetadata {
  version: number;
  timestamp: number;
  schemaHash: string;
}

const generateSchemaHash = (): string => {
  const schema = {
    subclass_id: 'string',
    barangay_id: 'string | null',
    subclass: 'string',
    class_id: 'string'
  };
  return JSON.stringify(schema);
};

const CURRENT_SCHEMA_HASH = generateSchemaHash();

const migrateToCurrentVersion = (data: any[], fromVersion: number): SubclassData[] => {
  return data.map(item => {
    const migratedItem: Partial<SubclassData> = {};
    
    if (typeof item.subclass_id === 'string') {
      migratedItem.subclass_id = item.subclass_id;
    }
    
    if (typeof item.barangay_id === 'string' || item.barangay_id === null) {
      migratedItem.barangay_id = item.barangay_id;
    }

    if (typeof item.subclass === 'string') {
      migratedItem.subclass = item.subclass;
    }

    if (typeof item.class_id === 'string') {
      migratedItem.class_id = item.class_id;
    }

    const validProperties = new Set(['subclass_id', 'barangay_id', 'subclass', 'class_id']);
    Object.keys(migratedItem).forEach(key => {
      if (!validProperties.has(key)) {
        delete migratedItem[key as keyof SubclassData];
      }
    });
    
    return migratedItem as SubclassData;
  });
};

const validateData = (data: any[]): data is SubclassData[] => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.subclass_id === 'string' &&
      (typeof item.barangay_id === 'string' || item.barangay_id === null) &&
      typeof item.subclass === 'string' &&
      typeof item.class_id === 'string'
    );
  });
};

export const storeSubclassData = async (data: SubclassData[]): Promise<void> => {
  try {
    if (!validateData(data)) {
      console.error('Invalid data format attempted to be stored');
      return;
    }
    
    await subclassStore.setItem('data', data);
    await subclassStore.setItem('metadata', {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      schemaHash: CURRENT_SCHEMA_HASH
    } as StoredDataMetadata);
    
  } catch (error) {
    console.error('Error storing subclass data:', error);
  }
};

export const getSubclassData = async (): Promise<SubclassData[] | null> => {
  try {
    const [data, metadata] = await Promise.all([
      subclassStore.getItem<any[]>('data'),
      subclassStore.getItem<StoredDataMetadata>('metadata')
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
    
    await storeSubclassData(migratedData);
    return migratedData;
    
  } catch (error) {
    console.error('Error retrieving subclass data:', error);
    return null;
  }
};

export const isSubclassDataFresh = async (): Promise<boolean> => {
  try {
    const metadata = await subclassStore.getItem<StoredDataMetadata>('metadata');

    if (!metadata) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const isRecent = (Date.now() - metadata.timestamp) < twentyFourHours;
    const isCurrentVersion = metadata.version === CURRENT_VERSION;
    const isCurrentSchema = metadata.schemaHash === CURRENT_SCHEMA_HASH;
    
    return isRecent && isCurrentVersion && isCurrentSchema;
  } catch (error) {
    console.error('Error checking subclass data freshness:', error);
    return false;
  }
};

export const clearSubclassData = async (): Promise<void> => {
  try {
    await subclassStore.clear();
  } catch (error) {
    console.error('Error clearing subclass data:', error);
  }
};

export const getCurrentSubclassVersion = (): number => {
  return CURRENT_VERSION;
};

export const getStoredSubclassVersion = async (): Promise<number | null> => {
  try {
    const metadata = await subclassStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.version || null;
  } catch (error) {
    console.error('Error retrieving subclass version:', error);
    return null;
  }
};

export const getFreshSubclassData = async (): Promise<SubclassData[] | null> => {
  const isFresh = await isSubclassDataFresh();
  return isFresh ? await getSubclassData() : null;
};

export const getSubclassTimestamp = async (): Promise<number | null> => {
  try {
    const metadata = await subclassStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.timestamp || null;
  } catch (error) {
    console.error('Error retrieving subclass timestamp:', error);
    return null;
  }
};

export const hasSubclassData = async (): Promise<boolean> => {
  try {
    const data = await subclassStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for subclass data:', error);
    return false;
  }
};

export const getSubclassesByClassId = async (classId: string): Promise<SubclassData[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  return data.filter(item => item.class_id === classId);
};

export const getSubclassesByBarangayId = async (barangayId: string): Promise<SubclassData[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  return data.filter(item => item.barangay_id === barangayId);
};

export const getSubclassById = async (subclassId: string): Promise<SubclassData | null> => {
  const data = await getSubclassData();
  if (!data) return null;
  
  return data.find(item => item.subclass_id === subclassId) || null;
};

export const getUniqueClassIds = async (): Promise<string[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  const classIds = new Set<string>();
  data.forEach(item => classIds.add(item.class_id));
  
  return Array.from(classIds);
};

export const getUniqueBarangayIds = async (): Promise<string[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  const barangayIds = new Set<string>();
  data.forEach(item => {
    if (item.barangay_id) {
      barangayIds.add(item.barangay_id);
    }
  });
  
  return Array.from(barangayIds);
};

export const getSubclassesWithNoBarangay = async (): Promise<SubclassData[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  return data.filter(item => item.barangay_id === null);
};

export const searchSubclassesByName = async (name: string): Promise<SubclassData[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  const lowerName = name.toLowerCase();
  return data.filter(item => 
    item.subclass.toLowerCase().includes(lowerName)
  );
};

export const getSubclassesByClassIds = async (classIds: string[]): Promise<SubclassData[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  const classIdSet = new Set(classIds);
  return data.filter(item => classIdSet.has(item.class_id));
};

export const getSubclassesByBarangayIds = async (barangayIds: string[]): Promise<SubclassData[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  const barangayIdSet = new Set(barangayIds);
  return data.filter(item => item.barangay_id && barangayIdSet.has(item.barangay_id));
};

export const getSubclassCountByClass = async (): Promise<Record<string, number>> => {
  const data = await getSubclassData();
  if (!data) return {};
  
  const countMap: Record<string, number> = {};
  data.forEach(item => {
    countMap[item.class_id] = (countMap[item.class_id] || 0) + 1;
  });
  
  return countMap;
};

export const getSubclassCountByBarangay = async (): Promise<Record<string, number>> => {
  const data = await getSubclassData();
  if (!data) return {};
  
  const countMap: Record<string, number> = {};
  data.forEach(item => {
    if (item.barangay_id) {
      countMap[item.barangay_id] = (countMap[item.barangay_id] || 0) + 1;
    }
  });
  
  return countMap;
};

export const getSubclassDataSize = async (): Promise<number> => {
  try {
    const data = await subclassStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting subclass data size:', error);
    return 0;
  }
};

export const getSubclassCount = async (): Promise<number> => {
  const data = await getSubclassData();
  return data ? data.length : 0;
};

export const forceMigration = async (): Promise<SubclassData[] | null> => {
  try {
    const data = await subclassStore.getItem<any[]>('data');
    const metadata = await subclassStore.getItem<StoredDataMetadata>('metadata');
    
    if (!data) return null;
    
    const fromVersion = metadata?.version || 1;
    const migratedData = migrateToCurrentVersion(data, fromVersion);
    
    await storeSubclassData(migratedData);
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
    const metadata = await subclassStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.schemaHash || null;
  } catch (error) {
    console.error('Error retrieving schema hash:', error);
    return null;
  }
};

// Additional subclass-specific utility functions
export const getSubclassDescription = async (subclassId: string): Promise<string | null> => {
  const subclass = await getSubclassById(subclassId);
  return subclass?.subclass || null;
};

export const getSubclassesByClassIdAndBarangayId = async (classId: string, barangayId: string): Promise<SubclassData[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  return data.filter(item => item.class_id === classId && item.barangay_id === barangayId);
};

export const getSubclassesByClassIdWithoutBarangay = async (classId: string): Promise<SubclassData[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  return data.filter(item => item.class_id === classId && item.barangay_id === null);
};

export const getSubclassesSortedByName = async (ascending: boolean = true): Promise<SubclassData[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  return data.sort((a, b) => {
    const comparison = a.subclass.localeCompare(b.subclass);
    return ascending ? comparison : -comparison;
  });
};

export const getSubclassesSortedById = async (ascending: boolean = true): Promise<SubclassData[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  return data.sort((a, b) => {
    const comparison = a.subclass_id.localeCompare(b.subclass_id);
    return ascending ? comparison : -comparison;
  });
};

export const getSubclassNames = async (): Promise<string[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  return data.map(item => item.subclass);
};

export const getSubclassIds = async (): Promise<string[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  return data.map(item => item.subclass_id);
};

export const searchSubclasses = async (searchTerm: string): Promise<SubclassData[]> => {
  const data = await getSubclassData();
  if (!data) return [];
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return data.filter(item => 
    item.subclass_id.toLowerCase().includes(lowerSearchTerm) ||
    item.subclass.toLowerCase().includes(lowerSearchTerm) ||
    (item.barangay_id && item.barangay_id.toLowerCase().includes(lowerSearchTerm)) ||
    item.class_id.toLowerCase().includes(lowerSearchTerm)
  );
};