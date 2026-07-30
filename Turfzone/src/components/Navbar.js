"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: p } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
        setRole(p?.role || "player");
      }
    };
    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: p } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
        setRole(p?.role || "player");
      } else {
        setUser(null);
        setRole(null);
      }
    });

    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => { subscription.unsubscribe(); window.removeEventListener("scroll", onScroll); };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setRole(null); setDropOpen(false);
    router.push("/");
  };

  const dashHref = role === "owner" ? "/owner" : role === "admin" ? "/admin" : "/dashboard";
  const dashLabel = role === "owner" ? "Owner Dashboard" : role === "admin" ? "Admin Panel" : "My Dashboard";
  const isActive = (href) => pathname === href;

  const navLinks = [
    { href: "/turfs",       label: "Find Turf" },
    { href: "/map",         label: "Map" },
    { href: "/shop",        label: "Shop" },
    { href: "/tournaments", label: "Tournaments" },
    { href: "/scores",      label: "🔴 Live Scores" },
  ];

  return (
    <nav className={`bg-white sticky top-0 z-50 transition-shadow duration-200 ${scrolled ? "shadow-md" : "border-b border-gray-100"}`}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg shrink-0">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          TurfZone
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}
              className={`text-sm px-3 py-2 rounded-lg font-medium transition
                ${isActive(l.href)
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropOpen(v => !v)}
                className="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-xl transition"
              >
                <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-bold text-emerald-700">
                  {(user.user_metadata?.full_name || user.email || "U")[0].toUpperCase()}
                </div>
                <ChevronDown size={14} className={`transition-transform ${dropOpen ? "rotate-180" : ""}`} />
              </button>

              {dropOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropOpen(false)} />
                  <div className="absolute right-0 top-11 bg-white border border-gray-200 rounded-2xl shadow-lg py-2 w-52 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {user.user_metadata?.full_name || user.email}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link href={dashHref}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                      onClick={() => setDropOpen(false)}>
                      <LayoutDashboard size={14} className="text-emerald-500" />
                      {dashLabel}
                    </Link>
                    {role === "player" && (
                      <Link href="/dashboard/profile"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setDropOpen(false)}>
                        <span className="text-sm">👤</span>
                        Edit Profile
                      </Link>
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full transition">
                        <LogOut size={14} /> Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition">
                Log in
              </Link>
              <Link href="/auth?tab=signup"
                className="text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition">
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
          onClick={() => setMenuOpen(v => !v)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-14 inset-x-0 bg-white border-b border-gray-200 shadow-lg z-50 px-4 py-3 flex flex-col gap-1">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}
              className={`text-sm px-3 py-2.5 rounded-xl font-medium transition
                ${isActive(l.href) ? "bg-emerald-50 text-emerald-600" : "text-gray-700 hover:bg-gray-50"}`}
              onClick={() => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 my-2" />
          {user ? (
            <>
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-gray-900">{user.user_metadata?.full_name || user.email}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <Link href={dashHref}
                className="text-sm text-emerald-600 font-medium px-3 py-2.5 rounded-xl hover:bg-emerald-50 transition"
                onClick={() => setMenuOpen(false)}>
                {dashLabel}
              </Link>
              <button onClick={handleLogout}
                className="text-sm text-red-400 font-medium px-3 py-2.5 rounded-xl hover:bg-red-50 text-left transition">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth"
                className="text-sm text-gray-700 font-medium px-3 py-2.5 rounded-xl hover:bg-gray-50 transition"
                onClick={() => setMenuOpen(false)}>
                Log in
              </Link>
              <Link href="/auth?tab=signup"
                className="text-sm bg-emerald-500 text-white font-semibold px-3 py-2.5 rounded-xl text-center transition"
                onClick={() => setMenuOpen(false)}>
                Sign up free
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}