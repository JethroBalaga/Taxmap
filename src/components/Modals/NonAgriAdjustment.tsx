// src/components/Modals/NonAgriAdjustment.tsx
import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonInput
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { LandAdjustmentData } from '../../utils/landAdjustmentLocalStorage';
import { NonAgriAdjustmentLocalStorage } from '../../utils/tablestorages/NonAgriAdjustmentLocalStorage';
import SubmitButton from '../GlobalComponent/SubmitButton';
import '../../CSS/modal.css';

interface NonAgriAdjustmentProps {
  isOpen: boolean;
  onDismiss: () => void;
  adjustmentType: string;
  description: string;
  setDescription: (value: string) => void;
  adjustmentFactor: string;
  setAdjustmentFactor: (value: string) => void;
  landAdjustments: LandAdjustmentData[];
  isLoadingAdjustments: boolean;
  valueInfoId: string;
}

const NonAgriAdjustment: React.FC<NonAgriAdjustmentProps> = ({
  isOpen,
  onDismiss,
  adjustmentType,
  description,
  setDescription,
  adjustmentFactor,
  setAdjustmentFactor,
  landAdjustments,
  isLoadingAdjustments,
  valueInfoId
}) => {
  const [filteredAdjustments, setFilteredAdjustments] = useState<LandAdjustmentData[]>([]);

  useEffect(() => {
    // Filter adjustments based on the selected adjustmentType
    let filteredData: LandAdjustmentData[] = [];
    
    if (adjustmentType === 'Stripping') {
      filteredData = landAdjustments.filter(adj => adj.adjustment_type === 'Stripping');
    } else if (adjustmentType === 'Corner Influence') {
      filteredData = landAdjustments.filter(adj => adj.adjustment_type === 'Corner Influence');
    } else if (adjustmentType === 'Commercial Frontage') {
      filteredData = landAdjustments.filter(adj => adj.adjustment_type === 'Commercial Frontage');
    }
    
    setFilteredAdjustments(filteredData);
  }, [landAdjustments, adjustmentType]);

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    
    // Find the selected adjustment and set its factor
    const selectedAdjustment = filteredAdjustments.find(
      adj => adj.description === value
    );
    
    if (selectedAdjustment) {
      setAdjustmentFactor(selectedAdjustment.adjustment_factor);
    } else {
      setAdjustmentFactor('');
    }
  };

  const handleSubmit = () => {
    // Save to NonAgriAdjustmentLocalStorage
    if (description && valueInfoId) {
      const selectedAdjustment = filteredAdjustments.find(
        adj => adj.description === description
      );
      
      if (selectedAdjustment) {
        NonAgriAdjustmentLocalStorage.saveNonAgriAdjustment({
          valueInfoId: valueInfoId,
          adjustmentId: selectedAdjustment.adjustment_id
        });
        
        console.log('Adjustment saved:', {
          valueInfoId: valueInfoId,
          adjustmentId: selectedAdjustment.adjustment_id,
          adjustmentType: adjustmentType,
          description: description,
          adjustmentFactor: adjustmentFactor
        });
      }
    }
    
    // Close modal after submission
    onDismiss();
  };

  const getModalTitle = () => {
    switch (adjustmentType) {
      case 'Stripping':
        return 'Stripping Adjustment';
      case 'Corner Influence':
        return 'Corner Influence Adjustment';
      case 'Frontage':
        return 'Commercial Frontage Adjustment';
      default:
        return 'Non-Agricultural Adjustment';
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss} className="custom-wide-modal">
      <IonHeader>
        <IonToolbar className="fancy-header">
          <IonTitle className="fancy-title">
            <i className="icon-adjustment" style={{ marginRight: '10px' }}></i>
            {getModalTitle()}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss} className="fancy-close-btn">
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="modal-content">
        <div className="form-container" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '60vh'
        }}>
          {/* Value Info ID Display */}
          <div style={{ width: '100%', maxWidth: '400px', marginBottom: '16px', textAlign: 'center' }}>
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Value Info ID
              </IonLabel>
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#f8f9fa', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                marginTop: '8px',
                textAlign: 'center',
                fontSize: '14px',
                color: '#666'
              }}>
                {valueInfoId}
              </div>
            </IonItem>
          </div>

          {/* Adjustment Type Display */}
          <div style={{ width: '100%', maxWidth: '400px', marginBottom: '24px', textAlign: 'center' }}>
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Adjustment Type
              </IonLabel>
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#f8f9fa', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                marginTop: '8px',
                textAlign: 'center',
                fontWeight: '600'
              }}>
                {adjustmentType}
              </div>
            </IonItem>
          </div>

          {/* Description Dropdown */}
          <div style={{ width: '100%', maxWidth: '400px', marginBottom: '24px', textAlign: 'center' }}>
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Description <span style={{ color: 'red' }}>*</span>
              </IonLabel>
              <IonSelect
                value={description}
                placeholder={
                  isLoadingAdjustments 
                    ? "Loading descriptions..." 
                    : "Select Description"
                }
                onIonChange={(e) => handleDescriptionChange(e.detail.value)}
                interface="popover"
                className="modal-input"
                disabled={isLoadingAdjustments}
              >
                {isLoadingAdjustments ? (
                  <IonSelectOption value="" disabled>
                    Loading descriptions...
                  </IonSelectOption>
                ) : filteredAdjustments.length === 0 ? (
                  <IonSelectOption value="" disabled>
                    No {adjustmentType.toLowerCase()} adjustments available
                  </IonSelectOption>
                ) : (
                  filteredAdjustments.map((adjustment) => (
                    <IonSelectOption
                      key={adjustment.adjustment_id}
                      value={adjustment.description}
                    >
                      {adjustment.description}
                    </IonSelectOption>
                  ))
                )}
              </IonSelect>
            </IonItem>
          </div>

          {/* Adjustment Factor Input (Disabled) */}
          <div style={{ width: '100%', maxWidth: '400px', marginBottom: '24px', textAlign: 'center' }}>
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Adjustment Factor
              </IonLabel>
              <IonInput
                value={adjustmentFactor}
                placeholder="Select description to see factor"
                className="modal-input"
                disabled={true}
              />
            </IonItem>
          </div>

          {/* Submit Button at Bottom Center */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            marginTop: '32px', 
            width: '100%',
            maxWidth: '400px'
          }}>
            <SubmitButton 
              label="Save Adjustment"
              onClick={handleSubmit}
              disabled={!description}
            />
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default NonAgriAdjustment;