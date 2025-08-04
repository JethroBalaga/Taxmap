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
  IonIcon 
} from '@ionic/react';
import { close } from 'ionicons/icons';
import SubmitButton from '../GeoTaggingComponents/SubmitButton';

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoTaken: (photo: string) => void;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ isOpen, onClose, onPhotoTaken }) => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        // Removed the automatic onPhotoTaken call here
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
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Take a Photo</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClose}>
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

        <IonButton expand="block" onClick={takePhoto}>
          Take Photo
        </IonButton>

        {photo && (
          <div style={{ marginTop: '20px' }}>
            <IonImg 
              src={photo} 
              alt="Captured photo" 
              style={{ 
                maxHeight: '300px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }} 
            />
          </div>
        )}
        
        {photo && (
          <SubmitButton/>
        )}
      </IonContent>
    </IonModal>
  );
};

export default PhotoModal;