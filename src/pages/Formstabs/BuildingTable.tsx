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
    useIonViewWillEnter
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { useParams, useHistory, useLocation } from 'react-router-dom';
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import BuildingTableContent from './BuildingTableContent';

// Define the interface for location state
interface LocationState {
    formData?: any; // Use your specific FormData type if available
}

const BuildingTableWrapper: React.FC = () => {
    const { formId } = useParams<{ formId: string }>();
    const history = useHistory();
    const location = useLocation();

    const [formData, setFormData] = useState<any>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const loadFormData = () => {
        if (formId) {
            // Type cast the location state
            const state = location.state as LocationState;
            
            // First try to get from location state (more current)
            if (state?.formData) {
                console.log('Using form data from location state');
                setFormData(state.formData);
            }
            // Fall back to localStorage
            else {
                console.log('Loading form data from localStorage');
                const data = FormDataLocalStorage.getFormData(formId);
                setFormData(data);
            }
        }
    };

    // Load form data when component mounts or formId changes
    useEffect(() => {
        loadFormData();
    }, [formId, refreshTrigger]);

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
        const handleFormUpdated = (event: CustomEvent) => {
            console.log('Form updated event received', event.detail);
            if (!formId || event.detail.formId === formId) {
                setRefreshTrigger(prev => prev + 1);
            }
        };

        // Listen for custom events
        window.addEventListener('formUpdated', handleFormUpdated as EventListener);

        // Listen for storage events (works across tabs)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'formData' || e.key?.includes('form_') || e.key === 'formUpdateTrigger') {
                console.log('Storage change detected, refreshing form data');
                setRefreshTrigger(prev => prev + 1);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('formUpdated', handleFormUpdated as EventListener);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [formId]);

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
                        <IonSpinner name="crescent" />
                        <p>Loading form data...</p>
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
            key={refreshTrigger}
        />
    );
};

export default BuildingTableWrapper;