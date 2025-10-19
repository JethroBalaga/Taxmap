// BuildingTableWrapper.tsx
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
    useIonViewWillEnter,
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
    
    const loadFormData = () => {
        if (formId) {
            setIsLoading(true);
            console.log('Loading form data from localStorage');
            const data = FormDataLocalStorage.getFormData(formId);
            setFormData(data);
            setIsLoading(false);
        }
    };
    
    // Load form data when component mounts or formId changes
    useEffect(() => {
        loadFormData();
    }, [formId]);
    
    // Refresh when the view becomes visible again
    useIonViewWillEnter(() => {
        console.log('View will enter, refreshing form data');
        loadFormData();
    });
    
    const handleBack = () => {
        history.push('/menu/forms');
    };
    
    // Listen for custom events or storage changes
    useEffect(() => {
        // Custom event listener for form updates
        const handleFormUpdated = (event: any) => {
            console.log('Form updated event received', event.detail);
            if (!formId || event.detail.formId === formId) {
                console.log('Refreshing form data due to update event');
                loadFormData();
            }
        };
        
        // Listen for custom events
        window.addEventListener('formUpdated', handleFormUpdated as EventListener);
        
        // Listen for storage events (works across tabs)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'formData' || e.key?.includes('form_') || e.key === 'formUpdateTrigger') {
                console.log('Storage change detected, refreshing form data');
                loadFormData();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('formUpdated', handleFormUpdated as EventListener);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [formId]);
    
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
                        <IonTitle>Building Assessment</IonTitle>
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
        <BuildingTableContent
            form_id={formData.id}
            onBack={handleBack}
            kind={formData.kind || ''}
            classification={formData.classification || ''}
            area={formData.area || 0}
            declarant={formData.declarantId?.toString() || ''}
            actual_use={formData.actualUse || ''}
            district={formData.district}
            subclass={formData.subclass}
            formData={formData} // Pass the full formData for the title
        />
    );
};

export default BuildingTableWrapper;