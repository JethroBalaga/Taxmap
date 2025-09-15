// src/components/Building/BuildingAdjustmentsTable.tsx
import React, { useState } from "react";
import {
    IonButton,
    IonIcon,
    IonSearchbar,
    IonText,
    IonToast
} from "@ionic/react";
import { createOutline, arrowUpCircleOutline, trashOutline, informationCircle } from "ionicons/icons";
import DynamicTable from "../../components/GlobalComponent/DynamicTable";
import { BuildingAdjustmentData } from "../../utils/tablestorages/BuildingAdjustmentLocalStorage";
import { BuildingAdjustmentLocalStorage } from "../../utils/tablestorages/BuildingAdjustmentLocalStorage";

interface BuildingAdjustmentsTableProps {
    buildingAdjustments: BuildingAdjustmentData[];
    buildingInfoIds: string[];
    onAdjustmentCreate: () => void;
    onAdjustmentsUpdate: () => void;
    showToastMessage: (message: string, color?: 'success' | 'danger' | 'warning') => void;
    onSubcomponentClick: (subcomponentId: string) => void;
}

const BuildingAdjustmentsTable: React.FC<BuildingAdjustmentsTableProps> = ({
    buildingAdjustments,
    buildingInfoIds,
    onAdjustmentCreate,
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

    const handleAdjustmentRowClick = async (rowData: any) => {
        if (rowData && rowData.buidlingsubcomponent) {
            onSubcomponentClick(rowData.buidlingsubcomponent);
        } else {
            handleSelectAdjustmentRow(rowData);
        }
    };

    const handleDeleteAdjustment = () => {
        if (!selectedAdjustmentId) {
            showToastMessage('No adjustment selected to delete.', 'warning');
            return;
        }
        setShowDeleteToast(true);
    };

    const performDeletion = () => {
        try {
            const success = BuildingAdjustmentLocalStorage.deleteBuildingAdjustmentData(selectedAdjustmentId!);
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

    const filteredAdjustments = buildingAdjustments.filter(adjustment => {
        if (!searchTerm) return true;
        return Object.values(adjustment).some((value: any) =>
            value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const filteredAdjustmentsForTable = filteredAdjustments.map(adj => {
        const { Maincomponent, ...rest } = adj;
        return rest;
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
            onClick: () => {
                if (selectedAdjustmentId) {
                    // Here you would typically open an update modal
                    showToastMessage('Update functionality would be implemented here');
                } else {
                    showToastMessage('Please select an adjustment to update', 'warning');
                }
            },
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
            icon: informationCircle,
            className: "info-button",
            onClick: () => showToastMessage('Info functionality would be implemented here'),
            title: "View Building Details",
            enabled: filteredAdjustments.length > 0
        }
    ];

    return (
        <>
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
                            style={{ opacity: action.enabled ? 1 : 0.5 }} 
                            title={action.title} 
                            disabled={!action.enabled}
                        >
                            <IonIcon icon={action.icon} slot="icon-only" />
                        </IonButton>
                    ))}
                </div>
            </div>

            {filteredAdjustments.length > 0 ? (
                <div style={{ padding: '0 16px' }}>
                    <DynamicTable
                        data={filteredAdjustmentsForTable}
                        title="Building Adjustments"
                        keyField="bldg_adjustment_id"
                        onRowClick={handleAdjustmentRowClick}
                    />
                </div>
            ) : (
                <div className="no-data">
                    <IonText>No building adjustments found.</IonText>
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