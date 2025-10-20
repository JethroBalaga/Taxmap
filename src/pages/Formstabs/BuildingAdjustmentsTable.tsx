import React, { useState } from "react";
import {
    IonButton,
    IonIcon,
    IonSearchbar,
    IonText,
    IonToast,
    IonCard,
    IonCardContent
} from "@ionic/react";
import { createOutline, arrowUpCircleOutline, trashOutline, informationCircleOutline } from "ionicons/icons";
import DynamicTable from "../../components/GlobalComponent/DynamicTable";
import { BuildingAdjustmentData,BuildingAdjustmentLocalStorage} from "../../utils/tablestorages/BuildingAdjustmentLocalStorage";
import "../../CSS/BuildingResponsive.css";

interface BuildingAdjustmentsTableProps {
    buildingAdjustments: BuildingAdjustmentData[];
    buildingInfoIds: string[];
    onAdjustmentCreate: () => void;
    onAdjustmentUpdate: (adjustmentId: string) => void;
    onAdjustmentsUpdate: () => void;
    showToastMessage: (message: string, color?: 'success' | 'danger' | 'warning') => void;
    onSubcomponentClick: (rowData: BuildingAdjustmentData) => void;
}

const BuildingAdjustmentsTable: React.FC<BuildingAdjustmentsTableProps> = ({
    buildingAdjustments,
    buildingInfoIds,
    onAdjustmentCreate,
    onAdjustmentUpdate,
    onAdjustmentsUpdate,
    showToastMessage,
    onSubcomponentClick
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAdjustmentId, setSelectedAdjustmentId] = useState<string | null>(null);
    const [showDeleteToast, setShowDeleteToast] = useState(false);

    const handleSearch = (e: any) => {
        setSearchTerm(e.detail.value || '');
    };

    const handleSelectAdjustmentRow = (rowData: BuildingAdjustmentData) => {
        const newSelectedId = rowData.bldg_adjustment_id === selectedAdjustmentId ? null : rowData.bldg_adjustment_id;
        setSelectedAdjustmentId(newSelectedId);
    };

    const handleAdjustmentRowClick = (rowData: BuildingAdjustmentData) => {
        // Only select the row, don't automatically show details
        handleSelectAdjustmentRow(rowData);
    };

    const handleShowCalculationDetails = () => {
        if (!selectedAdjustmentId) {
            showToastMessage('Please select an adjustment to view calculation details', 'warning');
            return;
        }
        
        // Find the selected adjustment data
        const selectedAdjustment = buildingAdjustments.find(
            adj => adj.bldg_adjustment_id === selectedAdjustmentId
        );
        
        if (selectedAdjustment && selectedAdjustment.buidlingsubcomponent) {
            onSubcomponentClick(selectedAdjustment);
        } else {
            showToastMessage('No subcomponent data available for this adjustment', 'warning');
        }
    };

    const handleDeleteAdjustment = () => {
        if (!selectedAdjustmentId) {
            showToastMessage('No adjustment selected to delete.', 'warning');
            return;
        }
        setShowDeleteToast(true);
    };

    const performDeletion = async () => {
        try {
            const success = await BuildingAdjustmentLocalStorage.deleteBuildingAdjustmentData(selectedAdjustmentId!);
            if (success) {
                onAdjustmentsUpdate();
                setSelectedAdjustmentId(null);
                showToastMessage('Building adjustment deleted successfully!', 'success');
            } else {
                showToastMessage('Failed to delete building adjustment.', 'danger');
            }
        } catch (error) {
            console.error('Error deleting building adjustment:', error);
            showToastMessage('Error deleting building adjustment', 'danger');
        } finally {
            setShowDeleteToast(false);
        }
    };

    const handleUpdateAdjustment = () => {
        if (!selectedAdjustmentId) {
            showToastMessage('Please select an adjustment to update', 'warning');
            return;
        }
        
        // Find the selected adjustment data
        const selectedAdjustment = buildingAdjustments.find(
            adj => adj.bldg_adjustment_id === selectedAdjustmentId
        );
        
        if (selectedAdjustment) {
            // Call the update function with the selected adjustment ID
            onAdjustmentUpdate(selectedAdjustmentId);
        } else {
            showToastMessage('Selected adjustment not found', 'danger');
        }
    };

    const filteredAdjustments = buildingAdjustments.filter(adjustment => {
        if (!searchTerm) return true;
        return Object.values(adjustment).some((value: any) =>
            value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const filteredAdjustmentsForTable = filteredAdjustments.map(adj => {
        // Remove value_info_id and Maincomponent from display
        const { value_info_id, Maincomponent, ...rest } = adj;

        const depreciationValue = (rest as any).depreciation;
        const formattedDepreciation = depreciationValue && depreciationValue.toString().trim() !== ''
            ? `${depreciationValue}%`
            : 'N/A';

        return {
            ...rest,
            depreciation: formattedDepreciation
        };
    });

    const buttonActions = [
        {
            icon: createOutline,
            className: "create-button",
            onClick: onAdjustmentCreate,
            title: "Add Building adjustment",
            enabled: buildingInfoIds.length > 0
        },
        {
            icon: arrowUpCircleOutline,
            className: "update-button",
            onClick: handleUpdateAdjustment,
            title: "Update Building adjustment",
            enabled: !!selectedAdjustmentId
        },
        {
            icon: trashOutline,
            className: "delete-button",
            onClick: handleDeleteAdjustment,
            title: "Delete Building adjustment",
            enabled: !!selectedAdjustmentId
        },
        {
            icon: informationCircleOutline,
            className: "info-button",
            onClick: handleShowCalculationDetails,
            title: "View Calculation Details",
            enabled: !!selectedAdjustmentId
        }
    ];

    return (
        <>
            {/* Search and Icons Section - Above the table like non-agri */}
            <div className="search-container">
                <IonSearchbar
                    placeholder="Search adjustments..."
                    value={searchTerm}
                    onIonInput={handleSearch}
                    className="forms-searchbar"
                />
                <div className="icon-group">
                    {buttonActions.map((action, index) => (
                        <IonButton
                            key={index}
                            fill="clear"
                            className={action.className}
                            onClick={action.onClick}
                            style={{ 
                                opacity: action.enabled ? 1 : 0.5,
                                color: action.icon === informationCircleOutline ? (action.enabled ? '#2e7d32' : '#92949c') : undefined
                            }}
                            title={action.title}
                            disabled={!action.enabled}
                        >
                            <IonIcon icon={action.icon} slot="icon-only" />
                        </IonButton>
                    ))}
                </div>
            </div>

            {/* Building Adjustments Table - Matching non-agri design */}
            <IonCard>
                <IonCardContent>
                    {filteredAdjustments.length > 0 ? (
                        <DynamicTable
                            data={filteredAdjustmentsForTable}
                            title="Building Adjustments"
                            keyField="bldg_adjustment_id"
                            onRowClick={handleAdjustmentRowClick}
                            selectedRow={selectedAdjustmentId ? filteredAdjustmentsForTable.find(item => item.bldg_adjustment_id === selectedAdjustmentId) : undefined}
                        />
                    ) : (
                        <div className="no-data">
                            <IonText>No building adjustments found.</IonText>
                        </div>
                    )}
                </IonCardContent>
            </IonCard>

            {/* Selected Adjustment Info */}
            {selectedAdjustmentId && (
                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <IonText color="medium">
                        <small>Selected adjustment ID: {selectedAdjustmentId}</small>
                    </IonText>
                </div>
            )}

            <IonToast
                isOpen={showDeleteToast}
                onDidDismiss={() => setShowDeleteToast(false)}
                message="Are you sure you want to delete this building adjustment?"
                position="middle"
                color="warning"
                buttons={[
                    {
                        side: 'end',
                        text: 'Yes',
                        handler: performDeletion
                    },
                    {
                        text: 'No',
                        role: 'cancel'
                    }
                ]}
            />
        </>
    );
};

export default BuildingAdjustmentsTable;