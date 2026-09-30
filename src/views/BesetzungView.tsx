import type { AppState, Besetzung, DienstDef, Rolle } from '../types';
import { STANDARD_DIENSTE } from '../seed';

interface Props {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
}

type Pfad = ['werktag' | 'wochenende', 'min' | 'soll'];

export default function BesetzungView({ state, update }: Props) {
  const setWert = (id: string, [tag, stufe]: Pfad, rolle: Rolle, v: number) =>
    update((s) => ({
      ...s,
      dienste: s.dienste.map((d) => {
        if (d.id !== id) return d;
        const b: Besetzung = { ...d[tag][stufe], [rolle]: Math.max(0, v) };
        return { ...d, [tag]: { ...d[tag], [stufe]: b } };
      }),
    }));

  const rollen = (d: DienstDef): Rolle[] => (d.bereich === 'HW' ? ['HW'] : ['TL', 'MA', 'L']);
  const kurz: Record<Rolle, string> = { TL: 'TL', MA: 'MA', L: 'Lern.', HW: 'HW' };
  const pfade: [Pfad, string][] = [
    [['werktag', 'min'], 'Mo–Fr Minimum'],
    [['werktag', 'soll'], 'Mo–Fr Soll'],
    [['wochenende', 'min'], 'Sa/So Minimum'],
    [['wochenende', 'soll'], 'Sa/So Soll'],
  ];

  return (
    <>
      <p className="hinweis">
        Minimum: darunter wird ein Pikett-Einsatz gemeldet. Soll: gewünschte Besetzung inkl. Reserve. Die Standardwerte stammen aus dem
        Durchschnitt des Septemberplans.
      </p>
      <div className="tabelle-wrap">
        <table className="tabelle besetzung">
          <thead>
            <tr>
              <th>Dienst</th>
              <th>Kürzel</th>
              {pfade.map(([, t]) => <th key={t}>{t}</th>)}
            </tr>
          </thead>
          <tbody>
            {state.dienste.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>
                  <input
                    className="kurz"
                    value={d.code}
                    onChange={(e) => update((s) => ({ ...s, dienste: s.dienste.map((x) => (x.id === d.id ? { ...x, code: e.target.value } : x)) }))}
                    aria-label={`Kürzel ${d.name}`}
                  />
                </td>
                {pfade.map(([p, t]) => (
                  <td key={t}>
                    <span className="zahlen">
                      {rollen(d).map((r) => (
                        <label key={r}>
                          {kurz[r]}
                          <input
                            type="number"
                            min={0}
                            max={9}
                            value={d[p[0]][p[1]][r]}
                            onChange={(e) => setWert(d.id, p, r, Number(e.target.value))}
                          />
                        </label>
                      ))}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="leise" onClick={() => confirm('Besetzung auf Standardwerte zurücksetzen?') && update((s) => ({ ...s, dienste: STANDARD_DIENSTE }))}>
        Standardwerte wiederherstellen
      </button>
    </>
  );
}
