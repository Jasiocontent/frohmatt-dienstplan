import type { AppState } from './types';

// Alles bleibt im Browser (localStorage), keine Datenbank, kein Server.
const LS = 'frohmatt-dienstplan-v2';

export async function laden(): Promise<AppState | null> {
  try {
    const raw = localStorage.getItem(LS);
    return raw ? (JSON.parse(raw) as AppState) : null;
  } catch {
    return null;
  }
}

export async function speichern(state: AppState): Promise<void> {
  localStorage.setItem(LS, JSON.stringify(state));
}

/** Sicherung als Datei herunterladen (wie eine Excel-Datei weitergeben) */
export function exportieren(state: AppState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `dienstplan-daten-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function importieren(datei: File): Promise<AppState> {
  return datei.text().then((t) => {
    const s = JSON.parse(t) as AppState;
    if (!Array.isArray(s.mitarbeiter) || !Array.isArray(s.dienste)) throw new Error('Datei ist keine Dienstplan-Sicherung');
    return s;
  });
}
