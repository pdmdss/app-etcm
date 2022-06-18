import { Component, OnInit } from '@angular/core';
import { concatMap, filter, last, share } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { Howl } from 'howler';

import { EarthquakeInformation } from '@dmdata/telegram-json-types';

import { ApiService } from '@/api/api.service';
import { MsgUpdateService } from '@/api/msg-update.service';
import { EarthquakeDataset, EarthquakeEvent } from '@/main/monitor/event';

import pack from '@/package';
import { Settings } from '@/db/settings';
import { MatDialog } from '@angular/material/dialog';
import { EventHistoryComponent } from '@/main/monitor/event-history/event-history.component';

@Component({
  selector: 'app-monitor',
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.scss']
})
export class MonitorComponent implements OnInit {
  package = pack;
  viewEventId?: string;
  soundPlay = false;
  private eventIdList: string[] = [];
  private eventIdSelectSubject = new Subject<{ eventId: string; latestInformation: boolean; }>();
  private viewSubject = new Subject<{ data: EarthquakeInformation.Latest.Main; latestInformation: boolean; }>();
  private sound = new Howl({ src: 'assets/sound/sound.mp3' });

  constructor(private dialog: MatDialog, private api: ApiService, private msg: MsgUpdateService) {
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

    list.subscribe(item => {
      EarthquakeDataset.set(item);
      this.eventIdList.push(item.eventId);
    });

    list
      .pipe(last())
      .subscribe(event => this.eventIdSelectSubject.next({
        eventId: event.eventId,
        latestInformation: true
      }));

    this.eventIdSelectSubject
      .pipe(
        concatMap(event =>
          this.api.gdEarthquakeEvent(event.eventId)
            .pipe(
              concatMap(event => of(event.event.telegrams.find(telegram => /^VXSE5[1-3]$/.test(telegram.head.type)))),
              concatMap(telegram => telegram ? this.api.telegramGet(telegram.id) : of<never>()),
              concatMap(data =>
                typeof data === 'object' && !(data instanceof Document) ?
                  of({
                    data: data as EarthquakeInformation.Latest.Main,
                    latestInformation: event.latestInformation
                  }) :
                  of<never>()
              )
            )
        )
      )
      .subscribe(value => this.viewSubject.next(value));

    this.viewSubject.subscribe(({ data }) => {
      this.viewEventId = data.eventId;
      this.oldDatasetDelete();
    });

    this.msg.newTelegrams()
      .pipe(concatMap(data => data.infoType !== '取消' ? of(data) : of<never>()))
      .subscribe(data => {
        const earthquake = 'earthquake' in data.body ? data.body.earthquake : null;

        if (this.soundPlay) {
          this.sound.play();
        }

        EarthquakeDataset.set({
          eventId: data.eventId,
          arrivalTime: earthquake?.arrivalTime ?? data.targetDateTime,
          originTime: earthquake?.originTime,
          hypocenter: earthquake?.hypocenter,
          magnitude: earthquake?.magnitude,
          maxInt: 'intensity' in data.body ? data.body.intensity?.maxInt : undefined,
          maxLpgmInt: undefined
        });
        if (!this.eventIdList.includes(data.eventId)) {
          this.eventIdList.push(data.eventId);
        }
        if (this.eventIdList.length > 100) {
          this.eventIdList.shift();
        }

        if (data._schema.type === 'earthquake-information') {
          this.viewSubject.next({
            data,
            latestInformation: true
          });
        } else {
          this.toEvent(data.eventId);
        }
      });

    this.sound.on('unlock', () => this.soundUnlock());
  }

  panelOpen(name: string) {
    if (name === 'earthquake-history') {
      const dialogRef = this.dialog.open(EventHistoryComponent);

      dialogRef.afterClosed()
        .pipe(filter(result => typeof result === 'string' && result.length === 14))
        .subscribe((eventId: string) => this.toEvent(eventId));
    }
  }

  eventList() {
    return this.eventIdList.reverse()
      .map(eventId => EarthquakeDataset.get(eventId))
      .filter(event => event) as EarthquakeEvent[];
  }

  toEvent(eventId: string) {
    if (this.viewEventId === eventId) {
      return;
    }

    this.eventIdSelectSubject.next({
      eventId,
      latestInformation: this.eventIdList.indexOf(eventId) === (this.eventIdList.length - 1)
    });
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

  private oldDatasetDelete() {
    for (const datasetEventId of EarthquakeDataset.eventIds()) {
      if (!this.eventIdList.includes(datasetEventId) && this.viewEventId !== datasetEventId) {
        EarthquakeDataset.delete(datasetEventId);
      }
    }
  }
}
