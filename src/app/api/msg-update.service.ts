import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { interval, of, Subject } from 'rxjs';
import { concatMap, filter, share, skip, tap } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
// @ts-ignore
import { Zlib } from 'zlibjs/bin/gunzip.min.js';

import { EarthquakeInformation } from '@dmdata/telegram-json-types';
import { WebSocketV2, WebSocketV2Data } from '@pdmdss/api-types';

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
  private webSocketSubject?: WebSocketSubject<WebSocketV2>;
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

    return this.telegramSubject.asObservable();
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
    if (this.webSocketSubject?.isStopped === true) {
      return;
    }

    this.webSocketStatus = 'connecting';

    const obs = this.api.socketStart(['telegram.earthquake'], 'ETCM', 'json')
      .pipe(
        concatMap((res) =>
          this.webSocketSubject = webSocket({
            url: res.websocket.url,
            protocol: res.websocket.protocol
          })
        ),
        tap(res => {
          if (res.type === 'ping') {
            this.webSocketSubject?.next({ type: 'pong', pingId: res.pingId });
          }
          if (res.type === 'start') {
            this.webSocketStatus = 'open';
          }
        }),
        concatMap(res => res.type === 'data' ? of<WebSocketV2Data>(res) : of<never>()),
        share()
      );

    obs.subscribe({
      complete: () => this.webSocketStatus = 'closed',
      error: error => (error instanceof HttpErrorResponse || error.type === 'close') ? this.webSocketStatus = 'error' : null
    });

    return obs;
  }
}

function unzip(data: string) {
  const buffer = new Uint8Array(atob(data).split('').map(c => c.charCodeAt(0)));

  return JSON.parse(new TextDecoder().decode(new Zlib.Gunzip(buffer).decompress()));
}
