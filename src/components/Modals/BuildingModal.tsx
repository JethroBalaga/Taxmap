// src/components/Modals/BuildingModal.tsx
import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonDatetime,
  IonText
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import '../../CSS/modal.css';

// Import the FormData interface from Form.tsx
import { FormData } from './Form';

interface BuildingData {
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
}

interface BuildingModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSuccess: (data: BuildingData) => void;
  formData: FormData;
  initialData?: BuildingData;
}

// Next Button Component with proper styling
const Next: React.FC<{ onClick: () => void; disabled: boolean }> = ({ onClick, disabled }) => (
  <IonButton 
    onClick={onClick} 
    disabled={disabled}
    expand="block"
    className="next-button"
    style={{ fontWeight: 'bold' }}
  >
    Next
  </IonButton>
);

// Structure Type Dropdown Component with proper styling
const StructureTypeDrop: React.FC<{
  value: string;
  onChange: (value: string) => void;
  error?: string;
}> = ({ value, onChange, error }) => {
  const structureTypes = [
    'Residential',
    'Commercial',
    'Industrial',
    'Institutional',
    'Mixed-use',
    'Other'
  ];

  return (
    <IonItem className="custom-input" lines="none">
      <IonLabel position="stacked" className="input-label">
        Structure Type <span style={{ color: 'red' }}>*</span>
      </IonLabel>
      <IonSelect
        value={value}
        placeholder="Select structure type"
        onIonChange={(e) => onChange(e.detail.value as string)}
        interface="popover"
        className="modal-input"
      >
        {structureTypes.map((type) => (
          <IonSelectOption key={type} value={type}>
            {type}
          </IonSelectOption>
        ))}
      </IonSelect>
      {error && (
        <IonText color="danger" className="error-message">
          <small>{error}</small>
        </IonText>
      )}
    </IonItem>
  );
};

// Building Code Dropdown Component with proper styling
const BuildingCodeDrop: React.FC<{
  value: string;
  onChange: (value: string) => void;
  error?: string;
  buildingCodes: string[];
}> = ({ value, onChange, error, buildingCodes }) => (
  <IonItem className="custom-input" lines="none">
    <IonLabel position="stacked" className="input-label">
      Building Code <span style={{ color: 'red' }}>*</span>
    </IonLabel>
    <IonSelect
      value={value}
      placeholder="Select building code"
      onIonChange={(e) => onChange(e.detail.value as string)}
      interface="popover"
      className="modal-input"
    >
      {buildingCodes.length > 0 ? (
        buildingCodes.map((code) => (
          <IonSelectOption key={code} value={code}>
            {code}
          </IonSelectOption>
        ))
      ) : (
        <IonSelectOption value="N/A">No codes available</IonSelectOption>
      )}
    </IonSelect>
    {error && (
      <IonText color="danger" className="error-message">
        <small>{error}</small>
      </IonText>
    )}
  </IonItem>
);

// Numeric Input Field Component with proper styling
const NumericInputField: React.FC<{
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder: string;
  error?: string;
  required?: boolean;
  min?: number;
  max?: number;
}> = ({ label, value, onChange, placeholder, error, required, min, max }) => (
  <IonItem className="custom-input" lines="none">
    <IonLabel position="stacked" className="input-label">
      {label} {required && <span style={{ color: 'red' }}>*</span>}
    </IonLabel>
    <IonInput
      type="number"
      value={value}
      placeholder={placeholder}
      onIonInput={(e) => {
        const val = e.detail.value!;
        onChange(val === '' ? null : Number(val));
      }}
      min={min}
      max={max}
      className="modal-input"
    />
    {error && (
      <IonText color="danger" className="error-message">
        <small>{error}</small>
      </IonText>
    )}
  </IonItem>
);

