// src/components/Modals/BuildingSubcomponentModal.tsx
import React from 'react';
import {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    IonBadge
} from '@ionic/react';
import { closeCircleOutline } from 'ionicons/icons';
import { BuildingSubcomponentData } from '../../utils/BuildingSubcomponentLocalStorage';

interface BuildingSubcomponentModalProps {
    isOpen: boolean;
    onClose: () => void;
    subcomponentData: BuildingSubcomponentData | null;
    area: number;
    completionPercent: string;
    depreciation: string;
    baseMarketValue?: number;
}

const BuildingSubcomponentModal: React.FC<BuildingSubcomponentModalProps> = ({
    isOpen,
    onClose,
    subcomponentData,
    area,
    completionPercent,
    depreciation,
    baseMarketValue = 0
}) => {
    const completionPercentValue = parseFloat(completionPercent);
    const validCompletionPercent = !isNaN(completionPercentValue) ? completionPercentValue : 0;

    const depreciationAsNumber = parseFloat(depreciation);
    const validDepreciation = !isNaN(depreciationAsNumber) ? depreciationAsNumber : 0;

    let marketValue = 0;
    let calculationDetails = '';
    let rateDisplay = 'N/A';
    let rateType = '';

    if (subcomponentData && typeof subcomponentData.rate === 'number') {
        if (subcomponentData.percent) {
            // Percent mode: rate is percentage of base market value ONLY
            const percentageRate = subcomponentData.rate / 100;
            marketValue = baseMarketValue * percentageRate;
            
            rateDisplay = `${subcomponentData.rate}%`;
            rateType = 'percentage';
            calculationDetails = `Base Market Value × Rate % = ₱${baseMarketValue.toLocaleString()} × ${subcomponentData.rate}%`;
        } else {
            // Fixed rate mode: area × rate
            marketValue = area * subcomponentData.rate;
            
            rateDisplay = `₱${subcomponentData.rate.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
            rateType = 'fixed';
            calculationDetails = `Area × Rate = ${area.toLocaleString()} × ${subcomponentData.rate.toLocaleString()}`;
        }
    }

    const valueAfterCompletion = marketValue * (validCompletionPercent / 100);
    const depreciationAmount = valueAfterCompletion * (validDepreciation / 100);
    const finalAdjustedMarketValue = valueAfterCompletion - depreciationAmount;

    const formattedMarketValue = `₱${marketValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    const formattedValueAfterCompletion = `₱${valueAfterCompletion.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    const formattedDepreciation = `${validDepreciation}%`;
    const formattedDepreciationAmount = `₱${depreciationAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    const formattedFinalAdjustedMarketValue = `₱${finalAdjustedMarketValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    const completionPercentDisplay = completionPercent ? `${completionPercent}%` : 'N/A';

    return (
        <IonModal 
            isOpen={isOpen} 
            onDidDismiss={onClose}
            className="custom-wide-modal"
        >
            <IonHeader>
                <IonToolbar className="fancy-header">
                    <IonTitle className="fancy-title">Building Subcomponent Details</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onClose} className="fancy-close-btn">
                            <IonIcon icon={closeCircleOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="modal-content">
                {subcomponentData ? (
                    <IonCard className="form-section">
                        <IonCardContent>
                            <IonGrid className="custom-grid">
                                <IonRow>
                                    <IonCol size="12" className="custom-col">
                                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                            <IonBadge 
                                                color={rateType === 'percentage' ? 'primary' : 'success'}
                                                style={{ fontSize: '14px', padding: '8px 16px' }}
                                            >
                                                {rateType === 'percentage' ? 'Percentage Rate' : 'Fixed Rate'}
                                            </IonBadge>
                                        </div>
                                    </IonCol>
                                </IonRow>

                                <IonRow>
                                    <IonCol size="12" size-md="6" className="custom-col">
                                        <div className="rate-display">
                                            <IonText className="calculation-title">Rate</IonText>
                                            <div className="rate-value">{rateDisplay}</div>
                                        </div>
                                    </IonCol>
                                    <IonCol size="12" size-md="6" className="custom-col">
                                        <div className="rate-display">
                                            <IonText className="calculation-title">Area</IonText>
                                            <div className="rate-value">{area.toLocaleString()} m²</div>
                                        </div>
                                    </IonCol>
                                </IonRow>

                                {rateType === 'percentage' && baseMarketValue > 0 && (
                                    <IonRow>
                                        <IonCol size="12" className="custom-col">
                                            <div className="rate-display">
                                                <IonText className="calculation-title">Base Market Value</IonText>
                                                <div className="rate-value">
                                                    ₱{baseMarketValue.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    })}
                                                </div>
                                            </div>
                                        </IonCol>
                                    </IonRow>
                                )}

                                <IonRow>
                                    <IonCol size="12" className="custom-col">
                                        <div className="calculation-display market-value">
                                            <IonText className="calculation-title">Market Value Calculation</IonText>
                                            <div className="calculation-details">
                                                {calculationDetails}
                                            </div>
                                            <div className="calculation-result">{formattedMarketValue}</div>
                                        </div>
                                    </IonCol>
                                </IonRow>

                                <IonRow>
                                    <IonCol size="12" size-md="6" className="custom-col">
                                        <div className="rate-display">
                                            <IonText className="calculation-title">Completion %</IonText>
                                            <div className="rate-value">{completionPercentDisplay}</div>
                                        </div>
                                    </IonCol>
                                    <IonCol size="12" size-md="6" className="custom-col">
                                        <div className="rate-display">
                                            <IonText className="calculation-title">Depreciation</IonText>
                                            <div className="rate-value">{formattedDepreciation}</div>
                                        </div>
                                    </IonCol>
                                </IonRow>

                                <IonRow>
                                    <IonCol size="12" className="custom-col">
                                        <div className="calculation-display adjusted-value">
                                            <IonText className="calculation-title">Value after Completion</IonText>
                                            <div className="calculation-result">{formattedValueAfterCompletion}</div>
                                        </div>
                                    </IonCol>
                                </IonRow>

                                <IonRow>
                                    <IonCol size="12" className="custom-col">
                                        <div className="calculation-display adjusted-value">
                                            <IonText className="calculation-title">Depreciation Amount</IonText>
                                            <div className="calculation-result">{formattedDepreciationAmount}</div>
                                        </div>
                                    </IonCol>
                                </IonRow>

                                <IonRow>
                                    <IonCol size="12" className="custom-col">
                                        <div className="calculation-display market-value">
                                            <IonText className="calculation-title">Adjusted Market Value</IonText>
                                            <div className="calculation-result" style={{ fontSize: '1.1em', fontWeight: 'bold' }}>
                                                {formattedFinalAdjustedMarketValue}
                                            </div>
                                        </div>
                                    </IonCol>
                                </IonRow>
                            </IonGrid>
                        </IonCardContent>
                    </IonCard>
                ) : (
                    <div className="no-data">
                        <IonText>No subcomponent data available.</IonText>
                    </div>
                )}

                <div className="next-btn-container">
                    <IonButton 
                        expand="block" 
                        onClick={onClose}
                        className="next-button"
                    >
                        Close
                    </IonButton>
                </div>
            </IonContent>
        </IonModal>
    );
};

export default BuildingSubcomponentModal;