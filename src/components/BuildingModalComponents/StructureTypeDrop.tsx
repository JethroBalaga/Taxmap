// src/components/BuildingModalComponents/StructureTypeDrop.tsx
import React from 'react';
import { IonItem, IonLabel, IonSelect, IonSelectOption, IonText } from '@ionic/react';

interface StructureTypeDropProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const StructureTypeDrop: React.FC<StructureTypeDropProps> = ({ value, onChange, error }) => {
  return (
    <IonItem>
      <IonLabel position="stacked">Structure Type *</IonLabel>
      <IonSelect 
        value={value} 
        placeholder="Select Structure Type"
        onIonChange={e => onChange(e.detail.value)}
        interface="popover"
        className={error ? 'ion-invalid' : ''}
      >
        {/* Empty for now as requested - no options */}
      </IonSelect>
      {error && <IonText color="danger" className="ion-padding-start">{error}</IonText>}
    </IonItem>
  );
};

export default StructureTypeDrop;