import React, { useState, useEffect, useCallback } from 'react';
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
import Next from '../GlobalComponent/Next';
import PhotoModal from './PhotoModal';

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
    const [showPhotoModal, setShowPhotoModal] = useState(false);

    // Calculate adjusted value whenever adjustment or market value changes
    useEffect(() => {
        const percentage = parseFloat(adjustmentValue.replace('%', '')) / 100;
        const adjustmentAmount = marketValue * percentage;
        setAdjustedValue(marketValue + adjustmentAmount);
    }, [adjustmentValue, marketValue]);

    // Calculate assessed value and property tax whenever dependencies change
    useEffect(() => {
        const assessmentPercentage = parseFloat(assessmentValue.replace('%', '')) / 100;
        const baseValue = adjustmentValue === '0%' ? marketValue : adjustedValue;
        const newAssessedValue = baseValue * assessmentPercentage;
        setAssessedValue(newAssessedValue);

        const taxRate = parseFloat(taxRateValue.replace('%', '')) / 100;
        setPropertyTax(newAssessedValue * taxRate);
    }, [assessmentValue, adjustedValue, adjustmentValue, marketValue, taxRateValue]);

    const handleNextClick = useCallback(() => {
        setShowPhotoModal(true);
    }, []);

    const handlePhotoModalClose = useCallback(() => {
        setShowPhotoModal(false);
    }, []);

    return (
        <>
            <IonModal isOpen={isOpen} onDidDismiss={onClose}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Tax Calculation</IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={onClose}>Close</IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>

                <IonContent className="ion-padding">
                    {/* Property Information */}
                    <IonItem>
                        <IonLabel>Area:</IonLabel>
                        <IonNote slot="end">{area.toLocaleString()} sqm</IonNote>
                    </IonItem>
                    <IonItem>
                        <IonLabel>Rating:</IonLabel>
                        <IonNote slot="end">₱{rating.toLocaleString()}</IonNote>
                    </IonItem>

                    {/* Calculation Section */}
                    <div className="calculation-section">
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

                        <IonItem className="total-tax">
                            <IonLabel>Real Property Tax:</IonLabel>
                            <IonNote slot="end">₱{propertyTax.toLocaleString()}</IonNote>
                        </IonItem>
                    </div>

                    <Next onClick={handleNextClick}  disabled={propertyTax === 0} />
                </IonContent>
            </IonModal>
            
            <PhotoModal
                isOpen={showPhotoModal}
                onClose={handlePhotoModalClose}
                onPhotoTaken={(photo) => {
                    // Handle the captured photo if needed
                    console.log('Photo taken:', photo);
                    handlePhotoModalClose();
                }}
            />
        </>
    );
};

export default CalculationModal;