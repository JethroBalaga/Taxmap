// src/pages/useNonAgriLand.tsx
import { useState, useEffect, useMemo } from "react";
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
    const [showStrippingModal, setShowStrippingModal] = useState(false);
    const [selectedAdjustmentType, setSelectedAdjustmentType] = useState('');
    const [description, setDescription] = useState('');
    const [adjustmentFactor, setAdjustmentFactor] = useState('');
    const [additionalFactor, setAdditionalFactor] = useState('');
    const [selectedAdjustmentForUpdate, setSelectedAdjustmentForUpdate] = useState<any>(null);

    // Alert state for delete confirmation
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [adjustmentToDelete, setAdjustmentToDelete] = useState<any>(null);

    // Reverse deletion warning state
    const [showReverseDeleteWarning, setShowReverseDeleteWarning] = useState(false);
    const [reverseDeleteWarningMessage, setReverseDeleteWarningMessage] = useState('');

    // Selected row state
    const [selectedRow, setSelectedRow] = useState<any>(null);

    // Land adjustments data
    const [landAdjustments, setLandAdjustments] = useState<LandAdjustmentData[]>([]);
    const [isLoadingAdjustments, setIsLoadingAdjustments] = useState(false);

    // Subclass rates data
    const [subclassRates, setSubclassRates] = useState<any[]>([]);
    const [isLoadingRates, setIsLoadingRates] = useState(false);

    // Current adjustments with calculations
    const [currentAdjustments, setCurrentAdjustments] = useState<any[]>([]);

    // Track adjustments changes to trigger rate recalculations
    const [adjustmentsVersion, setAdjustmentsVersion] = useState(0);

    const showToastMessage = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
        setToastMessage(message);
        setToastColor(color);
        setShowToast(true);
    };

    // Add calculation function for value adjustments
    const calculateValueAdjustment = (adjustmentType: string, adjustmentFactor: string, rate: number, area: number, additionalFactor?: number): string => {
        if (!adjustmentFactor || !rate) {
            return 'N/A';
        }

        try {
            const factor = parseFloat(adjustmentFactor) / 100; // Convert to percentage

            switch (adjustmentType) {
                case 'Corner Influence':
                    // Corner Influence: Rate × Adjustment Factor × Area
                    return (rate * factor * area).toFixed(2);

                case 'Stripping':
                    // Stripping: Rate × Adjustment Factor × Strip Area (Additional Factor)
                    const stripArea = additionalFactor || 0;
                    return (rate * factor * stripArea).toFixed(2);

                case 'Commercial Frontage':
                    // Commercial Frontage: First Value = Rate - 50%, then Value Adjustment = Adjustment Factor × First Value
                    const firstValue = rate * 0.5; // Rate - 50% means Rate × 50%
                    return (factor * firstValue).toFixed(2);

                default:
                    return 'N/A';
            }
        } catch (error) {
            console.error('Error calculating value adjustment:', error);
            return 'N/A';
        }
    };

    // Calculate base market value: Area × Rate
    const calculateBaseMarketValue = (rate: number, area: number): string => {
        if (isNaN(rate) || isNaN(area) || rate <= 0 || area <= 0) {
            return 'N/A';
        }
        try {
            return (rate * area).toFixed(2);
        } catch (error) {
            console.error('Error calculating base market value:', error);
            return 'N/A';
        }
    };

    // Calculate adjustment market value: Base Market Value + sum of all Value Adjustments (except Stripping)
    const calculateAdjustmentMarketValue = (baseMarketValue: string, adjustments: any[]): string => {
        if (baseMarketValue === 'N/A') return 'N/A';
        
        try {
            const baseValue = parseFloat(baseMarketValue);
            if (isNaN(baseValue)) return 'N/A';

            // Sum all value adjustments except Stripping
            const totalAdjustments = adjustments.reduce((sum, adjustment) => {
                if (adjustment.adjustment_type !== 'Stripping' && adjustment.value_adjustment !== 'N/A') {
                    const adjustmentValue = parseFloat(adjustment.value_adjustment);
                    return sum + (isNaN(adjustmentValue) ? 0 : adjustmentValue);
                }
                return sum;
            }, 0);

            return (baseValue + totalAdjustments).toFixed(2);
        } catch (error) {
            console.error('Error calculating adjustment market value:', error);
            return 'N/A';
        }
    };

    // Calculate stripping market value: Sum of all Stripping Value Adjustments
    const calculateStrippingMarketValue = (adjustments: any[]): string => {
        try {
            const strippingAdjustments = adjustments.filter(
                adj => adj.adjustment_type === 'Stripping'
            );

            if (strippingAdjustments.length === 0) return 'N/A';

            const totalStrippingValue = strippingAdjustments.reduce((sum, adjustment) => {
                if (adjustment.value_adjustment !== 'N/A') {
                    const adjustmentValue = parseFloat(adjustment.value_adjustment);
                    return sum + (isNaN(adjustmentValue) ? 0 : adjustmentValue);
                }
                return sum;
            }, 0);

            return totalStrippingValue.toFixed(2);
        } catch (error) {
            console.error('Error calculating stripping market value:', error);
            return 'N/A';
        }
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

    // Get base adjustments data (without calculations) - FIXED: Additional factor only for Stripping
    const getBaseAdjustmentsData = () => {
        if (!valueInfoId || landAdjustments.length === 0) return [];

        const nonAgriAdjustments = NonAgriAdjustmentLocalStorage.getAdjustmentsByValueInfoId(valueInfoId);
        console.log('Base adjustments loaded:', nonAgriAdjustments);

        return nonAgriAdjustments.map(nonAgriAdj => {
            const landAdj = landAdjustments.find(adj => adj.adjustment_id === nonAgriAdj.adjustmentId);

            // Get additional factor from NonAgriAdjustmentLocalStorage
            const additionalFactorValue = NonAgriAdjustmentLocalStorage.getAdditionalFactor(
                valueInfoId, 
                nonAgriAdj.adjustmentId
            );

            // Create base adjustment object
            const adjustment = {
                adjustmentId: nonAgriAdj.adjustmentId,
                adjustment_type: landAdj?.adjustment_type || 'N/A',
                description: landAdj?.description || 'N/A',
                adjustment_factor: landAdj?.adjustment_factor ? `${landAdj.adjustment_factor}%` : 'N/A',
                value_adjustment: 'N/A' // Will be calculated
            };

            // ONLY add additional_factor property for Stripping adjustments
            if (landAdj?.adjustment_type === 'Stripping') {
                return {
                    ...adjustment,
                    additional_factor: additionalFactorValue ? additionalFactorValue.toLocaleString() : 'N/A'
                };
            }

            return adjustment;
        });
    };

    // Load subclass rates and calculate adjustments
    const loadSubclassRates = async () => {
        if (!formData?.subclass) return;

        setIsLoadingRates(true);
        try {
            const ratesData = await getSubclassRateData();
            if (ratesData) {
                // Get current rate for the form's subclass
                const apiRate = await getCurrentRateForSubclass(formData.subclass);
                const area = formData?.area || 0;

                // Ensure we have a string value
                const rateString = apiRate ? String(apiRate) : '0';
                // Safely parse to number
                const rateNumber = parseFloat(rateString);
                // Check if valid number
                const isValidRate = !isNaN(rateNumber) && isFinite(rateNumber) && rateNumber >= 0;

                const displayRate = isValidRate ? rateString : '0';
                const calculatedRate = isValidRate ? rateNumber : 0;

                // Calculate base market value
                const baseMarketValue = calculateBaseMarketValue(calculatedRate, area);
                
                // Get base adjustments data
                const baseAdjustments = getBaseAdjustmentsData();
                console.log('Base adjustments for calculation:', baseAdjustments);
                
                // Calculate value adjustments for all current adjustments using the actual API rate
                const adjustmentsWithCalculations = baseAdjustments.map(adj => {
                    const landAdj = landAdjustments.find(la => la.adjustment_id === adj.adjustmentId);
                    const additionalFactorValue = NonAgriAdjustmentLocalStorage.getAdditionalFactor(
                        valueInfoId, 
                        adj.adjustmentId
                    );

                    const valueAdjustment = calculateValueAdjustment(
                        adj.adjustment_type,
                        landAdj?.adjustment_factor || '',
                        calculatedRate,
                        area,
                        additionalFactorValue
                    );

                    // For non-Stripping adjustments, return without additional_factor
                    if (adj.adjustment_type !== 'Stripping') {
                        return {
                            ...adj,
                            value_adjustment: valueAdjustment
                        };
                    }

                    // For Stripping adjustments, include additional_factor
                    return {
                        ...adj,
                        value_adjustment: valueAdjustment,
                        additional_factor: additionalFactorValue ? additionalFactorValue.toLocaleString() : 'N/A'
                    };
                });

                // Update current adjustments with calculations
                setCurrentAdjustments(adjustmentsWithCalculations);
                console.log('Updated current adjustments:', adjustmentsWithCalculations);

                // Check if there are stripping adjustments
                const hasStripping = adjustmentsWithCalculations.some(adj => adj.adjustment_type === 'Stripping');
                
                let adjustmentMarketValue;
                
                if (hasStripping) {
                    // FOR STRIPPING: Adjusted Market Value = Sum of all Stripping Value Adjustments
                    adjustmentMarketValue = calculateStrippingMarketValue(adjustmentsWithCalculations);
                } else {
                    // FOR NON-STRIPPING: Adjusted Market Value = Base Market Value + Sum of all Value Adjustments
                    adjustmentMarketValue = calculateAdjustmentMarketValue(baseMarketValue, adjustmentsWithCalculations);
                }

                // Create the rate display data with both market values
                const rateDisplayData = [{
                    valueInfoId: valueInfoId,
                    rate: displayRate,
                    base_market_value: baseMarketValue,
                    adjustment_market_value: adjustmentMarketValue
                }];

                setSubclassRates(rateDisplayData);
                
                console.log('Rate Calculation:', {
                    rate: displayRate,
                    area: area,
                    baseMarketValue: baseMarketValue,
                    hasStripping: hasStripping,
                    adjustmentMarketValue: adjustmentMarketValue,
                    adjustments: adjustmentsWithCalculations.map(adj => ({
                        type: adj.adjustment_type,
                        value: adj.value_adjustment,
                        factor: adj.adjustment_factor,
                        hasAdditionalFactor: adj.adjustment_type === 'Stripping'
                    }))
                });
            }
        } catch (error) {
            console.error('Error loading subclass rates:', error);
            // Set default values on error
            setSubclassRates([{
                valueInfoId: valueInfoId,
                rate: '0',
                base_market_value: 'N/A',
                adjustment_market_value: 'N/A'
            }]);
            setCurrentAdjustments([]);
        } finally {
            setIsLoadingRates(false);
        }
    };

    // Increment adjustments version to trigger recalculations
    const triggerRateRecalculation = () => {
        setAdjustmentsVersion(prev => prev + 1);
    };

    // Load adjustments when landAdjustments or valueInfoId changes
    useEffect(() => {
        if (valueInfoId && landAdjustments.length > 0) {
            console.log('Loading adjustments due to landAdjustments or valueInfoId change');
            loadSubclassRates();
        }
    }, [landAdjustments, valueInfoId, adjustmentsVersion]);

    useEffect(() => {
        loadFormData();
        loadLandAdjustments();
    }, [formId]);

    // Load subclass rates when formData changes
    useEffect(() => {
        if (formData?.subclass && valueInfoId) {
            loadSubclassRates();
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

    // Check if adjustments exist
    const hasCornerInfluence = currentAdjustments.some(
        adj => adj.adjustment_type === 'Corner Influence'
    );

    const hasStripping = currentAdjustments.some(
        adj => adj.adjustment_type === 'Stripping'
    );

    // Get the next available stripping number and current stripping count
    const getStrippingInfo = () => {
        const strippingAdjustments = currentAdjustments.filter(
            adj => adj.adjustment_type === 'Stripping'
        );
        
        const currentCount = strippingAdjustments.length;
        const nextNumber = currentCount + 1;
        
        // Calculate remaining area after all strips - get directly from localStorage
        let totalStripArea = 0;
        
        if (strippingAdjustments.length > 0 && valueInfoId) {
            totalStripArea = strippingAdjustments.reduce((total, adj) => {
                if (adj.adjustmentId) {
                    const additionalFactorValue = NonAgriAdjustmentLocalStorage.getAdditionalFactor(
                        valueInfoId, 
                        adj.adjustmentId
                    );
                    if (additionalFactorValue) {
                        return total + additionalFactorValue;
                    }
                }
                return total;
            }, 0);
        }
        
        const remainingArea = Math.max(0, (formData?.area || 0) - totalStripArea);
        
        return {
            currentCount,
            nextNumber,
            hasStripping: currentCount > 0,
            canAddMore: currentCount < 4 && remainingArea > 0,
            remainingArea: remainingArea,
            totalStripArea: totalStripArea
        };
    };

    // Get the correct stripping adjustment ID based on strip number
    const getStrippingAdjustmentId = (stripNumber: number) => {
        // Assuming your land adjustments have IDs like S1, S2, S3, S4 for stripping
        return `S${stripNumber}`;
    };

    // Get the correct stripping adjustment based on strip number
    const getStrippingAdjustment = (stripNumber: number) => {
        const adjustmentId = getStrippingAdjustmentId(stripNumber);
        return landAdjustments.find(adj => adj.adjustment_id === adjustmentId) || null;
    };

    // Get icon label based on stripping sequence
    const getStrippingIconLabel = () => {
        const { nextNumber, canAddMore } = getStrippingInfo();
        
        if (!canAddMore) {
            return "Max Strips Reached";
        }
        
        switch (nextNumber) {
            case 1: return "Add 1st Strip";
            case 2: return "Add 2nd Strip";
            case 3: return "Add 3rd Strip";
            case 4: return "Add 4th Strip";
            default: return "Add Strip";
        }
    };

    // Add submit validation function
    const getSubmitDisabledInfo = (): { disabled: boolean; reason: string } => {
        const { currentCount, remainingArea } = getStrippingInfo();
        
        // If there are stripping adjustments and remaining area is NOT zero, disable submit
        if (currentCount > 0 && remainingArea !== 0) {
            return {
                disabled: true,
                reason: `Cannot submit while there are ${currentCount} strip(s) with ${remainingArea.toLocaleString()} remaining area. All strips must fully utilize the land area.`
            };
        }
        
        return {
            disabled: false,
            reason: ''
        };
    };

    const handleBack = () => {
        history.push('/menu/forms');
    };

    const onSubmit = async () => {
        // Check if submission should be disabled due to stripping validation
        const submitDisabledInfo = getSubmitDisabledInfo();
        if (submitDisabledInfo.disabled) {
            showToastMessage(submitDisabledInfo.reason, 'warning');
            return;
        }

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
        } else if (adjustmentType === 'Stripping') {
            // Special handling for Stripping - open specialized modal
            setSelectedAdjustmentType(adjustmentType);
            setDescription('');
            setAdjustmentFactor('');
            setAdditionalFactor('');
            setShowStrippingModal(true);
        } else {
            // Use generic modal for other adjustments
            setSelectedAdjustmentType(adjustmentType);
            setDescription('');
            setAdjustmentFactor('');
            setAdditionalFactor('');
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
        setAdjustmentFactor(existingAdj?.adjustment_factor?.replace('%', '') || '');
        if (adjustmentType === 'Stripping') {
            setShowStrippingModal(true);
        } else {
            setShowUpdateAdjustmentModal(true);
        }
    };

    const handleModalDismiss = () => {
        setShowAdjustmentModal(false);
        setSelectedAdjustmentType('');
        setDescription('');
        setAdjustmentFactor('');
        setAdditionalFactor('');
        loadLandAdjustments();
        triggerRateRecalculation(); // Trigger rate recalculation
    };

    const handleUpdateModalDismiss = () => {
        setShowUpdateAdjustmentModal(false);
        setSelectedAdjustmentForUpdate(null);
        setSelectedAdjustmentType('');
        setDescription('');
        setAdjustmentFactor('');
        setAdditionalFactor('');
        loadLandAdjustments();
        triggerRateRecalculation(); // Trigger rate recalculation
    };

    const handleStrippingModalDismiss = () => {
        setShowStrippingModal(false);
        setSelectedAdjustmentForUpdate(null);
        setSelectedAdjustmentType('');
        setDescription('');
        setAdjustmentFactor('');
        setAdditionalFactor('');
        loadLandAdjustments();
        triggerRateRecalculation(); // Trigger rate recalculation
    };

    const handleRowClick = (rowData: any) => {
        setSelectedRow(rowData);
    };

    const handleDeleteConfirm = () => {
        if (adjustmentToDelete) {
            // Check if it's a stripping adjustment and validate deletion order
            if (adjustmentToDelete.adjustment_type === 'Stripping') {
                const strippingAdjustments = currentAdjustments.filter(
                    adj => adj.adjustment_type === 'Stripping'
                );
                
                if (strippingAdjustments.length > 1) {
                    // Extract strip numbers from adjustment IDs (S1, S2, S3, S4)
                    const getStripNumber = (adj: any) => {
                        const match = adj.adjustmentId?.match(/S(\d+)/);
                        return match ? parseInt(match[1]) : 0;
                    };

                    // Get all existing strip numbers
                    const existingStripNumbers = strippingAdjustments.map(getStripNumber);
                    
                    // Find the highest strip number (the one that should be deleted first)
                    const highestStripNumber = Math.max(...existingStripNumbers);
                    
                    // Get the strip number of the adjustment to delete
                    const adjustmentStripNumber = getStripNumber(adjustmentToDelete);
                    
                    // Only allow deletion if it's the highest strip number (S2, then S1)
                    if (adjustmentStripNumber !== highestStripNumber) {
                        // Sort the existing strip numbers and format them
                        const sortedStrips = [...existingStripNumbers].sort((a, b) => a - b);
                        const existingStripsText = sortedStrips.map(num => `S${num}`).join(', ');
                        
                        // Use custom warning state
                        setReverseDeleteWarningMessage(`You can only delete the highest strip first. Existing strips: ${existingStripsText}. Please delete S${highestStripNumber} first.`);
                        setShowReverseDeleteWarning(true);
                        
                        // Reset states and deselect the row
                        setSelectedRow(null);
                        setShowDeleteAlert(false);
                        setAdjustmentToDelete(null);
                        return;
                    }
                }
            }

            // Use valueInfoId from the component's state
            const success = NonAgriAdjustmentLocalStorage.deleteNonAgriAdjustment(
                valueInfoId,
                adjustmentToDelete.adjustmentId
            );

            if (success) {
                showToastMessage(`${adjustmentToDelete.adjustment_type} adjustment deleted successfully`, 'success');
                setSelectedRow(null);
                loadLandAdjustments();
                triggerRateRecalculation(); // Trigger rate recalculation
            } else {
                showToastMessage('Error deleting adjustment', 'danger');
            }
        }
        setShowDeleteAlert(false);
        setAdjustmentToDelete(null);
    };

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
                    label: getStrippingIconLabel()
                };
            }
            return icon;
        });

        const { canAddMore } = getStrippingInfo();

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
    const submitDisabledInfo = getSubmitDisabledInfo();

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
        showStrippingModal,
        selectedAdjustmentType,
        description,
        adjustmentFactor,
        additionalFactor,
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
        hasCornerInfluence,
        hasStripping,
        getStrippingInfo,
        getStrippingAdjustment,
        showReverseDeleteWarning,
        setShowReverseDeleteWarning,
        reverseDeleteWarningMessage,
        setReverseDeleteWarningMessage,
        submitDisabledInfo,

        // Handlers
        handleBack,
        onSubmit,
        handleIconClick,
        handleUpdateIconClick,
        handleModalDismiss,
        handleUpdateModalDismiss,
        handleStrippingModalDismiss,
        handleRowClick,
        handleDeleteConfirm,
        showToastMessage,
        setDescription,
        setAdjustmentFactor,
        setAdditionalFactor,
        setShowDeleteAlert,
        setAdjustmentToDelete
    };
};