"use client";
import { useState } from "react";
import Link from "next/link";
import { Trophy, Users, MapPin, Calendar, ChevronRight, Plus, Clock, Star, Filter, Search, X } from "lucide-react";

const TOURNAMENTS = [
  { id: 1, name: "Dhaka Futsal Cup 2025", sport: "Futsal", type: "5v5", turf: "Alpha Sports Arena", area: "Mohammadpur", organizer: "TurfZone Official", date: "June 20–25, 2025", deadline: "June 15, 2025", teams: 12, maxTeams: 16, prize: "৳50,000", fee: "৳2,000/team", status: "open", badge: "Featured", color: "bg-emerald-50" },
  { id: 2, name: "Champions League Dhaka", sport: "Football", type: "7v7", turf: "Kick Off FC", area: "Purbachal", organizer: "Kick Off FC", date: "July 1–10, 2025", deadline: "June 25, 2025", teams: 6, maxTeams: 8, prize: "৳30,000", fee: "৳3,000/team", status: "open", badge: null, color: "bg-blue-50" },
  { id: 3, name: "Bashundhara Cricket T20", sport: "Cricket", type: "11v11", turf: "NDE Sports Complex", area: "Bashundhara", organizer: "NDE Sports", date: "July 15–20, 2025", deadline: "July 10, 2025", teams: 8, maxTeams: 8, prize: "৳25,000", fee: "৳1,500/team", status: "full", badge: "Full", color: "bg-amber-50" },
  { id: 4, name: "Gulshan Badminton Open", sport: "Badminton", type: "Singles", turf: "Champions Arena", area: "Gulshan", organizer: "Champions Arena", date: "Aug 5–8, 2025", deadline: "July 30, 2025", teams: 14, maxTeams: 32, prize: "৳15,000", fee: "৳500/player", status: "open", badge: "New", color: "bg-purple-50" },
  { id: 5, name: "Mirpur Summer Futsal", sport: "Futsal", type: "5v5", turf: "Green Field Turf", area: "Mirpur", organizer: "Green Field", date: "Aug 10–15, 2025", deadline: "Aug 5, 2025", teams: 4, maxTeams: 12, prize: "৳20,000", fee: "৳1,500/team", status: "open", badge: null, color: "bg-emerald-50" },
  { id: 6, name: "Uttara Football Fest", sport: "Football", type: "5v5", turf: "Uttara Arena", area: "Uttara", organizer: "Uttara Arena", date: "Aug 20–22, 2025", deadline: "Aug 15, 2025", teams: 0, maxTeams: 16, prize: "৳40,000", fee: "৳2,500/team", status: "open", badge: "New", color: "bg-blue-50" },
];

const SPORTS = ["All", "Futsal", "Football", "Cricket", "Badminton"];

export default function TournamentsPage() {
  const [sport, setSport] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [registered, setRegistered] = useState([]);

  const filtered = TOURNAMENTS.filter((t) => {
    const matchSport = sport === "All" || t.sport === sport;
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.area.toLowerCase().includes(search.toLowerCase());
    return matchSport && matchSearch;
  });

  const handleRegister = (id) => {
    setRegistered((prev) => prev.includes(id) ? prev : [...prev, id]);
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className={`${selected.color} h-24 flex items-center justify-center text-5xl`}>🏆</div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">{selected.name}</h2>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <MapPin size={11} /> {selected.turf} · {selected.area}
                  </div>
                </div>
                <button onClick={() => setSelected(null)}><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  ["Sport", selected.sport],
                  ["Format", selected.type],
                  ["Dates", selected.date],
                  ["Deadline", selected.deadline],
                  ["Prize pool", selected.prize],
                  ["Entry fee", selected.fee],
                  ["Teams", `${selected.teams}/${selected.maxTeams}`],
                  ["Organizer", selected.organizer],
                ].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs text-gray-400">{k}</div>
                    <div className="text-sm font-semibold text-gray-900 mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
              {registered.includes(selected.id) ? (
                <div className="w-full bg-emerald-50 text-emerald-700 py-3 rounded-xl text-sm font-medium text-center">
                  ✓ Registered! Check your email for confirmation.
                </div>
              ) : selected.status === "full" ? (
                <div className="w-full bg-gray-100 text-gray-400 py-3 rounded-xl text-sm font-medium text-center">Tournament full</div>
              ) : (
                <button onClick={() => handleRegister(selected.id)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-sm font-medium transition">
                  Register — {selected.fee}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Tournaments</h1>
            <Link href="/tournaments/create" className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-xl transition">
              <Plus size={15} /> Create
            </Link>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 flex-1 min-w-[160px]">
              <Search size={15} className="text-gray-400 shrink-0" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tournaments..."
                className="bg-transparent text-sm text-gray-700 placeholder-gray-400 flex-1 outline-none" />
              {search && <button onClick={() => setSearch("")}><X size={13} className="text-gray-400" /></button>}
            </div>
            <div className="flex gap-1.5 overflow-x-auto">
              {SPORTS.map((s) => (
                <button key={s} onClick={() => setSport(s)}
                  className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap border transition
                    ${sport === s ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-600 border-gray-200"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[["🏆", "Active tournaments", TOURNAMENTS.filter(t => t.status === "open").length],
            ["👥", "Total slots", TOURNAMENTS.reduce((s, t) => s + t.maxTeams, 0)],
            ["💰", "Total prize pool", "৳1.8L"]].map(([icon, label, val]) => (
            <div key={label} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-lg font-bold text-emerald-500">{val}</div>
              <div className="text-xs text-gray-400">{label}</div>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-400 mb-4"><span className="font-medium text-gray-900">{filtered.length}</span> tournaments found</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition">
              <div className={`${t.color} h-28 flex items-center justify-center text-5xl relative`}>
                🏆
                {t.badge && (
                  <span className={`absolute top-3 left-3 text-xs px-2 py-0.5 rounded-full font-medium
                    ${t.badge === "Featured" ? "bg-emerald-500 text-white"
                    : t.badge === "Full" ? "bg-red-500 text-white"
                    : "bg-blue-500 text-white"}`}>
                    {t.badge}
                  </span>
                )}
                {registered.includes(t.id) && (
                  <span className="absolute top-3 right-3 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">✓ Registered</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{t.name}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                  <MapPin size={10} /> {t.area} · {t.sport} {t.type}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-xs text-gray-400">Prize</div>
                    <div className="text-sm font-bold text-emerald-500">{t.prize}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-xs text-gray-400">Entry</div>
                    <div className="text-sm font-bold text-gray-700">{t.fee}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Users size={11} /> {t.teams}/{t.maxTeams} teams
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={11} /> Deadline: {t.deadline}
                  </div>
                </div>
                {/* Slots progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                  <div className="bg-emerald-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${(t.teams / t.maxTeams) * 100}%` }} />
                </div>
                <button onClick={() => setSelected(t)} disabled={t.status === "full" && !registered.includes(t.id)}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition
                    ${registered.includes(t.id) ? "bg-emerald-50 text-emerald-600"
                    : t.status === "full" ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}>
                  {registered.includes(t.id) ? "✓ Registered" : t.status === "full" ? "Tournament full" : "View & Register"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}