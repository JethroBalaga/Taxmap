// utils/dataFetchers/BarangayFetcher.ts
import { BaseFetcher } from './BaseFetcher';
import { FetchDataResult } from '../MapUtility';
import { storeBarangayData } from '../barangayLocalStorage';
import { supabase } from '../supaBaseClient';

export class BarangayFetcher extends BaseFetcher {
  static async fetchData(): Promise<FetchDataResult> {
    try {
      const { data, error } = await supabase
        .from('barangaytbl')
        .select('barangay_id, district_id, barangay')
        .order('barangay', { ascending: true });

      if (error) {
        return this.createErrorResult(`Barangay data error: ${error.message}`, error);
      }

      if (data && data.length > 0) {
        await storeBarangayData(data);
        return this.createSuccessResult('Barangay data stored successfully');
      } else {
        return this.createSuccessResult('No barangay data found in barangaytbl');
      }
    } catch (error) {
      return this.createErrorResult('Unexpected error fetching barangay data', error);
    }
  }
}