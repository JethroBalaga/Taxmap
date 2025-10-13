import React from 'react';
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
import { close, camera, informationCircle, location, locationOutline, warning, compass } from 'ionicons/icons';
import { FormData } from './Form';
import { BuildingData } from './BuildingModal';
import { MachineData } from './MachineModal';
import { AgriculturalLandAdjustmentData } from './AgriculturalLandAdjustmentModal';
import SubmitButton from '../../components/GlobalComponent/SubmitButton';
import { usePhotoModal } from './usePhotoModal';
import { formatCoordinates, formatDataForDisplay, getFileSize } from '../../utils/photoModalUtils';
import '../../CSS/modal.css';

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoTaken: (photo: string) => void;
  formData?: FormData;
  buildingData?: BuildingData;
  machineData?: MachineData | null;
  agriculturalData?: AgriculturalLandAdjustmentData | null;
  onSubmit?: (photo: string, formData: FormData, buildingData: BuildingData, machineData: MachineData, agriculturalData: AgriculturalLandAdjustmentData) => Promise<void>;
  onCompleteSubmission?: () => void;
}

const PhotoModal: React.FC<PhotoModalProps> = ({
  isOpen,
  onClose,
  onPhotoTaken,
  formData,
  buildingData,
  machineData,
  agriculturalData,
  onSubmit,
  onCompleteSubmission
}) => {
  const {
    photo,
    error,
    isSubmitting,
    isGettingLocation,
    currentLocation,
    adjustedLocation,
    locationError,
    storedData,
    showConfirmToast,
    toastMessage,
    toastButtons,
    photoName,
    hasAttemptedLocation,
    takePhoto,
    getCurrentLocation,
    handleClose,
    handleSubmit,
    retakePhoto,
    setError,
    setShowConfirmToast
  } = usePhotoModal({
    isOpen,
    onClose,
    onPhotoTaken,
    formData,
    buildingData,
    machineData,
    agriculturalData,
    onSubmit,
    onCompleteSubmission
  });

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="custom-wide-modal">
      <IonHeader>
        <IonToolbar className="fancy-header">
          <IonTitle className="fancy-title">
            {machineData ? 'Take Machine Photo' : buildingData ? 'Take Building Photo' : agriculturalData ? 'Take Agricultural Land Photo' : 'Take Photo'}
          </IonTitle>
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

                {storedData.buildingData && (
                  <IonItem lines="none">
                    <IonLabel>
                      <strong>Building Data:</strong>
                      <pre style={{ fontSize: '10px', overflow: 'auto' }}>
                        {formatDataForDisplay(storedData.buildingData)}
                      </pre>
                    </IonLabel>
                  </IonItem>
                )}

                {storedData.machineData && (
                  <IonItem lines="none">
                    <IonLabel>
                      <strong>Machine Data:</strong>
                      <pre style={{ fontSize: '10px', overflow: 'auto' }}>
                        {formatDataForDisplay(storedData.machineData)}
                      </pre>
                    </IonLabel>
                  </IonItem>
                )}

                {storedData.agriculturalData && (
                  <IonItem lines="none">
                    <IonLabel>
                      <strong>Agricultural Data:</strong>
                      <pre style={{ fontSize: '10px', overflow: 'auto' }}>
                        {formatDataForDisplay(storedData.agriculturalData)}
                      </pre>
                    </IonLabel>
                  </IonItem>
                )}

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
                {machineData ? 'Machine Photo' : buildingData ? 'Building Photo' : agriculturalData ? 'Agricultural Land Photo' : 'Photo'} <span style={{ color: 'red' }}>*</span>
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
                {machineData
                  ? 'Tap to take a photo of the machine'
                  : buildingData
                    ? 'Tap to take a photo of the building'
                    : agriculturalData
                      ? 'Tap to take a photo of the agricultural land'
                      : 'Tap to take a photo'
                }
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
                    <span className="info-label">Original Location:</span>
                    <div className="info-value">
                      {isGettingLocation ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <IonSpinner name="dots" style={{ width: '16px', height: '16px' }} />
                          <span>Getting location...</span>
                        </div>
                      ) : currentLocation ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={location} color="medium" style={{ fontSize: '14px' }} />
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
                          <span>Location not captured yet</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {adjustedLocation && (
                    <div className="info-item">
                      <span className="info-label">Adjusted Location:</span>
                      <div className="info-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IonIcon icon={compass} color="success" style={{ fontSize: '14px' }} />
                        <span>{formatCoordinates(adjustedLocation.latitude, adjustedLocation.longitude)}</span>
                        <IonText color="success" style={{ fontSize: '12px' }}>
                          (Corrected)
                        </IonText>
                      </div>
                    </div>
                  )}

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
                    <span className="info-label">File Name:</span>
                    <span className="info-value" style={{ fontSize: '12px' }}>
                      {photoName}
                    </span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Storage Path:</span>
                    <span className="info-value" style={{ fontSize: '12px' }}>
                      data/phototags/
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
                        disabled={isSubmitting || isGettingLocation || !hasAttemptedLocation}
                        loading={isSubmitting}
                      />
                    </div>

                    {!hasAttemptedLocation ? (
                      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <IonButton
                          onClick={getCurrentLocation}
                          size="default"
                          color="primary"
                          disabled={isSubmitting}
                        >
                          <IonIcon icon={locationOutline} slot="start" />
                          Capture Location
                        </IonButton>
                        <p style={{ fontSize: '12px', color: 'var(--ion-color-medium)', marginTop: '8px' }}>
                          Please capture your current location before submitting
                        </p>
                      </div>
                    ) : !currentLocation && (
                      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <IonButton
                          onClick={getCurrentLocation}
                          size="small"
                          color="medium"
                          disabled={isSubmitting}
                        >
                          <IonIcon icon={locationOutline} slot="start" />
                          Retry Location
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
            color="warning"
          />
        </div>
      </IonContent>
    </IonModal>
  );
};

export default PhotoModal;