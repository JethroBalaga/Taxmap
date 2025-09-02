import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonButton
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import Next from '../GlobalComponent/Next'; // Import your global Next component

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
  
  // Structure types for the dropdown
  const structureTypes = [
    { id: 'residential', name: 'Residential' },
    { id: 'commercial', name: 'Commercial' },
    { id: 'industrial', name: 'Industrial' },
    { id: 'institutional', name: 'Institutional' },
    { id: 'agricultural', name: 'Agricultural' },
    { id: 'mixed_use', name: 'Mixed Use' }
  ];

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
            {/* Structure Type Dropdown - Added before Building Code */}
            <IonCol size="12" size-md="6">
              <IonItem>
                <IonLabel position="stacked">Structure Type *</IonLabel>
                <IonSelect 
                  value={formData.structureType} 
                  placeholder="Select Structure Type"
                  onIonChange={e => handleInputChange('structureType', e.detail.value)}
                  interface="popover"
                  className={errors.structureType ? 'ion-invalid' : ''}
                >
                  {structureTypes.map(type => (
                    <IonSelectOption key={type.id} value={type.id}>
                      {type.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
                {errors.structureType && <IonText color="danger" className="ion-padding-start">{errors.structureType}</IonText>}
              </IonItem>
            </IonCol>
            
            <IonCol size="12" size-md="6">
              <IonItem>
                <IonLabel position="stacked">Building Code *</IonLabel>
                <IonSelect 
                  value={formData.buildingCode} 
                  placeholder="Select Building Code"
                  onIonChange={e => handleInputChange('buildingCode', e.detail.value)}
                  interface="popover"
                  className={errors.buildingCode ? 'ion-invalid' : ''}
                >
                  {buildingCodes.map(code => (
                    <IonSelectOption key={code} value={code}>{code}</IonSelectOption>
                  ))}
                </IonSelect>
                {errors.buildingCode && <IonText color="danger" className="ion-padding-start">{errors.buildingCode}</IonText>}
              </IonItem>
            </IonCol>
            
            <IonCol size="12" size-md="6">
              <IonItem>
                <IonLabel position="stacked">Storey *</IonLabel>
                <IonInput
                  type="number"
                  value={formData.storey}
                  placeholder="Enter number of storeys"
                  onIonInput={e => handleInputChange('storey', parseInt(e.detail.value!, 10) || null)}
                  className={errors.storey ? 'ion-invalid' : ''}
                />
                {errors.storey && <IonText color="danger" className="ion-padding-start">{errors.storey}</IonText>}
              </IonItem>
            </IonCol>
            
            <IonCol size="12" size-md="6">
              <IonItem>
                <IonLabel position="stacked">Floor Order *</IonLabel>
                <IonInput
                  type="number"
                  value={formData.floorOrder}
                  placeholder="Enter floor order"
                  onIonInput={e => handleInputChange('floorOrder', parseInt(e.detail.value!, 10) || null)}
                  className={errors.floorOrder ? 'ion-invalid' : ''}
                />
                {errors.floorOrder && <IonText color="danger" className="ion-padding-start">{errors.floorOrder}</IonText>}
              </IonItem>
            </IonCol>
            
            <IonCol size="12" size-md="6">
              <IonItem>
                <IonLabel position="stacked">Building Age</IonLabel>
                <IonInput
                  type="text"
                  value={formData.buildingAge}
                  placeholder="Enter building age"
                  onIonInput={e => handleInputChange('buildingAge', e.detail.value!)}
                />
              </IonItem>
            </IonCol>
            
            <IonCol size="12" size-md="6">
              <IonItem>
                <IonLabel position="stacked">Building Permit</IonLabel>
                <IonInput
                  type="text"
                  value={formData.buildingPermit}
                  placeholder="Enter building permit"
                  onIonInput={e => handleInputChange('buildingPermit', e.detail.value!)}
                />
              </IonItem>
            </IonCol>
            
            <IonCol size="12" size-md="6">
              <IonItem>
                <IonLabel position="stacked">Construction % *</IonLabel>
                <IonInput
                  type="number"
                  value={formData.constructionPercent}
                  placeholder="Enter percentage (0-100)"
                  onIonInput={e => handleInputChange('constructionPercent', parseInt(e.detail.value!, 10) || null)}
                  className={errors.constructionPercent ? 'ion-invalid' : ''}
                />
                {errors.constructionPercent && <IonText color="danger" className="ion-padding-start">{errors.constructionPercent}</IonText>}
              </IonItem>
            </IonCol>
            
            <IonCol size="12" size-md="6">
              <IonItem>
                <IonLabel position="stacked">Date Constructed</IonLabel>
                <IonDatetime
                  value={formData.dateConstructed}
                  onIonChange={e => handleInputChange('dateConstructed', e.detail.value!)}
                  presentation="date"
                />
              </IonItem>
            </IonCol>
            
            <IonCol size="12" size-md="6">
              <IonItem>
                <IonLabel position="stacked">Date Occupied</IonLabel>
                <IonDatetime
                  value={formData.dateOccupied}
                  onIonChange={e => handleInputChange('dateOccupied', e.detail.value!)}
                  presentation="date"
                />
              </IonItem>
            </IonCol>
            
            <IonCol size="12" size-md="6">
              <IonItem>
                <IonLabel position="stacked">Date Completed</IonLabel>
                <IonDatetime
                  value={formData.dateCompleted}
                  onIonChange={e => handleInputChange('dateCompleted', e.detail.value!)}
                  presentation="date"
                />
              </IonItem>
            </IonCol>
            
            <IonCol size="12" size-md="6">
              <IonItem>
                <IonLabel position="stacked">Depreciation Rate % *</IonLabel>
                <IonInput
                  type="number"
                  value={formData.depreciationRate}
                  placeholder="Enter rate (0-100)"
                  onIonInput={e => handleInputChange('depreciationRate', parseInt(e.detail.value!, 10) || null)}
                  className={errors.depreciationRate ? 'ion-invalid' : ''}
                />
                {errors.depreciationRate && <IonText color="danger" className="ion-padding-start">{errors.depreciationRate}</IonText>}
              </IonItem>
            </IonCol>
          </IonRow>
        </IonGrid>
        
        <div className="ion-padding ion-text-center">
          <Next onClick={handleNextClick} />
        </div>
      </IonContent>
    </IonModal>
  );
};

export default BuildingModal;