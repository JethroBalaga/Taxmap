// src/components/Modals/Form.tsx
import React, { useState, useEffect } from 'react';
import { DeclarantData, getDeclarantData } from '../../utils/DeclarantLocalStorage';
import { DistrictData, getDistrictData } from '../../utils/districtLocalStorage';
import { KindData, getKindData } from '../../utils/kindLocalStorage';
import { ClassificationData, getClassificationData } from '../../utils/classificationLocalStorage';
import { SubclassData, getSubclassesByClassId } from '../../utils/subclassLocalStorage';
import FormView from './FormView';
import BuildingModal from './BuildingModal';

export interface FormData {
  district: number | null;
  declarantId: number | null;
  kind: string;
  classification: string;
  subclass: string;
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
  const [declarantId, setDeclarantId] = useState<number | null>(null);
  const [kind, setKind] = useState('');
  const [classification, setClassification] = useState('');
  const [subclass, setSubclass] = useState('');
  const [area, setArea] = useState<number>(0);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [declarants, setDeclarants] = useState<DeclarantData[]>([]);
  const [kinds, setKinds] = useState<KindData[]>([]);
  const [classifications, setClassifications] = useState<ClassificationData[]>([]);
  const [subclasses, setSubclasses] = useState<SubclassData[]>([]);
  const [filteredDeclarants, setFilteredDeclarants] = useState<DeclarantData[]>([]);
  const [searchText, setSearchText] = useState('');
  const [showDeclarantSearch, setShowDeclarantSearch] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(true);
  const [isLoadingDeclarants, setIsLoadingDeclarants] = useState(true);
  const [isLoadingKinds, setIsLoadingKinds] = useState(true);
  const [isLoadingClassifications, setIsLoadingClassifications] = useState(true);
  const [isLoadingSubclasses, setIsLoadingSubclasses] = useState(false);
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

  // Fetch subclasses when classification changes
  useEffect(() => {
    const fetchSubclasses = async () => {
      if (!classification) {
        setSubclasses([]);
        setSubclass('');
        setIsLoadingSubclasses(false);
        return;
      }

      setIsLoadingSubclasses(true);
      try {
        const subclassData = await getSubclassesByClassId(classification);
        setSubclasses(subclassData || []);
        console.log('Fetched subclasses for class:', classification, subclassData);
        
        // Reset subclass selection if the current selection is not available for the new classification
        if (subclass && !subclassData?.some(s => s.subclass_id === subclass)) {
          setSubclass('');
        }
      } catch (error) {
        console.error('Error fetching subclasses:', error);
        setSubclasses([]);
        setSubclass('');
      } finally {
        setIsLoadingSubclasses(false);
      }
    };

    fetchSubclasses();
  }, [classification, subclass]);

  // Filter declarants based on search text
  useEffect(() => {
    if (!searchText) {
      setFilteredDeclarants(declarants);
    } else {
      const filtered = declarants.filter(declarant => {
        const fullName = `${declarant.firstname} ${declarant.lastname}`.toLowerCase();
        const idString = declarant.declarant_id.toString();
        return (
          fullName.includes(searchText.toLowerCase()) ||
          idString.includes(searchText)
        );
      });
      setFilteredDeclarants(filtered);
    }
  }, [searchText, declarants]);

  // Check form validity
  useEffect(() => {
    setIsFormValid(
      district !== null &&
      declarantId !== null &&
      kind.trim() !== '' &&
      classification.trim() !== '' &&
      area > 0
    );
  }, [district, declarantId, kind, classification, area]);

  // Helper function to check if selected kind is building
  const isBuildingKind = (): boolean => {
    if (!kind || isLoadingKinds || kinds.length === 0) return false;
    
    const selectedKind = kinds.find(k => k.kind_id.toString() === kind);
    // Check if description contains "building" (case-insensitive)
    return selectedKind?.description?.toLowerCase().includes('building') || false;
  };

  const getSelectedDeclarantDisplay = () => {
    if (!declarantId) return 'Select Declarant';
    const selected = declarants.find(d => d.declarant_id === declarantId);
    return selected ? `${selected.declarant_id} - ${selected.firstname} ${selected.lastname}` : 'Select Declarant';
  };

  const resetForm = () => {
    setDistrict(null);
    setDeclarantId(null);
    setKind('');
    setClassification('');
    setSubclass('');
    setArea(0);
    setSearchText('');
  };

  // Event handlers
  const handleNextClick = () => {
    if (!isFormValid) return;

    if (isBuildingKind()) {
      setShowBuildingModal(true);
    } else {
      console.log('Form data:', { district, declarantId, kind, classification, subclass, area });
      onSuccess();
    }
  };

  const handleBuildingModalSuccess = (buildingData: any) => {
    console.log('Form data:', { district, declarantId, kind, classification, subclass, area });
    console.log('Building data:', buildingData);
    setShowBuildingModal(false);
    onSuccess();
  };

  const handleBuildingModalDismiss = () => {
    setShowBuildingModal(false);
  };

  const handleSelectDeclarant = (id: number) => {
    setDeclarantId(id);
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
    declarantId,
    kind,
    classification,
    subclass,
    area
  };

  return (
    <>
      <FormView
        isOpen={isOpen}
        onDismiss={handleDismiss}
        district={district}
        setDistrict={setDistrict}
        declarantName={getSelectedDeclarantDisplay()}
        declarantId={declarantId}
        showDeclarantSearch={() => setShowDeclarantSearch(true)}
        kind={kind}
        setKind={setKind}
        classification={classification}
        setClassification={setClassification}
        subclass={subclass}
        setSubclass={setSubclass}
        area={area}
        setArea={setArea}
        onNextClick={handleNextClick}
        isFormValid={isFormValid}
        districts={districts}
        kinds={kinds}
        classifications={classifications}
        subclasses={subclasses}
        isLoadingDistricts={isLoadingDistricts}
        isLoadingKinds={isLoadingKinds}
        isLoadingClassifications={isLoadingClassifications}
        isLoadingSubclasses={isLoadingSubclasses}
        isBuildingKind={isBuildingKind()} // Call the function to get the boolean value
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