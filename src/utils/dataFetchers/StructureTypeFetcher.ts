// utils/dataFetchers/StructureTypeFetcher.ts
import { BaseFetcher } from './BaseFetcher';
import { FetchDataResult } from '../MapUtility';
import { storeStructureTypeData } from '../structureTypeLocalStorage';
import { supabase } from '../supaBaseClient';

export class StructureTypeFetcher extends BaseFetcher {
  static async fetchData(): Promise<FetchDataResult> {
    try {
      const { data, error } = await supabase
        .from('structure_typetbl')
        .select('structure_code, description, eff_date')
        .order('structure_code', { ascending: true });

      if (error) {
        return this.createErrorResult(`Structure type data error: ${error.message}`, error);
      }

      if (data && data.length > 0) {
        await storeStructureTypeData(data);
        return this.createSuccessResult('Structure type data stored successfully');
      } else {
        return this.createSuccessResult('No structure type data found');
      }
    } catch (error) {
      return this.createErrorResult('Unexpected error fetching structure type data', error);
    }
  }
}