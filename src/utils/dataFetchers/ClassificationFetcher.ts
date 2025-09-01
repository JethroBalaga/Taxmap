// utils/dataFetchers/ClassificationFetcher.ts
import { BaseFetcher } from './BaseFetcher';
import { FetchDataResult } from '../MapUtility';
import { storeClassificationData } from '../classificationLocalStorage';
import { supabase } from '../supaBaseClient';

export class ClassificationFetcher extends BaseFetcher {
  static async fetchData(): Promise<FetchDataResult> {
    try {
      const { data, error } = await supabase
        .from('classtbl')
        .select('class_id, classification')
        .order('class_id', { ascending: true });

      if (error) {
        return this.createErrorResult(`Classification data error: ${error.message}`, error);
      }

      if (data && data.length > 0) {
        await storeClassificationData(data);
        return this.createSuccessResult('Classification data stored successfully');
      } else {
        return this.createSuccessResult('No classification data found in classtbl');
      }
    } catch (error) {
      return this.createErrorResult('Unexpected error fetching classification data', error);
    }
  }
}