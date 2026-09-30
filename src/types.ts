export type Funktion = 'TL' | 'FaGe' | 'PH' | 'Lernende' | 'HW';
export type Gruppe = 'Bachtel' | 'Etzel';
export type Rolle = 'TL' | 'MA' | 'L' | 'HW';
export type Art = 'Früh' | 'Geteilt' | 'Spät';
export type AbwTyp = 'Ferien' | 'Frei' | 'Krank' | 'Weiterbildung';

export interface Mitarbeiter {
  id: string;
  name: string;
  funktion: Funktion;
  pensum: number; // 60–100
  stammgruppe: Gruppe;
  wochenende: boolean;
  schultage: number[]; // 0 = Mo … 4 = Fr (nur Lernende)
}

export interface Abwesenheit {
  id: string;
  mitarbeiterId: string;
  typ: AbwTyp;
  von: string; // YYYY-MM-DD
  bis: string;
}

export type Besetzung = Record<Rolle, number>;

export interface DienstDef {
  id: string;
  code: string;
  name: string;
  gruppe: Gruppe | 'Haus';
  art: Art;
  bereich: 'Pflege' | 'HW';
  werktag: { min: Besetzung; soll: Besetzung };
  wochenende: { min: Besetzung; soll: Besetzung };
}

export interface AppState {
  version: 1;
  seed: number;
  mitarbeiter: Mitarbeiter[];
  abwesenheiten: Abwesenheit[];
  dienste: DienstDef[];
  /** manuelle Einträge: datum -> mitarbeiterId -> dienstId | 'FREI' */
  overrides: Record<string, Record<string, string>>;
}

export interface Luecke {
  datum: string;
  dienstId: string;
  rolle: Rolle;
  fehlt: number;
  stufe: 'Pikett' | 'Reserve';
}

export interface Plan {
  monat: string; // YYYY-MM
  tage: string[];
  zuteilung: Record<string, Record<string, string>>; // datum -> mid -> dienstId
  abwesend: Record<string, Record<string, string>>; // datum -> mid -> Kürzel
  luecken: Luecke[];
  stunden: Record<string, { soll: number; ist: number }>; // Dienste im Monat
}
