// src/pages/hooks/useNonAgriCalculations.ts
import { useState, useEffect } from "react";
import { NonAgriAdjustmentLocalStorage } from '../../utils/tablestorages/NonAgriAdjustmentLocalStorage';
import { getSubclassRateData, getCurrentRateForSubclass } from '../../utils/subclassRateLocalStorage';
import { getAssessmentLevelData } from '../../utils/assessmentLevelLocalStorage';

interface UseNonAgriCalculationsProps {
    formData: any;
    valueInfoId: string;
    landAdjustments: any[];
}

export const useNonAgriCalculations = ({
    formData,
    valueInfoId,
    landAdjustments
}: UseNonAgriCalculationsProps) => {
    // Calculation states
    const [subclassRates, setSubclassRates] = useState<any[]>([]);
    const [isLoadingRates, setIsLoadingRates] = useState(false);
    const [currentAdjustments, setCurrentAdjustments] = useState<any[]>([]);
    const [adjustmentsVersion, setAdjustmentsVersion] = useState(0);

    // Check if adjustments exist
    const hasCornerInfluence = currentAdjustments.some(
        adj => adj.adjustment_type === 'Corner Influence'
    );

    const hasStripping = currentAdjustments.some(
        adj => adj.adjustment_type === 'Stripping'
    );

    // Calculation functions
    const calculateValueAdjustment = (adjustmentType: string, adjustmentFactor: string, rate: number, area: number, additionalFactor?: number): string => {
        if (!adjustmentFactor || !rate) {
            return 'N/A';
        }

        try {
            const factor = parseFloat(adjustmentFactor) / 100;

            switch (adjustmentType) {
                case 'Corner Influence':
                    return (rate * factor * area).toFixed(2);

                case 'Stripping':
                    const stripArea = additionalFactor || 0;
                    return (rate * factor * stripArea).toFixed(2);

                case 'Commercial Frontage':
                    const firstValue = rate * 0.5;
                    return (factor * firstValue).toFixed(2);

                default:
                    return 'N/A';
            }
        } catch (error) {
            console.error('Error calculating value adjustment:', error);
            return 'N/A';
        }
    };

    const calculateBaseMarketValue = (rate: number, area: number): string => {
        if (isNaN(rate) || isNaN(area) || rate <= 0 || area <= 0) {
            return 'N/A';
        }
        try {
            return (rate * area).toFixed(2);
        } catch (error) {
            console.error('Error calculating base market value:', error);
            return 'N/A';
        }
    };

    const calculateAdjustmentMarketValue = (baseMarketValue: string, adjustments: any[]): string => {
        if (baseMarketValue === 'N/A') return 'N/A';
        
        try {
            const baseValue = parseFloat(baseMarketValue);
            if (isNaN(baseValue)) return 'N/A';

            const totalAdjustments = adjustments.reduce((sum, adjustment) => {
                if (adjustment.adjustment_type !== 'Stripping' && adjustment.value_adjustment !== 'N/A') {
                    const adjustmentValue = parseFloat(adjustment.value_adjustment);
                    return sum + (isNaN(adjustmentValue) ? 0 : adjustmentValue);
                }
                return sum;
            }, 0);

            return (baseValue + totalAdjustments).toFixed(2);
        } catch (error) {
            console.error('Error calculating adjustment market value:', error);
            return 'N/A';
        }
    };

    const calculateStrippingMarketValue = (adjustments: any[]): string => {
        try {
            const strippingAdjustments = adjustments.filter(
                adj => adj.adjustment_type === 'Stripping'
            );

            if (strippingAdjustments.length === 0) return 'N/A';

            const totalStrippingValue = strippingAdjustments.reduce((sum, adjustment) => {
                if (adjustment.value_adjustment !== 'N/A') {
                    const adjustmentValue = parseFloat(adjustment.value_adjustment);
                    return sum + (isNaN(adjustmentValue) ? 0 : adjustmentValue);
                }
                return sum;
            }, 0);

            return totalStrippingValue.toFixed(2);
        } catch (error) {
            console.error('Error calculating stripping market value:', error);
            return 'N/A';
        }
    };

    // SIMPLIFIED: Get assessment level by kind_id and class_id only (no range checking)
    const calculateAssessmentLevel = async (kindId: number, classification: string): Promise<string> => {
        try {
            const assessmentLevels = await getAssessmentLevelData();
            if (!assessmentLevels || assessmentLevels.length === 0) {
                return 'N/A';
            }

            const numericKindId = typeof kindId === 'string' ? parseInt(kindId) : kindId;
            
            // SIMPLIFIED: Find assessment level by kind_id and class_id only, no range checking
            const matchingLevel = assessmentLevels.find(level => 
                level.kind_id === numericKindId &&
                level.class_id === classification
            );

            return matchingLevel ? matchingLevel.rate_percent : 'N/A';
        } catch (error) {
            console.error('Error calculating assessment level:', error);
            return 'N/A';
        }
    };

    const calculateAssessedValue = (adjustedMarketValue: string, assessmentLevel: string): string => {
        if (adjustedMarketValue === 'N/A' || assessmentLevel === 'N/A') return 'N/A';
        
        try {
            const marketValue = parseFloat(adjustedMarketValue);
            if (isNaN(marketValue) || marketValue <= 0) return 'N/A';

            const assessmentRate = parseFloat(assessmentLevel.replace('%', '')) / 100;
            if (isNaN(assessmentRate) || assessmentRate <= 0) return 'N/A';

            const assessedValue = marketValue * assessmentRate;
            return assessedValue.toFixed(2);
        } catch (error) {
            console.error('Error calculating assessed value:', error);
            return 'N/A';
        }
    };

    const getBaseAdjustmentsData = async (): Promise<any[]> => {
        if (!valueInfoId || landAdjustments.length === 0) return [];

        try {
            const nonAgriAdjustments = await NonAgriAdjustmentLocalStorage.getAdjustmentsByValueInfoId(valueInfoId);

            const adjustmentsWithData = await Promise.all(
                nonAgriAdjustments.map(async (nonAgriAdj) => {
                    const landAdj = landAdjustments.find(adj => adj.adjustment_id === nonAgriAdj.adjustmentId);

                    const additionalFactorValue = await NonAgriAdjustmentLocalStorage.getAdditionalFactor(
                        valueInfoId, 
                        nonAgriAdj.adjustmentId
                    );

                    const adjustment = {
                        adjustmentId: nonAgriAdj.adjustmentId,
                        adjustment_type: landAdj?.adjustment_type || 'N/A',
                        description: landAdj?.description || 'N/A',
                        adjustment_factor: landAdj?.adjustment_factor ? `${landAdj.adjustment_factor}%` : 'N/A',
                        value_adjustment: 'N/A'
                    };

                    if (landAdj?.adjustment_type === 'Stripping') {
                        return {
                            ...adjustment,
                            additional_factor: additionalFactorValue ? additionalFactorValue.toLocaleString() : 'N/A'
                        };
                    }

                    return adjustment;
                })
            );

            return adjustmentsWithData;
        } catch (error) {
            console.error('Error getting base adjustments data:', error);
            return [];
        }
    };

    const loadSubclassRates = async () => {
        if (!formData?.subclass) return;

        setIsLoadingRates(true);
        try {
            const ratesData = await getSubclassRateData();
            if (ratesData) {
                const apiRate = await getCurrentRateForSubclass(formData.subclass);
                const area = formData?.area || 0;

                const rateString = apiRate ? String(apiRate) : '0';
                const rateNumber = parseFloat(rateString);
                const isValidRate = !isNaN(rateNumber) && isFinite(rateNumber) && rateNumber >= 0;

                const displayRate = isValidRate ? rateString : '0';
                const calculatedRate = isValidRate ? rateNumber : 0;

                // Calculate base market value first
                const baseMarketValue = calculateBaseMarketValue(calculatedRate, area);

                const baseAdjustments = await getBaseAdjustmentsData();
                
                const adjustmentsWithCalculations = await Promise.all(
                    baseAdjustments.map(async (adj) => {
                        const landAdj = landAdjustments.find(la => la.adjustment_id === adj.adjustmentId);
                        const additionalFactorValue = await NonAgriAdjustmentLocalStorage.getAdditionalFactor(
                            valueInfoId, 
                            adj.adjustmentId
                        );

                        const valueAdjustment = calculateValueAdjustment(
                            adj.adjustment_type,
                            landAdj?.adjustment_factor || '',
                            calculatedRate,
                            area,
                            additionalFactorValue
                        );

                        if (adj.adjustment_type !== 'Stripping') {
                            return {
                                ...adj,
                                value_adjustment: valueAdjustment
                            };
                        }

                        return {
                            ...adj,
                            value_adjustment: valueAdjustment,
                            additional_factor: additionalFactorValue ? additionalFactorValue.toLocaleString() : 'N/A'
                        };
                    })
                );

                setCurrentAdjustments(adjustmentsWithCalculations);

                const hasStripping = adjustmentsWithCalculations.some(adj => adj.adjustment_type === 'Stripping');
                
                let adjustmentMarketValue;
                
                if (hasStripping) {
                    adjustmentMarketValue = calculateStrippingMarketValue(adjustmentsWithCalculations);
                } else {
                    adjustmentMarketValue = calculateAdjustmentMarketValue(baseMarketValue, adjustmentsWithCalculations);
                }

                // SIMPLIFIED: Pass only kind_id and classification, no market value for range checking
                const assessmentLevel = await calculateAssessmentLevel(
                    formData.kind,
                    formData.classification
                );

                const assessedValue = calculateAssessedValue(adjustmentMarketValue, assessmentLevel);

                const rateDisplayData = [{
                    valueInfoId: valueInfoId,
                    rate: displayRate,
                    base_market_value: baseMarketValue,
                    adjustment_market_value: adjustmentMarketValue,
                    assessment_level: assessmentLevel,
                    assessed_value: assessedValue
                }];

                setSubclassRates(rateDisplayData);
            }
        } catch (error) {
            console.error('Error loading subclass rates:', error);
            setSubclassRates([{
                valueInfoId: valueInfoId,
                rate: '0',
                base_market_value: 'N/A',
                adjustment_market_value: 'N/A',
                assessment_level: 'N/A',
                assessed_value: 'N/A'
            }]);
            setCurrentAdjustments([]);
        } finally {
            setIsLoadingRates(false);
        }
    };

    const triggerRateRecalculation = () => {
        setAdjustmentsVersion(prev => prev + 1);
    };

    const getStrippingInfo = async () => {
        const strippingAdjustments = currentAdjustments.filter(
            adj => adj.adjustment_type === 'Stripping'
        );
        
        const currentCount = strippingAdjustments.length;
        const nextNumber = currentCount + 1;
        
        let totalStripArea = 0;
        
        if (strippingAdjustments.length > 0 && valueInfoId) {
            for (const adj of strippingAdjustments) {
                if (adj.adjustmentId) {
                    const additionalFactorValue = await NonAgriAdjustmentLocalStorage.getAdditionalFactor(
                        valueInfoId, 
                        adj.adjustmentId
                    );
                    if (additionalFactorValue) {
                        totalStripArea += additionalFactorValue;
                    }
                }
            }
        }
        
        const remainingArea = Math.max(0, (formData?.area || 0) - totalStripArea);
        
        return {
            currentCount,
            nextNumber,
            hasStripping: currentCount > 0,
            canAddMore: currentCount < 4 && remainingArea > 0,
            remainingArea: remainingArea,
            totalStripArea: totalStripArea
        };
    };

    const getStrippingAdjustment = (stripNumber: number) => {
        const adjustmentId = `S${stripNumber}`;
        return landAdjustments.find(adj => adj.adjustment_id === adjustmentId) || null;
    };

    const getStrippingIconLabel = async () => {
        const { nextNumber, canAddMore } = await getStrippingInfo();
        
        if (!canAddMore) {
            return "Max Strips Reached";
        }
        
        switch (nextNumber) {
            case 1: return "Add 1st Strip";
            case 2: return "Add 2nd Strip";
            case 3: return "Add 3rd Strip";
            case 4: return "Add 4th Strip";
            default: return "Add Strip";
        }
    };

    const getSubmitDisabledInfo = async (): Promise<{ disabled: boolean; reason: string }> => {
        const { currentCount, remainingArea } = await getStrippingInfo();
        
        if (currentCount > 0 && remainingArea !== 0) {
            return {
                disabled: true,
                reason: `Cannot submit while there are ${currentCount} strip(s) with ${remainingArea.toLocaleString()} remaining area. All strips must fully utilize the land area.`
            };
        }
        
        return {
            disabled: false,
            reason: ''
        };
    };

    // Load rates when dependencies change
    useEffect(() => {
        loadSubclassRates();
    }, [formData, valueInfoId, landAdjustments, adjustmentsVersion]);

    return {
        // State
        subclassRates,
        isLoadingRates,
        currentAdjustments,
        adjustmentsVersion,
        hasCornerInfluence,
        hasStripping,

        // Methods
        loadSubclassRates,
        triggerRateRecalculation,
        getStrippingInfo,
        getStrippingAdjustment,
        getStrippingIconLabel,
        getSubmitDisabledInfo
    };
};