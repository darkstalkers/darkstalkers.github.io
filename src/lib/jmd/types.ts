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

export interface Config {
  open: boolean;
}
