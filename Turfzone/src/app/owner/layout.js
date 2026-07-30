"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, Tag, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function OwnerLayout({ children }) {
  const pathname = usePathname();
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/"); };

  const links = [
    { href: "/owner", label: "Dashboard", icon: <LayoutDashboard size={15} /> },
    { href: "/owner/register", label: "Add Turf", icon: <Plus size={15} /> },
    { href: "/owner/offers", label: "Offers", icon: <Tag size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-gray-900">TurfZone</span>
            </Link>
            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-semibold">Owner</span>
          </div>
          <div className="flex items-center gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href}
                className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition font-medium
                  ${pathname === l.href ? "bg-emerald-500 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                {l.icon} {l.label}
              </Link>
            ))}
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 px-3 py-2 transition">← Browse</Link>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}