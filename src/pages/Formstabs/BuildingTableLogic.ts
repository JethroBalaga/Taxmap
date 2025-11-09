import { useState, useEffect, useCallback, useRef } from "react";
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
    const isMountedRef = useRef(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [recalculationTrigger, setRecalculationTrigger] = useState(0);

    // State declarations
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
    const [isFormUploaded, setIsFormUploaded] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

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
    const [selectedBaseMarketValue, setSelectedBaseMarketValue] = useState<number>(0);
    const [selectedStorey, setSelectedStorey] = useState<number>(1);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
    const [selectedBuildingData, setSelectedBuildingData] = useState<any>(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning' | undefined>(undefined);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Check if form is already uploaded
    const checkFormUploaded = useCallback(async () => {
        if (!isMountedRef.current || !form_id) return;
        
        try {
            const formData = await FormDataLocalStorage.getFormData(form_id);
            if (formData?.uploaded) {
                setIsFormUploaded(true);
            } else {
                setIsFormUploaded(false);
            }
        } catch (error) {
            console.error('Error checking form uploaded status:', error);
        }
    }, [form_id]);

    // Photo Handling
    const getPhotoFile = useCallback(async (photoTag: any): Promise<Blob | null> => {
        try {
            const photoPath = `phototags/${photoTag.photoName}`;

            if (Capacitor.isNativePlatform()) {
                const file = await Filesystem.readFile({
                    path: photoPath,
                    directory: Directory.Data
                });
                const blob = await (await fetch(`data:image/jpeg;base64,${file.data}`)).blob();
                return blob;
            } else {
                const photoData = localStorage.getItem(photoTag.photoName);
                if (photoData) {
                    return await (await fetch(photoData)).blob();
                }
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
                const fileInfo = await Filesystem.getUri({
                    path: photoPath,
                    directory: Directory.Data
                });
                return fileInfo.uri;
            } else {
                return localStorage.getItem(photoTag.photoName);
            }
        } catch (error) {
            console.error('Error getting photo file path:', error);
            return null;
        }
    }, []);

    // Market Values - UPDATED with storey multiplication for building base values
    const calculateMarketValues = useCallback((buildingCodeRate: number, depreciationRate: number | null, area: number, constructionPercent: number | null, storey: number = 1) => {
        // Multiply base area by storey for building base calculations
        const totalArea = area * storey;
        const baseMarketValue = buildingCodeRate * totalArea;
        let adjustedMarketValue = baseMarketValue;

        if (constructionPercent != null) adjustedMarketValue *= (constructionPercent / 100);
        if (depreciationRate != null) adjustedMarketValue *= (1 - depreciationRate / 100);

        return { base: baseMarketValue, adjusted: adjustedMarketValue };
    }, []);

    const getAssessmentLevelForBuilding = useCallback(async (adjustedValue: number): Promise<AssessmentLevelInfo | null> => {
        try {
            const numericValue = adjustedValue;
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

    // NEW: Function to recalculate assessment levels based on final adjusted values
    const recalculateAssessmentLevels = useCallback(async (currentBuildingAdjustments: BuildingAdjustmentData[]) => {
        if (!isMountedRef.current || buildingInfoIds.length === 0) return;
        
        console.log('Recalculating assessment levels with adjustments...');
        
        const assessmentMap = new Map<string, AssessmentLevelInfo>();
        
        for (const id of buildingInfoIds) {
            const originalAdjustedValue = adjustedMarketValues.get(id) || 0;
            
            // Calculate current adjustments total
            let currentAdjustmentTotal = 0;
            for (const adj of currentBuildingAdjustments) {
                if (adj.value_info_id === id) {
                    const area = adj.area || 0;
                    const completionPercent = parseFloat(adj.completion_percent) || 0;
                    const depreciation = parseFloat(adj.depreciation) || 0;
                    let adjustmentValue = 0;

                    if (adj.buidlingsubcomponent) {
                        const subcomponent = await getBuildingSubcomponentById(adj.buidlingsubcomponent);
                        if (subcomponent) {
                            const baseMarketValue = baseMarketValues.get(id) || 0;
                            
                            if (subcomponent.percent) {
                                const percentageRate = subcomponent.rate / 100;
                                adjustmentValue = baseMarketValue * percentageRate;
                            } else {
                                adjustmentValue = area * subcomponent.rate;
                            }
                        }
                    }

                    const completedValue = adjustmentValue * (completionPercent / 100);
                    const adjustedValue = completedValue * (1 - (depreciation / 100));
                    currentAdjustmentTotal += adjustedValue;
                }
            }
            
            const finalAdjustedValue = originalAdjustedValue + currentAdjustmentTotal;
            
            console.log(`Building ${id}: Original=${originalAdjustedValue}, Adjustments=${currentAdjustmentTotal}, Final=${finalAdjustedValue}`);
            
            const level = await getAssessmentLevelForBuilding(finalAdjustedValue);
            if (level) {
                assessmentMap.set(id, level);
                console.log(`Building ${id}: New assessment level=${level.rate_percent}`);
            } else {
                console.log(`Building ${id}: No assessment level found for value=${finalAdjustedValue}`);
            }
        }
        
        if (isMountedRef.current) {
            setAssessmentLevels(assessmentMap);
        }
    }, [buildingInfoIds, adjustedMarketValues, baseMarketValues, getAssessmentLevelForBuilding]);

    // Adjustments - UPDATED to use correct base values
    const calculateAllAdjustments = useCallback(async (currentBuildingAdjustments: BuildingAdjustmentData[]) => {
        if (!isMountedRef.current) return;
        
        console.log('Calculating all adjustments...');
        
        const map = new Map<string, number>();
        buildingInfoIds.forEach(id => map.set(id, 0));

        for (const adj of currentBuildingAdjustments) {
            const buildingId = adj.value_info_id;
            const area = adj.area || 0;
            const completionPercent = parseFloat(adj.completion_percent) || 0;
            const depreciation = parseFloat(adj.depreciation) || 0;
            let adjustmentValue = 0;

            if (adj.buidlingsubcomponent) {
                const subcomponent = await getBuildingSubcomponentById(adj.buidlingsubcomponent);
                if (subcomponent) {
                    // Get base market value (which already includes storey multiplication)
                    const baseMarketValue = baseMarketValues.get(buildingId) || 0;
                    
                    if (subcomponent.percent) {
                        // Percentage mode: base_market_value × rate%
                        // baseMarketValue already includes storey multiplication from building base calculation
                        const percentageRate = subcomponent.rate / 100;
                        adjustmentValue = baseMarketValue * percentageRate;
                    } else {
                        // Fixed rate mode: adjustment_area × rate
                        // Adjustment area is NOT multiplied by storey (only building base area is)
                        adjustmentValue = area * subcomponent.rate;
                    }
                }
            }

            // Apply completion percentage
            const completedValue = adjustmentValue * (completionPercent / 100);
            // Apply depreciation
            const adjustedValue = completedValue * (1 - (depreciation / 100));

            const current = map.get(buildingId) || 0;
            map.set(buildingId, current + adjustedValue);
            
            console.log(`Adjustment ${adj.bldg_adjustment_id}: Value=${adjustedValue}, Total for building=${current + adjustedValue}`);
        }

        if (isMountedRef.current) {
            setTotalAdjustments(map);
        }
    }, [buildingInfoIds, baseMarketValues]);

    // Load Data Functions - UPDATED to pass storey to base calculations
    const loadBuildingData = useCallback(async () => {
        if (!isMountedRef.current || !form_id) return;
        
        try {
            const allInfos = await ValueInfoLocalStorage.getAllValueInfo();
            const filteredInfos = allInfos.filter(info => info.formDataId === form_id);
            const ids = filteredInfos.map(info => info.id);
            
            if (!isMountedRef.current) return;
            setBuildingInfoIds(ids);

            const dataMap = new Map<string, any>();
            const ratesMap = new Map<string, number>();
            const baseMap = new Map<string, number>();
            const adjustedMap = new Map<string, number>();
            const assessmentMap = new Map<string, AssessmentLevelInfo>();

            for (const id of ids) {
                const data = await BuildingDataLocalStorage.getBuildingData(id);
                if (!data) continue;
                dataMap.set(id, data);

                if (data.buildingCode) {
                    const codeData = await getBuildingCodeByCode(data.buildingCode);
                    if (codeData) {
                        ratesMap.set(id, codeData.rate);
                        // Get storey from building data, default to 1
                        const storey = data.storey || 1;
                        const { base, adjusted } = calculateMarketValues(
                            codeData.rate, 
                            data.depreciationRate, 
                            area, 
                            data.constructionPercent,
                            storey // Pass storey to base calculation
                        );
                        baseMap.set(id, base);
                        adjustedMap.set(id, adjusted);
                        const level = await getAssessmentLevelForBuilding(adjusted);
                        if (level) assessmentMap.set(id, level);
                    }
                }
            }

            if (isMountedRef.current) {
                setBuildingDataList(dataMap);
                setBuildingCodeRates(ratesMap);
                setBaseMarketValues(baseMap);
                setAdjustedMarketValues(adjustedMap);
                setAssessmentLevels(assessmentMap);
            }

        } catch (error) {
            console.error('Error loading building data:', error);
        }
    }, [form_id, area, calculateMarketValues, getAssessmentLevelForBuilding]);

    const loadBuildingAdjustments = useCallback(async () => {
        if (!isMountedRef.current || !form_id) return;
        
        try {
            const allAdjustments = await BuildingAdjustmentLocalStorage.getAllBuildingAdjustmentData();
            const allInfos = await ValueInfoLocalStorage.getAllValueInfo();
            const formBuildingIds = allInfos.filter(info => info.formDataId === form_id).map(info => info.id);
            const filtered = allAdjustments.filter(adj => formBuildingIds.includes(adj.value_info_id));
            
            if (isMountedRef.current) {
                setBuildingAdjustments(filtered);
                // Trigger recalculation after loading adjustments
                setRecalculationTrigger(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error loading building adjustments:', error);
        }
    }, [form_id]);

    // SINGLE data loading effect
    useEffect(() => {
        if (!form_id) return;

        console.log('Loading data for form:', form_id);
        
        const loadAllData = async () => {
            if (!isMountedRef.current) return;
            
            setLoading(true);
            try {
                await Promise.all([
                    loadBuildingData(),
                    loadBuildingAdjustments(),
                    checkFormUploaded()
                ]);
            } catch (error) {
                console.error('Error loading all data:', error);
            } finally {
                if (isMountedRef.current) {
                    setLoading(false);
                    setIsInitialLoad(false);
                }
            }
        };

        loadAllData();
    }, [form_id]);

    // Calculate adjustments AND recalculate assessment levels when adjustments change - FIXED
    useEffect(() => {
        if (!isInitialLoad && buildingInfoIds.length > 0 && buildingAdjustments.length > 0) {
            console.log('Adjustments changed, recalculating...');
            const updateData = async () => {
                await calculateAllAdjustments(buildingAdjustments);
                await recalculateAssessmentLevels(buildingAdjustments);
            };
            updateData();
        }
    }, [recalculationTrigger, isInitialLoad, buildingInfoIds.length]);

    // Event listeners for form uploaded
    useEffect(() => {
        const handleFormUploaded = (event: CustomEvent) => {
            if (event.detail && event.detail.formId === form_id && isMountedRef.current) {
                console.log('Form uploaded, checking status...');
                checkFormUploaded();
            }
        };

        window.addEventListener('formUploaded', handleFormUploaded as EventListener);
        
        return () => {
            window.removeEventListener('formUploaded', handleFormUploaded as EventListener);
        };
    }, [form_id, checkFormUploaded]);

    // Handlers
    const handleViewDetails = (buildingId: string) => {
        console.log('View details for building:', buildingId);
    };

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

    const handleSubcomponentRowClick = async (rowData: BuildingAdjustmentData, baseMarketValue: number = 0) => {
        try {
            const subcomponent = await getBuildingSubcomponentById(rowData.buidlingsubcomponent);
            if (!subcomponent) {
                showToastMessage(`No subcomponent data found for ID: ${rowData.buidlingsubcomponent}`, 'warning');
                return;
            }
            const buildingData = buildingDataList.get(rowData.value_info_id);
            const storey = buildingData?.storey || 1;
            
            setSelectedSubcomponentData(subcomponent);
            setSelectedAdjustmentArea(rowData.area);
            setSelectedAdjustmentCompletion(rowData.completion_percent);
            setSelectedAdjustmentDepreciation(rowData.depreciation);
            setSelectedBaseMarketValue(baseMarketValue);
            setSelectedStorey(storey);
            setShowSubcomponentModal(true);
        } catch (error) {
            console.error(error);
            showToastMessage('Error loading subcomponent details', 'danger');
        }
    };

    const handleBuildingUpdate = async (updatedData: any) => {
        try {
            await BuildingDataLocalStorage.updateBuildingData(selectedBuildingId, updatedData);
            await loadBuildingData();
            await loadBuildingAdjustments();
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
        if (!isMountedRef.current) return;
        
        setToastMessage(message);
        setToastColor(color);
        setShowToast(true);
    };

    // Submit Form + Upload
    const submitForm = async () => {
        if (!isMountedRef.current) return;
        
        setShowConfirmation(false);
        
        const formData = await FormDataLocalStorage.getFormData(form_id);
        if (formData?.uploaded) {
            showToastMessage('Form already submitted', 'warning');
            return;
        }

        setIsSubmitting(true);
        showToastMessage('Starting upload process...', 'warning');

        try {
            if (!formData) throw new Error('Form data not found');

            const valueInfos = await ValueInfoLocalStorage.getAllValueInfo();
            const filteredValueInfos = valueInfos.filter(info => info.formDataId === form_id);
            if (!filteredValueInfos.length) throw new Error('No value info found');
            const valueInfo = filteredValueInfos[0];

            const photoTag = await PhotoTagLocalStorage.getPhotoTag(valueInfo.photoTagId);
            if (!photoTag) throw new Error('Photo tag not found');

            const databaseTagId = await supabaseApi.insertPhoto({
                photo: photoTag.photoName,
                longitude: photoTag.longitude,
                latitude: photoTag.latitude,
                date_taken: photoTag.timestamp.toISOString().split('T')[0]
            });
            if (!databaseTagId) throw new Error('Failed to insert photo record');

            const photoFile = await getPhotoFile(photoTag);
            if (photoFile) {
                const folderPath = `${databaseTagId}/${photoTag.photoName}`;
                const { error: uploadError } = await supabase.storage.from('tag-photos').upload(folderPath, photoFile, {
                    contentType: 'image/jpeg',
                    upsert: false
                });
                if (uploadError) {
                    console.warn('Photo upload failed', uploadError);
                    showToastMessage('Form submitted but photo upload failed', 'warning');
                } else {
                    console.log('Photo uploaded successfully, keeping local copy');
                }
            } else {
                showToastMessage('Form submitted but could not retrieve photo', 'warning');
            }

            const databaseFormId = await supabaseApi.insertForm({
                declarant: formData.declarant,
                kind_id: typeof formData.kind === 'string' ? parseInt(formData.kind) : formData.kind,
                class_id: formData.classification,
                area: formData.area.toString(),
                district_id: formData.district,
                actual_used_id: formData.actualUse,
                subclass_id: formData.subclass || null,
                status: 'New'
            });
            if (!databaseFormId) throw new Error('Failed to insert form');

            const databaseValueInfoId = await supabaseApi.insertValueInfo(databaseFormId, databaseTagId);

            const buildingData = await BuildingDataLocalStorage.getBuildingData(valueInfo.id);
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
            await FormDataLocalStorage.markFormAsUploaded(form_id, databaseFormId);

            window.dispatchEvent(new CustomEvent('formUploaded', { detail: { formId: form_id } }));
            showToastMessage('Form submitted successfully! Data synchronized with server.', 'success');

        } catch (error: any) {
            console.error('Upload failed:', error);
            showToastMessage(`Upload failed: ${error.message || 'Unknown error'}`, 'danger');
        } finally {
            if (isMountedRef.current) {
                setIsSubmitting(false);
            }
        }
    };

    const handleSubmit = () => {
        setShowConfirmation(true);
    };

    const handleConfirmationDismiss = () => {
        setShowConfirmation(false);
    };

    // Return ALL necessary functions and state
    return {
        // State
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
        isFormUploaded,
        showConfirmation,
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
        selectedBaseMarketValue,
        selectedStorey,
        showUpdateModal,
        selectedBuildingId,
        selectedBuildingData,
        showToast,
        toastMessage,
        toastColor,

        // Setters
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
        setIsFormUploaded,
        setShowConfirmation,
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
        setSelectedBaseMarketValue,
        setSelectedStorey,
        setShowUpdateModal,
        setSelectedBuildingId,
        setSelectedBuildingData,
        setShowToast,
        setToastMessage,
        setToastColor,

        // Functions
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
        submitForm,
        handleConfirmationDismiss,
        getPhotoFilePath,
        checkFormUploaded
    };
};