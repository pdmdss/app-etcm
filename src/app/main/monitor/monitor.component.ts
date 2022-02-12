import { Component, OnInit } from '@angular/core';
import { concatMap, last, share } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { Howl } from 'howler';

import { EarthquakeInformation } from '@dmdata/telegram-json-types';

import { ApiService } from '@/api/api.service';
import { MsgUpdateService } from '@/api/msg-update.service';
import { earthquakeEventAdd, earthquakeEvents, EventObject } from '@/main/monitor/event';

import pack from '@/package';
import { Settings } from '@/db/settings';

@Component({
  selector: 'app-monitor',
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.scss']
})
export class MonitorComponent implements OnInit {
  package = pack;
  viewEventId?: string;
  soundPlay = false;
  private eventIdSelectSubject = new Subject<string>();
  private viewSubject = new Subject<EarthquakeInformation.Main>();
  private sound = new Howl({ src: 'assets/sound/sound.mp3' });

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


  webSocketClose() {
    this.msg.webSocketClose();
  }

  ngOnInit(): void {
    const list = this.api.gdEarthquakeList({ limit: 100 })
      .pipe(concatMap(row => of(...row.items.reverse())), share());

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

        if (this.soundPlay) {
          this.sound.play();
        }

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

    this.sound.on('unlock', () => this.soundUnlock());
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

  async soundPlaySetting(event: Event) {
    const target = event.target as HTMLInputElement;
    const is = target.checked;

    this.soundPlay = target.checked;
    await Settings.set('soundPlayAutoActivation', is);
  }

  private async soundUnlock() {
    console.log(this.sound.state());
    const spAa = await Settings.get('soundPlayAutoActivation');

    if (this.sound.state() === 'loaded') {
      this.soundPlay = spAa ?? false;
    }
  }
}
