// GeoTagging.tsx
import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonLoading,
  IonToast
} from '@ionic/react';
import HouseNumberInput from '../components/GeoTaggingComponents/HouseNumberInput';
import AddressInput from '../components/GeoTaggingComponents/AddressInput';
import ResidenceInput from '../components/GeoTaggingComponents/ResidenceInput';
import SubmitButton from '../components/GeoTaggingComponents/SubmitButton';
import { addGeoTag } from '../components/geotags';

const GeoTagging: React.FC = () => {
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
    } catch (error) {
      setToastMessage('Failed to tag location. Please try again.');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>GeoTagging Form</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={handleSubmit}>
          <HouseNumberInput value={houseNumber} onChange={setHouseNumber} />
          <AddressInput value={address} onChange={setAddress} />
          <ResidenceInput value={residence} onChange={setResidence} />
          <SubmitButton />
        </form>
        
        <IonLoading isOpen={loading} message="Getting your location..." />
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />
      </IonContent>
    </IonPage>
  );
};

export default GeoTagging;