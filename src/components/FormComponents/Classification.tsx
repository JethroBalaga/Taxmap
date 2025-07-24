import React, { useEffect, useState } from 'react';
import { IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';
import classificationData from '../DB/Classification.json'; // Adjust path if needed

interface ClassificationOption {
  Class_ID: number;
  Classification: string;
}

interface ClassificationProps {
  value: string;
  onChange: (value: string) => void;
}

const Classification: React.FC<ClassificationProps> = ({ value, onChange }) => {
  const [options, setOptions] = useState<ClassificationOption[]>([]);

  useEffect(() => {
    setOptions(classificationData);
  }, []);

  return (
    <IonItem>
      <IonLabel position="floating">Classification</IonLabel>
      <IonSelect
        value={value}
        placeholder="Select classification"
        onIonChange={(e) => onChange(e.detail.value)}
      >
        {options.map((opt) => (
          <IonSelectOption key={opt.Class_ID} value={opt.Classification}>
            {opt.Classification}
          </IonSelectOption>
        ))}
      </IonSelect>
    </IonItem>
  );
};

export default Classification;
