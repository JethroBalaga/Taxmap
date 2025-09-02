// src/components/BuildingModalComponents/NumericInputField.tsx
import React from 'react';
import { IonItem, IonLabel, IonInput, IonText } from '@ionic/react';

interface NumericInputFieldProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder: string;
  error?: string;
  required?: boolean;
  min?: number;
  max?: number;
}

const NumericInputField: React.FC<NumericInputFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  error, 
  required = false,
  min,
  max
}) => {
  return (
    <IonItem>
      <IonLabel position="stacked">
        {label}{required && ' *'}
      </IonLabel>
      <IonInput
        type="number"
        value={value}
        placeholder={placeholder}
        onIonInput={e => onChange(parseInt(e.detail.value!, 10) || null)}
        className={error ? 'ion-invalid' : ''}
        min={min}
        max={max}
      />
      {error && <IonText color="danger" className="ion-padding-start">{error}</IonText>}
    </IonItem>
  );
};

export default NumericInputField;