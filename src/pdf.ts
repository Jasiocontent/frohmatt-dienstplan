import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AppState, Plan } from './types';
import { WT, istWE, monatsName, wochentag } from './dates';
import { FUNKTION_REIHENFOLGE, rolleName } from './labels';

export function exportPdf(state: AppState, plan: Plan) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const dById = Object.fromEntries(state.dienste.map((d) => [d.id, d]));
  const titel = `Dienstplan ${monatsName(plan.monat)}`;

  doc.setFontSize(14);
  doc.text(`Alterszentrum Frohmatt – ${titel}`, 10, 12);
  doc.setFontSize(8);
  doc.text(`Vorschlag, erstellt am ${new Date().toLocaleDateString('de-CH')}`, 10, 17);

  const ma = [...state.mitarbeiter].sort(
    (a, b) => FUNKTION_REIHENFOLGE.indexOf(a.funktion) - FUNKTION_REIHENFOLGE.indexOf(b.funktion) || a.name.localeCompare(b.name),
  );
  const head = [['Name', 'Fkt.', '%', ...plan.tage.map((d) => `${WT[wochentag(d)]}\n${Number(d.slice(8))}`), 'Ist/Soll']];
  const body = ma.map((m) => [
    m.name,
    m.funktion,
    String(m.pensum),
    ...plan.tage.map((d) => {
      const did = plan.zuteilung[d]?.[m.id];
      return did ? dById[did]?.code ?? did : plan.abwesend[d]?.[m.id] ?? '';
    }),
    `${plan.stunden[m.id]?.ist ?? 0}/${plan.stunden[m.id]?.soll ?? 0}`,
  ]);
  const lueckenZeile = [
    'Pikett nötig', '', '',
    ...plan.tage.map((d) => {
      const n = plan.luecken.filter((l) => l.datum === d && l.stufe === 'Pikett').reduce((s, l) => s + l.fehlt, 0);
      return n ? String(n) : '';
    }),
    '',
  ];

  autoTable(doc, {
    head,
    body: [...body, lueckenZeile],
    startY: 21,
    theme: 'grid',
    styles: { fontSize: 5.6, cellPadding: 0.6, halign: 'center', lineColor: [200, 205, 200], lineWidth: 0.1 },
    headStyles: { fillColor: [30, 42, 40], fontSize: 5.4 },
    columnStyles: { 0: { halign: 'left', cellWidth: 30 }, 1: { cellWidth: 9 }, 2: { cellWidth: 6 } },
    didParseCell: (h) => {
      const col = h.column.index - 3;
      if (h.section === 'body' && col >= 0 && col < plan.tage.length) {
        if (istWE(plan.tage[col])) h.cell.styles.fillColor = [236, 240, 234];
        const v = String(h.cell.raw ?? '');
        if (v.startsWith('b') || v === 'FB') h.cell.styles.textColor = [31, 110, 105];
        if (v.startsWith('e') || v === 'FE') h.cell.styles.textColor = [110, 60, 130];
        if (['fe', '.w', 'sl', 'kr', 'wb', '..'].includes(v)) h.cell.styles.textColor = [140, 140, 140];
      }
      if (h.section === 'body' && h.row.index === body.length) {
        h.cell.styles.textColor = [176, 42, 30];
        h.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // Seite 2: Unterbesetzung
  doc.addPage();
  doc.setFontSize(12);
  doc.text(`Unterbesetzung ${monatsName(plan.monat)}`, 10, 12);
  const rows = plan.luecken
    .slice()
    .sort((a, b) => a.datum.localeCompare(b.datum) || (a.stufe === 'Pikett' ? -1 : 1))
    .map((l) => [
      `${WT[wochentag(l.datum)]} ${l.datum.slice(8)}.${l.datum.slice(5, 7)}.`,
      dById[l.dienstId]?.name ?? l.dienstId,
      rolleName(l.rolle),
      String(l.fehlt),
      l.stufe === 'Pikett' ? 'Pikett / Temporär nötig' : 'Keine Reserve',
    ]);
  autoTable(doc, {
    head: [['Datum', 'Dienst', 'Funktion', 'Fehlt', 'Massnahme']],
    body: rows.length ? rows : [['–', 'Alle Dienste sind besetzt', '', '', '']],
    startY: 17,
    theme: 'striped',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 42, 40] },
  });

  const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFontSize(8);
  doc.text(
    'Legende: ' + state.dienste.map((d) => `${d.code} = ${d.name}`).join(', ') +
      '. fe = Ferien, .w = Frei-Wunsch, sl = Schule, kr = Krank, wb = Weiterbildung, .. = frei (manuell)',
    10, y, { maxWidth: 275 },
  );

  doc.save(`Dienstplan_${plan.monat}.pdf`);
}
