"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Calendar, ShoppingBag, LogOut, User, Clock, CheckCircle, XCircle, Package, Loader, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("bookings");
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUser(user);

      const { data: profile } = await supabase
        .from("profiles").select("*").eq("id", user.id).single();
      setProfile(profile);

      const { data: bookings } = await supabase
        .from("bookings")
        .select("*, turfs(name, area, city)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setBookings(bookings || []);

      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders(orders || []);
      setLoading(false);
    };
    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const canCancel = (booking) => {
    if (booking.status !== "confirmed") return false;
    const createdAt = new Date(booking.created_at).getTime();
    const now = Date.now();
    const minutesElapsed = (now - createdAt) / 60000;
    return minutesElapsed <= 5;
  };

  const getTimeLeft = (booking) => {
    const createdAt = new Date(booking.created_at).getTime();
    const elapsed = (Date.now() - createdAt) / 1000;
    const remaining = 300 - elapsed; // 5 minutes = 300 seconds
    if (remaining <= 0) return null;
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const cancelBooking = async (bookingId, createdAt) => {
    const minutesElapsed = (Date.now() - new Date(createdAt).getTime()) / 60000;
    if (minutesElapsed > 5) {
      alert("Cancellation window has passed. Bookings can only be cancelled within 5 minutes.");
      return;
    }
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    setCancellingId(bookingId);
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", bookingId);

    if (!error) {
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, status: "cancelled" } : b
      ));
    }
    setCancellingId(null);
  };

  const statusColor = (status) => {
    if (status === "confirmed") return "bg-emerald-50 text-emerald-600";
    if (status === "cancelled") return "bg-red-50 text-red-500";
    if (status === "completed") return "bg-blue-50 text-blue-600";
    if (status === "processing") return "bg-amber-50 text-amber-600";
    if (status === "shipped") return "bg-blue-50 text-blue-600";
    if (status === "delivered") return "bg-emerald-50 text-emerald-600";
    return "bg-gray-100 text-gray-500";
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader size={28} className="animate-spin text-emerald-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Hey, {profile?.full_name?.split(" ")[0] || "Player"} 👋
            </h1>
            <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 border border-gray-200 rounded-xl px-4 py-2 transition"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {[
            { icon: <MapPin size={18} className="text-emerald-500" />, label: "Find a turf", href: "/turfs" },
            { icon: <ShoppingBag size={18} className="text-emerald-500" />, label: "Shop gear", href: "/shop" },
            { icon: <User size={18} className="text-emerald-500" />, label: "Edit profile", href: "/dashboard/profile" },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition"
            >
              {a.icon}
              <span className="text-sm font-medium text-gray-700">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-500">{bookings.length}</div>
            <div className="text-xs text-gray-400 mt-1">Total bookings</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-500">{orders.length}</div>
            <div className="text-xs text-gray-400 mt-1">Total orders</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 mb-5">
          {[
            { id: "bookings", label: "Bookings", icon: <Calendar size={14} /> },
            { id: "orders", label: "Orders", icon: <Package size={14} /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition flex-1 justify-center
                ${tab === t.id ? "bg-emerald-500 text-white" : "text-gray-500 hover:text-gray-900"}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Bookings tab */}
        {tab === "bookings" && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={36} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm font-medium text-gray-500">No bookings yet</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">Find a turf and book your first slot</p>
                <Link href="/turfs" className="bg-emerald-500 text-white text-sm px-5 py-2 rounded-lg inline-block hover:bg-emerald-600 transition">
                  Browse turfs
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => {
                  const bookingCanBeCancelled = canCancel(b);
                  const timeLeft = bookingCanBeCancelled ? getTimeLeft(b) : null;
                  return (
                    <div key={b.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-lg">⚽</div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{b.turfs?.name || "Turf"}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <MapPin size={10} /> {b.turfs?.area}
                            <Clock size={10} /> {b.start_time}
                            <span>· {b.booking_date}</span>
                          </div>
                          {bookingCanBeCancelled && timeLeft && (
                            <div className="flex items-center gap-1 mt-1">
                              <AlertCircle size={10} className="text-amber-500" />
                              <span className="text-xs text-amber-500 font-medium">
                                Cancel within {timeLeft}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-emerald-500">
                            ৳{b.total_price?.toLocaleString()}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(b.status)}`}>
                            {b.status}
                          </span>
                        </div>
                        {b.status === "confirmed" && (
                          bookingCanBeCancelled ? (
                            <button
                              onClick={() => cancelBooking(b.id, b.created_at)}
                              disabled={cancellingId === b.id}
                              className="text-xs text-red-400 border border-red-200 px-2 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50 flex items-center gap-1"
                            >
                              {cancellingId === b.id ? (
                                <Loader size={10} className="animate-spin" />
                              ) : (
                                "Cancel"
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300 border border-gray-100 px-2 py-1.5 rounded-lg" title="Cancellation window expired">
                              ⏰ Expired
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Orders tab */}
        {tab === "orders" && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag size={36} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm font-medium text-gray-500">No orders yet</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">Visit the shop to buy sports gear</p>
                <Link href="/shop" className="bg-emerald-500 text-white text-sm px-5 py-2 rounded-lg inline-block hover:bg-emerald-600 transition">
                  Shop now
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">Order #{o.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(o.status)}`}>
                        {o.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mb-2 leading-relaxed">
                      {(o.items || []).map(i => `${i.emoji || "📦"} ${i.name} ×${i.qty}`).join("  ·  ")}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {o.payment_method?.toUpperCase()} · {o.delivery_city}
                      </span>
                      <span className="text-sm font-bold text-emerald-500">
                        ৳{o.total_price?.toLocaleString()}
                      </span>
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