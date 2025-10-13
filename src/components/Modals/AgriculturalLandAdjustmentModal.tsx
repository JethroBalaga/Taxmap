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
  IonSelectOption
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { FormData } from '../Form';
import '../../CSS/modal.css';

export interface AgriculturalLandAdjustmentData {
  frontage: string;
  weatherRoad: string;
  market: string;
}

interface AgriculturalLandAdjustmentModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSuccess: (data: AgriculturalLandAdjustmentData) => void;
  formData: FormData;
}

const AgriculturalLandAdjustmentModal: React.FC<AgriculturalLandAdjustmentModalProps> = ({
  isOpen,
  onDismiss,
  onSuccess,
  formData
}) => {
  const [frontage, setFrontage] = useState('');
  const [weatherRoad, setWeatherRoad] = useState('');
  const [market, setMarket] = useState('');

  const handleSubmit = () => {
    const adjustmentData: AgriculturalLandAdjustmentData = {
      frontage,
      weatherRoad,
      market
    };
    
    console.log('Agricultural Land Adjustment Data:', adjustmentData);
    onSuccess(adjustmentData);
    resetForm();
  };

  const resetForm = () => {
    setFrontage('');
    setWeatherRoad('');
    setMarket('');
  };

  const handleClose = () => {
    resetForm();
    onDismiss();
  };

  const isFormValid = frontage !== '' && weatherRoad !== '' && market !== '';

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="custom-wide-modal">
      <IonHeader>
        <IonToolbar className="fancy-header">
          <IonTitle className="fancy-title">
            <i className="icon-adjustment" style={{ marginRight: '10px' }}></i>
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
          {/* Form Information */}
          <div className="form-info-section">
            <h3 style={{ color: '#2d3748', marginBottom: '10px' }}>Property Information</h3>
            <p style={{ color: '#718096', fontSize: '14px', marginBottom: '20px' }}>
              Kind: <strong>LAND</strong> | Classification: <strong>AGRICULTURAL</strong>
            </p>
          </div>

          {/* Frontage Dropdown */}
          <IonItem className="custom-input" lines="none">
            <IonLabel position="stacked" className="input-label">
              Frontage Adjustment <span style={{ color: 'red' }}>*</span>
            </IonLabel>
            <IonSelect
              value={frontage}
              placeholder="Select Frontage Adjustment"
              onIonChange={(e) => setFrontage(e.detail.value)}
              interface="popover"
              className="modal-input"
            >
              <IonSelectOption value="">Select Frontage</IonSelectOption>
              {/* Options will be populated from database later */}
              <IonSelectOption value="frontage-1">Frontage Option 1</IonSelectOption>
              <IonSelectOption value="frontage-2">Frontage Option 2</IonSelectOption>
            </IonSelect>
          </IonItem>

          {/* Weather Road Dropdown */}
          <IonItem className="custom-input" lines="none">
            <IonLabel position="stacked" className="input-label">
              Weather Road Adjustment <span style={{ color: 'red' }}>*</span>
            </IonLabel>
            <IonSelect
              value={weatherRoad}
              placeholder="Select Weather Road Adjustment"
              onIonChange={(e) => setWeatherRoad(e.detail.value)}
              interface="popover"
              className="modal-input"
            >
              <IonSelectOption value="">Select Weather Road</IonSelectOption>
              {/* Options will be populated from database later */}
              <IonSelectOption value="weather-1">Weather Road Option 1</IonSelectOption>
              <IonSelectOption value="weather-2">Weather Road Option 2</IonSelectOption>
            </IonSelect>
          </IonItem>

          {/* Market Dropdown */}
          <IonItem className="custom-input" lines="none">
            <IonLabel position="stacked" className="input-label">
              Market Adjustment <span style={{ color: 'red' }}>*</span>
            </IonLabel>
            <IonSelect
              value={market}
              placeholder="Select Market Adjustment"
              onIonChange={(e) => setMarket(e.detail.value)}
              interface="popover"
              className="modal-input"
            >
              <IonSelectOption value="">Select Market</IonSelectOption>
              {/* Options will be populated from database later */}
              <IonSelectOption value="market-1">Market Option 1</IonSelectOption>
              <IonSelectOption value="market-2">Market Option 2</IonSelectOption>
            </IonSelect>
          </IonItem>

          {/* Action Buttons */}
          <div className="button-group" style={{ marginTop: '30px' }}>
            <IonButton 
              expand="block" 
              onClick={handleClose}
              className="cancel-btn"
              fill="outline"
            >
              Cancel
            </IonButton>
            <IonButton 
              expand="block" 
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="submit-btn"
            >
              Apply Adjustments
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default AgriculturalLandAdjustmentModal;