// src/components/Modals/StrippingModal.tsx
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
  IonInput
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { LandAdjustmentData } from '../../utils/landAdjustmentLocalStorage';
import SubmitButton from '../GlobalComponent/SubmitButton';
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
  const [strippingAdjustment, setStrippingAdjustment] = useState<LandAdjustmentData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && landAdjustments.length > 0) {
      console.log('Searching for STRIPPING 1 adjustment in:', landAdjustments);
      
      // Find the "STRIPPING 1" adjustment
      const stripping1Adjustment = landAdjustments.find(
        adj => adj.adjustment_type === 'Stripping' && adj.description === 'STRIPPING 1'
      );
      
      console.log('Found STRIPPING 1 adjustment:', stripping1Adjustment);
      
      if (stripping1Adjustment) {
        setStrippingAdjustment(stripping1Adjustment);
        setDescription('STRIPPING 1');
        setAdjustmentFactor(stripping1Adjustment.adjustment_factor);
      } else {
        console.warn('STRIPPING 1 adjustment not found in land adjustments');
        setStrippingAdjustment(null);
        setDescription('STRIPPING 1');
        setAdjustmentFactor('');
      }
    }
  }, [isOpen, landAdjustments, setDescription, setAdjustmentFactor]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    console.log('Stripping modal submit clicked');
    console.log('Additional Factor (Strip Area):', additionalFactor);
    console.log('Adjustment Factor:', strippingAdjustment?.adjustment_factor);
    console.log('Description:', description);
    console.log('Value Info ID:', valueInfoId);
    
    // TODO: Add functionality to save the stripping adjustment
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    onDismiss();
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

          {/* Description Display (Fixed as STRIPPING 1) */}
          <div style={{ width: '100%', maxWidth: '400px', marginBottom: '24px', textAlign: 'center' }}>
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Description
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
                STRIPPING 1
              </div>
            </IonItem>
          </div>

          {/* Adjustment Factor Input (Disabled) */}
          <div style={{ width: '100%', maxWidth: '400px', marginBottom: '24px', textAlign: 'center' }}>
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Adjustment Factor
              </IonLabel>
              <IonInput
                value={strippingAdjustment?.adjustment_factor || 'N/A'}
                placeholder="Adjustment factor not available"
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

          {/* Submit Button Section - Single Centered Button */}
          <div style={{ 
            width: '100%', 
            maxWidth: '400px', 
            marginTop: '32px',
            display: 'flex', 
            justifyContent: 'center'
          }}>
            <SubmitButton
              label="Submit Stripping"
              onClick={handleSubmit}
              disabled={!additionalFactor || isSubmitting}
              loading={isSubmitting}
              className="modal-submit-btn"
            />
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default StrippingModal;