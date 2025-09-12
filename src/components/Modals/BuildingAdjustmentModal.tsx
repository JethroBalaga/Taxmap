import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonAlert
} from '@ionic/react';
import { BuildingAdjustmentLocalStorage, BuildingAdjustmentData } from '../../utils/tablestorages/BuildingAdjustmentLocalStorage';

interface BuildingAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  valueInfoId: string;
  existingData?: BuildingAdjustmentData | null;
  onSaveSuccess?: () => void;
}

const BuildingAdjustmentModal: React.FC<BuildingAdjustmentModalProps> = ({
  isOpen,
  onClose,
  valueInfoId,
  existingData,
  onSaveSuccess
}) => {
  const [formData, setFormData] = useState({
    Maincomponent: '',
    buidlingsubcomponent: '',
    description: '',
    completion_percent: '',
    depraciation: ''
  });

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    if (existingData) {
      setFormData({
        Maincomponent: existingData.Maincomponent || '',
        buidlingsubcomponent: existingData.buidlingsubcomponent || '',
        description: existingData.description || '',
        completion_percent: existingData.completion_percent || '',
        depraciation: existingData.depraciation || ''
      });
    } else {
      setFormData({
        Maincomponent: '',
        buidlingsubcomponent: '',
        description: '',
        completion_percent: '',
        depraciation: ''
      });
    }
  }, [existingData, isOpen]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.Maincomponent.trim()) {
      setAlertMessage('Main component is required');
      setShowAlert(true);
      return false;
    }

    if (!formData.buidlingsubcomponent.trim()) {
      setAlertMessage('Building subcomponent is required');
      setShowAlert(true);
      return false;
    }

    if (formData.completion_percent && isNaN(parseFloat(formData.completion_percent))) {
      setAlertMessage('Completion percent must be a valid number');
      setShowAlert(true);
      return false;
    }

    if (formData.depraciation && isNaN(parseFloat(formData.depraciation))) {
      setAlertMessage('Depreciation must be a valid number');
      setShowAlert(true);
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    try {
      const adjustmentData: BuildingAdjustmentData = {
        bldg_adjustment_id: existingData?.bldg_adjustment_id || `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        Maincomponent: formData.Maincomponent,
        buidlingsubcomponent: formData.buidlingsubcomponent,
        description: formData.description,
        completion_percent: formData.completion_percent,
        depraciation: formData.depraciation,
        value_info_id: valueInfoId
      };

      BuildingAdjustmentLocalStorage.saveBuildingAdjustmentData(adjustmentData);

      setAlertMessage(existingData ? 'Building adjustment updated successfully!' : 'Building adjustment added successfully!');
      setShowAlert(true);

      if (onSaveSuccess) {
        onSaveSuccess();
      }

      // Close modal after successful save
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving building adjustment:', error);
      setAlertMessage('Error saving building adjustment. Please try again.');
      setShowAlert(true);
    }
  };

  const handleClose = () => {
    setFormData({
      Maincomponent: '',
      buidlingsubcomponent: '',
      description: '',
      completion_percent: '',
      depraciation: ''
    });
    onClose();
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>
              {existingData ? 'Edit Building Adjustment' : 'Add Building Adjustment'}
            </IonTitle>
            <IonButton slot="end" fill="clear" onClick={handleClose}>
              Close
            </IonButton>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonGrid>
            <IonRow>
              <IonCol size="12">
                <IonItem>
                  <IonLabel position="stacked">Main Component *</IonLabel>
                  <IonInput
                    value={formData.Maincomponent}
                    placeholder="Enter main component"
                    onIonInput={(e) => handleInputChange('Maincomponent', e.detail.value!)}
                  />
                </IonItem>
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol size="12">
                <IonItem>
                  <IonLabel position="stacked">Building Subcomponent *</IonLabel>
                  <IonInput
                    value={formData.buidlingsubcomponent}
                    placeholder="Enter building subcomponent"
                    onIonInput={(e) => handleInputChange('buidlingsubcomponent', e.detail.value!)}
                  />
                </IonItem>
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol size="12">
                <IonItem>
                  <IonLabel position="stacked">Description</IonLabel>
                  <IonTextarea
                    value={formData.description}
                    placeholder="Enter description"
                    rows={3}
                    onIonInput={(e) => handleInputChange('description', e.detail.value!)}
                  />
                </IonItem>
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol size="6">
                <IonItem>
                  <IonLabel position="stacked">Completion Percent (%)</IonLabel>
                  <IonInput
                    type="number"
                    value={formData.completion_percent}
                    placeholder="0-100"
                    onIonInput={(e) => handleInputChange('completion_percent', e.detail.value!)}
                  />
                </IonItem>
              </IonCol>

              <IonCol size="6">
                <IonItem>
                  <IonLabel position="stacked">Depreciation (%)</IonLabel>
                  <IonInput
                    type="number"
                    value={formData.depraciation}
                    placeholder="Enter depreciation"
                    onIonInput={(e) => handleInputChange('depraciation', e.detail.value!)}
                  />
                </IonItem>
              </IonCol>
            </IonRow>

            <IonRow>
              <IonCol size="12">
                <div style={{ padding: '16px', textAlign: 'center' }}>
                  <IonButton onClick={handleSave} style={{ marginRight: '8px' }}>
                    {existingData ? 'Update' : 'Save'} Adjustment
                  </IonButton>
                  <IonButton onClick={handleClose} fill="outline">
                    Cancel
                  </IonButton>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
      </IonModal>

      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header={alertMessage.includes('Error') ? 'Error' : 'Success'}
        message={alertMessage}
        buttons={['OK']}
      />
    </>
  );
};

export default BuildingAdjustmentModal;