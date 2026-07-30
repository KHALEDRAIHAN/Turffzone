"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { MapPin, Star, Clock, Wifi, Car, Droplets, ChevronLeft, Loader, Tag, AlertCircle, Phone, CreditCard, Shield, Zap } from "lucide-react";

const PLATFORM_FEE_PCT = 0.08;
const BASE_SLOTS = ["6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM","8:00 PM","9:00 PM","10:00 PM","11:00 PM"];
const PEAK_SLOTS = ["5:00 PM","6:00 PM","7:00 PM","8:00 PM","9:00 PM"];

function isPeak(slot) { return PEAK_SLOTS.includes(slot); }
function isWeekend() { const d = new Date().getDay(); return d === 5 || d === 6; }

export default function TurfDetail({ params }) {
  const { id } = use(params);
  const [turf, setTurf] = useState(null);
  const [images, setImages] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [offerCode, setOfferCode] = useState("");
  const [offerData, setOfferData] = useState(null);
  const [offerError, setOfferError] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: p } = await supabase.from("profiles").select("role, full_name, phone").eq("id", user.id).single();
        setProfile(p);
        setUserRole(p?.role);
      }
      const { data: t } = await supabase.from("turfs").select("*").eq("id", id).single();
      setTurf(t);
      const { data: imgs } = await supabase.from("turf_images").select("*").eq("turf_id", id).order("is_primary", { ascending: false });
      setImages(imgs || []);
      const today = new Date().toISOString().split("T")[0];
      const { data: taken } = await supabase.from("bookings").select("start_time")
        .eq("turf_id", id).eq("booking_date", today).eq("status", "confirmed").eq("payment_status", "paid");
      setBookedSlots((taken || []).map(b => b.start_time));
      setLoading(false);
    };
    load();
  }, [id]);

  const getSlotPrice = (slot) => {
    if (!turf) return 0;
    const base = turf.price_per_hour || 2500;
    const weekend = turf.weekend_price || Math.round(base * 1.3);
    if (isWeekend() && isPeak(slot)) return Math.round(weekend * 1.2);
    if (isWeekend()) return weekend;
    if (isPeak(slot)) return Math.round(base * 1.2);
    return base;
  };

  const slotPrice = selectedSlot ? getSlotPrice(selectedSlot) : 0;
  const discount = offerData?.discount_percent
    ? Math.round(slotPrice * offerData.discount_percent / 100)
    : (offerData?.discount_amount || 0);
  const afterDiscount = Math.max(0, slotPrice - discount);
  const platformFee = Math.round(afterDiscount * PLATFORM_FEE_PCT);
  const finalPrice = afterDiscount;  // platform fee is included, not added on top

  const applyOffer = async () => {
    setOfferError("");
    if (!offerCode.trim()) return;
    const { data, error } = await supabase.from("offers")
      .select("*").eq("code", offerCode.toUpperCase()).eq("is_active", true).single();
    if (error || !data) { setOfferError("Invalid or expired code"); return; }
    if (data.valid_until && new Date(data.valid_until) < new Date()) { setOfferError("This offer has expired"); return; }
    if (data.used_count >= data.max_uses) { setOfferError("Offer usage limit reached"); return; }
    setOfferData(data);
  };

  const handleProceedToPayment = async () => {
    if (!selectedSlot) return;
    if (!user) { setError("Please log in first to book a slot."); return; }
    if (userRole === "owner") { setError("Owners cannot book slots. Use a player account."); return; }

    setPaying(true);
    setError("");

    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          userName: profile?.full_name || "Player",
          userPhone: profile?.phone || "01700000000",
          turfId: turf.id,
          turfName: turf.name,
          turfArea: `${turf.area}, ${turf.city}`,
          bookingDate: today,
          startTime: selectedSlot,
          slotPrice,
          platformFee,
          finalPrice,
          offerCode: offerData?.code || null,
          offerDiscount: discount || 0,
        }),
      });

      const data = await res.json();
      if (data.success && data.url) {
        // Redirect to SSLCommerz payment page
        window.location.href = data.url;
      } else {
        setError(data.error || "Could not initiate payment. Please try again.");
        setPaying(false);
      }
    } catch (err) {
      console.error(err);
      setError("Payment initiation failed. Please try again.");
      setPaying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader size={28} className="animate-spin text-emerald-400" />
    </div>
  );

  if (!turf) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-2">Turf not found</p>
        <Link href="/turfs" className="text-emerald-500 text-sm hover:underline">← Back</Link>
      </div>
    </div>
  );

  const amenityIcon = (a) => ({ WiFi: <Wifi size={13} />, Parking: <Car size={13} />, Shower: <Droplets size={13} /> }[a]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link href="/turfs" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-5 transition">
          <ChevronLeft size={16} /> Back to turfs
        </Link>

        {/* Images */}
        <div className="rounded-2xl overflow-hidden mb-6 bg-emerald-50">
          {images.length > 0 ? (
            <div>
              <img src={images[activeImage]?.url} alt={turf.name} className="w-full h-64 object-cover" />
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {images.map((img, i) => (
                    <button key={img.id} onClick={() => setActiveImage(i)}
                      className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition ${activeImage === i ? "border-emerald-500" : "border-transparent"}`}>
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-7xl">⚽</div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{turf.name}</h1>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1"><MapPin size={13} /> {turf.area}, {turf.city}</div>
                  {turf.phone && <div className="flex items-center gap-1 text-sm text-gray-500 mt-1"><Phone size={13} /> {turf.phone}</div>}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-500">৳{(turf.price_per_hour || 0).toLocaleString()}</div>
                  <div className="text-xs text-gray-400">weekday/hr</div>
                  {turf.weekend_price && <div className="text-sm font-semibold text-orange-500">৳{turf.weekend_price.toLocaleString()} wknd</div>}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <span className="flex items-center gap-1 text-sm text-gray-600"><Star size={13} className="fill-amber-400 text-amber-400" /> {turf.rating || "New"} ({turf.review_count || 0})</span>
                <span className="flex items-center gap-1 text-sm text-gray-400"><Clock size={13} /> {turf.open_time} – {turf.close_time}</span>
              </div>
              {turf.description && <p className="text-sm text-gray-600 mt-4 leading-relaxed">{turf.description}</p>}
              <div className="flex gap-2 flex-wrap mt-4">
                {(turf.sports || []).map(s => <span key={s} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">{s}</span>)}
                {(turf.amenities || []).map(a => (
                  <span key={a} className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-3 py-1 rounded-full">{amenityIcon(a)} {a}</span>
                ))}
              </div>
            </div>

            {/* Pricing table */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Pricing</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["Weekday", `৳${(turf.price_per_hour || 0).toLocaleString()}/hr`, "text-gray-900"],
                  ["Weekend", `৳${(turf.weekend_price || Math.round((turf.price_per_hour || 0) * 1.3)).toLocaleString()}/hr`, "text-orange-500"],
                  ["Peak 5–9 PM", "+20%", "text-red-500"],
                ].map(([l, v, c]) => (
                  <div key={l} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xs text-gray-400 mb-1">{l}</div>
                    <div className={`font-bold text-sm ${c}`}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 bg-blue-50 rounded-xl p-3">
                <Shield size={14} className="text-blue-500 shrink-0" />
                <p className="text-xs text-blue-700">8% platform fee included in price · Secure payment via SSLCommerz</p>
              </div>
            </div>
          </div>

          {/* Booking widget */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 h-fit sticky top-20">
            <h2 className="font-bold text-gray-900 mb-1">Select & pay</h2>
            <p className="text-xs text-gray-400 mb-3">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
              {isWeekend() && <span className="ml-1 text-orange-500 font-medium">· Weekend rates</span>}
            </p>

            {/* Slot grid */}
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 mb-4">
              {BASE_SLOTS.map((slot) => {
                const isBooked = bookedSlots.includes(slot);
                const isSelected = selectedSlot === slot;
                const price = getSlotPrice(slot);
                const peak = isPeak(slot);
                return (
                  <button key={slot} disabled={isBooked} onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-1 rounded-xl text-xs font-medium border transition
                      ${isBooked ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                      : isSelected ? "bg-emerald-500 text-white border-emerald-500"
                      : peak ? "bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-400"
                      : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300"}`}>
                    <div>{slot}</div>
                    <div className={`text-xs mt-0.5 ${isSelected ? "text-emerald-100" : isBooked ? "text-gray-300" : "text-gray-400"}`}>
                      {isBooked ? "Taken" : `৳${price.toLocaleString()}`}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Offer code */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input value={offerCode} onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                  placeholder="Offer code" maxLength={20}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-400" />
                <button onClick={applyOffer} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-2 rounded-xl transition font-medium">Apply</button>
              </div>
              {offerError && <p className="text-xs text-red-500 mt-1">{offerError}</p>}
              {offerData && <p className="text-xs text-emerald-600 mt-1 font-medium">✓ {offerData.title} applied!</p>}
            </div>

            {/* Full price breakdown */}
            {selectedSlot && (
              <div className="mb-4 border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Price breakdown</span>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Slot ({selectedSlot})</span>
                    <span className="text-gray-900">৳{slotPrice.toLocaleString()}</span>
                  </div>
                  {isWeekend() && (
                    <div className="flex justify-between text-xs">
                      <span className="text-orange-500">Weekend rate</span>
                      <span className="text-orange-500">Applied</span>
                    </div>
                  )}
                  {isPeak(selectedSlot) && (
                    <div className="flex justify-between text-xs">
                      <span className="text-red-500">Peak hour +20%</span>
                      <span className="text-red-500">Applied</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600 flex items-center gap-1"><Tag size={11} /> Offer discount</span>
                      <span className="text-emerald-600 font-medium">-৳{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-400 pt-1 border-t border-gray-100">
                    <span className="flex items-center gap-1"><Shield size={10} /> Platform fee (8%)</span>
                    <span>৳{platformFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-200">
                    <span className="text-gray-900">Total</span>
                    <span className="text-emerald-500">৳{finalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment methods badge */}
            {selectedSlot && (
              <div className="mb-4 bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1">
                  <CreditCard size={11} /> Accepted payment methods
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["💳 Visa/MC", "📱 bKash", "📱 Nagad", "🏦 Bank", "📲 Rocket"].map(m => (
                    <span key={m} className="bg-white border border-gray-200 text-xs px-2 py-1 rounded-lg text-gray-600">{m}</span>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mb-3 flex items-start gap-2 bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100">
                <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
              </div>
            )}

            {!user && (
              <div className="mb-3 bg-amber-50 text-amber-700 text-xs p-3 rounded-xl border border-amber-100 text-center">
                <Link href="/auth" className="font-semibold underline">Log in</Link> to book this slot
              </div>
            )}

            {userRole === "owner" && (
              <div className="mb-3 bg-amber-50 text-amber-700 text-xs p-3 rounded-xl border border-amber-100">
                Owners cannot book slots. Use a player account.
              </div>
            )}

            <button
              onClick={handleProceedToPayment}
              disabled={!selectedSlot || paying || !user || userRole === "owner"}
              className={`w-full py-3.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2
                ${selectedSlot && !paying && user && userRole !== "owner"
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
              {paying
                ? <><Loader size={16} className="animate-spin" /> Redirecting to payment...</>
                : selectedSlot
                ? <><Zap size={15} /> Pay ৳{finalPrice.toLocaleString()} securely</>
                : "Select a time slot"}
            </button>

            <div className="flex items-center justify-center gap-1.5 mt-3">
              <Shield size={11} className="text-gray-400" />
              <p className="text-xs text-gray-400">Secured by SSLCommerz · Free cancellation 5 min</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}