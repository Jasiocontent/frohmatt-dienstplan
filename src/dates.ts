const DAY = 86400000;

export const toKey = (t: number) => new Date(t).toISOString().slice(0, 10);
export const fromKey = (k: string) => Date.parse(k + 'T00:00:00Z');
export const addDays = (k: string, n: number) => toKey(fromKey(k) + n * DAY);
/** 0 = Montag … 6 = Sonntag */
export const wochentag = (k: string) => (new Date(fromKey(k)).getUTCDay() + 6) % 7;
export const istWE = (k: string) => wochentag(k) >= 5;
/** fortlaufende Wochennummer (für Pensum-Ausgleich 3/4-Tage) */
export const wochenIndex = (k: string) => Math.floor((fromKey(k) / DAY + 3) / 7);

export function monatsTage(monat: string): string[] {
  const [y, m] = monat.split('-').map(Number);
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: n }, (_, i) => toKey(Date.UTC(y, m - 1, i + 1)));
}

export const WT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export const monatsName = (monat: string) => {
  const [y, m] = monat.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('de-CH', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};
