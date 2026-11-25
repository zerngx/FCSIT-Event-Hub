-- FCSIT Event Hub System: initial schema (matches diagrams/erd.drawio)
-- Seat control and ticket redemption are enforced in the database so concurrent
-- requests cannot overbook an event or redeem a ticket twice (WP4 section 2.2.2).

-- ---------- Enumerated types ----------
create type public.user_role as enum ('student', 'organiser', 'admin');
create type public.organiser_status as enum ('none', 'pending', 'approved', 'rejected');
create type public.event_mode as enum ('open', 'application');
create type public.event_status as enum ('draft', 'published', 'closed');
create type public.criterion_type as enum ('skill', 'cgpa', 'programme', 'year');
create type public.registration_status as enum ('registered', 'pending', 'accepted', 'waitlisted', 'rejected', 'cancelled');
create type public.screening_outcome as enum ('eligible', 'needs_review', 'not_eligible');
create type public.ticket_status as enum ('active', 'used', 'revoked');

-- ---------- Tables ----------
create table public.users (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  full_name        varchar(100) not null default '',
  email            varchar(120) not null unique,
  matric_no        varchar(12) unique,
  programme        varchar(60),
  year_of_study    smallint check (year_of_study between 1 and 6),
  phone            varchar(20),
  photo_url        text,
  role             public.user_role not null default 'student',
  organiser_status public.organiser_status not null default 'none',
  approved_by      uuid references public.users (user_id) on delete set null,
  created_at       timestamptz not null default now()
);

create table public.events (
  event_id          uuid primary key default gen_random_uuid(),
  organiser_id      uuid not null references public.users (user_id) on delete restrict,
  title             varchar(150) not null,
  description       text not null default '',
  venue             varchar(120),
  start_at          timestamptz not null,
  end_at            timestamptz not null,
  capacity          integer not null check (capacity > 0),
  mode              public.event_mode not null default 'open',
  reg_open_at       timestamptz not null default now(),
  reg_close_at      timestamptz not null,
  cancel_deadline   timestamptz,
  checkin_open_at   timestamptz,
  checkin_close_at  timestamptz,
  status            public.event_status not null default 'draft',
  created_at        timestamptz not null default now(),
  check (end_at > start_at),
  check (reg_close_at > reg_open_at)
);

create table public.screening_criteria (
  criterion_id   uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events (event_id) on delete cascade,
  criterion_type public.criterion_type not null,
  expected_value varchar(100) not null,
  is_required    boolean not null default true
);

create table public.registrations (
  registration_id   uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events (event_id) on delete cascade,
  student_id        uuid not null references public.users (user_id) on delete cascade,
  status            public.registration_status not null,
  waitlist_position integer check (waitlist_position > 0),
  registered_at     timestamptz not null default now(),
  cancelled_at      timestamptz,
  unique (event_id, student_id)
);

create table public.applications (
  application_id    uuid primary key default gen_random_uuid(),
  registration_id   uuid not null unique references public.registrations (registration_id) on delete cascade,
  resume_url        text,
  resume_text       text,
  screening_outcome public.screening_outcome,
  matched_criteria  text[] not null default '{}',
  missing_criteria  text[] not null default '{}',
  decided_at        timestamptz
);

create table public.tickets (
  ticket_id       uuid primary key default gen_random_uuid(),
  registration_id uuid not null unique references public.registrations (registration_id) on delete cascade,
  secret          varchar(64) not null default encode(extensions.gen_random_bytes(32), 'hex'),
  status          public.ticket_status not null default 'active',
  issued_at       timestamptz not null default now()
);

create table public.attendance (
  attendance_id uuid primary key default gen_random_uuid(),
  ticket_id     uuid not null unique references public.tickets (ticket_id) on delete cascade,
  scanned_by    uuid not null references public.users (user_id) on delete restrict,
  checked_in_at timestamptz not null default now()
);

-- Foreign-key indexes (unique constraints already cover registrations.event_id, applications, tickets, attendance.ticket_id)
create index on public.users (approved_by);
create index on public.events (organiser_id);
create index on public.screening_criteria (event_id);
create index on public.registrations (student_id);
create index on public.attendance (scanned_by);

-- ---------- Helper functions ----------
create function public.app_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.users where user_id = auth.uid()
$$;

create function public.is_approved_organiser() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.users
                 where user_id = auth.uid() and role = 'organiser' and organiser_status = 'approved')
$$;

create function public.owns_event(p_event_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.events where event_id = p_event_id and organiser_id = auth.uid())
$$;

