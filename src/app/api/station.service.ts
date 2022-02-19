import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, Subject } from 'rxjs';
import { concatMap, elementAt } from 'rxjs/operators';
import { ApiService } from '@/api/api.service';


const endpoint = {
  area: './assets/earthquake/area.json'
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

  constructor(private http: HttpClient, private api: ApiService) {
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
    this.api.parameterEarthquakeStation()
      .pipe(
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
