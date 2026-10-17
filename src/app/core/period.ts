export type PeriodPreset = 'all' | 'today' | '7d' | '30d' | 'month' | 'year' | 'custom';

export interface PeriodRange {
  key: PeriodPreset;
  from: string;
  to: string;
}

export const PERIOD_PRESETS: {key: PeriodPreset; label: string; icon: string}[] = [
  {key: 'all', label: 'Tout', icon: '∞'},
  {key: 'today', label: "Aujourd'hui", icon: 'J'},
  {key: '7d', label: '7 jours', icon: '7'},
  {key: '30d', label: '30 jours', icon: '30'},
  {key: 'month', label: 'Ce mois', icon: 'M'},
  {key: 'year', label: 'Cette année', icon: 'A'},
  {key: 'custom', label: 'Personnalisé', icon: '…'},
];

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function shiftDays(d: Date, days: number): string {
  const n = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
  return isoDate(n);
}

export function rangeFor(key: PeriodPreset, from?: string, to?: string): PeriodRange {
  const now = new Date();
  const end = isoDate(now);
  if (key === 'all') return {key, from: '', to: ''};
  if (key === 'today') return {key, from: end, to: end};
  if (key === '7d') return {key, from: shiftDays(now, -6), to: end};
  if (key === '30d') return {key, from: shiftDays(now, -29), to: end};
  if (key === 'month') return {key, from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: end};
  if (key === 'year') return {key, from: isoDate(new Date(now.getFullYear(), 0, 1)), to: end};
  const start = from || shiftDays(now, -29);
  const finish = to || end;
  return {key, from: start <= finish ? start : finish, to: start <= finish ? finish : start};
}

export function formatPeriodLabel(from: string, to: string, key?: PeriodPreset): string {
  if (key === 'all' || (!from && !to)) return 'Toutes les données';
  const opts: Intl.DateTimeFormatOptions = {day: 'numeric', month: 'short', year: 'numeric'};
  const a = new Date(from + 'T00:00:00').toLocaleDateString('fr-FR', opts);
  const b = new Date(to + 'T00:00:00').toLocaleDateString('fr-FR', opts);
  return from === to ? a : `Du ${a} au ${b}`;
}
