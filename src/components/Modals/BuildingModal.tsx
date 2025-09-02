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
  IonButton
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import Next from '../GlobalComponent/Next'; // Import your global Next component
import StructureTypeDrop from '../BuildingModalComponents/StructureTypeDrop';
import BuildingCodeDrop from '../BuildingModalComponents/BuildingCodeDrop';
import NumericInputField from '../BuildingModalComponents/NumericInputField';
import TextInputField from '../BuildingModalComponents/TextInputField';
import DateInputField from '../BuildingModalComponents/DateInputField';

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
  const [buildingCodes] = useState<string[]>([]); // Empty for now as requested
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
    <IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Building Description</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleDismiss}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            {/* Structure Type Dropdown */}
            <IonCol size="12" size-md="6">
              <StructureTypeDrop
                value={formData.structureType}
                onChange={(value) => handleInputChange('structureType', value)}
                error={errors.structureType}
              />
            </IonCol>
            
            {/* Building Code Dropdown */}
            <IonCol size="12" size-md="6">
              <BuildingCodeDrop
                value={formData.buildingCode}
                onChange={(value) => handleInputChange('buildingCode', value)}
                error={errors.buildingCode}
                buildingCodes={buildingCodes}
              />
            </IonCol>
            
            {/* Storey Input */}
            <IonCol size="12" size-md="6">
              <NumericInputField
                label="Storey"
                value={formData.storey}
                onChange={(value) => handleInputChange('storey', value)}
                placeholder="Enter number of storeys"
                error={errors.storey}
                required={true}
                min={1}
              />
            </IonCol>
            
            {/* Floor Order Input */}
            <IonCol size="12" size-md="6">
              <NumericInputField
                label="Floor Order"
                value={formData.floorOrder}
                onChange={(value) => handleInputChange('floorOrder', value)}
                placeholder="Enter floor order"
                error={errors.floorOrder}
                required={true}
                min={0}
              />
            </IonCol>
            
            {/* Building Age Input */}
            <IonCol size="12" size-md="6">
              <TextInputField
                label="Building Age"
                value={formData.buildingAge}
                onChange={(value) => handleInputChange('buildingAge', value)}
                placeholder="Enter building age"
              />
            </IonCol>
            
            {/* Building Permit Input */}
            <IonCol size="12" size-md="6">
              <TextInputField
                label="Building Permit"
                value={formData.buildingPermit}
                onChange={(value) => handleInputChange('buildingPermit', value)}
                placeholder="Enter building permit"
              />
            </IonCol>
            
            {/* Construction Percent Input */}
            <IonCol size="12" size-md="6">
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
            </IonCol>
            
            {/* Date Constructed Input */}
            <IonCol size="12" size-md="6">
              <DateInputField
                label="Date Constructed"
                value={formData.dateConstructed}
                onChange={(value) => handleInputChange('dateConstructed', value)}
              />
            </IonCol>
            
            {/* Date Occupied Input */}
            <IonCol size="12" size-md="6">
              <DateInputField
                label="Date Occupied"
                value={formData.dateOccupied}
                onChange={(value) => handleInputChange('dateOccupied', value)}
              />
            </IonCol>
            
            {/* Date Completed Input */}
            <IonCol size="12" size-md="6">
              <DateInputField
                label="Date Completed"
                value={formData.dateCompleted}
                onChange={(value) => handleInputChange('dateCompleted', value)}
              />
            </IonCol>
            
            {/* Depreciation Rate Input */}
            <IonCol size="12" size-md="6">
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
            </IonCol>
          </IonRow>
        </IonGrid>
        
        <div className="ion-padding ion-text-center">
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