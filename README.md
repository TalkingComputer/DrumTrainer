# DrumTrainer

Metronom für Schlagzeuger mit freundschaftlichem Leaderboard. Spieler üben Rudimente (Single Stroke Roll, Paradiddle, Flam Tap usw.), die App zeichnet Rudiment, Tempo und Übezeit auf und speichert die Session im Backend. Im Leaderboard vergleichen sich Freunde nach bestem Tempo oder Übezeit.

Prüfungsprojekt im Modul T4 "Entwicklung von Webanwendungen mit entkoppelter Architektur", DHBW Onlinemedien.

## Architektur in einem Satz

Ein Vue-Frontend spricht ausschließlich über eine REST-API (HTTP und JSON) mit einem Deno/Hono-Backend. Das Backend speichert alle Daten in einer JSON-Datei.

```
Browser (Vue 3, TypeScript, Vite)  ──HTTP / JSON──►  Backend (Deno, Hono)  ──►  backend/data/db.json
```

## Lokales Deployment

Backend und Frontend laufen als zwei getrennte Prozesse auf dem eigenen Rechner, also in zwei Terminals.

### 1. Voraussetzungen

| Werkzeug | Version | Prüfen mit |
|---|---|---|
| Deno | 2.x | `deno --version` |
| Node.js | 22.18 oder neuer (für Vite) | `node --version` |
| npm | wird mit Node.js installiert | `npm --version` |
| Browser | aktueller Chrome, Firefox oder Edge (Web Audio API) | |

Beim ersten Start ist eine Internetverbindung nötig: Deno lädt Hono aus der Registry JSR, npm lädt die Frontend-Pakete.

### 2. Repository holen

```bash
git clone <Repository-URL> DrumTrainer
cd DrumTrainer
```

### 3. Backend starten (Port 8000)

```bash
cd backend
deno task dev
```

Der Task startet `main.ts` mit den Rechten `--allow-net` (Server), `--allow-read` und `--allow-write` (JSON-Dateien) und startet bei Code-Änderungen automatisch neu. Beim Start prüft das Backend die Rudiment-Liste in `seed/rudiments.json`. Ist sie fehlerhaft, bricht der Start mit einer Meldung ab.

Kontrolle: `http://localhost:8000/api/health` liefert `{ "status": "ok", "timestamp": "…" }`.

### 4. Frontend starten (Port 5173)

In einem zweiten Terminal, vom Projektordner aus:

```bash
cd frontend
npm install
npm run dev
```

`npm install` ist nur beim ersten Mal und nach Änderungen an `package.json` nötig.

Danach `http://localhost:5173` öffnen. Ohne gespeicherten Spieler fragt die App zuerst nach einem Namen.

Der Vite-Dev-Server leitet alle Anfragen an `/api` an das Backend auf Port 8000 weiter (Proxy in `frontend/vite.config.ts`). Das Frontend selbst kennt keine Backend-Adresse. Das Backend erlaubt per CORS nur den Ursprung `http://localhost:5173`.

### 5. Beenden

In beiden Terminals `Strg + C`.

### Daten

Alle Spieler, Sessions und Freundschaften liegen in `backend/data/db.json`. Das Repository enthält dort Demo-Daten (3 Spieler, 9 Sessions, 1 Freundschaft). Für einen leeren Start die Datei löschen. Das Backend legt sie beim ersten Speichern neu an.

Jeder Browser merkt sich seinen Spieler im localStorage. Für einen zweiten Spieler reicht ein anderer Browser oder ein privates Fenster.

### Probleme beim Start

| Problem | Lösung |
|---|---|
| Frontend zeigt "Server not reachable" | Backend läuft nicht oder nicht auf Port 8000. Terminal mit `deno task dev` prüfen |
| Port 8000 oder 5173 ist belegt | Anderen Prozess beenden. Vite weicht sonst auf einen anderen Port aus, den CORS nicht erlaubt |
| Backend startet nicht, Meldung zu `rudiments.json` | Doppelte id, fehlender Name oder id mit unerlaubten Zeichen in `backend/seed/rudiments.json` korrigieren |
| App landet immer wieder beim Namen | Die gespeicherte Spieler-id fehlt in `db.json` (z. B. nach dem Löschen der Datei). Einfach neu anlegen |
| Kein Ton | Erst nach einem Klick auf Play erlaubt der Browser Ton. Lautstärke und Tab-Stummschaltung prüfen |

