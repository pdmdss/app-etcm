import { Component, OnInit } from '@angular/core';
import { concatMap, last } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { EarthquakeInformation } from '@dmdata/telegram-json-types';

import { ApiService } from '@/api/api.service';
import { MsgUpdateService } from '@/api/msg-update.service';
import { earthquakeEventAdd, earthquakeEvents, EventObject } from '@/main/monitor/event';

import pack from '@/package';

@Component({
  selector: 'app-monitor',
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.scss']
})
export class MonitorComponent implements OnInit {
  package = pack;
  viewEventId?: string;
  private eventIdSelectSubject = new Subject<string>();
  private viewSubject = new Subject<EarthquakeInformation.Main>();

  constructor(private api: ApiService, private msg: MsgUpdateService) {
  }

  webSocketStatus() {
    return this.msg.getWebSocketStatus;
  }

  webSocketIsStartingOK() {
    return [
      null,
      'closed',
      'error'
    ].includes(this.webSocketStatus());
  }

  webSocketStart() {
    this.msg.webSocketStart();
  }

  ngOnInit(): void {
    const list = this.api.gdEarthquakeList({ limit: 100 })
      .pipe(concatMap(row => of(...row.items.reverse())));

    list.subscribe(item => earthquakeEventAdd({
      eventId: item.eventId,
      arrivalTime: item.arrivalTime,
      originTime: item.originTime,
      hypocenter: item.hypocenter?.name,
      depth: item.hypocenter?.depth,
      coordinate: item.hypocenter?.coordinate,
      magnitude: item.magnitude,
      maxInt: item.maxInt
    }));

    list
      .pipe(last())
      .subscribe(event => this.eventIdSelectSubject.next(event.eventId));

    this.eventIdSelectSubject
      .pipe(
        concatMap(eventId => this.api.gdEarthquakeEvent(eventId)),
        concatMap(event => of(event.event.telegrams.find(telegram => /^VXSE5[1-3]$/.test(telegram.head.type)))),
        concatMap(telegram => telegram ? this.api.telegramGet(telegram.id) : of<never>()),
        concatMap(data =>
          typeof data === 'object' && !(data instanceof Document) ?
            of(data as EarthquakeInformation.Main) :
            of<never>()
        )
      )
      .subscribe(data => this.viewSubject.next(data));

    this.viewSubject.subscribe(data => this.viewEventId = data.eventId);

    this.msg.newTelegrams()
      .pipe(concatMap(data => data.infoType !== '取消' ? of(data) : of<never>()))
      .subscribe(data => {
        const earthquake = 'earthquake' in data.body ? data.body.earthquake : null;

        earthquakeEventAdd({
          eventId: data.eventId,
          arrivalTime: earthquake?.arrivalTime ?? data.targetDateTime,
          originTime: earthquake?.originTime,
          hypocenter: earthquake?.hypocenter.name,
          depth: earthquake?.hypocenter?.depth,
          coordinate: earthquake?.hypocenter?.coordinate,
          magnitude: earthquake?.magnitude,
          maxInt: 'intensity' in data.body ? data.body.intensity?.maxInt : null
        });

        if (data._schema.type === 'earthquake-information') {
          this.viewSubject.next(data);
        } else {
          this.toEvent(data.eventId);
        }
      });
  }


  eventList(): EventObject[] {
    return [...earthquakeEvents].map(r => r[1]).reverse();
  }

  toEvent(eventId: string) {
    if (this.viewEventId === eventId) {
      return;
    }

    this.eventIdSelectSubject.next(eventId);
  }

  selectEvent() {
    return this.viewSubject.asObservable();
  }
}
