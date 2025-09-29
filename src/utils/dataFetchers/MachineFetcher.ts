// utils/dataFetchers/MachineFetcher.ts
import { BaseFetcher } from './BaseFetcher';
import { FetchDataResult } from '../MapUtility';
import { storeMachineData } from '../machineLocalStorage';
import { supabase } from '../supaBaseClient';

export class MachineFetcher extends BaseFetcher {
  static async fetchData(): Promise<FetchDataResult> {
    try {
      const { data, error } = await supabase
        .from('machine')
        .select('serial_no, machine_description, equipment_id, created_at')
        .order('serial_no', { ascending: true });

      if (error) {
        return this.createErrorResult(`Machine data error: ${error.message}`, error);
      }

      if (data && data.length > 0) {
        await storeMachineData(data);
        return this.createSuccessResult('Machine data stored successfully');
      } else {
        return this.createSuccessResult('No machine data found in machine table');
      }
    } catch (error) {
      return this.createErrorResult('Unexpected error fetching machine data', error);
    }
  }
}