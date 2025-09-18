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
    IonAlert,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonLabel,
    IonText
} from '@ionic/react';
import { close } from 'ionicons/icons';
import { BuildingAdjustmentLocalStorage, BuildingAdjustmentData } from '../../utils/tablestorages/BuildingAdjustmentLocalStorage';
import { getBuildingComponentData, BuildingComponentData, getBuildingComponentById } from '../../utils/buildingComponentLocalStorage';
import { getBuildingSubcomponentByBuildingComId, BuildingSubcomponentData, getBuildingSubcomponentById } from '../../utils/BuildingSubcomponentLocalStorage';
import BuildingAdjustmentUpdateForm from './BuildingAdjustmentUpdateForm';
import './../../CSS/modal.css';

// BuildingAdjustmentCalculations Component
interface BuildingAdjustmentCalculationsProps {
    marketValue: number | null;
    adjustedValue: number | null;
    selectedSubcomponentRate: number | null;
    formData: {
        area: string;
        completion_percent: string;
        depreciation: string;
    };
}

const BuildingAdjustmentCalculations: React.FC<BuildingAdjustmentCalculationsProps> = ({
    marketValue,
    adjustedValue,
    selectedSubcomponentRate,
    formData
}) => {
    return (
        <IonGrid className="calculations-grid">
            <IonRow>
                <IonCol size="12">
                    <h3>Calculations</h3>
                </IonCol>
            </IonRow>
            <IonRow>
                <IonCol size="6">
                    <IonItem className="calculation-item">
                        <IonLabel>Base Calculation:</IonLabel>
                        <IonText slot="end">
                            {selectedSubcomponentRate !== null && formData.area ? (
                                <>₱{selectedSubcomponentRate.toLocaleString()} × {formData.area} sq ft</>
                            ) : (
                                'N/A'
                            )}
                        </IonText>
                    </IonItem>
                </IonCol>
                <IonCol size="6">
                    <IonItem className="calculation-item">
                        <IonLabel>Market Value:</IonLabel>
                        <IonText slot="end" color="primary">
                            {marketValue !== null ? `₱${marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                        </IonText>
                    </IonItem>
                </IonCol>
            </IonRow>
            <IonRow>
                <IonCol size="6">
                    <IonItem className="calculation-item">
                        <IonLabel>Completion:</IonLabel>
                        <IonText slot="end">
                            {formData.completion_percent ? `${formData.completion_percent}%` : 'N/A'}
                        </IonText>
                    </IonItem>
                </IonCol>
                <IonCol size="6">
                    <IonItem className="calculation-item">
                        <IonLabel>Adjusted Value:</IonLabel>
                        <IonText slot="end" color="success">
                            {adjustedValue !== null ? `₱${adjustedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                        </IonText>
                    </IonItem>
                </IonCol>
            </IonRow>
        </IonGrid>
    );
};

// BuildingAdjustmentUpdateModal Component
interface BuildingAdjustmentUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    valueInfoId: string;
    existingData: BuildingAdjustmentData;
    onSaveSuccess?: () => void;
}

const BuildingAdjustmentUpdateModal: React.FC<BuildingAdjustmentUpdateModalProps> = ({
    isOpen,
    onClose,
    valueInfoId,
    existingData,
    onSaveSuccess
}) => {
    const [formData, setFormData] = useState({
        Maincomponent: existingData.Maincomponent || '',
        buidlingsubcomponent: existingData.buidlingsubcomponent || '',
        description: existingData.description || '',
        completion_percent: existingData.completion_percent || '',
        depreciation: existingData.depreciation || '',
        area: existingData.area.toString() || ''
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
            // Load existing data
            if (existingData) {
                loadExistingData(existingData);
            }
        }
    }, [isOpen, existingData]);

    useEffect(() => {
        const requiredFieldsFilled =
            formData.Maincomponent.trim() !== '' &&
            formData.buidlingsubcomponent.trim() !== '' &&
            formData.description.trim() !== '' &&
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
    }, [selectedSubcomponentRate, formData.area, formData.completion_percent, formData.depreciation]);

    const loadExistingData = async (data: BuildingAdjustmentData) => {
        setFormData({
            ...data,
            area: data.area.toString()
        });

        if (data.Maincomponent) {
            await loadBuildingSubcomponents(data.Maincomponent);
            if (data.buidlingsubcomponent) {
                findAndDisplayRate(data.buidlingsubcomponent);
            }
        }
    };

    const calculateValues = () => {
        const areaValue = parseFloat(formData.area) || 0;
        const completionDecimal = parseFloat(formData.completion_percent) / 100;
        const depreciationDecimal = parseFloat(formData.depreciation) / 100;

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

    const handleMainComponentChange = async (value: string) => {
        setFormData(prev => ({
            ...prev,
            Maincomponent: value,
            buidlingsubcomponent: '', // Reset subcomponent
            description: '' // Reset description
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

    const handleSubcomponentChange = async (value: string) => {
        // Fetch the main and subcomponent descriptions
        const mainCom = await getBuildingComponentById(formData.Maincomponent);
        const subCom = await getBuildingSubcomponentById(value);
        let combinedDescription = '';

        if (mainCom && subCom) {
            combinedDescription = `${mainCom.description} (${subCom.description})`;
        }

        setFormData(prev => ({
            ...prev,
            buidlingsubcomponent: value,
            description: combinedDescription // Set the auto-filled description
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
                bldg_adjustment_id: existingData.bldg_adjustment_id,
                Maincomponent: formData.Maincomponent,
                buidlingsubcomponent: formData.buidlingsubcomponent,
                description: formData.description,
                completion_percent: formData.completion_percent,
                depreciation: formData.depreciation,
                area: parseFloat(formData.area),
                value_info_id: valueInfoId,
            };

            BuildingAdjustmentLocalStorage.saveBuildingAdjustmentData(adjustmentData);

            setAlertMessage('Building adjustment updated successfully!');
            setShowAlert(true);

            onClose();

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
        // Reset to original data when closing
        setFormData({
            Maincomponent: existingData.Maincomponent || '',
            buidlingsubcomponent: existingData.buidlingsubcomponent || '',
            description: existingData.description || '',
            completion_percent: existingData.completion_percent || '',
            depreciation: existingData.depreciation || '',
            area: existingData.area.toString() || ''
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
                            Edit Building Adjustment
                        </IonTitle>
                        <IonButtons slot="end">
                            <IonButton onClick={handleClose} fill="clear" className="fancy-close-btn">
                                <IonIcon icon={close} slot="icon-only" />
                            </IonButton>
                        </IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="modal-content">
                    <BuildingAdjustmentUpdateForm
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
                        isEditing={true}
                        adjustmentId={existingData.bldg_adjustment_id}
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
                            Update Adjustment
                        </IonButton>
                    </div>
                </IonContent>
                <IonAlert
                    isOpen={showAlert}
                    onDidDismiss={() => setShowAlert(false)}
                    header={alertMessage.includes('Error') ? 'Error' : 'Success'}
                    message={alertMessage}
                    buttons={['OK']}
                />
            </IonModal>
        </>
    );
};

export default BuildingAdjustmentUpdateModal;