// src/components/Modals/AgricultureLandUpdateModal.tsx
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
  IonSpinner,
  IonText,
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { getLandAdjustmentData } from '../../utils/landAdjustmentLocalStorage';
import { AgriculturalDataLocalStorage } from '../../utils/tablestorages/AgriculturalDataLocalStorage';
import SubmitButton from '../GlobalComponent/SubmitButton';

interface AgricultureLandUpdateModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSuccess: (adjustmentData: AgriculturalLandAdjustmentData) => void;
  valueInfoId: string;
  currentData?: any;
}

export interface AgriculturalLandAdjustmentData {
  frontage: string;
  weather_road: string;
  market: string;
}

const AgricultureLandUpdateModal: React.FC<AgricultureLandUpdateModalProps> = ({
  isOpen,
  onDismiss,
  onSuccess,
  valueInfoId,
  currentData,
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Load current data and options when modal opens
  useEffect(() => {
    const loadData = async () => {
      if (isOpen) {
        setIsLoading(true);
        try {
          // Load current agricultural data
          if (currentData) {
            setFrontage(currentData.frontage || '');
            setWeatherRoad(currentData.weather_road || '');
            setMarket(currentData.market || '');
            setFrontageFactor(currentData.frontage || '');
            setWeatherRoadFactor(currentData.weather_road || '');
            setMarketFactor(currentData.market || '');
          }

          // Load adjustment options
          const [frontageData, weatherRoadData, marketData] = await Promise.all([
            getFrontageOptions(),
            getWeatherRoadOptions(),
            getMarketOptions()
          ]);

          setFrontageOptions(frontageData);
          setWeatherRoadOptions(weatherRoadData);
          setMarketOptions(marketData);
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [isOpen, currentData]);

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const adjustmentData: AgriculturalLandAdjustmentData = {
        frontage,
        weather_road: weatherRoad,
        market,
      };

      console.log('Updating agricultural data:', adjustmentData);
      
      // Update the agricultural data in localForage
      const success = await AgriculturalDataLocalStorage.updateAgriculturalData(valueInfoId, adjustmentData);
      
      if (success) {
        console.log('Agricultural data updated successfully');
        onSuccess(adjustmentData);
      } else {
        console.error('Failed to update agricultural data');
      }
    } catch (error) {
      console.error('Error updating agricultural data:', error);
    } finally {
      setIsSubmitting(false);
    }
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
            Update Agricultural Land Adjustments
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
              Update the adjustment factors for agricultural land classification.
            </p>
          </div>

          {isLoading ? (
            <div className="loading-container" style={{ textAlign: 'center', padding: '40px' }}>
              <IonSpinner name="crescent" />
              <IonText>
                <p>Loading agricultural data...</p>
              </IonText>
            </div>
          ) : (
            <>
              {/* Frontage Dropdown with Input */}
              <IonRow>
                <IonCol size="8">
                  <IonItem className="custom-input" lines="none">
                    <IonLabel position="stacked" className="input-label">
                      Frontage <span style={{ color: 'red' }}>*</span>
                    </IonLabel>
                    <IonSelect
                      value={frontage}
                      placeholder="Select Frontage"
                      onIonChange={(e) => handleFrontageChange(e.detail.value)}
                      interface="popover"
                      className="modal-input"
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
                      placeholder="Select Weather Road"
                      onIonChange={(e) => handleWeatherRoadChange(e.detail.value)}
                      interface="popover"
                      className="modal-input"
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
                      placeholder="Select Market"
                      onIonChange={(e) => handleMarketChange(e.detail.value)}
                      interface="popover"
                      className="modal-input"
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

              {/* Submit Button - Centered below */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                marginTop: '30px',
                padding: '0 16px'
              }}>
                <SubmitButton
                  label="Update Agricultural Data"
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                  loading={isSubmitting}
                />
              </div>
            </>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default AgricultureLandUpdateModal;