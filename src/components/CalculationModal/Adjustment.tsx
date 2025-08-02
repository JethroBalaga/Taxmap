import React from 'react';
import { IonItem, IonLabel, IonInput, IonText } from '@ionic/react';

interface AdjustmentProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const Adjustment: React.FC<AdjustmentProps> = ({
  label,
  value,
  onChange,
  placeholder = '0',
}) => {
  const handleChange = (inputValue: string) => {
    // Remove all non-digit and non-decimal characters
    let cleanValue = inputValue.replace(/[^0-9.]/g, '');
    
    // Handle multiple decimal points
    const decimalParts = cleanValue.split('.');
    if (decimalParts.length > 2) {
      cleanValue = `${decimalParts[0]}.${decimalParts.slice(1).join('')}`;
    }
    
    // Add % sign (empty string becomes '0%')
    const newValue = cleanValue === '' ? '0%' : `${cleanValue}%`;
    onChange(newValue);
  };

  // Get numeric value without % for display
  const displayValue = value.replace(/%/g, '');

  return (
    <IonItem>
      <IonLabel position="floating">{label}</IonLabel>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <IonInput
          type="text"
          inputmode="decimal"
          value={displayValue}
          placeholder={placeholder}
          onIonChange={(e) => handleChange(e.detail.value || '0')}
          style={{ flex: 1 }}
        />
        <IonText style={{ marginLeft: '8px' }}>%</IonText>
      </div>
    </IonItem>
  );
};

export default Adjustment;