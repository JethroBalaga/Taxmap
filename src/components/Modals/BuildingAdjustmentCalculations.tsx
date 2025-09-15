import React from 'react';
import { IonRow, IonCol, IonText } from '@ionic/react';

interface BuildingAdjustmentCalculationsProps {
    marketValue: number | null;
    adjustedValue: number | null;
    selectedSubcomponentRate: number | null;
    formData: {
        area: string;
        completion_percent: string;
        depreciation: string;
    };
}

const BuildingAdjustmentCalculations: React.FC<BuildingAdjustmentCalculationsProps> = ({
    marketValue,
    adjustedValue,
    selectedSubcomponentRate,
    formData
}) => {
    return (
        <IonRow>
            {marketValue !== null && (
                <IonCol size="6" className="custom-col">
                    <div className="calculation-display market-value">
                        <IonText className="calculation-title">Market Value Calculation:</IonText>
                        <div className="calculation-details">
                            <div>(Rate: ₱{selectedSubcomponentRate?.toLocaleString()} × Area: {parseFloat(formData.area).toLocaleString()} sq ft)</div>
                            {formData.completion_percent && (
                                <div>× Completion: {formData.completion_percent}%</div>
                            )}
                            <div className="calculation-result">
                                = ₱{marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                </IonCol>
            )}
            {adjustedValue !== null && (
                <IonCol size="6" className="custom-col">
                    <div className="calculation-display adjusted-value">
                        <IonText className="calculation-title">Adjusted Value Calculation:</IonText>
                        <div className="calculation-details">
                            <div>Market Value: ₱{marketValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            {formData.depreciation && (
                                <div>- Depreciation: {formData.depreciation}%</div>
                            )}
                            <div className="calculation-result">
                                = ₱{adjustedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                </IonCol>
            )}
        </IonRow>
    );
};

export default BuildingAdjustmentCalculations;