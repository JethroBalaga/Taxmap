// src/components/Modals/PhotoModal.tsx
import React, { useState } from 'react';
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { 
  IonButton, 
  IonImg, 
  IonContent, 
  IonModal, 
  IonAlert, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonIcon,
  IonSpinner
} from '@ionic/react';
import { close, camera } from 'ionicons/icons';
import { FormData } from './Form';
import { BuildingData } from './BuildingModal';

// Define interface for building info data
interface BuildingInfoData {
    adjustment: string;
    actualUse: string;
    assessmentLevel: string;
}

// Update the interface to include the new props
interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoTaken: (photo: string) => void;
  formData?: FormData;
  buildingData?: BuildingData;
  buildingInfoData?: BuildingInfoData;
  onSubmit?: (photo: string, formData: FormData, buildingData: BuildingData, buildingInfoData: BuildingInfoData) => Promise<void>;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ 
  isOpen, 
  onClose, 
  onPhotoTaken, 
  formData, 
  buildingData, 
  buildingInfoData,
  onSubmit 
}) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        direction: CameraDirection.Rear,
      });

      if (image.dataUrl) {
        setPhoto(image.dataUrl);
        setError(null);
      } else {
        setError('No photo was taken.');
      }
    } catch (err) {
      setError('Failed to capture photo: ' + (err as Error).message);
    }
  };

  const handleClose = () => {
    setPhoto(null);
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!photo) {
      setError('Please take a photo first');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (onSubmit && formData && buildingData && buildingInfoData) {
        // Use custom submit handler if provided with all data
        await onSubmit(photo, formData, buildingData, buildingInfoData);
      } else {
        // Default behavior - just pass the photo
        onPhotoTaken(photo);
      }
      
      // Close after successful submission
      handleClose();
      
    } catch (err) {
      setError('Submission failed: ' + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    setError(null);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Take Building Photo</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClose} disabled={isSubmitting}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {error && (
          <IonAlert
            isOpen={!!error}
            message={error}
            buttons={['OK']}
            onDidDismiss={() => setError(null)}
          />
        )}

        {!photo ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <IonButton 
              onClick={takePhoto}
              disabled={isSubmitting}
              size="large"
              style={{ '--border-radius': '50%', width: '80px', height: '80px' }}
              fill="solid"
              color="primary"
            >
              <IonIcon icon={camera} size="large" />
            </IonButton>
            <p style={{ marginTop: '20px', color: 'var(--ion-color-medium)' }}>
              Tap to take a photo of the building
            </p>
          </div>
        ) : (
          <>
            <div style={{ 
              marginTop: '20px',
              width: '100%',
              height: '300px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <IonImg 
                src={photo} 
                alt="Captured photo" 
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  border: '2px solid var(--ion-color-primary)',
                  borderRadius: '8px'
                }} 
              />
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <IonButton 
                expand="block" 
                onClick={retakePhoto}
                disabled={isSubmitting}
                color="medium"
                fill="outline"
              >
                Retake Photo
              </IonButton>
              
              <IonButton 
                expand="block" 
                onClick={handleSubmit}
                disabled={isSubmitting}
                color="primary"
              >
                {isSubmitting ? (
                  <>
                    <IonSpinner name="crescent" slot="start" />
                    Submitting...
                  </>
                ) : (
                  'Use This Photo'
                )}
              </IonButton>
            </div>
          </>
        )}
      </IonContent>
    </IonModal>
  );
};

export default PhotoModal;