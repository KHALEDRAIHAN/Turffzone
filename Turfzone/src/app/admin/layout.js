"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPin, Users, ShoppingBag, Calendar, Package, LogOut, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/"); };

  const links = [
    { href: "/admin", label: "Overview", icon: <LayoutDashboard size={15} /> },
    { href: "/admin#turfs", label: "Turfs", icon: <MapPin size={15} /> },
    { href: "/admin#users", label: "Users", icon: <Users size={15} /> },
    { href: "/admin#bookings", label: "Bookings", icon: <Calendar size={15} /> },
    { href: "/admin#orders", label: "Orders", icon: <ShoppingBag size={15} /> },
    { href: "/admin/products", label: "Products", icon: <Package size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="font-bold text-white">TurfZone</span>
            </Link>
            <span className="bg-red-900 text-red-300 text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider">Admin</span>
          </div>
          <div className="flex items-center gap-0.5">
            {links.map((l) => (
              <Link key={l.href} href={l.href}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition font-medium
                  ${pathname === l.href ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
                {l.icon} {l.label}
              </Link>
            ))}
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 px-3 py-2 transition ml-2">← Site</Link>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/30 px-3 py-2 rounded-lg transition">
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </nav>
      <div className="text-gray-100">{children}</div>
    </div>
  );
}