// utils/dataFetchers/BuildingSubcomponentFetcher.ts
import { BaseFetcher } from './BaseFetcher';
import { FetchDataResult } from '../MapUtility';
import { storeBuildingSubcomponentData } from '../BuildingSubcomponentLocalStorage';
import { supabase } from '../supaBaseClient';

export class BuildingSubcomponentFetcher extends BaseFetcher {
  static async fetchData(): Promise<FetchDataResult> {
    try {
      const { data, error } = await supabase
        .from('building_subcomponenttbl')
        .select('building_subcom_id, description, rate, building_com_id, percent')
        .order('building_subcom_id', { ascending: true });

      if (error) {
        return this.createErrorResult(`Building subcomponent data error: ${error.message}`, error);
      }

      if (data && data.length > 0) {
        await storeBuildingSubcomponentData(data);
        return this.createSuccessResult('Building subcomponent data stored successfully');
      } else {
        return this.createSuccessResult('No building subcomponent data found in building_subcomponenttbl');
      }
    } catch (error) {
      return this.createErrorResult('Unexpected error fetching building subcomponent data', error);
    }
  }
}