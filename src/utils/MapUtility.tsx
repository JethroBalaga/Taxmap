// utils/MapUtility.tsx
import { 
  getClassificationData, 
  isClassificationDataFresh 
} from './classificationLocalStorage';
import { 
  getSubclassData, 
  isSubclassDataFresh 
} from './subclassLocalStorage';
import { 
  getSubclassRateData, 
  isSubclassRateDataFresh 
} from './subclassRateLocalStorage';
import { 
  getActualUsedData, 
  isActualUsedDataFresh 
} from './actualUsedLocalStorage';
import { 
  getDistrictData, 
  isDistrictDataFresh 
} from './districtLocalStorage';
import { 
  getBarangayData, 
  isBarangayDataFresh 
} from './barangayLocalStorage';
import { 
  getTaxRateData, 
  isTaxRateDataFresh 
} from './taxRateLocalStorage';
import { 
  getKindData, 
  isKindDataFresh,
  clearKindData,
  getStoredKindVersion,
  getKindTimestamp,
  hasKindData,
  getKindDataSize,
  getCurrentKindVersion
} from './kindLocalStorage';
import { 
  getAssessmentLevelData, 
  isAssessmentLevelDataFresh,
  clearAssessmentLevelData,
  getStoredAssessmentLevelVersion,
  getAssessmentLevelTimestamp,
  hasAssessmentLevelData,
  getAssessmentLevelDataSize,
  getCurrentAssessmentLevelVersion
} from './assessmentLevelLocalStorage';
import { 
  getStructureTypeData, 
  isStructureTypeDataFresh,
  clearStructureTypeData,
  getStoredStructureTypeVersion,
  getStructureTypeTimestamp,
  hasStructureTypeData,
  getStructureTypeDataSize,
  getCurrentStructureTypeVersion
} from './structureTypeLocalStorage';
import { 
  getBuildingCodeData, 
  isBuildingCodeDataFresh,
  clearBuildingCodeData,
  getStoredBuildingCodeVersion,
  getBuildingCodeTimestamp,
  hasBuildingCodeData,
  getBuildingCodeDataSize,
  getCurrentBuildingCodeVersion
} from './buildingCodeLocalStorage';
// ADD DECLARANT IMPORTS
import { 
  getDeclarantData, 
  isDeclarantDataFresh,
  clearDeclarantData,
  getStoredDeclarantVersion,
  getDeclarantTimestamp,
  hasDeclarantData,
  getDeclarantDataSize,
  getCurrentDeclarantVersion
} from './DeclarantLocalStorage';
// ADD BUILDING COMPONENT IMPORTS
import { 
  getBuildingComponentData, 
  isBuildingComponentDataFresh,
  clearBuildingComponentData,
  getStoredBuildingComponentVersion,
  getBuildingComponentTimestamp,
  hasBuildingComponentData,
  getBuildingComponentDataSize,
  getCurrentBuildingComponentVersion
} from './buildingComponentLocalStorage';
// ADD BUILDING SUBCOMPONENT IMPORTS
import { 
  getBuildingSubcomponentData, 
  isBuildingSubcomponentDataFresh,
  clearBuildingSubcomponentData,
  getStoredBuildingSubcomponentVersion,
  getBuildingSubcomponentTimestamp,
  hasBuildingSubcomponentData,
  getBuildingSubcomponentDataSize,
  getCurrentBuildingSubcomponentVersion
} from './BuildingSubcomponentLocalStorage';
// ADD EQUIPMENT IMPORTS
import { 
  getEquipmentData, 
  isEquipmentDataFresh,
  clearEquipmentData,
  getStoredEquipmentVersion,
  getEquipmentTimestamp,
  hasEquipmentData,
  getEquipmentDataSize,
  getCurrentEquipmentVersion
} from './equipmentLocalStorage';

