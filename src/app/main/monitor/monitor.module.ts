import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MonitorComponent } from './monitor.component';
import { MapComponent } from './map/map.component';
import { EventViewComponent } from './event-view/event-view.component';


@NgModule({
  declarations: [
    MonitorComponent,
    MapComponent,
    EventViewComponent
  ],
  exports: [
    MonitorComponent
  ],
  imports: [
    CommonModule
  ]
})
export class MonitorModule {
}
