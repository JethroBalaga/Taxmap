// utils/dataFetchers/BaseFetcher.ts
import { FetchDataResult } from '../MapUtility';

export abstract class BaseFetcher {
  static async fetchData(): Promise<FetchDataResult> {
    throw new Error('fetchData method must be implemented by subclass');
  }
  
  protected static createSuccessResult(message: string): FetchDataResult {
    return { success: true, message };
  }
  
  protected static createErrorResult(message: string, error?: any): FetchDataResult {
    return { success: false, message, error };
  }
}