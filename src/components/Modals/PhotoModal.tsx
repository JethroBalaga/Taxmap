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
  IonSpinner,
  IonItem,
  IonLabel
} from '@ionic/react';
import { close, camera, informationCircle } from 'ionicons/icons';
import { FormData } from './Form';
import { BuildingData } from './BuildingModal';
import '../../CSS/modal.css';

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
    <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="custom-wide-modal">
      <IonHeader>
        <IonToolbar className="fancy-header">
          <IonTitle className="fancy-title">Take Building Photo</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClose} disabled={isSubmitting} className="fancy-close-btn">
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="modal-content">
        <div className="form-container">
          {error && (
            <IonAlert
              isOpen={!!error}
              message={error}
              buttons={['OK']}
              onDidDismiss={() => setError(null)}
            />
          )}

          {!photo ? (
            <div className="photo-placeholder" style={{ textAlign: 'center', padding: '40px 0' }}>
              <IonItem className="custom-input" lines="none">
                <IonLabel className="input-label">
                  Building Photo <span style={{ color: 'red' }}>*</span>
                </IonLabel>
              </IonItem>
              
              <IonButton 
                onClick={takePhoto}
                disabled={isSubmitting}
                size="large"
                className="camera-button"
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
              <div className="photo-preview-container">
                <IonImg 
                  src={photo} 
                  alt="Captured photo" 
                  className="captured-photo"
                />
              </div>

              <div className="photo-info-section">
                <div className="info-header">
                  <IonIcon icon={informationCircle} className="info-icon" />
                  <span>Photo Information</span>
                </div>
                
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Status:</span>
                    <span className="info-value">Captured</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Size:</span>
                    <span className="info-value">Approx. 2.5 MB</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Resolution:</span>
                    <span className="info-value">1920×1080</span>
                  </div>
                </div>
              </div>

              <div className="photo-actions-single">
                <IonButton 
                  expand="block" 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  color="primary"
                  className="save-info-button"
                >
                  {isSubmitting ? (
                    <>
                      <IonSpinner name="crescent" slot="start" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <IonIcon icon={informationCircle} slot="start" />
                      Save Info
                    </>
                  )}
                </IonButton>
                
                <div className="retake-link">
                  <button onClick={retakePhoto} disabled={isSubmitting}>
                    Retake Photo
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default PhotoModal;