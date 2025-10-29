// src/components/Storage/Storage.tsx

import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
} from '@ionic/react';
import { refreshOutline } from 'ionicons/icons';
import localForage from 'localforage';

// Import your storage systems
import { FormDataLocalStorage } from '../utils/tablestorages/FormDataLocalStorage';
import { ValueInfoLocalStorage } from '../utils/tablestorages/ValueInfoLocalStorage';
import { PhotoTagLocalStorage } from '../utils/tablestorages/PhotoTagLocalStorage';
import { AgriculturalDataLocalStorage } from '../utils/tablestorages/AgriculturalDataLocalStorage';
import { BuildingAdjustmentLocalStorage } from '../utils/tablestorages/BuildingAdjustmentLocalStorage';
import { BuildingDataLocalStorage } from '../utils/tablestorages/BuildingDataLocalStorage';
import { MachineDataLocalStorage } from '../utils/tablestorages/MachineDataLocalStorage';
import { NonAgriAdjustmentLocalStorage } from '../utils/tablestorages/NonAgriAdjustmentLocalStorage';
import { getActualUsedData, hasActualUsedData } from '../utils/actualUsedLocalStorage';
import { getAssessmentLevelData, getAssessmentLevelCount } from '../utils/assessmentLevelLocalStorage';
import { getBarangayData, getBarangayCount } from '../utils/barangayLocalStorage';
import { getBuildingCodeCount } from '../utils/buildingCodeLocalStorage';
import { getBuildingComponentData } from '../utils/buildingComponentLocalStorage';
import { getBuildingSubcomponentData } from '../utils/BuildingSubcomponentLocalStorage';
import { getClassificationData } from '../utils/classificationLocalStorage'; // Add this import

// Import our split components
import { InfoCard, StorageOverviewCard, StorageItemsCard } from './StorageCards';
import { calculateStorageUsage, formatBytes } from '../utils/PageUtils/StorageUtils';
import { StorageInstance, RecordCounter, InfoItem, StorageInfo, StorageItem, StorageRecordCount } from '../utils/PageUtils/StorageTypes';

// Create instances for all your storage systems
const formDataStorage = localForage.createInstance({
  name: 'FormDataDB',
  storeName: 'form_data_store'
});

const valueInfoStorage = localForage.createInstance({
  name: 'PhotoTagApp',
  storeName: 'value_info'
});

const photoTagsStorage = localForage.createInstance({
  name: 'PhotoTagApp',
  storeName: 'photo_tags'
});

const agriculturalStorage = localForage.createInstance({
  name: 'AgriculturalDataDB',
  storeName: 'agricultural_store'
});

const buildingAdjustmentStorage = localForage.createInstance({
  name: 'BuildingAdjustmentDB',
  storeName: 'building_adjustment_store'
});

const buildingDataStorage = localForage.createInstance({
  name: 'BuildingDataDB',
  storeName: 'building_data_store'
});

const machineDataStorage = localForage.createInstance({
  name: 'MachineDataStorage',
  storeName: 'machine_data_store'
});

const nonAgriAdjustmentStorage = localForage.createInstance({
  name: 'NonAgriAdjustmentStorage',
  storeName: 'non_agri_adjustment_store'
});

const actualUsedStorage = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'actual_used_data'
});

const assessmentLevelStorage = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'assessment_level_data'
});

const barangayStorage = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'barangay_data'
});

const buildingCodeStorage = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'building_code_data'
});

const buildingComponentStorage = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'building_component_data'
});

const buildingSubcomponentStorage = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'building_subcomponent_data'
});

const classificationStorage = localForage.createInstance({ // Add this instance
  name: 'TaxAppStorage',
  storeName: 'classification_data'
});

// ADD NEW STORAGE INSTANCES HERE
const storageInstances: StorageInstance[] = [
  { name: 'Default', instance: localForage },
  { name: 'FormDataDB', instance: formDataStorage },
  { name: 'ValueInfoDB', instance: valueInfoStorage },
  { name: 'PhotoTagsDB', instance: photoTagsStorage },
  { name: 'AgriculturalDB', instance: agriculturalStorage },
  { name: 'BuildingAdjustmentDB', instance: buildingAdjustmentStorage },
  { name: 'BuildingDataDB', instance: buildingDataStorage },
  { name: 'MachineDataDB', instance: machineDataStorage },
  { name: 'NonAgriAdjustmentDB', instance: nonAgriAdjustmentStorage },
  { name: 'ActualUsedDB', instance: actualUsedStorage },
  { name: 'AssessmentLevelDB', instance: assessmentLevelStorage },
  { name: 'BarangayDB', instance: barangayStorage },
  { name: 'BuildingCodeDB', instance: buildingCodeStorage },
  { name: 'BuildingComponentDB', instance: buildingComponentStorage },
  { name: 'BuildingSubcomponentDB', instance: buildingSubcomponentStorage },
  { name: 'ClassificationDB', instance: classificationStorage } // Add this line
];

