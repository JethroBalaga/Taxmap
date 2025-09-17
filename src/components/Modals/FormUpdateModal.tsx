// src/components/FormUpdateModal.tsx
import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonAlert,
  IonSpinner
} from '@ionic/react';
import { FormDataLocalStorage, FormData } from '../../utils/tablestorages/FormDataLocalStorage';

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

  // Predefined options for form fields
  const kindOptions = ['1', '2', '3', '4'];
  const classificationOptions = ['Residential', 'Commercial', 'Industrial', 'Agricultural'];
  const subclassOptions = ['A', 'B', 'C', 'D'];
  const actualUseOptions = ['Living', 'Working', 'Storage', 'Mixed'];
  const districtOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  useEffect(() => {
    if (isOpen && formId) {
      loadFormData();
    }
  }, [isOpen, formId]);

  const loadFormData = () => {
    setIsLoading(true);
    if (formId) {
      const data = FormDataLocalStorage.getFormData(formId);
      if (data) {
        setFormData(data);
      }
    }
    setIsLoading(false);
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    if (formData) {
      setFormData({
        ...formData,
        [field]: value
      });
    }
  };

  const handleSubmit = () => {
    if (formData && formId) {
      const success = FormDataLocalStorage.updateFormData(formId, formData);
      if (success) {
        setShowSuccessAlert(true);
        onUpdate(formData);
      } else {
        setShowErrorAlert(true);
      }
    }
  };

  const handleDismiss = () => {
    setFormData(null);
    onDismiss();
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Update Form</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {isLoading ? (
            <div className="loading-container">
              <IonSpinner name="crescent" />
              <p>Loading form data...</p>
            </div>
          ) : formData ? (
            <IonGrid>
              <IonRow>
                <IonCol size="12">
                  <IonItem>
                    <IonLabel position="stacked">Form ID</IonLabel>
                    <IonInput value={formData.id} disabled />
                  </IonItem>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="12" size-md="6">
                  <IonItem>
                    <IonLabel position="stacked">District</IonLabel>
                    <IonSelect
                      value={formData.district}
                      placeholder="Select District"
                      onIonChange={e => handleInputChange('district', e.detail.value)}
                    >
                      {districtOptions.map(district => (
                        <IonSelectOption key={district} value={district}>
                          {district}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                </IonCol>

                <IonCol size="12" size-md="6">
                  <IonItem>
                    <IonLabel position="stacked">Declarant ID</IonLabel>
                    <IonInput
                      type="number"
                      value={formData.declarantId || ''}
                      onIonInput={e => handleInputChange('declarantId', e.detail.value)}
                    />
                  </IonItem>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="12" size-md="6">
                  <IonItem>
                    <IonLabel position="stacked">Kind</IonLabel>
                    <IonSelect
                      value={formData.kind}
                      placeholder="Select Kind"
                      onIonChange={e => handleInputChange('kind', e.detail.value)}
                    >
                      {kindOptions.map(kind => (
                        <IonSelectOption key={kind} value={kind}>
                          {kind}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                </IonCol>

                <IonCol size="12" size-md="6">
                  <IonItem>
                    <IonLabel position="stacked">Classification</IonLabel>
                    <IonSelect
                      value={formData.classification}
                      placeholder="Select Classification"
                      onIonChange={e => handleInputChange('classification', e.detail.value)}
                    >
                      {classificationOptions.map(classification => (
                        <IonSelectOption key={classification} value={classification}>
                          {classification}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="12" size-md="6">
                  <IonItem>
                    <IonLabel position="stacked">Subclass</IonLabel>
                    <IonSelect
                      value={formData.subclass}
                      placeholder="Select Subclass"
                      onIonChange={e => handleInputChange('subclass', e.detail.value)}
                    >
                      {subclassOptions.map(subclass => (
                        <IonSelectOption key={subclass} value={subclass}>
                          {subclass}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                </IonCol>

                <IonCol size="12" size-md="6">
                  <IonItem>
                    <IonLabel position="stacked">Actual Use</IonLabel>
                    <IonSelect
                      value={formData.actualUse}
                      placeholder="Select Actual Use"
                      onIonChange={e => handleInputChange('actualUse', e.detail.value)}
                    >
                      {actualUseOptions.map(use => (
                        <IonSelectOption key={use} value={use}>
                          {use}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="12">
                  <IonItem>
                    <IonLabel position="stacked">Area</IonLabel>
                    <IonInput
                      type="number"
                      value={formData.area}
                      onIonInput={e => handleInputChange('area', parseFloat(e.detail.value!))}
                    />
                  </IonItem>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol>
                  <IonButton expand="block" onClick={handleSubmit}>
                    Update Form
                  </IonButton>
                </IonCol>
                <IonCol>
                  <IonButton expand="block" color="medium" onClick={handleDismiss}>
                    Cancel
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          ) : (
            <div className="error-container">
              <p>Form data not found.</p>
              <IonButton onClick={handleDismiss}>Close</IonButton>
            </div>
          )}
        </IonContent>
      </IonModal>

      <IonAlert
        isOpen={showSuccessAlert}
        onDidDismiss={() => {
          setShowSuccessAlert(false);
          handleDismiss();
        }}
        header={'Success'}
        message={'Form updated successfully!'}
        buttons={['OK']}
      />

      <IonAlert
        isOpen={showErrorAlert}
        onDidDismiss={() => setShowErrorAlert(false)}
        header={'Error'}
        message={'Failed to update form. Please try again.'}
        buttons={['OK']}
      />
    </>
  );
};

export default FormUpdateModal;