import { HTTPException } from "@hono/hono/http-exception";

// Liest den JSON-Body. Bei kaputtem JSON Abbruch mit 400.
export async function readBody(request: Request): Promise<any> {
  try {
    const body = await request.json();
    return body;
  } catch {
    throw new HTTPException(400, { message: "Ungültiges JSON" });
  }
}