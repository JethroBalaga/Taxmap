import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonLoading,
  IonToast,
  IonButtons,
  IonButton,
  IonIcon,
  IonItem,
  IonInput,
  IonLabel,
  IonSelect,
  IonSelectOption
} from '@ionic/react';
import { close } from 'ionicons/icons';
import { addGeoTag } from './geotags';

interface GeoTaggingProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSuccess?: () => void;
}

const GeoTagging: React.FC<GeoTaggingProps> = ({ isOpen, onDismiss, onSuccess }) => {
  const [formData, setFormData] = useState({
    houseNumber: '',
    address: '',
    residence: ''
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await addGeoTag(
        Number(formData.houseNumber),
        formData.address,
        formData.residence
      );
      
      setToast({ show: true, message: 'Location saved successfully!' });
      setFormData({ houseNumber: '', address: '', residence: '' });
      
      setTimeout(() => {
        onDismiss();
        onSuccess?.();
      }, 1500);
    } catch (error) {
      setToast({ 
        show: true, 
        message: error instanceof Error ? error.message : 'Failed to save location' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Add Location</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={handleSubmit}>
          <IonItem>
            <IonLabel position="stacked">House Number</IonLabel>
            <IonInput
              type="number"
              value={formData.houseNumber}
              onIonChange={e => setFormData({...formData, houseNumber: e.detail.value!})}
              required
            />
          </IonItem>
          
          <IonItem>
            <IonLabel position="stacked">Full Address</IonLabel>
            <IonInput
              value={formData.address}
              onIonChange={e => setFormData({...formData, address: e.detail.value!})}
              required
            />
          </IonItem>
          
          <IonItem>
            <IonLabel position="stacked">Residence Type</IonLabel>
            <IonSelect
              value={formData.residence}
              onIonChange={e => setFormData({...formData, residence: e.detail.value})}
              interface="popover"
            >
              <IonSelectOption value="House">House</IonSelectOption>
              <IonSelectOption value="Apartment">Apartment</IonSelectOption>
              <IonSelectOption value="Business">Business</IonSelectOption>
              <IonSelectOption value="Land">Land</IonSelectOption>
            </IonSelect>
          </IonItem>
          
          <IonButton 
            type="submit" 
            expand="block" 
            className="ion-margin-top"
            disabled={loading}
          >
            Save Location
          </IonButton>
        </form>
        
        <IonLoading isOpen={loading} message="Saving location..." />
        <IonToast
          isOpen={toast.show}
          onDidDismiss={() => setToast({...toast, show: false})}
          message={toast.message}
          duration={2000}
        />
      </IonContent>
    </IonModal>
  );
};

export default GeoTagging;