import { Components } from '@dmdata/api-types';

export type EarthquakeEvent = Omit<Components.Earthquake.Event, 'id'>

export class EarthquakeDataset {
  private static events = new Map<string, EarthquakeEvent>();

  static get(eventId: string) {
    return this.events.get(eventId);
  }

  static set(event: EarthquakeEvent) {
    this.events.set(event.eventId, event);
  }

  static delete(eventId: string) {
    return this.events.delete(eventId);
  }

  static eventIds() {
    return this.events.keys();
  }
}
