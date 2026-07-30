import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STORE_ID = process.env.SSLCOMMERZ_STORE_ID;
const STORE_PASS = process.env.SSLCOMMERZ_STORE_PASSWORD;
const IS_LIVE = process.env.SSLCOMMERZ_IS_LIVE === "true";
const BASE_URL = IS_LIVE
  ? "https://securepay.sslcommerz.com"
  : "https://sandbox.sslcommerz.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function validatePayment(val_id) {
  const url = `${BASE_URL}/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${STORE_ID}&store_passwd=${STORE_PASS}&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const val_id = formData.get("val_id");
    const tran_id = formData.get("tran_id");
    const status = formData.get("status");
    const card_type = formData.get("card_type") || "Online";

    if (status !== "VALID" && status !== "VALIDATED") {
      return Response.redirect(`${APP_URL}/booking/failed?reason=invalid_status`);
    }

    // Validate with SSLCommerz
    const validation = await validatePayment(val_id);
    if (!validation || (validation.status !== "VALID" && validation.status !== "VALIDATED")) {
      return Response.redirect(`${APP_URL}/booking/failed?reason=validation_failed`);
    }

    // Get pending booking
    const { data: pending } = await supabase
      .from("pending_bookings").select("*").eq("id", tran_id).single();
    if (!pending) {
      return Response.redirect(`${APP_URL}/booking/failed?reason=booking_not_found`);
    }

    // Prevent duplicate
    const { data: dup } = await supabase
      .from("bookings").select("id").eq("transaction_id", tran_id).single();
    if (dup) {
      return Response.redirect(`${APP_URL}/booking/success?id=${dup.id}&tran=${tran_id}`);
    }

    // Check slot not already taken by someone else
    const { data: conflict } = await supabase
      .from("bookings").select("id")
      .eq("turf_id", pending.turf_id)
      .eq("booking_date", pending.booking_date)
      .eq("start_time", pending.start_time)
      .eq("status", "confirmed")
      .eq("payment_status", "paid")
      .single();

    if (conflict) {
      await supabase.from("pending_bookings").delete().eq("id", tran_id);
      return Response.redirect(`${APP_URL}/booking/failed?reason=slot_taken&refund=true`);
    }

    // Create confirmed booking
    const { data: booking, error: bookErr } = await supabase
      .from("bookings").insert({
        user_id: pending.user_id,
        turf_id: pending.turf_id,
        booking_date: pending.booking_date,
        start_time: pending.start_time,
        end_time: pending.start_time,
        duration_hours: 1,
        total_price: pending.final_price,
        platform_fee: pending.platform_fee,
        status: "confirmed",
        payment_status: "paid",
        transaction_id: tran_id,
        val_id,
        payment_method: card_type,
        offer_code: pending.offer_code,
        offer_discount: pending.offer_discount || 0,
        paid_at: new Date().toISOString(),
      }).select().single();

    if (bookErr) throw new Error(bookErr.message);

    // Platform earning
    await supabase.from("platform_earnings").insert({
      booking_id: booking.id,
      type: "booking_fee",
      amount: pending.platform_fee,
    });

    // Clean pending
    await supabase.from("pending_bookings").delete().eq("id", tran_id);

    // Emails (fire and forget)
    try {
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", pending.user_id).single();
      const { data: turf } = await supabase.from("turfs").select("name, area, city, phone, owner_id").eq("id", pending.turf_id).single();
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const userAuth = users?.find(u => u.id === pending.user_id);
      const dateStr = new Date(pending.booking_date).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

      if (userAuth?.email && turf) {
        fetch(`${APP_URL}/api/send-booking`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: userAuth.email, type: "user_confirmation",
            userName: profile?.full_name || "Player",
            turfName: turf.name, turfArea: `${turf.area}, ${turf.city}`,
            turfPhone: turf.phone, date: dateStr, time: pending.start_time,
            duration: 1, originalPrice: pending.slot_price,
            discount: pending.offer_discount || 0, totalPrice: pending.final_price,
            platformFee: pending.platform_fee, bookingId: booking.id,
            transactionId: tran_id, paymentMethod: card_type,
          }),
        }).catch(console.error);

        if (turf.owner_id) {
          fetch(`${APP_URL}/api/send-booking`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: null, type: "owner_notification", ownerId: turf.owner_id,
              playerName: profile?.full_name || "A player", playerEmail: userAuth.email,
              turfName: turf.name, date: dateStr, time: pending.start_time,
              totalPrice: pending.final_price, platformFee: pending.platform_fee,
              ownerEarning: pending.final_price - pending.platform_fee,
              bookingId: booking.id, transactionId: tran_id,
            }),
          }).catch(console.error);
        }
      }
    } catch (emailErr) {
      console.error("Email error (non-fatal):", emailErr.message);
    }

    return Response.redirect(`${APP_URL}/booking/success?id=${booking.id}&tran=${tran_id}`);
  } catch (err) {
    console.error("Payment success error:", err.message);
    return Response.redirect(`${APP_URL}/booking/failed?reason=server_error`);
  }
}