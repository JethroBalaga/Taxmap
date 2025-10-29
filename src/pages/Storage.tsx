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

// Create the same instance you're using in FormDataLocalStorage
const formDataStorage = localForage.createInstance({
  name: 'FormDataDB',
  storeName: 'form_data_store'
});

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
    const [formDataCount, setFormDataCount] = useState(0);

    const calculateStorageUsage = async (): Promise<StorageInfo> => {
        try {
            // Check both default localForage and your FormDataDB instance
            await localForage.ready();
            await formDataStorage.ready();
            
            const currentDriver = localForage.driver();
            setDriver(currentDriver);

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

            // Get keys from both storage instances
            const defaultKeys = await localForage.keys();
            const formDataKeys = await formDataStorage.keys();
            
            console.log('Default storage keys:', defaultKeys);
            console.log('FormDataDB keys:', formDataKeys);

            let totalSize = 0;
            const items: StorageItem[] = [];

            // Check default localForage instance
            for (const key of defaultKeys) {
                try {
                    const value = await localForage.getItem(key);
                    if (value !== null && value !== undefined) {
                        const jsonString = JSON.stringify(value);
                        const itemSize = new Blob([jsonString]).size;
                        totalSize += itemSize;
                        items.push({ 
                            key, 
                            size: itemSize,
                            database: 'Default',
                            value: typeof value === 'object' ? 'Object data' : String(value)
                        });
                    }
                } catch (error) {
                    console.warn(`Error processing default key ${key}:`, error);
                }
            }

            // Check FormDataDB instance (where your form data is stored)
            for (const key of formDataKeys) {
                try {
                    const value = await formDataStorage.getItem(key);
                    if (value !== null && value !== undefined) {
                        const jsonString = JSON.stringify(value);
                        const itemSize = new Blob([jsonString]).size;
                        totalSize += itemSize;
                        
                        // Format the display for form data
                        let displayValue = 'Form data';
                        if (key === 'formData' && Array.isArray(value)) {
                            displayValue = `${value.length} form records`;
                        }
                        
                        items.push({ 
                            key, 
                            size: itemSize,
                            database: 'FormDataDB',
                            value: displayValue
                        });
                    }
                } catch (error) {
                    console.warn(`Error processing FormDataDB key ${key}:`, error);
                }
            }

            // Get form data count from your FormDataLocalStorage
            try {
                const formData = await FormDataLocalStorage.getAllFormData();
                setFormDataCount(formData.length);
                console.log(`Found ${formData.length} form records`);
            } catch (error) {
                console.error('Error getting form data count:', error);
            }

            // Sort items by size (largest first)
            items.sort((a, b) => b.size - a.size);

            const usagePercentage = totalSize > 0 ? (totalSize / storageLimit) * 100 : 0;

            console.log('Storage calculation complete:', {
                totalItems: items.length,
                totalSize,
                storageLimit,
                usagePercentage
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
            // Fallback to 2GB on error
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
                    {/* Debug Info */}
                    <IonCard color="light">
                        <IonCardHeader>
                            <IonCardTitle>Storage Information</IonCardTitle>
                        </IonCardHeader>
                        <IonCardContent>
                            <IonList lines="none">
                                <IonItem>
                                    <IonLabel>Storage Driver</IonLabel>
                                    <IonNote slot="end">{driver || 'Unknown'}</IonNote>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Form Data Records</IonLabel>
                                    <IonBadge slot="end" color="primary">{formDataCount}</IonBadge>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Total Available</IonLabel>
                                    <IonNote slot="end" color="success">
                                        {formatBytes(storageInfo.totalSize)}
                                    </IonNote>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Status</IonLabel>
                                    <IonNote slot="end">{isLoading ? 'Loading...' : 'Ready'}</IonNote>
                                </IonItem>
                            </IonList>
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
                            ></IonProgressBar>

                            <div className="ion-margin-top">
                                <IonList lines="none">
                                    <IonItem>
                                        <IonLabel>Total Storage Items</IonLabel>
                                        <IonText slot="end">{storageInfo.itemCount}</IonText>
                                    </IonItem>
                                    <IonItem>
                                        <IonLabel>Form Data Records</IonLabel>
                                        <IonText slot="end">{formDataCount}</IonText>
                                    </IonItem>
                                    <IonItem>
                                        <IonLabel>Used Space</IonLabel>
                                        <IonText slot="end">{formatBytes(storageInfo.usedSize)}</IonText>
                                    </IonItem>
                                    <IonItem>
                                        <IonLabel>Free Space</IonLabel>
                                        <IonText slot="end" color="success">{formatBytes(storageInfo.freeSize)}</IonText>
                                    </IonItem>
                                </IonList>
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
                                    {storageItems.map((item, index) => (
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
                                    ))}
                                </IonList>
                            </IonCardContent>
                        </IonCard>
                    ) : (
                        !isLoading && (
                            <IonCard>
                                <IonCardContent className="ion-text-center">
                                    <IonText color="medium">
                                        <h3>No items in local storage</h3>
                                        <p>Both default and FormDataDB storage are empty</p>
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