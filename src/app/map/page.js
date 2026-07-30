"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase";
import { MapPin, Star, Clock, ChevronRight, X, Search, Filter, Loader } from "lucide-react";
import Link from "next/link";

const SPORTS = ["All", "Futsal", "Football", "Cricket", "Badminton"];

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const [allTurfs, setAllTurfs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sport, setSport] = useState("All");
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState("All");
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("turfs")
        .select("*")
        .eq("is_active", true);

      const turfs = (data || []).map(t => ({
        ...t,
        sport: t.sports || [],
        price: t.price_per_hour,
        open: `${t.open_time}–${t.close_time}`,
        slots: Math.floor(Math.random() * 4),
        lat: t.lat || 23.7808 + (Math.random() - 0.5) * 0.1,
        lng: t.lng || 90.4093 + (Math.random() - 0.5) * 0.1,
        color: "bg-emerald-50",
      }));

      setAllTurfs(turfs);
      const uniqueAreas = ["All", ...new Set(turfs.map(t => t.area).filter(Boolean))];
      setAreas(uniqueAreas);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = allTurfs.filter((t) => {
    const matchSport = sport === "All" || (t.sport || []).includes(sport);
    const matchSearch = t.name?.toLowerCase().includes(search.toLowerCase()) || t.area?.toLowerCase().includes(search.toLowerCase()) || t.city?.toLowerCase().includes(search.toLowerCase());
    const matchArea = selectedArea === "All" || t.area === selectedArea;
    return matchSport && matchSearch && matchArea;
  });

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 z-10">
        <div className="max-w-6xl mx-auto space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 flex-1 min-w-[160px]">
              <Search size={15} className="text-gray-400 shrink-0" />
              <input type="text" placeholder="Search area or turf..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm text-gray-700 placeholder-gray-400 flex-1 outline-none" />
              {search && <button onClick={() => setSearch("")}><X size={13} className="text-gray-400" /></button>}
            </div>
            <button onClick={() => setShowList(!showList)}
              className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition
                ${showList ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-600 border-gray-200"}`}>
              <Filter size={13} /> List ({filtered.length})
            </button>
          </div>

          {/* Sport filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {SPORTS.map((s) => (
              <button key={s} onClick={() => setSport(s)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border transition
                  ${sport === s ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-600 border-gray-200"}`}>
                {s}
              </button>
            ))}
          </div>

          {/* Area filter — dynamic from real turf data */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {areas.map((a) => (
              <button key={a} onClick={() => setSelectedArea(a)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border transition
                  ${selectedArea === a ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200"}`}>
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        {showList && (
          <div className="w-72 bg-white border-r border-gray-100 overflow-y-auto shrink-0 z-10">
            <div className="p-3 space-y-2">
              {loading ? (
                <div className="text-center py-8"><Loader size={20} className="mx-auto animate-spin text-emerald-400" /></div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400">No turfs found</div>
              ) : filtered.map((turf) => (
                <button key={turf.id} onClick={() => { setSelected(turf); setShowList(false); }}
                  className={`w-full text-left p-3 rounded-xl border transition
                    ${selected?.id === turf.id ? "border-emerald-400 bg-emerald-50" : "border-gray-100 hover:bg-gray-50"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{turf.name}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <MapPin size={9} /> {turf.area}, {turf.city}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-500 shrink-0 ml-2">৳{turf.price?.toLocaleString()}/hr</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="text-amber-500">★ {turf.rating || "New"}</span>
                    <span className={turf.slots > 0 ? "text-emerald-500" : "text-gray-400"}>
                      {turf.slots > 0 ? `${turf.slots} slots open` : "Check availability"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-gray-500">Loading turfs...</p>
              </div>
            </div>
          ) : (
            <MapView turfs={filtered} selected={selected} onSelect={setSelected} />
          )}

          {/* Selected popup */}
          {selected && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-sm px-4">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selected.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <MapPin size={10} /> {selected.area}, {selected.city}
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)}><X size={18} className="text-gray-400" /></button>
                </div>
                <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Star size={11} className="fill-amber-400 text-amber-400" /> {selected.rating || "New"}</span>
                  <span className="flex items-center gap-1"><Clock size={11} /> {selected.open}</span>
                  <span className={selected.slots > 0 ? "text-emerald-500" : "text-gray-400"}>
                    {selected.slots > 0 ? `${selected.slots} open` : "Check availability"}
                  </span>
                </div>
                <div className="flex gap-1.5 mb-4 flex-wrap">
                  {(selected.sport || []).map((s) => (
                    <span key={s} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-emerald-500">
                    ৳{selected.price?.toLocaleString()}<span className="text-xs font-normal text-gray-400">/hr</span>
                  </span>
                  <Link href={`/turfs/${selected.id}`}
                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-xl transition">
                    Book now <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}