// Text Input Field Component with proper styling
const TextInputField: React.FC<{
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
}> = ({ label, value, onChange, placeholder }) => (
  <IonItem className="custom-input" lines="none">
    <IonLabel position="stacked" className="input-label">{label}</IonLabel>
    <IonInput
      value={value || ''}
      placeholder={placeholder}
      onIonInput={(e) => onChange(e.detail.value || null)}
      className="modal-input"
    />
  </IonItem>
);

// Date Input Field Component with proper styling
const DateInputField: React.FC<{
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
}> = ({ label, value, onChange }) => (
  <IonItem className="custom-input" lines="none">
    <IonLabel position="stacked" className="input-label">{label}</IonLabel>
    <IonDatetime
      presentation="date"
      value={value || undefined}
      onIonChange={(e) => onChange(e.detail.value as string || null)}
      className="modal-input"
    />
  </IonItem>
);

const BuildingModal: React.FC<BuildingModalProps> = ({ 
  isOpen, 
  onDismiss, 
  onSuccess,
  formData,
  initialData 
}) => {
  const [buildingData, setBuildingData] = useState<BuildingData>({
    structureType: '',
    buildingCode: '',
    storey: null,
    floorOrder: null,
    buildingAge: null,
    buildingPermit: null,
    constructionPercent: null,
    dateConstructed: null,
    dateOccupied: null,
    dateCompleted: null,
    depreciationRate: null
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BuildingData, string>>>({});
  const [buildingCodes] = useState<string[]>(['Code-1', 'Code-2', 'Code-3']);
  const [isFormValid, setIsFormValid] = useState(false);

  // Log received form data for debugging
  useEffect(() => {
    if (isOpen && formData) {
      console.log('Received form data in BuildingModal:', formData);
      // You can use the formData here to pre-fill fields or make decisions
    }
  }, [isOpen, formData]);

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setBuildingData(initialData);
      } else {
        setBuildingData({
          structureType: '',
          buildingCode: '',
          storey: null,
          floorOrder: null,
          buildingAge: null,
          buildingPermit: null,
          constructionPercent: null,
          dateConstructed: null,
          dateOccupied: null,
          dateCompleted: null,
          depreciationRate: null
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Check form validity whenever building data changes
  useEffect(() => {
    const isValid = 
      buildingData.structureType.trim() !== '' &&
      buildingData.buildingCode.trim() !== '' &&
      buildingData.storey !== null && buildingData.storey >= 1 &&
      buildingData.floorOrder !== null && buildingData.floorOrder >= 0 &&
      buildingData.constructionPercent !== null && 
        buildingData.constructionPercent >= 0 && buildingData.constructionPercent <= 100 &&
      buildingData.depreciationRate !== null && 
        buildingData.depreciationRate >= 0 && buildingData.depreciationRate <= 100;
    
    setIsFormValid(isValid);
  }, [buildingData]);

  // Handle input changes
  const handleInputChange = (field: keyof BuildingData, value: any) => {
    setBuildingData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BuildingData, string>> = {};
    
    if (!buildingData.structureType) newErrors.structureType = 'Structure type is required';
    if (!buildingData.buildingCode) newErrors.buildingCode = 'Building code is required';
    if (buildingData.storey === null || buildingData.storey < 1) newErrors.storey = 'Valid storey count is required';
    if (buildingData.floorOrder === null || buildingData.floorOrder < 0) newErrors.floorOrder = 'Valid floor order is required';
    if (buildingData.constructionPercent === null || buildingData.constructionPercent < 0 || buildingData.constructionPercent > 100) {
      newErrors.constructionPercent = 'Construction percentage must be between 0-100';
    }
    if (buildingData.depreciationRate === null || buildingData.depreciationRate < 0 || buildingData.depreciationRate > 100) {
      newErrors.depreciationRate = 'Depreciation rate must be between 0-100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleNextClick = () => {
    if (validateForm()) {
      onSuccess(buildingData);
    }
  };

  // Handle modal dismissal
  const handleDismiss = () => {
    setErrors({});
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
        {/* Display received form data for reference */}
        <div style={{ padding: '10px', background: '#f5f5f5', marginBottom: '15px', borderRadius: '8px' }}>
          <IonText color="medium">
            <small>Form Reference: District {formData.district}, Area: {formData.area}m²</small>
          </IonText>
        </div>

        <IonGrid className="custom-grid">
          <IonRow>
            {/* Left Column - All non-date inputs */}
            <IonCol size="12" size-md="6" className="custom-col">
              <div className="form-section">
                <h3 className="section-title">Building Information</h3>
                
                {/* Structure Type Dropdown */}
                <StructureTypeDrop
                  value={buildingData.structureType}
                  onChange={(value) => handleInputChange('structureType', value)}
                  error={errors.structureType}
                />
                
                {/* Building Code Dropdown */}
                <BuildingCodeDrop
                  value={buildingData.buildingCode}
                  onChange={(value) => handleInputChange('buildingCode', value)}
                  error={errors.buildingCode}
                  buildingCodes={buildingCodes}
                />
                
                {/* Storey Input */}
                <NumericInputField
                  label="Storey"
                  value={buildingData.storey}
                  onChange={(value) => handleInputChange('storey', value)}
                  placeholder="Enter number of storeys"
                  error={errors.storey}
                  required={true}
                  min={1}
                />
                
                {/* Floor Order Input */}
                <NumericInputField
                  label="Floor Order"
                  value={buildingData.floorOrder}
                  onChange={(value) => handleInputChange('floorOrder', value)}
                  placeholder="Enter floor order"
                  error={errors.floorOrder}
                  required={true}
                  min={0}
                />
                
                {/* Building Age Input */}
                <TextInputField
                  label="Building Age"
                  value={buildingData.buildingAge}
                  onChange={(value) => handleInputChange('buildingAge', value)}
                  placeholder="Enter building age"
                />
                
                {/* Building Permit Input */}
                <TextInputField
                  label="Building Permit"
                  value={buildingData.buildingPermit}
                  onChange={(value) => handleInputChange('buildingPermit', value)}
                  placeholder="Enter building permit"
                />
                
                {/* Construction Percent Input */}
                <NumericInputField
                  label="Construction %"
                  value={buildingData.constructionPercent}
                  onChange={(value) => handleInputChange('constructionPercent', value)}
                  placeholder="Enter percentage (0-100)"
                  error={errors.constructionPercent}
                  required={true}
                  min={0}
                  max={100}
                />
                
                {/* Depreciation Rate Input */}
                <NumericInputField
                  label="Depreciation Rate %"
                  value={buildingData.depreciationRate}
                  onChange={(value) => handleInputChange('depreciationRate', value)}
                  placeholder="Enter rate (0-100)"
                  error={errors.depreciationRate}
                  required={true}
                  min={0}
                  max={100}
                />
              </div>
            </IonCol>
            
            {/* Right Column - All date inputs */}
            <IonCol size="12" size-md="6" className="custom-col">
              <div className="form-section date-section">
                <h3 className="section-title">Date Information</h3>
                
                {/* Date Constructed Input */}
                <DateInputField
                  label="Date Constructed"
                  value={buildingData.dateConstructed}
                  onChange={(value) => handleInputChange('dateConstructed', value)}
                />
                
                {/* Date Occupied Input */}
                <DateInputField
                  label="Date Occupied"
                  value={buildingData.dateOccupied}
                  onChange={(value) => handleInputChange('dateOccupied', value)}
                />
                
                {/* Date Completed Input */}
                <DateInputField
                  label="Date Completed"
                  value={buildingData.dateCompleted}
                  onChange={(value) => handleInputChange('dateCompleted', value)}
                />
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
        
        <div className="next-btn-container">
          <Next 
            onClick={handleNextClick} 
            disabled={!isFormValid}
          />
        </div>
      </IonContent>
    </IonModal>
  );
};

export default BuildingModal;