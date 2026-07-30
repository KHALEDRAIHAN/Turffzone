"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Check, MapPin, Phone, User, Loader } from "lucide-react";
import { createClient } from "@/lib/supabase";

const PAYMENT_METHODS = [
  { id: "bkash", label: "bKash", emoji: "📱", desc: "Pay with bKash mobile banking" },
  { id: "nagad", label: "Nagad", emoji: "💳", desc: "Pay with Nagad mobile banking" },
  { id: "cod", label: "Cash on Delivery", emoji: "💵", desc: "Pay when your order arrives" },
];

export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Dhaka");
  const [payment, setPayment] = useState("bkash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState(null);

  // In real app, cart comes from global state/context
  // For now we use a sample cart
  const cart = [
    { id: 1, name: "Nike Futsal Ball", price: 1850, qty: 1, emoji: "⚽" },
    { id: 3, name: "Custom Team Jersey", price: 950, qty: 2, emoji: "👕" },
  ];
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("Please log in to place an order.");
        setLoading(false);
        return;
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          items: cart,
          total_price: cartTotal,
          status: "processing",
          delivery_name: name,
          delivery_phone: phone,
          delivery_address: address,
          delivery_city: city,
          payment_method: payment,
        })
        .select()
        .single();

      if (orderError) throw orderError;
      setOrderId(order.id);
      setStep(3);
    } catch (err) {
      setError(err.message || "Failed to place order. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-10 max-w-sm w-full text-center shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-emerald-500" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Order placed!</h1>
        <p className="text-sm text-gray-400 mb-1">Order #{orderId}</p>
        <p className="text-sm text-gray-400 mb-6">We will contact <span className="font-medium text-gray-700">{phone}</span> to confirm delivery.</p>
        <Link href="/shop" className="block w-full bg-emerald-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-emerald-600 transition mb-2">
          Continue shopping
        </Link>
        <Link href="/dashboard" className="block text-sm text-gray-400 hover:underline">View my orders →</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <Link href="/shop" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6 transition">
          <ChevronLeft size={16} /> Back to shop
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Checkout</h1>

        <div className="flex items-center gap-2 mb-8">
          {["Delivery", "Payment"].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition
                ${step > i + 1 ? "bg-emerald-500 text-white" : step === i + 1 ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                {step > i + 1 ? <Check size={13} /> : i + 1}
              </div>
              <span className={`text-sm ${step === i + 1 ? "text-gray-900 font-medium" : "text-gray-400"}`}>{s}</span>
              {i < 1 && <div className={`flex-1 h-px ${step > 1 ? "bg-emerald-300" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
            <h2 className="font-medium text-gray-900 mb-2">Delivery details</h2>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1"><User size={11} className="inline mr-1" />Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahim Uddin"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 transition" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1"><Phone size={11} className="inline mr-1" />Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 transition" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1"><MapPin size={11} className="inline mr-1" />Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House, road, area..."
                rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 transition resize-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">City</label>
              <select value={city} onChange={(e) => setCity(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 bg-white transition">
                {["Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={() => setStep(2)} disabled={!name || !phone || !address}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-sm font-medium transition disabled:opacity-50">
              Continue to payment
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <h2 className="font-medium text-gray-900 mb-4">Payment method</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((m) => (
                  <button key={m.id} onClick={() => setPayment(m.id)}
                    className={`w-full flex items-center gap-3 p-4 border rounded-xl transition
                      ${payment === m.id ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <span className="text-2xl">{m.emoji}</span>
                    <div className="text-left flex-1">
                      <div className="text-sm font-medium text-gray-900">{m.label}</div>
                      <div className="text-xs text-gray-400">{m.desc}</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${payment === m.id ? "border-emerald-500 bg-emerald-500" : "border-gray-300"}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <h2 className="font-medium text-gray-900 mb-3">Order summary</h2>
              <div className="space-y-2 mb-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-gray-600">
                    <span>{item.emoji} {item.name} × {item.qty}</span>
                    <span>৳{(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span className="text-emerald-500">৳{cartTotal.toLocaleString()}</span>
              </div>
            </div>

            {error && <p className="text-xs text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

            <button onClick={handlePlaceOrder} disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-xl text-sm font-medium transition disabled:opacity-70 flex items-center justify-center gap-2">
              {loading ? <><Loader size={15} className="animate-spin" /> Placing order...</> : `Place order · ৳${cartTotal.toLocaleString()}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}