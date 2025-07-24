// src/components/Modals/Form.tsx
import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import Declarant from '../FormComponents/Declarant';
import Kind from '../FormComponents/Kind';
import Classification from '../FormComponents/Classification';
import Area from '../FormComponents/Area';
import Next from '../GlobalComponent/Next';

interface FormProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
}

const Form: React.FC<FormProps> = ({ isOpen, onDismiss, onSuccess }) => {
  const [declarant, setDeclarant] = useState('');
  const [kind, setKind] = useState('');
  const [classification, setClassification] = useState('');
  const [area, setArea] = useState<number>(0);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>GeoTag Form</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>
              <IonIcon icon={closeOutline} />
            </IonButton>
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
