import React from 'react';
import { IonItem, IonLabel, IonInput } from '@ionic/react';

interface AdjustmentProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'email' | 'password';
  placeholder?: string;
}

const Adjustment: React.FC<AdjustmentProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
}) => {
  return (
    <IonItem>
      <IonLabel position="floating">{label}</IonLabel>
      <IonInput
        type={type}
        value={value}
        placeholder={placeholder}
        onIonChange={(e) => onChange(e.detail.value!)}
      />
    </IonItem>
  );
};

export default Adjustment;
