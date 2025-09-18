import React, { useState, useEffect } from 'react';
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
  IonText,
  IonItem,
  IonLabel,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonToast
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
  onCompleteSubmission?: () => void;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ 
  isOpen, 
  onClose, 
  onPhotoTaken, 
  formData, 
  buildingData,
  onSubmit,
  onCompleteSubmission 
}) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number; accuracy: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [storedData, setStoredData] = useState<{
    formData: any;
    buildingData: any;
    photoTag: any;
    valueInfo: any;
  } | null>(null);
  const [showConfirmToast, setShowConfirmToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastButtons, setToastButtons] = useState<any[]>([]);

  // Log the data when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('PhotoModal opened with formData:', formData);
      console.log('PhotoModal opened with buildingData:', buildingData);
      setStoredData(null);
    }
  }, [isOpen, formData, buildingData]);

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
    setStoredData(null);
    setShowConfirmToast(false);
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

  const performSubmission = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const fileName = generateFileName();
      const photoPath = `../phototags/${fileName}`;
      
      let savedFormData = null;
      let savedBuildingData = null;
      let photoTag = null;
      let valueInfo = null;

      // 1. Store FormData
      if (formData) {
        savedFormData = FormDataLocalStorage.saveFormData(formData);
        console.log('Form data saved:', savedFormData);
      }
      
      // 2. Store PhotoTag
      photoTag = PhotoTagLocalStorage.addPhotoTag({
        photoPath,
        longitude: currentLocation?.longitude || 0,
        latitude: currentLocation?.latitude || 0,
        accuracy: currentLocation?.accuracy,
        timestamp: new Date()
      });
      console.log('Photo tag saved:', photoTag);

      // 3. Create ValueInfo entry
      if (savedFormData && photoTag) {
        valueInfo = ValueInfoLocalStorage.addValueInfo({
          formDataId: savedFormData.id,
          photoTagId: photoTag.id,
        });
        console.log('ValueInfo created:', valueInfo);

        // 4. Store BuildingData
        if (buildingData && valueInfo) {
          savedBuildingData = BuildingDataLocalStorage.saveBuildingData({
            ...buildingData,
            valueInfoId: valueInfo.id
          });
          console.log('Building data saved:', savedBuildingData);
        }
      }

      // Store all data for display
      setStoredData({
        formData: savedFormData,
        buildingData: savedBuildingData,
        photoTag: photoTag,
        valueInfo: valueInfo
      });

      // Call callbacks
      if (onSubmit && formData && buildingData) {
        await onSubmit(photo!, formData, buildingData);
      } else {
        onPhotoTaken(photo!);
      }
      
      if (onCompleteSubmission) {
        onCompleteSubmission();
      }
      
      // Show success message
      setToastMessage('Data successfully saved!');
      setToastButtons([{ text: 'OK', role: 'cancel' }]);
      setShowConfirmToast(true);
      
    } catch (err) {
      setError('Submission failed: ' + (err as Error).message);
      console.error('Submission error:', err);
      
      // Show error message
      setToastMessage('Error saving data: ' + (err as Error).message);
      setToastButtons([{ text: 'OK', role: 'cancel' }]);
      setShowConfirmToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!photo) {
      setError('Please take a photo first');
      return;
    }

    // Show confirmation toast instead of immediately submitting
    setToastMessage('Are you sure you want to submit this photo and save all data?');
    setToastButtons([
      {
        text: 'No',
        role: 'cancel',
        handler: () => {
          console.log('Submission cancelled');
        }
      },
      {
        text: 'Yes',
        handler: async () => {
          await performSubmission();
        }
      }
    ]);
    setShowConfirmToast(true);
  };

  const retakePhoto = () => {
    setPhoto(null);
    setError(null);
    setLocationError(null);
    setCurrentLocation(null);
    setStoredData(null);
  };

  const formatCoordinates = (lat: number, lng: number): string => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const formatDataForDisplay = (data: any): string => {
    if (!data) return 'No data';
    return JSON.stringify(data, null, 2);
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

          {/* Stored Data Display */}
          {storedData && (
            <IonCard style={{ marginBottom: '15px' }}>
              <IonCardHeader>
                <IonCardTitle>Data Successfully Stored</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonItem lines="none">
                  <IonLabel>
                    <strong>Form Data:</strong>
                    <pre style={{ fontSize: '10px', overflow: 'auto' }}>
                      {formatDataForDisplay(storedData.formData)}
                    </pre>
                  </IonLabel>
                </IonItem>
                <IonItem lines="none">
                  <IonLabel>
                    <strong>Building Data:</strong>
                    <pre style={{ fontSize: '10px', overflow: 'auto' }}>
                      {formatDataForDisplay(storedData.buildingData)}
                    </pre>
                  </IonLabel>
                </IonItem>
                <IonItem lines="none">
                  <IonLabel>
                    <strong>Photo Tag:</strong>
                    <pre style={{ fontSize: '10px', overflow: 'auto' }}>
                      {formatDataForDisplay(storedData.photoTag)}
                    </pre>
                  </IonLabel>
                </IonItem>
                <IonItem lines="none">
                  <IonLabel>
                    <strong>Value Info:</strong>
                    <pre style={{ fontSize: '10px', overflow: 'auto' }}>
                      {formatDataForDisplay(storedData.valueInfo)}
                    </pre>
                  </IonLabel>
                </IonItem>
              </IonCardContent>
            </IonCard>
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
                    <span className="info-value">{storedData ? 'Stored' : 'Ready to Submit'}</span>
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
                {!storedData ? (
                  <>
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
                  </>
                ) : (
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <IonButton 
                      onClick={handleClose}
                      size="default"
                      fill="solid"
                      color="success"
                    >
                      Close
                    </IonButton>
                  </div>
                )}
                
                <div className="retake-link">
                  <button onClick={retakePhoto} disabled={isSubmitting}>
                    {storedData ? 'Take New Photo' : 'Retake Photo'}
                  </button>
                </div>
              </div>
            </>
          )}

          <IonToast
            isOpen={showConfirmToast}
            onDidDismiss={() => setShowConfirmToast(false)}
            message={toastMessage}
            duration={toastButtons.length === 1 ? 3000 : 0}
            buttons={toastButtons}
            position="middle"
          />
        </div>
      </IonContent>
    </IonModal>
  );
};

export default PhotoModal;