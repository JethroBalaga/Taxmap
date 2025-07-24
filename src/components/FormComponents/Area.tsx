import React from 'react';
import { IonItem, IonLabel, IonInput } from '@ionic/react';

interface AreaProps {
  value: number;
  onChange: (value: number) => void;
}

const Area: React.FC<AreaProps> = ({ value, onChange }) => {
  return (
    <IonItem>
      <IonLabel position="floating">Area (sqm)</IonLabel>
      <IonInput
        type="number"
        value={value}
        placeholder="Enter area"
        onIonChange={(e) => onChange(parseFloat(e.detail.value!))}
      />
    </IonItem>
  );
};

export default Area;
