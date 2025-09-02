// src/components/Modals/Form.tsx
import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonSearchbar,
  IonList,
  IonText
} from '@ionic/react';
import { closeOutline, searchOutline } from 'ionicons/icons';
import Area from '../FormComponents/Area';
import Next from '../GlobalComponent/Next';
import BuildingModal from './BuildingModal';
import { DistrictData, getDistrictData } from '../../utils/districtLocalStorage';
import { DeclarantData, getDeclarantData } from '../../utils/DeclarantLocalStorage';
import { KindData, getKindData } from '../../utils/kindLocalStorage';
import { ClassificationData, getClassificationData } from '../../utils/classificationLocalStorage';

// Import your CSS file
import '../../CSS/modal.css';

interface FormProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
}

// Interface for the form data that will be passed to BuildingModal
export interface FormData {
  district: number | null;
  declarant: string;
  kind: string;
  classification: string;
  area: number;
}

const Form: React.FC<FormProps> = ({ isOpen, onDismiss, onSuccess }) => {
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

  // State for building modal
  const [showBuildingModal, setShowBuildingModal] = useState(false);

  // Load districts, declarants, kinds, and classifications from local storage
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

        if (districtData) {
          setDistricts(districtData);
        }

        if (declarantData) {
          setDeclarants(declarantData);
          setFilteredDeclarants(declarantData);
        }

        if (kindData) {
          setKinds(kindData);
        }

        if (classificationData) {
          setClassifications(classificationData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingDistricts(false);
        setIsLoadingDeclarants(false);
        setIsLoadingKinds(false);
        setIsLoadingClassifications(false);
      }
    };

    if (isOpen) {
      loadData();
    }
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

  // Check form validity whenever any field changes
  useEffect(() => {
    setIsFormValid(
      district !== null &&
      declarant.trim() !== '' &&
      kind.trim() !== '' &&
      classification.trim() !== '' &&
      area > 0
    );
  }, [district, declarant, kind, classification, area]);

  // Check if selected kind is "Building"
  const isBuildingKind = () => {
    if (!kind) return false;
    const selectedKind = kinds.find(k => k.kind_id.toString() === kind);
    return selectedKind?.description.toLowerCase().includes('building');
  };

  const handleNextClick = () => {
    if (!isFormValid) return;

    // If kind is building, show building modal
    if (isBuildingKind()) {
      setShowBuildingModal(true);
    } else {
      // For non-building kinds, proceed directly
      console.log('Form data:', { district, declarant, kind, classification, area });
      onSuccess();
    }
  };

  const handleBuildingModalSuccess = (buildingData: any) => {
    // Save building data and proceed
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

  const handleDismiss = () => {
    resetForm();
    onDismiss();
  };

  // Prepare form data to pass to BuildingModal
  const formData: FormData = {
    district,
    declarant,
    kind,
    classification,
    area
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={handleDismiss} className="custom-modal">
        <IonHeader>
          <IonToolbar className="fancy-header">
            <IonTitle className="fancy-title">
              <i className="icon-form" style={{ marginRight: '10px' }}></i>
              GeoTag Form
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleDismiss} className="fancy-close-btn">
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <div className="form-container">
            {/* District Dropdown */}
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                District <span style={{ color: 'red' }}>*</span>
              </IonLabel>
              <IonSelect
                value={district}
                placeholder="Select District"
                onIonChange={(e) => setDistrict(e.detail.value)}
                interface="popover"
                className="modal-input"
              >
                {isLoadingDistricts ? (
                  <IonSelectOption value={null} disabled>
                    Loading districts...
                  </IonSelectOption>
                ) : (
                  districts.map((district) => (
                    <IonSelectOption
                      key={district.district_id}
                      value={district.district_id}
                    >
                      {district.district_name}
                    </IonSelectOption>
                  ))
                )}
              </IonSelect>
            </IonItem>

            {/* Declarant Dropdown with Search - Updated */}
            <IonItem 
              className="custom-input" 
              lines="none" 
              button 
              onClick={() => setShowDeclarantSearch(true)}
            >
              <IonLabel position="stacked" className="input-label">
                Declarant <span style={{ color: 'red' }}>*</span>
              </IonLabel>
              <div className="declarant-item-content">
                <div className="declarant-value-container">
                  <span className="declarant-value">{getSelectedDeclarantName()}</span>
                  <IonIcon icon={searchOutline} className="declarant-search-icon" />
                </div>
              </div>
            </IonItem>

            {/* Kind Dropdown */}
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Kind <span style={{ color: 'red' }}>*</span>
              </IonLabel>
              <IonSelect
                value={kind}
                placeholder="Select Kind"
                onIonChange={(e) => setKind(e.detail.value)}
                interface="popover"
                className="modal-input"
              >
                {isLoadingKinds ? (
                  <IonSelectOption value="" disabled>
                    Loading kinds...
                  </IonSelectOption>
                ) : (
                  kinds.map((kindItem) => (
                    <IonSelectOption
                      key={kindItem.kind_id}
                      value={kindItem.kind_id.toString()}
                    >
                      {kindItem.description}
                    </IonSelectOption>
                  ))
                )}
              </IonSelect>
            </IonItem>

            {/* Classification Dropdown */}
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Classification <span style={{ color: 'red' }}>*</span>
              </IonLabel>
              <IonSelect
                value={classification}
                placeholder="Select Classification"
                onIonChange={(e) => setClassification(e.detail.value)}
                interface="popover"
                className="modal-input"
              >
                {isLoadingClassifications ? (
                  <IonSelectOption value="" disabled>
                    Loading classifications...
                  </IonSelectOption>
                ) : (
                  classifications.map((classificationItem) => (
                    <IonSelectOption
                      key={classificationItem.class_id}
                      value={classificationItem.class_id}
                    >
                      {classificationItem.classification}
                    </IonSelectOption>
                  ))
                )}
              </IonSelect>
            </IonItem>

            <Area value={area} onChange={setArea} />
            
            <div className="next-btn-container">
              <Next onClick={handleNextClick} disabled={!isFormValid} />
            </div>
          </div>
        </IonContent>
      </IonModal>

      {/* Declarant Search Modal - Updated */}
      <IonModal 
        isOpen={showDeclarantSearch} 
        onDidDismiss={() => setShowDeclarantSearch(false)}
        className="custom-modal"
      >
        <IonHeader>
          <IonToolbar className="fancy-header">
            <IonTitle className="fancy-title">Select Declarant</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowDeclarantSearch(false)} className="fancy-close-btn">
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="modal-content">
          <div className="form-container">
            <IonSearchbar
              value={searchText}
              onIonInput={(e) => setSearchText(e.detail.value || '')}
              placeholder="Search declarants..."
              animated
              className="modal-input"
            />

            {isLoadingDeclarants ? (
              <IonItem className="custom-input" lines="none">
                <IonLabel>Loading declarants...</IonLabel>
              </IonItem>
            ) : filteredDeclarants.length === 0 ? (
              <IonItem className="custom-input" lines="none">
                <IonLabel>
                  {searchText ? 'No matching declarants found' : 'No declarants available'}
                </IonLabel>
              </IonItem>
            ) : (
              <div className="search-results">
                {filteredDeclarants.map((declarant) => (
                  <IonItem
                    key={declarant.declarant_id}
                    className="custom-input search-result-item"
                    lines="none"
                    button
                    onClick={() => handleSelectDeclarant(declarant.declarant_id)}
                  >
                    <div className="declarant-item-content">
                      <h2 style={{ margin: '0 0 4px 0', color: '#2d3748', fontSize: '16px' }}>
                        {declarant.firstname} {declarant.lastname}
                      </h2>
                      <p style={{ margin: '0', color: '#718096', fontSize: '14px' }}>
                        ID: {declarant.declarant_id}
                      </p>
                    </div>
                  </IonItem>
                ))}
              </div>
            )}
          </div>
        </IonContent>
      </IonModal>

      {/* Building Modal */}
      <BuildingModal
        isOpen={showBuildingModal}
        onDismiss={handleBuildingModalDismiss}
        onSuccess={handleBuildingModalSuccess}
        formData={formData} // Pass form data to BuildingModal
      />
    </>
  );
};

export default Form;