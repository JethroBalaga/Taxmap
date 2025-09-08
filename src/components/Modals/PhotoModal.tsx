// src/components/Modals/PhotoModal.tsx
import React, { useState } from 'react';
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
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
  IonText
} from '@ionic/react';
import { close, camera, informationCircle, location, locationOutline, warning } from 'ionicons/icons';
import { FormData } from './Form';
import { BuildingData } from './BuildingModal';
import SubmitButton from '../../components/GlobalComponent/SubmitButton';
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import { BuildingDataLocalStorage } from '../../utils/tablestorages/BuildingDataLocalStorage';
import { PhotoTagLocalStorage } from '../../utils/tablestorages/PhotoTagLocalStorage';
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import '../../CSS/modal.css';

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoTaken: (photo: string) => void;
  formData?: FormData;
  buildingData?: BuildingData;
  onSubmit?: (photo: string, formData: FormData, buildingData: BuildingData) => Promise<void>;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ 
  isOpen, 
  onClose, 
  onPhotoTaken, 
  formData, 
  buildingData,
  onSubmit 
}) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number; accuracy: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

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
        setLocationError(null);
        // Get location when photo is taken
        await getCurrentLocation();
      } else {
        setError('No photo was taken.');
      }
    } catch (err) {
      setError('Failed to capture photo: ' + (err as Error).message);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      setLocationError(null);
      
      // Use the EXACT same pattern as your working GeoTag code
      const position = await Geolocation.getCurrentPosition();
      
      if (!position?.coords) {
        throw new Error('Unable to get GPS coordinates');
      }

      setCurrentLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
      
    } catch (err: any) {
      console.warn('Location error:', err);
      
      // Use simpler error handling like your working code
      let errorMessage = 'Could not get location. Photo will be saved without coordinates.';
      
      if (err.message?.includes('permission')) {
        errorMessage = 'Location access denied. Please enable location permissions.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Location request timed out. Please try again.';
      }
      
      setLocationError(errorMessage);
      setCurrentLocation(null);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleClose = () => {
    setPhoto(null);
    setError(null);
    setLocationError(null);
    setIsSubmitting(false);
    setIsGettingLocation(false);
    setCurrentLocation(null);
    onClose();
  };

  const generateFileName = (): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substr(2, 6);
    return `building_${timestamp}_${random}.jpg`;
  };

  const getFileSize = (dataURL: string): number => {
    const base64 = dataURL.split(',')[1];
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    return (base64.length * 3) / 4 - padding;
  };

  const handleSubmit = async () => {
    if (!photo) {
      setError('Please take a photo first');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Generate unique filename and photo path
      const fileName = generateFileName();
      const photoPath = `../phototags/${fileName}`;
      
      let savedFormData = null;
      let savedBuildingData = null;
      let photoTag = null;
      let valueInfo = null;

      // 1. Store FormData if provided and get the saved object with generated ID
      if (formData) {
        savedFormData = FormDataLocalStorage.saveFormData(formData);
        console.log('Form data saved with ID:', savedFormData.id);
      }
      
      // 2. Store PhotoTag with location data and get the generated ID
      photoTag = PhotoTagLocalStorage.addPhotoTag({
        photoPath,
        longitude: currentLocation?.longitude || 0,
        latitude: currentLocation?.latitude || 0,
        accuracy: currentLocation?.accuracy,
        timestamp: new Date()
      });
      console.log('Photo tag saved with ID:', photoTag.id);

      // 3. Create ValueInfo entry to link FormData and PhotoTag if both exist
      if (savedFormData && photoTag) {
        valueInfo = ValueInfoLocalStorage.addValueInfo({
          formDataId: savedFormData.id,
          photoTagId: photoTag.id,
          status: 'pending'
        });
        console.log('ValueInfo created with ID:', valueInfo.id);

        // 4. Store BuildingData with ValueInfo ID reference if building data exists
        if (buildingData && valueInfo) {
          savedBuildingData = BuildingDataLocalStorage.saveBuildingData({
            ...buildingData,
            valueInfoId: valueInfo.id
          });
          console.log('Building data saved with ValueInfo reference:', valueInfo.id);
        }
      }

      // Call the provided onSubmit callback if available
      if (onSubmit && formData && buildingData) {
        await onSubmit(photo, formData, buildingData);
      } else {
        onPhotoTaken(photo);
      }
      
      handleClose();
      
    } catch (err) {
      setError('Submission failed: ' + (err as Error).message);
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    setError(null);
    setLocationError(null);
    setCurrentLocation(null);
  };

  const formatCoordinates = (lat: number, lng: number): string => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
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
              <p className="input-label">
                Building Photo <span style={{ color: 'red' }}>*</span>
              </p>
              
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
                    <span className="info-label">Location:</span>
                    <div className="info-value">
                      {isGettingLocation ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <IonSpinner name="dots" style={{ width: '16px', height: '16px' }} />
                          <span>Getting location...</span>
                        </div>
                      ) : currentLocation ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={location} color="success" style={{ fontSize: '14px' }} />
                          <span>{formatCoordinates(currentLocation.latitude, currentLocation.longitude)}</span>
                          <IonText color="medium" style={{ fontSize: '12px' }}>
                            (±{currentLocation.accuracy?.toFixed(1)}m)
                          </IonText>
                        </div>
                      ) : locationError ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={warning} color="warning" style={{ fontSize: '14px' }} />
                          <span style={{ fontSize: '12px', color: 'var(--ion-color-warning)' }}>
                            No location data
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={locationOutline} color="medium" style={{ fontSize: '14px' }} />
                          <span>Location not requested</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {locationError && (
                    <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                      <span className="info-label">Location Error:</span>
                      <span className="info-value" style={{ color: 'var(--ion-color-warning)', fontSize: '12px' }}>
                        {locationError}
                      </span>
                    </div>
                  )}
                  
                  <div className="info-item">
                    <span className="info-label">Size:</span>
                    <span className="info-value">
                      {photo ? `${(getFileSize(photo) / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">File Path:</span>
                    <span className="info-value" style={{ fontSize: '12px' }}>
                      ../phototags/{generateFileName()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="photo-actions-single">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <SubmitButton
                    onClick={handleSubmit}
                    disabled={isSubmitting || isGettingLocation}
                    loading={isSubmitting}
                  />
                </div>
                
                {(!currentLocation && !isGettingLocation) && (
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <IonButton 
                      onClick={getCurrentLocation}
                      size="small"
                      fill="outline"
                      color="medium"
                      disabled={isSubmitting}
                    >
                      <IonIcon icon={locationOutline} slot="start" />
                      {locationError ? 'Retry Location' : 'Get Location'}
                    </IonButton>
                  </div>
                )}
                
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