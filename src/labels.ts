import type { Funktion, Rolle } from './types';

export const FUNKTION_REIHENFOLGE: Funktion[] = ['TL', 'FaGe', 'PH', 'Lernende', 'HW'];
export const FUNKTION_NAME: Record<Funktion, string> = {
  TL: 'Teamleitung', FaGe: 'FaGe', PH: 'Pflegehelfer/in', Lernende: 'Lernende', HW: 'Hauswirtschaft',
};
export const rolleName = (r: Rolle) => ({ TL: 'Teamleitung', MA: 'Mitarbeitende', L: 'Lernende', HW: 'Hauswirtschaft' })[r];
