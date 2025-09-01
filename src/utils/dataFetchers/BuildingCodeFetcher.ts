// utils/dataFetchers/BuildingCodeFetcher.ts
import { BaseFetcher } from './BaseFetcher';
import { FetchDataResult } from '../MapUtility';
import { storeBuildingCodeData } from '../buildingCodeLocalStorage';
import { supabase } from '../supaBaseClient';

export class BuildingCodeFetcher extends BaseFetcher {
  static async fetchData(): Promise<FetchDataResult> {
    try {
      const { data, error } = await supabase
        .from('building_codetbl')
        .select('building_code, structure_code, description, rate')
        .order('structure_code', { ascending: true })
        .order('building_code', { ascending: true });

      if (error) {
        return this.createErrorResult(`Building code data error: ${error.message}`, error);
      }

      if (data && data.length > 0) {
        await storeBuildingCodeData(data);
        return this.createSuccessResult('Building code data stored successfully');
      } else {
        return this.createSuccessResult('No building code data found');
      }
    } catch (error) {
      return this.createErrorResult('Unexpected error fetching building code data', error);
    }
  }
}