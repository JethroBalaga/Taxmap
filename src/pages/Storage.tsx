import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonMenuButton,
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
    IonText
} from '@ionic/react';
import { refreshOutline } from 'ionicons/icons';
import localForage from 'localforage';

interface StorageInfo {
    totalSize: number;
    usedSize: number;
    freeSize: number;
    usagePercentage: number;
    itemCount: number;
}

const Storage: React.FC = () => {
    const [storageInfo, setStorageInfo] = useState<StorageInfo>({
        totalSize: 0,
        usedSize: 0,
        freeSize: 0,
        usagePercentage: 0,
        itemCount: 0
    });
    const [storageItems, setStorageItems] = useState<Array<{ key: string, size: number }>>([]);
    const [isLoading, setIsLoading] = useState(false);

    const calculateStorageUsage = async (): Promise<StorageInfo> => {
        try {
            const keys = await localForage.keys();
            let totalSize = 0;
            const items = [];

            // Calculate size for each item
            for (const key of keys) {
                try {
                    const value = await localForage.getItem(key);
                    if (value !== null && value !== undefined) {
                        const itemSize = new Blob([JSON.stringify(value)]).size;
                        totalSize += itemSize;
                        items.push({ key, size: itemSize });
                    }
                } catch (error) {
                    console.warn(`Error processing key ${key}:`, error);
                }
            }

            // Sort items by size (largest first)
            items.sort((a, b) => b.size - a.size);

            // For localForage, typical limits are 5-50MB depending on browser
            // Using 50MB as a reasonable estimate
            const estimatedLimit = 50 * 1024 * 1024; // 50MB in bytes
            const usagePercentage = (totalSize / estimatedLimit) * 100;

            setStorageItems(items);

            return {
                totalSize: estimatedLimit,
                usedSize: totalSize,
                freeSize: Math.max(0, estimatedLimit - totalSize),
                usagePercentage: Math.min(usagePercentage, 100),
                itemCount: keys.length
            };
        } catch (error) {
            console.error('Error calculating storage usage:', error);
            return {
                totalSize: 0,
                usedSize: 0,
                freeSize: 0,
                usagePercentage: 0,
                itemCount: 0
            };
        }
    };

    const loadStorageInfo = async () => {
        setIsLoading(true);
        try {
            const info = await calculateStorageUsage();
            setStorageInfo(info);
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
                            </div>

                            <IonProgressBar 
                                value={storageInfo.usagePercentage / 100} 
                                color={getProgressBarColor(storageInfo.usagePercentage)}
                            ></IonProgressBar>

                            <div className="ion-margin-top">
                                <IonList lines="none">
                                    <IonItem>
                                        <IonLabel>Total Items Stored</IonLabel>
                                        <IonText slot="end">{storageInfo.itemCount}</IonText>
                                    </IonItem>
                                    <IonItem>
                                        <IonLabel>Used Space</IonLabel>
                                        <IonText slot="end">{formatBytes(storageInfo.usedSize)}</IonText>
                                    </IonItem>
                                    <IonItem>
                                        <IonLabel>Available Space</IonLabel>
                                        <IonText slot="end">{formatBytes(storageInfo.freeSize)}</IonText>
                                    </IonItem>
                                </IonList>
                            </div>
                        </IonCardContent>
                    </IonCard>

                    {/* Storage Items List */}
                    {storageItems.length > 0 && (
                        <IonCard>
                            <IonCardHeader>
                                <IonCardTitle>Stored Items ({storageItems.length})</IonCardTitle>
                            </IonCardHeader>
                            <IonCardContent>
                                <IonList>
                                    {storageItems.map((item, index) => (
                                        <IonItem key={index}>
                                            <IonLabel>
                                                <h3>{item.key}</h3>
                                                <p>{formatBytes(item.size)}</p>
                                            </IonLabel>
                                        </IonItem>
                                    ))}
                                </IonList>
                            </IonCardContent>
                        </IonCard>
                    )}

                    {/* No Items Message - This should rarely show if you're using localForage */}
                    {storageItems.length === 0 && !isLoading && (
                        <IonCard>
                            <IonCardContent className="ion-text-center">
                                <IonText color="medium">
                                    <h3>No items in local storage</h3>
                                    <p>LocalForage storage is currently empty</p>
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