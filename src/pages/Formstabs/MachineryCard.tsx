import React from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonCol,
  IonText,
  IonChip,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { construct, cube, calendar, cash, arrowUpCircleOutline } from 'ionicons/icons';
import { MachineData } from '../../utils/tablestorages/MachineDataLocalStorage';

interface CalculatedMachineData extends MachineData {
  remainingLife: string;
  totalCost: string;
  adjustedMarketValue: string;
}

interface MachineryCardProps {
  machineData: CalculatedMachineData;
  valueInfoId: string;
  index: number;
  onUpdateClick: (machineData: CalculatedMachineData, valueInfoId: string) => void;
}

const MachineryCard: React.FC<MachineryCardProps> = ({
  machineData,
  valueInfoId,
  index,
  onUpdateClick,
}) => {
  const formatNumber = (value: string): string => {
    if (!value || value === 'N/A') return 'N/A';
    const number = parseFloat(value);
    if (isNaN(number)) return value;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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

  return (
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
              onClick={() => onUpdateClick(machineData, valueInfoId)}
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
                <IonText>{formatNumber(machineData.originalCost)}</IonText>
              </div>
              <div className="info-item">
                <label>Depreciation</label>
                <IonText className="cost-value">
                  {formatNumber(machineData.depreciation)}
                </IonText>
              </div>
              <div className="info-item">
                <label>Freight</label>
                <IonText>{formatNumber(machineData.freight)}</IonText>
              </div>
              <div className="info-item">
                <label>Insurance</label>
                <IonText>{formatNumber(machineData.insurance)}</IonText>
              </div>
              <div className="info-item">
                <label>Installation</label>
                <IonText>{formatNumber(machineData.installation)}</IonText>
              </div>
              <div className="info-item">
                <label>Other Costs</label>
                <IonText>{formatNumber(machineData.others)}</IonText>
              </div>
              <div className="info-item full-width">
                <label>Base Market Value</label>
                <IonText className="calculated-value total-cost">
                  {formatNumber(machineData.totalCost)}
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
                  {formatNumber(machineData.adjustedMarketValue)}
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
  );
};

export default MachineryCard;