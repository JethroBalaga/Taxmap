// utils/dataFetchers/BuildingComponentFetcher.ts
import { BaseFetcher } from './BaseFetcher';
import { FetchDataResult } from '../MapUtility';
import { storeBuildingComponentData } from '../buildingComponentLocalStorage';
import { supabase } from '../supaBaseClient';

export class BuildingComponentFetcher extends BaseFetcher {
  static async fetchData(): Promise<FetchDataResult> {
    try {
      const { data, error } = await supabase
        .from('building_componenttbl')
        .select('building_com_id, description')
        .order('building_com_id', { ascending: true });

      if (error) {
        return this.createErrorResult(`Building component data error: ${error.message}`, error);
      }

      if (data && data.length > 0) {
        await storeBuildingComponentData(data);
        return this.createSuccessResult('Building component data stored successfully');
      } else {
        return this.createSuccessResult('No building component data found in building_componenttbl');
      }
    } catch (error) {
      return this.createErrorResult('Unexpected error fetching building component data', error);
    }
  }
}