import { ClassificationFetcher } from './dataFetchers/ClassificationFetcher';
import { SubclassFetcher } from './dataFetchers/SubclassFetcher';
import { SubclassRateFetcher } from './dataFetchers/SubclassRateFetcher';
import { ActualUsedFetcher } from './dataFetchers/ActualUsedFetcher';
import { DistrictFetcher } from './dataFetchers/DistrictFetcher';
import { BarangayFetcher } from './dataFetchers/BarangayFetcher';
import { TaxRateFetcher } from './dataFetchers/TaxRateFetcher';
import { KindFetcher } from './dataFetchers/KindFetcher';
import { AssessmentLevelFetcher } from './dataFetchers/AssessmentLevelFetcher';
import { StructureTypeFetcher } from './dataFetchers/StructureTypeFetcher';
import { BuildingCodeFetcher } from './dataFetchers/BuildingCodeFetcher';
// ADD DECLARANT FETCHER IMPORT
import { DeclarantFetcher } from './dataFetchers/DeclarantFetcher';
// ADD BUILDING COMPONENT FETCHER IMPORT
import { BuildingComponentFetcher } from './dataFetchers/BuildingComponentFetcher';
// ADD BUILDING SUBCOMPONENT FETCHER IMPORT
import { BuildingSubcomponentFetcher } from './dataFetchers/BuildingSubcomponentFetcher';
// ADD EQUIPMENT FETCHER IMPORT
import { EquipmentFetcher } from './dataFetchers/EquipmentFetcher';

export interface FetchDataResult {
  success: boolean;
  message: string;
  error?: any;
}

export class MapDataManager {
  // Check if all data is fresh (including building component and subcomponent data)
  static async checkAllDataFreshness(): Promise<boolean> {
    try {
      const [
        isClassFresh,
        isSubclassFresh,
        isRateFresh,
        isActualUsedFresh,
        isDistrictFresh,
        isBarangayFresh,
        isTaxRateFresh,
        isKindFresh,
        isAssessmentLevelFresh,
        isStructureTypeFresh,
        isBuildingCodeFresh,
        isDeclarantFresh,
        isBuildingComponentFresh,
        isBuildingSubcomponentFresh,
        isEquipmentFresh // ADD EQUIPMENT FRESHNESS CHECK
      ] = await Promise.all([
        isClassificationDataFresh(),
        isSubclassDataFresh(),
        isSubclassRateDataFresh(),
        isActualUsedDataFresh(),
        isDistrictDataFresh(),
        isBarangayDataFresh(),
        isTaxRateDataFresh(),
        isKindDataFresh(),
        isAssessmentLevelDataFresh(),
        isStructureTypeDataFresh(),
        isBuildingCodeDataFresh(),
        isDeclarantDataFresh(),
        isBuildingComponentDataFresh(),
        isBuildingSubcomponentDataFresh(),
        isEquipmentDataFresh() // ADD EQUIPMENT FRESHNESS CHECK
      ]);

      return isClassFresh && isSubclassFresh && isRateFresh &&
             isActualUsedFresh && isDistrictFresh && isBarangayFresh &&
             isTaxRateFresh && isKindFresh && isAssessmentLevelFresh &&
             isStructureTypeFresh && isBuildingCodeFresh && isDeclarantFresh &&
             isBuildingComponentFresh && isBuildingSubcomponentFresh &&
             isEquipmentFresh; // ADD EQUIPMENT TO RETURN
    } catch (error) {
      console.error('Error checking data freshness:', error);
      return false;
    }
  }

