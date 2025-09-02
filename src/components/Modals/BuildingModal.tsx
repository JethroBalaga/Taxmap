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

// Import your CSS file
import '../../CSS/modal.css';

// Interface for our building data
interface BuildingData {
  structureType: string;
  buildingCode: string;
  storey: number | null;
  floorOrder: number | null;
  buildingAge: string;
  buildingPermit: string;
  constructionPercent: number | null;
  dateConstructed: string;
  dateOccupied: string;
  dateCompleted: string;
  depreciationRate: number | null;
}

// Props for the BuildingModal component
interface BuildingModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSuccess: (data: BuildingData) => void;
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
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}> = ({ label, value, onChange, placeholder }) => (
  <IonItem className="custom-input" lines="none">
    <IonLabel position="stacked" className="input-label">{label}</IonLabel>
    <IonInput
      value={value}
      placeholder={placeholder}
      onIonInput={(e) => onChange(e.detail.value || '')}
      className="modal-input"
    />
  </IonItem>
);

// Date Input Field Component with proper styling
const DateInputField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
  <IonItem className="custom-input" lines="none">
    <IonLabel position="stacked" className="input-label">{label}</IonLabel>
    <IonDatetime
      presentation="date"
      value={value}
      onIonChange={(e) => onChange(e.detail.value as string)}
      className="modal-input"
    />
  </IonItem>
);

const BuildingModal: React.FC<BuildingModalProps> = ({ 
  isOpen, 
  onDismiss, 
  onSuccess,
  initialData 
}) => {
  const [formData, setFormData] = useState<BuildingData>({
    structureType: '',
    buildingCode: '',
    storey: null,
    floorOrder: null,
    buildingAge: '',
    buildingPermit: '',
    constructionPercent: null,
    dateConstructed: '',
    dateOccupied: '',
    dateCompleted: '',
    depreciationRate: null
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BuildingData, string>>>({});
  const [buildingCodes] = useState<string[]>(['Code-1', 'Code-2', 'Code-3']); // Added sample codes for testing
  const [isFormValid, setIsFormValid] = useState(false);

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({
          structureType: '',
          buildingCode: '',
          storey: null,
          floorOrder: null,
          buildingAge: '',
          buildingPermit: '',
          constructionPercent: null,
          dateConstructed: '',
          dateOccupied: '',
          dateCompleted: '',
          depreciationRate: null
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Check form validity whenever form data changes
  useEffect(() => {
    const isValid = 
      formData.structureType.trim() !== '' &&
      formData.buildingCode.trim() !== '' &&
      formData.storey !== null && formData.storey >= 1 &&
      formData.floorOrder !== null && formData.floorOrder >= 0 &&
      formData.constructionPercent !== null && 
        formData.constructionPercent >= 0 && formData.constructionPercent <= 100 &&
      formData.depreciationRate !== null && 
        formData.depreciationRate >= 0 && formData.depreciationRate <= 100;
    
    setIsFormValid(isValid);
  }, [formData]);

  // Handle input changes
  const handleInputChange = (field: keyof BuildingData, value: any) => {
    setFormData(prev => ({
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
    
    if (!formData.structureType) newErrors.structureType = 'Structure type is required';
    if (!formData.buildingCode) newErrors.buildingCode = 'Building code is required';
    if (formData.storey === null || formData.storey < 1) newErrors.storey = 'Valid storey count is required';
    if (formData.floorOrder === null || formData.floorOrder < 0) newErrors.floorOrder = 'Valid floor order is required';
    if (formData.constructionPercent === null || formData.constructionPercent < 0 || formData.constructionPercent > 100) {
      newErrors.constructionPercent = 'Construction percentage must be between 0-100';
    }
    if (formData.depreciationRate === null || formData.depreciationRate < 0 || formData.depreciationRate > 100) {
      newErrors.depreciationRate = 'Depreciation rate must be between 0-100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleNextClick = () => {
    if (validateForm()) {
      onSuccess(formData);
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
        <IonGrid className="custom-grid">
          <IonRow>
            {/* Left Column - All non-date inputs */}
            <IonCol size="12" size-md="6" className="custom-col">
              <div className="form-section">
                <h3 className="section-title">Building Information</h3>
                
                {/* Structure Type Dropdown */}
                <StructureTypeDrop
                  value={formData.structureType}
                  onChange={(value) => handleInputChange('structureType', value)}
                  error={errors.structureType}
                />
                
                {/* Building Code Dropdown */}
                <BuildingCodeDrop
                  value={formData.buildingCode}
                  onChange={(value) => handleInputChange('buildingCode', value)}
                  error={errors.buildingCode}
                  buildingCodes={buildingCodes}
                />
                
                {/* Storey Input */}
                <NumericInputField
                  label="Storey"
                  value={formData.storey}
                  onChange={(value) => handleInputChange('storey', value)}
                  placeholder="Enter number of storeys"
                  error={errors.storey}
                  required={true}
                  min={1}
                />
                
                {/* Floor Order Input */}
                <NumericInputField
                  label="Floor Order"
                  value={formData.floorOrder}
                  onChange={(value) => handleInputChange('floorOrder', value)}
                  placeholder="Enter floor order"
                  error={errors.floorOrder}
                  required={true}
                  min={0}
                />
                
                {/* Building Age Input */}
                <TextInputField
                  label="Building Age"
                  value={formData.buildingAge}
                  onChange={(value) => handleInputChange('buildingAge', value)}
                  placeholder="Enter building age"
                />
                
                {/* Building Permit Input */}
                <TextInputField
                  label="Building Permit"
                  value={formData.buildingPermit}
                  onChange={(value) => handleInputChange('buildingPermit', value)}
                  placeholder="Enter building permit"
                />
                
                {/* Construction Percent Input */}
                <NumericInputField
                  label="Construction %"
                  value={formData.constructionPercent}
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
                  value={formData.depreciationRate}
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
                  value={formData.dateConstructed}
                  onChange={(value) => handleInputChange('dateConstructed', value)}
                />
                
                {/* Date Occupied Input */}
                <DateInputField
                  label="Date Occupied"
                  value={formData.dateOccupied}
                  onChange={(value) => handleInputChange('dateOccupied', value)}
                />
                
                {/* Date Completed Input */}
                <DateInputField
                  label="Date Completed"
                  value={formData.dateCompleted}
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