import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonLabel,
} from '@ionic/react';
import Adjustment from '../CalculationModal/Adjustment';

interface CalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
}
const CalculationModal: React.FC<CalculationModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Adjustment</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>Close</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <Adjustment
          label="Adjustment Value"
          value={0}
          onChange={(val) => console.log('Adjustment:', val)}
        />
        <IonLabel>Assestment Level:</IonLabel>
        <IonLabel>Tax Rate:</IonLabel>
        <IonLabel>Real Porperty Tax:</IonLabel>
      </IonContent>
    </IonModal>
  );
};

export default CalculationModal;
