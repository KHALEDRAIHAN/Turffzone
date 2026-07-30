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

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      userId, userEmail, userName, userPhone,
      turfId, turfName, turfArea,
      bookingDate, startTime,
      slotPrice, platformFee, finalPrice,
      offerCode, offerDiscount,
    } = body;

    if (!userId || !turfId || !finalPrice) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const tranId = `TZ-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Save pending booking
    const { error: pendingErr } = await supabase.from("pending_bookings").insert({
      id: tranId,
      user_id: userId,
      turf_id: turfId,
      booking_date: bookingDate,
      start_time: startTime,
      slot_price: slotPrice,
      platform_fee: platformFee,
      final_price: finalPrice,
      offer_code: offerCode || null,
      offer_discount: offerDiscount || 0,
    });
    if (pendingErr) throw new Error("Could not save pending booking: " + pendingErr.message);

    // Call SSLCommerz API directly using URLSearchParams
    const params = new URLSearchParams({
      store_id: STORE_ID,
      store_passwd: STORE_PASS,
      total_amount: String(finalPrice),
      currency: "BDT",
      tran_id: tranId,
      success_url: `${appUrl}/api/payment/success`,
      fail_url: `${appUrl}/api/payment/fail`,
      cancel_url: `${appUrl}/api/payment/cancel`,
      ipn_url: `${appUrl}/api/payment/ipn`,
      product_name: `Turf Slot - ${turfName}`,
      product_category: "Sports",
      product_profile: "general",
      cus_name: userName || "Player",
      cus_email: userEmail || "player@turfzone.com",
      cus_add1: turfArea || "Dhaka",
      cus_city: "Dhaka",
      cus_state: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",
      cus_phone: userPhone || "01700000000",
      cus_fax: userPhone || "01700000000",
      ship_name: userName || "Player",
      ship_add1: turfArea || "Dhaka",
      ship_city: "Dhaka",
      ship_state: "Dhaka",
      ship_postcode: "1000",
      ship_country: "Bangladesh",
      shipping_method: "NO",
      num_of_item: "1",
      value_a: userId,
      value_b: String(turfId),
      value_c: startTime,
      value_d: bookingDate,
    });

    const sslRes = await fetch(`${BASE_URL}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!sslRes.ok) {
      throw new Error(`SSLCommerz returned ${sslRes.status}`);
    }

    const sslData = await sslRes.json();

    if (sslData?.GatewayPageURL) {
      return Response.json({ success: true, url: sslData.GatewayPageURL, tranId });
    } else {
      console.error("SSLCommerz response:", sslData);
      throw new Error(sslData?.failedreason || sslData?.status || "No gateway URL returned");
    }
  } catch (err) {
    console.error("Payment initiate error:", err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}