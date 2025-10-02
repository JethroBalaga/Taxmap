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
  IonSpinner,
  IonInput,
  IonTextarea
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
  
  // Form fields
  const [serialNo, setSerialNo] = useState<string>('');
  const [machineDescription, setMachineDescription] = useState<string>('');
  const [brandModel, setBrandModel] = useState<string>('');
  const [capacity, setCapacity] = useState<string>('');
  const [capacityType, setCapacityType] = useState<string>('cubic meter');
  const [condition, setCondition] = useState<string>('');
  const [machineDetails, setMachineDetails] = useState<string>('');
  const [purchaseType, setPurchaseType] = useState<string>('');

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

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedEquipment('');
      setSerialNo('');
      setMachineDescription('');
      setBrandModel('');
      setCapacity('');
      setCapacityType('cubic meter');
      setCondition('');
      setMachineDetails('');
      setPurchaseType('');
      setError(null);
    }
  }, [isOpen]);

  const handleEquipmentChange = (value: string) => {
    setSelectedEquipment(value);
    // Auto-fill machine description with equipment type
    const equipment = equipmentOptions.find(e => e.equipment_id === value);
    if (equipment) {
      setMachineDescription(equipment.machine_type);
    }
  };

  const getSelectedEquipment = () => {
    return equipmentOptions.find(e => e.equipment_id === selectedEquipment);
  };

  const capacityTypes = [
    'cubic meter',
    'liters',
    'tons',
    'kilograms',
    'pieces',
    'units',
    'hours',
    'meters'
  ];

  const conditionOptions = [
    'Excellent',
    'Good',
    'Fair',
    'Poor',
    'Needs Repair'
  ];

  const purchaseTypeOptions = [
    'New Purchase',
    'Used Purchase',
    'Lease',
    'Rental'
  ];

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
            Equipment Information
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
                      {equipment.equipment_id}
                    </IonSelectOption>
                  ))
                )}
              </IonSelect>
            </IonItem>
          </div>

          <div className="form-section" style={{ marginTop: '24px' }}>
            <h3 className="section-title">Equipment Details</h3>
            
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Serial No <span style={{ color: 'red' }}>*</span>
              </IonLabel>
              <IonInput
                value={serialNo}
                placeholder="Enter serial number"
                onIonInput={(e) => setSerialNo(e.detail.value!)}
                className="modal-input"
              />
            </IonItem>

            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Machine Type
              </IonLabel>
              <IonInput
                value={machineDescription}
                className="modal-input"
                readonly
                style={{ opacity: 0.7 }}
                placeholder="Select equipment to auto-fill type"
              />
            </IonItem>

            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Brand/Model <span style={{ color: 'red' }}>*</span>
              </IonLabel>
              <IonInput
                value={brandModel}
                placeholder="Enter brand and model"
                onIonInput={(e) => setBrandModel(e.detail.value!)}
                className="modal-input"
              />
            </IonItem>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <IonItem className="custom-input" lines="none" style={{ flex: 1 }}>
                <IonLabel position="stacked" className="input-label">
                  Capacity
                </IonLabel>
                <IonInput
                  value={capacity}
                  type="number"
                  placeholder="Enter capacity"
                  onIonInput={(e) => setCapacity(e.detail.value!)}
                  className="modal-input"
                />
              </IonItem>
              
              <IonItem className="custom-input" lines="none" style={{ flex: 1 }}>
                <IonLabel position="stacked" className="input-label">
                  Capacity Type
                </IonLabel>
                <IonSelect
                  value={capacityType}
                  onIonChange={e => setCapacityType(e.detail.value)}
                  interface="popover"
                  className="modal-input"
                >
                  {capacityTypes.map((type) => (
                    <IonSelectOption key={type} value={type}>
                      {type}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            </div>

            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Condition
              </IonLabel>
              <IonSelect
                value={condition}
                placeholder="Select condition"
                onIonChange={e => setCondition(e.detail.value)}
                interface="popover"
                className="modal-input"
              >
                {conditionOptions.map((cond) => (
                  <IonSelectOption key={cond} value={cond}>
                    {cond}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          </div>

          <div className="form-section" style={{ marginTop: '24px' }}>
            <h3 className="section-title">Machine Details</h3>
            
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Machine Details
              </IonLabel>
              <IonInput
                value={machineDetails}
                placeholder="Enter machine details"
                onIonInput={(e) => setMachineDetails(e.detail.value!)}
                className="modal-input"
              />
            </IonItem>

            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Purchase Type
              </IonLabel>
              <IonSelect
                value={purchaseType}
                placeholder="Select purchase type"
                onIonChange={e => setPurchaseType(e.detail.value)}
                interface="popover"
                className="modal-input"
              >
                {purchaseTypeOptions.map((type) => (
                  <IonSelectOption key={type} value={type}>
                    {type}
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