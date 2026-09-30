import type { AppState, DienstDef, Luecke, Mitarbeiter, Plan, Rolle } from './types';
import { addDays, istWE, monatsTage, wochenIndex, wochentag } from './dates';
import { rng } from './seed';

const ABW_CODE: Record<string, string> = { Ferien: 'fe', Frei: '.w', Krank: 'kr', Weiterbildung: 'wb' };
const ROLLEN: Rolle[] = ['TL', 'L', 'HW', 'MA'];

function passt(m: Mitarbeiter, rolle: Rolle, d: DienstDef): boolean {
  if (d.bereich === 'HW') return m.funktion === 'HW' && rolle === 'HW';
  if (m.funktion === 'HW') return false;
  if (rolle === 'TL') return m.funktion === 'TL';
  if (rolle === 'L') return m.funktion === 'Lernende';
  if (rolle === 'MA') return m.funktion === 'TL' || m.funktion === 'FaGe' || m.funktion === 'PH';
  return false;
}

/** Welche Rolle besetzt eine Person in einem Dienst (für die Auswertung) */
function rolleVon(m: Mitarbeiter): Rolle {
  if (m.funktion === 'HW') return 'HW';
  if (m.funktion === 'Lernende') return 'L';
  if (m.funktion === 'TL') return 'TL';
  return 'MA';
}

