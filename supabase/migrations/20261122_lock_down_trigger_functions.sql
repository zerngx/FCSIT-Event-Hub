-- Trigger functions must never be callable as RPC endpoints.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.guard_user_privileges() from public, anon, authenticated;
