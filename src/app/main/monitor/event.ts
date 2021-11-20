export interface EventObject {
  eventId: string;
  originTime: string | null;
  arrivalTime: string | null;
  hypocenterName: string;
  depth: string | null;
  magnitude: string | null;
  maxIntText: string | null;
  maxInt: string | null;
  coordinate: {
    latitude?: { text: string, value: string };
    longitude?: { text: string, value: string };
    condition?: string;
  } | null;
}

interface EventInput {
  eventId: string;
  originTime?: string | null;
  arrivalTime?: string | null;
  hypocenter?: string;
  depth?: {
    value: string | null;
    condition?: string;
  };
  magnitude?: {
    value: string | null;
    condition?: string;
  };
  maxInt?: string | null;
  coordinate?: {
    latitude?: { text: string, value: string };
    longitude?: { text: string, value: string };
    condition?: string;
  };
}

export const earthquakeEvents = new Map<string, EventObject>();

export function earthquakeEventAdd(data: EventInput) {
  const eventId = data.eventId;
  if (!eventId) {
    return;
  }

  const eventData: EventObject = earthquakeEvents.get(eventId ?? '0') ??
    {
      eventId, originTime: null, arrivalTime: null, hypocenterName: '震源調査中', depth: null, magnitude: null,
      maxIntText: null, maxInt: null, coordinate: null
    };

  const originTime = data.originTime;
  const arrivalTime = data.arrivalTime;
  const hypocenterName = data.hypocenter;
  const coordinate = data.coordinate;
  const depth = data.depth;
  const magnitude = data.magnitude;
  const maxInt = data.maxInt;

  if (originTime) {
    eventData.originTime = originTime;
  }
  if (arrivalTime) {
    eventData.arrivalTime = arrivalTime;
  }
  if (hypocenterName) {
    eventData.hypocenterName = hypocenterName;
  }
  if (magnitude) {
    eventData.magnitude = magnitude.condition ?? `M ${magnitude.value}`;
  }
  if (maxInt) {
    eventData.maxIntText = maxInt.replace('+', '強').replace('-', '弱');
    eventData.maxInt = maxInt.replace('+', '2').replace('-', '1');
  }

  if (coordinate) {
    eventData.coordinate = coordinate;
  }

  if (depth) {
    eventData.depth = depth.condition ?? `${depth.value}km`;
  }

  earthquakeEvents.set(eventId, eventData);
}
