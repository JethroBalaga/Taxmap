// utils/dataFetchers/AssessmentLevelFetcher.ts
import { BaseFetcher } from './BaseFetcher';
import { FetchDataResult } from '../MapUtility';
import { storeAssessmentLevelData } from '../assessmentLevelLocalStorage';
import { supabase } from '../supaBaseClient';

export class AssessmentLevelFetcher extends BaseFetcher {
  static async fetchData(): Promise<FetchDataResult> {
    try {
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase
        .from('assessmentleveltbl')
        .select('assessment_level_id, kind_id, effective_year, class_id, range1, range2, rate_percent')
        .eq('effective_year', currentYear)
        .order('kind_id', { ascending: true })
        .order('range1', { ascending: true });

      if (error) {
        return this.createErrorResult(`Assessment level data error: ${error.message}`, error);
      }

      if (data && data.length > 0) {
        await storeAssessmentLevelData(data, currentYear);
        return this.createSuccessResult(`Assessment level data stored successfully for year: ${currentYear}`);
      } else {
        return this.createSuccessResult(`No assessment level data found for year ${currentYear}`);
      }
    } catch (error) {
      return this.createErrorResult('Unexpected error fetching assessment level data', error);
    }
  }
}