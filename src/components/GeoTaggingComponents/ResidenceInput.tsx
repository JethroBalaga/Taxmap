// ResidenceInput.tsx
import React from 'react';
import { IonItem, IonLabel, IonInput } from '@ionic/react';

const ResidenceInput: React.FC = () => {
  return (
    <IonItem>
      <IonLabel position="floating">Residence Name</IonLabel>
      <IonInput type="text" placeholder="Enter residence name" />
    </IonItem>
  );
};

export default ResidenceInput;
