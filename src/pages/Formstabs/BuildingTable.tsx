// src/pages/BuildingTable.tsx

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
    IonPopover,
    IonToast,
    IonModal
} from "@ionic/react";
import { arrowBack, informationCircle, createOutline, arrowUpCircleOutline, trashOutline, closeCircleOutline } from "ionicons/icons";
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { BuildingDataLocalStorage } from '../../utils/tablestorages/BuildingDataLocalStorage';
import { getBuildingCodeByCode } from '../../utils/buildingCodeLocalStorage';
import {
    getAssessmentLevelData
} from '../../utils/assessmentLevelLocalStorage';
import { BuildingAdjustmentData, BuildingAdjustmentLocalStorage } from '../../utils/tablestorages/BuildingAdjustmentLocalStorage';
import '../../CSS/BuildingTable.css';
import '../../CSS/Forms.css';
import BuildingAdjustmentModal from "../../components/Modals/BuildingAdjustmentModal";
import DynamicTable from "../../components/GlobalComponent/DynamicTable";
import { BuildingSubcomponentData, getBuildingSubcomponentById } from "../../utils/BuildingSubcomponentLocalStorage";
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
    area,
    declarant,
    actual_use,
    district,
    classification,
    subclass
}) => {
    const [buildingInfoIds, setBuildingInfoIds] = useState<string[]>([]);
    const [buildingDataList, setBuildingDataList] = useState<Map<string, any>>(new Map());
    const [buildingCodeRates, setBuildingCodeRates] = useState<Map<string, number>>(new Map());
    const [baseMarketValues, setBaseMarketValues] = useState<Map<string, number>>(new Map());
    const [adjustedMarketValues, setAdjustedMarketValues] = useState<Map<string, number>>(new Map());
    const [assessmentLevels, setAssessmentLevels] = useState<Map<string, AssessmentLevelInfo>>(new Map());
    const [buildingAdjustments, setBuildingAdjustments] = useState<BuildingAdjustmentData[]>([]);
    const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
    const [selectedAdjustmentId, setSelectedAdjustmentId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [kindId, setKindId] = useState<number>(2);
    const [showCreatePopover, setShowCreatePopover] = useState(false);
    const [createPopoverEvent, setCreatePopoverEvent] = useState<any>(null);
    const [showSubcomponentModal, setShowSubcomponentModal] = useState(false);
    const [selectedSubcomponentData, setSelectedSubcomponentData] = useState<BuildingSubcomponentData | null>(null);

    // States for the adjustment modal
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
    const [selectedValueInfoId, setSelectedValueInfoId] = useState<string | null>(null);
    const [existingAdjustmentData, setExistingAdjustmentData] = useState<BuildingAdjustmentData | null>(null);

    // States for the IonToast
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning' | undefined>(undefined);

    useEffect(() => {
        console.log('BuildingTable props:', { form_id, kind, classification, area, declarant, actual_use, district, subclass });
        setKindId(2);
        loadBuildingData();
        loadBuildingAdjustments();
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

    const loadBuildingAdjustments = () => {
        try {
            const allAdjustments = BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
            const formBuildingIds = ValueInfoLocalStorage.getAllValueInfo()
                .filter(info => info.formDataId === form_id)
                .map(info => info.id);
            const filteredAdjustments = allAdjustments.filter(adj => formBuildingIds.includes(adj.value_info_id));
            setBuildingAdjustments(filteredAdjustments);
        } catch (error) {
            console.error('Error loading building adjustments:', error);
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

    const handleCreateAdjustment = () => {
        if (buildingInfoIds.length > 0) {
            setSelectedValueInfoId(buildingInfoIds[0]);
            setExistingAdjustmentData(null);
            setShowAdjustmentModal(true);
        }
    };

    const handleSelectAdjustmentRow = (rowData: BuildingAdjustmentData) => {
        const newSelectedId = rowData.bldg_adjustment_id === selectedAdjustmentId ? null : rowData.bldg_adjustment_id;
        setSelectedAdjustmentId(newSelectedId);
    };

    const handleDeleteAdjustment = () => {
        if (!selectedAdjustmentId) {
            setToastMessage('No adjustment selected to delete.');
            setToastColor('warning');
            setShowToast(true);
            return;
        }

        setToastMessage('Are you sure you want to delete this building adjustment?');
        setToastColor('warning');
        setShowToast(true);
    };

    const performDeletion = () => {
        const success = BuildingAdjustmentLocalStorage.deleteBuildingAdjustmentData(selectedAdjustmentId!);
        if (success) {
            loadBuildingAdjustments();
            setSelectedAdjustmentId(null);
            setToastMessage('Building adjustment deleted successfully!');
            setToastColor('success');
        } else {
            setToastMessage('Failed to delete building adjustment.');
            setToastColor('danger');
        }
        setShowToast(true);
    };

    const filteredBuildingIds = buildingInfoIds.filter(id => {
        if (!searchTerm) return true;
        const buildingData = buildingDataList.get(id);
        if (!buildingData) return false;
        return Object.values(buildingData).some((value: any) =>
            value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

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
            onClick: handleCreateAdjustment,
            title: "Add Building adjustment",
            enabled: buildingInfoIds.length > 0
        },
        {
            icon: arrowUpCircleOutline,
            className: "update-button",
            onClick: handleCreateClick,
            title: "Update Building adjustment",
            enabled: true
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
            onClick: () => { if (filteredBuildingIds.length > 0) handleViewDetails(filteredBuildingIds[0]); },
            title: "View Building Details",
            enabled: filteredBuildingIds.length > 0
        }
    ];

    const selectedBuildingData = selectedBuildingId ? buildingDataList.get(selectedBuildingId) : null;
    const selectedBuildingRate = selectedBuildingId ? buildingCodeRates.get(selectedBuildingId) : null;

    // Array of building detail items to display
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

    const handleAdjustmentRowClick = async (rowData: any) => {
        console.log('Row clicked:', rowData);

        // Check if this row has a buidlingsubcomponent (note the spelling)
        if (rowData && rowData.buidlingsubcomponent) {
            console.log('Found buidlingsubcomponent:', rowData.buidlingsubcomponent);
            try {
                // Use the buidlingsubcomponent value (e.g., 'CE1') to fetch subcomponent data
                const subcomponentData = await getBuildingSubcomponentById(rowData.buidlingsubcomponent);
                if (subcomponentData) {
                    setSelectedSubcomponentData(subcomponentData);
                    setShowSubcomponentModal(true);
                    console.log('Modal should be visible now');
                } else {
                    setToastMessage(`No subcomponent data found for ID: ${rowData.buidlingsubcomponent}`);
                    setToastColor('warning');
                    setShowToast(true);
                }
            } catch (error) {
                console.error('Error fetching subcomponent data:', error);
                setToastMessage('Error loading subcomponent details');
                setToastColor('danger');
                setShowToast(true);
            }
        } else {
            console.log('No buidlingsubcomponent found, selecting row');
            console.log('Available fields:', Object.keys(rowData || {}));
            // If no buidlingsubcomponent, just select the row for other operations
            handleSelectAdjustmentRow(rowData);
        }
    };

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
                ) : (
                    <>
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
                        ) : (
                            /* No Data State */
                            <div className="no-data">
                                <IonText>No building information available for this form.</IonText>
                            </div>
                        )}

                        {/* Search and Actions Section */}
                        <div className="search-container">
                            <IonSearchbar placeholder="Search adjustments..." value={searchTerm} onIonInput={handleSearch} className="forms-searchbar" />

                            <div className="icon-group">
                                {buttonActions.map((action, index) => (
                                    <IonButton key={index} fill="clear" className={action.className} onClick={action.onClick} style={{ opacity: action.enabled ? 1 : 0.5 }} title={action.title} disabled={!action.enabled}>
                                        <IonIcon icon={action.icon} slot="icon-only" />
                                    </IonButton>
                                ))}
                            </div>

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

                        {/* Building Adjustments Table */}
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
                    </>
                )}

                {/* Building Adjustment Modal */}
                {showAdjustmentModal && selectedValueInfoId && (
                    <BuildingAdjustmentModal
                        isOpen={showAdjustmentModal}
                        onClose={() => {
                            setShowAdjustmentModal(false);
                            loadBuildingAdjustments();
                        }}
                        valueInfoId={selectedValueInfoId}
                        existingData={existingAdjustmentData}
                        initialArea={area}
                        onSaveSuccess={() => {
                            loadBuildingData();
                            loadBuildingAdjustments();
                        }}
                    />
                )}

                {/* IonToast for Delete Confirmation and Status */}
                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => {
                        setShowToast(false);
                        setToastMessage('');
                    }}
                    message={toastMessage}
                    position="middle"
                    color={toastColor}
                    buttons={
                        toastColor === 'warning'
                            ? [
                                {
                                    side: 'end',
                                    text: 'Yes',
                                    handler: () => {
                                        performDeletion();
                                    }
                                },
                                {
                                    text: 'No',
                                    role: 'cancel',
                                    handler: () => {
                                        setToastMessage('Deletion cancelled.');
                                        setToastColor('warning');
                                        setShowToast(true);
                                    }
                                }
                            ]
                            : [
                                {
                                    text: 'Close',
                                    role: 'cancel',
                                    handler: () => {
                                        setShowToast(false);
                                    }
                                }
                            ]
                    }
                    duration={toastColor !== 'warning' ? 3000 : undefined}
                />

                {/* Building Subcomponent Details Modal */}
                <IonModal isOpen={showSubcomponentModal} onDidDismiss={() => setShowSubcomponentModal(false)}>
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>Building Subcomponent Details</IonTitle>
                            <IonButtons slot="end">
                                <IonButton onClick={() => setShowSubcomponentModal(false)}>
                                    <IonIcon icon={closeCircleOutline} />
                                </IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent className="ion-padding">
                        {selectedSubcomponentData ? (
                            <IonCard>
                                <IonCardContent>
                                    <IonGrid>
                                        <IonRow>
                                            <IonCol size="4"><strong>ID:</strong></IonCol>
                                            <IonCol>{selectedSubcomponentData.building_subcom_id}</IonCol>
                                        </IonRow>
                                        <IonRow>
                                            <IonCol size="4"><strong>Description:</strong></IonCol>
                                            <IonCol>{selectedSubcomponentData.description}</IonCol>
                                        </IonRow>
                                        <IonRow>
                                            <IonCol size="4"><strong>Rate:</strong></IonCol>
                                            <IonCol>₱{selectedSubcomponentData.rate.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}</IonCol>
                                        </IonRow>
                                        <IonRow>
                                            <IonCol size="4"><strong>Component ID:</strong></IonCol>
                                            <IonCol>{selectedSubcomponentData.building_com_id}</IonCol>
                                        </IonRow>
                                    </IonGrid>
                                </IonCardContent>
                            </IonCard>
                        ) : (
                            <IonText>No subcomponent data available.</IonText>
                        )}
                    </IonContent>
                </IonModal>
            </IonContent>
        </IonPage>
    );
};

export default BuildingTable;