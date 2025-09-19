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
    IonSpinner
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { useParams, useHistory } from 'react-router-dom';
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import BuildingTableContent from './BuildingTableContent';

const BuildingTableWrapper: React.FC = () => {
    const { formId } = useParams<{ formId: string }>();
    const history = useHistory();
    
    const [formData, setFormData] = useState<any>(null);
    
    useEffect(() => {
        if (formId) {
            const data = FormDataLocalStorage.getFormData(formId);
            setFormData(data);
        }
    }, [formId]);
    
    const handleBack = () => {
        history.push('/menu/forms');
    };
    
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
        />
    );
};

export default BuildingTableWrapper;