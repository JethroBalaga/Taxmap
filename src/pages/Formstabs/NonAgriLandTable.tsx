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
import { arrowBack, cutOutline, resizeOutline, trailSignOutline } from "ionicons/icons";
import { useHistory, useParams } from 'react-router-dom';
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import { useState, useEffect } from "react";
import "../../CSS/Forms.css";

const NonAgriLandTable: React.FC = () => {
    const { formId } = useParams<{ formId: string }>();
    const history = useHistory();
    
    const [formData, setFormData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    
    // Icons configuration array
    const adjustmentIcons = [
        { icon: cutOutline, label: "Add Stripping", hideFor: ['C', 'I'] },
        { icon: resizeOutline, label: "Add Corner Influence", hideFor: ['I'] },
        { icon: trailSignOutline, label: "Add Frontage", hideFor: ['R', 'I'] }
    ];
    
    // Grid data configuration array
    const gridData = [
        [
            { label: "District:", value: formData?.district || 'N/A' },
            { label: "Declarant ID:", value: formData?.declarantId || 'N/A' },
            { label: "Kind:", value: formData?.kind || 'N/A' },
            { label: "Classification:", value: formData?.classification || 'N/A' }
        ],
        [
            { label: "Subclass:", value: formData?.subclass || 'N/A' },
            { label: "Actual Use:", value: formData?.actualUse || 'N/A' },
            { label: "Area:", value: formData?.area ? formData.area.toLocaleString() : 'N/A' },
            { label: "", value: "" } // Empty column for alignment
        ]
    ];
    
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

    // Filter icons based on classification
    const getVisibleIcons = () => {
        const classification = formData?.classification;
        if (!classification) return adjustmentIcons;
        
        return adjustmentIcons.filter(icon => !icon.hideFor.includes(classification));
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

    const visibleIcons = getVisibleIcons();
    
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
                    <IonTitle>Non-Agricultural Land - Form {formData.id}</IonTitle>
                </IonToolbar>
            </IonHeader>
            
            <IonContent className="forms-container">
                {/* Form Summary Card Only */}
                <IonCard className="form-summary-card">
                    <IonCardContent>
                        <IonGrid style={{ margin: '0', padding: '0' }}>
                            {gridData.map((row, rowIndex) => (
                                <IonRow key={rowIndex} style={{ marginBottom: '4px' }}>
                                    {row.map((col, colIndex) => (
                                        <IonCol key={colIndex} size="3" style={{ padding: '4px' }}>
                                            <IonText>
                                                {col.label && <strong>{col.label}</strong>} {col.value}
                                            </IonText>
                                        </IonCol>
                                    ))}
                                </IonRow>
                            ))}
                        </IonGrid>
                    </IonCardContent>
                </IonCard>

                {/* Icons Section - Centered - Only show if there are visible icons */}
                {visibleIcons.length > 0 && (
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        gap: '2rem', 
                        margin: '2rem 0',
                        padding: '1rem'
                    }}>
                        {visibleIcons.map((item, index) => (
                            <div key={index} style={{ textAlign: 'center' }}>
                                <IonIcon 
                                    icon={item.icon} 
                                    size="large" 
                                    style={{ cursor: 'pointer', color: '#3880ff' }}
                                />
                                <div style={{ marginTop: '0.5rem' }}>
                                    <IonText color="medium">{item.label}</IonText>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
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