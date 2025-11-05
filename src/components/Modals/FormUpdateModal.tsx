// src/components/FormUpdateModal.tsx
import React, { useState, useEffect } from 'react';
import { FormDataLocalStorage, FormData } from '../../utils/tablestorages/FormDataLocalStorage';
import { getDistrictData } from '../../utils/districtLocalStorage';
import { getKindData } from '../../utils/kindLocalStorage';
import { getClassificationData } from '../../utils/classificationLocalStorage';
import { getSubclassesByClassId } from '../../utils/subclassLocalStorage';
import { getActualUsedByClassId } from '../../utils/actualUsedLocalStorage';
import FormUpdateView from './FormUpdateView';

interface FormUpdateModalProps {
  isOpen: boolean;
  formId: string | null;
  onDismiss: () => void;
  onUpdate: (updatedData: FormData) => void;
}

const FormUpdateModal: React.FC<FormUpdateModalProps> = ({
  isOpen,
  formId,
  onDismiss,
  onUpdate
}) => {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [districts, setDistricts] = useState<any[]>([]);
  const [kinds, setKinds] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<any[]>([]);
  const [subclasses, setSubclasses] = useState<any[]>([]);
  const [actualUses, setActualUses] = useState<any[]>([]);

  const [isLoadingDistricts, setIsLoadingDistricts] = useState(true);
  const [isLoadingKinds, setIsLoadingKinds] = useState(true);
  const [isLoadingClassifications, setIsLoadingClassifications] = useState(true);
  const [isLoadingSubclasses, setIsLoadingSubclasses] = useState(false);
  const [isLoadingActualUses, setIsLoadingActualUses] = useState(false);

  useEffect(() => {
    if (isOpen && formId) {
      loadFormData();
      loadAllData();
    } else {
      setFormData(null);
    }
  }, [isOpen, formId]);

  const loadFormData = async () => {
    setIsLoading(true);
    if (formId) {
      const data = await FormDataLocalStorage.getFormData(formId);
      if (data) {
        setFormData(data);
      }
    }
    setIsLoading(false);
  };

  const loadAllData = async () => {
    try {
      setIsLoadingDistricts(true);
      setIsLoadingKinds(true);
      setIsLoadingClassifications(true);

      const [districtData, kindData, classificationData] = await Promise.all([
        getDistrictData(),
        getKindData(),
        getClassificationData()
      ]);

      if (districtData) setDistricts(districtData);
      if (kindData) setKinds(kindData);
      if (classificationData) setClassifications(classificationData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoadingDistricts(false);
      setIsLoadingKinds(false);
      setIsLoadingClassifications(false);
    }
  };

  useEffect(() => {
    const fetchSubclasses = async () => {
      if (!formData?.classification) {
        setSubclasses([]);
        setIsLoadingSubclasses(false);
        return;
      }

      setIsLoadingSubclasses(true);
      try {
        const subclassData = await getSubclassesByClassId(formData.classification);
        setSubclasses(subclassData || []);
      } catch (error) {
        console.error('Error fetching subclasses:', error);
        setSubclasses([]);
      } finally {
        setIsLoadingSubclasses(false);
      }
    };

    if (formData?.classification) {
      fetchSubclasses();
    }
  }, [formData?.classification]);

  useEffect(() => {
    const fetchActualUses = async () => {
      if (!formData?.classification) {
        setActualUses([]);
        setIsLoadingActualUses(false);
        return;
      }

      setIsLoadingActualUses(true);
      try {
        const actualUsedData = await getActualUsedByClassId(formData.classification);
        setActualUses(actualUsedData || []);
      } catch (error) {
        console.error('Error fetching actual uses:', error);
        setActualUses([]);
      } finally {
        setIsLoadingActualUses(false);
      }
    };

    if (formData?.classification) {
      fetchActualUses();
    }
  }, [formData?.classification]);

  useEffect(() => {
    if (formData?.kind === "2") {
      handleInputChange('subclass', null);
    }
  }, [formData?.kind]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    if (field === 'kind') {
      return;
    }
    
    if (formData) {
      setFormData({
        ...formData,
        [field]: value
      });
    }
  };

  const handleSubmit = async () => {
    if (formData && formId) {
      setIsUpdating(true);
      try {
        const success = await FormDataLocalStorage.updateFormData(formId, formData);
        if (success) {
          setShowSuccessAlert(true);
          onUpdate(formData);
        } else {
          setShowErrorAlert(true);
        }
      } catch (error) {
        console.error('Error updating form:', error);
        setShowErrorAlert(true);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleAlertDismiss = () => {
    setShowSuccessAlert(false);
    setShowErrorAlert(false);
    if (showSuccessAlert) {
      onDismiss();
    }
  };

  const handleDismiss = () => {
    setFormData(null);
    onDismiss();
  };

  return (
    <FormUpdateView
      isOpen={isOpen}
      onDismiss={handleDismiss}
      formData={formData}
      isLoading={isLoading}
      showSuccessAlert={showSuccessAlert}
      showErrorAlert={showErrorAlert}
      districts={districts}
      kinds={kinds}
      classifications={classifications}
      subclasses={subclasses}
      actualUses={actualUses}
      isLoadingDistricts={isLoadingDistricts}
      isLoadingKinds={isLoadingKinds}
      isLoadingClassifications={isLoadingClassifications}
      isLoadingSubclasses={isLoadingSubclasses}
      isLoadingActualUses={isLoadingActualUses}
      onInputChange={handleInputChange}
      onSubmit={handleSubmit}
      onAlertDismiss={handleAlertDismiss}
      isUpdating={isUpdating}
    />
  );
};

export default FormUpdateModal;