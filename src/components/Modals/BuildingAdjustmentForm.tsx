// src/components/BuildingAdjustmentForm.tsx
import React from 'react';
import {
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonText,
    IonSelect,
    IonSelectOption
} from '@ionic/react';
import { BuildingComponentData } from '../../utils/buildingComponentLocalStorage';
import { BuildingSubcomponentData } from '../../utils/BuildingSubcomponentLocalStorage';

interface BuildingAdjustmentFormProps {
    formData: {
        Maincomponent: string;
        buidlingsubcomponent: string;
        description: string;
        completion_percent: string;
        depraciation: string;
        area: string;
    };
    handleFormChange: (field: keyof BuildingAdjustmentFormProps['formData'], value: string) => void;
    handleMainComponentChange: (value: string) => void;
    handleSubcomponentChange: (value: string) => void;
    buildingComponents: BuildingComponentData[];
    buildingSubcomponents: BuildingSubcomponentData[];
    isLoadingComponents: boolean;
    isLoadingSubcomponents: boolean;
    selectedSubcomponentRate: number | null;
    valueInfoId: string;
}

const BuildingAdjustmentForm: React.FC<BuildingAdjustmentFormProps> = ({
    formData,
    handleFormChange,
    handleMainComponentChange,
    handleSubcomponentChange,
    buildingComponents,
    buildingSubcomponents,
    isLoadingComponents,
    isLoadingSubcomponents,
    selectedSubcomponentRate,
    valueInfoId
}) => {
    return (
        <IonGrid className="custom-grid">
            <IonRow>
                <IonCol size="12" className="custom-col">
                    <IonItem className="custom-input">
                        <IonLabel position="stacked">Building ID</IonLabel>
                        <IonInput value={valueInfoId} readonly disabled />
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
                                <IonSelectOption value="" disabled>Loading components...</IonSelectOption>
                            ) : (
                                buildingComponents.map((component) => (
                                    <IonSelectOption key={component.building_com_id} value={component.building_com_id}>
                                        {component.building_com_id} - {component.description}
                                    </IonSelectOption>
                                ))
                            )}
                            {buildingComponents.length === 0 && !isLoadingComponents && (
                                <IonSelectOption value="" disabled>No components available</IonSelectOption>
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
                                <IonSelectOption value="" disabled>Loading subcomponents...</IonSelectOption>
                            ) : (
                                buildingSubcomponents.map((subcomponent) => (
                                    <IonSelectOption key={subcomponent.building_subcom_id} value={subcomponent.building_subcom_id}>
                                        {subcomponent.building_subcom_id} - {subcomponent.description}
                                    </IonSelectOption>
                                ))
                            )}
                            {buildingSubcomponents.length === 0 && !isLoadingSubcomponents && formData.Maincomponent && (
                                <IonSelectOption value="" disabled>No subcomponents available for this component</IonSelectOption>
                            )}
                            {!formData.Maincomponent && (
                                <IonSelectOption value="" disabled>Please select a main component first</IonSelectOption>
                            )}
                        </IonSelect>
                    </IonItem>
                    {selectedSubcomponentRate !== null && (
                        <div className="rate-display">
                            <IonText>
                                Rate: <span className="rate-value">₱{selectedSubcomponentRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </IonText>
                        </div>
                    )}
                </IonCol>
            </IonRow>

            <IonRow>
                <IonCol size="12" className="custom-col">
                    <IonItem className="custom-input">
                        <IonLabel position="stacked">Description</IonLabel>
                        <IonTextarea
                            value={formData.description}
                            placeholder="Description will be generated automatically"
                            rows={3}
                            readonly
                            disabled
                        />
                    </IonItem>
                </IonCol>
            </IonRow>

            <IonRow>
                <IonCol size="4" className="custom-col">
                    <IonItem className="custom-input">
                        <IonLabel position="stacked">Area (sq ft) *</IonLabel>
                        <IonInput
                            type="number"
                            value={formData.area}
                            placeholder="Enter area"
                            onIonInput={(e) => handleFormChange('area', e.detail.value!)}
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
                            onIonInput={(e) => handleFormChange('completion_percent', e.detail.value!)}
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
                            onIonInput={(e) => handleFormChange('depraciation', e.detail.value!)}
                            disabled={!formData.completion_percent || !formData.area || !formData.Maincomponent || !formData.buidlingsubcomponent}
                        />
                    </IonItem>
                </IonCol>
            </IonRow>
        </IonGrid>
    );
};

export default BuildingAdjustmentForm;