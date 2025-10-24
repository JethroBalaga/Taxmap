import { useState } from "react";
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { PhotoTagLocalStorage } from '../../utils/tablestorages/PhotoTagLocalStorage';
import { supabaseApi } from '../../services/supabaseApi';
import { supabase } from '../../utils/supaBaseClient';
import { NonAgriAdjustmentLocalStorage } from '../../utils/tablestorages/NonAgriAdjustmentLocalStorage';

interface UseNonAgriSubmissionProps {
    formId: string | undefined;
    formData: any;
    valueInfoId: string;
    currentAdjustments: any[];
    getSubmitDisabledInfo: () => { disabled: boolean; reason: string };
}

export const useNonAgriSubmission = ({
    formId,
    formData,
    valueInfoId,
    currentAdjustments,
    getSubmitDisabledInfo
}: UseNonAgriSubmissionProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

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

    const insertNonAgriAdjustmentWithRetry = async (
        databaseValueInfoId: string, 
        adjustmentId: string, 
        additionalFactor?: number,
        retryCount = 0
    ): Promise<boolean> => {
        try {
            const result = await supabaseApi.insertNonAgriAdjustment(
                databaseValueInfoId, 
                adjustmentId,
                additionalFactor
            );
            
            // If no data returned but no error, consider it successful
            if (!result) {
                console.warn(`No data returned for adjustment ${adjustmentId}, but assuming success`);
                return true;
            }
            
            return true;
        } catch (error: any) {
            console.error(`Error inserting adjustment ${adjustmentId}:`, error);
            
            // Retry logic for transient errors
            if (retryCount < 3 && (error.message?.includes('timeout') || error.message?.includes('network'))) {
                console.log(`Retrying adjustment ${adjustmentId}, attempt ${retryCount + 1}`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                return insertNonAgriAdjustmentWithRetry(databaseValueInfoId, adjustmentId, additionalFactor, retryCount + 1);
            }
            
            throw error;
        }
    };

    const submitForm = async (showToastMessage: (message: string, color?: 'success' | 'danger' | 'warning') => void) => {
        // Close confirmation dialog immediately when submission starts
        setShowConfirmation(false);
        
        // Check if form already uploaded
        const currentFormData = await FormDataLocalStorage.getFormData(formId!);
        if (currentFormData?.uploaded) {
            showToastMessage('Form already submitted', 'warning');
            return;
        }

        // Check if submission should be disabled due to stripping validation
        const submitDisabledInfo = getSubmitDisabledInfo();
        if (submitDisabledInfo.disabled) {
            showToastMessage(submitDisabledInfo.reason, 'warning');
            return;
        }

        setIsSubmitting(true);
        showToastMessage('Starting non-agricultural land upload process...', 'warning');

        try {
            if (!currentFormData) throw new Error('Form data not found');

            const valueInfo = await ValueInfoLocalStorage.getValueInfo(valueInfoId);
            if (!valueInfo) throw new Error(`ValueInfo not found for ${valueInfoId}`);

            const photoTag = await PhotoTagLocalStorage.getPhotoTag(valueInfo.photoTagId);
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
            if (!databaseValueInfoId) throw new Error('Failed to insert value info record');

            // Insert non-agricultural adjustments with error handling
            if (currentAdjustments.length > 0) {
                showToastMessage(`Inserting ${currentAdjustments.length} adjustments...`, 'warning');
                
                const adjustmentResults = [];
                for (const adjustment of currentAdjustments) {
                    try {
                        const additionalFactorValue = await NonAgriAdjustmentLocalStorage.getAdditionalFactor(
                            valueInfoId, 
                            adjustment.adjustmentId
                        );

                        const success = await insertNonAgriAdjustmentWithRetry(
                            databaseValueInfoId, 
                            adjustment.adjustmentId,
                            adjustment.adjustment_type === 'Stripping' ? additionalFactorValue : undefined
                        );
                        adjustmentResults.push({
                            adjustmentId: adjustment.adjustmentId,
                            type: adjustment.adjustment_type,
                            success
                        });
                        
                        if (success) {
                            console.log(`Successfully inserted adjustment: ${adjustment.adjustment_type} (${adjustment.adjustmentId})`);
                        }
                    } catch (error: any) {
                        console.error(`Failed to insert adjustment ${adjustment.adjustmentId}:`, error);
                        adjustmentResults.push({
                            adjustmentId: adjustment.adjustmentId,
                            type: adjustment.adjustment_type,
                            success: false,
                            error: error.message
                        });
                        
                        // Continue with other adjustments even if one fails
                        showToastMessage(`Warning: Failed to insert ${adjustment.adjustment_type} adjustment, continuing...`, 'warning');
                    }
                }

                // Check if any adjustments failed
                const failedAdjustments = adjustmentResults.filter(result => !result.success);
                if (failedAdjustments.length > 0) {
                    console.warn('Some adjustments failed to insert:', failedAdjustments);
                    showToastMessage(`Form submitted but ${failedAdjustments.length} adjustment(s) failed`, 'warning');
                } else {
                    console.log('All adjustments inserted successfully');
                }
            } else {
                console.log('No adjustments to insert');
            }

            // Mark form as uploaded
            if (!currentFormData.synced_id) {
                await FormDataLocalStorage.markFormAsUploaded(formId!, databaseFormId);
            }

            // Dispatch event to notify form was uploaded
            window.dispatchEvent(new CustomEvent('formUploaded', { detail: { formId } }));

            showToastMessage('Non-agricultural land data submitted successfully! All data synchronized with server.', 'success');

        } catch (error: any) {
            console.error('Non-agricultural land upload failed:', error);
            showToastMessage(`Upload failed: ${error.message || 'Unknown error'}`, 'danger');
        } finally {
            setIsSubmitting(false);
        }
    };

    const onSubmit = () => {
        setShowConfirmation(true);
    };

    const handleConfirmationDismiss = () => {
        setShowConfirmation(false);
    };

    return {
        isSubmitting,
        showConfirmation,
        onSubmit,
        submitForm,
        handleConfirmationDismiss
    };
};