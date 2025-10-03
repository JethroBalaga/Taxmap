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
  IonTextarea,
  IonDatetime
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
  const [dateAcquired, setDateAcquired] = useState<string>('');
  const [dateInstalled, setDateInstalled] = useState<string>('');
  const [dateOperated, setDateOperated] = useState<string>('');
  const [yearsUsed, setYearsUsed] = useState<string>('');
  const [estimatedLife, setEstimatedLife] = useState<string>('');
  const [remainingLife, setRemainingLife] = useState<string>('');
  const [numberOfUnits, setNumberOfUnits] = useState<string>('');

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
      setDateAcquired('');
      setDateInstalled('');
      setDateOperated('');
      setYearsUsed('');
      setEstimatedLife('');
      setRemainingLife('');
      setNumberOfUnits('');
      setError(null);
    }
  }, [isOpen]);

  // Calculate years used and remaining life when dates change
  useEffect(() => {
    const calculateLifeMetrics = () => {
      // Calculate years used based on date acquired and current date
      if (dateAcquired) {
        const acquiredDate = new Date(dateAcquired);
        const currentDate = new Date();
        const yearsUsedValue = ((currentDate.getTime() - acquiredDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
        setYearsUsed(yearsUsedValue);
        
        // Calculate remaining life if estimated life is provided
        if (estimatedLife) {
          const remaining = (parseFloat(estimatedLife) - parseFloat(yearsUsedValue)).toFixed(1);
          setRemainingLife(remaining);
        }
      }
    };

    calculateLifeMetrics();
  }, [dateAcquired, estimatedLife]);

  // Update remaining life when years used or estimated life changes
  useEffect(() => {
    if (yearsUsed && estimatedLife) {
      const remaining = (parseFloat(estimatedLife) - parseFloat(yearsUsed)).toFixed(1);
      setRemainingLife(remaining);
    }
  }, [yearsUsed, estimatedLife]);

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
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '32px',
          padding: '16px 24px',
          maxWidth: '100%',
          alignItems: 'flex-start'
        }}>
          {/* Left Column */}
          <div style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '16px',
                color: '#2c3e50',
                textAlign: 'left'
              }}>
                Equipment Selection
              </h3>
              
              <IonItem className="custom-input" lines="none" style={{ textAlign: 'left' }}>
                <IonLabel position="stacked" className="input-label" style={{ textAlign: 'left' }}>
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
                  style={{ textAlign: 'left' }}
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

            <div>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '16px',
                color: '#2c3e50',
                textAlign: 'left'
              }}>
                Equipment Details
              </h3>
              
              <IonItem className="custom-input" lines="none" style={{ textAlign: 'left' }}>
                <IonLabel position="stacked" className="input-label" style={{ textAlign: 'left' }}>
                  Serial No <span style={{ color: 'red' }}>*</span>
                </IonLabel>
                <IonInput
                  value={serialNo}
                  placeholder="Enter serial number"
                  onIonInput={(e) => setSerialNo(e.detail.value!)}
                  className="modal-input"
                  style={{ textAlign: 'left' }}
                />
              </IonItem>

              <IonItem className="custom-input" lines="none" style={{ textAlign: 'left' }}>
                <IonLabel position="stacked" className="input-label" style={{ textAlign: 'left' }}>
                  Machine Type
                </IonLabel>
                <IonInput
                  value={machineDescription}
                  className="modal-input"
                  readonly
                  style={{ opacity: 0.7, textAlign: 'left' }}
                  placeholder="Select equipment to auto-fill type"
                />
              </IonItem>

              <IonItem className="custom-input" lines="none" style={{ textAlign: 'left' }}>
                <IonLabel position="stacked" className="input-label" style={{ textAlign: 'left' }}>
                  Brand/Model <span style={{ color: 'red' }}>*</span>
                </IonLabel>
                <IonInput
                  value={brandModel}
                  placeholder="Enter brand and model"
                  onIonInput={(e) => setBrandModel(e.detail.value!)}
                  className="modal-input"
                  style={{ textAlign: 'left' }}
                />
              </IonItem>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', textAlign: 'left' }}>
                <IonItem className="custom-input" lines="none" style={{ flex: 1, textAlign: 'left' }}>
                  <IonLabel position="stacked" className="input-label" style={{ textAlign: 'left' }}>
                    Capacity
                  </IonLabel>
                  <IonInput
                    value={capacity}
                    type="number"
                    placeholder="Enter capacity"
                    onIonInput={(e) => setCapacity(e.detail.value!)}
                    className="modal-input"
                    style={{ textAlign: 'left' }}
                  />
                </IonItem>
                
                <IonItem className="custom-input" lines="none" style={{ flex: 1, textAlign: 'left' }}>
                  <IonLabel position="stacked" className="input-label" style={{ textAlign: 'left' }}>
                    Capacity Type
                  </IonLabel>
                  <IonSelect
                    value={capacityType}
                    onIonChange={e => setCapacityType(e.detail.value)}
                    interface="popover"
                    className="modal-input"
                    style={{ textAlign: 'left' }}
                  >
                    {capacityTypes.map((type) => (
                      <IonSelectOption key={type} value={type}>
                        {type}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              </div>

              <IonItem className="custom-input" lines="none" style={{ textAlign: 'left' }}>
                <IonLabel position="stacked" className="input-label" style={{ textAlign: 'left' }}>
                  Condition
                </IonLabel>
                <IonSelect
                  value={condition}
                  placeholder="Select condition"
                  onIonChange={e => setCondition(e.detail.value)}
                  interface="popover"
                  className="modal-input"
                  style={{ textAlign: 'left' }}
                >
                  {conditionOptions.map((cond) => (
                    <IonSelectOption key={cond} value={cond}>
                      {cond}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              {/* New Life Metrics Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'left' }}>
                <IonItem className="custom-input" lines="none" style={{ textAlign: 'left' }}>
                  <IonLabel position="stacked" className="input-label" style={{ textAlign: 'left' }}>
                    Years Used
                  </IonLabel>
                  <IonInput
                    value={yearsUsed}
                    type="number"
                    placeholder="Auto-calculated"
                    onIonInput={(e) => setYearsUsed(e.detail.value!)}
                    className="modal-input"
                    style={{ textAlign: 'left' }}
                    readonly={!!dateAcquired}
                  />
                </IonItem>

                <IonItem className="custom-input" lines="none" style={{ textAlign: 'left' }}>
                  <IonLabel position="stacked" className="input-label" style={{ textAlign: 'left' }}>
                    No. of Units
                  </IonLabel>
                  <IonInput
                    value={numberOfUnits}
                    type="number"
                    placeholder="Enter number of units"
                    onIonInput={(e) => setNumberOfUnits(e.detail.value!)}
                    className="modal-input"
                    style={{ textAlign: 'left' }}
                  />
                </IonItem>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '16px',
                color: '#2c3e50',
                textAlign: 'left'
              }}>
                Machine Details
              </h3>
              
              <IonItem className="custom-input" lines="none" style={{ textAlign: 'left' }}>
                <IonLabel position="stacked" className="input-label" style={{ textAlign: 'left' }}>
                  Machine Details
                </IonLabel>
                <IonInput
                  value={machineDetails}
                  placeholder="Enter machine details"
                  onIonInput={(e) => setMachineDetails(e.detail.value!)}
                  className="modal-input"
                  style={{ textAlign: 'left' }}
                />
              </IonItem>

              <IonItem className="custom-input" lines="none" style={{ textAlign: 'left' }}>
                <IonLabel position="stacked" className="input-label" style={{ textAlign: 'left' }}>
                  Purchase Type
                </IonLabel>
                <IonSelect
                  value={purchaseType}
                  placeholder="Select purchase type"
                  onIonChange={e => setPurchaseType(e.detail.value)}
                  interface="popover"
                  className="modal-input"
                  style={{ textAlign: 'left' }}
                >
                  {purchaseTypeOptions.map((type) => (
                    <IonSelectOption key={type} value={type}>
                      {type}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '16px',
                color: '#2c3e50',
                textAlign: 'left'
              }}>
                Life Metrics
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'left' }}>
                <IonItem className="custom-input" lines="none" style={{ textAlign: 'left' }}>
                  <IonLabel position="stacked" className="input-label" style={{ textAlign: 'left' }}>
                    Estimated Life (years)
                  </IonLabel>
                  <IonInput
                    value={estimatedLife}
                    type="number"
                    placeholder="Enter estimated life"
                    onIonInput={(e) => setEstimatedLife(e.detail.value!)}
                    className="modal-input"
                    style={{ textAlign: 'left' }}
                  />
                </IonItem>

                <IonItem className="custom-input" lines="none" style={{ textAlign: 'left' }}>
                  <IonLabel position="stacked" className="input-label" style={{ textAlign: 'left' }}>
                    Remaining Life (years)
                  </IonLabel>
                  <IonInput
                    value={remainingLife}
                    type="number"
                    placeholder="Auto-calculated"
                    className="modal-input"
                    style={{ textAlign: 'left' }}
                    readonly
                  />
                </IonItem>
              </div>
            </div>

            <div>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '16px',
                color: '#2c3e50',
                textAlign: 'left'
              }}>
                Date Information
              </h3>
              
              <IonItem className="custom-input" lines="none" style={{ textAlign: 'left' }}>
                <IonLabel position="stacked" className="input-label" style={{ textAlign: 'left' }}>
                  Date Acquired
                </IonLabel>
                <IonDatetime
                  value={dateAcquired}
                  onIonChange={e => setDateAcquired(e.detail.value as string)}
                  presentation="date"
                  className="modal-input"
                  style={{ textAlign: 'left' }}
                />
              </IonItem>

              <IonItem className="custom-input" lines="none" style={{ textAlign: 'left' }}>
                <IonLabel position="stacked" className="input-label" style={{ textAlign: 'left' }}>
                  Date Installed
                </IonLabel>
                <IonDatetime
                  value={dateInstalled}
                  onIonChange={e => setDateInstalled(e.detail.value as string)}
                  presentation="date"
                  className="modal-input"
                  style={{ textAlign: 'left' }}
                />
              </IonItem>

              <IonItem className="custom-input" lines="none" style={{ textAlign: 'left' }}>
                <IonLabel position="stacked" className="input-label" style={{ textAlign: 'left' }}>
                  Date Operated
                </IonLabel>
                <IonDatetime
                  value={dateOperated}
                  onIonChange={e => setDateOperated(e.detail.value as string)}
                  presentation="date"
                  className="modal-input"
                  style={{ textAlign: 'left' }}
                />
              </IonItem>
            </div>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default MachineModal;