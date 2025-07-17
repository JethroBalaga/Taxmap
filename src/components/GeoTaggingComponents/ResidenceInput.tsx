import React from 'react';
import { IonItem, IonLabel, IonInput } from '@ionic/react';

interface ResidenceInputProps {
  value: string;
  onChange: (value: string) => void;
}

const ResidenceInput: React.FC<ResidenceInputProps> = ({ value, onChange }) => {
  return (
    <IonItem>
      <IonLabel position="floating">Residence Name</IonLabel>
      <IonInput 
        type="text" 
        placeholder="Enter residence name"
        value={value}
        onIonChange={(e) => onChange(e.detail.value!)}
      />
    </IonItem>
  );
};

export default ResidenceInput;