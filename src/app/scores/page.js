"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Loader2, Trophy } from "lucide-react";

const GROUP_LETTERS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

const KNOCKOUT_ORDER = [
  "Round of 32", "Round of 16", "Quarter-finals",
  "Semi-finals", "3rd Place", "Final",
];

// Convert UTC time string to Bangladesh time display
function toBDTime(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka",
    }) + " BST";
  } catch {
    return isoString;
  }
}

function StatusBadge({ match }) {
  const { isLive, isFinal, status } = match;
  if (isLive) return (
    <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
      {status.includes("'") || status === "HT" ? status : "LIVE"}
    </span>
  );
  if (isFinal) return (
    <span className="bg-gray-200 text-gray-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">FT</span>
  );
  return (
    <span className="bg-blue-50 text-blue-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
      ⏰ {status}
    </span>
  );
}

function MatchRow({ match }) {
  const { homeName, awayName, homeFlag, awayFlag,
          homeScore, awayScore, isLive, isFinal, stadium } = match;
  const hasScore = homeScore !== null && awayScore !== null;
  const hWins = isFinal && hasScore && homeScore > awayScore;
  const aWins = isFinal && hasScore && awayScore > homeScore;

  const scoreText = (isLive || isFinal) && hasScore
    ? `${homeScore} – ${awayScore}`
    : "vs";

  const scoreBg = isLive
    ? "bg-red-600 text-white"
    : (isFinal && hasScore)
    ? "bg-gray-900 text-white"
    : "bg-gray-100 text-gray-900"; // ← dark text for upcoming

  return (
    <div className={`border rounded-xl overflow-hidden ${isLive ? "bg-red-50 border-red-200" : "bg-white border-gray-100"}`}>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-3">
        {/* Home */}
        <div className="flex items-center gap-2 justify-end">
          <div className="text-right">
            <p className={`text-sm font-semibold leading-tight
              ${isLive ? "text-gray-900" : isFinal
                ? (hWins ? "text-gray-900 font-bold" : "text-gray-400")
                : "text-gray-900"}`}>
              {homeName}
            </p>
          </div>
          <span className="text-3xl leading-none shrink-0">{homeFlag}</span>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center gap-1">
          <div className={`font-mono font-bold text-sm px-3 py-1.5 rounded-lg min-w-[4.5rem] text-center ${scoreBg}`}>
            {scoreText}
          </div>
          <StatusBadge match={match} />
        </div>

        {/* Away */}
        <div className="flex items-center gap-2">
          <span className="text-3xl leading-none shrink-0">{awayFlag}</span>
          <div>
            <p className={`text-sm font-semibold leading-tight
              ${isLive ? "text-gray-900" : isFinal
                ? (aWins ? "text-gray-900 font-bold" : "text-gray-400")
                : "text-gray-900"}`}>
              {awayName}
            </p>
          </div>
        </div>
      </div>

      {stadium && (
        <div className="px-3 pb-2 text-center">
          <span className="text-[10px] text-gray-400">📍 {stadium}</span>
        </div>
      )}
    </div>
  );
}

function GroupSection({ letter, matches }) {
  const liveCount = matches.filter(m => m.isLive).length;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
          Group {letter}
        </div>
        {liveCount > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-500">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            {liveCount} LIVE
          </span>
        )}
      </div>
      <div className="space-y-2">
        {matches.map(m => <MatchRow key={m.id} match={m} />)}
      </div>
    </div>
  );
}

const TABS = [
  { id: "all",      label: "All" },
  { id: "live",     label: "Live" },
  { id: "results",  label: "Results" },
  { id: "upcoming", label: "Upcoming" },
];

