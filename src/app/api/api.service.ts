import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { concatMap } from 'rxjs/operators';

import {
  APIV2ContractList,
  APIV2GDEarthquakeEvent,
  APIV2GDEarthquakeList,
  APIV2SocketStart,
  APIV2TelegramList
} from '@dmdata/api-types';
import { RequestService } from './request.service';


const endpoints = {
  telegram: {
    list: 'https://api.dmdata.jp/v2/telegram',
    data: 'https://data.api.dmdata.jp/v1/'
  },
  contract: 'https://api.dmdata.jp/v2/contract',
  socket: 'https://api.dmdata.jp/v2/socket',
  gd: {
    earthquake: 'https://api.dmdata.jp/v2/gd/earthquake'
  }
};


@Injectable({
  providedIn: 'root'
})
export class ApiService extends RequestService {
  contractList() {
    return this.get<APIV2ContractList.ResponseOk>(endpoints.contract);
  }


  telegramGet(tid: string): Observable<number | string | object | Document> {
    return this.get(`${endpoints.telegram.data}${tid}`, {}, true)
      .pipe(
        concatMap(res => {
          const contentType = res.headers.get('content-type');

          if (contentType === 'application/json' && typeof res.body === 'object') {
            return of(res.body as object);
          }
          if (contentType === 'application/xml' && typeof res.body === 'string') {
            return of(new DOMParser().parseFromString(res.body, 'application/xml'));
          }
          if (res.body === null || res.status !== 200 || typeof res.body !== 'string') {
            return of(res.status);
          }

          return of(res.body);
        })
      );
  }

  socketStart(classifications: string[], appName?: string, formatMode: 'json' | 'raw' = 'json') {
    return this.post<APIV2SocketStart.ResponseOk>(endpoints.socket, {
      classifications,
      appName,
      formatMode
    }, undefined, 'json');
  }

  telegramList(params: { cursorToken: string | undefined; formatMode: string; type: string }) {
    return this.get<APIV2TelegramList.ResponseOk>(endpoints.telegram.list, query2string(params));
  }

  gdEarthquakeList(params: APIV2GDEarthquakeList.QueryParams = {}) {
    return this.get<APIV2GDEarthquakeList.ResponseOk>(endpoints.gd.earthquake, query2string(params));
  }

  gdEarthquakeEvent(eventId: string) {
    return this.get<APIV2GDEarthquakeEvent.ResponseOk>(`${endpoints.gd.earthquake}/${eventId}`);
  }
}


function query2string(object: { [key: string]: unknown }) {
  return Object.fromEntries(
    Object.entries(object)
      .filter(row => row[1] !== undefined)
      .map(row => [
        row[0],
        `${row[1]}`
      ])
  );
}
