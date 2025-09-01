// utils/dataFetchers/TaxRateFetcher.ts
import { BaseFetcher } from './BaseFetcher';
import { FetchDataResult } from '../MapUtility';
import { storeTaxRateData } from '../taxRateLocalStorage';
import { supabase } from '../supaBaseClient';

export class TaxRateFetcher extends BaseFetcher {
  static async fetchData(): Promise<FetchDataResult> {
    try {
      const currentYear = new Date().getFullYear().toString();
      const { data, error } = await supabase
        .from('taxratetbl')
        .select('tax_rate_id, effective_year, rate_percent, district_id')
        .eq('effective_year', currentYear)
        .order('district_id', { ascending: true });

      if (error) {
        return this.createErrorResult(`Tax rate data error: ${error.message}`, error);
      }

      if (data && data.length > 0) {
        await storeTaxRateData(data, currentYear);
        return this.createSuccessResult(`Tax rate data stored successfully for year: ${currentYear}`);
      } else {
        return this.createSuccessResult(`No tax rate data found for year ${currentYear}`);
      }
    } catch (error) {
      return this.createErrorResult('Unexpected error fetching tax rate data', error);
    }
  }
}