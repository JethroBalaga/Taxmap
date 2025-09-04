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
import { getActualUsedByClassId } from '../../utils/actualUsedLocalStorage';
import { getAssessmentLevelsByKindId } from '../../utils/assessmentLevelLocalStorage';
import Next from '../GlobalComponent/Next';
import PhotoModal from './PhotoModal';
import '../../CSS/modal.css';

interface BuildingInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    buildingData: BuildingData;
    formData: FormData;
    onSave: (adjustment: string, actualUse: string, assessmentLevel: string) => void;
}

interface BuildingInfoData {
    adjustment: string;
    actualUse: string;
    assessmentLevel: string;
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
    const [actualUseOptions, setActualUseOptions] = useState<{ value: string, label: string }[]>([]);
    const [assessmentLevelOptions, setAssessmentLevelOptions] = useState<{ value: string, label: string, display: string }[]>([]);
    const [assessmentLevelDisplay, setAssessmentLevelDisplay] = useState<string>('');
    const [errors, setErrors] = useState<{ actualUse?: string; assessmentLevel?: string }>({});
    
    // New state for photo modal
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [savedBuildingInfo, setSavedBuildingInfo] = useState<BuildingInfoData | null>(null);

    // Extract class_id from classification (e.g., "A-Agricultural" -> "A")
    const extractClassId = (classification: string): string => {
        if (!classification) return '';
        const parts = classification.split('-');
        return parts[0].trim();
    };

    // Extract kind_id from kind (e.g., "2-building" -> 2)
    const extractKindId = (kind: string): number => {
        if (!kind) return 0;
        const parts = kind.split('-');
        return parseInt(parts[0].trim()) || 0;
    };

