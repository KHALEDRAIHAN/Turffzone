export async function sendBookingConfirmation(data) {
  try {
    const res = await fetch("/api/send-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) console.error("Email failed:", result.error);
    return result;
  } catch (err) {
    console.error("sendBookingConfirmation error:", err);
  }
}

export async function sendCancellationEmail(data) {
  try {
    const res = await fetch("/api/send-cancellation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) console.error("Cancellation email failed:", result.error);
    return result;
  } catch (err) {
    console.error("sendCancellationEmail error:", err);
  }
}