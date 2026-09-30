# Dienstplan Frohmatt (Prototyp)

Reine Web-App ohne Datenbank und ohne Server. Alle Daten bleiben im Browser des jeweiligen Geräts
(localStorage). Beim ersten Öffnen werden Beispieldaten für November 2026 geladen.

## Funktionen
- Mitarbeitende mit Funktion, Pensum, Stammgruppe, Wochenende ja/nein, Schultage
- Abwesenheiten: Ferien, Frei-Wunsch, Krank, Weiterbildung
- Plan wird automatisch berechnet (Pensum pro Woche, Wochenenden als Block, kein Früh nach Spät, max. 6 Tage am Stück)
- Mindest- und Soll-Besetzung pro Dienst, Standardwerte aus dem Septemberplan
- Unterbesetzung mit "Pikett nötig" / "Keine Reserve"
- Zellen manuell fixieren, PDF-Export
- Daten sichern / Sicherung laden (JSON-Datei, zum Weitergeben wie eine Excel-Datei)

Namen stammen aus dem Septemberplan; Funktion, Pensum, Ferien usw. sind Beispielwerte.

## Lokal starten
```bash
npm install
npm run dev
```

## Online stellen (GitHub Pages, kostenlos)
1. Neues Repo auf GitHub erstellen und pushen:
   ```bash
   git init && git add . && git commit -m "Dienstplan Prototyp"
   git branch -M main
   git remote add origin https://github.com/<user>/frohmatt-dienstplan.git
   git push -u origin main
   ```
2. Im Repo: Settings > Pages > Source: **GitHub Actions**
3. Der Workflow baut automatisch. Link: `https://<user>.github.io/frohmatt-dienstplan/`

Tipp: Repo auf "Private" nur mit GitHub Pro möglich; sonst ist der Code öffentlich (die Seite hat `noindex`).
