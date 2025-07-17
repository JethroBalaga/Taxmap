import React from 'react';
import { IonItem, IonLabel, IonInput } from '@ionic/react';

interface HouseNumberInputProps {
  value: number;
  onChange: (value: number) => void;
}

const HouseNumberInput: React.FC<HouseNumberInputProps> = ({ value, onChange }) => {
  return (
    <IonItem>
      <IonLabel position="floating">House Number</IonLabel>
      <IonInput 
        type="number" 
        placeholder="Enter house number"
        value={value}
        onIonChange={(e) => onChange(Number(e.detail.value!))}
      />
    </IonItem>
  );
};

export default HouseNumberInput;