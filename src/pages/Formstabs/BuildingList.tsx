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
    onUpdateClick
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

    const filteredBuildingIds = buildingInfoIds.filter(id => {
        if (!searchTerm) return true;
        const buildingData = buildingDataList.get(id);
        if (!buildingData) return false;
        return Object.values(buildingData).some((value: any) =>
            value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

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
            {/* Form Summary Section */}
            <IonCard className="form-summary-card">
                <IonCardContent>
                    <IonGrid style={{ margin: '0', padding: '0' }}>
                        <IonRow style={{ marginBottom: '4px' }}>
                            <IonCol size="3" style={{ padding: '4px' }}><IonText><strong>Form ID:</strong> {form_id}</IonText></IonCol>
                            <IonCol size="3" style={{ padding: '4px' }}><IonText><strong>District:</strong> {district || 'N/A'}</IonText></IonCol>
                            <IonCol size="3" style={{ padding: '4px' }}><IonText><strong>Declarant ID:</strong> {declarant || 'N/A'}</IonText></IonCol>
                            <IonCol size="3" style={{ padding: '4px' }}><IonText><strong>Kind:</strong> {kind || 'N/A'}</IonText></IonCol>
                        </IonRow>
                        <IonRow style={{ marginBottom: '4px' }}>
                            <IonCol size="3" style={{ padding: '4px' }}><IonText><strong>Classification:</strong> {classification || 'N/A'}</IonText></IonCol>
                            <IonCol size="3" style={{ padding: '4px' }}><IonText><strong>Subclass:</strong> {subclass || 'N/A'}</IonText></IonCol>
                            <IonCol size="3" style={{ padding: '4px' }}><IonText><strong>Actual Use:</strong> {actual_use || 'N/A'}</IonText></IonCol>
                            <IonCol size="3" style={{ padding: '4px' }}><IonText><strong>Area:</strong> {area ? `${area.toLocaleString()} sq ft` : 'N/A'}</IonText></IonCol>
                        </IonRow>
                    </IonGrid>
                </IonCardContent>
            </IonCard>

            {/* Building Table */}
            {buildingInfoIds.length > 0 ? (
                <>
                    <div className="search-and-icon-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px 0' }}>
                        <IonButton
                            fill="clear"
                            onClick={handleOpenFirstBuildingDetails}
                            title="Click to open details for the first building"
                        >
                            <IonIcon icon={informationCircle} color="primary" size="small" />
                        </IonButton>
                    </div>
                    <IonGrid>
                        <IonRow className="table-header">
                            <IonCol size="2">Building ID</IonCol>
                            <IonCol size="2">Structure Type</IonCol>
                            <IonCol size="2">Base Market Value</IonCol>
                            <IonCol size="2">Adjusted Market Value</IonCol>
                            <IonCol size="2">Assessment Level</IonCol>
                            <IonCol size="2">Assessed Value</IonCol>
                        </IonRow>

                        {filteredBuildingIds.map((id) => {
                            const buildingData = buildingDataList.get(id);
                            const baseMarketValue = baseMarketValues.get(id) || 0;
                            const originalAdjustedValue = adjustedMarketValues.get(id) || 0;
                            const adjustmentValue = totalAdjustments.get(id) || 0;
                            const finalAdjustedValue = originalAdjustedValue + adjustmentValue;
                            const assessmentLevel = assessmentLevels.get(id);
                            const assessedValue = calculateAssessedValue(finalAdjustedValue, assessmentLevel);
                            const isSelected = id === selectedBuildingId;

                            return (
                                <React.Fragment key={id}>
                                    <IonRow
                                        className={`table-row ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleRowClick(id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <IonCol size="2">{id}</IonCol>
                                        <IonCol size="2">{buildingData?.structureType || 'N/A'}</IonCol>
                                        <IonCol size="2">{baseMarketValue !== undefined ? `₱${baseMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}</IonCol>
                                        <IonCol size="2">{finalAdjustedValue !== undefined ? `₱${finalAdjustedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}</IonCol>
                                        <IonCol size="2">{assessmentLevel ? `${assessmentLevel.rate_percent}` : 'N/A'}</IonCol>
                                        <IonCol size="2">{assessedValue !== undefined ? `₱${assessedValue.toLocaleString()}` : 'N/A'}</IonCol>
                                    </IonRow>

                                    {isSelected && buildingData && (
                                        <IonRow>
                                            <IonCol size="12">
                                                <BuildingDetailsCard
                                                    buildingData={{ ...buildingData, id }}
                                                    buildingRate={buildingCodeRates.get(id)}
                                                    onUpdateClick={onUpdateClick}
                                                />
                                            </IonCol>
                                        </IonRow>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </IonGrid>
                </>
            ) : (
                <div className="no-data">
                    <IonText>No building information available for this form.</IonText>
                </div>
            )}
        </>
    );
};

export default BuildingList;