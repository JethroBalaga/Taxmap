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
        <IonSelectOption value="Land">LAND</IonSelectOption>
        <IonSelectOption value="Building">BUILDING</IonSelectOption>
        <IonSelectOption value="Machinery">MACHINERY</IonSelectOption>
      </IonSelect>
    </IonItem>
  );
};

export default Kind;
