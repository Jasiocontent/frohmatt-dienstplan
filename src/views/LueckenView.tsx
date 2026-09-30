import type { AppState, Plan } from '../types';
import { WT, wochentag } from '../dates';
import { rolleName } from '../labels';

export default function LueckenView({ state, plan }: { state: AppState; plan: Plan }) {
  const dById = Object.fromEntries(state.dienste.map((d) => [d.id, d]));
  const tage = plan.tage.filter((d) => plan.luecken.some((l) => l.datum === d));

  if (!tage.length) return <p className="hinweis">Alle Dienste sind im Monat mindestens mit Soll besetzt.</p>;

  return (
    <div className="luecken">
      {tage.map((d) => (
        <section key={d} className="tag">
          <h3>{WT[wochentag(d)]} {Number(d.slice(8))}.{Number(d.slice(5, 7))}.</h3>
          <ul>
            {plan.luecken
              .filter((l) => l.datum === d)
              .sort((a) => (a.stufe === 'Pikett' ? -1 : 1))
              .map((l, i) => (
                <li key={i} className={l.stufe === 'Pikett' ? 'pikett' : 'reserve'}>
                  <span className="stufe">{l.stufe === 'Pikett' ? 'Pikett nötig' : 'Keine Reserve'}</span>
                  {dById[l.dienstId]?.name}: {l.fehlt} × {rolleName(l.rolle)}
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
