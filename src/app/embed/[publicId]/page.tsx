import { createAnonClient } from "@/lib/supabase/server";
import { EmbedChat } from "@/components/chat/embed-chat";

export const dynamic = "force-dynamic";

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const supabase = createAnonClient();
  const { data } = await supabase.rpc("widget_get_bot", { p_public_id: publicId });

  if (!data) {
    return (
      <div className="flex h-dvh items-center justify-center p-6 text-center text-sm text-muted-foreground">
        This chatbot doesn&apos;t exist or has been removed.
      </div>
    );
  }

  const bot = data as {
    name: string;
    welcome_message: string;
    accent_color: string;
    show_branding: boolean;
  };

  return (
    <EmbedChat
      publicId={publicId}
      name={bot.name}
      welcomeMessage={bot.welcome_message}
      accentColor={bot.accent_color}
      showBranding={bot.show_branding}
    />
  );
}
