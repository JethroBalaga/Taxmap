// src/components/Modals/FormView.tsx
import React from 'react';
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
  IonSearchbar
} from '@ionic/react';
import { closeOutline, searchOutline } from 'ionicons/icons';
import Area from '../FormComponents/Area';
import Next from '../GlobalComponent/Next';
import { DistrictData } from '../../utils/districtLocalStorage';
import { DeclarantData } from '../../utils/DeclarantLocalStorage';
import { KindData } from '../../utils/kindLocalStorage';
import { ClassificationData } from '../../utils/classificationLocalStorage';
import { SubclassData } from '../../utils/subclassLocalStorage';
import '../../CSS/modal.css';

interface FormViewProps {
  isOpen: boolean;
  onDismiss: () => void;
  district: number | null;
  setDistrict: (value: number | null) => void;
  declarantName: string;
  declarantId: number | null;
  showDeclarantSearch: () => void;
  kind: string;
  setKind: (value: string) => void;
  classification: string;
  setClassification: (value: string) => void;
  subclass: string;
  setSubclass: (value: string) => void;
  actualUse: string;
  setActualUse: (value: string) => void;
  area: number;
  setArea: (value: number) => void;
  onNextClick: () => void;
  isFormValid: boolean;
  districts: DistrictData[];
  kinds: KindData[];
  classifications: ClassificationData[];
  subclasses: SubclassData[];
  actualUses: Array<{value: string, label: string}>;
  isLoadingDistricts: boolean;
  isLoadingKinds: boolean;
  isLoadingClassifications: boolean;
  isLoadingSubclasses: boolean;
  isLoadingActualUses: boolean;
  showDeclarantSearchModal: boolean;
  setShowDeclarantSearchModal: (show: boolean) => void;
  searchText: string;
  setSearchText: (text: string) => void;
  filteredDeclarants: DeclarantData[];
  onSelectDeclarant: (id: number) => void;
  isLoadingDeclarants: boolean;
  isBuildingKind: boolean;
  isLandKind: boolean;
}

