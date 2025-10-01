import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon
} from '@ionic/react';
import { close } from 'ionicons/icons';
import './buildingmodal.css';

interface MachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MachineModal: React.FC<MachineModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');

  // Placeholder for equipment options - replace with your actual data
  const equipmentOptions: string[] = []; // Add your equipment values here

  const handleEquipmentChange = (value: string) => {
    setSelectedEquipment(value);
  };

  const handleContinue = () => {
    // Handle equipment data here
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  return (
    <IonModal 
      isOpen={isOpen} 
      onDidDismiss={onClose}
      className="custom-wide-modal"
    >
      <IonHeader className="fancy-header">
        <IonToolbar>
          <IonTitle className="fancy-title">Select Equipment</IonTitle>
          <IonButton 
            fill="clear" 
            slot="end" 
            onClick={onClose}
            className="fancy-close-btn"
          >
            <IonIcon icon={close} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="modal-content">
        <div className="form-section">
          <h3 className="section-title">Equipment Selection</h3>
          
          <IonItem className="custom-input" lines="none">
            <IonLabel position="stacked" className="input-label">
              Equipment
            </IonLabel>
            <IonSelect
              value={selectedEquipment}
              placeholder="Select equipment"
              onIonChange={e => handleEquipmentChange(e.detail.value)}
              interface="action-sheet"
            >
              {equipmentOptions.map((equipment, index) => (
                <IonSelectOption key={index} value={equipment}>
                  {equipment}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          {/* Add more form fields here as needed */}
        </div>

        <div className="next-btn-container">
          <IonButton 
            expand="block" 
            className="next-button"
            disabled={!selectedEquipment}
            onClick={handleContinue}
          >
            Continue
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default MachineModal;