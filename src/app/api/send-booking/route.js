import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type === "user_confirmation") {
      const { to, userName, turfName, turfArea, turfPhone, date, time, originalPrice, discount, totalPrice, platformFee, bookingId, isWeekend, isPeak } = body;

      const { error } = await resend.emails.send({
        from: "TurfZone <onboarding@resend.dev>",
        to: [to],
        subject: `✅ Booking Confirmed — ${turfName} at ${time}`,
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:540px;margin:32px auto;background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px;text-align:center;">
              <div style="font-size:28px;margin-bottom:8px;">⚽</div>
              <div style="color:#fff;font-size:22px;font-weight:700;">Booking Confirmed!</div>
              <div style="color:rgba(255,255,255,0.85);font-size:14px;margin-top:4px;">See you on the turf, ${userName}!</div>
            </div>
            <div style="padding:28px;">
              <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:12px;overflow:hidden;margin-bottom:20px;">
                <tr><td colspan="2" style="padding:16px 16px 8px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;">Booking Details</td></tr>
                ${[
                  ["🏟️ Turf", turfName],
                  ["📍 Location", turfArea],
                  ["📞 Contact", turfPhone || "Contact via app"],
                  ["📅 Date", date],
                  ["⏰ Time", time],
                  ["🔖 Booking ID", `#${bookingId}`],
                ].map(([k, v]) => `
                  <tr style="border-top:1px solid #f3f4f6;">
                    <td style="padding:10px 16px;color:#6b7280;font-size:13px;width:40%;">${k}</td>
                    <td style="padding:10px 16px;color:#111827;font-size:13px;font-weight:500;">${v}</td>
                  </tr>
                `).join("")}
              </table>

              <table style="width:100%;border-collapse:collapse;background:#f0fdf4;border-radius:12px;overflow:hidden;margin-bottom:20px;border:1px solid #d1fae5;">
                <tr><td colspan="2" style="padding:16px 16px 8px;font-size:11px;font-weight:700;color:#065f46;text-transform:uppercase;">Payment Summary</td></tr>
                ${originalPrice !== totalPrice ? `<tr style="border-top:1px solid #d1fae5;"><td style="padding:8px 16px;color:#6b7280;font-size:13px;">Slot price</td><td style="padding:8px 16px;font-size:13px;color:#111827;text-align:right;">৳${Number(originalPrice).toLocaleString()}</td></tr>
                <tr style="border-top:1px solid #d1fae5;"><td style="padding:8px 16px;color:#10b981;font-size:13px;">Discount</td><td style="padding:8px 16px;font-size:13px;color:#10b981;text-align:right;">-৳${Number(discount).toLocaleString()}</td></tr>` : ""}
                <tr style="border-top:2px solid #d1fae5;">
                  <td style="padding:12px 16px;color:#111827;font-size:15px;font-weight:700;">Total Paid</td>
                  <td style="padding:12px 16px;color:#10b981;font-size:18px;font-weight:700;text-align:right;">৳${Number(totalPrice).toLocaleString()}</td>
                </tr>
              </table>

              ${isWeekend || isPeak ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#c2410c;">
                💡 ${isPeak ? "Peak hour" : "Weekend"} pricing was applied to this booking.
              </div>` : ""}

              <div style="background:#ecfdf5;border-radius:12px;padding:16px;margin-bottom:20px;">
                <div style="color:#065f46;font-size:13px;font-weight:600;margin-bottom:8px;">📋 Before you arrive</div>
                <ul style="color:#047857;font-size:13px;margin:0;padding-left:18px;line-height:2;">
                  <li>Arrive 10 minutes early</li>
                  <li>Bring your booking ID: <strong>#${bookingId}</strong></li>
                  <li>Wear proper non-marking sports shoes</li>
                  <li>Bring your own water bottle</li>
                </ul>
              </div>

              <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#92400e;">
                ⚠️ <strong>Cancellation Policy:</strong> You may cancel this booking within 5 minutes of confirmation.
              </div>

              <a href="https://turfzone.vercel.app/dashboard" style="display:block;background:#10b981;color:#fff;text-align:center;padding:14px;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;">
                View My Bookings →
              </a>
            </div>
            <div style="border-top:1px solid #f3f4f6;padding:16px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af;">
              TurfZone Bangladesh · Dhaka · Chattogram · Sylhet<br/>
              <a href="https://turfzone.vercel.app" style="color:#10b981;">turfzone.com</a>
            </div>
          </div>
        `,
      });

      if (error) { console.error("User email error:", error); return Response.json({ success: false, error: error.message }, { status: 500 }); }
      return Response.json({ success: true });
    }

    if (type === "owner_notification") {
      const { ownerId, ownerName, playerName, playerEmail, turfName, date, time, totalPrice, platformFee, ownerEarning, bookingId } = body;

      // Get owner email from auth.users via service role
      let ownerEmail = null;
      try {
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const owner = users?.find(u => u.id === ownerId);
        ownerEmail = owner?.email;
      } catch (e) {
        console.error("Could not fetch owner email:", e);
        return Response.json({ success: false, error: "Could not get owner email" });
      }

      if (!ownerEmail) return Response.json({ success: false, error: "Owner email not found" });

      const { error } = await resend.emails.send({
        from: "TurfZone <onboarding@resend.dev>",
        to: [ownerEmail],
        subject: `🎉 New Booking — ${turfName} at ${time}`,
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:540px;margin:32px auto;background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
            <div style="background:#1f2937;padding:28px;text-align:center;">
              <div style="color:#10b981;font-size:24px;font-weight:700;">🎉 New Booking!</div>
              <div style="color:#d1fae5;font-size:14px;margin-top:4px;">Hi ${ownerName}, someone just booked your turf.</div>
            </div>
            <div style="padding:28px;">
              <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:12px;margin-bottom:20px;">
                <tr><td colspan="2" style="padding:16px 16px 8px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;">Booking Details</td></tr>
                ${[
                  ["Player", playerName],
                  ["Player email", playerEmail],
                  ["Turf", turfName],
                  ["Date", date],
                  ["Time", time],
                  ["Booking ID", `#${bookingId}`],
                ].map(([k, v]) => `
                  <tr style="border-top:1px solid #f3f4f6;">
                    <td style="padding:10px 16px;color:#6b7280;font-size:13px;">${k}</td>
                    <td style="padding:10px 16px;color:#111827;font-size:13px;font-weight:500;">${v}</td>
                  </tr>
                `).join("")}
              </table>

              <table style="width:100%;border-collapse:collapse;background:#f0fdf4;border-radius:12px;border:1px solid #d1fae5;margin-bottom:20px;">
                <tr><td colspan="2" style="padding:16px 16px 8px;font-size:11px;font-weight:700;color:#065f46;text-transform:uppercase;">Your Earnings</td></tr>
                <tr style="border-top:1px solid #d1fae5;">
                  <td style="padding:10px 16px;color:#6b7280;font-size:13px;">Booking amount</td>
                  <td style="padding:10px 16px;color:#111827;font-size:13px;font-weight:500;text-align:right;">৳${Number(totalPrice).toLocaleString()}</td>
                </tr>
                <tr style="border-top:1px solid #d1fae5;">
                  <td style="padding:10px 16px;color:#6b7280;font-size:13px;">Platform fee (8%)</td>
                  <td style="padding:10px 16px;color:#ef4444;font-size:13px;text-align:right;">-৳${Number(platformFee).toLocaleString()}</td>
                </tr>
                <tr style="border-top:2px solid #d1fae5;">
                  <td style="padding:12px 16px;color:#111827;font-size:15px;font-weight:700;">Your earning</td>
                  <td style="padding:12px 16px;color:#10b981;font-size:18px;font-weight:700;text-align:right;">৳${Number(ownerEarning).toLocaleString()}</td>
                </tr>
              </table>

              <a href="https://turfzone.vercel.app/owner" style="display:block;background:#1f2937;color:#fff;text-align:center;padding:14px;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;">
                View Dashboard →
              </a>
            </div>
          </div>
        `,
      });

      if (error) { console.error("Owner email error:", error); return Response.json({ success: false, error: error.message }, { status: 500 }); }
      return Response.json({ success: true });
    }

    return Response.json({ success: false, error: "Unknown email type" }, { status: 400 });
  } catch (err) {
    console.error("Email route error:", err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}