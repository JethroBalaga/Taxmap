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
import BuildingUpdateView from './BuildingUpdateView';
import { BuildingData } from './BuildingModal';
import '../../CSS/modal.css';

interface BuildingUpdateModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onUpdate: (data: BuildingData) => void;
  buildingId: string; // Changed from formData to buildingId
  initialBuildingData: BuildingData; // Renamed for clarity
}

const BuildingUpdateModal: React.FC<BuildingUpdateModalProps> = ({ 
  isOpen, 
  onDismiss, 
  onUpdate,
  buildingId,
  initialBuildingData
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
            Update Building #{buildingId}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleDismiss} className="fancy-close-btn">
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="modal-content">
        <BuildingUpdateView
          onUpdate={onUpdate}
          onDismiss={handleDismiss}
          buildingId={buildingId}
          buildingData={initialBuildingData}
        />
      </IonContent>
    </IonModal>
  );
};

export default BuildingUpdateModal;