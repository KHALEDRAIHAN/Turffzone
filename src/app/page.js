import Link from "next/link";
import { MapPin, Search, ShoppingBag, ChevronRight, Trophy, Star, Clock } from "lucide-react";
import WorldCupScoreboard from "@/components/WorldCupScoreboard";

const turfs = [
  { id: 1, name: "Alpha Sports Arena", area: "Mohammadpur", price: "2,500", rating: 4.9, slots: 3, color: "bg-emerald-50" },
  { id: 2, name: "NDE Sports Complex", area: "Bashundhara", price: "3,000", rating: 4.7, slots: 1, color: "bg-blue-50" },
  { id: 3, name: "Kick Off FC", area: "Purbachal", price: "2,000", rating: 4.6, slots: 0, color: "bg-amber-50" },
  { id: 4, name: "Champions Arena", area: "Gulshan", price: "3,500", rating: 4.9, slots: 4, color: "bg-purple-50" },
];

const shopItems = [
  { icon: "👕", name: "Custom Jersey", price: "From ৳850" },
  { icon: "⚽", name: "Football", price: "From ৳1,200" },
  { icon: "👟", name: "Futsal Shoes", price: "From ৳2,500" },
  { icon: "🦺", name: "Shin Guards", price: "From ৳350" },
];

