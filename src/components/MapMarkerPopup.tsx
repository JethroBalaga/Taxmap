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
  IonIcon,
  IonSpinner
} from '@ionic/react';
import { close, eye } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { useHistory } from 'react-router-dom';
import '../CSS/MapMarkerPopup.css';

interface MapMarkerPopupProps {
  photoTagId: string;
  onClose: () => void;
}

const MapMarkerPopup: React.FC<MapMarkerPopupProps> = ({ photoTagId, onClose }) => {
  const [photoData, setPhotoData] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<any>(null);
  const [photoTag, setPhotoTag] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const history = useHistory();

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

  const handleViewDetails = () => {
    if (formData && formData.id) {
      // Close the popup before navigating
      onClose();
      // Navigate to the forms page and pass the form ID as a query parameter
      history.push({
        pathname: '/menu/forms',
        search: `?selectedFormId=${formData.id}`
      });
    }
  };

  if (loading) {
    return (
      <div className="map-marker-popup-container">
        <IonCard className="map-marker-popup-card">
          <IonCardContent>
            <div className="popup-loading">
              <IonSpinner name="crescent" />
              <p>Loading property details...</p>
            </div>
          </IonCardContent>
        </IonCard>
      </div>
    );
  }

  if (!photoTag) {
    return (
      <div className="map-marker-popup-container">
        <IonCard className="map-marker-popup-card">
          <IonCardContent>
            <div className="popup-error">
              <p>No data found for this marker</p>
            </div>
          </IonCardContent>
        </IonCard>
      </div>
    );
  }

  return (
    <div className="map-marker-popup-container">
      <IonCard className="map-marker-popup-card">
        <IonCardHeader className="popup-header">
          <div className="popup-header-content">
            <IonCardTitle className="popup-title">Property Details</IonCardTitle>
            <IonButton
              fill="clear"
              size="small"
              onClick={onClose}
              className="popup-close-btn"
            >
              <IonIcon icon={close} slot="icon-only" />
            </IonButton>
          </div>
        </IonCardHeader>

        <IonCardContent className="popup-content">
          {/* Photo with fixed size container */}
          {photoData ? (
            <div className="popup-photo-container">
              <IonImg
                src={photoData}
                alt="Property photo"
                className="popup-photo"
              />
            </div>
          ) : (
            <div className="popup-photo-placeholder">
              <span>Photo not available</span>
            </div>
          )}

          {/* Form Data */}
          {formData ? (
            <div className="popup-form-data">
              <IonText>
                <p className="popup-data-item">
                  <strong>Form ID:</strong> {formData.id}
                </p>
                <p className="popup-data-item">
                  <strong>Kind:</strong> {formData.kind}
                </p>
                <p className="popup-data-item">
                  <strong>Classification:</strong> {formData.classification}
                </p>
                <p className="popup-data-item">
                  <strong>Area:</strong> {formData.area} m²
                </p>
              </IonText>
            </div>
          ) : (
            <div className="popup-no-data">
              <IonText>
                <p className="popup-no-data-text">
                  No form data associated
                </p>
              </IonText>
            </div>
          )}

          {/* Photo Tag Info */}
          <div className="popup-meta-data">
            <IonText>
              <p className="popup-data-item meta">
                <strong>Date Taken:</strong> {formatDate(photoTag.timestamp)}
              </p>
              <p className="popup-data-item meta">
                <strong>Location:</strong> {photoTag.latitude.toFixed(6)}, {photoTag.longitude.toFixed(6)}
              </p>
              {photoTag.accuracy && (
                <p className="popup-data-item meta">
                  <strong>Accuracy:</strong> ±{photoTag.accuracy.toFixed(1)}m
                </p>
              )}
            </IonText>
          </div>

          {/* View Button - Only show if form data exists */}
          {formData && (
            <div className="popup-actions">
              <IonButton
                expand="block"
                fill="solid"
                color="primary"
                onClick={handleViewDetails}
                className="view-details-btn"
              >
                <IonIcon icon={eye} slot="start" />
                View Form Details
              </IonButton>
            </div>
          )}
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default MapMarkerPopup;