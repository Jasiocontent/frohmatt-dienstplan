import type { AppState, Besetzung, DienstDef, Funktion, Gruppe, Mitarbeiter, Abwesenheit, AbwTyp } from './types';
import { addDays, monatsTage, wochentag } from './dates';

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const B = (TL = 0, MA = 0, L = 0, HW = 0): Besetzung => ({ TL, MA, L, HW });

/** Standard-Soll aus dem September-Plan abgeleitet */
export const STANDARD_DIENSTE: DienstDef[] = [
  { id: 'BF', code: 'b1', name: 'Bachtel Früh', gruppe: 'Bachtel', art: 'Früh', bereich: 'Pflege',
    werktag: { min: B(1, 1), soll: B(1, 1, 1) }, wochenende: { min: B(1, 1), soll: B(1, 1) } },
  { id: 'BG', code: 'b3', name: 'Bachtel Geteilt', gruppe: 'Bachtel', art: 'Geteilt', bereich: 'Pflege',
    werktag: { min: B(), soll: B(0, 1) }, wochenende: { min: B(), soll: B() } },
  { id: 'BS', code: 'b6', name: 'Bachtel Spät', gruppe: 'Bachtel', art: 'Spät', bereich: 'Pflege',
    werktag: { min: B(1, 1), soll: B(1, 1) }, wochenende: { min: B(1, 1), soll: B(1, 1) } },
  { id: 'EF', code: 'e1', name: 'Etzel Früh', gruppe: 'Etzel', art: 'Früh', bereich: 'Pflege',
    werktag: { min: B(1, 2), soll: B(1, 3, 1) }, wochenende: { min: B(1, 2), soll: B(1, 3) } },
  { id: 'EG', code: 'e3', name: 'Etzel Geteilt', gruppe: 'Etzel', art: 'Geteilt', bereich: 'Pflege',
    werktag: { min: B(0, 1), soll: B(0, 1) }, wochenende: { min: B(0, 1), soll: B(0, 1) } },
  { id: 'ES', code: 'e6', name: 'Etzel Spät', gruppe: 'Etzel', art: 'Spät', bereich: 'Pflege',
    werktag: { min: B(1, 1), soll: B(1, 2) }, wochenende: { min: B(1, 1), soll: B(1, 2) } },
  { id: 'HE', code: 'FE', name: 'HW Etzel', gruppe: 'Etzel', art: 'Früh', bereich: 'HW',
    werktag: { min: B(0, 0, 0, 1), soll: B(0, 0, 0, 1) }, wochenende: { min: B(0, 0, 0, 1), soll: B(0, 0, 0, 1) } },
  { id: 'HB', code: 'FB', name: 'HW Bachtel', gruppe: 'Bachtel', art: 'Früh', bereich: 'HW',
    werktag: { min: B(0, 0, 0, 1), soll: B(0, 0, 0, 1) }, wochenende: { min: B(0, 0, 0, 1), soll: B(0, 0, 0, 1) } },
  { id: 'HA', code: 'ad', name: 'HW Abend', gruppe: 'Haus', art: 'Spät', bereich: 'HW',
    werktag: { min: B(), soll: B(0, 0, 0, 1) }, wochenende: { min: B(), soll: B() } },
];

