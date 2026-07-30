"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { MapPin, Search, Star, Filter, Grid, Map, Clock, ChevronRight, Wifi, Car, Droplets, X, Loader } from "lucide-react";

const SPORTS = ["All", "Futsal", "Football", "Cricket", "Badminton"];
const SORT_OPTIONS = ["Recommended", "Price: Low to High", "Price: High to Low", "Rating", "Most Reviews"];

const amenityIcon = (a) => {
  if (a === "WiFi") return <Wifi size={11} />;
  if (a === "Parking") return <Car size={11} />;
  if (a === "Shower") return <Droplets size={11} />;
};

export default function TurfsPage() {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState("All");
  const [city, setCity] = useState("All Cities");
  const [area, setArea] = useState("All");
  const [sort, setSort] = useState("Recommended");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [showFilters, setShowFilters] = useState(false);
  const [cities, setCities] = useState(["All Cities"]);
  const [areas, setAreas] = useState(["All"]);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      // Check user role — owners cannot book other turfs
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        setUserRole(p?.role);
      }

      const { data } = await supabase
        .from("turfs").select("*").eq("is_active", true);

      const mapped = (data || []).map(t => ({
        ...t,
        price: t.price_per_hour,
        sport: t.sports || [],
        amenities: t.amenities || [],
        open: `${t.open_time || "6AM"}–${t.close_time || "12AM"}`,
        rating: t.rating || 4.5,
        reviews: t.review_count || 0,
        slots: Math.floor(Math.random() * 4),
      }));

      setTurfs(mapped);
      setCities(["All Cities", ...new Set(mapped.map(t => t.city).filter(Boolean))]);
      setAreas(["All", ...new Set(mapped.map(t => t.area).filter(Boolean))]);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = turfs
    .filter((t) => {
      const s = search.toLowerCase();
      const matchSearch = t.name?.toLowerCase().includes(s) || t.area?.toLowerCase().includes(s) || t.city?.toLowerCase().includes(s);
      const matchSport = sport === "All" || (t.sport || []).includes(sport);
      const matchCity = city === "All Cities" || t.city === city;
      const matchArea = area === "All" || t.area === area;
      const matchPrice = t.price <= maxPrice;
      return matchSearch && matchSport && matchCity && matchArea && matchPrice;
    })
    .sort((a, b) => {
      if (sort === "Price: Low to High") return a.price - b.price;
      if (sort === "Price: High to Low") return b.price - a.price;
      if (sort === "Rating") return b.rating - a.rating;
      if (sort === "Most Reviews") return b.reviews - a.reviews;
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Owner warning banner */}
      {userRole === "owner" && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800">
          You are logged in as a turf owner. To book a turf as a player, please create a separate player account.
        </div>
      )}

      <div className="bg-white border-b border-gray-100 px-4 py-5">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Find a Turf</h1>
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 flex-1 min-w-[200px]">
              <Search size={16} className="text-gray-400 shrink-0" />
              <input type="text" placeholder="Search by name, area or city..."
                className="bg-transparent text-sm text-gray-900 placeholder-gray-400 flex-1 outline-none"
                value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch("")}><X size={14} className="text-gray-400" /></button>}
            </div>
            <select value={city} onChange={(e) => { setCity(e.target.value); setArea("All"); }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 bg-white outline-none">
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 bg-white outline-none">
              {SORT_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 border rounded-xl px-3 py-2 text-sm transition
                ${showFilters ? "bg-emerald-500 text-white border-emerald-500" : "border-gray-200 text-gray-700 bg-white"}`}>
              <Filter size={14} /> Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-wrap gap-6">
              <div>
                <div className="text-xs font-medium text-gray-700 mb-2">Sport</div>
                <div className="flex gap-2 flex-wrap">
                  {SPORTS.map((s) => (
                    <button key={s} onClick={() => setSport(s)}
                      className={`px-3 py-1 rounded-full text-xs border transition
                        ${sport === s ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-700 border-gray-200"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-700 mb-2">Area</div>
                <div className="flex gap-2 flex-wrap max-w-md">
                  {areas.map((a) => (
                    <button key={a} onClick={() => setArea(a)}
                      className={`px-3 py-1 rounded-full text-xs border transition
                        ${area === a ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-700 border-gray-200"}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-700 mb-2">Max price: ৳{maxPrice.toLocaleString()}/hr</div>
                <input type="range" min={500} max={8000} step={500} value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-48 accent-emerald-500" />
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            {SPORTS.map((s) => (
              <button key={s} onClick={() => setSport(s)}
                className={`px-4 py-1.5 rounded-full text-xs whitespace-nowrap border transition
                  ${sport === s ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-600 border-gray-200"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader size={28} className="animate-spin text-emerald-400" />
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-medium text-gray-900">{filtered.length}</span> turfs found
            </p>
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <Search size={36} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm font-medium text-gray-500">No turfs found</p>
                <button onClick={() => { setSearch(""); setSport("All"); setCity("All Cities"); setArea("All"); }}
                  className="mt-3 text-xs text-emerald-500 hover:underline">Clear filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((turf) => (
                  <Link href={`/turfs/${turf.id}`} key={turf.id}
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition group">
                    <div className="bg-emerald-50 h-36 flex items-center justify-center text-5xl relative">
                      {turf.image_url ? (
                        <img src={turf.image_url} alt={turf.name} className="w-full h-full object-cover" />
                      ) : "⚽"}
                      {turf.slots > 0 && (
                        <span className="absolute top-3 right-3 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {turf.slots} open
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-gray-900 text-sm group-hover:text-emerald-600 transition">{turf.name}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <MapPin size={10} /> {turf.area}, {turf.city}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold text-emerald-500">৳{turf.price?.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">per hour</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <Star size={11} className="fill-amber-400 text-amber-400" /> {turf.rating}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={11} /> {turf.open}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {(turf.sport || []).map((s) => (
                          <span key={s} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                        {(turf.amenities || []).slice(0, 2).map((a) => (
                          <span key={a} className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full">
                            {amenityIcon(a)} {a}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`text-xs font-medium ${turf.slots > 0 ? "text-emerald-500" : "text-gray-400"}`}>
                          {turf.slots > 0 ? `${turf.slots} slots today` : "Check availability"}
                        </span>
                        <span className="text-xs text-emerald-500 flex items-center gap-1 group-hover:gap-2 transition-all">
                          Book <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}