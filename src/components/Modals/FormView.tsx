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
  IonInput
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import Area from '../FormComponents/Area';
import Next from '../GlobalComponent/Next';
import { DistrictData } from '../../utils/districtLocalStorage';
import { KindData } from '../../utils/kindLocalStorage';
import { ClassificationData } from '../../utils/classificationLocalStorage';
import { SubclassData } from '../../utils/subclassLocalStorage';
import '../../CSS/modal.css';

interface FormViewProps {
  isOpen: boolean;
  onDismiss: () => void;
  district: number | null;
  setDistrict: (value: number | null) => void;
  declarant: string;
  setDeclarant: (value: string) => void;
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
  isBuildingKind: boolean;
  isLandKind: boolean;
  isMachineryKind: boolean;
}

const FormView: React.FC<FormViewProps> = ({
  isOpen,
  onDismiss,
  district,
  setDistrict,
  declarant,
  setDeclarant,
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
  isBuildingKind,
  isLandKind,
  isMachineryKind
}) => {
  return (
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

          <IonItem className="custom-input" lines="none">
            <IonLabel position="stacked" className="input-label">
              Declarant Name <span style={{ color: 'red' }}>*</span>
            </IonLabel>
            <IonInput
              value={declarant}
              placeholder="Enter declarant name"
              onIonInput={(e) => setDeclarant(e.detail.value || '')}
              className="modal-input"
            />
          </IonItem>

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

          {!isMachineryKind && (
            <Area value={area} onChange={setArea} />
          )}
          
          <div className="next-btn-container">
            <Next onClick={onNextClick} disabled={!isFormValid} />
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default FormView;