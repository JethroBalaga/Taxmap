// src/utils/PageUtils/StorageUtils.ts

import { StorageInfo, StorageItem, StorageInstance, RecordCounter, StorageRecordCount } from './StorageTypes';

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getProgressBarColor = (percentage: number): string => {
  if (percentage < 70) return 'primary';
  if (percentage < 90) return 'warning';
  return 'danger';
};

export const getStorageLimit = async (): Promise<number> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      return estimate.quota || 2 * 1024 * 1024 * 1024; // 2GB default
    } catch (error) {
      console.warn('Could not get storage estimate:', error);
    }
  }
  return 2 * 1024 * 1024 * 1024; // 2GB default
};

export const calculateStorageUsage = async (
  storageInstances: StorageInstance[],
  recordCounters: RecordCounter[]
): Promise<{
  storageInfo: StorageInfo;
  storageItems: StorageItem[];
  recordCounts: StorageRecordCount[];
  driver: string;
}> => {
  try {
    // Initialize all storage instances
    await Promise.all(storageInstances.map(async ({ instance }) => {
      await instance.ready();
    }));
    
    const currentDriver = storageInstances[0]?.instance.driver() || 'Unknown';

    // Get record counts from all storage systems
    const recordCounts = await Promise.all(
      recordCounters.map(async (counter) => {
        const count = await counter.getCount();
        return { name: counter.name, count, color: counter.color };
      })
    );

    // Get actual storage quota
    const storageLimit = await getStorageLimit();

    let totalSize = 0;
    const storageItems: StorageItem[] = [];

    // Process all storage instances
    for (const { name, instance } of storageInstances) {
      const keys = await instance.keys();
      console.log(`${name} storage keys:`, keys);

      for (const key of keys) {
        try {
          const value = await instance.getItem(key);
          if (value !== null && value !== undefined) {
            const jsonString = JSON.stringify(value);
            const itemSize = new Blob([jsonString]).size;
            totalSize += itemSize;
            
            // Format display value
            let displayValue = 'Data';
            if (key === 'formData' && Array.isArray(value)) {
              displayValue = `${value.length} form records`;
            } else if (key === 'valueInfo' && Array.isArray(value)) {
              displayValue = `${value.length} value info records`;
            } else if (key === 'photoTags' && Array.isArray(value)) {
              displayValue = `${value.length} photo tag records`;
            } else if (key === 'agriculturalData' && Array.isArray(value)) {
              displayValue = `${value.length} agricultural data records`;
            } else if (key === 'buildingAdjustmentData' && Array.isArray(value)) {
              displayValue = `${value.length} building adjustment records`;
            } else if (key === 'buildingData' && Array.isArray(value)) {
              displayValue = `${value.length} building data records`;
            } else if (key === 'machineData' && Array.isArray(value)) {
              displayValue = `${value.length} machine data records`;
            } else if (key === 'nonAgriAdjustments' && Array.isArray(value)) {
              displayValue = `${value.length} non-agri adjustment records`;
            } else if (key === 'data' && Array.isArray(value) && name === 'ActualUsedDB') {
              displayValue = `${value.length} actual used records`;
            } else if (key === 'data' && Array.isArray(value) && name === 'AssessmentLevelDB') {
              displayValue = `${value.length} assessment level records`;
            } else if (key === 'data' && Array.isArray(value) && name === 'BarangayDB') {
              displayValue = `${value.length} barangay records`;
            } else if (key === 'data' && Array.isArray(value) && name === 'BuildingCodeDB') {
              displayValue = `${value.length} building code records`;
            } else if (key === 'data' && Array.isArray(value) && name === 'BuildingComponentDB') {
              displayValue = `${value.length} building component records`;
            } else if (key === 'data' && Array.isArray(value) && name === 'BuildingSubcomponentDB') {
              displayValue = `${value.length} building subcomponent records`;
            } else if (key === 'data' && Array.isArray(value) && name === 'ClassificationDB') {
              displayValue = `${value.length} classification records`;
            } else if (key === 'data' && Array.isArray(value) && name === 'DeclarantDB') {
              displayValue = `${value.length} declarant records`;
            } else if (key === 'data' && Array.isArray(value) && name === 'DistrictDB') {
              displayValue = `${value.length} district records`;
            } else if (key === 'data' && Array.isArray(value) && name === 'EquipmentDB') {
              displayValue = `${value.length} equipment records`;
            } else if (key === 'data' && Array.isArray(value) && name === 'KindDB') {
              displayValue = `${value.length} kind records`;
            } else if (key === 'data' && Array.isArray(value) && name === 'LandAdjustmentDB') {
              displayValue = `${value.length} land adjustment records`;
            } else if (key === 'data' && Array.isArray(value) && name === 'StructureTypeDB') { // Add this condition
              displayValue = `${value.length} structure type records`;
            } else if (key === 'metadata' && typeof value === 'object') {
              displayValue = 'Metadata information';
            } else if (typeof value === 'object') {
              displayValue = 'Object data';
            } else {
              displayValue = String(value);
            }
            
            storageItems.push({ 
              key, 
              size: itemSize,
              database: name,
              value: displayValue
            });
          }
        } catch (error) {
          console.warn(`Error processing ${name} key ${key}:`, error);
        }
      }
    }

    // Sort items by size (largest first)
    storageItems.sort((a, b) => b.size - a.size);

    const usagePercentage = totalSize > 0 ? (totalSize / storageLimit) * 100 : 0;

    const storageInfo: StorageInfo = {
      totalSize: storageLimit,
      usedSize: totalSize,
      freeSize: Math.max(0, storageLimit - totalSize),
      usagePercentage: Math.min(usagePercentage, 100),
      itemCount: storageItems.length
    };

    console.log('Storage calculation complete:', {
      totalItems: storageItems.length,
      totalSize,
      storageLimit,
      usagePercentage,
      recordCounts
    });

    return {
      storageInfo,
      storageItems,
      recordCounts,
      driver: currentDriver
    };
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    const fallbackLimit = 2 * 1024 * 1024 * 1024;
    return {
      storageInfo: {
        totalSize: fallbackLimit,
        usedSize: 0,
        freeSize: fallbackLimit,
        usagePercentage: 0,
        itemCount: 0
      },
      storageItems: [],
      recordCounts: [],
      driver: 'Unknown'
    };
  }
};