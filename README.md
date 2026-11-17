# DrumTrainer

Metronom für Schlagzeuger mit freundschaftlichem Leaderboard. Spieler üben Rudimente (Single Stroke Roll, Paradiddle, Flam Tap usw.), die App zeichnet Rudiment, Tempo und Übezeit auf und speichert die Session im Backend. Im Leaderboard vergleichen sich Freunde nach bestem Tempo oder Übezeit.

Prüfungsprojekt im Modul T4 "Entwicklung von Webanwendungen mit entkoppelter Architektur", DHBW Onlinemedien.

## Architektur in einem Satz

Ein Vue-Frontend spricht ausschließlich über eine REST-API (HTTP und JSON) mit einem Deno/Hono-Backend. Das Backend speichert alle Daten in einer JSON-Datei.

```
Browser (Vue 3, TypeScript, Vite)  ──HTTP / JSON──►  Backend (Deno, Hono)  ──►  backend/data/db.json
```

## Voraussetzungen

| Werkzeug | Version |
|---|---|
| Deno | 2.x |
| Node.js | 22.18 oder neuer (für Vite) |
| npm | wird mit Node.js installiert |

## Starten

Backend und Frontend laufen als zwei getrennte Prozesse, also in zwei Terminals.

**1. Backend** (Port 8000)

```bash
cd backend
deno task dev
```

**2. Frontend** (Port 5173)

```bash
cd frontend
npm install
npm run dev
```

Danach `http://localhost:5173` öffnen. Beim ersten Start fragt die App nach einem Namen.

Der Vite-Dev-Server leitet alle Anfragen an `/api` an das Backend auf Port 8000 weiter (Proxy in `frontend/vite.config.ts`). Das Frontend selbst kennt keine Backend-Adresse.

## Testen

```bash
cd backend
deno task test
```

Prüft die Startliste der Rudimente. Alle Endpunkte lassen sich zusätzlich mit `backend/requests.http` testen (VS Code-Erweiterung "REST Client"), inklusive der Fehlerfälle 400, 401, 404 und 409.

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
│   ├── data/db.json            Spieler, Sessions, Freundschaften (entsteht beim ersten Speichern)
│   ├── tests/                  deno test
│   └── requests.http           Testanfragen für alle Endpunkte
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
