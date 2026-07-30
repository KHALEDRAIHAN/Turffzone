"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Plus, Tag, Trash2, Check, Loader, X } from "lucide-react";

export default function OwnerOffers() {
  const [offers, setOffers] = useState([]);
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    turf_id: "", code: "", title: "", description: "",
    discount_percent: "", discount_amount: "",
    valid_from: "", valid_until: "", max_uses: "100",
  });
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      const { data: t } = await supabase.from("turfs").select("id, name").eq("owner_id", user.id);
      setTurfs(t || []);
      if (t && t.length > 0) {
        const ids = t.map(x => x.id);
        const { data: o } = await supabase.from("offers").select("*, turfs(name)").in("turf_id", ids).order("created_at", { ascending: false });
        setOffers(o || []);
        if (!form.turf_id && t[0]) setForm(p => ({ ...p, turf_id: t[0].id }));
      }
      setLoading(false);
    };
    load();
  }, []);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.code || !form.title || !form.turf_id) return;
    setSaving(true);
    const { error } = await supabase.from("offers").insert({
      turf_id: form.turf_id,
      code: form.code.toUpperCase().replace(/\s/g, ""),
      title: form.title,
      description: form.description,
      discount_percent: form.discount_percent ? parseInt(form.discount_percent) : null,
      discount_amount: form.discount_amount ? parseInt(form.discount_amount) : null,
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
      max_uses: parseInt(form.max_uses) || 100,
      is_active: true,
    });
    setSaving(false);
    if (!error) {
      setShowForm(false);
      const { data } = await supabase.from("offers").select("*, turfs(name)").in("turf_id", turfs.map(t => t.id));
      setOffers(data || []);
    }
  };

  const toggleOffer = async (id, active) => {
    await supabase.from("offers").update({ is_active: !active }).eq("id", id);
    setOffers(prev => prev.map(o => o.id === id ? { ...o, is_active: !active } : o));
  };

  const deleteOffer = async (id) => {
    if (!confirm("Delete this offer?")) return;
    await supabase.from("offers").delete().eq("id", id);
    setOffers(prev => prev.filter(o => o.id !== id));
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader size={24} className="animate-spin text-emerald-400" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Offers & Discounts</h1>
            <p className="text-sm text-gray-400 mt-1">Create discount codes for your turfs</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-xl font-medium transition">
            <Plus size={15} /> New offer
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
            <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900">Create offer</h2>
                <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Turf</label>
                  <select value={form.turf_id} onChange={(e) => update("turf_id", e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none bg-white">
                    {turfs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Offer code *</label>
                    <input value={form.code} onChange={(e) => update("code", e.target.value.toUpperCase())}
                      placeholder="RAMADAN20" maxLength={20}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 font-mono outline-none focus:border-emerald-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Max uses</label>
                    <input type="number" value={form.max_uses} onChange={(e) => update("max_uses", e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Title *</label>
                  <input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Ramadan Special 20% Off"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Discount %</label>
                    <input type="number" value={form.discount_percent} onChange={(e) => update("discount_percent", e.target.value)}
                      placeholder="20" min="1" max="100"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Or fixed ৳</label>
                    <input type="number" value={form.discount_amount} onChange={(e) => update("discount_amount", e.target.value)}
                      placeholder="500"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Valid from</label>
                    <input type="date" value={form.valid_from} onChange={(e) => update("valid_from", e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none bg-white" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Valid until</label>
                    <input type="date" value={form.valid_until} onChange={(e) => update("valid_until", e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none bg-white" />
                  </div>
                </div>
                <button onClick={handleSave} disabled={!form.code || !form.title || saving}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                  {saving ? <><Loader size={14} className="animate-spin" /> Creating...</> : "Create offer"}
                </button>
              </div>
            </div>
          </div>
        )}

        {offers.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
            <Tag size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="font-semibold text-gray-600 mb-1">No offers yet</p>
            <p className="text-sm text-gray-400 mb-4">Create discount codes to attract more bookings</p>
            <button onClick={() => setShowForm(true)} className="bg-emerald-500 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:bg-emerald-600 transition">
              Create first offer
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map((o) => (
              <div key={o.id} className={`bg-white border rounded-2xl p-4 ${o.is_active ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="bg-emerald-100 text-emerald-700 font-mono font-bold text-sm px-3 py-1.5 rounded-xl">{o.code}</div>
                    <div>
                      <div className="font-semibold text-gray-900">{o.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{o.turfs?.name}</div>
                      <div className="text-xs text-emerald-600 font-medium mt-1">
                        {o.discount_percent ? `${o.discount_percent}% off` : `৳${o.discount_amount?.toLocaleString()} off`}
                        {o.valid_until && ` · Expires ${new Date(o.valid_until).toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{o.used_count}/{o.max_uses} used</span>
                    <button onClick={() => toggleOffer(o.id, o.is_active)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition
                        ${o.is_active ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}>
                      {o.is_active ? "Pause" : "Activate"}
                    </button>
                    <button onClick={() => deleteOffer(o.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}