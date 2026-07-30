"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { RefreshCw, Wifi, WifiOff, Loader2 } from "lucide-react";

function ScoreBox({ match }) {
  const { homeScore, awayScore, isLive, isFinal, status } = match;
  const hasScore = homeScore !== null && awayScore !== null && homeScore !== undefined && awayScore !== undefined;

  if (isLive && hasScore) {
    return (
      <div className="bg-red-600 text-white rounded-xl px-3 py-2 min-w-[4.5rem] text-center font-mono font-bold text-lg tracking-widest">
        {homeScore} : {awayScore}
      </div>
    );
  }
  if (isFinal && hasScore) {
    return (
      <div className="bg-gray-900 text-white rounded-xl px-3 py-2 min-w-[4.5rem] text-center font-mono font-bold text-lg tracking-widest">
        {homeScore} : {awayScore}
      </div>
    );
  }
  // Upcoming — show kickoff time, dark text so it's visible
  return (
    <div className="bg-gray-100 text-gray-900 rounded-xl px-3 py-2 min-w-[4.5rem] text-center font-mono font-bold text-sm">
      {status && status !== "Upcoming" ? status : "vs"}
    </div>
  );
}

function MatchCard({ match }) {
  const { homeName, awayName, homeFlag, awayFlag,
          homeScore, awayScore, isLive, isFinal, stadium, status } = match;
  const hasScore = homeScore !== null && awayScore !== null;
  const hWins = isFinal && hasScore && homeScore > awayScore;
  const aWins = isFinal && hasScore && awayScore > homeScore;

  return (
    <div className={`rounded-2xl border p-4 ${isLive ? "border-red-200 bg-red-50" : "border-gray-100 bg-white"}`}>
      {/* Status row */}
      <div className="flex items-center justify-between mb-3">
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            {status.includes("'") || status === "HT" ? status : "LIVE"}
          </span>
        ) : isFinal ? (
          <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">FT</span>
        ) : (
          <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full">
            ⏰ {status}
          </span>
        )}
        {stadium && (
          <span className="text-xs text-gray-400 truncate max-w-[9rem] ml-2">{stadium}</span>
        )}
      </div>

      {/* Teams + score */}
      <div className="grid grid-cols-3 items-center gap-2">
        {/* Home */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl leading-none">{homeFlag}</span>
          <span className={`text-xs text-center leading-tight font-semibold
            ${hWins ? "text-gray-900" : isFinal ? "text-gray-400" : "text-gray-800"}`}>
            {homeName}
          </span>
        </div>

        {/* Score */}
        <div className="flex justify-center">
          <ScoreBox match={match} />
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl leading-none">{awayFlag}</span>
          <span className={`text-xs text-center leading-tight font-semibold
            ${aWins ? "text-gray-900" : isFinal ? "text-gray-400" : "text-gray-800"}`}>
            {awayName}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function WorldCupScoreboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/live-scores?type=wc&smartday=true", { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 30_000);
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  const secsAgo = Math.floor((Date.now() - lastUpdated) / 1000);
  const timeLabel = secsAgo < 5 ? "just now" : secsAgo < 60 ? `${secsAgo}s ago` : `${Math.floor(secsAgo / 60)}m ago`;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {data?.isLive ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-red-500">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              LIVE NOW
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Wifi size={12} className="text-emerald-500" />
              {data?.displayDate || "World Cup 2026"}
            </span>
          )}
        </div>
        <button onClick={fetchData}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition">
          <RefreshCw size={11} /> {timeLabel}
        </button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={22} className="animate-spin text-emerald-400" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <WifiOff size={28} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">Could not load scores</p>
            <button onClick={fetchData} className="text-xs text-emerald-500 mt-2 hover:underline block mx-auto">Retry</button>
          </div>
        ) : !data?.matches?.length ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">🏆</div>
            <p className="text-sm font-medium text-gray-700">No matches today</p>
            <p className="text-xs text-gray-400 mt-1">FIFA World Cup 2026 · Jun 11 – Jul 19</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.matches.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50">
        <span className="text-xs text-gray-400">
          {data?.matches?.length || 0} matches · Auto-updates every 30s
        </span>
        <Link href="/scores" className="text-xs text-emerald-500 hover:underline font-medium">
          Full schedule →
        </Link>
      </div>
    </div>
  );
}