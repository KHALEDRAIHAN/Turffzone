"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, MapPin, ShoppingBag, AlertCircle, CheckCircle, XCircle, DollarSign, Calendar, ChevronRight, LogOut } from "lucide-react";

export default function AdminPanel() {
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pendingTurfs, setPendingTurfs] = useState([]);
  const [activeTurfs, setActiveTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "admin") { router.push("/dashboard"); return; }

      const [{ data: profiles }, { data: bookings }, { data: orders }, { data: allTurfs }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("bookings").select("*, turfs(name, area), profiles(full_name)").order("created_at", { ascending: false }),
        supabase.from("orders").select("*, profiles(full_name)").order("created_at", { ascending: false }),
        supabase.from("turfs").select("*, profiles(full_name)").order("created_at", { ascending: false }),
      ]);

      setUsers(profiles || []);
      setBookings(bookings || []);
      setOrders(orders || []);
      setPendingTurfs((allTurfs || []).filter(t => !t.is_active));
      setActiveTurfs((allTurfs || []).filter(t => t.is_active));
      setLoading(false);
    };
    load();
  }, []);

  const approveTurf = async (id) => {
    await supabase.from("turfs").update({ is_active: true }).eq("id", id);
    const turf = pendingTurfs.find(t => t.id === id);
    setPendingTurfs(prev => prev.filter(t => t.id !== id));
    setActiveTurfs(prev => [...prev, { ...turf, is_active: true }]);
  };

  const rejectTurf = async (id) => {
    await supabase.from("turfs").delete().eq("id", id);
    setPendingTurfs(prev => prev.filter(t => t.id !== id));
  };

  const updateOrderStatus = async (id, status) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/"); };

  const totalRevenue = bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + (b.total_price || 0), 0)
    + orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + (o.total_price || 0), 0);

  const statusColor = (s) => {
    if (["delivered", "confirmed", "completed", "active"].includes(s)) return "bg-emerald-50 text-emerald-600";
    if (s === "processing") return "bg-amber-50 text-amber-600";
    if (s === "shipped") return "bg-blue-50 text-blue-600";
    if (["cancelled", "banned"].includes(s)) return "bg-red-50 text-red-500";
    return "bg-gray-100 text-gray-500";
  };

  const TABS = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={14} /> },
    { id: "turfs", label: `Turfs ${pendingTurfs.length > 0 ? `(${pendingTurfs.length} pending)` : ""}`, icon: <MapPin size={14} /> },
    { id: "users", label: `Users (${users.length})`, icon: <Users size={14} /> },
    { id: "bookings", label: `Bookings (${bookings.length})`, icon: <Calendar size={14} /> },
    { id: "orders", label: `Orders (${orders.length})`, icon: <ShoppingBag size={14} /> },
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
          <div className="flex items-center gap-3">
            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">Admin</span>
            <h1 className="text-2xl font-semibold text-gray-900">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-3">
            {pendingTurfs.length > 0 && (
              <button onClick={() => setTab("turfs")} className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 text-sm px-3 py-2 rounded-xl hover:bg-amber-100 transition">
                <AlertCircle size={14} /> {pendingTurfs.length} pending
              </button>
            )}
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 border border-gray-200 rounded-xl px-3 py-2 transition">
              <LogOut size={14} />
            </button>
          </div>
        </div>

        <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap flex-1 justify-center
                ${tab === t.id ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total users", value: users.length, icon: <Users size={18} className="text-blue-500" />, bg: "bg-blue-50" },
                { label: "Active turfs", value: activeTurfs.length, icon: <MapPin size={18} className="text-emerald-500" />, bg: "bg-emerald-50" },
                { label: "Total bookings", value: bookings.length, icon: <Calendar size={18} className="text-purple-500" />, bg: "bg-purple-50" },
                { label: "Total revenue", value: `৳${(totalRevenue / 1000).toFixed(0)}k`, icon: <DollarSign size={18} className="text-amber-500" />, bg: "bg-amber-50" },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className={`${s.bg} w-9 h-9 rounded-xl flex items-center justify-center mb-3`}>{s.icon}</div>
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {pendingTurfs.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-amber-500 shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-amber-800">{pendingTurfs.length} turfs waiting for approval</div>
                    <div className="text-xs text-amber-600 mt-0.5">Review new turf submissions from owners</div>
                  </div>
                </div>
                <button onClick={() => setTab("turfs")} className="text-xs text-amber-700 font-medium flex items-center gap-1 hover:underline">
                  Review <ChevronRight size={12} />
                </button>
              </div>
            )}

            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Recent bookings</h2>
              {bookings.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-2 last:mb-0">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{b.profiles?.full_name || "User"}</div>
                    <div className="text-xs text-gray-400">{b.turfs?.name} · {b.start_time} · {b.booking_date}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-500">৳{b.total_price?.toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(b.status)}`}>{b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TURFS */}
        {tab === "turfs" && (
          <div className="space-y-4">
            {pendingTurfs.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <h2 className="font-semibold text-gray-900 mb-4">⏳ Pending approval ({pendingTurfs.length})</h2>
                <div className="space-y-3">
                  {pendingTurfs.map((t) => (
                    <div key={t.id} className="p-4 border border-amber-200 bg-amber-50 rounded-xl">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold text-gray-900">{t.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{t.area}, {t.city}</div>
                          <div className="text-xs text-gray-400 mt-0.5">Owner: {t.profiles?.full_name || "Unknown"} · ৳{t.price_per_hour?.toLocaleString()}/hr</div>
                          <div className="text-xs text-gray-400">Sports: {t.sports?.join(", ")} · {t.open_time}–{t.close_time}</div>
                          {t.description && <div className="text-xs text-gray-500 mt-1 italic">"{t.description}"</div>}
                        </div>
                        <div className="flex gap-2 shrink-0 ml-3">
                          <button onClick={() => approveTurf(t.id)}
                            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg transition">
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button onClick={() => rejectTurf(t.id)}
                            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-500 text-xs px-3 py-1.5 rounded-lg border border-red-200 transition">
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <h2 className="font-semibold text-gray-900 mb-4">✅ Active turfs ({activeTurfs.length})</h2>
              {activeTurfs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No active turfs yet</p>
              ) : (
                <div className="space-y-3">
                  {activeTurfs.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                      <div>
                        <div className="text-sm font-medium text-gray-800">{t.name}</div>
                        <div className="text-xs text-gray-400">{t.area}, {t.city} · ৳{t.price_per_hour?.toLocaleString()}/hr · {t.sports?.join(", ")}</div>
                      </div>
                      <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Active</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === "users" && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="font-semibold text-gray-900 mb-5">All users ({users.length})</h2>
            {users.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No users yet</p> : (
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-sm font-bold text-emerald-600">
                        {(u.full_name || "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{u.full_name || "Unnamed"}</div>
                        <div className="text-xs text-gray-400">Joined {new Date(u.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize
                      ${u.role === "owner" ? "bg-purple-50 text-purple-600" : u.role === "admin" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                      {u.role || "player"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BOOKINGS */}
        {tab === "bookings" && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="font-semibold text-gray-900 mb-5">All bookings ({bookings.length})</h2>
            {bookings.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No bookings yet</p> : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{b.profiles?.full_name || "User"}</div>
                      <div className="text-xs text-gray-400">{b.turfs?.name} · {b.booking_date} · {b.start_time}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-500">৳{b.total_price?.toLocaleString()}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(b.status)}`}>{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORDERS */}
        {tab === "orders" && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="font-semibold text-gray-900 mb-5">All orders ({orders.length})</h2>
            {orders.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No orders yet</p> : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="p-4 border border-gray-100 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium text-gray-900">Order #{o.id}</span>
                        <span className="text-xs text-gray-400 ml-2">by {o.profiles?.full_name || "User"}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(o.status)}`}>{o.status}</span>
                    </div>
                    <div className="text-xs text-gray-400 mb-3">{o.items?.map(i => `${i.name} ×${i.qty}`).join(", ")}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-emerald-500">৳{o.total_price?.toLocaleString()}</span>
                      <div className="flex gap-2">
                        {["processing", "shipped", "delivered"].map((s) => (
                          <button key={s} onClick={() => updateOrderStatus(o.id, s)}
                            className={`text-xs px-2 py-1 rounded-lg border transition capitalize
                              ${o.status === s ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}