// src/pages/utils/agriculturalUtils.ts
import { AssessmentLevelData } from '../../utils/assessmentLevelLocalStorage';

interface SubclassRateData {
  value_info_id: string;
  subclass_id: string;
  rate: number;
  baseMarketValue?: number;
  assessmentLevel?: AssessmentLevelData;
  adjustedMarketValue?: number;
}

export const agriculturalUtils = (formData: any, agriculturalData: any, subclassRates: SubclassRateData[]) => {
  const calculateTotalAdjustment = () => {
    if (!agriculturalData) return 0;
    const frontage = parseFloat(agriculturalData.frontage) || 0;
    const weatherRoad = parseFloat(agriculturalData.weather_road) || 0;
    const market = parseFloat(agriculturalData.market) || 0;
    return frontage + weatherRoad + market;
  };

  const calculateAdjustedMarketValue = () => {
    const totalAdjustment = calculateTotalAdjustment();
    if (totalAdjustment < 0) {
      return 100 + totalAdjustment;
    }
    return 100 - totalAdjustment;
  };

  const totalAdjustment = calculateTotalAdjustment();
  const adjustedMarketValuePercentage = calculateAdjustedMarketValue();

  const getDisplayableFormData = () => {
    if (!formData) return {};
    const { status, uploaded, id, ...displayableData } = formData; // Added 'id' to exclusion
    return displayableData;
  };

  const displayableFormData = getDisplayableFormData();

  const tableData = subclassRates.map(rate => {
    const ratePercent = rate.assessmentLevel?.rate_percent || '0';
    const assessmentRate = parseFloat(ratePercent.replace('%', '')) / 100;
    const assessedValue = rate.adjustedMarketValue ? 
      rate.adjustedMarketValue * assessmentRate : 0;

    return {
      value_info_id: rate.value_info_id,
      subclass_id: rate.subclass_id,
      rate: rate.rate.toFixed(4),
      base_market_value: rate.baseMarketValue?.toFixed(2) || 'N/A',
      adjusted_market_value: rate.adjustedMarketValue?.toFixed(2) || 'N/A',
      assessment_level: rate.assessmentLevel?.rate_percent || 'N/A',
      assessed_value: assessedValue.toFixed(2)
    };
  });

  return {
    totalAdjustment,
    adjustedMarketValuePercentage,
    displayableFormData,
    tableData
  };
};