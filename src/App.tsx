import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppState } from './types';
import { demoState } from './seed';
import { generiere } from './scheduler';
import { exportieren, importieren, laden, speichern } from './storage';
import { exportPdf } from './pdf';
import { monatsName } from './dates';
import PlanView from './views/PlanView';
import MitarbeiterView from './views/MitarbeiterView';
import AbwesenheitenView from './views/AbwesenheitenView';
import BesetzungView from './views/BesetzungView';
import LueckenView from './views/LueckenView';

const TABS = ['Plan', 'Mitarbeitende', 'Abwesenheiten', 'Besetzung', 'Unterbesetzung'] as const;
type Tab = (typeof TABS)[number];

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [monat, setMonat] = useState('2026-11');
  const [tab, setTab] = useState<Tab>('Plan');
  const [status, setStatus] = useState('Lädt …');
  const timer = useRef<number>();

  useEffect(() => {
    laden()
      .then((s) => {
        setState(s ?? demoState(monat));
        setStatus('Im Browser gespeichert');
      })
      .catch((e) => {
        setState(demoState(monat));
        setStatus(`Laden fehlgeschlagen: ${e.message}. Beispieldaten geladen.`);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (fn: (s: AppState) => AppState) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      window.clearTimeout(timer.current);
      setStatus('Speichert …');
      timer.current = window.setTimeout(() => {
        speichern(next)
          .then(() => setStatus('Im Browser gespeichert'))
          .catch((e) => setStatus(`Speichern fehlgeschlagen: ${e.message}`));
      }, 700);
      return next;
    });
  };

  const plan = useMemo(() => (state ? generiere(state, monat) : null), [state, monat]);

  if (!state || !plan) return <p className="laden">Dienstplan wird geladen …</p>;

  const pikett = plan.luecken.filter((l) => l.stufe === 'Pikett').reduce((s, l) => s + l.fehlt, 0);
  const pikettTage = new Set(plan.luecken.filter((l) => l.stufe === 'Pikett').map((l) => l.datum)).size;

  return (
    <div className="app">
      <header className="kopf">
        <div className="titel">
          <h1>Dienstplan {monatsName(monat)}</h1>
          <p className="sub">Alterszentrum Frohmatt, Haus Berg, Wohngruppen Bachtel und Etzel</p>
        </div>
        <div className="aktionen">
          <label className="monat">
            Monat
            <input type="month" value={monat} onChange={(e) => e.target.value && setMonat(e.target.value)} />
          </label>
          <button onClick={() => update((s) => ({ ...s, seed: s.seed + 1 }))}>Neu verteilen</button>
          <button className="primaer" onClick={() => exportPdf(state, plan)}>PDF herunterladen</button>
        </div>
      </header>

      <div className={pikett ? 'meldung warn' : 'meldung ok'}>
        {pikett
          ? `${pikett} Pikett-Einsätze an ${pikettTage} Tagen nötig. Details unter Unterbesetzung.`
          : 'Alle Dienste erreichen die Mindestbesetzung.'}
      </div>

      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'aktiv' : ''} onClick={() => setTab(t)}>
            {t}
            {t === 'Unterbesetzung' && pikett > 0 && <span className="zahl">{pikett}</span>}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'Plan' && <PlanView state={state} plan={plan} update={update} />}
        {tab === 'Mitarbeitende' && <MitarbeiterView state={state} update={update} />}
        {tab === 'Abwesenheiten' && <AbwesenheitenView state={state} update={update} monat={monat} />}
        {tab === 'Besetzung' && <BesetzungView state={state} update={update} />}
        {tab === 'Unterbesetzung' && <LueckenView state={state} plan={plan} />}
      </main>

      <footer className="fuss">
        <span>{status}. Die Daten bleiben nur auf diesem Gerät.</span>
        <span className="fuss-aktionen">
          <button className="leise" onClick={() => exportieren(state)}>Daten sichern</button>
          <label className="leise datei">
            Sicherung laden
            <input
              type="file"
              accept="application/json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importieren(f).then((s) => update(() => s)).catch((err) => alert(err.message));
                e.target.value = '';
              }}
            />
          </label>
          <button
            className="leise"
            onClick={() => {
              if (confirm('Alle Änderungen verwerfen und Beispieldaten neu laden?')) update(() => demoState(monat));
            }}
          >
            Beispieldaten zurücksetzen
          </button>
        </span>
      </footer>
    </div>
  );
}
