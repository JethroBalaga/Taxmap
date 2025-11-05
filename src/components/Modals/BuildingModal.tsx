import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonIcon,
  IonButton
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import BuildingView from './BuildingView';
// Import from the same source as Form component
import { FormData } from '../../utils/tablestorages/FormDataLocalStorage';
import '../../CSS/modal.css';

export interface BuildingData {
  structureType: string;
  buildingCode: string;
  storey: number | null;
  floorOrder: number | null;
  buildingAge: string | null;
  buildingPermit: string | null;
  constructionPercent: number | null;
  dateConstructed: string | null;
  dateOccupied: string | null;
  dateCompleted: string | null;
  depreciationRate: number | null;
  adjustment?: string;
  assessmentLevel?: string;
}

interface BuildingModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSuccess: (data: BuildingData) => void;
  formData: FormData;
  initialData?: BuildingData;
}

const BuildingModal: React.FC<BuildingModalProps> = ({ 
  isOpen, 
  onDismiss, 
  onSuccess,
  formData,
  initialData
}) => {
  const handleDismiss = () => {
    onDismiss();
  };

  return (
    <IonModal 
      isOpen={isOpen} 
      onDidDismiss={handleDismiss}
      className="custom-wide-modal"
    >
      <IonHeader>
        <IonToolbar className="fancy-header">
          <IonTitle className="fancy-title">
            <i className="icon-building" style={{ marginRight: '10px' }}></i>
            Building Description
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleDismiss} className="fancy-close-btn">
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="modal-content">
        <BuildingView
          onSuccess={onSuccess}
          onDismiss={handleDismiss}
          formData={formData}
          initialData={initialData}
        />
      </IonContent>
    </IonModal>
  );
};

export default BuildingModal;