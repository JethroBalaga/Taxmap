// src/components/Storage/StorageCards.tsx

import React from 'react';
import {
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonProgressBar,
    IonList,
    IonItem,
    IonLabel,
    IonText,
    IonNote,
    IonBadge
} from '@ionic/react';
import { StorageInfo, InfoItem, StorageItem, StorageRecordCount } from '../utils/PageUtils/StorageTypes';
import { formatBytes, getProgressBarColor } from '../utils/PageUtils/StorageUtils';

interface StorageCardsProps {
  storageInfo: StorageInfo;
  recordCounts: StorageRecordCount[];
  storageItems: StorageItem[];
  isLoading: boolean;
  driver: string;
}

export const InfoCard: React.FC<{ 
  title: string; 
  items: InfoItem[];
  color?: string;
}> = ({ title, items, color }) => (
  <IonCard color={color}>
    <IonCardHeader>
      <IonCardTitle>{title}</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <InfoList items={items} />
    </IonCardContent>
  </IonCard>
);

export const InfoList: React.FC<{ items: InfoItem[] }> = ({ items }) => (
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

export const StorageOverviewCard: React.FC<{ 
  storageInfo: StorageInfo;
}> = ({ storageInfo }) => {
  const statsItems: InfoItem[] = [
    { label: 'Total Storage Items', value: storageInfo.itemCount, slot: 'end' },
    { label: 'Used Space', value: formatBytes(storageInfo.usedSize), slot: 'end' },
    { label: 'Free Space', value: formatBytes(storageInfo.freeSize), slot: 'end', color: 'success' }
    // Removed the redundant record counts - they're already in Storage Information
  ];

  return (
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
          <InfoList items={statsItems} />
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export const StorageItemsCard: React.FC<{ 
  storageItems: StorageItem[];
  isLoading: boolean;
}> = ({ storageItems, isLoading }) => {
  if (isLoading) {
    return (
      <IonCard>
        <IonCardContent className="ion-text-center">
          <IonText>
            <p>Loading storage information...</p>
          </IonText>
        </IonCardContent>
      </IonCard>
    );
  }

  if (storageItems.length === 0) {
    return (
      <IonCard>
        <IonCardContent className="ion-text-center">
          <IonText color="medium">
            <h3>No items in local storage</h3>
            <p>All storage instances are empty</p>
          </IonText>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
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
  );
};