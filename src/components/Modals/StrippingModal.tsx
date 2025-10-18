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
  const [localAdditionalFactor, setLocalAdditionalFactor] = useState<string>(''); // COMPLETELY local state

  // Initialize modal only once when it opens
  useEffect(() => {
    if (isOpen) {
      const { nextNumber, remainingArea: currentRemainingArea } = getStrippingInfo();
      setCurrentStripNumber(nextNumber);
      setAvailableArea(currentRemainingArea);
      
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
            setLocalAdditionalFactor(existingAdditionalFactor.toString()); // Set local state only
          }
        }
        // Don't reset localAdditionalFactor if no existing value - let user input
      } else {
        console.warn(`Stripping adjustment for strip ${nextNumber} not found`);
        setStrippingAdjustment(null);
        setDescription(`STRIPPING ${nextNumber}`);
        setAdjustmentFactor('');
        // Don't reset localAdditionalFactor - let user input
      }
    }
  }, [isOpen, getStrippingInfo, getStrippingAdjustment, valueInfoId, setDescription, setAdjustmentFactor]); // Remove dependencies that cause resets

  // Calculate remaining area when localAdditionalFactor changes
  useEffect(() => {
    if (localAdditionalFactor) {
      const stripArea = parseFloat(localAdditionalFactor);
      
      if (!isNaN(stripArea)) {
        // Special validation for 1st strip - cannot be greater than or equal to total area
        if (currentStripNumber === 1) {
          if (stripArea >= area) {
            setStripAreaError(`For 1st strip, strip area must be less than total area (${area.toLocaleString()})`);
            setRemainingArea(0);
          } else if (stripArea <= 0) {
            setStripAreaError('Strip Area must be greater than 0');
            setRemainingArea(area);
          } else {
            setStripAreaError('');
            setRemainingArea(area - stripArea);
          }
        } else {
          // For subsequent strips (2nd, 3rd, 4th) - use available area validation
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
        }
      } else {
        setStripAreaError('Please enter a valid number');
        setRemainingArea(currentStripNumber === 1 ? area : availableArea);
      }
    } else {
      setStripAreaError('');
      setRemainingArea(currentStripNumber === 1 ? area : availableArea);
    }
  }, [localAdditionalFactor, availableArea, currentStripNumber, area]);

  const handleStripAreaChange = (value: string) => {
    setLocalAdditionalFactor(value); // Only update local state
  };

  const handleSubmit = async () => {
    if (!strippingAdjustment || !localAdditionalFactor || stripAreaError) {
      console.error('Missing required data or validation error for submission');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Saving stripping adjustment data:');
      console.log('Value Info ID:', valueInfoId);
      console.log('Adjustment ID:', strippingAdjustment.adjustment_id);
      console.log('Strip Area (Additional Factor):', localAdditionalFactor);
      console.log('Remaining Area:', remainingArea);
      console.log('Strip Number:', currentStripNumber);
      
      // Convert localAdditionalFactor to number
      const stripAreaNumber = parseFloat(localAdditionalFactor);
      
      // Special validation for 1st strip
      if (currentStripNumber === 1) {
        if (isNaN(stripAreaNumber) || stripAreaNumber >= area || stripAreaNumber <= 0) {
          console.error('Invalid strip area value for 1st strip');
          setIsSubmitting(false);
          return;
        }
      } else {
        // Validation for subsequent strips
        if (isNaN(stripAreaNumber) || stripAreaNumber > availableArea || stripAreaNumber <= 0) {
          console.error('Invalid strip area value');
          setIsSubmitting(false);
          return;
        }
      }

      // Save to NonAgriAdjustmentLocalStorage
      const savedAdjustment = NonAgriAdjustmentLocalStorage.saveNonAgriAdjustment({
        valueInfoId: valueInfoId,
        adjustmentId: strippingAdjustment.adjustment_id,
        additionalFactor: stripAreaNumber
      });

      console.log('Successfully saved stripping adjustment:', savedAdjustment);
      
      // Only update parent state on successful submission
      setAdditionalFactor(localAdditionalFactor);
      
    } catch (error) {
      console.error('Error saving stripping adjustment:', error);
    } finally {
      setIsSubmitting(false);
      onDismiss();
    }
  };

  const handleModalDismiss = () => {
    // Reset local state when modal closes
    setLocalAdditionalFactor('');
    setStripAreaError('');
    onDismiss();
  };

  const isSubmitDisabled = !localAdditionalFactor || isSubmitting || !strippingAdjustment || !!stripAreaError;

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

  // Get the max allowed value for the current strip
  const getMaxAllowedValue = () => {
    if (currentStripNumber === 1) {
      return area - 1; // For 1st strip, must be less than total area
    } else {
      return availableArea; // For subsequent strips, can be up to available area
    }
  };

  // Get placeholder text based on strip number
  const getPlaceholderText = () => {
    const maxAllowed = getMaxAllowedValue();
    if (currentStripNumber === 1) {
      return `Enter strip area (must be less than ${area.toLocaleString()})`;
    } else {
      return `Enter strip area (max: ${maxAllowed.toLocaleString()})`;
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleModalDismiss} className="custom-wide-modal">
      <IonHeader>
        <IonToolbar className="fancy-header">
          <IonTitle className="fancy-title">
            <i className="icon-adjustment" style={{ marginRight: '10px' }}></i>
            {getOrdinalSuffix(currentStripNumber)} Strip Adjustment
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleModalDismiss} className="fancy-close-btn">
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
                {currentStripNumber === 1 ? area.toLocaleString() : availableArea.toLocaleString()}
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
                {strippingAdjustment?.adjustment_id || `S${currentStripNumber}`}
              </div>
            </IonItem>
          </div>

          {/* Description Display */}
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

          {/* Strip Area Input - NOW FIXED */}
          <div style={{ width: '100%', maxWidth: '400px', marginBottom: '16px', textAlign: 'center' }}>
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Strip Area <span style={{ color: 'red' }}>*</span>
              </IonLabel>
              <IonInput
                value={localAdditionalFactor}
                placeholder={getPlaceholderText()}
                onIonInput={(e) => handleStripAreaChange(e.detail.value!)}
                className="modal-input"
                type="number"
                clearInput={true}
                max={getMaxAllowedValue()} // Set max attribute for HTML5 validation
              />
            </IonItem>
            {stripAreaError && (
              <IonText color="danger" style={{ fontSize: '12px', marginTop: '4px' }}>
                {stripAreaError}
              </IonText>
            )}
            {currentStripNumber === 1 && (
              <IonText color="medium" style={{ fontSize: '12px', marginTop: '4px' }}>
                <small>For 1st strip, must be less than total area to allow for remaining area</small>
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

          {/* Submit Button */}
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