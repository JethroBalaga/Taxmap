// utils/dataFetchers/LandAdjustmentFetcher.ts
import { BaseFetcher } from './BaseFetcher';
import { FetchDataResult } from '../MapUtility';
import { storeLandAdjustmentData, LandAdjustmentData } from '../landAdjustmentLocalStorage';
import { supabase } from '../supaBaseClient';

export class LandAdjustmentFetcher extends BaseFetcher {
  static async fetchData(): Promise<FetchDataResult> {
    try {
      const { data, error } = await supabase
        .from('landadjustmenttbl')
        .select('adjustment_id, description, adjustment_factor, adjustment_type, created_at')
        .order('adjustment_id', { ascending: true });

      if (error) {
        return this.createErrorResult(`Land adjustment data error: ${error.message}`, error);
      }

      if (data && data.length > 0) {
        await storeLandAdjustmentData(data as LandAdjustmentData[]);
        return this.createSuccessResult('Land adjustment data stored successfully');
      } else {
        return this.createSuccessResult('No land adjustment data found in landadjustmenttbl');
      }
    } catch (error) {
      return this.createErrorResult('Unexpected error fetching land adjustment data', error);
    }
  }
}