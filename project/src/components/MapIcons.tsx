import L from 'leaflet';

interface VesselIconOptions {
  heading?: number;
  color?: string;
}

export function VesselIcon({ heading = 0, color = '#3b82f6' }: VesselIconOptions) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <g transform="rotate(${heading} 16 16)">
        <path d="M16 2 L28 28 L16 22 L4 28 Z" fill="${color}" stroke="#fff" stroke-width="2"/>
        <circle cx="16" cy="16" r="3" fill="#fff"/>
      </g>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'vessel-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

interface WaypointIconOptions {
  color?: string;
}

export function WaypointIcon({ color = '#3b82f6' }: WaypointIconOptions) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="#fff"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'waypoint-icon',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

export function PositionIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" fill="#3b82f6" stroke="#fff" stroke-width="3"/>
      <circle cx="10" cy="10" r="3" fill="#fff"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'position-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export function CourseIcon(color: string = '#10b981') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="4" viewBox="0 0 100 4">
      <path d="M0 2 L100 2" stroke="${color}" stroke-width="3" stroke-dasharray="8,4"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'course-icon',
    iconSize: [100, 4],
    iconAnchor: [0, 2],
  });
}
