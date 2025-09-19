import React, { useState, useEffect } from "react";
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonToast,
    IonTitle,
    IonSpinner
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { BuildingDataLocalStorage } from '../../utils/tablestorages/BuildingDataLocalStorage';
import { getBuildingCodeByCode } from '../../utils/buildingCodeLocalStorage';
import { getAssessmentLevelData } from '../../utils/assessmentLevelLocalStorage';
import { BuildingAdjustmentData, BuildingAdjustmentLocalStorage } from '../../utils/tablestorages/BuildingAdjustmentLocalStorage';
import { BuildingSubcomponentData, getBuildingSubcomponentById } from "../../utils/BuildingSubcomponentLocalStorage";
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import { PhotoTagLocalStorage } from '../../utils/tablestorages/PhotoTagLocalStorage';
import { supabaseApi } from '../../services/supabaseApi';
import BuildingList from './BuildingList';
import BuildingAdjustmentsTable from './BuildingAdjustmentsTable';
import BuildingAdjustmentModal from "../../components/Modals/BuildingAdjustmentModal";
import BuildingAdjustmentUpdateModal from "../../components/Modals/BuildingAdjustmentUpdateModal";
import BuildingSubcomponentModal from "../../components/Modals/BuildingSubcomponentModal";
import BuildingUpdateModal from "../../components/Modals/BuildingUpdateModal";
import "../../CSS/BuildingResponsive.css";

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
    const [totalAdjustments, setTotalAdjustments] = useState<Map<string, number>>(new Map());
    const [loading, setLoading] = useState(true);
    const [kindId] = useState<number>(2);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal states
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
    const [selectedValueInfoId, setSelectedValueInfoId] = useState<string | null>(null);
    const [existingAdjustmentData, setExistingAdjustmentData] = useState<BuildingAdjustmentData | null>(null);

    // Update adjustment modal states
    const [showUpdateAdjustmentModal, setShowUpdateAdjustmentModal] = useState(false);
    const [selectedAdjustmentForUpdate, setSelectedAdjustmentForUpdate] = useState<BuildingAdjustmentData | null>(null);

    // Subcomponent modal states
    const [showSubcomponentModal, setShowSubcomponentModal] = useState(false);
    const [selectedSubcomponentData, setSelectedSubcomponentData] = useState<BuildingSubcomponentData | null>(null);
    const [selectedAdjustmentArea, setSelectedAdjustmentArea] = useState<number>(0);
    const [selectedAdjustmentCompletion, setSelectedAdjustmentCompletion] = useState<string>('');
    const [selectedAdjustmentDepreciation, setSelectedAdjustmentDepreciation] = useState<string>('');

    // Building update modal states
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
    const [selectedBuildingData, setSelectedBuildingData] = useState<any>(null);

    // Toast states
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning' | undefined>(undefined);

    useEffect(() => {
        loadBuildingData();
        loadBuildingAdjustments();
    }, [form_id, kind, classification, area, declarant, actual_use, district, subclass]);

    useEffect(() => {
        calculateAllAdjustments();
    }, [buildingAdjustments, buildingInfoIds]);

    const calculateAllAdjustments = async () => {
        const adjustmentsMap = new Map<string, number>();

        // Initialize with 0 for all buildings
        buildingInfoIds.forEach(id => adjustmentsMap.set(id, 0));

        // Calculate adjustments for each building
        for (const adj of buildingAdjustments) {
            const buildingId = adj.value_info_id;
            const area = adj.area || 0;
            const completionPercent = parseFloat(adj.completion_percent) || 0;
            const depreciation = parseFloat(adj.depreciation) || 0;

            // Get the rate from the building subcomponent
            let rate = 0;
            if (adj.buidlingsubcomponent) {
                const subcomponentData = await getBuildingSubcomponentById(adj.buidlingsubcomponent);
                if (subcomponentData) {
                    rate = subcomponentData.rate;
                }
            }

            // Calculate adjustment value: (area * rate) * completion% * (1 - depreciation%)
            const baseValue = area * rate;
            const completedValue = baseValue * (completionPercent / 100);
            const adjustedValue = completedValue * (1 - (depreciation / 100));

            // Add to the total for this building
            const currentTotal = adjustmentsMap.get(buildingId) || 0;
            adjustmentsMap.set(buildingId, currentTotal + adjustedValue);
        }

        setTotalAdjustments(adjustmentsMap);
    };

    const calculateMarketValues = (buildingCodeRate: number, depreciationRate: number | null, area: number, constructionPercent: number | null): { base: number, adjusted: number } => {
        const baseMarketValue = buildingCodeRate * area;
        let adjustedMarketValue = baseMarketValue;

        if (constructionPercent !== null && constructionPercent !== undefined) {
            adjustedMarketValue = adjustedMarketValue * (constructionPercent / 100);
        }

        if (depreciationRate !== null && depreciationRate !== undefined) {
            const depreciationDecimal = depreciationRate / 100;
            adjustedMarketValue = adjustedMarketValue * (1 - depreciationDecimal);
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
                            const marketValues = calculateMarketValues(buildingCodeData.rate, data.depreciationRate, area, data.constructionPercent);
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

    const handleViewDetails = (buildingId: string) => {
        // Handle viewing building details if needed
        console.log('View details for building:', buildingId);
    };

    const handleCreateAdjustment = () => {
        if (buildingInfoIds.length > 0) {
            setSelectedValueInfoId(buildingInfoIds[0]);
            setExistingAdjustmentData(null);
            setShowAdjustmentModal(true);
        }
    };

    const handleAdjustmentUpdate = (adjustmentId: string) => {
        const adjustment = buildingAdjustments.find(adj => adj.bldg_adjustment_id === adjustmentId);
        if (adjustment) {
            setSelectedAdjustmentForUpdate(adjustment);
            setShowUpdateAdjustmentModal(true);
        } else {
            showToastMessage('Adjustment not found', 'danger');
        }
    };

    const handleSubcomponentRowClick = async (rowData: BuildingAdjustmentData) => {
        try {
            const subcomponentData = await getBuildingSubcomponentById(rowData.buidlingsubcomponent);
            if (subcomponentData) {
                setSelectedSubcomponentData(subcomponentData);
                setSelectedAdjustmentArea(rowData.area);
                setSelectedAdjustmentCompletion(rowData.completion_percent);
                setSelectedAdjustmentDepreciation(rowData.depreciation);
                setShowSubcomponentModal(true);
            } else {
                showToastMessage(`No subcomponent data found for ID: ${rowData.buidlingsubcomponent}`, 'warning');
            }
        } catch (error) {
            console.error('Error fetching subcomponent data:', error);
            showToastMessage('Error loading subcomponent details', 'danger');
        }
    };

    const handleBuildingUpdate = (updatedData: any) => {
        console.log('Updating building:', selectedBuildingId, updatedData);

        // Update the building data in localStorage
        try {
            BuildingDataLocalStorage.updateBuildingData(selectedBuildingId, updatedData);

            // Reload the data to reflect changes
            loadBuildingData();
            loadBuildingAdjustments();

            showToastMessage('Building updated successfully!', 'success');

            // Close the modal
            setShowUpdateModal(false);
            setSelectedBuildingId('');
            setSelectedBuildingData(null);
        } catch (error) {
            console.error('Error updating building:', error);
            showToastMessage('Error updating building', 'danger');
        }
    };

    const handleUpdateClick = (buildingId: string, buildingData: any) => {
        setSelectedBuildingId(buildingId);
        setSelectedBuildingData(buildingData);
        setShowUpdateModal(true);
    };

    const showToastMessage = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
        setToastMessage(message);
        setToastColor(color);
        setShowToast(true);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        showToastMessage('Starting upload process...', 'warning');

        try {
            // 1. Get all related data from local storage
            const formData = FormDataLocalStorage.getFormData(form_id);
            if (!formData) {
                throw new Error('Form data not found in local storage');
            }

            // Check if already uploaded
            if (formData.uploaded) {
                throw new Error('This form has already been uploaded');
            }

            const valueInfos = ValueInfoLocalStorage.getAllValueInfo().filter(
                info => info.formDataId === form_id
            );

            if (valueInfos.length === 0) {
                throw new Error('No value info found for this form');
            }

            const valueInfo = valueInfos[0];

            // 2. Upload Form Data (excluding offline id)
            const databaseFormId = await supabaseApi.insertForm({
                declarant_id: formData.declarantId || 0,
                kind_id: parseInt(formData.kind),
                class_id: formData.classification,
                area: formData.area.toString(),
                user_id: formData.userId || null,
                district_id: formData.district,
                actual_used_id: formData.actualUse,
                subclass_id: formData.subclass || null,
                status: 'New'
            });

            // 3. Upload Photo Data
            if (!valueInfo.photoTagId) {
                throw new Error('No photo tag ID found in value info');
            }

            const photoTag = PhotoTagLocalStorage.getPhotoTag(valueInfo.photoTagId);
            if (!photoTag) {
                throw new Error('Photo tag not found in local storage');
            }

            const databaseTagId = await supabaseApi.insertPhoto({
                photo: photoTag.photoName,
                longitude: photoTag.longitude,
                latitude: photoTag.latitude,
                accuracy: photoTag.accuracy || null,
                altitude: photoTag.altitude || null,
                date_taken: photoTag.timestamp.toISOString().split('T')[0]
            });

            // 4. Create value_info entry
            const databaseValueInfoId = await supabaseApi.insertValueInfo(
                databaseFormId,
                databaseTagId
            );

            // 5. Upload Building Data (General Description)
            const buildingData = BuildingDataLocalStorage.getBuildingData(valueInfo.id);
            if (!buildingData) {
                throw new Error('Building data not found in local storage');
            }

            await supabaseApi.insertGeneralDescription(databaseValueInfoId, {
                building_code: buildingData.buildingCode,
                storey: buildingData.storey || 0,
                floor_order: buildingData.floorOrder || 0,
                bld_age: buildingData.buildingAge || null,
                bldg_permit: buildingData.buildingPermit || null,
                construction_percent: buildingData.constructionPercent?.toString() || null,
                date_constructed: buildingData.dateConstructed || null,
                date_occupied: buildingData.dateOccupied || null,
                date_completed: buildingData.dateCompleted || null,
                depreciation_rate: buildingData.depreciationRate?.toString() || null
            });

            // 6. Upload Building Adjustments
            const adjustments = BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData()
                .filter(adj => adj.value_info_id === valueInfo.id)
                .map(adj => ({
                    building_subcom_id: adj.buidlingsubcomponent,
                    description: adj.description,
                    completion_percent: adj.completion_percent,
                    depreciation: adj.depreciation,
                    area: adj.area
                }));

            if (adjustments.length > 0) {
                await supabaseApi.insertBuildingAdjustments(databaseValueInfoId, adjustments);
            }

            // 7. Update form status in database
            await supabaseApi.updateFormStatus(databaseFormId, 'New');

            // 8. Update local storage to mark as uploaded
            FormDataLocalStorage.markFormAsUploaded(form_id, databaseFormId);

            // SUCCESS!
            showToastMessage('Form submitted successfully! Data synchronized with server.', 'success');

            // Optionally navigate back after a delay
            setTimeout(() => {
                onBack();
            }, 2000);

        } catch (error: any) {
            console.error('Upload failed:', error);
            showToastMessage(`Upload failed: ${error.message || 'Unknown error'}`, 'danger');
        } finally {
            setIsSubmitting(false);
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
                    <IonTitle>Building Assessment</IonTitle>
                    <IonButtons slot="end">
                        <IonButton
                            onClick={handleSubmit}
                            color="primary"
                            fill="solid"
                            disabled={isSubmitting}
                            style={{
                                fontWeight: 'bold',
                                borderRadius: '4px',
                                padding: '0 16px',
                                height: '36px'
                            }}
                        >
                            {isSubmitting ? <IonSpinner name="crescent" /> : 'Submit'}
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="building-content">
                <BuildingList
                    form_id={form_id}
                    district={district}
                    declarant={declarant}
                    kind={kind}
                    classification={classification}
                    subclass={subclass}
                    actual_use={actual_use}
                    area={area}
                    loading={loading}
                    buildingInfoIds={buildingInfoIds}
                    buildingDataList={buildingDataList}
                    baseMarketValues={baseMarketValues}
                    adjustedMarketValues={adjustedMarketValues}
                    assessmentLevels={assessmentLevels}
                    buildingCodeRates={buildingCodeRates}
                    totalAdjustments={totalAdjustments}
                    onViewDetails={handleViewDetails}
                    onUpdateClick={handleUpdateClick}
                />

                <BuildingAdjustmentsTable
                    buildingAdjustments={buildingAdjustments}
                    buildingInfoIds={buildingInfoIds}
                    onAdjustmentCreate={handleCreateAdjustment}
                    onAdjustmentUpdate={handleAdjustmentUpdate}
                    onAdjustmentsUpdate={() => {
                        loadBuildingAdjustments();
                        loadBuildingData();
                    }}
                    showToastMessage={showToastMessage}
                    onSubcomponentClick={handleSubcomponentRowClick}
                />

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

                {/* Building Adjustment Update Modal */}
                {showUpdateAdjustmentModal && selectedAdjustmentForUpdate && (
                    <BuildingAdjustmentUpdateModal
                        isOpen={showUpdateAdjustmentModal}
                        onClose={() => {
                            setShowUpdateAdjustmentModal(false);
                            setSelectedAdjustmentForUpdate(null);
                            loadBuildingAdjustments();
                        }}
                        valueInfoId={selectedAdjustmentForUpdate.value_info_id}
                        existingData={selectedAdjustmentForUpdate}
                        onSaveSuccess={() => {
                            loadBuildingData();
                            loadBuildingAdjustments();
                            setShowUpdateAdjustmentModal(false);
                            setSelectedAdjustmentForUpdate(null);
                        }}
                    />
                )}

                {/* Building Subcomponent Modal */}
                <BuildingSubcomponentModal
                    isOpen={showSubcomponentModal}
                    onClose={() => setShowSubcomponentModal(false)}
                    subcomponentData={selectedSubcomponentData}
                    area={selectedAdjustmentArea}
                    completionPercent={selectedAdjustmentCompletion}
                    depreciation={selectedAdjustmentDepreciation}
                />

                {/* Building Update Modal */}
                {showUpdateModal && selectedBuildingId && selectedBuildingData && (
                    <BuildingUpdateModal
                        isOpen={showUpdateModal}
                        onDismiss={() => {
                            setShowUpdateModal(false);
                            setSelectedBuildingId('');
                            setSelectedBuildingData(null);
                        }}
                        onUpdate={handleBuildingUpdate}
                        buildingId={selectedBuildingId}
                        initialBuildingData={selectedBuildingData}
                    />
                )}

                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={toastMessage}
                    position="middle"
                    color={toastColor}
                    duration={3000}
                />
            </IonContent>
        </IonPage>
    );
};

export default BuildingTable;