## Testen

```bash
cd backend
deno task test
```

Prüft die Startliste der Rudimente.

Alle Endpunkte lassen sich mit der VS Code-Erweiterung "REST Client" testen:

- `backend/requests.http`: alle Endpunkte inklusive der Fehlerfälle 400, 401, 404 und 409
- `backend/errorRequests.http`: ausgewählte Fehlerfälle für die Präsentation (leerer Name, Übezeit länger als Session)

Die Spieler-id oben in den Dateien (`@playerId`) muss zu einem Spieler in `db.json` passen.

Typprüfung und Linting im Frontend:

```bash
cd frontend
npm run type-check
npm run lint
```

## Projektstruktur

```
DrumTrainer/
├── backend/
│   ├── main.ts                 Einstieg: CORS, Routen, Fehlerformat, Start
│   ├── types.ts                Datenmodell
│   ├── routes/                 HTTP: Eingaben prüfen, Statuscodes
│   ├── middleware/             requirePlayer: prüft den Header X-Player-Id
│   ├── services/               Geschäftslogik
│   ├── repositories/           Lesen und Schreiben der JSON-Dateien
│   ├── seed/rudiments.json     feste Startliste der Rudimente
│   ├── data/db.json            Spieler, Sessions, Freundschaften (mit Demo-Daten)
│   ├── tests/                  deno test
│   ├── requests.http           Testanfragen für alle Endpunkte
│   └── errorRequests.http      Fehlerfälle für die Präsentation
└── frontend/
    ├── public/rudiments/       Notenbilder als SVG, Dateiname = id des Rudiments
    └── src/
        ├── api/                einziger Ort mit fetch
        ├── composables/        gemeinsamer Zustand und Logik (Metronom, Recorder, …)
        ├── audio/              Klick-Sound und Taktgeber im Web Worker
        ├── components/         wiederverwendbare Bausteine
        ├── views/              Übe-Bildschirm und Dialoge
        ├── router/             Routen und Navigation Guard
        └── utils/              Formatierung und Umrechnung
```

## API im Überblick

Alle Endpunkte liegen unter `/api`. Endpunkte unter `/api/players/me` erwarten den Header `X-Player-Id`.

| Methode | Pfad | Zweck |
|---|---|---|
| GET | `/api/health` | Test-Route |
| POST | `/api/players` | Spieler anlegen |
| GET / PATCH | `/api/players/me` | eigenes Profil lesen / Namen ändern |
| GET | `/api/rudiments` | alle Rudimente |
| GET / POST | `/api/players/me/sessions` | eigene Sessions lesen / anlegen |
| GET / PATCH / DELETE | `/api/players/me/sessions/{sessionId}` | eine Session lesen / ändern / löschen |
| GET / POST | `/api/players/me/friends` | Freundesliste / Freund per Code hinzufügen |
| DELETE | `/api/players/me/friends/{friendCode}` | Freund entfernen |
| GET | `/api/players/me/leaderboard?metric=…&period=…&rudimentId=…` | Rangliste mit Freunden |

Fehler kommen immer im Format `{ "error": "…" }`. Die vollständige API-Dokumentation liegt in der Projektdokumentation der Abgabe.

## Neues Rudiment hinzufügen

Die Notenbilder entstehen im Rudiment Studio, einem eigenständigen HTML-Werkzeug außerhalb dieses Repositorys.

1. Rudiment im Studio bauen, SVG-Farbe "White (DrumTrainer app)", "Download SVG"
2. Datei `<id>.svg` nach `frontend/public/rudiments/` legen
3. "Copy JSON entry" und den Eintrag `{ "id": …, "name": … }` in `backend/seed/rudiments.json` einfügen
4. Backend neu starten

Das Backend prüft die Liste beim Start. Bei doppelten oder ungültigen ids startet es nicht und nennt den Fehler.

## Hinweise

- **Keine Anmeldung:** Der Spieler wird über eine geheime id im localStorage erkannt. Löscht man die Browserdaten, ist der Spieler auf diesem Gerät weg. Begründung und Alternativen stehen in den Architekturentscheidungen (ADR-001).
- **KI-Einsatz:** Planung, Code und Gestaltung sind mit Unterstützung von Claude (Anthropic) entstanden. Details stehen im Abschnitt "KI-Nutzung" der Projektdokumentation.
