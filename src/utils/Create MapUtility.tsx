// utils/MapUtility.tsx
import { 
  getClassificationData, 
  storeClassificationData, 
  isClassificationDataFresh
} from './classificationLocalStorage';
import { 
  getSubclassData, 
  storeSubclassData, 
  isSubclassDataFresh
} from './subclassLocalStorage';
import { 
  getSubclassRateData, 
  storeSubclassRateData, 
  isSubclassRateDataFresh
} from './subclassRateLocalStorage';
import { 
  getActualUsedData, 
  storeActualUsedData, 
  isActualUsedDataFresh
} from './actualUsedLocalStorage';
import { 
  getDistrictData, 
  storeDistrictData, 
  isDistrictDataFresh
} from './districtLocalStorage';
import { 
  getBarangayData, 
  storeBarangayData, 
  isBarangayDataFresh
} from './barangayLocalStorage';
import { 
  getTaxRateData, 
  storeTaxRateData, 
  isTaxRateDataFresh
} from './taxRateLocalStorage';
import { supabase } from './supaBaseClient';

export interface FetchDataResult {
  success: boolean;
  message: string;
  error?: any;
}

export class MapDataManager {
  // Check if all data is fresh
  static async checkAllDataFreshness(): Promise<boolean> {
    try {
      const [
        isClassFresh,
        isSubclassFresh,
        isRateFresh,
        isActualUsedFresh,
        isDistrictFresh,
        isBarangayFresh,
        isTaxRateFresh
      ] = await Promise.all([
        isClassificationDataFresh(),
        isSubclassDataFresh(),
        isSubclassRateDataFresh(),
        isActualUsedDataFresh(),
        isDistrictDataFresh(),
        isBarangayDataFresh(),
        isTaxRateDataFresh()
      ]);

      return isClassFresh && isSubclassFresh && isRateFresh &&
             isActualUsedFresh && isDistrictFresh && isBarangayFresh &&
             isTaxRateFresh;
    } catch (error) {
      console.error('Error checking data freshness:', error);
      return false;
    }
  }

