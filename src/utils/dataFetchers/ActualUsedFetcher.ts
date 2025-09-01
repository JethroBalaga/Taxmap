// utils/dataFetchers/ActualUsedFetcher.ts
import { BaseFetcher } from './BaseFetcher';
import { FetchDataResult } from '../MapUtility';
import { storeActualUsedData } from '../actualUsedLocalStorage';
import { supabase } from '../supaBaseClient';

export class ActualUsedFetcher extends BaseFetcher {
  static async fetchData(): Promise<FetchDataResult> {
    try {
      const { data, error } = await supabase
        .from('actual_usedtbl')
        .select('actual_used_id, description, class_id')
        .order('actual_used_id', { ascending: true });

      if (error) {
        return this.createErrorResult(`Actual used data error: ${error.message}`, error);
      }

      if (data && data.length > 0) {
        await storeActualUsedData(data);
        return this.createSuccessResult('Actual used data stored successfully');
      } else {
        return this.createSuccessResult('No actual used data found in actual_usedtbl');
      }
    } catch (error) {
      return this.createErrorResult('Unexpected error fetching actual usage data', error);
    }
  }
}