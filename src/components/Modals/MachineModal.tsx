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
  IonInput,
  IonText,
  IonSpinner,
  IonNote
} from '@ionic/react';
import { close } from 'ionicons/icons';
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
        </div>
      </IonContent>
    </IonModal>
  );
};

export default MachineModal;