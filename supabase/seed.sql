-- Demo data for development and the prototype demonstration. Safe to re-run.
-- The demo organiser has no password, so nobody can sign in as it; it only owns the sample events.
-- Remove with:  delete from auth.users where email = 'demo-organiser@example.test';

insert into auth.users (id, email, raw_user_meta_data)
values ('00000000-0000-4000-8000-000000000001', 'demo-organiser@example.test', '{"full_name":"GDGoC UM (demo)"}')
on conflict (id) do nothing;

update public.users
   set role = 'organiser', organiser_status = 'approved'
 where user_id = '00000000-0000-4000-8000-000000000001';

insert into public.events (event_id, organiser_id, title, description, venue, start_at, end_at, capacity, mode,
                           reg_open_at, reg_close_at, cancel_deadline, checkin_open_at, checkin_close_at, status)
values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-000000000001',
   'Git & GitHub Workflow Mastery',
   E'A beginner-friendly workshop on branching, pull requests and teamwork with Git.\nBring your laptop.',
   'The Cube, Block A, FCSIT', now() + interval '3 days', now() + interval '3 days 2 hours', 3, 'open',
   now() - interval '1 day', now() + interval '2 days', now() + interval '2 days',
   now() + interval '3 days' - interval '30 minutes', now() + interval '3 days 1 hour', 'published'),
  ('00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-000000000001',
   'Hackathon Masterclass and Project Sharing',
   E'Tips for your first hackathon, real past projects and how to pitch to judges.',
   'The Cube, Block A, FCSIT', now() + interval '6 days', now() + interval '6 days 2 hours', 40, 'application',
   now() - interval '1 day', now() + interval '5 days', now() + interval '5 days',
   now() + interval '6 days' - interval '30 minutes', now() + interval '6 days 1 hour', 'published'),
  ('00000000-0000-4000-8000-0000000000a3', '00000000-0000-4000-8000-000000000001',
   'Road to DevFest KL: Vibe into Google AI',
   E'Speaker sessions and hands-on workshops on AI-assisted coding.',
   'Dewan Kuliah 1, FCSIT', now() + interval '10 days', now() + interval '10 days 4 hours', 100, 'open',
   now() - interval '1 day', now() + interval '9 days', now() + interval '9 days',
   now() + interval '10 days' - interval '30 minutes', now() + interval '10 days 2 hours', 'published')
on conflict (event_id) do nothing;
