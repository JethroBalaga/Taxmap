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
  getStrippingInfo: () => { currentCount: number; nextNumber: number; hasStripping: boolean; canAddMore: boolean; remainingArea: number; totalStripArea: number };
  getStrippingAdjustment: (stripNumber: number) => LandAdjustmentData | null;
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
  area,
  getStrippingInfo,
  getStrippingAdjustment
}) => {
  const [strippingAdjustment, setStrippingAdjustment] = useState<LandAdjustmentData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingArea, setRemainingArea] = useState<number>(area);
  const [stripAreaError, setStripAreaError] = useState<string>('');
  const [currentStripNumber, setCurrentStripNumber] = useState<number>(1);
  const [availableArea, setAvailableArea] = useState<number>(area);

  useEffect(() => {
    if (isOpen) {
      const { nextNumber, remainingArea: currentRemainingArea } = getStrippingInfo();
      setCurrentStripNumber(nextNumber);
      setAvailableArea(currentRemainingArea);
      
      // Use the new function to get the correct stripping adjustment
      const strippingAdjustmentToFind = getStrippingAdjustment(nextNumber);
      
      console.log(`Setting up stripping modal for strip ${nextNumber}`);
      console.log('Available area:', currentRemainingArea);
      console.log('Found stripping adjustment:', strippingAdjustmentToFind);
      
      if (strippingAdjustmentToFind) {
        setStrippingAdjustment(strippingAdjustmentToFind);
        setDescription(`STRIPPING ${nextNumber}`);
        setAdjustmentFactor(strippingAdjustmentToFind.adjustment_factor);
        
        // Check if there's existing additional factor for this strip
        const existingAdjustment = NonAgriAdjustmentLocalStorage.getAdjustmentsByValueInfoId(valueInfoId)
          .find(adj => adj.adjustmentId === strippingAdjustmentToFind.adjustment_id);
        
        if (existingAdjustment) {
          const existingAdditionalFactor = NonAgriAdjustmentLocalStorage.getAdditionalFactor(
            valueInfoId, 
            strippingAdjustmentToFind.adjustment_id
          );
          if (existingAdditionalFactor) {
            setAdditionalFactor(existingAdditionalFactor.toString());
          } else {
            setAdditionalFactor('');
          }
        } else {
          setAdditionalFactor('');
        }
      } else {
        console.warn(`Stripping adjustment for strip ${nextNumber} not found`);
        setStrippingAdjustment(null);
        setDescription(`STRIPPING ${nextNumber}`);
        setAdjustmentFactor('');
        setAdditionalFactor('');
      }
    }
  }, [isOpen, landAdjustments, setDescription, setAdjustmentFactor, getStrippingInfo, valueInfoId, getStrippingAdjustment]);

  // Calculate remaining area when additionalFactor changes
  useEffect(() => {
    if (additionalFactor) {
      const stripArea = parseFloat(additionalFactor);
      
      if (!isNaN(stripArea)) {
        // Validate strip area against available area
        if (stripArea > availableArea) {
          setStripAreaError(`Strip Area cannot be greater than available area (${availableArea.toLocaleString()})`);
          setRemainingArea(0);
        } else if (stripArea <= 0) {
          setStripAreaError('Strip Area must be greater than 0');
          setRemainingArea(availableArea);
        } else {
          setStripAreaError('');
          setRemainingArea(availableArea - stripArea);
        }
      } else {
        setStripAreaError('');
        setRemainingArea(availableArea);
      }
    } else {
      setStripAreaError('');
      setRemainingArea(availableArea);
    }
  }, [additionalFactor, availableArea]);

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
      console.log('Strip Number:', currentStripNumber);
      
      // Convert additionalFactor to number
      const stripAreaNumber = parseFloat(additionalFactor);
      
      if (isNaN(stripAreaNumber) || stripAreaNumber > availableArea || stripAreaNumber <= 0) {
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
      
    } catch (error) {
      console.error('Error saving stripping adjustment:', error);
    } finally {
      setIsSubmitting(false);
      onDismiss();
    }
  };

  const isSubmitDisabled = !additionalFactor || isSubmitting || !strippingAdjustment || !!stripAreaError;

  // Get the ordinal suffix for the strip number
  const getOrdinalSuffix = (num: number) => {
    switch (num) {
      case 1: return '1st';
      case 2: return '2nd';
      case 3: return '3rd';
      case 4: return '4th';
      default: return `${num}th`;
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss} className="custom-wide-modal">
      <IonHeader>
        <IonToolbar className="fancy-header">
          <IonTitle className="fancy-title">
            <i className="icon-adjustment" style={{ marginRight: '10px' }}></i>
            {getOrdinalSuffix(currentStripNumber)} Strip Adjustment
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

          {/* Available Area Display */}
          <div style={{ width: '100%', maxWidth: '400px', marginBottom: '16px', textAlign: 'center' }}>
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                {currentStripNumber === 1 ? 'Total Area' : 'Available Area'}
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
                {availableArea.toLocaleString()}
              </div>
            </IonItem>
          </div>

          {/* Adjustment ID Display - Now shows S1, S2, S3, S4 correctly */}
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
                {strippingAdjustment?.adjustment_id || `S${currentStripNumber}`}
              </div>
            </IonItem>
          </div>

          {/* Description Display (Dynamic based on strip number) */}
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
                STRIPPING {currentStripNumber}
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
                placeholder={`Enter strip area (max: ${availableArea.toLocaleString()})`}
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
              label={`Submit ${getOrdinalSuffix(currentStripNumber)} Strip`}
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