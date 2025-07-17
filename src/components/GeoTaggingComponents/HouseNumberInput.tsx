// HouseNumberInput.tsx
import React from 'react';
import { IonItem, IonLabel, IonInput } from '@ionic/react';

const HouseNumberInput: React.FC = () => {
  return (
    <IonItem>
      <IonLabel position="floating">House Number</IonLabel>
      <IonInput type="number" placeholder="Enter house number" />
    </IonItem>
  );
};

export default HouseNumberInput;
