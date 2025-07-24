import React from 'react';
import { IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';
import classificationData from '../DB/Classification.json';

interface ActualUsedProps {
  value: string;
  onChange: (value: string) => void;
}

const ActualUsed: React.FC<ActualUsedProps> = ({ value, onChange }) => {
  // Filter only "RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL"
  const filteredOptions = classificationData.filter((item) =>
    ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'].includes(item.Classification.toUpperCase())
  );

  return (
    <IonItem>
      <IonLabel position="floating">Actual Use</IonLabel>
      <IonSelect value={value} placeholder="Select Actual Use" onIonChange={(e) => onChange(e.detail.value)}>
        {filteredOptions.map((item) => (
          <IonSelectOption key={item.Class_ID} value={item.Classification}>
            {item.Classification}
          </IonSelectOption>
        ))}
      </IonSelect>
    </IonItem>
  );
};

export default ActualUsed;
