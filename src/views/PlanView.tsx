import { useState, type ReactNode } from 'react';
import type { AppState, Plan } from '../types';
import { WT, istWE, wochentag } from '../dates';
import { FUNKTION_NAME, FUNKTION_REIHENFOLGE } from '../labels';

interface Props {
  state: AppState;
  plan: Plan;
  update: (fn: (s: AppState) => AppState) => void;
}

export default function PlanView({ state, plan, update }: Props) {
  const [edit, setEdit] = useState<{ d: string; m: string } | null>(null);
  const dById = Object.fromEntries(state.dienste.map((d) => [d.id, d]));

  const setOverride = (d: string, mid: string, v: string) =>
    update((s) => {
      const o = { ...s.overrides, [d]: { ...(s.overrides[d] ?? {}) } };
      if (v) o[d][mid] = v;
      else delete o[d][mid];
      return { ...s, overrides: o };
    });

  const gruppen = FUNKTION_REIHENFOLGE.map((f) => ({
    f,
    leute: state.mitarbeiter.filter((m) => m.funktion === f).sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.leute.length);

  const pikettAm = (d: string) =>
    plan.luecken.filter((l) => l.datum === d && l.stufe === 'Pikett').reduce((s, l) => s + l.fehlt, 0);

  return (
    <>
      <p className="hinweis">Zelle anklicken, um einen Dienst fix zu setzen. Fixe Einträge sind unterstrichen und bleiben beim Neu verteilen erhalten.</p>
      <div className="raster-wrap">
        <table className="raster">
          <thead>
            <tr>
              <th className="name">Name</th>
              <th className="pz">%</th>
              {plan.tage.map((d) => (
                <th key={d} className={istWE(d) ? 'we' : ''}>
                  <span className="wt">{WT[wochentag(d)]}</span>
                  {Number(d.slice(8))}
                </th>
              ))}
              <th className="pz" title="Dienste im Monat: eingeteilt / Soll">Ist/Soll</th>
            </tr>
          </thead>
          <tbody>
            {gruppen.map((g) => (
              <FragmentRows key={g.f} titel={FUNKTION_NAME[g.f]} spalten={plan.tage.length + 3}>
                {g.leute.map((m) => {
                  const st = plan.stunden[m.id];
                  return (
                    <tr key={m.id}>
                      <th className="name" scope="row">{m.name}</th>
                      <td className="pz">{m.pensum}</td>
                      {plan.tage.map((d) => {
                        const did = plan.zuteilung[d]?.[m.id];
                        const abw = plan.abwesend[d]?.[m.id];
                        const fix = !!state.overrides[d]?.[m.id];
                        const dienst = did ? dById[did] : null;
                        const cls = [
                          'zelle',
                          istWE(d) ? 'we' : '',
                          dienst ? `g-${dienst.gruppe} a-${dienst.art}` : '',
                          abw ? 'abw' : '',
                          fix ? 'fix' : '',
                        ].join(' ');
                        const offen = edit?.d === d && edit.m === m.id;
                        return (
                          <td key={d} className={cls}>
                            {offen ? (
                              <select
                                autoFocus
                                value={state.overrides[d]?.[m.id] ?? ''}
                                onBlur={() => setEdit(null)}
                                onChange={(e) => {
                                  setOverride(d, m.id, e.target.value);
                                  setEdit(null);
                                }}
                              >
                                <option value="">Auto</option>
                                <option value="FREI">Frei</option>
                                {state.dienste.map((x) => (
                                  <option key={x.id} value={x.id}>{x.code} {x.name}</option>
                                ))}
                              </select>
                            ) : (
                              <button className="zbtn" onClick={() => setEdit({ d, m: m.id })} aria-label={`${m.name} ${d}`}>
                                {dienst?.code ?? abw ?? ''}
                              </button>
                            )}
                          </td>
                        );
                      })}
                      <td className={st && st.ist < st.soll ? 'pz knapp' : 'pz'}>{st ? `${st.ist}/${st.soll}` : ''}</td>
                    </tr>
                  );
                })}
              </FragmentRows>
            ))}
            <tr className="pikett">
              <th className="name" scope="row">Pikett nötig</th>
              <td />
              {plan.tage.map((d) => {
                const n = pikettAm(d);
                return <td key={d} className={istWE(d) ? 'we' : ''}>{n || ''}</td>;
              })}
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      <div className="legende">
        {state.dienste.map((d) => (
          <span key={d.id} className={`chip g-${d.gruppe} a-${d.art}`}>
            <b>{d.code}</b> {d.name}
          </span>
        ))}
        <span className="chip abw">fe Ferien, .w Frei-Wunsch, sl Schule, kr Krank, wb Weiterbildung</span>
      </div>
    </>
  );
}

function FragmentRows({ titel, spalten, children }: { titel: string; spalten: number; children: ReactNode }) {
  return (
    <>
      <tr className="gruppe">
        <th colSpan={spalten}>{titel}</th>
      </tr>
      {children}
    </>
  );
}
