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

    // UI state - these are now synchronous state values
    const [visibleIcons, setVisibleIcons] = useState(adjustmentIcons);
    const [submitDisabledInfo, setSubmitDisabledInfo] = useState({ disabled: false, reason: '' });
    const [strippingInfo, setStrippingInfo] = useState({ 
        currentCount: 0, 
        nextNumber: 1, 
        hasStripping: false, 
        canAddMore: false, 
        remainingArea: 0, 
        totalStripArea: 0 
    });

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

    // Create a synchronous version of getSubmitDisabledInfo for the submission hook
    const getSubmitDisabledInfoSync = useCallback((): { disabled: boolean; reason: string } => {
        return submitDisabledInfo;
    }, [submitDisabledInfo]);

    const submission = useNonAgriSubmission({
        formId,
        formData,
        valueInfoId,
        currentAdjustments: calculations.currentAdjustments,
        getSubmitDisabledInfo: getSubmitDisabledInfoSync
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

            try {
                // ALWAYS load from localStorage to get the latest data
                const storedFormData = await FormDataLocalStorage.getFormData(formId);
                console.log('Loaded form data from localStorage:', storedFormData);
                setFormData(storedFormData);

                // Fetch or create ValueInfo for this formId using the stored form data
                if (storedFormData) {
                    let valueInfo = await ValueInfoLocalStorage.getValueInfoByFormDataId(formId);
                    if (!valueInfo) {
                        valueInfo = await ValueInfoLocalStorage.addValueInfo({
                            formDataId: formId,
                            photoTagId: ''
                        });
                    }
                    setValueInfoId(valueInfo.id);
                }
            } catch (error) {
                console.error('Error loading form data:', error);
                showToastMessage('Error loading form data', 'danger');
            } finally {
                setIsLoading(false);
            }

            if (!formData) {
                showToastMessage('Form not found', 'danger');
            }
        }
    };

    // Update stripping info and UI when calculations change
    const updateStrippingInfoAndUI = useCallback(async () => {
        try {
            const newStrippingInfo = await calculations.getStrippingInfo();
            setStrippingInfo(newStrippingInfo);
            
            const newSubmitDisabledInfo = await calculations.getSubmitDisabledInfo();
            setSubmitDisabledInfo(newSubmitDisabledInfo);
            
            await updateVisibleIcons(newStrippingInfo);
        } catch (error) {
            console.error('Error updating stripping info:', error);
        }
    }, [calculations]);

    // Update visible icons based on current state
    const updateVisibleIcons = useCallback(async (currentStrippingInfo: any) => {
        const classification = formData?.classification;
        if (!classification) {
            setVisibleIcons(adjustmentIcons);
            return;
        }

        const classificationFilteredIcons = adjustmentIcons.filter(icon => !icon.hideFor.includes(classification));

        // Update the stripping icon label
        const updatedIcons = await Promise.all(
            classificationFilteredIcons.map(async (icon) => {
                if (icon.adjustmentType === 'Stripping') {
                    const label = await calculations.getStrippingIconLabel();
                    return {
                        ...icon,
                        label
                    };
                }
                return icon;
            })
        );

        const { canAddMore } = currentStrippingInfo;
        const hasCornerInfluence = calculations.hasCornerInfluence;
        const hasStripping = calculations.hasStripping;

        // Mutual exclusion: Hide Stripping if Corner Influence exists, and vice versa
        // Also hide stripping if max strips reached
        const filteredIcons = updatedIcons.filter(icon => {
            if (icon.adjustmentType === 'Stripping') {
                if (!canAddMore) return false;
                if (hasCornerInfluence) return false;
            }
            if (icon.adjustmentType === 'Corner Influence' && hasStripping) {
                return false;
            }
            return true;
        });

        setVisibleIcons(filteredIcons);
    }, [formData, calculations]);

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

    // Update UI when calculations change
    useEffect(() => {
        updateStrippingInfoAndUI();
    }, [calculations.currentAdjustments, calculations.hasCornerInfluence, calculations.hasStripping, updateStrippingInfoAndUI]);

    // Listen for form data updates from Forms page - FIXED VERSION
    useEffect(() => {
        const handleFormDataUpdate = (event: CustomEvent) => {
            if (event.detail && event.detail.formId === formId) {
                console.log('Form data updated, reloading form data...');
                loadFormData(); // Remove await - just call the function
            }
        };

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'formUpdateTrigger') {
                console.log('Form update detected via localStorage, reloading form data...');
                loadFormData(); // Remove await - just call the function
            }
        };

        window.addEventListener('formDataUpdated', handleFormDataUpdate as EventListener);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('formDataUpdated', handleFormDataUpdate as EventListener);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [formId]);

    const handleBack = () => {
        history.push('/menu/forms');
    };

    const handleRowClick = (rowData: any) => {
        setSelectedRow(rowData);
    };

    const onSubmit = () => {
        submission.onSubmit(showToastMessage);
    };

    // Create synchronous versions for the UI components
    const getStrippingInfoSync = useCallback(() => {
        return strippingInfo;
    }, [strippingInfo]);

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
        getStrippingInfo: getStrippingInfoSync, // Use synchronous version
        getStrippingAdjustment: calculations.getStrippingAdjustment,
        showReverseDeleteWarning: modals.showReverseDeleteWarning,
        setShowReverseDeleteWarning: modals.setShowReverseDeleteWarning,
        reverseDeleteWarningMessage: modals.reverseDeleteWarningMessage,
        submitDisabledInfo, // This is now a synchronous state value

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