  // Fetch classification data
  static async fetchClassificationData(): Promise<FetchDataResult> {
    try {
      const { data, error } = await supabase
        .from('classtbl')
        .select('class_id, classification')
        .order('class_id', { ascending: true });

      if (error) {
        return {
          success: false,
          message: `Classification data error: ${error.message}`,
          error
        };
      }

      if (data && data.length > 0) {
        await storeClassificationData(data);
        return {
          success: true,
          message: 'Classification data stored successfully'
        };
      } else {
        return {
          success: true,
          message: 'No classification data found in classtbl'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Unexpected error fetching classification data',
        error
      };
    }
  }

  // Fetch subclass data
  static async fetchSubclassData(): Promise<FetchDataResult> {
    try {
      const { data, error } = await supabase
        .from('subclasstbl')
        .select('subclass_id, barangay_id, subclass, class_id')
        .order('subclass_id', { ascending: true });

      if (error) {
        return {
          success: false,
          message: `Subclass data error: ${error.message}`,
          error
        };
      }

      if (data && data.length > 0) {
        await storeSubclassData(data);
        return {
          success: true,
          message: 'Subclass data stored successfully'
        };
      } else {
        return {
          success: true,
          message: 'No subclass data found in subclasstbl'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Unexpected error fetching subclass data',
        error
      };
    }
  }

  // Fetch subclass rate data
  static async fetchSubclassRateData(): Promise<FetchDataResult> {
    try {
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase
        .from('subclassratetbl')
        .select('subclasrate_id, subclass_id, eff_year, rate')
        .eq('eff_year', currentYear)
        .order('subclass_id', { ascending: true });

      if (error) {
        return {
          success: false,
          message: `Rate data error: ${error.message}`,
          error
        };
      }

      if (data && data.length > 0) {
        await storeSubclassRateData(data, currentYear);
        return {
          success: true,
          message: `Subclass rate data stored successfully for year: ${currentYear}`
        };
      } else {
        return {
          success: true,
          message: `No subclass rate data found for year ${currentYear}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Unexpected error fetching rate data',
        error
      };
    }
  }

  // Fetch actual used data
  static async fetchActualUsedData(): Promise<FetchDataResult> {
    try {
      const { data, error } = await supabase
        .from('actual_usedtbl')
        .select('actual_used_id, description, class_id')
        .order('actual_used_id', { ascending: true });

      if (error) {
        return {
          success: false,
          message: `Actual used data error: ${error.message}`,
          error
        };
      }

      if (data && data.length > 0) {
        await storeActualUsedData(data);
        return {
          success: true,
          message: 'Actual used data stored successfully'
        };
      } else {
        return {
          success: true,
          message: 'No actual used data found in actual_usedtbl'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Unexpected error fetching actual usage data',
        error
      };
    }
  }

  // Fetch district data
  static async fetchDistrictData(): Promise<FetchDataResult> {
    try {
      const { data, error } = await supabase
        .from('districttbl')
        .select('district_id, district_name, founded')
        .order('district_id', { ascending: true });

      if (error) {
        return {
          success: false,
          message: `District data error: ${error.message}`,
          error
        };
      }

      if (data && data.length > 0) {
        await storeDistrictData(data);
        return {
          success: true,
          message: 'District data stored successfully'
        };
      } else {
        return {
          success: true,
          message: 'No district data found in districttbl'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Unexpected error fetching district data',
        error
      };
    }
  }

  // Fetch barangay data
  static async fetchBarangayData(): Promise<FetchDataResult> {
    try {
      const { data, error } = await supabase
        .from('barangaytbl')
        .select('barangay_id, district_id, barangay')
        .order('barangay', { ascending: true });

      if (error) {
        return {
          success: false,
          message: `Barangay data error: ${error.message}`,
          error
        };
      }

      if (data && data.length > 0) {
        await storeBarangayData(data);
        return {
          success: true,
          message: 'Barangay data stored successfully'
        };
      } else {
        return {
          success: true,
          message: 'No barangay data found in barangaytbl'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Unexpected error fetching barangay data',
        error
      };
    }
  }

  // Fetch tax rate data
  static async fetchTaxRateData(): Promise<FetchDataResult> {
    try {
      const currentYear = new Date().getFullYear().toString();
      const { data, error } = await supabase
        .from('taxratetbl')
        .select('tax_rate_id, eff_year, rate_percent, district_id')
        .eq('eff_year', currentYear)
        .order('district_id', { ascending: true });

      if (error) {
        return {
          success: false,
          message: `Tax rate data error: ${error.message}`,
          error
        };
      }

      if (data && data.length > 0) {
        await storeTaxRateData(data, currentYear);
        return {
          success: true,
          message: `Tax rate data stored successfully for year: ${currentYear}`
        };
      } else {
        return {
          success: true,
          message: `No tax rate data found for year ${currentYear}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Unexpected error fetching tax rate data',
        error
      };
    }
  }

  // Fetch all data that needs updating
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
      existingTaxRateData, isTaxRateFresh
    ] = await Promise.all([
      getClassificationData(), isClassificationDataFresh(),
      getSubclassData(), isSubclassDataFresh(),
      getSubclassRateData(), isSubclassRateDataFresh(),
      getActualUsedData(), isActualUsedDataFresh(),
      getDistrictData(), isDistrictDataFresh(),
      getBarangayData(), isBarangayDataFresh(),
      getTaxRateData(), isTaxRateDataFresh()
    ]);

    // Fetch data that is not fresh or doesn't exist
    if (!existingClassData || !isClassFresh) {
      const result = await this.fetchClassificationData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    if (!existingSubclassData || !isSubclassFresh) {
      const result = await this.fetchSubclassData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    if (!existingRateData || !isRateFresh) {
      const result = await this.fetchSubclassRateData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    if (!existingActualUsedData || !isActualUsedFresh) {
      const result = await this.fetchActualUsedData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    if (!existingDistrictData || !isDistrictFresh) {
      const result = await this.fetchDistrictData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    if (!existingBarangayData || !isBarangayFresh) {
      const result = await this.fetchBarangayData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    if (!existingTaxRateData || !isTaxRateFresh) {
      const result = await this.fetchTaxRateData();
      results.push(result);
      if (!result.success) hasErrors = true;
    }

    return { results, hasErrors };
  }
}