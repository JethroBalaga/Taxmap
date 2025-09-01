// utils/dataFetchers/DeclarantFetcher.ts
import { BaseFetcher } from './BaseFetcher';
import { FetchDataResult } from '../MapUtility';
import { storeDeclarantData, DeclarantData } from '../DeclarantLocalStorage';
import { supabase } from '../supaBaseClient';

export class DeclarantFetcher extends BaseFetcher {
  static async fetchData(): Promise<FetchDataResult> {
    try {
      const { data, error } = await supabase
        .from('declaranttbl')
        .select('declarant_id, firstname, lastname')
        .order('declarant_id', { ascending: true });

      if (error) {
        return this.createErrorResult(`Declarant data error: ${error.message}`, error);
      }

      if (data && data.length > 0) {
        await storeDeclarantData(data);
        return this.createSuccessResult('Declarant data stored successfully');
      } else {
        return this.createSuccessResult('No declarant data found in declaranttbl');
      }
    } catch (error) {
      return this.createErrorResult('Unexpected error fetching declarant data', error);
    }
  }
}