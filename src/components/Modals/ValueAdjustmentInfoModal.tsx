// src/components/Modals/ValueAdjustmentInfoModal.tsx
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

interface ValueAdjustmentInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedAdjustment: any;
    formData: any;
    subclassRates: any[];
}

const ValueAdjustmentInfoModal: React.FC<ValueAdjustmentInfoModalProps> = ({
    isOpen,
    onClose,
    selectedAdjustment,
    formData,
    subclassRates
}) => {
    if (!selectedAdjustment) return null;

    const area = formData?.area || 0;
    const rateData = subclassRates[0];
    const rate = parseFloat(rateData?.rate || '0');
    const adjustmentFactor = parseFloat(selectedAdjustment.adjustment_factor?.replace('%', '') || '0');
    const additionalFactor = parseFloat(selectedAdjustment.additional_factor?.replace(/,/g, '') || '0');

    // Calculate base market value
    const baseMarketValue = area * rate;

    // Calculate value adjustment based on adjustment type
    const calculateValueAdjustment = () => {
        const factor = adjustmentFactor / 100;

        switch (selectedAdjustment.adjustment_type) {
            case 'Corner Influence':
                return rate * factor * area;

            case 'Stripping':
                return rate * factor * additionalFactor;

            case 'Commercial Frontage':
                const firstValue = rate * 0.5; // Rate - 50%
                return factor * firstValue;

            default:
                return 0;
        }
    };

    const valueAdjustment = calculateValueAdjustment();

    // Format currency values
    const formatCurrency = (value: number) => {
        return `₱${value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const formatPercentage = (value: number) => {
        return `${value}%`;
    };

    const formatArea = (value: number) => {
        return `${value.toLocaleString()} m²`;
    };

    // Get calculation details based on adjustment type
    const getCalculationDetails = () => {
        switch (selectedAdjustment.adjustment_type) {
            case 'Corner Influence':
                return {
                    formula: "Rate × Adjustment Factor × Area",
                    calculation: `${rate.toLocaleString()} × ${formatPercentage(adjustmentFactor)} × ${formatArea(area)}`,
                    explanation: "Corner influence increases the land value based on its corner location and the adjustment factor applied."
                };

            case 'Stripping':
                return {
                    formula: "Rate × Adjustment Factor × Strip Area",
                    calculation: `${rate.toLocaleString()} × ${formatPercentage(adjustmentFactor)} × ${formatArea(additionalFactor)}`,
                    explanation: "Stripping reduces the land value for portions that are unusable or have limited access."
                };

            case 'Commercial Frontage':
                return {
                    formula: "Adjustment Factor × (Rate × 50%)",
                    calculation: `${formatPercentage(adjustmentFactor)} × (${rate.toLocaleString()} × 50%)`,
                    explanation: "Commercial frontage adjusts the value based on the property's street frontage exposure for commercial purposes."
                };

            default:
                return {
                    formula: "N/A",
                    calculation: "N/A",
                    explanation: "No calculation details available for this adjustment type."
                };
        }
    };

    const calculationDetails = getCalculationDetails();

    return (
        <IonModal 
            isOpen={isOpen} 
            onDidDismiss={onClose}
            className="custom-wide-modal"
        >
            <IonHeader>
                <IonToolbar className="fancy-header">
                    <IonTitle className="fancy-title">
                        {selectedAdjustment.adjustment_type} Calculation Details
                    </IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onClose} className="fancy-close-btn">
                            <IonIcon icon={closeCircleOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="modal-content">
                <IonCard className="form-section">
                    <IonCardContent>
                        <IonGrid className="custom-grid">
                            {/* Basic Information */}
                            <IonRow>
                                <IonCol size="12" className="custom-col">
                                    <div className="calculation-display market-value">
                                        <IonText className="calculation-title">Adjustment Type</IonText>
                                        <div className="calculation-result" style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                                            {selectedAdjustment.adjustment_type}
                                        </div>
                                    </div>
                                </IonCol>
                            </IonRow>

                            {/* Base Values */}
                            <IonRow>
                                <IonCol size="12" size-md="4" className="custom-col">
                                    <div className="rate-display">
                                        <IonText className="calculation-title">Base Rate</IonText>
                                        <div className="rate-value">{formatCurrency(rate)}</div>
                                    </div>
                                </IonCol>
                                <IonCol size="12" size-md="4" className="custom-col">
                                    <div className="rate-display">
                                        <IonText className="calculation-title">Land Area</IonText>
                                        <div className="rate-value">{formatArea(area)}</div>
                                    </div>
                                </IonCol>
                                <IonCol size="12" size-md="4" className="custom-col">
                                    <div className="rate-display">
                                        <IonText className="calculation-title">Adjustment Factor</IonText>
                                        <div className="rate-value">{formatPercentage(adjustmentFactor)}</div>
                                    </div>
                                </IonCol>
                            </IonRow>

                            {/* Additional Factor for Stripping */}
                            {selectedAdjustment.adjustment_type === 'Stripping' && (
                                <IonRow>
                                    <IonCol size="12" className="custom-col">
                                        <div className="rate-display">
                                            <IonText className="calculation-title">Strip Area</IonText>
                                            <div className="rate-value">{formatArea(additionalFactor)}</div>
                                        </div>
                                    </IonCol>
                                </IonRow>
                            )}

                            {/* Base Market Value Calculation */}
                            <IonRow>
                                <IonCol size="12" className="custom-col">
                                    <div className="calculation-display market-value">
                                        <IonText className="calculation-title">Base Market Value</IonText>
                                        <div className="calculation-details">
                                            Area × Rate = {formatArea(area)} × {formatCurrency(rate)}
                                        </div>
                                        <div className="calculation-result">{formatCurrency(baseMarketValue)}</div>
                                    </div>
                                </IonCol>
                            </IonRow>

                            {/* Value Adjustment Calculation */}
                            <IonRow>
                                <IonCol size="12" className="custom-col">
                                    <div className="calculation-display adjusted-value">
                                        <IonText className="calculation-title">Value Adjustment Formula</IonText>
                                        <div className="calculation-details" style={{ fontFamily: 'monospace', fontSize: '1.1em' }}>
                                            {calculationDetails.formula}
                                        </div>
                                    </div>
                                </IonCol>
                            </IonRow>

                            <IonRow>
                                <IonCol size="12" className="custom-col">
                                    <div className="calculation-display adjusted-value">
                                        <IonText className="calculation-title">Calculation</IonText>
                                        <div className="calculation-details" style={{ fontFamily: 'monospace', fontSize: '1em' }}>
                                            {calculationDetails.calculation}
                                        </div>
                                    </div>
                                </IonCol>
                            </IonRow>

                            {/* Final Value Adjustment */}
                            <IonRow>
                                <IonCol size="12" className="custom-col">
                                    <div className="calculation-display market-value">
                                        <IonText className="calculation-title">Value Adjustment Amount</IonText>
                                        <div className="calculation-result" style={{ fontSize: '1.1em', fontWeight: 'bold' }}>
                                            {formatCurrency(valueAdjustment)}
                                        </div>
                                    </div>
                                </IonCol>
                            </IonRow>

                            {/* Explanation */}
                            <IonRow>
                                <IonCol size="12" className="custom-col">
                                    <div className="calculation-display adjusted-value">
                                        <IonText className="calculation-title">Explanation</IonText>
                                        <div className="calculation-details" style={{ fontStyle: 'italic' }}>
                                            {calculationDetails.explanation}
                                        </div>
                                    </div>
                                </IonCol>
                            </IonRow>
                        </IonGrid>
                    </IonCardContent>
                </IonCard>

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

export default ValueAdjustmentInfoModal;