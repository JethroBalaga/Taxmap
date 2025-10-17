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
    IonText,
    IonAlert
} from "@ionic/react";
import { arrowBack, cutOutline, resizeOutline, trailSignOutline, trashOutline } from "ionicons/icons";
import { useHistory, useParams } from 'react-router-dom';
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { NonAgriAdjustmentLocalStorage } from '../../utils/tablestorages/NonAgriAdjustmentLocalStorage';
import { PhotoTagLocalStorage } from '../../utils/tablestorages/PhotoTagLocalStorage';
import { useState, useEffect } from "react";
import NonAgriAdjustment from '../../components/Modals/NonAgriAdjustment';
import NonAgriAdjustmentUpdate from '../../components/Modals/NonAgriAdjustmentUpdate';
import { LandAdjustmentData, getLandAdjustmentData } from '../../utils/landAdjustmentLocalStorage';
import DynamicTable from '../../components/GlobalComponent/DynamicTable';
import SubmitButton from '../../components/GlobalComponent/SubmitButton';
import { supabaseApi } from '../../services/supabaseApi';
import "../../CSS/Forms.css";

const NonAgriLandTable: React.FC = () => {
    const { formId } = useParams<{ formId: string }>();
    const history = useHistory();

    const [formData, setFormData] = useState<any>(null);
    const [valueInfoId, setValueInfoId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal states
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
    const [showUpdateAdjustmentModal, setShowUpdateAdjustmentModal] = useState(false);
    const [selectedAdjustmentType, setSelectedAdjustmentType] = useState('');
    const [description, setDescription] = useState('');
    const [adjustmentFactor, setAdjustmentFactor] = useState('');
    const [selectedAdjustmentForUpdate, setSelectedAdjustmentForUpdate] = useState<any>(null);

    // Alert state for delete confirmation
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [adjustmentToDelete, setAdjustmentToDelete] = useState<any>(null);

    // Selected row state
    const [selectedRow, setSelectedRow] = useState<any>(null);

    // Land adjustments data
    const [landAdjustments, setLandAdjustments] = useState<LandAdjustmentData[]>([]);
    const [isLoadingAdjustments, setIsLoadingAdjustments] = useState(false);

    // Icons configuration array
    const adjustmentIcons = [
        {
            icon: cutOutline,
            label: "Add Stripping",
            hideFor: ['C', 'I'],
            adjustmentType: 'Stripping'
        },
        {
            icon: resizeOutline,
            label: "Add Corner Influence",
            hideFor: ['I'],
            adjustmentType: 'Corner Influence'
        },
        {
            icon: trailSignOutline,
            label: "Add Frontage",
            hideFor: ['R', 'I'],
            adjustmentType: 'Commercial Frontage'
        },
        {
            icon: trashOutline,
            label: "Delete Selected",
            hideFor: ['I'], // Hide for Industrial
            adjustmentType: 'Delete'
        }
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

            // Fetch or create ValueInfo for this formId
            if (data) {
                let valueInfo = ValueInfoLocalStorage.getValueInfoByFormDataId(formId);
                if (!valueInfo) {
                    // Create new ValueInfo entry if it doesn't exist
                    valueInfo = ValueInfoLocalStorage.addValueInfo({
                        formDataId: formId,
                        photoTagId: '' // You can set this later if needed
                    });
                }
                setValueInfoId(valueInfo.id);
            }

            setIsLoading(false);

            if (!data) {
                setToastMessage('Form not found');
                setShowToast(true);
            }
        }
    };

    const loadLandAdjustments = async () => {
        setIsLoadingAdjustments(true);
        try {
            const adjustments = await getLandAdjustmentData();
            if (adjustments) {
                setLandAdjustments(adjustments);
            }
        } catch (error) {
            console.error('Error loading land adjustments:', error);
            setToastMessage('Error loading adjustment data');
            setShowToast(true);
        } finally {
            setIsLoadingAdjustments(false);
        }
    };

    useEffect(() => {
        loadFormData();
        loadLandAdjustments();
    }, [formId]);

    // Filter adjustments for current valueInfoId and format for DynamicTable
    const getCombinedAdjustmentData = () => {
        if (!valueInfoId || landAdjustments.length === 0) return [];

        const nonAgriAdjustments = NonAgriAdjustmentLocalStorage.getAdjustmentsByValueInfoId(valueInfoId);

        return nonAgriAdjustments.map(nonAgriAdj => {
            // Find the corresponding land adjustment data
            const landAdj = landAdjustments.find(adj => adj.adjustment_id === nonAgriAdj.adjustmentId);

            return {
                valueInfoId: nonAgriAdj.valueInfoId,
                adjustmentId: nonAgriAdj.adjustmentId,
                adjustment_type: landAdj?.adjustment_type || 'N/A',
                description: landAdj?.description || 'N/A',
                adjustment_factor: landAdj?.adjustment_factor || 'N/A'
            };
        });
    };

    const currentAdjustments = getCombinedAdjustmentData();

    const handleBack = () => {
        history.push('/menu/forms');
    };

    const onSubmit = async () => {
        setIsSubmitting(true);
        setToastMessage('Starting non-agricultural land upload process...');
        setShowToast(true);

        try {
            const formData = FormDataLocalStorage.getFormData(formId);
            if (!formData) throw new Error('Form data not found');
            if (formData.uploaded) throw new Error('Form already uploaded');

            const valueInfo = ValueInfoLocalStorage.getValueInfo(valueInfoId);
            if (!valueInfo) throw new Error(`ValueInfo not found for ${valueInfoId}`);

            const photoTag = PhotoTagLocalStorage.getPhotoTag(valueInfo.photoTagId);
            if (!photoTag) throw new Error('Photo tag not found');

            // Insert photo record
            const databaseTagId = await supabaseApi.insertPhoto({
                photo: photoTag.photoName,
                longitude: photoTag.longitude,
                latitude: photoTag.latitude,
                date_taken: validateDate(photoTag.timestamp ? photoTag.timestamp.toISOString().split('T')[0] : null)
            });
            if (!databaseTagId) throw new Error('Failed to insert photo record');

            // Upload photo file if available
            const photoFile = await getPhotoFile(photoTag);
            if (photoFile) {
                const folderPath = `${databaseTagId}/${photoTag.photoName}`;
                const { error: uploadError } = await supabase.storage.from('tag-photos').upload(folderPath, photoFile, {
                    contentType: 'image/jpeg',
                    upsert: false
                });
                if (uploadError) {
                    console.warn('Photo upload failed', uploadError);
                    setToastMessage('Form submitted but photo upload failed');
                }
                // No cleanup - users keep their photos as copies
            } else {
                setToastMessage('Form submitted but could not retrieve photo');
            }

            // Insert form record
            let databaseFormId = formData.synced_id;
            if (!databaseFormId) {
                databaseFormId = await supabaseApi.insertForm({
                    declarant_id: formData.declarantId || 0,
                    kind_id: parseInt(formData.kind),
                    class_id: formData.classification,
                    area: formData.area.toString(),
                    district_id: formData.district,
                    actual_used_id: formData.actualUse,
                    subclass_id: formData.subclass || null,
                    status: 'New'
                });
                if (!databaseFormId) throw new Error('Failed to insert form');
            }

            // Insert value info record
            const databaseValueInfoId = await supabaseApi.insertValueInfo(databaseFormId, databaseTagId);

            // Insert non-agricultural adjustments (only value_info_id and adjustment_id)
            for (const adjustment of currentAdjustments) {
                await supabaseApi.insertNonAgriAdjustment(
                    databaseValueInfoId,
                    adjustment.adjustmentId
                );
            }

            // Mark form as uploaded
            if (!formData.synced_id) {
                FormDataLocalStorage.markFormAsUploaded(formId, databaseFormId);
            }

            setToastMessage('Non-agricultural land data submitted successfully! All data synchronized with server.');
            setShowToast(true);

        } catch (error: any) {
            console.error('Non-agricultural land upload failed:', error);
            setToastMessage(`Upload failed: ${error.message || 'Unknown error'}`);
            setShowToast(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper functions
    const validateDate = (dateString: string | null): string | null => {
        if (!dateString) return null;
        try {
            return new Date(dateString).toISOString().split('T')[0];
        } catch {
            return null;
        }
    };

    const getPhotoFile = async (photoTag: any): Promise<File | null> => {
        // Implement photo file retrieval logic
        // This would typically get the photo file from the device storage
        return null;
    };

    const handleIconClick = (adjustmentType: string) => {
        if (adjustmentType === 'Delete') {
            // Handle delete action
            if (selectedRow) {
                setAdjustmentToDelete(selectedRow);
                setShowDeleteAlert(true);
            } else {
                setToastMessage('Please select an adjustment to delete');
                setShowToast(true);
            }
        } else {
            // Handle normal adjustment types
            setSelectedAdjustmentType(adjustmentType);
            setDescription('');
            setAdjustmentFactor('');
            setShowAdjustmentModal(true);
        }
    };

    const handleUpdateIconClick = (adjustmentType: string) => {
        // Find the existing adjustment for this type
        const existingAdj = currentAdjustments.find(
            adj => adj.adjustment_type === adjustmentType
        );
        setSelectedAdjustmentForUpdate(existingAdj);
        setSelectedAdjustmentType(adjustmentType);
        setDescription(existingAdj?.description || '');
        setAdjustmentFactor(existingAdj?.adjustment_factor || '');
        setShowUpdateAdjustmentModal(true);
    };

    const handleModalDismiss = () => {
        setShowAdjustmentModal(false);
        setSelectedAdjustmentType('');
        setDescription('');
        setAdjustmentFactor('');
        // Reload adjustments when modal is dismissed to get latest data
        loadLandAdjustments();
    };

    const handleUpdateModalDismiss = () => {
        setShowUpdateAdjustmentModal(false);
        setSelectedAdjustmentForUpdate(null);
        setSelectedAdjustmentType('');
        setDescription('');
        setAdjustmentFactor('');
        // Reload adjustments when modal is dismissed to get latest data
        loadLandAdjustments();
    };

    const handleRowClick = (rowData: any) => {
        setSelectedRow(rowData);
    };

    const handleDeleteConfirm = () => {
        if (adjustmentToDelete) {
            const success = NonAgriAdjustmentLocalStorage.deleteNonAgriAdjustment(
                adjustmentToDelete.valueInfoId,
                adjustmentToDelete.adjustmentId
            );

            if (success) {
                console.log('DELETION SUCCESSFUL:', {
                    adjustmentType: adjustmentToDelete.adjustment_type,
                    valueInfoId: adjustmentToDelete.valueInfoId,
                    adjustmentId: adjustmentToDelete.adjustmentId,
                    description: adjustmentToDelete.description,
                    adjustmentFactor: adjustmentToDelete.adjustment_factor,
                    timestamp: new Date().toISOString()
                });

                setToastMessage(`${adjustmentToDelete.adjustment_type} adjustment deleted successfully`);
                setShowToast(true);
                setSelectedRow(null);
                loadLandAdjustments(); // Refresh data
            } else {
                console.error('DELETION FAILED:', {
                    adjustmentType: adjustmentToDelete.adjustment_type,
                    valueInfoId: adjustmentToDelete.valueInfoId,
                    adjustmentId: adjustmentToDelete.adjustmentId,
                    error: 'Failed to delete from NonAgriAdjustmentLocalStorage',
                    timestamp: new Date().toISOString()
                });

                setToastMessage('Error deleting adjustment');
                setShowToast(true);
            }
        }
        setShowDeleteAlert(false);
        setAdjustmentToDelete(null);
    };

    // Filter icons based on classification
    const getVisibleIcons = () => {
        const classification = formData?.classification;
        if (!classification) return adjustmentIcons;

        return adjustmentIcons.filter(icon => !icon.hideFor.includes(classification));
    };

    // Get icon label based on whether adjustment already exists
    const getIconLabel = (adjustmentType: string) => {
        const hasExistingAdjustment = currentAdjustments.some(
            adj => adj.adjustment_type === adjustmentType
        );
        return hasExistingAdjustment ? `Update ${adjustmentType}` : `Add ${adjustmentType}`;
    };

    // Get icon color based on whether adjustment already exists
    const getIconColor = (adjustmentType: string) => {
        if (adjustmentType === 'Delete') {
            return selectedRow ? '#eb445a' : '#92949c'; // Red when enabled, gray when disabled
        }

        const hasExistingAdjustment = currentAdjustments.some(
            adj => adj.adjustment_type === adjustmentType
        );
        return hasExistingAdjustment ? '#ffce00' : '#3880ff'; // Yellow for update, blue for add
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
                    
                    {/* Submit Button on the right side */}
                    <IonButtons slot="end">
                        <SubmitButton
                            label="Submit Form"
                            onClick={onSubmit}
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            className="header-submit-button"
                        />
                    </IonButtons>
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
                        {visibleIcons.map((item, index) => {
                            const hasExistingAdjustment = currentAdjustments.some(
                                adj => adj.adjustment_type === item.adjustmentType
                            );

                            return (
                                <div key={index} style={{ textAlign: 'center' }}>
                                    <IonIcon
                                        icon={item.icon}
                                        size="large"
                                        style={{
                                            cursor: item.adjustmentType === 'Delete' ? (selectedRow ? 'pointer' : 'not-allowed') : 'pointer',
                                            color: getIconColor(item.adjustmentType),
                                            opacity: item.adjustmentType === 'Delete' && !selectedRow ? 0.5 : 1
                                        }}
                                        onClick={() => {
                                            if (item.adjustmentType === 'Delete') {
                                                if (selectedRow) {
                                                    handleIconClick(item.adjustmentType);
                                                }
                                            } else {
                                                if (hasExistingAdjustment) {
                                                    handleUpdateIconClick(item.adjustmentType);
                                                } else {
                                                    handleIconClick(item.adjustmentType);
                                                }
                                            }
                                        }}
                                    />
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <IonText color="medium">
                                            {item.adjustmentType === 'Delete' ?
                                                (selectedRow ? 'Delete Selected' : 'Select to Delete') :
                                                getIconLabel(item.adjustmentType)
                                            }
                                        </IonText>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Adjustments Table using DynamicTable Component */}
                <IonCard>
                    <IonCardContent>
                        {isLoadingAdjustments ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <IonSpinner name="crescent" />
                                <p>Loading adjustments...</p>
                            </div>
                        ) : (
                            <>
                                <DynamicTable
                                    data={currentAdjustments}
                                    title="Land Adjustments"
                                    keyField="adjustmentId"
                                    onRowClick={handleRowClick}
                                    selectedRow={selectedRow}
                                />
                                {selectedRow && (
                                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                        <IonText color="medium">
                                            <small>Selected: {selectedRow.adjustment_type}</small>
                                        </IonText>
                                    </div>
                                )}
                            </>
                        )}
                    </IonCardContent>
                </IonCard>

                {/* Non-Agri Adjustment Modal */}
                <NonAgriAdjustment
                    isOpen={showAdjustmentModal}
                    onDismiss={handleModalDismiss}
                    adjustmentType={selectedAdjustmentType}
                    description={description}
                    setDescription={setDescription}
                    adjustmentFactor={adjustmentFactor}
                    setAdjustmentFactor={setAdjustmentFactor}
                    landAdjustments={landAdjustments}
                    isLoadingAdjustments={isLoadingAdjustments}
                    valueInfoId={valueInfoId}
                />

                {/* Non-Agri Adjustment Update Modal */}
                <NonAgriAdjustmentUpdate
                    isOpen={showUpdateAdjustmentModal}
                    onDismiss={handleUpdateModalDismiss}
                    adjustmentType={selectedAdjustmentType}
                    description={description}
                    setDescription={setDescription}
                    adjustmentFactor={adjustmentFactor}
                    setAdjustmentFactor={setAdjustmentFactor}
                    landAdjustments={landAdjustments}
                    isLoadingAdjustments={isLoadingAdjustments}
                    valueInfoId={valueInfoId}
                    existingAdjustment={selectedAdjustmentForUpdate}
                />

                {/* Delete Confirmation Alert */}
                <IonAlert
                    isOpen={showDeleteAlert}
                    onDidDismiss={() => setShowDeleteAlert(false)}
                    header={'Delete Adjustment'}
                    message={`Are you sure you want to delete this ${adjustmentToDelete?.adjustment_type} adjustment?`}
                    buttons={[
                        {
                            text: 'Cancel',
                            role: 'cancel',
                            cssClass: 'secondary',
                        },
                        {
                            text: 'Delete',
                            role: 'destructive',
                            handler: handleDeleteConfirm
                        }
                    ]}
                />

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