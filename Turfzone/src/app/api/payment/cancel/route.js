import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const formData = await request.formData();
  const tran_id = formData.get("tran_id") || "";
  if (tran_id) {
    await supabase.from("pending_bookings").delete().eq("id", tran_id);
  }
  return Response.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/booking/failed?reason=cancelled&tran=${tran_id}`
  );
}