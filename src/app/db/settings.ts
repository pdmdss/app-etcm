import { dbPromise } from './indexed-db';
import { AppSettings } from './setting';


export class Settings {
  static get<K extends Extract<keyof T, string>, T = AppSettings>(key: K) {
    return dbPromise
      .then(db => db.get('settings', key) as Promise<T[K] | undefined>);
  }

  static async set<K extends Extract<keyof T, string>, T = AppSettings>(key: K, value: T[K]) {
    return (await dbPromise).put('settings', value, key);
  }

  static async delete(key: keyof AppSettings) {
    return (await dbPromise).delete('settings', key);
  }
}
