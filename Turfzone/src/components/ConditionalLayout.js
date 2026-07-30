"use client";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const isSpecial = pathname.startsWith("/admin") || pathname.startsWith("/owner");
  if (isSpecial) return <>{children}</>;

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <footer className="bg-gray-900 text-gray-400 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-white">TurfZone</span>
            </div>
            <p className="text-xs leading-relaxed">Bangladesh's #1 turf booking and sports platform.</p>
          </div>
          {[
            { title: "Platform", links: [["Find Turf", "/turfs"], ["Map View", "/map"], ["Tournaments", "/tournaments"], ["Live Scores", "/scores"]] },
            { title: "Marketplace", links: [["Sports Shop", "/shop"], ["Custom Jersey", "/shop"], ["Equipment", "/shop"]] },
            { title: "Business", links: [["List Your Turf", "/owner/register"], ["Owner Login", "/auth"], ["Admin", "/admin"]] },
          ].map((col) => (
            <div key={col.title}>
              <div className="text-xs font-semibold text-white uppercase tracking-wider mb-4">{col.title}</div>
              {col.links.map(([label, href]) => (
                <a key={label} href={href} className="block text-xs text-gray-400 hover:text-white mb-2 transition">{label}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-gray-800 px-4 py-4 text-center text-xs text-gray-600">
          © 2025 TurfZone Bangladesh · All rights reserved · Dhaka · Chattogram · Sylhet
        </div>
      </footer>
    </>
  );
}