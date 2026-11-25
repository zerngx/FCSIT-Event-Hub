-- Public "Up next" list for the landing page. Published events are public information,
-- so signed-out visitors may see titles, times and seats left (but nothing about who registered).
create function public.public_upcoming_events(p_limit integer default 5)
returns table (event_id uuid, title text, venue text, start_at timestamptz, mode public.event_mode,
               capacity integer, seats_left integer)
language sql stable security definer set search_path = '' as $$
  select e.event_id, e.title::text, e.venue::text, e.start_at, e.mode, e.capacity,
         greatest(e.capacity - (select count(*) from public.registrations r
                                where r.event_id = e.event_id and r.status in ('registered', 'accepted')), 0)::integer
    from public.events e
   where e.status = 'published' and e.end_at > now()
   order by e.start_at
   limit least(greatest(p_limit, 1), 20)
$$;

revoke all on function public.public_upcoming_events(integer) from public;
grant execute on function public.public_upcoming_events(integer) to anon, authenticated;
