import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { MonitorComponent } from './monitor.component';
import { MapComponent } from './map/map.component';
import { EventViewComponent } from './event-view/event-view.component';
import { EventHistoryComponent } from './event-history/event-history.component';

import { IntColorPipe } from './pipe/int-color.pipe';


@NgModule({
  declarations: [
    MonitorComponent,
    MapComponent,
    EventViewComponent,
    EventHistoryComponent,
    IntColorPipe
  ],
  exports: [
    MonitorComponent
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule
  ]
})
export class MonitorModule {
}
