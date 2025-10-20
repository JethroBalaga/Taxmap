import { useState, useEffect, useCallback } from "react";
import { ValueInfoLocalStorage } from '../../utils/tablestorages/ValueInfoLocalStorage';
import { BuildingDataLocalStorage } from '../../utils/tablestorages/BuildingDataLocalStorage';
import { getBuildingCodeByCode } from '../../utils/buildingCodeLocalStorage';
import { getAssessmentLevelData } from '../../utils/assessmentLevelLocalStorage';
import { BuildingAdjustmentData, BuildingAdjustmentLocalStorage } from '../../utils/tablestorages/BuildingAdjustmentLocalStorage';
import { BuildingSubcomponentData, getBuildingSubcomponentById } from "../../utils/BuildingSubcomponentLocalStorage";
import { FormDataLocalStorage } from '../../utils/tablestorages/FormDataLocalStorage';
import { PhotoTagLocalStorage } from '../../utils/tablestorages/PhotoTagLocalStorage';
import { supabaseApi } from '../../services/supabaseApi';
import { supabase } from '../../utils/supaBaseClient';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export interface AssessmentLevelInfo {
    rate_percent: string;
    range1: number;
    range2: number;
}

export const useBuildingTableLogic = (
    form_id: string,
    kind: string | number,
    classification: string,
    area: number,
    declarant: string,
    actual_use: string,
    district?: number | null,
    subclass?: string
) => {
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

    const [showUpdateAdjustmentModal, setShowUpdateAdjustmentModal] = useState(false);
    const [selectedAdjustmentForUpdate, setSelectedAdjustmentForUpdate] = useState<BuildingAdjustmentData | null>(null);

    const [showSubcomponentModal, setShowSubcomponentModal] = useState(false);
    const [selectedSubcomponentData, setSelectedSubcomponentData] = useState<BuildingSubcomponentData | null>(null);
    const [selectedAdjustmentArea, setSelectedAdjustmentArea] = useState<number>(0);
    const [selectedAdjustmentCompletion, setSelectedAdjustmentCompletion] = useState<string>('');
    const [selectedAdjustmentDepreciation, setSelectedAdjustmentDepreciation] = useState<string>('');

    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
    const [selectedBuildingData, setSelectedBuildingData] = useState<any>(null);

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning' | undefined>(undefined);

    // --- Photo Handling ---
    const getPhotoFile = useCallback(async (photoTag: any): Promise<Blob | null> => {
        try {
            // Photos are stored in the "phototags" directory in the filesystem
            const photoPath = `phototags/${photoTag.photoName}`;
            
            if (Capacitor.isNativePlatform()) {
                // For native apps, read from the data directory
                const file = await Filesystem.readFile({
                    path: photoPath,
                    directory: Directory.Data
                });
                
                // Convert base64 to Blob
                const blob = await (await fetch(`data:image/jpeg;base64,${file.data}`)).blob();
                return blob;
            } else {
                // For web, try to get from localStorage with the photoName as key
                const photoData = localStorage.getItem(photoTag.photoName);
                if (photoData) {
                    return await (await fetch(photoData)).blob();
                }
                
                // Fallback: check if photoData is stored directly in the photoTag
                if (photoTag.photoData) {
                    return await (await fetch(photoTag.photoData)).blob();
                }
            }

            console.warn('Photo not found for upload', photoTag);
            return null;
        } catch (error) {
            console.error('Error getting photo file:', error);
            return null;
        }
    }, []);

    const getPhotoFilePath = useCallback(async (photoTag: any): Promise<string | null> => {
        try {
            const photoPath = `phototags/${photoTag.photoName}`;
            
            if (Capacitor.isNativePlatform()) {
                // For native apps, get the file URI from the filesystem
                const fileInfo = await Filesystem.getUri({
                    path: photoPath,
                    directory: Directory.Data
                });
                return fileInfo.uri;
            } else {
                // For web, try to get the data URL from localStorage
                return localStorage.getItem(photoTag.photoName);
            }
        } catch (error) {
            console.error('Error getting photo file path:', error);
            return null;
        }
    }, []);

    // --- Market Values ---
    const calculateMarketValues = useCallback((buildingCodeRate: number, depreciationRate: number | null, area: number, constructionPercent: number | null) => {
        const baseMarketValue = buildingCodeRate * area;
        let adjustedMarketValue = baseMarketValue;

        if (constructionPercent != null) adjustedMarketValue *= (constructionPercent / 100);
        if (depreciationRate != null) adjustedMarketValue *= (1 - depreciationRate / 100);

        return { base: baseMarketValue, adjusted: adjustedMarketValue };
    }, []);

    const getAssessmentLevelForBuilding = useCallback(async (adjustedValue: number): Promise<AssessmentLevelInfo | null> => {
        try {
            const numericValue = Math.floor(adjustedValue);
            const levels = await getAssessmentLevelData();
            const matching = levels?.find(lvl => {
                if (!lvl) return false;
                const kindMatches = lvl.kind_id === kindId;
                const classMatches = lvl.class_id?.toString() === classification.toString();
                const inRange = numericValue >= (lvl.range1 ?? 0) && numericValue <= (lvl.range2 ?? 0);
                return kindMatches && classMatches && inRange;
            }) || null;

            return matching ? { rate_percent: matching.rate_percent, range1: matching.range1, range2: matching.range2 } : null;
        } catch {
            return null;
        }
    }, [kindId, classification]);

    // --- Adjustments ---
    const calculateAllAdjustments = useCallback(async () => {
        const map = new Map<string, number>();
        buildingInfoIds.forEach(id => map.set(id, 0));

        for (const adj of buildingAdjustments) {
            const buildingId = adj.value_info_id;
            const area = adj.area || 0;
            const completionPercent = parseFloat(adj.completion_percent) || 0;
            const depreciation = parseFloat(adj.depreciation) || 0;
            let rate = 0;

            if (adj.buidlingsubcomponent) {
                const subcomponent = await getBuildingSubcomponentById(adj.buidlingsubcomponent);
                if (subcomponent) rate = subcomponent.rate;
            }

            const baseValue = area * rate;
            const completedValue = baseValue * (completionPercent / 100);
            const adjustedValue = completedValue * (1 - (depreciation / 100));

            const current = map.get(buildingId) || 0;
            map.set(buildingId, current + adjustedValue);
        }

        setTotalAdjustments(map);
    }, [buildingAdjustments, buildingInfoIds]);

    // --- Load Data ---
    const loadBuildingData = useCallback(async () => {
        setLoading(true);
        try {
            const allInfos = ValueInfoLocalStorage.getAllValueInfo().filter(info => info.formDataId === form_id);
            const ids = allInfos.map(info => info.id);
            setBuildingInfoIds(ids);

            const dataMap = new Map<string, any>();
            const ratesMap = new Map<string, number>();
            const baseMap = new Map<string, number>();
            const adjustedMap = new Map<string, number>();
            const assessmentMap = new Map<string, AssessmentLevelInfo>();

            for (const id of ids) {
                const data = await BuildingDataLocalStorage.getBuildingData(id); // Added await
                if (!data) continue;
                dataMap.set(id, data);

                if (data.buildingCode) {
                    const codeData = await getBuildingCodeByCode(data.buildingCode);
                    if (codeData) {
                        ratesMap.set(id, codeData.rate);
                        const { base, adjusted } = calculateMarketValues(codeData.rate, data.depreciationRate, area, data.constructionPercent);
                        baseMap.set(id, base);
                        adjustedMap.set(id, adjusted);
                        const level = await getAssessmentLevelForBuilding(adjusted);
                        if (level) assessmentMap.set(id, level);
                    }
                }
            }

            setBuildingDataList(dataMap);
            setBuildingCodeRates(ratesMap);
            setBaseMarketValues(baseMap);
            setAdjustedMarketValues(adjustedMap);
            setAssessmentLevels(assessmentMap);

        } catch (error) {
            console.error('Error loading building data:', error);
        } finally {
            setLoading(false);
        }
    }, [form_id, area, calculateMarketValues, getAssessmentLevelForBuilding]);

    const loadBuildingAdjustments = useCallback(async () => {
        try {
            const allAdjustments = await BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
            const formBuildingIds = ValueInfoLocalStorage.getAllValueInfo().filter(info => info.formDataId === form_id).map(info => info.id);
            const filtered = allAdjustments.filter(adj => formBuildingIds.includes(adj.value_info_id));
            setBuildingAdjustments(filtered);
        } catch (error) {
            console.error('Error loading building adjustments:', error);
        }
    }, [form_id]);

    useEffect(() => {
        loadBuildingData();
        loadBuildingAdjustments();
    }, [form_id, kind, classification, area, declarant, actual_use, district, subclass, loadBuildingData, loadBuildingAdjustments]);

    useEffect(() => {
        calculateAllAdjustments();
    }, [buildingAdjustments, buildingInfoIds, calculateAllAdjustments]);

    // --- Handlers ---
    const handleViewDetails = (buildingId: string) => console.log('View details for building:', buildingId);

    const handleCreateAdjustment = () => {
        if (buildingInfoIds.length) {
            setSelectedValueInfoId(buildingInfoIds[0]);
            setExistingAdjustmentData(null);
            setShowAdjustmentModal(true);
        }
    };

    const handleAdjustmentUpdate = (adjustmentId: string) => {
        const adj = buildingAdjustments.find(a => a.bldg_adjustment_id === adjustmentId);
        if (adj) {
            setSelectedAdjustmentForUpdate(adj);
            setShowUpdateAdjustmentModal(true);
        } else {
            showToastMessage('Adjustment not found', 'danger');
        }
    };

    const handleSubcomponentRowClick = async (rowData: BuildingAdjustmentData) => {
        try {
            const subcomponent = await getBuildingSubcomponentById(rowData.buidlingsubcomponent);
            if (!subcomponent) {
                showToastMessage(`No subcomponent data found for ID: ${rowData.buidlingsubcomponent}`, 'warning');
                return;
            }
            setSelectedSubcomponentData(subcomponent);
            setSelectedAdjustmentArea(rowData.area);
            setSelectedAdjustmentCompletion(rowData.completion_percent);
            setSelectedAdjustmentDepreciation(rowData.depreciation);
            setShowSubcomponentModal(true);
        } catch (error) {
            console.error(error);
            showToastMessage('Error loading subcomponent details', 'danger');
        }
    };

    const handleBuildingUpdate = async (updatedData: any) => {
        try {
            await BuildingDataLocalStorage.updateBuildingData(selectedBuildingId, updatedData);
            loadBuildingData();
            loadBuildingAdjustments();
            showToastMessage('Building updated successfully!', 'success');
            setShowUpdateModal(false);
            setSelectedBuildingId('');
            setSelectedBuildingData(null);
        } catch (error) {
            console.error(error);
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

    // --- Submit Form + Upload ---
    const handleSubmit = async () => {
        setIsSubmitting(true);
        showToastMessage('Starting upload process...', 'warning');

        try {
            const formData = FormDataLocalStorage.getFormData(form_id);
            if (!formData) throw new Error('Form data not found');
            if (formData.uploaded) throw new Error('Form already uploaded');

            const valueInfos = ValueInfoLocalStorage.getAllValueInfo().filter(info => info.formDataId === form_id);
            if (!valueInfos.length) throw new Error('No value info found');
            const valueInfo = valueInfos[0];

            const photoTag = PhotoTagLocalStorage.getPhotoTag(valueInfo.photoTagId);
            if (!photoTag) throw new Error('Photo tag not found');

            // Insert photo record into database
            const databaseTagId = await supabaseApi.insertPhoto({
                photo: photoTag.photoName,
                longitude: photoTag.longitude,
                latitude: photoTag.latitude,
                date_taken: photoTag.timestamp.toISOString().split('T')[0]
            });
            if (!databaseTagId) throw new Error('Failed to insert photo record');

            // Upload the actual photo file
            const photoFile = await getPhotoFile(photoTag);
            if (photoFile) {
                // Use the database ID and original photo name for the storage path
                const folderPath = `${databaseTagId}/${photoTag.photoName}`;
                const { error: uploadError } = await supabase.storage.from('tag-photos').upload(folderPath, photoFile, {
                    contentType: 'image/jpeg',
                    upsert: false
                });
                if (uploadError) {
                    console.warn('Photo upload failed', uploadError);
                    showToastMessage('Form submitted but photo upload failed', 'warning');
                } else {
                    // Photo uploaded successfully - KEEP local copy (no cleanup)
                    console.log('Photo uploaded successfully, keeping local copy');
                }
            } else {
                showToastMessage('Form submitted but could not retrieve photo', 'warning');
            }

            // Insert form, value info, general description, adjustments
            const databaseFormId = await supabaseApi.insertForm({
                declarant_id: formData.declarantId || 0,
                kind_id: parseInt(formData.kind),
                class_id: formData.classification,
                area: formData.area.toString(),
                district_id: formData.district,
                actual_used_id: formData.actualUse,
                subclass_id: formData.subclass || null,
                status: 'New'
            });
            if (!databaseFormId) throw new Error('Failed to insert form');

            const databaseValueInfoId = await supabaseApi.insertValueInfo(databaseFormId, databaseTagId);

            const buildingData = await BuildingDataLocalStorage.getBuildingData(valueInfo.id); // Added await
            if (!buildingData) throw new Error('Building data not found');

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

            const adjustments = await BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
            const filteredAdjustments = adjustments
                .filter(adj => adj.value_info_id === valueInfo.id)
                .map(adj => ({
                    building_subcom_id: adj.buidlingsubcomponent,
                    description: adj.description,
                    completion_percent: adj.completion_percent,
                    depreciation: adj.depreciation,
                    area: adj.area
                }));
            if (filteredAdjustments.length) await supabaseApi.insertBuildingAdjustments(databaseValueInfoId, filteredAdjustments);

            await supabaseApi.updateFormStatus(databaseFormId, 'New');
            FormDataLocalStorage.markFormAsUploaded(form_id, databaseFormId);

            showToastMessage('Form submitted successfully! Data synchronized with server.', 'success');

        } catch (error: any) {
            console.error('Upload failed:', error);
            showToastMessage(`Upload failed: ${error.message || 'Unknown error'}`, 'danger');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        buildingInfoIds,
        buildingDataList,
        buildingCodeRates,
        baseMarketValues,
        adjustedMarketValues,
        assessmentLevels,
        buildingAdjustments,
        totalAdjustments,
        loading,
        isSubmitting,
        showAdjustmentModal,
        selectedValueInfoId,
        existingAdjustmentData,
        showUpdateAdjustmentModal,
        selectedAdjustmentForUpdate,
        showSubcomponentModal,
        selectedSubcomponentData,
        selectedAdjustmentArea,
        selectedAdjustmentCompletion,
        selectedAdjustmentDepreciation,
        showUpdateModal,
        selectedBuildingId,
        selectedBuildingData,
        showToast,
        toastMessage,
        toastColor,

        setBuildingInfoIds,
        setBuildingDataList,
        setBuildingCodeRates,
        setBaseMarketValues,
        setAdjustedMarketValues,
        setAssessmentLevels,
        setBuildingAdjustments,
        setTotalAdjustments,
        setLoading,
        setIsSubmitting,
        setShowAdjustmentModal,
        setSelectedValueInfoId,
        setExistingAdjustmentData,
        setShowUpdateAdjustmentModal,
        setSelectedAdjustmentForUpdate,
        setShowSubcomponentModal,
        setSelectedSubcomponentData,
        setSelectedAdjustmentArea,
        setSelectedAdjustmentCompletion,
        setSelectedAdjustmentDepreciation,
        setShowUpdateModal,
        setSelectedBuildingId,
        setSelectedBuildingData,
        setShowToast,
        setToastMessage,
        setToastColor,

        loadBuildingData,
        loadBuildingAdjustments,
        handleViewDetails,
        handleCreateAdjustment,
        handleAdjustmentUpdate,
        handleSubcomponentRowClick,
        handleBuildingUpdate,
        handleUpdateClick,
        showToastMessage,
        handleSubmit,
        getPhotoFilePath
    };
};