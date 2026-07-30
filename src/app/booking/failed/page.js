"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, RefreshCw } from "lucide-react";

const REASONS = {
  payment_failed: { title: "Payment failed", desc: "Your payment could not be processed. No money was charged." },
  cancelled: { title: "Payment cancelled", desc: "You cancelled the payment. Your slot has been released." },
  slot_taken: { title: "Slot no longer available", desc: "Someone else booked this slot while you were paying. Your payment will be refunded within 3–5 business days." },
  validation_failed: { title: "Payment could not be verified", desc: "We could not verify your payment. Please contact support if money was deducted." },
  booking_not_found: { title: "Booking expired", desc: "Your booking session expired. Please try again." },
  server_error: { title: "Something went wrong", desc: "An error occurred on our end. Please try again or contact support." },
  default: { title: "Payment unsuccessful", desc: "Something went wrong with your payment. Please try again." },
};

function FailedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "default";
  const isRefund = searchParams.get("refund") === "true";
  const info = REASONS[reason] || REASONS.default;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full shadow-sm text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle size={40} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{info.title}</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{info.desc}</p>

        {isRefund && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5 text-xs text-blue-700">
            💳 Refund will be processed to your original payment method within 3–5 business days.
          </div>
        )}

        <div className="space-y-2">
          <Link href="/turfs"
            className="flex items-center justify-center gap-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-sm font-semibold transition">
            <RefreshCw size={15} /> Try again
          </Link>
          <Link href="/dashboard"
            className="block w-full border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl text-sm font-medium transition">
            Go to dashboard
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-5">
          Need help? Email us at <a href="mailto:support@turfzone.com" className="text-emerald-500 hover:underline">support@turfzone.com</a>
        </p>
      </div>
    </div>
  );
}

export default function BookingFailed() {
  return <Suspense fallback={null}><FailedContent /></Suspense>;
}