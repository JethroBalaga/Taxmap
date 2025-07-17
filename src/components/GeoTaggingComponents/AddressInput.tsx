import React from 'react';
import { IonItem, IonLabel, IonInput } from '@ionic/react';

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
}

const AddressInput: React.FC<AddressInputProps> = ({ value, onChange }) => {
  return (
    <IonItem>
      <IonLabel position="floating">Address</IonLabel>
      <IonInput 
        type="text" 
        placeholder="Enter address"
        value={value}
        onIonChange={(e) => onChange(e.detail.value!)}
      />
    </IonItem>
  );
};

export default AddressInput;