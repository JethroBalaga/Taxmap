import React, { useState, useEffect } from 'react';
import {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonAlert,
    IonText,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonButtons
} from '@ionic/react';
import { close } from 'ionicons/icons'; // Import the close icon
import { BuildingAdjustmentLocalStorage, BuildingAdjustmentData } from '../../utils/tablestorages/BuildingAdjustmentLocalStorage';
import { getBuildingComponentData, BuildingComponentData } from '../../utils/buildingComponentLocalStorage';
import { getBuildingSubcomponentByBuildingComId, BuildingSubcomponentData } from '../../utils/BuildingSubcomponentLocalStorage';
import './../../CSS/modal.css'; // Import the general modal CSS

// Extend the BuildingAdjustmentData interface to include area and market_value
interface ExtendedBuildingAdjustmentData extends BuildingAdjustmentData {
    area?: number;
    market_value?: number;
    adjusted_value?: number; // Add adjusted_value to the interface
}

interface BuildingAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    valueInfoId: string;
    existingData?: ExtendedBuildingAdjustmentData | null;
    onSaveSuccess?: () => void;
    initialArea?: number; // Optional initial area value
}

const BuildingAdjustmentModal: React.FC<BuildingAdjustmentModalProps> = ({
    isOpen,
    onClose,
    valueInfoId,
    existingData,
    onSaveSuccess,
    initialArea = 0 // Default to 0 if not provided
}) => {
    const [formData, setFormData] = useState({
        Maincomponent: '',
        buidlingsubcomponent: '',
        description: '',
        completion_percent: '',
        depraciation: '',
        area: initialArea.toString() // Add area to form data as string
    });

    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [buildingComponents, setBuildingComponents] = useState<BuildingComponentData[]>([]);
    const [buildingSubcomponents, setBuildingSubcomponents] = useState<BuildingSubcomponentData[]>([]);
    const [isLoadingComponents, setIsLoadingComponents] = useState(false);
    const [isLoadingSubcomponents, setIsLoadingSubcomponents] = useState(false);
    const [selectedSubcomponentRate, setSelectedSubcomponentRate] = useState<number | null>(null);
    const [marketValue, setMarketValue] = useState<number | null>(null);
    const [adjustedValue, setAdjustedValue] = useState<number | null>(null); // Add state for adjusted value
    const [isDepreciationEnabled, setIsDepreciationEnabled] = useState(false);
    const [isSaveEnabled, setIsSaveEnabled] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadBuildingComponents();
        }
    }, [isOpen]);

    useEffect(() => {
        if (existingData) {
            // Safely handle the area field
            const existingArea = existingData.area !== undefined ? existingData.area : initialArea;

            setFormData({
                Maincomponent: existingData.Maincomponent || '',
                buidlingsubcomponent: existingData.buidlingsubcomponent || '',
                description: existingData.description || '',
                completion_percent: existingData.completion_percent || '',
                depraciation: existingData.depraciation || '',
                area: existingArea.toString() // Convert to string for the input field
            });

            // If there's existing data with a main component, load its subcomponents
            if (existingData.Maincomponent) {
                loadBuildingSubcomponents(existingData.Maincomponent);

                // If there's an existing subcomponent, find and display its rate
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

    // Check if all required fields are filled to enable save button
    useEffect(() => {
        const requiredFieldsFilled = 
            formData.Maincomponent.trim() !== '' &&
            formData.buidlingsubcomponent.trim() !== '' &&
            formData.area.trim() !== '' && 
            parseFloat(formData.area) > 0 &&
            formData.completion_percent.trim() !== '' &&
            !isNaN(parseFloat(formData.completion_percent)) &&
            parseFloat(formData.completion_percent) >= 0 &&
            parseFloat(formData.completion_percent) <= 100;
            
        setIsSaveEnabled(requiredFieldsFilled);
    }, [formData.Maincomponent, formData.buidlingsubcomponent, formData.area, formData.completion_percent]);

    // Check if all other fields are filled to enable depreciation
    useEffect(() => {
        const otherFieldsFilled = 
            formData.Maincomponent.trim() !== '' &&
            formData.buidlingsubcomponent.trim() !== '' &&
            formData.area.trim() !== '' && 
            parseFloat(formData.area) > 0 &&
            formData.completion_percent.trim() !== '' &&
            !isNaN(parseFloat(formData.completion_percent)) &&
            parseFloat(formData.completion_percent) >= 0 &&
            parseFloat(formData.completion_percent) <= 100;
            
        setIsDepreciationEnabled(otherFieldsFilled);
    }, [formData.Maincomponent, formData.buidlingsubcomponent, formData.area, formData.completion_percent]);

    // Calculate market value and adjusted value when rate, area, completion percent, or depreciation changes
    useEffect(() => {
        calculateMarketValue();
        calculateAdjustedValue();
    }, [selectedSubcomponentRate, formData.area, formData.completion_percent, formData.depraciation]);

    const calculateMarketValue = () => {
        const areaValue = parseFloat(formData.area) || 0;

        if (selectedSubcomponentRate !== null && areaValue > 0) {
            const baseMarketValue = selectedSubcomponentRate * areaValue;

            // Apply completion percentage if provided
            let finalMarketValue = baseMarketValue;
            if (formData.completion_percent) {
                const completionDecimal = parseFloat(formData.completion_percent) / 100;
                finalMarketValue = baseMarketValue * completionDecimal;
            }

            setMarketValue(finalMarketValue);
        } else {
            setMarketValue(null);
        }
    };

    const calculateAdjustedValue = () => {
        if (marketValue !== null) {
            let finalAdjustedValue = marketValue;

            // Apply depreciation if provided
            if (formData.depraciation) {
                const depreciationDecimal = parseFloat(formData.depraciation) / 100;
                finalAdjustedValue = marketValue * (1 - depreciationDecimal);
            }

            setAdjustedValue(finalAdjustedValue);
        } else {
            setAdjustedValue(null);
        }
    };

    const loadBuildingComponents = async () => {
        setIsLoadingComponents(true);
        try {
            const components = await getBuildingComponentData();
            if (components) {
                setBuildingComponents(components);
            }
        } catch (error) {
            console.error('Error loading building components:', error);
            setAlertMessage('Error loading building components. Please try again.');
            setShowAlert(true);
        } finally {
            setIsLoadingComponents(false);
        }
    };

    const loadBuildingSubcomponents = async (buildingComId: string) => {
        setIsLoadingSubcomponents(true);
        try {
            const subcomponents = await getBuildingSubcomponentByBuildingComId(buildingComId);
            if (subcomponents) {
                setBuildingSubcomponents(subcomponents);
            } else {
                setBuildingSubcomponents([]);
            }
        } catch (error) {
            console.error('Error loading building subcomponents:', error);
            setBuildingSubcomponents([]);
        } finally {
            setIsLoadingSubcomponents(false);
        }
    };

    const findAndDisplayRate = (subcomponentId: string) => {
        const subcomponent = buildingSubcomponents.find(sub => sub.building_subcom_id === subcomponentId);
        if (subcomponent) {
            setSelectedSubcomponentRate(subcomponent.rate);
        } else {
            setSelectedSubcomponentRate(null);
        }
    };

    const handleMainComponentChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            Maincomponent: value,
            buidlingsubcomponent: '' // Reset subcomponent when main component changes
        }));

        setSelectedSubcomponentRate(null); // Reset rate display
        setMarketValue(null); // Reset market value
        setAdjustedValue(null); // Reset adjusted value

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

        // Find and display the rate for the selected subcomponent
        findAndDisplayRate(value);
    };

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = (): boolean => {
        if (!formData.Maincomponent.trim()) {
            setAlertMessage('Main component is required');
            setShowAlert(true);
            return false;
        }

        if (!formData.buidlingsubcomponent.trim()) {
            setAlertMessage('Building subcomponent is required');
            setShowAlert(true);
            return false;
        }

        if (!formData.area || parseFloat(formData.area) <= 0) {
            setAlertMessage('Area must be greater than 0');
            setShowAlert(true);
            return false;
        }

        if (!formData.completion_percent || isNaN(parseFloat(formData.completion_percent)) || 
            parseFloat(formData.completion_percent) < 0 || parseFloat(formData.completion_percent) > 100) {
            setAlertMessage('Completion percent must be a valid number between 0 and 100');
            setShowAlert(true);
            return false;
        }

        if (formData.depraciation && isNaN(parseFloat(formData.depraciation))) {
            setAlertMessage('Depreciation must be a valid number');
            setShowAlert(true);
            return false;
        }

        return true;
    };

    const handleSave = () => {
        if (!validateForm()) {
            return;
        }

        try {
            // Create the adjustment data with proper typing
            const adjustmentData: ExtendedBuildingAdjustmentData = {
                bldg_adjustment_id: existingData?.bldg_adjustment_id || `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                Maincomponent: formData.Maincomponent,
                buidlingsubcomponent: formData.buidlingsubcomponent,
                description: formData.description,
                completion_percent: formData.completion_percent,
                depraciation: formData.depraciation,
                area: parseFloat(formData.area), // Convert back to number for storage
                value_info_id: valueInfoId
            };

            // Add market_value and adjusted_value only if they're defined in the interface
            if (marketValue !== null) {
                adjustmentData.market_value = marketValue;
            }

            if (adjustedValue !== null) {
                adjustmentData.adjusted_value = adjustedValue;
            }

            BuildingAdjustmentLocalStorage.saveBuildingAdjustmentData(adjustmentData);

            setAlertMessage(existingData ? 'Building adjustment updated successfully!' : 'Building adjustment added successfully!');
            setShowAlert(true);

            if (onSaveSuccess) {
                onSaveSuccess();
            }

            // Close modal after successful save
            setTimeout(() => {
                onClose();
            }, 1500);
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
            <IonModal
                isOpen={isOpen}
                onDidDismiss={handleClose}
                className="custom-wide-modal"
            >
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
                    <IonGrid className="custom-grid">
                        {/* Display Building ID at the top */}
                        <IonRow>
                            <IonCol size="12" className="custom-col">
                                <IonItem className="custom-input">
                                    <IonLabel position="stacked">Building ID</IonLabel>
                                    <IonInput
                                        value={valueInfoId}
                                        readonly
                                        disabled
                                    />
                                </IonItem>
                                <IonText color="medium" style={{ padding: '0 16px', fontSize: '0.8rem' }}>
                                    This adjustment will be linked to the selected building.
                                </IonText>
                            </IonCol>
                        </IonRow>

                        <IonRow>
                            <IonCol size="12" className="custom-col">
                                <IonItem className="custom-input">
                                    <IonLabel position="stacked">Main Component *</IonLabel>
                                    <IonSelect
                                        value={formData.Maincomponent}
                                        placeholder="Select main component"
                                        onIonChange={(e) => handleMainComponentChange(e.detail.value!)}
                                        interface="popover"
                                    >
                                        {isLoadingComponents ? (
                                            <IonSelectOption value="" disabled>
                                                Loading components...
                                            </IonSelectOption>
                                        ) : (
                                            buildingComponents.map((component) => (
                                                <IonSelectOption
                                                    key={component.building_com_id}
                                                    value={component.building_com_id}
                                                >
                                                    {component.building_com_id} - {component.description}
                                                </IonSelectOption>
                                            ))
                                        )}
                                        {buildingComponents.length === 0 && !isLoadingComponents && (
                                            <IonSelectOption value="" disabled>
                                                No components available
                                            </IonSelectOption>
                                        )}
                                    </IonSelect>
                                </IonItem>
                            </IonCol>
                        </IonRow>

                        <IonRow>
                            <IonCol size="12" className="custom-col">
                                <IonItem className="custom-input">
                                    <IonLabel position="stacked">Building Subcomponent *</IonLabel>
                                    <IonSelect
                                        value={formData.buidlingsubcomponent}
                                        placeholder="Select building subcomponent"
                                        onIonChange={(e) => handleSubcomponentChange(e.detail.value!)}
                                        interface="popover"
                                        disabled={!formData.Maincomponent || isLoadingSubcomponents}
                                    >
                                        {isLoadingSubcomponents ? (
                                            <IonSelectOption value="" disabled>
                                                Loading subcomponents...
                                            </IonSelectOption>
                                        ) : (
                                            buildingSubcomponents.map((subcomponent) => (
                                                <IonSelectOption
                                                    key={subcomponent.building_subcom_id}
                                                    value={subcomponent.building_subcom_id}
                                                >
                                                    {subcomponent.building_subcom_id} - {subcomponent.description}
                                                </IonSelectOption>
                                            ))
                                        )}
                                        {buildingSubcomponents.length === 0 && !isLoadingSubcomponents && formData.Maincomponent && (
                                            <IonSelectOption value="" disabled>
                                                No subcomponents available for this component
                                            </IonSelectOption>
                                        )}
                                        {!formData.Maincomponent && (
                                            <IonSelectOption value="" disabled>
                                                Please select a main component first
                                            </IonSelectOption>
                                        )}
                                    </IonSelect>
                                </IonItem>

                                {/* Display the rate below the subcomponent dropdown */}
                                {selectedSubcomponentRate !== null && (
                                    <div className="rate-display">
                                        <IonText>
                                            Rate: <span className="rate-value">₱{selectedSubcomponentRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </IonText>
                                    </div>
                                )}
                            </IonCol>
                        </IonRow>

                        {/* Description field */}
                        <IonRow>
                            <IonCol size="12" className="custom-col">
                                <IonItem className="custom-input">
                                    <IonLabel position="stacked">Description</IonLabel>
                                    <IonTextarea
                                        value={formData.description}
                                        placeholder="Enter description"
                                        rows={3}
                                        onIonInput={(e) => handleInputChange('description', e.detail.value!)}
                                    />
                                </IonItem>
                            </IonCol>
                        </IonRow>

                        {/* Input fields in a single row */}
                        <IonRow>
                            <IonCol size="4" className="custom-col">
                                <IonItem className="custom-input">
                                    <IonLabel position="stacked">Area (sq ft) *</IonLabel>
                                    <IonInput
                                        type="number"
                                        value={formData.area}
                                        placeholder="Enter area"
                                        onIonInput={(e) => handleInputChange('area', e.detail.value!)}
                                    />
                                </IonItem>
                            </IonCol>

                            <IonCol size="4" className="custom-col">
                                <IonItem className="custom-input">
                                    <IonLabel position="stacked">Completion Percent (%) *</IonLabel>
                                    <IonInput
                                        type="number"
                                        value={formData.completion_percent}
                                        placeholder="0-100"
                                        min="0"
                                        max="100"
                                        onIonInput={(e) => handleInputChange('completion_percent', e.detail.value!)}
                                    />
                                </IonItem>
                            </IonCol>

                            <IonCol size="4" className="custom-col">
                                <IonItem className="custom-input">
                                    <IonLabel position="stacked">Depreciation (%)</IonLabel>
                                    <IonInput
                                        type="number"
                                        value={formData.depraciation}
                                        placeholder="Enter depreciation"
                                        onIonInput={(e) => handleInputChange('depraciation', e.detail.value!)}
                                        disabled={!isDepreciationEnabled}
                                    />
                                </IonItem>
                            </IonCol>
                        </IonRow>

                        {/* Calculation displays in a single row */}
                        {(marketValue !== null || adjustedValue !== null) && (
                            <IonRow>
                                {marketValue !== null && (
                                    <IonCol size="6" className="custom-col">
                                        <div className="calculation-display market-value">
                                            <IonText className="calculation-title">Market Value Calculation:</IonText>
                                            <div className="calculation-details">
                                                <div>(Rate: ₱{selectedSubcomponentRate?.toLocaleString()} × Area: {parseFloat(formData.area).toLocaleString()} sq ft)</div>
                                                {formData.completion_percent && (
                                                    <div>× Completion: {formData.completion_percent}%</div>
                                                )}
                                                <div className="calculation-result">
                                                    = ₱{marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>
                                    </IonCol>
                                )}
                                
                                {adjustedValue !== null && (
                                    <IonCol size="6" className="custom-col">
                                        <div className="calculation-display adjusted-value">
                                            <IonText className="calculation-title">Adjusted Value Calculation:</IonText>
                                            <div className="calculation-details">
                                                <div>Market Value: ₱{marketValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                {formData.depraciation && (
                                                    <div>- Depreciation: {formData.depraciation}%</div>
                                                )}
                                                <div className="calculation-result">
                                                    = ₱{adjustedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>
                                    </IonCol>
                                )}
                            </IonRow>
                        )}

                        <IonRow>
                            <IonCol size="12" className="custom-col">
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
                            </IonCol>
                        </IonRow>
                    </IonGrid>
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