import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DeclarantData, getDeclarantData } from '../../utils/DeclarantLocalStorage';
import { DistrictData, getDistrictData } from '../../utils/districtLocalStorage';
import { KindData, getKindData } from '../../utils/kindLocalStorage';
import { ClassificationData, getClassificationData } from '../../utils/classificationLocalStorage';
import { SubclassData, getSubclassesByClassId } from '../../utils/subclassLocalStorage';
import { ActualUsedData, getActualUsedByClassId } from '../../utils/actualUsedLocalStorage';
import FormView from './FormView';
import BuildingModal from './BuildingModal';
import MachineModal, { MachineData } from './MachineModal';
import PhotoModal from './PhotoModal';
import AgriculturalLandAdjustmentModal, { AgriculturalLandAdjustmentData } from './AgriculturalLandAdjustmentModal';

export interface FormData {
  district: number | null;
  declarantId: number | null;
  kind: string;
  classification: string;
  subclass: string;
  actualUse: string;
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
  const [actualUse, setActualUse] = useState('');
  const [area, setArea] = useState<number>(0);
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [declarants, setDeclarants] = useState<DeclarantData[]>([]);
  const [kinds, setKinds] = useState<KindData[]>([]);
  const [classifications, setClassifications] = useState<ClassificationData[]>([]);
  const [subclasses, setSubclasses] = useState<SubclassData[]>([]);
  const [actualUses, setActualUses] = useState<ActualUsedData[]>([]);
  const [filteredDeclarants, setFilteredDeclarants] = useState<DeclarantData[]>([]);
  const [searchText, setSearchText] = useState('');
  const [showDeclarantSearch, setShowDeclarantSearch] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(true);
  const [isLoadingDeclarants, setIsLoadingDeclarants] = useState(true);
  const [isLoadingKinds, setIsLoadingKinds] = useState(true);
  const [isLoadingClassifications, setIsLoadingClassifications] = useState(true);
  const [isLoadingSubclasses, setIsLoadingSubclasses] = useState(false);
  const [isLoadingActualUses, setIsLoadingActualUses] = useState(false);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showAgriculturalModal, setShowAgriculturalModal] = useState(false);
  const [buildingData, setBuildingData] = useState<any>(null);
  const [machineData, setMachineData] = useState<MachineData | null>(null);
  const [agriculturalData, setAgriculturalData] = useState<AgriculturalLandAdjustmentData | null>(null);

  // Memoized values to prevent unnecessary recalculations
  const isBuilding = useMemo((): boolean => {
    if (!kind || isLoadingKinds || kinds.length === 0) return false;
    const selectedKind = kinds.find(k => k.kind_id.toString() === kind);
    return selectedKind?.description?.toLowerCase().includes('building') || false;
  }, [kind, isLoadingKinds, kinds]);

  const isLandKind = useMemo((): boolean => {
    if (!kind || isLoadingKinds || kinds.length === 0) return false;
    const selectedKind = kinds.find(k => k.kind_id.toString() === kind);
    return selectedKind?.description?.toLowerCase().includes('land') || false;
  }, [kind, isLoadingKinds, kinds]);

  const isMachineryKind = useMemo((): boolean => {
    if (!kind || isLoadingKinds || kinds.length === 0) return false;
    const selectedKind = kinds.find(k => k.kind_id.toString() === kind);
    return selectedKind?.description?.toLowerCase().includes('machinery') || false;
  }, [kind, isLoadingKinds, kinds]);

  const isAgriculturalLand = useMemo((): boolean => {
    if (!kind || !classification || isLoadingKinds || isLoadingClassifications) return false;
    
    const selectedKind = kinds.find(k => k.kind_id.toString() === kind);
    const selectedClassification = classifications.find(c => c.class_id === classification);
    
    return (selectedKind?.description?.toLowerCase().includes('land') || false) && 
           (selectedClassification?.classification?.toLowerCase().includes('agricultural') || false);
  }, [kind, classification, isLoadingKinds, isLoadingClassifications, kinds, classifications]);

  const formattedActualUses = useMemo((): Array<{value: string, label: string}> => {
    return actualUses.map(actualUse => ({
      value: actualUse.actual_used_id,
      label: `${actualUse.actual_used_id} - ${actualUse.description}`
    }));
  }, [actualUses]);

  const selectedDeclarantDisplay = useMemo(() => {
    if (!declarantId) return 'Select Declarant';
    const selected = declarants.find(d => d.declarant_id === declarantId);
    return selected ? `${selected.declarant_id} - ${selected.firstname} ${selected.lastname}` : 'Select Declarant';
  }, [declarantId, declarants]);

  const formData: FormData = useMemo(() => ({
    district,
    declarantId,
    kind,
    classification,
    subclass,
    actualUse,
    area
  }), [district, declarantId, kind, classification, subclass, actualUse, area]);

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

  // Fetch actual uses when classification changes - FOR ALL KINDS
  useEffect(() => {
    const fetchActualUses = async () => {
      if (!classification) {
        setActualUses([]);
        setActualUse('');
        setIsLoadingActualUses(false);
        return;
      }

      setIsLoadingActualUses(true);
      try {
        const actualUsedData = await getActualUsedByClassId(classification);
        setActualUses(actualUsedData || []);
        
        if (actualUse && !actualUsedData?.some(a => a.actual_used_id === actualUse)) {
          setActualUse('');
        }
      } catch (error) {
        console.error('Error fetching actual uses:', error);
        setActualUses([]);
        setActualUse('');
      } finally {
        setIsLoadingActualUses(false);
      }
    };

    fetchActualUses();
  }, [classification, actualUse]);

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

  // Check form validity - Area is NOT required for Machinery kind
  useEffect(() => {
    const baseValid = district !== null &&
      declarantId !== null &&
      kind.trim() !== '' &&
      classification.trim() !== '' &&
      actualUse.trim() !== '';

    // Area is required for all kinds EXCEPT machinery
    const isValid = isMachineryKind ? baseValid : baseValid && area > 0;
    
    setIsFormValid(isValid);
  }, [district, declarantId, kind, classification, area, actualUse, isMachineryKind]);

  // Memoized callbacks to prevent unnecessary re-renders
  const resetForm = useCallback(() => {
    setDistrict(null);
    setDeclarantId(null);
    setKind('');
    setClassification('');
    setSubclass('');
    setActualUse('');
    setArea(0);
    setSearchText('');
    setBuildingData(null);
    setMachineData(null);
    setAgriculturalData(null);
  }, []);

  const handleNextClick = useCallback(() => {
    if (!isFormValid) return;

    if (isBuilding) {
      setShowBuildingModal(true);
    } else if (isMachineryKind) {
      setShowMachineModal(true);
    } else if (isAgriculturalLand) {
      setShowAgriculturalModal(true);
    } else {
      // For non-agricultural land and other kinds, directly open photo modal
      console.log('Opening PhotoModal for non-agricultural land/other kind');
      setShowPhotoModal(true);
    }
  }, [isFormValid, isBuilding, isMachineryKind, isAgriculturalLand]);

  const handleBuildingModalSuccess = useCallback((buildingData: any) => {
    setBuildingData(buildingData);
    setShowBuildingModal(false);
    setShowPhotoModal(true);
  }, []);

  const handleBuildingModalDismiss = useCallback(() => {
    setShowBuildingModal(false);
  }, []);

  const handleMachineModalSuccess = useCallback((machineData: MachineData) => {
    setMachineData(machineData);
    setShowMachineModal(false);
    setShowPhotoModal(true);
  }, []);

  const handleMachineModalClose = useCallback(() => {
    setShowMachineModal(false);
  }, []);

  const handleAgriculturalModalSuccess = useCallback((adjustmentData: AgriculturalLandAdjustmentData) => {
    setAgriculturalData(adjustmentData);
    setShowAgriculturalModal(false);
    setShowPhotoModal(true);
  }, []);

  const handleAgriculturalModalDismiss = useCallback(() => {
    setShowAgriculturalModal(false);
  }, []);

  const handlePhotoModalClose = useCallback(() => {
    setShowPhotoModal(false);
    resetForm();
    onSuccess();
  }, [resetForm, onSuccess]);

  const handlePhotoModalSuccess = useCallback(() => {
    console.log('Final submission complete with data:', {
      formData,
      buildingData,
      machineData,
      agriculturalData
    });
    setShowPhotoModal(false);
    resetForm();
    onSuccess();
  }, [formData, buildingData, machineData, agriculturalData, resetForm, onSuccess]);

  const handleSelectDeclarant = useCallback((id: number) => {
    setDeclarantId(id);
    setShowDeclarantSearch(false);
    setSearchText('');
  }, []);

  const handleDismiss = useCallback(() => {
    resetForm();
    onDismiss();
  }, [resetForm, onDismiss]);

  const showDeclarantSearchHandler = useCallback(() => {
    setShowDeclarantSearch(true);
  }, []);

  return (
    <>
      <FormView
        isOpen={isOpen}
        onDismiss={handleDismiss}
        district={district}
        setDistrict={setDistrict}
        declarantName={selectedDeclarantDisplay}
        declarantId={declarantId}
        showDeclarantSearch={showDeclarantSearchHandler}
        kind={kind}
        setKind={setKind}
        classification={classification}
        setClassification={setClassification}
        subclass={subclass}
        setSubclass={setSubclass}
        actualUse={actualUse}
        setActualUse={setActualUse}
        area={area}
        setArea={setArea}
        onNextClick={handleNextClick}
        isFormValid={isFormValid}
        districts={districts}
        kinds={kinds}
        classifications={classifications}
        subclasses={subclasses}
        actualUses={formattedActualUses}
        isLoadingDistricts={isLoadingDistricts}
        isLoadingKinds={isLoadingKinds}
        isLoadingClassifications={isLoadingClassifications}
        isLoadingSubclasses={isLoadingSubclasses}
        isLoadingActualUses={isLoadingActualUses}
        isBuildingKind={isBuilding}
        isLandKind={isLandKind}
        isMachineryKind={isMachineryKind}
        showDeclarantSearchModal={showDeclarantSearch}
        setShowDeclarantSearchModal={setShowDeclarantSearch}
        searchText={searchText}
        setSearchText={setSearchText}
        filteredDeclarants={filteredDeclarants}
        onSelectDeclarant={handleSelectDeclarant}
        isLoadingDeclarants={isLoadingDeclarants}
      />

      {showBuildingModal && (
        <BuildingModal
          isOpen={showBuildingModal}
          onDismiss={handleBuildingModalDismiss}
          onSuccess={handleBuildingModalSuccess}
          formData={formData}
        />
      )}

      <MachineModal
        isOpen={showMachineModal}
        onClose={handleMachineModalClose}
        onSuccess={handleMachineModalSuccess}
      />

      <AgriculturalLandAdjustmentModal
        isOpen={showAgriculturalModal}
        onDismiss={handleAgriculturalModalDismiss}
        onSuccess={handleAgriculturalModalSuccess}
        formData={formData}
      />

      <PhotoModal
        isOpen={showPhotoModal}
        onClose={handlePhotoModalClose}
        onPhotoTaken={() => {}}
        formData={formData}
        buildingData={buildingData}
        machineData={machineData}
        agriculturalData={agriculturalData}
        onCompleteSubmission={handlePhotoModalSuccess}
      />
    </>
  );
};

export default React.memo(Form);