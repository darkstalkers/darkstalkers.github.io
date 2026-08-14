export interface Member {
  name: string;
  character: string;
  twitter?: string;
  comment?: string;
  region?: string;
  env?: string;
  history?: string;
  after?: string;
  byoc?: string;
}

export interface TeamEntry {
  key: string;
  name: string;
  members: Member[];
  matching?: string;
  updatedAt?: string;
}

export interface SingleEntry {
  key: string;
  members: Member[];
  matching?: string;
  updatedAt?: string;
}

export type Entry = TeamEntry | SingleEntry;

export type EntryStatus = 'before' | 'open' | 'new_closed' | 'closed';

export interface Config {
  status?: EntryStatus;
  /** @deprecated 旧フィールド。status未設定時のフォールバックにのみ使用 */
  open?: boolean;
}

export function resolveStatus(config: Config): EntryStatus {
  if (config.status) return config.status;
  return config.open ? 'open' : 'before';
}
