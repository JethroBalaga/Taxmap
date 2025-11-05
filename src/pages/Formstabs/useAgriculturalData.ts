import { useState, useEffect } from 'react';
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { AgriculturalDataLocalStorage } from '../../utils/tablestorages/AgriculturalDataLocalStorage';
import { getCurrentRateForSubclass } from '../../utils/subclassRateLocalStorage';
import { getAssessmentLevelsInRange, AssessmentLevelData } from '../../utils/assessmentLevelLocalStorage';
import { getDistrictById } from '../../utils/districtLocalStorage';

interface SubclassRateData {
  value_info_id: string;
  subclass_id: string;
  rate: number;
  baseMarketValue?: number;
  assessmentLevel?: AssessmentLevelData;
  adjustedMarketValue?: number;
}

interface FormContextData {
  districtName: string;
  declarantName: string;
  classification: string;
  actualUse: string;
}

export const useAgriculturalData = (formId: string) => {
  const [formData, setFormData] = useState<any>(null);
  const [agriculturalData, setAgriculturalData] = useState<any>(null);
  const [valueInfoId, setValueInfoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidForm, setIsValidForm] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [subclassRates, setSubclassRates] = useState<SubclassRateData[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [formContext, setFormContext] = useState<FormContextData | null>(null);
  const [isFormUploaded, setIsFormUploaded] = useState(false);

  // FIXED: Completely removed declarantId reference
  const loadFormContext = async () => {
    if (!formData) return;

    try {
      const districtData = formData.district ? await getDistrictById(formData.district) : null;
      const districtName = districtData?.district_name || 'Unknown District';

      // FIXED: Use declarant string directly - NO MORE DECLARANT ID
      const declarantName = formData.declarant || 'Not specified';

      setFormContext({
        districtName,
        declarantName,
        classification: formData.classification || 'Not specified',
        actualUse: formData.actualUse || 'Not specified'
      });
    } catch (error) {
      console.error('Error loading form context:', error);
      // Set fallback context even if there's an error
      setFormContext({
        districtName: 'Error loading district',
        declarantName: formData?.declarant || 'Error loading declarant',
        classification: formData?.classification || 'Not specified',
        actualUse: formData?.actualUse || 'Not specified'
      });
    }
  };

  const getAssessmentLevel = async (adjustedMarketValue: number, kindId: number, classId: string): Promise<AssessmentLevelData | null> => {
    try {
      const assessmentLevels = await getAssessmentLevelsInRange(adjustedMarketValue, kindId, new Date().getFullYear());
      const matchingLevel = assessmentLevels.find(level => level.class_id === classId);
      return matchingLevel || null;
    } catch (error) {
      console.error('Error getting assessment level:', error);
      return null;
    }
  };

  const loadSubclassRates = async () => {
    if (!formData?.subclass || !valueInfoId) return;
    
    setIsLoadingRates(true);
    try {
      const subclassIds = Array.isArray(formData.subclass) 
        ? formData.subclass 
        : [formData.subclass];
      
      const ratesData: SubclassRateData[] = [];
      
      for (const subclassId of subclassIds) {
        if (subclassId) {
          const rate = await getCurrentRateForSubclass(subclassId);
          if (rate !== null) {
            const area = formData.area || 0;
            const baseMarketValue = area * rate;
            
            const totalAdjustment = calculateTotalAdjustment();
            const adjustedMarketValuePercentage = totalAdjustment < 0 ? 
              100 + totalAdjustment : 100 - totalAdjustment;
            
            const adjustedMarketValue = baseMarketValue * (adjustedMarketValuePercentage / 100);
            
            const kindId = typeof formData.kind === 'string' ? parseInt(formData.kind) : formData.kind || 1;
            const classId = formData.classification || 'A';
            
            const assessmentLevel = await getAssessmentLevel(adjustedMarketValue, kindId, classId);
            
            ratesData.push({
              value_info_id: valueInfoId,
              subclass_id: subclassId,
              rate: rate,
              baseMarketValue: baseMarketValue,
              assessmentLevel: assessmentLevel || undefined,
              adjustedMarketValue: adjustedMarketValue
            });
          }
        }
      }
      
      setSubclassRates(ratesData);
    } catch (error) {
      console.error('Error loading subclass rates:', error);
    } finally {
      setIsLoadingRates(false);
    }
  };

  const calculateTotalAdjustment = () => {
    if (!agriculturalData) return 0;
    
    const frontage = agriculturalData.frontage || 0;
    const weatherRoad = agriculturalData.weather_road || 0;
    const market = agriculturalData.market || 0;
    
    return frontage + weatherRoad + market;
  };

  // FIXED: Enhanced data loading with better debug logging
  const loadData = async () => {
    setIsLoading(true);
    try {
      const form = await FormDataLocalStorage.getFormData(formId);
      
      if (form) {
        console.log('🔍 AGRICULTURAL DATA - Loaded form:', {
          id: form.id,
          declarant: form.declarant,
          hasDeclarant: !!form.declarant,
          declarantValue: form.declarant,
          district: form.district,
          kind: form.kind,
          classification: form.classification,
          area: form.area,
          // Check if declarantId exists (it shouldn't)
          hasDeclarantId: 'declarantId' in form,
          declarantIdValue: (form as any).declarantId
        });
        
        setFormData(form);
        
        if (form.uploaded) {
          setIsFormUploaded(true);
        } else {
          setIsFormUploaded(false);
        }
        
        const isLandKind = form.kind?.toString() === '1';
        const isAgricultural = form.classification?.toString() === 'A';
        
        setIsValidForm(isLandKind && isAgricultural);

        if (isLandKind && isAgricultural) {
          const valueInfos = await ValueInfoLocalStorage.getAllValueInfo();
          const valueInfo = valueInfos.find(info => info.formDataId === formId);
          
          if (valueInfo) {
            setValueInfoId(valueInfo.id);
            const agriData = await AgriculturalDataLocalStorage.getAgriculturalDataByValueInfoId(valueInfo.id);
            setAgriculturalData(agriData);
          } else {
            console.warn('No value info found for form:', formId);
          }
        }
      } else {
        console.warn('No form data found for ID:', formId);
        setIsValidForm(false);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setIsValidForm(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (formId) {
      loadData();
    }

    const handleFormDataUpdated = (event: CustomEvent) => {
      if (event.detail.formId === formId) {
        loadData();
      }
    };

    const handleFormUploaded = (event: CustomEvent) => {
      if (event.detail.formId === formId) {
        loadData();
      }
    };

    window.addEventListener('formDataUpdated', handleFormDataUpdated as EventListener);
    window.addEventListener('formUploaded', handleFormUploaded as EventListener);
    
    return () => {
      window.removeEventListener('formDataUpdated', handleFormDataUpdated as EventListener);
      window.removeEventListener('formUploaded', handleFormUploaded as EventListener);
    };
  }, [formId]);

  useEffect(() => {
    if (formData && valueInfoId) {
      loadSubclassRates();
    }
  }, [formData, valueInfoId]);

  useEffect(() => {
    if (formData) {
      loadFormContext();
    }
  }, [formData]);

  return {
    formData,
    agriculturalData,
    valueInfoId,
    isLoading,
    isValidForm,
    showUpdateModal,
    subclassRates,
    isLoadingRates,
    formContext,
    isFormUploaded,
    loadData,
    setShowUpdateModal,
    calculateTotalAdjustment
  };
};