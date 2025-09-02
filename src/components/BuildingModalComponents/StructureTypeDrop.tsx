// src/components/BuildingModalComponents/StructureTypeDrop.tsx
import React from 'react';
import { IonItem, IonLabel, IonSelect, IonSelectOption, IonText } from '@ionic/react';

interface StructureTypeDropProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const StructureTypeDrop: React.FC<StructureTypeDropProps> = ({ value, onChange, error }) => {
  const structureTypes = [
    { id: 'residential', name: 'Residential' },
    { id: 'commercial', name: 'Commercial' },
    { id: 'industrial', name: 'Industrial' },
    { id: 'institutional', name: 'Institutional' },
    { id: 'agricultural', name: 'Agricultural' },
    { id: 'mixed_use', name: 'Mixed Use' }
  ];

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
        {structureTypes.map(type => (
          <IonSelectOption key={type.id} value={type.id}>
            {type.name}
          </IonSelectOption>
        ))}
      </IonSelect>
      {error && <IonText color="danger" className="ion-padding-start">{error}</IonText>}
    </IonItem>
  );
};

export default StructureTypeDrop;