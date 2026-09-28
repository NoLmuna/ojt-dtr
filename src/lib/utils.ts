import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the distance in meters between two coordinates using the Haversine formula.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateHours(
  amArrival: string | null,
  amDeparture: string | null,
  pmArrival: string | null,
  pmDeparture: string | null,
  includeBreak: boolean = true
): number {
  let total = 0;

  const toMinutes = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const amIn = amArrival ? toMinutes(amArrival) : null;
  const amOut = amDeparture ? toMinutes(amDeparture) : null;
  const pmIn = pmArrival ? toMinutes(pmArrival) : null;
  const pmOut = pmDeparture ? toMinutes(pmDeparture) : null;

  // Case 1: All 4 pairs are logged
  if (amIn !== null && amOut !== null && pmIn !== null && pmOut !== null) {
    if (amOut > amIn) total += amOut - amIn;
    if (pmOut > pmIn) total += pmOut - pmIn;

    if (includeBreak) {
      const breakDuration = pmIn - amOut;
      if (breakDuration > 0) {
        total += Math.min(breakDuration, 60);
      }
    }
  }
  // Case 2: Only In and Out are logged (e.g. AM In & PM Out)
  else if (amIn !== null && pmOut !== null && amOut === null && pmIn === null) {
    if (pmOut > amIn) {
      total += pmOut - amIn;
      if (!includeBreak && total >= 60) {
        total -= 60;
      }
    }
  }
  // Case 3: Only AM punches
  else if (amIn !== null && amOut !== null && pmIn === null && pmOut === null) {
    if (amOut > amIn) {
      total += amOut - amIn;
    }
  }
  // Case 4: Only PM punches
  else if (amIn === null && amOut === null && pmIn !== null && pmOut !== null) {
    if (pmOut > pmIn) {
      total += pmOut - pmIn;
    }
  }
  // Catch all for incomplete entries
  else {
    if (amIn !== null && amOut !== null && amOut > amIn) total += amOut - amIn;
    if (pmIn !== null && pmOut !== null && pmOut > pmIn) total += pmOut - pmIn;
  }

  return Math.max(0, Math.round((total / 60) * 100) / 100);
}

export function formatTime(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m} ${ampm}`;
}

export function formatHoursMinutes(decimalHours: number): string {
  const isNegative = decimalHours < 0;
  const absHours = Math.abs(decimalHours);
  const hours = Math.floor(absHours);
  const minutes = Math.round((absHours - hours) * 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours} hr${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} min${minutes !== 1 ? 's' : ''}`);
  if (parts.length === 0) return '0 hrs';

  return (isNegative ? '-' : '') + parts.join(' ');
}

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}
