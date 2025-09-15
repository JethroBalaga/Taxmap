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
    IonCardContent,
    IonSpinner,
    IonPopover
} from "@ionic/react";
import { arrowBack, informationCircle, createOutline, arrowUpCircleOutline, trashOutline } from "ionicons/icons";
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { BuildingDataLocalStorage } from '../../utils/tablestorages/BuildingDataLocalStorage';
import { getBuildingCodeByCode } from '../../utils/buildingCodeLocalStorage';
import { 
  getAssessmentLevelData
} from '../../utils/assessmentLevelLocalStorage';
import { BuildingAdjustmentData, getBuildingAdjustmentData } from '../../utils/tablestorages/BuildingAdjustmentLocalStorage';
import '../../CSS/BuildingTable.css';
import BuildingAdjustmentModal from "../../components/Modals/BuildingAdjustmentModal";

interface BuildingTableProps {
    form_id: string;
    onBack: () => void;
    kind: string | number;
    classification: string;
    area: number;
    declarant: string;
    actual_use: string;
    district?: number | null;
    subclass?: string;
}

interface AssessmentLevelInfo {
  rate_percent: string;
  range1: number;
  range2: number;
}

const BuildingTable: React.FC<BuildingTableProps> = ({ 
  form_id, 
  onBack, 
  kind, 
  classification, 
  area, 
  declarant, 
  actual_use,
  district,
  subclass 
}) => {
    const [buildingInfoIds, setBuildingInfoIds] = useState<string[]>([]);
    const [buildingDataList, setBuildingDataList] = useState<Map<string, any>>(new Map());
    const [buildingCodeRates, setBuildingCodeRates] = useState<Map<string, number>>(new Map());
    const [baseMarketValues, setBaseMarketValues] = useState<Map<string, number>>(new Map());
    const [adjustedMarketValues, setAdjustedMarketValues] = useState<Map<string, number>>(new Map());
    const [assessmentLevels, setAssessmentLevels] = useState<Map<string, AssessmentLevelInfo>>(new Map());
    const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [kindId, setKindId] = useState<number>(2);
    const [showCreatePopover, setShowCreatePopover] = useState(false);
    const [createPopoverEvent, setCreatePopoverEvent] = useState<any>(null);
    
    // States for the adjustment modal
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
    const [selectedValueInfoId, setSelectedValueInfoId] = useState<string | null>(null);
    const [existingAdjustmentData, setExistingAdjustmentData] = useState<BuildingAdjustmentData | null>(null);
    const [initialAreaForModal, setInitialAreaForModal] = useState<number>(area);

    useEffect(() => {
        console.log('BuildingTable props:', { form_id, kind, classification, area, declarant, actual_use, district, subclass });
        setKindId(2);
        loadBuildingData();
    }, [form_id, kind, classification, area, declarant, actual_use, district, subclass]);

    const calculateMarketValues = (buildingCodeRate: number, depreciationRate: number | null, area: number): { base: number, adjusted: number } => {
        const baseMarketValue = buildingCodeRate * area;
        let adjustedMarketValue = baseMarketValue;
        
        if (depreciationRate !== null && depreciationRate !== undefined) {
            const depreciationDecimal = depreciationRate / 100;
            adjustedMarketValue = baseMarketValue * (1 - depreciationDecimal);
        }
        
        return { base: baseMarketValue, adjusted: adjustedMarketValue };
    };

    const getAssessmentLevelForBuilding = async (adjustedValue: number): Promise<AssessmentLevelInfo | null> => {
        try {
            const numericValue = Math.floor(adjustedValue);
            
            const allAssessmentLevels = await getAssessmentLevelData();
            
            if (allAssessmentLevels && allAssessmentLevels.length > 0) {
                const matchingLevel = allAssessmentLevels.find(level => {
                    const matchesKind = level.kind_id === kindId;
                    const matchesClass = level.class_id.toString() === classification.toString();
                    const inRange = numericValue >= level.range1 && numericValue <= level.range2;
                    return matchesKind && matchesClass && inRange;
                });
                
                if (matchingLevel) {
                    return {
                        rate_percent: matchingLevel.rate_percent,
                        range1: matchingLevel.range1,
                        range2: matchingLevel.range2
                    };
                }
            }
            return null;
        } catch (error) {
            console.error('Error getting assessment level:', error);
            return null;
        }
    };

    const loadBuildingData = async () => {
        setLoading(true);
        try {
            const allInfos = ValueInfoLocalStorage.getAllValueInfo();
            const infos = allInfos.filter((info: any) => info.formDataId === form_id);
            const ids = infos.map((info: any) => info.id);
            setBuildingInfoIds(ids);
            
            const buildingDataMap = new Map<string, any>();
            const ratesMap = new Map<string, number>();
            const baseMarketValuesMap = new Map<string, number>();
            const adjustedMarketValuesMap = new Map<string, number>();
            const assessmentLevelsMap = new Map<string, AssessmentLevelInfo>();
            
            for (const id of ids) {
                const data = BuildingDataLocalStorage.getBuildingData(id);
                if (data) {
                    buildingDataMap.set(id, data);
                    
                    if (data.buildingCode) {
                        const buildingCodeData = await getBuildingCodeByCode(data.buildingCode);
                        if (buildingCodeData) {
                            ratesMap.set(id, buildingCodeData.rate);
                            const marketValues = calculateMarketValues(buildingCodeData.rate, data.depreciationRate, area);
                            baseMarketValuesMap.set(id, marketValues.base);
                            adjustedMarketValuesMap.set(id, marketValues.adjusted);
                            const assessmentLevel = await getAssessmentLevelForBuilding(marketValues.adjusted);
                            if (assessmentLevel) {
                                assessmentLevelsMap.set(id, assessmentLevel);
                            }
                        }
                    }
                }
            }
            
            setBuildingDataList(buildingDataMap);
            setBuildingCodeRates(ratesMap);
            setBaseMarketValues(baseMarketValuesMap);
            setAdjustedMarketValues(adjustedMarketValuesMap);
            setAssessmentLevels(assessmentLevelsMap);
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

    const handleCreateClick = (e: any) => {
        setCreatePopoverEvent(e.nativeEvent);
        setShowCreatePopover(true);
    };

    const handleCreateAdjustment = (buildingId: string) => {
        setSelectedValueInfoId(buildingId);
        
        // Get the building data to extract the area
        const buildingData = buildingDataList.get(buildingId);
        const buildingArea = buildingData?.area || area;
        
        setInitialAreaForModal(buildingArea);
        setExistingAdjustmentData(null);
        setShowAdjustmentModal(true);
    };

    const handleUpdateAdjustment = (buildingId: string) => {
        setSelectedValueInfoId(buildingId);
        
        // Get the building data to extract the area
        const buildingData = buildingDataList.get(buildingId);
        const buildingArea = buildingData?.area || area;
        
        setInitialAreaForModal(buildingArea);
        
        // Fetch existing adjustment data
        const existingData = getBuildingAdjustmentData(buildingId);
        setExistingAdjustmentData(existingData || null);
        
        setShowAdjustmentModal(true);
    };

    const filteredBuildingIds = buildingInfoIds.filter(id => {
        if (!searchTerm) return true;
        const buildingData = buildingDataList.get(id);
        if (!buildingData) return false;
        return Object.values(buildingData).some((value: any) => 
            value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    // Button actions array - Updated with proper handlers
    const buttonActions = [
        { 
            icon: createOutline, 
            className: "create-button", 
            onClick: () => filteredBuildingIds.length > 0 && handleCreateAdjustment(filteredBuildingIds[0]), 
            title: "Add Building adjustment", 
            enabled: filteredBuildingIds.length > 0 
        },
        { 
            icon: arrowUpCircleOutline, 
            className: "update-button", 
            onClick: () => filteredBuildingIds.length > 0 && handleUpdateAdjustment(filteredBuildingIds[0]), 
            title: "Update Building adjustment", 
            enabled: filteredBuildingIds.length > 0 
        },
        { 
            icon: trashOutline, 
            className: "delete-button", 
            onClick: handleCreateClick, 
            title: "Delete Building adjustment", 
            enabled: true 
        },
        { 
            icon: informationCircle, 
            className: "info-button", 
            onClick: () => { if (filteredBuildingIds.length > 0) handleViewDetails(filteredBuildingIds[0]); }, 
            title: "View Building Details", 
            enabled: filteredBuildingIds.length > 0 
        }
    ];

    const selectedBuildingData = selectedBuildingId ? buildingDataList.get(selectedBuildingId) : null;
    const selectedBuildingRate = selectedBuildingId ? buildingCodeRates.get(selectedBuildingId) : null;
    const selectedBaseMarketValue = selectedBuildingId ? baseMarketValues.get(selectedBuildingId) : null;
    const selectedAdjustedMarketValue = selectedBuildingId ? adjustedMarketValues.get(selectedBuildingId) : null;
    const selectedAssessmentLevel = selectedBuildingId ? assessmentLevels.get(selectedBuildingId) : null;

    // Array of building detail items to display - with proper null checks
    const buildingDetailItems = selectedBuildingData ? [
        { label: "Structure Type", value: selectedBuildingData.structureType || 'N/A' },
        { label: "Building Code", value: selectedBuildingData.buildingCode || 'N/A' },
        ...(selectedBuildingRate !== undefined && selectedBuildingRate !== null ? [{ label: "Building Code Rate", value: `₱${selectedBuildingRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }] : []),
        { label: "Storey", value: selectedBuildingData.storey || 'N/A' },
        { label: "Floor Order", value: selectedBuildingData.floorOrder || 'N/A' },
        { label: "Building Age", value: selectedBuildingData.buildingAge || 'N/A' },
        { label: "Building Permit", value: selectedBuildingData.buildingPermit || 'N/A' },
        { label: "Construction %", value: selectedBuildingData.constructionPercent !== null ? `${selectedBuildingData.constructionPercent}%` : 'N/A' },
        { label: "Depreciation Rate", value: selectedBuildingData.depreciationRate !== null ? `${selectedBuildingData.depreciationRate}%` : 'N/A' },
        { label: "Date Constructed", value: selectedBuildingData.dateConstructed || 'N/A' },
        { label: "Date Occupied", value: selectedBuildingData.dateOccupied || 'N/A' },
        { label: "Date Completed", value: selectedBuildingData.dateCompleted || 'N/A' }
    ] : [];

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
                </IonToolbar>
            </IonHeader>

            <IonContent className="building-content">
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

                {/* Loading State */}
                {loading ? (
                    <div className="loading-container">
                        <IonSpinner name="crescent" />
                        <IonText>Loading building information...</IonText>
                    </div>
                ) : buildingInfoIds.length > 0 ? (
                    <>
                        {/* Building Table */}
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
                                        <IonRow className={`table-row ${isSelected ? 'selected' : ''}`} onClick={() => handleViewDetails(id)} style={{ cursor: 'pointer' }}>
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
                                                    <IonCard className="details-card">
                                                        <IonCardContent>
                                                            <div className="building-details-grid">
                                                                {buildingDetailItems.map((item, index) => (
                                                                    <div key={index} className="detail-item">
                                                                        <span className="detail-label">{item.label}:</span>
                                                                        <span className="detail-value">{item.value}</span>
                                                                    </div>
                                                                ))}
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

                        {/* Search and Actions Section */}
                        <div className="search-container" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px', marginTop: '16px' }}>
                            <IonSearchbar placeholder="Search buildings..." value={searchTerm} onIonInput={handleSearch} className="forms-searchbar" />
                            
                            {/* Button actions from array */}
                            {buttonActions.map((action, index) => (
                                <IonButton key={index} fill="clear" className={action.className} onClick={action.onClick} style={{ margin: 0, opacity: action.enabled ? 1 : 0.5 }} title={action.title} disabled={!action.enabled}>
                                    <IonIcon icon={action.icon} slot="icon-only" />
                                </IonButton>
                            ))}
                            
                            <IonPopover isOpen={showCreatePopover} event={createPopoverEvent} onDidDismiss={() => setShowCreatePopover(false)}>
                                <IonContent>
                                    <div style={{ padding: '16px' }}>
                                        <h3>Create New Building</h3>
                                        <p>This would open a form to create a new building entry.</p>
                                        <IonButton expand="block" onClick={() => setShowCreatePopover(false)}>Close</IonButton>
                                    </div>
                                </IonContent>
                            </IonPopover>
                        </div>

                        {/* No Search Results */}
                        {filteredBuildingIds.length === 0 && searchTerm && (
                            <div className="no-results">
                                <IonText>No building information found matching your search.</IonText>
                            </div>
                        )}
                    </>
                ) : (
                    /* No Data State */
                    <div className="no-data">
                        <IonText>No building information available for this form.</IonText>
                    </div>
                )}
                
                {/* Building Adjustment Modal */}
                {showAdjustmentModal && selectedValueInfoId && (
                    <BuildingAdjustmentModal
                        isOpen={showAdjustmentModal}
                        onClose={() => setShowAdjustmentModal(false)}
                        valueInfoId={selectedValueInfoId}
                        existingData={existingAdjustmentData}
                        initialArea={initialAreaForModal}
                        onSaveSuccess={() => {
                            // Refresh data after successful save
                            loadBuildingData();
                        }}
                    />
                )}
            </IonContent>
        </IonPage>
    );
};

export default BuildingTable;