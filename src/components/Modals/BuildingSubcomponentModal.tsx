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
    IonText
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
}

const BuildingSubcomponentModal: React.FC<BuildingSubcomponentModalProps> = ({
    isOpen,
    onClose,
    subcomponentData,
    area,
    completionPercent,
    depreciation
}) => {
    // Convert string values to numbers, using a robust check for validity
    const completionPercentValue = parseFloat(completionPercent);
    const validCompletionPercent = !isNaN(completionPercentValue) ? completionPercentValue : 0;

    const depreciationAsNumber = parseFloat(depreciation);
    const validDepreciation = !isNaN(depreciationAsNumber) ? depreciationAsNumber : 0;

    // Calculate market value: area x rate
    const marketValue = subcomponentData && typeof subcomponentData.rate === 'number'
        ? area * subcomponentData.rate
        : 0;

    // Calculate value after applying completion percent
    const valueAfterCompletion = marketValue * (validCompletionPercent / 100);
    
    // Calculate the depreciation amount based on the value after completion
    // The depreciation value (e.g., "2") is a percentage.
    const depreciationAmount = valueAfterCompletion * (validDepreciation / 100);

    // Calculate final adjusted market value: value after completion - depreciation amount
    const finalAdjustedMarketValue = valueAfterCompletion - depreciationAmount;

    const formattedRate = subcomponentData && typeof subcomponentData.rate === 'number'
        ? `₱${subcomponentData.rate.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`
        : 'N/A';

    const formattedMarketValue = `₱${marketValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    const formattedValueAfterCompletion = `₱${valueAfterCompletion.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    const formattedDepreciation = `${validDepreciation}%`; // Display as percentage
    const formattedDepreciationAmount = `₱${depreciationAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`; // Display the calculated amount in pesos

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
                                    <IonCol size="12" size-md="6" className="custom-col">
                                        <div className="rate-display">
                                            <IonText className="calculation-title">Rate</IonText>
                                            <div className="rate-value">{formattedRate}</div>
                                        </div>
                                    </IonCol>
                                    <IonCol size="12" size-md="6" className="custom-col">
                                        <div className="rate-display">
                                            <IonText className="calculation-title">Area</IonText>
                                            <div className="rate-value">{area.toLocaleString()} m²</div>
                                        </div>
                                    </IonCol>
                                </IonRow>

                                <IonRow>
                                    <IonCol size="12" className="custom-col">
                                        <div className="calculation-display market-value">
                                            <IonText className="calculation-title">Market Value Calculation</IonText>
                                            <div className="calculation-details">
                                                Area × Rate = {area.toLocaleString()} × {subcomponentData.rate.toLocaleString()} 
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
                                            <div className="calculation-details">
                                                Market Value × Completion % = {formattedMarketValue} × {validCompletionPercent}%
                                            </div>
                                            <div className="calculation-result">{formattedValueAfterCompletion}</div>
                                        </div>
                                    </IonCol>
                                </IonRow>

                                <IonRow>
                                    <IonCol size="12" className="custom-col">
                                        <div className="calculation-display adjusted-value">
                                            <IonText className="calculation-title">Depreciation Amount</IonText>
                                            <div className="calculation-details">
                                                Value after Completion × Depreciation % = {formattedValueAfterCompletion} × {validDepreciation}%
                                            </div>
                                            <div className="calculation-result">{formattedDepreciationAmount}</div>
                                        </div>
                                    </IonCol>
                                </IonRow>

                                <IonRow>
                                    <IonCol size="12" className="custom-col">
                                        <div className="calculation-display market-value">
                                            <IonText className="calculation-title">Final Adjusted Market Value</IonText>
                                            <div className="calculation-details">
                                                Value after Completion - Depreciation Amount = {formattedValueAfterCompletion} - {formattedDepreciationAmount}
                                            </div>
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