// Personen aus dem Septemberplan. Funktion, Pensum, Ferien usw. sind Beispielwerte.
type Vorlage = [name: string, funktion: Funktion | null, gruppe: Gruppe | null, schultage?: number[], wochenende?: boolean];
const PERSONEN: Vorlage[] = [
  ['Scherfeld Kerstin', 'TL', null],
  ['Mihula Jiri', null, null],
  ['Correia Camacho N.', null, 'Bachtel'],
  ['Krawiec Malgorzata', null, 'Etzel'],
  ['Sunitsch Gerda', null, 'Bachtel'],
  ['Ciustea Irina Maria', null, null],
  ['Rungwatsang Tsering', null, 'Etzel'],
  ['Kälin Valérie', null, 'Bachtel'],
  ['Potteparambil Justin', null, 'Etzel'],
  ['Volkova Yulia', null, 'Bachtel'],
  ['Carneiro Silva Ana', 'Lernende', 'Bachtel', [2, 3], false],
  ['Zwiker Zoé Sophia', 'Lernende', 'Bachtel', [2, 3], false],
  ['Von Atzigen Zoe', 'Lernende', 'Etzel', [1]],
  ['Rubin Nadja', 'Lernende', 'Etzel', [4]],
  ['Gränicher Monique', 'Lernende', 'Etzel', [2]],
  ['Kanap Ece', 'Lernende', 'Bachtel', [3, 4]],
  ['Corsentino Lina', null, 'Etzel'],
  ['Jude Selvanayagam D.', null, 'Etzel'],
  ['Etzel Annette', null, 'Etzel'],
  ['Yurenko Yuliya', null, 'Bachtel'],
  ['Stanojevic Danica', null, 'Etzel'],
  ['Vazhuthanappallil S.', null, 'Etzel'],
  ['Coric Senada', null, 'Etzel'],
  ['Illi-Saleh Lillian', null, 'Bachtel'],
  ['Mobaraki Angela', null, 'Etzel'],
  ['Kocic Vesna', null, 'Bachtel'],
  ['Schiring Regine', null, 'Etzel'],
  ['Gasso Afi', null, 'Etzel'],
  ['Risler-Dössegger R.', null, 'Bachtel'],
  ['Cidanal Adela', null, 'Etzel'],
  ['Maibaum Susanne', null, null],
  ['Streuli Brigitte', 'TL', null],
  ['Cornassan Nessrin', null, null],
  ['Lindenmann Simon', null, null],
  ['Scharle Kathrin', 'TL', 'Bachtel'],
  ['Schimpf Maike', null, null],
  ['Tanner Daniela', null, 'Etzel'],
  ['Tschümperlin Leona', null, null],
  ['van Rooyen Wanda', null, null],
  ['Eckstein Elif', 'HW', 'Bachtel'],
  ['Hotz Suseth', 'HW', 'Etzel'],
  ['Jankovic Dusica', 'HW', 'Etzel'],
  ['Ziljkik Ifeta', 'HW', 'Etzel'],
  ['Agusi Ganimete', 'HW', 'Bachtel'],
  ['Müller Korinna', 'HW', 'Bachtel'],
];

let idc = 0;
export const neueId = () => Math.random().toString(36).slice(2, 9) + (idc++).toString(36);

export function demoState(monat = '2026-11', seed = 7): AppState {
  const r = rng(seed);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const pensen = [60, 70, 80, 80, 90, 100, 100];
  // Funktionen für Personen ohne feste Vorgabe zufällig: 4 weitere TL, Rest FaGe/PH
  const offen = PERSONEN.map((p, i) => (p[1] ? -1 : i)).filter((i) => i >= 0);
  const reihenfolge = [...offen].sort(() => r() - 0.5);
  const funktionVon: Record<number, Funktion> = {};
  reihenfolge.forEach((i, k) => (funktionVon[i] = k < 4 ? 'TL' : k % 2 ? 'FaGe' : 'PH'));

  const mitarbeiter: Mitarbeiter[] = PERSONEN.map(([name, f, g, schule, we], i) => {
    const funktion = f ?? funktionVon[i];
    const lern = funktion === 'Lernende';
    return {
      id: neueId(),
      name,
      funktion,
      pensum: lern ? 100 : pick(pensen),
      stammgruppe: g ?? (r() < 0.55 ? 'Etzel' : 'Bachtel'),
      wochenende: we ?? r() < 0.88,
      schultage: schule ?? [],
    };
  });

  // zufällige Abwesenheiten im Monat
  const tage = monatsTage(monat);
  const abwesenheiten: Abwesenheit[] = [];
  for (const m of mitarbeiter) {
    const x = r();
    if (x < 0.22) {
      const start = pick(tage.slice(0, 22));
      abwesenheiten.push({ id: neueId(), mitarbeiterId: m.id, typ: 'Ferien', von: start, bis: addDays(start, 4 + Math.floor(r() * 6)) });
    }
    const wuensche = Math.floor(r() * 3);
    for (let k = 0; k < wuensche; k++) {
      const d = pick(tage);
      abwesenheiten.push({ id: neueId(), mitarbeiterId: m.id, typ: 'Frei', von: d, bis: d });
    }
    if (r() < 0.08) {
      const d = pick(tage.filter((t) => wochentag(t) < 5));
      abwesenheiten.push({ id: neueId(), mitarbeiterId: m.id, typ: pick<AbwTyp>(['Weiterbildung', 'Krank']), von: d, bis: d });
    }
  }
  return { version: 1, seed, mitarbeiter, abwesenheiten, dienste: STANDARD_DIENSTE, overrides: {} };
}
