/**
 * /api/live-scores
 *
 * Data source: openfootball/worldcup.json (GitHub raw)
 * ✅ Completely free — no API key, no rate limits, no account needed
 * ✅ All 104 WC 2026 matches, scores updated by open-source community
 * ✅ Single fetch cached in-memory → near-zero latency on repeat calls
 *
 * Live detection: if match kickoff has started and <120 min have passed,
 * we show a LIVE badge. Scores appear once openfootball updates the file
 * (usually within a few minutes of full time).
 *
 * Other leagues: api-football via RapidAPI (unchanged, today's fixtures only)
 */

const WC_JSON_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

const RAPID_KEY  = process.env.RAPIDAPI_KEY;
const RAPID_HOST = "api-football-v1.p.rapidapi.com";

// ─── In-memory cache ──────────────────────────────────────────────────────────
const cache = new Map();
const TTL_ACTIVE   = 60_000;   // 1 min when matches might be live
const TTL_IDLE     = 300_000;  // 5 min when no live window open

const TEAM_FLAGS = {
  // World Cup nations — api-football exact names
  "Argentina":"🇦🇷", "Australia":"🇦🇺", "Austria":"🇦🇹",
  "Belgium":"🇧🇪", "Bosnia":"🇧🇦", "Brazil":"🇧🇷",
  "Canada":"🇨🇦", "Cape Verde":"🇨🇻", "Colombia":"🇨🇴",
  "Croatia":"🇭🇷", "Curacao":"🇨🇼", "Curaçao":"🇨🇼",
  "Czechia":"🇨🇿", "Czech Republic":"🇨🇿",
  "Congo DR":"🇨🇩", "DR Congo":"🇨🇩", "Congo":"🇨🇩",
  "Ecuador":"🇪🇨", "Egypt":"🇪🇬",
  "England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿", "France":"🇫🇷", "Germany":"🇩🇪",
  "Ghana":"🇬🇭", "Haiti":"🇭🇹", "Iran":"🇮🇷", "Iraq":"🇮🇶",
  "Italy":"🇮🇹", "Ivory Coast":"🇨🇮", "Cote d'Ivoire":"🇨🇮",
  "Côte d'Ivoire":"🇨🇮", "Japan":"🇯🇵", "Jordan":"🇯🇴",
  "Korea Republic":"🇰🇷", "South Korea":"🇰🇷",  // api-football uses "Korea Republic"
  "Mexico":"🇲🇽", "Morocco":"🇲🇦",
  "Netherlands":"🇳🇱", "New Zealand":"🇳🇿", "Norway":"🇳🇴",
  "Panama":"🇵🇦", "Paraguay":"🇵🇾", "Portugal":"🇵🇹",
  "Qatar":"🇶🇦", "Saudi Arabia":"🇸🇦",
  "Scotland":"🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Senegal":"🇸🇳", "Serbia":"🇷🇸",
  "South Africa":"🇿🇦", "Spain":"🇪🇸", "Sweden":"🇸🇪",
  "Switzerland":"🇨🇭", "Tunisia":"🇹🇳", "Turkey":"🇹🇷",
  "Turkiye":"🇹🇷",  // api-football uses "Turkiye"
  "Uruguay":"🇺🇾", "USA":"🇺🇸", "United States":"🇺🇸",
  "Uzbekistan":"🇺🇿",
  // Club teams (EPL, UCL etc.)
  "Arsenal":"🔴", "Chelsea":"💙", "Liverpool":"🔴",
  "Manchester City":"🔵", "Manchester United":"🔴",
  "Tottenham":"⚪", "Tottenham Hotspur":"⚪",
  "Aston Villa":"💜", "Newcastle":"⚫", "Newcastle United":"⚫",
  "Brighton":"🔵⚪", "Brighton & Hove Albion":"🔵⚪",
  "West Ham":"⚒️", "West Ham United":"⚒️",
  "Crystal Palace":"🦅", "Fulham":"⚪",
  "Brentford":"🐝", "Everton":"💙",
  "Nottingham Forest":"🌲", "Leicester":"💙", "Leicester City":"💙",
  "Real Madrid":"⚪", "Barcelona":"🔵🔴", "Atletico Madrid":"🔴⚪",
  "Bayern Munich":"🔴", "PSG":"🔵🔴", "Paris Saint-Germain":"🔵🔴",
  "Juventus":"⚫⚪", "Inter":"🔵⚫", "Inter Milan":"🔵⚫",
  "AC Milan":"🔴⚫", "Napoli":"🔵",
  "Borussia Dortmund":"💛⚫", "RB Leipzig":"🔴⚪",
  "Bayer Leverkusen":"🔴", "Atletico Madrid":"🔴⚪",
  "Porto":"🔵⚪", "Benfica":"🔴", "Sporting CP":"🟢",
  "Celtic":"🟢⚪", "Rangers":"💙",
  "Inter Miami":"🌴💗", "LA Galaxy":"🌟",
  "LAFC":"⚫🟡", "Seattle Sounders":"🟢💙",
  "Atlanta United":"🔴⚫", "New York City":"💙",
  "New York Red Bulls":"🔴",
};

function flag(name) {
  if (!name) return "⚽";
  for (const [k, v] of Object.entries(TEAM_FLAGS)) {
    if (name.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return "⚽";
}

function toDateStr(d) {
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD
}

// ─── Parse openfootball time string → UTC Date ────────────────────────────────
// Format: "15:00 UTC-4" or "20:00 UTC-6"
function parseKickoff(dateStr, timeStr) {
  try {
    const [hhmm, tzPart] = timeStr.trim().split(" ");
    const offsetHours = parseInt(tzPart.replace("UTC", ""), 10); // e.g. -4 or -6
    const [h, m] = hhmm.split(":").map(Number);
    // Build ISO string in that UTC offset
    const sign = offsetHours >= 0 ? "+" : "-";
    const absOffset = Math.abs(offsetHours).toString().padStart(2, "0");
    const iso = `${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00${sign}${absOffset}:00`;
    const dt = new Date(iso);
    return isNaN(dt.getTime()) ? null : dt;
  } catch {
    return null;
  }
}

// ─── Normalize one openfootball match ────────────────────────────────────────
function normalizeMatch(m, nowMs) {
  const kickoff = parseKickoff(m.date, m.time || "00:00 UTC+0");
  const kickoffMs = kickoff ? kickoff.getTime() : 0;

  // Determine match state
  const hasScore = !!m.score?.ft;
  const elapsedMs = nowMs - kickoffMs;
  const matchWindowMs = 120 * 60 * 1000; // 120 min = typical max duration

  let status, isLive = false, isFinal = false;

  if (hasScore) {
    // openfootball only adds score after match ends
    isFinal = true;
    status = "FT";
  } else if (kickoff && elapsedMs > 0 && elapsedMs < matchWindowMs) {
    // Kickoff has passed, no score yet → treat as LIVE
    isLive = true;
    const elapsedMin = Math.floor(elapsedMs / 60000);
    status = elapsedMin > 45 && elapsedMin < 60
      ? "HT"
      : `${Math.min(elapsedMin, 90)}'`;
  } else if (!kickoff || kickoffMs > nowMs) {
    // Upcoming
    if (kickoff) {
      status = kickoff.toLocaleTimeString("en-GB", {
        hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka",
      }) + " BST";
    } else {
      status = "TBD";
    }
  } else {
    // Past kickoff window, no score — likely recently finished, show FT pending
    isFinal = true;
    status = "FT";
  }

  const homeScore = hasScore ? m.score.ft[0] : null;
  const awayScore = hasScore ? m.score.ft[1] : null;
  const htScore   = m.score?.ht || null;

  return {
    id:         `${m.date}-${m.team1}-${m.team2}`.replace(/\s+/g, "_"),
    status,
    isLive,
    isFinal,
    isUpcoming: !isLive && !isFinal,
    group:      m.group || m.round || "",
    round:      m.round || "",
    homeName:   m.team1 || "TBD",
    awayName:   m.team2 || "TBD",
    homeFlag:   flag(m.team1),
    awayFlag:   flag(m.team2),
    homeScore,
    awayScore,
    htHomeScore: htScore ? htScore[0] : null,
    htAwayScore: htScore ? htScore[1] : null,
    // Goal scorers for full schedule page
    goals1: m.goals1 || [],
    goals2: m.goals2 || [],
    date:   m.date || "",
    time:   kickoff ? kickoff.toLocaleTimeString("en-GB", {
              hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka",
            }) : "",
    stadium: m.ground || "",
    kickoffUtc: kickoff ? kickoff.toISOString() : null,
  };
}

// ─── Fetch & normalize all WC matches ────────────────────────────────────────
async function fetchAllWCMatches() {
  const res = await fetch(WC_JSON_URL, {
    // GitHub raw serves with cache headers; we use Next's fetch cache too
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`openfootball fetch → ${res.status}`);
  const data = await res.json();

  const nowMs = Date.now();
  const matches = (data.matches || []).map(m => normalizeMatch(m, nowMs));
  return matches;
}

// ─── Check if any match is in a "live window" to set TTL ─────────────────────
function hasLiveWindow(matches) {
  const nowMs = Date.now();
  return matches.some(m => {
    if (!m.kickoffUtc) return false;
    const ko = new Date(m.kickoffUtc).getTime();
    const elapsed = nowMs - ko;
    return elapsed > 0 && elapsed < 130 * 60 * 1000;
  });
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type     = searchParams.get("type")     || "wc";
  const smartDay = searchParams.get("smartday") === "true";
  const full     = searchParams.get("full")     === "true"; // /scores page
  const league   = searchParams.get("league")   || "epl";

  const cacheKey = `${type}-${smartDay}-${full}-${league}`;
  const cached   = cache.get(cacheKey);
  const now      = Date.now();

  // ── World Cup via openfootball ─────────────────────────────────────────────
  if (type === "wc") {
    // Use cached data if still fresh
    if (cached) {
      const ttl = cached.data.isLive ? TTL_ACTIVE : TTL_IDLE;
      if (now - cached.ts < ttl) {
        return Response.json({ ...cached.data, fromCache: true });
      }
    }

    try {
      const allMatches = await fetchAllWCMatches();
      const isAnyLive  = hasLiveWindow(allMatches);
      const todayStr   = toDateStr(new Date());

      // ── Full schedule page (/scores) ──
      if (full) {
        // Group by group name
        const grouped = {};
        allMatches.forEach(m => {
          const g = m.group || "Other";
          if (!grouped[g]) grouped[g] = [];
          grouped[g].push(m);
        });

        // Compute group standings from completed matches
        const standings = {};
        allMatches.filter(m => m.isFinal).forEach(m => {
          const g = m.group;
          if (!standings[g]) standings[g] = {};

          const initTeam = (name) => {
            if (!standings[g][name]) {
              standings[g][name] = { team: name, flag: flag(name), p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
            }
          };

          initTeam(m.homeName);
          initTeam(m.awayName);

          const hs = m.homeScore ?? 0;
          const as = m.awayScore ?? 0;

          standings[g][m.homeName].p++;
          standings[g][m.awayName].p++;
          standings[g][m.homeName].gf += hs;
          standings[g][m.homeName].ga += as;
          standings[g][m.awayName].gf += as;
          standings[g][m.awayName].ga += hs;
          standings[g][m.homeName].gd = standings[g][m.homeName].gf - standings[g][m.homeName].ga;
          standings[g][m.awayName].gd = standings[g][m.awayName].gf - standings[g][m.awayName].ga;

          if (hs > as) {
            standings[g][m.homeName].w++;  standings[g][m.homeName].pts += 3;
            standings[g][m.awayName].l++;
          } else if (hs < as) {
            standings[g][m.awayName].w++;  standings[g][m.awayName].pts += 3;
            standings[g][m.homeName].l++;
          } else {
            standings[g][m.homeName].d++;  standings[g][m.homeName].pts += 1;
            standings[g][m.awayName].d++;  standings[g][m.awayName].pts += 1;
          }
        });

        // Sort each group's standings by pts → gd → gf
        const standingsSorted = {};
        Object.entries(standings).forEach(([g, teams]) => {
          standingsSorted[g] = Object.values(teams).sort(
            (a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf
          );
        });

        const result = {
          type: "wc",
          matches: allMatches,
          grouped,
          standings: standingsSorted,
          total: allMatches.length,
          completed: allMatches.filter(m => m.isFinal).length,
          updated: new Date().toISOString(),
        };
        cache.set(cacheKey, { ts: now, data: result });
        return Response.json(result, { headers: { "Cache-Control": "public, s-maxage=60" } });
      }

      // ── Smart day (homepage widget) ──
      if (smartDay) {
        // 1. Live matches
        const liveMatches = allMatches.filter(m => m.isLive);
        if (liveMatches.length > 0) {
          const result = {
            type: "wc",
            matches: liveMatches,
            displayDate: "Live Now 🔴",
            isLive: true,
            updated: new Date().toISOString(),
          };
          cache.set(cacheKey, { ts: now, data: result });
          return Response.json(result, { headers: { "Cache-Control": "public, s-maxage=30" } });
        }

        // 2. Today's matches (including just-finished ones)
        const todayMatches = allMatches.filter(m => m.date === todayStr);
        if (todayMatches.length > 0) {
          const result = {
            type: "wc",
            matches: todayMatches,
            displayDate: "Today",
            updated: new Date().toISOString(),
          };
          cache.set(cacheKey, { ts: now, data: result });
          return Response.json(result, {
            headers: { "Cache-Control": `public, s-maxage=${isAnyLive ? 30 : 120}` },
          });
        }

        // 3. Next upcoming match day
        const nextDate = allMatches
          .filter(m => m.isUpcoming && m.date > todayStr)
          .map(m => m.date)
          .filter(Boolean)
          .sort()[0];

        if (nextDate) {
          const label = new Date(nextDate + "T12:00:00Z").toLocaleDateString("en-GB", {
            weekday: "short", day: "numeric", month: "short",
          });
          const result = {
            type: "wc",
            matches: allMatches.filter(m => m.date === nextDate),
            displayDate: `Next: ${label}`,
            updated: new Date().toISOString(),
          };
          cache.set(cacheKey, { ts: now, data: result });
          return Response.json(result, { headers: { "Cache-Control": "public, s-maxage=300" } });
        }

        // 4. Fallback: last completed day
        const lastDate = allMatches
          .filter(m => m.isFinal && m.date)
          .map(m => m.date)
          .sort().reverse()[0];

        const result = {
          type: "wc",
          matches: lastDate ? allMatches.filter(m => m.date === lastDate) : [],
          displayDate: lastDate ? "Latest Results" : "World Cup 2026",
          updated: new Date().toISOString(),
        };
        cache.set(cacheKey, { ts: now, data: result });
        return Response.json(result, { headers: { "Cache-Control": "public, s-maxage=300" } });
      }

      // ── Default: today's matches ──
      const result = {
        type: "wc",
        matches: allMatches.filter(m => m.date === todayStr),
        displayDate: "Today",
        updated: new Date().toISOString(),
      };
      cache.set(cacheKey, { ts: now, data: result });
      return Response.json(result, { headers: { "Cache-Control": "public, s-maxage=60" } });

    } catch (err) {
      console.error("WC fetch error:", err.message);
      if (cached) {
        return Response.json({ ...cached.data, fromCache: true, stale: true });
      }
      return Response.json({ type: "wc", matches: [], displayDate: "", error: err.message });
    }
  }

  // ── Other leagues via api-football ────────────────────────────────────────
  if (!RAPID_KEY) {
    return Response.json({ type: "league", games: [], note: "Add RAPIDAPI_KEY for league scores" });
  }

  if (cached && now - cached.ts < TTL_IDLE) {
    return Response.json({ ...cached.data, fromCache: true });
  }

  try {
    const LEAGUE_CFG = {
      epl:              { id: 39,  season: 2024 },
      la_liga:          { id: 140, season: 2024 },
      champions_league: { id: 2,   season: 2024 },
      bundesliga:       { id: 78,  season: 2024 },
      serie_a:          { id: 135, season: 2024 },
      ligue_1:          { id: 61,  season: 2024 },
      mls:              { id: 253, season: 2025 },
    };
    const cfg  = LEAGUE_CFG[league] || LEAGUE_CFG.epl;
    const date = toDateStr(new Date());
    const res = await fetch(
      `https://${RAPID_HOST}/v3/fixtures?league=${cfg.id}&season=${cfg.season}&date=${date}`,
      { headers: { "x-rapidapi-key": RAPID_KEY, "x-rapidapi-host": RAPID_HOST } }
    );
    const data  = await res.json();
    const games = (data.response || []).map(f => {
      const short   = f.fixture.status.short;
      const elapsed = f.fixture.status.elapsed;
      const hName   = f.teams.home.name;
      const aName   = f.teams.away.name;
      const isLive  = ["1H","2H","HT","ET","P"].includes(short);
      const isFinal = ["FT","AET","PEN"].includes(short);
      return {
        id:        f.fixture.id,
        homeName:  hName, awayName: aName,
        homeFlag:  flag(hName), awayFlag: flag(aName),
        homeScore: (isLive || isFinal) ? f.goals.home : null,
        awayScore: (isLive || isFinal) ? f.goals.away : null,
        status: isFinal ? (short === "FT" ? "FT" : short)
          : short === "HT" ? "HT"
          : elapsed ? `${elapsed}'`
          : new Date(f.fixture.date).toLocaleTimeString("en-GB", {
              hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka",
            }) + " BST",
        isLive, isFinal, isUpcoming: !isLive && !isFinal,
        date:    toDateStr(new Date(f.fixture.date)),
        stadium: f.fixture.venue?.name || "",
      };
    });

    const result = { type: "league", games, updated: new Date().toISOString() };
    cache.set(cacheKey, { ts: now, data: result });
    return Response.json(result, { headers: { "Cache-Control": "public, s-maxage=60" } });

  } catch (err) {
    console.error("League fetch error:", err.message);
    if (cached) return Response.json({ ...cached.data, fromCache: true, stale: true });
    return Response.json({ type: "league", games: [], error: err.message });
  }
}