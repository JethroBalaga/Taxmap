// src/components/FormComponents/Area.tsx
import React from 'react';
import { IonItem, IonInput, IonLabel } from '@ionic/react';

interface AreaProps {
  value: number;
  onChange: (value: number) => void;
}

const Area: React.FC<AreaProps> = ({ value, onChange }) => {
  return (
    <div className="area-container">
      <IonLabel className="area-label" style={{ color: '#000000' }}>
        Area (m²) <span style={{ color: 'red' }}>*</span>
      </IonLabel>
      <div className="area-input-container">
        <IonInput
          className="area-input"
          type="number"
          value={value}
          placeholder="Enter area"
          onIonInput={(e) => onChange(parseFloat(e.detail.value!) || 0)}
          style={{ color: '#000000' }}
        />
        <span className="area-unit" style={{ color: '#000000' }}></span>
      </div>
    </div>
  );
};

export default Area;