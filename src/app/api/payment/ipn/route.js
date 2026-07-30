import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STORE_ID = process.env.SSLCOMMERZ_STORE_ID;
const STORE_PASS = process.env.SSLCOMMERZ_STORE_PASSWORD;
const IS_LIVE = process.env.SSLCOMMERZ_IS_LIVE === "true";
const BASE_URL = IS_LIVE ? "https://securepay.sslcommerz.com" : "https://sandbox.sslcommerz.com";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const val_id = formData.get("val_id");
    const tran_id = formData.get("tran_id");
    const status = formData.get("status");

    if (status !== "VALID" && status !== "VALIDATED") return Response.json({ received: true });

    const { data: existing } = await supabase.from("bookings").select("id").eq("transaction_id", tran_id).single();
    if (existing) return Response.json({ received: true, note: "already_processed" });

    const valRes = await fetch(`${BASE_URL}/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${STORE_ID}&store_passwd=${STORE_PASS}&format=json`);
    const validation = await valRes.json();
    if (validation?.status !== "VALID" && validation?.status !== "VALIDATED") return Response.json({ received: true });

    const { data: pending } = await supabase.from("pending_bookings").select("*").eq("id", tran_id).single();
    if (!pending) return Response.json({ received: true, note: "no_pending" });

    await supabase.from("bookings").insert({
      user_id: pending.user_id, turf_id: pending.turf_id,
      booking_date: pending.booking_date, start_time: pending.start_time,
      end_time: pending.start_time, duration_hours: 1,
      total_price: pending.final_price, platform_fee: pending.platform_fee,
      status: "confirmed", payment_status: "paid",
      transaction_id: tran_id, val_id, payment_method: "online",
      paid_at: new Date().toISOString(),
    });

    await supabase.from("pending_bookings").delete().eq("id", tran_id);
    return Response.json({ received: true });
  } catch (err) {
    console.error("IPN error:", err);
    return Response.json({ received: true });
  }
}