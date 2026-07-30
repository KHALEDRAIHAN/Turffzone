"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Check, Loader } from "lucide-react";

const SPORTS = ["Futsal", "Football", "Cricket", "Badminton"];
const FORMATS = ["5v5", "7v7", "11v11", "Singles", "Doubles", "3v3"];

export default function CreateTournament() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "", sport: "Futsal", format: "5v5", turf: "", area: "", city: "Dhaka",
    startDate: "", endDate: "", deadline: "", maxTeams: "8",
    prize: "", fee: "", description: "", phone: "",
  });

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSuccess(true);
  };

  if (success) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-10 max-w-sm w-full text-center shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-emerald-500" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Tournament created!</h1>
        <p className="text-sm text-gray-400 mb-6">Your tournament will be reviewed and published within a few hours.</p>
        <Link href="/tournaments" className="block w-full bg-emerald-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-emerald-600 transition">
          View tournaments
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-8">
        <Link href="/tournaments" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ChevronLeft size={16} /> Back
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Create tournament</h1>
        <p className="text-sm text-gray-400 mb-8">Organise a tournament at your local turf</p>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
          {[
            { label: "Tournament name", key: "name", placeholder: "Dhaka Futsal Cup 2025" },
            { label: "Turf / Venue", key: "turf", placeholder: "Alpha Sports Arena" },
            { label: "Area", key: "area", placeholder: "Mohammadpur" },
            { label: "Contact phone", key: "phone", placeholder: "01XXXXXXXXX" },
            { label: "Prize pool (৳)", key: "prize", placeholder: "50000" },
            { label: "Entry fee", key: "fee", placeholder: "৳2,000 per team" },
            { label: "Max teams / players", key: "maxTeams", placeholder: "16" },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs font-medium text-gray-500 block mb-1">{f.label}</label>
              <input value={form[f.key]} onChange={(e) => update(f.key, e.target.value)} placeholder={f.placeholder}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 transition" />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Sport</label>
              <select value={form.sport} onChange={(e) => update("sport", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                {SPORTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Format</label>
              <select value={form.format} onChange={(e) => update("format", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">
                {FORMATS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[["Start date", "startDate"], ["End date", "endDate"], ["Deadline", "deadline"]].map(([label, key]) => (
              <div key={key}>
                <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
                <input type="date" value={form[key]} onChange={(e) => update(key, e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 bg-white" />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Description / Rules</label>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)}
              placeholder="Describe the tournament rules, format details, prizes..." rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 resize-none" />
          </div>

          <button onClick={handleSubmit} disabled={!form.name || !form.turf || loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader size={14} className="animate-spin" /> Creating...</> : "Create tournament"}
          </button>
        </div>
      </div>
    </div>
  );
}