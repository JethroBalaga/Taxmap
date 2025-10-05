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
  IonBadge,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { arrowBack, construct, calendar, cash, cube } from 'ionicons/icons';
import { MachineDataLocalStorage, MachineData } from '../../utils/tablestorages/MachineDataLocalStorage';
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';

interface RouteParams {
  formId: string;
}

const MachineryTable: React.FC = () => {
  const { formId } = useParams<RouteParams>();
  const history = useHistory();
  const [machineryData, setMachineryData] = useState<{machineData: MachineData, valueInfoId: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMachineryData();
  }, [formId]);

  const loadMachineryData = () => {
    setIsLoading(true);
    try {
      // Get all value info for this form
      const allValueInfo = ValueInfoLocalStorage.getAllValueInfo();
      const formValueInfo = allValueInfo.filter(info => info.formDataId === formId);
      
      // Get machine data for each value info that has machinery data
      const machineryWithValueInfo: {machineData: MachineData, valueInfoId: string}[] = [];
      
      formValueInfo.forEach(valueInfo => {
        const machineData = MachineDataLocalStorage.getMachineData(valueInfo.id);
        if (machineData) {
          machineryWithValueInfo.push({
            machineData,
            valueInfoId: valueInfo.id
          });
        }
      });
      
      setMachineryData(machineryWithValueInfo);
    } catch (error) {
      console.error('Error loading machinery data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    history.goBack();
  };

  const formatCurrency = (value: string): string => {
    if (!value) return 'N/A';
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
          <IonBadge slot="end" color="primary">
            {machineryData.length} items
          </IonBadge>
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
              <IonRow>
                {machineryData.map(({ machineData, valueInfoId }, index) => (
                  <IonCol size="12" size-lg="6" key={valueInfoId}>
                    <IonCard className="machine-card">
                      <IonCardHeader>
                        <div className="card-header">
                          <IonCardTitle>
                            <IonIcon icon={construct} className="card-title-icon" />
                            {machineData.selectedEquipment || `Equipment ${index + 1}`}
                          </IonCardTitle>
                          <IonChip color="primary">
                            Item {index + 1}
                          </IonChip>
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
                              <IonText>{machineData.estimatedLife || 'N/A'}</IonText>
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
                              <IonText className="cost-value">
                                {formatCurrency(machineData.originalCost)}
                              </IonText>
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