import { AssessmentLevelData } from '../../utils/assessmentLevelLocalStorage';

interface SubclassRateData {
  value_info_id: string;
  subclass_id: string;
  subclass_description?: string;
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

  const calculateAdjustedMarketValue = (baseMarketValue: number) => {
    const totalAdjustment = calculateTotalAdjustment();
    const adjustedMarketValuePercentage = totalAdjustment < 0 ? 
      100 + totalAdjustment : 100 - totalAdjustment;
    
    return baseMarketValue * (adjustedMarketValuePercentage / 100);
  };

  const totalAdjustment = calculateTotalAdjustment();
  const adjustedMarketValuePercentage = totalAdjustment < 0 ? 
    100 + totalAdjustment : 100 - totalAdjustment;

  const getDisplayableFormData = () => {
    if (!formData) return {};
    const { status, uploaded, id, ...displayableData } = formData;
    return displayableData;
  };

  const displayableFormData = getDisplayableFormData();

  const tableData = subclassRates.map(rate => {
    // Calculate adjusted market value dynamically based on current agricultural data
    const currentAdjustedMarketValue = calculateAdjustedMarketValue(rate.baseMarketValue || 0);
    
    const ratePercent = rate.assessmentLevel?.rate_percent || '0';
    const assessmentRate = parseFloat(ratePercent.replace('%', '')) / 100;
    const assessedValue = currentAdjustedMarketValue * assessmentRate;

    return {
      value_info_id: rate.value_info_id,
      subclass_id: rate.subclass_id,
      subclass_description: rate.subclass_description || rate.subclass_id,
      rate: rate.rate.toFixed(4),
      base_market_value: rate.baseMarketValue?.toFixed(2) || 'N/A',
      adjusted_market_value: currentAdjustedMarketValue.toFixed(2), // Use dynamically calculated value
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