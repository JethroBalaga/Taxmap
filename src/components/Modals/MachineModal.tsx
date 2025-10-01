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
  IonIcon,
  IonButtons // Add this import
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import '../../CSS/modal.css';

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
      <IonHeader>
        <IonToolbar className="fancy-header">
          <IonTitle className="fancy-title">
            <i className="icon-machine" style={{ marginRight: '10px' }}></i>
            Select Equipment
          </IonTitle>
          <IonButtons slot="end"> {/* Use IonButtons instead of IonButton directly */}
            <IonButton onClick={onClose} className="fancy-close-btn">
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="modal-content">
        <div className="form-container">
          <div className="form-section">
            <h3 className="section-title">Equipment Selection</h3>
            
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Equipment <span style={{ color: 'red' }}>*</span>
              </IonLabel>
              <IonSelect
                value={selectedEquipment}
                placeholder="Select equipment"
                onIonChange={e => handleEquipmentChange(e.detail.value)}
                interface="popover"
                className="modal-input"
              >
                {equipmentOptions.map((equipment, index) => (
                  <IonSelectOption key={index} value={equipment}>
                    {equipment}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
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
        </div>
      </IonContent>
    </IonModal>
  );
};

export default MachineModal;