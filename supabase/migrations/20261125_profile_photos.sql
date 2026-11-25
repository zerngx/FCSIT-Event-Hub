-- Private bucket for profile photos. A student manages only their own folder (<user id>/...).
-- An organiser may read the photos of students registered for their own events, which is what the
-- door scanner shows next to the name so the organiser can compare it with the person in front of them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy profile_photos_owner_all on storage.objects for all to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy profile_photos_organiser_read on storage.objects for select to authenticated
  using (bucket_id = 'profile-photos'
         and exists (select 1 from public.registrations r
                     join public.events e on e.event_id = r.event_id
                     where r.student_id::text = (storage.foldername(name))[1]
                       and e.organiser_id = (select auth.uid())));
