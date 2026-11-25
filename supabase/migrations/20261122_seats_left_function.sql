-- Students cannot read other students' registrations, so expose only the remaining-seat count.
create function public.seats_left(p_event_id uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select greatest(
    e.capacity - (select count(*) from public.registrations r
                  where r.event_id = e.event_id and r.status in ('registered', 'accepted')),
    0)::integer
  from public.events e
  where e.event_id = p_event_id and e.status = 'published'
$$;

revoke all on function public.seats_left(uuid) from public, anon;
grant execute on function public.seats_left(uuid) to authenticated;
