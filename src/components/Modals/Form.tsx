// src/components/Modals/Form.tsx
import React, { useState, useEffect } from 'react';
import { DeclarantData, getDeclarantData } from '../../utils/DeclarantLocalStorage';
import { DistrictData, getDistrictData } from '../../utils/districtLocalStorage';
import { KindData, getKindData } from '../../utils/kindLocalStorage';
import { ClassificationData, getClassificationData } from '../../utils/classificationLocalStorage';
import FormView from './FormView';
import BuildingModal from './BuildingModal';

export interface FormData {
  district: number | null;
  declarant: string;
  kind: string;
  classification: string;
  area: number;
}

interface FormProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
}

const Form: React.FC<FormProps> = ({ isOpen, onDismiss, onSuccess }) => {
  // State declarations
  const [district, setDistrict] = useState<number | null>(null);
  const [declarant, setDeclarant] = useState('');
  const [kind, setKind] = useState('');
  const [classification, setClassification] = useState('');
  const [area, setArea] = useState<number>(0);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [declarants, setDeclarants] = useState<DeclarantData[]>([]);
  const [kinds, setKinds] = useState<KindData[]>([]);
  const [classifications, setClassifications] = useState<ClassificationData[]>([]);
  const [filteredDeclarants, setFilteredDeclarants] = useState<DeclarantData[]>([]);
  const [searchText, setSearchText] = useState('');
  const [showDeclarantSearch, setShowDeclarantSearch] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(true);
  const [isLoadingDeclarants, setIsLoadingDeclarants] = useState(true);
  const [isLoadingKinds, setIsLoadingKinds] = useState(true);
  const [isLoadingClassifications, setIsLoadingClassifications] = useState(true);
  const [showBuildingModal, setShowBuildingModal] = useState(false);

  // Data loading effect
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingDistricts(true);
        setIsLoadingDeclarants(true);
        setIsLoadingKinds(true);
        setIsLoadingClassifications(true);

        const [districtData, declarantData, kindData, classificationData] = await Promise.all([
          getDistrictData(),
          getDeclarantData(),
          getKindData(),
          getClassificationData()
        ]);

        if (districtData) setDistricts(districtData);
        if (declarantData) {
          setDeclarants(declarantData);
          setFilteredDeclarants(declarantData);
        }
        if (kindData) setKinds(kindData);
        if (classificationData) setClassifications(classificationData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingDistricts(false);
        setIsLoadingDeclarants(false);
        setIsLoadingKinds(false);
        setIsLoadingClassifications(false);
      }
    };

    if (isOpen) loadData();
  }, [isOpen]);

  // Filter declarants based on search text
  useEffect(() => {
    if (!searchText) {
      setFilteredDeclarants(declarants);
    } else {
      const filtered = declarants.filter(declarant => {
        const fullName = `${declarant.firstname} ${declarant.lastname}`.toLowerCase();
        return fullName.includes(searchText.toLowerCase());
      });
      setFilteredDeclarants(filtered);
    }
  }, [searchText, declarants]);

  // Check form validity
  useEffect(() => {
    setIsFormValid(
      district !== null &&
      declarant.trim() !== '' &&
      kind.trim() !== '' &&
      classification.trim() !== '' &&
      area > 0
    );
  }, [district, declarant, kind, classification, area]);

  // Helper functions
  const isBuildingKind = () => {
    if (!kind) return false;
    const selectedKind = kinds.find(k => k.kind_id.toString() === kind);
    return selectedKind?.description.toLowerCase().includes('building');
  };

  const getSelectedDeclarantName = () => {
    if (!declarant) return 'Select Declarant';
    const selected = declarants.find(d => d.declarant_id.toString() === declarant);
    return selected ? `${selected.firstname} ${selected.lastname}` : 'Select Declarant';
  };

  const resetForm = () => {
    setDistrict(null);
    setDeclarant('');
    setKind('');
    setClassification('');
    setArea(0);
    setSearchText('');
  };

  // Event handlers
  const handleNextClick = () => {
    if (!isFormValid) return;

    if (isBuildingKind()) {
      setShowBuildingModal(true);
    } else {
      console.log('Form data:', { district, declarant, kind, classification, area });
      onSuccess();
    }
  };

  const handleBuildingModalSuccess = (buildingData: any) => {
    console.log('Form data:', { district, declarant, kind, classification, area });
    console.log('Building data:', buildingData);
    setShowBuildingModal(false);
    onSuccess();
  };

  const handleBuildingModalDismiss = () => {
    setShowBuildingModal(false);
  };

  const handleSelectDeclarant = (declarantId: number) => {
    setDeclarant(declarantId.toString());
    setShowDeclarantSearch(false);
    setSearchText('');
  };

  const handleDismiss = () => {
    resetForm();
    onDismiss();
  };

  // Prepare form data
  const formData: FormData = {
    district,
    declarant,
    kind,
    classification,
    area
  };

  return (
    <>
      <FormView
        isOpen={isOpen}
        onDismiss={handleDismiss}
        district={district}
        setDistrict={setDistrict}
        declarantName={getSelectedDeclarantName()}
        showDeclarantSearch={() => setShowDeclarantSearch(true)}
        kind={kind}
        setKind={setKind}
        classification={classification}
        setClassification={setClassification}
        area={area}
        setArea={setArea}
        onNextClick={handleNextClick}
        isFormValid={isFormValid}
        districts={districts}
        kinds={kinds}
        classifications={classifications}
        isLoadingDistricts={isLoadingDistricts}
        isLoadingKinds={isLoadingKinds}
        isLoadingClassifications={isLoadingClassifications}
        showDeclarantSearchModal={showDeclarantSearch}
        setShowDeclarantSearchModal={setShowDeclarantSearch}
        searchText={searchText}
        setSearchText={setSearchText}
        filteredDeclarants={filteredDeclarants}
        onSelectDeclarant={handleSelectDeclarant}
        isLoadingDeclarants={isLoadingDeclarants}
      />

      <BuildingModal
        isOpen={showBuildingModal}
        onDismiss={handleBuildingModalDismiss}
        onSuccess={handleBuildingModalSuccess}
        formData={formData}
      />
    </>
  );
};

export default Form;