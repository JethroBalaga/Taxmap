// src/components/BuildingModalComponents/TextInputField.tsx
import React from 'react';
import { IonItem, IonLabel, IonInput } from '@ionic/react';

interface TextInputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const TextInputField: React.FC<TextInputFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder 
}) => {
  return (
    <IonItem>
      <IonLabel position="stacked">{label}</IonLabel>
      <IonInput
        type="text"
        value={value}
        placeholder={placeholder}
        onIonInput={e => onChange(e.detail.value!)}
      />
    </IonItem>
  );
};

export default TextInputField;