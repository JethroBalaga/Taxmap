// src/components/Modals/FormUpdateView.tsx
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
  IonInput,
  IonAlert,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { DistrictData } from '../../utils/districtLocalStorage';
import { DeclarantData } from '../../utils/DeclarantLocalStorage';
import { KindData } from '../../utils/kindLocalStorage';
import { ClassificationData } from '../../utils/classificationLocalStorage';
import { SubclassData } from '../../utils/subclassLocalStorage';
import { ActualUsedData } from '../../utils/actualUsedLocalStorage';
import { FormData } from '../../utils/tablestorages/FormDataLocalStorage';
import '../../CSS/modal.css';

interface FormUpdateViewProps {
  isOpen: boolean;
  onDismiss: () => void;
  formData: FormData | null;
  isLoading: boolean;
  showSuccessAlert: boolean;
  showErrorAlert: boolean;
  districts: DistrictData[];
  declarants: DeclarantData[];
  kinds: KindData[];
  classifications: ClassificationData[];
  subclasses: SubclassData[];
  actualUses: ActualUsedData[];
  isLoadingDistricts: boolean;
  isLoadingDeclarants: boolean;
  isLoadingKinds: boolean;
  isLoadingClassifications: boolean;
  isLoadingSubclasses: boolean;
  isLoadingActualUses: boolean;
  onInputChange: (field: keyof FormData, value: any) => void;
  onSubmit: () => void;
  onAlertDismiss: () => void;
}

const FormUpdateView: React.FC<FormUpdateViewProps> = ({
  isOpen,
  onDismiss,
  formData,
  isLoading,
  showSuccessAlert,
  showErrorAlert,
  districts,
  declarants,
  kinds,
  classifications,
  subclasses,
  actualUses,
  isLoadingDistricts,
  isLoadingDeclarants,
  isLoadingKinds,
  isLoadingClassifications,
  isLoadingSubclasses,
  isLoadingActualUses,
  onInputChange,
  onSubmit,
  onAlertDismiss
}) => {
  if (!isOpen) return null;

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onDismiss} className="custom-wide-modal">
        <IonHeader>
          <IonToolbar className="fancy-header">
            <IonTitle className="fancy-title">
              <i className="icon-form" style={{ marginRight: '10px' }}></i>
              Update Form
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onDismiss} className="fancy-close-btn">
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          {isLoading ? (
            <div className="loading-container">
              <IonSpinner name="crescent" />
              <p>Loading form data...</p>
            </div>
          ) : formData ? (
            <div className="form-container">
              <IonGrid>
                <IonRow>
                  <IonCol size="12">
                    <IonItem className="custom-input" lines="none">
                      <IonLabel position="stacked" className="input-label">
                        Form ID
                      </IonLabel>
                      <IonInput value={formData.id} disabled />
                    </IonItem>
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12" size-md="6">
                    <IonItem className="custom-input" lines="none">
                      <IonLabel position="stacked" className="input-label">
                        District
                      </IonLabel>
                      <IonSelect
                        value={formData.district}
                        placeholder="Select District"
                        onIonChange={e => onInputChange('district', e.detail.value)}
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
                  </IonCol>

                  <IonCol size="12" size-md="6">
                    <IonItem className="custom-input" lines="none">
                      <IonLabel position="stacked" className="input-label">
                        Declarant ID
                      </IonLabel>
                      <IonInput
                        type="number"
                        value={formData.declarantId || ''}
                        onIonInput={e => onInputChange('declarantId', parseInt(e.detail.value!))}
                        className="modal-input"
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12" size-md="6">
                    <IonItem className="custom-input" lines="none">
                      <IonLabel position="stacked" className="input-label">
                        Kind
                      </IonLabel>
                      <IonSelect
                        value={formData.kind}
                        placeholder="Select Kind"
                        onIonChange={e => onInputChange('kind', e.detail.value)}
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
                  </IonCol>

                  <IonCol size="12" size-md="6">
                    <IonItem className="custom-input" lines="none">
                      <IonLabel position="stacked" className="input-label">
                        Classification
                      </IonLabel>
                      <IonSelect
                        value={formData.classification}
                        placeholder="Select Classification"
                        onIonChange={e => onInputChange('classification', e.detail.value)}
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
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12" size-md="6">
                    <IonItem className="custom-input" lines="none">
                      <IonLabel position="stacked" className="input-label">
                        Subclass
                      </IonLabel>
                      <IonSelect
                        value={formData.subclass}
                        placeholder="Select Subclass"
                        onIonChange={e => onInputChange('subclass', e.detail.value)}
                        interface="popover"
                        className="modal-input"
                        disabled={isLoadingSubclasses}
                      >
                        {isLoadingSubclasses ? (
                          <IonSelectOption value="" disabled>
                            Loading subclasses...
                          </IonSelectOption>
                        ) : subclasses.length === 0 ? (
                          <IonSelectOption value="" disabled>
                            No subclasses available
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
                  </IonCol>

                  <IonCol size="12" size-md="6">
                    <IonItem className="custom-input" lines="none">
                      <IonLabel position="stacked" className="input-label">
                        Actual Use
                      </IonLabel>
                      <IonSelect
                        value={formData.actualUse}
                        placeholder="Select Actual Use"
                        onIonChange={e => onInputChange('actualUse', e.detail.value)}
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
                          actualUses.map((useItem) => (
                            <IonSelectOption
                              key={useItem.actual_used_id}
                              value={useItem.actual_used_id}
                            >
                              {useItem.actual_used_id} - {useItem.description}
                            </IonSelectOption>
                          ))
                        )}
                      </IonSelect>
                    </IonItem>
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12">
                    <IonItem className="custom-input" lines="none">
                      <IonLabel position="stacked" className="input-label">
                        Area
                      </IonLabel>
                      <IonInput
                        type="number"
                        value={formData.area}
                        onIonInput={e => onInputChange('area', parseFloat(e.detail.value!))}
                        className="modal-input"
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol>
                    <IonButton expand="block" onClick={onSubmit} className="submit-button">
                      Update Form
                    </IonButton>
                  </IonCol>
                  <IonCol>
                    <IonButton expand="block" color="medium" onClick={onDismiss}>
                      Cancel
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </div>
          ) : (
            <div className="error-container">
              <p>Form data not found.</p>
              <IonButton onClick={onDismiss}>Close</IonButton>
            </div>
          )}
        </IonContent>
      </IonModal>

      <IonAlert
        isOpen={showSuccessAlert}
        onDidDismiss={onAlertDismiss}
        header={'Success'}
        message={'Form updated successfully!'}
        buttons={['OK']}
      />

      <IonAlert
        isOpen={showErrorAlert}
        onDidDismiss={onAlertDismiss}
        header={'Error'}
        message={'Failed to update form. Please try again.'}
        buttons={['OK']}
      />
    </>
  );
};

export default FormUpdateView;