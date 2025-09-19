// src/components/MapMarkerPopup.tsx
import React from 'react';
import { FormDataLocalStorage } from '../utils/tablestorages/FormDataLocalStorage';
import { PhotoTagLocalStorage } from '../utils/tablestorages/PhotoTagLocalStorage';
import { ValueInfoLocalStorage } from '../utils/tablestorages/ValueInfoLocalStorage';
import { 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle, 
  IonImg, 
  IonText, 
  IonButton,
  IonIcon 
} from '@ionic/react';
import { close } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

interface MapMarkerPopupProps {
  photoTagId: string;
  onClose: () => void;
}

const MapMarkerPopup: React.FC<MapMarkerPopupProps> = ({ photoTagId, onClose }) => {
  const [photoData, setPhotoData] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<any>(null);
  const [photoTag, setPhotoTag] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Get the photo tag
        const tag = PhotoTagLocalStorage.getPhotoTag(photoTagId);
        if (!tag) {
          setLoading(false);
          return;
        }
        
        setPhotoTag(tag);

        // Get the associated value info
        const valueInfo = ValueInfoLocalStorage.getValueInfoByPhotoTagId(photoTagId);
        if (valueInfo) {
          // Get the form data
          const form = FormDataLocalStorage.getFormData(valueInfo.formDataId);
          if (form) {
            setFormData(form);
          }
        }

        // Load the photo - handle both mobile and browser storage
        if (Capacitor.isNativePlatform()) {
          // Mobile - read from filesystem
          try {
            const file = await Filesystem.readFile({
              path: `phototags/${tag.photoName}`,
              directory: Directory.Data
            });
            setPhotoData(`data:image/jpeg;base64,${file.data}`);
          } catch (error) {
            console.warn('Could not load photo from filesystem:', error);
          }
        } else {
          // Browser - read from localStorage
          const photoKey = `photo_${tag.photoName}`;
          const storedPhoto = localStorage.getItem(photoKey);
          if (storedPhoto) {
            setPhotoData(storedPhoto);
          }
        }
      } catch (error) {
        console.error('Error loading marker data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (photoTagId) {
      loadData();
    }
  }, [photoTagId]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <IonCard style={{ margin: 0, maxWidth: '300px' }}>
        <IonCardContent>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Loading...</p>
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  if (!photoTag) {
    return (
      <IonCard style={{ margin: 0, maxWidth: '300px' }}>
        <IonCardContent>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>No data found for this marker</p>
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <IonCard style={{ margin: 0, maxWidth: '300px' }}>
      <IonCardHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <IonCardTitle style={{ fontSize: '16px' }}>Property Details</IonCardTitle>
          <IonButton fill="clear" size="small" onClick={onClose}>
            <IonIcon icon={close} />
          </IonButton>
        </div>
      </IonCardHeader>
      
      <IonCardContent>
        {/* Photo */}
        {photoData ? (
          <div style={{ marginBottom: '15px' }}>
            <IonImg 
              src={photoData} 
              alt="Property photo" 
              style={{ borderRadius: '8px', maxHeight: '200px', objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div style={{ 
            marginBottom: '15px', 
            height: '150px', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666'
          }}>
            Photo not available
          </div>
        )}

        {/* Form Data */}
        {formData ? (
          <div style={{ marginBottom: '10px' }}>
            <IonText>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Form ID:</strong> {formData.id.substring(0, 8)}...
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Kind:</strong> {formData.kind}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Classification:</strong> {formData.classification}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Area:</strong> {formData.area} m²
              </p>
            </IonText>
          </div>
        ) : (
          <div style={{ marginBottom: '10px' }}>
            <IonText>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                No form data associated
              </p>
            </IonText>
          </div>
        )}

        {/* Photo Tag Info */}
        <div>
          <IonText>
            <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
              <strong>Date Taken:</strong> {formatDate(photoTag.timestamp)}
            </p>
            <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
              <strong>Location:</strong> {photoTag.latitude.toFixed(6)}, {photoTag.longitude.toFixed(6)}
            </p>
            {photoTag.accuracy && (
              <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                <strong>Accuracy:</strong> ±{photoTag.accuracy.toFixed(1)}m
              </p>
            )}
          </IonText>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default MapMarkerPopup;