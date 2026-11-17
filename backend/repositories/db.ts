import type { Database } from "../types.ts";

const DATA_FOLDER = "./data";
const DB_FILE = "./data/db.json";

// Liest die komplette Datenbank aus der Datei
export async function readDb(): Promise<Database> {
  try {
    const text = await Deno.readTextFile(DB_FILE);
    const db = JSON.parse(text);
    return db;
  } catch (error) {
    // Beim allerersten Start existiert die Datei noch nicht.
    // Dann starten wir mit einer leeren Datenbank.
    if (error instanceof Deno.errors.NotFound) {
      const emptyDb = {
        players: [],
        sessions: [],
        friendships: [],
      };
      return emptyDb;
    }
    // Jeder andere Fehler wird weitergereicht
    throw error;
  }
}

// Schreibt die komplette Datenbank zurück in die Datei
export async function writeDb(db: Database): Promise<void> {
  // Ordner anlegen, falls er fehlt. Existiert er schon, passiert nichts.
  await Deno.mkdir(DATA_FOLDER, { recursive: true });

  // null, 2 sorgt für Einrückung, damit die Datei lesbar bleibt
  const text = JSON.stringify(db, null, 2);
  await Deno.writeTextFile(DB_FILE, text);
}