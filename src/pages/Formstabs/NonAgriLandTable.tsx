// src/pages/NonAgriLandTable.tsx
import React from "react";
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonToast,
    IonTitle,
    IonSpinner,
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonText
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { useHistory, useParams } from 'react-router-dom';
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import { useState, useEffect } from "react";
import "./../CSS/Forms.css";

const NonAgriLandTable: React.FC = () => {
    const { formId } = useParams<{ formId: string }>();
    const history = useHistory();
    
    const [formData, setFormData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    
    const loadFormData = () => {
        if (formId) {
            setIsLoading(true);
            console.log('Loading non-agricultural land form data for ID:', formId);
            const data = FormDataLocalStorage.getFormData(formId);
            setFormData(data);
            setIsLoading(false);
            
            if (!data) {
                setToastMessage('Form not found');
                setShowToast(true);
            }
        }
    };
    
    useEffect(() => {
        loadFormData();
    }, [formId]);
    
    const handleBack = () => {
        history.push('/menu/forms');
    };
    
    if (isLoading) {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonButton onClick={handleBack}>
                                <IonIcon icon={arrowBack} />
                                Back
                            </IonButton>
                        </IonButtons>
                        <IonTitle>Non-Agricultural Land</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <IonSpinner name="crescent" />
                        <p>Loading form data...</p>
                    </div>
                </IonContent>
            </IonPage>
        );
    }
    
    if (!formData) {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonButton onClick={handleBack}>
                                <IonIcon icon={arrowBack} />
                                Back
                            </IonButton>
                        </IonButtons>
                        <IonTitle>Non-Agricultural Land</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <IonText>Form not found</IonText>
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
                            <IonIcon icon={arrowBack} />
                            Back
                        </IonButton>
                    </IonButtons>
                    <IonTitle>Non-Agricultural Land - {formData.id}</IonTitle>
                </IonToolbar>
            </IonHeader>
            
            <IonContent className="forms-container">
                {/* Form Summary Card - Similar to Building */}
                <IonCard className="form-summary-card">
                    <IonCardContent>
                        <IonGrid style={{ margin: '0', padding: '0' }}>
                            <IonRow style={{ marginBottom: '4px' }}>
                                <IonCol size="3" style={{ padding: '4px' }}>
                                    <IonText><strong>Form ID:</strong> {formData.id}</IonText>
                                </IonCol>
                                <IonCol size="3" style={{ padding: '4px' }}>
                                    <IonText><strong>District:</strong> {formData.district || 'N/A'}</IonText>
                                </IonCol>
                                <IonCol size="3" style={{ padding: '4px' }}>
                                    <IonText><strong>Declarant ID:</strong> {formData.declarantId || 'N/A'}</IonText>
                                </IonCol>
                                <IonCol size="3" style={{ padding: '4px' }}>
                                    <IonText><strong>Kind:</strong> {formData.kind || 'N/A'}</IonText>
                                </IonCol>
                            </IonRow>
                            <IonRow style={{ marginBottom: '4px' }}>
                                <IonCol size="3" style={{ padding: '4px' }}>
                                    <IonText><strong>Classification:</strong> {formData.classification || 'N/A'}</IonText>
                                </IonCol>
                                <IonCol size="3" style={{ padding: '4px' }}>
                                    <IonText><strong>Subclass:</strong> {formData.subclass || 'N/A'}</IonText>
                                </IonCol>
                                <IonCol size="3" style={{ padding: '4px' }}>
                                    <IonText><strong>Actual Use:</strong> {formData.actualUse || 'N/A'}</IonText>
                                </IonCol>
                                <IonCol size="3" style={{ padding: '4px' }}>
                                    <IonText><strong>Area:</strong> {formData.area ? `${formData.area.toLocaleString()} sq ft` : 'N/A'}</IonText>
                                </IonCol>
                            </IonRow>
                            <IonRow>
                                <IonCol size="12" style={{ padding: '4px' }}>
                                    <IonText><strong>Property Type:</strong> Non-Agricultural Land</IonText>
                                </IonCol>
                            </IonRow>
                        </IonGrid>
                    </IonCardContent>
                </IonCard>
                
                {/* Additional Content Placeholder */}
                <IonCard>
                    <IonCardContent>
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <IonText color="medium">
                                <h3>Non-Agricultural Land Assessment</h3>
                                <p>This section is for non-agricultural land property assessment.</p>
                                <p>Form ID: <strong>{formData.id}</strong></p>
                            </IonText>
                        </div>
                    </IonCardContent>
                </IonCard>
                
                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={toastMessage}
                    duration={3000}
                    position="middle"
                />
            </IonContent>
        </IonPage>
    );
};

export default NonAgriLandTable;