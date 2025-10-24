import React, { useState, useEffect } from "react";
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
    const [localAdjustments, setLocalAdjustments] = useState<BuildingAdjustmentData[]>(buildingAdjustments);

    // Update local state when props change
    useEffect(() => {
        setLocalAdjustments(buildingAdjustments);
    }, [buildingAdjustments]);

    const handleSearch = (e: any) => {
        setSearchTerm(e.detail.value || '');
    };

    const handleSelectAdjustmentRow = (rowData: BuildingAdjustmentData) => {
        const newSelectedId = rowData.bldg_adjustment_id === selectedAdjustmentId ? null : rowData.bldg_adjustment_id;
        setSelectedAdjustmentId(newSelectedId);
    };

    const handleAdjustmentRowClick = (rowData: BuildingAdjustmentData) => {
        handleSelectAdjustmentRow(rowData);
    };

    const handleShowCalculationDetails = () => {
        if (!selectedAdjustmentId) {
            showToastMessage('Please select an adjustment to view calculation details', 'warning');
            return;
        }
        
        const selectedAdjustment = localAdjustments.find(
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
                // Force refresh by calling the update callback
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
        
        const selectedAdjustment = localAdjustments.find(
            adj => adj.bldg_adjustment_id === selectedAdjustmentId
        );
        
        if (selectedAdjustment) {
            onAdjustmentUpdate(selectedAdjustmentId);
        } else {
            showToastMessage('Selected adjustment not found', 'danger');
        }
    };

    const filteredAdjustments = localAdjustments.filter(adjustment => {
        if (!searchTerm) return true;
        return Object.values(adjustment).some((value: any) =>
            value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const filteredAdjustmentsForTable = filteredAdjustments.map(adj => {
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
            {/* Search and Icons Section */}
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

            {/* Building Adjustments Table */}
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