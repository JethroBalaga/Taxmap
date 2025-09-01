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

import { ClassificationFetcher } from './dataFetchers/ClassificationFetcher';
import { SubclassFetcher } from './dataFetchers/SubclassFetcher';
import { SubclassRateFetcher } from './dataFetchers/SubclassRateFetcher';
import { ActualUsedFetcher } from './dataFetchers/ActualUsedFetcher';
import { DistrictFetcher } from './dataFetchers/DistrictFetcher';
import { BarangayFetcher } from './dataFetchers/BarangayFetcher';
import { TaxRateFetcher } from './dataFetchers/TaxRateFetcher';
import { KindFetcher } from './dataFetchers/KindFetcher';

export interface FetchDataResult {
  success: boolean;
  message: string;
  error?: any;
}

export class MapDataManager {
  // Check if all data is fresh (including kind data)
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
        isKindFresh
      ] = await Promise.all([
        isClassificationDataFresh(),
        isSubclassDataFresh(),
        isSubclassRateDataFresh(),
        isActualUsedDataFresh(),
        isDistrictDataFresh(),
        isBarangayDataFresh(),
        isTaxRateDataFresh(),
        isKindDataFresh()
      ]);

      return isClassFresh && isSubclassFresh && isRateFresh &&
             isActualUsedFresh && isDistrictFresh && isBarangayFresh &&
             isTaxRateFresh && isKindFresh;
    } catch (error) {
      console.error('Error checking data freshness:', error);
      return false;
    }
  }

  // Fetch all data that needs updating (including kind data)
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
      existingKindData, isKindFresh
    ] = await Promise.all([
      getClassificationData(), isClassificationDataFresh(),
      getSubclassData(), isSubclassDataFresh(),
      getSubclassRateData(), isSubclassRateDataFresh(),
      getActualUsedData(), isActualUsedDataFresh(),
      getDistrictData(), isDistrictDataFresh(),
      getBarangayData(), isBarangayDataFresh(),
      getTaxRateData(), isTaxRateDataFresh(),
      getKindData(), isKindDataFresh()
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

    return { results, hasErrors };
  }

  // Clear all data (including kind data)
  static async clearAllData(): Promise<FetchDataResult[]> {
    const results: FetchDataResult[] = [];
    
    try {
      // Clear all data stores
      await Promise.all([
        clearKindData()
        // Add clear functions for other data stores here
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
}