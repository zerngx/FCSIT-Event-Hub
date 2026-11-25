-- Rotating 30-second QR tickets, check-in validation and the attendance report.
-- The ticket secret never leaves the database: the app asks for a signed token and sends scanned tokens back.
-- Token format:  <ticket_id>.<30-second time step>.<first 16 hex chars of HMAC-SHA256(secret, "ticket_id:step")>

-- Organisers can read (non-secret columns of) tickets for their own events.
create policy tickets_select_organiser on public.tickets for select to authenticated
  using (exists (select 1 from public.registrations r
                 where r.registration_id = tickets.registration_id and (select public.owns_event(r.event_id))));

-- Student: get a fresh token for one of their own tickets.
create function public.issue_qr_token(p_ticket_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_secret text;
  v_epoch numeric := extract(epoch from now());
  v_step bigint := floor(v_epoch / 30);
begin
  select t.secret into v_secret
    from public.tickets t
    join public.registrations r on r.registration_id = t.registration_id
   where t.ticket_id = p_ticket_id and r.student_id = auth.uid()
     and t.status = 'active' and r.status in ('registered', 'accepted');
  if not found then raise exception 'No active ticket'; end if;

  return jsonb_build_object(
    'token', p_ticket_id::text || '.' || v_step::text || '.' ||
             left(encode(extensions.hmac(p_ticket_id::text || ':' || v_step::text, v_secret, 'sha256'), 'hex'), 16),
    'seconds_left', 30 - (v_epoch - v_step * 30)
  );
end $$;

-- Organiser: validate a scanned token and record attendance (once per ticket).
create function public.check_in(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_ticket_id uuid;
  v_step bigint;
  v_sig text;
  v_now_step bigint := floor(extract(epoch from now()) / 30);
  v_ticket public.tickets%rowtype;
  v_reg public.registrations%rowtype;
  v_event public.events%rowtype;
  v_user public.users%rowtype;
  v_first timestamptz;
  v_att_id uuid;
  v_identity jsonb;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;

  begin
    v_ticket_id := split_part(p_token, '.', 1)::uuid;
    v_step := split_part(p_token, '.', 2)::bigint;
    v_sig := split_part(p_token, '.', 3);
  exception when others then
    return jsonb_build_object('ok', false, 'reason', 'invalid_code');
  end;

  select * into v_ticket from public.tickets where ticket_id = v_ticket_id;
  if not found
     or v_sig is distinct from left(encode(extensions.hmac(v_ticket_id::text || ':' || v_step::text, v_ticket.secret, 'sha256'), 'hex'), 16) then
    return jsonb_build_object('ok', false, 'reason', 'invalid_code');
  end if;

  select * into v_reg from public.registrations where registration_id = v_ticket.registration_id;
  select * into v_event from public.events where event_id = v_reg.event_id;
  if v_event.organiser_id <> auth.uid() then
    return jsonb_build_object('ok', false, 'reason', 'wrong_event');
  end if;

  select * into v_user from public.users where user_id = v_reg.student_id;
  v_identity := jsonb_build_object('full_name', v_user.full_name, 'matric_no', v_user.matric_no,
                                   'programme', v_user.programme, 'photo_url', v_user.photo_url,
                                   'event', v_event.title);

  if v_ticket.status = 'used' then
    select checked_in_at into v_first from public.attendance where ticket_id = v_ticket_id;
    return jsonb_build_object('ok', false, 'reason', 'already_checked_in', 'first_at', v_first) || v_identity;
  end if;
  if abs(v_now_step - v_step) > 1 then
    return jsonb_build_object('ok', false, 'reason', 'code_expired') || v_identity;
  end if;
  if v_ticket.status <> 'active' or v_reg.status not in ('registered', 'accepted') then
    return jsonb_build_object('ok', false, 'reason', 'ticket_not_valid') || v_identity;
  end if;
  if (v_event.checkin_open_at is not null and now() < v_event.checkin_open_at)
     or (v_event.checkin_close_at is not null and now() > v_event.checkin_close_at) then
    return jsonb_build_object('ok', false, 'reason', 'outside_window') || v_identity;
  end if;

  insert into public.attendance (ticket_id, scanned_by) values (v_ticket_id, auth.uid())
  on conflict (ticket_id) do nothing returning attendance_id into v_att_id;
  if v_att_id is null then
    select checked_in_at into v_first from public.attendance where ticket_id = v_ticket_id;
    return jsonb_build_object('ok', false, 'reason', 'already_checked_in', 'first_at', v_first) || v_identity;
  end if;

  update public.tickets set status = 'used' where ticket_id = v_ticket_id;
  return jsonb_build_object('ok', true, 'checked_in_at', now()) || v_identity;
end $$;

-- Organiser: registered / attended / absent list for one of their events.
create function public.event_attendance(p_event_id uuid)
returns table (registration_id uuid, full_name text, matric_no text, programme text,
               status public.registration_status, attended boolean, checked_in_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.owns_event(p_event_id) then raise exception 'Not your event'; end if;
  return query
    select r.registration_id, u.full_name::text, u.matric_no::text, u.programme::text, r.status,
           (a.attendance_id is not null), a.checked_in_at
      from public.registrations r
      join public.users u on u.user_id = r.student_id
      left join public.tickets t on t.registration_id = r.registration_id
      left join public.attendance a on a.ticket_id = t.ticket_id
     where r.event_id = p_event_id and r.status <> 'cancelled'
     order by (a.attendance_id is not null) desc, u.full_name;
end $$;

revoke all on function public.issue_qr_token(uuid), public.check_in(text), public.event_attendance(uuid) from public, anon;
grant execute on function public.issue_qr_token(uuid), public.check_in(text), public.event_attendance(uuid) to authenticated;
