import React from 'react';
import { IonRow, IonCol, IonText } from '@ionic/react';

interface BuildingAdjustmentCalculationsProps {
    marketValue: number | null;
    adjustedValue: number | null;
    selectedSubcomponentRate: number | null;
    selectedSubcomponentPercent: boolean | null;
    formData: {
        area: string;
        completion_percent: string;
        depreciation: string;
    };
    baseMarketValue?: number;
}

const BuildingAdjustmentCalculations: React.FC<BuildingAdjustmentCalculationsProps> = ({
    marketValue,
    adjustedValue,
    selectedSubcomponentRate,
    selectedSubcomponentPercent,
    formData,
    baseMarketValue = 0
}) => {
    const getCalculationDetails = () => {
        if (selectedSubcomponentRate === null) return null;

        const area = parseFloat(formData.area) || 0;
        const completionPercent = parseFloat(formData.completion_percent) || 0;
        const depreciation = parseFloat(formData.depreciation) || 0;

        if (selectedSubcomponentPercent) {
            // Percentage calculation details
            return (
                <div className="calculation-details">
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '4px' }}>
                        Base Market Value × Rate %
                        {completionPercent > 0 && ` × Completion %`}
                        {depreciation > 0 && ` × (1 - Depreciation %)`}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                        ₱{baseMarketValue.toLocaleString()} × {selectedSubcomponentRate}%
                        {completionPercent > 0 && ` × ${completionPercent}%`}
                        {depreciation > 0 && ` × (1 - ${depreciation}%)`}
                    </div>
                </div>
            );
        } else {
            // Fixed rate calculation details
            return (
                <div className="calculation-details">
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '4px' }}>
                        Area × Rate × Completion %
                        {depreciation > 0 && ` × (1 - Depreciation %)`}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                        {area.toLocaleString()} × ₱{selectedSubcomponentRate.toLocaleString()} × {completionPercent}%
                        {depreciation > 0 && ` × (1 - ${depreciation}%)`}
                    </div>
                </div>
            );
        }
    };

    return (
        <IonRow>
            {marketValue !== null && (
                <IonCol size="6" className="custom-col">
                    <div className="calculation-display market-value">
                        <IonText className="calculation-title">Market Value</IonText>
                        {getCalculationDetails()}
                        <div className="calculation-result">
                            = ₱{marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </IonCol>
            )}
            {adjustedValue !== null && (
                <IonCol size="6" className="custom-col">
                    <div className="calculation-display adjusted-value">
                        <IonText className="calculation-title">Adjusted Value</IonText>
                        <div className="calculation-details">
                            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '4px' }}>
                                Market Value × (1 - Depreciation %)
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                ₱{marketValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × (1 - {parseFloat(formData.depreciation) || 0}%)
                            </div>
                        </div>
                        <div className="calculation-result">
                            = ₱{adjustedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </IonCol>
            )}
        </IonRow>
    );
};

export default BuildingAdjustmentCalculations;