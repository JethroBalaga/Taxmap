import React, { useState } from "react";
import {
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    IonSpinner,
    IonIcon,
    IonButton,
} from "@ionic/react";
import { informationCircle } from "ionicons/icons";
import BuildingDetailsCard from "./BuildingDetailsCard";
import "../../CSS/BuildingResponsive.css";
import DynamicTable from "../../components/GlobalComponent/DynamicTable";

interface BuildingListProps {
    form_id: string;
    district?: number | null;
    declarant: string;
    kind: string | number;
    classification: string;
    subclass?: string;
    actual_use: string;
    area: number;
    loading: boolean;
    buildingInfoIds: string[];
    buildingDataList: Map<string, any>;
    baseMarketValues: Map<string, number>;
    adjustedMarketValues: Map<string, number>;
    assessmentLevels: Map<string, any>;
    buildingCodeRates: Map<string, number>;
    totalAdjustments: Map<string, number>;
    onViewDetails: (buildingId: string) => void;
    onUpdateClick: (buildingId: string, buildingData: any) => void;
    formData?: any; // Add formData prop
}

// Interface for the table data (only what we want to display)
interface BuildingTableData {
    valueInfoId: string;
    structure_type: string;
    base_market_value: string;
    adjusted_market_value: string;
    assessment_level: string;
    assessed_value: string;
}

