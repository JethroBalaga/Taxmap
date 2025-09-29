// utils/equipmentLocalStorage.ts
import localForage from 'localforage';

export interface EquipmentData {
  equipment_id: string;
  machine_type: string;
  created_at: string;
}

const equipmentStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'equipment_data'
});

const CURRENT_VERSION = Date.now();

interface StoredDataMetadata {
  version: number;
  timestamp: number;
  schemaHash: string;
}

const generateSchemaHash = (): string => {
  const schema = {
    equipment_id: 'string',
    machine_type: 'string',
    created_at: 'string'
  };
  return JSON.stringify(schema);
};

const CURRENT_SCHEMA_HASH = generateSchemaHash();

const migrateToCurrentVersion = (data: any[], fromVersion: number): EquipmentData[] => {
  return data.map(item => {
    const migratedItem: Partial<EquipmentData> = {};
    
    if (typeof item.equipment_id === 'string') {
      migratedItem.equipment_id = item.equipment_id;
    }
    
    if (typeof item.machine_type === 'string') {
      migratedItem.machine_type = item.machine_type;
    }

    if (typeof item.created_at === 'string') {
      migratedItem.created_at = item.created_at;
    }

    const validProperties = new Set(['equipment_id', 'machine_type', 'created_at']);
    Object.keys(migratedItem).forEach(key => {
      if (!validProperties.has(key)) {
        delete migratedItem[key as keyof EquipmentData];
      }
    });
    
    return migratedItem as EquipmentData;
  });
};

const validateData = (data: any[]): data is EquipmentData[] => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.equipment_id === 'string' &&
      typeof item.machine_type === 'string' &&
      typeof item.created_at === 'string'
    );
  });
};

export const storeEquipmentData = async (data: EquipmentData[]): Promise<void> => {
  try {
    if (!validateData(data)) {
      console.error('Invalid equipment data format attempted to be stored');
      return;
    }
    
    await equipmentStore.setItem('data', data);
    await equipmentStore.setItem('metadata', {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      schemaHash: CURRENT_SCHEMA_HASH
    } as StoredDataMetadata);
    
  } catch (error) {
    console.error('Error storing equipment data:', error);
  }
};

export const getEquipmentData = async (): Promise<EquipmentData[] | null> => {
  try {
    const [data, metadata] = await Promise.all([
      equipmentStore.getItem<any[]>('data'),
      equipmentStore.getItem<StoredDataMetadata>('metadata')
    ]);

    if (!data || !metadata) return null;

    if (metadata.version === CURRENT_VERSION && validateData(data)) {
      return data;
    }

    let migratedData = migrateToCurrentVersion(data, metadata.version);
    
    if (!validateData(migratedData)) {
      console.error('Migrated equipment data failed validation');
      return null;
    }
    
    await storeEquipmentData(migratedData);
    return migratedData;
    
  } catch (error) {
    console.error('Error retrieving equipment data:', error);
    return null;
  }
};

export const isEquipmentDataFresh = async (): Promise<boolean> => {
  try {
    const metadata = await equipmentStore.getItem<StoredDataMetadata>('metadata');

    if (!metadata) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const isRecent = (Date.now() - metadata.timestamp) < twentyFourHours;
    const isCurrentVersion = metadata.version === CURRENT_VERSION;
    const isCurrentSchema = metadata.schemaHash === CURRENT_SCHEMA_HASH;
    
    return isRecent && isCurrentVersion && isCurrentSchema;
  } catch (error) {
    console.error('Error checking equipment data freshness:', error);
    return false;
  }
};

export const clearEquipmentData = async (): Promise<void> => {
  try {
    await equipmentStore.clear();
  } catch (error) {
    console.error('Error clearing equipment data:', error);
  }
};

export const getCurrentEquipmentVersion = (): number => {
  return CURRENT_VERSION;
};

export const getStoredEquipmentVersion = async (): Promise<number | null> => {
  try {
    const metadata = await equipmentStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.version || null;
  } catch (error) {
    console.error('Error retrieving equipment version:', error);
    return null;
  }
};

export const getFreshEquipmentData = async (): Promise<EquipmentData[] | null> => {
  const isFresh = await isEquipmentDataFresh();
  return isFresh ? await getEquipmentData() : null;
};

export const hasEquipmentData = async (): Promise<boolean> => {
  try {
    const data = await equipmentStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for equipment data:', error);
    return false;
  }
};

export const getEquipmentById = async (equipmentId: string): Promise<EquipmentData | null> => {
  const data = await getEquipmentData();
  if (!data) return null;
  
  return data.find(item => item.equipment_id === equipmentId) || null;
};

export const getEquipmentByMachineType = async (machineType: string): Promise<EquipmentData[]> => {
  const data = await getEquipmentData();
  if (!data) return [];
  
  return data.filter(item => item.machine_type === machineType);
};

export const getUniqueMachineTypes = async (): Promise<string[]> => {
  const data = await getEquipmentData();
  if (!data) return [];
  
  const machineTypes = new Set<string>();
  data.forEach(item => machineTypes.add(item.machine_type));
  
  return Array.from(machineTypes);
};

export const getEquipmentTimestamp = async (): Promise<number | null> => {
  try {
    const metadata = await equipmentStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.timestamp || null;
  } catch (error) {
    console.error('Error retrieving equipment timestamp:', error);
    return null;
  }
};

export const getEquipmentDataSize = async (): Promise<number> => {
  try {
    const data = await equipmentStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting equipment data size:', error);
    return 0;
  }
};

export const getAllEquipmentMachineTypes = async (): Promise<string[]> => {
  const data = await getEquipmentData();
  if (!data) return [];
  
  return data.map(item => item.machine_type).filter(Boolean);
};

export const searchEquipmentByMachineType = async (searchTerm: string): Promise<EquipmentData[]> => {
  const data = await getEquipmentData();
  if (!data) return [];
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return data.filter(item => 
    item.machine_type.toLowerCase().includes(lowerSearchTerm)
  );
};

export const forceEquipmentMigration = async (): Promise<EquipmentData[] | null> => {
  try {
    const data = await equipmentStore.getItem<any[]>('data');
    const metadata = await equipmentStore.getItem<StoredDataMetadata>('metadata');
    
    if (!data) return null;
    
    const fromVersion = metadata?.version || 1;
    const migratedData = migrateToCurrentVersion(data, fromVersion);
    
    await storeEquipmentData(migratedData);
    return migratedData;
    
  } catch (error) {
    console.error('Error forcing equipment migration:', error);
    return null;
  }
};

export const getCurrentEquipmentSchemaHash = (): string => {
  return CURRENT_SCHEMA_HASH;
};

export const getStoredEquipmentSchemaHash = async (): Promise<string | null> => {
  try {
    const metadata = await equipmentStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.schemaHash || null;
  } catch (error) {
    console.error('Error retrieving equipment schema hash:', error);
    return null;
  }
};