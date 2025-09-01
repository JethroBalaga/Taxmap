// utils/dataFetchers/SubclassRateFetcher.ts
import { BaseFetcher } from './BaseFetcher';
import { FetchDataResult } from '../MapUtility';
import { storeSubclassRateData } from '../subclassRateLocalStorage';
import { supabase } from '../supaBaseClient';

export class SubclassRateFetcher extends BaseFetcher {
  static async fetchData(): Promise<FetchDataResult> {
    try {
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase
        .from('subclassratetbl')
        .select('subclassrate_id, subclass_id, eff_year, rate')
        .eq('eff_year', currentYear)
        .order('subclass_id', { ascending: true });

      if (error) {
        return this.createErrorResult(`Rate data error: ${error.message}`, error);
      }

      if (data && data.length > 0) {
        await storeSubclassRateData(data, currentYear);
        return this.createSuccessResult(`Subclass rate data stored successfully for year: ${currentYear}`);
      } else {
        return this.createSuccessResult(`No subclass rate data found for year ${currentYear}`);
      }
    } catch (error) {
      return this.createErrorResult('Unexpected error fetching rate data', error);
    }
  }
}