const FormView: React.FC<FormViewProps> = ({
  isOpen,
  onDismiss,
  district,
  setDistrict,
  declarantName,
  declarantId,
  showDeclarantSearch,
  kind,
  setKind,
  classification,
  setClassification,
  subclass,
  setSubclass,
  actualUse,
  setActualUse,
  area,
  setArea,
  onNextClick,
  isFormValid,
  districts,
  kinds,
  classifications,
  subclasses,
  actualUses,
  isLoadingDistricts,
  isLoadingKinds,
  isLoadingClassifications,
  isLoadingSubclasses,
  isLoadingActualUses,
  showDeclarantSearchModal,
  setShowDeclarantSearchModal,
  searchText,
  setSearchText,
  filteredDeclarants,
  onSelectDeclarant,
  isLoadingDeclarants,
  isBuildingKind,
  isLandKind
}) => {
  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onDismiss} className="custom-wide-modal">
        <IonHeader>
          <IonToolbar className="fancy-header">
            <IonTitle className="fancy-title">
              <i className="icon-form" style={{ marginRight: '10px' }}></i>
              GeoTag Form
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onDismiss} className="fancy-close-btn">
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
                      {district.district_id} - {district.district_name}
                    </IonSelectOption>
                  ))
                )}
              </IonSelect>
            </IonItem>

            {/* Declarant Dropdown with Search */}
            <IonItem 
              className="custom-input" 
              lines="none" 
              button 
              onClick={showDeclarantSearch}
            >
              <IonLabel position="stacked" className="input-label">
                Declarant <span style={{ color: 'red' }}>*</span>
              </IonLabel>
              <div className="declarant-item-content">
                <div className="declarant-value-container">
                  {declarantId ? (
                    <>
                      <span className="declarant-value">{declarantName}</span>
                      <IonIcon icon={searchOutline} className="declarant-search-icon" />
                    </>
                  ) : (
                    <>
                      <span className="declarant-value">Select Declarant</span>
                      <IonIcon icon={searchOutline} className="declarant-search-icon" />
                    </>
                  )}
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
                      {kindItem.kind_id} - {kindItem.description}
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
                      {classificationItem.class_id} - {classificationItem.classification}
                    </IonSelectOption>
                  ))
                )}
              </IonSelect>
            </IonItem>

            {/* Subclass Dropdown - Only shown for LAND kind */}
            {isLandKind && (
              <IonItem className="custom-input" lines="none">
                <IonLabel position="stacked" className="input-label">
                  Subclass
                </IonLabel>
                <IonSelect
                  value={subclass}
                  placeholder={
                    isLoadingSubclasses 
                      ? "Loading subclasses..." 
                      : "Select Subclass"
                  }
                  onIonChange={(e) => setSubclass(e.detail.value)}
                  interface="popover"
                  className="modal-input"
                  disabled={isLoadingSubclasses || !classification}
                >
                  {isLoadingSubclasses ? (
                    <IonSelectOption value="" disabled>
                      Loading subclasses...
                    </IonSelectOption>
                  ) : subclasses.length === 0 ? (
                    <IonSelectOption value="" disabled>
                      {classification ? "No subclasses available" : "Select classification first"}
                    </IonSelectOption>
                  ) : (
                    subclasses.map((subclassItem) => (
                      <IonSelectOption
                        key={subclassItem.subclass_id}
                        value={subclassItem.subclass_id}
                      >
                        {subclassItem.subclass_id} - {subclassItem.subclass}
                      </IonSelectOption>
                    ))
                  )}
                </IonSelect>
              </IonItem>
            )}

            {/* Actual Use Dropdown - Available for ALL kinds and classifications */}
            <IonItem className="custom-input" lines="none">
              <IonLabel position="stacked" className="input-label">
                Actual Use <span style={{ color: 'red' }}>*</span>
              </IonLabel>
              <IonSelect
                value={actualUse}
                placeholder={
                  isLoadingActualUses 
                    ? "Loading actual uses..." 
                    : "Select Actual Use"
                }
                onIonChange={(e) => setActualUse(e.detail.value)}
                interface="popover"
                className="modal-input"
                disabled={isLoadingActualUses}
              >
                {isLoadingActualUses ? (
                  <IonSelectOption value="" disabled>
                    Loading actual uses...
                  </IonSelectOption>
                ) : actualUses.length === 0 ? (
                  <IonSelectOption value="" disabled>
                    No actual uses available
                  </IonSelectOption>
                ) : (
                  actualUses.map((use) => (
                    <IonSelectOption
                      key={use.value}
                      value={use.value}
                    >
                      {use.label}
                    </IonSelectOption>
                  ))
                )}
              </IonSelect>
            </IonItem>

            <Area value={area} onChange={setArea} />
            
            <div className="next-btn-container">
              <Next onClick={onNextClick} disabled={!isFormValid} />
            </div>
          </div>
        </IonContent>
      </IonModal>

      {/* Declarant Search Modal */}
      <IonModal 
        isOpen={showDeclarantSearchModal} 
        onDidDismiss={() => setShowDeclarantSearchModal(false)}
        className="custom-wide-modal"
      >
        <IonHeader>
          <IonToolbar className="fancy-header">
            <IonTitle className="fancy-title">Select Declarant</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowDeclarantSearchModal(false)} className="fancy-close-btn">
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
                    onClick={() => onSelectDeclarant(declarant.declarant_id)}
                  >
                    <div className="declarant-item-content">
                      <h2 style={{ margin: '0 0 4px 0', color: '#2d3748', fontSize: '16px' }}>
                        {declarant.declarant_id} - {declarant.firstname} {declarant.lastname}
                      </h2>
                    </div>
                  </IonItem>
                ))}
              </div>
            )}
          </div> 
        </IonContent>
      </IonModal>
    </>
  );
};

export default FormView;