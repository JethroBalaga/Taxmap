// src/components/Modals/BuildingInfoModal.tsx
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
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonButtons,
    IonNote,
    IonText
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { BuildingData } from './BuildingModal';
import { FormData } from './Form';
import Next from '../GlobalComponent/Next'; // Import the Next component
import '../../CSS/modal.css';

interface BuildingInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    buildingData: BuildingData;
    formData: FormData;
    onSave: (adjustment: string, actualUse: string, assessmentLevel: string) => void;
}

const BuildingInfoModal: React.FC<BuildingInfoModalProps> = ({
    isOpen,
    onClose,
    buildingData,
    formData,
    onSave
}) => {
    const [adjustment, setAdjustment] = useState<string>('');
    const [actualUse, setActualUse] = useState<string>('');
    const [assessmentLevel, setAssessmentLevel] = useState<string>('');
    const [errors, setErrors] = useState<{ adjustment?: string; actualUse?: string; assessmentLevel?: string }>({});

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setAdjustment('');
            setActualUse('');
            setAssessmentLevel('');
            setErrors({});
        }
    }, [isOpen]);

    const handleSave = () => {
        const newErrors: { adjustment?: string; actualUse?: string; assessmentLevel?: string } = {};

        if (!adjustment) newErrors.adjustment = 'Adjustment is required';
        if (!actualUse) newErrors.actualUse = 'Actual use is required';
        if (!assessmentLevel) newErrors.assessmentLevel = 'Assessment level is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSave(adjustment, actualUse, assessmentLevel);
        onClose();
    };

    const handleClose = () => {
        onClose();
    };

    // Sample data - replace with your actual data sources
    const adjustmentOptions = [
        { value: 'adj1', label: 'Adjustment 1' },
        { value: 'adj2', label: 'Adjustment 2' },
        { value: 'adj3', label: 'Adjustment 3' },
    ];

    const actualUseOptions = [
        { value: 'residential', label: 'Residential' },
        { value: 'commercial', label: 'Commercial' },
        { value: 'industrial', label: 'Industrial' },
        { value: 'agricultural', label: 'Agricultural' },
        { value: 'institutional', label: 'Institutional' },
    ];

    const assessmentLevelOptions = [
        { value: 'level1', label: 'Assessment Level 1' },
        { value: 'level2', label: 'Assessment Level 2' },
        { value: 'level3', label: 'Assessment Level 3' },
    ];

    return (
        <IonModal
            isOpen={isOpen}
            onDidDismiss={handleClose}
            className="custom-wide-modal"
        >
            <IonHeader>
                <IonToolbar className="fancy-header">
                    <IonTitle className="fancy-title">Building Information</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={handleClose} className="fancy-close-btn" fill="clear">
                            <IonIcon icon={closeOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="modal-content">
                {/* Display form data for reference */}
                <div style={{ padding: '10px', background: '#f5f5f5', marginBottom: '15px', borderRadius: '8px' }}>
                    <IonText color="medium">
                        <small>Form Reference: District {formData.district}, Kind ID: {formData.kind}, Area: {formData.area}m²</small>
                    </IonText>
                </div>

                <IonGrid className="custom-grid">
                    <IonRow>
                        <IonCol className="custom-col">
                            <div className="form-section">
                                <h3 className="section-title">Building Details</h3>
                                
                                {/* Actual Use Dropdown */}
                                <IonItem className="custom-input" lines="none">
                                    <IonLabel position="stacked" className="input-label">
                                        Actual Use <span style={{ color: 'red' }}>*</span>
                                    </IonLabel>
                                    <IonSelect
                                        value={actualUse}
                                        placeholder="Select Actual Use"
                                        onIonChange={e => {
                                            setActualUse(e.detail.value!);
                                            if (errors.actualUse) setErrors({ ...errors, actualUse: undefined });
                                        }}
                                        interface="popover"
                                        className="modal-input"
                                    >
                                        {actualUseOptions.map(option => (
                                            <IonSelectOption key={option.value} value={option.value}>
                                                {option.label}
                                            </IonSelectOption>
                                        ))}
                                    </IonSelect>
                                    {errors.actualUse && (
                                        <IonNote color="danger" className="error-message">
                                            <small>{errors.actualUse}</small>
                                        </IonNote>
                                    )}
                                </IonItem>
                                
                                {/* Adjustment Dropdown */}
                                <IonItem className="custom-input" lines="none">
                                    <IonLabel position="stacked" className="input-label">
                                        Adjustment <span style={{ color: 'red' }}>*</span>
                                    </IonLabel>
                                    <IonSelect
                                        value={adjustment}
                                        placeholder="Select Adjustment"
                                        onIonChange={e => {
                                            setAdjustment(e.detail.value!);
                                            if (errors.adjustment) setErrors({ ...errors, adjustment: undefined });
                                        }}
                                        interface="popover"
                                        className="modal-input"
                                    >
                                        {adjustmentOptions.map(option => (
                                            <IonSelectOption key={option.value} value={option.value}>
                                                {option.label}
                                            </IonSelectOption>
                                        ))}
                                    </IonSelect>
                                    {errors.adjustment && (
                                        <IonNote color="danger" className="error-message">
                                            <small>{errors.adjustment}</small>
                                        </IonNote>
                                    )}
                                </IonItem>
                                
                                {/* Assessment Level Dropdown */}
                                <IonItem className="custom-input" lines="none">
                                    <IonLabel position="stacked" className="input-label">
                                        Assessment Level <span style={{ color: 'red' }}>*</span>
                                    </IonLabel>
                                    <IonSelect
                                        value={assessmentLevel}
                                        placeholder="Select Assessment Level"
                                        onIonChange={e => {
                                            setAssessmentLevel(e.detail.value!);
                                            if (errors.assessmentLevel) setErrors({ ...errors, assessmentLevel: undefined });
                                        }}
                                        interface="popover"
                                        className="modal-input"
                                    >
                                        {assessmentLevelOptions.map(option => (
                                            <IonSelectOption key={option.value} value={option.value}>
                                                {option.label}
                                            </IonSelectOption>
                                        ))}
                                    </IonSelect>
                                    {errors.assessmentLevel && (
                                        <IonNote color="danger" className="error-message">
                                            <small>{errors.assessmentLevel}</small>
                                        </IonNote>
                                    )}
                                </IonItem>
                            </div>
                        </IonCol>
                    </IonRow>
                </IonGrid>

                {/* Save Button Container - Using Next component */}
                <div className="next-btn-container">
                    <Next 
                        onClick={handleSave}
                        disabled={!adjustment || !actualUse || !assessmentLevel}
                    />
                </div>
            </IonContent>
        </IonModal>
    );
};

export default BuildingInfoModal;