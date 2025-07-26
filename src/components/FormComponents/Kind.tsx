import React from 'react';
import { IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';

interface KindSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const Kind: React.FC<KindSelectProps> = ({ value, onChange }) => {
  return (
    <IonItem>
      <IonLabel position="floating">Kind</IonLabel>
      <IonSelect
        value={value}
        placeholder="Select kind"
        onIonChange={(e) => onChange(e.detail.value)}
      >
        <IonSelectOption value="LAND">LAND</IonSelectOption>
        <IonSelectOption value="BUILDING">BUILDING</IonSelectOption>
        <IonSelectOption value="MACHINERY">MACHINERY</IonSelectOption>
      </IonSelect>
    </IonItem>
  );
};

export default Kind;
