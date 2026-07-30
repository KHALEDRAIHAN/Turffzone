"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { LayoutDashboard, MapPin, Calendar, TrendingUp, Star, Plus, Settings, ChevronRight, Clock, DollarSign, Users, LogOut } from "lucide-react";

const SLOTS = [
  { time: "6:00 AM", status: "available" }, { time: "7:00 AM", status: "booked" },
  { time: "8:00 AM", status: "booked" }, { time: "9:00 AM", status: "available" },
  { time: "10:00 AM", status: "available" }, { time: "11:00 AM", status: "booked" },
  { time: "12:00 PM", status: "available" }, { time: "1:00 PM", status: "available" },
  { time: "2:00 PM", status: "available" }, { time: "3:00 PM", status: "booked" },
  { time: "4:00 PM", status: "booked" }, { time: "5:00 PM", status: "booked" },
  { time: "6:00 PM", status: "booked" }, { time: "7:00 PM", status: "booked" },
  { time: "8:00 PM", status: "available" }, { time: "9:00 PM", status: "available" },
];

export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState(null);
  const [turfs, setTurfs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState(SLOTS);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUser(user);

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "owner" && profile?.role !== "admin") {
        router.push("/dashboard"); return;
      }

      const { data: turfs } = await supabase.from("turfs").select("*").eq("owner_id", user.id);
      setTurfs(turfs || []);

      if (turfs && turfs.length > 0) {
        const turfIds = turfs.map((t) => t.id);
        const { data: bookings } = await supabase
          .from("bookings").select("*, profiles(full_name), turfs(name, area)")
          .in("turf_id", turfIds)
          .order("created_at", { ascending: false });
        setBookings(bookings || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/"); };
  const cancelBooking = async (id) => {
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "cancelled" } : b));
  };
  const toggleSlot = (time) => {
    setSlots((prev) => prev.map((s) => s.time === time && s.status !== "booked"
      ? { ...s, status: s.status === "available" ? "blocked" : "available" } : s));
  };

  const totalRevenue = bookings.filter(b => b.status === "confirmed" || b.status === "completed").reduce((s, b) => s + (b.total_price || 0), 0);
  const tabs = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={15} /> },
    { id: "bookings", label: `Bookings (${bookings.length})`, icon: <Calendar size={15} /> },
    { id: "slots", label: "Slot Manager", icon: <Clock size={15} /> },
    { id: "turfs", label: "My Turfs", icon: <MapPin size={15} /> },
  ];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Owner Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/owner/register" className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-xl transition">
              <Plus size={15} /> Add Turf
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 border border-gray-200 rounded-xl px-4 py-2 transition">
              <LogOut size={14} />
            </button>
          </div>
        </div>

        <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap flex-1 justify-center
                ${activeTab === t.id ? "bg-emerald-500 text-white" : "text-gray-500 hover:text-gray-900"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total bookings", value: bookings.length, icon: <Calendar size={18} className="text-emerald-500" />, bg: "bg-emerald-50" },
                { label: "Revenue", value: `৳${totalRevenue.toLocaleString()}`, icon: <DollarSign size={18} className="text-blue-500" />, bg: "bg-blue-50" },
                { label: "Active turfs", value: turfs.filter(t => t.is_active).length, icon: <MapPin size={18} className="text-purple-500" />, bg: "bg-purple-50" },
                { label: "Pending turfs", value: turfs.filter(t => !t.is_active).length, icon: <Clock size={18} className="text-amber-500" />, bg: "bg-amber-50" },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className={`${s.bg} w-9 h-9 rounded-xl flex items-center justify-center mb-3`}>{s.icon}</div>
                  <div className="text-xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {turfs.length === 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-3">🏟️</div>
                <h3 className="font-semibold text-emerald-900 mb-2">No turfs listed yet</h3>
                <p className="text-sm text-emerald-700 mb-4">List your turf to start receiving bookings</p>
                <Link href="/owner/register" className="bg-emerald-500 text-white text-sm px-5 py-2 rounded-xl inline-block hover:bg-emerald-600 transition">
                  List your turf — it's free
                </Link>
              </div>
            )}

            {bookings.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">Recent bookings</h2>
                  <button onClick={() => setActiveTab("bookings")} className="text-xs text-emerald-500 flex items-center gap-1 hover:underline">
                    View all <ChevronRight size={12} />
                  </button>
                </div>
                <div className="space-y-3">
                  {bookings.slice(0, 4).map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-sm font-bold text-emerald-600">
                          {(b.profiles?.full_name || "U")[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{b.profiles?.full_name || "Player"}</div>
                          <div className="text-xs text-gray-400">{b.turfs?.name} · {b.start_time} · {b.booking_date}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-emerald-500">৳{b.total_price?.toLocaleString()}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${b.status === "confirmed" ? "bg-emerald-50 text-emerald-600"
                          : b.status === "cancelled" ? "bg-red-50 text-red-500"
                          : "bg-blue-50 text-blue-600"}`}>{b.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* BOOKINGS */}
        {activeTab === "bookings" && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="font-semibold text-gray-900 mb-5">All bookings</h2>
            {bookings.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar size={36} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm">No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-sm font-bold text-emerald-600">
                        {(b.profiles?.full_name || "U")[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{b.profiles?.full_name || "Player"}</div>
                        <div className="text-xs text-gray-400">{b.turfs?.name} · {b.start_time} · {b.booking_date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-500">৳{b.total_price?.toLocaleString()}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                          ${b.status === "confirmed" ? "bg-emerald-50 text-emerald-600"
                          : b.status === "cancelled" ? "bg-red-50 text-red-500"
                          : "bg-blue-50 text-blue-600"}`}>{b.status}</span>
                      </div>
                      {b.status === "confirmed" && (
                        <button onClick={() => cancelBooking(b.id)} className="text-xs text-red-400 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SLOT MANAGER */}
        {activeTab === "slots" && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-900">Today's slot manager</h2>
              <span className="text-xs text-gray-400">Tap to block/unblock</span>
            </div>
            <div className="flex gap-4 text-xs text-gray-500 mb-5">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 inline-block"></span>Available</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 inline-block"></span>Booked</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block"></span>Blocked</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {slots.map((slot) => (
                <button key={slot.time} onClick={() => toggleSlot(slot.time)} disabled={slot.status === "booked"}
                  className={`py-3 px-2 rounded-xl text-xs font-medium border transition
                    ${slot.status === "booked" ? "bg-blue-50 text-blue-500 border-blue-100 cursor-not-allowed"
                    : slot.status === "blocked" ? "bg-gray-100 text-gray-400 border-gray-200"
                    : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"}`}>
                  {slot.time}
                  <div className="text-xs font-normal mt-0.5 capitalize">{slot.status}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MY TURFS */}
        {activeTab === "turfs" && (
          <div className="space-y-4">
            {turfs.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center">
                <p className="text-sm text-gray-400 mb-4">You have not listed any turfs yet</p>
                <Link href="/owner/register" className="bg-emerald-500 text-white text-sm px-5 py-2.5 rounded-xl inline-block">List a turf</Link>
              </div>
            ) : turfs.map((turf) => (
              <div key={turf.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{turf.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <MapPin size={11} /> {turf.area}, {turf.city}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${turf.is_active ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                    {turf.is_active ? "Active" : "Pending approval"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Sports", turf.sports?.join(", ")],
                    ["Price", `৳${turf.price_per_hour?.toLocaleString()}/hr`],
                    ["Hours", `${turf.open_time} – ${turf.close_time}`],
                    ["Phone", turf.phone],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <span className="text-xs text-gray-400">{k}</span>
                      <div className="text-sm font-medium text-gray-800">{v || "—"}</div>
                    </div>
                  ))}
                </div>
                {!turf.is_active && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-700">
                    ⏳ Your turf is under review. Admin will approve within 24 hours.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}