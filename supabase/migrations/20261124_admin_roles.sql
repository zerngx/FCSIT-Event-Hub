-- Admin role management with a restricted audit trail (WP4 section 2.2.2).

create table public.role_audit (
  audit_id    uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (user_id) on delete cascade,
  changed_by  uuid references public.users (user_id) on delete set null,
  old_role    public.user_role not null,
  new_role    public.user_role not null,
  changed_at  timestamptz not null default now()
);
create index on public.role_audit (user_id);
create index on public.role_audit (changed_by);

alter table public.role_audit enable row level security;
create policy role_audit_select_admin on public.role_audit for select to authenticated
  using ((select public.app_role()) = 'admin');
revoke all on public.role_audit from anon;
revoke insert, update, delete on public.role_audit from authenticated;

-- Only admins may call this; an admin cannot change their own role, so the system always keeps an admin.
create function public.admin_set_role(p_user_id uuid, p_role public.user_role) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_old public.user_role;
begin
  if (select role from public.users where user_id = auth.uid()) is distinct from 'admin' then
    raise exception 'Admins only';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot change your own role';
  end if;

  select role into v_old from public.users where user_id = p_user_id for update;
  if not found then raise exception 'Unknown user'; end if;
  if v_old = p_role then return; end if;

  update public.users
     set role = p_role,
         organiser_status = case when p_role = 'organiser' then 'approved'::public.organiser_status
                                 else 'none'::public.organiser_status end,
         approved_by = case when p_role = 'organiser' then auth.uid() else null end
   where user_id = p_user_id;

  insert into public.role_audit (user_id, changed_by, old_role, new_role)
  values (p_user_id, auth.uid(), v_old, p_role);
end $$;

revoke all on function public.admin_set_role(uuid, public.user_role) from public, anon;
grant execute on function public.admin_set_role(uuid, public.user_role) to authenticated;
