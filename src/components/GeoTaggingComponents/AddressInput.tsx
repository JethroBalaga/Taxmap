// AddressInput.tsx
import React from 'react';
import { IonItem, IonLabel, IonInput } from '@ionic/react';

const AddressInput: React.FC = () => {
  return (
    <IonItem>
      <IonLabel position="floating">Address</IonLabel>
      <IonInput type="text" placeholder="Enter address" />
    </IonItem>
  );
};

export default AddressInput;
