// src/components/BuildingAdjustmentModal.tsx
import React, { useState, useEffect } from 'react';
import {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonButtons,
    IonAlert
} from '@ionic/react';
import { close } from 'ionicons/icons';
import { BuildingAdjustmentLocalStorage, BuildingAdjustmentData } from '../../utils/tablestorages/BuildingAdjustmentLocalStorage';
import { getBuildingComponentData, BuildingComponentData } from '../../utils/buildingComponentLocalStorage';
import { getBuildingSubcomponentByBuildingComId, BuildingSubcomponentData } from '../../utils/BuildingSubcomponentLocalStorage';
import BuildingAdjustmentForm from './BuildingAdjustmentForm';
import BuildingAdjustmentCalculations from './BuildingAdjustmentCalculations';
import './../../CSS/modal.css';

interface BuildingAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    valueInfoId: string;
    existingData?: BuildingAdjustmentData | null;
    onSaveSuccess?: () => void;
    initialArea?: number;
}

const BuildingAdjustmentModal: React.FC<BuildingAdjustmentModalProps> = ({
    isOpen,
    onClose,
    valueInfoId,
    existingData,
    onSaveSuccess,
    initialArea = 0
}) => {
    const [formData, setFormData] = useState({
        Maincomponent: '',
        buidlingsubcomponent: '',
        description: '',
        completion_percent: '',
        depraciation: '',
        area: initialArea.toString()
    });

    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [buildingComponents, setBuildingComponents] = useState<BuildingComponentData[]>([]);
    const [buildingSubcomponents, setBuildingSubcomponents] = useState<BuildingSubcomponentData[]>([]);
    const [isLoadingComponents, setIsLoadingComponents] = useState(false);
    const [isLoadingSubcomponents, setIsLoadingSubcomponents] = useState(false);
    const [selectedSubcomponentRate, setSelectedSubcomponentRate] = useState<number | null>(null);
    const [marketValue, setMarketValue] = useState<number | null>(null);
    const [adjustedValue, setAdjustedValue] = useState<number | null>(null);
    const [isSaveEnabled, setIsSaveEnabled] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadBuildingComponents();
        }
    }, [isOpen]);

    useEffect(() => {
        if (existingData) {
            setFormData({
                Maincomponent: existingData.Maincomponent || '',
                buidlingsubcomponent: existingData.buidlingsubcomponent || '',
                description: existingData.description || '',
                completion_percent: existingData.completion_percent || '',
                depraciation: existingData.depraciation || '',
                area: existingData.area.toString()
            });
            if (existingData.Maincomponent) {
                loadBuildingSubcomponents(existingData.Maincomponent);
                if (existingData.buidlingsubcomponent) {
                    findAndDisplayRate(existingData.buidlingsubcomponent);
                }
            }
        } else {
            setFormData({
                Maincomponent: '',
                buidlingsubcomponent: '',
                description: '',
                completion_percent: '',
                depraciation: '',
                area: initialArea.toString()
            });
        }
    }, [existingData, isOpen, initialArea]);

    useEffect(() => {
        const requiredFieldsFilled =
            formData.Maincomponent.trim() !== '' &&
            formData.buidlingsubcomponent.trim() !== '' &&
            formData.description.trim() !== '' && // NEW: Add this check for the description field
            formData.area.trim() !== '' &&
            parseFloat(formData.area) > 0 &&
            formData.completion_percent.trim() !== '' &&
            !isNaN(parseFloat(formData.completion_percent)) &&
            parseFloat(formData.completion_percent) >= 0 &&
            parseFloat(formData.completion_percent) <= 100;
        setIsSaveEnabled(requiredFieldsFilled);
    }, [formData]);

    useEffect(() => {
        calculateValues();
    }, [selectedSubcomponentRate, formData.area, formData.completion_percent, formData.depraciation]);

    const calculateValues = () => {
        const areaValue = parseFloat(formData.area) || 0;
        const completionDecimal = parseFloat(formData.completion_percent) / 100;
        const depreciationDecimal = parseFloat(formData.depraciation) / 100;

        let calculatedMarketValue: number | null = null;
        let calculatedAdjustedValue: number | null = null;

        if (selectedSubcomponentRate !== null && areaValue > 0) {
            calculatedMarketValue = selectedSubcomponentRate * areaValue;
            if (completionDecimal >= 0) {
                calculatedMarketValue *= completionDecimal;
            }
        }

        if (calculatedMarketValue !== null) {
            calculatedAdjustedValue = calculatedMarketValue;
            if (depreciationDecimal >= 0) {
                calculatedAdjustedValue = calculatedMarketValue * (1 - depreciationDecimal);
            }
        }

        setMarketValue(calculatedMarketValue);
        setAdjustedValue(calculatedAdjustedValue);
    };

    const loadBuildingComponents = async () => {
        setIsLoadingComponents(true);
        try {
            const components = await getBuildingComponentData();
            if (components) setBuildingComponents(components);
        } catch (error) {
            console.error('Error loading building components:', error);
            setAlertMessage('Error loading components. Please try again.');
            setShowAlert(true);
        } finally {
            setIsLoadingComponents(false);
        }
    };

    const loadBuildingSubcomponents = async (buildingComId: string) => {
        setIsLoadingSubcomponents(true);
        try {
            const subcomponents = await getBuildingSubcomponentByBuildingComId(buildingComId);
            setBuildingSubcomponents(subcomponents || []);
        } catch (error) {
            console.error('Error loading building subcomponents:', error);
            setBuildingSubcomponents([]);
        } finally {
            setIsLoadingSubcomponents(false);
        }
    };

    const findAndDisplayRate = (subcomponentId: string) => {
        const subcomponent = buildingSubcomponents.find(sub => sub.building_subcom_id === subcomponentId);
        setSelectedSubcomponentRate(subcomponent ? subcomponent.rate : null);
    };

    const handleFormChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleMainComponentChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            Maincomponent: value,
            buidlingsubcomponent: '' // Reset subcomponent
        }));
        setSelectedSubcomponentRate(null);
        setMarketValue(null);
        setAdjustedValue(null);
        if (value) {
            loadBuildingSubcomponents(value);
        } else {
            setBuildingSubcomponents([]);
        }
    };

    const handleSubcomponentChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            buidlingsubcomponent: value
        }));
        findAndDisplayRate(value);
    };

    const handleSave = () => {
        if (!isSaveEnabled) {
            setAlertMessage('Please fill out all required fields and ensure values are valid.');
            setShowAlert(true);
            return;
        }

        try {
            const adjustmentData: BuildingAdjustmentData = {
                bldg_adjustment_id: existingData?.bldg_adjustment_id || `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                Maincomponent: formData.Maincomponent,
                buidlingsubcomponent: formData.buidlingsubcomponent,
                description: formData.description,
                completion_percent: formData.completion_percent,
                depraciation: formData.depraciation,
                area: parseFloat(formData.area),
                value_info_id: valueInfoId,
            };

            BuildingAdjustmentLocalStorage.saveBuildingAdjustmentData(adjustmentData);

            setAlertMessage(existingData ? 'Building adjustment updated successfully!' : 'Building adjustment added successfully!');
            setShowAlert(true);

            if (onSaveSuccess) {
                onSaveSuccess();
            }
        } catch (error) {
            console.error('Error saving building adjustment:', error);
            setAlertMessage('Error saving building adjustment. Please try again.');
            setShowAlert(true);
        }
    };

    const handleClose = () => {
        setFormData({
            Maincomponent: '',
            buidlingsubcomponent: '',
            description: '',
            completion_percent: '',
            depraciation: '',
            area: initialArea.toString()
        });
        setSelectedSubcomponentRate(null);
        setMarketValue(null);
        setAdjustedValue(null);
        onClose();
    };

    return (
        <>
            <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="custom-wide-modal">
                <IonHeader>
                    <IonToolbar className="fancy-header">
                        <IonTitle className="fancy-title">
                            {existingData ? 'Edit Building Adjustment' : 'Add Building Adjustment'}
                        </IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={handleClose} fill="clear" className="fancy-close-btn">
                                <IonIcon icon={close} slot="icon-only" />
                            </IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="modal-content">
                    <BuildingAdjustmentForm
                        formData={formData}
                        handleFormChange={handleFormChange}
                        handleMainComponentChange={handleMainComponentChange}
                        handleSubcomponentChange={handleSubcomponentChange}
                        buildingComponents={buildingComponents}
                        buildingSubcomponents={buildingSubcomponents}
                        isLoadingComponents={isLoadingComponents}
                        isLoadingSubcomponents={isLoadingSubcomponents}
                        selectedSubcomponentRate={selectedSubcomponentRate}
                        valueInfoId={valueInfoId}
                    />
                    <BuildingAdjustmentCalculations
                        marketValue={marketValue}
                        adjustedValue={adjustedValue}
                        selectedSubcomponentRate={selectedSubcomponentRate}
                        formData={formData}
                    />
                    <div className="next-btn-container">
                        <IonButton
                            onClick={handleSave}
                            className="next-button"
                            expand="block"
                            disabled={!isSaveEnabled}
                        >
                            {existingData ? 'Update' : 'Save'} Adjustment
                        </IonButton>
                    </div>
                </IonContent>
            </IonModal>

            <IonAlert
                isOpen={showAlert}
                onDidDismiss={() => setShowAlert(false)}
                header={alertMessage.includes('Error') ? 'Error' : 'Success'}
                message={alertMessage}
                buttons={['OK']}
            />
        </>
    );
};

export default BuildingAdjustmentModal;