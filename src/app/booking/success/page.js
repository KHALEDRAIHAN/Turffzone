"use client";
import { useEffect, useState, use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Check, MapPin, Clock, Receipt, Loader } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id");
  const tranId = searchParams.get("tran");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      if (!bookingId) { setLoading(false); return; }
      const { data } = await supabase
        .from("bookings")
        .select("*, turfs(name, area, city, phone)")
        .eq("id", bookingId)
        .single();
      setBooking(data);
      setLoading(false);
    };
    load();
  }, [bookingId]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader size={28} className="animate-spin text-emerald-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full shadow-sm">
        {/* Success icon */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={40} className="text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Booking Confirmed! 🎉</h1>
          <p className="text-sm text-gray-400">Payment successful · Email sent to your inbox</p>
        </div>

        {booking && (
          <div className="bg-gray-50 rounded-2xl p-5 mb-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Turf</span>
              <span className="font-semibold text-gray-900">{booking.turfs?.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Location</span>
              <span className="text-gray-700">{booking.turfs?.area}, {booking.turfs?.city}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="text-gray-700">{booking.booking_date}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Time</span>
              <span className="font-semibold text-gray-900">{booking.start_time}</span>
            </div>
            <div className="border-t border-gray-200 my-1" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Slot price</span>
              <span className="text-gray-700">৳{(booking.total_price + (booking.platform_fee || 0)).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Platform fee</span>
              <span className="text-gray-700">৳{(booking.platform_fee || 0).toLocaleString()}</span>
            </div>
            {booking.offer_discount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-600">Discount</span>
                <span className="text-emerald-600">-৳{booking.offer_discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center justify-between font-bold">
              <span className="text-gray-900">Total paid</span>
              <span className="text-emerald-500 text-lg">৳{booking.total_price?.toLocaleString()}</span>
            </div>
            <div className="border-t border-gray-200 mt-1 pt-3">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Booking ID</span>
                <span className="font-mono">#{booking.id}</span>
              </div>
              {tranId && (
                <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                  <span>Transaction</span>
                  <span className="font-mono">{tranId}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                <span>Payment</span>
                <span className="text-emerald-500 font-medium">✓ Paid via {booking.payment_method || "Online"}</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5">
          <p className="text-xs text-amber-700 font-medium text-center">
            ⚠️ Free cancellation within 5 minutes — check your dashboard
          </p>
        </div>

        <div className="space-y-2">
          <Link href="/dashboard"
            className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-sm font-semibold text-center transition">
            View in dashboard
          </Link>
          <Link href="/turfs"
            className="block w-full border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl text-sm font-medium text-center transition">
            Book another turf
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccess() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader size={28} className="animate-spin text-emerald-400" /></div>}><SuccessContent /></Suspense>;
}