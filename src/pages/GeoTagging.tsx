import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonLoading,
  IonToast
} from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import HouseNumberInput from '../components/GeoTaggingComponents/HouseNumberInput';
import AddressInput from '../components/GeoTaggingComponents/AddressInput';
import ResidenceInput from '../components/GeoTaggingComponents/ResidenceInput';
import SubmitButton from '../components/GeoTaggingComponents/SubmitButton';
import { addGeoTag } from '../components/geotags';

const GeoTagging: React.FC = () => {
  const history = useHistory();
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
      setToastMessage('Location tagged successfully! Redirecting to map...');
      setShowToast(true);
      
      // Increased delay for mobile devices
      setTimeout(() => {
        history.push('/map');
        // Force a reload to ensure map initialization
        if (Capacitor.isNativePlatform()) {
          window.location.reload();
        }
      }, Capacitor.isNativePlatform() ? 800 : 500);
      
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
        
        <IonLoading 
          isOpen={loading} 
          message={Capacitor.isNativePlatform() ? "Getting your location (may take longer on mobile)..." : "Getting your location..."} 
        />
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