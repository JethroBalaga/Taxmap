// src/pages/AgriculturalAdjustmentTable.tsx
import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/react';
import { arrowBack, leaf, trendingUp, calculator } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { AgriculturalDataLocalStorage } from '../../utils//tablestorages/AgriculturalDataLocalStorage';
import '../../CSS/Forms.css';
import '../../CSS/AgriculturalCard.css';

interface RouteParams {
  formId: string;
}

const AgriculturalAdjustmentTable: React.FC = () => {
  const { formId } = useParams<RouteParams>();
  const history = useHistory();
  const [formData, setFormData] = useState<any>(null);
  const [agriculturalData, setAgriculturalData] = useState<any>(null);
  const [valueInfoId, setValueInfoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidForm, setIsValidForm] = useState(false);

  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      try {
        const form = FormDataLocalStorage.getFormData(formId);
        
        if (form) {
          setFormData(form);
          
          // Check if form is Land kind (1) and AGRICULTURAL classification (A)
          const isLandKind = form.kind?.toString() === '1';
          const isAgricultural = form.classification?.toString() === 'A';
          
          setIsValidForm(isLandKind && isAgricultural);

          if (isLandKind && isAgricultural) {
            // Fetch ValueInfo ID using form ID
            const valueInfo = ValueInfoLocalStorage.getValueInfoByFormDataId(formId);
            
            if (valueInfo) {
              setValueInfoId(valueInfo.id);
              
              // Fetch AgriculturalData using ValueInfo ID
              const agriData = AgriculturalDataLocalStorage.getAgriculturalDataByValueInfoId(valueInfo.id);
              setAgriculturalData(agriData);
            }
          }
        } else {
          setIsValidForm(false);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setIsValidForm(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [formId]);

  const handleBack = () => {
    history.push('/menu/forms');
  };

  // Calculate total adjustment
  const calculateTotalAdjustment = () => {
    if (!agriculturalData) return 0;
    
    const frontage = parseFloat(agriculturalData.frontage) || 0;
    const weatherRoad = parseFloat(agriculturalData.weather_road) || 0;
    const market = parseFloat(agriculturalData.market) || 0;
    
    return frontage + weatherRoad + market;
  };

  const totalAdjustment = calculateTotalAdjustment();

  // Filter out the fields we don't want to display (only remove status and uploaded)
  const getDisplayableFormData = () => {
    if (!formData) return {};
    
    const { status, uploaded, ...displayableData } = formData;
    return displayableData;
  };

  const displayableFormData = getDisplayableFormData();

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Loading...</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <IonText>Loading agricultural data...</IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!isValidForm) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={handleBack}>
                <IonIcon icon={arrowBack} slot="start" />
                Back
              </IonButton>
            </IonButtons>
            <IonTitle>Invalid Form</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="no-data">
            <IonText>
              <h3>Invalid Form Type</h3>
              <p>This page is only accessible for Land forms (kind 1) with AGRICULTURAL classification (A).</p>
              <IonButton onClick={handleBack} color="primary">
                Return to Forms
              </IonButton>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={handleBack}>
              <IonIcon icon={arrowBack} slot="start" />
              Back
            </IonButton>
          </IonButtons>
          <IonTitle>Agricultural Adjustments</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="forms-container">
          <IonGrid>
            <IonRow>
              <IonCol size="12">
                {/* Form Summary Card */}
                <IonCard className="form-summary-card">
                  <IonCardContent>
                    <IonGrid style={{ margin: '0', padding: '0' }}>
                      {Object.entries(displayableFormData).map(([key, value], index, array) => {
                        // Create rows with 4 columns each
                        if (index % 4 === 0) {
                          const rowItems = array.slice(index, index + 4);
                          return (
                            <IonRow key={`row-${index}`} style={{ marginBottom: '4px' }}>
                              {rowItems.map(([itemKey, itemValue], colIndex) => (
                                <IonCol key={itemKey} size="3" style={{ padding: '4px' }}>
                                  <IonText>
                                    <strong>
                                      {itemKey.charAt(0).toUpperCase() + itemKey.slice(1).replace(/([A-Z])/g, ' $1')}:
                                    </strong> {itemValue !== null && itemValue !== undefined ? itemValue.toString() : 'N/A'}
                                  </IonText>
                                </IonCol>
                              ))}
                              {/* Fill empty columns if needed */}
                              {rowItems.length < 4 && 
                                Array.from({ length: 4 - rowItems.length }).map((_, emptyIndex) => (
                                  <IonCol key={`empty-${emptyIndex}`} size="3" style={{ padding: '4px' }}></IonCol>
                                ))
                              }
                            </IonRow>
                          );
                        }
                        return null;
                      })}
                    </IonGrid>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>

            {/* Agricultural Data Card - Simplified Design */}
            {agriculturalData && (
              <IonRow>
                <IonCol size="12">
                  <IonCard className="agricultural-card">
                    <IonCardHeader>
                      <div className="agricultural-header">
                        <IonCardTitle className="agricultural-title">
                          <IonIcon icon={leaf} className="agricultural-title-icon" />
                          Agricultural Adjustment Data
                        </IonCardTitle>
                      </div>
                    </IonCardHeader>

                    <IonCardContent>
                      {/* Adjustment Factors Section */}
                      <div className="agricultural-section">
                        <IonText className="agricultural-section-title">
                          <IonIcon icon={trendingUp} className="agricultural-section-icon" />
                          <h4>Adjustment Factors</h4>
                        </IonText>
                        <div className="agricultural-grid">
                          <div className="agricultural-item">
                            <label>Frontage</label>
                            <IonText className="agricultural-value">
                              {agriculturalData.frontage || 'N/A'}
                            </IonText>
                          </div>
                          <div className="agricultural-item">
                            <label>Weather Road</label>
                            <IonText className="agricultural-value">
                              {agriculturalData.weather_road || 'N/A'}
                            </IonText>
                          </div>
                          <div className="agricultural-item">
                            <label>Market</label>
                            <IonText className="agricultural-value">
                              {agriculturalData.market || 'N/A'}
                            </IonText>
                          </div>
                        </div>
                      </div>

                      {/* Total Adjustment Section */}
                      <div className="agricultural-section">
                        <IonText className="agricultural-section-title">
                          <IonIcon icon={calculator} className="agricultural-section-icon" />
                          <h4>Total Adjustment</h4>
                        </IonText>
                        <div className="agricultural-grid">
                          <div className="agricultural-item full-width">
                            <label>Sum of All Adjustments</label>
                            <IonText className="agricultural-value total-adjustment">
                              {totalAdjustment}
                            </IonText>
                          </div>
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            )}

            {/* No Agricultural Data Message */}
            {!agriculturalData && (
              <IonRow>
                <IonCol size="12">
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <IonText>
                      <h2>No Agricultural Data Found</h2>
                      <p style={{ marginTop: '20px', color: 'var(--ion-color-medium)' }}>
                        No agricultural adjustment data has been submitted for this form yet.
                      </p>
                    </IonText>
                  </div>
                </IonCol>
              </IonRow>
            )}
          </IonGrid>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AgriculturalAdjustmentTable;