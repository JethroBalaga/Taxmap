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
import { getClassificationData } from '../utils/classificationLocalStorage';
// REMOVED: getDeclarantData import - since declarant is now a string
import { getDistrictData } from '../utils/districtLocalStorage';
import { getEquipmentData } from '../utils/equipmentLocalStorage';
import { getKindData } from '../utils/kindLocalStorage';
import { getLandAdjustmentData } from '../utils/landAdjustmentLocalStorage';
import { getStructureTypeData } from '../utils/structureTypeLocalStorage';
import { getSubclassData } from '../utils/subclassLocalStorage';
import { getSubclassRateData } from '../utils/subclassRateLocalStorage';
import { getTaxRateData } from '../utils/taxRateLocalStorage';

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

const classificationStorage = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'classification_data'
});

// REMOVED: declarantStorage instance - since declarant is now a string
const districtStorage = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'district_data'
});

const equipmentStorage = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'equipment_data'
});

const kindStorage = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'kind_data'
});

const landAdjustmentStorage = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'land_adjustment_data'
});

const structureTypeStorage = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'structure_type_data'
});

const subclassStorage = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'subclass_data'
});

const subclassRateStorage = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'subclass_rate_data'
});

const taxRateStorage = localForage.createInstance({
  name: 'TaxAppStorage',
  storeName: 'tax_rate_data'
});

// UPDATED: Remove declarant storage from instances
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
  { name: 'ClassificationDB', instance: classificationStorage },
  // REMOVED: DeclarantDB from storage instances
  { name: 'DistrictDB', instance: districtStorage },
  { name: 'EquipmentDB', instance: equipmentStorage },
  { name: 'KindDB', instance: kindStorage },
  { name: 'LandAdjustmentDB', instance: landAdjustmentStorage },
  { name: 'StructureTypeDB', instance: structureTypeStorage },
  { name: 'SubclassDB', instance: subclassStorage },
  { name: 'SubclassRateDB', instance: subclassRateStorage },
  { name: 'TaxRateDB', instance: taxRateStorage }
];

// UPDATED: Remove declarant counter from record counters
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
  { name: 'Classifications', getCount: async () => {
    const data = await getClassificationData();
    return data ? data.length : 0;
  }, color: 'danger' },
  // REMOVED: Declarants counter - since declarant is now a string in form data
  { name: 'Districts', getCount: async () => {
    const data = await getDistrictData();
    return data ? data.length : 0;
  }, color: 'dark' },
  { name: 'Equipment', getCount: async () => {
    const data = await getEquipmentData();
    return data ? data.length : 0;
  }, color: 'primary' },
  { name: 'Kinds', getCount: async () => {
    const data = await getKindData();
    return data ? data.length : 0;
  }, color: 'secondary' },
  { name: 'Land Adjustments', getCount: async () => {
    const data = await getLandAdjustmentData();
    return data ? data.length : 0;
  }, color: 'tertiary' },
  { name: 'Structure Types', getCount: async () => {
    const data = await getStructureTypeData();
    return data ? data.length : 0;
  }, color: 'success' },
  { name: 'Subclasses', getCount: async () => {
    const data = await getSubclassData();
    return data ? data.length : 0;
  }, color: 'warning' },
  { name: 'Subclass Rates', getCount: async () => {
    const data = await getSubclassRateData();
    return data ? data.length : 0;
  }, color: 'danger' },
  { name: 'Tax Rates', getCount: async () => {
    const data = await getTaxRateData();
    return data ? data.length : 0;
  }, color: 'medium' }
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