// utils/BuildingSubcomponentLocalStorage.ts
import localForage from 'localforage';

export interface BuildingSubcomponentData {
  building_subcom_id: string;
  description: string;
  rate: number;
  building_com_id: string;
  percent: boolean;
}

const buildingSubcomponentStore = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'building_subcomponent_data'
});

const CURRENT_VERSION = Date.now();

interface StoredDataMetadata {
  version: number;
  timestamp: number;
  schemaHash: string;
}

const generateSchemaHash = (): string => {
  const schema = {
    building_subcom_id: 'string',
    description: 'string',
    rate: 'number',
    building_com_id: 'string',
    percent: 'boolean'
  };
  return JSON.stringify(schema);
};

const CURRENT_SCHEMA_HASH = generateSchemaHash();

const migrateToCurrentVersion = (data: any[], fromVersion: number): BuildingSubcomponentData[] => {
  return data.map(item => {
    const migratedItem: Partial<BuildingSubcomponentData> = {};
    
    if (typeof item.building_subcom_id === 'string') {
      migratedItem.building_subcom_id = item.building_subcom_id;
    }
    
    if (typeof item.description === 'string') {
      migratedItem.description = item.description;
    }

    if (typeof item.rate === 'number') {
      migratedItem.rate = item.rate;
    } else if (typeof item.rate === 'string') {
      migratedItem.rate = parseFloat(item.rate);
    }

    if (typeof item.building_com_id === 'string') {
      migratedItem.building_com_id = item.building_com_id;
    }

    // Handle the new percent field - default to false for migrated data
    if (typeof item.percent === 'boolean') {
      migratedItem.percent = item.percent;
    } else {
      migratedItem.percent = false; // Default value for migrated records
    }

    const validProperties = new Set(['building_subcom_id', 'description', 'rate', 'building_com_id', 'percent']);
    Object.keys(migratedItem).forEach(key => {
      if (!validProperties.has(key)) {
        delete migratedItem[key as keyof BuildingSubcomponentData];
      }
    });
    
    return migratedItem as BuildingSubcomponentData;
  });
};

const validateData = (data: any[]): data is BuildingSubcomponentData[] => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.building_subcom_id === 'string' &&
      typeof item.description === 'string' &&
      typeof item.rate === 'number' &&
      typeof item.building_com_id === 'string' &&
      typeof item.percent === 'boolean'
    );
  });
};

export const storeBuildingSubcomponentData = async (data: BuildingSubcomponentData[]): Promise<void> => {
  try {
    if (!validateData(data)) {
      console.error('Invalid data format attempted to be stored');
      return;
    }
    
    await buildingSubcomponentStore.setItem('data', data);
    await buildingSubcomponentStore.setItem('metadata', {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      schemaHash: CURRENT_SCHEMA_HASH
    } as StoredDataMetadata);
    
  } catch (error) {
    console.error('Error storing building subcomponent data:', error);
  }
};

export const getBuildingSubcomponentData = async (): Promise<BuildingSubcomponentData[] | null> => {
  try {
    const [data, metadata] = await Promise.all([
      buildingSubcomponentStore.getItem<any[]>('data'),
      buildingSubcomponentStore.getItem<StoredDataMetadata>('metadata')
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
    
    await storeBuildingSubcomponentData(migratedData);
    return migratedData;
    
  } catch (error) {
    console.error('Error retrieving building subcomponent data:', error);
    return null;
  }
};

export const isBuildingSubcomponentDataFresh = async (): Promise<boolean> => {
  try {
    const metadata = await buildingSubcomponentStore.getItem<StoredDataMetadata>('metadata');

    if (!metadata) return false;
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const isRecent = (Date.now() - metadata.timestamp) < twentyFourHours;
    const isCurrentVersion = metadata.version === CURRENT_VERSION;
    const isCurrentSchema = metadata.schemaHash === CURRENT_SCHEMA_HASH;
    
    return isRecent && isCurrentVersion && isCurrentSchema;
  } catch (error) {
    console.error('Error checking building subcomponent data freshness:', error);
    return false;
  }
};

export const clearBuildingSubcomponentData = async (): Promise<void> => {
  try {
    await buildingSubcomponentStore.clear();
  } catch (error) {
    console.error('Error clearing building subcomponent data:', error);
  }
};

export const getCurrentBuildingSubcomponentVersion = (): number => {
  return CURRENT_VERSION;
};

export const getStoredBuildingSubcomponentVersion = async (): Promise<number | null> => {
  try {
    const metadata = await buildingSubcomponentStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.version || null;
  } catch (error) {
    console.error('Error retrieving building subcomponent version:', error);
    return null;
  }
};

export const getFreshBuildingSubcomponentData = async (): Promise<BuildingSubcomponentData[] | null> => {
  const isFresh = await isBuildingSubcomponentDataFresh();
  return isFresh ? await getBuildingSubcomponentData() : null;
};

export const hasBuildingSubcomponentData = async (): Promise<boolean> => {
  try {
    const data = await buildingSubcomponentStore.getItem('data');
    return data !== null;
  } catch (error) {
    console.error('Error checking for building subcomponent data:', error);
    return false;
  }
};

export const getBuildingSubcomponentById = async (buildingSubcomId: string): Promise<BuildingSubcomponentData | null> => {
  const data = await getBuildingSubcomponentData();
  if (!data) return null;
  
  return data.find(item => item.building_subcom_id === buildingSubcomId) || null;
};

export const getBuildingSubcomponentByBuildingComId = async (buildingComId: string): Promise<BuildingSubcomponentData[]> => {
  const data = await getBuildingSubcomponentData();
  if (!data) return [];
  
  return data.filter(item => item.building_com_id === buildingComId);
};

export const getBuildingSubcomponentTimestamp = async (): Promise<number | null> => {
  try {
    const metadata = await buildingSubcomponentStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.timestamp || null;
  } catch (error) {
    console.error('Error retrieving building subcomponent timestamp:', error);
    return null;
  }
};

export const getBuildingSubcomponentDataSize = async (): Promise<number> => {
  try {
    const data = await buildingSubcomponentStore.getItem('data');
    return data ? JSON.stringify(data).length : 0;
  } catch (error) {
    console.error('Error getting building subcomponent data size:', error);
    return 0;
  }
};

export const getAllBuildingSubcomponentDescriptions = async (): Promise<string[]> => {
  const data = await getBuildingSubcomponentData();
  if (!data) return [];
  
  return data.map(item => item.description).filter(Boolean);
};

export const searchBuildingSubcomponentByDescription = async (searchTerm: string): Promise<BuildingSubcomponentData[]> => {
  const data = await getBuildingSubcomponentData();
  if (!data) return [];
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return data.filter(item => 
    item.description.toLowerCase().includes(lowerSearchTerm)
  );
};

export const forceMigration = async (): Promise<BuildingSubcomponentData[] | null> => {
  try {
    const data = await buildingSubcomponentStore.getItem<any[]>('data');
    const metadata = await buildingSubcomponentStore.getItem<StoredDataMetadata>('metadata');
    
    if (!data) return null;
    
    const fromVersion = metadata?.version || 1;
    const migratedData = migrateToCurrentVersion(data, fromVersion);
    
    await storeBuildingSubcomponentData(migratedData);
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
    const metadata = await buildingSubcomponentStore.getItem<StoredDataMetadata>('metadata');
    return metadata?.schemaHash || null;
  } catch (error) {
    console.error('Error retrieving schema hash:', error);
    return null;
  }
};