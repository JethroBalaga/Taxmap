import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons
} from '@ionic/react';
import Declarant from '../FormComponents/Declarant';
import Kind from '../FormComponents/Kind';
import Classification from '../FormComponents/Classification';
import Area from '../FormComponents/Area';
import Next from '../GlobalComponent/Next';

interface FormProps {
  isOpen: boolean;
  onDismiss: () => void;
}

const Form: React.FC<FormProps> = ({ isOpen, onDismiss }) => {
  const [declarant, setDeclarant] = useState('');
  const [kind, setKind] = useState('');
  const [classification, setClassification] = useState('');
  const [area, setArea] = useState<number>(0);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Tag New Location</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>Close</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <Declarant value={declarant} onChange={setDeclarant} />
        <Kind value={kind} onChange={setKind} />
        <Classification value={classification} onChange={setClassification} />
        <Area value={area} onChange={setArea} />
        <Next />
      </IonContent>
    </IonModal>
  );
};

export default Form;
