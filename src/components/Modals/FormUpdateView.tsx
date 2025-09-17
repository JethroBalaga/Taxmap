// src/components/Modals/FormUpdateView.tsx
import React, { useState } from 'react';
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
  IonCol,
  IonSearchbar
} from '@ionic/react';
import { closeOutline, searchOutline } from 'ionicons/icons';
import { DistrictData } from '../../utils/districtLocalStorage';
import { DeclarantData } from '../../utils/DeclarantLocalStorage';
import { KindData } from '../../utils/kindLocalStorage';
import { ClassificationData } from '../../utils/classificationLocalStorage';
import { SubclassData } from '../../utils/subclassLocalStorage';
import { ActualUsedData } from '../../utils/actualUsedLocalStorage';
import { FormData } from '../../utils/tablestorages/FormDataLocalStorage';
import SubmitButton from '../GlobalComponent/SubmitButton';
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
  isUpdating?: boolean;
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
  onAlertDismiss,
  isUpdating = false
}) => {
  const [showDeclarantSearchModal, setShowDeclarantSearchModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  if (!isOpen) return null;

  // Check if kind is BUILDING (ID 2)
  const isBuildingKind = formData?.kind === "2";

  // Filter declarants based on search text
  const filteredDeclarants = declarants.filter(declarant =>
    declarant.declarant_id.toString().includes(searchText) ||
    declarant.firstname.toLowerCase().includes(searchText.toLowerCase()) ||
    declarant.lastname.toLowerCase().includes(searchText.toLowerCase()) ||
    `${declarant.firstname} ${declarant.lastname}`.toLowerCase().includes(searchText.toLowerCase())
  );

  // Get declarant name for display
  const getDeclarantName = () => {
    if (!formData?.declarantId) return 'Select Declarant';
    const declarant = declarants.find(d => d.declarant_id === formData.declarantId);
    return declarant ? `${declarant.declarant_id} - ${declarant.firstname} ${declarant.lastname}` : 'Select Declarant';
  };

  const handleSelectDeclarant = (declarantId: number) => {
    onInputChange('declarantId', declarantId);
    setShowDeclarantSearchModal(false);
    setSearchText('');
  };

  const handleShowDeclarantSearch = () => {
    setShowDeclarantSearchModal(true);
    setSearchText('');
  };

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
                    <IonItem 
                      className="custom-input" 
                      lines="none" 
                      button 
                      onClick={handleShowDeclarantSearch}
                    >
                      <IonLabel position="stacked" className="input-label">
                        Declarant
                      </IonLabel>
                      <div className="declarant-item-content">
                        <div className="declarant-value-container">
                          <span className="declarant-value">{getDeclarantName()}</span>
                          <IonIcon icon={searchOutline} className="declarant-search-icon" />
                        </div>
                      </div>
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
                        interface="popover"
                        className="modal-input"
                        disabled={true} // Make kind unchangeable
                      >
                        {kinds.map((kindItem) => (
                          <IonSelectOption
                            key={kindItem.kind_id}
                            value={kindItem.kind_id.toString()}
                          >
                            {kindItem.kind_id} - {kindItem.description}
                          </IonSelectOption>
                        ))}
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

                {/* Hide subclass when kind is BUILDING but keep actual_used visible */}
                <IonRow>
                  {/* Subclass - only show if not BUILDING kind */}
                  {!isBuildingKind && (
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
                  )}
                  
                  {/* Actual Use - always show regardless of kind */}
                  <IonCol size="12" size-md={isBuildingKind ? "12" : "6"}>
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
                  <IonCol className="ion-text-center">
                    <SubmitButton 
                      label="Submit" 
                      onClick={onSubmit}
                      loading={isUpdating}
                      disabled={isLoading || isUpdating}
                      className="centered-submit-button"
                    />
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
                    onClick={() => handleSelectDeclarant(declarant.declarant_id)}
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