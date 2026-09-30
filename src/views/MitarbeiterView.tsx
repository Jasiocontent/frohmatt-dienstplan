import type { AppState, Funktion, Gruppe, Mitarbeiter } from '../types';
import { FUNKTION_NAME, FUNKTION_REIHENFOLGE } from '../labels';
import { neueId } from '../seed';
import { WT } from '../dates';

interface Props {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
}

export default function MitarbeiterView({ state, update }: Props) {
  const setM = (id: string, patch: Partial<Mitarbeiter>) =>
    update((s) => ({ ...s, mitarbeiter: s.mitarbeiter.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));

  const neu = (funktion: Funktion, name: string) =>
    update((s) => ({
      ...s,
      mitarbeiter: [
        ...s.mitarbeiter,
        { id: neueId(), name, funktion, pensum: 100, stammgruppe: 'Etzel', wochenende: true, schultage: funktion === 'Lernende' ? [0] : [] },
      ],
    }));

  const entfernen = (m: Mitarbeiter) => {
    if (!confirm(`${m.name} entfernen?`)) return;
    update((s) => ({
      ...s,
      mitarbeiter: s.mitarbeiter.filter((x) => x.id !== m.id),
      abwesenheiten: s.abwesenheiten.filter((a) => a.mitarbeiterId !== m.id),
    }));
  };

  const liste = [...state.mitarbeiter].sort(
    (a, b) => FUNKTION_REIHENFOLGE.indexOf(a.funktion) - FUNKTION_REIHENFOLGE.indexOf(b.funktion) || a.name.localeCompare(b.name),
  );

  return (
    <>
      <div className="leiste">
        <button onClick={() => neu('FaGe', 'Neue Person')}>Person hinzufügen</button>
        <button onClick={() => neu('FaGe', `Temporär ${state.mitarbeiter.filter((m) => m.name.startsWith('Temporär')).length + 1}`)}>
          Temporäre Person hinzufügen
        </button>
        <span className="hinweis">{state.mitarbeiter.length} Personen. Änderungen werden sofort gespeichert und der Plan neu berechnet.</span>
      </div>
      <div className="tabelle-wrap">
        <table className="tabelle">
          <thead>
            <tr>
              <th>Name</th>
              <th>Funktion</th>
              <th>Pensum</th>
              <th>Stammgruppe</th>
              <th>Wochenende</th>
              <th>Schultage</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {liste.map((m) => (
              <tr key={m.id}>
                <td>
                  <input value={m.name} onChange={(e) => setM(m.id, { name: e.target.value })} aria-label="Name" />
                </td>
                <td>
                  <select value={m.funktion} onChange={(e) => setM(m.id, { funktion: e.target.value as Funktion })}>
                    {FUNKTION_REIHENFOLGE.map((f) => (
                      <option key={f} value={f}>{FUNKTION_NAME[f]}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select value={m.pensum} onChange={(e) => setM(m.id, { pensum: Number(e.target.value) })}>
                    {[20, 30, 40, 50, 60, 70, 80, 90, 100].map((p) => (
                      <option key={p} value={p}>{p} %</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select value={m.stammgruppe} onChange={(e) => setM(m.id, { stammgruppe: e.target.value as Gruppe })}>
                    <option>Bachtel</option>
                    <option>Etzel</option>
                  </select>
                </td>
                <td>
                  <input type="checkbox" checked={m.wochenende} onChange={(e) => setM(m.id, { wochenende: e.target.checked })} aria-label="Arbeitet am Wochenende" />
                </td>
                <td>
                  {m.funktion === 'Lernende' ? (
                    <span className="tage">
                      {WT.slice(0, 5).map((t, i) => (
                        <label key={t}>
                          <input
                            type="checkbox"
                            checked={m.schultage.includes(i)}
                            onChange={(e) =>
                              setM(m.id, { schultage: e.target.checked ? [...m.schultage, i] : m.schultage.filter((x) => x !== i) })
                            }
                          />
                          {t}
                        </label>
                      ))}
                    </span>
                  ) : (
                    <span className="leer">–</span>
                  )}
                </td>
                <td>
                  <button className="leise" onClick={() => entfernen(m)}>Entfernen</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