const BuildingList: React.FC<BuildingListProps> = ({
    form_id,
    district,
    declarant,
    kind,
    classification,
    subclass,
    actual_use,
    area,
    loading,
    buildingInfoIds,
    buildingDataList,
    baseMarketValues,
    adjustedMarketValues,
    assessmentLevels,
    buildingCodeRates,
    totalAdjustments,
    onViewDetails,
    onUpdateClick,
    formData // Receive formData
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

    const handleSearch = (e: any) => {
        setSearchTerm(e.detail.value || '');
    };

    const handleRowClick = (buildingId: string) => {
        setSelectedBuildingId(buildingId === selectedBuildingId ? null : buildingId);
    };

    const handleOpenFirstBuildingDetails = () => {
        if (buildingInfoIds.length > 0) {
            const firstBuildingId = buildingInfoIds[0];
            setSelectedBuildingId(firstBuildingId === selectedBuildingId ? null : firstBuildingId);
            onViewDetails(firstBuildingId);
        }
    };

    const calculateAssessedValue = (adjustedValue: number, assessmentLevel: any): number => {
        if (!assessmentLevel || !assessmentLevel.rate_percent) return 0;
        
        let rateDecimal: number;
        
        if (assessmentLevel.rate_percent.includes('%')) {
            rateDecimal = parseFloat(assessmentLevel.rate_percent.replace('%', '')) / 100;
        } else {
            rateDecimal = parseFloat(assessmentLevel.rate_percent);
        }
        
        const assessedValue = adjustedValue * rateDecimal;
        return Math.round(assessedValue);
    };

    // Prepare clean data for DynamicTable - match non-agri pattern
    const tableData: BuildingTableData[] = buildingInfoIds.map((id) => {
        const buildingData = buildingDataList.get(id);
        const baseMarketValue = baseMarketValues.get(id) || 0;
        const originalAdjustedValue = adjustedMarketValues.get(id) || 0;
        const adjustmentValue = totalAdjustments.get(id) || 0;
        const finalAdjustedValue = originalAdjustedValue + adjustmentValue;
        const assessmentLevel = assessmentLevels.get(id);
        const assessedValue = calculateAssessedValue(finalAdjustedValue, assessmentLevel);

        return {
            valueInfoId: id,
            structure_type: buildingData?.structureType || 'N/A',
            base_market_value: baseMarketValue !== undefined ? `₱${baseMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A',
            adjusted_market_value: finalAdjustedValue !== undefined ? `₱${finalAdjustedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A',
            assessment_level: assessmentLevel ? `${assessmentLevel.rate_percent}` : 'N/A',
            assessed_value: assessedValue !== undefined ? `₱${assessedValue.toLocaleString()}` : 'N/A',
        };
    });

    const filteredTableData = tableData.filter(item => {
        if (!searchTerm) return true;
        return Object.values(item).some((value: any) =>
            value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const handleTableRowClick = (rowData: BuildingTableData) => {
        handleRowClick(rowData.valueInfoId);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <IonSpinner name="crescent" />
                <IonText>Loading building information...</IonText>
            </div>
        );
    }

    return (
        <>
            {/* Form Summary Section - Display form data from props */}
            <IonCard className="form-summary-card">
                <IonCardContent>
                    <IonGrid style={{ margin: '0', padding: '0' }}>
                        <IonRow style={{ marginBottom: '4px' }}>
                            <IonCol size="4" style={{ padding: '4px' }}>
                                <IonText><strong>District:</strong> {district || 'N/A'}</IonText>
                            </IonCol>
                            <IonCol size="4" style={{ padding: '4px' }}>
                                <IonText><strong>Declarant ID:</strong> {declarant || 'N/A'}</IonText>
                            </IonCol>
                            <IonCol size="4" style={{ padding: '4px' }}>
                                <IonText><strong>Kind:</strong> {kind || 'N/A'}</IonText>
                            </IonCol>
                        </IonRow>
                        <IonRow style={{ marginBottom: '4px' }}>
                            <IonCol size="4" style={{ padding: '4px' }}>
                                <IonText><strong>Classification:</strong> {classification || 'N/A'}</IonText>
                            </IonCol>
                            <IonCol size="4" style={{ padding: '4px' }}>
                                <IonText><strong>Subclass:</strong> {subclass || 'N/A'}</IonText>
                            </IonCol>
                            <IonCol size="4" style={{ padding: '4px' }}>
                                <IonText><strong>Actual Use:</strong> {actual_use || 'N/A'}</IonText>
                            </IonCol>
                        </IonRow>
                        <IonRow>
                            <IonCol size="12" style={{ padding: '4px' }}>
                                <IonText><strong>Area:</strong> {area ? `${area.toLocaleString()} sq ft` : 'N/A'}</IonText>
                            </IonCol>
                        </IonRow>
                        {/* Display additional form data if available */}
                        {formData && (
                            <IonRow>
                                <IonCol size="12" style={{ padding: '4px' }}>
                                    <IonText><strong>Form ID:</strong> {formData.id}</IonText>
                                </IonCol>
                            </IonRow>
                        )}
                    </IonGrid>
                </IonCardContent>
            </IonCard>

            {/* Click to Open Building Details - ABOVE the table like non-agri */}
            {buildingInfoIds.length > 0 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '1rem',
                    margin: '1rem 0',
                    padding: '1rem'
                }}>
                    <IonIcon
                        icon={informationCircle}
                        size="large"
                        style={{
                            cursor: 'pointer',
                            color: '#3880ff'
                        }}
                        onClick={handleOpenFirstBuildingDetails}
                    />
                    <IonText color="medium">
                        Click to open building details
                    </IonText>
                </div>
            )}

            {/* Building Information Table - Matching non-agri design */}
            <IonCard>
                <IonCardContent>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <IonText>Loading building information...</IonText>
                        </div>
                    ) : (
                        <DynamicTable
                            data={filteredTableData}
                            title="Building Information"
                            keyField="valueInfoId"
                            onRowClick={handleTableRowClick}
                            selectedRow={selectedBuildingId ? filteredTableData.find(item => item.valueInfoId === selectedBuildingId) : undefined}
                        />
                    )}
                </IonCardContent>
            </IonCard>

            {/* Show Building Details Card for selected building */}
            {selectedBuildingId && (() => {
                const selectedBuilding = buildingDataList.get(selectedBuildingId);
                return selectedBuilding && (
                    <IonCard>
                        <IonCardContent>
                            <BuildingDetailsCard
                                buildingData={{ ...selectedBuilding, id: selectedBuildingId }}
                                buildingRate={buildingCodeRates.get(selectedBuildingId)}
                                onUpdateClick={onUpdateClick}
                            />
                        </IonCardContent>
                    </IonCard>
                );
            })()}

            {/* No Data State - Matching non-agri design */}
            {buildingInfoIds.length === 0 && !loading && (
                <div className="no-data">
                    <IonText>No building information available for this form.</IonText>
                </div>
            )}
        </>
    );
};

export default BuildingList;