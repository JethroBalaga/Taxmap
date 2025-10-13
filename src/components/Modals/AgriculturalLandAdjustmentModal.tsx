// src/components/Modals/AgriculturalLandAdjustmentModal.tsx
import React, { useState } from 'react';
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
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { FormData } from './Form';
import Next from '../GlobalComponent/Next';

interface AgriculturalLandAdjustmentModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSuccess: (adjustmentData: AgriculturalLandAdjustmentData) => void;
  formData: FormData;
}

export interface AgriculturalLandAdjustmentData {
  frontage: string;
  weatherRoad: string;
  market: string;
}

const AgriculturalLandAdjustmentModal: React.FC<AgriculturalLandAdjustmentModalProps> = ({
  isOpen,
  onDismiss,
  onSuccess,
  formData,
}) => {
  const [frontage, setFrontage] = useState<string>('');
  const [weatherRoad, setWeatherRoad] = useState<string>('');
  const [market, setMarket] = useState<string>('');

  const handleSubmit = () => {
    const adjustmentData: AgriculturalLandAdjustmentData = {
      frontage,
      weatherRoad,
      market,
    };
    
    console.log('Agricultural Land Adjustment Data:', adjustmentData);
    onSuccess(adjustmentData);
  };

  const handleClose = () => {
    // Reset form when closing
    setFrontage('');
    setWeatherRoad('');
    setMarket('');
    onDismiss();
  };

  const isFormValid = frontage.trim() !== '' && 
                     weatherRoad.trim() !== '' && 
                     market.trim() !== '';

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="custom-wide-modal">
      <IonHeader>
        <IonToolbar className="fancy-header">
          <IonTitle className="fancy-title">
            <i className="icon-agriculture" style={{ marginRight: '10px' }}></i>
            Agricultural Land Adjustments
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClose} className="fancy-close-btn">
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="modal-content">
        <div className="form-container">
          <div style={{ marginBottom: '20px', padding: '0 16px' }}>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
              Please provide additional details for agricultural land classification.
            </p>
          </div>

          {/* Frontage Dropdown - Empty for now */}
          <IonItem className="custom-input" lines="none">
            <IonLabel position="stacked" className="input-label">
              Frontage <span style={{ color: 'red' }}>*</span>
            </IonLabel>
            <IonSelect
              value={frontage}
              placeholder="Select Frontage"
              onIonChange={(e) => setFrontage(e.detail.value)}
              interface="popover"
              className="modal-input"
            >
              {/* Empty for now - no options */}
            </IonSelect>
          </IonItem>

          {/* Weather Road Dropdown - Empty for now */}
          <IonItem className="custom-input" lines="none">
            <IonLabel position="stacked" className="input-label">
              Weather Road <span style={{ color: 'red' }}>*</span>
            </IonLabel>
            <IonSelect
              value={weatherRoad}
              placeholder="Select Weather Road"
              onIonChange={(e) => setWeatherRoad(e.detail.value)}
              interface="popover"
              className="modal-input"
            >
              {/* Empty for now - no options */}
            </IonSelect>
          </IonItem>

          {/* Market Dropdown - Empty for now */}
          <IonItem className="custom-input" lines="none">
            <IonLabel position="stacked" className="input-label">
              Market <span style={{ color: 'red' }}>*</span>
            </IonLabel>
            <IonSelect
              value={market}
              placeholder="Select Market"
              onIonChange={(e) => setMarket(e.detail.value)}
              interface="popover"
              className="modal-input"
            >
              {/* Empty for now - no options */}
            </IonSelect>
          </IonItem>

          {/* Next Button */}
          <div className="next-btn-container" style={{ marginTop: '30px' }}>
            <Next onClick={handleSubmit} disabled={!isFormValid} />
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default AgriculturalLandAdjustmentModal;