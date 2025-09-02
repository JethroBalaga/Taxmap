// src/components/BuildingModalComponents/BuildingCodeDrop.tsx
import React from 'react';
import { IonItem, IonLabel, IonSelect, IonSelectOption, IonText } from '@ionic/react';

interface BuildingCodeDropProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  buildingCodes: string[];
}

const BuildingCodeDrop: React.FC<BuildingCodeDropProps> = ({ value, onChange, error, buildingCodes }) => {
  return (
    <IonItem>
      <IonLabel position="stacked">Building Code *</IonLabel>
      <IonSelect 
        value={value} 
        placeholder="Select Building Code"
        onIonChange={e => onChange(e.detail.value)}
        interface="popover"
        className={error ? 'ion-invalid' : ''}
      >
        {buildingCodes.map(code => (
          <IonSelectOption key={code} value={code}>{code}</IonSelectOption>
        ))}
      </IonSelect>
      {error && <IonText color="danger" className="ion-padding-start">{error}</IonText>}
    </IonItem>
  );
};

export default BuildingCodeDrop;