// ADD NEW RECORD COUNTERS HERE
const recordCounters: RecordCounter[] = [
  { name: 'Form Data', getCount: () => FormDataLocalStorage.getAllFormData().then(data => data.length), color: 'primary' },
  { name: 'Value Info', getCount: () => ValueInfoLocalStorage.getAllValueInfo().then(data => data.length), color: 'secondary' },
  { name: 'Photo Tags', getCount: () => PhotoTagLocalStorage.getAllPhotoTags().then(data => data.length), color: 'tertiary' },
  { name: 'Agricultural Data', getCount: () => AgriculturalDataLocalStorage.getAllAgriculturalData().then(data => data.length), color: 'success' },
  { name: 'Building Adjustments', getCount: () => BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData().then(data => data.length), color: 'warning' },
  { name: 'Building Data', getCount: () => BuildingDataLocalStorage.getAllBuildingData().then(data => data.length), color: 'danger' },
  { name: 'Machine Data', getCount: () => MachineDataLocalStorage.getAllMachineData().then(data => data.length), color: 'medium' },
  { name: 'Non-Agri Adjustments', getCount: () => NonAgriAdjustmentLocalStorage.getAllNonAgriAdjustments().then(data => data.length), color: 'light' },
  { name: 'Actual Used Data', getCount: async () => {
    const data = await getActualUsedData();
    return data ? data.length : 0;
  }, color: 'dark' },
  { name: 'Assessment Levels', getCount: async () => {
    const data = await getAssessmentLevelData();
    return data ? data.length : 0;
  }, color: 'primary' },
  { name: 'Barangays', getCount: async () => {
    const data = await getBarangayData();
    return data ? data.length : 0;
  }, color: 'secondary' },
  { name: 'Building Codes', getCount: async () => {
    const count = await getBuildingCodeCount();
    return count;
  }, color: 'tertiary' },
  { name: 'Building Components', getCount: async () => {
    const data = await getBuildingComponentData();
    return data ? data.length : 0;
  }, color: 'success' },
  { name: 'Building Subcomponents', getCount: async () => {
    const data = await getBuildingSubcomponentData();
    return data ? data.length : 0;
  }, color: 'warning' },
  { name: 'Classifications', getCount: async () => { // Add this counter
    const data = await getClassificationData();
    return data ? data.length : 0;
  }, color: 'danger' }
];

const Storage: React.FC = () => {
    const [storageInfo, setStorageInfo] = useState<StorageInfo>({
        totalSize: 0,
        usedSize: 0,
        freeSize: 0,
        usagePercentage: 0,
        itemCount: 0
    });
    const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [driver, setDriver] = useState<string>('');
    const [recordCounts, setRecordCounts] = useState<StorageRecordCount[]>([]);

    const loadStorageInfo = async () => {
        setIsLoading(true);
        try {
            console.log('Loading storage info...');
            const { storageInfo: info, storageItems: items, recordCounts: counts, driver: currentDriver } = 
                await calculateStorageUsage(storageInstances, recordCounters);
            
            setStorageInfo(info);
            setStorageItems(items);
            setRecordCounts(counts);
            setDriver(currentDriver);
            
            console.log('Storage info loaded:', info);
        } catch (error) {
            console.error('Error loading storage info:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStorageInfo();
    }, []);

    const handleRefresh = (event: any) => {
        loadStorageInfo().then(() => {
            event.detail.complete();
        });
    };

    const getInfoItems = (): InfoItem[] => [
        { label: 'Storage Driver', value: driver || 'Unknown', slot: 'end' },
        { label: 'Total Available', value: formatBytes(storageInfo.totalSize), slot: 'end', color: 'success' },
        { label: 'Status', value: isLoading ? 'Loading...' : 'Ready', slot: 'end' },
        ...recordCounts.map(record => ({
            label: record.name,
            value: record.count,
            slot: 'end' as const,
            badge: true
        }))
    ];

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Storage</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={loadStorageInfo} disabled={isLoading}>
                            <IonIcon icon={refreshOutline} slot="icon-only" />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                    <IonRefresherContent></IonRefresherContent>
                </IonRefresher>

                <div className="ion-padding">
                    <InfoCard 
                        title="Storage Information" 
                        items={getInfoItems()} 
                        color="light" 
                    />
                    
                    <StorageOverviewCard 
                        storageInfo={storageInfo} 
                    />
                    
                    <StorageItemsCard 
                        storageItems={storageItems} 
                        isLoading={isLoading} 
                    />
                </div>
            </IonContent>
        </IonPage>
    );
};

export default Storage;