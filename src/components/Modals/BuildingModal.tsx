import React, { useState } from 'react';
import {
  IonApp,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonModal,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButtons
} from '@ionic/react';
import { closeCircleOutline, saveOutline, addCircleOutline } from 'ionicons/icons';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

// Interface for our building data
interface BuildingData {
  buildingCode: string;
  storey: number | null;
  floorOrder: number | null;
  buildingAge: string;
  buildingPermit: string;
  constructionPercent: number | null;
  dateConstructed: string;
  dateOccupied: string;
  dateCompleted: string;
  depreciationRate: number | null;
}

const BuildingModal: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<BuildingData>({
    buildingCode: '',
    storey: null,
    floorOrder: null,
    buildingAge: '',
    buildingPermit: '',
    constructionPercent: null,
    dateConstructed: '',
    dateOccupied: '',
    dateCompleted: '',
    depreciationRate: null
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BuildingData, string>>>({});
  const [buildingCodes] = useState<string[]>([]); // Empty for now as requested

  // Handle input changes
  const handleInputChange = (field: keyof BuildingData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BuildingData, string>> = {};
    
    if (!formData.buildingCode) newErrors.buildingCode = 'Building code is required';
    if (formData.storey === null || formData.storey < 1) newErrors.storey = 'Valid storey count is required';
    if (formData.floorOrder === null || formData.floorOrder < 0) newErrors.floorOrder = 'Valid floor order is required';
    if (formData.constructionPercent === null || formData.constructionPercent < 0 || formData.constructionPercent > 100) {
      newErrors.constructionPercent = 'Construction percentage must be between 0-100';
    }
    if (formData.depreciationRate === null || formData.depreciationRate < 0 || formData.depreciationRate > 100) {
      newErrors.depreciationRate = 'Depreciation rate must be between 0-100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      console.log('Form data submitted:', formData);
      // Here you would typically send the data to an API
      setShowModal(false);
      
      // Reset form
      setFormData({
        buildingCode: '',
        storey: null,
        floorOrder: null,
        buildingAge: '',
        buildingPermit: '',
        constructionPercent: null,
        dateConstructed: '',
        dateOccupied: '',
        dateCompleted: '',
        depreciationRate: null
      });
    }
  };

  // Handle modal dismissal
  const handleDismiss = () => {
    setShowModal(false);
    setErrors({});
  };

  return (
    <IonApp>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Building Management</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <IonIcon icon={addCircleOutline} size="large" color="primary" />
          <h2>Building Description Modal</h2>
          <p>Click the button below to open the building description form</p>
          <IonButton expand="block" onClick={() => setShowModal(true)} style={{ marginTop: '20px', maxWidth: '300px', marginLeft: 'auto', marginRight: 'auto' }}>
            Add Building Description
          </IonButton>
        </div>

        <IonModal isOpen={showModal} onDidDismiss={handleDismiss}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>Building Description</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={handleDismiss}>
                  <IonIcon icon={closeCircleOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          
          <IonContent className="ion-padding">
            <IonGrid>
              <IonRow>
                <IonCol size="12" size-md="6">
                  <IonItem>
                    <IonLabel position="stacked">Building Code *</IonLabel>
                    <IonSelect 
                      value={formData.buildingCode} 
                      placeholder="Select Building Code"
                      onIonChange={e => handleInputChange('buildingCode', e.detail.value)}
                      interface="popover"
                      className={errors.buildingCode ? 'ion-invalid' : ''}
                    >
                      {buildingCodes.map(code => (
                        <IonSelectOption key={code} value={code}>{code}</IonSelectOption>
                      ))}
                    </IonSelect>
                    {errors.buildingCode && <IonText color="danger" className="ion-padding-start">{errors.buildingCode}</IonText>}
                  </IonItem>
                </IonCol>
                
                <IonCol size="12" size-md="6">
                  <IonItem>
                    <IonLabel position="stacked">Storey *</IonLabel>
                    <IonInput
                      type="number"
                      value={formData.storey}
                      placeholder="Enter number of storeys"
                      onIonInput={e => handleInputChange('storey', parseInt(e.detail.value!, 10) || null)}
                      className={errors.storey ? 'ion-invalid' : ''}
                    />
                    {errors.storey && <IonText color="danger" className="ion-padding-start">{errors.storey}</IonText>}
                  </IonItem>
                </IonCol>
                
                <IonCol size="12" size-md="6">
                  <IonItem>
                    <IonLabel position="stacked">Floor Order *</IonLabel>
                    <IonInput
                      type="number"
                      value={formData.floorOrder}
                      placeholder="Enter floor order"
                      onIonInput={e => handleInputChange('floorOrder', parseInt(e.detail.value!, 10) || null)}
                      className={errors.floorOrder ? 'ion-invalid' : ''}
                    />
                    {errors.floorOrder && <IonText color="danger" className="ion-padding-start">{errors.floorOrder}</IonText>}
                  </IonItem>
                </IonCol>
                
                <IonCol size="12" size-md="6">
                  <IonItem>
                    <IonLabel position="stacked">Building Age</IonLabel>
                    <IonInput
                      type="text"
                      value={formData.buildingAge}
                      placeholder="Enter building age"
                      onIonInput={e => handleInputChange('buildingAge', e.detail.value!)}
                    />
                  </IonItem>
                </IonCol>
                
                <IonCol size="12" size-md="6">
                  <IonItem>
                    <IonLabel position="stacked">Building Permit</IonLabel>
                    <IonInput
                      type="text"
                      value={formData.buildingPermit}
                      placeholder="Enter building permit"
                      onIonInput={e => handleInputChange('buildingPermit', e.detail.value!)}
                    />
                  </IonItem>
                </IonCol>
                
                <IonCol size="12" size-md="6">
                  <IonItem>
                    <IonLabel position="stacked">Construction % *</IonLabel>
                    <IonInput
                      type="number"
                      value={formData.constructionPercent}
                      placeholder="Enter percentage (0-100)"
                      onIonInput={e => handleInputChange('constructionPercent', parseInt(e.detail.value!, 10) || null)}
                      className={errors.constructionPercent ? 'ion-invalid' : ''}
                    />
                    {errors.constructionPercent && <IonText color="danger" className="ion-padding-start">{errors.constructionPercent}</IonText>}
                  </IonItem>
                </IonCol>
                
                <IonCol size="12" size-md="6">
                  <IonItem>
                    <IonLabel position="stacked">Date Constructed</IonLabel>
                    <IonDatetime
                      value={formData.dateConstructed}
                      onIonChange={e => handleInputChange('dateConstructed', e.detail.value!)}
                      presentation="date"
                    />
                  </IonItem>
                </IonCol>
                
                <IonCol size="12" size-md="6">
                  <IonItem>
                    <IonLabel position="stacked">Date Occupied</IonLabel>
                    <IonDatetime
                      value={formData.dateOccupied}
                      onIonChange={e => handleInputChange('dateOccupied', e.detail.value!)}
                      presentation="date"
                    />
                  </IonItem>
                </IonCol>
                
                <IonCol size="12" size-md="6">
                  <IonItem>
                    <IonLabel position="stacked">Date Completed</IonLabel>
                    <IonDatetime
                      value={formData.dateCompleted}
                      onIonChange={e => handleInputChange('dateCompleted', e.detail.value!)}
                      presentation="date"
                    />
                  </IonItem>
                </IonCol>
                
                <IonCol size="12" size-md="6">
                  <IonItem>
                    <IonLabel position="stacked">Depreciation Rate % *</IonLabel>
                    <IonInput
                      type="number"
                      value={formData.depreciationRate}
                      placeholder="Enter rate (0-100)"
                      onIonInput={e => handleInputChange('depreciationRate', parseInt(e.detail.value!, 10) || null)}
                      className={errors.depreciationRate ? 'ion-invalid' : ''}
                    />
                    {errors.depreciationRate && <IonText color="danger" className="ion-padding-start">{errors.depreciationRate}</IonText>}
                  </IonItem>
                </IonCol>
              </IonRow>
            </IonGrid>
            
            <div className="ion-padding ion-text-center">
              <IonButton expand="block" onClick={handleSubmit}>
                <IonIcon icon={saveOutline} slot="start" />
                Save Building Details
              </IonButton>
              <IonButton expand="block" color="medium" onClick={handleDismiss}>
                Cancel
              </IonButton>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonApp>
  );
};

export default BuildingModal;