-- ---------- Triggers ----------
-- Create a profile row when someone signs up.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users (user_id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only admins may change role, organiser status or approver (stops privilege escalation).
create function public.guard_user_privileges() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null
     and coalesce((select role from public.users where user_id = auth.uid()), 'student') <> 'admin'
     and (new.role is distinct from old.role
          or new.approved_by is distinct from old.approved_by
          or (new.organiser_status is distinct from old.organiser_status
              and not (old.organiser_status in ('none', 'rejected') and new.organiser_status = 'pending'))) then
    raise exception 'Not allowed to change role or organiser approval';
  end if;
  return new;
end $$;

create trigger users_guard_privileges
  before update on public.users
  for each row execute function public.guard_user_privileges();

-- ---------- Atomic registration with seat control and waitlist ----------
create function public.register_for_event(p_event_id uuid) returns public.registration_status
language plpgsql security definer set search_path = '' as $$
declare
  v_event public.events%rowtype;
  v_taken integer;
  v_status public.registration_status;
  v_pos integer;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if (select role from public.users where user_id = auth.uid()) <> 'student' then
    raise exception 'Only students can register';
  end if;

  -- Lock the event row so simultaneous requests are processed one at a time.
  select * into v_event from public.events where event_id = p_event_id for update;
  if not found or v_event.status <> 'published' then raise exception 'Event is not open'; end if;
  if now() < v_event.reg_open_at or now() > v_event.reg_close_at then
    raise exception 'Registration is closed';
  end if;
  if exists (select 1 from public.registrations
             where event_id = p_event_id and student_id = auth.uid() and status <> 'cancelled') then
    raise exception 'Already registered';
  end if;

  if v_event.mode = 'application' then
    v_status := 'pending';
  else
    select count(*) into v_taken from public.registrations
      where event_id = p_event_id and status in ('registered', 'accepted');
    if v_taken < v_event.capacity then
      v_status := 'registered';
    else
      v_status := 'waitlisted';
      select coalesce(max(waitlist_position), 0) + 1 into v_pos from public.registrations
        where event_id = p_event_id and status = 'waitlisted';
    end if;
  end if;

  insert into public.registrations (event_id, student_id, status, waitlist_position)
  values (p_event_id, auth.uid(), v_status, v_pos)
  on conflict (event_id, student_id)
  do update set status = excluded.status, waitlist_position = excluded.waitlist_position,
                registered_at = now(), cancelled_at = null;

  -- Confirmed open-event registrations receive their ticket straight away.
  if v_status = 'registered' then
    insert into public.tickets (registration_id)
    select registration_id from public.registrations
      where event_id = p_event_id and student_id = auth.uid()
    on conflict (registration_id) do update set status = 'active';
  end if;
  return v_status;
end $$;

revoke all on function public.register_for_event(uuid) from public, anon;
grant execute on function public.register_for_event(uuid) to authenticated;
revoke all on function public.app_role(), public.is_approved_organiser(), public.owns_event(uuid) from public, anon;
grant execute on function public.app_role(), public.is_approved_organiser(), public.owns_event(uuid) to authenticated;

-- ---------- Row-level security ----------
alter table public.users              enable row level security;
alter table public.events             enable row level security;
alter table public.screening_criteria enable row level security;
alter table public.registrations      enable row level security;
alter table public.applications       enable row level security;
alter table public.tickets            enable row level security;
alter table public.attendance         enable row level security;

-- users: everyone sees and edits their own profile; admins see all; organisers see participants of their own events.
create policy users_select_self on public.users for select to authenticated
  using (user_id = (select auth.uid()));
create policy users_select_admin on public.users for select to authenticated
  using ((select public.app_role()) = 'admin');
create policy users_select_participants on public.users for select to authenticated
  using (exists (select 1 from public.registrations r
                 join public.events e on e.event_id = r.event_id
                 where r.student_id = users.user_id and e.organiser_id = (select auth.uid())));
create policy users_update_self on public.users for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy users_update_admin on public.users for update to authenticated
  using ((select public.app_role()) = 'admin') with check ((select public.app_role()) = 'admin');

-- events: published events are public to signed-in users; approved organisers manage their own.
create policy events_select on public.events for select to authenticated
  using (status = 'published' or organiser_id = (select auth.uid()) or (select public.app_role()) = 'admin');
create policy events_insert on public.events for insert to authenticated
  with check (organiser_id = (select auth.uid()) and (select public.is_approved_organiser()));
create policy events_update on public.events for update to authenticated
  using (organiser_id = (select auth.uid())) with check (organiser_id = (select auth.uid()));
create policy events_delete on public.events for delete to authenticated
  using (organiser_id = (select auth.uid()) and status = 'draft');

-- screening criteria: organiser of the event only.
create policy criteria_all on public.screening_criteria for all to authenticated
  using ((select public.owns_event(event_id))) with check ((select public.owns_event(event_id)));

-- registrations: students see their own; organisers see and decide for their events. Inserts go through register_for_event().
create policy registrations_select on public.registrations for select to authenticated
  using (student_id = (select auth.uid()) or (select public.owns_event(event_id)));
create policy registrations_update_organiser on public.registrations for update to authenticated
  using ((select public.owns_event(event_id))) with check ((select public.owns_event(event_id)));
create policy registrations_cancel_self on public.registrations for update to authenticated
  using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()) and status = 'cancelled');

-- applications: the applicant and the event's organiser.
create policy applications_select on public.applications for select to authenticated
  using (exists (select 1 from public.registrations r
                 where r.registration_id = applications.registration_id
                   and (r.student_id = (select auth.uid()) or (select public.owns_event(r.event_id)))));
create policy applications_insert on public.applications for insert to authenticated
  with check (exists (select 1 from public.registrations r
                      where r.registration_id = applications.registration_id and r.student_id = (select auth.uid())));
create policy applications_update_organiser on public.applications for update to authenticated
  using (exists (select 1 from public.registrations r
                 where r.registration_id = applications.registration_id and (select public.owns_event(r.event_id))));

-- tickets: students may read their own ticket, but never the secret column. Issuing and redeeming run server-side.
create policy tickets_select_own on public.tickets for select to authenticated
  using (exists (select 1 from public.registrations r
                 where r.registration_id = tickets.registration_id and r.student_id = (select auth.uid())));
revoke all on public.tickets from anon, authenticated;
grant select (ticket_id, registration_id, status, issued_at) on public.tickets to authenticated;

-- attendance: organiser of the event and the attendee can read. Writes come only from the server (service role).
create policy attendance_select on public.attendance for select to authenticated
  using (exists (select 1 from public.tickets t
                 join public.registrations r on r.registration_id = t.registration_id
                 where t.ticket_id = attendance.ticket_id
                   and (r.student_id = (select auth.uid()) or (select public.owns_event(r.event_id)))));
revoke insert, update, delete on public.attendance from anon, authenticated;

-- Nothing in the app is public to anonymous visitors.
revoke all on all tables in schema public from anon;