  // Fetch all data that needs updating (including building component and subcomponent data)
  static async fetchAllRequiredData(): Promise<{
    results: FetchDataResult[];
    hasErrors: boolean;
  }> {
    const results: FetchDataResult[] = [];
    let hasErrors = false;

    // Check what data needs to be fetched
    const [
      existingClassData, isClassFresh,
      existingSubclassData, isSubclassFresh,
      existingRateData, isRateFresh,
      existingActualUsedData, isActualUsedFresh,
      existingDistrictData, isDistrictFresh,
      existingBarangayData, isBarangayFresh,
      existingTaxRateData, isTaxRateFresh,
      existingKindData, isKindFresh,
      existingAssessmentLevelData, isAssessmentLevelFresh,
      existingStructureTypeData, isStructureTypeFresh,
      existingBuildingCodeData, isBuildingCodeFresh,
      existingDeclarantData, isDeclarantFresh,
      existingBuildingComponentData, isBuildingComponentFresh,
      existingBuildingSubcomponentData, isBuildingSubcomponentFresh,
      existingEquipmentData, isEquipmentFresh // ADD EQUIPMENT DATA CHECKS
    ] = await Promise.all([
      getClassificationData(), isClassificationDataFresh(),
      getSubclassData(), isSubclassDataFresh(),
      getSubclassRateData(), isSubclassRateDataFresh(),
      getActualUsedData(), isActualUsedDataFresh(),
      getDistrictData(), isDistrictDataFresh(),
      getBarangayData(), isBarangayDataFresh(),
      getTaxRateData(), isTaxRateDataFresh(),
      getKindData(), isKindDataFresh(),
      getAssessmentLevelData(), isAssessmentLevelDataFresh(),
      getStructureTypeData(), isStructureTypeDataFresh(),
      getBuildingCodeData(), isBuildingCodeDataFresh(),
      getDeclarantData(), isDeclarantDataFresh(),
      getBuildingComponentData(), isBuildingComponentDataFresh(),
      getBuildingSubcomponentData(), isBuildingSubcomponentDataFresh(),
      getEquipmentData(), isEquipmentDataFresh() // ADD EQUIPMENT DATA CHECKS
    ]);

    // Fetch data that is not fresh or doesn't exist
    if (!existingClassData || !isClassFresh) {
      const result = await ClassificationFetcher.fetchData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    if (!existingSubclassData || !isSubclassFresh) {
      const result = await SubclassFetcher.fetchData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    if (!existingRateData || !isRateFresh) {
      const result = await SubclassRateFetcher.fetchData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    if (!existingActualUsedData || !isActualUsedFresh) {
      const result = await ActualUsedFetcher.fetchData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    if (!existingDistrictData || !isDistrictFresh) {
      const result = await DistrictFetcher.fetchData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    if (!existingBarangayData || !isBarangayFresh) {
      const result = await BarangayFetcher.fetchData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    if (!existingTaxRateData || !isTaxRateFresh) {
      const result = await TaxRateFetcher.fetchData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    if (!existingKindData || !isKindFresh) {
      const result = await KindFetcher.fetchData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    if (!existingAssessmentLevelData || !isAssessmentLevelFresh) {
      const result = await AssessmentLevelFetcher.fetchData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    if (!existingStructureTypeData || !isStructureTypeFresh) {
      const result = await StructureTypeFetcher.fetchData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    if (!existingBuildingCodeData || !isBuildingCodeFresh) {
      const result = await BuildingCodeFetcher.fetchData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    // ADD DECLARANT FETCHING
    if (!existingDeclarantData || !isDeclarantFresh) {
      const result = await DeclarantFetcher.fetchData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    // ADD BUILDING COMPONENT FETCHING
    if (!existingBuildingComponentData || !isBuildingComponentFresh) {
      const result = await BuildingComponentFetcher.fetchData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    // ADD BUILDING SUBCOMPONENT FETCHING
    if (!existingBuildingSubcomponentData || !isBuildingSubcomponentFresh) {
      const result = await BuildingSubcomponentFetcher.fetchData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    // ADD EQUIPMENT FETCHING
    if (!existingEquipmentData || !isEquipmentFresh) {
      const result = await EquipmentFetcher.fetchData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    return { results, hasErrors };
  }

  // Clear all data (including building component and subcomponent data)
  static async clearAllData(): Promise<FetchDataResult[]> {
    const results: FetchDataResult[] = [];
    
    try {
      // Clear all data stores
      await Promise.all([
        clearKindData(),
        clearAssessmentLevelData(),
        clearStructureTypeData(),
        clearBuildingCodeData(),
        clearDeclarantData(),
        clearBuildingComponentData(),
        clearBuildingSubcomponentData(),
        clearEquipmentData() // ADD EQUIPMENT CLEAR
      ]);
      
      results.push({
        success: true,
        message: 'All data cleared successfully'
      });
    } catch (error) {
      results.push({
        success: false,
        message: 'Error clearing data',
        error
      });
    }
    
    return results;
  }

  // Get declarant data statistics
  static async getDeclarantDataStats(): Promise<{
    exists: boolean;
    isFresh: boolean;
    timestamp: number | null;
    version: number | null;
    size: number;
    currentVersion: number;
  }> {
    const [
      exists,
      isFresh,
      timestamp,
      storedVersion,
      size
    ] = await Promise.all([
      hasDeclarantData(),
      isDeclarantDataFresh(),
      getDeclarantTimestamp(),
      getStoredDeclarantVersion(),
      getDeclarantDataSize()
    ]);

    return {
      exists,
      isFresh,
      timestamp,
      version: storedVersion,
      size,
      currentVersion: getCurrentDeclarantVersion()
    };
  }

  // Get kind data statistics
  static async getKindDataStats(): Promise<{
    exists: boolean;
    isFresh: boolean;
    timestamp: number | null;
    version: number | null;
    size: number;
    currentVersion: number;
  }> {
    const [
      exists,
      isFresh,
      timestamp,
      storedVersion,
      size
    ] = await Promise.all([
      hasKindData(),
      isKindDataFresh(),
      getKindTimestamp(),
      getStoredKindVersion(),
      getKindDataSize()
    ]);

    return {
      exists,
      isFresh,
      timestamp,
      version: storedVersion,
      size,
      currentVersion: getCurrentKindVersion()
    };
  }

  // Get assessment level data statistics
  static async getAssessmentLevelDataStats(): Promise<{
    exists: boolean;
    isFresh: boolean;
    timestamp: number | null;
    version: number | null;
    size: number;
    currentVersion: number;
  }> {
    const [
      exists,
      isFresh,
      timestamp,
      storedVersion,
      size
    ] = await Promise.all([
      hasAssessmentLevelData(),
      isAssessmentLevelDataFresh(),
      getAssessmentLevelTimestamp(),
      getStoredAssessmentLevelVersion(),
      getAssessmentLevelDataSize()
    ]);

    return {
      exists,
      isFresh,
      timestamp,
      version: storedVersion,
      size,
      currentVersion: getCurrentAssessmentLevelVersion()
    };
  }

  // Get structure type data statistics
  static async getStructureTypeDataStats(): Promise<{
    exists: boolean;
    isFresh: boolean;
    timestamp: number | null;
    version: number | null;
    size: number;
    currentVersion: number;
  }> {
    const [
      exists,
      isFresh,
      timestamp,
      storedVersion,
      size
    ] = await Promise.all([
      hasStructureTypeData(),
      isStructureTypeDataFresh(),
      getStructureTypeTimestamp(),
      getStoredStructureTypeVersion(),
      getStructureTypeDataSize()
    ]);

    return {
      exists,
      isFresh,
      timestamp,
      version: storedVersion,
      size,
      currentVersion: getCurrentStructureTypeVersion()
    };
  }

  // Get building code data statistics
  static async getBuildingCodeDataStats(): Promise<{
    exists: boolean;
    isFresh: boolean;
    timestamp: number | null;
    version: number | null;
    size: number;
    currentVersion: number;
  }> {
    const [
      exists,
      isFresh,
      timestamp,
      storedVersion,
      size
    ] = await Promise.all([
      hasBuildingCodeData(),
      isBuildingCodeDataFresh(),
      getBuildingCodeTimestamp(),
      getStoredBuildingCodeVersion(),
      getBuildingCodeDataSize()
    ]);

    return {
      exists,
      isFresh,
      timestamp,
      version: storedVersion,
      size,
      currentVersion: getCurrentBuildingCodeVersion()
    };
  }

  // Get building component data statistics
  static async getBuildingComponentDataStats(): Promise<{
    exists: boolean;
    isFresh: boolean;
    timestamp: number | null;
    version: number | null;
    size: number;
    currentVersion: number;
  }> {
    const [
      exists,
      isFresh,
      timestamp,
      storedVersion,
      size
    ] = await Promise.all([
      hasBuildingComponentData(),
      isBuildingComponentDataFresh(),
      getBuildingComponentTimestamp(),
      getStoredBuildingComponentVersion(),
      getBuildingComponentDataSize()
    ]);

    return {
      exists,
      isFresh,
      timestamp,
      version: storedVersion,
      size,
      currentVersion: getCurrentBuildingComponentVersion()
    };
  }

  // Get building subcomponent data statistics
  static async getBuildingSubcomponentDataStats(): Promise<{
    exists: boolean;
    isFresh: boolean;
    timestamp: number | null;
    version: number | null;
    size: number;
    currentVersion: number;
  }> {
    const [
      exists,
      isFresh,
      timestamp,
      storedVersion,
      size
    ] = await Promise.all([
      hasBuildingSubcomponentData(),
      isBuildingSubcomponentDataFresh(),
      getBuildingSubcomponentTimestamp(),
      getStoredBuildingSubcomponentVersion(),
      getBuildingSubcomponentDataSize()
    ]);

    return {
      exists,
      isFresh,
      timestamp,
      version: storedVersion,
      size,
      currentVersion: getCurrentBuildingSubcomponentVersion()
    };
  }

  // Get equipment data statistics
  static async getEquipmentDataStats(): Promise<{
    exists: boolean;
    isFresh: boolean;
    timestamp: number | null;
    version: number | null;
    size: number;
    currentVersion: number;
  }> {
    const [
      exists,
      isFresh,
      timestamp,
      storedVersion,
      size
    ] = await Promise.all([
      hasEquipmentData(),
      isEquipmentDataFresh(),
      getEquipmentTimestamp(),
      getStoredEquipmentVersion(),
      getEquipmentDataSize()
    ]);

    return {
      exists,
      isFresh,
      timestamp,
      version: storedVersion,
      size,
      currentVersion: getCurrentEquipmentVersion()
    };
  }

  // Get all data statistics
  static async getAllDataStats(): Promise<{
    declarant: Awaited<ReturnType<typeof MapDataManager.getDeclarantDataStats>>;
    kind: Awaited<ReturnType<typeof MapDataManager.getKindDataStats>>;
    assessmentLevel: Awaited<ReturnType<typeof MapDataManager.getAssessmentLevelDataStats>>;
    structureType: Awaited<ReturnType<typeof MapDataManager.getStructureTypeDataStats>>;
    buildingCode: Awaited<ReturnType<typeof MapDataManager.getBuildingCodeDataStats>>;
    buildingComponent: Awaited<ReturnType<typeof MapDataManager.getBuildingComponentDataStats>>;
    buildingSubcomponent: Awaited<ReturnType<typeof MapDataManager.getBuildingSubcomponentDataStats>>;
    equipment: Awaited<ReturnType<typeof MapDataManager.getEquipmentDataStats>>; // ADD EQUIPMENT STATS
  }> {
    const [
      declarantStats,
      kindStats,
      assessmentLevelStats,
      structureTypeStats,
      buildingCodeStats,
      buildingComponentStats,
      buildingSubcomponentStats,
      equipmentStats // ADD EQUIPMENT STATS
    ] = await Promise.all([
      this.getDeclarantDataStats(),
      this.getKindDataStats(),
      this.getAssessmentLevelDataStats(),
      this.getStructureTypeDataStats(),
      this.getBuildingCodeDataStats(),
      this.getBuildingComponentDataStats(),
      this.getBuildingSubcomponentDataStats(),
      this.getEquipmentDataStats() // ADD EQUIPMENT STATS
    ]);

    return {
      declarant: declarantStats,
      kind: kindStats,
      assessmentLevel: assessmentLevelStats,
      structureType: structureTypeStats,
      buildingCode: buildingCodeStats,
      buildingComponent: buildingComponentStats,
      buildingSubcomponent: buildingSubcomponentStats,
      equipment: equipmentStats // ADD EQUIPMENT TO RETURN
    };
  }
}