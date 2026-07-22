-- Pin search_path on remaining functions
alter function public.plan_limits(text) set search_path = public;
alter function public.touch_updated_at() set search_path = public;
alter function public.auto_confirm_user() set search_path = public;

-- Trigger/internal functions must not be callable through the REST RPC surface
revoke execute on function public.auto_confirm_user() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.enforce_bot_limit() from public, anon, authenticated;
revoke execute on function public.enforce_document_limit() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- widget_get_bot / match_chunks / consume_widget_message / widget_start_conversation /
-- widget_log_message stay executable by anon BY DESIGN: they power the public
-- embeddable widget and are keyed by the bot's unguessable public_id.