    const classId = extractClassId(formData.classification);
    const kindId = extractKindId(formData.kind);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setAdjustment('');
            setActualUse('');
            setAssessmentLevel('');
            setAssessmentLevelDisplay('');
            setErrors({});
            setIsPhotoModalOpen(false);
            setSavedBuildingInfo(null);
        }
    }, [isOpen]);

    // Fetch actual use options based on extracted class_id
    useEffect(() => {
        const fetchActualUseOptions = async () => {
            if (classId && isOpen) {
                console.log('Fetching actual use options for class_id:', classId);

                const actualUsedData = await getActualUsedByClassId(classId);
                console.log('Fetched actual used data:', actualUsedData);

                // Map to option format with concatenated ID and description
                const options = actualUsedData.map(item => ({
                    value: item.actual_used_id,
                    label: `${item.actual_used_id} - ${item.description}`
                }));

                setActualUseOptions(options);

                if (options.length === 0) {
                    console.warn('No actual use options found for class_id:', classId);
                }
            }
        };

        fetchActualUseOptions();
    }, [isOpen, classId]);

    // Fetch assessment level options based on extracted kind_id
    useEffect(() => {
        const fetchAssessmentLevelOptions = async () => {
            if (kindId > 0 && isOpen) {
                console.log('Fetching assessment levels for kind_id:', kindId);

                const assessmentLevels = await getAssessmentLevelsByKindId(kindId);
                console.log('Fetched assessment levels:', assessmentLevels);

                // Map to option format - use the rate_percent as is (it already contains %)
                const options = assessmentLevels.map(item => ({
                    value: item.assessment_level_id,
                    label: item.rate_percent, // Use as is (already contains %)
                    display: item.rate_percent // Use as is for display
                }));

                setAssessmentLevelOptions(options);

                if (options.length === 0) {
                    console.warn('No assessment levels found for kind_id:', kindId);
                }
            }
        };

        fetchAssessmentLevelOptions();
    }, [isOpen, kindId]);

    // Update display value when assessment level changes
    useEffect(() => {
        if (assessmentLevel) {
            const selectedOption = assessmentLevelOptions.find(opt => opt.value === assessmentLevel);
            if (selectedOption) {
                setAssessmentLevelDisplay(selectedOption.display);
            }
        } else {
            setAssessmentLevelDisplay('');
        }
    }, [assessmentLevel, assessmentLevelOptions]);

    const handleNext = () => {
        const newErrors: { actualUse?: string; assessmentLevel?: string } = {};

        if (!actualUse) newErrors.actualUse = 'Actual use is required';
        if (!assessmentLevel) newErrors.assessmentLevel = 'Assessment level is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Save the building info temporarily and open photo modal
        setSavedBuildingInfo({ adjustment, actualUse, assessmentLevel });
        setIsPhotoModalOpen(true);
    };

    const handlePhotoTaken = (photo: string) => {
        // When photo is taken, call the original onSave with the saved building info
        if (savedBuildingInfo) {
            onSave(
                savedBuildingInfo.adjustment, 
                savedBuildingInfo.actualUse, 
                savedBuildingInfo.assessmentLevel
            );
            // You can also handle the photo here if needed
            console.log('Photo taken:', photo);
        }
        setIsPhotoModalOpen(false);
        onClose(); // Close both modals
    };

    const handleClose = () => {
        onClose();
    };

    const handlePhotoModalClose = () => {
        setIsPhotoModalOpen(false);
        setSavedBuildingInfo(null);
    };

    // Sample data for adjustment dropdown - replace with your actual data sources
    const adjustmentOptions = [
        { value: '', label: 'None (Optional)' },
        { value: 'adj1', label: 'Adjustment 1' },
        { value: 'adj2', label: 'Adjustment 2' },
        { value: 'adj3', label: 'Adjustment 3' },
    ];

    return (
        <>
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
                            <small>
                                Form Reference: District {formData.district}, Kind: {formData.kind} (ID: {kindId}),
                                Classification: {formData.classification} (Class ID: {classId}),
                                Area: {formData.area}m²
                            </small>
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
                                            {actualUseOptions.length === 0 ? (
                                                <IonSelectOption value="" disabled>
                                                    {classId ? 'No options available for this class' : 'Select a classification first'}
                                                </IonSelectOption>
                                            ) : (
                                                actualUseOptions.map(option => (
                                                    <IonSelectOption key={option.value} value={option.value}>
                                                        {option.label}
                                                    </IonSelectOption>
                                                ))
                                            )}
                                        </IonSelect>
                                        {errors.actualUse && (
                                            <IonNote color="danger" className="error-message">
                                                <small>{errors.actualUse}</small>
                                            </IonNote>
                                        )}
                                    </IonItem>
                                    {/* Adjustment Dropdown - Optional */}
                                    <IonItem className="custom-input" lines="none">
                                        <IonLabel position="stacked" className="input-label">
                                            Adjustment (Optional)
                                        </IonLabel>
                                        <IonSelect
                                            value={adjustment}
                                            placeholder="Select Adjustment (Optional)"
                                            onIonChange={e => setAdjustment(e.detail.value!)}
                                            interface="popover"
                                            className="modal-input"
                                        >
                                            {adjustmentOptions.map(option => (
                                                <IonSelectOption key={option.value} value={option.value}>
                                                    {option.label}
                                                </IonSelectOption>
                                            ))}
                                        </IonSelect>
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
                                            {assessmentLevelOptions.length === 0 ? (
                                                <IonSelectOption value="" disabled>
                                                    {kindId ? 'No assessment levels found for this kind' : 'Kind not selected'}
                                                </IonSelectOption>
                                            ) : (
                                                assessmentLevelOptions.map(option => (
                                                    <IonSelectOption key={option.value} value={option.value}>
                                                        {option.label}
                                                    </IonSelectOption>
                                                ))
                                            )}
                                        </IonSelect>
                                        {/* Display the selected assessment level */}
                                        {assessmentLevelDisplay && (
                                            <div style={{ marginTop: '8px' }}>
                                                <IonText color="primary">
                                                    <small>Selected: {assessmentLevelDisplay} (ID: {assessmentLevel})</small>
                                                </IonText>
                                            </div>
                                        )}
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
                            onClick={handleNext}
                            disabled={!actualUse || !assessmentLevel}
                        />
                    </div>
                </IonContent>
            </IonModal>

            {/* Photo Modal with passed data */}
            <PhotoModal
                isOpen={isPhotoModalOpen}
                onClose={handlePhotoModalClose}
                onPhotoTaken={handlePhotoTaken}
                formData={formData}
                buildingData={buildingData}
                buildingInfoData={savedBuildingInfo}
            />
        </>
    );
};

export default BuildingInfoModal;