export default function ScoresPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [groupFilter, setGroupFilter] = useState("All");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/live-scores?type=wc&full=true", { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      // Normalize group field from api-football "round" field
      const matches = (json.matches || []).map(m => {
        let group = m.group || "";
        // api-football returns "Group Stage - A" or "Group A" etc
        const match = group.match(/Group[:\s-]*([A-L])/i);
        if (match) group = `Group ${match[1].toUpperCase()}`;
        return { ...m, group };
      });
      setData({ ...json, matches });
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 45_000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const secsAgo = Math.floor((Date.now() - lastUpdated) / 1000);
  const timeLabel = secsAgo < 5 ? "just now" : secsAgo < 60 ? `${secsAgo}s ago` : `${Math.floor(secsAgo / 60)}m ago`;

  const allMatches = data?.matches || [];
  const liveCount  = allMatches.filter(m => m.isLive).length;
  const doneCount  = allMatches.filter(m => m.isFinal).length;

  const filterByTab = (matches) => {
    if (tab === "live")     return matches.filter(m => m.isLive);
    if (tab === "results")  return matches.filter(m => m.isFinal);
    if (tab === "upcoming") return matches.filter(m => m.isUpcoming);
    return matches;
  };

  // Build group matches
  const availableGroups = ["All", ...GROUP_LETTERS.filter(l =>
    allMatches.some(m => m.group === `Group ${l}`)
  )];

  const getGroupMatches = (letter) => {
    const gm = allMatches.filter(m => m.group === `Group ${letter}`);
    return filterByTab(gm);
  };

  const knockoutMatches = filterByTab(
    allMatches.filter(m => {
      const g = m.group || "";
      return !GROUP_LETTERS.some(l => g === `Group ${l}`);
    })
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-700 p-1">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-sm font-bold text-gray-900">FIFA World Cup 2026™</h1>
              <p className="text-[10px] text-gray-400">🇺🇸🇨🇦🇲🇽 Jun 11 – Jul 19 · 48 teams · 104 matches · All times in BST</p>
            </div>
          </div>
          <button onClick={fetchData} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700">
            <RefreshCw size={12} /> {timeLabel}
          </button>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="max-w-2xl mx-auto px-4 pb-2 flex items-center gap-4">
            <span className="text-xs text-gray-500">
              <span className="font-bold text-gray-800">{doneCount}</span> played
            </span>
            <span className="text-xs text-gray-500">
              <span className="font-bold text-gray-800">{allMatches.length - doneCount}</span> remaining
            </span>
            {liveCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold text-red-500">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                {liveCount} live now
              </span>
            )}
          </div>
        )}

        {/* Match filter tabs */}
        <div className="max-w-2xl mx-auto px-4 flex gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap
                ${tab === t.id
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-gray-400 hover:text-gray-700"}`}>
              {t.id === "live" && liveCount > 0
                ? <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    Live ({liveCount})
                  </span>
                : t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-emerald-400" />
          </div>
        ) : (
          <>
            {/* ── Group filter pills ────────────────────────────────── */}
            {availableGroups.length > 1 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Filter by group</p>
                <div className="flex gap-2 flex-wrap">
                  {availableGroups.map(g => (
                    <button key={g} onClick={() => setGroupFilter(g)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition
                        ${groupFilter === g
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"}`}>
                      {g === "All" ? "All Groups" : `Group ${g}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Group Stage ───────────────────────────────────────── */}
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Group Stage</h2>
              </div>

              {GROUP_LETTERS
                .filter(l => groupFilter === "All" || groupFilter === l)
                .map(letter => {
                  const gm = getGroupMatches(letter);
                  if (!gm.length) return null;
                  return (
                    <GroupSection key={letter} letter={letter} matches={gm} />
                  );
                })}
            </div>

            {/* ── Knockout Stage ────────────────────────────────────── */}
            {knockoutMatches.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy size={14} className="text-yellow-500" />
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Knockout Stage</h2>
                </div>
                {KNOCKOUT_ORDER.map(round => {
                  const rm = knockoutMatches.filter(m =>
                    (m.round || "").toLowerCase().includes(round.toLowerCase())
                  );
                  if (!rm.length) return null;
                  return (
                    <div key={round} className="mb-5">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{round}</p>
                      <div className="space-y-2">
                        {rm.map(m => <MatchRow key={m.id} match={m} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!allMatches.length && (
              <div className="text-center py-16 text-gray-400">
                <Trophy size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No match data available</p>
                <p className="text-xs mt-1">Check your RAPIDAPI_KEY in .env.local</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}