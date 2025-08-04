import React, { useState, useEffect } from 'react';
import {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonLabel,
    IonItem,
    IonNote
} from '@ionic/react';
import Adjustment from '../CalculationModal/Adjustment';
import AssessmentLevel from '../CalculationModal/AssessmentLevel';
import TaxRate from '../CalculationModal/TaxRate';

interface CalculationModalProps {
    isOpen: boolean;
    onClose: () => void;
    declarant: string;
    kind: string;
    classification: string;
    area: number;
    actualUse: string;
    group: string;
    location: string;
    subclass: string;
    rating: number;
}

const CalculationModal: React.FC<CalculationModalProps> = ({
    isOpen,
    onClose,
    declarant,
    kind,
    classification,
    area,
    actualUse,
    group,
    location,
    subclass,
    rating
}) => {
    const marketValue = area * rating;
    const [adjustmentValue, setAdjustmentValue] = useState('0%');
    const [assessmentValue, setAssessmentValue] = useState('0%');
    const [taxRateValue, setTaxRateValue] = useState('0%');
    const [adjustedValue, setAdjustedValue] = useState(marketValue);
    const [assessedValue, setAssessedValue] = useState(0);
    const [propertyTax, setPropertyTax] = useState(0);

    useEffect(() => {
        // Calculate adjusted value
        const percentage = parseFloat(adjustmentValue.replace('%', '')) / 100;
        const adjustmentAmount = marketValue * percentage;
        setAdjustedValue(marketValue + adjustmentAmount);
    }, [adjustmentValue, marketValue]);

    useEffect(() => {
        // Calculate assessed value
        const assessmentPercentage = parseFloat(assessmentValue.replace('%', '')) / 100;
        const baseValue = adjustmentValue === '0%' ? marketValue : adjustedValue;
        const newAssessedValue = baseValue * assessmentPercentage;
        setAssessedValue(newAssessedValue);
        
        // Calculate property tax whenever assessed value or tax rate changes
        const taxRate = parseFloat(taxRateValue.replace('%', '')) / 100;
        setPropertyTax(newAssessedValue * taxRate);
    }, [assessmentValue, adjustedValue, adjustmentValue, marketValue, taxRateValue]);

    return (
        <IonModal isOpen={isOpen} onDidDismiss={onClose}>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Tax Calculation</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onClose}>Close</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                <IonItem>
                    <IonLabel>Area:</IonLabel>
                    <IonNote slot="end">{area.toLocaleString()} sqm</IonNote>
                </IonItem>
                <IonItem>
                    <IonLabel>Rating:</IonLabel>
                    <IonNote slot="end">₱{rating.toLocaleString()}</IonNote>
                </IonItem>

                {/* Calculation Section */}
                <IonItem>
                    <IonLabel>Market Value:</IonLabel>
                    <IonNote slot="end">₱{marketValue.toLocaleString()}</IonNote>
                </IonItem>

                <Adjustment
                    label="Adjustment"
                    value={adjustmentValue}
                    onChange={setAdjustmentValue}
                    placeholder="Enter percentage"
                />

                {adjustmentValue !== '0%' && (
                    <>
                        <IonItem>
                            <IonLabel>Adjustment Percentage:</IonLabel>
                            <IonNote slot="end">{adjustmentValue}</IonNote>
                        </IonItem>
                        <IonItem>
                            <IonLabel>Adjustment Amount:</IonLabel>
                            <IonNote slot="end">
                                ₱{(adjustedValue - marketValue).toLocaleString()}
                            </IonNote>
                        </IonItem>
                        <IonItem>
                            <IonLabel>Adjusted Value:</IonLabel>
                            <IonNote slot="end">₱{adjustedValue.toLocaleString()}</IonNote>
                        </IonItem>
                    </>
                )}

                <AssessmentLevel
                    label="Assessment Level"
                    value={assessmentValue}
                    onChange={setAssessmentValue}
                    placeholder="Enter percentage"
                />

                <IonItem>
                    <IonLabel>Assessed Value:</IonLabel>
                    <IonNote slot="end">₱{assessedValue.toLocaleString()}</IonNote>
                </IonItem>

                <TaxRate
                    label="Tax Rate"
                    value={taxRateValue}
                    onChange={setTaxRateValue}
                    placeholder="Enter percentage"
                />

                <IonItem>
                    <IonLabel>Real Property Tax:</IonLabel>
                    <IonNote slot="end">₱{propertyTax.toLocaleString()}</IonNote>
                </IonItem>
            </IonContent>
        </IonModal>
    );
};

export default CalculationModal;