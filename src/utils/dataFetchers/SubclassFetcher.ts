// utils/dataFetchers/SubclassFetcher.ts
import { BaseFetcher } from './BaseFetcher';
import { FetchDataResult } from '../MapUtility';
import { storeSubclassData } from '../subclassLocalStorage';
import { supabase } from '../supaBaseClient';

export class SubclassFetcher extends BaseFetcher {
  static async fetchData(): Promise<FetchDataResult> {
    try {
      const { data, error } = await supabase
        .from('subclasstbl')
        .select('subclass_id, barangay_id, subclass, class_id')
        .order('subclass_id', { ascending: true });

      if (error) {
        return this.createErrorResult(`Subclass data error: ${error.message}`, error);
      }

      if (data && data.length > 0) {
        await storeSubclassData(data);
        return this.createSuccessResult('Subclass data stored successfully');
      } else {
        return this.createSuccessResult('No subclass data found in subclasstbl');
      }
    } catch (error) {
      return this.createErrorResult('Unexpected error fetching subclass data', error);
    }
  }
}