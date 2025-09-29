// utils/machineLocalStorage.ts
import localForage from 'localforage';

export interface MachineData {
  serial_no: string;
  machine_description: string;
  equipment_id: string;
  created_at: string;
}

const machineStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'machine_data'
});

const CURRENT_VERSION = Date.now();

interface StoredDataMetadata {
  version: number;
  timestamp: number;
  schemaHash: string;
}

const generateSchemaHash = (): string => {
  const schema = {
    serial_no: 'string',
    machine_description: 'string',
    equipment_id: 'string',
    created_at: 'string'
  };
  return JSON.stringify(schema);
};

const CURRENT_SCHEMA_HASH = generateSchemaHash();

const migrateToCurrentVersion = (data: any[], fromVersion: number): MachineData[] => {
  return data.map(item => {
    const migratedItem: Partial<MachineData> = {};
    
    if (typeof item.serial_no === 'string') {
      migratedItem.serial_no = item.serial_no;
    }
    
    if (typeof item.machine_description === 'string') {
      migratedItem.machine_description = item.machine_description;
    }

    if (typeof item.equipment_id === 'string') {
      migratedItem.equipment_id = item.equipment_id;
    }

    if (typeof item.created_at === 'string') {
      migratedItem.created_at = item.created_at;
    }

    const validProperties = new Set(['serial_no', 'machine_description', 'equipment_id', 'created_at']);
    Object.keys(migratedItem).forEach(key => {
      if (!validProperties.has(key)) {
        delete migratedItem[key as keyof MachineData];
      }
    });
    
    return migratedItem as MachineData;
  });
};

const validateData = (data: any[]): data is MachineData[] => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.serial_no === 'string' &&
      typeof item.machine_description === 'string' &&
      typeof item.equipment_id === 'string' &&
      typeof item.created_at === 'string'
    );
  });
};

export const storeMachineData = async (data: MachineData[]): Promise<void> => {
  try {
    if (!validateData(data)) {
      console.error('Invalid machine data format attempted to be stored');
      return;
    }
    
    await machineStore.setItem('data', data);
    await machineStore.setItem('metadata', {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      schemaHash: CURRENT_SCHEMA_HASH
    } as StoredDataMetadata);
    
  } catch (error) {
    console.error('Error storing machine data:', error);
  }
};

export const getMachineData = async (): Promise<MachineData[] | null> => {
  try {
    const [data, metadata] = await Promise.all([
      machineStore.getItem<any[]>('data'),
      machineStore.getItem<StoredDataMetadata>('metadata')
    ]);

    if (!data || !metadata) return null;

    if (metadata.version === CURRENT_VERSION && validateData(data)) {
      return data;
    }

    let migratedData = migrateToCurrentVersion(data, metadata.version);
    
    if (!validateData(migratedData)) {
      console.error('Migrated machine data failed validation');
      return null;
    }
    
    await storeMachineData(migratedData);
    return migratedData;
    
  } catch (error) {
    console.error('Error retrieving machine data:', error);
    return null;
  }
};

export const isMachineDataFresh = async (): Promise<boolean> => {
  try {
    const metadata = await machineStore.getItem<StoredDataMetadata>('metadata');

    if (!metadata) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const isRecent = (Date.now() - metadata.timestamp) < twentyFourHours;
    const isCurrentVersion = metadata.version === CURRENT_VERSION;
    const isCurrentSchema = metadata.schemaHash === CURRENT_SCHEMA_HASH;
    
    return isRecent && isCurrentVersion && isCurrentSchema;
  } catch (error) {
    console.error('Error checking machine data freshness:', error);
    return false;
  }
};

export const clearMachineData = async (): Promise<void> => {
  try {
    await machineStore.clear();
  } catch (error) {
    console.error('Error clearing machine data:', error);
  }
};

export const getCurrentMachineVersion = (): number => {
  return CURRENT_VERSION;
};

export const getStoredMachineVersion = async (): Promise<number | null> => {
  try {
    const metadata = await machineStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.version || null;
  } catch (error) {
    console.error('Error retrieving machine version:', error);
    return null;
  }
};

export const getFreshMachineData = async (): Promise<MachineData[] | null> => {
  const isFresh = await isMachineDataFresh();
  return isFresh ? await getMachineData() : null;
};

export const hasMachineData = async (): Promise<boolean> => {
  try {
    const data = await machineStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for machine data:', error);
    return false;
  }
};

export const getMachineBySerialNo = async (serialNo: string): Promise<MachineData | null> => {
  const data = await getMachineData();
  if (!data) return null;
  
  return data.find(item => item.serial_no === serialNo) || null;
};

export const getMachinesByEquipmentId = async (equipmentId: string): Promise<MachineData[]> => {
  const data = await getMachineData();
  if (!data) return [];
  
  return data.filter(item => item.equipment_id === equipmentId);
};

export const getUniqueEquipmentIds = async (): Promise<string[]> => {
  const data = await getMachineData();
  if (!data) return [];
  
  const equipmentIds = new Set<string>();
  data.forEach(item => equipmentIds.add(item.equipment_id));
  
  return Array.from(equipmentIds);
};

export const getMachineTimestamp = async (): Promise<number | null> => {
  try {
    const metadata = await machineStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.timestamp || null;
  } catch (error) {
    console.error('Error retrieving machine timestamp:', error);
    return null;
  }
};

export const getMachineDataSize = async (): Promise<number> => {
  try {
    const data = await machineStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting machine data size:', error);
    return 0;
  }
};

export const getAllMachineDescriptions = async (): Promise<string[]> => {
  const data = await getMachineData();
  if (!data) return [];
  
  return data.map(item => item.machine_description).filter(Boolean);
};

export const searchMachinesByDescription = async (searchTerm: string): Promise<MachineData[]> => {
  const data = await getMachineData();
  if (!data) return [];
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return data.filter(item => 
    item.machine_description.toLowerCase().includes(lowerSearchTerm)
  );
};

export const searchMachinesBySerialNo = async (searchTerm: string): Promise<MachineData[]> => {
  const data = await getMachineData();
  if (!data) return [];
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return data.filter(item => 
    item.serial_no.toLowerCase().includes(lowerSearchTerm)
  );
};

export const getMachinesByEquipmentIds = async (equipmentIds: string[]): Promise<MachineData[]> => {
  const data = await getMachineData();
  if (!data) return [];
  
  const equipmentIdSet = new Set(equipmentIds);
  return data.filter(item => equipmentIdSet.has(item.equipment_id));
};

export const forceMachineMigration = async (): Promise<MachineData[] | null> => {
  try {
    const data = await machineStore.getItem<any[]>('data');
    const metadata = await machineStore.getItem<StoredDataMetadata>('metadata');
    
    if (!data) return null;
    
    const fromVersion = metadata?.version || 1;
    const migratedData = migrateToCurrentVersion(data, fromVersion);
    
    await storeMachineData(migratedData);
    return migratedData;
    
  } catch (error) {
    console.error('Error forcing machine migration:', error);
    return null;
  }
};

export const getCurrentMachineSchemaHash = (): string => {
  return CURRENT_SCHEMA_HASH;
};

export const getStoredMachineSchemaHash = async (): Promise<string | null> => {
  try {
    const metadata = await machineStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.schemaHash || null;
  } catch (error) {
    console.error('Error retrieving machine schema hash:', error);
    return null;
  }
};