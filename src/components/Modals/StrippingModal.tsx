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
import '../../CSS/modal.css';

interface StrippingModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  description: string;
  setDescription: (value: string) => void;
  adjustmentFactor: string;
  setAdjustmentFactor: (value: string) => void;
  additionalFactor: string;
  setAdditionalFactor: (value: string) => void;
  landAdjustments: LandAdjustmentData[];
  isLoadingAdjustments: boolean;
  valueInfoId: string;
  area: number;
}

const StrippingModal: React.FC<StrippingModalProps> = ({
  isOpen,
  onDismiss,
  description,
  setDescription,
  adjustmentFactor,
  setAdjustmentFactor,
  additionalFactor,
  setAdditionalFactor,
  landAdjustments,
  isLoadingAdjustments,
  valueInfoId,
  area
}) => {
  const [filteredAdjustments, setFilteredAdjustments] = useState<LandAdjustmentData[]>([]);

  useEffect(() => {
    // Filter for Stripping adjustments only
    const filteredData = landAdjustments.filter(adj => adj.adjustment_type === 'Stripping');
    setFilteredAdjustments(filteredData);
  }, [landAdjustments]);

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

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss} className="custom-wide-modal">
      <IonHeader>
        <IonToolbar className="fancy-header">
          <IonTitle className="fancy-title">
            <i className="icon-adjustment" style={{ marginRight: '10px' }}></i>
            Stripping Adjustment
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

          {/* Area Display */}
          <div style={{ width: '100%', maxWidth: '400px', marginBottom: '16px', textAlign: 'center' }}>
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Area
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
                {area.toLocaleString()} sqm
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
                    No stripping adjustments available
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

          {/* Strip Area Input */}
          <div style={{ width: '100%', maxWidth: '400px', marginBottom: '24px', textAlign: 'center' }}>
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Strip Area <span style={{ color: 'red' }}>*</span>
              </IonLabel>
              <IonInput
                value={additionalFactor}
                placeholder="Enter strip area"
                onIonInput={(e) => setAdditionalFactor(e.detail.value!)}
                className="modal-input"
                type="number"
              />
            </IonItem>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default StrippingModal;