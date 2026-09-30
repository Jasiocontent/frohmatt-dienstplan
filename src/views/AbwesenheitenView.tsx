import { useState } from 'react';
import type { AbwTyp, AppState } from '../types';
import { neueId } from '../seed';

interface Props {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  monat: string;
}

const TYPEN: AbwTyp[] = ['Ferien', 'Frei', 'Krank', 'Weiterbildung'];
const fmt = (d: string) => `${d.slice(8)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;

export default function AbwesenheitenView({ state, update, monat }: Props) {
  const [mid, setMid] = useState(state.mitarbeiter[0]?.id ?? '');
  const [typ, setTyp] = useState<AbwTyp>('Ferien');
  const [von, setVon] = useState(`${monat}-01`);
  const [bis, setBis] = useState(`${monat}-01`);
  const name = (id: string) => state.mitarbeiter.find((m) => m.id === id)?.name ?? '?';

  const hinzufuegen = () => {
    if (!mid || !von) return;
    const ende = bis && bis >= von ? bis : von;
    update((s) => ({ ...s, abwesenheiten: [...s.abwesenheiten, { id: neueId(), mitarbeiterId: mid, typ, von, bis: ende }] }));
  };

  const liste = [...state.abwesenheiten].sort((a, b) => a.von.localeCompare(b.von));

  return (
    <>
      <div className="formular">
        <label>
          Person
          <select value={mid} onChange={(e) => setMid(e.target.value)}>
            {[...state.mitarbeiter].sort((a, b) => a.name.localeCompare(b.name)).map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </label>
        <label>
          Art
          <select value={typ} onChange={(e) => setTyp(e.target.value as AbwTyp)}>
            {TYPEN.map((t) => (
              <option key={t} value={t}>{t === 'Frei' ? 'Frei-Wunsch' : t}</option>
            ))}
          </select>
        </label>
        <label>
          Von
          <input type="date" value={von} onChange={(e) => { setVon(e.target.value); if (!bis || bis < e.target.value) setBis(e.target.value); }} />
        </label>
        <label>
          Bis
          <input type="date" value={bis} min={von} onChange={(e) => setBis(e.target.value)} />
        </label>
        <button className="primaer" onClick={hinzufuegen}>Eintragen</button>
      </div>

      {liste.length === 0 ? (
        <p className="hinweis">Noch keine Abwesenheiten. Ferien und freie Tage oben eintragen, der Plan passt sich sofort an.</p>
      ) : (
        <div className="tabelle-wrap">
          <table className="tabelle">
            <thead>
              <tr><th>Person</th><th>Art</th><th>Von</th><th>Bis</th><th /></tr>
            </thead>
            <tbody>
              {liste.map((a) => (
                <tr key={a.id}>
                  <td>{name(a.mitarbeiterId)}</td>
                  <td>{a.typ === 'Frei' ? 'Frei-Wunsch' : a.typ}</td>
                  <td>{fmt(a.von)}</td>
                  <td>{fmt(a.bis)}</td>
                  <td>
                    <button className="leise" onClick={() => update((s) => ({ ...s, abwesenheiten: s.abwesenheiten.filter((x) => x.id !== a.id) }))}>
                      Entfernen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
