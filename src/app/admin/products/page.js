"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Plus, X, Loader, Check, Trash2, Edit } from "lucide-react";

const CATEGORIES = ["Balls", "Jerseys", "Footwear", "Equipment", "Protection", "Accessories", "Training"];
const SPORTS = ["Football", "Futsal", "Cricket", "Badminton", "All"];
const BADGES = ["", "Best Seller", "Hot", "New", "Sale"];

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: "", description: "", category: "Balls", sport: "Football",
    price: "", old_price: "", stock: "100", emoji: "⚽", badge: "",
  });
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (p?.role !== "admin") { router.push("/"); return; }
      loadProducts();
    };
    check();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);

    let image_url = null;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const filename = `${Date.now()}.${ext}`;
      const { data: upload, error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filename, imageFile, { upsert: true });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(filename);
        image_url = publicUrl;
      }
    }

    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      sport: form.sport,
      price: parseInt(form.price),
      old_price: form.old_price ? parseInt(form.old_price) : null,
      stock: parseInt(form.stock) || 100,
      emoji: form.emoji,
      badge: form.badge || null,
      ...(image_url && { image_url }),
    };

    if (editId) {
      await supabase.from("products").update(payload).eq("id", editId);
    } else {
      await supabase.from("products").insert(payload);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setShowForm(false);
    setEditId(null);
    setImageFile(null);
    setImagePreview(null);
    setForm({ name: "", description: "", category: "Balls", sport: "Football", price: "", old_price: "", stock: "100", emoji: "⚽", badge: "" });
    loadProducts();
  };

  const handleEdit = (p) => {
    setForm({
      name: p.name, description: p.description || "", category: p.category || "Balls",
      sport: p.sport || "Football", price: String(p.price), old_price: p.old_price ? String(p.old_price) : "",
      stock: String(p.stock || 100), emoji: p.emoji || "⚽", badge: p.badge || "",
    });
    setImagePreview(p.image_url);
    setEditId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const toggleActive = async (id, current) => {
    await supabase.from("products").update({ is_active: !current }).eq("id", id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p));
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader size={28} className="animate-spin text-emerald-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Product Management</h1>
            <p className="text-gray-400 text-sm mt-1">{products.length} products · Shop inventory</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditId(null); }}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
            <Plus size={16} /> Add Product
          </button>
        </div>

        {/* Add/Edit form */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowForm(false)} />
            <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">{editId ? "Edit product" : "Add new product"}</h2>
                <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="p-5 space-y-4">
                {/* Image upload */}
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-2">Product image</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-400 transition relative">
                    {imagePreview ? (
                      <div className="relative">
                        <img src={imagePreview} alt="" className="w-full h-40 object-cover rounded-lg" />
                        <button onClick={() => { setImagePreview(null); setImageFile(null); }}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="text-3xl mb-2">{form.emoji}</div>
                        <p className="text-xs text-gray-400">Click to upload image</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>

                {[
                  { label: "Product name *", key: "name", placeholder: "Nike Futsal Ball" },
                  { label: "Description", key: "description", placeholder: "Professional grade futsal ball..." },
                  { label: "Emoji (fallback icon)", key: "emoji", placeholder: "⚽" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-xs font-medium text-gray-700 block mb-1">{f.label}</label>
                    <input value={form[f.key]} onChange={(e) => update(f.key, e.target.value)} placeholder={f.placeholder}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400 transition" />
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Price (৳) *</label>
                    <input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="1850"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Old price (৳)</label>
                    <input type="number" value={form.old_price} onChange={(e) => update("old_price", e.target.value)} placeholder="2200"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Stock</label>
                    <input type="number" value={form.stock} onChange={(e) => update("stock", e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Badge</label>
                    <select value={form.badge} onChange={(e) => update("badge", e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none bg-white">
                      {BADGES.map((b) => <option key={b} value={b}>{b || "None"}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Category</label>
                    <select value={form.category} onChange={(e) => update("category", e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none bg-white">
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Sport</label>
                    <select value={form.sport} onChange={(e) => update("sport", e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none bg-white">
                      {SPORTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <button onClick={handleSave} disabled={!form.name || !form.price || saving}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader size={14} className="animate-spin" /> Saving...</>
                    : saved ? <><Check size={14} /> Saved!</>
                    : editId ? "Update product" : "Add product"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <div key={p.id} className={`bg-gray-900 border rounded-2xl overflow-hidden ${p.is_active ? "border-gray-800" : "border-red-900 opacity-60"}`}>
              <div className="h-40 bg-gray-800 flex items-center justify-center relative">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl">{p.emoji}</span>
                )}
                {p.badge && (
                  <span className="absolute top-2 left-2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">{p.badge}</span>
                )}
                {!p.is_active && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">Hidden</span>
                )}
              </div>
              <div className="p-4">
                <div className="font-medium text-white text-sm mb-1">{p.name}</div>
                <div className="text-xs text-gray-400 mb-2">{p.category} · {p.sport}</div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-emerald-400 font-bold">৳{p.price?.toLocaleString()}</span>
                  {p.old_price && <span className="text-gray-500 text-xs line-through">৳{p.old_price?.toLocaleString()}</span>}
                </div>
                <div className="text-xs text-gray-500 mb-3">Stock: {p.stock}</div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(p)}
                    className="flex-1 flex items-center justify-center gap-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-2 rounded-lg transition">
                    <Edit size={12} /> Edit
                  </button>
                  <button onClick={() => toggleActive(p.id, p.is_active)}
                    className={`flex-1 text-xs py-2 rounded-lg transition ${p.is_active ? "bg-amber-900 text-amber-300 hover:bg-amber-800" : "bg-emerald-900 text-emerald-300 hover:bg-emerald-800"}`}>
                    {p.is_active ? "Hide" : "Show"}
                  </button>
                  <button onClick={() => handleDelete(p.id)}
                    className="w-9 flex items-center justify-center bg-red-900 hover:bg-red-800 text-red-400 rounded-lg transition">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}