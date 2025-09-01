// utils/dataFetchers/KindFetcher.ts
import { BaseFetcher } from './BaseFetcher';
import { FetchDataResult } from '../MapUtility';
import { storeKindData } from '../kindLocalStorage';
import { supabase } from '../supaBaseClient';

export class KindFetcher extends BaseFetcher {
  static async fetchData(): Promise<FetchDataResult> {
    try {
      const { data, error } = await supabase
        .from('kindtbl')
        .select('kind_id, description')
        .order('kind_id', { ascending: true });

      if (error) {
        return this.createErrorResult(`Kind data error: ${error.message}`, error);
      }

      if (data && data.length > 0) {
        await storeKindData(data);
        return this.createSuccessResult('Kind data stored successfully');
      } else {
        return this.createSuccessResult('No kind data found in kindtbl');
      }
    } catch (error) {
      return this.createErrorResult('Unexpected error fetching kind data', error);
    }
  }
}