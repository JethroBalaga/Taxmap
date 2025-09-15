// src/pages/BuildingTable.tsx
import React, { useState, useEffect } from "react";
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonToast
} from "@ionic/react";
import { arrowBack } from "ionicons/icons";
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { BuildingDataLocalStorage } from '../../utils/tablestorages/BuildingDataLocalStorage';
import { getBuildingCodeByCode } from '../../utils/buildingCodeLocalStorage';
import { getAssessmentLevelData } from '../../utils/assessmentLevelLocalStorage';
import { BuildingAdjustmentData, BuildingAdjustmentLocalStorage } from '../../utils/tablestorages/BuildingAdjustmentLocalStorage';
import { BuildingSubcomponentData, getBuildingSubcomponentById } from "../../utils/BuildingSubcomponentLocalStorage";
import BuildingList from './BuildingList';
import BuildingAdjustmentsTable from './BuildingAdjustmentsTable';
import BuildingAdjustmentModal from "../../components/Modals/BuildingAdjustmentModal";
import BuildingSubcomponentModal from "../../components/Modals/BuildingSubcomponentModal";

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
    const [loading, setLoading] = useState(true);
    const [kindId] = useState<number>(2);

    // Modal states
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
    const [selectedValueInfoId, setSelectedValueInfoId] = useState<string | null>(null);
    const [existingAdjustmentData, setExistingAdjustmentData] = useState<BuildingAdjustmentData | null>(null);

    // Subcomponent modal states
    const [showSubcomponentModal, setShowSubcomponentModal] = useState(false);
    const [selectedSubcomponentData, setSelectedSubcomponentData] = useState<BuildingSubcomponentData | null>(null);

    // Toast states
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning' | undefined>(undefined);

    useEffect(() => {
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

    const handleCreateAdjustment = () => {
        if (buildingInfoIds.length > 0) {
            setSelectedValueInfoId(buildingInfoIds[0]);
            setExistingAdjustmentData(null);
            setShowAdjustmentModal(true);
        }
    };

    const handleSubcomponentRowClick = async (subcomponentId: string) => {
        try {
            const subcomponentData = await getBuildingSubcomponentById(subcomponentId);
            if (subcomponentData) {
                setSelectedSubcomponentData(subcomponentData);
                setShowSubcomponentModal(true);
            } else {
                showToastMessage(`No subcomponent data found for ID: ${subcomponentId}`, 'warning');
            }
        } catch (error) {
            console.error('Error fetching subcomponent data:', error);
            showToastMessage('Error loading subcomponent details', 'danger');
        }
    };

    const showToastMessage = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
        setToastMessage(message);
        setToastColor(color);
        setShowToast(true);
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
                    onAdjustmentCreate={handleCreateAdjustment}
                />

                <BuildingAdjustmentsTable
                    buildingAdjustments={buildingAdjustments}
                    buildingInfoIds={buildingInfoIds}
                    onAdjustmentCreate={handleCreateAdjustment}
                    onAdjustmentsUpdate={loadBuildingAdjustments}
                    showToastMessage={showToastMessage}
                    onSubcomponentClick={handleSubcomponentRowClick}
                    area={area} 
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

                {/* Building Subcomponent Modal */}
                <BuildingSubcomponentModal
                    isOpen={showSubcomponentModal}
                    onClose={() => setShowSubcomponentModal(false)}
                    subcomponentData={selectedSubcomponentData}
                    area={area}
                />

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