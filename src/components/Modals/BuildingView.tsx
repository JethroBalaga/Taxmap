import React, { useState, useEffect } from 'react';
import { BuildingData } from './BuildingModal';
// Import from the same source as Form component
import { FormData } from '../../utils/tablestorages/FormDataLocalStorage';
import { StructureTypeData, getStructureTypeData } from '../../utils/structureTypeLocalStorage';
import { BuildingCodeData, getBuildingCodesByStructureCode } from '../../utils/buildingCodeLocalStorage';
import BuildingViewUI from './BuildingViewUI';

interface BuildingViewProps {
  onSuccess: (data: BuildingData) => void;
  onDismiss: () => void;
  formData: FormData;
  initialData?: BuildingData;
}

const BuildingView: React.FC<BuildingViewProps> = ({
  onSuccess,
  onDismiss,
  formData,
  initialData
}) => {
  const [buildingData, setBuildingData] = useState<BuildingData>({
    structureType: '',
    buildingCode: '',
    storey: null,
    floorOrder: null,
    buildingAge: null,
    buildingPermit: null,
    constructionPercent: null,
    dateConstructed: null,
    dateOccupied: null,
    dateCompleted: null,
    depreciationRate: null
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BuildingData, string>>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [structureTypes, setStructureTypes] = useState<StructureTypeData[]>([]);
  const [buildingCodes, setBuildingCodes] = useState<BuildingCodeData[]>([]);
  const [isLoadingStructureTypes, setIsLoadingStructureTypes] = useState(false);
  const [isLoadingBuildingCodes, setIsLoadingBuildingCodes] = useState(false);
  const [selectedBuildingCode, setSelectedBuildingCode] = useState<BuildingCodeData | null>(null);

  // Fetch all structure types
  useEffect(() => {
    const fetchStructureTypes = async () => {
      setIsLoadingStructureTypes(true);
      try {
        const structureTypesData = await getStructureTypeData();
        setStructureTypes(structureTypesData || []);
      } catch (error) {
        console.error('Error fetching structure types:', error);
        setStructureTypes([]);
      } finally {
        setIsLoadingStructureTypes(false);
      }
    };

    fetchStructureTypes();
  }, []);

  // Fetch building codes when structure type changes
  useEffect(() => {
    const fetchBuildingCodes = async () => {
      if (!buildingData.structureType) {
        setBuildingCodes([]);
        setSelectedBuildingCode(null);
        return;
      }

      setIsLoadingBuildingCodes(true);
      try {
        const buildingCodesData = await getBuildingCodesByStructureCode(buildingData.structureType);
        setBuildingCodes(buildingCodesData);

        if (buildingData.buildingCode) {
          const matchingCode = buildingCodesData.find(
            code => code.building_code === buildingData.buildingCode
          );
          if (matchingCode) {
            setSelectedBuildingCode(matchingCode);
          } else {
            setBuildingData(prev => ({ ...prev, buildingCode: '' }));
            setSelectedBuildingCode(null);
          }
        }
      } catch (error) {
        console.error('Error fetching building codes:', error);
        setBuildingCodes([]);
        setSelectedBuildingCode(null);
      } finally {
        setIsLoadingBuildingCodes(false);
      }
    };

    fetchBuildingCodes();
  }, [buildingData.structureType]);

  // Update selected building code when building code changes
  useEffect(() => {
    if (buildingData.buildingCode && buildingCodes.length > 0) {
      const code = buildingCodes.find(
        bc => bc.building_code === buildingData.buildingCode
      );
      setSelectedBuildingCode(code || null);
    } else {
      setSelectedBuildingCode(null);
    }
  }, [buildingData.buildingCode, buildingCodes]);

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setBuildingData(initialData);
    } else {
      setBuildingData({
        structureType: '',
        buildingCode: '',
        storey: null,
        floorOrder: null,
        buildingAge: null,
        buildingPermit: null,
        constructionPercent: null,
        dateConstructed: null,
        dateOccupied: null,
        dateCompleted: null,
        depreciationRate: null
      });
    }
    setErrors({});
    setSelectedBuildingCode(null);
  }, [initialData]);

  // Check form validity whenever building data changes
  useEffect(() => {
    const isValid =
      buildingData.structureType.trim() !== '' &&
      buildingData.buildingCode.trim() !== '' &&
      buildingData.storey !== null && buildingData.storey >= 1 &&
      buildingData.floorOrder !== null && buildingData.floorOrder >= 0 &&
      buildingData.constructionPercent !== null &&
      buildingData.constructionPercent >= 0 && buildingData.constructionPercent <= 100 &&
      buildingData.depreciationRate !== null &&
      buildingData.depreciationRate >= 0 && buildingData.depreciationRate <= 100;

    setIsFormValid(isValid);
  }, [buildingData]);

  // Handle input changes
  const handleInputChange = (field: keyof BuildingData, value: any) => {
    setBuildingData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BuildingData, string>> = {};

    if (!buildingData.structureType) newErrors.structureType = 'Structure type is required';
    if (!buildingData.buildingCode) newErrors.buildingCode = 'Building code is required';
    if (buildingData.storey === null || buildingData.storey < 1) newErrors.storey = 'Valid storey count is required';
    if (buildingData.floorOrder === null || buildingData.floorOrder < 0) newErrors.floorOrder = 'Valid floor order is required';
    if (buildingData.constructionPercent === null || buildingData.constructionPercent < 0 || buildingData.constructionPercent > 100) {
      newErrors.constructionPercent = 'Construction percentage must be between 0-100';
    }
    if (buildingData.depreciationRate === null || buildingData.depreciationRate < 0 || buildingData.depreciationRate > 100) {
      newErrors.depreciationRate = 'Depreciation rate must be between 0-100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission - send data directly to Form component
  const handleNextClick = () => {
    console.log('BuildingView: Next clicked, sending data to Form');
    if (validateForm()) {
      // Send the building data back to the Form component
      onSuccess(buildingData);
      // Close the building modal - Form will handle opening PhotoModal
      onDismiss();
    }
  };

  return (
    <>
      <BuildingViewUI
        formData={formData}
        buildingData={buildingData}
        errors={errors}
        isFormValid={isFormValid}
        structureTypes={structureTypes}
        buildingCodes={buildingCodes}
        isLoadingStructureTypes={isLoadingStructureTypes}
        isLoadingBuildingCodes={isLoadingBuildingCodes}
        selectedBuildingCode={selectedBuildingCode}
        onInputChange={handleInputChange}
        onNextClick={handleNextClick}
      />
    </>
  );
};

export default BuildingView;