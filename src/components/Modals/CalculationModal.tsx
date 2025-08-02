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
  IonItem,
  IonNote
} from '@ionic/react';
import Adjustment from '../CalculationModal/Adjustment';

interface CalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Values from Form
  declarant: string;
  kind: string;
  classification: string;
  area: number;
  // Values from ActualUsedModal
  actualUse: string;
  group: string;
  location: string;
  subclass: string;
  rating: number;
}

const CalculationModal: React.FC<CalculationModalProps> = ({
  isOpen,
  onClose,
  declarant,
  kind,
  classification,
  area,
  actualUse,
  group,
  location,
  subclass,
  rating
}) => {
  // Calculate market value (Area × Rating)
  const marketValue = area * rating;

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
        <IonItem>
          <IonLabel>Area:</IonLabel>
          <IonNote slot="end">{area.toLocaleString()} sqm</IonNote>
        </IonItem>
        <IonItem>
          <IonLabel>Rating:</IonLabel>
          <IonNote slot="end">₱{rating.toLocaleString()}</IonNote>
        </IonItem>

        <IonItem>
          <IonLabel>Market Value:</IonLabel>
          <IonNote slot="end">₱{marketValue.toLocaleString()}</IonNote>
        </IonItem>

        <Adjustment
          label="Adjustment"
          value={0}
          onChange={(val) => console.log('Adjustment:', val)}
        />
        
        <IonItem>
          <IonLabel>Assessed Value:</IonLabel>
          <IonNote slot="end">TBD</IonNote>
        </IonItem>
        
        <IonItem>
          <IonLabel>Tax Rate:</IonLabel>
          <IonNote slot="end">TBD</IonNote>
        </IonItem>
        
        <IonItem>
          <IonLabel>Real Property Tax:</IonLabel>
          <IonNote slot="end">TBD</IonNote>
        </IonItem>
      </IonContent>
    </IonModal>
  );
};

export default CalculationModal;