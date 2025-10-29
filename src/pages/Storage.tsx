import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonProgressBar,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonText,
    IonNote,
    IonBadge
} from '@ionic/react';
import { refreshOutline } from 'ionicons/icons';
import localForage from 'localforage';
import { FormDataLocalStorage } from '../utils/tablestorages/FormDataLocalStorage';
import { ValueInfoLocalStorage } from '../utils/tablestorages/ValueInfoLocalStorage';

// Create instances for all your storage systems
const formDataStorage = localForage.createInstance({
  name: 'FormDataDB',
  storeName: 'form_data_store'
});

const valueInfoStorage = localForage.createInstance({
  name: 'PhotoTagApp',
  storeName: 'value_info'
});

// Add more instances here as you create them...

interface StorageInfo {
  totalSize: number;
  usedSize: number;
  freeSize: number;
  usagePercentage: number;
  itemCount: number;
}

interface StorageItem {
  key: string;
  size: number;
  database: string;
  value?: any;
}

interface InfoItem {
  label: string;
  value: string | number;
  slot?: 'end';
  color?: string;
  badge?: boolean;
}

interface StorageRecordCount {
  name: string;
  count: number;
  color?: string;
}

const Storage: React.FC = () => {
    const [storageInfo, setStorageInfo] = useState<StorageInfo>({
        totalSize: 0,
        usedSize: 0,
        freeSize: 0,
        usagePercentage: 0,
        itemCount: 0
    });
    const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [driver, setDriver] = useState<string>('');
    const [recordCounts, setRecordCounts] = useState<StorageRecordCount[]>([]);

    // All storage instances to check - ADD NEW INSTANCES HERE
    const storageInstances = [
        { name: 'Default', instance: localForage },
        { name: 'FormDataDB', instance: formDataStorage },
        { name: 'ValueInfoDB', instance: valueInfoStorage }
        // Add more instances here as you create them...
    ];

    // All record counters - ADD NEW COUNTERS HERE
    const recordCounters = [
        { name: 'Form Data', getCount: () => FormDataLocalStorage.getAllFormData().then(data => data.length), color: 'primary' },
        { name: 'Value Info', getCount: () => ValueInfoLocalStorage.getAllValueInfo().then(data => data.length), color: 'secondary' }
        // Add more counters here as you create them...
    ];

    // Info items for the storage information card
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

    // Stats items for the storage overview card
    const getStatsItems = (): InfoItem[] => [
        { label: 'Total Storage Items', value: storageInfo.itemCount, slot: 'end' },
        { label: 'Used Space', value: formatBytes(storageInfo.usedSize), slot: 'end' },
        { label: 'Free Space', value: formatBytes(storageInfo.freeSize), slot: 'end', color: 'success' },
        ...recordCounts.map(record => ({
            label: record.name,
            value: record.count,
            slot: 'end' as const
        }))
    ];

    const calculateStorageUsage = async (): Promise<StorageInfo> => {
        try {
            // Initialize all storage instances
            await Promise.all(storageInstances.map(async ({ instance }) => {
                await instance.ready();
            }));
            
            const currentDriver = localForage.driver();
            setDriver(currentDriver);

            // Get record counts from all storage systems
            const counts = await Promise.all(
                recordCounters.map(async (counter) => {
                    const count = await counter.getCount();
                    return { name: counter.name, count, color: counter.color };
                })
            );
            setRecordCounts(counts);

            // Get actual storage quota
            let storageLimit = 2 * 1024 * 1024 * 1024; // Default to 2GB
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                try {
                    const estimate = await navigator.storage.estimate();
                    if (estimate.quota) {
                        storageLimit = estimate.quota;
                        console.log('Actual storage quota:', formatBytes(storageLimit));
                    }
                } catch (error) {
                    console.warn('Could not get storage estimate, using 2GB default:', error);
                }
            }

            let totalSize = 0;
            const items: StorageItem[] = [];

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
                            } else if (typeof value === 'object') {
                                displayValue = 'Object data';
                            } else {
                                displayValue = String(value);
                            }
                            
                            items.push({ 
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
            items.sort((a, b) => b.size - a.size);

            const usagePercentage = totalSize > 0 ? (totalSize / storageLimit) * 100 : 0;

            console.log('Storage calculation complete:', {
                totalItems: items.length,
                totalSize,
                storageLimit,
                usagePercentage,
                recordCounts: counts
            });

            setStorageItems(items);

            return {
                totalSize: storageLimit,
                usedSize: totalSize,
                freeSize: Math.max(0, storageLimit - totalSize),
                usagePercentage: Math.min(usagePercentage, 100),
                itemCount: items.length
            };
        } catch (error) {
            console.error('Error calculating storage usage:', error);
            const fallbackLimit = 2 * 1024 * 1024 * 1024;
            return {
                totalSize: fallbackLimit,
                usedSize: 0,
                freeSize: fallbackLimit,
                usagePercentage: 0,
                itemCount: 0
            };
        }
    };

    const loadStorageInfo = async () => {
        setIsLoading(true);
        try {
            console.log('Loading storage info...');
            const info = await calculateStorageUsage();
            setStorageInfo(info);
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

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleRefresh = (event: any) => {
        loadStorageInfo().then(() => {
            event.detail.complete();
        });
    };

    const getProgressBarColor = (percentage: number): string => {
        if (percentage < 70) return 'primary';
        if (percentage < 90) return 'warning';
        return 'danger';
    };

    const renderInfoList = (items: InfoItem[]) => (
        <IonList lines="none">
            {items.map((item, index) => (
                <IonItem key={index}>
                    <IonLabel>{item.label}</IonLabel>
                    {item.badge ? (
                        <IonBadge slot="end" color={item.color as any || 'primary'}>
                            {item.value}
                        </IonBadge>
                    ) : (
                        <IonNote slot={item.slot} color={item.color as any}>
                            {item.value}
                        </IonNote>
                    )}
                </IonItem>
            ))}
        </IonList>
    );

    const renderStorageItem = (item: StorageItem, index: number) => (
        <IonItem key={index}>
            <IonLabel>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                    <h3 style={{ wordBreak: 'break-all', margin: 0 }}>{item.key}</h3>
                    <IonBadge color="medium" style={{ marginLeft: '8px' }}>
                        {item.database}
                    </IonBadge>
                </div>
                <p><strong>Size:</strong> {formatBytes(item.size)}</p>
                {item.value && (
                    <p style={{ 
                        fontSize: '0.8em', 
                        color: '#666',
                        marginTop: '4px'
                    }}>
                        <strong>Content:</strong> {item.value}
                    </p>
                )}
            </IonLabel>
        </IonItem>
    );

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
                    {/* Storage Information Card */}
                    <IonCard color="light">
                        <IonCardHeader>
                            <IonCardTitle>Storage Information</IonCardTitle>
                        </IonCardHeader>
                        <IonCardContent>
                            {renderInfoList(getInfoItems())}
                        </IonCardContent>
                    </IonCard>

                    {/* Storage Overview Card */}
                    <IonCard>
                        <IonCardHeader>
                            <IonCardTitle>Local Storage Overview</IonCardTitle>
                        </IonCardHeader>
                        <IonCardContent>
                            <div className="ion-text-center ion-margin-bottom">
                                <IonText color="medium">
                                    <h2>{formatBytes(storageInfo.usedSize)} / {formatBytes(storageInfo.totalSize)}</h2>
                                </IonText>
                                <IonText color="medium">
                                    <p>{storageInfo.usagePercentage.toFixed(1)}% used</p>
                                </IonText>
                                <IonText color="success">
                                    <p style={{ fontSize: '0.9em' }}>
                                        🚀 Plenty of space available!
                                    </p>
                                </IonText>
                            </div>

                            <IonProgressBar 
                                value={storageInfo.usagePercentage / 100} 
                                color={getProgressBarColor(storageInfo.usagePercentage)}
                            />

                            <div className="ion-margin-top">
                                {renderInfoList(getStatsItems())}
                            </div>
                        </IonCardContent>
                    </IonCard>

                    {/* Storage Items List */}
                    {storageItems.length > 0 ? (
                        <IonCard>
                            <IonCardHeader>
                                <IonCardTitle>Storage Items ({storageItems.length})</IonCardTitle>
                            </IonCardHeader>
                            <IonCardContent>
                                <IonList>
                                    {storageItems.map(renderStorageItem)}
                                </IonList>
                            </IonCardContent>
                        </IonCard>
                    ) : (
                        !isLoading && (
                            <IonCard>
                                <IonCardContent className="ion-text-center">
                                    <IonText color="medium">
                                        <h3>No items in local storage</h3>
                                        <p>All storage instances are empty</p>
                                    </IonText>
                                </IonCardContent>
                            </IonCard>
                        )
                    )}

                    {isLoading && (
                        <IonCard>
                            <IonCardContent className="ion-text-center">
                                <IonText>
                                    <p>Loading storage information...</p>
                                </IonText>
                            </IonCardContent>
                        </IonCard>
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default Storage;