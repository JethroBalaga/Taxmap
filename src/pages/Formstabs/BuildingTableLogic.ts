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

    // Function to get photo file from Capacitor Filesystem
    const getPhotoFile = useCallback(async (photoTag: any): Promise<Blob | null> => {
        try {
            // Check if we have the photo path stored
            if (!photoTag.photoPath) {
                console.error('No photo path found in photo tag');
                return null;
            }

            try {
                // Read the file from Filesystem
                const readFileResult = await Filesystem.readFile({
                    path: photoTag.photoPath,
                    directory: Directory.Data
                });

                // Convert base64 to blob
                const base64Response = await fetch(`data:image/jpeg;base64,${readFileResult.data}`);
                const blob = await base64Response.blob();
                return blob;
                
            } catch (readError) {
                console.error('Error reading file from Filesystem:', readError);
                
                // Fallback: try to read from the photoData if available
                if (photoTag.photoData && photoTag.photoData.startsWith('data:image')) {
                    const base64Response = await fetch(photoTag.photoData);
                    return await base64Response.blob();
                }
                
                return null;
            }
        } catch (error) {
            console.error('Error getting photo file:', error);
            return null;
        }
    }, []);

    // Function to get photo file path for display or other purposes
    const getPhotoFilePath = useCallback(async (photoTag: any): Promise<string | null> => {
        try {
            if (photoTag.photoPath) {
                // For mobile, we can use the Filesystem URL
                const fileInfo = await Filesystem.getUri({
                    path: photoTag.photoPath,
                    directory: Directory.Data
                });
                return fileInfo.uri;
            }
            
            // Fallback to base64 data URL
            if (photoTag.photoData) {
                return photoTag.photoData;
            }
            
            return null;
        } catch (error) {
            console.error('Error getting photo file path:', error);
            return null;
        }
    }, []);

    // Function to clean up photos after successful upload
    const cleanupLocalPhotos = useCallback(async (photoTag: any) => {
        try {
            if (photoTag.photoPath) {
                // Delete the local file after successful upload
                await Filesystem.deleteFile({
                    path: photoTag.photoPath,
                    directory: Directory.Data
                });
                console.log('Local photo cleaned up successfully');
            }
        } catch (error) {
            console.warn('Could not clean up local photo:', error);
            // Non-critical error, continue anyway
        }
    }, []);

    const calculateMarketValues = useCallback((buildingCodeRate: number, depreciationRate: number | null, area: number, constructionPercent: number | null): { base: number, adjusted: number } => {
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
    }, []);

    const getAssessmentLevelForBuilding = useCallback(async (adjustedValue: number): Promise<AssessmentLevelInfo | null> => {
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
    }, [kindId, classification]);

    const calculateAllAdjustments = useCallback(async () => {
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
    }, [buildingAdjustments, buildingInfoIds]);

    const loadBuildingData = useCallback(async () => {
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
    }, [form_id, area, calculateMarketValues, getAssessmentLevelForBuilding]);

    const loadBuildingAdjustments = useCallback(() => {
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
    }, [form_id]);

    useEffect(() => {
        loadBuildingData();
        loadBuildingAdjustments();
    }, [form_id, kind, classification, area, declarant, actual_use, district, subclass, loadBuildingData, loadBuildingAdjustments]);

    useEffect(() => {
        calculateAllAdjustments();
    }, [buildingAdjustments, buildingInfoIds, calculateAllAdjustments]);

    const handleViewDetails = (buildingId: string) => {
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

        try {
            BuildingDataLocalStorage.updateBuildingData(selectedBuildingId, updatedData);
            loadBuildingData();
            loadBuildingAdjustments();
            showToastMessage('Building updated successfully!', 'success');
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
            const formData = FormDataLocalStorage.getFormData(form_id);
            if (!formData) {
                throw new Error('Form data not found in local storage');
            }

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

            if (!valueInfo.photoTagId) {
                throw new Error('No photo tag ID found in value info');
            }

            const photoTag = PhotoTagLocalStorage.getPhotoTag(valueInfo.photoTagId);
            if (!photoTag) {
                throw new Error('Photo tag not found in local storage');
            }

            // 1. First insert the tag record to get the tag_id
            const databaseTagId = await supabaseApi.insertPhoto({
                photo: photoTag.photoName,
                longitude: photoTag.longitude,
                latitude: photoTag.latitude,
                accuracy: photoTag.accuracy || null,
                altitude: photoTag.altitude || null,
                date_taken: photoTag.timestamp.toISOString().split('T')[0]
            });

            // 2. Upload the photo to Supabase storage using the tag_id as folder name
            const photoFile = await getPhotoFile(photoTag);
            if (photoFile) {
                try {
                    const folderName = `tag_${databaseTagId}`;
                    const filePath = `${folderName}/${photoTag.photoName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('tag-photos')
                        .upload(filePath, photoFile, {
                            contentType: 'image/jpeg',
                            upsert: false
                        });

                    if (uploadError) {
                        console.error('Photo upload failed:', uploadError);
                        showToastMessage('Form submitted but photo upload failed', 'warning');
                    } else {
                        console.log('Photo uploaded successfully to Supabase storage');
                        
                        // Clean up local photo after successful upload
                        await cleanupLocalPhotos(photoTag);
                    }
                } catch (uploadError) {
                    console.error('Photo upload error:', uploadError);
                    showToastMessage('Form submitted but photo upload failed', 'warning');
                }
            } else {
                console.warn('Could not retrieve photo file for upload');
                showToastMessage('Form submitted but could not retrieve photo', 'warning');
            }

            // 3. Continue with the rest of the database operations
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

            const databaseValueInfoId = await supabaseApi.insertValueInfo(
                databaseFormId,
                databaseTagId
            );

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

            await supabaseApi.updateFormStatus(databaseFormId, 'New');
            FormDataLocalStorage.markFormAsUploaded(form_id, databaseFormId);

            showToastMessage('Form submitted successfully! Data synchronized with server.', 'success');

            setTimeout(() => {
                // This would need to be handled by the parent component
                // onBack();
            }, 2000);

        } catch (error: any) {
            console.error('Upload failed:', error);
            showToastMessage(`Upload failed: ${error.message || 'Unknown error'}`, 'danger');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        // State values
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
        
        // State setters
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
        getPhotoFilePath
    };
};