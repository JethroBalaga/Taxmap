import React, { useState, useEffect } from 'react';
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
  IonButtons,
  IonSpinner
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { EquipmentData, getEquipmentData } from '../../utils/equipmentLocalStorage';
import '../../CSS/modal.css';

interface MachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MachineModal: React.FC<MachineModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [equipmentOptions, setEquipmentOptions] = useState<EquipmentData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch equipment data when modal opens
  useEffect(() => {
    const fetchEquipmentData = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const equipmentData = await getEquipmentData();
        if (equipmentData) {
          setEquipmentOptions(equipmentData);
        } else {
          setError('No equipment data available');
        }
      } catch (err) {
        console.error('Error fetching equipment data:', err);
        setError('Failed to load equipment data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEquipmentData();
  }, [isOpen]);

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

  const getSelectedEquipment = () => {
    return equipmentOptions.find(e => e.equipment_id === selectedEquipment);
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
          <IonButtons slot="end">
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
                placeholder={
                  isLoading 
                    ? "Loading equipment..." 
                    : error 
                    ? "Failed to load equipment"
                    : "Select equipment"
                }
                onIonChange={e => handleEquipmentChange(e.detail.value)}
                interface="popover"
                className="modal-input"
                disabled={isLoading || !!error || equipmentOptions.length === 0}
              >
                {isLoading ? (
                  <IonSelectOption value="" disabled>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IonSpinner name="dots" style={{ width: '16px', height: '16px' }} />
                      Loading equipment...
                    </div>
                  </IonSelectOption>
                ) : error ? (
                  <IonSelectOption value="" disabled>
                    {error}
                  </IonSelectOption>
                ) : equipmentOptions.length === 0 ? (
                  <IonSelectOption value="" disabled>
                    No equipment available
                  </IonSelectOption>
                ) : (
                  equipmentOptions.map((equipment) => (
                    <IonSelectOption 
                      key={equipment.equipment_id} 
                      value={equipment.equipment_id}
                    >
                      {equipment.equipment_id} - {equipment.machine_type}
                    </IonSelectOption>
                  ))
                )}
              </IonSelect>
            </IonItem>

            {/* Display selected equipment details */}
            {selectedEquipment && (
              <div style={{ 
                padding: '12px', 
                background: '#f8f9fa', 
                borderRadius: '8px', 
                marginTop: '16px',
                border: '1px solid #e9ecef',
                color: '#2d3748' // Added explicit text color
              }}>
                <strong style={{ color: '#2d3748' }}>Selected Equipment:</strong><br />
                ID: {getSelectedEquipment()?.equipment_id}<br />
                Type: {getSelectedEquipment()?.machine_type}
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default MachineModal;