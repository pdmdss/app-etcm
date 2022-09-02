import { Injectable } from '@angular/core';

import * as L from 'leaflet';
import 'leaflet.vectorgrid';


@Injectable({
  providedIn: 'root'
})
export class MapService {
  private map?: L.Map;
  private groups = new Map<string, L.LayerGroup>();

  constructor() {
  }

  addLayer(layer: L.Layer, name = 'default'): void {
    if (!this.groups.has(name)) {
      const group = new L.LayerGroup([]);
      this.groups.set(name, group);
      this.map?.addLayer(group);
    }

    this.groups.get(name)?.addLayer(layer);
  }

  clearLayers(name = 'default'): void {
    this.groups.get(name)?.clearLayers();
  }

  setView(center: L.LatLngExpression, zoom: number, options?: L.ZoomPanOptions): void {
    this.map?.setView(center, zoom, { animate: false, ...options });
  }

  setZoom(zoom: number, options?: L.ZoomPanOptions): void {
    this.map?.setZoom(zoom, { animate: false, ...options });
  }

  fitBounds(bounds: L.LatLngBoundsExpression, options?: L.FitBoundsOptions): void {
    this.map?.fitBounds(bounds, { animate: false, ...options });
  }

  /**
   * @internal
   */
  destroy(): void {
    this.clearLayers();
    this.map = undefined;
  }

  /**
   * @internal
   */
  init(): void {
    if (typeof this.map !== 'undefined') {
      return;
    }

    this.map = L.map('map', {
      center: [
        35,
        135
      ],
      maxZoom: 9,
      minZoom: 2,
      zoom: 5,
      renderer: L.canvas()
    });
    this.map.zoomControl.remove();

    for (const group of this.groups.values()) {
      group.addTo(this.map);
    }

    const gridPref = (L as any).vectorGrid.protobuf('https://soshi1822.jp/map/tile/prefectures/{z}/{x}/{y}.pbf', {
      maxNativeZoom: 12,
      minNativeZoom: 2,
      rendererFactory: (L as any).canvas.tile,
      vectorTileLayerStyles: {
        prefectures: {
          weight: 2,
          fill: 1,
          fillOpacity: 1,
          fillColor: '#eaeaea',
          color: '#696969'
        }
      }
    });

    const gridWorld = (L as any).vectorGrid.protobuf(
      'https://soshi1822.jp/map/tile/world/{z}/{x}/{y}.pbf',
      {
        zIndex: 4,
        maxNativeZoom: 10,
        minNativeZoom: 2,
        rendererFactory: (L as any).canvas.tile,
        vectorTileLayerStyles: {
          world: {
            weight: 2,
            color: '#696969',
            fillColor: '#ece8e8',
            fillOpacity: 1,
            fill: 1,
            bubblingMouseEvents: false
          }
        }
      }
    );

    this.map.addLayer(gridPref);
    this.map.addLayer(gridWorld);
  }
}
