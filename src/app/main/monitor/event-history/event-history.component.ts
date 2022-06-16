import { Component, OnInit } from '@angular/core';
import { ApiService } from '@/api/api.service';
import { MatDialogRef } from '@angular/material/dialog';
import { APITypes } from '@dmdata/api-types';
import { EarthquakeDataset } from '@/main/monitor/event';

@Component({
  selector: 'app-event-history',
  templateUrl: './event-history.component.html',
  styleUrls: ['./event-history.component.scss']
})
export class EventHistoryComponent implements OnInit {
  historyStatus: 'loading' | 'ok' | null = null;
  historyItems: APITypes.GDEarthquakeList.ResponseOk['items'] = [];
  isPanelHidden = false;
  private searchValues = {
    start_date: <null | string>null,
    end_date: <null | string>null,
    max_int: <null | string>null
  };

  constructor(private dialogRef: MatDialogRef<EventHistoryComponent>, private api: ApiService) {
  }

  ngOnInit(): void {
  }

  search() {
    const startDate = this.searchValues.start_date;
    const endDate = this.searchValues.end_date;
    const datetime = (startDate || endDate) ?
      (startDate ? dateFormat(startDate, false) : '') + '~' + (endDate ? dateFormat(endDate, true) : '') : null;

    const maxInt = this.searchValues.max_int;

    this.historyStatus = 'loading';
    this.api.gdEarthquakeList({
      ...(datetime ? { datetime } : {}),
      ...(maxInt ? { maxInt } : {}),
      limit: 100
    })
      .subscribe({
        next: res => {
          this.historyItems = res.items;
          this.historyStatus = 'ok';
        },
        error: () => this.historyStatus = null
      });
  }

  setSearch(type: 'start_date' | 'end_date' | 'max_int', event: Event) {
    const value = (<HTMLInputElement>event.target).value;

    this.searchValues[type] = !value || value.length === 0 ? null : value;
  }

  toSelectEvent(eventId: string) {
    const event = this.historyItems.find(item => item.eventId === eventId);

    if (!event) {
      return;
    }

    EarthquakeDataset.set(event);
    this.dialogRef.close(eventId);
  }

  panelClose() {
    this.dialogRef.close();
  }
}

function dateFormat(val: string, isEnd: boolean) {
  const date = new Date(val);

  if (isEnd) {
    date.setDate(date.getDate() + 1);
  }

  return date.getFullYear() + '-' +
    `${(date.getMonth() + 1)}`.padStart(2, '0') + '-' +
    `${date.getDate()}`.padStart(2, '0') +
    'T00:00:00';
}
