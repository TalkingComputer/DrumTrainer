import { Hono } from "@hono/hono";
import { HTTPException } from "@hono/hono/http-exception";
import type { AppEnv, LeaderboardQuery, Period } from "../types.ts";
import { getLeaderboard } from "../services/leaderboardService.ts";

const leaderboard = new Hono<AppEnv>();

// Prüft die Query-Parameter und baut daraus ein sauberes LeaderboardQuery
function checkLeaderboardQuery(
  metricParam: string | undefined,
  periodParam: string | undefined,
  rudimentParam: string | undefined,
): LeaderboardQuery {
  // metric: Pflicht, nur zwei Werte erlaubt
  if (metricParam !== "bpm" && metricParam !== "duration") {
    throw new HTTPException(400, { message: "Parameter 'metric' muss 'bpm' oder 'duration' sein" });
  }

  // period: optional, Standard ist "all"
  let period: Period = "all";
  if (periodParam !== undefined) {
    if (periodParam !== "week" && periodParam !== "month" && periodParam !== "all") {
      throw new HTTPException(400, { message: "Parameter 'period' muss 'week', 'month' oder 'all' sein" });
    }
    period = periodParam;
  }

  // rudimentId: ein leerer Text zählt wie "nicht angegeben"
  let rudimentId: string | undefined = undefined;
  if (rudimentParam !== undefined && rudimentParam.trim() !== "") {
    rudimentId = rudimentParam.trim();
  }

  // Bei bpm ist rudimentId Pflicht
  if (metricParam === "bpm" && rudimentId === undefined) {
    throw new HTTPException(400, { message: "Für metric=bpm ist der Parameter 'rudimentId' nötig" });
  }

  return {
    metric: metricParam,
    period: period,
    rudimentId: rudimentId,
  };
}

// GET /api/players/me/leaderboard?metric=…&period=…&rudimentId=…
leaderboard.get("/", async (c) => {
  const player = c.get("player");

  const query = checkLeaderboardQuery(
    c.req.query("metric"),
    c.req.query("period"),
    c.req.query("rudimentId"),
  );

  const entries = await getLeaderboard(player, query);
  return c.json(entries);
});

export default leaderboard;