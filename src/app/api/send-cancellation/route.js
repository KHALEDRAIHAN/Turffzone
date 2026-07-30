import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { userName, userEmail, turfName, date, time, totalPrice, bookingId } = body;

    await resend.emails.send({
      from: "TurfZone <onboarding@resend.dev>",
      to: userEmail,
      subject: `❌ Booking Cancelled — ${turfName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:520px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #f0f0f0;">
            
            <div style="background:#ef4444;padding:32px 32px 24px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                <div style="width:10px;height:10px;border-radius:50%;background:white;opacity:0.9;"></div>
                <span style="color:white;font-weight:600;font-size:16px;">TurfZone</span>
              </div>
              <h1 style="color:white;font-size:22px;font-weight:600;margin:16px 0 4px;">Booking Cancelled</h1>
              <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">Your slot has been released.</p>
            </div>

            <div style="padding:28px 32px;">
              <p style="color:#374151;font-size:15px;margin:0 0 24px;">Hi <strong>${userName}</strong>, your booking has been cancelled.</p>

              <div style="background:#fef2f2;border-radius:12px;padding:20px;margin-bottom:24px;">
                <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:14px;">Cancelled Booking</div>
                ${[
                  ["🏟️ Turf", turfName],
                  ["📅 Date", date],
                  ["⏰ Time", time],
                  ["🔖 Booking ID", `#${bookingId}`],
                  ["💰 Amount", `৳${Number(totalPrice).toLocaleString()}`],
                ].map(([label, value]) => `
                  <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #fee2e2;">
                    <span style="color:#6b7280;font-size:13px;">${label}</span>
                    <span style="color:#111827;font-size:13px;font-weight:500;">${value}</span>
                  </div>
                `).join("")}
              </div>

              <a href="https://turfzone.vercel.app/turfs"
                style="display:block;background:#10b981;color:white;text-align:center;padding:14px;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;">
                Book Another Turf →
              </a>
            </div>

            <div style="border-top:1px solid #f3f4f6;padding:20px 32px;background:#f9fafb;">
              <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">© 2025 TurfZone Bangladesh</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}