const features = [
  { icon: "📅", title: "Instant booking", desc: "Book any slot in under 60 seconds" },
  { icon: "🗺️", title: "Map discovery", desc: "Find turfs closest to you live" },
  { icon: "🏆", title: "Tournaments", desc: "Join or create local leagues" },
  { icon: "🛍️", title: "Gear shop", desc: "Jerseys, balls & equipment" },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-white px-4 pt-16 pb-12 text-center">
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-3 py-1 rounded-full mb-5 font-medium">
          <MapPin size={12} /> Available in Dhaka · Chattogram · Sylhet
        </span>
        <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 leading-tight mb-4">
          Find & Book Turfs<br />
          <span className="text-emerald-500">Near You</span>
        </h1>
        <p className="text-gray-500 text-base max-w-md mx-auto mb-8 leading-relaxed">
          Discover the best futsal, football & cricket turfs. Book slots instantly, buy gear, and join tournaments.
        </p>
        <div className="flex justify-center gap-3 flex-wrap mb-10">
          <Link href="/turfs"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-semibold transition flex items-center gap-2">
            <Search size={16} /> Find a Turf
          </Link>
          <Link href="/shop"
            className="border border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-xl text-sm font-semibold transition flex items-center gap-2">
            <ShoppingBag size={16} /> Shop Gear
          </Link>
        </div>

        {/* Search bar */}
        <div className="max-w-xl mx-auto flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 hover:border-gray-300 transition">
          <MapPin size={18} className="text-emerald-500 shrink-0" />
          <input type="text" placeholder="Search by area — Bashundhara, Mirpur, Mohammadpur..."
            className="bg-transparent text-sm text-gray-700 placeholder-gray-400 flex-1 outline-none" />
          <Link href="/turfs" className="bg-emerald-500 text-white text-sm px-4 py-1.5 rounded-lg shrink-0 hover:bg-emerald-600 transition">
            Search
          </Link>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-3 border-t border-b border-gray-100">
        {[["150+", "Turfs listed"], ["12k+", "Bookings made"], ["4.8★", "Avg rating"]].map(([num, label]) => (
          <div key={label} className="py-5 text-center border-r border-gray-100 last:border-r-0">
            <div className="text-xl font-semibold text-emerald-500">{num}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* ⚽ WORLD CUP SCOREBOARD */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                LIVE
              </span>
              <span className="text-xs text-gray-400 font-medium">Updating every minute</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">FIFA World Cup 2026™</h2>
            <p className="text-sm text-gray-400 mt-0.5">USA · Canada · Mexico · Group Stage</p>
          </div>
          <Link href="/scores"
            className="text-sm text-emerald-500 flex items-center gap-1 hover:underline font-medium">
            Full scoreboard <ChevronRight size={14} />
          </Link>
        </div>
        <WorldCupScoreboard />
      </section>

      {/* Turfs near you */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Turfs near you</h2>
            <p className="text-sm text-gray-400 mt-1">Showing top turfs in Dhaka</p>
          </div>
          <Link href="/turfs" className="text-sm text-emerald-500 flex items-center gap-1 hover:underline font-medium">
            View all <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {turfs.map((turf) => (
            <Link href={`/turfs/${turf.id}`} key={turf.id}
              className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition group bg-white">
              <div className={`${turf.color} h-28 flex items-center justify-center text-5xl relative`}>
                ⚽
                {turf.slots > 0 && (
                  <span className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    {turf.slots} open
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="font-semibold text-gray-900 text-sm group-hover:text-emerald-600 transition">{turf.name}</div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                  <MapPin size={10} /> {turf.area}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-bold text-emerald-500">৳{turf.price}/hr</span>
                  <span className="text-xs text-gray-400 flex items-center gap-0.5">
                    <Star size={10} className="fill-amber-400 text-amber-400" /> {turf.rating}
                  </span>
                </div>
                <div className="mt-2 text-xs">
                  {turf.slots > 0
                    ? <span className="text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>{turf.slots} slots open today</span>
                    : <span className="text-gray-400 flex items-center gap-1"><Clock size={10} /> Check tomorrow</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Why TurfZone?</h2>
          <p className="text-sm text-gray-400 mb-6">Everything a player needs, in one place</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="text-2xl mb-3">{f.icon}</div>
                <div className="text-sm font-semibold text-gray-900 mb-1">{f.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Sports marketplace</h2>
            <p className="text-sm text-gray-400 mt-1">Gear up before your next match</p>
          </div>
          <Link href="/shop" className="text-sm text-emerald-500 flex items-center gap-1 hover:underline font-medium">
            View all <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {shopItems.map((item) => (
            <Link href="/shop" key={item.name}
              className="border border-gray-100 rounded-2xl p-5 text-center hover:shadow-md transition cursor-pointer bg-white group">
              <div className="text-3xl mb-3">{item.icon}</div>
              <div className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition">{item.name}</div>
              <div className="text-xs text-gray-400 mt-1">{item.price}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* List your turf CTA — clicking goes to signup as owner */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="bg-gray-900 rounded-2xl p-10 text-center relative overflow-hidden">
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-5" style={{backgroundImage:"radial-gradient(circle at 20% 50%, #10b981 0%, transparent 50%), radial-gradient(circle at 80% 20%, #10b981 0%, transparent 40%)"}}></div>
          <div className="relative z-10">
            <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full mb-4 font-medium">Free to list</span>
            <h2 className="text-2xl font-semibold text-white mb-2">Own a turf? List it free.</h2>
            <p className="text-sm text-gray-400 mb-3 max-w-md mx-auto leading-relaxed">
              Join 150+ turf owners already on TurfZone. Get bookings, manage slots, track earnings — all in one dashboard.
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-gray-500 mb-7">
              <span className="flex items-center gap-1"><span className="text-emerald-400">✓</span> Free listing</span>
              <span className="flex items-center gap-1"><span className="text-emerald-400">✓</span> Live in 24 hours</span>
              <span className="flex items-center gap-1"><span className="text-emerald-400">✓</span> Booking notifications</span>
            </div>
            {/* This goes to signup with owner role pre-selected */}
            <Link
              href="/auth?tab=signup&role=owner"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-8 py-3.5 rounded-xl transition">
              Register as turf owner <ChevronRight size={16} />
            </Link>
            <p className="text-xs text-gray-600 mt-3">Already have an account? <Link href="/auth?tab=login" className="text-emerald-400 hover:underline">Log in →</Link></p>
          </div>
        </div>
      </section>
    </div>
  );
}