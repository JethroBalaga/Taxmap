import React from 'react';
import { IonItem, IonLabel, IonInput } from '@ionic/react';

interface Declarant {
  value: string;
  onChange: (value: string) => void;
}

const Declarant: React.FC<Declarant> = ({ value, onChange }) => {
  return (
    <IonItem>
      <IonLabel position="floating">Declarant</IonLabel>
      <IonInput 
        type="text" 
        placeholder="Enter Declarant"
        value={value}
        onIonChange={(e) => onChange(e.detail.value!)}
      />
    </IonItem>
  );
};

export default Declarant;