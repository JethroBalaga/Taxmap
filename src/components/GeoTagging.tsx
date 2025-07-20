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
  IonIcon
} from '@ionic/react';
import { close } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import HouseNumberInput from './GeoTaggingComponents/HouseNumberInput';
import AddressInput from './GeoTaggingComponents/AddressInput';
import ResidenceInput from './GeoTaggingComponents/ResidenceInput';
import SubmitButton from './GeoTaggingComponents/SubmitButton';
import { addGeoTag } from './geotags';

interface GeoTaggingProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSuccess?: () => void;
}

const GeoTagging: React.FC<GeoTaggingProps> = ({ 
  isOpen, 
  onDismiss,
  onSuccess 
}) => {
  const [houseNumber, setHouseNumber] = useState<number>(0);
  const [address, setAddress] = useState<string>('');
  const [residence, setResidence] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await addGeoTag(houseNumber, address, residence);
      setToastMessage('Location tagged successfully!');
      setShowToast(true);
      
      // Reset form
      setHouseNumber(0);
      setAddress('');
      setResidence('');

      // Call success callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    } catch (error) {
      setToastMessage('Failed to tag location. Please try again.');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>GeoTagging Form</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={handleSubmit}>
          <HouseNumberInput value={houseNumber} onChange={setHouseNumber} />
          <AddressInput value={address} onChange={setAddress} />
          <ResidenceInput value={residence} onChange={setResidence} />
          <SubmitButton />
        </form>
        
        <IonLoading 
          isOpen={loading} 
          message={Capacitor.isNativePlatform() ? 
            "Getting your location (may take longer on mobile)..." : 
            "Getting your location..."} 
        />
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />
      </IonContent>
    </IonModal>
  );
};

export default GeoTagging;