import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, Subject } from 'rxjs';
import { concatMap, elementAt } from 'rxjs/operators';
import { Oauth2Service } from './oauth2.service';


const endpoint = {
  station: 'https://api.dmdata.jp/v2/parameter/earthquake/station',
  area: './assets/earthquake/area.json'
};

type ApiParametersEarthQuakeStation = {
  items: {
    region: { name: string; code: string; kana: string; };
    city: { name: string; code: string; kana: string; };
    code: string;
    name: string;
    kana: string;
    status: string;
    latitude: string;
    longitude: string;
  }[];
};

type ApiParametersEarthQuakeArea = {
  name: string;
  code: string;
  latitude: string;
  longitude: string;
}[];

@Injectable({
  providedIn: 'root'
})
export class StationService {

  loadingStatus = false;
  private earthquakeStations = new Map<string, [number, number]>();
  private earthquakeAreas = new Map<string, [number, number]>();
  private loading = new Subject<boolean>();
  loadingObs = this.loading.asObservable();

  constructor(private http: HttpClient, private oauth2: Oauth2Service) {
    this.requestEarthquakeStationList();
    this.requestEarthquakeAreasList();
    this.loadingObs.pipe(elementAt(1)).subscribe(() => this.loadingStatus = true);
  }

  getEarthquakeStation(code: string): [number, number] | null {
    return this.earthquakeStations.get(code) ?? null;
  }

  getEarthquakeArea(code: string): [number, number] | null {
    return this.earthquakeAreas.get(code) ?? null;
  }

  private requestEarthquakeStationList(): void {
    this.oauth2.getAuthorizationRxjs()
      .pipe(
        concatMap(token =>
          this.oauth2.getDPoPProofJWT('GET', endpoint.station)
            .pipe(concatMap(dpop =>
              of([
                  token,
                  dpop
                ] as [string, string | null]
              )
            ))
        ),
        concatMap(([token, dpop]) =>
          this.http.get<ApiParametersEarthQuakeStation>(
            endpoint.station,
            {
              responseType: 'json',
              headers: {
                authorization: token,
                ...(dpop ? { dpop } : {})
              }
            }
          ))
        ,
        concatMap(res => {
          const map = new Map<string, [number, number]>();

          res.items.forEach(r => map.set(r.code, [
            +r.latitude,
            +r.longitude
          ]));

          return of(map);
        })
      )
      .subscribe(data => {
        this.earthquakeStations = data;
        this.loading.next(true);
      });
  }

  private requestEarthquakeAreasList(): void {
    this.http.get<ApiParametersEarthQuakeArea>(
      endpoint.area,
      { responseType: 'json' }
    )
      .pipe(
        concatMap(res => {
          const map = new Map<string, [number, number]>();

          res.forEach(r => map.set(r.code, [
            +r.latitude,
            +r.longitude
          ]));

          return of(map);
        })
      )
      .subscribe(data => {
        this.earthquakeAreas = data;
        this.loading.next(true);
      });
  }
}
