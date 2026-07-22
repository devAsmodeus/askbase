import { NextRequest, NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase/server";

/** Public bot metadata for the widget iframe boot. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  const { publicId } = await params;
  const supabase = createAnonClient();
  const { data } = await supabase.rpc("widget_get_bot", { p_public_id: publicId });
  if (!data) return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  const { name, welcome_message, accent_color, show_branding } = data as {
    name: string;
    welcome_message: string;
    accent_color: string;
    show_branding: boolean;
  };
  return NextResponse.json({ name, welcome_message, accent_color, show_branding });
}
