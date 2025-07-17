// GeoTagging.tsx
import React from 'react';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
} from '@ionic/react';
import HouseNumberInput from '../components/GeoTaggingComponents/HouseNumberInput';
import AddressInput from '../components/GeoTaggingComponents/AddressInput';
import ResidenceInput from '../components/GeoTaggingComponents/ResidenceInput';
import SubmitButton from '../components/GeoTaggingComponents/SubmitButton';

const GeoTagging: React.FC = () => {
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>GeoTagging Form</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <form>
                    <HouseNumberInput />
                    <AddressInput />
                    <ResidenceInput />
                    <SubmitButton />
                </form>
            </IonContent>
        </IonPage>
    );
};

export default GeoTagging;
