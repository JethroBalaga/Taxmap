import React from 'react';
import { IonItem, IonLabel, IonInput } from '@ionic/react';

interface AdjustmentProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
}

const Adjustment: React.FC<AdjustmentProps> = ({
  label,
  value,
  onChange,
  placeholder = '',
}) => {
  return (
    <IonItem>
      <IonLabel position="floating">{label}</IonLabel>
      <IonInput
        type="number"
        value={value}
        placeholder={placeholder}
        onIonChange={(e) => {
          const newValue = parseFloat(e.detail.value || '0');
          onChange(isNaN(newValue) ? 0 : newValue);
        }}
      />
    </IonItem>
  );
};

export default Adjustment;
