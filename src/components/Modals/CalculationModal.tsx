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
    area,
    rating
}) => {
    const marketValue = area * rating;
    const [adjustmentValue, setAdjustmentValue] = useState('0%');
    const [adjustedValue, setAdjustedValue] = useState(marketValue);

    useEffect(() => {
        // Calculate adjusted value whenever adjustment or market value changes
        const percentage = parseFloat(adjustmentValue.replace('%', '')) / 100;
        const adjustmentAmount = marketValue * percentage;
        setAdjustedValue(marketValue + adjustmentAmount);
    }, [adjustmentValue, marketValue]);

    return (
        <IonModal isOpen={isOpen} onDidDismiss={onClose}>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Adjustment</IonTitle>
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

                <IonItem>
                    <IonLabel>Assessed Value:</IonLabel>
                    <IonNote slot="end">TBD</IonNote>
                </IonItem>

                <IonItem>
                    <IonLabel>Tax Rate:</IonLabel>
                    <IonNote slot="end">TBD</IonNote>
                </IonItem>

                <IonItem>
                    <IonLabel>Real Property Tax:</IonLabel>
                    <IonNote slot="end">TBD</IonNote>
                </IonItem>
            </IonContent>
        </IonModal>
    );
};

export default CalculationModal;