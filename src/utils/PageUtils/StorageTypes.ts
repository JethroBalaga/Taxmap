import localForage from 'localforage';

export interface StorageInfo {
  totalSize: number;
  usedSize: number;
  freeSize: number;
  usagePercentage: number;
  itemCount: number;
}

export interface StorageItem {
  key: string;
  size: number;
  database: string;
  value?: any;
}

export interface InfoItem {
  label: string;
  value: string | number;
  slot?: 'end';
  color?: string;
  badge?: boolean;
}

export interface StorageRecordCount {
  name: string;
  count: number;
  color?: string;
}

export interface StorageInstance {
  name: string;
  instance: LocalForage;
}

export interface RecordCounter {
  name: string;
  getCount: () => Promise<number>;
  color?: string;
}