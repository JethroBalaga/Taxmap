// utils/dataFetchers/EquipmentFetcher.ts
import { BaseFetcher } from './BaseFetcher';
import { FetchDataResult } from '../MapUtility';
import { storeEquipmentData } from '../equipmentLocalStorage';
import { supabase } from '../supaBaseClient';

export class EquipmentFetcher extends BaseFetcher {
  static async fetchData(): Promise<FetchDataResult> {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('equipment_id, machine_type, created_at')
        .order('equipment_id', { ascending: true });

      if (error) {
        return this.createErrorResult(`Equipment data error: ${error.message}`, error);
      }

      if (data && data.length > 0) {
        await storeEquipmentData(data);
        return this.createSuccessResult('Equipment data stored successfully');
      } else {
        return this.createSuccessResult('No equipment data found in equipment table');
      }
    } catch (error) {
      return this.createErrorResult('Unexpected error fetching equipment data', error);
    }
  }
}