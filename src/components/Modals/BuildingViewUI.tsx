// src/components/Modals/BuildingViewUI.tsx
import React from 'react';
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
import { StructureTypeData } from '../../utils/structureTypeLocalStorage';
import { BuildingCodeData } from '../../utils/buildingCodeLocalStorage';
import '../../CSS/modal.css';

interface BuildingViewUIProps {
  formData: FormData;
  buildingData: BuildingData;
  errors: Partial<Record<keyof BuildingData, string>>;
  isFormValid: boolean;
  structureTypes: StructureTypeData[];
  buildingCodes: BuildingCodeData[];
  isLoadingStructureTypes: boolean;
  isLoadingBuildingCodes: boolean;
  selectedBuildingCode: BuildingCodeData | null;
  onInputChange: (field: keyof BuildingData, value: any) => void;
  onNextClick: () => void;
}

// Next Button Component with proper styling
export const Next: React.FC<{ onClick: () => void; disabled: boolean }> = ({ onClick, disabled }) => (
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
export const StructureTypeDrop: React.FC<{
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
export const BuildingCodeDrop: React.FC<{
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
export const NumericInputField: React.FC<{
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
export const TextInputField: React.FC<{
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
export const DateInputField: React.FC<{
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

const BuildingViewUI: React.FC<BuildingViewUIProps> = ({
  formData,
  buildingData,
  errors,
  isFormValid,
  structureTypes,
  buildingCodes,
  isLoadingStructureTypes,
  isLoadingBuildingCodes,
  selectedBuildingCode,
  onInputChange,
  onNextClick
}) => {
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
                onChange={(value) => onInputChange('structureType', value)}
                error={errors.structureType}
                structureTypes={structureTypes}
                isLoading={isLoadingStructureTypes}
              />
              
              {/* Building Code Dropdown */}
              <BuildingCodeDrop
                value={buildingData.buildingCode}
                onChange={(value) => onInputChange('buildingCode', value)}
                error={errors.buildingCode}
                buildingCodes={buildingCodes}
                isLoading={isLoadingBuildingCodes}
                selectedBuildingCode={selectedBuildingCode}
              />
              
              {/* Storey Input */}
              <NumericInputField
                label="Storey"
                value={buildingData.storey}
                onChange={(value) => onInputChange('storey', value)}
                placeholder="Enter number of storeys"
                error={errors.storey}
                required={true}
                min={1}
              />
              
              {/* Floor Order Input */}
              <NumericInputField
                label="Floor Order"
                value={buildingData.floorOrder}
                onChange={(value) => onInputChange('floorOrder', value)}
                placeholder="Enter floor order"
                error={errors.floorOrder}
                required={true}
                min={0}
              />
              
              {/* Building Age Input */}
              <TextInputField
                label="Building Age"
                value={buildingData.buildingAge}
                onChange={(value) => onInputChange('buildingAge', value)}
                placeholder="Enter building age"
              />
              
              {/* Building Permit Input */}
              <TextInputField
                label="Building Permit"
                value={buildingData.buildingPermit}
                onChange={(value) => onInputChange('buildingPermit', value)}
                placeholder="Enter building permit"
              />
              
              {/* Construction Percent Input */}
              <NumericInputField
                label="Construction %"
                value={buildingData.constructionPercent}
                onChange={(value) => onInputChange('constructionPercent', value)}
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
                onChange={(value) => onInputChange('depreciationRate', value)}
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
                onChange={(value) => onInputChange('dateConstructed', value)}
              />
              
              {/* Date Occupied Input */}
              <DateInputField
                label="Date Occupied"
                value={buildingData.dateOccupied}
                onChange={(value) => onInputChange('dateOccupied', value)}
              />
              
              {/* Date Completed Input */}
              <DateInputField
                label="Date Completed"
                value={buildingData.dateCompleted}
                onChange={(value) => onInputChange('dateCompleted', value)}
              />
            </div>
          </IonCol>
        </IonRow>
      </IonGrid>
      
      <div className="next-btn-container">
        <Next 
          onClick={onNextClick} 
          disabled={!isFormValid}
        />
      </div>
    </>
  );
};

export default BuildingViewUI;