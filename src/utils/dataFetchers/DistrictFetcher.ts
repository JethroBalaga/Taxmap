// utils/dataFetchers/DistrictFetcher.ts
import { BaseFetcher } from './BaseFetcher';
import { FetchDataResult } from '../MapUtility';
import { storeDistrictData } from '../districtLocalStorage';
import { supabase } from '../supaBaseClient';

export class DistrictFetcher extends BaseFetcher {
  static async fetchData(): Promise<FetchDataResult> {
    try {
      const { data, error } = await supabase
        .from('districttbl')
        .select('district_id, district_name, founded')
        .order('district_id', { ascending: true });

      if (error) {
        return this.createErrorResult(`District data error: ${error.message}`, error);
      }

      if (data && data.length > 0) {
        await storeDistrictData(data);
        return this.createSuccessResult('District data stored successfully');
      } else {
        return this.createSuccessResult('No district data found in districttbl');
      }
    } catch (error) {
      return this.createErrorResult('Unexpected error fetching district data', error);
    }
  }
}