export function generiere(state: AppState, monat: string): Plan {
  const { mitarbeiter: ma, dienste, overrides } = state;
  const dById = Object.fromEntries(dienste.map((d) => [d.id, d]));
  const rand = rng(state.seed);
  const tage = monatsTage(monat);
  let start = tage[0];
  while (wochentag(start) !== 0) start = addDays(start, -1);
  let ende = tage[tage.length - 1];
  while (wochentag(ende) !== 6) ende = addDays(ende, 1);

  // Abwesenheiten nachschlagen
  const abw: Record<string, Record<string, string>> = {};
  const setAbw = (d: string, mid: string, c: string) => ((abw[d] ??= {})[mid] = c);
  for (const a of state.abwesenheiten) {
    for (let d = a.von; d <= a.bis; d = addDays(d, 1)) setAbw(d, a.mitarbeiterId, ABW_CODE[a.typ]);
  }
  for (let d = start; d <= ende; d = addDays(d, 1)) {
    for (const m of ma) {
      if (m.funktion === 'Lernende' && m.schultage.includes(wochentag(d)) && !abw[d]?.[m.id]) setAbw(d, m.id, 'sl');
      if (overrides[d]?.[m.id] === 'FREI') setAbw(d, m.id, '..');
    }
  }

  const zu: Record<string, Record<string, string>> = {};
  const dienstAm = (d: string, mid: string) => zu[d]?.[mid];
  const wochenenden: Record<string, number> = {};

  const kannGrundsaetzlich = (m: Mitarbeiter, d: string) => !abw[d]?.[m.id] && (m.wochenende || !istWE(d));

  const streak = (m: Mitarbeiter, d: string) => {
    let n = 0;
    for (let x = addDays(d, -1); dienstAm(x, m.id) || abw[x]?.[m.id] === 'sl'; x = addDays(x, -1)) n++;
    return n;
  };
  const ruheOk = (m: Mitarbeiter, d: string, dienst: DienstDef) => {
    const gestern = dienstAm(addDays(d, -1), m.id);
    if (gestern && dById[gestern]?.art === 'Spät' && dienst.art !== 'Spät') return false;
    const morgen = dienstAm(addDays(d, 1), m.id);
    if (morgen && dienst.art === 'Spät' && dById[morgen]?.art !== 'Spät') return false;
    return true;
  };

  for (let wStart = start; wStart <= ende; wStart = addDays(wStart, 7)) {
    const wTage = Array.from({ length: 7 }, (_, i) => addDays(wStart, i));
    const wIdx = wochenIndex(wStart);
    const rest: Record<string, number> = {};

    for (const m of ma) {
      const basis = (m.pensum / 100) * 5;
      let ziel = Math.floor((wIdx + 1) * basis + 1e-9) - Math.floor(wIdx * basis + 1e-9);
      let abzug = 0;
      for (const d of wTage) {
        const c = abw[d]?.[m.id];
        if (!c) continue;
        if (c === 'sl') ziel -= 1;
        else if ((c === 'fe' || c === 'kr' || c === 'wb') && !istWE(d)) abzug += m.pensum / 100;
      }
      ziel -= Math.round(abzug);
      // manuelle Einträge vorbelegen
      for (const d of wTage) {
        const o = overrides[d]?.[m.id];
        if (o && o !== 'FREI' && dById[o]) {
          (zu[d] ??= {})[m.id] = o;
          ziel--;
        }
      }
      rest[m.id] = Math.max(0, ziel);
    }

    wTage.forEach((d, di) => {
      const we = istWE(d);
      const tagZu = (zu[d] ??= {});
      const verfuegbareTage = (m: Mitarbeiter) =>
        wTage.slice(di).filter((x) => kannGrundsaetzlich(m, x) && !zu[x]?.[m.id]).length;

      const zaehle = (dienst: DienstDef, rolle: Rolle) => {
        let n = 0;
        for (const [mid, did] of Object.entries(tagZu)) {
          if (did !== dienst.id) continue;
          const m = ma.find((x) => x.id === mid)!;
          const r = rolleVon(m);
          if (r === rolle) n++;
        }
        // überzählige TL zählen als MA
        if (rolle === 'MA') {
          const bedarfTL = (we ? dienst.wochenende : dienst.werktag).soll.TL;
          n += Math.max(0, zaehle(dienst, 'TL') - bedarfTL);
        }
        return n;
      };

      const frei = (m: Mitarbeiter, dienst: DienstDef) =>
        !tagZu[m.id] && rest[m.id] > 0 && kannGrundsaetzlich(m, d) && ruheOk(m, d, dienst) && streak(m, d) < 6;

      const score = (m: Mitarbeiter, dienst: DienstDef, rolle: Rolle) => {
        const vt = Math.max(1, verfuegbareTage(m));
        let s = (rest[m.id] / vt) * 10;
        if (rest[m.id] >= vt) s += 50;
        if (m.stammgruppe === dienst.gruppe) s += 2;
        const gestern = dienstAm(addDays(d, -1), m.id);
        if (gestern === dienst.id) s += 3;
        if (wochentag(d) === 6) {
          if (gestern === dienst.id) s += 30;
          else if (!gestern) s -= 4;
        }
        if (wochentag(d) === 5) s -= (wochenenden[m.id] ?? 0) * 4;
        if (rolle === 'MA' && m.funktion === 'TL') s -= 3;
        return s + rand() * 0.5;
      };

      const fuelle = (stufe: 'min' | 'soll') => {
        for (const rolle of ROLLEN) {
          for (const dienst of dienste) {
            const bedarf = (we ? dienst.wochenende : dienst.werktag)[stufe][rolle];
            let fehlt = bedarf - zaehle(dienst, rolle);
            while (fehlt > 0) {
              const kand = ma.filter((m) => passt(m, rolle, dienst) && frei(m, dienst));
              if (!kand.length) break;
              kand.sort((a, b) => score(b, dienst, rolle) - score(a, dienst, rolle));
              tagZu[kand[0].id] = dienst.id;
              rest[kand[0].id]--;
              fehlt--;
            }
          }
        }
      };
      fuelle('min');
      fuelle('soll');

      // Pensum einhalten: wer heute arbeiten muss, wird als Reserve eingeteilt
      for (const m of ma) {
        if (tagZu[m.id] || rest[m.id] <= 0 || !kannGrundsaetzlich(m, d)) continue;
        if (rest[m.id] < verfuegbareTage(m)) continue;
        const r = rolleVon(m);
        const opts = dienste.filter(
          (x) => (x.bereich === 'HW') === (m.funktion === 'HW') && ruheOk(m, d, x) &&
            (r !== 'L' || x.art === 'Früh') && ((we ? x.wochenende : x.werktag).soll.MA + (we ? x.wochenende : x.werktag).soll.HW > 0 || r === 'L'),
        );
        if (!opts.length) continue;
        const wert = (x: DienstDef) => {
          const s = we ? x.wochenende.soll : x.werktag.soll;
          const soll = s.TL + s.MA + s.L + s.HW;
          const ist = Object.values(tagZu).filter((v) => v === x.id).length;
          return (soll - ist) + (m.stammgruppe === x.gruppe ? 1.5 : 0) + (dienstAm(addDays(d, -1), m.id) === x.id ? 1 : 0) + rand() * 0.3;
        };
        opts.sort((a, b) => wert(b) - wert(a));
        tagZu[m.id] = opts[0].id;
        rest[m.id]--;
      }

      if (wochentag(d) === 5) for (const mid of Object.keys(tagZu)) wochenenden[mid] = (wochenenden[mid] ?? 0) + 1;
    });
  }

  // Auswertung nur für den Monat
  const luecken: Luecke[] = [];
  for (const d of tage) {
    const tagZu = zu[d] ?? {};
    const we = istWE(d);
    for (const dienst of dienste) {
      const ist: Record<Rolle, number> = { TL: 0, MA: 0, L: 0, HW: 0 };
      for (const [mid, did] of Object.entries(tagZu)) {
        if (did !== dienst.id) continue;
        const m = ma.find((x) => x.id === mid);
        if (m) ist[rolleVon(m)]++;
      }
      const b = we ? dienst.wochenende : dienst.werktag;
      const extraTL = Math.max(0, ist.TL - b.soll.TL);
      ist.MA += extraTL;
      ist.TL -= extraTL;
      for (const rolle of ['TL', 'MA', 'L', 'HW'] as Rolle[]) {
        if (ist[rolle] < b.min[rolle]) luecken.push({ datum: d, dienstId: dienst.id, rolle, fehlt: b.min[rolle] - ist[rolle], stufe: 'Pikett' });
        else if (ist[rolle] < b.soll[rolle]) luecken.push({ datum: d, dienstId: dienst.id, rolle, fehlt: b.soll[rolle] - ist[rolle], stufe: 'Reserve' });
      }
    }
  }

  const stunden: Plan['stunden'] = {};
  for (const m of ma) {
    const ist = tage.filter((d) => zu[d]?.[m.id]).length;
    const verfuegbar = tage.filter((d) => wochentag(d) < 5 && !['fe', 'kr', 'wb'].includes(abw[d]?.[m.id] ?? '')).length;
    const schule = tage.filter((d) => abw[d]?.[m.id] === 'sl').length;
    stunden[m.id] = { soll: Math.round((verfuegbar * m.pensum) / 100) - schule, ist };
  }

  const abwMonat: Plan['abwesend'] = {};
  for (const d of tage) if (abw[d]) abwMonat[d] = abw[d];
  const zuMonat: Plan['zuteilung'] = {};
  for (const d of tage) zuMonat[d] = zu[d] ?? {};

  return { monat, tage, zuteilung: zuMonat, abwesend: abwMonat, luecken, stunden };
}
