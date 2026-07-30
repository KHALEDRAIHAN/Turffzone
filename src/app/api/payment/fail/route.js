export async function POST(request) {
  const formData = await request.formData();
  const tran_id = formData.get("tran_id") || "";
  return Response.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/booking/failed?reason=payment_failed&tran=${tran_id}`
  );
}