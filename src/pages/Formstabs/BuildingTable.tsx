import React, { useState, useEffect } from "react";
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonTitle,
    IonSpinner,
    IonText
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { useParams, useHistory } from 'react-router-dom';
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import BuildingTableContent from './BuildingTableContent';

const BuildingTableWrapper: React.FC = () => {
    const { formId } = useParams<{ formId: string }>();
    const history = useHistory();
    
    const [formData, setFormData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');
    
    const loadFormData = async () => {
        if (!formId) {
            setError('No form ID provided');
            setIsLoading(false);
            return;
        }

        console.log('Loading form data for building form ID:', formId);
        
        try {
            const data = await FormDataLocalStorage.getFormData(formId);
            console.log('Loaded building form data:', data);
            
            if (!data) {
                setError(`Form with ID ${formId} not found`);
                setFormData(null);
            } else {
                setFormData(data);
            }
        } catch (error) {
            console.error('Error loading building form data:', error);
            setError('Failed to load form data');
            setFormData(null);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Load data only once when component mounts or formId changes
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
                        <IonTitle>Building Assessment</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <IonSpinner name="crescent" />
                        <p>Loading building form data...</p>
                    </div>
                </IonContent>
            </IonPage>
        );
    }
    
    if (error) {
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
                        <IonTitle>Building Assessment - Error</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <IonText color="danger">
                            <h3>Error Loading Form</h3>
                            <p>{error}</p>
                        </IonText>
                        <IonButton onClick={handleBack}>
                            Return to Forms
                        </IonButton>
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
                        <IonTitle>Building Assessment</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <IonText>Building form not found</IonText>
                        <IonButton onClick={handleBack}>
                            Return to Forms
                        </IonButton>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    // Validate required form data
    if (!formData.kind || !formData.classification || !formData.area) {
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
                        <IonTitle>Building Assessment - Invalid Form</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <IonText color="warning">
                            <h3>Invalid Form Data</h3>
                            <p>This form is missing required information.</p>
                        </IonText>
                        <IonButton onClick={handleBack}>
                            Return to Forms
                        </IonButton>
                    </div>
                </IonContent>
            </IonPage>
        );
    }
    
    return (
        <BuildingTableContent
            form_id={formData.id}
            onBack={handleBack}
            kind={formData.kind}
            classification={formData.classification}
            area={parseFloat(formData.area) || 0}
            declarant={formData.declarantId?.toString() || ''}
            actual_use={formData.actualUse || ''}
            district={formData.district}
            subclass={formData.subclass}
            formData={formData}
        />
    );
};

export default BuildingTableWrapper;