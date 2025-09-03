// src/components/Modals/BuildingInfoModal.tsx
import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonButtons,
  IonNote,
  IonInput
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { BuildingData } from './BuildingModal';
import '../../CSS/modal.css';

interface BuildingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingData: BuildingData;
  onSave: (adjustment: string, assessmentLevel: string) => void;
}

const BuildingInfoModal: React.FC<BuildingInfoModalProps> = ({ 
  isOpen, 
  onClose, 
  buildingData,
  onSave 
}) => {
  const [adjustment, setAdjustment] = useState<string>('');
  const [assessmentLevel, setAssessmentLevel] = useState<string>('');
  const [errors, setErrors] = useState<{adjustment?: string; assessmentLevel?: string}>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAdjustment('');
      setAssessmentLevel('');
      setErrors({});
    }
  }, [isOpen]);

  const handleSave = () => {
    const newErrors: {adjustment?: string; assessmentLevel?: string} = {};
    
    if (!adjustment) newErrors.adjustment = 'Adjustment is required';
    if (!assessmentLevel) newErrors.assessmentLevel = 'Assessment level is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSave(adjustment, assessmentLevel);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  // Sample data - replace with your actual data sources
  const adjustmentOptions = [
    { value: 'adj1', label: 'Adjustment 1' },
    { value: 'adj2', label: 'Adjustment 2' },
    { value: 'adj3', label: 'Adjustment 3' },
  ];

  const assessmentLevelOptions = [
    { value: 'level1', label: 'Assessment Level 1' },
    { value: 'level2', label: 'Assessment Level 2' },
    { value: 'level3', label: 'Assessment Level 3' },
  ];

  return (
    <IonModal 
      isOpen={isOpen} 
      onDidDismiss={handleClose}
      className="custom-wide-modal"
    >
      <IonHeader>
        <IonToolbar className="fancy-header">
          <IonTitle className="fancy-title">Building Information</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClose} className="fancy-close-btn" fill="clear">
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="modal-content">
        <IonGrid className="custom-grid">
          <IonRow>
            <IonCol className="custom-col">
              <div className="form-section">
                <h3 className="section-title">Building Details</h3>
                
                {/* Display some building data for reference */}
                <IonItem className="custom-input" lines="none">
                  <IonLabel position="stacked" className="input-label">Building Code</IonLabel>
                  <IonInput 
                    value={buildingData.buildingCode || ''} 
                    readonly 
                    className="modal-input" 
                  />
                </IonItem>
                
                <IonItem className="custom-input" lines="none">
                  <IonLabel position="stacked" className="input-label">Structure Type</IonLabel>
                  <IonInput 
                    value={buildingData.structureType || ''} 
                    readonly 
                    className="modal-input" 
                  />
                </IonItem>
                
                {/* Adjustment Dropdown */}
                <IonItem className="custom-input" lines="none">
                  <IonLabel position="stacked" className="input-label">
                    Adjustment <span style={{ color: 'red' }}>*</span>
                  </IonLabel>
                  <IonSelect
                    value={adjustment}
                    placeholder="Select Adjustment"
                    onIonChange={e => {
                      setAdjustment(e.detail.value!);
                      if (errors.adjustment) setErrors({...errors, adjustment: undefined});
                    }}
                    interface="popover"
                    className="modal-input"
                  >
                    {adjustmentOptions.map(option => (
                      <IonSelectOption key={option.value} value={option.value}>
                        {option.label}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                  {errors.adjustment && (
                    <IonNote color="danger" className="error-message">
                      <small>{errors.adjustment}</small>
                    </IonNote>
                  )}
                </IonItem>

                {/* Assessment Level Dropdown */}
                <IonItem className="custom-input" lines="none">
                  <IonLabel position="stacked" className="input-label">
                    Assessment Level <span style={{ color: 'red' }}>*</span>
                  </IonLabel>
                  <IonSelect
                    value={assessmentLevel}
                    placeholder="Select Assessment Level"
                    onIonChange={e => {
                      setAssessmentLevel(e.detail.value!);
                      if (errors.assessmentLevel) setErrors({...errors, assessmentLevel: undefined});
                    }}
                    interface="popover"
                    className="modal-input"
                  >
                    {assessmentLevelOptions.map(option => (
                      <IonSelectOption key={option.value} value={option.value}>
                        {option.label}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                  {errors.assessmentLevel && (
                    <IonNote color="danger" className="error-message">
                      <small>{errors.assessmentLevel}</small>
                    </IonNote>
                  )}
                </IonItem>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Save Button Container */}
        <div className="next-btn-container">
          <IonButton 
            expand="block" 
            className="next-button"
            onClick={handleSave}
          >
            Save Building Information
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default BuildingInfoModal;