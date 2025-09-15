// src/components/Building/BuildingList.tsx
import React, { useState } from "react";
import {
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    IonSpinner,
    IonSearchbar
} from "@ionic/react";
import BuildingDetailsCard from "./BuildingDetailsCard";

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
    onAdjustmentCreate: () => void;
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
    onAdjustmentCreate
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

    const handleSearch = (e: any) => {
        setSearchTerm(e.detail.value || '');
    };

    const handleViewDetails = (buildingId: string) => {
        setSelectedBuildingId(buildingId === selectedBuildingId ? null : buildingId);
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
                <IonGrid>
                    <IonRow className="table-header">
                        <IonCol size="3">Building ID</IonCol>
                        <IonCol size="3">Structure Type</IonCol>
                        <IonCol size="2">Base Market Value</IonCol>
                        <IonCol size="2">Adjusted Market Value</IonCol>
                        <IonCol size="2">Assessment Level</IonCol>
                    </IonRow>

                    {filteredBuildingIds.map((id) => {
                        const buildingData = buildingDataList.get(id);
                        const baseMarketValue = baseMarketValues.get(id);
                        const adjustedMarketValue = adjustedMarketValues.get(id);
                        const assessmentLevel = assessmentLevels.get(id);
                        const isSelected = id === selectedBuildingId;

                        return (
                            <React.Fragment key={id}>
                                <IonRow 
                                    className={`table-row ${isSelected ? 'selected' : ''}`} 
                                    onClick={() => handleViewDetails(id)} 
                                    style={{ cursor: 'pointer' }}
                                >
                                    <IonCol size="3">{id}</IonCol>
                                    <IonCol size="3">{buildingData?.structureType || 'N/A'}</IonCol>
                                    <IonCol size="2">{baseMarketValue !== undefined ? `₱${baseMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}</IonCol>
                                    <IonCol size="2">{adjustedMarketValue !== undefined ? `₱${adjustedMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}</IonCol>
                                    <IonCol size="2">{assessmentLevel ? `${assessmentLevel.rate_percent}` : 'N/A'}</IonCol>
                                </IonRow>

                                {/* Expanded Details */}
                                {isSelected && buildingData && (
                                    <IonRow>
                                        <IonCol size="12">
                                            <BuildingDetailsCard 
                                                buildingData={buildingData}
                                                buildingRate={buildingCodeRates.get(id)}
                                            />
                                        </IonCol>
                                    </IonRow>
                                )}
                            </React.Fragment>
                        );
                    })}
                </IonGrid>
            ) : (
                <div className="no-data">
                    <IonText>No building information available for this form.</IonText>
                </div>
            )}
        </>
    );
};

export default BuildingList;