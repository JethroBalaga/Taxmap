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

import Declarant from '../FormSteps/Declarant';
import Kind from '../FormSteps/Kind';
import Classification from '../FormSteps/Classification';
import Area from '../FormSteps/Area';
import Next from '../FormSteps/Next';

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
