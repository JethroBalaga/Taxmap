import { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { MachineDataLocalStorage, MachineData } from '../../utils/tablestorages/MachineDataLocalStorage';
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import { getDistrictById } from '../../utils/districtLocalStorage';
// REMOVED: getDeclarantById - since declarant is now a string
import { getAssessmentLevelData, AssessmentLevelData } from '../../utils/assessmentLevelLocalStorage';

export interface FormContextData {
  districtName: string;
  declarantName: string; // This is now the direct declarant string
  classification: string;
  actualUse: string;
  valueInfoTableData: Array<{
    value_info_id: string;
    classification: string;
    actual_used: string;
    base_market_value: string;
    adjusted_market_value: string;
    assessment_level: string;
    assessed_value: string;
  }>;
}

export interface CalculatedMachineData extends MachineData {
  remainingLife: string;
  totalCost: string;
  adjustedMarketValue: string;
}

export const useMachineryData = () => {
  const { formId } = useParams<{ formId: string }>();
  const history = useHistory();
  
  const [machineryData, setMachineryData] = useState<{machineData: CalculatedMachineData, valueInfoId: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formContext, setFormContext] = useState<FormContextData | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [assessmentLevels, setAssessmentLevels] = useState<AssessmentLevelData[]>([]);
  const [isFormUploaded, setIsFormUploaded] = useState(false);

  const formatNumber = (value: string): string => {
    if (!value || value === 'N/A') return 'N/A';
    const number = parseFloat(value);
    if (isNaN(number)) return value;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);
  };

  const loadAssessmentLevels = async () => {
    try {
      const data = await getAssessmentLevelData();
      if (data) setAssessmentLevels(data);
    } catch (error) {
      console.error('Error loading assessment levels:', error);
    }
  };

  const checkFormUploaded = async () => {
    if (!formId) return;
    try {
      const formData = await FormDataLocalStorage.getFormData(formId);
      if (formData?.uploaded) {
        setIsFormUploaded(true);
      } else {
        setIsFormUploaded(false);
      }
    } catch (error) {
      console.error('Error checking form uploaded status:', error);
    }
  };

  const getAssessmentLevelRate = (adjustedMarketValue: string, kindId: number, classification: string): { rate: string, rawRate: number } => {
    if (!adjustedMarketValue || adjustedMarketValue === 'N/A') return { rate: 'N/A', rawRate: 0 };
    
    const value = parseFloat(adjustedMarketValue);
    if (isNaN(value)) return { rate: 'N/A', rawRate: 0 };
    
    const relevantAssessmentLevels = assessmentLevels.filter(level => 
      level.kind_id === kindId && 
      level.class_id === classification
    );

    if (relevantAssessmentLevels.length === 0) return { rate: 'N/A', rawRate: 0 };

    const matchingLevel = relevantAssessmentLevels.find(level => 
      value >= level.range1 && value <= level.range2
    );

    if (!matchingLevel && relevantAssessmentLevels.length > 0) {
      const rate = relevantAssessmentLevels[0].rate_percent;
      const rawRate = parseFloat(rate.replace('%', '')) || 0;
      return { rate: rate.includes('%') ? rate : `${rate}%`, rawRate };
    }

    if (matchingLevel) {
      const rate = matchingLevel.rate_percent;
      const rawRate = parseFloat(rate.replace('%', '')) || 0;
      return { rate: rate.includes('%') ? rate : `${rate}%`, rawRate };
    }

    return { rate: 'N/A', rawRate: 0 };
  };

  const calculateAssessedValue = (adjustedMarketValue: string, rawRate: number): string => {
    if (!adjustedMarketValue || adjustedMarketValue === 'N/A' || rawRate === 0) return 'N/A';
    const value = parseFloat(adjustedMarketValue);
    if (isNaN(value)) return 'N/A';
    const assessedValue = value * (rawRate / 100);
    return assessedValue.toFixed(2);
  };

  const calculateRemainingLife = (yearsUsed: string, estimatedLife: string): string => {
    if (!yearsUsed || !estimatedLife) return 'N/A';
    const years = parseFloat(yearsUsed);
    const life = parseFloat(estimatedLife);
    if (isNaN(years) || isNaN(life)) return 'N/A';
    const remaining = life - years;
    return remaining > 0 ? remaining.toFixed(1) : '0.0';
  };

  const calculateTotalCost = (
    originalCost: string,
    freight: string,
    insurance: string,
    installation: string,
    others: string
  ): string => {
    const cost = parseFloat(originalCost) || 0;
    const freightCost = parseFloat(freight) || 0;
    const insuranceCost = parseFloat(insurance) || 0;
    const installationCost = parseFloat(installation) || 0;
    const othersCost = parseFloat(others) || 0;
    const total = cost + freightCost + insuranceCost + installationCost + othersCost;
    return total > 0 ? total.toFixed(2) : 'N/A';
  };

  const calculateAdjustedMarketValue = (totalCost: string, depreciation: string): string => {
    const total = parseFloat(totalCost) || 0;
    const depreciationPercent = parseFloat(depreciation) || 0;
    if (total > 0 && depreciationPercent > 0) {
      const depreciationAmount = total * (depreciationPercent / 100);
      const adjustedValue = total - depreciationAmount;
      return adjustedValue > 0 ? adjustedValue.toFixed(2) : '0.00';
    }
    return total > 0 ? total.toFixed(2) : 'N/A';
  };

  const loadMachineryData = async () => {
    setIsLoading(true);
    try {
      const allValueInfo = await ValueInfoLocalStorage.getAllValueInfo();
      const formValueInfo = allValueInfo.filter(info => info.formDataId === formId);
      
      const machineryWithCalculations: {machineData: CalculatedMachineData, valueInfoId: string}[] = [];
      
      for (const valueInfo of formValueInfo) {
        const machineData = await MachineDataLocalStorage.getMachineData(valueInfo.id);
        if (machineData) {
          const remainingLife = calculateRemainingLife(machineData.yearsUsed, machineData.estimatedLife);
          const totalCost = calculateTotalCost(
            machineData.originalCost,
            machineData.freight,
            machineData.insurance,
            machineData.installation,
            machineData.others
          );
          const adjustedMarketValue = calculateAdjustedMarketValue(totalCost, machineData.depreciation);

          const calculatedMachineData: CalculatedMachineData = {
            ...machineData,
            remainingLife,
            totalCost,
            adjustedMarketValue
          };

          machineryWithCalculations.push({
            machineData: calculatedMachineData,
            valueInfoId: valueInfo.id
          });
        }
      }
      
      setMachineryData(machineryWithCalculations);
    } catch (error) {
      console.error('Error loading machinery data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // FIXED: Updated form context loading
  const loadFormContext = async () => {
    if (!formId) return;
    
    try {
      const formData = await FormDataLocalStorage.getFormData(formId);
      if (!formData) return;

      const districtData = formData.district ? await getDistrictById(formData.district) : null;
      const districtName = districtData?.district_name || 'Unknown District';

      // FIXED: Directly use declarant string from formData
      const declarantName = formData.declarant || 'Unknown Declarant';

      const allValueInfo = await ValueInfoLocalStorage.getAllValueInfo();
      const formValueInfo = allValueInfo.filter(info => info.formDataId === formId);
      
      const tableData = formValueInfo.map(valueInfo => {
        const machineEntry = machineryData.find(item => item.valueInfoId === valueInfo.id);
        const adjustedMarketValue = machineEntry ? machineEntry.machineData.adjustedMarketValue : 'N/A';
        
        // FIXED: Handle kind conversion properly
        const kindId = typeof formData.kind === 'string' ? parseInt(formData.kind) : formData.kind || 3;
        const classification = formData.classification || '';
        
        const { rate: assessmentLevel, rawRate } = getAssessmentLevelRate(
          adjustedMarketValue, 
          kindId,
          classification
        );

        const assessedValue = calculateAssessedValue(adjustedMarketValue, rawRate);
        
        return {
          value_info_id: valueInfo.id,
          classification: classification || 'Not specified',
          actual_used: formData.actualUse || 'Not specified',
          base_market_value: machineEntry ? formatNumber(machineEntry.machineData.totalCost) : 'N/A',
          adjusted_market_value: machineEntry ? formatNumber(adjustedMarketValue) : 'N/A',
          assessment_level: assessmentLevel,
          assessed_value: formatNumber(assessedValue)
        };
      });

      setFormContext({
        districtName,
        declarantName,
        classification: formData.classification || 'Not specified',
        actualUse: formData.actualUse || 'Not specified',
        valueInfoTableData: tableData
      });
    } catch (error) {
      console.error('Error loading form context:', error);
    } finally {
      setIsLoadingContext(false);
    }
  };

  const handleBack = () => {
    history.goBack();
  };

  useEffect(() => {
    loadMachineryData();
    loadAssessmentLevels();
    checkFormUploaded();
  }, [formId]);

  useEffect(() => {
    loadFormContext();
  }, [formId, machineryData, assessmentLevels]);

  // Add formUploaded event listener
  useEffect(() => {
    const handleFormUploaded = (event: CustomEvent) => {
      if (event.detail && event.detail.formId === formId) {
        console.log('Form uploaded, reloading form data...');
        checkFormUploaded();
      }
    };

    window.addEventListener('formUploaded', handleFormUploaded as EventListener);
    
    return () => {
      window.removeEventListener('formUploaded', handleFormUploaded as EventListener);
    };
  }, [formId]);

  return {
    formId,
    machineryData,
    isLoading,
    formContext,
    isLoadingContext,
    isFormUploaded,
    handleBack,
    loadMachineryData
  };
};