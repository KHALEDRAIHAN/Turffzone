"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Check, Loader, User, Phone, Mail } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUser(user);
      const { data: profile } = await supabase
        .from("profiles").select("*").eq("id", user.id).single();
      setFullName(profile?.full_name || "");
      setPhone(profile?.phone || "");
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!user) return;          // ← guard added
    setSaving(true);
    await supabase.from("profiles")
      .update({ full_name: fullName, phone })
      .eq("id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-8">
        <Link href="/dashboard" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ChevronLeft size={16} /> Back to dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Edit profile</h1>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
          <div className="flex justify-center mb-2">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-3xl font-bold text-emerald-600">
              {fullName?.[0]?.toUpperCase() || "?"}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1"><User size={11} className="inline mr-1" />Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 transition" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1"><Mail size={11} className="inline mr-1" />Email</label>
            <input value={user?.email || ""} disabled
              className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1"><Phone size={11} className="inline mr-1" />Phone number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 transition" />
          </div>

          <button onClick={handleSave} disabled={saving || !user}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-sm font-medium transition disabled:opacity-70 flex items-center justify-center gap-2">
            {saving ? <><Loader size={14} className="animate-spin" /> Saving...</>
              : saved ? <><Check size={14} /> Saved!</>
              : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}