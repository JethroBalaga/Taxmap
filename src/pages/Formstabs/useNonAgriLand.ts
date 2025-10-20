// src/pages/useNonAgriLand.tsx
import { useState, useEffect, useCallback } from "react";
import { useHistory } from 'react-router-dom';
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { LandAdjustmentData, getLandAdjustmentData } from '../../utils/landAdjustmentLocalStorage';
import { useNonAgriCalculations } from './useNonAgriCalculations';
import { useNonAgriModals } from './useNonAgriModals';
import { useNonAgriSubmission } from './useNonAgriSubmission';

// Icons configuration array
const adjustmentIcons = [
    {
        icon: 'cutOutline',
        label: "Add 1st Strip",
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

    // Core state
    const [formData, setFormData] = useState<any>(null);
    const [valueInfoId, setValueInfoId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning' | undefined>(undefined);

    // Land adjustments data
    const [landAdjustments, setLandAdjustments] = useState<LandAdjustmentData[]>([]);
    const [isLoadingAdjustments, setIsLoadingAdjustments] = useState(false);

    // Selected row state
    const [selectedRow, setSelectedRow] = useState<any>(null);

    // Define loadLandAdjustments with useCallback to prevent infinite re-renders
    const loadLandAdjustments = useCallback(async () => {
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
    }, []);

    // Use custom hooks for different concerns
    const calculations = useNonAgriCalculations({
        formData,
        valueInfoId,
        landAdjustments
    });

    const modals = useNonAgriModals({
        selectedRow,
        valueInfoId,
        landAdjustments,
        currentAdjustments: calculations.currentAdjustments,
        triggerRateRecalculation: calculations.triggerRateRecalculation,
        loadLandAdjustments
    });

    const submission = useNonAgriSubmission({
        formId,
        formData,
        valueInfoId,
        currentAdjustments: calculations.currentAdjustments,
        getSubmitDisabledInfo: calculations.getSubmitDisabledInfo
    });

    const showToastMessage = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
        setToastMessage(message);
        setToastColor(color);
        setShowToast(true);
    };

    const loadFormData = async () => {
        if (formId) {
            setIsLoading(true);
            console.log('Loading non-agricultural land form data for ID:', formId);

            // ALWAYS load from localStorage to get the latest data
            const storedFormData = await FormDataLocalStorage.getFormData(formId); // Added await
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

    // Load adjustments when landAdjustments or valueInfoId changes
    useEffect(() => {
        if (valueInfoId && landAdjustments.length > 0) {
            console.log('Loading adjustments due to landAdjustments or valueInfoId change');
            calculations.loadSubclassRates();
        }
    }, [landAdjustments, valueInfoId, calculations.adjustmentsVersion]);

    useEffect(() => {
        loadFormData();
        loadLandAdjustments();
    }, [formId]);

    // Load subclass rates when formData changes
    useEffect(() => {
        if (formData?.subclass && valueInfoId) {
            calculations.loadSubclassRates();
        }
    }, [formData?.subclass, formData?.area]);

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

    // Filter icons based on classification AND mutual exclusion rules
    const getVisibleIcons = () => {
        const classification = formData?.classification;
        if (!classification) return adjustmentIcons;

        const classificationFilteredIcons = adjustmentIcons.filter(icon => !icon.hideFor.includes(classification));

        // Update the stripping icon label
        const updatedIcons = classificationFilteredIcons.map(icon => {
            if (icon.adjustmentType === 'Stripping') {
                return {
                    ...icon,
                    label: calculations.getStrippingIconLabel()
                };
            }
            return icon;
        });

        const { canAddMore } = calculations.getStrippingInfo();
        const hasCornerInfluence = calculations.hasCornerInfluence;
        const hasStripping = calculations.hasStripping;

        // Mutual exclusion: Hide Stripping if Corner Influence exists, and vice versa
        // Also hide stripping if max strips reached
        return updatedIcons.filter(icon => {
            if (icon.adjustmentType === 'Stripping') {
                if (!canAddMore) return false;
                if (hasCornerInfluence) return false;
            }
            if (icon.adjustmentType === 'Corner Influence' && hasStripping) {
                return false;
            }
            return true;
        });
    };

    const visibleIcons = getVisibleIcons();
    const submitDisabledInfo = calculations.getSubmitDisabledInfo();

    const handleBack = () => {
        history.push('/menu/forms');
    };

    const handleRowClick = (rowData: any) => {
        setSelectedRow(rowData);
    };

    const onSubmit = () => {
        submission.onSubmit(showToastMessage);
    };

    return {
        // State
        formData,
        valueInfoId,
        isLoading,
        showToast,
        toastMessage,
        toastColor,
        isSubmitting: submission.isSubmitting,
        showAdjustmentModal: modals.showAdjustmentModal,
        showUpdateAdjustmentModal: modals.showUpdateAdjustmentModal,
        showStrippingModal: modals.showStrippingModal,
        showInfoModal: modals.showInfoModal,
        setShowInfoModal: modals.setShowInfoModal,
        selectedAdjustmentType: modals.selectedAdjustmentType,
        description: modals.description,
        adjustmentFactor: modals.adjustmentFactor,
        additionalFactor: modals.additionalFactor,
        selectedAdjustmentForUpdate: modals.selectedAdjustmentForUpdate,
        showDeleteAlert: modals.showDeleteAlert,
        adjustmentToDelete: modals.adjustmentToDelete,
        selectedRow,
        landAdjustments,
        isLoadingAdjustments,
        currentAdjustments: calculations.currentAdjustments,
        visibleIcons,
        subclassRates: calculations.subclassRates,
        isLoadingRates: calculations.isLoadingRates,
        hasCornerInfluence: calculations.hasCornerInfluence,
        hasStripping: calculations.hasStripping,
        getStrippingInfo: calculations.getStrippingInfo,
        getStrippingAdjustment: calculations.getStrippingAdjustment,
        showReverseDeleteWarning: modals.showReverseDeleteWarning,
        setShowReverseDeleteWarning: modals.setShowReverseDeleteWarning,
        reverseDeleteWarningMessage: modals.reverseDeleteWarningMessage,
        submitDisabledInfo,

        // Handlers
        handleBack,
        onSubmit,
        handleIconClick: modals.handleIconClick,
        handleUpdateIconClick: modals.handleUpdateIconClick,
        handleModalDismiss: modals.handleModalDismiss,
        handleUpdateModalDismiss: modals.handleUpdateModalDismiss,
        handleStrippingModalDismiss: modals.handleStrippingModalDismiss,
        handleRowClick,
        handleDeleteConfirm: modals.handleDeleteConfirm,
        showToastMessage,
        setDescription: modals.setDescription,
        setAdjustmentFactor: modals.setAdjustmentFactor,
        setAdditionalFactor: modals.setAdditionalFactor,
        setShowDeleteAlert: modals.setShowDeleteAlert,
        setAdjustmentToDelete: modals.setAdjustmentToDelete
    };
};