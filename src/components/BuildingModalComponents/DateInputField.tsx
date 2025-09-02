// src/components/BuildingModalComponents/DateInputField.tsx
import React from 'react';
import { IonItem, IonLabel, IonDatetime } from '@ionic/react';

interface DateInputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const DateInputField: React.FC<DateInputFieldProps> = ({ 
  label, 
  value, 
  onChange 
}) => {
  return (
    <IonItem>
      <IonLabel position="stacked">{label}</IonLabel>
      <IonDatetime
        value={value}
        onIonChange={e => onChange(e.detail.value as string || '')}
        presentation="date"
      />
    </IonItem>
  );
};

export default DateInputField;