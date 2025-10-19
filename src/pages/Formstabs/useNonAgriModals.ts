// src/pages/hooks/useNonAgriModals.ts
import { useState } from "react";
import { NonAgriAdjustmentLocalStorage } from '../../utils/tablestorages/NonAgriAdjustmentLocalStorage';

interface UseNonAgriModalsProps {
    selectedRow: any;
    valueInfoId: string;
    landAdjustments: any[];
    currentAdjustments: any[];
    triggerRateRecalculation: () => void;
    loadLandAdjustments: () => void;
}

export const useNonAgriModals = ({
    selectedRow,
    valueInfoId,
    landAdjustments,
    currentAdjustments,
    triggerRateRecalculation,
    loadLandAdjustments
}: UseNonAgriModalsProps) => {
    // Modal states
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
    const [showUpdateAdjustmentModal, setShowUpdateAdjustmentModal] = useState(false);
    const [showStrippingModal, setShowStrippingModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
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

    const handleIconClick = (adjustmentType: string) => {
        if (adjustmentType === 'Delete') {
            if (selectedRow) {
                setAdjustmentToDelete(selectedRow);
                setShowDeleteAlert(true);
            }
        } else if (adjustmentType === 'Stripping') {
            setSelectedAdjustmentType(adjustmentType);
            setDescription('');
            setAdjustmentFactor('');
            setAdditionalFactor('');
            setShowStrippingModal(true);
        } else {
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
        triggerRateRecalculation();
    };

    const handleUpdateModalDismiss = () => {
        setShowUpdateAdjustmentModal(false);
        setSelectedAdjustmentForUpdate(null);
        setSelectedAdjustmentType('');
        setDescription('');
        setAdjustmentFactor('');
        setAdditionalFactor('');
        loadLandAdjustments();
        triggerRateRecalculation();
    };

    const handleStrippingModalDismiss = () => {
        setShowStrippingModal(false);
        setSelectedAdjustmentForUpdate(null);
        setSelectedAdjustmentType('');
        setDescription('');
        setAdjustmentFactor('');
        setAdditionalFactor('');
        loadLandAdjustments();
        triggerRateRecalculation();
    };

    const handleDeleteConfirm = () => {
        if (adjustmentToDelete) {
            // Check if it's a stripping adjustment and validate deletion order
            if (adjustmentToDelete.adjustment_type === 'Stripping') {
                const strippingAdjustments = currentAdjustments.filter(
                    adj => adj.adjustment_type === 'Stripping'
                );
                
                if (strippingAdjustments.length > 1) {
                    const getStripNumber = (adj: any) => {
                        const match = adj.adjustmentId?.match(/S(\d+)/);
                        return match ? parseInt(match[1]) : 0;
                    };

                    const existingStripNumbers = strippingAdjustments.map(getStripNumber);
                    const highestStripNumber = Math.max(...existingStripNumbers);
                    const adjustmentStripNumber = getStripNumber(adjustmentToDelete);
                    
                    if (adjustmentStripNumber !== highestStripNumber) {
                        const sortedStrips = [...existingStripNumbers].sort((a, b) => a - b);
                        const existingStripsText = sortedStrips.map(num => `S${num}`).join(', ');
                        
                        setReverseDeleteWarningMessage(`You can only delete the highest strip first. Existing strips: ${existingStripsText}. Please delete S${highestStripNumber} first.`);
                        setShowReverseDeleteWarning(true);
                        
                        setShowDeleteAlert(false);
                        setAdjustmentToDelete(null);
                        return;
                    }
                }
            }

            const success = NonAgriAdjustmentLocalStorage.deleteNonAgriAdjustment(
                valueInfoId,
                adjustmentToDelete.adjustmentId
            );

            if (success) {
                loadLandAdjustments();
                triggerRateRecalculation();
            }
        }
        setShowDeleteAlert(false);
        setAdjustmentToDelete(null);
    };

    return {
        // State
        showAdjustmentModal,
        showUpdateAdjustmentModal,
        showStrippingModal,
        showInfoModal,
        setShowInfoModal,
        selectedAdjustmentType,
        description,
        setDescription,
        adjustmentFactor,
        setAdjustmentFactor,
        additionalFactor,
        setAdditionalFactor,
        selectedAdjustmentForUpdate,
        showDeleteAlert,
        setShowDeleteAlert,
        adjustmentToDelete,
        setAdjustmentToDelete,
        showReverseDeleteWarning,
        setShowReverseDeleteWarning,
        reverseDeleteWarningMessage,
        setReverseDeleteWarningMessage,

        // Handlers
        handleIconClick,
        handleUpdateIconClick,
        handleModalDismiss,
        handleUpdateModalDismiss,
        handleStrippingModalDismiss,
        handleDeleteConfirm
    };
};