"use client";
import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

// Google icon SVG
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState(searchParams.get("tab") === "signup" ? "signup" : "login");
  const [role, setRole] = useState(searchParams.get("role") === "owner" ? "owner" : "player");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(searchParams.get("error") === "oauth_failed" ? "Google sign-in failed. Please try again." : "");
  const [message, setMessage] = useState("");

  // Handle Google sign-in
  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
    // If no error, browser redirects to Google — no need to setLoading(false)
  };

  // Handle Google sign-in as owner
  const handleGoogleOwner = async () => {
    setGoogleLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/owner`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  // Handle email/password
  const handleSubmit = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (mode === "signup" && !name.trim()) { setError("Please enter your name."); return; }

    setLoading(true);
    setError("");

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name, role } },
      });
      if (error) { setError(error.message); setLoading(false); return; }
      if (data.user) {
        await supabase.from("profiles").upsert({ id: data.user.id, full_name: name, role });
      }
      setMessage("✅ Account created! Check your email to confirm, then log in.");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
      const r = profile?.role || "player";
      if (r === "owner") router.push("/owner");
      else if (r === "admin") router.push("/admin");
      else router.push("/dashboard");
    }
    setLoading(false);
  };

  const isOwnerMode = searchParams.get("role") === "owner";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span className="font-bold text-xl text-gray-900">TurfZone</span>
          </div>
          <p className="text-sm text-gray-500">Bangladesh's #1 turf booking platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Title */}
          <h1 className="text-lg font-bold text-gray-900 mb-1">
            {mode === "login" ? "Welcome back 👋" : "Create your account"}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {mode === "login"
              ? "Sign in to book turfs and manage orders"
              : "Join thousands of players on TurfZone"}
          </p>

          {/* ── Google button ─────────────────────────────────────── */}
          <button
            onClick={isOwnerMode ? handleGoogleOwner : handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm border-2 border-gray-200 hover:border-gray-300 rounded-xl py-3 transition disabled:opacity-60 mb-4 shadow-sm"
          >
            {googleLoading
              ? <Loader2 size={18} className="animate-spin text-gray-400" />
              : <GoogleIcon />
            }
            {googleLoading ? "Redirecting..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">or use email</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Role picker (signup only) */}
          {mode === "signup" && (
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-600 block mb-2">I am a</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["player", "⚽ Player", "Book turfs & buy gear"],
                  ["owner",  "🏟️ Turf Owner", "List & manage my turf"],
                ].map(([val, label, desc]) => (
                  <button key={val} onClick={() => setRole(val)}
                    className={`p-3 rounded-xl border-2 text-left transition
                      ${role === val
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-gray-100 hover:border-gray-200 bg-gray-50"}`}>
                    <div className="text-sm font-semibold text-gray-900">{label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fields */}
          <div className="space-y-3">
            {mode === "signup" && (
              <div className="relative">
                <User size={15} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>
            )}
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
              />
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-3 text-gray-400" />
              <input
                type={showPass ? "text" : "password"}
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error / success */}
          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2.5 rounded-xl">
              {error}
            </div>
          )}
          {message && (
            <div className="mt-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3 py-2.5 rounded-xl">
              {message}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm py-3 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Please wait...</>
              : mode === "login" ? "Sign in" : "Create account"}
          </button>

          {/* Toggle mode */}
          <p className="text-xs text-center text-gray-500 mt-4">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }}
              className="text-emerald-600 font-semibold hover:underline"
            >
              {mode === "login" ? "Sign up free" : "Sign in"}
            </button>
          </p>
        </div>

        {/* Owner CTA */}
        {mode === "login" && (
          <div className="mt-4 bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-xs text-gray-500 mb-2">Own a turf? Get bookings & manage slots</p>
            <button
              onClick={handleGoogleOwner}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-60"
            >
              {googleLoading ? <Loader2 size={14} className="animate-spin" /> : <GoogleIcon />}
              Sign in as turf owner
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-5">
          By continuing you agree to our Terms of Service & Privacy Policy
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-emerald-400" />
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}