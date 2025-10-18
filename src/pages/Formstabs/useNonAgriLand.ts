// src/pages/hooks/useNonAgriLand.ts
import { useState, useEffect } from "react";
import { useHistory, useLocation } from 'react-router-dom';
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { NonAgriAdjustmentLocalStorage } from '../../utils/tablestorages/NonAgriAdjustmentLocalStorage';
import { PhotoTagLocalStorage } from '../../utils/tablestorages/PhotoTagLocalStorage';
import { LandAdjustmentData, getLandAdjustmentData } from '../../utils/landAdjustmentLocalStorage';
import { getSubclassRateData, getCurrentRateForSubclass } from '../../utils/subclassRateLocalStorage';
import { supabaseApi } from '../../services/supabaseApi';
import { supabase } from '../../utils/supaBaseClient';

// Icons configuration array
const adjustmentIcons = [
    {
        icon: 'cutOutline',
        label: "Add Stripping",
        hideFor: ['C', 'I'],
        adjustmentType: 'Stripping'
    },
    {
        icon: 'resizeOutline',
        label: "Add Corner Influence",
        hideFor: ['I'],
        adjustmentType: 'Corner Influence'
    },
    {
        icon: 'trailSignOutline',
        label: "Add Frontage",
        hideFor: ['R', 'I'],
        adjustmentType: 'Commercial Frontage'
    },
    {
        icon: 'trashOutline',
        label: "Delete Selected",
        hideFor: ['I'],
        adjustmentType: 'Delete'
    }
];

