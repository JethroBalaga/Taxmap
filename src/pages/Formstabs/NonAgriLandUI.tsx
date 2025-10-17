// src/pages/components/NonAgriLandUI.tsx
import React from "react";
import {
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    IonAlert,
    IonIcon
} from "@ionic/react";
import { cutOutline, resizeOutline, trailSignOutline, trashOutline } from "ionicons/icons";
import NonAgriAdjustment from '../../components/Modals/NonAgriAdjustment';
import NonAgriAdjustmentUpdate from '../../components/Modals/NonAgriAdjustmentUpdate';
import DynamicTable from '../../components/GlobalComponent/DynamicTable';
import SubmitButton from '../../components/GlobalComponent/SubmitButton';
import { LandAdjustmentData } from '../../utils/landAdjustmentLocalStorage';

interface NonAgriLandUIProps {
    formData: any;
    currentAdjustments: any[];
    visibleIcons: any[];
    selectedRow: any;
    landAdjustments: LandAdjustmentData[];
    isLoadingAdjustments: boolean;
    isSubmitting: boolean;
    showAdjustmentModal: boolean;
    showUpdateAdjustmentModal: boolean;
    selectedAdjustmentType: string;
    description: string;
    adjustmentFactor: string;
    selectedAdjustmentForUpdate: any;
    showDeleteAlert: boolean;
    adjustmentToDelete: any;
    valueInfoId: string;
    showToast: boolean;
    toastMessage: string;
    toastColor: 'success' | 'danger' | 'warning' | undefined;
    
    // Handlers
    onSubmit: () => void;
    handleIconClick: (adjustmentType: string) => void;
    handleUpdateIconClick: (adjustmentType: string) => void;
    handleModalDismiss: () => void;
    handleUpdateModalDismiss: () => void;
    handleRowClick: (rowData: any) => void;
    handleDeleteConfirm: () => void;
    setDescription: (description: string) => void;
    setAdjustmentFactor: (factor: string) => void;
    setShowDeleteAlert: (show: boolean) => void;
    setAdjustmentToDelete: (adjustment: any) => void;
    showToastMessage: (message: string, color?: 'success' | 'danger' | 'warning') => void;
}

// Grid data configuration array
const getGridData = (formData: any) => [
    [
        { label: "District:", value: formData?.district || 'N/A' },
        { label: "Declarant ID:", value: formData?.declarantId || 'N/A' },
        { label: "Kind:", value: formData?.kind || 'N/A' },
        { label: "Classification:", value: formData?.classification || 'N/A' }
    ],
    [
        { label: "Subclass:", value: formData?.subclass || 'N/A' },
        { label: "Actual Use:", value: formData?.actualUse || 'N/A' },
        { label: "Area:", value: formData?.area ? formData.area.toLocaleString() : 'N/A' },
        { label: "", value: "" }
    ]
];

// Get icon component based on name
const getIconComponent = (iconName: string) => {
    switch (iconName) {
        case 'cutOutline': return cutOutline;
        case 'resizeOutline': return resizeOutline;
        case 'trailSignOutline': return trailSignOutline;
        case 'trashOutline': return trashOutline;
        default: return cutOutline;
    }
};

// Get icon label based on whether adjustment already exists
const getIconLabel = (adjustmentType: string, currentAdjustments: any[]) => {
    const hasExistingAdjustment = currentAdjustments.some(
        adj => adj.adjustment_type === adjustmentType
    );
    return hasExistingAdjustment ? `Update ${adjustmentType}` : `Add ${adjustmentType}`;
};

// Get icon color based on whether adjustment already exists
const getIconColor = (adjustmentType: string, selectedRow: any, currentAdjustments: any[]) => {
    if (adjustmentType === 'Delete') {
        return selectedRow ? '#eb445a' : '#92949c';
    }

    const hasExistingAdjustment = currentAdjustments.some(
        adj => adj.adjustment_type === adjustmentType
    );
    return hasExistingAdjustment ? '#ffce00' : '#3880ff';
};

