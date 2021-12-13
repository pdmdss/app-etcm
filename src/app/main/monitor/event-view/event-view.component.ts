import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { icon, Icon, LatLngBounds, latLngBounds, Layer, marker } from 'leaflet';

import { EarthquakeInformation } from '@dmdata/telegram-json-types';
import { StationService } from '@/api/station.service';
import { MapService } from '@/main/monitor/map/map.service';
import { earthquakeEvents, EventObject } from '@/main/monitor/event';
import { Intensity } from '@dmdata/telegram-json-types/types/schema/earthquake-information';

const seismicIcon = new Map<number, Icon>();
const hypocenterIcon = icon({
  iconUrl: './assets/earthquake/image/hypocenter.png',
  iconSize: [
    24,
    24
  ],
  iconAnchor: [
    12,
    12
  ]
});
for (let i = 1; i < 10; i++) {
  seismicIcon.set(i, icon({
    iconUrl: './assets/earthquake/image/S' + i + '.png',
    iconSize: [
      22,
      22
    ],
    iconAnchor: [
      11,
      11
    ]
  }));
}

type EventObjectExtend = EventObject & {
  dateTime?: string;
  author?: string;
  comment?: {
    forecast?: string;
    var?: string;
    free?: string;
  };
  intensity?: {
    area?: [string, string[]][];
    city?: [string, string[]][]
  }
};

@Component({
  selector: 'app-event-view',
  templateUrl: './event-view.component.html',
  styleUrls: ['./event-view.component.scss']
})
export class EventViewComponent implements OnInit {
  nowEventData?: EventObjectExtend;
  @Input() eventId?: Observable<EarthquakeInformation.Main>;

  constructor(private map: MapService, private station: StationService) {
  }

  ngOnInit(): void {
    this.eventId?.subscribe(data => this.view(data));

  }

  private mapClearLayerEarthquake(): void {
    this.map.clearLayers('earthquake');
  }

  private mapAddLayerEarthquake(layer: Layer): void {
    this.map.addLayer(layer, 'earthquake');
  }

  private mapClearPointEarthquake(): void {
    this.map.clearLayers('point');
  }

  private mapAddPointEarthquake(layer: Layer): void {
    this.map.addLayer(layer, 'point');
  }


  private view(data: EarthquakeInformation.Main): void {
    if (data.infoType === '取消') {
      return;
    }

    const title = data.title;
    const dateTime = data.pressDateTime;
    const eventId = data.eventId;
    const eventData: EventObjectExtend | undefined = this.nowEventData = earthquakeEvents.get(eventId);

    if (!eventId || !dateTime || !eventData) {
      return;
    }

    if (this.nowEventData?.eventId !== eventData.eventId) {
      this.mapClearLayerEarthquake();
      this.mapClearPointEarthquake();
    }

    this.nowEventData = eventData;

    this.nowEventData.author = data.editorialOffice;
    this.nowEventData.dateTime = dateTime;

    this.comment(data.body.comments, eventData);

    const intensity = 'intensity' in data.body ? data.body.intensity : null;

    const bounds = latLngBounds([]);

    const coordinate = eventData.coordinate;

    if (coordinate && coordinate.latitude && coordinate.longitude) {
      this.mapClearLayerEarthquake();

      const latitude = coordinate.latitude;
      const longitude = coordinate.longitude;
      const center: [number, number] = [
        +latitude.value,
        +longitude.value
      ];

      this.mapAddLayerEarthquake(
        marker(center, {
          icon: hypocenterIcon,
          zIndexOffset: 90000000
        })
      );
      bounds.extend(center);
    }

    eventData.intensity ??= {};
    if (intensity) {
      const obsStations = 'stations' in intensity ? intensity.stations : null;
      const obsAreas = intensity?.regions;

      if (obsStations && obsStations.length > 0) {
        this.mapClearPointEarthquake();

        const cityInt = new Map<string, string[]>([
          [
            '1',
            []
          ],
          [
            '2',
            []
          ],
          [
            '3',
            []
          ],
          [
            '4',
            []
          ],
          [
            '5-',
            []
          ],
          [
            '5+',
            []
          ],
          [
            '6-',
            []
          ],
          [
            '6+',
            []
          ],
          [
            '7',
            []
          ]
        ]);

        obsStations.forEach(obsStation => this.intensity(obsStation, bounds, cityInt));

        eventData.intensity.city = [...cityInt].reverse();
      } else if (obsAreas && obsAreas.length > 0) {
        this.mapClearPointEarthquake();

        const areaInt = new Map<string, string[]>([
          [
            '1',
            []
          ],
          [
            '2',
            []
          ],
          [
            '3',
            []
          ],
          [
            '4',
            []
          ],
          [
            '5-',
            []
          ],
          [
            '5+',
            []
          ],
          [
            '6-',
            []
          ],
          [
            '6+',
            []
          ],
          [
            '7',
            []
          ]
        ]);

        obsAreas.forEach(obsArea => this.intensity(obsArea, bounds, areaInt));

        eventData.intensity.area = [...areaInt].reverse();
      }
    }

    this.map.fitBounds(bounds, { maxZoom: 7 });

    if (title === '遠地地震に関する情報') {
      this.map.setZoom(3);
    }
  }

  private comment(comment: EarthquakeInformation.PublicVXSE53['body']['comments'], eventData: EventObjectExtend): void {
    const varComment = comment.var;
    const forecastComment = comment.forecast;
    const freeFormComment = comment.free;

    eventData.comment = {};
    if (varComment) {
      eventData.comment.var = varComment.text;
    }
    if (forecastComment) {
      eventData.comment.forecast = forecastComment.text;
    }
    if (freeFormComment) {
      eventData.comment.free = freeFormComment;
    }
  }

  private intensity(item: {
                      name: string;
                      code: string;
                      int?: Intensity | '!5-';
                      maxInt?: Intensity | '!5-';
                      revise?: '上方修正' | '追加';
                      condition?: '震度５弱以上未入電';
                    },
                    bounds: LatLngBounds,
                    intLists: Map<string, string[]>): void {
    const int = 'maxInt' in item ? item.maxInt : 'int' in item ? item.int : null;
    const code = item.code;
    const name = item.name;

    if (!int || !code || !name) {
      return;
    }

    const location = this.station.getEarthquakeStation(code) ?? this.station.getEarthquakeArea(code);

    if (!location) {
      return;
    }

    const intNumber = int2number(int);

    if (intNumber === 0) {
      return;
    }

    bounds.extend(location);

    intLists.get(int)?.push(name.replace('＊', ''));

    this.mapAddPointEarthquake(
      marker(location, {
        icon: seismicIcon.get(intNumber),
        title: `${name}\n震度:${int}`,
        zIndexOffset: +`${intNumber}${code}`
      })
    );
  }


}

function int2number(str: string): number {
  if (str === '7') {
    return 9;
  }
  if (str === '6+') {
    return 8;
  }
  if (str === '6-') {
    return 7;
  }
  if (str === '5+') {
    return 6;
  }
  if (str === '5-') {
    return 5;
  }
  if (str === '!5-') {
    return 0;
  }

  return +str;
}
