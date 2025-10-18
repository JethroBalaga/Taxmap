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
  IonInput,
  IonText
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { LandAdjustmentData } from '../../utils/landAdjustmentLocalStorage';
import { NonAgriAdjustmentLocalStorage } from '../../utils/tablestorages/NonAgriAdjustmentLocalStorage';
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
  const [remainingArea, setRemainingArea] = useState<number>(area);
  const [stripAreaError, setStripAreaError] = useState<string>('');

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

  // Calculate remaining area when additionalFactor changes
  useEffect(() => {
    if (additionalFactor) {
      const stripArea = parseFloat(additionalFactor);
      
      if (!isNaN(stripArea)) {
        // Validate strip area
        if (stripArea >= area) {
          setStripAreaError('Strip Area cannot be greater than or equal to total Area');
          setRemainingArea(0);
        } else if (stripArea <= 0) {
          setStripAreaError('Strip Area must be greater than 0');
          setRemainingArea(area);
        } else {
          setStripAreaError('');
          setRemainingArea(area - stripArea);
        }
      } else {
        setStripAreaError('');
        setRemainingArea(area);
      }
    } else {
      setStripAreaError('');
      setRemainingArea(area);
    }
  }, [additionalFactor, area]);

  const handleStripAreaChange = (value: string) => {
    setAdditionalFactor(value);
  };

  const handleSubmit = async () => {
    if (!strippingAdjustment || !additionalFactor || stripAreaError) {
      console.error('Missing required data or validation error for submission');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Saving stripping adjustment data:');
      console.log('Value Info ID:', valueInfoId);
      console.log('Adjustment ID:', strippingAdjustment.adjustment_id);
      console.log('Strip Area (Additional Factor):', additionalFactor);
      console.log('Remaining Area:', remainingArea);
      
      // Convert additionalFactor to number
      const stripAreaNumber = parseFloat(additionalFactor);
      
      if (isNaN(stripAreaNumber) || stripAreaNumber >= area || stripAreaNumber <= 0) {
        console.error('Invalid strip area value');
        setIsSubmitting(false);
        return;
      }

      // Save to NonAgriAdjustmentLocalStorage
      const savedAdjustment = NonAgriAdjustmentLocalStorage.saveNonAgriAdjustment({
        valueInfoId: valueInfoId,
        adjustmentId: strippingAdjustment.adjustment_id,
        additionalFactor: stripAreaNumber
      });

      console.log('Successfully saved stripping adjustment:', savedAdjustment);
      
      // Show success message or handle success state
      // You might want to add a toast notification here
      
    } catch (error) {
      console.error('Error saving stripping adjustment:', error);
      // You might want to add an error toast notification here
    } finally {
      setIsSubmitting(false);
      onDismiss();
    }
  };

  const isSubmitDisabled = !additionalFactor || isSubmitting || !strippingAdjustment || !!stripAreaError;

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
                {area.toLocaleString()}
              </div>
            </IonItem>
          </div>

          {/* Adjustment ID Display */}
          <div style={{ width: '100%', maxWidth: '400px', marginBottom: '16px', textAlign: 'center' }}>
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Adjustment ID
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
                {strippingAdjustment?.adjustment_id || 'N/A'}
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
          <div style={{ width: '100%', maxWidth: '400px', marginBottom: '16px', textAlign: 'center' }}>
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Strip Area <span style={{ color: 'red' }}>*</span>
              </IonLabel>
              <IonInput
                value={additionalFactor}
                placeholder="Enter strip area"
                onIonInput={(e) => handleStripAreaChange(e.detail.value!)}
                className="modal-input"
                type="number"
              />
            </IonItem>
            {stripAreaError && (
              <IonText color="danger" style={{ fontSize: '12px', marginTop: '4px' }}>
                {stripAreaError}
              </IonText>
            )}
          </div>

          {/* Remaining Area Display */}
          <div style={{ width: '100%', maxWidth: '400px', marginBottom: '24px', textAlign: 'center' }}>
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Remaining Area
              </IonLabel>
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#e8f5e8', 
                border: '1px solid #c8e6c9', 
                borderRadius: '8px', 
                marginTop: '8px',
                textAlign: 'center',
                fontSize: '14px',
                color: '#2e7d32',
                fontWeight: 'bold'
              }}>
                {remainingArea.toLocaleString()}
              </div>
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
              disabled={isSubmitDisabled}
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