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
import Next from '../../components/GlobalComponent/Next';
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

  // New financial fields
  const [originalCost, setOriginalCost] = useState<string>('');
  const [freight, setFreight] = useState<string>('');
  const [insurance, setInsurance] = useState<string>('');
  const [installation, setInstallation] = useState<string>('');
  const [others, setOthers] = useState<string>('');
  const [totalCost, setTotalCost] = useState<string>('');
  const [depreciation, setDepreciation] = useState<string>('');
  const [adjustedMarketValue, setAdjustedMarketValue] = useState<string>('');
  const [isFormValid, setIsFormValid] = useState(false);

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
      setOriginalCost('');
      setFreight('');
      setInsurance('');
      setInstallation('');
      setOthers('');
      setTotalCost('');
      setDepreciation('');
      setAdjustedMarketValue('');
      setError(null);
    }
  }, [isOpen]);

  // Form validation - only require Equipment and Serial No
  useEffect(() => {
    const validateForm = () => {
      const requiredFieldsValid = selectedEquipment.trim() !== '' && serialNo.trim() !== '';
      setIsFormValid(requiredFieldsValid);
    };

    validateForm();
  }, [selectedEquipment, serialNo]);

  // Calculate years used and remaining life when dates change
  useEffect(() => {
    const calculateLifeMetrics = () => {
      if (dateAcquired) {
        const acquiredDate = new Date(dateAcquired);
        const currentDate = new Date();
        const yearsUsedValue = ((currentDate.getTime() - acquiredDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
        setYearsUsed(yearsUsedValue);

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

  // Calculate total cost when financial fields change
  useEffect(() => {
    const calculateTotalCost = () => {
      const cost = parseFloat(originalCost) || 0;
      const freightCost = parseFloat(freight) || 0;
      const insuranceCost = parseFloat(insurance) || 0;
      const installationCost = parseFloat(installation) || 0;
      const othersCost = parseFloat(others) || 0;

      const total = cost + freightCost + insuranceCost + installationCost + othersCost;
      setTotalCost(total.toFixed(2));
    };

    calculateTotalCost();
  }, [originalCost, freight, insurance, installation, others]);

  // Calculate adjusted market value when total cost or depreciation changes
  useEffect(() => {
    const calculateAdjustedMarketValue = () => {
      const total = parseFloat(totalCost) || 0;
      const depreciationPercent = parseFloat(depreciation) || 0;

      if (total > 0 && depreciationPercent > 0) {
        const depreciationAmount = total * (depreciationPercent / 100);
        const adjustedValue = total - depreciationAmount;
        setAdjustedMarketValue(adjustedValue.toFixed(2));
      } else {
        setAdjustedMarketValue(totalCost);
      }
    };

    calculateAdjustedMarketValue();
  }, [totalCost, depreciation]);

  const handleEquipmentChange = (value: string) => {
    setSelectedEquipment(value);
    const equipment = equipmentOptions.find(e => e.equipment_id === value);
    if (equipment) {
      setMachineDescription(equipment.machine_type);
    }
  };

  const handleDepreciationChange = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    setDepreciation(numericValue);
  };

  const getDepreciationDisplayValue = () => {
    if (!depreciation) return '';
    return `${depreciation}%`;
  };

  const handleNextClick = () => {
    // TODO: Add functionality for Next button
    console.log('Next button clicked');
    console.log('Form data:', {
      selectedEquipment,
      serialNo,
      machineDescription,
      brandModel,
      condition,
      machineDetails,
      purchaseType,
      dateAcquired,
      dateInstalled,
      dateOperated,
      yearsUsed,
      estimatedLife,
      remainingLife,
      numberOfUnits,
      originalCost,
      freight,
      insurance,
      installation,
      others,
      totalCost,
      depreciation,
      adjustedMarketValue
    });
    // You can add form validation and submission logic here
  };

  const conditionOptions = [
    'Excellent',
    'Good',
    'Fair',
    'Poor',
    'Needs Repair'
  ];

  const purchaseTypeOptions = [
    'Locally Purchased',
    'Internationally Purchased'
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
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          padding: '16px'
        }}>

          {/* Equipment Selection */}
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

          {/* Equipment Details */}
          <div className="form-section">
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
                Brand/Model
              </IonLabel>
              <IonInput
                value={brandModel}
                placeholder="Enter brand and model"
                onIonInput={(e) => setBrandModel(e.detail.value!)}
                className="modal-input"
              />
            </IonItem>

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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <IonItem className="custom-input" lines="none">
                <IonLabel position="stacked" className="input-label">
                  Years Used
                </IonLabel>
                <IonInput
                  value={yearsUsed}
                  type="number"
                  placeholder="Auto-calculated"
                  onIonInput={(e) => setYearsUsed(e.detail.value!)}
                  className="modal-input"
                  readonly={!!dateAcquired}
                />
              </IonItem>

              <IonItem className="custom-input" lines="none">
                <IonLabel position="stacked" className="input-label">
                  No. of Units
                </IonLabel>
                <IonInput
                  value={numberOfUnits}
                  type="number"
                  placeholder="Enter number of units"
                  onIonInput={(e) => setNumberOfUnits(e.detail.value!)}
                  className="modal-input"
                />
              </IonItem>
            </div>
          </div>

          {/* Machine Details */}
          <div className="form-section">
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

          {/* Date Information */}
          <div className="form-section date-section">
            <h3 className="section-title">Date Information</h3>
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Date Acquired
              </IonLabel>
              <IonDatetime
                value={dateAcquired}
                onIonChange={e => setDateAcquired(e.detail.value as string)}
                presentation="date"
                className="modal-input"
              />
            </IonItem>

            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Date Installed
              </IonLabel>
              <IonDatetime
                value={dateInstalled}
                onIonChange={e => setDateInstalled(e.detail.value as string)}
                presentation="date"
                className="modal-input"
              />
            </IonItem>

            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Date Operated
              </IonLabel>
              <IonDatetime
                value={dateOperated}
                onIonChange={e => setDateOperated(e.detail.value as string)}
                presentation="date"
                className="modal-input"
              />
            </IonItem>
          </div>

          {/* Life Metrics */}
          <div className="form-section">
            <h3 className="section-title">Life Metrics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <IonItem className="custom-input" lines="none">
                <IonLabel position="stacked" className="input-label">
                  Estimated Life (years)
                </IonLabel>
                <IonInput
                  value={estimatedLife}
                  type="number"
                  placeholder="Enter estimated life"
                  onIonInput={(e) => setEstimatedLife(e.detail.value!)}
                  className="modal-input"
                />
              </IonItem>

              <IonItem className="custom-input" lines="none">
                <IonLabel position="stacked" className="input-label">
                  Remaining Life (years)
                </IonLabel>
                <IonInput
                  value={remainingLife}
                  type="number"
                  placeholder="Auto-calculated"
                  className="modal-input"
                  readonly
                />
              </IonItem>
            </div>
          </div>

          {/* Financial Information */}
          <div className="form-section">
            <h3 className="section-title">Financial Information</h3>

            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Original Cost ($)
              </IonLabel>
              <IonInput
                value={originalCost}
                type="number"
                placeholder="Enter original cost"
                onIonInput={(e) => setOriginalCost(e.detail.value!)}
                className="modal-input"
              />
            </IonItem>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <IonItem className="custom-input" lines="none">
                <IonLabel position="stacked" className="input-label">
                  Freight ($)
                </IonLabel>
                <IonInput
                  value={freight}
                  type="number"
                  placeholder="Shipping cost"
                  onIonInput={(e) => setFreight(e.detail.value!)}
                  className="modal-input"
                />
              </IonItem>

              <IonItem className="custom-input" lines="none">
                <IonLabel position="stacked" className="input-label">
                  Insurance ($)
                </IonLabel>
                <IonInput
                  value={insurance}
                  type="number"
                  placeholder="Insurance cost"
                  onIonInput={(e) => setInsurance(e.detail.value!)}
                  className="modal-input"
                />
              </IonItem>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <IonItem className="custom-input" lines="none">
                <IonLabel position="stacked" className="input-label">
                  Installation ($)
                </IonLabel>
                <IonInput
                  value={installation}
                  type="number"
                  placeholder="Installation cost"
                  onIonInput={(e) => setInstallation(e.detail.value!)}
                  className="modal-input"
                />
              </IonItem>

              <IonItem className="custom-input" lines="none">
                <IonLabel position="stacked" className="input-label">
                  Others ($)
                </IonLabel>
                <IonInput
                  value={others}
                  type="number"
                  placeholder="Other costs"
                  onIonInput={(e) => setOthers(e.detail.value!)}
                  className="modal-input"
                />
              </IonItem>
            </div>

            <IonItem className="custom-input" lines="none" style={{ marginTop: '12px' }}>
              <IonLabel position="stacked" className="input-label" style={{ fontWeight: 'bold' }}>
                Total Cost ($)
              </IonLabel>
              <IonInput
                value={totalCost}
                type="number"
                placeholder="Auto-calculated"
                className="modal-input"
                style={{ fontWeight: 'bold', color: '#2c3e50' }}
                readonly
              />
            </IonItem>

            {/* Depreciation and Adjusted Market Value */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
              <IonItem className="custom-input" lines="none">
                <IonLabel position="stacked" className="input-label">
                  Depreciation (%)
                </IonLabel>
                <IonInput
                  value={getDepreciationDisplayValue()}
                  type="text"
                  placeholder="Enter percentage"
                  onIonInput={(e) => handleDepreciationChange(e.detail.value!)}
                  className="modal-input"
                />
              </IonItem>

              <IonItem className="custom-input" lines="none">
                <IonLabel position="stacked" className="input-label" style={{ fontWeight: 'bold' }}>
                  Adjusted Market Value ($)
                </IonLabel>
                <IonInput
                  value={adjustedMarketValue}
                  type="number"
                  placeholder="Auto-calculated"
                  className="modal-input"
                  style={{ fontWeight: 'bold', color: '#2c3e50' }}
                  readonly
                />
              </IonItem>
            </div>
          </div>
        </div>

        {/* Next Button */}
        <div className="next-btn-container">
          <Next onClick={handleNextClick} disabled={!isFormValid} />
        </div>
      </IonContent>
    </IonModal>
  );
};

export default MachineModal;