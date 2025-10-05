import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonSpinner,
  IonButton,
  IonIcon,
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { arrowBack, construct, calendar, cash, cube, arrowUpCircleOutline } from 'ionicons/icons';
import { MachineDataLocalStorage, MachineData } from '../../utils/tablestorages/MachineDataLocalStorage';
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import '../../CSS/MachineryTable.css';

interface RouteParams {
  formId: string;
}

interface CalculatedMachineData extends MachineData {
  remainingLife: string;
  totalCost: string;
  adjustedMarketValue: string;
}

const MachineryTable: React.FC = () => {
  const { formId } = useParams<RouteParams>();
  const history = useHistory();
  const [machineryData, setMachineryData] = useState<{machineData: CalculatedMachineData, valueInfoId: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMachineryData();
  }, [formId]);

  const calculateRemainingLife = (yearsUsed: string, estimatedLife: string): string => {
    if (!yearsUsed || !estimatedLife) return 'N/A';
    const years = parseFloat(yearsUsed);
    const life = parseFloat(estimatedLife);
    if (isNaN(years) || isNaN(life)) return 'N/A';
    const remaining = life - years;
    return remaining > 0 ? remaining.toFixed(1) : '0.0';
  };

  const calculateTotalCost = (
    originalCost: string,
    freight: string,
    insurance: string,
    installation: string,
    others: string
  ): string => {
    const cost = parseFloat(originalCost) || 0;
    const freightCost = parseFloat(freight) || 0;
    const insuranceCost = parseFloat(insurance) || 0;
    const installationCost = parseFloat(installation) || 0;
    const othersCost = parseFloat(others) || 0;

    const total = cost + freightCost + insuranceCost + installationCost + othersCost;
    return total > 0 ? total.toFixed(2) : 'N/A';
  };

  const calculateAdjustedMarketValue = (totalCost: string, depreciation: string): string => {
    const total = parseFloat(totalCost) || 0;
    const depreciationPercent = parseFloat(depreciation) || 0;

    if (total > 0 && depreciationPercent > 0) {
      const depreciationAmount = total * (depreciationPercent / 100);
      const adjustedValue = total - depreciationAmount;
      return adjustedValue > 0 ? adjustedValue.toFixed(2) : '0.00';
    }
    return total > 0 ? total.toFixed(2) : 'N/A';
  };

  const loadMachineryData = () => {
    setIsLoading(true);
    try {
      const allValueInfo = ValueInfoLocalStorage.getAllValueInfo();
      const formValueInfo = allValueInfo.filter(info => info.formDataId === formId);
      
      const machineryWithCalculations: {machineData: CalculatedMachineData, valueInfoId: string}[] = [];
      
      formValueInfo.forEach(valueInfo => {
        const machineData = MachineDataLocalStorage.getMachineData(valueInfo.id);
        if (machineData) {
          const remainingLife = calculateRemainingLife(machineData.yearsUsed, machineData.estimatedLife);
          const totalCost = calculateTotalCost(
            machineData.originalCost,
            machineData.freight,
            machineData.insurance,
            machineData.installation,
            machineData.others
          );
          const adjustedMarketValue = calculateAdjustedMarketValue(totalCost, machineData.depreciation);

          const calculatedMachineData: CalculatedMachineData = {
            ...machineData,
            remainingLife,
            totalCost,
            adjustedMarketValue
          };

          machineryWithCalculations.push({
            machineData: calculatedMachineData,
            valueInfoId: valueInfo.id
          });
        }
      });
      
      setMachineryData(machineryWithCalculations);
    } catch (error) {
      console.error('Error loading machinery data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    history.goBack();
  };

  const handleUpdateClick = (machineData: CalculatedMachineData, valueInfoId: string) => {
    console.log('Update clicked for:', machineData.selectedEquipment);
    console.log('ValueInfo ID:', valueInfoId);
    // Update functionality will be added later
  };

  const formatCurrency = (value: string): string => {
    if (!value || value === 'N/A') return 'N/A';
    const number = parseFloat(value);
    if (isNaN(number)) return value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(number);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatDepreciation = (depreciation: string): string => {
    if (!depreciation) return 'N/A';
    return `${depreciation}%`;
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/menu/forms" />
            </IonButtons>
            <IonTitle>Loading Machinery...</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <IonText>Loading machinery equipment...</IonText>
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
              <IonIcon slot="icon-only" icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Machinery - Form {formId}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="machinery-container">
          {machineryData.length === 0 ? (
            <div className="empty-state">
              <IonIcon icon={construct} size="large" />
              <IonText>
                <h3>No Machinery Equipment Found</h3>
                <p>No machinery has been added to Form {formId} yet.</p>
              </IonText>
            </div>
          ) : (
            <IonGrid>
              <IonRow class="ion-justify-content-center">
                {machineryData.map(({ machineData, valueInfoId }, index) => (
                  <IonCol size="12" size-lg="10" size-xl="8" key={valueInfoId}>
                    <IonCard className="machine-card">
                      <IonCardHeader>
                        <div className="card-header-with-update">
                          <IonCardTitle className="card-title">
                            <IonIcon icon={construct} className="card-title-icon" />
                            {machineData.selectedEquipment || `Equipment ${index + 1}`}
                          </IonCardTitle>
                          <IonButton 
                            fill="clear" 
                            className="icon-blue update-button"
                            onClick={() => handleUpdateClick(machineData, valueInfoId)}
                          >
                            <IonIcon icon={arrowUpCircleOutline} className="update-icon" />
                            <span className="update-text">Update Machinery Data</span>
                          </IonButton>
                        </div>
                      </IonCardHeader>

                      <IonCardContent>
                        {/* Basic Information Section */}
                        <div className="card-section">
                          <IonText color="medium" className="section-title">
                            <h4>Basic Information</h4>
                          </IonText>
                          <div className="info-grid">
                            <div className="info-item">
                              <label>Serial Number</label>
                              <IonText>{machineData.serialNo || 'N/A'}</IonText>
                            </div>
                            <div className="info-item">
                              <label>Brand & Model</label>
                              <IonText>{machineData.brandModel || 'N/A'}</IonText>
                            </div>
                            <div className="info-item">
                              <label>Condition</label>
                              <IonChip 
                                color={
                                  machineData.condition === 'Excellent' ? 'success' :
                                  machineData.condition === 'Good' ? 'warning' :
                                  machineData.condition === 'Poor' ? 'danger' : 'medium'
                                }
                              >
                                {machineData.condition || 'Unknown'}
                              </IonChip>
                            </div>
                            <div className="info-item full-width">
                              <label>Description</label>
                              <IonText>{machineData.machineDescription || 'No description provided'}</IonText>
                            </div>
                          </div>
                        </div>

                        {/* Specifications Section */}
                        <div className="card-section">
                          <IonText color="medium" className="section-title">
                            <IonIcon icon={cube} className="section-icon" />
                            <h4>Specifications</h4>
                          </IonText>
                          <div className="info-grid">
                            <div className="info-item">
                              <label>Units</label>
                              <IonText>{machineData.numberOfUnits || 'N/A'}</IonText>
                            </div>
                            <div className="info-item">
                              <label>Purchase Type</label>
                              <IonText>{machineData.purchaseType || 'N/A'}</IonText>
                            </div>
                            <div className="info-item">
                              <label>Years Used</label>
                              <IonText>{machineData.yearsUsed || 'N/A'}</IonText>
                            </div>
                            <div className="info-item">
                              <label>Estimated Life</label>
                              <IonText>{machineData.estimatedLife ? `${machineData.estimatedLife} years` : 'N/A'}</IonText>
                            </div>
                          </div>
                        </div>

                        {/* Life Metrics Section */}
                        <div className="card-section">
                          <IonText color="medium" className="section-title">
                            <h4>Life Metrics</h4>
                          </IonText>
                          <div className="info-grid">
                            <div className="info-item">
                              <label>Years Used</label>
                              <IonText>{machineData.yearsUsed || 'N/A'}</IonText>
                            </div>
                            <div className="info-item">
                              <label>Estimated Life</label>
                              <IonText>{machineData.estimatedLife ? `${machineData.estimatedLife} years` : 'N/A'}</IonText>
                            </div>
                            <div className="info-item">
                              <label>Remaining Life</label>
                              <IonText className="calculated-value">
                                {machineData.remainingLife ? `${machineData.remainingLife} years` : 'N/A'}
                              </IonText>
                            </div>
                          </div>
                        </div>

                        {/* Timeline Section */}
                        <div className="card-section">
                          <IonText color="medium" className="section-title">
                            <IonIcon icon={calendar} className="section-icon" />
                            <h4>Timeline</h4>
                          </IonText>
                          <div className="info-grid">
                            <div className="info-item">
                              <label>Date Acquired</label>
                              <IonText>{formatDate(machineData.dateAcquired)}</IonText>
                            </div>
                            <div className="info-item">
                              <label>Date Installed</label>
                              <IonText>{formatDate(machineData.dateInstalled)}</IonText>
                            </div>
                            <div className="info-item">
                              <label>Date Operated</label>
                              <IonText>{formatDate(machineData.dateOperated)}</IonText>
                            </div>
                          </div>
                        </div>

                        {/* Cost Information Section */}
                        <div className="card-section">
                          <IonText color="medium" className="section-title">
                            <IonIcon icon={cash} className="section-icon" />
                            <h4>Cost Information</h4>
                          </IonText>
                          <div className="info-grid">
                            <div className="info-item">
                              <label>Original Cost</label>
                              <IonText>{formatCurrency(machineData.originalCost)}</IonText>
                            </div>
                            <div className="info-item">
                              <label>Depreciation</label>
                              <IonText className="cost-value">
                                {formatCurrency(machineData.depreciation)}
                              </IonText>
                            </div>
                            <div className="info-item">
                              <label>Freight</label>
                              <IonText>{formatCurrency(machineData.freight)}</IonText>
                            </div>
                            <div className="info-item">
                              <label>Insurance</label>
                              <IonText>{formatCurrency(machineData.insurance)}</IonText>
                            </div>
                            <div className="info-item">
                              <label>Installation</label>
                              <IonText>{formatCurrency(machineData.installation)}</IonText>
                            </div>
                            <div className="info-item">
                              <label>Other Costs</label>
                              <IonText>{formatCurrency(machineData.others)}</IonText>
                            </div>
                            <div className="info-item full-width">
                              <label>Total Cost</label>
                              <IonText className="calculated-value total-cost">
                                {formatCurrency(machineData.totalCost)}
                              </IonText>
                            </div>
                          </div>
                        </div>

                        {/* Depreciation Section */}
                        <div className="card-section">
                          <IonText color="medium" className="section-title">
                            <h4>Depreciation & Value</h4>
                          </IonText>
                          <div className="info-grid">
                            <div className="info-item">
                              <label>Depreciation Rate</label>
                              <IonText>{formatDepreciation(machineData.depreciation)}</IonText>
                            </div>
                            <div className="info-item">
                              <label>Adjusted Market Value</label>
                              <IonText className="calculated-value market-value">
                                {formatCurrency(machineData.adjustedMarketValue)}
                              </IonText>
                            </div>
                          </div>
                        </div>

                        {/* Additional Details */}
                        {machineData.machineDetails && (
                          <div className="card-section">
                            <IonText color="medium" className="section-title">
                              <h4>Additional Details</h4>
                            </IonText>
                            <div className="details-text">
                              <IonText>{machineData.machineDetails}</IonText>
                            </div>
                          </div>
                        )}
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MachineryTable;