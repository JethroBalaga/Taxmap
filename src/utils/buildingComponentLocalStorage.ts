// utils/buildingComponentLocalStorage.ts
import localForage from 'localforage';

export interface BuildingComponentData {
  building_com_id: string;
  description: string;
}

const buildingComponentStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'building_component_data'
});

const CURRENT_VERSION = Date.now();

interface StoredDataMetadata {
  version: number;
  timestamp: number;
  schemaHash: string;
}

const generateSchemaHash = (): string => {
  const schema = {
    building_com_id: 'string',
    description: 'string'
  };
  return JSON.stringify(schema);
};

const CURRENT_SCHEMA_HASH = generateSchemaHash();

const migrateToCurrentVersion = (data: any[], fromVersion: number): BuildingComponentData[] => {
  return data.map(item => {
    const migratedItem: Partial<BuildingComponentData> = {};
    
    if (typeof item.building_com_id === 'string') {
      migratedItem.building_com_id = item.building_com_id;
    }
    
    if (typeof item.description === 'string') {
      migratedItem.description = item.description;
    }

    const validProperties = new Set(['building_com_id', 'description']);
    Object.keys(migratedItem).forEach(key => {
      if (!validProperties.has(key)) {
        delete migratedItem[key as keyof BuildingComponentData];
      }
    });
    
    return migratedItem as BuildingComponentData;
  });
};

const validateData = (data: any[]): data is BuildingComponentData[] => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.building_com_id === 'string' &&
      typeof item.description === 'string'
    );
  });
};

export const storeBuildingComponentData = async (data: BuildingComponentData[]): Promise<void> => {
  try {
    if (!validateData(data)) {
      console.error('Invalid data format attempted to be stored');
      return;
    }
    
    await buildingComponentStore.setItem('data', data);
    await buildingComponentStore.setItem('metadata', {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      schemaHash: CURRENT_SCHEMA_HASH
    } as StoredDataMetadata);
    
  } catch (error) {
    console.error('Error storing building component data:', error);
  }
};

export const getBuildingComponentData = async (): Promise<BuildingComponentData[] | null> => {
  try {
    const [data, metadata] = await Promise.all([
      buildingComponentStore.getItem<any[]>('data'),
      buildingComponentStore.getItem<StoredDataMetadata>('metadata')
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
    
    await storeBuildingComponentData(migratedData);
    return migratedData;
    
  } catch (error) {
    console.error('Error retrieving building component data:', error);
    return null;
  }
};

export const isBuildingComponentDataFresh = async (): Promise<boolean> => {
  try {
    const metadata = await buildingComponentStore.getItem<StoredDataMetadata>('metadata');

    if (!metadata) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const isRecent = (Date.now() - metadata.timestamp) < twentyFourHours;
    const isCurrentVersion = metadata.version === CURRENT_VERSION;
    const isCurrentSchema = metadata.schemaHash === CURRENT_SCHEMA_HASH;
    
    return isRecent && isCurrentVersion && isCurrentSchema;
  } catch (error) {
    console.error('Error checking building component data freshness:', error);
    return false;
  }
};

export const clearBuildingComponentData = async (): Promise<void> => {
  try {
    await buildingComponentStore.clear();
  } catch (error) {
    console.error('Error clearing building component data:', error);
  }
};

export const getCurrentBuildingComponentVersion = (): number => {
  return CURRENT_VERSION;
};

export const getStoredBuildingComponentVersion = async (): Promise<number | null> => {
  try {
    const metadata = await buildingComponentStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.version || null;
  } catch (error) {
    console.error('Error retrieving building component version:', error);
    return null;
  }
};

export const getFreshBuildingComponentData = async (): Promise<BuildingComponentData[] | null> => {
  const isFresh = await isBuildingComponentDataFresh();
  return isFresh ? await getBuildingComponentData() : null;
};

export const hasBuildingComponentData = async (): Promise<boolean> => {
  try {
    const data = await buildingComponentStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for building component data:', error);
    return false;
  }
};

export const getBuildingComponentById = async (buildingComId: string): Promise<BuildingComponentData | null> => {
  const data = await getBuildingComponentData();
  if (!data) return null;
  
  return data.find(item => item.building_com_id === buildingComId) || null;
};

export const getBuildingComponentTimestamp = async (): Promise<number | null> => {
  try {
    const metadata = await buildingComponentStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.timestamp || null;
  } catch (error) {
    console.error('Error retrieving building component timestamp:', error);
    return null;
  }
};

export const getBuildingComponentDataSize = async (): Promise<number> => {
  try {
    const data = await buildingComponentStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting building component data size:', error);
    return 0;
  }
};

export const getAllBuildingComponentDescriptions = async (): Promise<string[]> => {
  const data = await getBuildingComponentData();
  if (!data) return [];
  
  return data.map(item => item.description).filter(Boolean);
};

export const searchBuildingComponentByDescription = async (searchTerm: string): Promise<BuildingComponentData[]> => {
  const data = await getBuildingComponentData();
  if (!data) return [];
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return data.filter(item => 
    item.description.toLowerCase().includes(lowerSearchTerm)
  );
};

export const forceMigration = async (): Promise<BuildingComponentData[] | null> => {
  try {
    const data = await buildingComponentStore.getItem<any[]>('data');
    const metadata = await buildingComponentStore.getItem<StoredDataMetadata>('metadata');
    
    if (!data) return null;
    
    const fromVersion = metadata?.version || 1;
    const migratedData = migrateToCurrentVersion(data, fromVersion);
    
    await storeBuildingComponentData(migratedData);
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
    const metadata = await buildingComponentStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.schemaHash || null;
  } catch (error) {
    console.error('Error retrieving schema hash:', error);
    return null;
  }
};