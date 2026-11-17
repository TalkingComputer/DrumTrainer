import { Hono } from "@hono/hono";
import { getAllRudiments } from "../services/rudimentService.ts";

const rudiments = new Hono();

// GET /api/rudiments → alle Rudimente (ohne Header)
rudiments.get("/", (c) => {
  const allRudiments = getAllRudiments();
  return c.json(allRudiments);
});

export default rudiments;