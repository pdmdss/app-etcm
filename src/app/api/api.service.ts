import { Injectable } from '@angular/core';
import { DMDATA } from '@dmdata/sdk-js';
import { firstValueFrom, from, Observable, of } from 'rxjs';
import { concatMap } from 'rxjs/operators';

import { APITypes, Components } from '@dmdata/api-types';

import { Oauth2Service } from '@/api/oauth2.service';


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private client = new DMDATA();

  constructor(private oauth2: Oauth2Service) {
    this.client.setAuthorizationContext({
      getAuthorization: () => firstValueFrom(this.oauth2.getAuthorizationRxjs()),
      getDPoPProofJWT: (method: string, uri: string, nonce?: string | null) => firstValueFrom(this.oauth2.getDPoPProofJWT(method, uri, nonce))
    });
  }

  contractList() {
    return from(this.client.contract.list())
      .pipe(
        concatMap(res => of(res.data))
      );
  }


  telegramGet(tid: string): Observable<number | string | object | Document> {
    return from(this.client.telegramBody.get(tid))
      .pipe(
        concatMap(res => {
          const contentType = res.headers['content-type'];

          if (contentType === 'application/json' && typeof res.data === 'object') {
            return of(res.data as object);
          }
          if (contentType === 'application/xml' && typeof res.data === 'string') {
            return of(new DOMParser().parseFromString(res.data, 'application/xml'));
          }
          if (res.data === null || res.status !== 200 || typeof res.data !== 'string') {
            return of(res.status);
          }

          return of(res.data);
        })
      );
  }

  socketStart(classifications: Components.Classification.Values[], appName?: string, formatMode: 'json' | 'raw' = 'json') {
    return from(this.client.socket.start({
      classifications,
      appName,
      formatMode
    }));
  }

  telegramList(params: APITypes.TelegramList.QueryParams) {
    return from(this.client.telegram.list(params))
      .pipe(
        concatMap(res => of(res.data))
      );
  }

  gdEarthquakeList(params: APITypes.GDEarthquakeList.QueryParams) {
    return from(this.client.gdEarthquake.list(params))
      .pipe(
        concatMap(res => of(res.data))
      );
  }

  gdEarthquakeEvent(eventId: string) {
    return from(this.client.gdEarthquake.event(eventId))
      .pipe(
        concatMap(res => of(res.data))
      );
  }

  parameterEarthquakeStation() {
    return from(this.client.parameter.earthquake())
      .pipe(
        concatMap(res => of(res.data))
      );
  }
}
