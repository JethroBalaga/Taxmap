import React, { useState } from 'react';
import {
  IonButton,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonList,
} from '@ionic/react';
import Adjustment from '../CalculationModal/Adjustment';

interface Field {
  key: string;
  label: string;
  placeholder?: string;
}

interface CalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  fields: Field[];
  initialValues?: Record<string, number>;
  onSave?: (values: Record<string, number>) => void;
}

const CalculationModal: React.FC<CalculationModalProps> = ({
  isOpen,
  onClose,
  fields,
  initialValues = {},
  onSave,
}) => {
  const [formValues, setFormValues] = useState<Record<string, number>>(initialValues);

  const handleChange = (key: string, value: number) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave?.(formValues);
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Adjust Values</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>Close</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonList>
          {fields.map((field) => (
            <Adjustment
              key={field.key}
              label={field.label}
              value={formValues[field.key] ?? 0}
              onChange={(value) => handleChange(field.key, value)}
              placeholder={field.placeholder}
            />
          ))}
        </IonList>

        <IonButton expand="block" onClick={handleSave} className="ion-margin">
          Save
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default CalculationModal;
