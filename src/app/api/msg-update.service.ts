import { Injectable } from '@angular/core';
import { interval, of, Subject } from 'rxjs';
import { concatMap, distinct, filter, skip, tap } from 'rxjs/operators';
// @ts-ignore
import { Zlib } from 'zlibjs/bin/gunzip.min.js';

import { EarthquakeInformation } from '@dmdata/telegram-json-types';
import { APITypes } from '@dmdata/api-types';
import { WebSocketClient } from '@dmdata/sdk-js';

import { ApiService } from '@/api/api.service';

@Injectable({
  providedIn: 'root'
})
export class MsgUpdateService {
  private telegramTypes = [
    'VXSE51',
    'VXSE52',
    'VXSE53',
    'VXSE61'
  ];
  private nextPoolingToken?: string;
  private webSocketSubject?: WebSocketClient;
  private webSocketStatus: null | 'connecting' | 'open' | 'closed' | 'error' = null;
  private telegramSubject?: Subject<EarthquakeInformation.Main>;

  constructor(private api: ApiService) {
  }

  get getWebSocketStatus() {
    return this.webSocketStatus;
  }

  newTelegrams() {
    this.nextPoolingToken = undefined;

    if (!this.telegramSubject) {
      this.telegramSubject = new Subject();
      this.intervalStart();
    }

    return this.telegramSubject.asObservable()
      .pipe(
        distinct(row => row._originalId)
      );
  }

  webSocketStart() {
    this.webSocketConnection()
      ?.pipe(
        filter(item =>
          this.telegramTypes.includes(item.head.type) &&
          item.format === 'json' && item.encoding === 'base64'
        ),
        concatMap(item => of(unzip(item.body) as EarthquakeInformation.Main))
      )
      .subscribe(data => this.telegramSubject?.next(data));
  }

  webSocketClose() {
    if (this.webSocketStatus === 'open') {
      this.webSocketSubject?.close();
    }
  }

  private intervalStart() {
    interval(2000)
      .pipe(
        filter(() => this.webSocketStatus !== 'open'),
        concatMap(() => this.api.telegramList({
          cursorToken: this.nextPoolingToken,
          formatMode: 'json',
          type: 'VXSE'
        })),
        tap(res => this.nextPoolingToken = res.nextPooling),
        skip(1)
      )
      .pipe(
        concatMap(res => of(...res.items)),
        filter(item => this.telegramTypes.includes(item.head.type))
      )
      .pipe(
        concatMap(item => this.api.telegramGet(item.id)),
        concatMap(data =>
          typeof data === 'object' && !(data instanceof Document) ?
            of(data as EarthquakeInformation.Main) :
            of<never>()
        )
      )
      .subscribe(data => this.telegramSubject?.next(data));
  }

  private webSocketConnection() {
    if (this.webSocketSubject?.readyState === WebSocketClient.OPEN) {
      return;
    }

    this.webSocketStatus = 'connecting';

    const s = new Subject<APITypes.WebSocketV2.Event.Data>();

    this.api.socketStart(['telegram.earthquake'], 'ETCM', 'json')
      .subscribe(ws => {
        // @ts-ignore
        this.webSocketSubject = ws.websocket;
        ws.on('data', data => s.next(data));
      });


    return s.asObservable();
  }
}

function unzip(data: string) {
  const buffer = new Uint8Array(atob(data).split('').map(c => c.charCodeAt(0)));

  return JSON.parse(new TextDecoder().decode(new Zlib.Gunzip(buffer).decompress()));
}