export const useNonAgriLand = (formId: string | undefined) => {
    const history = useHistory();
    const location = useLocation();

    // State
    const [formData, setFormData] = useState<any>(null);
    const [valueInfoId, setValueInfoId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning' | undefined>(undefined);
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

    // Subclass rates data
    const [subclassRates, setSubclassRates] = useState<any[]>([]);
    const [isLoadingRates, setIsLoadingRates] = useState(false);

    const showToastMessage = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
        setToastMessage(message);
        setToastColor(color);
        setShowToast(true);
    };

    const loadFormData = () => {
        if (formId) {
            setIsLoading(true);
            console.log('Loading non-agricultural land form data for ID:', formId);
            
            // ALWAYS load from localStorage to get the latest data
            const storedFormData = FormDataLocalStorage.getFormData(formId);
            console.log('Loaded form data from localStorage:', storedFormData);
            setFormData(storedFormData);
            
            // Fetch or create ValueInfo for this formId using the stored form data
            if (storedFormData) {
                let valueInfo = ValueInfoLocalStorage.getValueInfoByFormDataId(formId);
                if (!valueInfo) {
                    valueInfo = ValueInfoLocalStorage.addValueInfo({
                        formDataId: formId,
                        photoTagId: ''
                    });
                }
                setValueInfoId(valueInfo.id);
            }
            
            setIsLoading(false);

            if (!storedFormData) {
                showToastMessage('Form not found', 'danger');
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
            showToastMessage('Error loading adjustment data', 'danger');
        } finally {
            setIsLoadingAdjustments(false);
        }
    };

    const loadSubclassRates = async () => {
        if (!formData?.subclass) return;
        
        setIsLoadingRates(true);
        try {
            const ratesData = await getSubclassRateData();
            if (ratesData) {
                // Get current rate for the form's subclass
                const currentRate = await getCurrentRateForSubclass(formData.subclass);
                
                // Create the simplified rate display data
                const rateDisplayData = [{
                    valueInfoId: valueInfoId,
                    rate: currentRate || 'N/A' // No percentage sign
                }];
                
                setSubclassRates(rateDisplayData);
            }
        } catch (error) {
            console.error('Error loading subclass rates:', error);
        } finally {
            setIsLoadingRates(false);
        }
    };

    useEffect(() => {
        loadFormData();
        loadLandAdjustments();
    }, [formId]);

    // Load subclass rates when formData changes
    useEffect(() => {
        if (formData?.subclass && valueInfoId) {
            loadSubclassRates();
        }
    }, [formData?.subclass, valueInfoId]);

    // Listen for form data updates from Forms page
    useEffect(() => {
        const handleFormDataUpdate = (event: CustomEvent) => {
            if (event.detail && event.detail.formId === formId) {
                console.log('Form data updated, reloading form data...');
                loadFormData();
            }
        };

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'formUpdateTrigger') {
                console.log('Form update detected via localStorage, reloading form data...');
                loadFormData();
            }
        };

        window.addEventListener('formDataUpdated', handleFormDataUpdate as EventListener);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('formDataUpdated', handleFormDataUpdate as EventListener);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [formId]);

    // Filter adjustments for current valueInfoId and format for table
    const getCombinedAdjustmentData = () => {
        if (!valueInfoId || landAdjustments.length === 0) return [];

        const nonAgriAdjustments = NonAgriAdjustmentLocalStorage.getAdjustmentsByValueInfoId(valueInfoId);

        return nonAgriAdjustments.map(nonAgriAdj => {
            const landAdj = landAdjustments.find(adj => adj.adjustment_id === nonAgriAdj.adjustmentId);

            return {
                adjustmentId: nonAgriAdj.adjustmentId,
                adjustment_type: landAdj?.adjustment_type || 'N/A',
                description: landAdj?.description || 'N/A',
                adjustment_factor: landAdj?.adjustment_factor || 'N/A',
                value_adjustment: 'N/A' // Added Value Adjustment column
            };
        });
    };

    const currentAdjustments = getCombinedAdjustmentData();

    const handleBack = () => {
        history.push('/menu/forms');
    };

    const onSubmit = async () => {
        setIsSubmitting(true);
        showToastMessage('Starting non-agricultural land upload process...', 'warning');

        try {
            // Use different variable name to avoid conflict
            const currentFormData = FormDataLocalStorage.getFormData(formId!);
            if (!currentFormData) throw new Error('Form data not found');
            if (currentFormData.uploaded) throw new Error('Form already uploaded');

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
                    showToastMessage('Form submitted but photo upload failed', 'warning');
                }
            } else {
                showToastMessage('Form submitted but could not retrieve photo', 'warning');
            }

            // Insert form record
            let databaseFormId = currentFormData.synced_id;
            if (!databaseFormId) {
                databaseFormId = await supabaseApi.insertForm({
                    declarant_id: currentFormData.declarantId || 0,
                    kind_id: parseInt(currentFormData.kind),
                    class_id: currentFormData.classification,
                    area: currentFormData.area.toString(),
                    district_id: currentFormData.district,
                    actual_used_id: currentFormData.actualUse,
                    subclass_id: currentFormData.subclass || null,
                    status: 'New'
                });
                if (!databaseFormId) throw new Error('Failed to insert form');
            }

            // Insert value info record
            const databaseValueInfoId = await supabaseApi.insertValueInfo(databaseFormId, databaseTagId);

            // Insert non-agricultural adjustments
            for (const adjustment of currentAdjustments) {
                await supabaseApi.insertNonAgriAdjustment(
                    databaseValueInfoId,
                    adjustment.adjustmentId
                );
            }

            // Mark form as uploaded
            if (!currentFormData.synced_id) {
                FormDataLocalStorage.markFormAsUploaded(formId!, databaseFormId);
            }

            showToastMessage('Non-agricultural land data submitted successfully! All data synchronized with server.', 'success');

        } catch (error: any) {
            console.error('Non-agricultural land upload failed:', error);
            showToastMessage(`Upload failed: ${error.message || 'Unknown error'}`, 'danger');
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
        return null;
    };

    const handleIconClick = (adjustmentType: string) => {
        if (adjustmentType === 'Delete') {
            if (selectedRow) {
                setAdjustmentToDelete(selectedRow);
                setShowDeleteAlert(true);
            } else {
                showToastMessage('Please select an adjustment to delete', 'warning');
            }
        } else {
            setSelectedAdjustmentType(adjustmentType);
            setDescription('');
            setAdjustmentFactor('');
            setShowAdjustmentModal(true);
        }
    };

    const handleUpdateIconClick = (adjustmentType: string) => {
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
        loadLandAdjustments();
    };

    const handleUpdateModalDismiss = () => {
        setShowUpdateAdjustmentModal(false);
        setSelectedAdjustmentForUpdate(null);
        setSelectedAdjustmentType('');
        setDescription('');
        setAdjustmentFactor('');
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
                showToastMessage(`${adjustmentToDelete.adjustment_type} adjustment deleted successfully`, 'success');
                setSelectedRow(null);
                loadLandAdjustments();
            } else {
                showToastMessage('Error deleting adjustment', 'danger');
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

    const visibleIcons = getVisibleIcons();

    return {
        // State
        formData,
        valueInfoId,
        isLoading,
        showToast,
        toastMessage,
        toastColor,
        isSubmitting,
        showAdjustmentModal,
        showUpdateAdjustmentModal,
        selectedAdjustmentType,
        description,
        adjustmentFactor,
        selectedAdjustmentForUpdate,
        showDeleteAlert,
        adjustmentToDelete,
        selectedRow,
        landAdjustments,
        isLoadingAdjustments,
        currentAdjustments,
        visibleIcons,
        subclassRates,
        isLoadingRates,
        
        // Handlers
        handleBack,
        onSubmit,
        handleIconClick,
        handleUpdateIconClick,
        handleModalDismiss,
        handleUpdateModalDismiss,
        handleRowClick,
        handleDeleteConfirm,
        showToastMessage,
        setDescription,
        setAdjustmentFactor,
        setShowDeleteAlert,
        setAdjustmentToDelete
    };
};