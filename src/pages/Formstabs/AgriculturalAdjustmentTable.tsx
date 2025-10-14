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
import { arrowBack, leaf, trendingUp, calculator, cash, arrowUpCircleOutline } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { AgriculturalDataLocalStorage } from '../../utils//tablestorages/AgriculturalDataLocalStorage';
import { getCurrentRateForSubclass } from '../../utils/subclassRateLocalStorage';
import { 
  getAssessmentLevelsInRange,
  AssessmentLevelData 
} from '../../utils/assessmentLevelLocalStorage';
import AgricultureLandUpdateModal from '../../components/Modals/AgricultureLandUpdateModal';
import DynamicTable from '../../components/GlobalComponent/DynamicTable';
import '../../CSS/Forms.css';
import '../../CSS/AgriculturalCard.css';

interface RouteParams {
  formId: string;
}

interface SubclassRateData {
  value_info_id: string;
  subclass_id: string;
  rate: number;
  baseMarketValue?: number;
  assessmentLevel?: AssessmentLevelData;
  adjustedMarketValue?: number;
}

const AgriculturalAdjustmentTable: React.FC = () => {
  const { formId } = useParams<RouteParams>();
  const history = useHistory();
  const [formData, setFormData] = useState<any>(null);
  const [agriculturalData, setAgriculturalData] = useState<any>(null);
  const [valueInfoId, setValueInfoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidForm, setIsValidForm] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [subclassRates, setSubclassRates] = useState<SubclassRateData[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  const loadData = () => {
    setIsLoading(true);
    try {
      const form = FormDataLocalStorage.getFormData(formId);
      
      if (form) {
        setFormData(form);
        
        const isLandKind = form.kind?.toString() === '1';
        const isAgricultural = form.classification?.toString() === 'A';
        
        setIsValidForm(isLandKind && isAgricultural);

        if (isLandKind && isAgricultural) {
          const valueInfo = ValueInfoLocalStorage.getValueInfoByFormDataId(formId);
          
          if (valueInfo) {
            setValueInfoId(valueInfo.id);
            
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

  // Function to get assessment level for adjusted market value
  const getAssessmentLevel = async (adjustedMarketValue: number, kindId: number, classId: string): Promise<AssessmentLevelData | null> => {
    try {
      // Get assessment levels based on value and kind_id
      const assessmentLevels = await getAssessmentLevelsInRange(adjustedMarketValue, kindId, new Date().getFullYear());
      
      // Filter by class_id to get the exact match
      const matchingLevel = assessmentLevels.find(level => level.class_id === classId);
      
      return matchingLevel || null;
    } catch (error) {
      console.error('Error getting assessment level:', error);
      return null;
    }
  };

  const loadSubclassRates = async () => {
    if (!formData?.subclass || !valueInfoId) return;
    
    setIsLoadingRates(true);
    try {
      const subclassIds = Array.isArray(formData.subclass) 
        ? formData.subclass 
        : [formData.subclass];
      
      const ratesData: SubclassRateData[] = [];
      
      for (const subclassId of subclassIds) {
        if (subclassId) {
          const rate = await getCurrentRateForSubclass(subclassId);
          if (rate !== null) {
            const area = parseFloat(formData.area) || 0;
            const baseMarketValue = area * rate;
            
            // Calculate adjusted market value percentage
            const totalAdjustment = calculateTotalAdjustment();
            const adjustedMarketValuePercentage = totalAdjustment < 0 ? 
              100 + totalAdjustment : 100 - totalAdjustment;
            
            // Calculate actual adjusted market value
            const adjustedMarketValue = baseMarketValue * (adjustedMarketValuePercentage / 100);
            
            // Get assessment level for this adjusted market value
            const kindId = parseInt(formData.kind) || 1;
            const classId = formData.classification || 'A';
            const assessmentLevel = await getAssessmentLevel(adjustedMarketValue, kindId, classId);
            
            ratesData.push({
              value_info_id: valueInfoId,
              subclass_id: subclassId,
              rate: rate,
              baseMarketValue: baseMarketValue,
              assessmentLevel: assessmentLevel || undefined,
              adjustedMarketValue: adjustedMarketValue
            });
          }
        }
      }
      
      setSubclassRates(ratesData);
    } catch (error) {
      console.error('Error loading subclass rates:', error);
    } finally {
      setIsLoadingRates(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleFormDataUpdated = (event: CustomEvent) => {
      if (event.detail.formId === formId) {
        loadData();
      }
    };

    window.addEventListener('formDataUpdated', handleFormDataUpdated as EventListener);
    
    return () => {
      window.removeEventListener('formDataUpdated', handleFormDataUpdated as EventListener);
    };
  }, [formId]);

  useEffect(() => {
    if (formData && valueInfoId) {
      loadSubclassRates();
    }
  }, [formData, valueInfoId]);

  const handleBack = () => {
    history.push('/menu/forms');
  };

  const handleUpdateClick = () => {
    setShowUpdateModal(true);
  };

  const calculateTotalAdjustment = () => {
    if (!agriculturalData) return 0;
    
    const frontage = parseFloat(agriculturalData.frontage) || 0;
    const weatherRoad = parseFloat(agriculturalData.weather_road) || 0;
    const market = parseFloat(agriculturalData.market) || 0;
    
    return frontage + weatherRoad + market;
  };

  const calculateAdjustedMarketValue = () => {
    const totalAdjustment = calculateTotalAdjustment();
    if (totalAdjustment < 0) {
      return 100 + totalAdjustment;
    }
    return 100 - totalAdjustment;
  };

  const totalAdjustment = calculateTotalAdjustment();
  const adjustedMarketValuePercentage = calculateAdjustedMarketValue();

  const getDisplayableFormData = () => {
    if (!formData) return {};
    
    const { status, uploaded, ...displayableData } = formData;
    return displayableData;
  };

  const displayableFormData = getDisplayableFormData();

  // Updated tableData with Assessment Level (only rate_percent without % sign)
  const tableData = subclassRates.map(rate => ({
    value_info_id: rate.value_info_id,
    subclass_id: rate.subclass_id,
    rate: rate.rate.toFixed(4),
    base_market_value: rate.baseMarketValue?.toFixed(2) || 'N/A',
    adjusted_market_value: rate.adjustedMarketValue?.toFixed(2) || 'N/A',
    assessment_level: rate.assessmentLevel?.rate_percent || 'N/A' // Just the value, no % sign
  }));

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
                <IonCard className="form-summary-card">
                  <IonCardContent>
                    <IonGrid style={{ margin: '0', padding: '0' }}>
                      {Object.entries(displayableFormData).map(([key, value], index, array) => {
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

            {formData?.subclass && (
              <IonRow>
                <IonCol size="12">
                  <div style={{ marginBottom: '20px' }}>
                    <IonText>
                      <h3 style={{ margin: '0 0 16px 0', padding: '0 16px' }}>
                        Agricultural Land Information with Assessment Levels
                      </h3>
                    </IonText>
                    {isLoadingRates ? (
                      <div className="loading-container">
                        <IonSpinner name="crescent" />
                        <IonText>Loading subclass rates and assessment levels...</IonText>
                      </div>
                    ) : tableData.length > 0 ? (
                      <DynamicTable
                        data={tableData}
                        keyField="value_info_id"
                      />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <IonText color="medium">
                          <p>No subclass rates found for the provided subclass IDs.</p>
                        </IonText>
                      </div>
                    )}
                  </div>
                </IonCol>
              </IonRow>
            )}

            {agriculturalData && (
              <IonRow>
                <IonCol size="12">
                  <IonCard className="agricultural-card">
                    <IonCardHeader>
                      <div className="card-header-with-update">
                        <IonCardTitle className="agricultural-title">
                          <IonIcon icon={leaf} className="agricultural-title-icon" />
                          Agricultural Adjustment Data
                        </IonCardTitle>
                        <IonButton 
                          fill="clear" 
                          className="icon-blue update-button"
                          onClick={handleUpdateClick}
                        >
                          <IonIcon icon={arrowUpCircleOutline} className="update-icon" />
                          <span className="update-text">Update Agricultural Data</span>
                        </IonButton>
                      </div>
                    </IonCardHeader>

                    <IonCardContent>
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

                      <div className="agricultural-section">
                        <IonText className="agricultural-section-title">
                          <IonIcon icon={calculator} className="agricultural-section-icon" />
                          <h4>Calculations</h4>
                        </IonText>
                        <div className="agricultural-grid">
                          <div className="agricultural-item">
                            <label>Total Adjustment</label>
                            <IonText className="agricultural-value total-adjustment">
                              {totalAdjustment}
                            </IonText>
                          </div>
                          <div className="agricultural-item">
                            <label>Adjusted Market Value %</label>
                            <IonText className="agricultural-value adjusted-market-value">
                              {adjustedMarketValuePercentage}%
                            </IonText>
                          </div>
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            )}

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

        {agriculturalData && (
          <AgricultureLandUpdateModal
            isOpen={showUpdateModal}
            onDismiss={() => setShowUpdateModal(false)}
            onSuccess={(updatedData) => {
              console.log('Agricultural data updated successfully:', updatedData);
              setShowUpdateModal(false);
              loadData();
              window.dispatchEvent(new CustomEvent('agriculturalDataUpdated', {
                detail: { formId, valueInfoId }
              }));
            }}
            valueInfoId={valueInfoId || ''}
            currentData={agriculturalData}
          />
        )}
      </IonContent>
    </IonPage>
  );
};

export default AgriculturalAdjustmentTable;