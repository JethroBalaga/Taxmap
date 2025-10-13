// src/components/Modals/AgriculturalLandAdjustmentModal.tsx
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
  IonInput,
  IonRow,
  IonCol,
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { FormData } from './Form';
import Next from '../GlobalComponent/Next';
import { getLandAdjustmentData } from '../../utils/landAdjustmentLocalStorage';

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
  const [frontageFactor, setFrontageFactor] = useState<string>('');
  const [weatherRoadFactor, setWeatherRoadFactor] = useState<string>('');
  const [marketFactor, setMarketFactor] = useState<string>('');
  const [totalAdjustment, setTotalAdjustment] = useState<string>('0');
  const [adjustedMarketValue, setAdjustedMarketValue] = useState<string>('100');

  const [frontageOptions, setFrontageOptions] = useState<Array<{ value: string, label: string }>>([]);
  const [weatherRoadOptions, setWeatherRoadOptions] = useState<Array<{ value: string, label: string }>>([]);
  const [marketOptions, setMarketOptions] = useState<Array<{ value: string, label: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate total adjustment and adjusted market value whenever any factor changes
  useEffect(() => {
    const calculateValues = () => {
      const frontageNum = parseFloat(frontageFactor) || 0;
      const weatherRoadNum = parseFloat(weatherRoadFactor) || 0;
      const marketNum = parseFloat(marketFactor) || 0;

      const total = frontageNum + weatherRoadNum + marketNum;
      // Make the total negative
      const negativeTotal = total > 0 ? -total : total;
      setTotalAdjustment(negativeTotal.toString());

      // Calculate adjusted market value: 100 - total adjustment
      const adjustmentValue = Math.abs(negativeTotal);
      const adjustedValue = 100 - adjustmentValue;
      setAdjustedMarketValue(adjustedValue.toString());
    };

    calculateValues();
  }, [frontageFactor, weatherRoadFactor, marketFactor]);

  // Local functions to get options
  const getFrontageOptions = async (): Promise<Array<{ value: string, label: string }>> => {
    try {
      const allData = await getLandAdjustmentData();
      if (!allData) return [];

      const frontageData = allData.filter(item => item.adjustment_type === 'Agricultural Frontage');
      return frontageData.map(item => ({
        value: item.adjustment_factor,
        label: item.description
      }));
    } catch (error) {
      console.error('Error getting frontage options:', error);
      return [];
    }
  };

  const getWeatherRoadOptions = async (): Promise<Array<{ value: string, label: string }>> => {
    try {
      const allData = await getLandAdjustmentData();
      if (!allData) return [];

      const weatherRoadData = allData.filter(item => item.adjustment_type === 'Weather Road');
      return weatherRoadData.map(item => ({
        value: item.adjustment_factor,
        label: item.description
      }));
    } catch (error) {
      console.error('Error getting weather road options:', error);
      return [];
    }
  };

  const getMarketOptions = async (): Promise<Array<{ value: string, label: string }>> => {
    try {
      const allData = await getLandAdjustmentData();
      if (!allData) return [];

      const marketData = allData.filter(item => item.adjustment_type === 'Market');
      return marketData.map(item => ({
        value: item.adjustment_factor,
        label: item.description
      }));
    } catch (error) {
      console.error('Error getting market options:', error);
      return [];
    }
  };

  // Load adjustment options when modal opens
  useEffect(() => {
    const loadOptions = async () => {
      if (isOpen) {
        setIsLoading(true);
        try {
          const [frontageData, weatherRoadData, marketData] = await Promise.all([
            getFrontageOptions(),
            getWeatherRoadOptions(),
            getMarketOptions()
          ]);

          setFrontageOptions(frontageData);
          setWeatherRoadOptions(weatherRoadData);
          setMarketOptions(marketData);
        } catch (error) {
          console.error('Error loading adjustment options:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadOptions();
  }, [isOpen]);

  const handleFrontageChange = (value: string) => {
    setFrontage(value);
    setFrontageFactor(value);
  };

  const handleWeatherRoadChange = (value: string) => {
    setWeatherRoad(value);
    setWeatherRoadFactor(value);
  };

  const handleMarketChange = (value: string) => {
    setMarket(value);
    setMarketFactor(value);
  };

  const handleSubmit = () => {
    // Only pass the three dropdown values
    const adjustmentData: AgriculturalLandAdjustmentData = {
      frontage,
      weatherRoad,
      market,
    };

    console.log('Agricultural Land Adjustment Data (simplified):', adjustmentData);
    onSuccess(adjustmentData);
  };

  const handleClose = () => {
    // Reset form when closing
    setFrontage('');
    setWeatherRoad('');
    setMarket('');
    setFrontageFactor('');
    setWeatherRoadFactor('');
    setMarketFactor('');
    setTotalAdjustment('0');
    setAdjustedMarketValue('100');
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

          {/* Frontage Dropdown with Input */}
          <IonRow>
            <IonCol size="8">
              <IonItem className="custom-input" lines="none">
                <IonLabel position="stacked" className="input-label">
                  Frontage <span style={{ color: 'red' }}>*</span>
                </IonLabel>
                <IonSelect
                  value={frontage}
                  placeholder={isLoading ? "Loading..." : "Select Frontage"}
                  onIonChange={(e) => handleFrontageChange(e.detail.value)}
                  interface="popover"
                  className="modal-input"
                  disabled={isLoading}
                >
                  {frontageOptions.map(option => (
                    <IonSelectOption key={option.value} value={option.value}>
                      {option.label}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            </IonCol>
            <IonCol size="4">
              <IonItem className="custom-input" lines="none">
                <IonLabel position="stacked" className="input-label">
                  &nbsp;
                </IonLabel>
                <IonInput
                  value={frontageFactor}
                  placeholder="Factor"
                  disabled
                  className="modal-input"
                  style={{ fontSize: '14px', height: '48px' }}
                />
              </IonItem>
            </IonCol>
          </IonRow>

          {/* Weather Road Dropdown with Input */}
          <IonRow>
            <IonCol size="8">
              <IonItem className="custom-input" lines="none">
                <IonLabel position="stacked" className="input-label">
                  Weather Road <span style={{ color: 'red' }}>*</span>
                </IonLabel>
                <IonSelect
                  value={weatherRoad}
                  placeholder={isLoading ? "Loading..." : "Select Weather Road"}
                  onIonChange={(e) => handleWeatherRoadChange(e.detail.value)}
                  interface="popover"
                  className="modal-input"
                  disabled={isLoading}
                >
                  {weatherRoadOptions.map(option => (
                    <IonSelectOption key={option.value} value={option.value}>
                      {option.label}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            </IonCol>
            <IonCol size="4">
              <IonItem className="custom-input" lines="none">
                <IonLabel position="stacked" className="input-label">
                  &nbsp;
                </IonLabel>
                <IonInput
                  value={weatherRoadFactor}
                  placeholder="Factor"
                  disabled
                  className="modal-input"
                  style={{ fontSize: '14px', height: '48px' }}
                />
              </IonItem>
            </IonCol>
          </IonRow>

          {/* Market Dropdown with Input */}
          <IonRow>
            <IonCol size="8">
              <IonItem className="custom-input" lines="none">
                <IonLabel position="stacked" className="input-label">
                  Market <span style={{ color: 'red' }}>*</span>
                </IonLabel>
                <IonSelect
                  value={market}
                  placeholder={isLoading ? "Loading..." : "Select Market"}
                  onIonChange={(e) => handleMarketChange(e.detail.value)}
                  interface="popover"
                  className="modal-input"
                  disabled={isLoading}
                >
                  {marketOptions.map(option => (
                    <IonSelectOption key={option.value} value={option.value}>
                      {option.label}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            </IonCol>
            <IonCol size="4">
              <IonItem className="custom-input" lines="none">
                <IonLabel position="stacked" className="input-label">
                  &nbsp;
                </IonLabel>
                <IonInput
                  value={marketFactor}
                  placeholder="Factor"
                  disabled
                  className="modal-input"
                  style={{ fontSize: '14px', height: '48px' }}
                />
              </IonItem>
            </IonCol>
          </IonRow>

          {/* Total Adjustments */}
          <IonRow>
            <IonCol size="12">
              <IonItem className="custom-input" lines="none">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  height: '48px'
                }}>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#2d3748'
                  }}>
                    Total Adjustments
                  </span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: totalAdjustment.startsWith('-') ? '#e53e3e' : '#2d3748',
                    minWidth: '60px',
                    textAlign: 'right'
                  }}>
                    {totalAdjustment}
                  </span>
                </div>
              </IonItem>
            </IonCol>
          </IonRow>

          {/* Adjusted Market Value */}
          <IonRow>
            <IonCol size="12">
              <IonItem className="custom-input" lines="none">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  height: '48px'
                }}>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#2d3748'
                  }}>
                    Adjusted Market Value
                  </span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#2d3748',
                    minWidth: '60px',
                    textAlign: 'right'
                  }}>
                    {adjustedMarketValue}
                  </span>
                </div>
              </IonItem>
            </IonCol>
          </IonRow>

          {/* Next Button */}
          <div className="next-btn-container" style={{ marginTop: '30px' }}>
            <Next onClick={handleSubmit} disabled={!isFormValid || isLoading} />
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default AgriculturalLandAdjustmentModal;