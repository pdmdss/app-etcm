import { DBSchema, openDB } from 'idb';

const SCHEMA_VERSION = 6550;


export interface AppDBSchema extends DBSchema {
  settings: {
    key: string;
    value: unknown;
  };
}


export const dbPromise = openDB<AppDBSchema>('@dmdata/app-etcm', SCHEMA_VERSION, {
  upgrade: db => {
    db.createObjectStore('settings');
  }
});

