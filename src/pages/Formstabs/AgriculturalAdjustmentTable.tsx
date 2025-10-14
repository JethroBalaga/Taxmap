// src/pages/AgriculturalAdjustmentTable.tsx
import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonSpinner,
  IonCard,
  IonCardContent,
} from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import '../../CSS/Forms.css';
import '../../CSS/BuildingResponsive.css';

interface RouteParams {
  formId: string;
}

const AgriculturalAdjustmentTable: React.FC = () => {
  const { formId } = useParams<RouteParams>();
  const history = useHistory();
  const [formData, setFormData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidForm, setIsValidForm] = useState(false);

  useEffect(() => {
    const loadFormData = () => {
      setIsLoading(true);
      try {
        const form = FormDataLocalStorage.getFormData(formId);
        
        if (form) {
          setFormData(form);
          
          // Check if form is Land kind (1) and AGRICULTURAL classification (A)
          const isLandKind = form.kind?.toString() === '1';
          const isAgricultural = form.classification?.toString() === 'A';
          
          setIsValidForm(isLandKind && isAgricultural);
        } else {
          setIsValidForm(false);
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        setIsValidForm(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadFormData();
  }, [formId]);

  const handleBack = () => {
    history.push('/menu/forms');
  };

  // Filter out the fields we don't want to display
  const getDisplayableFormData = () => {
    if (!formData) return {};
    
    const { id, kind, status, uploaded, ...displayableData } = formData;
    return displayableData;
  };

  const displayableData = getDisplayableFormData();

  if (isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Loading...</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <IonText>Loading agricultural data...</IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!isValidForm) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={handleBack}>
                <IonIcon icon={arrowBack} slot="start" />
                Back
              </IonButton>
            </IonButtons>
            <IonTitle>Invalid Form</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="no-data">
            <IonText>
              <h3>Invalid Form Type</h3>
              <p>This page is only accessible for Land forms (kind 1) with AGRICULTURAL classification (A).</p>
              <IonButton onClick={handleBack} color="primary">
                Return to Forms
              </IonButton>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={handleBack}>
              <IonIcon icon={arrowBack} slot="start" />
              Back
            </IonButton>
          </IonButtons>
          <IonTitle>Agricultural Adjustments - Form {formId}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="forms-container">
          <IonGrid>
            <IonRow>
              <IonCol size="12">
                {/* Form Summary Card - Same styling as BuildingList */}
                <IonCard className="form-summary-card">
                  <IonCardContent>
                    <IonGrid style={{ margin: '0', padding: '0' }}>
                      {Object.entries(displayableData).map(([key, value], index, array) => {
                        // Create rows with 4 columns each
                        if (index % 4 === 0) {
                          const rowItems = array.slice(index, index + 4);
                          return (
                            <IonRow key={`row-${index}`} style={{ marginBottom: '4px' }}>
                              {rowItems.map(([itemKey, itemValue], colIndex) => (
                                <IonCol key={itemKey} size="3" style={{ padding: '4px' }}>
                                  <IonText>
                                    <strong>
                                      {itemKey.charAt(0).toUpperCase() + itemKey.slice(1).replace(/([A-Z])/g, ' $1')}:
                                    </strong> {itemValue !== null && itemValue !== undefined ? itemValue.toString() : 'N/A'}
                                  </IonText>
                                </IonCol>
                              ))}
                              {/* Fill empty columns if needed */}
                              {rowItems.length < 4 && 
                                Array.from({ length: 4 - rowItems.length }).map((_, emptyIndex) => (
                                  <IonCol key={`empty-${emptyIndex}`} size="3" style={{ padding: '4px' }}></IonCol>
                                ))
                              }
                            </IonRow>
                          );
                        }
                        return null;
                      })}
                    </IonGrid>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol size="12">
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <IonText>
                    <h2>Agricultural Adjustment Data</h2>
                    <p style={{ marginTop: '20px', color: 'var(--ion-color-medium)' }}>
                      Agricultural adjustment table content will be displayed here.
                    </p>
                  </IonText>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AgriculturalAdjustmentTable;