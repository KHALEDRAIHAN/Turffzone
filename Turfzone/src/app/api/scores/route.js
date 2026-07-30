export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get("league") || "epl";

  try {
    // Using SportRadar via RapidAPI (free tier available)
    // For production: sign up at rapidapi.com/api-sports/api/api-football
    const API_KEY = process.env.RAPIDAPI_KEY;

    if (!API_KEY) {
      // Return realistic mock data so UI works during development
      return Response.json({
        games: getMockGames(league),
        source: "mock"
      });
    }

    const leagueMap = { epl: 39, la_liga: 140, champions_league: 2, bundesliga: 78, serie_a: 135, ligue_1: 61 };
    const leagueId = leagueMap[league] || 39;
    const today = new Date().toISOString().split("T")[0];

    const res = await fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${leagueId}&season=2024&date=${today}`, {
      headers: {
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
        "x-rapidapi-key": API_KEY,
      },
      next: { revalidate: 60 },
    });

    const data = await res.json();
    const games = (data.response || []).map((f) => ({
      id: f.fixture.id,
      status: f.fixture.status.short === "1H" || f.fixture.status.short === "2H" ? `${f.fixture.status.elapsed}'`
        : f.fixture.status.short,
      scheduled: f.fixture.date,
      venue: f.fixture.venue?.name,
      home_team: f.teams.home.name,
      away_team: f.teams.away.name,
      home_score: f.goals.home,
      away_score: f.goals.away,
    }));

    return Response.json({ games });
  } catch (err) {
    console.error("Scores API error:", err);
    return Response.json({ games: getMockGames(league), source: "mock" });
  }
}

function getMockGames(league) {
  const fixtures = {
    epl: [
      { id: 1, status: "FT", home_team: "Arsenal", away_team: "Chelsea", home_score: 2, away_score: 1, venue: "Emirates Stadium" },
      { id: 2, status: "45'", home_team: "Liverpool", away_team: "Man City", home_score: 1, away_score: 1, venue: "Anfield" },
      { id: 3, status: "Upcoming", home_team: "Man United", away_team: "Tottenham", home_score: null, away_score: null, scheduled: new Date(Date.now() + 3600000).toISOString() },
    ],
    la_liga: [
      { id: 4, status: "FT", home_team: "Real Madrid", away_team: "Barcelona", home_score: 3, away_score: 2, venue: "Santiago Bernabéu" },
      { id: 5, status: "78'", home_team: "Atletico Madrid", away_team: "Sevilla", home_score: 1, away_score: 0, venue: "Metropolitano" },
    ],
    champions_league: [
      { id: 6, status: "FT", home_team: "PSG", away_team: "Bayern Munich", home_score: 1, away_score: 2, venue: "Parc des Princes" },
      { id: 7, status: "HT", home_team: "Inter Milan", away_team: "Dortmund", home_score: 0, away_score: 0, venue: "San Siro" },
    ],
  };
  return fixtures[league] || fixtures.epl;
}