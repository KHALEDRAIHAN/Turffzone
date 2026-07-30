"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Check, Loader, X, Upload, Plus } from "lucide-react";
import { Suspense } from "react";

const SPORTS = ["Futsal", "Football", "Cricket", "Badminton", "Basketball", "Volleyball"];
const AMENITIES = ["Parking", "Shower", "WiFi", "Floodlights", "Changing Room", "Cafeteria", "CCTV", "Water"];
const CITIES = ["Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Mymensingh", "Narayanganj", "Gazipur"];

function RegisterTurfForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [form, setForm] = useState({
    name: "", description: "", area: "", city: "Dhaka", address: "",
    price_per_hour: "", weekend_price: "", phone: "",
    open_time: "6:00 AM", close_time: "12:00 AM",
    sports: [], amenities: [],
  });

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth?tab=signup&role=owner");
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role === "player") {
        await supabase.from("profiles").update({ role: "owner" }).eq("id", user.id);
      }
      setAuthLoading(false);
    };
    check();
  }, []);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleArr = (k, v) => setForm(p => ({
    ...p, [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v],
  }));

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 8);
    setImages(files);
    setImagePreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const weekendPrice = form.weekend_price ? parseInt(form.weekend_price) : Math.round(parseInt(form.price_per_hour) * 1.3);

      const { data: turf, error: turfErr } = await supabase.from("turfs").insert({
        owner_id: user.id,
        name: form.name,
        description: form.description,
        area: form.area,
        city: form.city,
        address: form.address,
        price_per_hour: parseInt(form.price_per_hour),
        base_price: parseInt(form.price_per_hour),
        weekend_price: weekendPrice,
        phone: form.phone,
        open_time: form.open_time,
        close_time: form.close_time,
        sports: form.sports,
        amenities: form.amenities,
        is_active: false,
      }).select().single();

      if (turfErr) throw turfErr;

      // Upload images
      if (images.length > 0) {
        setUploadProgress(10);
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const ext = file.name.split(".").pop();
          const filename = `turf-${turf.id}-${Date.now()}-${i}.${ext}`;
          const { error: upErr } = await supabase.storage.from("turf-images").upload(filename, file, { upsert: true });
          if (!upErr) {
            const { data: { publicUrl } } = supabase.storage.from("turf-images").getPublicUrl(filename);
            await supabase.from("turf_images").insert({ turf_id: turf.id, url: publicUrl, is_primary: i === 0 });
            if (i === 0) await supabase.from("turfs").update({ cover_image: publicUrl }).eq("id", turf.id);
          }
          setUploadProgress(Math.round(((i + 1) / images.length) * 90) + 10);
        }
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (authLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader size={24} className="animate-spin text-emerald-400" />
    </div>
  );

  if (success) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-10 max-w-sm w-full text-center shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-emerald-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Turf submitted!</h1>
        <p className="text-sm text-gray-500 mb-6">Our team will review and approve your listing within 24 hours.</p>
        <Link href="/owner" className="block w-full bg-emerald-500 text-white py-3 rounded-xl text-sm font-semibold hover:bg-emerald-600 transition">
          Go to Owner Dashboard
        </Link>
      </div>
    </div>
  );

  const steps = ["Basic Info", "Sports & Amenities", "Pricing & Photos"];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-8">
        <Link href="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ChevronLeft size={16} /> Back to home
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">List your turf</h1>
        <p className="text-sm text-gray-500 mb-8">Free listing · Start getting bookings in 24 hours</p>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition
                ${step > i + 1 ? "bg-emerald-500 text-white" : step === i + 1 ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                {step > i + 1 ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block font-medium ${step === i + 1 ? "text-gray-900" : "text-gray-400"}`}>{s}</span>
              {i < 2 && <div className={`flex-1 h-0.5 ${step > i + 1 ? "bg-emerald-400" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">Basic information</h2>
            {[
              { label: "Turf name *", key: "name", placeholder: "Alpha Sports Arena" },
              { label: "Area / Neighbourhood *", key: "area", placeholder: "Mohammadpur" },
              { label: "Full address *", key: "address", placeholder: "Road 5, Block B, Mohammadpur" },
              { label: "Contact phone *", key: "phone", placeholder: "01XXXXXXXXX" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-gray-700 block mb-1">{f.label}</label>
                <input value={form[f.key]} onChange={(e) => update(f.key, e.target.value)} placeholder={f.placeholder}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-400 transition" />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">City *</label>
              <select value={form.city} onChange={(e) => update("city", e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-400 bg-white">
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => update("description", e.target.value)}
                placeholder="Describe your turf — surface type, size, facilities, what makes it special..."
                rows={3} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-400 transition resize-none" />
            </div>
            <button onClick={() => setStep(2)} disabled={!form.name || !form.area || !form.phone || !form.address}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold transition disabled:opacity-50">
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
            <h2 className="font-bold text-gray-900 text-lg">Sports & amenities</h2>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-2">Sports available *</label>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map((s) => (
                  <button key={s} onClick={() => toggleArr("sports", s)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition
                      ${form.sports.includes(s) ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-2">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((a) => (
                  <button key={a} onClick={() => toggleArr("amenities", a)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition
                      ${form.amenities.includes(a) ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[["Opens at", "open_time", ["5:00 AM","6:00 AM","7:00 AM","8:00 AM"]],
                ["Closes at", "close_time", ["9:00 PM","10:00 PM","11:00 PM","12:00 AM","1:00 AM"]]].map(([label, key, opts]) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">{label}</label>
                  <select value={form[key]} onChange={(e) => update(key, e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none bg-white">
                    {opts.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition">← Back</button>
              <button onClick={() => setStep(3)} disabled={form.sports.length === 0}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold transition disabled:opacity-50">Continue →</button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
            <h2 className="font-bold text-gray-900 text-lg">Pricing & photos</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Weekday price (৳/hr) *</label>
                <input type="number" value={form.price_per_hour} onChange={(e) => update("price_per_hour", e.target.value)}
                  placeholder="2500"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-400 transition" />
                <p className="text-xs text-gray-400 mt-1">Avg: ৳2,000–৳3,500</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Weekend price (৳/hr)</label>
                <input type="number" value={form.weekend_price} onChange={(e) => update("weekend_price", e.target.value)}
                  placeholder={form.price_per_hour ? String(Math.round(parseInt(form.price_per_hour || 0) * 1.3)) : "3250"}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-400 transition" />
                <p className="text-xs text-gray-400 mt-1">Leave blank for auto +30%</p>
              </div>
            </div>

            {/* Image upload */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-2">Turf photos (up to 8)</label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-6 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition">
                <Upload size={24} className="text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Click to upload photos</span>
                <span className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB each · Max 8 photos</span>
                <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
              </label>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden aspect-square">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      {i === 0 && <span className="absolute top-1 left-1 bg-emerald-500 text-white text-xs px-1.5 py-0.5 rounded-full">Cover</span>}
                      <button onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {imagePreviews.length < 8 && (
                    <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 transition">
                      <Plus size={20} className="text-gray-400" />
                      <span className="text-xs text-gray-400 mt-1">Add more</span>
                      <input type="file" accept="image/*" multiple onChange={(e) => {
                        const newFiles = Array.from(e.target.files).slice(0, 8 - images.length);
                        const combined = [...images, ...newFiles].slice(0, 8);
                        setImages(combined);
                        setImagePreviews(combined.map(f => URL.createObjectURL(f)));
                      }} className="hidden" />
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Pricing summary */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs font-bold text-gray-500 uppercase mb-3">Summary</div>
              {[["Turf", form.name || "—"],
                ["Location", form.area ? `${form.area}, ${form.city}` : "—"],
                ["Sports", form.sports.join(", ") || "—"],
                ["Weekday price", form.price_per_hour ? `৳${parseInt(form.price_per_hour).toLocaleString()}/hr` : "—"],
                ["Weekend price", form.price_per_hour ? `৳${(form.weekend_price ? parseInt(form.weekend_price) : Math.round(parseInt(form.price_per_hour) * 1.3)).toLocaleString()}/hr` : "—"],
                ["Photos", `${imagePreviews.length} uploaded`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-gray-500">{k}</span>
                  <span className="text-gray-900 font-medium text-right max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Uploading photos...</span><span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition">← Back</button>
              <button onClick={handleSubmit} disabled={!form.price_per_hour || loading}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader size={14} className="animate-spin" /> Submitting...</> : "Submit listing"}
              </button>
            </div>
            <p className="text-xs text-center text-gray-400">Free to list · Live in 24 hours · 8% platform fee on bookings</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegisterTurfPage() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader size={24} className="animate-spin text-emerald-400" /></div>}><RegisterTurfForm /></Suspense>;
}