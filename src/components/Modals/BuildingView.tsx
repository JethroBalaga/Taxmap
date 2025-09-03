// src/components/Modals/BuildingView.tsx
import React, { useState, useEffect } from 'react';
import {
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
  IonText,
  IonSpinner,
  IonNote
} from '@ionic/react';
import { FormData } from './Form';
import { BuildingData } from './BuildingModal';
import { 
  StructureTypeData, 
  getStructureTypesByKindId 
} from '../../utils/structureTypeLocalStorage';
import { 
  BuildingCodeData,
  getBuildingCodesByStructureCode 
} from '../../utils/buildingCodeLocalStorage';
import '../../CSS/modal.css';

interface BuildingViewProps {
  onSuccess: (data: BuildingData) => void;
  onDismiss: () => void;
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
  structureTypes: StructureTypeData[];
  isLoading: boolean;
}> = ({ value, onChange, error, structureTypes, isLoading }) => {
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
        disabled={isLoading}
      >
        {isLoading ? (
          <IonSelectOption value="" disabled>
            <IonSpinner name="dots" /> Loading structure types...
          </IonSelectOption>
        ) : structureTypes.length === 0 ? (
          <IonSelectOption value="" disabled>
            No structure types available
          </IonSelectOption>
        ) : (
          structureTypes.map((type) => (
            <IonSelectOption key={type.structure_code} value={type.structure_code}>
              {type.description}
            </IonSelectOption>
          ))
        )}
      </IonSelect>
      {error && (
        <IonNote color="danger" className="error-message">
          <small>{error}</small>
        </IonNote>
      )}
    </IonItem>
  );
};

// Building Code Dropdown Component with proper styling
const BuildingCodeDrop: React.FC<{
  value: string;
  onChange: (value: string) => void;
  error?: string;
  buildingCodes: BuildingCodeData[];
  isLoading: boolean;
  selectedBuildingCode: BuildingCodeData | null;
}> = ({ value, onChange, error, buildingCodes, isLoading, selectedBuildingCode }) => (
  <>
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
        disabled={isLoading}
      >
        {isLoading ? (
          <IonSelectOption value="" disabled>
            <IonSpinner name="dots" /> Loading building codes...
          </IonSelectOption>
        ) : buildingCodes.length === 0 ? (
          <IonSelectOption value="" disabled>
            No building codes available
          </IonSelectOption>
        ) : (
          buildingCodes.map((code) => (
            <IonSelectOption key={code.building_code} value={code.building_code}>
              {code.description} ({code.building_code})
            </IonSelectOption>
          ))
        )}
      </IonSelect>
      {error && (
        <IonNote color="danger" className="error-message">
          <small>{error}</small>
        </IonNote>
      )}
    </IonItem>
    
    {/* Display rate for selected building code */}
    {selectedBuildingCode && (
      <IonItem className="custom-input" lines="none">
        <IonLabel position="stacked" className="input-label">Rate</IonLabel>
        <IonInput
          value={selectedBuildingCode.rate.toString()}
          readonly
          className="modal-input"
          style={{ opacity: 0.7 }}
        />
        <IonNote slot="helper">Rate for selected building code</IonNote>
      </IonItem>
    )}
  </>
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
      <IonNote color="danger" className="error-message">
        <small>{error}</small>
      </IonNote>
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

const BuildingView: React.FC<BuildingViewProps> = ({ 
  onSuccess,
  onDismiss,
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
  const [isFormValid, setIsFormValid] = useState(false);
  const [structureTypes, setStructureTypes] = useState<StructureTypeData[]>([]);
  const [buildingCodes, setBuildingCodes] = useState<BuildingCodeData[]>([]);
  const [isLoadingStructureTypes, setIsLoadingStructureTypes] = useState(false);
  const [isLoadingBuildingCodes, setIsLoadingBuildingCodes] = useState(false);
  const [selectedBuildingCode, setSelectedBuildingCode] = useState<BuildingCodeData | null>(null);

  // Fetch structure types based on kind_id from formData
  useEffect(() => {
    const fetchStructureTypes = async () => {
      if (!formData.kind) return;
      
      setIsLoadingStructureTypes(true);
      try {
        const kindId = parseInt(formData.kind);
        if (!isNaN(kindId)) {
          const structureTypesData = await getStructureTypesByKindId(kindId);
          setStructureTypes(structureTypesData);
          console.log('Fetched structure types for kind_id:', kindId, structureTypesData);
        }
      } catch (error) {
        console.error('Error fetching structure types:', error);
        setStructureTypes([]);
      } finally {
        setIsLoadingStructureTypes(false);
      }
    };

    fetchStructureTypes();
  }, [formData.kind]);

  // Fetch building codes when structure type changes
  useEffect(() => {
    const fetchBuildingCodes = async () => {
      if (!buildingData.structureType) {
        setBuildingCodes([]);
        setSelectedBuildingCode(null);
        return;
      }
      
      setIsLoadingBuildingCodes(true);
      try {
        const buildingCodesData = await getBuildingCodesByStructureCode(buildingData.structureType);
        setBuildingCodes(buildingCodesData);
        console.log('Fetched building codes for structure:', buildingData.structureType, buildingCodesData);
        
        // If there's a previously selected building code that matches the new structure type, keep it
        if (buildingData.buildingCode) {
          const matchingCode = buildingCodesData.find(
            code => code.building_code === buildingData.buildingCode
          );
          if (matchingCode) {
            setSelectedBuildingCode(matchingCode);
          } else {
            setBuildingData(prev => ({ ...prev, buildingCode: '' }));
            setSelectedBuildingCode(null);
          }
        }
      } catch (error) {
        console.error('Error fetching building codes:', error);
        setBuildingCodes([]);
        setSelectedBuildingCode(null);
      } finally {
        setIsLoadingBuildingCodes(false);
      }
    };

    fetchBuildingCodes();
  }, [buildingData.structureType]);

  // Update selected building code when building code changes
  useEffect(() => {
    if (buildingData.buildingCode && buildingCodes.length > 0) {
      const code = buildingCodes.find(
        bc => bc.building_code === buildingData.buildingCode
      );
      setSelectedBuildingCode(code || null);
    } else {
      setSelectedBuildingCode(null);
    }
  }, [buildingData.buildingCode, buildingCodes]);

  // Log received form data for debugging
  useEffect(() => {
    if (formData) {
      console.log('Received form data in BuildingView:', formData);
    }
  }, [formData]);

  // Reset form when initialData changes
  useEffect(() => {
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
    setSelectedBuildingCode(null);
  }, [initialData]);

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

  return (
    <>
      {/* Display received form data for reference */}
      <div style={{ padding: '10px', background: '#f5f5f5', marginBottom: '15px', borderRadius: '8px' }}>
        <IonText color="medium">
          <small>Form Reference: District {formData.district}, Kind ID: {formData.kind}, Area: {formData.area}m²</small>
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
                structureTypes={structureTypes}
                isLoading={isLoadingStructureTypes}
              />
              
              {/* Building Code Dropdown */}
              <BuildingCodeDrop
                value={buildingData.buildingCode}
                onChange={(value) => handleInputChange('buildingCode', value)}
                error={errors.buildingCode}
                buildingCodes={buildingCodes}
                isLoading={isLoadingBuildingCodes}
                selectedBuildingCode={selectedBuildingCode}
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
    </>
  );
};

export default BuildingView;