export const NonAgriLandUI: React.FC<NonAgriLandUIProps> = ({
    formData,
    currentAdjustments,
    visibleIcons,
    selectedRow,
    landAdjustments,
    isLoadingAdjustments,
    isSubmitting,
    showAdjustmentModal,
    showUpdateAdjustmentModal,
    selectedAdjustmentType,
    description,
    adjustmentFactor,
    selectedAdjustmentForUpdate,
    showDeleteAlert,
    adjustmentToDelete,
    valueInfoId,
    
    // Handlers
    onSubmit,
    handleIconClick,
    handleUpdateIconClick,
    handleModalDismiss,
    handleUpdateModalDismiss,
    handleRowClick,
    handleDeleteConfirm,
    setDescription,
    setAdjustmentFactor,
    setShowDeleteAlert,
    setAdjustmentToDelete
}) => {
    const gridData = getGridData(formData);

    return (
        <>
            {/* Form Summary Card Only */}
            <IonCard className="form-summary-card">
                <IonCardContent>
                    <IonGrid style={{ margin: '0', padding: '0' }}>
                        {gridData.map((row, rowIndex) => (
                            <IonRow key={rowIndex} style={{ marginBottom: '4px' }}>
                                {row.map((col, colIndex) => (
                                    <IonCol key={colIndex} size="3" style={{ padding: '4px' }}>
                                        <IonText>
                                            {col.label && <strong>{col.label}</strong>} {col.value}
                                        </IonText>
                                    </IonCol>
                                ))}
                            </IonRow>
                        ))}
                    </IonGrid>
                </IonCardContent>
            </IonCard>

            {/* Submit Button */}
            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                <SubmitButton
                    label="Submit Form"
                    onClick={onSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    className="header-submit-button"
                />
            </div>

            {/* Icons Section */}
            {visibleIcons.length > 0 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '2rem',
                    margin: '2rem 0',
                    padding: '1rem'
                }}>
                    {visibleIcons.map((item, index) => {
                        const hasExistingAdjustment = currentAdjustments.some(
                            adj => adj.adjustment_type === item.adjustmentType
                        );

                        return (
                            <div key={index} style={{ textAlign: 'center' }}>
                                <IonIcon
                                    icon={getIconComponent(item.icon)}
                                    size="large"
                                    style={{
                                        cursor: item.adjustmentType === 'Delete' ? (selectedRow ? 'pointer' : 'not-allowed') : 'pointer',
                                        color: getIconColor(item.adjustmentType, selectedRow, currentAdjustments),
                                        opacity: item.adjustmentType === 'Delete' && !selectedRow ? 0.5 : 1
                                    }}
                                    onClick={() => {
                                        if (item.adjustmentType === 'Delete') {
                                            if (selectedRow) {
                                                handleIconClick(item.adjustmentType);
                                            }
                                        } else {
                                            if (hasExistingAdjustment) {
                                                handleUpdateIconClick(item.adjustmentType);
                                            } else {
                                                handleIconClick(item.adjustmentType);
                                            }
                                        }
                                    }}
                                />
                                <div style={{ marginTop: '0.5rem' }}>
                                    <IonText color="medium">
                                        {item.adjustmentType === 'Delete' ?
                                            (selectedRow ? 'Delete Selected' : 'Select to Delete') :
                                            getIconLabel(item.adjustmentType, currentAdjustments)
                                        }
                                    </IonText>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Adjustments Table */}
            <IonCard>
                <IonCardContent>
                    {isLoadingAdjustments ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <IonText>Loading adjustments...</IonText>
                        </div>
                    ) : (
                        <>
                            <DynamicTable
                                data={currentAdjustments}
                                title="Land Adjustments"
                                keyField="adjustmentId"
                                onRowClick={handleRowClick}
                                selectedRow={selectedRow}
                            />
                            {selectedRow && (
                                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                    <IonText color="medium">
                                        <small>Selected: {selectedRow.adjustment_type}</small>
                                    </IonText>
                                </div>
                            )}
                        </>
                    )}
                </IonCardContent>
            </IonCard>

            {/* Modals */}
            <NonAgriAdjustment
                isOpen={showAdjustmentModal}
                onDismiss={handleModalDismiss}
                adjustmentType={selectedAdjustmentType}
                description={description}
                setDescription={setDescription}
                adjustmentFactor={adjustmentFactor}
                setAdjustmentFactor={setAdjustmentFactor}
                landAdjustments={landAdjustments}
                isLoadingAdjustments={isLoadingAdjustments}
                valueInfoId={valueInfoId}
            />

            <NonAgriAdjustmentUpdate
                isOpen={showUpdateAdjustmentModal}
                onDismiss={handleUpdateModalDismiss}
                adjustmentType={selectedAdjustmentType}
                description={description}
                setDescription={setDescription}
                adjustmentFactor={adjustmentFactor}
                setAdjustmentFactor={setAdjustmentFactor}
                landAdjustments={landAdjustments}
                isLoadingAdjustments={isLoadingAdjustments}
                valueInfoId={valueInfoId}
                existingAdjustment={selectedAdjustmentForUpdate}
            />

            {/* Delete Confirmation Alert */}
            <IonAlert
                isOpen={showDeleteAlert}
                onDidDismiss={() => setShowDeleteAlert(false)}
                header={'Delete Adjustment'}
                message={`Are you sure you want to delete this ${adjustmentToDelete?.adjustment_type} adjustment?`}
                buttons={[
                    {
                        text: 'Cancel',
                        role: 'cancel',
                        cssClass: 'secondary',
                    },
                    {
                        text: 'Delete',
                        role: 'destructive',
                        handler: handleDeleteConfirm
                    }
                ]}
            />
        </>
    );
};