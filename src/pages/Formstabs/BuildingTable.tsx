import React, { useState, useEffect } from "react";
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonText,
    IonSearchbar,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent
} from "@ionic/react";
import { arrowBack, informationCircle } from "ionicons/icons";
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { BuildingDataLocalStorage } from '../../utils/tablestorages/BuildingDataLocalStorage';
import { getBuildingCodeByCode } from '../../utils/buildingCodeLocalStorage';
import '../../CSS/BuildingTable.css';

interface BuildingTableProps {
    form_id: string;
    onBack: () => void;
    kind: string | number;
    classification: string;
    area: number;
}

const BuildingTable: React.FC<BuildingTableProps> = ({ form_id, onBack, kind, classification, area }) => {
    const [buildingInfoIds, setBuildingInfoIds] = useState<string[]>([]);
    const [buildingDataList, setBuildingDataList] = useState<Map<string, any>>(new Map());
    const [buildingCodeRates, setBuildingCodeRates] = useState<Map<string, number>>(new Map());
    const [baseMarketValues, setBaseMarketValues] = useState<Map<string, number>>(new Map());
    const [adjustedMarketValues, setAdjustedMarketValues] = useState<Map<string, number>>(new Map());
    const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBuildingData();
    }, [form_id]);

    const calculateMarketValues = (buildingCodeRate: number, depreciationRate: number | null, area: number): { base: number, adjusted: number } => {
        // Calculate base market value (without depreciation)
        const baseMarketValue = buildingCodeRate * area;
        
        // Calculate adjusted market value (with depreciation applied)
        let adjustedMarketValue = baseMarketValue;
        
        if (depreciationRate !== null && depreciationRate !== undefined) {
            // Convert percentage to decimal (e.g., 2% becomes 0.02)
            const depreciationDecimal = depreciationRate / 100;
            // Apply depreciation: baseMarketValue * (1 - depreciationDecimal)
            adjustedMarketValue = baseMarketValue * (1 - depreciationDecimal);
        }
        
        return {
            base: baseMarketValue,
            adjusted: adjustedMarketValue
        };
    };

    const loadBuildingData = async () => {
        setLoading(true);
        try {
            // Get all ValueInfo and filter by formDataId
            const allInfos = ValueInfoLocalStorage.getAllValueInfo();
            const infos = allInfos.filter((info: any) => info.formDataId === form_id);
            
            const ids = infos.map((info: any) => info.id);
            setBuildingInfoIds(ids);
            
            const buildingDataMap = new Map<string, any>();
            const ratesMap = new Map<string, number>();
            const baseMarketValuesMap = new Map<string, number>();
            const adjustedMarketValuesMap = new Map<string, number>();
            
            // Load building data and fetch rates
            for (const id of ids) {
                const data = BuildingDataLocalStorage.getBuildingData(id);
                if (data) {
                    buildingDataMap.set(id, data);
                    
                    // Fetch building code rate if buildingCode exists
                    if (data.buildingCode) {
                        const buildingCodeData = await getBuildingCodeByCode(data.buildingCode);
                        if (buildingCodeData) {
                            ratesMap.set(id, buildingCodeData.rate);
                            
                            // Calculate both base and adjusted market values
                            const marketValues = calculateMarketValues(
                                buildingCodeData.rate, 
                                data.depreciationRate, 
                                area
                            );
                            
                            baseMarketValuesMap.set(id, marketValues.base);
                            adjustedMarketValuesMap.set(id, marketValues.adjusted);
                        }
                    }
                }
            }
            
            setBuildingDataList(buildingDataMap);
            setBuildingCodeRates(ratesMap);
            setBaseMarketValues(baseMarketValuesMap);
            setAdjustedMarketValues(adjustedMarketValuesMap);
        } catch (error) {
            console.error('Error loading building data:', error);
        } finally {
            setLoading(false);
        }
    };

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
        
        // Search through all building data properties
        return Object.values(buildingData).some((value: any) => 
            value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const selectedBuildingData = selectedBuildingId ? buildingDataList.get(selectedBuildingId) : null;
    const selectedBuildingRate = selectedBuildingId ? buildingCodeRates.get(selectedBuildingId) : null;
    const selectedBaseMarketValue = selectedBuildingId ? baseMarketValues.get(selectedBuildingId) : null;
    const selectedAdjustedMarketValue = selectedBuildingId ? adjustedMarketValues.get(selectedBuildingId) : null;

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonButton onClick={onBack}>
                            <IonIcon icon={arrowBack} />
                            Back
                        </IonButton>
                    </IonButtons>
                    <IonTitle>Building Information - Form ID: {form_id}</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent className="building-content">
                {/* Form Information Summary */}
                <IonCard className="form-summary-card">
                    <IonCardContent>
                        <IonGrid>
                            <IonRow>
                                <IonCol size="4">
                                    <strong>Kind:</strong> {kind}
                                </IonCol>
                                <IonCol size="4">
                                    <strong>Classification:</strong> {classification}
                                </IonCol>
                                <IonCol size="4">
                                    <strong>Area:</strong> {area ? `${area.toLocaleString()} sq ft` : 'N/A'}
                                </IonCol>
                            </IonRow>
                        </IonGrid>
                    </IonCardContent>
                </IonCard>

                {/* Search Bar */}
                <div className="search-container">
                    <IonSearchbar
                        placeholder="Search building information..."
                        value={searchTerm}
                        onIonInput={handleSearch}
                        className="forms-searchbar"
                    />
                </div>

                {loading ? (
                    <IonText>Loading building information...</IonText>
                ) : buildingInfoIds.length > 0 ? (
                    <>
                        {/* Building List */}
                        <IonGrid>
                            <IonRow className="table-header">
                                <IonCol size="2">Building ID</IonCol>
                                <IonCol size="2">Structure Type</IonCol>
                                <IonCol size="2">Base Market Value</IonCol>
                                <IonCol size="2">Adjusted Market Value</IonCol>
                                <IonCol size="4">Actions</IonCol>
                            </IonRow>
                            
                            {filteredBuildingIds.map((id) => {
                                const buildingData = buildingDataList.get(id);
                                const baseMarketValue = baseMarketValues.get(id);
                                const adjustedMarketValue = adjustedMarketValues.get(id);
                                const isSelected = id === selectedBuildingId;
                                
                                return (
                                    <React.Fragment key={id}>
                                        <IonRow className={`table-row ${isSelected ? 'selected' : ''}`}>
                                            <IonCol size="2">{id}</IonCol>
                                            <IonCol size="2">{buildingData?.structureType || 'N/A'}</IonCol>
                                            <IonCol size="2">
                                                {baseMarketValue !== undefined 
                                                    ? `₱${baseMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                                                    : 'N/A'
                                                }
                                            </IonCol>
                                            <IonCol size="2">
                                                {adjustedMarketValue !== undefined 
                                                    ? `₱${adjustedMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                                                    : 'N/A'
                                                }
                                            </IonCol>
                                            <IonCol size="4">
                                                <IonButton
                                                    fill="clear"
                                                    size="small"
                                                    onClick={() => handleViewDetails(id)}
                                                    title="View Details"
                                                >
                                                    <IonIcon 
                                                        icon={informationCircle} 
                                                        className={isSelected ? "icon-blue" : "icon-blue icon-disabled"} 
                                                    />
                                                    View Details
                                                </IonButton>
                                            </IonCol>
                                        </IonRow>
                                        
                                        {/* Details Card */}
                                        {isSelected && buildingData && (
                                            <IonRow>
                                                <IonCol size="12">
                                                    <IonCard className="details-card">
                                                        <IonCardContent>
                                                            <div className="building-details-grid">
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Structure Type:</span>
                                                                    <span className="detail-value">{buildingData.structureType || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Building Code:</span>
                                                                    <span className="detail-value">{buildingData.buildingCode || 'N/A'}</span>
                                                                </div>
                                                                {/* Show Building Code Rate if available */}
                                                                {selectedBuildingRate !== undefined && selectedBuildingRate !== null && (
                                                                    <div className="detail-item">
                                                                        <span className="detail-label">Building Code Rate:</span>
                                                                        <span className="detail-value">
                                                                            ₱{selectedBuildingRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Storey:</span>
                                                                    <span className="detail-value">{buildingData.storey || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Floor Order:</span>
                                                                    <span className="detail-value">{buildingData.floorOrder || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Building Age:</span>
                                                                    <span className="detail-value">{buildingData.buildingAge || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Building Permit:</span>
                                                                    <span className="detail-value">{buildingData.buildingPermit || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Construction %:</span>
                                                                    <span className="detail-value">{buildingData.constructionPercent !== null ? `${buildingData.constructionPercent}%` : 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Depreciation Rate:</span>
                                                                    <span className="detail-value">{buildingData.depreciationRate !== null ? `${buildingData.depreciationRate}%` : 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Date Constructed:</span>
                                                                    <span className="detail-value">{buildingData.dateConstructed || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Date Occupied:</span>
                                                                    <span className="detail-value">{buildingData.dateOccupied || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <span className="detail-label">Date Completed:</span>
                                                                    <span className="detail-value">{buildingData.dateCompleted || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                        </IonCardContent>
                                                    </IonCard>
                                                </IonCol>
                                            </IonRow>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </IonGrid>

                        {/* Show message if no results */}
                        {filteredBuildingIds.length === 0 && (
                            <div className="no-results">
                                <IonText>No building information found matching your search.</IonText>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="no-data">
                        <IonText>No building information available for this form.</IonText>
                    </div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default BuildingTable;