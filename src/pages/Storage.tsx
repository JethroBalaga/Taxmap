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
import { BuildingDataLocalStorage } from '../utils/tablestorages/BuildingDataLocalStorage'; // Add this import

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

const buildingDataStorage = localForage.createInstance({ // Add this instance
  name: 'BuildingDataDB',
  storeName: 'building_data_store'
});

// ADD NEW STORAGE INSTANCES HERE
const storageInstances: StorageInstance[] = [
  { name: 'Default', instance: localForage },
  { name: 'FormDataDB', instance: formDataStorage },
  { name: 'ValueInfoDB', instance: valueInfoStorage },
  { name: 'PhotoTagsDB', instance: photoTagsStorage },
  { name: 'AgriculturalDB', instance: agriculturalStorage },
  { name: 'BuildingAdjustmentDB', instance: buildingAdjustmentStorage },
  { name: 'BuildingDataDB', instance: buildingDataStorage } // Add this line
  // Add more instances here as you create them...
];

// ADD NEW RECORD COUNTERS HERE
const recordCounters: RecordCounter[] = [
  { name: 'Form Data', getCount: () => FormDataLocalStorage.getAllFormData().then(data => data.length), color: 'primary' },
  { name: 'Value Info', getCount: () => ValueInfoLocalStorage.getAllValueInfo().then(data => data.length), color: 'secondary' },
  { name: 'Photo Tags', getCount: () => PhotoTagLocalStorage.getAllPhotoTags().then(data => data.length), color: 'tertiary' },
  { name: 'Agricultural Data', getCount: () => AgriculturalDataLocalStorage.getAllAgriculturalData().then(data => data.length), color: 'success' },
  { name: 'Building Adjustments', getCount: () => BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData().then(data => data.length), color: 'warning' },
  { name: 'Building Data', getCount: () => BuildingDataLocalStorage.getAllBuildingData().then(data => data.length), color: 'danger' } // Add this line
  // Add more counters here as you create them...
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
                        recordCounts={recordCounts} 
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